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

    // Validate amount
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Use email or generate one from phone (Paystack requires email)
    const email = user.email || `${user.phone?.replace(/\+/g, '')}@handwork.ng`;
    
    if (!email) {
      throw new BadRequestException('User email or phone is required for Paystack payment');
    }

    const metadata: Record<string, any> = {
      userId: user.id,
      type,
    };

    if (orderId) {
      metadata.orderId = orderId;
    }

    const result = await this.paystackService.initializeTransaction({
      email,
      amount: Math.round(amount * 100), // Convert to kobo, ensure integer
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
  @ApiOperation({ summary: 'Verify Paystack payment status and process if successful' })
  @ApiParam({ name: 'reference', description: 'Payment reference' })
  @ApiResponse({
    status: 200,
    description: 'Payment verification result',
  })
  async verifyPaystackPayment(
    @CurrentUser() user: any,
    @Param('reference') reference: string,
  ): Promise<{
    status: string;
    amount: number;
    reference: string;
    paidAt?: string;
  }> {
    console.log(`[verifyPaystackPayment] Reference: ${reference}, User: ${user?.id}`);
    const result = await this.paystackService.verifyTransaction(reference);
    console.log(`[verifyPaystackPayment] Paystack result:`, JSON.stringify(result, null, 2));
    
    // If payment was successful, process it (credit wallet or confirm order)
    if (result.status === 'success') {
      console.log(`[verifyPaystackPayment] Payment successful, calling processPaystackPayment`);
      try {
        await this.paymentsService.processPaystackPayment(result, user?.id);
        console.log(`[verifyPaystackPayment] processPaystackPayment completed successfully`);
      } catch (error) {
        console.error(`[verifyPaystackPayment] processPaystackPayment ERROR:`, error);
      }
    } else {
      console.log(`[verifyPaystackPayment] Payment status is not success: ${result.status}`);
    }
    
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
  @Public()
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

  // ============================================
  // PAY FOR ME ENDPOINTS
  // ============================================

  @Post('paystack/pay-for-me')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a Pay for Me link that can be shared with someone to pay on your behalf' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount', 'customer'],
      properties: {
        amount: { type: 'number', example: 5000, description: 'Amount in NGN' },
        orderId: { type: 'string', example: 'order-uuid', description: 'Optional order ID' },
        customer: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Doe', description: 'Name of person who will pay' },
            email: { type: 'string', example: 'john@example.com', description: 'Email of person who will pay' },
            phone: { type: 'string', example: '+2348012345678', description: 'Phone of person who will pay' },
          },
        },
        description: { type: 'string', example: 'Help me pay for groceries' },
        expiresInHours: { type: 'number', example: 24, default: 24 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Pay for Me link created',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        paymentLink: { type: 'string', description: 'URL to share with the person who will pay' },
        reference: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async generatePayForMeLink(
    @CurrentUser() user: any,
    @Body() body: {
      amount: number;
      orderId?: string;
      customer: {
        name: string;
        email: string;
        phone?: string;
      };
      description?: string;
      expiresInHours?: number;
    },
  ): Promise<{
    success: boolean;
    paymentLink: string;
    reference: string;
    expiresAt: string;
  }> {
    const { amount, orderId, customer, description, expiresInHours } = body;

    // Validate
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    if (!customer?.email) {
      throw new BadRequestException('Customer email is required');
    }
    if (!customer?.name) {
      throw new BadRequestException('Customer name is required');
    }

    const result = await this.paystackService.generatePayForMeLink({
      amount,
      orderId,
      userId: user.id,
      recipientEmail: customer.email,
      recipientName: customer.name,
      recipientPhone: customer.phone,
      description: description || `Payment request from ${user.name || 'Handwork user'}`,
      expiresInHours,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('paystack/pay-for-me/:reference')
  @ApiOperation({ summary: 'Check status of a Pay for Me payment' })
  @ApiParam({ name: 'reference', description: 'Payment reference from the Pay for Me link' })
  @ApiResponse({
    status: 200,
    description: 'Pay for Me payment status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'success', 'failed', 'abandoned'] },
        paidAt: { type: 'string', format: 'date-time' },
        paidBy: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
        amount: { type: 'number' },
      },
    },
  })
  async checkPayForMeStatus(
    @Param('reference') reference: string,
  ): Promise<{
    status: string;
    paidAt?: string;
    paidBy?: { name: string; email: string };
    amount?: number;
  }> {
    try {
      const result = await this.paystackService.verifyTransaction(reference);
      
      return {
        status: result.status,
        paidAt: result.paid_at,
        paidBy: result.customer ? {
          name: `${result.customer.first_name || ''} ${result.customer.last_name || ''}`.trim() || result.customer.email,
          email: result.customer.email,
        } : undefined,
        amount: result.amount / 100, // Convert from kobo to NGN
      };
    } catch (error) {
      // If transaction not found, it's likely pending or expired
      return {
        status: 'pending',
      };
    }
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
