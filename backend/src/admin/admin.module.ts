import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminWithdrawalsController } from './admin-withdrawals.controller';
import { AdminBuyerPremiumController } from './admin-buyer-premium.controller';
import { AdminTeamController } from './admin-team.controller';
import { AdminTeamService } from './admin-team.service';
import { FraudDetectionService } from './fraud-detection.service';
import { FraudDetectionController } from './fraud-detection.controller';
import { ContentModerationService } from './content-moderation.service';
import { ContentModerationController } from './content-moderation.controller';
import { 
  User, Order, Product, Rider, Payment, DispatchLog, FarmerProfile, 
  AuditLog, AppSettings, PlatformRevenue, FarmerSubscription, RiderSubscription, 
  BankAccount, AdminInvite, Review, SocialPost, FarmStory, PostComment,
  CouponUsage,
} from '../database/entities';
import { WalletTransaction } from '../database/entities/wallet-transaction.entity';
import { FraudAlert } from '../database/entities/fraud-alert.entity';
import { ContentModeration } from '../database/entities/content-moderation.entity';
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
    TypeOrmModule.forFeature([
      User, Order, Product, Rider, Payment, DispatchLog, FarmerProfile, 
      AuditLog, AppSettings, PlatformRevenue, FarmerSubscription, RiderSubscription, 
      WalletTransaction, BankAccount, AdminInvite, Review, SocialPost, FarmStory, 
      PostComment, CouponUsage, FraudAlert, ContentModeration,
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => RidersModule),
    forwardRef(() => WalletModule),
    forwardRef(() => PaymentsModule),
    forwardRef(() => NotificationsModule),
    EmailModule,
  ],
  controllers: [
    AdminController, 
    AdminWithdrawalsController, 
    AdminBuyerPremiumController, 
    AdminTeamController,
    FraudDetectionController,
    ContentModerationController,
  ],
  providers: [AdminService, AdminTeamService, FraudDetectionService, ContentModerationService],
  exports: [AdminService, AdminTeamService, FraudDetectionService, ContentModerationService],
})
export class AdminModule {}
