import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationController } from './moderation.controller';
import { ContentModerationService } from '../admin/content-moderation.service';
import {
  ContentModeration,
  User,
  Product,
  Review,
  SocialPost,
  FarmStory,
  PostComment,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContentModeration,
      User,
      Product,
      Review,
      SocialPost,
      FarmStory,
      PostComment,
    ]),
  ],
  controllers: [ModerationController],
  providers: [ContentModerationService],
  exports: [ContentModerationService],
})
export class ModerationModule {}
