import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  NotificationsService,
  NotificationPayload,
  BulkNotificationPayload,
} from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Process single notification
   */
  @Process('send-notification')
  async handleSendNotification(job: Job<NotificationPayload>): Promise<void> {
    this.logger.debug(`Processing notification for user ${job.data.userId}`);

    try {
      await this.notificationsService.sendPushNotification(job.data);
      this.logger.log(`Notification sent to user ${job.data.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification to ${job.data.userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Process bulk notifications
   */
  @Process('send-bulk-notification')
  async handleBulkNotification(job: Job<BulkNotificationPayload>): Promise<void> {
    this.logger.debug(
      `Processing bulk notification for ${job.data.userIds.length} users`,
    );

    try {
      const successCount = await this.notificationsService.sendBulkPushNotification(
        job.data,
      );
      this.logger.log(
        `Bulk notification completed: ${successCount}/${job.data.userIds.length} sent`,
      );
    } catch (error) {
      this.logger.error(`Bulk notification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process SMS notification
   */
  @Process('send-sms')
  async handleSendSms(
    job: Job<{ phoneNumber: string; message: string }>,
  ): Promise<void> {
    this.logger.debug(`Processing SMS to ${job.data.phoneNumber}`);

    try {
      await this.notificationsService.sendSms(job.data);
      this.logger.log(`SMS sent to ${job.data.phoneNumber}`);
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${job.data.phoneNumber}: ${error.message}`,
      );
      throw error;
    }
  }
}
