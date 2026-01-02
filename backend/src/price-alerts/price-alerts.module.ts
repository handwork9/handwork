import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PriceAlertsService } from './price-alerts.service';
import { PriceAlertsController } from './price-alerts.controller';
import { PriceHistory, Product, Favorite, User } from '../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceHistory, Product, Favorite, User]),
    ScheduleModule.forRoot(),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [PriceAlertsController],
  providers: [PriceAlertsService],
  exports: [PriceAlertsService],
})
export class PriceAlertsModule {}
