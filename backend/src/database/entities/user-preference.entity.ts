import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
@Unique(['userId'])
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Category preferences (tracked from purchases and views)
  // Format: { "vegetables": 15, "fruits": 10, "grains": 5 }
  @Column({ type: 'jsonb', default: {} })
  categoryScores: Record<string, number>;

  // Recently viewed product IDs (last 50)
  @Column({ type: 'jsonb', default: [] })
  recentlyViewed: string[];

  // Frequently purchased farmer IDs with counts
  // Format: { "farmer-id-1": 5, "farmer-id-2": 3 }
  @Column({ type: 'jsonb', default: {} })
  favoriteFarmers: Record<string, number>;

  // Price range preferences (learned from purchase history)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  avgPurchasePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  minPurchasePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  maxPurchasePrice: number;

  // Total purchases for weighting
  @Column({ type: 'int', default: 0 })
  totalPurchases: number;

  // Total products viewed
  @Column({ type: 'int', default: 0 })
  totalViews: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
