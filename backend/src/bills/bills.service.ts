import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { WalletTransaction, TransactionType, TransactionCategory, WalletOwnerType, User } from '../database/entities';
import { BillType, PayBillDto, ValidateCustomerDto } from './dto';

// VTpass service IDs mapping
const VTPASS_SERVICE_IDS: Record<BillType, string[]> = {
  [BillType.AIRTIME]: ['mtn', 'glo', 'airtel', 'etisalat'],
  [BillType.DATA]: ['mtn-data', 'glo-data', 'airtel-data', 'etisalat-data'],
  [BillType.ELECTRICITY]: ['ikeja-electric', 'eko-electric', 'kano-electric', 'portharcourt-electric', 'jos-electric', 'ibadan-electric', 'kaduna-electric', 'abuja-electric', 'enugu-electric', 'benin-electric', 'yola-electric'],
  [BillType.TV]: ['dstv', 'gotv', 'startimes'],
  [BillType.INTERNET]: ['smile-direct', 'spectranet'],
};

// Static billers list (these are fixed VTpass service IDs)
const BILLERS_LIST: Record<BillType, Array<{ code: string; name: string; shortName: string }>> = {
  [BillType.AIRTIME]: [
    { code: 'mtn', name: 'MTN Nigeria', shortName: 'MTN' },
    { code: 'glo', name: 'Glo Nigeria', shortName: 'GLO' },
    { code: 'airtel', name: 'Airtel Nigeria', shortName: 'Airtel' },
    { code: 'etisalat', name: '9mobile Nigeria', shortName: '9mobile' },
  ],
  [BillType.DATA]: [
    { code: 'mtn-data', name: 'MTN Data', shortName: 'MTN' },
    { code: 'glo-data', name: 'Glo Data', shortName: 'GLO' },
    { code: 'airtel-data', name: 'Airtel Data', shortName: 'Airtel' },
    { code: 'etisalat-data', name: '9mobile Data', shortName: '9mobile' },
  ],
  [BillType.ELECTRICITY]: [
    { code: 'ikeja-electric', name: 'Ikeja Electric', shortName: 'IKEDC' },
    { code: 'eko-electric', name: 'Eko Electric', shortName: 'EKEDC' },
    { code: 'abuja-electric', name: 'Abuja Electric', shortName: 'AEDC' },
    { code: 'kano-electric', name: 'Kano Electric', shortName: 'KEDCO' },
    { code: 'portharcourt-electric', name: 'Port Harcourt Electric', shortName: 'PHED' },
    { code: 'ibadan-electric', name: 'Ibadan Electric', shortName: 'IBEDC' },
    { code: 'kaduna-electric', name: 'Kaduna Electric', shortName: 'KAEDCO' },
    { code: 'jos-electric', name: 'Jos Electric', shortName: 'JED' },
    { code: 'enugu-electric', name: 'Enugu Electric', shortName: 'EEDC' },
    { code: 'benin-electric', name: 'Benin Electric', shortName: 'BEDC' },
  ],
  [BillType.TV]: [
    { code: 'dstv', name: 'DSTV', shortName: 'DSTV' },
    { code: 'gotv', name: 'GOtv', shortName: 'GOtv' },
    { code: 'startimes', name: 'StarTimes', shortName: 'StarTimes' },
  ],
  [BillType.INTERNET]: [
    { code: 'smile-direct', name: 'Smile', shortName: 'Smile' },
    { code: 'spectranet', name: 'Spectranet', shortName: 'Spectranet' },
  ],
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
    });

    this.logger.log(`VTpass client initialized for ${this.isProduction ? 'production' : 'sandbox'}`);
  }

  /**
   * Get list of billers by type (returns static list)
   */
  async getBillers(type: BillType): Promise<any[]> {
    const billers = BILLERS_LIST[type] || [];
    return billers.map((biller) => ({
      ...biller,
      type,
    }));
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
        amount: parseFloat(v.variation_amount) * 100, // Convert to kobo for consistency
        fee: 0,
        billerCode: serviceId,
        billerName: response.data.content?.ServiceName || serviceId,
        fixedPrice: v.fixedPrice === 'Yes',
      }));
    } catch (error) {
      this.logger.error(`Failed to get variations for ${serviceId}:`, error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Validate a customer's ID (meter number, decoder number, etc.)
   */
  async validateCustomer(dto: ValidateCustomerDto): Promise<any> {
    try {
      const response = await this.vtpassClient.post<VTpassResponse>('/merchant-verify', {
        serviceID: dto.billerCode,
        billersCode: dto.customerId,
        type: dto.itemCode, // For electricity: prepaid/postpaid
      });

      if (response.data.code !== '000') {
        throw new BadRequestException(response.data.content?.error || 'Customer validation failed');
      }

      return {
        valid: true,
        customerName: response.data.content?.Customer_Name || response.data.content?.name,
        address: response.data.content?.Address,
        outstandingAmount: response.data.content?.Balance,
        customerNumber: dto.customerId,
      };
    } catch (error) {
      this.logger.error('Customer validation failed:', error.response?.data || error.message);
      
      // For phone-based services, validation might not be needed
      if (['mtn', 'glo', 'airtel', 'etisalat', 'mtn-data', 'glo-data', 'airtel-data', 'etisalat-data'].includes(dto.billerCode)) {
        return {
          valid: true,
          customerName: null,
          customerNumber: dto.customerId,
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
    return `${timestamp}${random}`;
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

      const walletBalance = Number(user.walletBalance) || 0;
      
      if (walletBalance < dto.amount) {
        throw new BadRequestException(
          `Insufficient wallet balance. You have ₦${walletBalance.toFixed(2)} but need ₦${dto.amount.toFixed(2)}`
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
        delete vtpassPayload.phone;
      }

      // For TV, use billersCode (smartcard number)
      if (dto.type === BillType.TV) {
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
      const newBalance = walletBalance - dto.amount;
      await queryRunner.manager.update(User, userId, {
        walletBalance: newBalance,
      });

      // Create wallet transaction record
      const transaction = queryRunner.manager.create(WalletTransaction, {
        ownerId: userId,
        ownerType: WalletOwnerType.BUYER,
        type: TransactionType.DEBIT,
        amount: dto.amount,
        balanceBefore: walletBalance,
        balanceAfter: newBalance,
        reference: requestId,
        description: `Bill Payment - ${dto.type}: ${dto.customerName || dto.customerId}`,
        category: TransactionCategory.BILL_PAYMENT,
        metadata: {
          billType: dto.type,
          billerCode: dto.billerCode,
          itemCode: dto.itemCode,
          customerId: dto.customerId,
          customerName: dto.customerName,
          vtpassRequestId: requestId,
          vtpassTransactionId: paymentData?.transactionId,
          token: paymentData?.token, // For electricity prepaid
          units: paymentData?.units, // For electricity
        },
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(`Bill payment successful for user ${userId}: ${requestId}`);

      return {
        success: true,
        reference: requestId,
        amount: dto.amount,
        fee: 0,
        newBalance: newBalance,
        message: 'Bill payment successful',
        transactionDate: new Date().toISOString(),
        token: paymentData?.token, // For prepaid electricity
        units: paymentData?.units,
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
  async getBillHistory(userId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;

    const [transactions, total] = await this.walletTransactionRepository.findAndCount({
      where: {
        ownerId: userId,
        category: TransactionCategory.BILL_PAYMENT,
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: transactions.map((tx) => ({
        id: tx.id,
        type: (tx.metadata as any)?.billType,
        amount: tx.amount,
        reference: tx.reference,
        customerId: (tx.metadata as any)?.customerId,
        customerName: (tx.metadata as any)?.customerName,
        status: 'completed',
        createdAt: tx.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Quick buy airtime
   */
  async buyAirtime(userId: string, phoneNumber: string, amount: number, provider: string): Promise<any> {
    // Map provider to VTpass service IDs
    const providerMap: Record<string, string> = {
      mtn: 'mtn',
      airtel: 'airtel',
      glo: 'glo',
      '9mobile': 'etisalat',
      etisalat: 'etisalat',
    };

    const serviceId = providerMap[provider.toLowerCase()];
    if (!serviceId) {
      throw new BadRequestException('Invalid network provider');
    }

    return this.payBill(userId, {
      type: BillType.AIRTIME,
      billerCode: serviceId,
      itemCode: '', // Airtime doesn't need variation
      customerId: phoneNumber,
      amount,
      customerName: phoneNumber,
    });
  }
}
