import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsBoolean, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ==================== ENUMS ====================

export enum BillType {
  AIRTIME = 'airtime',
  DATA = 'data',
  ELECTRICITY = 'electricity',
  TV = 'tv',
  INTERNET = 'internet',
  BETTING = 'betting',
  EDUCATION = 'education',
  GOVERNMENT = 'government',
  TOLL = 'toll',
  INSURANCE = 'insurance',
}

export enum ElectricityMeterType {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
}

export enum NetworkProvider {
  MTN = 'mtn',
  GLO = 'glo',
  AIRTEL = 'airtel',
  NINMOBILE = '9mobile',
}

export enum BillPaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
  REFUNDED = 'refunded',
}

// ==================== REQUEST DTOs ====================

export class GetBillersDto {
  @ApiProperty({ enum: BillType, description: 'Type of bill service' })
  @IsEnum(BillType)
  type: BillType;
}

export class GetBillerPackagesDto {
  @ApiProperty({ description: 'Biller/service code (e.g., mtn-data, dstv)' })
  @IsString()
  @Length(1, 100)
  billerCode: string;
}

export class ValidateCustomerDto {
  @ApiProperty({ description: 'Biller/service code' })
  @IsString()
  @Length(1, 100)
  billerCode: string;

  @ApiProperty({ description: 'Customer ID (meter number, decoder number, phone, account number)' })
  @IsString()
  @Length(1, 100)
  customerId: string;

  @ApiPropertyOptional({ description: 'Item/variation code for specific validation' })
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional({ enum: ElectricityMeterType, description: 'Meter type for electricity' })
  @IsOptional()
  @IsEnum(ElectricityMeterType)
  meterType?: ElectricityMeterType;
}

export class PayBillDto {
  @ApiProperty({ enum: BillType, description: 'Type of bill' })
  @IsEnum(BillType)
  type: BillType;

  @ApiProperty({ description: 'Biller/service code' })
  @IsString()
  @Length(1, 100)
  billerCode: string;

  @ApiProperty({ description: 'Package/variation code' })
  @IsString()
  itemCode: string;

  @ApiProperty({ description: 'Customer ID (phone, meter number, decoder number, etc.)' })
  @IsString()
  @Length(1, 100)
  customerId: string;

  @ApiProperty({ description: 'Amount in Naira', minimum: 50, maximum: 500000 })
  @IsNumber()
  @Min(50)
  @Max(500000)
  amount: number;

  @ApiPropertyOptional({ description: 'Customer name for display' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  customerName?: string;

  @ApiPropertyOptional({ description: 'Meter type for electricity payments' })
  @IsOptional()
  @IsEnum(ElectricityMeterType)
  meterType?: ElectricityMeterType;

  @ApiPropertyOptional({ description: 'Save this biller as beneficiary' })
  @IsOptional()
  @IsBoolean()
  saveBeneficiary?: boolean;
}

export class BuyAirtimeDto {
  @ApiProperty({ description: 'Phone number (Nigerian format)', example: '08012345678' })
  @IsString()
  @Matches(/^(0|\+?234)?[789][01]\d{8}$/, {
    message: 'Invalid Nigerian phone number format',
  })
  phoneNumber: string;

  @ApiProperty({ description: 'Amount in Naira', minimum: 50, maximum: 50000 })
  @IsNumber()
  @Min(50)
  @Max(50000)
  amount: number;

  @ApiProperty({ description: 'Network provider code (mtn, airtel, glo, 9mobile)' })
  @IsString()
  provider: string;

  @ApiPropertyOptional({ description: 'Save as beneficiary' })
  @IsOptional()
  @IsBoolean()
  saveBeneficiary?: boolean;
}

export class BuyDataDto {
  @ApiProperty({ description: 'Phone number', example: '08012345678' })
  @IsString()
  @Matches(/^(0|\+?234)?[789][01]\d{8}$/, {
    message: 'Invalid Nigerian phone number format',
  })
  phoneNumber: string;

  @ApiProperty({ description: 'Data plan/package code' })
  @IsString()
  @Length(1, 100)
  packageCode: string;

  @ApiProperty({ description: 'Biller code (e.g., mtn-data)' })
  @IsString()
  @Length(1, 100)
  billerCode: string;

  @ApiProperty({ description: 'Amount in Naira', minimum: 50 })
  @IsNumber()
  @Min(50)
  amount: number;

  @ApiPropertyOptional({ description: 'Network provider code' })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class PayElectricityDto {
  @ApiProperty({ description: 'Meter number' })
  @IsString()
  @Length(1, 50)
  meterNumber: string;

  @ApiProperty({ description: 'Disco code (e.g., ikeja-electric)' })
  @IsString()
  @Length(1, 100)
  discoCode: string;

  @ApiProperty({ enum: ElectricityMeterType })
  @IsEnum(ElectricityMeterType)
  meterType: ElectricityMeterType;

  @ApiProperty({ description: 'Amount in Naira', minimum: 500 })
  @IsNumber()
  @Min(500)
  @Max(500000)
  amount: number;

  @ApiPropertyOptional({ description: 'Customer name (from validation)' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer address' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional({ description: 'Customer phone for notification' })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}

export class PayTvDto {
  @ApiProperty({ description: 'Smartcard/IUC number' })
  @IsString()
  @Length(1, 50)
  smartcardNumber: string;

  @ApiProperty({ description: 'TV provider code (dstv, gotv, startimes)' })
  @IsString()
  @Length(1, 100)
  providerCode: string;

  @ApiProperty({ description: 'Subscription package code' })
  @IsString()
  @Length(1, 100)
  packageCode: string;

  @ApiProperty({ description: 'Amount in Naira' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({ description: 'Customer name (from validation)' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Current subscription bouquet' })
  @IsOptional()
  @IsString()
  currentBouquet?: string;

  @ApiPropertyOptional({ description: 'Phone for notification' })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}

export class FundBettingDto {
  @ApiProperty({ description: 'Betting account ID/User ID' })
  @IsString()
  @Length(1, 100)
  accountId: string;

  @ApiProperty({ description: 'Betting platform code (bet9ja, sportybet, etc.)' })
  @IsString()
  @Length(1, 100)
  platformCode: string;

  @ApiProperty({ description: 'Amount to fund in Naira', minimum: 100 })
  @IsNumber()
  @Min(100)
  @Max(1000000)
  amount: number;

  @ApiPropertyOptional({ description: 'Account holder name (from validation)' })
  @IsOptional()
  @IsString()
  accountName?: string;
}

export class PayInternetDto {
  @ApiProperty({ description: 'Account number or customer ID' })
  @IsString()
  @Length(1, 100)
  accountNumber: string;

  @ApiProperty({ description: 'ISP code (smile-direct, spectranet)' })
  @IsString()
  @Length(1, 100)
  ispCode: string;

  @ApiProperty({ description: 'Data plan code' })
  @IsString()
  @Length(1, 100)
  planCode: string;

  @ApiProperty({ description: 'Amount in Naira' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Phone for notification' })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}

export class GetBillHistoryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: BillType, description: 'Filter by bill type' })
  @IsOptional()
  @IsEnum(BillType)
  type?: BillType;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ enum: BillPaymentStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(BillPaymentStatus)
  status?: BillPaymentStatus;
}

export class QueryTransactionDto {
  @ApiProperty({ description: 'Transaction reference' })
  @IsString()
  @Length(1, 100)
  reference: string;
}

export class CalculateFeeDto {
  @ApiProperty({ description: 'Biller code' })
  @IsString()
  billerCode: string;

  @ApiProperty({ description: 'Amount in Naira' })
  @IsNumber()
  @Min(1)
  amount: number;
}

// ==================== RESPONSE DTOs ====================

export class BillerResponseDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  shortName: string;

  @ApiProperty({ enum: BillType })
  type: BillType;

  @ApiPropertyOptional()
  logo?: string;

  @ApiPropertyOptional()
  minAmount?: number;

  @ApiPropertyOptional()
  maxAmount?: number;

  @ApiPropertyOptional()
  fee?: number;

  @ApiPropertyOptional()
  hasVariations?: boolean;
}

export class BillerPackageDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  billerCode: string;

  @ApiProperty()
  billerName: string;

  @ApiPropertyOptional()
  validity?: string;

  @ApiPropertyOptional()
  dataSize?: string;

  @ApiPropertyOptional()
  fee?: number;

  @ApiProperty()
  fixedPrice: boolean;
}

export class CustomerValidationResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiPropertyOptional()
  customerName?: string;

  @ApiPropertyOptional()
  customerNumber?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  outstandingAmount?: number;

  @ApiPropertyOptional()
  currentBouquet?: string;

  @ApiPropertyOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  meterNumber?: string;

  @ApiPropertyOptional()
  meterType?: string;

  @ApiPropertyOptional()
  minimumAmount?: number;

  @ApiPropertyOptional()
  accountStatus?: string;
}

// BillReceiptDto must be defined BEFORE BillPaymentResponseDto since it's used as a type
export class BillReceiptDto {
  @ApiProperty()
  receiptNumber: string;

  @ApiProperty()
  billerName: string;

  @ApiProperty()
  customerId: string;

  @ApiPropertyOptional()
  customerName?: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  fee: number;

  @ApiProperty()
  totalAmount: number;

  @ApiPropertyOptional()
  token?: string;

  @ApiPropertyOptional()
  units?: number;

  @ApiProperty()
  transactionDate: string;

  @ApiPropertyOptional()
  additionalInfo?: Record<string, string>;
}

export class BillPaymentResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  fee: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  newBalance: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  transactionDate: string;

  @ApiProperty({ enum: BillPaymentStatus })
  status: BillPaymentStatus;

  // For electricity prepaid
  @ApiPropertyOptional()
  token?: string;

  @ApiPropertyOptional()
  units?: number;

  // For TV
  @ApiPropertyOptional()
  subscriptionEndDate?: string;

  @ApiPropertyOptional()
  providerReference?: string;

  @ApiPropertyOptional()
  receipt?: BillReceiptDto;
}

export class BillHistoryItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: BillType })
  type: BillType;

  @ApiProperty()
  billerCode: string;

  @ApiProperty()
  billerName: string;

  @ApiPropertyOptional()
  itemName?: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  fee: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  customerId: string;

  @ApiPropertyOptional()
  customerName?: string;

  @ApiProperty({ enum: BillPaymentStatus })
  status: BillPaymentStatus;

  @ApiPropertyOptional()
  statusMessage?: string;

  @ApiPropertyOptional()
  token?: string;

  @ApiPropertyOptional()
  units?: number;

  @ApiProperty()
  createdAt: string;

  @ApiPropertyOptional()
  processedAt?: string;
}

export class BillHistoryResponseDto {
  @ApiProperty({ type: [BillHistoryItemDto] })
  data: BillHistoryItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

// ==================== BENEFICIARY DTOs ====================

export class SaveBeneficiaryDto {
  @ApiProperty({ enum: BillType })
  @IsEnum(BillType)
  type: BillType;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  billerCode: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  nickname?: string;
}

export class BillBeneficiaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: BillType })
  type: BillType;

  @ApiProperty()
  billerCode: string;

  @ApiProperty()
  billerName: string;

  @ApiProperty()
  customerId: string;

  @ApiPropertyOptional()
  customerName?: string;

  @ApiPropertyOptional()
  nickname?: string;

  @ApiPropertyOptional()
  logo?: string;

  @ApiProperty()
  lastUsedAt: string;

  @ApiProperty()
  usageCount: number;
}

// ==================== FEE/COMMISSION DTOs ====================

export class BillFeeResponseDto {
  @ApiProperty()
  billerCode: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  fee: number;

  @ApiProperty()
  commission: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  description: string;
}

// ==================== STATISTICS DTOs ====================

export class BillStatisticsDto {
  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  successfulTransactions: number;

  @ApiProperty()
  failedTransactions: number;

  @ApiProperty()
  totalFees: number;

  @ApiProperty()
  totalCommissions: number;

  @ApiProperty()
  byType: Record<BillType, {
    count: number;
    amount: number;
  }>;
}
