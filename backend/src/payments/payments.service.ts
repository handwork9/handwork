import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, Order, User } from '../database/entities';
import { PaymentStatus, PaymentMethod, OrderStatus } from '../common/enums';
import { EmailService } from '../email/email.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { WalletOwnerType, TransactionCategory } from '../database/entities/wallet-transaction.entity';

export interface CreatePaymentIntentDto {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
}

export interface WalletTopUpDto {
  userId: string;
  amount: number;
  currency?: string;
}

export interface PaymentResult {
  paymentId: string;
  clientSecret?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('services.stripeSecretKey') || '', {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create a payment intent for an order
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto): Promise<PaymentResult> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId },
      relations: ['buyer'],
    });

    if (!order) {
      throw new BadRequestException(`Order ${dto.orderId} not found`);
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Order already paid');
    }

    const currency = dto.currency || 'ngn';
    const amount = Math.round(dto.amount * 100); // Convert to kobo/cents

    try {
      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        metadata: {
          orderId: dto.orderId,
          buyerId: order.buyerId,
          type: 'order_payment',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record
      const payment = this.paymentRepository.create({
        userId: order.buyerId,
        orderId: dto.orderId,
        amount: dto.amount,
        currency,
        paymentMethod: dto.paymentMethod || PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: paymentIntent.id,
        metadata: {
          stripeClientSecret: paymentIntent.client_secret,
        },
      });
      await this.paymentRepository.save(payment);

      // Update order payment status
      order.paymentStatus = PaymentStatus.PENDING;
      await this.orderRepository.save(order);

      this.logger.log(`Created payment intent ${paymentIntent.id} for order ${dto.orderId}`);

      return {
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret || undefined,
        status: PaymentStatus.PENDING,
        amount: dto.amount,
        currency,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw new BadRequestException(`Payment failed: ${error.message}`);
    }
  }

  /**
   * Create wallet top-up payment intent
   */
  async createWalletTopUp(dto: WalletTopUpDto): Promise<PaymentResult> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new BadRequestException(`User ${dto.userId} not found`);
    }

    const currency = dto.currency || 'ngn';
    const amount = Math.round(dto.amount * 100);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        metadata: {
          userId: dto.userId,
          type: 'wallet_topup',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      const payment = this.paymentRepository.create({
        userId: dto.userId,
        amount: dto.amount,
        currency,
        paymentMethod: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: paymentIntent.id,
        metadata: {
          type: 'wallet_topup',
        },
      });
      await this.paymentRepository.save(payment);

      this.logger.log(`Created wallet top-up payment ${paymentIntent.id} for user ${dto.userId}`);

      return {
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret || undefined,
        status: PaymentStatus.PENDING,
        amount: dto.amount,
        currency,
      };
    } catch (error) {
      this.logger.error(`Failed to create wallet top-up: ${error.message}`);
      throw new BadRequestException(`Payment failed: ${error.message}`);
    }
  }

  /**
   * Process wallet payment for order
   */
  async payWithWallet(orderId: string, userId: string): Promise<PaymentResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    if (order.buyerId !== userId) {
      throw new BadRequestException('Not authorized to pay for this order');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User ${userId} not found`);
    }

    const paymentAmount = Number(order.totalAmount) || Number(order.total);

    if (user.walletBalance < paymentAmount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Deduct from wallet using WalletService (creates proper transaction record)
    await this.walletService.debitWallet({
      ownerId: userId,
      ownerType: WalletOwnerType.BUYER,
      amount: paymentAmount,
      category: TransactionCategory.ORDER_PAYMENT,
      description: `Payment for order #${order.orderNumber}`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: 'wallet',
      },
    });

    // Create payment record
    const payment = this.paymentRepository.create({
      userId,
      orderId,
      amount: paymentAmount,
      currency: 'ngn',
      paymentMethod: PaymentMethod.WALLET,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
    });
    await this.paymentRepository.save(payment);

    // Update order
    order.paymentStatus = PaymentStatus.COMPLETED;
    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();
    await this.orderRepository.save(order);

    this.logger.log(`Wallet payment completed for order ${orderId}`);

    // Send order confirmation email
    if (user?.emailNotificationsEnabled !== false && user?.email) {
      this.emailService.sendPaymentConfirmation(payment, user, order).catch((err) => {
        this.logger.warn(`Failed to send payment email: ${err.message}`);
      });
      this.emailService.sendOrderConfirmation(order, user).catch((err) => {
        this.logger.warn(`Failed to send order confirmation email: ${err.message}`);
      });
    }

    return {
      paymentId: payment.id,
      status: PaymentStatus.COMPLETED,
      amount: paymentAmount,
      currency: 'ngn',
    };
  }

  /**
   * Handle Stripe webhook for payment_intent.succeeded
   */
  async handlePaymentSuccess(paymentIntentId: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for intent ${paymentIntentId}`);
      return;
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log(`Payment ${payment.id} already completed`);
      return;
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    await this.paymentRepository.save(payment);

    // Get user for email notification
    const user = await this.userRepository.findOne({
      where: { id: payment.userId },
    });

    // Handle based on payment type
    if (payment.orderId) {
      // Order payment
      const order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
        relations: ['buyer'],
      });

      if (order) {
        order.paymentStatus = PaymentStatus.COMPLETED;
        order.status = OrderStatus.CONFIRMED;
        order.confirmedAt = new Date();
        await this.orderRepository.save(order);
        this.logger.log(`Order ${order.id} confirmed after payment`);

        // Send payment confirmation and order confirmation emails
        if (user?.emailNotificationsEnabled !== false && user?.email) {
          this.emailService.sendPaymentConfirmation(payment, user, order).catch((err) => {
            this.logger.warn(`Failed to send payment email: ${err.message}`);
          });
          this.emailService.sendOrderConfirmation(order, user).catch((err) => {
            this.logger.warn(`Failed to send order confirmation email: ${err.message}`);
          });
        }
      }
    } else if (payment.metadata?.type === 'wallet_topup') {
      // Wallet top-up
      if (user) {
        user.walletBalance += payment.amount;
        await this.userRepository.save(user);
        this.logger.log(`Wallet topped up for user ${user.id}: +${payment.amount}`);

        // Send wallet top-up confirmation email
        if (user.emailNotificationsEnabled !== false && user.email) {
          this.emailService.sendPaymentConfirmation(payment, user).catch((err) => {
            this.logger.warn(`Failed to send wallet topup email: ${err.message}`);
          });
        }
      }
    }
  }

  /**
   * Handle Stripe webhook for payment_intent.failed
   */
  async handlePaymentFailure(paymentIntentId: string, reason: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for intent ${paymentIntentId}`);
      return;
    }

    payment.status = PaymentStatus.FAILED;
    payment.metadata = { ...payment.metadata, failureReason: reason };
    await this.paymentRepository.save(payment);

    // Get user for email notification
    const user = await this.userRepository.findOne({
      where: { id: payment.userId },
    });

    let order: Order | null = null;
    if (payment.orderId) {
      order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
      });

      if (order) {
        order.paymentStatus = PaymentStatus.FAILED;
        await this.orderRepository.save(order);
      }
    }

    // Send payment failed email
    if (user?.emailNotificationsEnabled !== false && user?.email) {
      this.emailService.sendPaymentFailed(payment, user, reason, order || undefined).catch((err) => {
        this.logger.warn(`Failed to send payment failed email: ${err.message}`);
      });
    }

    this.logger.log(`Payment ${payment.id} failed: ${reason}`);
  }

  // ============================================
  // PAYSTACK WEBHOOK HANDLERS
  // ============================================

  /**
   * Handle Paystack charge.success for regular payments (card, bank, ussd)
   */
  async handlePaystackPaymentSuccess(data: any): Promise<void> {
    const { reference, amount, customer, metadata, channel } = data;

    // Find payment by reference
    const payment = await this.paymentRepository.findOne({
      where: { paystackReference: reference },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for Paystack reference ${reference}`);
      return;
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log(`Payment ${payment.id} already completed`);
      return;
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    payment.metadata = {
      ...payment.metadata,
      paystackChannel: channel,
      paystackCustomerCode: customer?.customer_code,
    };
    await this.paymentRepository.save(payment);

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: payment.userId },
    });

    // Handle based on payment type
    if (payment.orderId) {
      // Order payment
      const order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
        relations: ['buyer'],
      });

      if (order) {
        order.paymentStatus = PaymentStatus.COMPLETED;
        order.status = OrderStatus.CONFIRMED;
        order.confirmedAt = new Date();
        await this.orderRepository.save(order);
        this.logger.log(`Order ${order.id} confirmed after Paystack payment`);

        // Send push notification for successful order payment
        await this.notificationsService.sendPushNotification({
          userId: user?.id || order.buyerId,
          type: NotificationType.PAYMENT_RECEIVED,
          title: 'Payment Successful! ✅',
          body: `Your order #${order.orderNumber} has been confirmed.`,
          data: {
            type: 'order_payment',
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
        });

        if (user?.emailNotificationsEnabled !== false && user?.email) {
          this.emailService.sendPaymentConfirmation(payment, user, order).catch((err) => {
            this.logger.warn(`Failed to send payment email: ${err.message}`);
          });
          this.emailService.sendOrderConfirmation(order, user).catch((err) => {
            this.logger.warn(`Failed to send order confirmation email: ${err.message}`);
          });
        }
      }
    } else if (payment.metadata?.type === 'wallet_topup') {
      // Wallet top-up via card - use WalletService for proper crediting
      if (user) {
        // Determine owner type and ownerId based on user role
        let ownerType = WalletOwnerType.BUYER;
        let ownerId = user.id;
        
        if (user.role === 'farmer') {
          ownerType = WalletOwnerType.FARMER;
        } else if (user.role === 'rider') {
          ownerType = WalletOwnerType.RIDER;
          const riderId = await this.walletService.getRiderIdByUserId(user.id);
          if (riderId) {
            ownerId = riderId;
          }
        }
        
        await this.walletService.creditWallet({
          ownerId,
          ownerType,
          amount: payment.amount,
          category: TransactionCategory.WALLET_TOPUP,
          description: `Wallet top-up via Paystack`,
          metadata: {
            paystackReference: reference,
            paymentId: payment.id,
          },
        });
        
        this.logger.log(`Wallet topped up for ${ownerType} ${ownerId}: +${payment.amount} NGN`);

        // Send push notification for wallet top-up
        await this.notificationsService.sendPushNotification({
          userId: user.id,
          type: NotificationType.WALLET_TOPUP,
          title: 'Wallet Funded! 💰',
          body: `₦${payment.amount.toLocaleString()} has been added to your wallet.`,
          data: {
            type: 'wallet_topup',
            amount: payment.amount,
          },
        });

        if (user.emailNotificationsEnabled !== false && user.email) {
          this.emailService.sendPaymentConfirmation(payment, user).catch((err) => {
            this.logger.warn(`Failed to send wallet topup email: ${err.message}`);
          });
        }
      }
    }
  }

  /**
   * Process a verified Paystack payment (called from verify endpoint)
   * This handles wallet top-ups and order payments after user returns from Paystack
   */
  async processPaystackPayment(transactionData: any, userId?: string): Promise<void> {
    this.logger.log(`[processPaystackPayment] Called with transactionData: ${JSON.stringify(transactionData)}`);
    this.logger.log(`[processPaystackPayment] userId param: ${userId}`);
    
    const { reference, amount, metadata } = transactionData;
    
    // Paystack sometimes nests custom_fields, extract what we need
    const customMetadata = metadata?.custom_fields || metadata || {};
    const paymentType = customMetadata.type || metadata?.type;
    const metaUserId = customMetadata.userId || metadata?.userId;
    const orderId = customMetadata.orderId || metadata?.orderId;
    
    this.logger.log(`[processPaystackPayment] reference: ${reference}, amount: ${amount}, paymentType: ${paymentType}`);
    this.logger.log(`[processPaystackPayment] metadata: ${JSON.stringify(metadata)}`);
    
    // Check if already processed (avoid double credit)
    const existingPayment = await this.paymentRepository.findOne({
      where: { paystackReference: reference },
    });
    
    if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
      this.logger.log(`Payment ${reference} already processed, skipping`);
      return;
    }

    // Get user from metadata or parameter
    const paymentUserId = metaUserId || userId;
    if (!paymentUserId) {
      this.logger.warn(`No user ID found for payment ${reference}. metadata: ${JSON.stringify(metadata)}`);
      return;
    }

    const user = await this.userRepository.findOne({
      where: { id: paymentUserId },
    });

    if (!user) {
      this.logger.warn(`User ${paymentUserId} not found for payment ${reference}`);
      return;
    }

    const amountInNgn = amount / 100; // Convert from kobo

    // Create or update payment record
    let payment = existingPayment;
    if (!payment) {
      payment = this.paymentRepository.create({
        userId: paymentUserId,
        amount: amountInNgn,
        currency: 'NGN',
        status: PaymentStatus.COMPLETED,
        paymentMethod: 'card',
        paystackReference: reference,
        metadata: metadata || {},
        paidAt: new Date(),
      });
    } else {
      payment.status = PaymentStatus.COMPLETED;
      payment.paidAt = new Date();
    }
    
    await this.paymentRepository.save(payment);

    // Handle based on payment type
    if (orderId) {
      // Order payment
      this.logger.log(`[processPaystackPayment] Processing as order payment for orderId: ${orderId}`);
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['buyer'],
      });

      if (order) {
        order.paymentStatus = PaymentStatus.COMPLETED;
        order.status = OrderStatus.CONFIRMED;
        order.confirmedAt = new Date();
        await this.orderRepository.save(order);
        this.logger.log(`Order ${order.id} confirmed after Paystack verification`);
      }
    } else if (paymentType === 'wallet_topup') {
      // Wallet top-up - use WalletService to credit wallet and create transaction record
      this.logger.log(`[processPaystackPayment] Processing as wallet top-up for user: ${user.id}, role: ${user.role}`);
      
      // Determine owner type and ownerId based on user role
      let ownerType = WalletOwnerType.BUYER;
      let ownerId = user.id;
      
      if (user.role === 'farmer') {
        ownerType = WalletOwnerType.FARMER;
      } else if (user.role === 'rider') {
        ownerType = WalletOwnerType.RIDER;
        // For riders, we need to get the rider entity ID
        const riderId = await this.walletService.getRiderIdByUserId(user.id);
        if (riderId) {
          ownerId = riderId;
          this.logger.log(`[processPaystackPayment] Rider found with ID: ${riderId}`);
        } else {
          this.logger.warn(`[processPaystackPayment] No rider profile found for user ${user.id}`);
        }
      }
      
      const transaction = await this.walletService.creditWallet({
        ownerId,
        ownerType,
        amount: amountInNgn,
        category: TransactionCategory.WALLET_TOPUP,
        description: `Wallet top-up via Paystack (${reference})`,
        metadata: {
          paystackReference: reference,
          paymentId: payment.id,
        },
      });
      
      this.logger.log(`Wallet topped up for ${ownerType} ${ownerId}: +${amountInNgn} NGN. Transaction: ${transaction.id}`);

      // Send confirmation notification
      if (user.emailNotificationsEnabled !== false && user.email) {
        this.emailService.sendPaymentConfirmation(payment, user).catch((err) => {
          this.logger.warn(`Failed to send wallet topup email: ${err.message}`);
        });
      }
    } else {
      // Default to wallet top-up if no orderId and no specific type
      this.logger.log(`[processPaystackPayment] No specific type, defaulting to wallet top-up for user: ${user.id}, role: ${user.role}`);
      
      // Determine owner type and ownerId based on user role
      let ownerType = WalletOwnerType.BUYER;
      let ownerId = user.id;
      
      if (user.role === 'farmer') {
        ownerType = WalletOwnerType.FARMER;
      } else if (user.role === 'rider') {
        ownerType = WalletOwnerType.RIDER;
        // For riders, we need to get the rider entity ID
        const riderId = await this.walletService.getRiderIdByUserId(user.id);
        if (riderId) {
          ownerId = riderId;
          this.logger.log(`[processPaystackPayment] Rider found with ID: ${riderId}`);
        } else {
          this.logger.warn(`[processPaystackPayment] No rider profile found for user ${user.id}`);
        }
      }
      
      const transaction = await this.walletService.creditWallet({
        ownerId,
        ownerType,
        amount: amountInNgn,
        category: TransactionCategory.WALLET_TOPUP,
        description: `Wallet top-up via Paystack (${reference})`,
        metadata: {
          paystackReference: reference,
          paymentId: payment.id,
        },
      });
      
      this.logger.log(`Wallet topped up for ${ownerType} ${ownerId}: +${amountInNgn} NGN. Transaction: ${transaction.id}`);
    }
  }

  /**
   * Handle Paystack charge.failed webhook for failed payments
   */
  async handlePaystackPaymentFailed(data: any): Promise<void> {
    const { reference, gateway_response, channel } = data;

    // Find payment by reference
    const payment = await this.paymentRepository.findOne({
      where: { paystackReference: reference },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for failed Paystack reference ${reference}`);
      return;
    }

    if (payment.status === PaymentStatus.FAILED) {
      this.logger.log(`Payment ${payment.id} already marked as failed`);
      return;
    }

    payment.status = PaymentStatus.FAILED;
    payment.metadata = {
      ...payment.metadata,
      failureReason: gateway_response,
      paystackChannel: channel,
    };
    await this.paymentRepository.save(payment);

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: payment.userId },
    });

    let order: Order | null = null;
    if (payment.orderId) {
      order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
      });

      if (order) {
        order.paymentStatus = PaymentStatus.FAILED;
        await this.orderRepository.save(order);
      }
    }

    // Send payment failed email
    if (user?.emailNotificationsEnabled !== false && user?.email) {
      this.emailService.sendPaymentFailed(payment, user, gateway_response, order || undefined).catch((err) => {
        this.logger.warn(`Failed to send Paystack payment failed email: ${err.message}`);
      });
    }

    this.logger.log(`Paystack payment ${payment.id} failed: ${gateway_response}`);
  }

  /**
   * Handle payment cancellation (user cancelled during checkout)
   */
  async handlePaymentCancelled(paymentId: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for cancellation: ${paymentId}`);
      return;
    }

    if (payment.status !== PaymentStatus.PENDING) {
      this.logger.log(`Payment ${paymentId} is not pending, cannot cancel`);
      return;
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.metadata = { ...payment.metadata, cancelledAt: new Date().toISOString() };
    await this.paymentRepository.save(payment);

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: payment.userId },
    });

    let order: Order | null = null;
    if (payment.orderId) {
      order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
      });

      if (order && order.paymentStatus === PaymentStatus.PENDING) {
        order.paymentStatus = PaymentStatus.CANCELLED;
        await this.orderRepository.save(order);
      }
    }

    // Send payment cancelled email
    if (user?.emailNotificationsEnabled !== false && user?.email) {
      this.emailService.sendPaymentCancelled(payment, user, order || undefined).catch((err) => {
        this.logger.warn(`Failed to send payment cancelled email: ${err.message}`);
      });
    }

    this.logger.log(`Payment ${paymentId} cancelled`);
  }

  /**
   * Cancel payment by Paystack reference
   */
  async cancelPaymentByReference(reference: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { paystackReference: reference },
    });

    if (payment) {
      await this.handlePaymentCancelled(payment.id);
    } else {
      this.logger.warn(`Payment not found for reference: ${reference}`);
    }
  }

  /**
   * Handle Paystack DVA transfer (bank transfer to dedicated virtual account)
   * This is the primary way users top up their wallet via bank transfer
   */
  async handlePaystackDVATransfer(data: any): Promise<void> {
    const { 
      amount, 
      reference,
      customer,
      authorization,
      metadata,
    } = data;

    // Amount is in kobo, convert to naira
    const amountNGN = amount / 100;

    // Find user by Paystack customer code
    const user = await this.userRepository.findOne({
      where: { paystackCustomerId: customer?.customer_code },
    });

    if (!user) {
      this.logger.error(`User not found for Paystack customer ${customer?.customer_code}`);
      return;
    }

    // Check for duplicate transaction
    const existingPayment = await this.paymentRepository.findOne({
      where: { paystackReference: reference },
    });

    if (existingPayment) {
      this.logger.warn(`DVA transfer ${reference} already processed`);
      return;
    }

    // Create payment record for the DVA transfer
    const payment = this.paymentRepository.create({
      userId: user.id,
      amount: amountNGN,
      currency: 'ngn',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.COMPLETED,
      paystackReference: reference,
      paidAt: new Date(),
      metadata: {
        type: 'wallet_topup',
        channel: 'dedicated_nuban',
        dvaAccountNumber: user.dvaAccountNumber,
        senderAccountNumber: authorization?.sender_account_number,
        senderBankCode: authorization?.sender_bank,
        senderName: authorization?.sender_name,
      },
    });
    await this.paymentRepository.save(payment);

    // Credit user wallet using WalletService for proper handling
    // Determine owner type and ownerId based on user role
    let ownerType = WalletOwnerType.BUYER;
    let ownerId = user.id;
    
    if (user.role === 'farmer') {
      ownerType = WalletOwnerType.FARMER;
    } else if (user.role === 'rider') {
      ownerType = WalletOwnerType.RIDER;
      const riderId = await this.walletService.getRiderIdByUserId(user.id);
      if (riderId) {
        ownerId = riderId;
      }
    }
    
    await this.walletService.creditWallet({
      ownerId,
      ownerType,
      amount: amountNGN,
      category: TransactionCategory.WALLET_TOPUP,
      description: `DVA transfer from ${authorization?.sender_name || 'Bank Transfer'}`,
      metadata: {
        paystackReference: reference,
        paymentId: payment.id,
        channel: 'dedicated_nuban',
      },
    });

    this.logger.log(
      `DVA transfer received: ${amountNGN} NGN credited to ${ownerType} ${ownerId} wallet (Reference: ${reference})`
    );

    // Send notification to user
    if (user.emailNotificationsEnabled !== false && user.email) {
      this.emailService.sendPaymentConfirmation(payment, user).catch((err) => {
        this.logger.warn(`Failed to send DVA topup email: ${err.message}`);
      });
    }

    // TODO: Send push notification
    // TODO: Send in-app notification
  }

  /**
   * Handle successful Paystack transfer (payout to bank account)
   */
  async handlePaystackTransferSuccess(data: any): Promise<void> {
    const { reference, amount, recipient } = data;
    
    // Find withdrawal/payout record by reference
    const payment = await this.paymentRepository.findOne({
      where: { 
        paystackReference: reference,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      },
    });

    if (payment) {
      payment.status = PaymentStatus.COMPLETED;
      payment.paidAt = new Date();
      payment.metadata = {
        ...payment.metadata,
        transferRecipient: recipient?.recipient_code,
      };
      await this.paymentRepository.save(payment);
      this.logger.log(`Payout ${reference} completed successfully`);
    } else {
      this.logger.warn(`Payout record not found for reference ${reference}`);
    }
  }

  /**
   * Handle failed Paystack transfer (payout to bank account)
   */
  async handlePaystackTransferFailed(data: any): Promise<void> {
    const { reference, reason } = data;

    const payment = await this.paymentRepository.findOne({
      where: { paystackReference: reference },
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = { ...payment.metadata, failureReason: reason };
      await this.paymentRepository.save(payment);

      // Refund the user's wallet if this was a withdrawal
      if (payment.metadata?.type === 'withdrawal') {
        try {
          await this.walletService.creditWallet({
            ownerId: payment.userId,
            ownerType: WalletOwnerType.BUYER,
            amount: payment.amount,
            category: TransactionCategory.REFUND,
            description: `Refund for failed withdrawal: ${reason}`,
            metadata: { paymentId: payment.id, failureReason: reason },
          });
          this.logger.log(`Refunded ${payment.amount} to user ${payment.userId} wallet after failed transfer`);
        } catch (refundError: any) {
          this.logger.error(`Failed to refund wallet for payment ${payment.id}: ${refundError.message}`);
        }
      }

      this.logger.error(`Payout ${reference} failed: ${reason}`);
    }
  }

  /**
   * Handle reversed Paystack transfer
   */
  async handlePaystackTransferReversed(data: any): Promise<void> {
    const { reference, reason } = data;

    const payment = await this.paymentRepository.findOne({
      where: { paystackReference: reference },
    });

    if (payment) {
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
      payment.metadata = { ...payment.metadata, reversalReason: reason };
      await this.paymentRepository.save(payment);

      // Credit back the user's wallet
      const user = await this.userRepository.findOne({
        where: { id: payment.userId },
      });

      if (user) {
        user.walletBalance += payment.amount;
        await this.userRepository.save(user);
        this.logger.log(`Refunded ${payment.amount} to user ${user.id} after transfer reversal`);
      }

      this.logger.warn(`Payout ${reference} reversed: ${reason}`);
    }
  }

  /**
   * Process refund for an order
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string,
  ): Promise<PaymentResult> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BadRequestException(`Payment ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment not completed, cannot refund');
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    try {
      if (payment.stripePaymentIntentId) {
        // Stripe refund
        await this.stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: Math.round(refundAmount * 100),
          reason: 'requested_by_customer',
        });
      } else if (payment.paymentMethod === PaymentMethod.WALLET) {
        // Wallet refund - credit back
        const user = await this.userRepository.findOne({
          where: { id: payment.userId },
        });

        if (user) {
          user.walletBalance += refundAmount;
          await this.userRepository.save(user);
        }
      }

      // Update payment record
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAmount = refundAmount;
      payment.refundedAt = new Date();
      payment.metadata = { ...payment.metadata, refundReason: reason };
      await this.paymentRepository.save(payment);

      this.logger.log(`Refunded ${refundAmount} for payment ${paymentId}`);

      return {
        paymentId: payment.id,
        status: PaymentStatus.REFUNDED,
        amount: refundAmount,
        currency: payment.currency,
      };
    } catch (error) {
      this.logger.error(`Refund failed for payment ${paymentId}: ${error.message}`);
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });
  }

  /**
   * Get payments for a user
   */
  async getUserPayments(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['order'],
    });
  }

  /**
   * Get payments for an order
   */
  async getOrderPayments(orderId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }
}
