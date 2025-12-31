import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';

export enum SubscriptionBoxType {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum SubscriptionBoxStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum BoxSize {
  SMALL = 'small',      // 5-7 items
  MEDIUM = 'medium',    // 8-12 items
  LARGE = 'large',      // 13-18 items
  FAMILY = 'family',    // 20+ items
}

// Pricing for subscription boxes
export const BOX_PRICING: Record<BoxSize, Record<SubscriptionBoxType, number>> = {
  [BoxSize.SMALL]: {
    [SubscriptionBoxType.WEEKLY]: 5000,
    [SubscriptionBoxType.BIWEEKLY]: 9500,
    [SubscriptionBoxType.MONTHLY]: 18000,
  },
  [BoxSize.MEDIUM]: {
    [SubscriptionBoxType.WEEKLY]: 8500,
    [SubscriptionBoxType.BIWEEKLY]: 16000,
    [SubscriptionBoxType.MONTHLY]: 30000,
  },
  [BoxSize.LARGE]: {
    [SubscriptionBoxType.WEEKLY]: 12000,
    [SubscriptionBoxType.BIWEEKLY]: 22500,
    [SubscriptionBoxType.MONTHLY]: 42000,
  },
  [BoxSize.FAMILY]: {
    [SubscriptionBoxType.WEEKLY]: 18000,
    [SubscriptionBoxType.BIWEEKLY]: 34000,
    [SubscriptionBoxType.MONTHLY]: 65000,
  },
};

@Entity('subscription_boxes')
export class SubscriptionBox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: SubscriptionBoxType,
    default: SubscriptionBoxType.WEEKLY,
  })
  type: SubscriptionBoxType;

  @Column({
    type: 'enum',
    enum: BoxSize,
    default: BoxSize.MEDIUM,
  })
  size: BoxSize;

  @Column({
    type: 'enum',
    enum: SubscriptionBoxStatus,
    default: SubscriptionBoxStatus.ACTIVE,
  })
  status: SubscriptionBoxStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // Categories to include (e.g., ['vegetables', 'fruits', 'dairy'])
  @Column({ type: 'simple-array', nullable: true })
  preferredCategories: string[];

  // Products to exclude (allergies, dislikes)
  @Column({ type: 'simple-array', nullable: true })
  excludedProducts: string[];

  // Delivery address
  @Column({ nullable: true })
  deliveryAddress: string;

  @Column({ nullable: true })
  deliveryCity: string;

  @Column({ nullable: true })
  deliveryState: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLongitude: number;

  // Preferred delivery day (0 = Sunday, 1 = Monday, etc.)
  @Column({ type: 'int', default: 6 }) // Saturday by default
  preferredDeliveryDay: number;

  // Preferred delivery time slot
  @Column({ default: '09:00-12:00' })
  preferredDeliveryTime: string;

  // Special instructions
  @Column({ type: 'text', nullable: true })
  specialInstructions: string;

  // Payment method
  @Column({ default: 'wallet' })
  paymentMethod: string;

  // Auto-renew
  @Column({ default: true })
  autoRenew: boolean;

  // Next delivery date
  @Column({ type: 'timestamp', nullable: true })
  nextDeliveryDate: Date;

  // Last delivery date
  @Column({ type: 'timestamp', nullable: true })
  lastDeliveryDate: Date;

  // Subscription start date
  @Column({ type: 'timestamp' })
  startDate: Date;

  // Subscription end date (for non-auto-renew)
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  // Number of deliveries completed
  @Column({ type: 'int', default: 0 })
  deliveriesCompleted: number;

  // Pause until date (if paused)
  @Column({ type: 'timestamp', nullable: true })
  pausedUntil: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// Delivery record for each box delivery
@Entity('subscription_box_deliveries')
export class SubscriptionBoxDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @ManyToOne(() => SubscriptionBox)
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionBox;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  // Products included in this delivery
  @Column({ type: 'jsonb' })
  products: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalValue: number;

  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredDate: Date;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'preparing', 'shipped', 'delivered', 'cancelled'],
    default: 'scheduled',
  })
  status: string;

  // User rating for this delivery
  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
