import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationsService, NotificationType } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

export interface NotificationSettings {
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
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('fcm-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update FCM token for push notifications' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['fcmToken'],
      properties: {
        fcmToken: { type: 'string', example: 'firebase-fcm-token-here' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'FCM token updated',
  })
  async updateFcmToken(
    @CurrentUser() user: any,
    @Body() body: { fcmToken: string },
  ): Promise<{ message: string }> {
    await this.notificationsService.updateFcmToken(user.id, body.fcmToken);
    return { message: 'FCM token updated successfully' };
  }

  @Post('send')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send notification to a user (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'title', 'body'],
      properties: {
        userId: { type: 'string', example: 'user-uuid' },
        title: { type: 'string', example: 'Important Update' },
        body: { type: 'string', example: 'Your account has been verified.' },
        type: {
          type: 'string',
          enum: Object.values(NotificationType),
          example: 'general',
        },
        imageUrl: { type: 'string', example: '/uploads/notifications/promo.jpg', nullable: true },
        data: { type: 'object', example: { key: 'value' } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notification sent',
  })
  async sendNotification(
    @Body()
    body: {
      userId: string;
      title: string;
      body: string;
      type?: NotificationType;
      imageUrl?: string;
      data?: Record<string, any>;
    },
  ): Promise<{ message: string; success: boolean }> {
    const success = await this.notificationsService.sendPushNotification({
      userId: body.userId,
      type: body.type || NotificationType.GENERAL,
      title: body.title,
      body: body.body,
      imageUrl: body.imageUrl,
      data: {
        ...body.data,
        imageUrl: body.imageUrl || null,
      },
    });

    return {
      message: success ? 'Notification sent' : 'Failed to send notification',
      success,
    };
  }

  @Post('send-bulk')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send notification to multiple users (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userIds', 'title', 'body'],
      properties: {
        userIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['user-uuid-1', 'user-uuid-2'],
        },
        title: { type: 'string', example: 'Promotion Alert' },
        body: { type: 'string', example: '50% off all products today!' },
        type: {
          type: 'string',
          enum: Object.values(NotificationType),
          example: 'promo',
        },
        data: { type: 'object', example: { promoCode: 'SAVE50' } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk notification sent',
  })
  async sendBulkNotification(
    @Body()
    body: {
      userIds: string[];
      title: string;
      body: string;
      type?: NotificationType;
      data?: Record<string, any>;
    },
  ): Promise<{ message: string; successCount: number }> {
    const successCount = await this.notificationsService.sendBulkPushNotification({
      userIds: body.userIds,
      type: body.type || NotificationType.GENERAL,
      title: body.title,
      body: body.body,
      data: body.data,
    });

    return {
      message: `Notification sent to ${successCount}/${body.userIds.length} users`,
      successCount,
    };
  }

  @Post('send-sms')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send SMS notification (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['phoneNumber', 'message'],
      properties: {
        phoneNumber: { type: 'string', example: '+2348012345678' },
        message: { type: 'string', example: 'Your OTP is 123456' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'SMS sent',
  })
  async sendSms(
    @Body() body: { phoneNumber: string; message: string },
  ): Promise<{ message: string; success: boolean }> {
    const success = await this.notificationsService.sendSms(body);

    return {
      message: success ? 'SMS sent' : 'Failed to send SMS',
      success,
    };
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send test notification to current user' })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent',
  })
  async sendTestNotification(
    @CurrentUser() user: any,
  ): Promise<{ message: string; success: boolean }> {
    const success = await this.notificationsService.sendPushNotification({
      userId: user.id,
      type: NotificationType.GENERAL,
      title: 'Test Notification',
      body: 'This is a test notification from Handwork.',
      data: { test: true },
    });

    return {
      message: success
        ? 'Test notification sent'
        : 'No FCM token registered or notification failed',
      success,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({
    status: 200,
    description: 'User notifications retrieved',
  })
  async getMyNotifications(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getUserNotifications(
      user.id,
      page || 1,
      limit || 20,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved',
  })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted',
  })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.notificationsService.deleteNotification(id, user.id);
    return { message: 'Notification deleted' };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get notification settings for current user' })
  @ApiResponse({
    status: 200,
    description: 'Notification settings retrieved',
  })
  async getNotificationSettings(@CurrentUser() user: any): Promise<NotificationSettings> {
    return this.notificationsService.getNotificationSettings(user.id);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update notification settings for current user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pushNotificationsEnabled: { type: 'boolean' },
        orderUpdatesEnabled: { type: 'boolean' },
        deliveryAlertsEnabled: { type: 'boolean' },
        paymentAlertsEnabled: { type: 'boolean' },
        promotionsEnabled: { type: 'boolean' },
        newProductsEnabled: { type: 'boolean' },
        priceDropsEnabled: { type: 'boolean' },
        emailNotificationsEnabled: { type: 'boolean' },
        smsNotificationsEnabled: { type: 'boolean' },
        soundEnabled: { type: 'boolean' },
        vibrationEnabled: { type: 'boolean' },
        badgeEnabled: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notification settings updated',
  })
  async updateNotificationSettings(
    @CurrentUser() user: any,
    @Body() settings: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    return this.notificationsService.updateNotificationSettings(user.id, settings);
  }
}
