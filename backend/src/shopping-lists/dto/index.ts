import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsArray,
  IsUUID,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateShoppingListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsEnum(['private', 'shared'])
  visibility?: 'private' | 'shared';
}

export class UpdateShoppingListDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsEnum(['private', 'shared'])
  visibility?: 'private' | 'shared';
}

export class AddItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateItemDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isPurchased?: boolean;
}

export class AddMultipleItemsDto {
  @IsArray()
  items: AddItemDto[];
}

export class ReorderItemsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[];
}
