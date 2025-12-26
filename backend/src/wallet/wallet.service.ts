import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  WalletTransaction,
  TransactionType,
  TransactionCategory,
  WalletOwnerType,
} from '../database/entities/wallet-transaction.entity';
import {
  PlatformRevenue,
  RevenueType,
  RevenueStatus,
} from '../database/entities/platform-revenue.entity';
import { User } from '../database/entities/user.entity';
import { Rider } from '../database/entities/rider.entity';
import { AppSettings } from '../database/entities/app-settings.entity';
import { PaginatedResponseDto } from '../common/dto';
import { generateReference } from '../common/utils/helpers';

export interface CreditWalletDto {
  ownerId: string;
  ownerType: WalletOwnerType;
  amount: number;
  category: TransactionCategory;
  description: string;
  orderId?: string;
  orderNumber?: string;
  metadata?: Record<string, any>;
}

export interface DebitWalletDto {
  ownerId: string;
  ownerType: WalletOwnerType;
  amount: number;
  category: TransactionCategory;
  description: string;
  orderId?: string;
  orderNumber?: string;
  metadata?: Record<string, any>;
}

export interface OrderEarningsResult {
  farmerEarnings: number;
  riderEarnings: number;
  platformCommission: number;
  platformRiderCommission: number;
  platformServiceFee: number;
  totalPlatformRevenue: number;
  transactions: WalletTransaction[];
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(PlatformRevenue)
    private readonly platformRevenueRepository: Repository<PlatformRevenue>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
    @InjectRepository(AppSettings)
    private readonly appSettingsRepository: Repository<AppSettings>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get the current commission rate from settings
   */
  private async getCommissionRate(): Promise<number> {
    const setting = await this.appSettingsRepository.findOne({
      where: { key: 'business' },
    });
    
    if (setting?.value && typeof setting.value === 'object' && 'commissionRate' in setting.value) {
      const rate = (setting.value as { commissionRate?: number }).commissionRate;
      if (typeof rate === 'number') {
        return rate;
      }
    }
    
    return 10; // Default 10% commission
  }

  /**
   * Get the rider commission rate from settings (platform cut from delivery fee)
   */
  private async getRiderCommissionRate(): Promise<number> {
    const setting = await this.appSettingsRepository.findOne({
      where: { key: 'business' },
    });
    
    if (setting?.value && typeof setting.value === 'object' && 'riderCommissionRate' in setting.value) {
      const rate = (setting.value as { riderCommissionRate?: number }).riderCommissionRate;
      if (typeof rate === 'number') {
        return rate;
      }
    }
    
    return 15; // Default 15% rider commission
  }

  /**
   * Record platform revenue
   */
  private async recordPlatformRevenue(
    type: RevenueType,
    amount: number,
    orderId: string,
    orderNumber: string,
    sourceUserId: string,
    sourceUserType: string,
    rateApplied: number,
    grossAmount: number,
    description: string,
  ): Promise<PlatformRevenue> {
    const revenue = this.platformRevenueRepository.create({
      type,
      amount,
      status: RevenueStatus.COLLECTED,
      description,
      orderId,
      orderNumber,
      sourceUserId,
      sourceUserType,
      rateApplied,
      grossAmount,
      reference: generateReference('REV'),
    });

    return this.platformRevenueRepository.save(revenue);
  }

  /**
   * Get wallet balance for a user (farmer/buyer)
   */
  async getUserWalletBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return Number(user.walletBalance) || 0;
  }

  /**
   * Get wallet balance for a rider by their userId
   */
  async getRiderWalletBalance(userId: string): Promise<number> {
    console.log(`[WalletService] Looking up rider with userId: ${userId}`);
    const rider = await this.riderRepository.findOne({ where: { userId } });
    console.log(`[WalletService] Rider found:`, rider ? `Yes (id: ${rider.id}, walletBalance: ${rider.walletBalance})` : 'No');
    if (!rider) {
      this.logger.warn(`Rider not found for userId: ${userId}`);
      throw new NotFoundException('Rider not found');
    }
    this.logger.log(`Rider wallet balance for userId ${userId}: ${rider.walletBalance}`);
    const balance = Number(rider.walletBalance) || 0;
    console.log(`[WalletService] Parsed balance: ${balance}`);
    return balance;
  }

  /**
   * Get rider entity ID by user ID
   */
  async getRiderIdByUserId(userId: string): Promise<string | null> {
    const rider = await this.riderRepository.findOne({ where: { userId } });
    return rider?.id || null;
  }

  /**
   * Get wallet balance for a rider by their riderId (rider entity's primary key)
   */
  async getRiderWalletBalanceByRiderId(riderId: string): Promise<number> {
    const rider = await this.riderRepository.findOne({ where: { id: riderId } });
    if (!rider) {
      this.logger.warn(`Rider not found for riderId: ${riderId}`);
      throw new NotFoundException('Rider not found');
    }
    this.logger.log(`Rider wallet balance for riderId ${riderId}: ${rider.walletBalance}`);
    return Number(rider.walletBalance) || 0;
  }

  /**
   * Credit a wallet (farmer, rider, or buyer)
   */
  async creditWallet(dto: CreditWalletDto): Promise<WalletTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let balanceBefore: number;
      let balanceAfter: number;

      if (dto.ownerType === WalletOwnerType.RIDER) {
        // Credit rider wallet
        const rider = await queryRunner.manager.findOne(Rider, {
          where: { id: dto.ownerId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!rider) {
          throw new NotFoundException('Rider not found');
        }

        balanceBefore = Number(rider.walletBalance) || 0;
        balanceAfter = balanceBefore + dto.amount;

        await queryRunner.manager.update(Rider, dto.ownerId, {
          walletBalance: balanceAfter,
          totalEarnings: (Number(rider.totalEarnings) || 0) + dto.amount,
        });
      } else {
        // Credit user (farmer/buyer) wallet
        const user = await queryRunner.manager.findOne(User, {
          where: { id: dto.ownerId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        balanceBefore = Number(user.walletBalance) || 0;
        balanceAfter = balanceBefore + dto.amount;

        await queryRunner.manager.update(User, dto.ownerId, {
          walletBalance: balanceAfter,
        });
      }

      // Create transaction record
      const transaction = queryRunner.manager.create(WalletTransaction, {
        ownerId: dto.ownerId,
        ownerType: dto.ownerType,
        type: TransactionType.CREDIT,
        category: dto.category,
        amount: dto.amount,
        balanceBefore,
        balanceAfter,
        description: dto.description,
        orderId: dto.orderId,
        orderNumber: dto.orderNumber,
        reference: generateReference('WLT'),
        metadata: dto.metadata,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Credited ${dto.amount} to ${dto.ownerType} ${dto.ownerId}. New balance: ${balanceAfter}`,
      );

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to credit wallet: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Debit a wallet (for withdrawals)
   */
  async debitWallet(dto: DebitWalletDto): Promise<WalletTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let balanceBefore: number;
      let balanceAfter: number;

      if (dto.ownerType === WalletOwnerType.RIDER) {
        const rider = await queryRunner.manager.findOne(Rider, {
          where: { id: dto.ownerId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!rider) {
          throw new NotFoundException('Rider not found');
        }

        balanceBefore = Number(rider.walletBalance) || 0;

        if (balanceBefore < dto.amount) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        balanceAfter = balanceBefore - dto.amount;

        await queryRunner.manager.update(Rider, dto.ownerId, {
          walletBalance: balanceAfter,
        });
      } else {
        const user = await queryRunner.manager.findOne(User, {
          where: { id: dto.ownerId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        balanceBefore = Number(user.walletBalance) || 0;

        if (balanceBefore < dto.amount) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        balanceAfter = balanceBefore - dto.amount;

        await queryRunner.manager.update(User, dto.ownerId, {
          walletBalance: balanceAfter,
        });
      }

      // Create transaction record
      const transaction = queryRunner.manager.create(WalletTransaction, {
        ownerId: dto.ownerId,
        ownerType: dto.ownerType,
        type: TransactionType.DEBIT,
        category: dto.category,
        amount: dto.amount,
        balanceBefore,
        balanceAfter,
        description: dto.description,
        reference: generateReference('WLT'),
        orderId: dto.orderId,
        orderNumber: dto.orderNumber,
        metadata: dto.metadata,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Debited ${dto.amount} from ${dto.ownerType} ${dto.ownerId}. New balance: ${balanceAfter}`,
      );

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to debit wallet: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process order earnings - credits farmer and rider wallets when order is delivered
   */
  async processOrderEarnings(
    orderId: string,
    orderNumber: string,
    farmerIds: string[],
    riderId: string,
    orderItems: Array<{ farmerId: string; subtotal: number }>,
    deliveryFee: number,
    subtotal: number,
  ): Promise<OrderEarningsResult> {
    const commissionRate = await this.getCommissionRate();
    const transactions: WalletTransaction[] = [];

    // Group items by farmer and calculate their earnings
    const farmerEarningsMap = new Map<string, number>();
    
    for (const item of orderItems) {
      const currentEarnings = farmerEarningsMap.get(item.farmerId) || 0;
      farmerEarningsMap.set(item.farmerId, currentEarnings + item.subtotal);
    }

    let totalFarmerEarnings = 0;
    let totalPlatformCommission = 0;

    // Credit each farmer's wallet
    for (const [farmerId, grossEarnings] of farmerEarningsMap) {
      const commission = Math.round((grossEarnings * commissionRate) / 100);
      const netEarnings = grossEarnings - commission;
      
      totalFarmerEarnings += netEarnings;
      totalPlatformCommission += commission;

      const farmerTransaction = await this.creditWallet({
        ownerId: farmerId,
        ownerType: WalletOwnerType.FARMER,
        amount: netEarnings,
        category: TransactionCategory.ORDER_EARNINGS,
        description: `Earnings from order ${orderNumber} (${commissionRate}% commission deducted)`,
        orderId,
        orderNumber,
        metadata: {
          grossEarnings,
          commissionRate,
          commission,
          netEarnings,
        },
      });

      transactions.push(farmerTransaction);

      // Record platform revenue from farmer commission
      await this.recordPlatformRevenue(
        RevenueType.FARMER_COMMISSION,
        commission,
        orderId,
        orderNumber,
        farmerId,
        'farmer',
        commissionRate,
        grossEarnings,
        `Commission from farmer sales on order ${orderNumber}`,
      );

      this.logger.log(
        `Farmer ${farmerId} earned ${netEarnings} from order ${orderNumber} (commission: ${commission})`,
      );
    }

    // Credit rider's wallet with delivery fee (minus platform cut)
    const riderCommissionRate = await this.getRiderCommissionRate();
    let riderEarnings = 0;
    let platformRiderCommission = 0;

    if (riderId && deliveryFee > 0) {
      platformRiderCommission = Math.round((deliveryFee * riderCommissionRate) / 100);
      riderEarnings = deliveryFee - platformRiderCommission;
      
      const riderTransaction = await this.creditWallet({
        ownerId: riderId,
        ownerType: WalletOwnerType.RIDER,
        amount: riderEarnings,
        category: TransactionCategory.DELIVERY_EARNINGS,
        description: `Delivery earnings from order ${orderNumber} (${riderCommissionRate}% platform fee deducted)`,
        orderId,
        orderNumber,
        metadata: {
          grossDeliveryFee: deliveryFee,
          riderCommissionRate,
          platformCut: platformRiderCommission,
          netEarnings: riderEarnings,
        },
      });

      transactions.push(riderTransaction);

      // Record platform revenue from rider commission
      if (platformRiderCommission > 0) {
        await this.recordPlatformRevenue(
          RevenueType.RIDER_COMMISSION,
          platformRiderCommission,
          orderId,
          orderNumber,
          riderId,
          'rider',
          riderCommissionRate,
          deliveryFee,
          `Commission from rider delivery on order ${orderNumber}`,
        );
      }

      this.logger.log(
        `Rider ${riderId} earned ${riderEarnings} from delivering order ${orderNumber} (platform cut: ${platformRiderCommission})`,
      );
    }

    // Record service fee as platform revenue (service fee is already collected from buyer)
    const serviceFee = Math.round(subtotal * 0.02); // 2% service fee
    if (serviceFee > 0) {
      await this.recordPlatformRevenue(
        RevenueType.SERVICE_FEE,
        serviceFee,
        orderId,
        orderNumber,
        '', // No specific source user for service fee
        'buyer',
        2, // 2% rate
        subtotal,
        `Service fee from order ${orderNumber}`,
      );
    }

    const totalPlatformRevenue = totalPlatformCommission + platformRiderCommission + serviceFee;

    return {
      farmerEarnings: totalFarmerEarnings,
      riderEarnings,
      platformCommission: totalPlatformCommission,
      platformRiderCommission,
      platformServiceFee: serviceFee,
      totalPlatformRevenue,
      transactions,
    };
  }

  /**
   * Get wallet transaction history
   */
  async getTransactionHistory(
    ownerId: string,
    ownerType: WalletOwnerType,
    page = 1,
    limit = 20,
    category?: TransactionCategory,
  ): Promise<PaginatedResponseDto<WalletTransaction>> {
    this.logger.log(`[getTransactionHistory] ownerId: ${ownerId}, ownerType: ${ownerType}, page: ${page}, limit: ${limit}, category: ${category || 'all'}`);
    
    const queryBuilder = this.walletTransactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.ownerId = :ownerId', { ownerId })
      .andWhere('transaction.ownerType = :ownerType', { ownerType });

    if (category) {
      queryBuilder.andWhere('transaction.category = :category', { category });
    }

    queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();
    this.logger.log(`[getTransactionHistory] Found ${transactions.length} transactions (total: ${total})`);
    return new PaginatedResponseDto(transactions, total, page, limit);
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<WalletTransaction> {
    const transaction = await this.walletTransactionRepository.findOne({
      where: { id },
    });
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    
    return transaction;
  }

  /**
   * Get earnings summary for a farmer or rider
   */
  async getEarningsSummary(
    ownerId: string,
    ownerType: WalletOwnerType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalEarnings: number;
    totalWithdrawals: number;
    currentBalance: number;
    transactionCount: number;
    todayEarnings: number;
    thisWeekEarnings: number;
    thisMonthEarnings: number;
  }> {
    const queryBuilder = this.walletTransactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.ownerId = :ownerId', { ownerId })
      .andWhere('transaction.ownerType = :ownerType', { ownerType });

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate });
    }

    const transactions = await queryBuilder.getMany();

    let totalEarnings = 0;
    let totalWithdrawals = 0;

    for (const tx of transactions) {
      if (tx.type === TransactionType.CREDIT) {
        totalEarnings += Number(tx.amount);
      } else if (tx.category === TransactionCategory.WITHDRAWAL) {
        totalWithdrawals += Number(tx.amount);
      }
    }

    const currentBalance =
      ownerType === WalletOwnerType.RIDER
        ? await this.getRiderWalletBalanceByRiderId(ownerId)
        : await this.getUserWalletBalance(ownerId);

    // Calculate time-based earnings
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayEarnings = 0;
    let thisWeekEarnings = 0;
    let thisMonthEarnings = 0;

    for (const tx of transactions) {
      if (tx.type === TransactionType.CREDIT) {
        const txDate = new Date(tx.createdAt);
        const amount = Number(tx.amount);
        
        if (txDate >= startOfToday) {
          todayEarnings += amount;
        }
        if (txDate >= startOfWeek) {
          thisWeekEarnings += amount;
        }
        if (txDate >= startOfMonth) {
          thisMonthEarnings += amount;
        }
      }
    }

    return {
      totalEarnings,
      totalWithdrawals,
      currentBalance,
      transactionCount: transactions.length,
      todayEarnings,
      thisWeekEarnings,
      thisMonthEarnings,
    };
  }

  /**
   * Transfer funds from one user to another
   * IMPORTANT: This debits the sender's wallet BEFORE crediting the recipient
   */
  async transferToUser(
    senderId: string,
    recipientPhone: string,
    amount: number,
  ): Promise<WalletTransaction> {
    if (amount < 100) {
      throw new BadRequestException('Minimum transfer amount is ₦100');
    }

    // Find sender to determine their owner type
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    // Find recipient by phone
    const recipient = await this.userRepository.findOne({
      where: { phone: recipientPhone },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found. Please check the phone number.');
    }

    if (recipient.id === senderId) {
      throw new BadRequestException('You cannot transfer to yourself');
    }

    // Determine sender owner type and ID based on role
    let senderOwnerId = senderId;
    let senderOwnerType: WalletOwnerType;
    
    if (sender.role === 'rider') {
      senderOwnerType = WalletOwnerType.RIDER;
      // For riders, we need to use their rider entity ID
      const senderRider = await this.riderRepository.findOne({ where: { userId: senderId } });
      if (senderRider) {
        senderOwnerId = senderRider.id;
      }
    } else if (sender.role === 'farmer') {
      senderOwnerType = WalletOwnerType.FARMER;
    } else {
      senderOwnerType = WalletOwnerType.BUYER;
    }

    // Determine recipient owner type and ID based on role
    let recipientOwnerId = recipient.id;
    let recipientOwnerType: WalletOwnerType;
    
    if (recipient.role === 'rider') {
      recipientOwnerType = WalletOwnerType.RIDER;
      // For riders, we need to use their rider entity ID
      const recipientRider = await this.riderRepository.findOne({ where: { userId: recipient.id } });
      if (recipientRider) {
        recipientOwnerId = recipientRider.id;
      }
    } else if (recipient.role === 'farmer') {
      recipientOwnerType = WalletOwnerType.FARMER;
    } else {
      recipientOwnerType = WalletOwnerType.BUYER;
    }

    // First, debit the sender's wallet - this will throw if insufficient balance
    const debitTransaction = await this.debitWallet({
      ownerId: senderOwnerId,
      ownerType: senderOwnerType,
      amount,
      category: TransactionCategory.TRANSFER,
      description: `Transfer to ${recipient.name} (${recipientPhone})`,
      metadata: { recipientId: recipient.id, recipientPhone },
    });

    // Only after successful debit, credit the recipient
    await this.creditWallet({
      ownerId: recipientOwnerId,
      ownerType: recipientOwnerType,
      amount,
      category: TransactionCategory.TRANSFER,
      description: `Transfer received from ${sender.name}`,
      metadata: { senderId, senderName: sender.name, transactionRef: debitTransaction.reference },
    });

    this.logger.log(`Transfer of ${amount} from ${sender.role} ${senderId} to ${recipient.role} ${recipient.id} completed`);

    return debitTransaction;
  }

  /**
   * Pay for a service/bill from wallet
   * IMPORTANT: This debits wallet BEFORE confirming success
   * For order payments, always use BUYER ownerType since the user is acting as a buyer
   */
  async payForService(
    userId: string,
    amount: number,
    description: string,
    orderId?: string,
  ): Promise<WalletTransaction> {
    this.logger.log(`[payForService] userId: ${userId}, amount: ${amount}, description: ${description}, orderId: ${orderId}`);
    
    if (amount < 100) {
      throw new BadRequestException('Minimum payment amount is ₦100');
    }

    // Look up user to verify they exist
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // For purchases (order payments), always use BUYER ownerType
    // The user is acting as a buyer regardless of their primary role
    const ownerType = WalletOwnerType.BUYER;

    this.logger.log(`[payForService] User role: ${user.role}, using ownerType: ${ownerType} for purchase`);

    // Debit the wallet - this will throw if insufficient balance
    const transaction = await this.debitWallet({
      ownerId: userId,
      ownerType,
      amount,
      category: TransactionCategory.PURCHASE,
      description,
      orderId, // Store orderId in the transaction record
      metadata: orderId ? { orderId, orderPayment: true } : undefined,
    });

    this.logger.log(`[payForService] Transaction created: ${transaction.id}, reference: ${transaction.reference}`);

    return transaction;
  }

  /**
   * Check if earnings have been processed for an order
   */
  async checkEarningsProcessed(orderId: string): Promise<boolean> {
    const transaction = await this.walletTransactionRepository.findOne({
      where: { 
        orderId,
        category: TransactionCategory.ORDER_EARNINGS,
      },
    });
    return !!transaction;
  }

  /**
   * Get recent transfer recipients for a user
   * Returns users who have received transfers from the sender, sorted by most recent
   */
  async getRecentTransferRecipients(
    senderId: string,
    limit = 10,
  ): Promise<Array<{
    id: string;
    name: string;
    phone: string;
    avatar?: string;
    lastTransfer: string;
  }>> {
    // Find all transfer transactions where this user was the sender
    const transfers = await this.walletTransactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.ownerId = :senderId', { senderId })
      .andWhere('transaction.category = :category', { category: TransactionCategory.TRANSFER })
      .andWhere('transaction.type = :type', { type: TransactionType.DEBIT })
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();

    // Extract unique recipient IDs from metadata
    const recipientMap = new Map<string, Date>();
    for (const transfer of transfers) {
      const recipientId = transfer.metadata?.recipientId;
      if (recipientId && !recipientMap.has(recipientId)) {
        recipientMap.set(recipientId, transfer.createdAt);
      }
    }

    // Get user details for each recipient
    const recipientIds = Array.from(recipientMap.keys()).slice(0, limit);
    if (recipientIds.length === 0) {
      return [];
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: recipientIds })
      .getMany();

    // Format the response
    const recipients = users.map(user => {
      const lastTransferDate = recipientMap.get(user.id);
      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        lastTransfer: this.formatRelativeTime(lastTransferDate),
      };
    });

    // Sort by most recent transfer
    recipients.sort((a, b) => {
      const dateA = recipientMap.get(a.id)?.getTime() || 0;
      const dateB = recipientMap.get(b.id)?.getTime() || 0;
      return dateB - dateA;
    });

    return recipients;
  }

  /**
   * Format date as relative time (e.g., "2 days ago")
   */
  private formatRelativeTime(date?: Date): string {
    if (!date) return 'Unknown';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }
}
