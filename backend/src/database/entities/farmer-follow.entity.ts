import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { FarmerProfile } from './farmer-profile.entity';

@Entity('farmer_follows')
@Unique(['userId', 'farmerId'])
export class FarmerFollow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string; // The user who is following

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  @Index()
  farmerId: string; // The farmer being followed

  @ManyToOne(() => FarmerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmerId' })
  farmer: FarmerProfile;

  @Column({ default: true })
  notificationsEnabled: boolean; // Get notified of farmer's posts

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
