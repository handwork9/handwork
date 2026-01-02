import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FraudType {
  SUSPICIOUS_LOGIN = 'suspicious_login',
  MULTIPLE_ACCOUNTS = 'multiple_accounts',
  UNUSUAL_TRANSACTION = 'unusual_transaction',
  FAKE_REVIEWS = 'fake_reviews',
  PAYMENT_FRAUD = 'payment_fraud',
  ACCOUNT_TAKEOVER = 'account_takeover',
  VELOCITY_ABUSE = 'velocity_abuse',
  REFUND_ABUSE = 'refund_abuse',
  PROMO_ABUSE = 'promo_abuse',
  FAKE_ORDERS = 'fake_orders',
  IDENTITY_FRAUD = 'identity_fraud',
  CHARGEBACK = 'chargeback',
}

export enum FraudSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum FraudAlertStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  CONFIRMED = 'confirmed',
  FALSE_POSITIVE = 'false_positive',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

@Entity('fraud_alerts')
export class FraudAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: FraudType,
  })
  type: FraudType;

  @Column({
    type: 'enum',
    enum: FraudSeverity,
    default: FraudSeverity.MEDIUM,
  })
  severity: FraudSeverity;

  @Column({
    type: 'enum',
    enum: FraudAlertStatus,
    default: FraudAlertStatus.OPEN,
  })
  status: FraudAlertStatus;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    ipAddress?: string;
    deviceFingerprint?: string;
    location?: string;
    relatedOrderIds?: string[];
    relatedTransactionIds?: string[];
    riskScore?: number;
    triggers?: string[];
    evidence?: any[];
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  riskScore: number;

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'uuid', nullable: true })
  resolvedById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolvedById' })
  resolvedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'jsonb', default: [] })
  notes: {
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
  }[];

  @Column({ type: 'boolean', default: false })
  userBlocked: boolean;

  @Column({ type: 'boolean', default: false })
  autoDetected: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
