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

export enum LoyaltyTier {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
}

export enum PointTransactionType {
  EARNED = 'earned',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  BONUS = 'bonus',
  ADJUSTED = 'adjusted',
}

export enum PointSource {
  PURCHASE = 'purchase',
  REFERRAL = 'referral',
  RATING = 'rating',
  DAILY_CHECKIN = 'daily_checkin',
  PROFILE_COMPLETION = 'profile_completion',
  SHARE_PRODUCT = 'share_product',
  FIRST_ORDER = 'first_order',
  WEEKLY_STREAK = 'weekly_streak',
  BIRTHDAY = 'birthday',
  PROMOTION = 'promotion',
  REDEMPTION = 'redemption',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

@Entity('loyalty_accounts')
export class LoyaltyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int', default: 0 })
  currentPoints: number;

  @Column({ type: 'int', default: 0 })
  lifetimePoints: number;

  @Column({ type: 'int', default: 0 })
  redeemedPoints: number;

  @Column({
    type: 'enum',
    enum: LoyaltyTier,
    default: LoyaltyTier.BRONZE,
  })
  tier: LoyaltyTier;

  @Column({ type: 'int', default: 0 })
  currentStreak: number;

  @Column({ type: 'int', default: 0 })
  longestStreak: number;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckIn: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastOrderDate: Date;

  @Column({ type: 'int', default: 0 })
  weeklyOrderStreak: number;

  @Column({ default: false })
  profileCompleted: boolean;

  @Column({ default: false })
  firstOrderBonusEarned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('point_transactions')
export class PointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  @Index()
  loyaltyAccountId: string;

  @ManyToOne(() => LoyaltyAccount)
  @JoinColumn({ name: 'loyaltyAccountId' })
  loyaltyAccount: LoyaltyAccount;

  @Column({
    type: 'enum',
    enum: PointTransactionType,
  })
  @Index()
  type: PointTransactionType;

  @Column({
    type: 'enum',
    enum: PointSource,
  })
  @Index()
  source: PointSource;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'int' })
  balanceBefore: number;

  @Column({ type: 'int' })
  balanceAfter: number;

  @Column({ nullable: true })
  description: string;

  @Column('uuid', { nullable: true })
  @Index()
  referenceId: string;

  @Column({ nullable: true })
  referenceType: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  pointsCost: number;

  @Column({
    type: 'enum',
    enum: ['discount', 'free_delivery', 'cashback', 'product', 'voucher'],
  })
  type: 'discount' | 'free_delivery' | 'cashback' | 'product' | 'voucher';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: LoyaltyTier,
    nullable: true,
  })
  requiredTier: LoyaltyTier;

  @Column({ type: 'int', default: -1 })
  stock: number; // -1 means unlimited

  @Column({ type: 'int', default: 0 })
  redeemCount: number;

  @Column({ type: 'int', default: 1 })
  maxPerUser: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  terms: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('reward_redemptions')
export class RewardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  @Index()
  rewardId: string;

  @ManyToOne(() => Reward)
  @JoinColumn({ name: 'rewardId' })
  reward: Reward;

  @Column({ type: 'int' })
  pointsSpent: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'expired', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'completed' | 'expired' | 'cancelled';

  @Column({ unique: true, length: 20 })
  redemptionCode: string;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @Column('uuid', { nullable: true })
  orderId: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
