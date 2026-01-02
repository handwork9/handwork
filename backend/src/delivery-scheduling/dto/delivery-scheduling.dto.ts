import { IsUUID, IsDateString, IsOptional, IsString, IsBoolean } from 'class-validator';

export class ScheduleDeliveryDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  slotId: string;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsBoolean()
  isExpress?: boolean;
}

export class UpdateScheduledDeliveryDto {
  @IsOptional()
  @IsUUID()
  slotId?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class GetAvailableSlotsDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
