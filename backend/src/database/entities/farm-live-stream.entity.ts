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
import { Product } from './product.entity';

export enum LiveStreamStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

@Entity('farm_live_streams')
export class FarmLiveStream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  farmerId: string;

  @ManyToOne(() => FarmerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmerId' })
  farmer: FarmerProfile;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({
    type: 'enum',
    enum: LiveStreamStatus,
    default: LiveStreamStatus.SCHEDULED,
  })
  @Index()
  status: LiveStreamStatus;

  @Column({ nullable: true })
  streamKey: string; // Unique key for streaming

  @Column({ nullable: true })
  streamUrl: string; // RTMP/HLS URL

  @Column({ nullable: true })
  playbackUrl: string; // URL for viewers

  @Column({ nullable: true })
  scheduledStartTime: Date;

  @Column({ nullable: true })
  actualStartTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column({ type: 'int', default: 0 })
  duration: number; // Duration in seconds

  @Column({ type: 'int', default: 0 })
  viewerCount: number;

  @Column({ type: 'int', default: 0 })
  peakViewerCount: number;

  @Column({ type: 'int', default: 0 })
  totalViews: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'text', array: true, nullable: true, default: '{}' })
  tags: string[];

  @Column({ nullable: true })
  productId: string; // Featured product during stream

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  recordingUrl: string; // Saved recording after stream ends

  @Column({ default: false })
  isRecordingEnabled: boolean;

  @Column({ default: true })
  chatEnabled: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
