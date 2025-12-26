import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { BankAccountsController } from './bank-accounts.controller';
import { WithdrawalsController } from './withdrawals.controller';
import { BankAccountsService } from './bank-accounts.service';
import { WalletTransaction } from '../database/entities/wallet-transaction.entity';
import { PlatformRevenue } from '../database/entities/platform-revenue.entity';
import { BankAccount } from '../database/entities/bank-account.entity';
import { User } from '../database/entities/user.entity';
import { Rider } from '../database/entities/rider.entity';
import { AppSettings } from '../database/entities/app-settings.entity';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletTransaction, PlatformRevenue, BankAccount, User, Rider, AppSettings]),
    forwardRef(() => UsersModule),
    forwardRef(() => PaymentsModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [WalletController, BankAccountsController, WithdrawalsController],
  providers: [WalletService, BankAccountsService],
  exports: [WalletService, BankAccountsService],
})
export class WalletModule {}
