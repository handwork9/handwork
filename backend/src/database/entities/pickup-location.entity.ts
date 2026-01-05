import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PickupLocationType {
  LOCKER = 'locker',
  PICKUP_POINT = 'pickup_point',
  PARTNER_STORE = 'partner_store',
  HUB = 'hub',
}

export enum PickupLocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  FULL = 'full',
}

export interface OperatingHours {
  monday: { open: string; close: string; closed?: boolean };
  tuesday: { open: string; close: string; closed?: boolean };
  wednesday: { open: string; close: string; closed?: boolean };
  thursday: { open: string; close: string; closed?: boolean };
  friday: { open: string; close: string; closed?: boolean };
  saturday: { open: string; close: string; closed?: boolean };
  sunday: { open: string; close: string; closed?: boolean };
}

@Entity('pickup_locations')
export class PickupLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, unique: true })
  code: string; // e.g., "PU-LAG-001"

  @Column({
    type: 'enum',
    enum: PickupLocationType,
    default: PickupLocationType.PICKUP_POINT,
  })
  type: PickupLocationType;

  @Column({
    type: 'enum',
    enum: PickupLocationStatus,
    default: PickupLocationStatus.ACTIVE,
  })
  @Index()
  status: PickupLocationStatus;

  @Column({ type: 'text' })
  address: string;

  @Column({ length: 100 })
  @Index()
  city: string;

  @Column({ length: 100 })
  @Index()
  state: string;

  @Column({ type: 'decimal', precision: 12, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 12, scale: 8 })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  directions: string; // Instructions to find the location

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  operatingHours: OperatingHours;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  // Capacity management for lockers
  @Column({ type: 'int', default: 0 })
  totalCapacity: number; // Total number of lockers/slots

  @Column({ type: 'int', default: 0 })
  currentOccupancy: number; // Currently occupied slots

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  storageFee: number; // Daily storage fee after free period

  @Column({ type: 'int', default: 3 })
  freeStorageDays: number; // Free storage days before fees apply

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryDiscount: number; // Discount amount for choosing this pickup point

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  deliveryDiscountPercent: number; // Percentage discount

  // Partner info
  @Column({ nullable: true })
  partnerName: string;

  @Column({ nullable: true })
  partnerId: string;

  // Features
  @Column({ default: false })
  hasRefrigeration: boolean; // Can store cold items

  @Column({ default: false })
  hasParking: boolean;

  @Column({ default: false })
  isWheelchairAccessible: boolean;

  @Column({ default: true })
  acceptsCash: boolean; // Can collect cash on delivery

  @Column({ type: 'int', default: 0 })
  popularityScore: number; // For sorting by popularity

  @Column({ type: 'int', default: 0 })
  totalPickups: number; // Historical pickup count

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
