import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { VehicleType, RiderStatus, RiderApplicationStatus } from '../../common/enums';
import { User } from './user.entity';
import { Order } from './order.entity';
import { RiderGuarantor } from './rider-guarantor.entity';
import { RiderSubscription, SubscriptionTier } from './rider-subscription.entity';

@Entity('riders')
export class Rider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  @Index()
  userId: string;

  @OneToOne(() => User, (user: User) => user.riderProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 50 })
  @Index()
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.MOTORCYCLE,
  })
  vehicleType: VehicleType;

  @Column({ nullable: true })
  vehiclePlate: string;

  @Column({ nullable: true })
  vehicleModel: string;

  @Column({ nullable: true })
  vehicleColor: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  licenseImage: string;

  @Column({ nullable: true })
  idCardImage: string;

  // Application status for admin approval
  @Column({
    type: 'enum',
    enum: RiderApplicationStatus,
    default: RiderApplicationStatus.PENDING,
  })
  @Index()
  applicationStatus: RiderApplicationStatus;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({
    type: 'enum',
    enum: RiderStatus,
    default: RiderStatus.OFFLINE,
  })
  status: RiderStatus;

  @Column({ nullable: true })
  currentState: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLng: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLongitude: number;

  @Column('uuid', { nullable: true })
  currentOrderId: string;

  @Column({ nullable: true })
  locationUpdatedAt: Date;

  @Column({ nullable: true })
  @Index()
  lastSeenAt: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalDeliveries: number;

  @Column({ type: 'int', default: 0 })
  completedDeliveries: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalance: number;

  // Daily earning goal set by rider
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 5000 })
  dailyGoal: number;

  // Subscription/Premium fields
  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.BASIC,
  })
  currentTier: SubscriptionTier;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionExpiresAt: Date;

  @Column({ default: false })
  isPremium: boolean;

  // Manual priority boost set by admin (1.0 = no boost, 2.0 = double priority)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  manualBoost: number;

  // When the manual boost expires (null = no expiry)
  @Column({ type: 'timestamp', nullable: true })
  manualBoostExpiresAt: Date;

  // Reason for the manual boost (for audit trail)
  @Column({ type: 'text', nullable: true })
  manualBoostReason: string;

  // Admin who set the boost
  @Column({ nullable: true })
  manualBoostSetBy: string;

  @OneToMany(() => Order, (order: Order) => order.assignedRider)
  orders: Order[];

  @OneToMany(() => RiderGuarantor, (guarantor: RiderGuarantor) => guarantor.rider)
  guarantors: RiderGuarantor[];

  @OneToMany(() => RiderSubscription, (subscription: RiderSubscription) => subscription.rider)
  subscriptions: RiderSubscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper to check if rider has active premium subscription
  hasActivePremium(): boolean {
    return this.isPremium && this.subscriptionExpiresAt && new Date() < this.subscriptionExpiresAt;
  }

  // Helper to check if rider has active manual boost
  hasActiveManualBoost(): boolean {
    if (!this.manualBoost || this.manualBoost <= 1.0) return false;
    if (!this.manualBoostExpiresAt) return true; // No expiry means always active
    return new Date() < this.manualBoostExpiresAt;
  }

  // Get the effective manual boost multiplier
  getManualBoost(): number {
    return this.hasActiveManualBoost() ? Number(this.manualBoost) : 1.0;
  }

  // Get priority boost based on current tier
  getPriorityBoost(): number {
    let subscriptionBoost = 1.0;
    if (this.hasActivePremium()) {
      const boosts: Record<SubscriptionTier, number> = {
        [SubscriptionTier.BASIC]: 1.0,
        [SubscriptionTier.SILVER]: 1.5,
        [SubscriptionTier.GOLD]: 2.0,
        [SubscriptionTier.PLATINUM]: 3.0,
      };
      subscriptionBoost = boosts[this.currentTier] || 1.0;
    }
    
    // Combine subscription boost with manual boost (multiplicative)
    const manualBoost = this.getManualBoost();
    return subscriptionBoost * manualBoost;
  }
}
