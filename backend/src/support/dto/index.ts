import { IsString, IsOptional, IsEnum, IsUUID, IsObject, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketCategory, TicketPriority, SupportMessageType, ReportType, ReportStatus } from '../../database/entities';

export class CreateTicketDto {
  @ApiProperty({ description: 'Subject of the support ticket' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'Related order ID' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Initial message content' })
  @IsOptional()
  @IsString()
  initialMessage?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateGuestTicketDto {
  @ApiPropertyOptional({ description: 'Guest name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Guest email for follow-up' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Guest phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiProperty({ description: 'Initial message content' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Device/app info' })
  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, any>;
}

export class SendGuestMessageDto {
  @ApiProperty({ description: 'Guest session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: SupportMessageType })
  @IsOptional()
  @IsEnum(SupportMessageType)
  type?: SupportMessageType;

  @ApiPropertyOptional({ description: 'Attachments' })
  @IsOptional()
  attachments?: {
    url: string;
    type: string;
    name: string;
    size?: number;
  }[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'Ticket subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignTicketDto {
  @ApiProperty({ description: 'Admin ID to assign to' })
  @IsUUID()
  adminId: string;
}

export class CreateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Type of report' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({ description: 'Ticket ID if reporting within a chat session' })
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @ApiPropertyOptional({ description: 'Additional description of the issue' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateReportDto {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ description: 'Admin notes about this report' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
