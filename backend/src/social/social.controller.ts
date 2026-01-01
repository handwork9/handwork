import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocialService } from './social.service';
import {
  CreatePostDto,
  UpdatePostDto,
  QueryPostsDto,
  CreateCommentDto,
  CreateStoryDto,
  CreateLiveStreamDto,
} from './dto';

interface AuthenticatedRequest {
  user: { id: string; [key: string]: any };
}

@ApiTags('Social')
@Controller('social')
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ==================== POSTS ====================

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new post (farmers only)' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  async createPost(@Request() req: AuthenticatedRequest, @Body() dto: CreatePostDto) {
    return this.socialService.createPost(req.user.id, dto);
  }

  @Get('posts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get feed posts' })
  @ApiResponse({ status: 200, description: 'Feed retrieved successfully' })
  async getFeed(@Request() req: AuthenticatedRequest, @Query() query: QueryPostsDto) {
    return this.socialService.getFeed(req.user.id, query);
  }

  @Get('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single post' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  async getPost(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.getPost(id, req.user.id);
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  async updatePost(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.socialService.updatePost(req.user.id, id, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  async deletePost(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.deletePost(req.user.id, id);
  }

  // ==================== LIKES ====================

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Like or unlike a post' })
  @ApiResponse({ status: 200, description: 'Like toggled successfully' })
  async likePost(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.likePost(req.user.id, id);
  }

  @Get('posts/:id/likes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get users who liked a post' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Likes retrieved successfully' })
  async getPostLikes(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getPostLikes(id, page, limit);
  }

  // ==================== COMMENTS ====================

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a comment to a post' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  async createComment(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.socialService.createComment(req.user.id, id, dto);
  }

  @Get('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async getPostComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getPostComments(id, page, limit);
  }

  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Like a comment' })
  @ApiResponse({ status: 200, description: 'Comment liked successfully' })
  async likeComment(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.likeComment(req.user.id, id);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  async deleteComment(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.deleteComment(req.user.id, id);
  }

  // ==================== SAVED POSTS ====================

  @Post('posts/:id/save')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save or unsave a post' })
  @ApiResponse({ status: 200, description: 'Post save toggled successfully' })
  async savePost(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.savePost(req.user.id, id);
  }

  @Get('saved-posts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get saved posts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Saved posts retrieved successfully' })
  async getSavedPosts(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getSavedPosts(req.user.id, page, limit);
  }

  @Get('posts/:id/is-saved')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if post is saved' })
  @ApiResponse({ status: 200, description: 'Returns saved status' })
  async isPostSaved(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const saved = await this.socialService.isPostSaved(req.user.id, id);
    return { saved };
  }

  // ==================== FOLLOWS ====================

  @Post('farmers/:id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Follow or unfollow a farmer' })
  @ApiResponse({ status: 200, description: 'Follow toggled successfully' })
  async followFarmer(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.followFarmer(req.user.id, id);
  }

  @Put('farmers/:id/follow/notifications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update follow notification settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateFollowSettings(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notificationsEnabled') notificationsEnabled: boolean,
  ) {
    return this.socialService.updateFollowSettings(req.user.id, id, notificationsEnabled);
  }

  @Get('farmers/:id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get posts from a specific farmer' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Farmer posts retrieved successfully' })
  async getFarmerPosts(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getFarmerPosts(id, req.user.id, page, limit);
  }

  @Get('farmers/:id/followers')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get followers of a farmer' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Followers retrieved successfully' })
  async getFarmerFollowers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getFarmerFollowers(id, page, limit);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get farmers the current user follows' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Following list retrieved successfully' })
  async getFollowedFarmers(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getFollowedFarmers(req.user.id, page, limit);
  }

  @Get('farmers/:id/is-following')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if current user follows a farmer' })
  @ApiResponse({ status: 200, description: 'Following status retrieved' })
  async isFollowing(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const following = await this.socialService.isFollowing(req.user.id, id);
    return { following };
  }

  // ==================== STORIES ====================

  @Post('stories')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new story (farmers only)' })
  @ApiResponse({ status: 201, description: 'Story created successfully' })
  async createStory(@Request() req: AuthenticatedRequest, @Body() dto: CreateStoryDto) {
    return this.socialService.createStory(req.user.id, dto);
  }

  @Get('stories')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get stories from followed farmers' })
  @ApiResponse({ status: 200, description: 'Stories retrieved successfully' })
  async getStories(@Request() req: AuthenticatedRequest) {
    return this.socialService.getStories(req.user.id);
  }

  @Post('stories/:id/view')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a story as viewed' })
  @ApiResponse({ status: 200, description: 'Story marked as viewed' })
  async viewStory(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    await this.socialService.viewStory(req.user.id, id);
    return { success: true };
  }

  @Get('stories/:id/views')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get story views (owner only)' })
  @ApiResponse({ status: 200, description: 'Story views retrieved successfully' })
  async getStoryViews(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.getStoryViews(req.user.id, id);
  }

  @Delete('stories/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a story' })
  @ApiResponse({ status: 204, description: 'Story deleted successfully' })
  async deleteStory(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.deleteStory(req.user.id, id);
  }

  // ==================== LIVE STREAMS ====================

  @Post('live')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new live stream (farmers only)' })
  @ApiResponse({ status: 201, description: 'Live stream created successfully' })
  async createLiveStream(@Request() req: AuthenticatedRequest, @Body() dto: CreateLiveStreamDto) {
    return this.socialService.createLiveStream(req.user.id, dto);
  }

  @Get('live')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get currently live streams' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Live streams retrieved successfully' })
  async getLiveStreams(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getLiveStreams(page, limit);
  }

  @Get('live/upcoming')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get upcoming scheduled streams' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Upcoming streams retrieved successfully' })
  async getUpcomingStreams(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getUpcomingStreams(page, limit);
  }

  @Get('live/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific live stream' })
  @ApiResponse({ status: 200, description: 'Live stream retrieved successfully' })
  async getLiveStream(@Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.getLiveStream(id);
  }

  @Post('live/:id/start')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start a live stream' })
  @ApiResponse({ status: 200, description: 'Live stream started successfully' })
  async startLiveStream(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.startLiveStream(req.user.id, id);
  }

  @Post('live/:id/end')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'End a live stream' })
  @ApiResponse({ status: 200, description: 'Live stream ended successfully' })
  async endLiveStream(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.socialService.endLiveStream(req.user.id, id);
  }

  @Post('live/agora-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Agora RTC token for live streaming' })
  @ApiResponse({ status: 200, description: 'Token generated successfully' })
  async getAgoraToken(
    @Request() req: AuthenticatedRequest,
    @Body() dto: { channelName: string; role: 'host' | 'audience' },
  ) {
    return this.socialService.generateAgoraToken(req.user.id, dto.channelName, dto.role);
  }
}
