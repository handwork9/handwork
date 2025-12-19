import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, LessThan } from 'typeorm';
import {
  LoyaltyAccount,
  PointTransaction,
  Reward,
  RewardRedemption,
  LoyaltyTier,
  PointTransactionType,
  PointSource,
} from '../database/entities/loyalty-points.entity';
import { User } from '../database/entities/user.entity';
import { PaginatedResponseDto } from '../common/dto';
import {
  EarnPointsDto,
  CreateRewardDto,
  UpdateRewardDto,
  PointsHistoryQueryDto,
} from './dto';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  // Points configuration
  private readonly POINTS_PER_NAIRA = 0.01; // 1 point per ₦100
  private readonly REFERRAL_POINTS = 200;
  private readonly RATING_POINTS = 10;
  private readonly DAILY_CHECKIN_POINTS = 5;
  private readonly CHECKIN_STREAK_BONUS = 50;
  private readonly PROFILE_COMPLETION_POINTS = 50;
  private readonly SHARE_PRODUCT_POINTS = 5;
  private readonly FIRST_ORDER_BONUS = 200;
  private readonly WEEKLY_STREAK_BONUS = 100;
  private readonly BIRTHDAY_BONUS = 500;
  private readonly MAX_DAILY_SHARES = 10;

  // Tier thresholds
  private readonly TIER_THRESHOLDS = {
    [LoyaltyTier.BRONZE]: 0,
    [LoyaltyTier.SILVER]: 500,
    [LoyaltyTier.GOLD]: 2000,
    [LoyaltyTier.PLATINUM]: 5000,
  };

  // Tier multipliers
  private readonly TIER_MULTIPLIERS = {
    [LoyaltyTier.BRONZE]: 1,
    [LoyaltyTier.SILVER]: 1.25,
    [LoyaltyTier.GOLD]: 1.5,
    [LoyaltyTier.PLATINUM]: 2,
  };

  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly loyaltyAccountRepository: Repository<LoyaltyAccount>,
    @InjectRepository(PointTransaction)
    private readonly pointTransactionRepository: Repository<PointTransaction>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(RewardRedemption)
    private readonly redemptionRepository: Repository<RewardRedemption>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get or create loyalty account for a user
   */
  async getOrCreateLoyaltyAccount(userId: string): Promise<LoyaltyAccount> {
    let account = await this.loyaltyAccountRepository.findOne({
      where: { userId },
    });

    if (!account) {
      account = this.loyaltyAccountRepository.create({
        userId,
        currentPoints: 0,
        lifetimePoints: 0,
        redeemedPoints: 0,
        tier: LoyaltyTier.BRONZE,
      });
      await this.loyaltyAccountRepository.save(account);
    }

    return account;
  }

  /**
   * Get user's rewards summary
   */
  async getRewardsSummary(userId: string) {
    const account = await this.getOrCreateLoyaltyAccount(userId);
    
    // Get available rewards for user's tier
    const availableRewards = await this.getAvailableRewards(userId);
    
    // Get recent transactions
    const recentTransactions = await this.pointTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Calculate next tier
    const nextTier = this.getNextTier(account.tier);
    const pointsToNextTier = nextTier 
      ? this.TIER_THRESHOLDS[nextTier] - account.lifetimePoints 
      : 0;

    // Get tier progress percentage
    const currentTierThreshold = this.TIER_THRESHOLDS[account.tier];
    const nextTierThreshold = nextTier ? this.TIER_THRESHOLDS[nextTier] : account.lifetimePoints;
    const tierProgress = nextTier
      ? ((account.lifetimePoints - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100
      : 100;

    return {
      currentPoints: account.currentPoints,
      lifetimePoints: account.lifetimePoints,
      redeemedPoints: account.redeemedPoints,
      tier: account.tier,
      tierMultiplier: this.TIER_MULTIPLIERS[account.tier],
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      tierProgress: Math.min(100, Math.max(0, tierProgress)),
      currentStreak: account.currentStreak,
      availableRewardsCount: availableRewards.length,
      recentTransactions,
      earnMethods: this.getEarnMethods(),
    };
  }

  /**
   * Earn points for a user
   */
  async earnPoints(userId: string, dto: EarnPointsDto): Promise<PointTransaction> {
    const account = await this.getOrCreateLoyaltyAccount(userId);
    
    // Apply tier multiplier for purchases
    let points = dto.points;
    if (dto.source === PointSource.PURCHASE) {
      points = Math.floor(points * this.TIER_MULTIPLIERS[account.tier]);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const balanceBefore = account.currentPoints;
      const balanceAfter = balanceBefore + points;

      // Create transaction
      const transaction = this.pointTransactionRepository.create({
        userId,
        loyaltyAccountId: account.id,
        type: PointTransactionType.EARNED,
        source: dto.source,
        points,
        balanceBefore,
        balanceAfter,
        description: dto.description || this.getDefaultDescription(dto.source, points),
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
        metadata: dto.metadata,
      });

      await queryRunner.manager.save(transaction);

      // Update account
      account.currentPoints = balanceAfter;
      account.lifetimePoints += points;
      
      // Check for tier upgrade
      const newTier = this.calculateTier(account.lifetimePoints);
      if (newTier !== account.tier) {
        account.tier = newTier;
        this.logger.log(`User ${userId} upgraded to ${newTier} tier`);
      }

      await queryRunner.manager.save(account);
      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process purchase points
   */
  async processPurchasePoints(userId: string, orderAmount: number, orderId: string): Promise<PointTransaction | null> {
    const points = Math.floor(orderAmount * this.POINTS_PER_NAIRA);
    if (points < 1) return null;

    const account = await this.getOrCreateLoyaltyAccount(userId);

    // Check for first order bonus
    if (!account.firstOrderBonusEarned) {
      await this.earnPoints(userId, {
        source: PointSource.FIRST_ORDER,
        points: this.FIRST_ORDER_BONUS,
        description: 'First order bonus! Welcome to Handwork Rewards',
        referenceId: orderId,
        referenceType: 'order',
      });
      account.firstOrderBonusEarned = true;
      await this.loyaltyAccountRepository.save(account);
    }

    // Check weekly streak
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    if (account.lastOrderDate && account.lastOrderDate > oneWeekAgo) {
      account.weeklyOrderStreak += 1;
      if (account.weeklyOrderStreak >= 4) {
        await this.earnPoints(userId, {
          source: PointSource.WEEKLY_STREAK,
          points: this.WEEKLY_STREAK_BONUS,
          description: 'Weekly ordering streak bonus!',
          referenceId: orderId,
          referenceType: 'order',
        });
        account.weeklyOrderStreak = 0;
      }
    } else {
      account.weeklyOrderStreak = 1;
    }
    
    account.lastOrderDate = now;
    await this.loyaltyAccountRepository.save(account);

    return this.earnPoints(userId, {
      source: PointSource.PURCHASE,
      points,
      description: `Points earned from order`,
      referenceId: orderId,
      referenceType: 'order',
    });
  }

  /**
   * Daily check-in
   */
  async dailyCheckIn(userId: string): Promise<{ points: number; streak: number; bonusEarned: boolean }> {
    this.logger.log(`Daily check-in started for user ${userId}`);
    let account = await this.getOrCreateLoyaltyAccount(userId);
    this.logger.log(`Account before check-in: currentPoints=${account.currentPoints}, streak=${account.currentStreak}, lastCheckIn=${account.lastCheckIn}`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if already checked in today
    if (account.lastCheckIn) {
      this.logger.log(`Last check-in was: ${account.lastCheckIn}`);
      const lastCheckInDate = new Date(
        account.lastCheckIn.getFullYear(),
        account.lastCheckIn.getMonth(),
        account.lastCheckIn.getDate(),
      );
      
      if (lastCheckInDate.getTime() === today.getTime()) {
        this.logger.log('Already checked in today - throwing error');
        throw new BadRequestException('Already checked in today');
      }

      // Check if streak continues (checked in yesterday)
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      if (lastCheckInDate.getTime() === yesterday.getTime()) {
        account.currentStreak += 1;
      } else {
        account.currentStreak = 1;
      }
    } else {
      account.currentStreak = 1;
    }

    // Update longest streak
    if (account.currentStreak > account.longestStreak) {
      account.longestStreak = account.currentStreak;
    }

    // Save streak and lastCheckIn FIRST before earnPoints
    account.lastCheckIn = now;
    try {
      await this.loyaltyAccountRepository.save(account);
      this.logger.log(`Saved streak/lastCheckIn successfully`);
    } catch (error) {
      this.logger.error(`Failed to save account: ${error.message}`);
      throw error;
    }

    this.logger.log(`Calling earnPoints with ${this.DAILY_CHECKIN_POINTS} points`);

    // Award points (this will fetch fresh account and update points)
    try {
      const transaction = await this.earnPoints(userId, {
        source: PointSource.DAILY_CHECKIN,
        points: this.DAILY_CHECKIN_POINTS,
        description: `Daily check-in (Day ${account.currentStreak})`,
      });
      this.logger.log(`earnPoints completed. Transaction: balanceAfter=${transaction.balanceAfter}`);
    } catch (error) {
      this.logger.error(`earnPoints failed: ${error.message}`);
      throw error;
    }

    // Check for 7-day streak bonus
    let bonusEarned = false;
    if (account.currentStreak === 7) {
      await this.earnPoints(userId, {
        source: PointSource.DAILY_CHECKIN,
        points: this.CHECKIN_STREAK_BONUS,
        description: '7-day streak bonus!',
      });
      bonusEarned = true;
      // Refresh account and reset streak
      account = await this.getOrCreateLoyaltyAccount(userId);
      account.currentStreak = 0;
      await this.loyaltyAccountRepository.save(account);
    }

    // Fetch final account state
    const finalAccount = await this.getOrCreateLoyaltyAccount(userId);
    this.logger.log(`Final account state: currentPoints=${finalAccount.currentPoints}, lifetimePoints=${finalAccount.lifetimePoints}`);

    return {
      points: this.DAILY_CHECKIN_POINTS + (bonusEarned ? this.CHECKIN_STREAK_BONUS : 0),
      streak: account.currentStreak,
      bonusEarned,
    };
  }

  /**
   * Process referral points
   */
  async processReferralPoints(referrerId: string, referredUserId: string): Promise<PointTransaction> {
    return this.earnPoints(referrerId, {
      source: PointSource.REFERRAL,
      points: this.REFERRAL_POINTS,
      description: 'Referral bonus - friend completed first order',
      referenceId: referredUserId,
      referenceType: 'user',
    });
  }

  /**
   * Process rating points
   */
  async processRatingPoints(userId: string, orderId: string): Promise<PointTransaction> {
    return this.earnPoints(userId, {
      source: PointSource.RATING,
      points: this.RATING_POINTS,
      description: 'Points for rating your order',
      referenceId: orderId,
      referenceType: 'order',
    });
  }

  /**
   * Process product share points
   */
  async processSharePoints(userId: string, productId: string): Promise<PointTransaction | null> {
    // Check daily share limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayShares = await this.pointTransactionRepository.count({
      where: {
        userId,
        source: PointSource.SHARE_PRODUCT,
        createdAt: MoreThan(today),
      },
    });

    if (todayShares >= this.MAX_DAILY_SHARES) {
      return null; // Limit reached
    }

    return this.earnPoints(userId, {
      source: PointSource.SHARE_PRODUCT,
      points: this.SHARE_PRODUCT_POINTS,
      description: 'Points for sharing a product',
      referenceId: productId,
      referenceType: 'product',
    });
  }

  /**
   * Award profile completion points
   */
  async processProfileCompletionPoints(userId: string): Promise<PointTransaction | null> {
    const account = await this.getOrCreateLoyaltyAccount(userId);
    
    if (account.profileCompleted) {
      return null; // Already earned
    }

    account.profileCompleted = true;
    await this.loyaltyAccountRepository.save(account);

    return this.earnPoints(userId, {
      source: PointSource.PROFILE_COMPLETION,
      points: this.PROFILE_COMPLETION_POINTS,
      description: 'Profile completion bonus',
    });
  }

  /**
   * Get available rewards
   */
  async getAvailableRewards(userId: string): Promise<Reward[]> {
    const account = await this.getOrCreateLoyaltyAccount(userId);
    const now = new Date();

    const rewards = await this.rewardRepository.find({
      where: {
        isActive: true,
      },
      order: { pointsCost: 'ASC' },
    });

    // Filter by tier, stock, and dates
    return rewards.filter(reward => {
      if (reward.requiredTier) {
        const tierOrder = [LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD, LoyaltyTier.PLATINUM];
        if (tierOrder.indexOf(account.tier) < tierOrder.indexOf(reward.requiredTier)) {
          return false;
        }
      }
      if (reward.stock === 0) return false;
      if (reward.startsAt && reward.startsAt > now) return false;
      if (reward.expiresAt && reward.expiresAt < now) return false;
      return true;
    });
  }

  /**
   * Redeem a reward
   */
  async redeemReward(userId: string, rewardId: string): Promise<RewardRedemption> {
    const account = await this.getOrCreateLoyaltyAccount(userId);
    const reward = await this.rewardRepository.findOne({ where: { id: rewardId } });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    if (!reward.isActive) {
      throw new BadRequestException('This reward is no longer available');
    }

    if (account.currentPoints < reward.pointsCost) {
      throw new BadRequestException('Insufficient points');
    }

    // Check tier requirement
    if (reward.requiredTier) {
      const tierOrder = [LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD, LoyaltyTier.PLATINUM];
      if (tierOrder.indexOf(account.tier) < tierOrder.indexOf(reward.requiredTier)) {
        throw new BadRequestException(`This reward requires ${reward.requiredTier} tier`);
      }
    }

    // Check stock
    if (reward.stock === 0) {
      throw new BadRequestException('This reward is out of stock');
    }

    // Check user's redemption limit
    const userRedemptions = await this.redemptionRepository.count({
      where: { userId, rewardId },
    });
    if (userRedemptions >= reward.maxPerUser) {
      throw new BadRequestException('You have reached the maximum redemptions for this reward');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Deduct points
      const balanceBefore = account.currentPoints;
      const balanceAfter = balanceBefore - reward.pointsCost;

      const transaction = this.pointTransactionRepository.create({
        userId,
        loyaltyAccountId: account.id,
        type: PointTransactionType.REDEEMED,
        source: PointSource.REDEMPTION,
        points: -reward.pointsCost,
        balanceBefore,
        balanceAfter,
        description: `Redeemed: ${reward.name}`,
        referenceId: rewardId,
        referenceType: 'reward',
      });

      await queryRunner.manager.save(transaction);

      // Update account
      account.currentPoints = balanceAfter;
      account.redeemedPoints += reward.pointsCost;
      await queryRunner.manager.save(account);

      // Update reward stock
      if (reward.stock > 0) {
        reward.stock -= 1;
      }
      reward.redeemCount += 1;
      await queryRunner.manager.save(reward);

      // Create redemption
      const redemptionCode = this.generateRedemptionCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

      const redemption = this.redemptionRepository.create({
        userId,
        rewardId,
        pointsSpent: reward.pointsCost,
        status: 'pending',
        redemptionCode,
        expiresAt,
      });

      await queryRunner.manager.save(redemption);
      await queryRunner.commitTransaction();

      return redemption;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get points history
   */
  async getPointsHistory(userId: string, query: PointsHistoryQueryDto): Promise<PaginatedResponseDto<PointTransaction>> {
    const { page = 1, limit = 20, source, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (source) where.source = source;
    if (type === 'earned') where.type = PointTransactionType.EARNED;
    if (type === 'redeemed') where.type = PointTransactionType.REDEEMED;

    const [transactions, total] = await this.pointTransactionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return new PaginatedResponseDto(transactions, total, page, limit);
  }

  /**
   * Get user redemptions
   */
  async getUserRedemptions(userId: string): Promise<RewardRedemption[]> {
    return this.redemptionRepository.find({
      where: { userId },
      relations: ['reward'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Admin: Create reward
   */
  async createReward(dto: CreateRewardDto): Promise<Reward> {
    const reward = this.rewardRepository.create(dto);
    return this.rewardRepository.save(reward);
  }

  /**
   * Admin: Update reward
   */
  async updateReward(id: string, dto: UpdateRewardDto): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    Object.assign(reward, dto);
    return this.rewardRepository.save(reward);
  }

  /**
   * Admin: Delete reward
   */
  async deleteReward(id: string): Promise<void> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    await this.rewardRepository.remove(reward);
  }

  /**
   * Admin: Get all rewards
   */
  async getAllRewards(): Promise<Reward[]> {
    return this.rewardRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Admin: Adjust user points
   */
  async adjustPoints(adminId: string, userId: string, points: number, reason: string): Promise<PointTransaction> {
    const account = await this.getOrCreateLoyaltyAccount(userId);

    const balanceBefore = account.currentPoints;
    const balanceAfter = Math.max(0, balanceBefore + points);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = this.pointTransactionRepository.create({
        userId,
        loyaltyAccountId: account.id,
        type: points > 0 ? PointTransactionType.BONUS : PointTransactionType.ADJUSTED,
        source: PointSource.ADMIN_ADJUSTMENT,
        points,
        balanceBefore,
        balanceAfter,
        description: reason,
        metadata: { adjustedBy: adminId },
      });

      await queryRunner.manager.save(transaction);

      account.currentPoints = balanceAfter;
      if (points > 0) {
        account.lifetimePoints += points;
        // Check tier upgrade
        const newTier = this.calculateTier(account.lifetimePoints);
        if (newTier !== account.tier) {
          account.tier = newTier;
        }
      }

      await queryRunner.manager.save(account);
      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Admin: Get rewards statistics
   */
  async getRewardsStats() {
    const totalUsers = await this.loyaltyAccountRepository.count();
    const totalPointsIssued = await this.loyaltyAccountRepository
      .createQueryBuilder('account')
      .select('SUM(account.lifetimePoints)', 'total')
      .getRawOne();
    const totalPointsRedeemed = await this.loyaltyAccountRepository
      .createQueryBuilder('account')
      .select('SUM(account.redeemedPoints)', 'total')
      .getRawOne();
    const totalRedemptions = await this.redemptionRepository.count();

    const tierBreakdown = await this.loyaltyAccountRepository
      .createQueryBuilder('account')
      .select('account.tier', 'tier')
      .addSelect('COUNT(*)', 'count')
      .groupBy('account.tier')
      .getRawMany();

    return {
      totalUsers,
      totalPointsIssued: parseInt(totalPointsIssued?.total || '0'),
      totalPointsRedeemed: parseInt(totalPointsRedeemed?.total || '0'),
      totalRedemptions,
      tierBreakdown,
    };
  }

  // Helper methods
  private calculateTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= this.TIER_THRESHOLDS[LoyaltyTier.PLATINUM]) return LoyaltyTier.PLATINUM;
    if (lifetimePoints >= this.TIER_THRESHOLDS[LoyaltyTier.GOLD]) return LoyaltyTier.GOLD;
    if (lifetimePoints >= this.TIER_THRESHOLDS[LoyaltyTier.SILVER]) return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }

  private getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
    const tierOrder = [LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD, LoyaltyTier.PLATINUM];
    const currentIndex = tierOrder.indexOf(currentTier);
    return currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
  }

  private getDefaultDescription(source: PointSource, points: number): string {
    const descriptions: Record<PointSource, string> = {
      [PointSource.PURCHASE]: `Earned ${points} points from purchase`,
      [PointSource.REFERRAL]: 'Referral bonus',
      [PointSource.RATING]: 'Points for rating order',
      [PointSource.DAILY_CHECKIN]: 'Daily check-in bonus',
      [PointSource.PROFILE_COMPLETION]: 'Profile completion bonus',
      [PointSource.SHARE_PRODUCT]: 'Product share bonus',
      [PointSource.FIRST_ORDER]: 'First order bonus',
      [PointSource.WEEKLY_STREAK]: 'Weekly ordering streak bonus',
      [PointSource.BIRTHDAY]: 'Birthday bonus',
      [PointSource.PROMOTION]: 'Promotional bonus',
      [PointSource.REDEMPTION]: 'Reward redemption',
      [PointSource.ADMIN_ADJUSTMENT]: 'Admin adjustment',
    };
    return descriptions[source] || 'Points transaction';
  }

  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'RWD-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private getEarnMethods() {
    return [
      {
        id: 'purchase',
        icon: 'cart-outline',
        title: 'Make Purchases',
        description: 'Earn points every time you shop',
        points: '1 point per ₦100',
        details: 'Points are credited after successful delivery',
      },
      {
        id: 'referral',
        icon: 'people-outline',
        title: 'Refer Friends',
        description: 'Invite friends to join Handwork',
        points: `${this.REFERRAL_POINTS} points per referral`,
        details: 'Earn when your friend completes their first order',
      },
      {
        id: 'rating',
        icon: 'star-outline',
        title: 'Rate Orders',
        description: 'Share your feedback on orders',
        points: `${this.RATING_POINTS} points per rating`,
        details: 'Rate within 7 days of delivery to earn',
      },
      {
        id: 'checkin',
        icon: 'calendar-outline',
        title: 'Daily Check-in',
        description: 'Open the app and check in daily',
        points: `${this.DAILY_CHECKIN_POINTS} points daily`,
        details: `7-day streak bonus: Extra ${this.CHECKIN_STREAK_BONUS} points`,
      },
      {
        id: 'profile',
        icon: 'checkmark-circle-outline',
        title: 'Complete Profile',
        description: 'Fill in all your profile details',
        points: `${this.PROFILE_COMPLETION_POINTS} points one-time`,
        details: 'Add photo, phone, address to earn',
      },
      {
        id: 'share',
        icon: 'share-social-outline',
        title: 'Share Products',
        description: 'Share products with friends',
        points: `${this.SHARE_PRODUCT_POINTS} points per share`,
        details: `Maximum ${this.MAX_DAILY_SHARES} shares per day`,
      },
    ];
  }
}
