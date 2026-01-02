import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  eventName: string;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column({ nullable: true })
  clientId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column('jsonb', { nullable: true })
  params: Record<string, any>;

  @Column({ nullable: true })
  screenName: string;

  @Column({ nullable: true })
  pagePath: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  platform: string; // web, ios, android

  @Column({ nullable: true })
  appVersion: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
