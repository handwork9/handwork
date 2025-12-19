import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { UserRole } from '../../common/enums';

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
