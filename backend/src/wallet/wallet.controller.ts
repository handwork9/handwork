import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PinService } from '../auth/pin.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WalletOwnerType, TransactionCategory } from '../database/entities/wallet-transaction.entity';
import { UserRole } from '../common/enums';
import { UsersService } from '../users/users.service';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly usersService: UsersService,
    private readonly pinService: PinService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current wallet balance' })
  async getBalance(@CurrentUser() user: { userId: string; role: UserRole }) {
    // Determine owner type based on role
    let balance = 0;
    
    if (user.role === UserRole.RIDER) {
      balance = await this.walletService.getRiderWalletBalance(user.userId);
    } else if (user.role === UserRole.FARMER) {
      balance = await this.walletService.getUserWalletBalance(user.userId);
    } else {
      // BUYER
      balance = await this.walletService.getUserWalletBalance(user.userId);
    }

    return {
      available: balance,
      pending: 0,
      total: balance,
      balance, // Keep for backwards compatibility
      currency: 'NGN',
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: TransactionCategory })
  async getTransactions(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('category') category?: TransactionCategory,
  ) {
    const ownerType = user.role === UserRole.RIDER 
      ? WalletOwnerType.RIDER 
      : WalletOwnerType.FARMER;

    return this.walletService.getTransactionHistory(
      user.userId,
      ownerType,
      page,
      limit,
      category,
    );
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction details' })
  async getTransaction(@Param('id') id: string) {
    return this.walletService.getTransactionById(id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get earnings summary' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getEarningsSummary(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const ownerType = user.role === UserRole.RIDER 
      ? WalletOwnerType.RIDER 
      : WalletOwnerType.FARMER;

    return this.walletService.getEarningsSummary(
      user.userId,
      ownerType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer funds to another user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 5000 },
        recipientPhone: { type: 'string', example: '08012345678' },
        pin: { type: 'string', example: '1234', description: 'Transaction PIN (required if PIN is enabled)' },
      },
      required: ['amount', 'recipientPhone'],
    },
  })
  @ApiResponse({ status: 200, description: 'Transfer completed successfully' })
  async transfer(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() body: { amount: number; recipientPhone: string; pin?: string },
  ) {
    // Check if user has PIN enabled and verify it
    const pinStatus = await this.pinService.hasPin(user.userId);
    if (pinStatus.isPinEnabled) {
      if (!body.pin) {
        throw new Error('Transaction PIN is required');
      }
      await this.pinService.verifyPin(user.userId, body.pin);
    }

    return this.walletService.transferToUser(
      user.userId,
      body.recipientPhone,
      body.amount,
    );
  }

  @Post('pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pay with wallet for bills/services' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 5000 },
        description: { type: 'string', example: 'Electricity bill - EKEDC' },
        orderId: { type: 'string', description: 'Optional order ID' },
        pin: { type: 'string', description: 'Transaction PIN (required if PIN is enabled)' },
      },
      required: ['amount', 'description'],
    },
  })
  @ApiResponse({ status: 200, description: 'Payment completed successfully' })
  async payWithWallet(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() body: { amount: number; description: string; orderId?: string; pin?: string },
  ) {
    // Check if user has PIN enabled and verify it
    const pinStatus = await this.pinService.hasPin(user.userId);
    if (pinStatus.isPinEnabled) {
      if (!body.pin) {
        throw new Error('Transaction PIN is required');
      }
      await this.pinService.verifyPin(user.userId, body.pin);
    }

    return this.walletService.payForService(
      user.userId,
      body.amount,
      body.description,
      body.orderId,
    );
  }

  @Post('pay-premium')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pay for premium subscription using wallet' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['basic', 'gold', 'platinum'], example: 'gold' },
        amount: { type: 'number', example: 3000 },
      },
      required: ['tier', 'amount'],
    },
  })
  @ApiResponse({ status: 200, description: 'Premium payment processed' })
  async payForPremium(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() body: { tier: string; amount: number },
  ) {
    // Default to monthly duration
    return this.usersService.subscribeToPremium(user.userId, {
      tier: body.tier as 'basic' | 'gold' | 'platinum',
      duration: 'monthly',
      paymentMethod: 'wallet',
    });
  }
}
