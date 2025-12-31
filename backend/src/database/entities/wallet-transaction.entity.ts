import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionCategory {
  ORDER_EARNINGS = 'order_earnings',
  ORDER_PAYMENT = 'order_payment',
  DELIVERY_EARNINGS = 'delivery_earnings',
  COMMISSION_DEDUCTION = 'commission_deduction',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
  BONUS = 'bonus',
  PENALTY = 'penalty',
  WALLET_TOPUP = 'wallet_topup',
  TRANSFER = 'transfer',
  SUBSCRIPTION = 'subscription',
  PROMOTION = 'promotion',
  PURCHASE = 'purchase',
  BILL_PAYMENT = 'bill_payment',
  GROUP_BUY = 'group_buy',
}

export enum WalletOwnerType {
  FARMER = 'farmer',
  RIDER = 'rider',
  BUYER = 'buyer',
  USER = 'user',
}

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ownerId can reference either users or riders table depending on ownerType
  // We don't use a foreign key here because it's polymorphic
  @Column('uuid')
  @Index()
  ownerId: string;

  @Column({
    type: 'enum',
    enum: WalletOwnerType,
  })
  @Index()
  ownerType: WalletOwnerType;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
  })
  @Index()
  category: TransactionCategory;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceAfter: number;

  @Column({ length: 10, default: 'NGN' })
  currency: string;

  @Column({ nullable: true })
  description: string;

  @Column('uuid', { nullable: true })
  @Index()
  orderId: string;

  @Column({ nullable: true })
  orderNumber: string;

  @Column({ unique: true })
  @Index()
  reference: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
