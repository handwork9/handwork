import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBundle } from '../database/entities/product-bundle.entity';
import { Product } from '../database/entities/product.entity';
import { BundlesController } from './bundles.controller';
import { BundlesService } from './bundles.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductBundle, Product])],
  controllers: [BundlesController],
  providers: [BundlesService],
  exports: [BundlesService],
})
export class BundlesModule {}
