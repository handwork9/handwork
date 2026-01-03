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

export interface BundleItem {
  productId: string;
  productTitle: string;
  productImage?: string;
  originalPrice: number;
  bundlePrice: number;
  quantity: number;
}

@Entity('product_bundles')
export class ProductBundle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  @Index()
  farmerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmerId' })
  farmer: User;

  @Column({ type: 'jsonb' })
  items: BundleItem[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  originalTotal: number; // Sum of individual prices

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  bundlePrice: number; // Discounted bundle price

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  discountPercentage: number; // How much they save

  @Column({ type: 'text', array: true, nullable: true, default: '{}' })
  images: string[];

  @Column({ type: 'int', default: 0 })
  stock: number; // How many bundles available

  @Column({ type: 'int', default: 0 })
  salesCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ length: 50 })
  @Index()
  pickupState: string;

  @Column({ nullable: true })
  pickupCity: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
