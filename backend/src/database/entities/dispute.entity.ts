import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  AWAITING_RESPONSE = 'awaiting_response',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

export enum DisputeType {
  PRODUCT_QUALITY = 'product_quality',
  MISSING_ITEMS = 'missing_items',
  WRONG_ITEMS = 'wrong_items',
  LATE_DELIVERY = 'late_delivery',
  DAMAGED_PRODUCTS = 'damaged_products',
  REFUND_REQUEST = 'refund_request',
  OVERCHARGE = 'overcharge',
  RIDER_ISSUE = 'rider_issue',
  FARMER_ISSUE = 'farmer_issue',
  OTHER = 'other',
}

export enum DisputePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum DisputeResolution {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
  REPLACEMENT = 'replacement',
  CREDIT = 'credit',
  NO_ACTION = 'no_action',
  OTHER = 'other',
}

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  @Index()
  disputeNumber: string;

  @Column('uuid')
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  @Index()
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  assignedToId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({
    type: 'enum',
    enum: DisputeType,
    default: DisputeType.OTHER,
  })
  type: DisputeType;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  @Index()
  status: DisputeStatus;

  @Column({
    type: 'enum',
    enum: DisputePriority,
    default: DisputePriority.MEDIUM,
  })
  priority: DisputePriority;

  @Column({ length: 255 })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  requestedAmount: number;

  @Column({
    type: 'enum',
    enum: DisputeResolution,
    nullable: true,
  })
  resolution: DisputeResolution;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  refundedAmount: number;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @OneToMany(() => DisputeMessage, (message) => message.dispute)
  messages: DisputeMessage[];

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('dispute_messages')
export class DisputeMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  disputeId: string;

  @ManyToOne(() => Dispute, (dispute) => dispute.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'disputeId', referencedColumnName: 'id' })
  dispute: Dispute;

  @Column('uuid', { nullable: true })
  senderId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'senderId', referencedColumnName: 'id' })
  sender: User;

  @Column({ type: 'varchar', length: 20 })
  senderType: 'user' | 'admin' | 'system' | 'farmer' | 'rider';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments: string[];

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
