import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { OtpCode } from '../database/entities/otp-code.entity';
import { generateOTP } from '../common/utils/helpers';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private twilioClient: Twilio | null = null;

  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepository: Repository<OtpCode>,
    private readonly configService: ConfigService,
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

  async createOtp(phone: string): Promise<{ otpId: string; expiresIn: number }> {
    // Invalidate previous OTPs for this phone
    await this.otpRepository.update(
      { phone, isUsed: false },
      { isUsed: true },
    );

    const expiresMinutes = this.configService.get('services.twilio.otpExpiresMinutes', 5);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    const otp = this.otpRepository.create({
      phone,
      code: generateOTP(6),
      expiresAt,
    });

    await this.otpRepository.save(otp);

    // Send OTP via Twilio SMS
    await this.sendOtpSms(phone, otp.code);

    return {
      otpId: otp.id,
      expiresIn: expiresMinutes * 60, // in seconds
    };
  }

  /**
   * Send OTP via Twilio SMS
   */
  private async sendOtpSms(phone: string, code: string): Promise<void> {
    const appName = this.configService.get('APP_NAME', 'Handwork');
    const message = `Your ${appName} verification code is: ${code}. Valid for 5 minutes. Do not share this code.`;

    // Always log in development
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.log(`📱 OTP for ${phone}: ${code}`);
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
        // In production, you might want to handle this differently
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

  // private async sendOtpSms(phone: string, code: string): Promise<void> {
  //   const client = require('twilio')(
  //     this.configService.get('services.twilio.accountSid'),
  //     this.configService.get('services.twilio.authToken'),
  //   );

  //   await client.messages.create({
  //     body: `Your Handwork verification code is: ${code}. Valid for 5 minutes.`,
  //     from: this.configService.get('services.twilio.phoneNumber'),
  //     to: phone,
  //   });
  // }
}
