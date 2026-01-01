import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardService, LeaderboardType, TimeFrame } from './leaderboard.service';

@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiQuery({ name: 'type', enum: LeaderboardType, required: false })
  @ApiQuery({ name: 'timeframe', enum: TimeFrame, required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Returns leaderboard data' })
  async getLeaderboard(
    @Query('type') type?: LeaderboardType,
    @Query('timeframe') timeframe?: TimeFrame,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getLeaderboard(
      type || LeaderboardType.TOP_SELLERS,
      timeframe || TimeFrame.MONTHLY,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('top-sellers')
  @ApiOperation({ summary: 'Get top selling farmers' })
  @ApiQuery({ name: 'timeframe', enum: TimeFrame, required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTopSellers(
    @Query('timeframe') timeframe?: TimeFrame,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getLeaderboard(
      LeaderboardType.TOP_SELLERS,
      timeframe || TimeFrame.MONTHLY,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Get top rated farmers' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopRated(@Query('limit') limit?: string) {
    return this.leaderboardService.getLeaderboard(
      LeaderboardType.TOP_RATED,
      TimeFrame.ALL_TIME,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('top-revenue')
  @ApiOperation({ summary: 'Get top revenue farmers' })
  @ApiQuery({ name: 'timeframe', enum: TimeFrame, required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTopRevenue(
    @Query('timeframe') timeframe?: TimeFrame,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getLeaderboard(
      LeaderboardType.TOP_REVENUE,
      timeframe || TimeFrame.MONTHLY,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get best selling products' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopProducts(@Query('limit') limit?: string) {
    return this.leaderboardService.getLeaderboard(
      LeaderboardType.TOP_PRODUCTS,
      TimeFrame.ALL_TIME,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('top-buyers')
  @ApiOperation({ summary: 'Get top buyers by spending' })
  @ApiQuery({ name: 'timeframe', enum: TimeFrame, required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTopBuyers(
    @Query('timeframe') timeframe?: TimeFrame,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getLeaderboard(
      LeaderboardType.TOP_BUYERS,
      timeframe || TimeFrame.MONTHLY,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('badge-points')
  @ApiOperation({ summary: 'Get badge points leaderboard' })
  @ApiQuery({ name: 'limit', required: false })
  async getBadgePoints(@Query('limit') limit?: string) {
    return this.leaderboardService.getLeaderboard(
      LeaderboardType.BADGE_POINTS,
      TimeFrame.ALL_TIME,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('my-rank')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my rank in leaderboard' })
  @ApiQuery({ name: 'type', enum: LeaderboardType, required: false })
  async getMyRank(
    @Request() req: any,
    @Query('type') type?: LeaderboardType,
  ) {
    return this.leaderboardService.getUserRank(
      req.user.id,
      type || LeaderboardType.TOP_SELLERS,
    );
  }

  @Get('user/:userId/rank')
  @ApiOperation({ summary: 'Get user rank in leaderboard' })
  @ApiQuery({ name: 'type', enum: LeaderboardType, required: false })
  async getUserRank(
    @Param('userId') userId: string,
    @Query('type') type?: LeaderboardType,
  ) {
    return this.leaderboardService.getUserRank(
      userId,
      type || LeaderboardType.TOP_SELLERS,
    );
  }
}
