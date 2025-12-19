import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { 
  Product, 
  User, 
  Order, 
  UserPreference, 
  Favorite 
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      User,
      Order,
      UserPreference,
      Favorite,
    ]),
  ],
  providers: [RecommendationService],
  controllers: [RecommendationController],
  exports: [RecommendationService],
})
export class RecommendationModule {}
