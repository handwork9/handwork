import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupBuyingService } from './group-buying.service';
import { GroupBuyingController } from './group-buying.controller';
import { GroupBuy, GroupBuyParticipant } from '../database/entities/group-buy.entity';
import { Product } from '../database/entities/product.entity';
import { User } from '../database/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupBuy,
      GroupBuyParticipant,
      Product,
      User,
    ]),
    WalletModule,
    NotificationsModule,
  ],
  controllers: [GroupBuyingController],
  providers: [GroupBuyingService],
  exports: [GroupBuyingService],
})
export class GroupBuyingModule {}
