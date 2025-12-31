import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';

export enum GroupBuyStatus {
  ACTIVE = 'active',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum GroupBuyParticipantStatus {
  JOINED = 'joined',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

// Discount tiers based on number of participants
export const GROUP_BUY_TIERS = [
  { minParticipants: 3, discount: 5 },    // 5% off with 3+ buyers
  { minParticipants: 5, discount: 10 },   // 10% off with 5+ buyers
  { minParticipants: 10, discount: 15 },  // 15% off with 10+ buyers
  { minParticipants: 20, discount: 20 },  // 20% off with 20+ buyers
  { minParticipants: 50, discount: 25 },  // 25% off with 50+ buyers
];

@Entity('group_buys')
export class GroupBuy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'organizerId' })
  organizer: User;

  @Column()
  organizerId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  originalPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentPrice: number;

  @Column('int', { default: 3 })
  minParticipants: number;

  @Column('int', { nullable: true })
  maxParticipants: number;

  @Column('int', { default: 0 })
  currentParticipants: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  currentDiscount: number;

  @Column('int', { default: 1 })
  quantityPerPerson: number;

  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column({
    type: 'enum',
    enum: GroupBuyStatus,
    default: GroupBuyStatus.ACTIVE,
  })
  status: GroupBuyStatus;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ nullable: true })
  shareCode: string;

  @Column('json', { nullable: true })
  deliveryOptions: {
    pickupAvailable: boolean;
    deliveryAvailable: boolean;
    pickupLocation?: string;
    deliveryFee?: number;
  };

  @OneToMany(() => GroupBuyParticipant, (participant) => participant.groupBuy)
  participants: GroupBuyParticipant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('group_buy_participants')
export class GroupBuyParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GroupBuy, (groupBuy) => groupBuy.participants)
  @JoinColumn({ name: 'groupBuyId' })
  groupBuy: GroupBuy;

  @Column()
  groupBuyId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column('int', { default: 1 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceAtJoin: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  finalPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  amountPaid: number;

  @Column({
    type: 'enum',
    enum: GroupBuyParticipantStatus,
    default: GroupBuyParticipantStatus.JOINED,
  })
  status: GroupBuyParticipantStatus;

  @Column({ default: false })
  isOrganizer: boolean;

  @Column({ type: 'enum', enum: ['pickup', 'delivery'], nullable: true })
  deliveryPreference: 'pickup' | 'delivery';

  @Column('json', { nullable: true })
  deliveryAddress: {
    address: string;
    city: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };

  @Column({ nullable: true })
  paymentReference: string;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
