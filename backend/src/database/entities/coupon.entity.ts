import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_DELIVERY = 'free_delivery',
}

export enum CouponStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
}

@Entity('coupons')
@Index(['code'], { unique: true })
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.PERCENTAGE,
  })
  type: CouponType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number; // Percentage (0-100) or fixed amount

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minOrderAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: number; // Cap for percentage discounts

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column('int', { nullable: true })
  usageLimit: number; // Total times coupon can be used

  @Column('int', { default: 0 })
  usageCount: number;

  @Column('int', { default: 1 })
  usageLimitPerUser: number; // Times per user

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus;

  @Column({ default: false })
  firstOrderOnly: boolean;

  @Column({ default: false })
  newUsersOnly: boolean;

  @Column('simple-array', { nullable: true })
  applicableCategories: string[]; // null = all categories

  @Column('simple-array', { nullable: true })
  applicableProductIds: string[]; // null = all products

  @Column('simple-array', { nullable: true })
  excludedProductIds: string[];

  // For user-specific coupons (e.g., birthday coupons)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('coupon_usages')
@Index(['couponId', 'userId'])
export class CouponUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @Column()
  couponId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  orderId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  discountApplied: number;

  @CreateDateColumn()
  usedAt: Date;
}
