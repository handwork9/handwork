import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('price_history')
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  oldPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  newPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentageChange: number;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
