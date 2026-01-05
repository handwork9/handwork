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
import { ProductCategory, ProductApprovalStatus } from '../../common/enums';
import { User } from './user.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ length: 20, default: 'kg' })
  unit: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.OTHERS,
  })
  @Index()
  category: ProductCategory;

  @Column({ length: 50, nullable: true })
  @Index()
  subcategory: string;

  @Column({ type: 'text', array: true, nullable: true, default: '{}' })
  images: string[];

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  pickupLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  pickupLng: number;

  @Column({ length: 50 })
  @Index()
  pickupState: string;

  @Column({ nullable: true })
  pickupCity: string;

  @Column({ nullable: true })
  pickupAddress: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  salesCount: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({
    type: 'enum',
    enum: ProductApprovalStatus,
    default: ProductApprovalStatus.PENDING,
  })
  @Index()
  approvalStatus: ProductApprovalStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedById: string;

  @Column({ default: false })
  isOrganic: boolean;

  @Column({ default: true })
  isPerishable: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  @Index()
  isPromoted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  promotionExpiresAt: Date | null;

  @Column({ default: false })
  @Index()
  isAdminProduct: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  recommendationScore: number;

  @Column({ nullable: true })
  harvestDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ type: 'text', array: true, nullable: true, default: '{}' })
  certifications: string[];

  @Column({ type: 'int', default: 1 })
  minOrderQuantity: number;

  @Column({ type: 'int', nullable: true })
  bulkDiscountQuantity: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bulkDiscountPercent: number;

  // Pre-order fields
  @Column({ default: false })
  @Index()
  isPreOrder: boolean;

  @Column({ type: 'timestamp', nullable: true })
  preOrderStartDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  preOrderEndDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expectedAvailableDate: Date | null;

  @Column({ type: 'int', nullable: true })
  preOrderMaxQuantity: number;

  @Column({ type: 'int', default: 0 })
  preOrderCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  preOrderDiscountPercent: number;

  @Column('uuid')
  farmerId: string;

  @ManyToOne(() => User, (user: User) => user.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmerId' })
  farmer: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
