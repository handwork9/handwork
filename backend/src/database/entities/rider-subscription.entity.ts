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
import { Rider } from './rider.entity';

export enum SubscriptionTier {
  BASIC = 'basic',      // Free tier
  SILVER = 'silver',    // 1.5x priority boost
  GOLD = 'gold',        // 2x priority boost
  PLATINUM = 'platinum' // 3x priority boost + featured badge
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

export enum SubscriptionDuration {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

// Pricing in Naira
export const SUBSCRIPTION_PRICING: Record<SubscriptionTier, Record<SubscriptionDuration, number>> = {
  [SubscriptionTier.BASIC]: {
    [SubscriptionDuration.WEEKLY]: 0,
    [SubscriptionDuration.MONTHLY]: 0,
    [SubscriptionDuration.QUARTERLY]: 0,
  },
  [SubscriptionTier.SILVER]: {
    [SubscriptionDuration.WEEKLY]: 2000,
    [SubscriptionDuration.MONTHLY]: 6000,
    [SubscriptionDuration.QUARTERLY]: 15000,
  },
  [SubscriptionTier.GOLD]: {
    [SubscriptionDuration.WEEKLY]: 4000,
    [SubscriptionDuration.MONTHLY]: 12000,
    [SubscriptionDuration.QUARTERLY]: 30000,
  },
  [SubscriptionTier.PLATINUM]: {
    [SubscriptionDuration.WEEKLY]: 7000,
    [SubscriptionDuration.MONTHLY]: 20000,
    [SubscriptionDuration.QUARTERLY]: 50000,
  },
};

// Priority boost multipliers (higher = more priority in dispatch)
export const SUBSCRIPTION_BOOST: Record<SubscriptionTier, number> = {
  [SubscriptionTier.BASIC]: 1.0,
  [SubscriptionTier.SILVER]: 1.5,
  [SubscriptionTier.GOLD]: 2.0,
  [SubscriptionTier.PLATINUM]: 3.0,
};

@Entity('rider_subscriptions')
export class RiderSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  riderId: string;

  @ManyToOne(() => Rider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'riderId' })
  rider: Rider;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.BASIC,
  })
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  @Index()
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: SubscriptionDuration,
  })
  duration: SubscriptionDuration;

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
    return this.status === SubscriptionStatus.ACTIVE && new Date() < this.endDate;
  }

  // Get priority boost based on tier
  getPriorityBoost(): number {
    return SUBSCRIPTION_BOOST[this.tier] || 1.0;
  }
}
