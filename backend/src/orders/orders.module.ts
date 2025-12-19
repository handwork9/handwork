import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from '../database/entities/order.entity';
import { CartModule } from '../cart/cart.module';
import { ProductsModule } from '../products/products.module';
import { PaymentsModule } from '../payments/payments.module';
import { DispatchModule } from '../dispatch/dispatch.module';
import { RidersModule } from '../riders/riders.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { RecommendationModule } from '../recommendations/recommendation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    CartModule,
    ProductsModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => DispatchModule),
    forwardRef(() => RidersModule),
    forwardRef(() => WalletModule),
    NotificationsModule,
    EmailModule,
    RecommendationModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
