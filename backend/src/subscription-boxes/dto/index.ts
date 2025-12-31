import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { SubscriptionBoxType, BoxSize } from '../../database/entities/subscription-box.entity';

export class CreateSubscriptionBoxDto {
  @ApiProperty({ enum: SubscriptionBoxType, example: 'weekly' })
  @IsEnum(SubscriptionBoxType)
  type: SubscriptionBoxType;

  @ApiProperty({ enum: BoxSize, example: 'medium' })
  @IsEnum(BoxSize)
  size: BoxSize;

  @ApiPropertyOptional({ example: ['vegetables', 'fruits'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredCategories?: string[];

  @ApiPropertyOptional({ example: ['shellfish', 'peanuts'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludedProducts?: string[];

  @ApiProperty({ example: '123 Main Street, Ikeja' })
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ example: 'Ikeja' })
  @IsString()
  deliveryCity: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  deliveryState: string;

  @ApiPropertyOptional({ example: 6.5244 })
  @IsNumber()
  @IsOptional()
  deliveryLatitude?: number;

  @ApiPropertyOptional({ example: 3.3792 })
  @IsNumber()
  @IsOptional()
  deliveryLongitude?: number;

  @ApiPropertyOptional({ example: 6, description: 'Preferred delivery day (0=Sunday, 6=Saturday)' })
  @IsNumber()
  @Min(0)
  @Max(6)
  @IsOptional()
  preferredDeliveryDay?: number;

  @ApiPropertyOptional({ example: '09:00-12:00' })
  @IsString()
  @IsOptional()
  preferredDeliveryTime?: string;

  @ApiPropertyOptional({ example: 'Please leave at the gate' })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional({ example: 'wallet', enum: ['wallet', 'card'] })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class UpdateSubscriptionBoxDto {
  @ApiPropertyOptional({ enum: SubscriptionBoxType })
  @IsEnum(SubscriptionBoxType)
  @IsOptional()
  type?: SubscriptionBoxType;

  @ApiPropertyOptional({ enum: BoxSize })
  @IsEnum(BoxSize)
  @IsOptional()
  size?: BoxSize;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredCategories?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludedProducts?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryCity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryState?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  deliveryLatitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  deliveryLongitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  @IsOptional()
  preferredDeliveryDay?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preferredDeliveryTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class PauseSubscriptionDto {
  @ApiProperty({ example: '2025-01-15', description: 'Resume date' })
  @IsDateString()
  resumeDate: string;
}

export class RateDeliveryDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great selection this week!' })
  @IsString()
  @IsOptional()
  feedback?: string;
}
