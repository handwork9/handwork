import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentsService, PaymentResult } from './payments.service';
import { PaystackService } from './paystack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole, PaymentMethod } from '../common/enums';
import { Payment } from '../database/entities';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paystackService: PaystackService,
  ) {}

  @Post('intent')
  @Roles(UserRole.BUYER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create payment intent for order' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['orderId', 'amount'],
      properties: {
        orderId: { type: 'string', example: 'order-uuid' },
        amount: { type: 'number', example: 5000 },
        currency: { type: 'string', example: 'ngn', default: 'ngn' },
        paymentMethod: { type: 'string', enum: ['card', 'bank_transfer', 'wallet'] },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created',
  })
  async createPaymentIntent(
    @Body() body: {
      orderId: string;
      amount: number;
      currency?: string;
      paymentMethod?: PaymentMethod;
    },
  ): Promise<PaymentResult> {
    return this.paymentsService.createPaymentIntent(body);
  }

  @Post('wallet/topup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create wallet top-up payment' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: { type: 'number', example: 10000 },
        currency: { type: 'string', example: 'ngn', default: 'ngn' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Wallet top-up payment created',
  })
  async createWalletTopUp(
    @CurrentUser() user: any,
    @Body() body: { amount: number; currency?: string },
  ): Promise<PaymentResult> {
    return this.paymentsService.createWalletTopUp({
      userId: user.id,
      amount: body.amount,
      currency: body.currency,
    });
  }

  @Post('wallet/pay')
  @Roles(UserRole.BUYER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pay for order with wallet balance' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['orderId'],
      properties: {
        orderId: { type: 'string', example: 'order-uuid' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order paid with wallet',
  })
  async payWithWallet(
    @CurrentUser() user: any,
    @Body() body: { orderId: string },
  ): Promise<PaymentResult> {
    return this.paymentsService.payWithWallet(body.orderId, user.id);
  }

  @Post(':paymentId/refund')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a payment (admin)' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 2500 },
        reason: { type: 'string', example: 'Customer request' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment refunded',
  })
  async refundPayment(
    @Param('paymentId') paymentId: string,
    @Body() body: { amount?: number; reason?: string },
  ): Promise<PaymentResult> {
    return this.paymentsService.refundPayment(paymentId, body.amount, body.reason);
  }

  @Get('user/history')
  @ApiOperation({ summary: 'Get payment history for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of user payments',
  })
  async getUserPayments(@CurrentUser() user: any): Promise<Payment[]> {
    return this.paymentsService.getUserPayments(user.id);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments for an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'List of order payments',
  })
  async getOrderPayments(@Param('orderId') orderId: string): Promise<Payment[]> {
    return this.paymentsService.getOrderPayments(orderId);
  }

  // ============================================
  // PAYSTACK ENDPOINTS
  // ============================================

  @Get('dva')
  @ApiOperation({ summary: 'Get DVA (Dedicated Virtual Account) details for wallet top-up via bank transfer' })
  @ApiResponse({
    status: 200,
    description: 'DVA account details for bank transfer',
    schema: {
      type: 'object',
      properties: {
        hasDva: { type: 'boolean' },
        accountNumber: { type: 'string', example: '1234567890' },
        accountName: { type: 'string', example: 'HANDWORK/John Doe' },
        bankName: { type: 'string', example: 'Wema Bank' },
        message: { type: 'string' },
      },
    },
  })
  async getDvaDetails(@CurrentUser() user: any): Promise<{
    hasDva: boolean;
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    message: string;
  }> {
    const userDetails = await this.paystackService.getUserDvaDetails(user.id);
    return userDetails;
  }

  @Post('dva/setup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Setup/regenerate DVA for user (if not already setup)' })
  @ApiResponse({
    status: 201,
    description: 'DVA setup initiated',
  })
  async setupDva(@CurrentUser() user: any): Promise<{
    success: boolean;
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    message: string;
  }> {
    return this.paystackService.setupUserPaystackAccount(user);
  }

  @Post('paystack/initialize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize Paystack payment (card/bank)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: { type: 'number', example: 5000, description: 'Amount in NGN' },
        orderId: { type: 'string', example: 'order-uuid', description: 'Optional order ID' },
        type: { type: 'string', enum: ['order_payment', 'wallet_topup'], default: 'wallet_topup' },
        callbackUrl: { type: 'string', example: 'https://app.handwork.ng/payment/callback' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Paystack payment initialized',
    schema: {
      type: 'object',
      properties: {
        authorizationUrl: { type: 'string', description: 'URL to redirect user for payment' },
        accessCode: { type: 'string' },
        reference: { type: 'string' },
      },
    },
  })
  async initializePaystackPayment(
    @CurrentUser() user: any,
    @Body() body: {
      amount: number;
      orderId?: string;
      type?: 'order_payment' | 'wallet_topup';
      callbackUrl?: string;
    },
  ): Promise<{
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  }> {
    const { amount, orderId, type = 'wallet_topup', callbackUrl } = body;

    if (!user.email) {
      throw new BadRequestException('User email is required for Paystack payment');
    }

    const metadata: Record<string, any> = {
      userId: user.id,
      type,
    };

    if (orderId) {
      metadata.orderId = orderId;
    }

    const result = await this.paystackService.initializeTransaction({
      email: user.email,
      amount: amount * 100, // Convert to kobo
      reference: `${type}_${user.id}_${Date.now()}`,
      callbackUrl,
      metadata,
    });

    return {
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      reference: result.reference,
    };
  }

  @Get('paystack/verify/:reference')
  @ApiOperation({ summary: 'Verify Paystack payment status' })
  @ApiParam({ name: 'reference', description: 'Payment reference' })
  @ApiResponse({
    status: 200,
    description: 'Payment verification result',
  })
  async verifyPaystackPayment(
    @Param('reference') reference: string,
  ): Promise<{
    status: string;
    amount: number;
    reference: string;
    paidAt?: string;
  }> {
    const result = await this.paystackService.verifyTransaction(reference);
    return {
      status: result.status,
      amount: result.amount / 100, // Convert from kobo to NGN
      reference: result.reference,
      paidAt: result.paid_at,
    };
  }

  @Get('banks')
  @Public()
  @ApiOperation({ summary: 'Get list of Nigerian banks for transfers' })
  @ApiResponse({
    status: 200,
    description: 'List of banks',
  })
  async getBanks(): Promise<Array<{ name: string; code: string }>> {
    const banks = await this.paystackService.listBanks();
    return banks.map((bank: any) => ({
      name: bank.name,
      code: bank.code,
    }));
  }

  @Post('bank/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve bank account name' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['accountNumber', 'bankCode'],
      properties: {
        accountNumber: { type: 'string', example: '0123456789' },
        bankCode: { type: 'string', example: '058' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resolved account details',
  })
  async resolveBankAccount(
    @Body() body: { accountNumber: string; bankCode: string },
  ): Promise<{ accountNumber: string; accountName: string }> {
    const result = await this.paystackService.resolveAccountNumber(
      body.accountNumber,
      body.bankCode,
    );
    return {
      accountNumber: result.account_number,
      accountName: result.account_name,
    };
  }

  @Post('paystack/cancel/:reference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending Paystack payment' })
  @ApiParam({ name: 'reference', description: 'Payment reference' })
  @ApiResponse({
    status: 200,
    description: 'Payment cancelled',
  })
  async cancelPaystackPayment(
    @Param('reference') reference: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.paymentsService.cancelPaymentByReference(reference);
    return { success: true, message: 'Payment cancelled successfully' };
  }

  @Post(':paymentId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending payment by ID' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment cancelled',
  })
  async cancelPayment(
    @Param('paymentId') paymentId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.paymentsService.handlePaymentCancelled(paymentId);
    return { success: true, message: 'Payment cancelled successfully' };
  }

  // This route must be LAST because :paymentId is a catch-all parameter
  @Get(':paymentId')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment details',
  })
  async getPayment(@Param('paymentId') paymentId: string): Promise<Payment | null> {
    return this.paymentsService.getPayment(paymentId);
  }
}
