import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FarmerProfile } from './farmer-profile.entity';

export enum StoryType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text',
}

@Entity('farm_stories')
export class FarmStory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  farmerId: string;

  @ManyToOne(() => FarmerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmerId' })
  farmer: FarmerProfile;

  @Column({
    type: 'enum',
    enum: StoryType,
    default: StoryType.IMAGE,
  })
  type: StoryType;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'text', nullable: true })
  caption: string;

  @Column({ nullable: true })
  backgroundColor: string; // For text stories

  @Column({ nullable: true })
  textColor: string;

  @Column({ nullable: true })
  linkUrl: string; // Optional link (e.g., to a product)

  @Column({ nullable: true })
  linkText: string;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 5 })
  duration: number; // Display duration in seconds (default 5)

  @Column({ default: true })
  isActive: boolean;

  @Column()
  @Index()
  expiresAt: Date; // Stories expire after 24 hours

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
