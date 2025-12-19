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

export enum FarmerSubscriptionTier {
  BASIC = 'basic',      // Free tier - no verification badge
  VERIFIED = 'verified', // Verified seller badge + priority listing
  PREMIUM = 'premium',   // Premium features + top placement
}

export enum FarmerSubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

export enum FarmerSubscriptionDuration {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Pricing in Naira for farmer subscriptions
export const FARMER_SUBSCRIPTION_PRICING: Record<FarmerSubscriptionTier, Record<FarmerSubscriptionDuration, number>> = {
  [FarmerSubscriptionTier.BASIC]: {
    [FarmerSubscriptionDuration.MONTHLY]: 0,
    [FarmerSubscriptionDuration.QUARTERLY]: 0,
    [FarmerSubscriptionDuration.YEARLY]: 0,
  },
  [FarmerSubscriptionTier.VERIFIED]: {
    [FarmerSubscriptionDuration.MONTHLY]: 3000,
    [FarmerSubscriptionDuration.QUARTERLY]: 7500,
    [FarmerSubscriptionDuration.YEARLY]: 25000,
  },
  [FarmerSubscriptionTier.PREMIUM]: {
    [FarmerSubscriptionDuration.MONTHLY]: 7000,
    [FarmerSubscriptionDuration.QUARTERLY]: 18000,
    [FarmerSubscriptionDuration.YEARLY]: 60000,
  },
};

// Visibility boost multipliers (higher = more visibility in search results)
export const FARMER_VISIBILITY_BOOST: Record<FarmerSubscriptionTier, number> = {
  [FarmerSubscriptionTier.BASIC]: 1.0,
  [FarmerSubscriptionTier.VERIFIED]: 1.5,
  [FarmerSubscriptionTier.PREMIUM]: 2.5,
};

@Entity('farmer_subscriptions')
export class FarmerSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  farmerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmerId' })
  farmer: User;

  @Column({
    type: 'enum',
    enum: FarmerSubscriptionTier,
    default: FarmerSubscriptionTier.BASIC,
  })
  tier: FarmerSubscriptionTier;

  @Column({
    type: 'enum',
    enum: FarmerSubscriptionStatus,
    default: FarmerSubscriptionStatus.PENDING,
  })
  @Index()
  status: FarmerSubscriptionStatus;

  @Column({
    type: 'enum',
    enum: FarmerSubscriptionDuration,
  })
  duration: FarmerSubscriptionDuration;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper to check if subscription is currently active
  isCurrentlyActive(): boolean {
    return this.status === FarmerSubscriptionStatus.ACTIVE && new Date() < this.endDate;
  }

  // Get visibility boost based on tier
  getVisibilityBoost(): number {
    return FARMER_VISIBILITY_BOOST[this.tier] || 1.0;
  }

  // Check if farmer is verified (has verified or premium tier)
  isVerified(): boolean {
    return (
      this.tier !== FarmerSubscriptionTier.BASIC &&
      this.status === FarmerSubscriptionStatus.ACTIVE &&
      new Date() < this.endDate
    );
  }
}
