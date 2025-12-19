import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, Order, Product, Rider, Payment, DispatchLog, FarmerProfile, AuditLog, AppSettings, PlatformRevenue, FarmerSubscription, RiderSubscription } from '../database/entities';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { RidersModule } from '../riders/riders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order, Product, Rider, Payment, DispatchLog, FarmerProfile, AuditLog, AppSettings, PlatformRevenue, FarmerSubscription, RiderSubscription]),
    forwardRef(() => UsersModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => RidersModule),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
