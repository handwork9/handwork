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
import { FarmerProfile } from './farmer-profile.entity';

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  PRODUCT_SHOWCASE = 'product_showcase',
  FARM_UPDATE = 'farm_update',
  HARVEST = 'harvest',
  BEHIND_THE_SCENES = 'behind_the_scenes',
}

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

@Entity('social_posts')
export class SocialPost {
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
    enum: PostType,
    default: PostType.TEXT,
  })
  @Index()
  type: PostType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', array: true, nullable: true, default: '{}' })
  images: string[];

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  videoThumbnail: string;

  @Column({ nullable: true })
  productId: string; // If showcasing a product

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @Column({ type: 'text', array: true, nullable: true, default: '{}' })
  tags: string[];

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPinned: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
