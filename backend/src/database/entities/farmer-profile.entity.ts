import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { FarmerApplicationStatus } from '../../common/enums';

@Entity('farmer_profiles')
export class FarmerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Farm Information
  @Column({ nullable: true })
  farmName: string;

  @Column({ nullable: true })
  farmType: string;

  @Column({ nullable: true })
  farmSize: string;

  @Column({ nullable: true, type: 'text' })
  farmAddress: string;

  @Column({ nullable: true })
  primaryProducts: string;

  @Column({ nullable: true })
  yearsOfExperience: string;

  @Column({ default: false })
  hasTransportation: boolean;

  // Business Information
  @Column({ nullable: true })
  businessRegistrationNumber: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  bankAccountName: string;

  // Verification Documents
  @Column({ nullable: true })
  farmerId: string; // URL to ID image

  @Column({ nullable: true })
  farmPhotos: string; // URL to farm photos

  // Application Status
  @Column({
    type: 'enum',
    enum: FarmerApplicationStatus,
    default: FarmerApplicationStatus.PENDING,
  })
  @Index()
  applicationStatus: FarmerApplicationStatus;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string; // Admin user ID

  // Statistics
  @Column({ type: 'int', default: 0 })
  totalProducts: number;

  @Column({ type: 'int', default: 0 })
  totalSales: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  // Revenue Goal
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
  revenueGoal: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
