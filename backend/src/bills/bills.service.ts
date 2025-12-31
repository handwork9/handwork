import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { 
  User, 
  WalletTransaction, 
  TransactionType, 
  TransactionCategory, 
  WalletOwnerType 
} from '../database/entities';
import { BillPayment, BillPaymentStatus, BillType as BillTypeEntity } from '../database/entities/bill-payment.entity';
import { 
  BillType, 
  PayBillDto, 
  ValidateCustomerDto,
  GetBillHistoryDto,
  BuyAirtimeDto,
  BuyDataDto,
  PayElectricityDto,
  PayTvDto,
  FundBettingDto,
  PayInternetDto,
  CalculateFeeDto,
  BillPaymentStatus as BillPaymentStatusDto,
} from './dto';

// VTpass service IDs mapping
const VTPASS_SERVICE_IDS: Record<BillType, string[]> = {
  [BillType.AIRTIME]: ['mtn', 'glo', 'airtel', 'etisalat'],
  [BillType.DATA]: ['mtn-data', 'glo-data', 'airtel-data', 'etisalat-data'],
  [BillType.ELECTRICITY]: [
    'ikeja-electric', 'eko-electric', 'kano-electric', 'portharcourt-electric', 
    'jos-electric', 'ibadan-electric', 'kaduna-electric', 'abuja-electric', 
    'enugu-electric', 'benin-electric', 'yola-electric'
  ],
  [BillType.TV]: ['dstv', 'gotv', 'startimes', 'showmax'],
  [BillType.INTERNET]: ['smile-direct', 'spectranet', 'swift-network', 'ipnx'],
  [BillType.BETTING]: [
    'bet9ja', 'betking', 'sportybet', '1xbet', 'betway', 
    'nairabet', 'merrybet', 'betland', 'supabet', 'frapapa',
    'msport', 'bangbet', 'betlion', 'livescorebet'
  ],
  [BillType.EDUCATION]: ['waec', 'jamb', 'nabteb'],
  [BillType.GOVERNMENT]: ['tin', 'nin'],
  [BillType.TOLL]: ['lcc'],
  [BillType.INSURANCE]: [],
};

// Static billers list with enhanced info
interface BillerInfo {
  code: string;
  name: string;
  shortName: string;
  logo?: string;
  minAmount?: number;
  maxAmount?: number;
  fee?: number;
  hasVariations?: boolean;
}

const BILLERS_LIST: Record<BillType, BillerInfo[]> = {
  [BillType.AIRTIME]: [
    { code: 'mtn', name: 'MTN Nigeria', shortName: 'MTN', minAmount: 50, maxAmount: 50000, hasVariations: false },
    { code: 'glo', name: 'Glo Nigeria', shortName: 'GLO', minAmount: 50, maxAmount: 50000, hasVariations: false },
    { code: 'airtel', name: 'Airtel Nigeria', shortName: 'Airtel', minAmount: 50, maxAmount: 50000, hasVariations: false },
    { code: 'etisalat', name: '9mobile Nigeria', shortName: '9mobile', minAmount: 50, maxAmount: 50000, hasVariations: false },
  ],
  [BillType.DATA]: [
    { code: 'mtn-data', name: 'MTN Data', shortName: 'MTN', minAmount: 100, maxAmount: 50000, hasVariations: true },
    { code: 'glo-data', name: 'Glo Data', shortName: 'GLO', minAmount: 100, maxAmount: 50000, hasVariations: true },
    { code: 'airtel-data', name: 'Airtel Data', shortName: 'Airtel', minAmount: 100, maxAmount: 50000, hasVariations: true },
    { code: 'etisalat-data', name: '9mobile Data', shortName: '9mobile', minAmount: 100, maxAmount: 50000, hasVariations: true },
  ],
  [BillType.ELECTRICITY]: [
    { code: 'ikeja-electric', name: 'Ikeja Electric', shortName: 'IKEDC', minAmount: 500, maxAmount: 500000, hasVariations: true },
    { code: 'eko-electric', name: 'Eko Electric', shortName: 'EKEDC', minAmount: 500, maxAmount: 500000, hasVariations: true },
    { code: 'abuja-electric', name: 'Abuja Electric', shortName: 'AEDC', minAmount: 500, maxAmount: 500000, hasVariations: true },
    { code: 'kano-electric', name: 'Kano Electric', shortName: 'KEDCO', minAmount: 500, maxAmount: 500000, hasVariations: true },
    { code: 'portharcourt-electric', name: 'Port Harcourt Electric', shortName: 'PHED', minAmount: 500, maxAmount: 500000, hasVariations: true },
    { code: 'ibadan-electric', name: 'Ibadan Electric', shortName: 'IBEDC', minAmount: 500, maxAmount: 500000, hasVariations: true },
    { code: 'kaduna-electric', name: 'Kaduna Electric', shortName: 'KAEDCO', minAmount: 500, maxAmount: 500000, hasVariations: true },
    { code: 'jos-electric', name: 'Jos Electric', shortName: 'JED', minAmount: 500, maxAmount: 500000, hasVariations: true },
    { code: 'enugu-electric', name: 'Enugu Electric', shortName: 'EEDC', minAmount: 500, maxAmount: 500000, hasVariations: true },
    { code: 'benin-electric', name: 'Benin Electric', shortName: 'BEDC', minAmount: 500, maxAmount: 500000, hasVariations: true },
  ],
  [BillType.TV]: [
    { code: 'dstv', name: 'DSTV', shortName: 'DSTV', hasVariations: true },
    { code: 'gotv', name: 'GOtv', shortName: 'GOtv', hasVariations: true },
    { code: 'startimes', name: 'StarTimes', shortName: 'StarTimes', hasVariations: true },
    { code: 'showmax', name: 'Showmax', shortName: 'Showmax', hasVariations: true },
  ],
  [BillType.INTERNET]: [
    { code: 'smile-direct', name: 'Smile', shortName: 'Smile', hasVariations: true },
    { code: 'spectranet', name: 'Spectranet', shortName: 'Spectranet', hasVariations: true },
    { code: 'swift-network', name: 'Swift Network', shortName: 'Swift', hasVariations: true },
    { code: 'ipnx', name: 'ipNX', shortName: 'ipNX', hasVariations: true },
  ],
  [BillType.BETTING]: [
    { code: 'bet9ja', name: 'Bet9ja', shortName: 'Bet9ja', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: 'betking', name: 'BetKing', shortName: 'BetKing', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: 'sportybet', name: 'SportyBet', shortName: 'SportyBet', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: '1xbet', name: '1xBet', shortName: '1xBet', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: 'betway', name: 'Betway', shortName: 'Betway', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: 'nairabet', name: 'NairaBet', shortName: 'NairaBet', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: 'merrybet', name: 'MerryBet', shortName: 'MerryBet', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: 'betland', name: 'BetLand', shortName: 'BetLand', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: 'supabet', name: 'SupaBet', shortName: 'SupaBet', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: 'frapapa', name: 'Frapapa', shortName: 'Frapapa', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: 'msport', name: 'MSport', shortName: 'MSport', minAmount: 100, maxAmount: 1000000, hasVariations: false },
    { code: 'bangbet', name: 'BangBet', shortName: 'BangBet', minAmount: 100, maxAmount: 1000000, hasVariations: false },
  ],
  [BillType.EDUCATION]: [
    { code: 'waec', name: 'WAEC Result Checker', shortName: 'WAEC', hasVariations: true },
    { code: 'jamb', name: 'JAMB', shortName: 'JAMB', hasVariations: true },
    { code: 'nabteb', name: 'NABTEB', shortName: 'NABTEB', hasVariations: true },
  ],
  [BillType.GOVERNMENT]: [
    { code: 'tin', name: 'TIN Registration', shortName: 'TIN', hasVariations: false },
    { code: 'nin', name: 'NIN Services', shortName: 'NIN', hasVariations: false },
  ],
  [BillType.TOLL]: [
    { code: 'lcc', name: 'Lekki Toll', shortName: 'LCC', minAmount: 100, hasVariations: false },
  ],
  [BillType.INSURANCE]: [],
};

interface VTpassVariation {
  variation_code: string;
  name: string;
  variation_amount: string;
  fixedPrice: string;
}

interface VTpassResponse {
  code: string;
  response_description: string;
  content?: any;
}

// Fee structure (can be made configurable)
const FEE_STRUCTURE: Record<BillType, { percentage: number; fixed: number; min: number; max: number }> = {
  [BillType.AIRTIME]: { percentage: 0, fixed: 0, min: 0, max: 0 },
  [BillType.DATA]: { percentage: 0, fixed: 0, min: 0, max: 0 },
  [BillType.ELECTRICITY]: { percentage: 0, fixed: 100, min: 100, max: 100 },
  [BillType.TV]: { percentage: 0, fixed: 100, min: 100, max: 100 },
  [BillType.INTERNET]: { percentage: 0, fixed: 100, min: 100, max: 100 },
  [BillType.BETTING]: { percentage: 0, fixed: 50, min: 50, max: 50 },
  [BillType.EDUCATION]: { percentage: 0, fixed: 50, min: 50, max: 50 },
  [BillType.GOVERNMENT]: { percentage: 0, fixed: 100, min: 100, max: 100 },
  [BillType.TOLL]: { percentage: 0, fixed: 0, min: 0, max: 0 },
  [BillType.INSURANCE]: { percentage: 0, fixed: 0, min: 0, max: 0 },
};

@Injectable()
export class BillsService {
  private readonly logger = new Logger(BillsService.name);
  private vtpassClient: AxiosInstance;
  private readonly vtpassApiKey: string;
  private readonly vtpassSecretKey: string;
  private readonly isProduction: boolean;

  constructor(
    private configService: ConfigService,
    private dataSource: DataSource,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.vtpassApiKey = this.configService.get<string>('VTPASS_API_KEY') || '';
    this.vtpassSecretKey = this.configService.get<string>('VTPASS_SECRET_KEY') || '';
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    const baseURL = this.isProduction 
      ? 'https://vtpass.com/api' 
      : 'https://sandbox.vtpass.com/api';

    this.vtpassClient = axios.create({
      baseURL,
      headers: {
        'api-key': this.vtpassApiKey,
        'secret-key': this.vtpassSecretKey,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds timeout
    });

    this.logger.log(`VTpass client initialized for ${this.isProduction ? 'production' : 'sandbox'}`);
  }

  /**
   * Calculate fee for a bill payment
   */
  calculateFee(type: BillType, amount: number): { fee: number; commission: number } {
    const feeConfig = FEE_STRUCTURE[type] || { percentage: 0, fixed: 0, min: 0, max: 0 };
    
    let fee = feeConfig.fixed + (amount * feeConfig.percentage / 100);
    fee = Math.max(fee, feeConfig.min);
    fee = Math.min(fee, feeConfig.max);
    
    // Commission is the platform's cut (adjust as needed)
    const commission = fee * 0.3; // 30% of fee goes to platform
    
    return { fee: Math.round(fee), commission: Math.round(commission) };
  }

  /**
   * Get fee calculation for frontend display
   */
  async getFeeCalculation(dto: CalculateFeeDto): Promise<any> {
    // Determine bill type from biller code
    let billType: BillType | null = null;
    for (const [type, billers] of Object.entries(BILLERS_LIST)) {
      if (billers.some(b => b.code === dto.billerCode)) {
        billType = type as BillType;
        break;
      }
    }
    
    if (!billType) {
      throw new BadRequestException('Unknown biller code');
    }
    
    const { fee, commission } = this.calculateFee(billType, dto.amount);
    
    return {
      billerCode: dto.billerCode,
      amount: dto.amount,
      fee,
      commission,
      totalAmount: dto.amount + fee,
      description: fee > 0 ? `Service fee: ₦${fee}` : 'No service fee',
    };
  }

  /**
   * Get list of billers by type (returns static list with enhanced info)
   */
  async getBillers(type: BillType): Promise<any[]> {
    const billers = BILLERS_LIST[type] || [];
    return billers.map((biller) => ({
      ...biller,
      type,
    }));
  }

  /**
   * Get all available bill types with counts
   */
  async getBillTypes(): Promise<any[]> {
    return Object.entries(BILLERS_LIST)
      .filter(([_, billers]) => billers.length > 0)
      .map(([type, billers]) => ({
        type,
        name: this.getBillTypeName(type as BillType),
        icon: this.getBillTypeIcon(type as BillType),
        color: this.getBillTypeColor(type as BillType),
        providerCount: billers.length,
      }));
  }

  private getBillTypeName(type: BillType): string {
    const names: Record<BillType, string> = {
      [BillType.AIRTIME]: 'Airtime',
      [BillType.DATA]: 'Data Bundle',
      [BillType.ELECTRICITY]: 'Electricity',
      [BillType.TV]: 'TV Subscription',
      [BillType.INTERNET]: 'Internet',
      [BillType.BETTING]: 'Betting',
      [BillType.EDUCATION]: 'Education',
      [BillType.GOVERNMENT]: 'Government',
      [BillType.TOLL]: 'Toll Payment',
      [BillType.INSURANCE]: 'Insurance',
    };
    return names[type] || type;
  }

  private getBillTypeIcon(type: BillType): string {
    const icons: Record<BillType, string> = {
      [BillType.AIRTIME]: 'phone-portrait',
      [BillType.DATA]: 'wifi',
      [BillType.ELECTRICITY]: 'flash',
      [BillType.TV]: 'tv',
      [BillType.INTERNET]: 'globe',
      [BillType.BETTING]: 'game-controller',
      [BillType.EDUCATION]: 'school',
      [BillType.GOVERNMENT]: 'business',
      [BillType.TOLL]: 'car',
      [BillType.INSURANCE]: 'shield-checkmark',
    };
    return icons[type] || 'card';
  }

  private getBillTypeColor(type: BillType): string {
    const colors: Record<BillType, string> = {
      [BillType.AIRTIME]: '#34C759',
      [BillType.DATA]: '#007AFF',
      [BillType.ELECTRICITY]: '#FF9500',
      [BillType.TV]: '#AF52DE',
      [BillType.INTERNET]: '#5856D6',
      [BillType.BETTING]: '#FF2D55',
      [BillType.EDUCATION]: '#5AC8FA',
      [BillType.GOVERNMENT]: '#8E8E93',
      [BillType.TOLL]: '#FF3B30',
      [BillType.INSURANCE]: '#30D158',
    };
    return colors[type] || '#007AFF';
  }

  /**
   * Get packages/variations for a specific service (biller)
   */
  async getBillerPackages(serviceId: string): Promise<any[]> {
    try {
      // Airtime doesn't have variations - it's variable amount
      if (['mtn', 'glo', 'airtel', 'etisalat'].includes(serviceId)) {
        return [];
      }

      const response = await this.vtpassClient.get<VTpassResponse>(
        `/service-variations?serviceID=${serviceId}`
      );

      if (response.data.code !== '000' && response.data.response_description !== '000') {
        this.logger.warn(`VTpass variations response: ${JSON.stringify(response.data)}`);
        return [];
      }

      const variations = response.data.content?.variations || [];
      
      return variations.map((v: VTpassVariation) => ({
        code: v.variation_code,
        name: v.name,
        amount: parseFloat(v.variation_amount),
        fee: 0,
        billerCode: serviceId,
        billerName: response.data.content?.ServiceName || serviceId,
        fixedPrice: v.fixedPrice === 'Yes',
        // Parse validity from name if available
        validity: this.extractValidity(v.name),
        dataSize: this.extractDataSize(v.name),
      }));
    } catch (error) {
      this.logger.error(`Failed to get variations for ${serviceId}:`, error.response?.data || error.message);
      return [];
    }
  }

  private extractValidity(name: string): string | undefined {
    const match = name.match(/(\d+)\s*(day|week|month|hour)/i);
    if (match) {
      return `${match[1]} ${match[2]}${parseInt(match[1]) > 1 ? 's' : ''}`;
    }
    return undefined;
  }

  private extractDataSize(name: string): string | undefined {
    const match = name.match(/(\d+(?:\.\d+)?)\s*(GB|MB|TB)/i);
    if (match) {
      return `${match[1]}${match[2].toUpperCase()}`;
    }
    return undefined;
  }

  /**
   * Validate a customer's ID (meter number, decoder number, etc.)
   */
  async validateCustomer(dto: ValidateCustomerDto): Promise<any> {
    try {
      const payload: any = {
        serviceID: dto.billerCode,
        billersCode: dto.customerId,
      };

      // Add meter type for electricity
      if (dto.meterType) {
        payload.type = dto.meterType;
      } else if (dto.itemCode) {
        payload.type = dto.itemCode;
      }

      const response = await this.vtpassClient.post<VTpassResponse>('/merchant-verify', payload);

      if (response.data.code !== '000') {
        throw new BadRequestException(response.data.content?.error || 'Customer validation failed');
      }

      const content = response.data.content;
      
      return {
        valid: true,
        customerName: content?.Customer_Name || content?.name || content?.customerName,
        address: content?.Address || content?.address,
        outstandingAmount: content?.Balance || content?.balance || content?.outstandingAmount,
        customerNumber: dto.customerId,
        currentBouquet: content?.Current_Bouquet || content?.currentBouquet,
        dueDate: content?.Due_Date || content?.dueDate,
        meterNumber: content?.MeterNumber || dto.customerId,
        meterType: dto.meterType,
        minimumAmount: content?.Minimum_Amount || content?.minimumAmount,
        accountStatus: content?.Status || content?.status,
      };
    } catch (error) {
      this.logger.error('Customer validation failed:', error.response?.data || error.message);
      
      // For phone-based services, validation might not be needed
      const phoneBasedServices = ['mtn', 'glo', 'airtel', 'etisalat', 'mtn-data', 'glo-data', 'airtel-data', 'etisalat-data'];
      if (phoneBasedServices.includes(dto.billerCode)) {
        return {
          valid: true,
          customerName: null,
          customerNumber: dto.customerId,
        };
      }
      
      // For betting, account validation
      if (VTPASS_SERVICE_IDS[BillType.BETTING].includes(dto.billerCode)) {
        return {
          valid: true,
          customerName: null,
          customerNumber: dto.customerId,
          message: 'Please ensure the account ID is correct',
        };
      }
      
      throw new BadRequestException(
        error.response?.data?.content?.error || error.message || 'Customer validation failed'
      );
    }
  }

  /**
   * Generate unique request ID for VTpass
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `HW${timestamp}${random}`;
  }

  /**
   * Get biller name from code
   */
  private getBillerName(billerCode: string): string {
    for (const billers of Object.values(BILLERS_LIST)) {
      const biller = billers.find(b => b.code === billerCode);
      if (biller) return biller.name;
    }
    return billerCode;
  }

  /**
   * Pay a bill using wallet balance
   */
  async payBill(userId: string, dto: PayBillDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get user with wallet balance
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Calculate fee
      const { fee, commission } = this.calculateFee(dto.type, dto.amount);
      const totalAmount = dto.amount + fee;

      const walletBalance = Number(user.walletBalance) || 0;
      
      if (walletBalance < totalAmount) {
        throw new BadRequestException(
          `Insufficient wallet balance. You have ₦${walletBalance.toLocaleString()} but need ₦${totalAmount.toLocaleString()}`
        );
      }

      // Generate unique request ID
      const requestId = this.generateRequestId();

      // Prepare VTpass request based on bill type
      let vtpassPayload: any = {
        request_id: requestId,
        serviceID: dto.billerCode,
        amount: dto.amount,
        phone: dto.customerId,
      };

      // Add variation_code for data, TV, etc.
      if (dto.itemCode && dto.type !== BillType.AIRTIME) {
        vtpassPayload.variation_code = dto.itemCode;
      }

      // For electricity, use billersCode instead of phone
      if (dto.type === BillType.ELECTRICITY) {
        vtpassPayload.billersCode = dto.customerId;
        vtpassPayload.variation_code = dto.meterType || 'prepaid';
        delete vtpassPayload.phone;
      }

      // For TV, use billersCode (smartcard number)
      if (dto.type === BillType.TV) {
        vtpassPayload.billersCode = dto.customerId;
        delete vtpassPayload.phone;
      }

      // For betting, use customerID
      if (dto.type === BillType.BETTING) {
        vtpassPayload.billersCode = dto.customerId;
        delete vtpassPayload.phone;
      }

      this.logger.log(`VTpass payment request: ${JSON.stringify(vtpassPayload)}`);

      // Make payment via VTpass
      const paymentResponse = await this.vtpassClient.post<VTpassResponse>('/pay', vtpassPayload);

      this.logger.log(`VTpass payment response: ${JSON.stringify(paymentResponse.data)}`);

      // Check response
      const responseCode = paymentResponse.data.code;
      if (responseCode !== '000') {
        const errorMessage = paymentResponse.data.content?.errors || 
                            paymentResponse.data.response_description ||
                            'Payment failed';
        throw new BadRequestException(errorMessage);
      }

      const paymentData = paymentResponse.data.content;

      // Deduct from wallet
      const newBalance = walletBalance - totalAmount;
      await queryRunner.manager.update(User, userId, {
        walletBalance: newBalance,
      });

      // Create wallet transaction record
      const transaction = queryRunner.manager.create(WalletTransaction, {
        ownerId: userId,
        ownerType: WalletOwnerType.BUYER,
        type: TransactionType.DEBIT,
        amount: totalAmount,
        balanceBefore: walletBalance,
        balanceAfter: newBalance,
        reference: requestId,
        description: `Bill Payment - ${this.getBillerName(dto.billerCode)}: ${dto.customerName || dto.customerId}`,
        category: TransactionCategory.BILL_PAYMENT,
        metadata: {
          billType: dto.type,
          billerCode: dto.billerCode,
          billerName: this.getBillerName(dto.billerCode),
          itemCode: dto.itemCode,
          customerId: dto.customerId,
          customerName: dto.customerName,
          amount: dto.amount,
          fee,
          commission,
          totalAmount,
          vtpassRequestId: requestId,
          vtpassTransactionId: paymentData?.transactionId,
          token: paymentData?.token, // For electricity prepaid
          units: paymentData?.units, // For electricity
          providerReference: paymentData?.purchased_code || paymentData?.transactionId,
        },
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(`Bill payment successful for user ${userId}: ${requestId}`);

      // Build receipt
      const receipt = {
        receiptNumber: requestId,
        billerName: this.getBillerName(dto.billerCode),
        customerId: dto.customerId,
        customerName: dto.customerName,
        amount: dto.amount,
        fee,
        totalAmount,
        token: paymentData?.token,
        units: paymentData?.units,
        transactionDate: new Date().toISOString(),
      };

      return {
        success: true,
        reference: requestId,
        amount: dto.amount,
        fee,
        totalAmount,
        newBalance: newBalance,
        message: 'Bill payment successful',
        transactionDate: new Date().toISOString(),
        status: BillPaymentStatusDto.COMPLETED,
        token: paymentData?.token, // For prepaid electricity
        units: paymentData?.units,
        providerReference: paymentData?.purchased_code || paymentData?.transactionId,
        receipt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Bill payment failed:', error.response?.data || error.message);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.response?.data?.response_description || 
        error.response?.data?.content?.errors ||
        error.message ||
        'Bill payment failed. Please try again.'
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get bill payment history for a user
   */
  async getBillHistory(userId: string, dto: GetBillHistoryDto): Promise<any> {
    const { page = 1, limit = 20, type, startDate, endDate, status } = dto;
    const skip = (page - 1) * limit;

    const whereConditions: any = {
      ownerId: userId,
      category: TransactionCategory.BILL_PAYMENT,
    };

    // Build date filter
    if (startDate && endDate) {
      whereConditions.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereConditions.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereConditions.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const [transactions, total] = await this.walletTransactionRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Filter by type if specified (in metadata)
    let filteredTransactions = transactions;
    if (type) {
      filteredTransactions = transactions.filter(tx => (tx.metadata as any)?.billType === type);
    }

    const data = filteredTransactions.map((tx) => {
      const meta = tx.metadata as any;
      return {
        id: tx.id,
        type: meta?.billType,
        billerCode: meta?.billerCode,
        billerName: meta?.billerName || this.getBillerName(meta?.billerCode),
        itemName: meta?.itemName,
        amount: meta?.amount || tx.amount,
        fee: meta?.fee || 0,
        totalAmount: meta?.totalAmount || tx.amount,
        reference: tx.reference,
        customerId: meta?.customerId,
        customerName: meta?.customerName,
        status: BillPaymentStatusDto.COMPLETED,
        token: meta?.token,
        units: meta?.units,
        createdAt: tx.createdAt.toISOString(),
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Query a specific transaction status
   */
  async queryTransaction(reference: string): Promise<any> {
    try {
      const response = await this.vtpassClient.post<VTpassResponse>('/requery', {
        request_id: reference,
      });

      return {
        reference,
        status: response.data.code === '000' ? BillPaymentStatusDto.COMPLETED : BillPaymentStatusDto.FAILED,
        response: response.data,
      };
    } catch (error) {
      this.logger.error(`Failed to query transaction ${reference}:`, error.message);
      throw new BadRequestException('Failed to query transaction status');
    }
  }

  /**
   * Quick buy airtime
   */
  async buyAirtime(userId: string, dto: BuyAirtimeDto): Promise<any> {
    // Map provider to VTpass service IDs
    const providerMap: Record<string, string> = {
      mtn: 'mtn',
      airtel: 'airtel',
      glo: 'glo',
      '9mobile': 'etisalat',
      etisalat: 'etisalat',
    };

    const serviceId = providerMap[dto.provider.toLowerCase()];
    if (!serviceId) {
      throw new BadRequestException('Invalid network provider');
    }

    return this.payBill(userId, {
      type: BillType.AIRTIME,
      billerCode: serviceId,
      itemCode: '', // Airtime doesn't need variation
      customerId: this.formatPhoneNumber(dto.phoneNumber),
      amount: dto.amount,
      customerName: dto.phoneNumber,
    });
  }

  /**
   * Buy data bundle
   */
  async buyData(userId: string, dto: BuyDataDto): Promise<any> {
    return this.payBill(userId, {
      type: BillType.DATA,
      billerCode: dto.billerCode,
      itemCode: dto.packageCode,
      customerId: this.formatPhoneNumber(dto.phoneNumber),
      amount: dto.amount,
      customerName: dto.phoneNumber,
    });
  }

  /**
   * Pay electricity bill
   */
  async payElectricity(userId: string, dto: PayElectricityDto): Promise<any> {
    return this.payBill(userId, {
      type: BillType.ELECTRICITY,
      billerCode: dto.discoCode,
      itemCode: dto.meterType,
      customerId: dto.meterNumber,
      amount: dto.amount,
      customerName: dto.customerName,
      meterType: dto.meterType,
    });
  }

  /**
   * Pay TV subscription
   */
  async payTv(userId: string, dto: PayTvDto): Promise<any> {
    return this.payBill(userId, {
      type: BillType.TV,
      billerCode: dto.providerCode,
      itemCode: dto.packageCode,
      customerId: dto.smartcardNumber,
      amount: dto.amount,
      customerName: dto.customerName,
    });
  }

  /**
   * Fund betting account
   */
  async fundBetting(userId: string, dto: FundBettingDto): Promise<any> {
    return this.payBill(userId, {
      type: BillType.BETTING,
      billerCode: dto.platformCode,
      itemCode: '',
      customerId: dto.accountId,
      amount: dto.amount,
      customerName: dto.accountName,
    });
  }

  /**
   * Pay internet subscription
   */
  async payInternet(userId: string, dto: PayInternetDto): Promise<any> {
    return this.payBill(userId, {
      type: BillType.INTERNET,
      billerCode: dto.ispCode,
      itemCode: dto.planCode,
      customerId: dto.accountNumber,
      amount: dto.amount,
      customerName: dto.customerName,
    });
  }

  /**
   * Format Nigerian phone number
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any spaces or special characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('234')) {
      cleaned = '0' + cleaned.substring(3);
    } else if (cleaned.startsWith('+234')) {
      cleaned = '0' + cleaned.substring(4);
    } else if (!cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Get network providers for quick airtime/data
   */
  getNetworkProviders(): any[] {
    return [
      { code: 'mtn', name: 'MTN', color: '#FFCC00', logo: null },
      { code: 'airtel', name: 'Airtel', color: '#FF0000', logo: null },
      { code: 'glo', name: 'Glo', color: '#00A651', logo: null },
      { code: '9mobile', name: '9mobile', color: '#006B4F', logo: null },
    ];
  }
}
