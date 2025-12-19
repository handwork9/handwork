import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export enum PromotionPlanId {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum PromotionBoostType {
  HOMEPAGE = 'homepage_feature',
  CATEGORY = 'category_top',
  SEARCH = 'search_priority',
  BADGE = 'promoted_badge',
}

export enum TargetAudienceType {
  ALL = 'all_buyers',
  PREMIUM = 'premium_buyers',
  LOCAL = 'local_buyers',
  REPEAT = 'repeat_customers',
}

export enum PromotionStatus {
  PENDING_PAYMENT = 'pending_payment',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export class CreatePromotionDto {
  @ApiProperty({ description: 'Product ID to promote' })
  @IsUUID()
  productId: string;

  @ApiProperty({ enum: PromotionPlanId, description: 'Selected promotion plan' })
  @IsEnum(PromotionPlanId)
  planId: PromotionPlanId;

  @ApiProperty({ description: 'Duration in days' })
  @IsNumber()
  @Min(1)
  @Max(90)
  durationDays: number;

  @ApiPropertyOptional({ description: 'Array of selected boost types', type: [String] })
  @IsOptional()
  @IsArray()
  @IsEnum(PromotionBoostType, { each: true })
  boosts?: PromotionBoostType[];

  @ApiPropertyOptional({ enum: TargetAudienceType, description: 'Target audience type' })
  @IsOptional()
  @IsEnum(TargetAudienceType)
  targetAudience?: TargetAudienceType;

  @ApiProperty({ description: 'Total cost in Naira' })
  @IsNumber()
  @Min(0)
  totalCost: number;
}

export class PromotionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  farmerId: string;

  @ApiProperty({ enum: PromotionPlanId })
  planId: PromotionPlanId;

  @ApiProperty()
  durationDays: number;

  @ApiProperty({ type: [String] })
  boosts: PromotionBoostType[];

  @ApiProperty({ enum: TargetAudienceType })
  targetAudience: TargetAudienceType;

  @ApiProperty()
  totalCost: number;

  @ApiProperty({ enum: PromotionStatus })
  status: PromotionStatus;

  @ApiProperty({ nullable: true })
  startDate: Date | null;

  @ApiProperty({ nullable: true })
  endDate: Date | null;

  @ApiProperty()
  views: number;

  @ApiProperty()
  clicks: number;

  @ApiProperty()
  conversions: number;

  @ApiProperty()
  createdAt: Date;
}

export class QueryPromotionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ enum: PromotionStatus })
  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class PromotionStatsDto {
  @ApiProperty()
  totalPromotions: number;

  @ApiProperty()
  activePromotions: number;

  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  totalClicks: number;

  @ApiProperty()
  totalConversions: number;

  @ApiProperty()
  averageConversionRate: number;
}

// Promotion plan pricing configuration
export const PROMOTION_PLANS = {
  [PromotionPlanId.BASIC]: {
    id: PromotionPlanId.BASIC,
    name: 'Basic',
    basePrice: 500,
    duration: '3 days',
    durationDays: 3,
    features: [
      'Promoted badge on product',
      'Higher search ranking',
      'Basic analytics',
    ],
    maxBoosts: 1,
  },
  [PromotionPlanId.STANDARD]: {
    id: PromotionPlanId.STANDARD,
    name: 'Standard',
    basePrice: 1500,
    duration: '7 days',
    durationDays: 7,
    features: [
      'All Basic features',
      'Category page feature',
      'Priority in recommendations',
      'Detailed analytics',
    ],
    maxBoosts: 2,
  },
  [PromotionPlanId.PREMIUM]: {
    id: PromotionPlanId.PREMIUM,
    name: 'Premium',
    basePrice: 4000,
    duration: '14 days',
    durationDays: 14,
    features: [
      'All Standard features',
      'Homepage spotlight',
      'Push notifications to buyers',
      'Premium badge',
      'Advanced analytics & insights',
    ],
    maxBoosts: 4,
  },
};

// Boost pricing
export const BOOST_PRICES = {
  [PromotionBoostType.HOMEPAGE]: 1000,
  [PromotionBoostType.CATEGORY]: 500,
  [PromotionBoostType.SEARCH]: 300,
  [PromotionBoostType.BADGE]: 200,
};

// Target audience pricing multipliers
export const AUDIENCE_MULTIPLIERS = {
  [TargetAudienceType.ALL]: 1.0,
  [TargetAudienceType.PREMIUM]: 1.5,
  [TargetAudienceType.LOCAL]: 1.2,
  [TargetAudienceType.REPEAT]: 1.3,
};
