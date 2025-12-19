import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import {
  LoyaltyAccount,
  PointTransaction,
  Reward,
  RewardRedemption,
} from '../database/entities/loyalty-points.entity';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyAccount,
      PointTransaction,
      Reward,
      RewardRedemption,
      User,
    ]),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
