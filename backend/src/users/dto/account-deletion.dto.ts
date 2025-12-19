import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeletionReason } from '../../database/entities/account-deletion-request.entity';

export class RequestAccountDeletionDto {
  @ApiProperty({
    enum: DeletionReason,
    description: 'Reason for account deletion',
    example: DeletionReason.NOT_USING,
  })
  @IsEnum(DeletionReason)
  reason: DeletionReason;

  @ApiPropertyOptional({
    description: 'Additional details about the deletion request',
    example: 'I no longer need this service',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalDetails?: string;

  @ApiProperty({
    description: 'User password for confirmation',
    example: 'MyPassword123',
  })
  @IsString()
  password: string;
}

export class ReviewDeletionRequestDto {
  @ApiProperty({
    description: 'Whether to approve or reject the request',
    example: true,
  })
  approve: boolean;

  @ApiPropertyOptional({
    description: 'Admin notes about the decision',
    example: 'User confirmed via support ticket',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNotes?: string;

  @ApiPropertyOptional({
    description: 'Reason for rejection (required if rejecting)',
    example: 'User has pending orders',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
