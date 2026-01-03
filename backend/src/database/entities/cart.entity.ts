import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  unit: string;
  image?: string;
  farmerId: string;
  farmerName: string;
  pickupState: string;
  pickupCity: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  flashSaleId?: string;
  flashSaleEndsAt?: string;
}

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  userId: string;

  @OneToOne(() => User, (user: User) => user.cart, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'jsonb', default: [] })
  items: CartItem[];

  @Column({ type: 'int', default: 0 })
  itemCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
