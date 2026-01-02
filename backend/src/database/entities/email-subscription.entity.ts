import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_subscriptions')
export class EmailSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  userId: string;

  @Column('simple-array', { nullable: true })
  preferences: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  newsletterOptIn: boolean;

  @Column({ default: false })
  promotionalOptIn: boolean;

  @Column({ default: true })
  transactionalOptIn: boolean;

  @Column({ nullable: true })
  unsubscribedAt: Date;

  @Column({ nullable: true })
  unsubscribeReason: string;

  @CreateDateColumn()
  subscribedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
