import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyAsFarmerDto {
  @ApiProperty({ description: 'Farm name', example: 'Green Valley Farms' })
  @IsString()
  @IsNotEmpty()
  farmName: string;

  @ApiProperty({ description: 'Farm description', example: 'Organic vegetable farm...' })
  @IsString()
  @IsNotEmpty()
  farmDescription: string;

  @ApiProperty({ description: 'Farm street address', example: '123 Farm Road' })
  @IsString()
  @IsNotEmpty()
  farmAddress: string;

  @ApiProperty({ description: 'City', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  farmCity: string;

  @ApiProperty({ description: 'State', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  farmState: string;

  @ApiProperty({ description: 'Product categories', example: ['vegetables', 'fruits'] })
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiProperty({ description: 'Bank name', example: 'First Bank' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ description: 'Bank account number', example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Account holder name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiPropertyOptional({ description: 'Farm type', example: 'Organic' })
  @IsOptional()
  @IsString()
  farmType?: string;

  @ApiPropertyOptional({ description: 'Farm size', example: '5 acres' })
  @IsOptional()
  @IsString()
  farmSize?: string;

  @ApiPropertyOptional({ description: 'Years of experience', example: '5' })
  @IsOptional()
  @IsString()
  yearsOfExperience?: string;

  @ApiPropertyOptional({ description: 'Has own transportation', example: false })
  @IsOptional()
  @IsBoolean()
  hasTransportation?: boolean;
}
