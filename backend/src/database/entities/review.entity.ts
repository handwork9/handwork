import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';
import { Rider } from './rider.entity';

export enum ReviewType {
  FARMER = 'farmer',
  RIDER = 'rider',
}

@Entity('reviews')
@Unique(['orderId', 'reviewerId', 'type']) // One review per order per type
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column('uuid')
  @Index()
  reviewerId: string; // The buyer who submitted the review

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column('uuid')
  @Index()
  revieweeId: string; // The farmer or rider being reviewed

  @Column({
    type: 'enum',
    enum: ReviewType,
  })
  @Index()
  type: ReviewType;

  @Column({ type: 'int' })
  rating: number; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]; // Quick feedback tags like "Fast delivery", "Fresh products", etc.

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ default: true })
  isVisible: boolean; // Admin can hide inappropriate reviews

  @Column({ type: 'text', nullable: true })
  response: string; // Farmer/Rider can respond to review

  @Column({ nullable: true })
  respondedAt: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
