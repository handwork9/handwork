import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subscription_box_templates')
export class SubscriptionBoxTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'simple-array', nullable: true })
  includedCategories: string[];

  @Column({ type: 'simple-json', nullable: true })
  includedProducts: { id: string; name: string; quantity: number }[];

  @Column({ default: 'weekly' })
  frequency: string; // weekly, biweekly, monthly

  @Column({ default: 'medium' })
  size: string; // small, medium, large, family

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  subscriberCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
