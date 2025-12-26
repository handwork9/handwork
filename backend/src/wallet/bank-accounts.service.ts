import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '../database/entities';
import { PaystackService } from '../payments/paystack.service';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    private paystackService: PaystackService,
  ) {}

  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async verifyAccount(bankCode: string, accountNumber: string): Promise<{
    accountName: string;
    accountNumber: string;
    bankCode: string;
  }> {
    const result = await this.paystackService.resolveAccountNumber(accountNumber, bankCode);
    return {
      accountName: result.account_name,
      accountNumber: result.account_number,
      bankCode,
    };
  }

  async addBankAccount(
    userId: string,
    data: {
      bankCode: string;
      accountNumber: string;
      accountName: string;
      setAsDefault?: boolean;
    },
  ): Promise<BankAccount> {
    // Check if account already exists
    const existing = await this.bankAccountRepository.findOne({
      where: {
        userId,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
      },
    });

    if (existing) {
      throw new ConflictException('This bank account is already added');
    }

    // Get bank name from Paystack banks list
    const banks = await this.paystackService.listBanks();
    const bank = banks.find(b => b.code === data.bankCode);
    const bankName = bank?.name || 'Unknown Bank';

    // If this is the first account or setAsDefault is true, make it default
    const existingAccounts = await this.bankAccountRepository.count({ where: { userId } });
    const isDefault = existingAccounts === 0 || data.setAsDefault === true;

    // If setting as default, unset other defaults
    if (isDefault && existingAccounts > 0) {
      await this.bankAccountRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    // Create transfer recipient on Paystack - this must succeed for withdrawals to work
    let recipientCode: string;
    try {
      const recipient = await this.paystackService.createTransferRecipient({
        name: data.accountName,
        accountNumber: data.accountNumber,
        bankCode: data.bankCode,
      });
      recipientCode = recipient.recipient_code;
    } catch (error) {
      console.error('Failed to create Paystack transfer recipient:', error);
      // Provide a helpful error message
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('Cannot resolve account')) {
        throw new BadRequestException('Unable to verify bank account. Please ensure the account number is correct and belongs to the selected bank.');
      }
      throw new BadRequestException(`Failed to verify bank account: ${errorMsg}`);
    }

    const bankAccount = this.bankAccountRepository.create({
      userId,
      bankCode: data.bankCode,
      bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      isDefault,
      isVerified: true,
      recipientCode,
    });

    return this.bankAccountRepository.save(bankAccount);
  }

  async deleteBankAccount(userId: string, accountId: string): Promise<void> {
    const account = await this.bankAccountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    await this.bankAccountRepository.remove(account);

    // If deleted account was default, set another one as default
    if (account.isDefault) {
      const remainingAccount = await this.bankAccountRepository.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      if (remainingAccount) {
        remainingAccount.isDefault = true;
        await this.bankAccountRepository.save(remainingAccount);
      }
    }
  }

  async setDefaultAccount(userId: string, accountId: string): Promise<void> {
    const account = await this.bankAccountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    // Unset all other defaults
    await this.bankAccountRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    // Set this one as default
    account.isDefault = true;
    await this.bankAccountRepository.save(account);
  }

  async getDefaultAccount(userId: string): Promise<BankAccount | null> {
    return this.bankAccountRepository.findOne({
      where: { userId, isDefault: true },
    });
  }
}
