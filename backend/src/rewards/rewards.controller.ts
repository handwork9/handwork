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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { RewardsService } from './rewards.service';
import {
  EarnPointsDto,
  RedeemRewardDto,
  CreateRewardDto,
  UpdateRewardDto,
  AdjustPointsDto,
  PointsHistoryQueryDto,
} from './dto';

@ApiTags('Rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rewards summary for current user' })
  @ApiResponse({ status: 200, description: 'Rewards summary retrieved' })
  async getRewardsSummary(@CurrentUser('id') userId: string) {
    return this.rewardsService.getRewardsSummary(userId);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available rewards for current user' })
  @ApiResponse({ status: 200, description: 'Available rewards retrieved' })
  async getAvailableRewards(@CurrentUser('id') userId: string) {
    return this.rewardsService.getAvailableRewards(userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get points history for current user' })
  @ApiResponse({ status: 200, description: 'Points history retrieved' })
  async getPointsHistory(
    @CurrentUser('id') userId: string,
    @Query() query: PointsHistoryQueryDto,
  ) {
    return this.rewardsService.getPointsHistory(userId, query);
  }

  @Get('redemptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user redemptions' })
  @ApiResponse({ status: 200, description: 'Redemptions retrieved' })
  async getUserRedemptions(@CurrentUser('id') userId: string) {
    return this.rewardsService.getUserRedemptions(userId);
  }

  @Post('checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Daily check-in to earn points' })
  @ApiResponse({ status: 200, description: 'Check-in successful' })
  async dailyCheckIn(@CurrentUser('id') userId: string) {
    return this.rewardsService.dailyCheckIn(userId);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a reward' })
  @ApiResponse({ status: 200, description: 'Reward redeemed successfully' })
  async redeemReward(
    @CurrentUser('id') userId: string,
    @Body() dto: RedeemRewardDto,
  ) {
    return this.rewardsService.redeemReward(userId, dto.rewardId);
  }

  @Post('share/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Earn points for sharing a product' })
  @ApiResponse({ status: 200, description: 'Share points earned' })
  async shareProduct(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    const result = await this.rewardsService.processSharePoints(userId, productId);
    return { success: !!result, points: result ? 5 : 0, message: result ? 'Points earned!' : 'Daily limit reached' };
  }

  // ============ Admin Endpoints ============

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all rewards (Admin)' })
  @ApiResponse({ status: 200, description: 'All rewards retrieved' })
  async getAllRewards() {
    return this.rewardsService.getAllRewards();
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rewards statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getRewardsStats() {
    return this.rewardsService.getRewardsStats();
  }

  @Post('admin/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new reward (Admin)' })
  @ApiResponse({ status: 201, description: 'Reward created' })
  async createReward(@Body() dto: CreateRewardDto) {
    return this.rewardsService.createReward(dto);
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a reward (Admin)' })
  @ApiResponse({ status: 200, description: 'Reward updated' })
  async updateReward(
    @Param('id') id: string,
    @Body() dto: UpdateRewardDto,
  ) {
    return this.rewardsService.updateReward(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a reward (Admin)' })
  @ApiResponse({ status: 204, description: 'Reward deleted' })
  async deleteReward(@Param('id') id: string) {
    await this.rewardsService.deleteReward(id);
  }

  @Post('admin/adjust-points')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust user points (Admin)' })
  @ApiResponse({ status: 200, description: 'Points adjusted' })
  async adjustPoints(
    @CurrentUser('id') adminId: string,
    @Body() dto: AdjustPointsDto,
  ) {
    return this.rewardsService.adjustPoints(adminId, dto.userId, dto.points, dto.reason);
  }
}
