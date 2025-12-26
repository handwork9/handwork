import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { Dispute, DisputeMessage } from '../database/entities';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  isAdmin?: boolean;
}

@Injectable()
@WebSocketGateway(3003, {
  namespace: '/disputes',
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://handwork.com', process.env.ADMIN_URL || 'https://admin.handwork.com']
      : true,
    credentials: true,
  },
})
export class DisputeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DisputeGateway.name);
  private connectedUsers: Map<string, Set<string>> = new Map(); // disputeId -> Set<socketId>
  private adminSockets: Set<string> = new Set();
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private readonly socketToUser = new Map<string, string>(); // socketId -> userId

  constructor(
    @Inject(forwardRef(() => DisputeService))
    private disputeService: DisputeService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Dispute client connected: ${client.id}`);
  }

  /**
   * User authenticates to dispute chat
   */
  @SubscribeMessage('dispute:auth')
  handleAuth(
    @MessageBody() data: { userId: string; isAdmin?: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    const { userId, isAdmin } = data;
    
    client.userId = userId;
    client.isAdmin = isAdmin || false;

    // Track user's socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    this.socketToUser.set(client.id, userId);

    // Track admin sockets
    if (isAdmin) {
      this.adminSockets.add(client.id);
      client.join('admin_disputes');
    }

    client.join(`user:${userId}`);
    this.logger.log(`User ${userId} authenticated on dispute socket ${client.id}${isAdmin ? ' (admin)' : ''}`);
    client.emit('dispute:authenticated', { success: true, userId });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Dispute client disconnected: ${client.id}`);
    
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
    
    // Remove from all dispute rooms
    this.connectedUsers.forEach((sockets, disputeId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.connectedUsers.delete(disputeId);
      }
    });

    this.adminSockets.delete(client.id);
  }

  @SubscribeMessage('join_dispute')
  async handleJoinDispute(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { disputeId: string },
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated. Please send dispute:auth first.' });
        return;
      }

      const dispute = await this.disputeService.getDisputeById(data.disputeId);
      
      // Verify user has access
      if (!client.isAdmin && dispute.userId !== client.userId) {
        client.emit('error', { message: 'Access denied' });
        return;
      }

      const room = `dispute_${data.disputeId}`;
      client.join(room);

      if (!this.connectedUsers.has(data.disputeId)) {
        this.connectedUsers.set(data.disputeId, new Set());
      }
      this.connectedUsers.get(data.disputeId)!.add(client.id);

      client.emit('joined_dispute', { disputeId: data.disputeId, dispute });
      this.logger.log(`User ${client.userId} joined dispute ${data.disputeId}`);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave_dispute')
  handleLeaveDispute(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { disputeId: string },
  ) {
    const room = `dispute_${data.disputeId}`;
    client.leave(room);
    
    this.connectedUsers.get(data.disputeId)?.delete(client.id);
    this.logger.log(`User ${client.userId} left dispute ${data.disputeId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { disputeId: string; content: string; attachments?: string[] } | string,
  ): Promise<{ success: boolean; message?: DisputeMessage; error?: string }> {
    try {
      this.logger.log(`send_message raw data type: ${typeof data}`);
      this.logger.log(`send_message raw data: ${JSON.stringify(data)}`);
      
      // Parse data if it's a string (some clients send stringified JSON)
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
          this.logger.log(`Parsed string data: ${JSON.stringify(parsedData)}`);
        } catch (e) {
          this.logger.error(`Failed to parse data string: ${data}`);
        }
      }
      
      const messageData = parsedData as { disputeId: string; content: string; attachments?: string[] };
      this.logger.log(`send_message messageData: ${JSON.stringify(messageData)}`);
      this.logger.log(`send_message disputeId value: "${messageData?.disputeId}" (type: ${typeof messageData?.disputeId})`);
      
      if (!client.userId) {
        this.logger.error('Not authenticated');
        return { success: false, error: 'Not authenticated. Please send dispute:auth first.' };
      }

      if (!messageData || !messageData.disputeId) {
        this.logger.error(`Invalid data received: disputeId is missing. Data: ${JSON.stringify(messageData)}`);
        return { success: false, error: 'disputeId is required' };
      }
      
      // Additional check for null-like values
      if (messageData.disputeId === 'null' || messageData.disputeId === 'undefined' || messageData.disputeId === '') {
        this.logger.error(`Invalid disputeId value: "${messageData.disputeId}"`);
        return { success: false, error: 'Invalid disputeId value' };
      }

      const senderType = client.isAdmin ? 'admin' : 'user';
      this.logger.log(`Calling sendMessage with disputeId: ${messageData.disputeId}, senderId: ${client.userId}`);
      
      const message = await this.disputeService.sendMessage(
        messageData.disputeId,
        client.userId,
        { content: messageData.content, attachments: messageData.attachments },
        senderType,
      );

      this.logger.log(`Message sent successfully: ${message.id}`);
      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { disputeId: string; isTyping: boolean },
  ) {
    const room = `dispute_${data.disputeId}`;
    client.to(room).emit('user_typing', {
      disputeId: data.disputeId,
      userId: client.userId,
      isTyping: data.isTyping,
      isAdmin: client.isAdmin,
    });
  }

  /**
   * Emit new message to dispute room
   */
  emitMessage(message: DisputeMessage) {
    const room = `dispute_${message.disputeId}`;
    this.server.to(room).emit('new_message', message);
  }

  /**
   * Notify admins of new dispute
   */
  notifyNewDispute(dispute: Dispute) {
    this.server.to('admin_disputes').emit('new_dispute', dispute);
  }

  /**
   * Notify dispute status change
   */
  notifyStatusChange(dispute: Dispute) {
    const room = `dispute_${dispute.id}`;
    this.server.to(room).emit('status_changed', {
      disputeId: dispute.id,
      status: dispute.status,
      resolution: dispute.resolution,
    });
  }
}
