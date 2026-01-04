import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, PlatformRevenue, RevenueType, RevenueStatus, WalletOwnerType, TransactionCategory, FarmerProfile, AccountDeletionRequest, DeletionRequestStatus, DeletionReason } from '../database/entities';
import { UpdateUserDto, ApplyAsFarmerDto, RequestAccountDeletionDto, ReviewDeletionRequestDto } from './dto';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CouponsService } from '../coupons/coupons.service';
import { generateReference } from '../common/utils/helpers';
import { FarmerApplicationStatus, UserRole } from '../common/enums';
import * as bcrypt from 'bcrypt';

// Buyer Premium Pricing
export const BUYER_PREMIUM_PRICING: Record<string, Record<string, number>> = {
  basic: { weekly: 500, monthly: 1500, quarterly: 4000 },
  gold: { weekly: 1000, monthly: 3000, quarterly: 8000 },
  platinum: { weekly: 2000, monthly: 6000, quarterly: 16000 },
};

export interface BuyerPremiumDto {
  tier: 'basic' | 'gold' | 'platinum';
  duration: 'weekly' | 'monthly' | 'quarterly';
  paymentMethod?: 'wallet' | 'card';
}

// Premium subscription status
export enum PremiumSubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PlatformRevenue)
    private readonly platformRevenueRepository: Repository<PlatformRevenue>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepository: Repository<FarmerProfile>,
    @InjectRepository(AccountDeletionRequest)
    private readonly deletionRequestRepository: Repository<AccountDeletionRequest>,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    @Inject(forwardRef(() => CouponsService))
    private readonly couponsService: CouponsService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByIdWithProfile(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['farmerProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user ${id} with: ${JSON.stringify(dto)}`);
    const user = await this.findById(id);
    
    // Check if birthday is being updated to today's date
    const isBirthdayUpdate = dto.dateOfBirth && !user.dateOfBirth;
    const isBirthdayToday = dto.dateOfBirth ? this.isBirthdayToday(dto.dateOfBirth) : false;
    
    Object.assign(user, dto);
    const saved = await this.userRepository.save(user);
    this.logger.log(`User ${id} updated, avatar is now: ${saved.avatar}`);
    
    // Create birthday coupon if birthday is today
    if ((isBirthdayUpdate || this.isBirthdayToday(saved.dateOfBirth)) && isBirthdayToday) {
      try {
        const coupon = await this.couponsService.createBirthdayCoupon(saved.id, saved.name);
        this.logger.log(`Birthday coupon ${coupon.code} created for user ${saved.id}`);
      } catch (error) {
        this.logger.error(`Failed to create birthday coupon: ${error.message}`);
      }
    }
    
    return saved;
  }
  
  private isBirthdayToday(dateOfBirth: string | Date | null): boolean {
    if (!dateOfBirth) return false;
    const today = new Date();
    const dob = new Date(dateOfBirth);
    return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
  }

  async updateDeviceToken(userId: string, token: string): Promise<void> {
    const user = await this.findById(userId);
    const tokens = user.deviceTokens || [];
    if (!tokens.includes(token)) {
      tokens.push(token);
    }
    user.deviceTokens = tokens;
    await this.userRepository.save(user);
  }

  async removeDeviceToken(userId: string, token: string): Promise<void> {
    const user = await this.findById(userId);
    user.deviceTokens = (user.deviceTokens || []).filter((t) => t !== token);
    await this.userRepository.save(user);
  }

  async updateLocation(userId: string, lat: number, lng: number): Promise<void> {
    await this.userRepository.update(userId, {
      latitude: lat,
      longitude: lng,
    });
  }

  async updateLoginAlerts(userId: string, enabled: boolean): Promise<void> {
    await this.userRepository.update(userId, {
      loginAlertsEnabled: enabled,
    });
  }

  async deactivate(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: false });
  }

  async reactivate(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: true });
  }

  /**
   * Subscribe buyer to premium with verified payment
   */
  async subscribeToPremium(userId: string, dto: BuyerPremiumDto) {
    const user = await this.findById(userId);
    const { tier, duration, paymentMethod = 'wallet' } = dto;

    // Get pricing
    const tierPricing = BUYER_PREMIUM_PRICING[tier];
    if (!tierPricing) {
      throw new BadRequestException('Invalid premium tier');
    }
    const price = tierPricing[duration];
    if (!price) {
      throw new BadRequestException('Invalid duration');
    }

    // Check if already premium
    if (user.isPremium && user.premiumExpiresAt && new Date() < user.premiumExpiresAt) {
      throw new BadRequestException('You already have an active premium subscription');
    }

    const paymentReference = generateReference('BPREM');
    let paymentSuccessful = false;
    let paymentError: string | null = null;

    // Process payment - MUST succeed before granting access
    if (paymentMethod === 'wallet') {
      try {
        // Check wallet balance first
        const balance = await this.walletService.getUserWalletBalance(userId);
        if (balance < price) {
          throw new BadRequestException(
            `Insufficient wallet balance. Required: ₦${price.toLocaleString()}, Available: ₦${balance.toLocaleString()}`
          );
        }

        // Debit wallet - this uses its own transaction with pessimistic locking
        const debitTransaction = await this.walletService.debitWallet({
          ownerId: userId,
          ownerType: WalletOwnerType.BUYER,
          amount: price,
          category: TransactionCategory.SUBSCRIPTION,
          description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Premium - ${duration}`,
          metadata: { paymentReference, tier, duration },
        });

        if (debitTransaction && debitTransaction.id) {
          paymentSuccessful = true;
          this.logger.log(`Payment successful for buyer ${userId}, transaction: ${debitTransaction.id}`);
        }
      } catch (error) {
        paymentError = error.message || 'Payment failed';
        paymentSuccessful = false;
        this.logger.error(`Payment failed for buyer ${userId}: ${paymentError}`);
      }
    } else if (paymentMethod === 'card') {
      // For card payments, would integrate with payment gateway
      paymentError = 'Card payment requires external confirmation';
      paymentSuccessful = false;
    }

    // If payment failed, notify admin and throw error
    if (!paymentSuccessful) {
      // Notify admin about failed payment
      this.notificationsGateway.sendToAdmins({
        type: 'premium_payment_failed',
        userType: 'buyer',
        tier,
        duration,
        amount: price,
        userName: user.name,
        userEmail: user.email || '',
        userId: user.id,
        error: paymentError,
        timestamp: new Date().toISOString(),
        message: `❌ FAILED: Buyer ${user.name} premium payment failed - ${paymentError}`,
      });

      throw new BadRequestException(paymentError || 'Payment failed. Premium access not granted.');
    }

    // Payment successful - NOW grant premium access
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, duration);

    user.isPremium = true;
    user.premiumTier = tier;
    user.premiumExpiresAt = endDate;
    await this.userRepository.save(user);

    // Record platform revenue
    const platformRevenue = this.platformRevenueRepository.create({
      type: RevenueType.SUBSCRIPTION,
      amount: price,
      sourceUserId: userId,
      sourceUserType: 'buyer',
      rateApplied: 100,
      grossAmount: price,
      status: RevenueStatus.COLLECTED,
      metadata: {
        tier,
        duration,
        premiumType: 'buyer',
        paymentReference,
      },
    });
    await this.platformRevenueRepository.save(platformRevenue);

    // Send notification to user
    await this.notificationsService.sendPushNotification({
      userId,
      type: NotificationType.GENERAL,
      title: `Welcome to ${tier.charAt(0).toUpperCase() + tier.slice(1)} Premium! 🎉`,
      body: `Your premium subscription is now active. Enjoy exclusive discounts and benefits!`,
      data: { premiumType: 'activated', tier },
    });

    // Notify admin dashboard about successful premium subscription
    this.notificationsGateway.sendToAdmins({
      type: 'premium_subscription',
      userType: 'buyer',
      tier,
      duration,
      amount: price,
      userName: user.name,
      userEmail: user.email || '',
      userId: user.id,
      timestamp: new Date().toISOString(),
      message: `✅ Buyer ${user.name} subscribed to ${tier} premium (₦${price.toLocaleString()})`,
    });

    this.logger.log(`User ${userId} subscribed to ${tier} premium for ${duration}`);

    return {
      success: true,
      message: `Successfully subscribed to ${tier} premium!`,
      paymentReference,
      user: {
        id: user.id,
        isPremium: user.isPremium,
        premiumTier: user.premiumTier,
        premiumExpiresAt: user.premiumExpiresAt,
      },
    };
  }

  /**
   * Get premium pricing
   */
  getPremiumPricing() {
    return BUYER_PREMIUM_PRICING;
  }

  private calculateEndDate(startDate: Date, duration: string): Date {
    const endDate = new Date(startDate);
    switch (duration) {
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
    }
    return endDate;
  }

  /**
   * Apply to become a farmer
   */
  async applyAsFarmer(userId: string, dto: ApplyAsFarmerDto) {
    const user = await this.findById(userId);

    // Check if user is already a farmer
    if (user.role === UserRole.FARMER) {
      throw new ConflictException('You are already a farmer');
    }

    // Check if user already has a pending application
    const existingApplication = await this.farmerProfileRepository.findOne({
      where: { userId },
    });

    if (existingApplication) {
      if (existingApplication.applicationStatus === FarmerApplicationStatus.PENDING) {
        throw new ConflictException('You already have a pending application');
      }
      if (existingApplication.applicationStatus === FarmerApplicationStatus.APPROVED) {
        throw new ConflictException('Your application has already been approved');
      }
      // If rejected, allow reapplication by updating existing profile
      existingApplication.farmName = dto.farmName;
      existingApplication.farmAddress = `${dto.farmAddress}, ${dto.farmCity}, ${dto.farmState}`;
      existingApplication.primaryProducts = dto.categories.join(', ');
      existingApplication.bankName = dto.bankName;
      existingApplication.bankAccountNumber = dto.accountNumber;
      existingApplication.bankAccountName = dto.accountName;
      existingApplication.farmType = dto.farmType || '';
      existingApplication.farmSize = dto.farmSize || '';
      existingApplication.yearsOfExperience = dto.yearsOfExperience || '';
      existingApplication.hasTransportation = dto.hasTransportation || false;
      existingApplication.applicationStatus = FarmerApplicationStatus.PENDING;
      existingApplication.rejectionReason = '';

      await this.farmerProfileRepository.save(existingApplication);

      this.logger.log(`User ${userId} reapplied to become a farmer`);

      // Notify admins
      this.notificationsGateway.sendToAdmins({
        type: 'farmer_application_resubmitted',
        userId,
        userName: user.name,
        farmName: dto.farmName,
        message: `📝 ${user.name} has resubmitted their farmer application`,
      });

      return {
        success: true,
        message: 'Your application has been resubmitted for review',
        applicationId: existingApplication.id,
        status: FarmerApplicationStatus.PENDING,
      };
    }

    // Create new farmer profile with pending status
    const farmerProfile = this.farmerProfileRepository.create({
      userId,
      farmName: dto.farmName,
      farmAddress: `${dto.farmAddress}, ${dto.farmCity}, ${dto.farmState}`,
      primaryProducts: dto.categories.join(', '),
      bankName: dto.bankName,
      bankAccountNumber: dto.accountNumber,
      bankAccountName: dto.accountName,
      farmType: dto.farmType || '',
      farmSize: dto.farmSize || '',
      yearsOfExperience: dto.yearsOfExperience || '',
      hasTransportation: dto.hasTransportation || false,
      applicationStatus: FarmerApplicationStatus.PENDING,
    } as Partial<FarmerProfile>);

    const savedProfile = await this.farmerProfileRepository.save(farmerProfile);

    this.logger.log(`User ${userId} applied to become a farmer`);

    // Notify user via push
    await this.notificationsService.sendPushNotification({
      userId,
      type: NotificationType.GENERAL,
      title: 'Application Received',
      body: 'Your farmer application has been submitted. We\'ll review it within 24-48 hours.',
    });

    // Notify admins
    this.notificationsGateway.sendToAdmins({
      type: 'new_farmer_application',
      userId,
      userName: user.name,
      farmName: dto.farmName,
      categories: dto.categories,
      message: `🌱 New farmer application from ${user.name} (${dto.farmName})`,
    });

    return {
      success: true,
      message: 'Your application has been submitted for review',
      applicationId: savedProfile.id,
      status: FarmerApplicationStatus.PENDING,
    };
  }

  /**
   * Get farmer application status
   */
  async getFarmerApplicationStatus(userId: string) {
    const profile = await this.farmerProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      return {
        hasApplied: false,
        status: null,
      };
    }

    return {
      hasApplied: true,
      status: profile.applicationStatus,
      farmName: profile.farmName,
      rejectionReason: profile.rejectionReason,
      appliedAt: profile.createdAt,
      approvedAt: profile.approvedAt,
    };
  }

  // ==================== ACCOUNT DELETION METHODS ====================

  /**
   * Request account deletion
   */
  async requestAccountDeletion(userId: string, dto: RequestAccountDeletionDto) {
    const user = await this.findById(userId);

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenException('Invalid password');
    }

    // Check if there's already a pending request
    const existingRequest = await this.deletionRequestRepository.findOne({
      where: {
        userId,
        status: DeletionRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new ConflictException('You already have a pending deletion request');
    }

    // Create user data snapshot for record keeping
    const userDataSnapshot = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      state: user.state,
      city: user.city,
      createdAt: user.createdAt,
    };

    // Create deletion request
    const deletionRequest = this.deletionRequestRepository.create({
      userId,
      reason: dto.reason,
      additionalDetails: dto.additionalDetails,
      status: DeletionRequestStatus.PENDING,
      userDataSnapshot,
    });

    await this.deletionRequestRepository.save(deletionRequest);

    this.logger.log(`Account deletion request created for user ${userId}`);

    // Notify admins
    this.notificationsGateway.sendToAdmins({
      event: 'new_deletion_request',
      requestId: deletionRequest.id,
      userId,
      userName: user.name,
      reason: dto.reason,
      message: `🗑️ Account deletion request from ${user.name}`,
    });

    return {
      success: true,
      message: 'Your account deletion request has been submitted for review',
      requestId: deletionRequest.id,
      status: DeletionRequestStatus.PENDING,
    };
  }

  /**
   * Get user's deletion request status
   */
  async getDeletionRequestStatus(userId: string) {
    const request = await this.deletionRequestRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!request) {
      return {
        hasRequest: false,
        status: null,
      };
    }

    return {
      hasRequest: true,
      requestId: request.id,
      status: request.status,
      reason: request.reason,
      additionalDetails: request.additionalDetails,
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt,
      scheduledDeletionDate: request.scheduledDeletionDate,
    };
  }

  /**
   * Cancel deletion request
   */
  async cancelDeletionRequest(userId: string, requestId: string) {
    const request = await this.deletionRequestRepository.findOne({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }

    if (request.status !== DeletionRequestStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending requests');
    }

    await this.deletionRequestRepository.remove(request);

    return {
      success: true,
      message: 'Deletion request cancelled successfully',
    };
  }

  // ==================== ADMIN ACCOUNT DELETION METHODS ====================

  /**
   * Get all deletion requests (Admin)
   */
  async getAllDeletionRequests(
    page = 1,
    limit = 20,
    status?: DeletionRequestStatus,
  ) {
    const query = this.deletionRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.reviewer', 'reviewer')
      .orderBy('request.createdAt', 'DESC');

    if (status) {
      query.where('request.status = :status', { status });
    }

    const [requests, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      requests,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Review deletion request (Admin)
   */
  async reviewDeletionRequest(
    requestId: string,
    adminId: string,
    dto: ReviewDeletionRequestDto,
  ) {
    const request = await this.deletionRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }

    if (request.status !== DeletionRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been reviewed');
    }

    if (dto.approve) {
      // Approve the request
      request.status = DeletionRequestStatus.APPROVED;
      request.reviewedBy = adminId;
      request.reviewedAt = new Date();
      if (dto.adminNotes) {
        request.adminNotes = dto.adminNotes;
      }
      // Schedule deletion for 7 days from now (grace period)
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 7);
      request.scheduledDeletionDate = scheduledDate;

      await this.deletionRequestRepository.save(request);

      // Notify user
      if (request.user) {
        await this.notificationsService.sendPushNotification({
          userId: request.userId,
          title: 'Account Deletion Approved',
          body: `Your account deletion request has been approved. Your account will be deleted on ${scheduledDate.toLocaleDateString()}.`,
          type: NotificationType.GENERAL,
          data: { requestId: request.id },
        });
      }

      this.logger.log(`Deletion request ${requestId} approved by admin ${adminId}`);

      return {
        success: true,
        message: 'Deletion request approved',
        scheduledDeletionDate: scheduledDate,
      };
    } else {
      // Reject the request
      if (!dto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }

      request.status = DeletionRequestStatus.REJECTED;
      request.reviewedBy = adminId;
      request.reviewedAt = new Date();
      if (dto.adminNotes) {
        request.adminNotes = dto.adminNotes;
      }
      request.rejectionReason = dto.rejectionReason;

      await this.deletionRequestRepository.save(request);

      // Notify user
      if (request.user) {
        await this.notificationsService.sendPushNotification({
          userId: request.userId,
          title: 'Account Deletion Request Rejected',
          body: `Your account deletion request has been rejected. Reason: ${dto.rejectionReason}`,
          type: NotificationType.GENERAL,
          data: { requestId: request.id },
        });
      }

      this.logger.log(`Deletion request ${requestId} rejected by admin ${adminId}`);

      return {
        success: true,
        message: 'Deletion request rejected',
        rejectionReason: dto.rejectionReason,
      };
    }
  }

  /**
   * Complete account deletion (Admin - after grace period)
   */
  async completeAccountDeletion(requestId: string, adminId: string) {
    const request = await this.deletionRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }

    if (request.status !== DeletionRequestStatus.APPROVED) {
      throw new BadRequestException('Request must be approved before completing deletion');
    }

    // Soft delete the user (deactivate)
    if (request.user) {
      request.user.isActive = false;
      request.user.email = `deleted_${request.userId}@deleted.handwork`;
      request.user.phone = `deleted_${request.userId}`;
      request.user.name = 'Deleted User';
      await this.userRepository.save(request.user);
    }

    // Update request status
    request.status = DeletionRequestStatus.COMPLETED;
    request.deletedAt = new Date();
    await this.deletionRequestRepository.save(request);

    this.logger.log(`Account deletion completed for user ${request.userId} by admin ${adminId}`);

    return {
      success: true,
      message: 'Account deletion completed',
      deletedAt: request.deletedAt,
    };
  }

  /**
   * Get deletion request statistics (Admin)
   */
  async getDeletionRequestStats() {
    const [pending, approved, rejected, completed] = await Promise.all([
      this.deletionRequestRepository.count({ where: { status: DeletionRequestStatus.PENDING } }),
      this.deletionRequestRepository.count({ where: { status: DeletionRequestStatus.APPROVED } }),
      this.deletionRequestRepository.count({ where: { status: DeletionRequestStatus.REJECTED } }),
      this.deletionRequestRepository.count({ where: { status: DeletionRequestStatus.COMPLETED } }),
    ]);

    // Get reason breakdown
    const reasonBreakdown = await this.deletionRequestRepository
      .createQueryBuilder('request')
      .select('request.reason', 'reason')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.reason')
      .getRawMany();

    return {
      total: pending + approved + rejected + completed,
      pending,
      approved,
      rejected,
      completed,
      reasonBreakdown,
    };
  }

  // ==================== FREE DELIVERY PROMO ====================

  /**
   * Check if user has claimed free delivery promo
   */
  async getFreeDeliveryPromoStatus(userId: string) {
    const user = await this.findById(userId);
    return {
      hasClaimed: user.hasClaimedFreeDeliveryPromo,
      claimedAt: user.freeDeliveryClaimedAt,
      ordersRemaining: user.freeDeliveryOrdersRemaining,
      isEligible: !user.hasClaimedFreeDeliveryPromo,
    };
  }

  /**
   * Claim free delivery promo for new users
   */
  async claimFreeDeliveryPromo(userId: string) {
    const user = await this.findById(userId);

    if (user.hasClaimedFreeDeliveryPromo) {
      throw new BadRequestException('You have already claimed the free delivery promo');
    }

    // Check if user has any completed orders (they should be new)
    const orderCount = await this.userRepository.manager
      .createQueryBuilder()
      .from('orders', 'o')
      .where('o."buyerId" = :userId', { userId })
      .andWhere('o.status NOT IN (:...statuses)', { statuses: ['cancelled', 'refunded'] })
      .getCount();

    if (orderCount > 0) {
      throw new BadRequestException('This promo is only available for new users with no previous orders');
    }

    user.hasClaimedFreeDeliveryPromo = true;
    user.freeDeliveryClaimedAt = new Date();
    user.freeDeliveryOrdersRemaining = 3;

    await this.userRepository.save(user);

    this.logger.log(`User ${userId} claimed free delivery promo`);

    return {
      success: true,
      message: 'Free delivery promo claimed successfully! You get free delivery on your next 3 orders.',
      ordersRemaining: 3,
      claimedAt: user.freeDeliveryClaimedAt,
    };
  }

  /**
   * Use one free delivery (called when order is placed)
   */
  async useFreeDelivery(userId: string): Promise<boolean> {
    const user = await this.findById(userId);

    if (!user.hasClaimedFreeDeliveryPromo || user.freeDeliveryOrdersRemaining <= 0) {
      return false;
    }

    user.freeDeliveryOrdersRemaining -= 1;
    await this.userRepository.save(user);

    this.logger.log(`User ${userId} used free delivery. Remaining: ${user.freeDeliveryOrdersRemaining}`);

    return true;
  }

  /**
   * Get all users who claimed free delivery promo (Admin)
   */
  async getFreeDeliveryPromoUsers(page = 1, limit = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      where: { hasClaimedFreeDeliveryPromo: true },
      select: ['id', 'name', 'email', 'phone', 'freeDeliveryClaimedAt', 'freeDeliveryOrdersRemaining', 'createdAt'],
      order: { freeDeliveryClaimedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get free delivery promo statistics (Admin)
   */
  async getFreeDeliveryPromoStats() {
    const [totalClaimed, fullyUsed, partiallyUsed, unused] = await Promise.all([
      this.userRepository.count({ where: { hasClaimedFreeDeliveryPromo: true } }),
      this.userRepository.count({ where: { hasClaimedFreeDeliveryPromo: true, freeDeliveryOrdersRemaining: 0 } }),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.hasClaimedFreeDeliveryPromo = :claimed', { claimed: true })
        .andWhere('user.freeDeliveryOrdersRemaining > 0')
        .andWhere('user.freeDeliveryOrdersRemaining < 3')
        .getCount(),
      this.userRepository.count({ where: { hasClaimedFreeDeliveryPromo: true, freeDeliveryOrdersRemaining: 3 } }),
    ]);

    // Total free deliveries given
    const totalFreeDeliveries = (totalClaimed * 3) - await this.userRepository
      .createQueryBuilder('user')
      .select('SUM(user.freeDeliveryOrdersRemaining)', 'remaining')
      .where('user.hasClaimedFreeDeliveryPromo = :claimed', { claimed: true })
      .getRawOne()
      .then(r => parseInt(r?.remaining || '0'));

    return {
      totalClaimed,
      fullyUsed,
      partiallyUsed,
      unused,
      totalFreeDeliveriesUsed: totalFreeDeliveries,
      totalFreeDeliveriesRemaining: (totalClaimed * 3) - totalFreeDeliveries,
    };
  }
}
