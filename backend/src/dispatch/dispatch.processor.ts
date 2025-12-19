import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DispatchService } from './dispatch.service';

interface DispatchJobData {
  orderId: string;
}

interface RetryDispatchJobData {
  orderId: string;
  dispatchLogId: string;
  attemptCount: number;
}

@Processor('dispatch')
export class DispatchProcessor {
  private readonly logger = new Logger(DispatchProcessor.name);

  constructor(private readonly dispatchService: DispatchService) {}

  /**
   * Process new dispatch job
   */
  @Process('dispatch-order')
  async handleDispatchOrder(job: Job<DispatchJobData>): Promise<void> {
    this.logger.log(`Processing dispatch job for order ${job.data.orderId}`);

    try {
      const result = await this.dispatchService.dispatchOrder(job.data.orderId);

      this.logger.log(
        `Dispatch job completed for order ${job.data.orderId}: ${result.message}`,
      );

      if (!result.success && !result.scheduledDelivery) {
        // Will be retried automatically by queue
        throw new Error(result.message);
      }
    } catch (error) {
      this.logger.error(
        `Dispatch job failed for order ${job.data.orderId}: ${error.message}`,
      );
      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Process retry dispatch job
   */
  @Process('retry-dispatch')
  async handleRetryDispatch(job: Job<RetryDispatchJobData>): Promise<void> {
    this.logger.log(
      `Retrying dispatch for order ${job.data.orderId} (attempt ${job.data.attemptCount})`,
    );

    try {
      const result = await this.dispatchService.dispatchOrder(job.data.orderId);

      this.logger.log(
        `Retry dispatch completed for order ${job.data.orderId}: ${result.message}`,
      );

      if (!result.success && !result.scheduledDelivery) {
        throw new Error(result.message);
      }
    } catch (error) {
      this.logger.error(
        `Retry dispatch failed for order ${job.data.orderId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Handle job completion
   */
  @Process('completed')
  handleCompleted(job: Job): void {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  /**
   * Handle job failure
   */
  @Process('failed')
  handleFailed(job: Job, error: Error): void {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
    );
  }
}
