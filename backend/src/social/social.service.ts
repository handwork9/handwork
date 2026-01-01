// Social Service - handles posts, comments, stories, live streams
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, LessThan, MoreThan, IsNull } from 'typeorm';
import { SocialPost, PostType, PostVisibility } from '../database/entities/social-post.entity';
import { PostLike } from '../database/entities/post-like.entity';
import { PostComment } from '../database/entities/post-comment.entity';
import { FarmerFollow } from '../database/entities/farmer-follow.entity';
import { FarmStory } from '../database/entities/farm-story.entity';
import { StoryView } from '../database/entities/story-view.entity';
import { FarmLiveStream, LiveStreamStatus } from '../database/entities/farm-live-stream.entity';
import { User } from '../database/entities/user.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';
import {
  CreatePostDto,
  UpdatePostDto,
  QueryPostsDto,
  CreateCommentDto,
  CreateStoryDto,
  CreateLiveStreamDto,
  UpdateLiveStreamDto,
} from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(SocialPost)
    private readonly postRepository: Repository<SocialPost>,
    @InjectRepository(PostLike)
    private readonly likeRepository: Repository<PostLike>,
    @InjectRepository(PostComment)
    private readonly commentRepository: Repository<PostComment>,
    @InjectRepository(FarmerFollow)
    private readonly followRepository: Repository<FarmerFollow>,
    @InjectRepository(FarmStory)
    private readonly storyRepository: Repository<FarmStory>,
    @InjectRepository(StoryView)
    private readonly storyViewRepository: Repository<StoryView>,
    @InjectRepository(FarmLiveStream)
    private readonly liveStreamRepository: Repository<FarmLiveStream>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FarmerProfile)
    private readonly farmerRepository: Repository<FarmerProfile>,
  ) {}

  // ==================== POSTS ====================

  async createPost(userId: string, dto: CreatePostDto): Promise<SocialPost> {
    // Verify user is a farmer
    const farmer = await this.farmerRepository.findOne({ where: { userId } });
    if (!farmer) {
      throw new ForbiddenException('Only farmers can create posts');
    }

    const post = this.postRepository.create({
      ...dto,
      farmerId: farmer.id,
      type: dto.type || PostType.TEXT,
      visibility: dto.visibility || PostVisibility.PUBLIC,
    });

    return this.postRepository.save(post);
  }

  async updatePost(userId: string, postId: string, dto: UpdatePostDto): Promise<SocialPost> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['farmer'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.farmer.userId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    Object.assign(post, dto);
    return this.postRepository.save(post);
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['farmer'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.farmer.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postRepository.remove(post);
  }

  async getPost(postId: string, userId?: string): Promise<SocialPost & { isLiked?: boolean }> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['farmer', 'farmer.user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let isLiked = false;
    if (userId) {
      const like = await this.likeRepository.findOne({
        where: { postId, userId },
      });
      isLiked = !!like;
    }

    return { ...post, isLiked };
  }

  async getFeed(userId: string, query: QueryPostsDto): Promise<{ posts: any[]; total: number; hasMore: boolean }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Get followed farmers
    const follows = await this.followRepository.find({
      where: { userId },
      select: ['farmerId'],
    });

    const followedFarmerIds = follows.map(f => f.farmerId);

    const qb = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.farmer', 'farmer')
      .leftJoinAndSelect('farmer.user', 'user')
      .where('post.visibility = :visibility', { visibility: PostVisibility.PUBLIC })
      .orderBy('post.createdAt', 'DESC');

    // If following farmers, prioritize their posts
    if (followedFarmerIds.length > 0) {
      qb.addOrderBy(`CASE WHEN post.farmerId IN (:...followedIds) THEN 0 ELSE 1 END`, 'ASC')
        .setParameter('followedIds', followedFarmerIds);
    }

    if (query.type) {
      qb.andWhere('post.type = :type', { type: query.type });
    }

    if (query.tag) {
      qb.andWhere(':tag = ANY(post.tags)', { tag: query.tag });
    }

    const [posts, total] = await qb
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Get like status for each post
    const postIds = posts.map(p => p.id);
    const likes = await this.likeRepository.find({
      where: { userId, postId: In(postIds) },
    });
    const likedPostIds = new Set(likes.map(l => l.postId));

    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));

    return {
      posts: postsWithLikeStatus,
      total,
      hasMore: offset + posts.length < total,
    };
  }

  async getFarmerPosts(farmerId: string, userId?: string, page = 1, limit = 20): Promise<{ posts: any[]; total: number }> {
    const [posts, total] = await this.postRepository.findAndCount({
      where: { farmerId, visibility: PostVisibility.PUBLIC },
      relations: ['farmer', 'farmer.user'],
      order: { isPinned: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    let postsWithLikeStatus = posts;
    if (userId) {
      const postIds = posts.map(p => p.id);
      const likes = await this.likeRepository.find({
        where: { userId, postId: In(postIds) },
      });
      const likedPostIds = new Set(likes.map(l => l.postId));

      postsWithLikeStatus = posts.map(post => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
      })) as any;
    }

    return { posts: postsWithLikeStatus, total };
  }

  // ==================== LIKES ====================

  async likePost(userId: string, postId: string): Promise<{ liked: boolean; likeCount: number }> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { userId, postId },
    });

    if (existingLike) {
      // Unlike
      await this.likeRepository.remove(existingLike);
      post.likeCount = Math.max(0, post.likeCount - 1);
      await this.postRepository.save(post);
      return { liked: false, likeCount: post.likeCount };
    }

    // Like
    const like = this.likeRepository.create({ userId, postId });
    await this.likeRepository.save(like);
    post.likeCount += 1;
    await this.postRepository.save(post);

    return { liked: true, likeCount: post.likeCount };
  }

  async getPostLikes(postId: string, page = 1, limit = 50): Promise<{ users: User[]; total: number }> {
    const [likes, total] = await this.likeRepository.findAndCount({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users: likes.map(l => l.user),
      total,
    };
  }

  // ==================== COMMENTS ====================

  async createComment(userId: string, postId: string, dto: CreateCommentDto): Promise<PostComment> {
    try {
      const post = await this.postRepository.findOne({ where: { id: postId } });
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (dto.parentCommentId) {
        const parent = await this.commentRepository.findOne({
          where: { id: dto.parentCommentId },
        });
        if (!parent || parent.postId !== postId) {
          throw new BadRequestException('Invalid parent comment');
        }
      }

      const comment = this.commentRepository.create({
        content: dto.content,
        userId,
        postId,
        parentCommentId: dto.parentCommentId || null,
      });

      const savedComment = await this.commentRepository.save(comment);

      // Update comment count
      post.commentCount += 1;
      await this.postRepository.save(post);

      // Return comment with user relation
      const commentWithUser = await this.commentRepository.findOne({
        where: { id: savedComment.id },
        relations: ['user'],
      });
      return commentWithUser!;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  async getPostComments(postId: string, page: number | string = 1, limit: number | string = 20): Promise<{ comments: PostComment[]; total: number }> {
    try {
      // Ensure page and limit are numbers
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 20;
      
      console.log('Getting comments for post:', postId, 'page:', pageNum, 'limit:', limitNum);
      
      // Use query builder to select only needed user fields
      const [comments, total] = await this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.user', 'user')
        .select([
          'comment.id',
          'comment.userId',
          'comment.postId',
          'comment.content',
          'comment.parentCommentId',
          'comment.likeCount',
          'comment.isActive',
          'comment.createdAt',
          'user.id',
          'user.name',
          'user.avatar',
        ])
        .where('comment.postId = :postId', { postId })
        .andWhere('comment.parentCommentId IS NULL')
        .orderBy('comment.createdAt', 'DESC')
        .skip((pageNum - 1) * limitNum)
        .take(limitNum)
        .getManyAndCount();
      
      console.log('Found', comments.length, 'comments, total:', total);
      return { comments, total };
    } catch (error) {
      console.error('Error in getPostComments:', error);
      throw error;
    }
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['post'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);

    // Update comment count
    comment.post.commentCount = Math.max(0, comment.post.commentCount - 1);
    await this.postRepository.save(comment.post);
  }

  // ==================== FOLLOWS ====================

  async followFarmer(userId: string, farmerId: string, notificationsEnabled = true): Promise<{ following: boolean }> {
    const farmer = await this.farmerRepository.findOne({ where: { id: farmerId } });
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    if (farmer.userId === userId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existingFollow = await this.followRepository.findOne({
      where: { userId, farmerId },
    });

    if (existingFollow) {
      // Unfollow
      await this.followRepository.remove(existingFollow);
      farmer.followerCount = Math.max(0, (farmer.followerCount || 0) - 1);
      await this.farmerRepository.save(farmer);
      return { following: false };
    }

    // Follow
    const follow = this.followRepository.create({
      userId,
      farmerId,
      notificationsEnabled,
    });
    await this.followRepository.save(follow);
    farmer.followerCount = (farmer.followerCount || 0) + 1;
    await this.farmerRepository.save(farmer);

    return { following: true };
  }

  async updateFollowSettings(userId: string, farmerId: string, notificationsEnabled: boolean): Promise<FarmerFollow> {
    const follow = await this.followRepository.findOne({
      where: { userId, farmerId },
    });

    if (!follow) {
      throw new NotFoundException('You are not following this farmer');
    }

    follow.notificationsEnabled = notificationsEnabled;
    return this.followRepository.save(follow);
  }

  async getFollowedFarmers(userId: string, page = 1, limit = 20): Promise<{ farmers: FarmerProfile[]; total: number }> {
    const [follows, total] = await this.followRepository.findAndCount({
      where: { userId },
      relations: ['farmer', 'farmer.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      farmers: follows.map(f => f.farmer),
      total,
    };
  }

  async getFarmerFollowers(farmerId: string, page = 1, limit = 50): Promise<{ users: User[]; total: number }> {
    const [follows, total] = await this.followRepository.findAndCount({
      where: { farmerId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users: follows.map(f => f.user),
      total,
    };
  }

  async isFollowing(userId: string, farmerId: string): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: { userId, farmerId },
    });
    return !!follow;
  }

  // ==================== STORIES ====================

  async createStory(userId: string, dto: CreateStoryDto): Promise<FarmStory> {
    const farmer = await this.farmerRepository.findOne({ where: { userId } });
    if (!farmer) {
      throw new ForbiddenException('Only farmers can create stories');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = this.storyRepository.create({
      ...dto,
      farmerId: farmer.id,
      expiresAt,
      duration: dto.duration || 5,
    });

    return this.storyRepository.save(story);
  }

  async getStories(userId: string): Promise<any[]> {
    const now = new Date();

    // Get followed farmers' stories
    const follows = await this.followRepository.find({
      where: { userId },
      select: ['farmerId'],
    });

    const followedFarmerIds = follows.map(f => f.farmerId);

    if (followedFarmerIds.length === 0) {
      return [];
    }

    const stories = await this.storyRepository.find({
      where: {
        farmerId: In(followedFarmerIds),
        isActive: true,
        expiresAt: MoreThan(now),
      },
      relations: ['farmer', 'farmer.user'],
      order: { createdAt: 'DESC' },
    });

    // Get viewed stories
    const storyIds = stories.map(s => s.id);
    const views = await this.storyViewRepository.find({
      where: { userId, storyId: In(storyIds) },
    });
    const viewedStoryIds = new Set(views.map(v => v.storyId));

    // Group by farmer
    const farmerStories: Record<string, any> = {};
    stories.forEach(story => {
      const farmerId = story.farmerId;
      if (!farmerStories[farmerId]) {
        farmerStories[farmerId] = {
          farmer: story.farmer,
          stories: [],
          hasUnviewed: false,
        };
      }
      const isViewed = viewedStoryIds.has(story.id);
      farmerStories[farmerId].stories.push({ ...story, isViewed });
      if (!isViewed) {
        farmerStories[farmerId].hasUnviewed = true;
      }
    });

    // Sort: unviewed first
    return Object.values(farmerStories).sort((a: any, b: any) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });
  }

  async viewStory(userId: string, storyId: string): Promise<void> {
    const story = await this.storyRepository.findOne({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const existingView = await this.storyViewRepository.findOne({
      where: { userId, storyId },
    });

    if (!existingView) {
      const view = this.storyViewRepository.create({ userId, storyId });
      await this.storyViewRepository.save(view);

      story.viewCount += 1;
      await this.storyRepository.save(story);
    }
  }

  async getStoryViews(userId: string, storyId: string): Promise<{ users: User[]; total: number }> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['farmer'],
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.farmer.userId !== userId) {
      throw new ForbiddenException('You can only view analytics for your own stories');
    }

    const [views, total] = await this.storyViewRepository.findAndCount({
      where: { storyId },
      relations: ['user'],
      order: { viewedAt: 'DESC' },
    });

    return {
      users: views.map(v => v.user),
      total,
    };
  }

  async deleteStory(userId: string, storyId: string): Promise<void> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['farmer'],
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.farmer.userId !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }

    await this.storyRepository.remove(story);
  }

  // ==================== LIVE STREAMS ====================

  async createLiveStream(userId: string, dto: CreateLiveStreamDto): Promise<FarmLiveStream> {
    const farmer = await this.farmerRepository.findOne({ where: { userId } });
    if (!farmer) {
      throw new ForbiddenException('Only farmers can create live streams');
    }

    // Check for active streams
    const activeStream = await this.liveStreamRepository.findOne({
      where: { farmerId: farmer.id, status: In([LiveStreamStatus.SCHEDULED, LiveStreamStatus.LIVE]) },
    });

    if (activeStream) {
      throw new BadRequestException('You already have an active or scheduled stream');
    }

    const streamKey = uuidv4();

    const stream = this.liveStreamRepository.create({
      ...dto,
      farmerId: farmer.id,
      streamKey,
      status: dto.scheduledStartTime ? LiveStreamStatus.SCHEDULED : LiveStreamStatus.SCHEDULED,
      scheduledStartTime: dto.scheduledStartTime ? new Date(dto.scheduledStartTime) : undefined,
    });

    return this.liveStreamRepository.save(stream);
  }

  async startLiveStream(userId: string, streamId: string): Promise<FarmLiveStream> {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId },
      relations: ['farmer'],
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (stream.farmer.userId !== userId) {
      throw new ForbiddenException('You can only manage your own streams');
    }

    if (stream.status === LiveStreamStatus.LIVE) {
      throw new BadRequestException('Stream is already live');
    }

    if (stream.status === LiveStreamStatus.ENDED) {
      throw new BadRequestException('Stream has ended');
    }

    stream.status = LiveStreamStatus.LIVE;
    stream.actualStartTime = new Date();
    stream.streamUrl = `rtmp://stream.handwork.ng/live/${stream.streamKey}`;
    stream.playbackUrl = `https://stream.handwork.ng/hls/${stream.streamKey}.m3u8`;

    return this.liveStreamRepository.save(stream);
  }

  async endLiveStream(userId: string, streamId: string): Promise<FarmLiveStream> {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId },
      relations: ['farmer'],
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (stream.farmer.userId !== userId) {
      throw new ForbiddenException('You can only manage your own streams');
    }

    if (stream.status !== LiveStreamStatus.LIVE) {
      throw new BadRequestException('Stream is not live');
    }

    stream.status = LiveStreamStatus.ENDED;
    stream.endedAt = new Date();

    if (stream.actualStartTime) {
      stream.duration = Math.floor((stream.endedAt.getTime() - stream.actualStartTime.getTime()) / 1000);
    }

    return this.liveStreamRepository.save(stream);
  }

  async getLiveStreams(page = 1, limit = 20): Promise<{ streams: FarmLiveStream[]; total: number }> {
    const [streams, total] = await this.liveStreamRepository.findAndCount({
      where: { status: LiveStreamStatus.LIVE },
      relations: ['farmer', 'farmer.user'],
      order: { viewerCount: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { streams, total };
  }

  async getUpcomingStreams(page = 1, limit = 20): Promise<{ streams: FarmLiveStream[]; total: number }> {
    const [streams, total] = await this.liveStreamRepository.findAndCount({
      where: { status: LiveStreamStatus.SCHEDULED },
      relations: ['farmer', 'farmer.user'],
      order: { scheduledStartTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { streams, total };
  }

  async updateViewerCount(streamId: string, increment: number): Promise<void> {
    const stream = await this.liveStreamRepository.findOne({ where: { id: streamId } });
    if (stream && stream.status === LiveStreamStatus.LIVE) {
      stream.viewerCount = Math.max(0, stream.viewerCount + increment);
      if (stream.viewerCount > stream.peakViewerCount) {
        stream.peakViewerCount = stream.viewerCount;
      }
      await this.liveStreamRepository.save(stream);
    }
  }

  async getLiveStream(streamId: string): Promise<FarmLiveStream> {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId },
      relations: ['farmer', 'farmer.user', 'product'],
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    return stream;
  }

  // ==================== CLEANUP ====================

  async cleanupExpiredStories(): Promise<number> {
    const result = await this.storyRepository
      .createQueryBuilder()
      .update(FarmStory)
      .set({ isActive: false })
      .where('expiresAt < :now', { now: new Date() })
      .andWhere('isActive = :isActive', { isActive: true })
      .execute();

    return result.affected || 0;
  }
}
