import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { ProductDiscount } from '../database/entities/product-discount.entity';
import { Product } from '../database/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductDiscount, Product]),
  ],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
