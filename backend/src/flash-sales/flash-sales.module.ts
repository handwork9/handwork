import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSale } from '../database/entities/flash-sale.entity';
import { Product } from '../database/entities/product.entity';
import { FlashSalesController } from './flash-sales.controller';
import { FlashSalesService } from './flash-sales.service';

@Module({
  imports: [TypeOrmModule.forFeature([FlashSale, Product])],
  controllers: [FlashSalesController],
  providers: [FlashSalesService],
  exports: [FlashSalesService],
})
export class FlashSalesModule {}
