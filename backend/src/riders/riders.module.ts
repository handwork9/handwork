import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidersService } from './riders.service';
import { RidersController } from './riders.controller';
import { RidersGateway } from './riders.gateway';
import { RiderSubscriptionService } from './rider-subscription.service';
import { RiderSubscriptionController } from './rider-subscription.controller';
import { Rider, RiderSubscription, PlatformRevenue, Order, FarmerProfile } from '../database/entities';
import { User } from '../database/entities/user.entity';
import { DispatchModule } from '../dispatch/dispatch.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rider, User, RiderSubscription, PlatformRevenue, Order, FarmerProfile]),
    forwardRef(() => DispatchModule),
    forwardRef(() => WalletModule),
    NotificationsModule,
    EmailModule,
  ],
  controllers: [RidersController, RiderSubscriptionController],
  providers: [RidersService, RidersGateway, RiderSubscriptionService],
  exports: [RidersService, RiderSubscriptionService],
})
export class RidersModule {}
