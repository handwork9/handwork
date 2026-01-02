import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OtpPurpose {
  LOGIN = 'login',
  SIGNUP = 'signup',
  PASSWORD_RESET = 'password_reset',
  PHONE_VERIFICATION = 'phone_verification',
  EMAIL_VERIFICATION = 'email_verification',
}

export enum OtpDeliveryMethod {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, nullable: true })
  @Index()
  phone: string;

  @Column({ length: 255, nullable: true })
  @Index()
  email: string;

  @Column({ length: 10 })
  code: string;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
    default: OtpPurpose.LOGIN,
  })
  purpose: OtpPurpose;

  @Column({
    type: 'enum',
    enum: OtpDeliveryMethod,
    default: OtpDeliveryMethod.EMAIL,
  })
  deliveryMethod: OtpDeliveryMethod;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @CreateDateColumn()
  createdAt: Date;
}
