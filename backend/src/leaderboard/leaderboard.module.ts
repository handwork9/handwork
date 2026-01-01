import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { User } from '../database/entities/user.entity';
import { Order } from '../database/entities/order.entity';
import { Product } from '../database/entities/product.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';
import { FarmerBadge } from '../database/entities/farmer-badge.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Order,
      Product,
      FarmerProfile,
      FarmerBadge,
    ]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
