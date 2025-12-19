import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../common/enums';
import { Product } from './product.entity';
import { Order } from './order.entity';
import { Rider } from './rider.entity';
import { Cart } from './cart.entity';
import { FarmerProfile } from './farmer-profile.entity';
import { Referral } from './referral.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, length: 20 })
  @Index()
  phone: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUYER,
  })
  role: UserRole;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true, length: 50 })
  @Index()
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  // Farmer activation (one-time payment to start selling)
  @Column({ default: false })
  isActivated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  activatedAt: Date;

  @Column({ nullable: true })
  fcmToken?: string;

  // Notification Settings
  @Column({ default: true })
  pushNotificationsEnabled: boolean;

  @Column({ default: true })
  orderUpdatesEnabled: boolean;

  @Column({ default: true })
  deliveryAlertsEnabled: boolean;

  @Column({ default: true })
  paymentAlertsEnabled: boolean;

  @Column({ default: false })
  promotionsEnabled: boolean;

  @Column({ default: true })
  newProductsEnabled: boolean;

  @Column({ default: true })
  priceDropsEnabled: boolean;

  @Column({ default: true })
  emailNotificationsEnabled: boolean;

  @Column({ default: false })
  smsNotificationsEnabled: boolean;

  @Column({ default: true })
  soundEnabled: boolean;

  @Column({ default: true })
  vibrationEnabled: boolean;

  @Column({ default: true })
  badgeEnabled: boolean;

  // Security Settings
  @Column({ default: true })
  loginAlertsEnabled: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalance: number;

  // Paystack Integration
  @Column({ nullable: true })
  @Index()
  paystackCustomerId: string; // Paystack customer code (CUS_xxx)

  @Column({ nullable: true })
  dvaAccountNumber: string; // Dedicated Virtual Account number

  @Column({ nullable: true })
  dvaAccountName: string; // Account name for the DVA

  @Column({ nullable: true })
  dvaBankName: string; // Bank name (e.g., "Wema Bank")

  @Column({ type: 'simple-array', nullable: true })
  deviceTokens: string[];

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  // Two-Factor Authentication fields
  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  twoFactorSecret: string | null;

  // Transaction PIN (hashed)
  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  transactionPin: string | null;

  @Column({ default: false })
  isPinEnabled: boolean;

  // Social Login fields
  @Column({ unique: true, nullable: true })
  @Index()
  googleId: string;

  @Column({ unique: true, nullable: true })
  @Index()
  appleId: string;

  // Premium subscription fields (for buyers)
  @Column({ default: false })
  isPremium: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  premiumTier: string;

  @Column({ type: 'timestamp', nullable: true })
  premiumExpiresAt: Date;

  // Referral fields
  @Column({ unique: true, length: 20, nullable: true })
  @Index()
  referralCode: string;

  @Column({ nullable: true, length: 20 })
  referredByCode: string;

  @Column({ type: 'int', default: 0 })
  referralCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  referralEarnings: number;

  @OneToMany(() => Product, (product: Product) => product.farmer)
  products: Product[];

  @OneToMany(() => Order, (order: Order) => order.buyer)
  buyerOrders: Order[];

  @OneToMany(() => Referral, (referral: Referral) => referral.referrer)
  referrals: Referral[];

  @OneToOne(() => Rider, (rider: Rider) => rider.user)
  riderProfile: Rider;

  @OneToOne(() => FarmerProfile, (farmerProfile: FarmerProfile) => farmerProfile.user)
  farmerProfile: FarmerProfile;

  @OneToOne(() => Cart, (cart: Cart) => cart.user)
  cart: Cart;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
