import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
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
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { WalletService } from './wallet.service';
import { BankAccountsService } from './bank-accounts.service';
import { PaystackService } from '../payments/paystack.service';
import { WalletOwnerType, TransactionCategory, TransactionType } from '../database/entities/wallet-transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '../database/entities';

interface WithdrawalRequest {
  bankAccountId: string;
  amount: number;
  fee?: number;
}

@ApiTags('Withdrawals')
@ApiBearerAuth()
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  private readonly logger = new Logger(WithdrawalsController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly bankAccountsService: BankAccountsService,
    private readonly paystackService: PaystackService,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a withdrawal' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['bankAccountId', 'amount'],
      properties: {
        bankAccountId: { type: 'string', description: 'Bank account ID to withdraw to' },
        amount: { type: 'number', description: 'Amount to withdraw in Naira' },
        fee: { type: 'number', description: 'Processing fee (optional)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Withdrawal initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient balance' })
  async requestWithdrawal(
    @CurrentUser() user: User,
    @Body() body: WithdrawalRequest,
  ) {
    this.logger.log(`[requestWithdrawal] User: ${user.id}, Amount: ${body.amount}, BankAccountId: ${body.bankAccountId}`);

    // Validate amount
    if (!body.amount || body.amount < 500) {
      throw new BadRequestException('Minimum withdrawal amount is ₦500');
    }
    if (body.amount > 5000000) {
      throw new BadRequestException('Maximum withdrawal amount is ₦5,000,000');
    }

    // Get bank account
    const bankAccount = await this.bankAccountRepository.findOne({
      where: { id: body.bankAccountId, userId: user.id },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    // Calculate fee (flat ₦50 fee)
    const fee = body.fee || 50;
    const totalDebit = body.amount + fee;

    // Determine owner type based on user role
    let ownerType = WalletOwnerType.BUYER;
    let ownerId = user.id;

    if (user.role === 'farmer') {
      ownerType = WalletOwnerType.FARMER;
    } else if (user.role === 'rider') {
      ownerType = WalletOwnerType.RIDER;
      const riderId = await this.walletService.getRiderIdByUserId(user.id);
      if (riderId) {
        ownerId = riderId;
      }
    }

    // Check balance
    let currentBalance = 0;
    if (user.role === 'rider') {
      currentBalance = await this.walletService.getRiderWalletBalance(user.id);
    } else {
      currentBalance = await this.walletService.getUserWalletBalance(user.id);
    }

    if (currentBalance < totalDebit) {
      throw new BadRequestException(`Insufficient balance. Available: ₦${currentBalance.toLocaleString()}, Required: ₦${totalDebit.toLocaleString()}`);
    }

    // Ensure bank account has recipient code
    if (!bankAccount.recipientCode) {
      try {
        const recipient = await this.paystackService.createTransferRecipient({
          name: bankAccount.accountName,
          accountNumber: bankAccount.accountNumber,
          bankCode: bankAccount.bankCode,
        });
        bankAccount.recipientCode = recipient.recipient_code;
        await this.bankAccountRepository.save(bankAccount);
      } catch (error) {
        this.logger.error(`Failed to create transfer recipient: ${error.message}`);
        // Provide a more helpful error message
        const errorMsg = error.response?.message || error.message || 'Unknown error';
        if (errorMsg.includes('Cannot resolve account') || errorMsg.includes('invalid_bank_code')) {
          throw new BadRequestException('Unable to verify bank account. Please ensure the account number and bank are correct, or try adding the bank account again.');
        }
        throw new BadRequestException(`Failed to set up transfer: ${errorMsg}`);
      }
    }

    // Generate withdrawal reference
    const reference = `WD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      // Debit wallet
      const transaction = await this.walletService.debitWallet({
        ownerId,
        ownerType,
        amount: totalDebit,
        category: TransactionCategory.WITHDRAWAL,
        description: `Withdrawal to ${bankAccount.bankName} - ${bankAccount.accountNumber.slice(-4)}`,
        metadata: {
          withdrawalReference: reference,
          bankAccountId: bankAccount.id,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          accountName: bankAccount.accountName,
          fee,
          netAmount: body.amount,
        },
      });

      // Initiate Paystack transfer (amount in kobo)
      try {
        const transfer = await this.paystackService.initiateTransfer({
          amount: body.amount * 100, // Convert to kobo
          recipientCode: bankAccount.recipientCode!,
          reason: `Handwork withdrawal - ${reference}`,
          reference,
        });

        this.logger.log(`[requestWithdrawal] Transfer initiated: ${transfer.transfer_code}`);

        return {
          id: transaction.id,
          reference: transaction.reference,
          amount: body.amount,
          fee,
          netAmount: body.amount,
          bankAccount: {
            id: bankAccount.id,
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            accountName: bankAccount.accountName,
          },
          status: 'processing',
          transferCode: transfer.transfer_code,
          createdAt: transaction.createdAt,
        };
      } catch (transferError) {
        // If transfer fails, refund the wallet
        this.logger.error(`[requestWithdrawal] Transfer failed, refunding: ${transferError.message}`);
        
        await this.walletService.creditWallet({
          ownerId,
          ownerType,
          amount: totalDebit,
          category: TransactionCategory.REFUND,
          description: `Refund for failed withdrawal - ${reference}`,
          metadata: {
            originalReference: reference,
            reason: 'Transfer failed',
          },
        });

        throw new BadRequestException(`Withdrawal failed: ${transferError.message || 'Transfer service unavailable'}`);
      }
    } catch (error) {
      this.logger.error(`[requestWithdrawal] Error: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get withdrawal history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getWithdrawals(
    @CurrentUser() user: User,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
    @Query('status') status?: string,
  ) {
    // Parse pagination with defaults
    const page = parseInt(pageParam || '1', 10) || 1;
    const limit = parseInt(limitParam || '20', 10) || 20;
    
    // Determine owner type
    let ownerType = WalletOwnerType.BUYER;
    let ownerId = user.id;

    if (user.role === 'farmer') {
      ownerType = WalletOwnerType.FARMER;
    } else if (user.role === 'rider') {
      ownerType = WalletOwnerType.RIDER;
      const riderId = await this.walletService.getRiderIdByUserId(user.id);
      if (riderId) {
        ownerId = riderId;
      }
    }

    // Get withdrawal transactions
    const result = await this.walletService.getTransactionHistory(
      ownerId,
      ownerType,
      page,
      limit,
      TransactionCategory.WITHDRAWAL,
    );

    return {
      withdrawals: result.data.map(tx => ({
        id: tx.id,
        reference: tx.reference,
        amount: Math.abs(Number(tx.amount)),
        fee: tx.metadata?.fee || 0,
        netAmount: tx.metadata?.netAmount || Math.abs(Number(tx.amount)),
        status: 'completed', // or derive from metadata
        bankAccount: {
          bankName: tx.metadata?.bankName,
          accountNumber: tx.metadata?.accountNumber,
          accountName: tx.metadata?.accountName,
        },
        createdAt: tx.createdAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get withdrawal summary' })
  async getWithdrawalSummary(@CurrentUser() user: User) {
    // Determine owner type
    let ownerType = WalletOwnerType.BUYER;
    let ownerId = user.id;

    if (user.role === 'farmer') {
      ownerType = WalletOwnerType.FARMER;
    } else if (user.role === 'rider') {
      ownerType = WalletOwnerType.RIDER;
      const riderId = await this.walletService.getRiderIdByUserId(user.id);
      if (riderId) {
        ownerId = riderId;
      }
    }

    // Get balance
    let availableBalance = 0;
    if (user.role === 'rider') {
      availableBalance = await this.walletService.getRiderWalletBalance(user.id);
    } else {
      availableBalance = await this.walletService.getUserWalletBalance(user.id);
    }

    // Get withdrawal transactions to calculate totals
    const withdrawals = await this.walletService.getTransactionHistory(
      ownerId,
      ownerType,
      1,
      1000,
      TransactionCategory.WITHDRAWAL,
    );

    const totalWithdrawn = withdrawals.data.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
    const withdrawalCount = withdrawals.total;

    return {
      availableBalance,
      pendingWithdrawals: 0, // Would need status tracking for this
      totalWithdrawn,
      withdrawalCount,
    };
  }

  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending withdrawal' })
  @ApiParam({ name: 'id', description: 'Withdrawal ID' })
  async cancelWithdrawal(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    // For now, return error as cancellation isn't supported once transfer is initiated
    throw new BadRequestException('Withdrawals cannot be cancelled once initiated. Please contact support.');
  }
}
