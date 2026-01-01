import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import { FarmerBadge } from '../database/entities/farmer-badge.entity';
import { User } from '../database/entities/user.entity';
import { Order } from '../database/entities/order.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';
import { Product } from '../database/entities/product.entity';
import { Review } from '../database/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FarmerBadge,
      User,
      Order,
      FarmerProfile,
      Product,
      Review,
    ]),
  ],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
