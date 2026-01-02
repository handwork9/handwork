import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SupportTicket } from '../database/entities';

// Use default namespace (no namespace) - namespaces have deployment issues
// All events are already prefixed with 'support:' so no conflicts
@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://handwork.com', process.env.ADMIN_URL || 'https://admin.handwork.com']
      : true,
    credentials: true,
  },
})
export class SupportGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private readonly socketToUser = new Map<string, string>(); // socketId -> userId
  private readonly adminSockets = new Set<string>(); // Set of admin socketIds
  private readonly ticketRooms = new Map<string, Set<string>>(); // ticketId -> Set of socketIds

  afterInit(server: Server): void {
    this.logger.log('Support WebSocket Gateway initialized (default namespace)');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Support client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      const userSocketIds = this.userSockets.get(userId);
      if (userSocketIds) {
        userSocketIds.delete(client.id);
        if (userSocketIds.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.socketToUser.delete(client.id);
    }

    // Remove from admin sockets
    this.adminSockets.delete(client.id);

    // Remove from ticket rooms
    for (const [ticketId, sockets] of this.ticketRooms.entries()) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.ticketRooms.delete(ticketId);
      }
    }

    this.logger.log(`Support client disconnected: ${client.id}`);
  }

  /**
   * User authenticates to support chat
   */
  @SubscribeMessage('support:auth')
  handleAuth(
    @MessageBody() data: { userId: string; isAdmin?: boolean },
    @ConnectedSocket() client: Socket,
  ): void {
    const { userId, isAdmin } = data;
    
    // Track user's socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    this.socketToUser.set(client.id, userId);

    // Track admin sockets
    if (isAdmin) {
      this.adminSockets.add(client.id);
      client.join('admins');
    }

    client.join(`user:${userId}`);
    this.logger.log(`User ${userId} authenticated on support socket ${client.id}${isAdmin ? ' (admin)' : ''}`);
    client.emit('support:authenticated', { success: true, userId });
  }

  /**
   * Admin authenticates to support chat
   */
  @SubscribeMessage('support:admin_auth')
  handleAdminAuth(
    @ConnectedSocket() client: Socket,
  ): void {
    // For now, trust the token verification from connection
    // In production, verify admin role from JWT
    this.adminSockets.add(client.id);
    client.join('admins');
    this.logger.log(`Admin socket ${client.id} authenticated`);
    client.emit('support:authenticated', { success: true, isAdmin: true });
  }

  /**
   * Admin joins a ticket room
   */
  @SubscribeMessage('support:admin_join')
  handleAdminJoin(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { ticketId } = data;
    
    if (!this.adminSockets.has(client.id)) {
      client.emit('support:error', { message: 'Not authenticated as admin' });
      return;
    }

    client.join(`ticket:${ticketId}`);
    
    if (!this.ticketRooms.has(ticketId)) {
      this.ticketRooms.set(ticketId, new Set());
    }
    this.ticketRooms.get(ticketId)!.add(client.id);

    this.logger.log(`Admin ${client.id} joined ticket ${ticketId}`);
    client.emit('support:joined', { ticketId });
  }

  /**
   * Admin sends a message to a ticket (via socket for real-time)
   */
  @SubscribeMessage('support:admin_message')
  handleAdminMessage(
    @MessageBody() data: { ticketId: string; content: string; type?: string },
    @ConnectedSocket() client: Socket,
  ): void {
    // This is handled via HTTP API - this event is for typing/presence
    // Messages are sent via REST API which broadcasts via broadcastMessage
    this.logger.log(`Admin message event received for ticket ${data.ticketId}`);
  }

  /**
   * User joins a ticket room
   */
  @SubscribeMessage('support:join')
  handleJoin(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { ticketId } = data;
    const room = `ticket:${ticketId}`;
    
    client.join(room);
    
    if (!this.ticketRooms.has(ticketId)) {
      this.ticketRooms.set(ticketId, new Set());
    }
    this.ticketRooms.get(ticketId)!.add(client.id);

    this.logger.log(`Client ${client.id} joined ticket ${ticketId}`);
    client.emit('support:joined', { ticketId });
  }

  /**
   * User leaves a ticket room
   */
  @SubscribeMessage('support:leave')
  handleLeave(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { ticketId } = data;
    
    client.leave(`ticket:${ticketId}`);
    
    const sockets = this.ticketRooms.get(ticketId);
    if (sockets) {
      sockets.delete(client.id);
    }

    this.logger.log(`Client ${client.id} left ticket ${ticketId}`);
    client.emit('support:left', { ticketId });
  }

  /**
   * User is typing
   */
  @SubscribeMessage('support:typing')
  handleTyping(
    @MessageBody() data: { ticketId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ): void {
    const userId = this.socketToUser.get(client.id);
    if (!userId) return;

    const { ticketId, isTyping } = data;
    const isAdmin = this.adminSockets.has(client.id);

    // Broadcast to other participants
    client.to(`ticket:${ticketId}`).emit('support:typing', {
      ticketId,
      userId,
      isTyping,
      isAdmin,
    });
  }

  /**
   * Broadcast a new message to ticket participants
   */
  broadcastMessage(ticketId: string, message: any): void {
    const room = `ticket:${ticketId}`;
    this.logger.log(`Broadcasting message to room ${room}`);
    this.server.to(room).emit('support:message', {
      ticketId,
      message,
    });
    this.logger.log(`Broadcasted message to ticket ${ticketId}`);
  }

  /**
   * Notify admins about a new ticket
   */
  notifyNewTicket(ticket: SupportTicket): void {
    this.server.to('admins').emit('support:new_ticket', {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
    this.logger.log(`Notified admins about new ticket ${ticket.ticketNumber}`);
  }

  /**
   * Send message to a specific ticket room
   */
  sendMessageToTicket(ticketId: string, message: any): void {
    this.server.to(`ticket:${ticketId}`).emit('support:message', {
      ticketId,
      message,
    });
    // Also notify admins
    this.server.to('admins').emit('support:message', {
      ticketId,
      message,
    });
    this.logger.log(`Message sent to ticket ${ticketId}`);
  }

  /**
   * Notify user that ticket is assigned
   */
  notifyTicketAssigned(ticket: SupportTicket, adminId: string): void {
    this.server.to(`user:${ticket.userId}`).emit('support:ticket_assigned', {
      ticketId: ticket.id,
      adminId,
    });
  }

  /**
   * Notify user about ticket status change
   */
  notifyTicketStatusChange(ticket: SupportTicket): void {
    this.server.to(`ticket:${ticket.id}`).emit('support:status_changed', {
      ticketId: ticket.id,
      status: ticket.status,
    });
  }

  /**
   * Get online admin count
   */
  getOnlineAdminCount(): number {
    return this.adminSockets.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}
