import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { OtpCode, OtpPurpose, OtpDeliveryMethod } from '../database/entities/otp-code.entity';
import { EmailService } from '../email/email.service';
import { generateOTP } from '../common/utils/helpers';

export interface CreateOtpOptions {
  email?: string;
  phone?: string;
  purpose: OtpPurpose;
  deliveryMethod?: OtpDeliveryMethod;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private twilioClient: Twilio | null = null;

  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepository: Repository<OtpCode>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    // Initialize Twilio client if credentials are available
    const accountSid = this.configService.get<string>('services.twilio.accountSid');
    const authToken = this.configService.get<string>('services.twilio.authToken');
    
    if (accountSid && authToken && !accountSid.includes('placeholder')) {
      this.twilioClient = new Twilio(accountSid, authToken);
      this.logger.log('Twilio SMS service initialized');
    } else {
      this.logger.warn('Twilio credentials not configured - SMS will be logged only');
    }
  }

  /**
   * Create OTP for email verification (login/signup)
   * Uses EMAIL as the delivery method
   */
  async createEmailOtp(email: string, purpose: OtpPurpose = OtpPurpose.LOGIN): Promise<{ otpId: string; expiresIn: number }> {
    return this.createOtpInternal({
      email,
      purpose,
      deliveryMethod: OtpDeliveryMethod.EMAIL,
    });
  }

  /**
   * Create OTP for phone verification (profile update)
   * Uses SMS as the delivery method via Twilio
   */
  async createPhoneOtp(phone: string, purpose: OtpPurpose = OtpPurpose.PHONE_VERIFICATION): Promise<{ otpId: string; expiresIn: number }> {
    return this.createOtpInternal({
      phone,
      purpose,
      deliveryMethod: OtpDeliveryMethod.SMS,
    });
  }

  /**
   * Legacy method for backward compatibility - creates phone OTP
   */
  async createOtp(phone: string): Promise<{ otpId: string; expiresIn: number }> {
    // For backward compatibility, phone OTP is used for phone verification
    return this.createPhoneOtp(phone, OtpPurpose.PHONE_VERIFICATION);
  }

  /**
   * Internal method to create OTP with configurable delivery
   */
  private async createOtpInternal(options: CreateOtpOptions): Promise<{ otpId: string; expiresIn: number }> {
    const { email, phone, purpose, deliveryMethod = OtpDeliveryMethod.EMAIL } = options;

    // Invalidate previous OTPs for this identifier
    if (email) {
      await this.otpRepository.update(
        { email, isUsed: false, purpose },
        { isUsed: true },
      );
    }
    if (phone) {
      await this.otpRepository.update(
        { phone, isUsed: false, purpose },
        { isUsed: true },
      );
    }

    const expiresMinutes = this.configService.get('services.twilio.otpExpiresMinutes', 10);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    const otp = this.otpRepository.create({
      email,
      phone,
      code: generateOTP(6),
      purpose,
      deliveryMethod,
      expiresAt,
    });

    await this.otpRepository.save(otp);

    // Send OTP based on delivery method
    if (deliveryMethod === OtpDeliveryMethod.SMS && phone) {
      await this.sendOtpSms(phone, otp.code);
    } else if (deliveryMethod === OtpDeliveryMethod.EMAIL && email) {
      await this.sendOtpEmail(email, otp.code, purpose);
    }

    return {
      otpId: otp.id,
      expiresIn: expiresMinutes * 60, // in seconds
    };
  }

  /**
   * Send OTP via Email
   */
  private async sendOtpEmail(email: string, code: string, purpose: OtpPurpose): Promise<void> {
    const appName = this.configService.get('APP_NAME', 'Handwork');
    
    // Always log in development
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.log(`📧 OTP for ${email}: ${code} (purpose: ${purpose})`);
    }

    try {
      let subject = `Your ${appName} Verification Code`;
      let title = 'Verification Code';
      let description = 'Use this code to verify your identity';

      switch (purpose) {
        case OtpPurpose.LOGIN:
          subject = `Your ${appName} Login Code`;
          title = 'Login Verification';
          description = 'Use this code to complete your login';
          break;
        case OtpPurpose.SIGNUP:
          subject = `Welcome to ${appName} - Verify Your Email`;
          title = 'Email Verification';
          description = 'Use this code to verify your email and complete registration';
          break;
        case OtpPurpose.PASSWORD_RESET:
          subject = `${appName} Password Reset Code`;
          title = 'Password Reset';
          description = 'Use this code to reset your password';
          break;
        case OtpPurpose.EMAIL_VERIFICATION:
          subject = `Verify Your ${appName} Email`;
          title = 'Email Verification';
          description = 'Use this code to verify your email address';
          break;
      }

      await this.emailService.sendVerificationCodeEmail(email, code, {
        subject,
        title,
        description,
        expiresInMinutes: 10,
      });
      
      this.logger.log(`Verification email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}: ${error.message}`);
      // Don't throw - allow OTP to be created even if email fails
    }
  }

  /**
   * Send OTP via Twilio SMS
   */
  private async sendOtpSms(phone: string, code: string): Promise<void> {
    const appName = this.configService.get('APP_NAME', 'Handwork');
    const message = `Your ${appName} verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;

    // Always log in development
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.log(`📱 SMS OTP for ${phone}: ${code}`);
    }

    // Send real SMS if Twilio is configured
    if (this.twilioClient) {
      try {
        const twilioPhone = this.configService.get<string>('services.twilio.phoneNumber');
        
        await this.twilioClient.messages.create({
          body: message,
          from: twilioPhone,
          to: phone,
        });
        
        this.logger.log(`SMS sent successfully to ${phone}`);
      } catch (error) {
        this.logger.error(`Failed to send SMS to ${phone}: ${error.message}`);
        // Don't throw - allow OTP to be created even if SMS fails
      }
    }
  }

  async verifyOtp(otpId: string, code: string): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: { id: otpId },
    });

    if (!otp) {
      return false;
    }

    // Check if expired
    if (otp.expiresAt < new Date()) {
      return false;
    }

    // Check if already used
    if (otp.isUsed) {
      return false;
    }

    // Check attempts
    if (otp.attempts >= 5) {
      return false;
    }

    // Increment attempts
    otp.attempts += 1;
    await this.otpRepository.save(otp);

    // Verify code
    if (otp.code !== code) {
      return false;
    }

    // Mark as used
    otp.isUsed = true;
    await this.otpRepository.save(otp);

    return true;
  }

  async getPhoneByOtpId(otpId: string): Promise<string | null> {
    const otp = await this.otpRepository.findOne({
      where: { id: otpId },
    });
    return otp?.phone || null;
  }

  async getEmailByOtpId(otpId: string): Promise<string | null> {
    const otp = await this.otpRepository.findOne({
      where: { id: otpId },
    });
    return otp?.email || null;
  }

  async getOtpById(otpId: string): Promise<OtpCode | null> {
    return this.otpRepository.findOne({
      where: { id: otpId },
    });
  }

  async cleanupExpiredOtps(): Promise<void> {
    await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
