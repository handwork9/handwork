import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DeliverySlot } from './delivery-slot.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('scheduled_deliveries')
export class ScheduledDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid' })
  slotId: string;

  @ManyToOne(() => DeliverySlot)
  @JoinColumn({ name: 'slotId' })
  slot: DeliverySlot;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, confirmed, in_progress, completed, cancelled

  @Column({ type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ type: 'boolean', default: false })
  isExpress: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  schedulingFee: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
