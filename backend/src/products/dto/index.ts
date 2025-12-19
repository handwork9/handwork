import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory } from '../../common/enums';

export class CreateProductDto {
  @ApiProperty({ example: 'Fresh Organic Tomatoes' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Locally grown organic tomatoes', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'kg', default: 'kg' })
  @IsString()
  @IsOptional()
  unit?: string = 'kg';

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ enum: ProductCategory })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({ example: 'tomatoes', required: false })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: 6.5244 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat: number;

  @ApiProperty({ example: 3.3792 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng: number;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  pickupState: string;

  @ApiProperty({ example: 'Ikeja', required: false })
  @IsString()
  @IsOptional()
  pickupCity?: string;

  @ApiProperty({ example: '12 Market Road', required: false })
  @IsString()
  @IsOptional()
  pickupAddress?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  isOrganic?: boolean = false;

  @ApiProperty({ required: false, description: 'Harvest date in ISO 8601 format' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  harvestDate?: Date;

  @ApiProperty({ required: false, description: 'Expiry date in ISO 8601 format' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;

  @ApiProperty({ type: [String], required: false, description: 'Product certifications like organic, pesticide_free, non_gmo, locally_grown' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ required: false, default: 1, description: 'Minimum order quantity' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  minOrderQuantity?: number;

  @ApiProperty({ required: false, description: 'Quantity threshold for bulk discount' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  bulkDiscountQuantity?: number;

  @ApiProperty({ required: false, description: 'Bulk discount percentage (0-100)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  bulkDiscountPercent?: number;
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiProperty({ required: false })
  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isOrganic?: boolean;

  @ApiProperty({ type: [String], required: false, description: 'Product certifications' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ required: false, description: 'Minimum order quantity' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  minOrderQuantity?: number;

  @ApiProperty({ required: false, description: 'Quantity threshold for bulk discount' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  bulkDiscountQuantity?: number;

  @ApiProperty({ required: false, description: 'Bulk discount percentage (0-100)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  bulkDiscountPercent?: number;
}

export class QueryProductsDto {
  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lng?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ required: false, description: 'Radius in km' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  radius?: number;

  @ApiProperty({ required: false })
  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  searchQuery?: string;

  @ApiProperty({ required: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isOrganic?: boolean;

  @ApiProperty({ required: false, enum: ['price_asc', 'price_desc', 'rating', 'newest', 'popular'] })
  @IsString()
  @IsOptional()
  sortBy?: string;
}
