import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  // User actions
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_SUSPEND = 'user_suspend',
  USER_UNSUSPEND = 'user_unsuspend',
  
  // Farmer actions
  FARMER_VERIFY = 'farmer_verify',
  FARMER_REJECT = 'farmer_reject',
  
  // Rider actions
  RIDER_APPROVE = 'rider_approve',
  RIDER_REJECT = 'rider_reject',
  RIDER_UPDATE = 'rider_update',
  
  // Product actions
  PRODUCT_CREATE = 'product_create',
  PRODUCT_UPDATE = 'product_update',
  PRODUCT_DELETE = 'product_delete',
  PRODUCT_APPROVE = 'product_approve',
  PRODUCT_REJECT = 'product_reject',
  
  // Order actions
  ORDER_UPDATE = 'order_update',
  ORDER_CANCEL = 'order_cancel',
  ORDER_ASSIGN_RIDER = 'order_assign_rider',
  
  // System actions
  ADMIN_LOGIN = 'admin_login',
  ADMIN_LOGOUT = 'admin_logout',
  SETTINGS_UPDATE = 'settings_update',
  
  // Dispatch actions
  DISPATCH_CREATE = 'dispatch_create',
  DISPATCH_UPDATE = 'dispatch_update',
  
  // Support actions
  SUPPORT_TICKET_UPDATE = 'support_ticket_update',
  SUPPORT_TICKET_CLOSE = 'support_ticket_close',
}

export enum AuditCategory {
  USER = 'user',
  FARMER = 'farmer',
  RIDER = 'rider',
  PRODUCT = 'product',
  ORDER = 'order',
  SYSTEM = 'system',
  DISPATCH = 'dispatch',
  SUPPORT = 'support',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  @Index()
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditCategory,
  })
  @Index()
  category: AuditCategory;

  @Column({ nullable: true })
  targetId: string;

  @Column({ nullable: true })
  targetType: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'adminId' })
  admin: User;

  @Column({ nullable: true })
  adminId: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
