import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsUUID, IsOptional } from 'class-validator';

export class AddToCartDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false, description: 'Flash sale ID if adding from flash sale' })
  @IsUUID()
  @IsOptional()
  flashSaleId?: string;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  quantity: number;
}
