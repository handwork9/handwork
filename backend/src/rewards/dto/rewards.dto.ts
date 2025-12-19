import { IsString, IsInt, IsOptional, IsEnum, Min, IsUUID, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoyaltyTier, PointSource } from '../../database/entities/loyalty-points.entity';

export class EarnPointsDto {
  @ApiProperty({ description: 'Source of points earned' })
  @IsEnum(PointSource)
  source: PointSource;

  @ApiProperty({ description: 'Number of points to earn' })
  @IsInt()
  @Min(1)
  points: number;

  @ApiPropertyOptional({ description: 'Description of the earning' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Reference ID (e.g., order ID)' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference type (e.g., order, referral)' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RedeemRewardDto {
  @ApiProperty({ description: 'ID of the reward to redeem' })
  @IsUUID()
  rewardId: string;
}

export class CreateRewardDto {
  @ApiProperty({ description: 'Reward name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Reward description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Points cost for redemption' })
  @IsInt()
  @Min(1)
  pointsCost: number;

  @ApiProperty({ 
    description: 'Reward type',
    enum: ['discount', 'free_delivery', 'cashback', 'product', 'voucher'],
  })
  @IsEnum(['discount', 'free_delivery', 'cashback', 'product', 'voucher'])
  type: 'discount' | 'free_delivery' | 'cashback' | 'product' | 'voucher';

  @ApiPropertyOptional({ description: 'Monetary value of reward' })
  @IsOptional()
  @Type(() => Number)
  value?: number;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Required tier for redemption', enum: LoyaltyTier })
  @IsOptional()
  @IsEnum(LoyaltyTier)
  requiredTier?: LoyaltyTier;

  @ApiPropertyOptional({ description: 'Stock limit (-1 for unlimited)' })
  @IsOptional()
  @IsInt()
  stock?: number;

  @ApiPropertyOptional({ description: 'Max redemptions per user' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPerUser?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  startsAt?: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  terms?: string[];
}

export class UpdateRewardDto {
  @ApiPropertyOptional({ description: 'Reward name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Reward description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Points cost for redemption' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pointsCost?: number;

  @ApiPropertyOptional({ 
    description: 'Reward type',
    enum: ['discount', 'free_delivery', 'cashback', 'product', 'voucher'],
  })
  @IsOptional()
  @IsEnum(['discount', 'free_delivery', 'cashback', 'product', 'voucher'])
  type?: 'discount' | 'free_delivery' | 'cashback' | 'product' | 'voucher';

  @ApiPropertyOptional({ description: 'Monetary value of reward' })
  @IsOptional()
  @Type(() => Number)
  value?: number;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Required tier for redemption', enum: LoyaltyTier })
  @IsOptional()
  @IsEnum(LoyaltyTier)
  requiredTier?: LoyaltyTier;

  @ApiPropertyOptional({ description: 'Stock limit (-1 for unlimited)' })
  @IsOptional()
  @IsInt()
  stock?: number;

  @ApiPropertyOptional({ description: 'Max redemptions per user' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPerUser?: number;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  startsAt?: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  terms?: string[];
}

export class AdjustPointsDto {
  @ApiProperty({ description: 'User ID to adjust points for' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Points to add (positive) or remove (negative)' })
  @IsInt()
  points: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  reason: string;
}

export class PointsHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by source', enum: PointSource })
  @IsOptional()
  @IsEnum(PointSource)
  source?: PointSource;

  @ApiPropertyOptional({ description: 'Filter by type (earned/redeemed)' })
  @IsOptional()
  @IsString()
  type?: string;
}
