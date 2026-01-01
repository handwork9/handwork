import { IsString, IsOptional, IsUUID, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendChatMessageDto {
  @ApiProperty({ description: 'The message to send to the chatbot' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ description: 'Existing conversation ID to continue' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}

export class RateConversationDto {
  @ApiProperty({ description: 'Rating from 1 to 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Optional feedback text' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  feedback?: string;
}

export class EscalateConversationDto {
  @ApiPropertyOptional({ description: 'Reason for escalation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
