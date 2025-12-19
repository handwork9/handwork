import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../common/enums';

export class GiftDetailsDto {
  @ApiProperty({ description: 'Name of the gift recipient' })
  @IsString()
  recipientName: string;

  @ApiProperty({ description: 'Phone number of the gift recipient' })
  @IsString()
  recipientPhone: string;

  @ApiProperty({ required: false, description: 'Gift message' })
  @IsString()
  @IsOptional()
  message?: string;
}

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class DeliveryAddressDto {
  @ApiProperty({ example: '12 Victoria Island' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  state: string;

  @ApiProperty({ example: 6.4281 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 3.4219 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: DeliveryAddressDto })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({ type: [OrderItemDto], required: false, description: 'Cart items - if not provided, will use server-side cart' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsArray()
  @IsOptional()
  items?: OrderItemDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  discountCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false, enum: ['card', 'wallet'] })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ required: false, description: 'Payment reference from Paystack for card payments' })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiProperty({ required: false, enum: ['ASAP', 'SCHEDULED'] })
  @IsString()
  @IsOptional()
  deliveryType?: 'ASAP' | 'SCHEDULED';

  @ApiProperty({ required: false, description: 'ISO date string for scheduled delivery' })
  @IsString()
  @IsOptional()
  scheduledDeliveryTime?: string;

  @ApiProperty({ required: false, description: 'Note for the delivery rider' })
  @IsString()
  @IsOptional()
  riderNote?: string;

  @ApiProperty({ required: false, description: 'Message for the farmer' })
  @IsString()
  @IsOptional()
  farmerMessage?: string;

  @ApiProperty({ required: false, description: 'Whether this order is a gift' })
  @IsBoolean()
  @IsOptional()
  isGift?: boolean;

  @ApiProperty({ required: false, description: 'Gift recipient details' })
  @ValidateNested()
  @Type(() => GiftDetailsDto)
  @IsOptional()
  giftDetails?: GiftDetailsDto;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class AssignRiderDto {
  @ApiProperty({ description: 'The rider ID to assign to this order' })
  @IsString()
  riderId: string;
}
