import { IsString, IsOptional, IsEnum, IsObject, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsUUID()
  participantId: string;

  @IsEnum(['buyer', 'farmer', 'rider'])
  participantRole: 'buyer' | 'farmer' | 'rider';
}

export class SendMessageDto {
  @IsString()
  text: string;

  @IsEnum(['text', 'image', 'location', 'order_update'])
  @IsOptional()
  type?: 'text' | 'image' | 'location' | 'order_update';

  @IsObject()
  @IsOptional()
  metadata?: {
    imageUrl?: string;
    location?: { lat: number; lng: number };
    orderUpdate?: { status: string; message: string };
  };
}

export class MarkAsReadDto {
  @IsUUID('4', { each: true })
  @IsOptional()
  messageIds?: string[];
}

export class GetMessagesQueryDto {
  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  before?: string;
}
