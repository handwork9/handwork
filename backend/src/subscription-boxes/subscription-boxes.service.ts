import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  SubscriptionBox,
  SubscriptionBoxDelivery,
  SubscriptionBoxType,
  SubscriptionBoxStatus,
  BoxSize,
  BOX_PRICING,
} from '../database/entities/subscription-box.entity';
import { Product } from '../database/entities/product.entity';
import { User } from '../database/entities/user.entity';
import { WalletService, DebitWalletDto } from '../wallet/wallet.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  CreateSubscriptionBoxDto,
  UpdateSubscriptionBoxDto,
  PauseSubscriptionDto,
  RateDeliveryDto,
} from './dto';
import { TransactionCategory, WalletOwnerType } from '../database/entities/wallet-transaction.entity';

@Injectable()
export class SubscriptionBoxesService {
  private readonly logger = new Logger(SubscriptionBoxesService.name);

  constructor(
    @InjectRepository(SubscriptionBox)
    private readonly subscriptionRepository: Repository<SubscriptionBox>,
    @InjectRepository(SubscriptionBoxDelivery)
    private readonly deliveryRepository: Repository<SubscriptionBoxDelivery>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get subscription box pricing
   */
  getPricing() {
    return {
      pricing: BOX_PRICING,
      sizes: Object.values(BoxSize),
      types: Object.values(SubscriptionBoxType),
      descriptions: {
        [BoxSize.SMALL]: '5-7 fresh items',
        [BoxSize.MEDIUM]: '8-12 fresh items',
        [BoxSize.LARGE]: '13-18 fresh items',
        [BoxSize.FAMILY]: '20+ fresh items',
      },
    };
  }

  /**
   * Create a new subscription box
   */
  async create(userId: string, dto: CreateSubscriptionBoxDto) {
    // Check if user already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: In([SubscriptionBoxStatus.ACTIVE, SubscriptionBoxStatus.PAUSED]),
      },
    });

    if (existingSubscription) {
      throw new BadRequestException(
        'You already have an active subscription. Please cancel or modify your existing subscription.',
      );
    }

    // Get user to check wallet balance
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate price
    const price = BOX_PRICING[dto.size][dto.type];

    // Check wallet balance
    const balance = Number(user.walletBalance) || 0;
    if (balance < price) {
      throw new BadRequestException(
        `Insufficient wallet balance. Required: ₦${price.toLocaleString()}, Available: ₦${balance.toLocaleString()}`,
      );
    }

    // Calculate next delivery date
    const nextDeliveryDate = this.calculateNextDeliveryDate(
      dto.preferredDeliveryDay || 6,
    );

    // Create subscription
    const subscription = this.subscriptionRepository.create({
      userId,
      type: dto.type,
      size: dto.size,
      price,
      preferredCategories: dto.preferredCategories,
      excludedProducts: dto.excludedProducts,
      deliveryAddress: dto.deliveryAddress,
      deliveryCity: dto.deliveryCity,
      deliveryState: dto.deliveryState,
      deliveryLatitude: dto.deliveryLatitude,
      deliveryLongitude: dto.deliveryLongitude,
      preferredDeliveryDay: dto.preferredDeliveryDay || 6,
      preferredDeliveryTime: dto.preferredDeliveryTime || '09:00-12:00',
      specialInstructions: dto.specialInstructions,
      paymentMethod: dto.paymentMethod || 'wallet',
      autoRenew: dto.autoRenew !== false,
      startDate: new Date(),
      nextDeliveryDate,
      status: SubscriptionBoxStatus.ACTIVE,
    });

    await this.subscriptionRepository.save(subscription);

    // Process initial payment via wallet service
    const debitDto: DebitWalletDto = {
      ownerId: userId,
      ownerType: WalletOwnerType.USER,
      amount: price,
      category: TransactionCategory.SUBSCRIPTION,
      description: `Subscription Box - ${dto.size} ${dto.type}`,
      metadata: { subscriptionId: subscription.id },
    };
    await this.walletService.debitWallet(debitDto);

    // Create first delivery record
    await this.createDeliveryRecord(subscription);

    // Send notification
    await this.notificationsService.sendPushNotification({
      userId,
      type: NotificationType.GENERAL,
      title: 'Subscription Box Activated! 🎉',
      body: `Your ${dto.size} ${dto.type} subscription is now active. First delivery on ${nextDeliveryDate.toLocaleDateString()}.`,
      data: { subscriptionId: subscription.id },
    });

    // Send socket notification
    this.notificationsGateway.sendToUser(userId, {
      type: 'subscription:created',
      subscriptionId: subscription.id,
    });

    return {
      success: true,
      message: 'Subscription created successfully',
      data: subscription,
    };
  }

  /**
   * Get user's subscription box
   */
  async getUserSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      return { success: true, data: null };
    }

    // Get upcoming deliveries
    const upcomingDeliveries = await this.deliveryRepository.find({
      where: {
        subscriptionId: subscription.id,
        status: In(['scheduled', 'preparing']),
      },
      order: { scheduledDate: 'ASC' },
      take: 3,
    });

    // Get past deliveries
    const pastDeliveries = await this.deliveryRepository.find({
      where: {
        subscriptionId: subscription.id,
        status: 'delivered',
      },
      order: { deliveredDate: 'DESC' },
      take: 5,
    });

    return {
      success: true,
      data: {
        ...subscription,
        upcomingDeliveries,
        pastDeliveries,
      },
    };
  }

  /**
   * Update subscription preferences
   */
  async update(userId: string, subscriptionId: string, dto: UpdateSubscriptionBoxDto) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionBoxStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled subscription');
    }

    // Check if size or type changed - will affect pricing
    const newSize = dto.size || subscription.size;
    const newType = dto.type || subscription.type;
    
    if (dto.size || dto.type) {
      const newPrice = BOX_PRICING[newSize][newType];
      subscription.price = newPrice;
    }

    // Update subscription
    Object.assign(subscription, dto);
    await this.subscriptionRepository.save(subscription);

    return {
      success: true,
      message: 'Subscription updated successfully',
      data: subscription,
    };
  }

  /**
   * Pause subscription
   */
  async pause(userId: string, subscriptionId: string, dto: PauseSubscriptionDto) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionBoxStatus.ACTIVE) {
      throw new BadRequestException('Subscription is not active');
    }

    // Validate pause duration
    const maxPauseDays = 30;
    const pauseDate = new Date(dto.resumeDate);
    const today = new Date();
    const daysUntilResume = Math.ceil(
      (pauseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilResume > maxPauseDays) {
      throw new BadRequestException(`Maximum pause duration is ${maxPauseDays} days`);
    }

    subscription.status = SubscriptionBoxStatus.PAUSED;
    subscription.pausedUntil = pauseDate;
    await this.subscriptionRepository.save(subscription);

    // Send notification
    await this.notificationsService.sendPushNotification({
      userId,
      type: NotificationType.GENERAL,
      title: 'Subscription Paused',
      body: `Your subscription has been paused until ${pauseDate.toLocaleDateString()}.`,
      data: { subscriptionId },
    });

    return {
      success: true,
      message: 'Subscription paused successfully',
      data: subscription,
    };
  }

  /**
   * Resume subscription
   */
  async resume(userId: string, subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionBoxStatus.PAUSED) {
      throw new BadRequestException('Subscription is not paused');
    }

    // Update subscription
    subscription.status = SubscriptionBoxStatus.ACTIVE;
    (subscription as any).pausedUntil = null;
    subscription.nextDeliveryDate = this.calculateNextDeliveryDate(
      subscription.preferredDeliveryDay,
    );

    await this.subscriptionRepository.save(subscription);

    // Create next delivery record
    await this.createDeliveryRecord(subscription);

    // Send notification
    await this.notificationsService.sendPushNotification({
      userId,
      type: NotificationType.GENERAL,
      title: 'Subscription Resumed! 🎉',
      body: `Your subscription is now active. Next delivery on ${subscription.nextDeliveryDate.toLocaleDateString()}.`,
      data: { subscriptionId },
    });

    return {
      success: true,
      message: 'Subscription resumed successfully',
      data: subscription,
    };
  }

  /**
   * Cancel subscription
   */
  async cancel(userId: string, subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionBoxStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    // Cancel pending deliveries
    await this.deliveryRepository.update(
      {
        subscriptionId,
        status: In(['scheduled', 'preparing']),
      },
      { status: 'cancelled' },
    );

    // Update subscription
    subscription.status = SubscriptionBoxStatus.CANCELLED;
    await this.subscriptionRepository.save(subscription);

    // Send notification
    await this.notificationsService.sendPushNotification({
      userId,
      type: NotificationType.GENERAL,
      title: 'Subscription Cancelled',
      body: 'Your subscription has been cancelled. We hope to see you again soon!',
      data: { subscriptionId },
    });

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription,
    };
  }

  /**
   * Get delivery details
   */
  async getDeliveryDetails(userId: string, deliveryId: string) {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['subscription'],
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.subscription.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return {
      success: true,
      data: delivery,
    };
  }

  /**
   * Rate a delivery
   */
  async rateDelivery(userId: string, deliveryId: string, dto: RateDeliveryDto) {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['subscription'],
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.subscription.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (delivery.status !== 'delivered') {
      throw new BadRequestException('Can only rate delivered items');
    }

    delivery.rating = dto.rating;
    if (dto.feedback) {
      delivery.feedback = dto.feedback;
    }
    await this.deliveryRepository.save(delivery);

    return {
      success: true,
      message: 'Delivery rated successfully',
      data: delivery,
    };
  }

  // ========== Helper Methods ==========

  /**
   * Calculate next delivery date based on preferred day
   */
  private calculateNextDeliveryDate(preferredDay: number): Date {
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntilDelivery = preferredDay - currentDay;

    if (daysUntilDelivery <= 0) {
      daysUntilDelivery += 7;
    }

    // Ensure at least 2 days notice
    if (daysUntilDelivery < 2) {
      daysUntilDelivery += 7;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilDelivery);
    nextDate.setHours(9, 0, 0, 0);

    return nextDate;
  }

  /**
   * Create a delivery record for a subscription
   */
  private async createDeliveryRecord(subscription: SubscriptionBox) {
    // Select products for the box
    const products = await this.selectProductsForBox(subscription);

    const delivery = this.deliveryRepository.create({
      subscriptionId: subscription.id,
      scheduledDate: subscription.nextDeliveryDate,
      products,
      status: 'scheduled',
    });

    await this.deliveryRepository.save(delivery);
    return delivery;
  }

  /**
   * Select products for a subscription box based on preferences
   */
  private async selectProductsForBox(
    subscription: SubscriptionBox,
  ): Promise<any[]> {
    // Determine item count based on box size
    const itemCounts = {
      [BoxSize.SMALL]: 6,
      [BoxSize.MEDIUM]: 10,
      [BoxSize.LARGE]: 15,
      [BoxSize.FAMILY]: 22,
    };

    const itemCount = itemCounts[subscription.size];

    // Build query for products
    let query = this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.stockQuantity > :minStock', { minStock: 0 });

    // Filter by preferred categories if specified
    if (
      subscription.preferredCategories &&
      subscription.preferredCategories.length > 0
    ) {
      query = query.andWhere('product.category IN (:...categories)', {
        categories: subscription.preferredCategories,
      });
    }

    // Exclude products if specified
    if (subscription.excludedProducts && subscription.excludedProducts.length > 0) {
      query = query.andWhere('product.id NOT IN (:...excludedIds)', {
        excludedIds: subscription.excludedProducts,
      });
    }

    // Get random products
    const products = await query
      .orderBy('RANDOM()')
      .take(itemCount)
      .getMany();

    // Format for storage
    return products.map((product) => ({
      id: product.id,
      name: product.title,
      quantity: 1,
      unit: product.unit,
      price: product.price,
      image: product.images?.[0],
    }));
  }

  // ========== Cron Jobs ==========

  /**
   * Process scheduled deliveries (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledDeliveries() {
    this.logger.log('Processing scheduled deliveries...');

    const now = new Date();
    const scheduledDeliveries = await this.deliveryRepository.find({
      where: {
        status: 'scheduled',
        scheduledDate: LessThanOrEqual(now),
      },
      relations: ['subscription'],
    });

    for (const delivery of scheduledDeliveries) {
      try {
        // Update delivery status to preparing
        delivery.status = 'preparing';
        await this.deliveryRepository.save(delivery);

        // Notify user
        await this.notificationsService.sendPushNotification({
          userId: delivery.subscription.userId,
          type: NotificationType.GENERAL,
          title: 'Your Box is Being Prepared! 📦',
          body: 'Your subscription box is now being prepared for delivery.',
          data: {
            subscriptionId: delivery.subscription.id,
            deliveryId: delivery.id,
          },
        });

        this.logger.log(`Delivery ${delivery.id} marked as preparing`);
      } catch (error) {
        this.logger.error(`Error processing delivery ${delivery.id}: ${error.message}`);
      }
    }
  }

  /**
   * Auto-resume paused subscriptions (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async resumePausedSubscriptions() {
    this.logger.log('Checking for paused subscriptions to resume...');

    const now = new Date();
    const pausedSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionBoxStatus.PAUSED,
        pausedUntil: LessThanOrEqual(now),
      },
    });

    for (const subscription of pausedSubscriptions) {
      try {
        // Resume subscription
        subscription.status = SubscriptionBoxStatus.ACTIVE;
        (subscription as any).pausedUntil = null;
        subscription.nextDeliveryDate = this.calculateNextDeliveryDate(
          subscription.preferredDeliveryDay,
        );

        await this.subscriptionRepository.save(subscription);

        // Create next delivery
        await this.createDeliveryRecord(subscription);

        // Notify user
        await this.notificationsService.sendPushNotification({
          userId: subscription.userId,
          type: NotificationType.GENERAL,
          title: 'Subscription Auto-Resumed! 🎉',
          body: `Your subscription has been automatically resumed. Next delivery on ${subscription.nextDeliveryDate.toLocaleDateString()}.`,
          data: { subscriptionId: subscription.id },
        });

        this.logger.log(`Subscription ${subscription.id} auto-resumed`);
      } catch (error) {
        this.logger.error(`Error resuming subscription ${subscription.id}: ${error.message}`);
      }
    }
  }

  /**
   * Process subscription renewals (runs daily at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRenewals() {
    this.logger.log('Processing subscription renewals...');

    const today = new Date();
    const renewalWindow = new Date(today);
    renewalWindow.setDate(today.getDate() + 1);

    // Find subscriptions that need renewal
    const subscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionBoxStatus.ACTIVE,
        autoRenew: true,
        nextDeliveryDate: LessThanOrEqual(renewalWindow),
      },
    });

    for (const subscription of subscriptions) {
      try {
        // Get user to check balance
        const user = await this.userRepository.findOne({
          where: { id: subscription.userId },
        });

        if (!user) continue;

        const balance = Number(user.walletBalance) || 0;

        // Check if user has enough balance for renewal
        if (balance < subscription.price) {
          // Notify user about insufficient balance
          await this.notificationsService.sendPushNotification({
            userId: subscription.userId,
            type: NotificationType.GENERAL,
            title: 'Subscription Renewal Failed',
            body: `Your subscription could not be renewed due to insufficient balance. Please top up your wallet to continue.`,
            data: { subscriptionId: subscription.id },
          });

          this.logger.warn(`Insufficient balance for subscription ${subscription.id}`);
          continue;
        }

        // Process payment
        const debitDto: DebitWalletDto = {
          ownerId: subscription.userId,
          ownerType: WalletOwnerType.USER,
          amount: subscription.price,
          category: TransactionCategory.SUBSCRIPTION,
          description: `Subscription Box Renewal - ${subscription.size} ${subscription.type}`,
          metadata: { subscriptionId: subscription.id },
        };
        await this.walletService.debitWallet(debitDto);

        // Update next delivery date based on subscription type
        const daysToAdd = subscription.type === SubscriptionBoxType.WEEKLY
          ? 7
          : subscription.type === SubscriptionBoxType.BIWEEKLY
            ? 14
            : 30;

        subscription.nextDeliveryDate = new Date(
          subscription.nextDeliveryDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
        );
        subscription.deliveriesCompleted = (subscription.deliveriesCompleted || 0) + 1;

        await this.subscriptionRepository.save(subscription);

        // Create delivery record
        await this.createDeliveryRecord(subscription);

        // Notify user
        await this.notificationsService.sendPushNotification({
          userId: subscription.userId,
          type: NotificationType.GENERAL,
          title: 'Subscription Renewed! 🎉',
          body: `Your subscription has been renewed. Next delivery on ${subscription.nextDeliveryDate.toLocaleDateString()}.`,
          data: { subscriptionId: subscription.id },
        });

        this.logger.log(`Subscription ${subscription.id} renewed successfully`);
      } catch (error) {
        this.logger.error(`Error renewing subscription ${subscription.id}: ${error.message}`);
      }
    }
  }

  // ========== Admin Methods ==========

  /**
   * Get all subscriptions (admin)
   */
  async getAllSubscriptions(params: {
    status?: SubscriptionBoxStatus;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 20 } = params;

    const query = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user');

    if (status) {
      query.where('subscription.status = :status', { status });
    }

    const [subscriptions, total] = await query
      .orderBy('subscription.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      data: subscriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get subscription stats (admin)
   */
  async getStats() {
    const [active, paused, cancelled, total] = await Promise.all([
      this.subscriptionRepository.count({ where: { status: SubscriptionBoxStatus.ACTIVE } }),
      this.subscriptionRepository.count({ where: { status: SubscriptionBoxStatus.PAUSED } }),
      this.subscriptionRepository.count({ where: { status: SubscriptionBoxStatus.CANCELLED } }),
      this.subscriptionRepository.count(),
    ]);

    // Calculate revenue
    const subscriptions = await this.subscriptionRepository.find({
      where: { status: In([SubscriptionBoxStatus.ACTIVE, SubscriptionBoxStatus.PAUSED]) },
    });
    
    const monthlyRevenue = subscriptions.reduce((sum, sub) => {
      const multiplier = sub.type === SubscriptionBoxType.WEEKLY
        ? 4
        : sub.type === SubscriptionBoxType.BIWEEKLY
          ? 2
          : 1;
      return sum + sub.price * multiplier;
    }, 0);

    return {
      success: true,
      data: {
        total,
        active,
        paused,
        cancelled,
        estimatedMonthlyRevenue: monthlyRevenue,
      },
    };
  }
}
