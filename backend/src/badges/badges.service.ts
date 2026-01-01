import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FarmerBadge, BadgeType, BADGE_INFO } from '../database/entities/farmer-badge.entity';
import { User } from '../database/entities/user.entity';
import { Order } from '../database/entities/order.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';
import { Product } from '../database/entities/product.entity';
import { Review, ReviewType } from '../database/entities/review.entity';
import { FarmerApplicationStatus, OrderStatus, UserRole } from '../common/enums';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectRepository(FarmerBadge)
    private readonly badgeRepository: Repository<FarmerBadge>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepository: Repository<FarmerProfile>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  /**
   * Get farmer's badges
   */
  async getFarmerBadges(farmerId: string) {
    const badges = await this.badgeRepository.find({
      where: { farmerId },
      order: { earnedAt: 'DESC' },
    });

    return badges.map(badge => ({
      id: badge.id,
      type: badge.badgeType,
      ...BADGE_INFO[badge.badgeType],
      earnedAt: badge.earnedAt,
      isDisplayed: badge.isDisplayed,
    }));
  }

  /**
   * Get all available badges with progress
   */
  async getBadgesWithProgress(farmerId: string) {
    const earnedBadges = await this.badgeRepository.find({
      where: { farmerId },
    });
    const earnedTypes = new Set(earnedBadges.map(b => b.badgeType));

    // Get farmer stats
    const stats = await this.getFarmerStats(farmerId);

    const allBadges = Object.entries(BADGE_INFO).map(([type, info]) => {
      const earned = earnedTypes.has(type as BadgeType);
      const progress = this.calculateProgress(type as BadgeType, stats, earned);

      return {
        type,
        ...info,
        earned,
        progress,
        earnedAt: earnedBadges.find(b => b.badgeType === type)?.earnedAt || null,
      };
    });

    return {
      earned: allBadges.filter(b => b.earned),
      available: allBadges.filter(b => !b.earned),
      totalPoints: earnedBadges.reduce((sum, b) => sum + BADGE_INFO[b.badgeType].points, 0),
    };
  }

  /**
   * Award a badge to farmer
   */
  async awardBadge(farmerId: string, badgeType: BadgeType): Promise<FarmerBadge | null> {
    // Check if already has badge
    const existing = await this.badgeRepository.findOne({
      where: { farmerId, badgeType },
    });

    if (existing) {
      return null;
    }

    const badge = this.badgeRepository.create({
      farmerId,
      badgeType,
      earnedAt: new Date(),
    });

    const saved = await this.badgeRepository.save(badge);
    this.logger.log(`Badge ${badgeType} awarded to farmer ${farmerId}`);
    return saved;
  }

  /**
   * Toggle badge display
   */
  async toggleBadgeDisplay(farmerId: string, badgeId: string, display: boolean) {
    const badge = await this.badgeRepository.findOne({
      where: { id: badgeId, farmerId },
    });

    if (!badge) {
      return null;
    }

    badge.isDisplayed = display;
    return this.badgeRepository.save(badge);
  }

  /**
   * Check and award badges for a farmer
   */
  async checkAndAwardBadges(farmerId: string): Promise<FarmerBadge[]> {
    const stats = await this.getFarmerStats(farmerId);
    const awardedBadges: FarmerBadge[] = [];

    // Sales badges
    if (stats.totalSales >= 1) {
      const badge = await this.awardBadge(farmerId, BadgeType.FIRST_SALE);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.totalSales >= 10) {
      const badge = await this.awardBadge(farmerId, BadgeType.SALES_10);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.totalSales >= 50) {
      const badge = await this.awardBadge(farmerId, BadgeType.SALES_50);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.totalSales >= 100) {
      const badge = await this.awardBadge(farmerId, BadgeType.SALES_100);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.totalSales >= 500) {
      const badge = await this.awardBadge(farmerId, BadgeType.SALES_500);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.totalSales >= 1000) {
      const badge = await this.awardBadge(farmerId, BadgeType.SALES_1000);
      if (badge) awardedBadges.push(badge);
    }

    // Revenue badges
    if (stats.totalRevenue >= 10000) {
      const badge = await this.awardBadge(farmerId, BadgeType.REVENUE_10K);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.totalRevenue >= 50000) {
      const badge = await this.awardBadge(farmerId, BadgeType.REVENUE_50K);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.totalRevenue >= 100000) {
      const badge = await this.awardBadge(farmerId, BadgeType.REVENUE_100K);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.totalRevenue >= 500000) {
      const badge = await this.awardBadge(farmerId, BadgeType.REVENUE_500K);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.totalRevenue >= 1000000) {
      const badge = await this.awardBadge(farmerId, BadgeType.REVENUE_1M);
      if (badge) awardedBadges.push(badge);
    }

    // Rating badges
    if (stats.averageRating >= 4.5) {
      const badge = await this.awardBadge(farmerId, BadgeType.TOP_RATED);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.averageRating >= 5.0 && stats.totalReviews >= 5) {
      const badge = await this.awardBadge(farmerId, BadgeType.FIVE_STAR);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.positiveReviews >= 50) {
      const badge = await this.awardBadge(farmerId, BadgeType.CONSISTENT_QUALITY);
      if (badge) awardedBadges.push(badge);
    }

    // Product badges
    if (stats.productCount >= 10) {
      const badge = await this.awardBadge(farmerId, BadgeType.PRODUCT_VARIETY);
      if (badge) awardedBadges.push(badge);
    }
    if (stats.hasOrganicProducts) {
      const badge = await this.awardBadge(farmerId, BadgeType.ORGANIC_CERTIFIED);
      if (badge) awardedBadges.push(badge);
    }

    // Tenure badges
    const monthsActive = stats.monthsActive;
    if (monthsActive >= 1) {
      const badge = await this.awardBadge(farmerId, BadgeType.MEMBER_1_MONTH);
      if (badge) awardedBadges.push(badge);
    }
    if (monthsActive >= 6) {
      const badge = await this.awardBadge(farmerId, BadgeType.MEMBER_6_MONTHS);
      if (badge) awardedBadges.push(badge);
    }
    if (monthsActive >= 12) {
      const badge = await this.awardBadge(farmerId, BadgeType.MEMBER_1_YEAR);
      if (badge) awardedBadges.push(badge);
    }
    if (monthsActive >= 24) {
      const badge = await this.awardBadge(farmerId, BadgeType.MEMBER_2_YEARS);
      if (badge) awardedBadges.push(badge);
    }

    // Service badges
    if (stats.disputeCount === 0 && stats.totalSales >= 10) {
      const badge = await this.awardBadge(farmerId, BadgeType.ZERO_DISPUTES);
      if (badge) awardedBadges.push(badge);
    }

    // Verified farmer
    if (stats.isVerified) {
      const badge = await this.awardBadge(farmerId, BadgeType.VERIFIED_FARMER);
      if (badge) awardedBadges.push(badge);
    }

    return awardedBadges;
  }

  /**
   * Get farmer stats for badge calculation
   */
  private async getFarmerStats(farmerId: string) {
    const [user, profile, products, reviews] = await Promise.all([
      this.userRepository.findOne({ where: { id: farmerId } }),
      this.farmerProfileRepository.findOne({ where: { userId: farmerId } }),
      this.productRepository.find({
        where: { farmerId },
        select: ['id', 'isOrganic', 'rating', 'reviewCount'],
      }),
      this.reviewRepository.find({
        where: { revieweeId: farmerId, type: ReviewType.FARMER },
        select: ['rating'],
      }),
    ]);

    // Get farmer orders using jsonb query
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere(`order.items @> :farmerFilter`, { farmerFilter: JSON.stringify([{ farmerId }]) })
      .select(['order.totalAmount'])
      .getMany();

    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || o.total), 0);
    const productCount = products.length;
    const hasOrganicProducts = products.some(p => p.isOrganic);
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    const positiveReviews = reviews.filter(r => r.rating >= 4).length;
    
    const createdAt = user?.createdAt || new Date();
    const monthsActive = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    return {
      totalSales,
      totalRevenue,
      productCount,
      hasOrganicProducts,
      totalReviews,
      averageRating,
      positiveReviews,
      monthsActive,
      disputeCount: 0, // TODO: Get from disputes
      isVerified: profile?.applicationStatus === FarmerApplicationStatus.APPROVED || false,
    };
  }

  /**
   * Calculate progress towards a badge
   */
  private calculateProgress(badgeType: BadgeType, stats: any, earned: boolean): number {
    if (earned) return 100;

    const progressMap: Record<string, () => number> = {
      [BadgeType.FIRST_SALE]: () => Math.min(100, stats.totalSales * 100),
      [BadgeType.SALES_10]: () => Math.min(100, (stats.totalSales / 10) * 100),
      [BadgeType.SALES_50]: () => Math.min(100, (stats.totalSales / 50) * 100),
      [BadgeType.SALES_100]: () => Math.min(100, (stats.totalSales / 100) * 100),
      [BadgeType.SALES_500]: () => Math.min(100, (stats.totalSales / 500) * 100),
      [BadgeType.SALES_1000]: () => Math.min(100, (stats.totalSales / 1000) * 100),
      [BadgeType.REVENUE_10K]: () => Math.min(100, (stats.totalRevenue / 10000) * 100),
      [BadgeType.REVENUE_50K]: () => Math.min(100, (stats.totalRevenue / 50000) * 100),
      [BadgeType.REVENUE_100K]: () => Math.min(100, (stats.totalRevenue / 100000) * 100),
      [BadgeType.REVENUE_500K]: () => Math.min(100, (stats.totalRevenue / 500000) * 100),
      [BadgeType.REVENUE_1M]: () => Math.min(100, (stats.totalRevenue / 1000000) * 100),
      [BadgeType.TOP_RATED]: () => Math.min(100, (stats.averageRating / 4.5) * 100),
      [BadgeType.PRODUCT_VARIETY]: () => Math.min(100, (stats.productCount / 10) * 100),
      [BadgeType.CONSISTENT_QUALITY]: () => Math.min(100, (stats.positiveReviews / 50) * 100),
    };

    return Math.round(progressMap[badgeType]?.() || 0);
  }

  /**
   * Cron: Check badges for all farmers daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAllFarmerBadges() {
    this.logger.log('Starting daily badge check...');
    
    const farmers = await this.userRepository.find({
      where: { role: 'farmer' as any },
      select: ['id'],
    });

    for (const farmer of farmers) {
      try {
        await this.checkAndAwardBadges(farmer.id);
      } catch (error) {
        this.logger.error(`Failed to check badges for farmer ${farmer.id}`, error);
      }
    }

    this.logger.log(`Badge check complete for ${farmers.length} farmers`);
  }
}
