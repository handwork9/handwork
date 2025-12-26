import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispute, DisputeMessage, User, Order } from '../database/entities';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { DisputeGateway } from './dispute.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dispute, DisputeMessage, User, Order]),
    forwardRef(() => WalletModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [DisputeController],
  providers: [DisputeService, DisputeGateway],
  exports: [DisputeService],
})
export class DisputeModule {}
