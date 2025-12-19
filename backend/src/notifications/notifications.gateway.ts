import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway(3003, {
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  handleConnection(client: Socket): void {
    this.logger.log(`Notification client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    // Remove socket from all user mappings
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        this.logger.log(`User ${userId} disconnected socket ${client.id}`);
        break;
      }
    }
  }

  /**
   * User joins notification channel
   */
  @SubscribeMessage('user:join')
  handleUserJoin(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { userId } = data;

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    client.join(`user:${userId}`);
    this.logger.log(`User ${userId} joined notification channel`);

    client.emit('notifications:joined', { success: true, userId });
  }

  /**
   * User leaves notification channel
   */
  @SubscribeMessage('user:leave')
  handleUserLeave(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { userId } = data;

    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    client.leave(`user:${userId}`);
    this.logger.log(`User ${userId} left notification channel`);
  }

  /**
   * Mark notification as read
   */
  @SubscribeMessage('notification:read')
  handleNotificationRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Notification ${data.notificationId} marked as read`);
    // Could store in DB or Redis for persistence
    client.emit('notification:marked_read', { notificationId: data.notificationId });
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, notification: Record<string, any>): void {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
    this.logger.log(`Sent notification to user ${userId}`);
  }

  /**
   * Send notification to multiple users
   */
  sendToUsers(userIds: string[], notification: Record<string, any>): void {
    for (const userId of userIds) {
      this.sendToUser(userId, notification);
    }
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(notification: Record<string, any>): void {
    this.server.emit('notification:broadcast', notification);
    this.logger.log(`Broadcast notification to all users`);
  }

  /**
   * Send notification to admin room (all admin users)
   */
  sendToAdmins(notification: Record<string, any>): void {
    this.server.to('admin:room').emit('admin:notification', notification);
    this.logger.log(`Sent notification to admin room`);
  }

  /**
   * Admin joins admin room for admin-specific notifications
   */
  @SubscribeMessage('admin:join')
  handleAdminJoin(
    @ConnectedSocket() client: Socket,
  ): void {
    client.join('admin:room');
    this.logger.log(`Admin socket ${client.id} joined admin room`);
    client.emit('admin:joined', { success: true });
  }

  /**
   * Get count of online users
   */
  getOnlineUserCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Get online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
