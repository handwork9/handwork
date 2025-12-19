import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DispatchStatus } from '../../common/enums';
import { Order } from './order.entity';

export interface RiderOffer {
  riderId: string;
  riderName: string;
  offeredAt: Date;
  respondedAt?: Date;
  accepted: boolean;
  eta?: number; // minutes
}

@Entity('dispatch_logs')
export class DispatchLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  orderId: string;

  @ManyToOne(() => Order, (order: Order) => order.dispatchLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({
    type: 'enum',
    enum: DispatchStatus,
    default: DispatchStatus.PENDING,
  })
  @Index()
  status: DispatchStatus;

  @Column({ type: 'jsonb', default: [] })
  attemptedRiders: RiderOffer[];

  @Column('uuid', { nullable: true })
  assignedRiderId: string;

  @Column('uuid', { nullable: true })
  riderId: string;

  @Column({ nullable: true })
  matchedAt: Date;

  @Column({ type: 'int', default: 0 })
  attemptCount: number;

  @Column({ nullable: true })
  searchRadiusKm: number;

  @Column({ nullable: true })
  ridersFoundCount: number;

  @Column({ nullable: true })
  estimatedPickupMinutes: number;

  @Column({ nullable: true })
  estimatedDeliveryMinutes: number;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true })
  scheduledTime: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
