import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { SupportTicket } from './support-ticket.entity';

export enum MessageSender {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system',
}

export enum SupportMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  LOCATION = 'location',
  SYSTEM = 'system',
}

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  ticketId: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;

  @Column({ type: 'uuid', nullable: true })
  senderId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({
    type: 'enum',
    enum: MessageSender,
  })
  senderType: MessageSender;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: SupportMessageType,
    default: SupportMessageType.TEXT,
  })
  type: SupportMessageType;

  @Column({ type: 'jsonb', nullable: true })
  attachments: {
    url: string;
    type: string;
    name: string;
    size?: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
