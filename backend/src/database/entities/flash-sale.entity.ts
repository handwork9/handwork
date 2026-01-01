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

export enum FlashSaleStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

@Entity('flash_sales')
export class FlashSale {
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

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  salePrice: number;

  @Column({ type: 'int' })
  discountPercent: number;

  @Column({ type: 'int' })
  totalQuantity: number;

  @Column({ type: 'int', default: 0 })
  soldQuantity: number;

  @Column({ type: 'timestamp' })
  @Index()
  startTime: Date;

  @Column({ type: 'timestamp' })
  @Index()
  endTime: Date;

  @Column({
    type: 'enum',
    enum: FlashSaleStatus,
    default: FlashSaleStatus.SCHEDULED,
  })
  @Index()
  status: FlashSaleStatus;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual field
  get remainingQuantity(): number {
    return this.totalQuantity - this.soldQuantity;
  }

  get isActive(): boolean {
    const now = new Date();
    return this.status === FlashSaleStatus.ACTIVE && 
           now >= this.startTime && 
           now <= this.endTime &&
           this.remainingQuantity > 0;
  }
}
