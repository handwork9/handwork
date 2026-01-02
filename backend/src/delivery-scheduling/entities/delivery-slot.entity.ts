import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('delivery_slots')
export class DeliverySlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string; // e.g., "Morning", "Afternoon", "Evening"

  @Column({ type: 'time' })
  startTime: string; // e.g., "08:00:00"

  @Column({ type: 'time' })
  endTime: string; // e.g., "12:00:00"

  @Column({ type: 'int', default: 50 })
  maxCapacity: number; // Max deliveries per slot

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  additionalFee: number; // Extra fee for specific slots (e.g., express)

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', nullable: true })
  availableDays: string[]; // ['monday', 'tuesday', ...] or null for all days

  @Column({ type: 'varchar', nullable: true })
  state: string; // Optional: limit slot to specific state

  @Column({ type: 'varchar', nullable: true })
  city: string; // Optional: limit slot to specific city

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
