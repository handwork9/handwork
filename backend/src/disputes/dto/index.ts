import { IsString, IsEnum, IsOptional, IsNumber, IsArray, IsUUID, MaxLength, MinLength } from 'class-validator';
import { DisputeType, DisputePriority, DisputeStatus, DisputeResolution } from '../../database/entities';

export class CreateDisputeDto {
  @IsUUID()
  orderId: string;

  @IsEnum(DisputeType)
  type: DisputeType;

  @IsString()
  @MinLength(5)
  @MaxLength(255)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsNumber()
  requestedAmount?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDisputeDto {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;

  @IsOptional()
  @IsEnum(DisputeResolution)
  resolution?: DisputeResolution;

  @IsOptional()
  @IsNumber()
  refundedAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}

export class AssignDisputeDto {
  @IsUUID()
  adminId: string;
}

export class SendDisputeMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class ResolveDisputeDto {
  @IsEnum(DisputeResolution)
  resolution: DisputeResolution;

  @IsOptional()
  @IsNumber()
  refundedAmount?: number;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  resolutionNotes: string;
}
