import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderStatus, PaymentStatus } from '../../common/enums';
import { User } from './user.entity';
import { Rider } from './rider.entity';
import { Payment } from './payment.entity';
import { DispatchLog } from './dispatch-log.entity';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
  farmerId: string;
  farmerName: string;
}

export interface DeliveryAddress {
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  instructions?: string;
}

export interface PickupPoint {
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  @Index()
  orderNumber: string;

  @Column('uuid')
  @Index()
  buyerId: string;

  @ManyToOne(() => User, (user: User) => user.buyerOrders, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column({ type: 'jsonb' })
  items: OrderItem[];

  @Column({ type: 'int' })
  itemCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  serviceFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLongitude: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.CREATED,
  })
  @Index()
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  paymentMethod: string; // 'card' | 'wallet'

  @Column({ type: 'jsonb' })
  pickupPoint: PickupPoint;

  @Column({ type: 'jsonb' })
  deliveryAddress: DeliveryAddress;

  @Column({ length: 50 })
  @Index()
  pickupState: string;

  @Column({ length: 50 })
  @Index()
  deliveryState: string;

  @Column({ default: false })
  isSameState: boolean;

  @Column({ nullable: true })
  estimatedDeliveryTime: Date;

  @Column({ nullable: true })
  actualDeliveryTime: Date;

  @Column({ type: 'varchar', length: 20, default: 'ASAP' })
  deliveryType: 'ASAP' | 'SCHEDULED';

  @Column({ nullable: true })
  scheduledDeliveryTime: Date;

  @Column('uuid', { nullable: true })
  @Index()
  assignedRiderId: string;

  @Column('uuid', { nullable: true })
  riderId: string;

  @ManyToOne(() => Rider, (rider: Rider) => rider.orders, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedRiderId' })
  assignedRider: Rider;

  @Column({ nullable: true })
  assignedAt: Date;

  @Column({ nullable: true })
  confirmedAt: Date;

  @Column({ nullable: true })
  riderAcceptedAt: Date;

  @Column({ nullable: true })
  pickedUpAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason?: string;

  @Column({ nullable: true })
  customerNotes: string;

  @Column({ nullable: true })
  riderNote: string;

  @Column({ nullable: true })
  farmerMessage: string;

  @Column({ default: false })
  isGift: boolean;

  @Column({ type: 'jsonb', nullable: true })
  giftDetails: {
    recipientName: string;
    recipientPhone: string;
    message?: string;
  };

  @Column({ nullable: true })
  internalNotes: string;

  // Rating fields
  @Column({ default: false })
  hasRatedFarmer: boolean;

  @Column({ default: false })
  hasRatedRider: boolean;

  @Column({ type: 'int', nullable: true })
  farmerRating: number;

  @Column({ type: 'int', nullable: true })
  riderRating: number;

  @Column({ nullable: true })
  proofOfDeliveryPhoto: string;

  @OneToOne(() => Payment, (payment: Payment) => payment.order)
  payment: Payment;

  @OneToMany(() => DispatchLog, (log: DispatchLog) => log.order)
  dispatchLogs: DispatchLog[];

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
