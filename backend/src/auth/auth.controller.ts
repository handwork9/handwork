import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { SignupDto, LoginDto, RefreshTokenDto, RequestOtpDto, VerifyOtpDto, ChangePasswordDto, TwoFactorCodeDto, TwoFactorLoginDto, ForgotPasswordDto, ResetPasswordDto, GoogleLoginDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, Public } from '../common/decorators';
import { User } from '../database/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * Extract device info from request for email notifications
   */
  private getDeviceInfo(req: Request, ip?: string): { ip?: string; userAgent?: string; location?: string } {
    const clientIp = ip || req.ip || req.headers['x-forwarded-for']?.toString()?.split(',')[0] || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    // Location would typically be looked up from IP via a service like ip-api.com
    // For now, we'll leave it as undefined and can enhance later
    return {
      ip: clientIp,
      userAgent,
      location: undefined, // Can be enhanced with IP geolocation service
    };
  }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Phone or email already exists' })
  async signup(@Body() dto: SignupDto, @Req() req: Request, @Ip() ip: string) {
    const deviceInfo = this.getDeviceInfo(req, ip);
    const { user, tokens } = await this.authService.signup(dto, deviceInfo);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/phone and password' })
  @ApiResponse({ status: 200, description: 'Login successful or 2FA required' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Ip() ip: string) {
    const deviceInfo = this.getDeviceInfo(req, ip);
    const result = await this.authService.login(dto, undefined, deviceInfo);

    // Check if 2FA is required
    if ('requiresTwoFactor' in result && result.requiresTwoFactor === true) {
      return result;
    }

    // Normal login response
    return {
      user: this.sanitizeUser(result.user),
      ...result.tokens,
    };
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or signup with Google' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async googleLogin(@Body() dto: GoogleLoginDto, @Req() req: Request, @Ip() ip: string) {
    const deviceInfo = this.getDeviceInfo(req, ip);
    const { user, tokens } = await this.authService.googleLogin(dto, deviceInfo);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  @Public()
  @Post('2fa/verify-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete login with 2FA code' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code or session' })
  async verifyTwoFactorLogin(@Body() dto: TwoFactorLoginDto, @Req() req: Request, @Ip() ip: string) {
    const deviceInfo = this.getDeviceInfo(req, ip);
    const { user, tokens } = await this.authService.loginWithTwoFactor(dto, deviceInfo);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for phone verification' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and login' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully or 2FA required' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(dto);
    
    // Check if 2FA is required
    if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
      return result;
    }
    
    // Normal login response
    const { user, tokens } = result as { user: any; tokens: any };
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser('id') userId: string) {
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  async getMe(@CurrentUser() user: User) {
    return this.sanitizeUser(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
    return { message: 'Password changed successfully' };
  }

  // ==================== Two-Factor Authentication ====================

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  @ApiResponse({ status: 200, description: 'Returns secret and QR code' })
  async generateTwoFactorSecret(@CurrentUser('id') userId: string) {
    return this.twoFactorService.generateSecret(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enable 2FA after verifying setup code' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async enableTwoFactor(
    @CurrentUser('id') userId: string,
    @Body() dto: TwoFactorCodeDto,
  ) {
    return this.twoFactorService.enable(userId, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Disable 2FA with verification code' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid verification code' })
  async disableTwoFactor(
    @CurrentUser('id') userId: string,
    @Body() dto: TwoFactorCodeDto,
  ) {
    return this.twoFactorService.disable(userId, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current 2FA status' })
  @ApiResponse({ status: 200, description: 'Returns 2FA status' })
  async getTwoFactorStatus(@CurrentUser('id') userId: string) {
    return this.twoFactorService.getStatus(userId);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.otpId, dto.code, dto.newPassword);
  }

  private sanitizeUser(user: User) {
    const { password, refreshToken, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}
