import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../database/entities/user.entity';
import { Rider } from '../database/entities/rider.entity';
import { RiderGuarantor } from '../database/entities/rider-guarantor.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { EmailService } from '../email/email.service';
import { PaystackService } from '../payments/paystack.service';
import { SessionsService } from './sessions.service';
import { ReferralsService } from '../referrals/referrals.service';
import { DeviceType } from '../database/entities/session.entity';
import { SignupDto, LoginDto, RefreshTokenDto, VerifyOtpDto, TwoFactorLoginDto, GoogleLoginDto, VerifyEmailOtpDto, VerifyPhoneOtpDto, VerifyWhatsAppOtpDto } from './dto';
import { JwtPayload, AuthTokens } from './interfaces';
import { UserRole, VehicleType } from '../common/enums';
import { BCRYPT_ROUNDS } from '../common/config/security.config';

// Response type for login when 2FA is required
export interface TwoFactorRequiredResponse {
  requiresTwoFactor: true;
  tempToken: string;
  message: string;
}

// Response type for successful login
export interface LoginSuccessResponse {
  user: User;
  tokens: AuthTokens;
  requiresTwoFactor?: false;
}

export type LoginResponse = LoginSuccessResponse | TwoFactorRequiredResponse;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
    @InjectRepository(RiderGuarantor)
    private readonly guarantorRepository: Repository<RiderGuarantor>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepository: Repository<FarmerProfile>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
    private readonly sessionsService: SessionsService,
    @Inject(forwardRef(() => ReferralsService))
    private readonly referralsService: ReferralsService,
  ) {
    // Initialize Google OAuth client
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (googleClientId) {
      this.googleClient = new OAuth2Client(googleClientId);
    }
  }

  async signup(dto: SignupDto, deviceInfo?: { ip?: string; userAgent?: string; location?: string }): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if phone already exists
    const existingPhone = await this.userRepository.findOne({
      where: { phone: dto.phone },
    });
    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }

    // Check if email already exists
    if (dto.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Create user
    const user = this.userRepository.create({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      state: dto.state,
      city: dto.city,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      nationality: dto.nationality,
      nationalityCode: dto.nationalityCode,
    });

    await this.userRepository.save(user);

    // Create role-specific profiles
    if (dto.role === UserRole.RIDER) {
      await this.createRiderProfile(user.id, dto);
    } else if (dto.role === UserRole.FARMER) {
      await this.createFarmerProfile(user.id, dto);
    }

    // Apply referral code if provided (async, don't block response)
    if (dto.referralCode) {
      this.referralsService.applyReferralCode(user.id, dto.referralCode).catch((err) => {
        this.logger.error(`Failed to apply referral code ${dto.referralCode} for user ${user.id}: ${err.message}`);
      });
    }

    // Setup Paystack customer and DVA for wallet top-up (async, don't block response)
    this.setupPaystackAccount(user).catch((err) => {
      this.logger.error(`Failed to setup Paystack account for user ${user.id}: ${err.message}`);
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Create session for tracking active devices
    const parsedDevice = this.parseDeviceInfo(deviceInfo?.userAgent);
    const session = await this.sessionsService.createSession({
      userId: user.id,
      deviceName: parsedDevice.deviceName,
      deviceType: parsedDevice.deviceType,
      os: parsedDevice.os,
      osVersion: parsedDevice.osVersion,
      ip: deviceInfo?.ip,
      location: deviceInfo?.location,
      refreshToken: tokens.refreshToken,
    });

    // Add session ID to access token
    const tokensWithSession = await this.generateTokensWithSession(user, session.id);

    // Send welcome email (async, don't block response)
    this.emailService.sendWelcomeEmail(user, deviceInfo).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    return { user, tokens: tokensWithSession };
  }

  /**
   * Setup Paystack customer and DVA (Dedicated Virtual Account) for a user
   * This enables wallet top-up via bank transfer
   */
  private async setupPaystackAccount(user: User): Promise<void> {
    try {
      const result = await this.paystackService.setupUserPaystackAccount(user);
      
      if (result.success) {
        this.logger.log(
          `Paystack DVA created for user ${user.id}: ${result.dvaAccountNumber} (${result.dvaBankName})`
        );
      } else {
        this.logger.warn(`Paystack DVA setup incomplete for user ${user.id}`);
      }
    } catch (error) {
      this.logger.error(`Paystack setup failed for user ${user.id}: ${error.message}`);
      // Don't throw - user account is still created, DVA can be retried later
    }
  }

  async login(dto: LoginDto, twoFactorCode?: string, deviceInfo?: { ip?: string; userAgent?: string; location?: string }): Promise<LoginResponse> {
    // Find user by email or phone
    const user = await this.userRepository.findOne({
      where: [{ email: dto.identifier }, { phone: dto.identifier }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      // If no 2FA code provided, return a temporary token
      if (!twoFactorCode) {
        const tempToken = await this.generateTempToken(user);
        return {
          requiresTwoFactor: true,
          tempToken,
          message: 'Two-factor authentication required',
        };
      }

      // Verify the 2FA code
      if (!user.twoFactorSecret) {
        throw new UnauthorizedException('Two-factor authentication not configured properly');
      }
      const { authenticator } = await import('otplib');
      const isValidCode = authenticator.verify({
        token: twoFactorCode,
        secret: user.twoFactorSecret,
      });

      if (!isValidCode) {
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Create session for tracking active devices
    const parsedDevice = this.parseDeviceInfo(deviceInfo?.userAgent);
    const session = await this.sessionsService.createSession({
      userId: user.id,
      deviceName: parsedDevice.deviceName,
      deviceType: parsedDevice.deviceType,
      os: parsedDevice.os,
      osVersion: parsedDevice.osVersion,
      ip: deviceInfo?.ip,
      location: deviceInfo?.location,
      refreshToken: tokens.refreshToken,
    });

    // Add session ID to access token
    const tokensWithSession = await this.generateTokensWithSession(user, session.id);

    // Send login notification email (async, don't block response)
    this.emailService.sendLoginNotification(user, deviceInfo).catch((err) => {
      console.error('Failed to send login notification:', err);
    });

    return { user, tokens: tokensWithSession, requiresTwoFactor: false };
  }

  /**
   * Complete login with 2FA code after initial login returned tempToken
   */
  async loginWithTwoFactor(dto: TwoFactorLoginDto, deviceInfo?: { ip?: string; userAgent?: string; location?: string }): Promise<LoginSuccessResponse> {
    // Verify temp token and get user ID
    const payload = await this.verifyTempToken(dto.tempToken);
    
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify the 2FA code
    const { authenticator } = await import('otplib');
    const isValidCode = authenticator.verify({
      token: dto.code,
      secret: user.twoFactorSecret,
    });

    if (!isValidCode) {
      throw new UnauthorizedException('Invalid two-factor authentication code');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Create session for tracking active devices
    const parsedDevice = this.parseDeviceInfo(deviceInfo?.userAgent);
    const session = await this.sessionsService.createSession({
      userId: user.id,
      deviceName: parsedDevice.deviceName,
      deviceType: parsedDevice.deviceType,
      os: parsedDevice.os,
      osVersion: parsedDevice.osVersion,
      ip: deviceInfo?.ip,
      location: deviceInfo?.location,
      refreshToken: tokens.refreshToken,
    });

    // Add session ID to access token
    const tokensWithSession = await this.generateTokensWithSession(user, session.id);

    // Send login notification email (async, don't block response)
    this.emailService.sendLoginNotification(user, deviceInfo).catch((err) => {
      console.error('Failed to send login notification:', err);
    });

    return { user, tokens: tokensWithSession };
  }

  /**
   * Login or signup with Google
   */
  async googleLogin(dto: GoogleLoginDto, deviceInfo?: { ip?: string; userAgent?: string; location?: string }): Promise<LoginSuccessResponse> {
    if (!this.googleClient) {
      throw new BadRequestException('Google Sign-In is not configured');
    }

    try {
      // Verify the Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { email, name, sub: googleId, picture } = payload;

      if (!email) {
        throw new BadRequestException('Email is required from Google account');
      }

      // Check if user exists with this email
      let user = await this.userRepository.findOne({
        where: { email },
      });

      if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
          user.googleId = googleId;
          await this.userRepository.save(user);
        }

        // Generate tokens
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        // Create session for tracking active devices
        const parsedDevice = this.parseDeviceInfo(deviceInfo?.userAgent);
        const session = await this.sessionsService.createSession({
          userId: user.id,
          deviceName: parsedDevice.deviceName,
          deviceType: parsedDevice.deviceType,
          os: parsedDevice.os,
          osVersion: parsedDevice.osVersion,
          ip: deviceInfo?.ip,
          location: deviceInfo?.location,
          refreshToken: tokens.refreshToken,
        });

        // Add session ID to access token
        const tokensWithSession = await this.generateTokensWithSession(user, session.id);

        // Send login notification email (async)
        this.emailService.sendLoginNotification(user, {
          ...deviceInfo,
          userAgent: deviceInfo?.userAgent ? `${deviceInfo.userAgent} (Google Sign-In)` : 'Google Sign-In',
        }).catch((err) => {
          this.logger.error('Failed to send login notification:', err);
        });

        return { user, tokens: tokensWithSession };
      }

      // Create new user from Google data
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(randomPassword, BCRYPT_ROUNDS);

      user = this.userRepository.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        password: hashedPassword,
        role: dto.role || UserRole.BUYER,
        isPhoneVerified: false,
        avatar: picture,
      });

      await this.userRepository.save(user);

      // Generate tokens
      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      // Create session for tracking active devices
      const parsedDevice = this.parseDeviceInfo(deviceInfo?.userAgent);
      const session = await this.sessionsService.createSession({
        userId: user.id,
        deviceName: parsedDevice.deviceName,
        deviceType: parsedDevice.deviceType,
        os: parsedDevice.os,
        osVersion: parsedDevice.osVersion,
        ip: deviceInfo?.ip,
        location: deviceInfo?.location,
        refreshToken: tokens.refreshToken,
      });

      // Add session ID to access token
      const tokensWithSession = await this.generateTokensWithSession(user, session.id);

      // Send welcome email (async)
      this.emailService.sendWelcomeEmail(user, deviceInfo).catch((err) => {
        this.logger.error('Failed to send welcome email:', err);
      });

      return { user, tokens: tokensWithSession };
    } catch (error) {
      this.logger.error('Google login error:', error);
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  /**
   * Generate a short-lived temp token for 2FA flow
   */
  private async generateTempToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      type: '2fa_pending',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.accessSecret'),
      expiresIn: '5m', // Token valid for 5 minutes
    });
  }

  /**
   * Verify temp token from 2FA flow
   */
  private async verifyTempToken(token: string): Promise<{ sub: string; type: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.accessSecret'),
      });
      
      if (payload.type !== '2fa_pending') {
        throw new UnauthorizedException('Invalid token type');
      }
      
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }

  async validateUser(identifier: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: undefined });
  }

  async requestOtp(phone: string): Promise<{ otpId: string; expiresIn: number }> {
    return this.otpService.createOtp(phone);
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<LoginResponse> {
    const isValid = await this.otpService.verifyOtp(dto.otpId, dto.code);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Get phone from OTP record
    const phone = await this.otpService.getPhoneByOtpId(dto.otpId);
    if (!phone) {
      throw new BadRequestException('OTP not found');
    }

    // Normalize phone and try multiple formats to find existing user
    const normalizedPhone = this.normalizePhoneNumber(phone);
    const phoneVariations = this.getPhoneVariations(normalizedPhone);
    
    this.logger.log(`OTP Login - Original phone: ${phone}, Normalized: ${normalizedPhone}`);
    this.logger.log(`Phone variations to search: ${JSON.stringify(phoneVariations)}`);
    
    // Find user with any phone variation
    let user = await this.userRepository.findOne({ 
      where: phoneVariations.map(p => ({ phone: p }))
    });
    
    this.logger.log(`User found: ${user ? `ID: ${user.id}, Name: ${user.name}, Phone: ${user.phone}` : 'NOT FOUND - will create new'}`);
    
    if (!user) {
      // Create new user with phone only
      this.logger.warn(`Creating new user for phone: ${normalizedPhone}`);
      user = this.userRepository.create({
        phone: normalizedPhone, // Use normalized format
        name: 'User',
        password: await bcrypt.hash(Math.random().toString(36), BCRYPT_ROUNDS),
        isPhoneVerified: true,
      });
      await this.userRepository.save(user);
    } else {
      // Update phone to normalized format if different
      if (user.phone !== normalizedPhone) {
        this.logger.log(`Updating phone format from ${user.phone} to ${normalizedPhone}`);
        user.phone = normalizedPhone;
      }
      // Mark phone as verified
      user.isPhoneVerified = true;
      await this.userRepository.save(user);

      // Check if 2FA is enabled - require TOTP code
      if (user.isTwoFactorEnabled) {
        const tempToken = await this.generateTempToken(user);
        return {
          requiresTwoFactor: true,
          tempToken,
          message: 'Two-factor authentication required',
        };
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens, requiresTwoFactor: false };
  }

  /**
   * Normalize phone number to +234 format
   */
  private normalizePhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      // 08012345678 -> +2348012345678
      return '+234' + cleaned.slice(1);
    } else if (cleaned.startsWith('234') && cleaned.length === 13) {
      // 2348012345678 -> +2348012345678
      return '+' + cleaned;
    } else if (cleaned.length === 10) {
      // 8012345678 -> +2348012345678
      return '+234' + cleaned;
    }
    
    // Already in correct format or unknown
    return phone.startsWith('+') ? phone : '+' + cleaned;
  }

  // ==================== Email OTP Methods (Login/Signup) ====================

  /**
   * Request OTP via email for login/signup
   */
  async requestEmailOtp(email: string, purpose: 'login' | 'signup' = 'login'): Promise<{ otpId: string; expiresIn: number; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    // For login, user must exist
    if (purpose === 'login' && !existingUser) {
      // Don't reveal if user exists - return success anyway for security
      this.logger.warn(`Email OTP requested for non-existent user: ${normalizedEmail}`);
      return {
        otpId: 'not-found',
        expiresIn: 600,
        message: 'If an account exists with this email, you will receive a verification code',
      };
    }

    // For signup, user should not exist
    if (purpose === 'signup' && existingUser) {
      throw new ConflictException('An account with this email already exists. Please login instead.');
    }

    // Create email OTP
    const otpPurpose = purpose === 'login' ? 'LOGIN' : 'SIGNUP';
    const otp = await this.otpService.createEmailOtp(normalizedEmail, otpPurpose as any);

    return {
      otpId: otp.otpId,
      expiresIn: otp.expiresIn,
      message: `Verification code sent to ${normalizedEmail}`,
    };
  }

  /**
   * Verify email OTP and login/create user
   */
  async verifyEmailOtp(dto: VerifyEmailOtpDto, deviceInfo?: { ip?: string; userAgent?: string; location?: string }): Promise<LoginResponse> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Handle fake OTP ID (from security measure above)
    if (dto.otpId === 'not-found') {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Verify the OTP
    const isValid = await this.otpService.verifyOtp(dto.otpId, dto.code);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Get email from OTP record
    const otpEmail = await this.otpService.getEmailByOtpId(dto.otpId);
    if (!otpEmail || otpEmail.toLowerCase() !== normalizedEmail) {
      throw new BadRequestException('Email does not match verification code');
    }

    // Find or create user
    let user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    const isNewUser = !user;

    if (!user) {
      // Create new user with email only
      this.logger.log(`Creating new user for email: ${normalizedEmail}`);
      user = this.userRepository.create({
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        password: await bcrypt.hash(Math.random().toString(36) + Math.random().toString(36), BCRYPT_ROUNDS),
        isEmailVerified: true,
      });
      await this.userRepository.save(user);

      // Send welcome email (async)
      this.emailService.sendWelcomeEmail(user, deviceInfo).catch((err) => {
        this.logger.error('Failed to send welcome email:', err);
      });
    } else {
      // Mark email as verified
      user.isEmailVerified = true;
      await this.userRepository.save(user);

      // Check if 2FA is enabled
      if (user.isTwoFactorEnabled) {
        const tempToken = await this.generateTempToken(user);
        return {
          requiresTwoFactor: true,
          tempToken,
          message: 'Two-factor authentication required',
        };
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Create session for tracking active devices
    const parsedDevice = this.parseDeviceInfo(deviceInfo?.userAgent);
    const session = await this.sessionsService.createSession({
      userId: user.id,
      deviceName: parsedDevice.deviceName,
      deviceType: parsedDevice.deviceType,
      os: parsedDevice.os,
      osVersion: parsedDevice.osVersion,
      ip: deviceInfo?.ip,
      location: deviceInfo?.location,
      refreshToken: tokens.refreshToken,
    });

    // Add session ID to access token
    const tokensWithSession = await this.generateTokensWithSession(user, session.id);

    // Send login notification for existing users
    if (!isNewUser) {
      this.emailService.sendLoginNotification(user, deviceInfo).catch((err) => {
        this.logger.error('Failed to send login notification:', err);
      });
    }

    return { user, tokens: tokensWithSession, requiresTwoFactor: false };
  }

  // ==================== Phone OTP Methods (Profile Phone Verification) ====================

  /**
   * Request SMS OTP for phone verification (profile update)
   */
  async requestPhoneOtp(phone: string, userId: string): Promise<{ otpId: string; expiresIn: number; message: string }> {
    const normalizedPhone = this.normalizePhoneNumber(phone);

    // Check if phone is already in use by another user
    const existingUser = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('This phone number is already registered to another account');
    }

    // Create phone OTP via SMS (Twilio)
    const otp = await this.otpService.createPhoneOtp(normalizedPhone);

    return {
      otpId: otp.otpId,
      expiresIn: otp.expiresIn,
      message: `Verification code sent to ${normalizedPhone}`,
    };
  }

  /**
   * Verify phone SMS OTP and update user's phone number
   */
  async verifyPhoneOtp(dto: VerifyPhoneOtpDto, userId: string): Promise<{ success: boolean; message: string; phone?: string }> {
    // Verify the OTP
    const isValid = await this.otpService.verifyOtp(dto.otpId, dto.code);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Get phone from OTP record
    const phone = await this.otpService.getPhoneByOtpId(dto.otpId);
    if (!phone) {
      throw new BadRequestException('Verification code not found');
    }

    const normalizedPhone = this.normalizePhoneNumber(phone);

    // Update user's phone number
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.phone = normalizedPhone;
    user.isPhoneVerified = true;
    await this.userRepository.save(user);

    this.logger.log(`Phone number ${normalizedPhone} verified for user ${userId}`);

    return {
      success: true,
      message: 'Phone number verified successfully',
      phone: normalizedPhone,
    };
  }

  // ==================== WhatsApp OTP Methods (Login/Signup via WhatsApp) ====================

  /**
   * Request OTP via WhatsApp for login/signup
   */
  async requestWhatsAppOtp(phone: string, purpose: string = 'login'): Promise<{ otpId: string; expiresIn: number; message: string }> {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    
    // Find user by phone
    const phoneVariations = this.getPhoneVariations(normalizedPhone);
    const existingUser = await this.userRepository.findOne({
      where: phoneVariations.map(p => ({ phone: p })),
    });

    // For login, user must exist
    if (purpose === 'login' && !existingUser) {
      // Don't reveal if user exists - return success anyway for security
      this.logger.warn(`WhatsApp OTP requested for non-existent user: ${normalizedPhone}`);
      return {
        otpId: 'not-found',
        expiresIn: 600,
        message: 'If an account exists with this phone number, you will receive a verification code on WhatsApp',
      };
    }

    // For signup, user should not exist
    if (purpose === 'signup' && existingUser) {
      throw new ConflictException('An account with this phone number already exists. Please login instead.');
    }

    // Create WhatsApp OTP
    const otpPurpose = purpose === 'login' ? 'LOGIN' : purpose === 'signup' ? 'SIGNUP' : 'PASSWORD_RESET';
    const otp = await this.otpService.createWhatsAppOtp(normalizedPhone, otpPurpose as any);

    return {
      otpId: otp.otpId,
      expiresIn: otp.expiresIn,
      message: `Verification code sent to ${normalizedPhone} via WhatsApp`,
    };
  }

  /**
   * Verify WhatsApp OTP and login/create user
   */
  async verifyWhatsAppOtp(dto: VerifyWhatsAppOtpDto, deviceInfo?: { ip?: string; userAgent?: string; location?: string }): Promise<LoginResponse> {
    const normalizedPhone = this.normalizePhoneNumber(dto.phone);

    // Handle fake OTP ID (from security measure above)
    if (dto.otpId === 'not-found') {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Verify the OTP
    const isValid = await this.otpService.verifyOtp(dto.otpId, dto.code);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Get phone from OTP record
    const otpPhone = await this.otpService.getPhoneByOtpId(dto.otpId);
    if (!otpPhone) {
      throw new BadRequestException('Verification code not found');
    }

    const normalizedOtpPhone = this.normalizePhoneNumber(otpPhone);
    if (normalizedOtpPhone !== normalizedPhone) {
      throw new BadRequestException('Phone number does not match verification code');
    }

    // Find or create user
    const phoneVariations = this.getPhoneVariations(normalizedPhone);
    let user = await this.userRepository.findOne({
      where: phoneVariations.map(p => ({ phone: p })),
    });

    const isNewUser = !user;

    if (!user) {
      // Create new user with phone only
      this.logger.log(`Creating new user for phone: ${normalizedPhone}`);
      user = this.userRepository.create({
        phone: normalizedPhone,
        name: `User ${normalizedPhone.slice(-4)}`,
        password: await bcrypt.hash(Math.random().toString(36) + Math.random().toString(36), BCRYPT_ROUNDS),
        isPhoneVerified: true,
      });
      await this.userRepository.save(user);

      // Send welcome notification via WhatsApp (async)
      // Note: Would need to add this to WhatsAppService
    } else {
      // Mark phone as verified
      user.isPhoneVerified = true;
      await this.userRepository.save(user);

      // Check if 2FA is enabled
      if (user.isTwoFactorEnabled) {
        const tempToken = await this.generateTempToken(user);
        return {
          requiresTwoFactor: true,
          tempToken,
          message: 'Two-factor authentication required',
        };
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Create session for tracking active devices
    const parsedDevice = this.parseDeviceInfo(deviceInfo?.userAgent);
    const session = await this.sessionsService.createSession({
      userId: user.id,
      deviceName: parsedDevice.deviceName,
      deviceType: parsedDevice.deviceType,
      os: parsedDevice.os,
      osVersion: parsedDevice.osVersion,
      ip: deviceInfo?.ip,
      location: deviceInfo?.location,
      refreshToken: tokens.refreshToken,
    });

    // Add session ID to access token
    const tokensWithSession = await this.generateTokensWithSession(user, session.id);

    return { user, tokens: tokensWithSession, requiresTwoFactor: false };
  }

  /**
   * Get all possible phone format variations
   */
  private getPhoneVariations(normalizedPhone: string): string[] {
    const cleaned = normalizedPhone.replace(/\D/g, '');
    const variations = [
      normalizedPhone,                    // +2348012345678
      cleaned,                            // 2348012345678
      '0' + cleaned.slice(3),            // 08012345678
      cleaned.slice(3),                   // 8012345678
    ];
    return [...new Set(variations)]; // Remove duplicates
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password and save
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userRepository.update(userId, { password: hashedPassword });

    // Send password changed confirmation email
    this.emailService.sendPasswordChangedEmail(user).catch((err) => {
      console.error('Failed to send password changed email:', err);
    });
  }

  async forgotPassword(identifier: string): Promise<{ otpId: string; message: string }> {
    // Find user by email or phone
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      // Don't reveal if user exists - return success anyway for security
      return {
        otpId: 'fake-id',
        message: 'If an account exists with this email/phone, you will receive a password reset code',
      };
    }

    // Generate OTP using the existing createOtp method (which also sends SMS)
    const otp = await this.otpService.createOtp(user.phone);

    // Also send via email if available
    if (user.email) {
      // Get the OTP code from the database for email
      const otpRecord = await this.otpService.getOtpById(otp.otpId);
      if (otpRecord) {
        this.emailService.sendPasswordResetEmail(user, otpRecord.code, 10).catch((err) => {
          console.error('Failed to send password reset email:', err);
        });
      }
    }

    return {
      otpId: otp.otpId,
      message: 'Password reset code sent to your registered phone/email',
    };
  }

  async resetPassword(otpId: string, code: string, newPassword: string): Promise<{ message: string }> {
    // Get phone from OTP
    const phone = await this.otpService.getPhoneByOtpId(otpId);
    
    if (!phone) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Verify OTP
    const isValid = await this.otpService.verifyOtp(otpId, code);
    
    if (!isValid) {
      throw new BadRequestException('Invalid or expired code');
    }

    // Find user by phone
    const user = await this.userRepository.findOne({
      where: { phone },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if new password is the same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from your current password');
    }

    // Hash new password and save
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userRepository.update(user.id, { password: hashedPassword });

    // Send password changed confirmation email
    if (user.email) {
      this.emailService.sendPasswordChangedEmail(user).catch((err) => {
        console.error('Failed to send password changed email:', err);
      });
    }

    return { message: 'Password reset successfully. You can now login with your new password.' };
  }

  private parseDeviceInfo(userAgent?: string): { deviceName: string; deviceType: DeviceType; os: string; osVersion?: string } {
    if (!userAgent) {
      return { deviceName: 'Unknown Device', deviceType: DeviceType.UNKNOWN, os: 'Unknown' };
    }

    let deviceName = 'Unknown Device';
    let deviceType = DeviceType.UNKNOWN;
    let os = 'Unknown';
    let osVersion: string | undefined;

    // Detect Handwork App (custom format: Handwork/1.0.0 (iOS 17.0; Apple iPhone 15) Expo)
    const handworkMatch = userAgent.match(/Handwork\/[\d.]+ \((\w+) ([\d.]+);?\s*([^)]+)\)/);
    if (handworkMatch) {
      os = handworkMatch[1]; // iOS or Android
      osVersion = handworkMatch[2];
      const deviceInfo = handworkMatch[3].trim();
      deviceType = DeviceType.MOBILE;
      deviceName = deviceInfo || (os === 'iOS' ? 'iPhone (Handwork App)' : 'Android (Handwork App)');
      return { deviceName, deviceType, os, osVersion };
    }

    // Detect Expo/React Native apps with older format
    if (userAgent.includes('Expo') || userAgent.includes('expo')) {
      // Expo apps - try to detect platform
      if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        deviceType = DeviceType.MOBILE;
        os = 'iOS';
        deviceName = 'iPhone (Handwork App)';
        const iosMatch = userAgent.match(/iOS[\/\s]?(\d+\.?\d*)/i);
        if (iosMatch) osVersion = iosMatch[1];
      } else if (userAgent.includes('Android')) {
        deviceType = DeviceType.MOBILE;
        os = 'Android';
        deviceName = 'Android (Handwork App)';
        const androidMatch = userAgent.match(/Android[\/\s]?(\d+\.?\d*)/i);
        if (androidMatch) osVersion = androidMatch[1];
      } else {
        deviceType = DeviceType.MOBILE;
        os = 'Mobile';
        deviceName = 'Handwork App';
      }
    }
    // Detect OS and version from standard browser user agents
    else if (userAgent.includes('iPhone')) {
      deviceType = DeviceType.MOBILE;
      os = 'iOS';
      const match = userAgent.match(/iPhone OS (\d+[_\d]*)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
      deviceName = 'iPhone';
    } else if (userAgent.includes('iPad')) {
      deviceType = DeviceType.TABLET;
      os = 'iPadOS';
      const match = userAgent.match(/CPU OS (\d+[_\d]*)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
      deviceName = 'iPad';
    } else if (userAgent.includes('Android')) {
      deviceType = userAgent.includes('Mobile') ? DeviceType.MOBILE : DeviceType.TABLET;
      os = 'Android';
      const match = userAgent.match(/Android (\d+\.?\d*)/);
      if (match) osVersion = match[1];
      deviceName = deviceType === DeviceType.MOBILE ? 'Android Phone' : 'Android Tablet';
    } else if (userAgent.includes('Windows')) {
      deviceType = DeviceType.DESKTOP;
      os = 'Windows';
      if (userAgent.includes('Windows NT 10')) osVersion = '10';
      else if (userAgent.includes('Windows NT 11')) osVersion = '11';
      deviceName = 'Windows PC';
    } else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) {
      deviceType = DeviceType.DESKTOP;
      os = 'macOS';
      const match = userAgent.match(/Mac OS X (\d+[_\d]*)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
      deviceName = 'Mac';
    } else if (userAgent.includes('Linux')) {
      deviceType = DeviceType.DESKTOP;
      os = 'Linux';
      deviceName = 'Linux PC';
    } else if (userAgent.includes('okhttp') || userAgent.includes('Axios')) {
      // React Native apps using axios often show okhttp or axios in user agent
      deviceType = DeviceType.MOBILE;
      os = 'Mobile';
      deviceName = 'Handwork App';
    }

    return { deviceName, deviceType, os, osVersion };
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async generateTokensWithSession(user: User, sessionId: string): Promise<AuthTokens> {
    const payload: JwtPayload & { sessionId: string } = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.userRepository.update(userId, { refreshToken: hashedRefreshToken });
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Create rider profile with bike details and guarantors
   */
  private async createRiderProfile(userId: string, dto: SignupDto): Promise<Rider> {
    try {
      // Create rider profile
      const rider = this.riderRepository.create({
        userId,
        state: dto.state || '',
        city: dto.city,
        vehicleType: VehicleType.MOTORCYCLE,
        vehicleModel: dto.bikeModel,
        vehiclePlate: dto.plateNumber,
        vehicleColor: dto.bikeColor,
        licenseImage: dto.driversLicense,
        isOnline: false,
        isAvailable: false,
      });

      const savedRider = await this.riderRepository.save(rider);

      // Create guarantors if provided
      if (dto.guarantors && dto.guarantors.length > 0) {
        const guarantors = dto.guarantors.map((g) =>
          this.guarantorRepository.create({
            riderId: savedRider.id,
            name: g.name,
            phone: g.phone,
            occupation: g.occupation,
            relationship: g.relationship,
            address: g.address,
            idImage: g.idDocument,
          }),
        );

        await this.guarantorRepository.save(guarantors);
      }

      this.logger.log(`Rider profile created for user ${userId}`);
      return savedRider;
    } catch (error) {
      this.logger.error(`Failed to create rider profile for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create farmer profile with farm details and verification documents
   */
  private async createFarmerProfile(userId: string, dto: SignupDto): Promise<FarmerProfile> {
    try {
      const farmerProfile = this.farmerProfileRepository.create({
        userId,
        farmName: dto.farmName,
        farmType: dto.farmType,
        farmSize: dto.farmSize,
        farmAddress: dto.address,
        primaryProducts: dto.productCategories?.join(', '),
        bankName: dto.bankName,
        bankCode: dto.bankCode,
        bankAccountNumber: dto.accountNumber,
        bankAccountName: dto.accountName,
        farmerId: dto.idDocument,
        farmPhotos: dto.farmDocument,
        businessRegistrationNumber: dto.cacDocument,
      });

      const savedProfile = await this.farmerProfileRepository.save(farmerProfile);
      this.logger.log(`Farmer profile created for user ${userId}`);
      return savedProfile;
    } catch (error) {
      this.logger.error(`Failed to create farmer profile for user ${userId}: ${error.message}`);
      throw error;
    }
  }
}
