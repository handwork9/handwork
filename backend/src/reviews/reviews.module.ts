import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review, Order, User, Rider, FarmerProfile } from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Order, User, Rider, FarmerProfile]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
