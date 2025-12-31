import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, IsEnum, IsNotEmpty, Matches, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../common/enums';

// Guarantor DTO for rider signup
export class GuarantorDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Engineer' })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiProperty({ example: 'Uncle' })
  @IsString()
  @IsOptional()
  relationship?: string;

  @ApiProperty({ example: '123 Main Street, Lagos' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ required: false, description: 'URL to ID document image' })
  @IsString()
  @IsOptional()
  idDocument?: string;
}

export class SignupDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'SecureP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.BUYER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.BUYER;

  @ApiProperty({ example: 'Lagos', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: 'Ikeja', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: '123 Main Street', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 6.5244, required: false, description: 'Latitude coordinate' })
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 3.3792, required: false, description: 'Longitude coordinate' })
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 'Nigeria', required: false })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ example: 'NG', required: false })
  @IsString()
  @IsOptional()
  nationalityCode?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  marketingConsent?: boolean;

  // ===== RIDER SPECIFIC FIELDS =====
  @ApiProperty({ example: 'Honda CBR 150', required: false })
  @IsString()
  @IsOptional()
  bikeModel?: string;

  @ApiProperty({ example: 'ABC-123XY', required: false })
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @ApiProperty({ example: 'Red', required: false })
  @IsString()
  @IsOptional()
  bikeColor?: string;

  @ApiProperty({ required: false, description: 'URL to drivers license image' })
  @IsString()
  @IsOptional()
  driversLicense?: string;

  @ApiProperty({ type: [GuarantorDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuarantorDto)
  @IsOptional()
  guarantors?: GuarantorDto[];

  // ===== FARMER SPECIFIC FIELDS =====
  @ApiProperty({ example: 'Green Acres Farm', required: false })
  @IsString()
  @IsOptional()
  farmName?: string;

  @ApiProperty({ example: 'crop', required: false })
  @IsString()
  @IsOptional()
  farmType?: string;

  @ApiProperty({ example: '50 acres', required: false })
  @IsString()
  @IsOptional()
  farmSize?: string;

  @ApiProperty({ type: [String], required: false, example: ['Vegetables', 'Fruits'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productCategories?: string[];

  @ApiProperty({ example: 'First Bank', required: false })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({ example: '011', required: false, description: 'Bank code from Paystack' })
  @IsString()
  @IsOptional()
  bankCode?: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  accountName?: string;

  @ApiProperty({ example: '12345678901', required: false, description: 'National ID Number' })
  @IsString()
  @IsOptional()
  nin?: string;

  @ApiProperty({ required: false, description: 'URL to farm document image' })
  @IsString()
  @IsOptional()
  farmDocument?: string;

  @ApiProperty({ required: false, description: 'URL to ID document image' })
  @IsString()
  @IsOptional()
  idDocument?: string;

  @ApiProperty({ required: false, description: 'URL to CAC registration document' })
  @IsString()
  @IsOptional()
  cacDocument?: string;

  // ===== BUYER SPECIFIC FIELDS =====
  @ApiProperty({ example: 'card', required: false, enum: ['card', 'bank'] })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ required: false, description: 'Card number (for card payment method)' })
  @IsString()
  @IsOptional()
  cardNumber?: string;

  @ApiProperty({ required: false, description: 'Card expiry (for card payment method)' })
  @IsString()
  @IsOptional()
  cardExpiry?: string;

  // ===== REFERRAL CODE =====
  @ApiProperty({ example: 'ABC123XY', required: false, description: 'Referral/invite code from another user' })
  @IsString()
  @IsOptional()
  referralCode?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com or +2348012345678' })
  @IsString()
  @IsNotEmpty()
  identifier: string; // email or phone

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token from mobile app' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({ enum: UserRole, default: UserRole.BUYER, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.BUYER;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RequestOtpDto {
  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Invalid phone number format' })
  phone: string;
}

// Email OTP for login/signup
export class RequestEmailOtpDto {
  @ApiProperty({ example: 'john@example.com', description: 'Email address to send OTP to' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'login', 
    description: 'Purpose of OTP: login, signup',
    enum: ['login', 'signup'],
    required: false 
  })
  @IsString()
  @IsOptional()
  purpose?: 'login' | 'signup';
}

// Phone OTP for profile verification (uses Twilio SMS)
export class RequestPhoneOtpDto {
  @ApiProperty({ example: '+2348012345678', description: 'Phone number to send SMS OTP to' })
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Invalid phone number format' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  otpId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'OTP must be 6 digits' })
  code: string;
}

// Verify email OTP and login
export class VerifyEmailOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  otpId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'OTP must be 6 digits' })
  code: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// Verify phone OTP (for profile)
export class VerifyPhoneOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  otpId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'OTP must be 6 digits' })
  code: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldP@ss123' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

// Two-Factor Authentication DTOs
export class LoginWithTwoFactorDto extends LoginDto {
  @ApiProperty({ example: '123456', required: false, description: '6-digit TOTP code from authenticator app' })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{6}$/, { message: 'Two-factor code must be 6 digits' })
  twoFactorCode?: string;
}

export class TwoFactorCodeDto {
  @ApiProperty({ example: '123456', description: '6-digit TOTP code from authenticator app' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, { message: 'Two-factor code must be 6 digits' })
  code: string;
}

export class TwoFactorLoginDto {
  @ApiProperty({ description: 'Temporary token received after initial login' })
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({ example: '123456', description: '6-digit TOTP code from authenticator app' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, { message: 'Two-factor code must be 6 digits' })
  code: string;
}

// Forgot Password DTOs
export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'OTP ID received from forgot password request' })
  @IsString()
  @IsNotEmpty()
  otpId: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Code must be 6 digits' })
  code: string;

  @ApiProperty({ example: 'NewSecureP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
