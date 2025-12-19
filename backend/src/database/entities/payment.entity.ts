import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PaymentStatus } from '../../common/enums';
import { Order } from './order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid', { unique: true, nullable: true })
  @Index()
  orderId: string;

  @OneToOne(() => Order, (order: Order) => order.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'NGN' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status: PaymentStatus;

  // Stripe fields (legacy - keeping for migration)
  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  stripeChargeId: string;

  @Column({ nullable: true })
  stripeRefundId: string;

  // Paystack fields (primary payment provider)
  @Column({ nullable: true })
  @Index()
  paystackReference: string;

  @Column({ nullable: true })
  paystackTransferId: string;

  @Column({ nullable: true })
  paystackTransferCode: string;

  @Column({ length: 50, default: 'card' })
  paymentMethod: string;

  @Column({ nullable: true })
  cardLast4: string;

  @Column({ nullable: true })
  cardBrand: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  refundedAmount: number;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  refundedAt: Date;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
