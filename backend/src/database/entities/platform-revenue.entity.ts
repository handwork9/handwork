import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum RevenueType {
  FARMER_COMMISSION = 'farmer_commission',
  RIDER_COMMISSION = 'rider_commission',
  SERVICE_FEE = 'service_fee',
  SUBSCRIPTION = 'subscription',
  FEATURED_LISTING = 'featured_listing',
  OTHER = 'other',
}

export enum RevenueStatus {
  PENDING = 'pending',
  COLLECTED = 'collected',
  REFUNDED = 'refunded',
}

@Entity('platform_revenue')
export class PlatformRevenue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RevenueType,
  })
  @Index()
  type: RevenueType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'NGN' })
  currency: string;

  @Column({
    type: 'enum',
    enum: RevenueStatus,
    default: RevenueStatus.COLLECTED,
  })
  @Index()
  status: RevenueStatus;

  @Column({ nullable: true })
  description: string;

  // Source tracking
  @Column('uuid', { nullable: true })
  @Index()
  orderId: string;

  @Column({ nullable: true })
  orderNumber: string;

  @Column('uuid', { nullable: true })
  @Index()
  sourceUserId: string; // The farmer or rider this commission came from

  @Column({ nullable: true })
  sourceUserType: string; // 'farmer' or 'rider'

  // Rate tracking for audit
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  rateApplied: number; // The commission rate that was applied (e.g., 10.00 for 10%)

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  grossAmount: number; // Original amount before commission

  @Column({ unique: true })
  @Index()
  reference: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
