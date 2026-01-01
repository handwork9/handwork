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

export enum ChatbotConversationStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export interface ChatbotMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    suggestedActions?: string[];
  };
}

@Entity('chatbot_conversations')
export class ChatbotConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'jsonb', default: '[]' })
  messages: ChatbotMessage[];

  @Column({
    type: 'enum',
    enum: ChatbotConversationStatus,
    default: ChatbotConversationStatus.ACTIVE,
  })
  @Index()
  status: ChatbotConversationStatus;

  @Column({ nullable: true })
  topic: string; // Main topic of conversation

  @Column({ nullable: true })
  relatedOrderId: string;

  @Column({ nullable: true })
  escalatedToTicketId: string; // If escalated to human support

  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  satisfactionRating: number; // 1-5 rating

  @Column({ nullable: true, type: 'text' })
  feedback: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;
}
