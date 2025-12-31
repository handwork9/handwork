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

export enum BillType {
  AIRTIME = 'airtime',
  DATA = 'data',
  ELECTRICITY = 'electricity',
  TV = 'tv',
  INTERNET = 'internet',
  BETTING = 'betting',
  EDUCATION = 'education',
  GOVERNMENT = 'government',
  TOLL = 'toll',
  INSURANCE = 'insurance',
}

export enum BillPaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
  REFUNDED = 'refunded',
}

@Entity('bill_payments')
@Index(['userId', 'createdAt'])
@Index(['reference'])
@Index(['status'])
@Index(['billType'])
export class BillPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: BillType,
  })
  billType: BillType;

  @Column({ length: 100 })
  billerCode: string;

  @Column({ length: 200 })
  billerName: string;

  @Column({ length: 100, nullable: true })
  itemCode: string;

  @Column({ length: 200, nullable: true })
  itemName: string;

  @Column({ length: 100 })
  customerId: string;

  @Column({ length: 200, nullable: true })
  customerName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commission: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ length: 100, unique: true })
  reference: string;

  @Column({ length: 100, nullable: true })
  providerReference: string;

  @Column({
    type: 'enum',
    enum: BillPaymentStatus,
    default: BillPaymentStatus.PENDING,
  })
  status: BillPaymentStatus;

  @Column({ type: 'text', nullable: true })
  statusMessage: string;

  // For electricity prepaid
  @Column({ length: 100, nullable: true })
  token: string;

  // For electricity - units purchased
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  units: number;

  // For TV - subscription end date
  @Column({ type: 'timestamp', nullable: true })
  subscriptionEndDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalanceBefore: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalanceAfter: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    providerRequest?: any;
    providerResponse?: any;
    validationResponse?: any;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  receipt: {
    receiptNumber?: string;
    transactionDate?: string;
    billerLogo?: string;
    additionalInfo?: Record<string, string>;
  };

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ default: false })
  isRefunded: boolean;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  refundAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
