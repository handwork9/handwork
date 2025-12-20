import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Rider,
  RiderSubscription,
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionDuration,
  SUBSCRIPTION_PRICING,
  SUBSCRIPTION_BOOST,
  PlatformRevenue,
  RevenueType,
  RevenueStatus,
  WalletOwnerType,
  TransactionCategory,
} from '../database/entities';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { generateReference } from '../common/utils/helpers';
import { EmailService } from '../email/email.service';

export interface SubscribeToPremiumDto {
  riderId: string;
  tier: SubscriptionTier;
  duration: SubscriptionDuration;
  paymentMethod?: 'wallet' | 'card';
  autoRenew?: boolean;
}

export interface SubscriptionResponse {
  subscription: RiderSubscription;
  rider: Partial<Rider>;
  message: string;
}

// Payment status for tracking
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Injectable()
export class RiderSubscriptionService {
  private readonly logger = new Logger(RiderSubscriptionService.name);

  constructor(
    @InjectRepository(RiderSubscription)
    private readonly subscriptionRepository: Repository<RiderSubscription>,
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
    @InjectRepository(PlatformRevenue)
    private readonly platformRevenueRepository: Repository<PlatformRevenue>,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get subscription pricing
   */
  getPricing(): typeof SUBSCRIPTION_PRICING {
    return SUBSCRIPTION_PRICING;
  }

  /**
   * Get subscription tiers with benefits
   */
  getTiers() {
    return [
      {
        tier: SubscriptionTier.BASIC,
        name: 'Basic',
        description: 'Free tier with standard order priority',
        boost: SUBSCRIPTION_BOOST[SubscriptionTier.BASIC],
        benefits: ['Standard order matching', 'Basic support'],
        pricing: SUBSCRIPTION_PRICING[SubscriptionTier.BASIC],
      },
      {
        tier: SubscriptionTier.SILVER,
        name: 'Silver',
        description: '1.5x priority boost for more orders',
        boost: SUBSCRIPTION_BOOST[SubscriptionTier.SILVER],
        benefits: [
          '1.5x priority in order matching',
          'Priority support',
          'Silver badge on profile',
        ],
        pricing: SUBSCRIPTION_PRICING[SubscriptionTier.SILVER],
      },
      {
        tier: SubscriptionTier.GOLD,
        name: 'Gold',
        description: '2x priority boost with extra benefits',
        boost: SUBSCRIPTION_BOOST[SubscriptionTier.GOLD],
        benefits: [
          '2x priority in order matching',
          'Priority support',
          'Gold badge on profile',
          'Extended delivery radius',
        ],
        pricing: SUBSCRIPTION_PRICING[SubscriptionTier.GOLD],
      },
      {
        tier: SubscriptionTier.PLATINUM,
        name: 'Platinum',
        description: '3x priority boost with premium benefits',
        boost: SUBSCRIPTION_BOOST[SubscriptionTier.PLATINUM],
        benefits: [
          '3x priority in order matching',
          'VIP support',
          'Platinum badge on profile',
          'Extended delivery radius',
          'Featured in top riders',
          'Lower commission rates',
        ],
        pricing: SUBSCRIPTION_PRICING[SubscriptionTier.PLATINUM],
      },
    ];
  }

  /**
   * Subscribe rider to a premium tier with transactional payment verification
   */
  async subscribe(dto: SubscribeToPremiumDto): Promise<SubscriptionResponse> {
    const { riderId, tier, duration, paymentMethod = 'wallet', autoRenew = false } = dto;

    // Validate tier
    if (tier === SubscriptionTier.BASIC) {
      throw new BadRequestException('Cannot subscribe to Basic tier - it is free');
    }

    // Get rider
    const rider = await this.riderRepository.findOne({
      where: { id: riderId },
      relations: ['user'],
    });

    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Get price
    const price = SUBSCRIPTION_PRICING[tier][duration];
    if (price <= 0) {
      throw new BadRequestException('Invalid subscription tier or duration');
    }

    // Check for existing active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        riderId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription && existingSubscription.isCurrentlyActive()) {
      // Allow upgrade but not downgrade
      const tierOrder = [SubscriptionTier.BASIC, SubscriptionTier.SILVER, SubscriptionTier.GOLD, SubscriptionTier.PLATINUM];
      const currentTierIndex = tierOrder.indexOf(existingSubscription.tier);
      const newTierIndex = tierOrder.indexOf(tier);

      if (newTierIndex <= currentTierIndex) {
        throw new BadRequestException(
          `Cannot downgrade from ${existingSubscription.tier} to ${tier}. Please wait for current subscription to expire.`
        );
      }
    }

    // Create a pending subscription first (for tracking)
    const paymentReference = generateReference('SUB');
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, duration);

    const pendingSubscription = this.subscriptionRepository.create({
      riderId,
      tier,
      status: SubscriptionStatus.PENDING,
      duration,
      amount: price,
      startDate,
      endDate,
      paymentReference,
      paymentMethod,
      autoRenew,
    });
    await this.subscriptionRepository.save(pendingSubscription);

    // Process payment - MUST succeed before granting access
    let paymentSuccessful = false;
    let paymentError: string | null = null;

    if (paymentMethod === 'wallet') {
      try {
        // Check wallet balance first
        const balance = await this.walletService.getRiderWalletBalanceByRiderId(riderId);
        if (balance < price) {
          throw new BadRequestException(
            `Insufficient wallet balance. Required: ₦${price.toLocaleString()}, Available: ₦${balance.toLocaleString()}`
          );
        }

        // Debit wallet - this uses its own transaction with pessimistic locking
        const debitTransaction = await this.walletService.debitWallet({
          ownerId: riderId,
          ownerType: WalletOwnerType.RIDER,
          amount: price,
          category: TransactionCategory.SUBSCRIPTION,
          description: `${tier} subscription - ${duration}`,
          metadata: { subscriptionId: pendingSubscription.id, paymentReference },
        });

        if (debitTransaction && debitTransaction.id) {
          paymentSuccessful = true;
          this.logger.log(`Payment successful for subscription ${pendingSubscription.id}, transaction: ${debitTransaction.id}`);
        }
      } catch (error) {
        paymentError = error.message || 'Payment failed';
        paymentSuccessful = false;
        this.logger.error(`Payment failed for rider ${riderId}: ${paymentError}`);
      }
    } else if (paymentMethod === 'card') {
      // For card payments, would integrate with payment gateway
      // For now, mark as failed until card payment is confirmed
      paymentError = 'Card payment requires external confirmation';
      paymentSuccessful = false;
    }

    // If payment failed, update subscription status and throw error
    if (!paymentSuccessful) {
      pendingSubscription.status = SubscriptionStatus.CANCELLED;
      pendingSubscription.cancellationReason = paymentError || 'Payment failed';
      pendingSubscription.cancelledAt = new Date();
      await this.subscriptionRepository.save(pendingSubscription);

      // Notify admin about failed payment
      this.notificationsGateway.sendToAdmins({
        type: 'premium_payment_failed',
        userType: 'rider',
        tier,
        duration,
        amount: price,
        userName: rider.user?.name || 'Unknown',
        userEmail: rider.user?.email || '',
        subscriptionId: pendingSubscription.id,
        error: paymentError,
        timestamp: new Date().toISOString(),
        message: `FAILED: Rider ${rider.user?.name || 'Unknown'} premium payment failed - ${paymentError}`,
      });

      throw new BadRequestException(paymentError || 'Payment failed. Premium access not granted.');
    }

    // Payment successful - NOW grant premium access
    pendingSubscription.status = SubscriptionStatus.ACTIVE;
    await this.subscriptionRepository.save(pendingSubscription);

    // Update rider premium status only after confirmed payment
    rider.isPremium = true;
    rider.currentTier = tier;
    rider.subscriptionExpiresAt = endDate;
    await this.riderRepository.save(rider);

    // Record platform revenue
    const platformRevenue = this.platformRevenueRepository.create({
      type: RevenueType.SUBSCRIPTION,
      amount: price,
      sourceUserId: riderId,
      sourceUserType: 'rider',
      rateApplied: 100,
      grossAmount: price,
      status: RevenueStatus.COLLECTED,
      metadata: {
        subscriptionId: pendingSubscription.id,
        tier,
        duration,
        paymentReference,
      },
    });
    await this.platformRevenueRepository.save(platformRevenue);

    // Send notification to user
    if (rider.user?.id) {
      await this.notificationsService.sendPushNotification({
        userId: rider.user.id,
        type: NotificationType.GENERAL,
        title: `Welcome to ${tier} Premium! 🎉`,
        body: `Your ${tier} subscription is now active. Enjoy ${SUBSCRIPTION_BOOST[tier]}x priority boost for more orders!`,
        data: { subscriptionType: 'activated', subscriptionId: pendingSubscription.id },
      });

      // Send subscription confirmation email
      const tierBenefits = this.getTierBenefits(tier);
      await this.emailService.sendSubscriptionRenewedEmail(rider.user, {
        tier,
        userType: 'rider',
        startDate,
        endDate,
        amount: price,
        benefits: tierBenefits,
      });
    }

    // Notify admin dashboard about successful premium subscription
    this.notificationsGateway.sendToAdmins({
      type: 'premium_subscription',
      userType: 'rider',
      tier,
      duration,
      amount: price,
      userName: rider.user?.name || 'Unknown',
      userEmail: rider.user?.email || '',
      subscriptionId: pendingSubscription.id,
      timestamp: new Date().toISOString(),
      message: `✅ Rider ${rider.user?.name || 'Unknown'} subscribed to ${tier} premium (₦${price.toLocaleString()})`,
    });

    this.logger.log(`Rider ${riderId} subscribed to ${tier} tier for ${duration}`);

    return {
      subscription: pendingSubscription,
      rider: {
        id: rider.id,
        isPremium: rider.isPremium,
        currentTier: rider.currentTier,
        subscriptionExpiresAt: rider.subscriptionExpiresAt,
      },
      message: `Successfully subscribed to ${tier} tier!`,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(riderId: string, reason?: string): Promise<{ message: string }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        riderId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    if (reason) {
      subscription.cancellationReason = reason;
    }
    await this.subscriptionRepository.save(subscription);

    // Note: We don't immediately revoke premium - they keep it until endDate
    this.logger.log(`Subscription ${subscription.id} cancelled for rider ${riderId}`);

    return { message: 'Subscription cancelled. You will retain premium benefits until the subscription expires.' };
  }

  /**
   * Get rider's current subscription
   */
  async getCurrentSubscription(riderId: string): Promise<RiderSubscription | null> {
    return this.subscriptionRepository.findOne({
      where: {
        riderId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get rider's subscription history
   */
  async getSubscriptionHistory(riderId: string, page = 1, limit = 10) {
    const [subscriptions, total] = await this.subscriptionRepository.findAndCount({
      where: { riderId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check and expire subscriptions (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredSubscriptions() {
    this.logger.log('Checking for expired subscriptions...');

    const now = new Date();
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
      relations: ['rider', 'rider.user'],
    });

    for (const subscription of expiredSubscriptions) {
      // Check if auto-renew is enabled
      if (subscription.autoRenew) {
        try {
          // Try to renew
          const renewResult = await this.subscribe({
            riderId: subscription.riderId,
            tier: subscription.tier,
            duration: subscription.duration,
            paymentMethod: 'wallet',
            autoRenew: true,
          });
          this.logger.log(`Auto-renewed subscription for rider ${subscription.riderId}`);

          // Send auto-renewal success email
          const rider = subscription.rider;
          if (rider?.user) {
            const tierBenefits = this.getTierBenefits(subscription.tier);
            await this.emailService.sendSubscriptionRenewedEmail(rider.user, {
              tier: subscription.tier,
              userType: 'rider',
              startDate: renewResult.subscription.startDate,
              endDate: renewResult.subscription.endDate,
              amount: renewResult.subscription.amount,
              benefits: tierBenefits,
            });
          }
          continue;
        } catch (error) {
          this.logger.warn(`Failed to auto-renew subscription for rider ${subscription.riderId}: ${error.message}`);
        }
      }

      // Mark as expired
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);

      // Update rider premium status
      const rider = subscription.rider;
      if (rider) {
        rider.isPremium = false;
        rider.currentTier = SubscriptionTier.BASIC;
        rider.subscriptionExpiresAt = undefined as unknown as Date;
        await this.riderRepository.save(rider);

        // Send notification
        if (rider.user?.id) {
          await this.notificationsService.sendPushNotification({
            userId: rider.user.id,
            type: NotificationType.GENERAL,
            title: 'Subscription Expired',
            body: 'Your premium subscription has expired. Renew now to keep getting priority orders!',
            data: { subscriptionType: 'expired' },
          });

          // Send expiration email
          const tierBenefits = this.getTierBenefits(subscription.tier);
          await this.emailService.sendSubscriptionExpiredEmail(rider.user, {
            tier: subscription.tier,
            userType: 'rider',
            expiredAt: subscription.endDate,
            benefits: tierBenefits,
          });
        }
      }

      this.logger.log(`Expired subscription ${subscription.id} for rider ${subscription.riderId}`);
    }

    this.logger.log(`Processed ${expiredSubscriptions.length} expired subscriptions`);
  }

  /**
   * Get benefits list for a subscription tier
   */
  private getTierBenefits(tier: SubscriptionTier): string[] {
    const benefits: Record<SubscriptionTier, string[]> = {
      [SubscriptionTier.BASIC]: ['Standard order matching', 'Basic support'],
      [SubscriptionTier.SILVER]: [
        '1.5x order priority boost',
        'Priority in order matching',
        'Silver badge on profile',
        'Standard customer support',
      ],
      [SubscriptionTier.GOLD]: [
        '2x order priority boost',
        'High priority in order matching',
        'Gold badge on profile',
        'Priority customer support',
        'Extended delivery radius',
      ],
      [SubscriptionTier.PLATINUM]: [
        '3x order priority boost',
        'Highest priority in order matching',
        'Platinum badge on profile',
        'VIP customer support',
        'Extended delivery radius',
        'Featured in top riders',
        'Lower commission rates',
      ],
    };
    return benefits[tier] || benefits[SubscriptionTier.BASIC];
  }

  /**
   * Get renewal price for a subscription tier and duration
   */
  private getRenewalPrice(tier: SubscriptionTier, duration: SubscriptionDuration): number {
    const pricing = SUBSCRIPTION_PRICING[tier];
    if (!pricing) return 0;
    return pricing[duration] || 0;
  }

  /**
   * Get subscription stats for admin
   */
  async getSubscriptionStats() {
    const stats = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select('sub.tier', 'tier')
      .addSelect('sub.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(sub.amount)', 'totalRevenue')
      .groupBy('sub.tier')
      .addGroupBy('sub.status')
      .getRawMany();

    const activeByTier = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select('sub.tier', 'tier')
      .addSelect('COUNT(*)', 'count')
      .where('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
      .groupBy('sub.tier')
      .getRawMany();

    const totalRevenue = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select('SUM(sub.amount)', 'total')
      .where('sub.status IN (:...statuses)', { 
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED] 
      })
      .getRawOne();

    return {
      breakdown: stats,
      activeByTier,
      totalRevenue: totalRevenue?.total || 0,
    };
  }

  private calculateEndDate(startDate: Date, duration: SubscriptionDuration): Date {
    const endDate = new Date(startDate);
    switch (duration) {
      case SubscriptionDuration.WEEKLY:
        endDate.setDate(endDate.getDate() + 7);
        break;
      case SubscriptionDuration.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case SubscriptionDuration.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
    }
    return endDate;
  }
}
