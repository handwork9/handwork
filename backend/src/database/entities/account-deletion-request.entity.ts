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
import { User } from './user.entity';

export enum DeletionRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum DeletionReason {
  NOT_USING = 'not_using',
  PRIVACY_CONCERNS = 'privacy_concerns',
  FOUND_ALTERNATIVE = 'found_alternative',
  POOR_EXPERIENCE = 'poor_experience',
  TOO_MANY_NOTIFICATIONS = 'too_many_notifications',
  SECURITY_CONCERNS = 'security_concerns',
  OTHER = 'other',
}

@Entity('account_deletion_requests')
export class AccountDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: DeletionReason,
    default: DeletionReason.OTHER,
  })
  reason: DeletionReason;

  @Column({ type: 'text', nullable: true })
  additionalDetails: string;

  @Column({
    type: 'enum',
    enum: DeletionRequestStatus,
    default: DeletionRequestStatus.PENDING,
  })
  @Index()
  status: DeletionRequestStatus;

  @Column({ nullable: true })
  reviewedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  // Store user data snapshot before deletion for record keeping
  @Column({ type: 'jsonb', nullable: true })
  userDataSnapshot: {
    name: string;
    email: string;
    phone: string;
    role: string;
    state: string;
    city: string;
    createdAt: Date;
    totalOrders?: number;
    totalSpent?: number;
    totalEarnings?: number;
  };

  @Column({ type: 'timestamp', nullable: true })
  scheduledDeletionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
