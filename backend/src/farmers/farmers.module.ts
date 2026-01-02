import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmersController } from './farmers.controller';
import { FarmersService } from './farmers.service';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { Order } from '../database/entities/order.entity';
import { Product } from '../database/entities/product.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, FarmerProfile]),
    forwardRef(() => UsersModule),
    forwardRef(() => ProductsModule),
  ],
  controllers: [FarmersController],
  providers: [FarmersService],
  exports: [FarmersService],
})
export class FarmersModule {}
