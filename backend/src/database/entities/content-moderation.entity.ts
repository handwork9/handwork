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

export enum ContentType {
  PRODUCT = 'product',
  REVIEW = 'review',
  SOCIAL_POST = 'social_post',
  FARM_STORY = 'farm_story',
  COMMENT = 'comment',
  USER_PROFILE = 'user_profile',
  CHAT_MESSAGE = 'chat_message',
  SUPPORT_MESSAGE = 'support_message',
}

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
  UNDER_REVIEW = 'under_review',
  AUTO_APPROVED = 'auto_approved',
  AUTO_REJECTED = 'auto_rejected',
}

export enum ModerationReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  MISLEADING = 'misleading',
  OFFENSIVE_LANGUAGE = 'offensive_language',
  FAKE_PRODUCT = 'fake_product',
  PRICE_GOUGING = 'price_gouging',
  PROHIBITED_ITEM = 'prohibited_item',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  VIOLENCE = 'violence',
  COPYRIGHT = 'copyright',
  ADULT_CONTENT = 'adult_content',
  SCAM = 'scam',
  POLICY_VIOLATION = 'policy_violation',
  OTHER = 'other',
}

export enum ModerationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('content_moderation')
export class ContentModeration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ContentType,
  })
  contentType: ContentType;

  @Column({ type: 'uuid' })
  contentId: string;

  @Column({ type: 'uuid', nullable: true })
  authorId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({
    type: 'enum',
    enum: ModerationStatus,
    default: ModerationStatus.PENDING,
  })
  status: ModerationStatus;

  @Column({
    type: 'enum',
    enum: ModerationPriority,
    default: ModerationPriority.MEDIUM,
  })
  priority: ModerationPriority;

  @Column({
    type: 'enum',
    enum: ModerationReason,
    nullable: true,
  })
  reason: ModerationReason;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  contentPreview: string;

  @Column({ type: 'jsonb', default: {} })
  contentSnapshot: any;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    reportCount?: number;
    reporterIds?: string[];
    aiScore?: number;
    flaggedKeywords?: string[];
    imageAnalysis?: any;
    autoModResult?: any;
  };

  @Column({ type: 'uuid', nullable: true })
  reportedById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reportedById' })
  reportedBy: User;

  @Column({ type: 'text', nullable: true })
  reportReason: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ type: 'text', nullable: true })
  actionTaken: string;

  @Column({ type: 'boolean', default: false })
  contentRemoved: boolean;

  @Column({ type: 'boolean', default: false })
  userWarned: boolean;

  @Column({ type: 'boolean', default: false })
  userSuspended: boolean;

  @Column({ type: 'boolean', default: false })
  autoDetected: boolean;

  @Column({ type: 'jsonb', default: [] })
  history: {
    action: string;
    performedById: string;
    performedByName: string;
    details: string;
    timestamp: Date;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
