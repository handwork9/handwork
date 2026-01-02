import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FarmerSubscriptionService } from './farmer-subscription.service';
import { FarmerSubscriptionController } from './farmer-subscription.controller';
import { FarmerAnalyticsService } from './farmer-analytics.service';
import { FarmerAnalyticsController } from './farmer-analytics.controller';
import { User, PlatformRevenue, FarmerSubscription, Order, Product, FarmerProfile, AccountDeletionRequest } from '../database/entities';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PlatformRevenue, FarmerSubscription, Order, Product, FarmerProfile, AccountDeletionRequest]),
    forwardRef(() => WalletModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => CouponsModule),
    EmailModule,
  ],
  controllers: [UsersController, FarmerSubscriptionController, FarmerAnalyticsController],
  providers: [UsersService, FarmerSubscriptionService, FarmerAnalyticsService],
  exports: [UsersService, FarmerSubscriptionService, FarmerAnalyticsService],
})
export class UsersModule {}
