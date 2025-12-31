import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionBoxesController } from './subscription-boxes.controller';
import { SubscriptionBoxesService } from './subscription-boxes.service';
import {
  SubscriptionBox,
  SubscriptionBoxDelivery,
} from '../database/entities/subscription-box.entity';
import { SubscriptionBoxTemplate } from '../database/entities/subscription-box-template.entity';
import { Product } from '../database/entities/product.entity';
import { User } from '../database/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionBox, SubscriptionBoxDelivery, SubscriptionBoxTemplate, Product, User]),
    WalletModule,
    NotificationsModule,
  ],
  controllers: [SubscriptionBoxesController],
  providers: [SubscriptionBoxesService],
  exports: [SubscriptionBoxesService],
})
export class SubscriptionBoxesModule {}
