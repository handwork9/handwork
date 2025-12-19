import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  User,
  FarmerSubscription,
  FarmerSubscriptionTier,
  FarmerSubscriptionStatus,
  FarmerSubscriptionDuration,
  FARMER_SUBSCRIPTION_PRICING,
  FARMER_VISIBILITY_BOOST,
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

export interface FarmerSubscribeDto {
  farmerId: string;
  tier: FarmerSubscriptionTier;
  duration: FarmerSubscriptionDuration;
  paymentMethod?: 'wallet' | 'card';
  autoRenew?: boolean;
}

export interface FarmerSubscriptionResponse {
  subscription: FarmerSubscription;
  farmer: Partial<User>;
  message: string;
}

@Injectable()
export class FarmerSubscriptionService {
  private readonly logger = new Logger(FarmerSubscriptionService.name);

  constructor(
    @InjectRepository(FarmerSubscription)
    private readonly subscriptionRepository: Repository<FarmerSubscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
  getPricing(): typeof FARMER_SUBSCRIPTION_PRICING {
    return FARMER_SUBSCRIPTION_PRICING;
  }

  /**
   * Get subscription tiers with benefits
   */
  getTiers() {
    return [
      {
        tier: FarmerSubscriptionTier.BASIC,
        name: 'Basic',
        description: 'Free tier with standard product listing',
        boost: FARMER_VISIBILITY_BOOST[FarmerSubscriptionTier.BASIC],
        benefits: ['Standard product listing', 'Basic support'],
        pricing: FARMER_SUBSCRIPTION_PRICING[FarmerSubscriptionTier.BASIC],
      },
      {
        tier: FarmerSubscriptionTier.VERIFIED,
        name: 'Verified Seller',
        description: 'Verified badge + 1.5x visibility boost',
        boost: FARMER_VISIBILITY_BOOST[FarmerSubscriptionTier.VERIFIED],
        benefits: [
          'Verified seller badge on products',
          '1.5x visibility boost in search',
          'Priority support',
          'Featured in verified sellers section',
          'Trust badge builds buyer confidence',
        ],
        pricing: FARMER_SUBSCRIPTION_PRICING[FarmerSubscriptionTier.VERIFIED],
      },
      {
        tier: FarmerSubscriptionTier.PREMIUM,
        name: 'Premium Seller',
        description: 'Premium badge + 2.5x visibility + top placement',
        boost: FARMER_VISIBILITY_BOOST[FarmerSubscriptionTier.PREMIUM],
        benefits: [
          'Premium seller badge on products',
          '2.5x visibility boost in search',
          'VIP support',
          'Top placement in category listings',
          'Featured on homepage',
          'Analytics dashboard access',
          'Lower platform commission',
        ],
        pricing: FARMER_SUBSCRIPTION_PRICING[FarmerSubscriptionTier.PREMIUM],
      },
    ];
  }

  /**
   * Subscribe farmer to a premium tier
   */
  async subscribe(dto: FarmerSubscribeDto): Promise<FarmerSubscriptionResponse> {
    const { farmerId, tier, duration, paymentMethod = 'wallet', autoRenew = false } = dto;

    // Validate tier
    if (tier === FarmerSubscriptionTier.BASIC) {
      throw new BadRequestException('Cannot subscribe to Basic tier - it is free');
    }

    // Get farmer (user)
    const farmer = await this.userRepository.findOne({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    // Get price
    const price = FARMER_SUBSCRIPTION_PRICING[tier][duration];
    if (price <= 0) {
      throw new BadRequestException('Invalid subscription tier or duration');
    }

    // Check for existing active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        farmerId,
        status: FarmerSubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription && existingSubscription.isCurrentlyActive()) {
      // Allow upgrade but not downgrade
      const tierOrder = [FarmerSubscriptionTier.BASIC, FarmerSubscriptionTier.VERIFIED, FarmerSubscriptionTier.PREMIUM];
      const currentTierIndex = tierOrder.indexOf(existingSubscription.tier);
      const newTierIndex = tierOrder.indexOf(tier);

      if (newTierIndex <= currentTierIndex) {
        throw new BadRequestException(
          `Cannot downgrade from ${existingSubscription.tier} to ${tier}. Please wait for current subscription to expire.`
        );
      }
    }

    // Create a pending subscription first
    const paymentReference = generateReference('FSUB');
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, duration);

    const pendingSubscription = this.subscriptionRepository.create({
      farmerId,
      tier,
      status: FarmerSubscriptionStatus.PENDING,
      duration,
      amount: price,
      startDate,
      endDate,
      paymentReference,
      paymentMethod,
      autoRenew,
    });
    await this.subscriptionRepository.save(pendingSubscription);

    // Process payment
    let paymentSuccessful = false;
    let paymentError: string | null = null;

    if (paymentMethod === 'wallet') {
      try {
        // Check wallet balance first
        const balance = await this.walletService.getUserWalletBalance(farmerId);
        if (balance < price) {
          throw new BadRequestException(
            `Insufficient wallet balance. Required: ₦${price.toLocaleString()}, Available: ₦${balance.toLocaleString()}`
          );
        }

        // Debit wallet - Use FARMER as owner type since farmers are users
        const debitTransaction = await this.walletService.debitWallet({
          ownerId: farmerId,
          ownerType: WalletOwnerType.FARMER,
          amount: price,
          category: TransactionCategory.SUBSCRIPTION,
          description: `${tier} farmer subscription - ${duration}`,
          metadata: { subscriptionId: pendingSubscription.id, paymentReference },
        });

        if (debitTransaction && debitTransaction.id) {
          paymentSuccessful = true;
          this.logger.log(`Payment successful for farmer subscription ${pendingSubscription.id}, transaction: ${debitTransaction.id}`);
        }
      } catch (error) {
        paymentError = error.message || 'Payment failed';
        paymentSuccessful = false;
        this.logger.error(`Payment failed for farmer ${farmerId}: ${paymentError}`);
      }
    } else if (paymentMethod === 'card') {
      // For card payments, would integrate with payment gateway
      paymentError = 'Card payment requires external confirmation';
      paymentSuccessful = false;
    }

    // If payment failed, update subscription status and throw error
    if (!paymentSuccessful) {
      pendingSubscription.status = FarmerSubscriptionStatus.CANCELLED;
      pendingSubscription.cancellationReason = paymentError || 'Payment failed';
      pendingSubscription.cancelledAt = new Date();
      await this.subscriptionRepository.save(pendingSubscription);

      throw new BadRequestException(paymentError || 'Payment failed');
    }

    // Payment successful - activate subscription using transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Cancel any existing active subscription
      if (existingSubscription) {
        existingSubscription.status = FarmerSubscriptionStatus.CANCELLED;
        existingSubscription.cancelledAt = new Date();
        existingSubscription.cancellationReason = 'Upgraded to new tier';
        await queryRunner.manager.save(existingSubscription);
      }

      // Activate new subscription
      pendingSubscription.status = FarmerSubscriptionStatus.ACTIVE;
      await queryRunner.manager.save(pendingSubscription);

      // Update user's premium status
      farmer.isPremium = true;
      farmer.premiumTier = tier;
      farmer.premiumExpiresAt = endDate;
      await queryRunner.manager.save(farmer);

      // Record platform revenue
      const revenue = this.platformRevenueRepository.create({
        type: RevenueType.SUBSCRIPTION,
        amount: price,
        status: RevenueStatus.COLLECTED,
        reference: paymentReference,
        sourceUserId: farmerId,
        sourceUserType: 'farmer',
        description: `${tier} subscription - ${duration}`,
        metadata: {
          farmerId,
          tier,
          duration,
          subscriptionId: pendingSubscription.id,
        },
      });
      await queryRunner.manager.save(revenue);

      await queryRunner.commitTransaction();

      this.logger.log(`Farmer ${farmerId} successfully subscribed to ${tier} tier`);

      // Send success notification
      await this.notificationsService.sendPushNotification({
        userId: farmerId,
        type: NotificationType.GENERAL,
        title: 'Subscription Activated!',
        body: `Your ${tier} seller subscription is now active until ${endDate.toLocaleDateString()}.`,
        data: { subscriptionId: pendingSubscription.id, tier },
      });

      // Send renewal confirmation email
      const tierBenefits = this.getTierBenefits(tier);
      await this.emailService.sendSubscriptionRenewedEmail(farmer, {
        tier,
        userType: 'farmer',
        startDate,
        endDate,
        amount: price,
        benefits: tierBenefits,
      });

      // Notify admin
      this.notificationsGateway.sendToAdmins({
        type: 'farmer_premium_activated',
        tier,
        duration,
        amount: price,
        farmerName: farmer.name,
        farmerEmail: farmer.email || '',
        subscriptionId: pendingSubscription.id,
        timestamp: new Date().toISOString(),
      });

      return {
        subscription: pendingSubscription,
        farmer: {
          id: farmer.id,
          name: farmer.name,
          isPremium: farmer.isPremium,
          premiumTier: farmer.premiumTier,
          premiumExpiresAt: farmer.premiumExpiresAt,
        },
        message: `Successfully subscribed to ${tier} tier! You are now a verified seller.`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to activate subscription for farmer ${farmerId}:`, error);
      throw new BadRequestException('Failed to activate subscription. Please contact support.');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get current subscription for a farmer
   */
  async getCurrentSubscription(farmerId: string): Promise<FarmerSubscription | null> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        farmerId,
        status: FarmerSubscriptionStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });

    if (subscription && !subscription.isCurrentlyActive()) {
      // Subscription has expired, update status
      subscription.status = FarmerSubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);
      return null;
    }

    return subscription;
  }

  /**
   * Get subscription history for a farmer
   */
  async getSubscriptionHistory(farmerId: string): Promise<FarmerSubscription[]> {
    return this.subscriptionRepository.find({
      where: { farmerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(farmerId: string, reason?: string): Promise<FarmerSubscription> {
    const subscription = await this.getCurrentSubscription(farmerId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    subscription.status = FarmerSubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason || 'Cancelled by user';
    subscription.autoRenew = false;

    await this.subscriptionRepository.save(subscription);

    // Update user's premium status
    const farmer = await this.userRepository.findOne({ where: { id: farmerId } });
    if (farmer) {
      farmer.isPremium = false;
      (farmer as any).premiumTier = null;
      (farmer as any).premiumExpiresAt = null;
      await this.userRepository.save(farmer);
    }

    // Send notification
    await this.notificationsService.sendPushNotification({
      userId: farmerId,
      type: NotificationType.GENERAL,
      title: 'Subscription Cancelled',
      body: 'Your verified seller subscription has been cancelled.',
      data: { subscriptionId: subscription.id },
    });

    return subscription;
  }

  /**
   * Check if farmer is verified (has active subscription)
   */
  async isVerifiedSeller(farmerId: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(farmerId);
    return subscription !== null && subscription.tier !== FarmerSubscriptionTier.BASIC;
  }

  /**
   * Get visibility boost for a farmer
   */
  async getVisibilityBoost(farmerId: string): Promise<number> {
    const subscription = await this.getCurrentSubscription(farmerId);
    if (!subscription) {
      return FARMER_VISIBILITY_BOOST[FarmerSubscriptionTier.BASIC];
    }
    return subscription.getVisibilityBoost();
  }

  /**
   * Calculate end date based on duration
   */
  private calculateEndDate(startDate: Date, duration: FarmerSubscriptionDuration): Date {
    const endDate = new Date(startDate);

    switch (duration) {
      case FarmerSubscriptionDuration.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case FarmerSubscriptionDuration.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case FarmerSubscriptionDuration.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return endDate;
  }

  /**
   * Cron job to check and expire subscriptions
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredSubscriptions() {
    this.logger.log('Checking for expired farmer subscriptions...');

    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: FarmerSubscriptionStatus.ACTIVE,
        endDate: LessThan(new Date()),
      },
      relations: ['farmer'],
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = FarmerSubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);

      // Update user's premium status
      if (subscription.farmer) {
        subscription.farmer.isPremium = false;
        (subscription.farmer as any).premiumTier = null;
        (subscription.farmer as any).premiumExpiresAt = null;
        await this.userRepository.save(subscription.farmer);

        // Get tier benefits for email
        const tierBenefits = this.getTierBenefits(subscription.tier);

        // Send expiration email
        await this.emailService.sendSubscriptionExpiredEmail(subscription.farmer, {
          tier: subscription.tier,
          userType: 'farmer',
          expiredAt: subscription.endDate,
          benefits: tierBenefits,
        });
      }

      // Send expiration notification with clear messaging about promotion removal
      await this.notificationsService.sendPushNotification({
        userId: subscription.farmerId,
        type: NotificationType.GENERAL,
        title: '⚠️ Subscription Expired',
        body: `Your ${subscription.tier} seller subscription has expired. Your products are no longer shown in the Verified Sellers section. Renew now to restore your visibility boost!`,
        data: { 
          subscriptionId: subscription.id,
          action: 'subscription_expired',
          tier: subscription.tier,
        },
      });

      this.logger.log(`Expired subscription ${subscription.id} for farmer ${subscription.farmerId}`);
    }

    this.logger.log(`Processed ${expiredSubscriptions.length} expired farmer subscriptions`);
  }

  /**
   * Get benefits list for a subscription tier
   */
  private getTierBenefits(tier: FarmerSubscriptionTier): string[] {
    const benefits: Record<FarmerSubscriptionTier, string[]> = {
      [FarmerSubscriptionTier.BASIC]: ['Standard product listing', 'Basic support'],
      [FarmerSubscriptionTier.VERIFIED]: [
        'Verified seller badge',
        '1.5x visibility boost',
        'Priority in search results',
        'Featured in Verified Sellers section',
      ],
      [FarmerSubscriptionTier.PREMIUM]: [
        'Premium seller badge',
        '2x visibility boost',
        'Top priority in search results',
        'Featured in Premium Sellers section',
        'Priority customer support',
        'Advanced analytics dashboard',
      ],
    };
    return benefits[tier] || benefits[FarmerSubscriptionTier.BASIC];
  }

  /**
   * Cron job to send expiring soon warnings (runs daily at 9 AM)
   */
  @Cron('0 9 * * *') // Every day at 9:00 AM
  async handleExpiringSubscriptions() {
    this.logger.log('Checking for expiring farmer subscriptions...');

    const now = new Date();
    
    // Warning thresholds
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get subscriptions expiring in 7 days
    const expiringIn7Days = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.farmer', 'farmer')
      .where('subscription.status = :status', { status: FarmerSubscriptionStatus.ACTIVE })
      .andWhere('subscription.endDate > :now', { now })
      .andWhere('subscription.endDate <= :sevenDays', { sevenDays: sevenDaysFromNow })
      .andWhere('subscription.endDate > :threeDays', { threeDays: threeDaysFromNow })
      .getMany();

    // Get subscriptions expiring in 3 days
    const expiringIn3Days = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.farmer', 'farmer')
      .where('subscription.status = :status', { status: FarmerSubscriptionStatus.ACTIVE })
      .andWhere('subscription.endDate > :now', { now })
      .andWhere('subscription.endDate <= :threeDays', { threeDays: threeDaysFromNow })
      .andWhere('subscription.endDate > :oneDay', { oneDay: oneDayFromNow })
      .getMany();

    // Get subscriptions expiring tomorrow
    const expiringTomorrow = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.farmer', 'farmer')
      .where('subscription.status = :status', { status: FarmerSubscriptionStatus.ACTIVE })
      .andWhere('subscription.endDate > :now', { now })
      .andWhere('subscription.endDate <= :oneDay', { oneDay: oneDayFromNow })
      .getMany();

    // Send 7-day warnings
    for (const subscription of expiringIn7Days) {
      const daysRemaining = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      // Get renewal price
      const renewalPrice = this.getRenewalPrice(subscription.tier, subscription.duration);

      // Send email notification
      if (subscription.farmer) {
        await this.emailService.sendSubscriptionExpiringSoonEmail(subscription.farmer, {
          tier: subscription.tier,
          userType: 'farmer',
          expiresAt: subscription.endDate,
          daysRemaining,
          renewalPrice,
        });
      }

      await this.notificationsService.sendPushNotification({
        userId: subscription.farmerId,
        type: NotificationType.GENERAL,
        title: '📅 Subscription Expiring Soon',
        body: `Your ${subscription.tier} seller subscription expires in ${daysRemaining} days. Renew to keep your products visible in the Verified Sellers section!`,
        data: { 
          subscriptionId: subscription.id,
          action: 'subscription_expiring_soon',
          daysRemaining,
          tier: subscription.tier,
        },
      });
    }

    // Send 3-day warnings (more urgent)
    for (const subscription of expiringIn3Days) {
      const daysRemaining = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      // Get renewal price
      const renewalPrice = this.getRenewalPrice(subscription.tier, subscription.duration);

      // Send email notification
      if (subscription.farmer) {
        await this.emailService.sendSubscriptionExpiringSoonEmail(subscription.farmer, {
          tier: subscription.tier,
          userType: 'farmer',
          expiresAt: subscription.endDate,
          daysRemaining,
          renewalPrice,
        });
      }

      await this.notificationsService.sendPushNotification({
        userId: subscription.farmerId,
        type: NotificationType.GENERAL,
        title: '⏰ Subscription Expires in 3 Days!',
        body: `Your ${subscription.tier} subscription is expiring soon! Renew now to avoid losing your visibility boost and verified badge.`,
        data: { 
          subscriptionId: subscription.id,
          action: 'subscription_expiring_urgent',
          daysRemaining,
          tier: subscription.tier,
        },
      });
    }

    // Send final warning (tomorrow)
    for (const subscription of expiringTomorrow) {
      // Get renewal price
      const renewalPrice = this.getRenewalPrice(subscription.tier, subscription.duration);

      // Send email notification
      if (subscription.farmer) {
        await this.emailService.sendSubscriptionExpiringSoonEmail(subscription.farmer, {
          tier: subscription.tier,
          userType: 'farmer',
          expiresAt: subscription.endDate,
          daysRemaining: 1,
          renewalPrice,
        });
      }

      await this.notificationsService.sendPushNotification({
        userId: subscription.farmerId,
        type: NotificationType.GENERAL,
        title: '🚨 Last Day! Subscription Expires Tomorrow',
        body: `Your ${subscription.tier} subscription expires TOMORROW! After expiration, your products will no longer appear in the Verified Sellers section. Renew now!`,
        data: { 
          subscriptionId: subscription.id,
          action: 'subscription_final_warning',
          daysRemaining: 1,
          tier: subscription.tier,
        },
      });
    }

    this.logger.log(
      `Sent expiration warnings: ${expiringIn7Days.length} (7-day), ${expiringIn3Days.length} (3-day), ${expiringTomorrow.length} (1-day)`
    );
  }

  /**
   * Get renewal price for a subscription tier and duration
   */
  private getRenewalPrice(tier: FarmerSubscriptionTier, duration: FarmerSubscriptionDuration): number {
    const pricing = FARMER_SUBSCRIPTION_PRICING[tier];
    if (!pricing) return 0;
    return pricing[duration] || 0;
  }

  /**
   * Get detailed subscription status with promotion visibility info
   */
  async getSubscriptionStatus(farmerId: string): Promise<{
    isActive: boolean;
    subscription: FarmerSubscription | null;
    tier: FarmerSubscriptionTier;
    daysRemaining: number | null;
    expiresAt: Date | null;
    promotionBenefits: {
      isShowingInVerifiedSection: boolean;
      visibilityBoost: number;
      tierBadge: string | null;
    };
    renewalInfo: {
      canRenew: boolean;
      isExpiringSoon: boolean;
      renewalPrice: number | null;
    };
  }> {
    const subscription = await this.getCurrentSubscription(farmerId);
    const farmer = await this.userRepository.findOne({ where: { id: farmerId } });

    if (!subscription || !farmer?.isPremium) {
      return {
        isActive: false,
        subscription: null,
        tier: FarmerSubscriptionTier.BASIC,
        daysRemaining: null,
        expiresAt: null,
        promotionBenefits: {
          isShowingInVerifiedSection: false,
          visibilityBoost: FARMER_VISIBILITY_BOOST[FarmerSubscriptionTier.BASIC],
          tierBadge: null,
        },
        renewalInfo: {
          canRenew: true,
          isExpiringSoon: false,
          renewalPrice: null,
        },
      };
    }

    const now = new Date();
    const daysRemaining = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const isExpiringSoon = daysRemaining <= 7;

    return {
      isActive: true,
      subscription,
      tier: subscription.tier,
      daysRemaining,
      expiresAt: subscription.endDate,
      promotionBenefits: {
        isShowingInVerifiedSection: true,
        visibilityBoost: FARMER_VISIBILITY_BOOST[subscription.tier],
        tierBadge: subscription.tier === FarmerSubscriptionTier.PREMIUM ? 'Premium Seller' : 'Verified Seller',
      },
      renewalInfo: {
        canRenew: true,
        isExpiringSoon,
        renewalPrice: FARMER_SUBSCRIPTION_PRICING[subscription.tier][subscription.duration],
      },
    };
  }

  /**
   * Farmer Account Activation (one-time fee to start selling)
   */
  async activateFarmerAccount(farmerId: string, paymentMethod: 'wallet' | 'card' = 'wallet'): Promise<{ success: boolean; message: string }> {
    const farmer = await this.userRepository.findOne({ where: { id: farmerId } });
    
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    if (farmer.role !== 'farmer') {
      throw new BadRequestException('Only farmers can activate a seller account');
    }

    if (farmer.isActivated) {
      throw new BadRequestException('Your account is already activated');
    }

    const ACTIVATION_FEE = 25000; // ₦25,000

    if (paymentMethod === 'wallet') {
      // Check wallet balance and debit
      try {
        const debitTransaction = await this.walletService.debitWallet({
          ownerId: farmerId,
          ownerType: WalletOwnerType.FARMER,
          amount: ACTIVATION_FEE,
          category: TransactionCategory.SUBSCRIPTION,
          description: 'Farmer Account Activation Fee',
        });
        this.logger.log(`Activation fee deducted, transaction: ${debitTransaction.id}`);
      } catch (error) {
        throw new BadRequestException(`Insufficient wallet balance. You need ₦${ACTIVATION_FEE.toLocaleString()} to activate your account.`);
      }

      // Record platform revenue
      const revenue = this.platformRevenueRepository.create({
        type: RevenueType.SUBSCRIPTION,
        amount: ACTIVATION_FEE,
        status: RevenueStatus.COLLECTED,
        reference: generateReference('ACT-REV'),
        sourceUserId: farmerId,
        sourceUserType: 'farmer',
        description: `Farmer activation fee from ${farmer.name}`,
        metadata: { farmerId, type: 'activation' },
      });
      await this.platformRevenueRepository.save(revenue);
    }

    // Activate the farmer
    farmer.isActivated = true;
    farmer.activatedAt = new Date();
    await this.userRepository.save(farmer);

    // Send notification
    await this.notificationsService.sendPushNotification({
      userId: farmerId,
      type: NotificationType.GENERAL,
      title: 'Account Activated! 🎉',
      body: 'Your farmer account is now active. You can start listing products and receiving orders!',
      data: { type: 'farmer_account_activated' },
    });

    // Real-time notification to admins
    this.notificationsGateway.sendToAdmins({
      type: 'farmer_activated',
      farmerId,
      farmerName: farmer.name,
      message: `Farmer ${farmer.name} has activated their account`,
    });

    this.logger.log(`Farmer ${farmerId} activated their account`);

    return {
      success: true,
      message: 'Your farmer account has been activated successfully! You can now start selling.',
    };
  }

  /**
   * Get activation fee
   */
  getActivationFee(): { fee: number; display: string } {
    return {
      fee: 25000,
      display: '₦25,000',
    };
  }
}
