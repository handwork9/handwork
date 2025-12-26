import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { BankAccountsService } from './bank-accounts.service';

@ApiTags('Bank Accounts')
@ApiBearerAuth()
@Controller('bank-accounts')
@UseGuards(JwtAuthGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all bank accounts for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of bank accounts',
    schema: {
      type: 'object',
      properties: {
        accounts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              bankCode: { type: 'string' },
              bankName: { type: 'string' },
              accountNumber: { type: 'string' },
              accountName: { type: 'string' },
              isDefault: { type: 'boolean' },
              isVerified: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  async getBankAccounts(@CurrentUser() user: User) {
    console.log('[BankAccountsController] getBankAccounts - userId:', user.id);
    const accounts = await this.bankAccountsService.getBankAccounts(user.id);
    console.log('[BankAccountsController] getBankAccounts - found accounts:', accounts.length);
    return { accounts };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify bank account details' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['bankCode', 'accountNumber'],
      properties: {
        bankCode: { type: 'string', example: '058' },
        accountNumber: { type: 'string', example: '0123456789' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Account verified',
    schema: {
      type: 'object',
      properties: {
        accountName: { type: 'string' },
        accountNumber: { type: 'string' },
        bankCode: { type: 'string' },
      },
    },
  })
  async verifyAccount(
    @Body() body: { bankCode: string; accountNumber: string },
  ) {
    if (!body.bankCode || !body.accountNumber) {
      throw new BadRequestException('Bank code and account number are required');
    }
    if (body.accountNumber.length !== 10) {
      throw new BadRequestException('Account number must be 10 digits');
    }
    return this.bankAccountsService.verifyAccount(body.bankCode, body.accountNumber);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new bank account' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['bankCode', 'accountNumber', 'accountName'],
      properties: {
        bankCode: { type: 'string', example: '058' },
        accountNumber: { type: 'string', example: '0123456789' },
        accountName: { type: 'string', example: 'John Doe' },
        setAsDefault: { type: 'boolean', default: false },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bank account added successfully',
  })
  async addBankAccount(
    @CurrentUser() user: User,
    @Body() body: {
      bankCode: string;
      accountNumber: string;
      accountName: string;
      setAsDefault?: boolean;
    },
  ) {
    console.log('[BankAccountsController] addBankAccount - user.id:', user?.id);
    if (!body.bankCode || !body.accountNumber || !body.accountName) {
      throw new BadRequestException('Bank code, account number, and account name are required');
    }
    return this.bankAccountsService.addBankAccount(user.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a bank account' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiResponse({ status: 204, description: 'Bank account deleted' })
  async deleteBankAccount(
    @CurrentUser() user: User,
    @Param('id') accountId: string,
  ) {
    await this.bankAccountsService.deleteBankAccount(user.id, accountId);
  }

  @Put(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a bank account as default' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiResponse({ status: 200, description: 'Default bank account updated' })
  async setDefaultAccount(
    @CurrentUser() user: User,
    @Param('id') accountId: string,
  ) {
    await this.bankAccountsService.setDefaultAccount(user.id, accountId);
    return { message: 'Default bank account updated' };
  }
}
