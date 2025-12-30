import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { WalletTransaction, TransactionType, TransactionCategory, WalletOwnerType, User } from '../database/entities';
import { BillType, PayBillDto, ValidateCustomerDto } from './dto';

interface PaystackBiller {
  id: number;
  biller_code: string;
  name: string;
  default_commission: number;
  date_added: string;
  country: string;
  is_airtime: boolean;
  biller_name: string;
  item_code: string;
  short_name: string;
  fee: number;
  commission_on_fee: boolean;
}

interface PaystackBillerItem {
  id: number;
  biller_code: string;
  name: string;
  amount: number;
  biller_name: string;
  item_code: string;
  short_name: string;
  fee: number;
}

interface BillPaymentResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    amount: number;
    fee: number;
    currency: string;
    transaction_date: string;
    integration: number;
  };
}

@Injectable()
export class BillsService {
  private readonly logger = new Logger(BillsService.name);
  private paystackClient: AxiosInstance;
  private readonly paystackSecretKey: string;

  constructor(
    private configService: ConfigService,
    private dataSource: DataSource,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    
    this.paystackClient = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get list of billers by type
   */
  async getBillers(type: BillType): Promise<any[]> {
    try {
      // Map our bill types to Paystack's categories
      const typeMapping: Record<BillType, string[]> = {
        [BillType.AIRTIME]: ['airtime'],
        [BillType.DATA]: ['data_bundle'],
        [BillType.ELECTRICITY]: ['electricity', 'power'],
        [BillType.TV]: ['cable', 'tv'],
        [BillType.INTERNET]: ['internet'],
      };

      const response = await this.paystackClient.get('/bill/list');
      
      if (!response.data.status) {
        throw new BadRequestException('Failed to fetch billers');
      }

      const billers = response.data.data as PaystackBiller[];
      const searchTerms = typeMapping[type] || [];

      // Filter billers based on type
      const filteredBillers = billers.filter((biller) => {
        const billerNameLower = biller.biller_name?.toLowerCase() || '';
        const shortNameLower = biller.short_name?.toLowerCase() || '';
        const nameLower = biller.name?.toLowerCase() || '';
        
        // For airtime, check is_airtime flag
        if (type === BillType.AIRTIME && biller.is_airtime) {
          return true;
        }

        // For other types, check if any search term matches
        return searchTerms.some((term) => 
          billerNameLower.includes(term) || 
          shortNameLower.includes(term) ||
          nameLower.includes(term)
        );
      });

      // Group by biller_code and return unique billers
      const uniqueBillers = new Map<string, any>();
      for (const biller of filteredBillers) {
        if (!uniqueBillers.has(biller.biller_code)) {
          uniqueBillers.set(biller.biller_code, {
            code: biller.biller_code,
            name: biller.biller_name || biller.name,
            shortName: biller.short_name,
            type: type,
          });
        }
      }

      return Array.from(uniqueBillers.values());
    } catch (error) {
      this.logger.error('Failed to get billers:', error.response?.data || error.message);
      throw new BadRequestException(error.response?.data?.message || 'Failed to fetch billers');
    }
  }

  /**
   * Get packages/items for a specific biller
   */
  async getBillerPackages(billerCode: string): Promise<any[]> {
    try {
      const response = await this.paystackClient.get('/bill/list');
      
      if (!response.data.status) {
        throw new BadRequestException('Failed to fetch biller packages');
      }

      const allItems = response.data.data as PaystackBillerItem[];
      const packages = allItems
        .filter((item) => item.biller_code === billerCode)
        .map((item) => ({
          code: item.item_code,
          name: item.name,
          amount: item.amount, // Amount in kobo for fixed-price items, 0 for variable
          fee: item.fee,
          billerCode: item.biller_code,
          billerName: item.biller_name,
        }));

      return packages;
    } catch (error) {
      this.logger.error('Failed to get biller packages:', error.response?.data || error.message);
      throw new BadRequestException(error.response?.data?.message || 'Failed to fetch packages');
    }
  }

  /**
   * Validate a customer's ID (meter number, decoder number, etc.)
   */
  async validateCustomer(dto: ValidateCustomerDto): Promise<any> {
    try {
      const response = await this.paystackClient.get('/bill/validate', {
        params: {
          code: dto.billerCode,
          customer: dto.customerId,
          item_code: dto.itemCode,
        },
      });

      if (!response.data.status) {
        throw new BadRequestException('Customer validation failed');
      }

      return {
        valid: true,
        customerName: response.data.data.name || response.data.data.customer_name,
        address: response.data.data.address,
        outstandingAmount: response.data.data.outstanding_amount,
        customerNumber: response.data.data.customer_id || dto.customerId,
      };
    } catch (error) {
      this.logger.error('Customer validation failed:', error.response?.data || error.message);
      
      // For airtime/data, validation might not be needed
      if (error.response?.status === 400) {
        return {
          valid: true,
          customerName: null,
          customerNumber: dto.customerId,
        };
      }
      
      throw new BadRequestException(
        error.response?.data?.message || 'Customer validation failed'
      );
    }
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
      const amountInKobo = Math.round(dto.amount * 100);
      
      // Get the fee for this transaction
      const packages = await this.getBillerPackages(dto.billerCode);
      const selectedPackage = packages.find((p) => p.code === dto.itemCode);
      const fee = selectedPackage?.fee || 0;
      const totalAmount = dto.amount + (fee / 100); // Fee is in kobo

      if (walletBalance < totalAmount) {
        throw new BadRequestException(
          `Insufficient wallet balance. You have ₦${walletBalance.toFixed(2)} but need ₦${totalAmount.toFixed(2)}`
        );
      }

      // Generate unique reference
      const reference = `BILL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Make payment via Paystack
      const paymentResponse = await this.paystackClient.post<BillPaymentResponse>('/bill/charge', {
        customer: dto.customerId,
        amount: amountInKobo,
        item_code: dto.itemCode,
        reference: reference,
      });

      if (!paymentResponse.data.status) {
        throw new BadRequestException('Bill payment failed');
      }

      const paymentData = paymentResponse.data.data;

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
        reference: paymentData.reference,
        description: `Bill Payment - ${dto.type}: ${dto.customerName || dto.customerId}`,
        category: TransactionCategory.BILL_PAYMENT,
        metadata: {
          billType: dto.type,
          billerCode: dto.billerCode,
          itemCode: dto.itemCode,
          customerId: dto.customerId,
          customerName: dto.customerName,
          paystackReference: paymentData.reference,
          fee: fee,
          transactionDate: paymentData.transaction_date,
        },
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(`Bill payment successful for user ${userId}: ${reference}`);

      return {
        success: true,
        reference: paymentData.reference,
        amount: totalAmount,
        fee: fee / 100,
        newBalance: newBalance,
        message: 'Bill payment successful',
        transactionDate: paymentData.transaction_date,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Bill payment failed:', error.response?.data || error.message);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        error.response?.data?.message || 'Bill payment failed. Please try again.'
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
        status: 'completed', // All saved transactions are completed
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
    // Map provider to Paystack biller codes
    const providerMap: Record<string, { billerCode: string; itemCode: string }> = {
      mtn: { billerCode: 'BIL099', itemCode: 'AT099' },
      airtel: { billerCode: 'BIL100', itemCode: 'AT100' },
      glo: { billerCode: 'BIL102', itemCode: 'AT102' },
      '9mobile': { billerCode: 'BIL103', itemCode: 'AT103' },
      etisalat: { billerCode: 'BIL103', itemCode: 'AT103' }, // Alias for 9mobile
    };

    const providerInfo = providerMap[provider.toLowerCase()];
    if (!providerInfo) {
      throw new BadRequestException('Invalid network provider');
    }

    return this.payBill(userId, {
      type: BillType.AIRTIME,
      billerCode: providerInfo.billerCode,
      itemCode: providerInfo.itemCode,
      customerId: phoneNumber,
      amount,
      customerName: phoneNumber,
    });
  }
}
