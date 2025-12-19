import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from '../database/entities/product.entity';
import { RecommendationModule } from '../recommendations/recommendation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    forwardRef(() => RecommendationModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
