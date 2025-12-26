import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../database/entities';

@WebSocketGateway(3002, {
  namespace: '/chat',
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://handwork.com', process.env.ADMIN_URL || 'https://admin.handwork.com']
      : true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private readonly socketToUser = new Map<string, string>(); // socketId -> userId
  private readonly conversationParticipants = new Map<string, Set<string>>(); // conversationId -> Set of socketIds

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Chat client connected: ${client.id}`);
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

    // Remove from conversation participants
    for (const [conversationId, participants] of this.conversationParticipants.entries()) {
      participants.delete(client.id);
      if (participants.size === 0) {
        this.conversationParticipants.delete(conversationId);
      }
    }

    this.logger.log(`Chat client disconnected: ${client.id}`);
  }

  /**
   * User joins the chat system with their ID
   */
  @SubscribeMessage('chat:auth')
  handleAuth(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { userId } = data;
    
    // Track user's socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    this.socketToUser.set(client.id, userId);

    client.join(`user:${userId}`);
    this.logger.log(`User ${userId} authenticated on chat socket ${client.id}`);
    client.emit('chat:authenticated', { success: true, userId });
  }

  /**
   * User joins a conversation room
   */
  @SubscribeMessage('chat:join')
  async handleJoin(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { conversationId } = data;
    const userId = this.socketToUser.get(client.id);

    if (!userId) {
      client.emit('chat:error', { message: 'Not authenticated' });
      return;
    }

    // Verify user is a participant
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation || !conversation.participantIds.includes(userId)) {
      client.emit('chat:error', { message: 'Not authorized to join this conversation' });
      return;
    }

    client.join(`conversation:${conversationId}`);
    
    // Track participants in conversation
    if (!this.conversationParticipants.has(conversationId)) {
      this.conversationParticipants.set(conversationId, new Set());
    }
    this.conversationParticipants.get(conversationId)!.add(client.id);

    this.logger.log(`User ${userId} joined conversation ${conversationId}`);
    client.emit('chat:joined', { conversationId });
  }

  /**
   * User leaves a conversation room
   */
  @SubscribeMessage('chat:leave')
  handleLeave(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { conversationId } = data;
    
    client.leave(`conversation:${conversationId}`);
    
    const participants = this.conversationParticipants.get(conversationId);
    if (participants) {
      participants.delete(client.id);
    }

    this.logger.log(`Client ${client.id} left conversation ${conversationId}`);
    client.emit('chat:left', { conversationId });
  }

  /**
   * User sends typing indicator
   */
  @SubscribeMessage('chat:typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ): void {
    const userId = this.socketToUser.get(client.id);
    if (!userId) return;

    const { conversationId, isTyping } = data;

    // Broadcast to other participants in the conversation
    client.to(`conversation:${conversationId}`).emit('chat:typing', {
      conversationId,
      userId,
      isTyping,
    });
  }

  /**
   * Broadcast a new message to conversation participants
   * Called by ChatService when a message is sent
   */
  broadcastMessage(conversationId: string, message: any): void {
    this.server.to(`conversation:${conversationId}`).emit('chat:message', message);
    this.logger.log(`Broadcasted message ${message.id} to conversation ${conversationId}`);
  }

  /**
   * Notify a specific user about a new message
   */
  notifyUser(userId: string, event: string, data: any): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Broadcast message status update
   */
  broadcastMessageStatus(
    conversationId: string,
    messageId: string,
    status: string,
  ): void {
    this.server.to(`conversation:${conversationId}`).emit('chat:message_status', {
      messageId,
      conversationId,
      status,
    });
  }

  /**
   * Get online status for a user
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Get list of online users from a list
   */
  getOnlineUsers(userIds: string[]): string[] {
    return userIds.filter(userId => this.isUserOnline(userId));
  }
}
