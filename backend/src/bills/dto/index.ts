import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BillType {
  AIRTIME = 'airtime',
  DATA = 'data',
  ELECTRICITY = 'electricity',
  TV = 'tv',
  INTERNET = 'internet',
  BETTING = 'betting',
}

export class GetBillersDto {
  @ApiProperty({ enum: BillType, description: 'Type of bill' })
  @IsEnum(BillType)
  type: BillType;
}

export class GetBillerPackagesDto {
  @ApiProperty({ description: 'Biller slug/code' })
  @IsString()
  billerCode: string;
}

export class ValidateCustomerDto {
  @ApiProperty({ description: 'Biller item code' })
  @IsString()
  itemCode: string;

  @ApiProperty({ description: 'Biller code' })
  @IsString()
  billerCode: string;

  @ApiProperty({ description: 'Customer ID (meter number, decoder number, phone number, etc.)' })
  @IsString()
  customerId: string;
}

export class PayBillDto {
  @ApiProperty({ description: 'Bill type' })
  @IsEnum(BillType)
  type: BillType;

  @ApiProperty({ description: 'Biller code' })
  @IsString()
  billerCode: string;

  @ApiProperty({ description: 'Biller item code (package/plan)' })
  @IsString()
  itemCode: string;

  @ApiProperty({ description: 'Customer ID (phone number, meter number, decoder number, etc.)' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Amount in Naira (kobo will be calculated)' })
  @IsNumber()
  @Min(50) // Minimum 50 Naira
  amount: number;

  @ApiPropertyOptional({ description: 'Customer name (for validation display)' })
  @IsOptional()
  @IsString()
  customerName?: string;
}

export class BuyAirtimeDto {
  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Amount in Naira' })
  @IsNumber()
  @Min(50)
  amount: number;

  @ApiProperty({ description: 'Network provider code (mtn, airtel, glo, 9mobile)' })
  @IsString()
  provider: string;
}

export class BuyDataDto {
  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Data plan code' })
  @IsString()
  packageCode: string;

  @ApiProperty({ description: 'Biller code' })
  @IsString()
  billerCode: string;

  @ApiProperty({ description: 'Amount in Naira' })
  @IsNumber()
  @Min(50)
  amount: number;

  @ApiPropertyOptional({ description: 'Network provider code' })
  @IsOptional()
  @IsString()
  provider?: string;
}
