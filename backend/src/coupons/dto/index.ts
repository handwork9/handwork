import {
  IsString,
  IsEnum,
  IsNumber,
  IsDate,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType, CouponStatus } from '../../database/entities/coupon.entity';

export class CreateCouponDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  code: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsBoolean()
  firstOrderOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  newUsersOnly?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableProductIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedProductIds?: string[];

  @IsOptional()
  @IsString()
  userId?: string;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

  @IsOptional()
  @IsBoolean()
  firstOrderOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  newUsersOnly?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableProductIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedProductIds?: string[];
}

export class ValidateCouponDto {
  @IsString()
  @MinLength(3)
  code: string;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsArray()
  cartItems: {
    productId: string;
    price: number;
    quantity: number;
    category?: string;
  }[];
}

export class ApplyCouponDto {
  @IsString()
  code: string;
}
