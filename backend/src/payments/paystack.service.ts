import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { User } from '../database/entities/user.entity';

export interface PaystackCustomer {
  id: number;
  customer_code: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  integration: number;
  identified: boolean;
}

export interface PaystackDVA {
  bank: {
    id: number;
    name: string;
    slug: string;
  };
  account_name: string;
  account_number: string;
  assigned: boolean;
  currency: string;
  active: boolean;
  id: number;
  customer: PaystackCustomer;
  assignment: {
    integration: number;
    assignee_id: number;
    assignee_type: string;
    expired: boolean;
    account_type: string;
    assigned_at: string;
  };
}

export interface PaystackTransactionData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  customer: PaystackCustomer;
  metadata?: {
    userId?: string;
    type?: string;
    [key: string]: any;
  };
  paid_at?: string;
}

export interface PaystackWebhookPayload {
  event: string;
  data: PaystackTransactionData | PaystackDVA | any;
}

export interface InitializeTransactionResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly apiClient: AxiosInstance;
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.publicKey = this.configService.get<string>('PAYSTACK_PUBLIC_KEY') || '';
    this.webhookSecret = this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET') || '';

    this.apiClient = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!this.secretKey) {
      this.logger.warn('PAYSTACK_SECRET_KEY not configured');
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('PAYSTACK_WEBHOOK_SECRET not configured');
      return false;
    }

    const hash = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Create a Paystack customer
   */
  async createCustomer(user: User): Promise<PaystackCustomer> {
    try {
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0] || user.name;
      const lastName = nameParts.slice(1).join(' ') || firstName;

      const response = await this.apiClient.post('/customer', {
        email: user.email || `${user.phone}@handwork.ng`, // Paystack requires email
        first_name: firstName,
        last_name: lastName,
        phone: user.phone,
        metadata: {
          userId: user.id,
          role: user.role,
        },
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to create Paystack customer');
      }

      this.logger.log(`Created Paystack customer ${response.data.data.customer_code} for user ${user.id}`);
      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to create Paystack customer: ${error.message}`);
      if (axios.isAxiosError(error) && error.response) {
        throw new BadRequestException(error.response.data?.message || 'Paystack API error');
      }
      throw error;
    }
  }

  /**
   * Create a Dedicated Virtual Account (DVA) for a customer
   * This allows users to top up their wallet via bank transfer
   */
  async createDedicatedVirtualAccount(customerCode: string, preferredBank?: string): Promise<PaystackDVA> {
    try {
      // Check if we're in test mode by looking at the secret key
      const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
      const isTestMode = secretKey.startsWith('sk_test_');
      
      // Use 'test-bank' in test mode, otherwise default to Wema Bank (most reliable for DVA)
      const bank = preferredBank || (isTestMode ? 'test-bank' : 'wema-bank');

      this.logger.log(`Creating DVA with bank: ${bank} (test mode: ${isTestMode})`);

      const response = await this.apiClient.post('/dedicated_account', {
        customer: customerCode,
        preferred_bank: bank,
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to create DVA');
      }

      this.logger.log(`Created DVA for customer ${customerCode}: ${response.data.data.account_number}`);
      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to create DVA: ${error.message}`);
      if (axios.isAxiosError(error) && error.response) {
        throw new BadRequestException(error.response.data?.message || 'Paystack API error');
      }
      throw error;
    }
  }

  /**
   * Get DVA details for a user (for displaying bank transfer instructions)
   */
  async getUserDvaDetails(userId: string): Promise<{
    hasDva: boolean;
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    message: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'dvaAccountNumber', 'dvaAccountName', 'dvaBankName', 'paystackCustomerId'],
    });

    if (!user) {
      return {
        hasDva: false,
        message: 'User not found',
      };
    }

    if (!user.dvaAccountNumber) {
      return {
        hasDva: false,
        message: 'Virtual account not yet set up. Please complete your profile or contact support.',
      };
    }

    return {
      hasDva: true,
      accountNumber: user.dvaAccountNumber,
      accountName: user.dvaAccountName,
      bankName: user.dvaBankName,
      message: 'Transfer to this account to top up your wallet instantly.',
    };
  }

  /**
   * Create customer and DVA for a new user (called during signup)
   */
  async setupUserPaystackAccount(user: User): Promise<{
    success: boolean;
    customerId?: string;
    customerCode?: string;
    dvaAccountNumber?: string;
    dvaAccountName?: string;
    dvaBankName?: string;
    message: string;
  }> {
    try {
      // Check if user already has DVA
      const existingUser = await this.userRepository.findOne({
        where: { id: user.id },
      });

      if (existingUser?.dvaAccountNumber) {
        return {
          success: true,
          dvaAccountNumber: existingUser.dvaAccountNumber,
          dvaAccountName: existingUser.dvaAccountName,
          dvaBankName: existingUser.dvaBankName,
          message: 'DVA already exists for this user',
        };
      }

      // Step 1: Create Paystack customer
      const customer = await this.createCustomer(user);

      // Step 2: Create DVA
      const dva = await this.createDedicatedVirtualAccount(customer.customer_code);

      // Step 3: Update user record with Paystack details
      await this.userRepository.update(user.id, {
        paystackCustomerId: customer.customer_code,
        dvaAccountNumber: dva.account_number,
        dvaAccountName: dva.account_name,
        dvaBankName: dva.bank.name,
      });

      this.logger.log(`Paystack account setup complete for user ${user.id}`);
      
      return {
        success: true,
        customerId: String(customer.id),
        customerCode: customer.customer_code,
        dvaAccountNumber: dva.account_number,
        dvaAccountName: dva.account_name,
        dvaBankName: dva.bank.name,
        message: 'DVA created successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to setup Paystack account for user ${user.id}: ${error.message}`);
      // Don't throw - account setup failure shouldn't block user registration
      // The user can set it up later or admin can retry
      return {
        success: false,
        message: `Failed to setup payment account: ${error.message}`,
      };
    }
  }

  /**
   * Initialize a payment transaction
   */
  async initializeTransaction(params: {
    email: string;
    amount: number; // Amount in kobo (multiply NGN by 100)
    reference?: string;
    callbackUrl?: string;
    metadata?: Record<string, any>;
    channels?: string[];
  }): Promise<InitializeTransactionResponse> {
    try {
      const response = await this.apiClient.post('/transaction/initialize', {
        email: params.email,
        amount: params.amount,
        reference: params.reference || this.generateReference(),
        callback_url: params.callbackUrl,
        metadata: params.metadata,
        channels: params.channels || ['card', 'bank', 'ussd', 'bank_transfer'],
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to initialize transaction');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to initialize transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference: string): Promise<PaystackTransactionData> {
    try {
      const response = await this.apiClient.get(`/transaction/verify/${reference}`);

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Transaction verification failed');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to verify transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * List DVAs for a customer
   */
  async listDedicatedAccounts(customerCode: string): Promise<PaystackDVA[]> {
    try {
      const response = await this.apiClient.get('/dedicated_account', {
        params: { customer: customerCode },
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Failed to list DVAs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch a customer's DVA details
   */
  async getDedicatedAccountByUser(userId: string): Promise<PaystackDVA | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.paystackCustomerId) {
      return null;
    }

    const accounts = await this.listDedicatedAccounts(user.paystackCustomerId);
    return accounts.find(a => a.active) || null;
  }

  /**
   * Create transfer recipient (for payouts to farmers/riders)
   */
  async createTransferRecipient(params: {
    name: string;
    accountNumber: string;
    bankCode: string;
  }): Promise<{ recipient_code: string }> {
    try {
      const response = await this.apiClient.post('/transferrecipient', {
        type: 'nuban',
        name: params.name,
        account_number: params.accountNumber,
        bank_code: params.bankCode,
        currency: 'NGN',
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to create transfer recipient');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to create transfer recipient: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initiate transfer (payout)
   */
  async initiateTransfer(params: {
    amount: number; // In kobo
    recipientCode: string;
    reason?: string;
    reference?: string;
  }): Promise<{ transfer_code: string; reference: string }> {
    try {
      const response = await this.apiClient.post('/transfer', {
        source: 'balance',
        amount: params.amount,
        recipient: params.recipientCode,
        reason: params.reason || 'Handwork payout',
        reference: params.reference || this.generateReference('TRF'),
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to initiate transfer');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to initiate transfer: ${error.message}`);
      throw error;
    }
  }

  /**
   * List Nigerian banks
   */
  async listBanks(): Promise<Array<{ name: string; code: string; slug: string }>> {
    try {
      const response = await this.apiClient.get('/bank', {
        params: { country: 'nigeria', perPage: 100 },
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Failed to list banks: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resolve account number (get account name from bank)
   */
  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<{ account_name: string; account_number: string }> {
    try {
      this.logger.log(`Resolving account: ${accountNumber} with bank code: ${bankCode}`);
      const response = await this.apiClient.get('/bank/resolve', {
        params: { account_number: accountNumber, bank_code: bankCode },
      });

      if (!response.data.status) {
        throw new BadRequestException('Could not resolve account number');
      }

      this.logger.log(`Account resolved successfully: ${response.data.data.account_name}`);
      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to resolve account: ${error.message}`);
      
      // Pass through specific error status codes
      if (error.response?.status === 429) {
        throw new HttpException('Too many requests. Please wait a moment and try again.', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      if (error.response?.data?.message) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Could not verify account. Please check the account number and bank.');
    }
  }

  /**
   * Generate unique reference
   */
  private generateReference(prefix = 'HW'): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Get Paystack public key (for frontend)
   */
  getPublicKey(): string {
    return this.publicKey;
  }
}
