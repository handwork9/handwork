import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from '../database/entities/product.entity';
import { RecommendationModule } from '../recommendations/recommendation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminModule } from '../admin/admin.module';
import { PriceAlertsModule } from '../price-alerts/price-alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    forwardRef(() => RecommendationModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => AdminModule),
    forwardRef(() => PriceAlertsModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
