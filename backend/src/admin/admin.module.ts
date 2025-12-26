import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminWithdrawalsController } from './admin-withdrawals.controller';
import { AdminBuyerPremiumController } from './admin-buyer-premium.controller';
import { AdminTeamController } from './admin-team.controller';
import { AdminTeamService } from './admin-team.service';
import { User, Order, Product, Rider, Payment, DispatchLog, FarmerProfile, AuditLog, AppSettings, PlatformRevenue, FarmerSubscription, RiderSubscription, BankAccount, AdminInvite } from '../database/entities';
import { WalletTransaction } from '../database/entities/wallet-transaction.entity';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { RidersModule } from '../riders/riders.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order, Product, Rider, Payment, DispatchLog, FarmerProfile, AuditLog, AppSettings, PlatformRevenue, FarmerSubscription, RiderSubscription, WalletTransaction, BankAccount, AdminInvite]),
    forwardRef(() => UsersModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => RidersModule),
    forwardRef(() => WalletModule),
    forwardRef(() => PaymentsModule),
    forwardRef(() => NotificationsModule),
    EmailModule,
  ],
  controllers: [AdminController, AdminWithdrawalsController, AdminBuyerPremiumController, AdminTeamController],
  providers: [AdminService, AdminTeamService],
  exports: [AdminService, AdminTeamService],
})
export class AdminModule {}
