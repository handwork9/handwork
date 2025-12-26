import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { User } from '../database/entities/user.entity';
import { WalletTransaction, TransactionCategory, WalletOwnerType, TransactionType } from '../database/entities/wallet-transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { WalletService } from '../wallet/wallet.service';
import { PaystackService } from '../payments/paystack.service';
import { BankAccount } from '../database/entities';

interface WithdrawalFilters {
  page?: number;
  limit?: number;
  status?: string;
  ownerType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

@ApiTags('Admin - Withdrawals')
@ApiBearerAuth()
@Controller('admin/withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class AdminWithdrawalsController {
  private readonly logger = new Logger(AdminWithdrawalsController.name);

  constructor(
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    private readonly walletService: WalletService,
    private readonly paystackService: PaystackService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all withdrawal transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String, enum: ['pending', 'processing', 'completed', 'failed'] })
  @ApiQuery({ name: 'ownerType', required: false, type: String, enum: ['buyer', 'farmer', 'rider'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getWithdrawals(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('ownerType') ownerType?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const queryBuilder = this.walletTransactionRepository
      .createQueryBuilder('tx')
      .where('tx.category = :category', { category: TransactionCategory.WITHDRAWAL })
      .orderBy('tx.createdAt', 'DESC');

    // Filter by owner type
    if (ownerType) {
      queryBuilder.andWhere('tx.ownerType = :ownerType', { ownerType });
    }

    // Filter by date range
    if (startDate && endDate) {
      queryBuilder.andWhere('tx.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate + 'T23:59:59.999Z'),
      });
    }

    // Filter by status (stored in metadata)
    if (status) {
      queryBuilder.andWhere("tx.metadata->>'status' = :status", { status });
    }

    // Search by reference or account details
    if (search) {
      queryBuilder.andWhere(
        "(tx.reference ILIKE :search OR tx.metadata->>'accountName' ILIKE :search OR tx.metadata->>'accountNumber' ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const withdrawals = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Enrich with user info
    const enrichedWithdrawals = await Promise.all(
      withdrawals.map(async (tx) => {
        let user = null;
        if (tx.ownerType === WalletOwnerType.BUYER || tx.ownerType === WalletOwnerType.FARMER) {
          user = await this.userRepository.findOne({
            where: { id: tx.ownerId },
            select: ['id', 'name', 'email', 'phone', 'role'],
          });
        } else if (tx.ownerType === WalletOwnerType.RIDER) {
          // For riders, ownerId might be rider ID, need to find associated user
          const riderUser = await this.userRepository.findOne({
            where: { role: UserRole.RIDER },
            select: ['id', 'name', 'email', 'phone', 'role'],
          });
          user = riderUser;
        }

        return {
          id: tx.id,
          reference: tx.reference,
          amount: Math.abs(Number(tx.amount)),
          fee: tx.metadata?.fee || 0,
          netAmount: tx.metadata?.netAmount || Math.abs(Number(tx.amount)),
          status: tx.metadata?.status || 'completed',
          ownerType: tx.ownerType,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          } : null,
          bankAccount: {
            bankName: tx.metadata?.bankName,
            accountNumber: tx.metadata?.accountNumber,
            accountName: tx.metadata?.accountName,
          },
          transferCode: tx.metadata?.transferCode,
          createdAt: tx.createdAt,
        };
      })
    );

    return {
      withdrawals: enrichedWithdrawals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get withdrawal statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getWithdrawalStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const queryBuilder = this.walletTransactionRepository
      .createQueryBuilder('tx')
      .where('tx.category = :category', { category: TransactionCategory.WITHDRAWAL });

    if (startDate && endDate) {
      queryBuilder.andWhere('tx.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate + 'T23:59:59.999Z'),
      });
    }

    // Total withdrawals
    const totalResult = await queryBuilder
      .select('SUM(ABS(tx.amount))', 'total')
      .addSelect('COUNT(*)', 'count')
      .getRawOne();

    // By owner type
    const byOwnerType = await this.walletTransactionRepository
      .createQueryBuilder('tx')
      .select('tx.ownerType', 'ownerType')
      .addSelect('SUM(ABS(tx.amount))', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('tx.category = :category', { category: TransactionCategory.WITHDRAWAL })
      .groupBy('tx.ownerType')
      .getRawMany();

    // By status
    const byStatus = await this.walletTransactionRepository
      .createQueryBuilder('tx')
      .select("COALESCE(tx.metadata->>'status', 'completed')", 'status')
      .addSelect('SUM(ABS(tx.amount))', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('tx.category = :category', { category: TransactionCategory.WITHDRAWAL })
      .groupBy("tx.metadata->>'status'")
      .getRawMany();

    // Today's withdrawals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayResult = await this.walletTransactionRepository
      .createQueryBuilder('tx')
      .select('SUM(ABS(tx.amount))', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('tx.category = :category', { category: TransactionCategory.WITHDRAWAL })
      .andWhere('tx.createdAt BETWEEN :start AND :end', { start: today, end: todayEnd })
      .getRawOne();

    // This week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekResult = await this.walletTransactionRepository
      .createQueryBuilder('tx')
      .select('SUM(ABS(tx.amount))', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('tx.category = :category', { category: TransactionCategory.WITHDRAWAL })
      .andWhere('tx.createdAt BETWEEN :start AND :end', { start: weekStart, end: todayEnd })
      .getRawOne();

    return {
      total: {
        amount: Number(totalResult?.total || 0),
        count: Number(totalResult?.count || 0),
      },
      today: {
        amount: Number(todayResult?.total || 0),
        count: Number(todayResult?.count || 0),
      },
      thisWeek: {
        amount: Number(weekResult?.total || 0),
        count: Number(weekResult?.count || 0),
      },
      byOwnerType: byOwnerType.map(item => ({
        ownerType: item.ownerType,
        amount: Number(item.total || 0),
        count: Number(item.count || 0),
      })),
      byStatus: byStatus.map(item => ({
        status: item.status || 'completed',
        amount: Number(item.total || 0),
        count: Number(item.count || 0),
      })),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get withdrawal details' })
  @ApiParam({ name: 'id', description: 'Withdrawal transaction ID' })
  async getWithdrawal(@Param('id') id: string) {
    const withdrawal = await this.walletTransactionRepository.findOne({
      where: { id, category: TransactionCategory.WITHDRAWAL },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    // Get user info
    let user = null;
    if (withdrawal.ownerType === WalletOwnerType.BUYER || withdrawal.ownerType === WalletOwnerType.FARMER) {
      user = await this.userRepository.findOne({
        where: { id: withdrawal.ownerId },
        select: ['id', 'name', 'email', 'phone', 'role', 'walletBalance'],
      });
    }

    return {
      id: withdrawal.id,
      reference: withdrawal.reference,
      amount: Math.abs(Number(withdrawal.amount)),
      fee: withdrawal.metadata?.fee || 0,
      netAmount: withdrawal.metadata?.netAmount || Math.abs(Number(withdrawal.amount)),
      status: withdrawal.metadata?.status || 'completed',
      ownerType: withdrawal.ownerType,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        currentBalance: Number(user.walletBalance || 0),
      } : null,
      bankAccount: {
        id: withdrawal.metadata?.bankAccountId,
        bankName: withdrawal.metadata?.bankName,
        accountNumber: withdrawal.metadata?.accountNumber,
        accountName: withdrawal.metadata?.accountName,
      },
      transferCode: withdrawal.metadata?.transferCode,
      withdrawalReference: withdrawal.metadata?.withdrawalReference,
      balanceBefore: Number(withdrawal.balanceBefore),
      balanceAfter: Number(withdrawal.balanceAfter),
      description: withdrawal.description,
      createdAt: withdrawal.createdAt,
      metadata: withdrawal.metadata,
    };
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed withdrawal' })
  @ApiParam({ name: 'id', description: 'Withdrawal transaction ID' })
  async retryWithdrawal(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ) {
    const withdrawal = await this.walletTransactionRepository.findOne({
      where: { id, category: TransactionCategory.WITHDRAWAL },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.metadata?.status !== 'failed') {
      throw new BadRequestException('Only failed withdrawals can be retried');
    }

    // Get bank account
    const bankAccountId = withdrawal.metadata?.bankAccountId;
    if (!bankAccountId) {
      throw new BadRequestException('No bank account associated with this withdrawal');
    }

    const bankAccount = await this.bankAccountRepository.findOne({
      where: { id: bankAccountId },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    // Generate new reference
    const reference = `WD-RETRY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      // Initiate new transfer
      const transfer = await this.paystackService.initiateTransfer({
        amount: (withdrawal.metadata?.netAmount || Math.abs(Number(withdrawal.amount))) * 100,
        recipientCode: bankAccount.recipientCode!,
        reason: `Handwork withdrawal retry - ${reference}`,
        reference,
      });

      // Update withdrawal metadata
      withdrawal.metadata = {
        ...withdrawal.metadata,
        status: 'processing',
        retryReference: reference,
        retryTransferCode: transfer.transfer_code,
        retriedAt: new Date().toISOString(),
        retriedBy: admin.id,
      };
      await this.walletTransactionRepository.save(withdrawal);

      this.logger.log(`[retryWithdrawal] Admin ${admin.id} retried withdrawal ${id}, new transfer: ${transfer.transfer_code}`);

      return {
        success: true,
        message: 'Withdrawal retry initiated',
        transferCode: transfer.transfer_code,
        reference,
      };
    } catch (error) {
      this.logger.error(`[retryWithdrawal] Failed: ${error.message}`);
      throw new BadRequestException(`Retry failed: ${error.message}`);
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Manually update withdrawal status' })
  @ApiParam({ name: 'id', description: 'Withdrawal transaction ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['completed', 'failed', 'pending'] },
        reason: { type: 'string', description: 'Reason for status change' },
      },
    },
  })
  async updateWithdrawalStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @CurrentUser() admin: User,
  ) {
    const withdrawal = await this.walletTransactionRepository.findOne({
      where: { id, category: TransactionCategory.WITHDRAWAL },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    const previousStatus = withdrawal.metadata?.status || 'completed';

    withdrawal.metadata = {
      ...withdrawal.metadata,
      status: body.status,
      statusUpdatedAt: new Date().toISOString(),
      statusUpdatedBy: admin.id,
      statusUpdateReason: body.reason,
      previousStatus,
    };

    await this.walletTransactionRepository.save(withdrawal);

    this.logger.log(`[updateWithdrawalStatus] Admin ${admin.id} updated withdrawal ${id} status from ${previousStatus} to ${body.status}`);

    return {
      success: true,
      message: `Withdrawal status updated to ${body.status}`,
      withdrawal: {
        id: withdrawal.id,
        reference: withdrawal.reference,
        status: body.status,
        previousStatus,
      },
    };
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a failed withdrawal back to wallet' })
  @ApiParam({ name: 'id', description: 'Withdrawal transaction ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for refund' },
      },
    },
  })
  async refundWithdrawal(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() admin: User,
  ) {
    const withdrawal = await this.walletTransactionRepository.findOne({
      where: { id, category: TransactionCategory.WITHDRAWAL },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.metadata?.refunded) {
      throw new BadRequestException('This withdrawal has already been refunded');
    }

    const amount = Math.abs(Number(withdrawal.amount));

    // Credit wallet back
    await this.walletService.creditWallet({
      ownerId: withdrawal.ownerId,
      ownerType: withdrawal.ownerType,
      amount,
      category: TransactionCategory.REFUND,
      description: `Refund for withdrawal ${withdrawal.reference} - ${body.reason || 'Admin refund'}`,
      metadata: {
        originalWithdrawalId: withdrawal.id,
        originalReference: withdrawal.reference,
        refundedBy: admin.id,
        refundReason: body.reason,
      },
    });

    // Mark withdrawal as refunded
    withdrawal.metadata = {
      ...withdrawal.metadata,
      status: 'refunded',
      refunded: true,
      refundedAt: new Date().toISOString(),
      refundedBy: admin.id,
      refundReason: body.reason,
    };
    await this.walletTransactionRepository.save(withdrawal);

    this.logger.log(`[refundWithdrawal] Admin ${admin.id} refunded withdrawal ${id} (₦${amount})`);

    return {
      success: true,
      message: `Withdrawal refunded. ₦${amount.toLocaleString()} credited back to wallet.`,
      amount,
    };
  }
}
