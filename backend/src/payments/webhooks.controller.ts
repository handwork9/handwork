import {
  Controller,
  Post,
  Headers,
  Body,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { PaystackService, PaystackWebhookPayload } from './paystack.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private readonly stripe: Stripe;
  private readonly stripeWebhookSecret: string;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paystackService: PaystackService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('services.stripeSecretKey') || '', {
      apiVersion: '2023-10-16',
    });
    this.stripeWebhookSecret = this.configService.get<string>('services.stripeWebhookSecret') || '';
  }

  @Post('stripe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Stripe webhook handler (legacy)' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    let event: Stripe.Event;

    try {
      const rawBody = req.rawBody;
      if (!rawBody) {
        throw new BadRequestException('Missing request body');
      }
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.stripeWebhookSecret,
      );
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }

    this.logger.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.paymentsService.handlePaymentSuccess(paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const failureMessage = paymentIntent.last_payment_error?.message || 'Unknown error';
        await this.paymentsService.handlePaymentFailure(paymentIntent.id, failureMessage);
        break;
      }

      default:
        this.logger.log(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  @Post('paystack')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Paystack webhook handler (primary for NGN)' })
  async handlePaystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
    @Body() body: PaystackWebhookPayload,
  ): Promise<{ received: boolean }> {
    // Verify webhook signature (skip in development if no signature provided)
    const rawBody = req.rawBody?.toString() || JSON.stringify(body);
    const isDevelopment = this.configService.get<string>('NODE_ENV') !== 'production';
    
    if (signature) {
      if (!this.paystackService.verifyWebhookSignature(rawBody, signature)) {
        this.logger.error('Invalid Paystack webhook signature');
        throw new BadRequestException('Invalid signature');
      }
    } else if (!isDevelopment) {
      // In production, signature is required
      this.logger.error('Missing Paystack webhook signature');
      throw new BadRequestException('Missing signature');
    } else {
      this.logger.warn('Paystack webhook received without signature (dev mode)');
    }

    this.logger.log(`Received Paystack webhook: ${body.event}`);

    try {
      switch (body.event) {
        // Successful payment (card, bank, ussd, etc.)
        case 'charge.success': {
          const data = body.data;
          this.logger.log(`Payment successful: ${data.reference}, Amount: ${data.amount / 100} NGN`);
          
          // Check if this is a DVA transfer (bank transfer to virtual account)
          if (data.channel === 'dedicated_nuban') {
            await this.paymentsService.handlePaystackDVATransfer(data);
          } else {
            // Regular card/bank payment
            await this.paymentsService.handlePaystackPaymentSuccess(data);
          }
          break;
        }

        // Failed payment (card declined, insufficient funds, etc.)
        case 'charge.failed': {
          const data = body.data;
          this.logger.error(`Payment failed: ${data.reference}, Reason: ${data.gateway_response}`);
          await this.paymentsService.handlePaystackPaymentFailed(data);
          break;
        }

        // DVA assigned to customer
        case 'dedicatedaccount.assign.success': {
          const data = body.data;
          this.logger.log(`DVA assigned: ${data.account_number} for customer ${data.customer?.customer_code}`);
          // DVA is already saved during signup, but we can update if needed
          break;
        }

        // DVA assignment failed
        case 'dedicatedaccount.assign.failed': {
          const data = body.data;
          this.logger.error(`DVA assignment failed for customer ${data.customer?.customer_code}`);
          // Notify admin or retry
          break;
        }

        // Customer identification (BVN verification)
        case 'customeridentification.success': {
          const data = body.data;
          this.logger.log(`Customer identified: ${data.customer_code}`);
          break;
        }

        case 'customeridentification.failed': {
          const data = body.data;
          this.logger.warn(`Customer identification failed: ${data.customer_code}`);
          break;
        }

        // Transfer to bank account (payouts)
        case 'transfer.success': {
          const data = body.data;
          this.logger.log(`Transfer successful: ${data.reference}`);
          await this.paymentsService.handlePaystackTransferSuccess(data);
          break;
        }

        case 'transfer.failed': {
          const data = body.data;
          this.logger.error(`Transfer failed: ${data.reference}`);
          await this.paymentsService.handlePaystackTransferFailed(data);
          break;
        }

        case 'transfer.reversed': {
          const data = body.data;
          this.logger.warn(`Transfer reversed: ${data.reference}`);
          await this.paymentsService.handlePaystackTransferReversed(data);
          break;
        }

        // Refunds
        case 'refund.processed': {
          const data = body.data;
          this.logger.log(`Refund processed: ${data.reference}`);
          break;
        }

        case 'refund.failed': {
          const data = body.data;
          this.logger.error(`Refund failed: ${data.reference}`);
          break;
        }

        default:
          this.logger.log(`Unhandled Paystack event: ${body.event}`);
      }
    } catch (error) {
      this.logger.error(`Error processing Paystack webhook: ${error.message}`);
      // Don't throw - we still want to return 200 to prevent retries for handled events
    }

    return { received: true };
  }
}
