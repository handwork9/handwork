import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDate,
  IsEnum,
  IsObject,
  IsUUID,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GroupBuyStatus, GroupBuyParticipantStatus } from '../../database/entities/group-buy.entity';

class DeliveryOptionsDto {
  @IsBoolean()
  pickupAvailable: boolean;

  @IsBoolean()
  deliveryAvailable: boolean;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsNumber()
  deliveryFee?: number;
}

class DeliveryAddressDto {
  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsObject()
  coordinates?: { lat: number; lng: number };
}

export class CreateGroupBuyDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  originalPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(3)
  minParticipants?: number;

  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantityPerPerson?: number;

  @Type(() => Date)
  @IsDate()
  deadline: Date;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryOptionsDto)
  deliveryOptions?: DeliveryOptionsDto;
}

export class UpdateGroupBuyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deadline?: Date;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryOptionsDto)
  deliveryOptions?: DeliveryOptionsDto;
}

export class JoinGroupBuyDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsEnum(['pickup', 'delivery'])
  deliveryPreference?: 'pickup' | 'delivery';

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;
}

export class PayGroupBuyDto {
  @IsString()
  paymentReference: string;

  @IsNumber()
  amount: number;
}

export class QueryGroupBuysDto {
  @IsOptional()
  @IsEnum(GroupBuyStatus)
  status?: GroupBuyStatus;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  nearMe?: boolean;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class GroupBuyResponseDto {
  id: string;
  title: string;
  description: string;
  product: {
    id: string;
    name: string;
    image: string;
    category: string;
  };
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  originalPrice: number;
  currentPrice: number;
  currentDiscount: number;
  minParticipants: number;
  maxParticipants: number;
  currentParticipants: number;
  quantityPerPerson: number;
  deadline: Date;
  status: GroupBuyStatus;
  isPublic: boolean;
  shareCode: string;
  deliveryOptions: {
    pickupAvailable: boolean;
    deliveryAvailable: boolean;
    pickupLocation?: string;
    deliveryFee?: number;
  };
  participants?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      avatar: string;
    };
    quantity: number;
    status: GroupBuyParticipantStatus;
    isOrganizer: boolean;
    joinedAt: Date;
  }[];
  nextTier?: {
    participantsNeeded: number;
    discount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
