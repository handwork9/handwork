import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { LiveStreamGateway } from './live-stream.gateway';
import { SocialPost } from '../database/entities/social-post.entity';
import { PostLike } from '../database/entities/post-like.entity';
import { PostComment } from '../database/entities/post-comment.entity';
import { FarmerFollow } from '../database/entities/farmer-follow.entity';
import { FarmStory } from '../database/entities/farm-story.entity';
import { StoryView } from '../database/entities/story-view.entity';
import { FarmLiveStream } from '../database/entities/farm-live-stream.entity';
import { SavedPost } from '../database/entities/saved-post.entity';
import { User } from '../database/entities/user.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocialPost,
      PostLike,
      PostComment,
      FarmerFollow,
      FarmStory,
      StoryView,
      FarmLiveStream,
      SavedPost,
      User,
      FarmerProfile,
    ]),
    forwardRef(() => AdminModule),
  ],
  controllers: [SocialController],
  providers: [SocialService, LiveStreamGateway],
  exports: [SocialService, LiveStreamGateway],
})
export class SocialModule {}
