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
import { Product } from './product.entity';
import { User } from './user.entity';

export enum PromotionPlanId {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum PromotionBoostType {
  HOMEPAGE = 'homepage_feature',
  CATEGORY = 'category_top',
  SEARCH = 'search_priority',
  BADGE = 'promoted_badge',
}

export enum TargetAudienceType {
  ALL = 'all_buyers',
  PREMIUM = 'premium_buyers',
  LOCAL = 'local_buyers',
  REPEAT = 'repeat_customers',
}

export enum PromotionStatus {
  PENDING_PAYMENT = 'pending_payment',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('product_promotions')
export class ProductPromotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  @Index()
  farmerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmerId' })
  farmer: User;

  @Column({
    type: 'enum',
    enum: PromotionPlanId,
  })
  planId: PromotionPlanId;

  @Column({ type: 'int' })
  durationDays: number;

  @Column({ type: 'simple-array', nullable: true })
  boosts: PromotionBoostType[];

  @Column({
    type: 'enum',
    enum: TargetAudienceType,
    default: TargetAudienceType.ALL,
  })
  targetAudience: TargetAudienceType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalCost: number;

  @Column({
    type: 'enum',
    enum: PromotionStatus,
    default: PromotionStatus.PENDING_PAYMENT,
  })
  @Index()
  status: PromotionStatus;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'int', default: 0 })
  conversions: number;

  @Column({ nullable: true })
  transactionReference: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
