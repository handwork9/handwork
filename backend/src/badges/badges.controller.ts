import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, FarmerGuard, AdminGuard } from '../auth/guards';
import { BadgesService } from './badges.service';

@ApiTags('Badges')
@Controller('badges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('my')
  @UseGuards(FarmerGuard)
  @ApiOperation({ summary: 'Get my badges (farmer)' })
  @ApiResponse({ status: 200, description: 'Returns farmer badges' })
  async getMyBadges(@Request() req: any) {
    return this.badgesService.getFarmerBadges(req.user.id);
  }

  @Get('my/progress')
  @UseGuards(FarmerGuard)
  @ApiOperation({ summary: 'Get all badges with progress (farmer)' })
  @ApiResponse({ status: 200, description: 'Returns all badges with progress' })
  async getMyBadgesWithProgress(@Request() req: any) {
    return this.badgesService.getBadgesWithProgress(req.user.id);
  }

  @Get('farmer/:farmerId')
  @ApiOperation({ summary: 'Get a farmer\'s badges' })
  @ApiResponse({ status: 200, description: 'Returns farmer badges' })
  async getFarmerBadges(@Param('farmerId') farmerId: string) {
    return this.badgesService.getFarmerBadges(farmerId);
  }

  @Get('farmer/:farmerId/progress')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get farmer badges with progress (admin)' })
  @ApiResponse({ status: 200, description: 'Returns badges with progress' })
  async getFarmerBadgesWithProgress(@Param('farmerId') farmerId: string) {
    return this.badgesService.getBadgesWithProgress(farmerId);
  }

  @Put(':badgeId/display')
  @UseGuards(FarmerGuard)
  @ApiOperation({ summary: 'Toggle badge display on profile' })
  @ApiResponse({ status: 200, description: 'Badge display toggled' })
  async toggleBadgeDisplay(
    @Request() req: any,
    @Param('badgeId') badgeId: string,
    @Body('display') display: boolean,
  ) {
    return this.badgesService.toggleBadgeDisplay(req.user.id, badgeId, display);
  }

  @Get('check')
  @UseGuards(FarmerGuard)
  @ApiOperation({ summary: 'Check and award new badges' })
  @ApiResponse({ status: 200, description: 'Returns newly awarded badges' })
  async checkMyBadges(@Request() req: any) {
    const newBadges = await this.badgesService.checkAndAwardBadges(req.user.id);
    return {
      newBadgesCount: newBadges.length,
      newBadges: newBadges.map(b => ({
        type: b.badgeType,
        earnedAt: b.earnedAt,
      })),
    };
  }
}
