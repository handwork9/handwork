import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { User, Notification, NotificationType as NotificationEntityType } from '../database/entities';
import { NotificationsGateway } from './notifications.gateway';

// Firebase Admin SDK
import * as admin from 'firebase-admin';

// Twilio
import { Twilio } from 'twilio';

// Expo Push Notifications
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

export enum NotificationType {
  ORDER_PLACED = 'order_placed',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_ASSIGNED = 'order_assigned',
  ORDER_PICKED_UP = 'order_picked_up',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  RIDER_OFFER = 'rider_offer',
  RIDER_NEARBY = 'rider_nearby',
  WALLET_TOPUP = 'wallet_topup',
  EARNINGS_RECEIVED = 'earnings_received',
  DELIVERY_EARNINGS = 'delivery_earnings',
  PROMO = 'promo',
  GENERAL = 'general',
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  priority?: 'high' | 'normal';
}

export interface BulkNotificationPayload {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface SmsPayload {
  phoneNumber: string;
  message: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private twilioClient: Twilio;
  private firebaseApp: admin.app.App | null = null;
  private expo: Expo;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private readonly notificationsQueue: Queue,
    private readonly configService: ConfigService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {
    // Initialize Expo SDK
    this.expo = new Expo();
    this.logger.log('Expo push notification SDK initialized');

    // Initialize Twilio
    const twilioAccountSid = this.configService.get('services.twilioAccountSid');
    const twilioAuthToken = this.configService.get('services.twilioAuthToken');

    if (twilioAccountSid && twilioAuthToken) {
      this.twilioClient = new Twilio(twilioAccountSid, twilioAuthToken);
      this.logger.log('Twilio client initialized');
    }

    // Initialize Firebase Admin
    const firebaseCredentials = this.configService.get('services.firebaseCredentials');
    if (firebaseCredentials) {
      try {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(firebaseCredentials)),
        });
        this.logger.log('Firebase Admin initialized');
      } catch (error) {
        this.logger.warn(`Firebase initialization failed: ${error.message}`);
      }
    }
  }

  /**
   * Send push notification to a user and store in database
   */
  async sendPushNotification(payload: NotificationPayload): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    // Store notification in database regardless of push token
    const notificationType = this.mapNotificationType(payload.type);
    const notification = this.notificationRepository.create({
      userId: payload.userId,
      type: notificationType,
      title: payload.title,
      message: payload.body,
      data: payload.data,
      orderId: payload.data?.orderId,
    });
    await this.notificationRepository.save(notification);
    this.logger.log(`Notification stored in database for user ${payload.userId}`);

    // Send via WebSocket (realtime in-app)
    this.notificationsGateway.sendToUser(payload.userId, {
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      notificationId: notification.id,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`WebSocket notification sent to user ${payload.userId}`);

    // Get Expo push tokens from deviceTokens array
    const expoPushTokens = (user?.deviceTokens || []).filter(token => 
      Expo.isExpoPushToken(token)
    );

    // Send via Expo Push Notifications if user has Expo tokens
    if (expoPushTokens.length > 0) {
      try {
        const messages: ExpoPushMessage[] = expoPushTokens.map(token => ({
          to: token,
          sound: 'default',
          title: payload.title,
          body: payload.body,
          data: payload.data,
          priority: payload.priority === 'high' ? 'high' : 'default',
        }));

        const chunks = this.expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          try {
            const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
            this.logger.log(`Expo push notification sent to user ${payload.userId}:`, ticketChunk);
          } catch (error) {
            this.logger.error(`Error sending Expo push chunk: ${error.message}`);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to send Expo push notification: ${error.message}`);
      }
    } else {
      this.logger.debug(`No Expo push tokens for user ${payload.userId}`);
    }

    // Also try FCM if available
    if (user?.fcmToken && this.firebaseApp) {
      try {
        const message: admin.messaging.Message = {
          token: user.fcmToken,
          notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
          },
          data: payload.data
            ? Object.fromEntries(
                Object.entries(payload.data).map(([k, v]) => [k, String(v)]),
              )
            : undefined,
          android: {
            priority: payload.priority === 'high' ? 'high' : 'normal',
            notification: {
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
              channelId: 'handwork_orders',
            },
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title: payload.title,
                  body: payload.body,
                },
                sound: 'default',
                badge: 1,
              },
            },
          },
        };

        await admin.messaging(this.firebaseApp).send(message);
        this.logger.log(`FCM push notification sent to user ${payload.userId}`);
      } catch (error) {
        this.logger.error(
          `Failed to send FCM notification to ${payload.userId}: ${error.message}`,
        );

        // Handle invalid token
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          user.fcmToken = undefined;
          await this.userRepository.save(user);
        }
      }
    }

    return true;
  }

  /**
   * Map NotificationType enum to entity NotificationType
   */
  private mapNotificationType(type: NotificationType): NotificationEntityType {
    if (type.startsWith('order_')) return NotificationEntityType.ORDER;
    if (type.includes('rider') || type.includes('delivery')) return NotificationEntityType.DELIVERY;
    if (type.includes('payment') || type.includes('wallet')) return NotificationEntityType.PAYMENT;
    if (type === 'promo') return NotificationEntityType.PROMOTION;
    return NotificationEntityType.SYSTEM;
  }

  /**
   * Send bulk push notifications
   */
  async sendBulkPushNotification(payload: BulkNotificationPayload): Promise<number> {
    let successCount = 0;

    for (const userId of payload.userIds) {
      const success = await this.sendPushNotification({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });

      if (success) {
        successCount++;
      }
    }

    this.logger.log(
      `Bulk notification sent to ${successCount}/${payload.userIds.length} users`,
    );
    return successCount;
  }

  /**
   * Send SMS notification
   */
  async sendSms(payload: SmsPayload): Promise<boolean> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio client not initialized');
      return false;
    }

    const twilioPhoneNumber = this.configService.get('services.twilioPhoneNumber');

    try {
      await this.twilioClient.messages.create({
        body: payload.message,
        from: twilioPhoneNumber,
        to: payload.phoneNumber,
      });

      this.logger.log(`SMS sent to ${payload.phoneNumber}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${payload.phoneNumber}: ${error.message}`);
      return false;
    }
  }

  /**
   * Queue notification for async processing
   */
  async queueNotification(payload: NotificationPayload): Promise<void> {
    await this.notificationsQueue.add('send-notification', payload, {
      priority: payload.priority === 'high' ? 1 : 10,
    });

    this.logger.debug(`Notification queued for user ${payload.userId}`);
  }

  /**
   * Queue bulk notifications
   */
  async queueBulkNotification(payload: BulkNotificationPayload): Promise<void> {
    await this.notificationsQueue.add('send-bulk-notification', payload, {
      priority: 5,
    });

    this.logger.debug(`Bulk notification queued for ${payload.userIds.length} users`);
  }

  /**
   * Send order notification
   */
  async notifyOrderStatus(
    userId: string,
    orderId: string,
    status: string,
    riderName?: string,
  ): Promise<void> {
    let title: string;
    let body: string;
    let type: NotificationType;

    switch (status) {
      case 'confirmed':
        type = NotificationType.ORDER_CONFIRMED;
        title = 'Order Confirmed';
        body = `Your order #${orderId.slice(-6)} has been confirmed and is being processed.`;
        break;

      case 'assigned':
        type = NotificationType.ORDER_ASSIGNED;
        title = 'Rider Assigned';
        body = `${riderName || 'A rider'} has been assigned to deliver your order.`;
        break;

      case 'picked_up':
        type = NotificationType.ORDER_PICKED_UP;
        title = 'Order Picked Up';
        body = `Your order has been picked up and is on the way!`;
        break;

      case 'in_transit':
        type = NotificationType.RIDER_NEARBY;
        title = 'Rider Nearby';
        body = `Your rider is almost there. Please prepare to receive your order.`;
        break;

      case 'delivered':
        type = NotificationType.ORDER_DELIVERED;
        title = 'Order Delivered';
        body = `Your order has been delivered. Enjoy your purchase!`;
        break;

      case 'cancelled':
        type = NotificationType.ORDER_CANCELLED;
        title = 'Order Cancelled';
        body = `Your order #${orderId.slice(-6)} has been cancelled.`;
        break;

      default:
        type = NotificationType.GENERAL;
        title = 'Order Update';
        body = `Your order status has been updated to ${status}.`;
    }

    await this.queueNotification({
      userId,
      type,
      title,
      body,
      data: { orderId, status },
      priority: 'high',
    });
  }

  /**
   * Notify rider of new order offer
   */
  async notifyRiderOffer(
    riderId: string,
    orderId: string,
    pickupAddress: string,
    deliveryAddress: string,
    eta: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: riderId },
    });

    if (!user) return;

    await this.queueNotification({
      userId: riderId,
      type: NotificationType.RIDER_OFFER,
      title: 'New Delivery Request',
      body: `Pickup: ${pickupAddress}\nDeliver to: ${deliveryAddress}\nETA: ${eta} min`,
      data: { orderId, pickupAddress, deliveryAddress, eta },
      priority: 'high',
    });
  }

  /**
   * Notify farmer of new order
   */
  async notifyFarmerNewOrder(
    farmerId: string,
    orderId: string,
    productName: string,
    quantity: number,
  ): Promise<void> {
    await this.queueNotification({
      userId: farmerId,
      type: NotificationType.ORDER_PLACED,
      title: 'New Order Received',
      body: `You have a new order for ${quantity}x ${productName}`,
      data: { orderId, productName, quantity },
      priority: 'high',
    });
  }

  /**
   * Notify payment received
   */
  async notifyPaymentReceived(
    userId: string,
    amount: number,
    description: string,
  ): Promise<void> {
    await this.queueNotification({
      userId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      body: `₦${amount.toLocaleString()} received. ${description}`,
      data: { amount, description },
    });
  }

  /**
   * Update user's FCM token
   */
  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.userRepository.update(userId, { fcmToken });
    this.logger.debug(`FCM token updated for user ${userId}`);
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    return { notifications, total, unreadCount };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      { userId, read: false },
      { read: true },
    );

    return { updated: result.affected || 0 };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  /**
   * Get notification settings for a user
   */
  async getNotificationSettings(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'pushNotificationsEnabled',
        'orderUpdatesEnabled',
        'deliveryAlertsEnabled',
        'paymentAlertsEnabled',
        'promotionsEnabled',
        'newProductsEnabled',
        'priceDropsEnabled',
        'emailNotificationsEnabled',
        'smsNotificationsEnabled',
        'soundEnabled',
        'vibrationEnabled',
        'badgeEnabled',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      pushNotificationsEnabled: user.pushNotificationsEnabled ?? true,
      orderUpdatesEnabled: user.orderUpdatesEnabled ?? true,
      deliveryAlertsEnabled: user.deliveryAlertsEnabled ?? true,
      paymentAlertsEnabled: user.paymentAlertsEnabled ?? true,
      promotionsEnabled: user.promotionsEnabled ?? false,
      newProductsEnabled: user.newProductsEnabled ?? true,
      priceDropsEnabled: user.priceDropsEnabled ?? true,
      emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
      smsNotificationsEnabled: user.smsNotificationsEnabled ?? false,
      soundEnabled: user.soundEnabled ?? true,
      vibrationEnabled: user.vibrationEnabled ?? true,
      badgeEnabled: user.badgeEnabled ?? true,
    };
  }

  /**
   * Update notification settings for a user
   */
  async updateNotificationSettings(
    userId: string,
    settings: Partial<{
      pushNotificationsEnabled: boolean;
      orderUpdatesEnabled: boolean;
      deliveryAlertsEnabled: boolean;
      paymentAlertsEnabled: boolean;
      promotionsEnabled: boolean;
      newProductsEnabled: boolean;
      priceDropsEnabled: boolean;
      emailNotificationsEnabled: boolean;
      smsNotificationsEnabled: boolean;
      soundEnabled: boolean;
      vibrationEnabled: boolean;
      badgeEnabled: boolean;
    }>,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update only provided settings
    Object.assign(user, settings);
    await this.userRepository.save(user);

    this.logger.log(`Notification settings updated for user ${userId}`);

    return this.getNotificationSettings(userId);
  }
}
