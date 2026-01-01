import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum BadgeType {
  // Sales Badges
  FIRST_SALE = 'first_sale',
  SALES_10 = 'sales_10',
  SALES_50 = 'sales_50',
  SALES_100 = 'sales_100',
  SALES_500 = 'sales_500',
  SALES_1000 = 'sales_1000',

  // Revenue Badges
  REVENUE_10K = 'revenue_10k',
  REVENUE_50K = 'revenue_50k',
  REVENUE_100K = 'revenue_100k',
  REVENUE_500K = 'revenue_500k',
  REVENUE_1M = 'revenue_1m',

  // Rating Badges
  TOP_RATED = 'top_rated',
  FIVE_STAR = 'five_star',
  CONSISTENT_QUALITY = 'consistent_quality',

  // Product Badges
  PRODUCT_VARIETY = 'product_variety',
  ORGANIC_CERTIFIED = 'organic_certified',
  LOCAL_CHAMPION = 'local_champion',

  // Customer Service
  FAST_RESPONDER = 'fast_responder',
  QUICK_SHIPPER = 'quick_shipper',
  ZERO_DISPUTES = 'zero_disputes',

  // Tenure Badges
  MEMBER_1_MONTH = 'member_1_month',
  MEMBER_6_MONTHS = 'member_6_months',
  MEMBER_1_YEAR = 'member_1_year',
  MEMBER_2_YEARS = 'member_2_years',

  // Special
  VERIFIED_FARMER = 'verified_farmer',
  PREMIUM_SELLER = 'premium_seller',
  TRENDING_SELLER = 'trending_seller',
  COMMUNITY_FAVORITE = 'community_favorite',
}

export const BADGE_INFO: Record<BadgeType, { name: string; description: string; icon: string; color: string; points: number }> = {
  [BadgeType.FIRST_SALE]: { name: 'First Sale', description: 'Made your first sale', icon: '🎉', color: '#10B981', points: 10 },
  [BadgeType.SALES_10]: { name: 'Rising Star', description: 'Completed 10 sales', icon: '⭐', color: '#F59E0B', points: 25 },
  [BadgeType.SALES_50]: { name: 'Proven Seller', description: 'Completed 50 sales', icon: '🌟', color: '#F59E0B', points: 50 },
  [BadgeType.SALES_100]: { name: 'Top Seller', description: 'Completed 100 sales', icon: '💫', color: '#8B5CF6', points: 100 },
  [BadgeType.SALES_500]: { name: 'Elite Seller', description: 'Completed 500 sales', icon: '🏆', color: '#6366F1', points: 250 },
  [BadgeType.SALES_1000]: { name: 'Legend', description: 'Completed 1000 sales', icon: '👑', color: '#EC4899', points: 500 },

  [BadgeType.REVENUE_10K]: { name: 'Bronze Revenue', description: 'Earned ₦10,000+ in sales', icon: '💰', color: '#CD7F32', points: 20 },
  [BadgeType.REVENUE_50K]: { name: 'Silver Revenue', description: 'Earned ₦50,000+ in sales', icon: '💰', color: '#9CA3AF', points: 50 },
  [BadgeType.REVENUE_100K]: { name: 'Gold Revenue', description: 'Earned ₦100,000+ in sales', icon: '💰', color: '#F59E0B', points: 100 },
  [BadgeType.REVENUE_500K]: { name: 'Platinum Revenue', description: 'Earned ₦500,000+ in sales', icon: '💎', color: '#6366F1', points: 250 },
  [BadgeType.REVENUE_1M]: { name: 'Diamond Revenue', description: 'Earned ₦1,000,000+ in sales', icon: '💎', color: '#EC4899', points: 500 },

  [BadgeType.TOP_RATED]: { name: 'Top Rated', description: 'Maintained 4.5+ rating', icon: '⭐', color: '#F59E0B', points: 75 },
  [BadgeType.FIVE_STAR]: { name: 'Perfect Score', description: 'Achieved 5.0 rating', icon: '🌟', color: '#F59E0B', points: 100 },
  [BadgeType.CONSISTENT_QUALITY]: { name: 'Consistent Quality', description: '50+ positive reviews', icon: '✨', color: '#10B981', points: 75 },

  [BadgeType.PRODUCT_VARIETY]: { name: 'Product Variety', description: 'Listed 10+ different products', icon: '🛒', color: '#3B82F6', points: 30 },
  [BadgeType.ORGANIC_CERTIFIED]: { name: 'Organic Certified', description: 'Sells certified organic products', icon: '🌿', color: '#10B981', points: 50 },
  [BadgeType.LOCAL_CHAMPION]: { name: 'Local Champion', description: 'Top seller in your region', icon: '🏅', color: '#8B5CF6', points: 100 },

  [BadgeType.FAST_RESPONDER]: { name: 'Fast Responder', description: 'Responds within 1 hour', icon: '⚡', color: '#F59E0B', points: 25 },
  [BadgeType.QUICK_SHIPPER]: { name: 'Quick Shipper', description: 'Ships within 24 hours', icon: '📦', color: '#3B82F6', points: 50 },
  [BadgeType.ZERO_DISPUTES]: { name: 'Trusted Seller', description: 'Zero disputes in 3 months', icon: '🛡️', color: '#10B981', points: 75 },

  [BadgeType.MEMBER_1_MONTH]: { name: 'New Member', description: '1 month on Handwork', icon: '🌱', color: '#10B981', points: 5 },
  [BadgeType.MEMBER_6_MONTHS]: { name: 'Established', description: '6 months on Handwork', icon: '🌳', color: '#10B981', points: 25 },
  [BadgeType.MEMBER_1_YEAR]: { name: 'Veteran', description: '1 year on Handwork', icon: '🎖️', color: '#F59E0B', points: 50 },
  [BadgeType.MEMBER_2_YEARS]: { name: 'Pioneer', description: '2 years on Handwork', icon: '🏛️', color: '#8B5CF6', points: 100 },

  [BadgeType.VERIFIED_FARMER]: { name: 'Verified Farmer', description: 'Identity verified', icon: '✅', color: '#3B82F6', points: 50 },
  [BadgeType.PREMIUM_SELLER]: { name: 'Premium Seller', description: 'Active premium subscription', icon: '💎', color: '#EC4899', points: 25 },
  [BadgeType.TRENDING_SELLER]: { name: 'Trending', description: 'Top sales this week', icon: '🔥', color: '#EF4444', points: 50 },
  [BadgeType.COMMUNITY_FAVORITE]: { name: 'Community Favorite', description: 'Most favorited farmer', icon: '❤️', color: '#EC4899', points: 75 },
};

@Entity('farmer_badges')
export class FarmerBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  farmerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmerId' })
  farmer: User;

  @Column({
    type: 'enum',
    enum: BadgeType,
  })
  @Index()
  badgeType: BadgeType;

  @Column({ type: 'timestamp' })
  earnedAt: Date;

  @Column({ type: 'boolean', default: true })
  isDisplayed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Virtual fields
  get info() {
    return BADGE_INFO[this.badgeType];
  }
}
