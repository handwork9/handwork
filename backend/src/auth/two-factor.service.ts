import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { User } from '../database/entities/user.entity';

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeDataUrl: string;
  otpauthUrl: string;
}

@Injectable()
export class TwoFactorService {
  private readonly appName: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.appName = this.configService.get('APP_NAME', 'Handwork');
  }

  /**
   * Generate a new TOTP secret and QR code for a user
   */
  async generateSecret(userId: string): Promise<TwoFactorSetupResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate a new secret key
    const secret = authenticator.generateSecret();

    // Create the otpauth URL for authenticator apps
    const otpauthUrl = authenticator.keyuri(
      user.email || user.phone,
      this.appName,
      secret,
    );

    // Generate QR code as data URL
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    // Temporarily store the secret (it will be saved permanently after verification)
    await this.userRepository.update(userId, { twoFactorSecret: secret });

    return {
      secret,
      qrCodeDataUrl,
      otpauthUrl,
    };
  }

  /**
   * Verify a TOTP code against a user's secret
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication not set up');
    }

    // Allow for some time drift (1 step = 30 seconds)
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    return isValid;
  }

  /**
   * Enable 2FA for a user after verifying the setup code
   */
  async enable(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException(
        'Please generate a secret first by calling /auth/2fa/generate',
      );
    }

    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    // Verify the code before enabling
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable 2FA
    await this.userRepository.update(userId, { isTwoFactorEnabled: true });

    return { message: 'Two-factor authentication enabled successfully' };
  }

  /**
   * Disable 2FA for a user after verifying the current code
   */
  async disable(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify the code before disabling
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Disable 2FA and clear the secret
    await this.userRepository.update(userId, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    });

    return { message: 'Two-factor authentication disabled successfully' };
  }

  /**
   * Get 2FA status for a user
   */
  async getStatus(userId: string): Promise<{ isEnabled: boolean }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return { isEnabled: user.isTwoFactorEnabled };
  }

  /**
   * Validate a 2FA code during login
   * Returns true if 2FA is not enabled or if the code is valid
   */
  async validateLoginCode(userId: string, code?: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return false;
    }

    // If 2FA is not enabled, allow login
    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return true;
    }

    // If 2FA is enabled but no code provided, deny
    if (!code) {
      return false;
    }

    // Verify the code
    return authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });
  }

  /**
   * Check if a user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'isTwoFactorEnabled'],
    });
    return user?.isTwoFactorEnabled ?? false;
  }

  /**
   * Generate backup codes for account recovery
   * (Optional feature - can be implemented later)
   */
  generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
