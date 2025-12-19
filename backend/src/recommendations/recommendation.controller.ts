import { Controller, Get, Post, Query, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecommendationService } from './recommendation.service';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('personalized')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized product recommendations' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPersonalizedRecommendations(
    @Req() req: Request,
    @Query('state') state?: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationService.getPersonalizedRecommendations(
      (req as any).user.id,
      state,
      limit || 20,
    );
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular products (for non-logged in users)' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPopularProducts(
    @Query('state') state?: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationService.getPopularProducts(state, limit || 20);
  }

  @Get('similar/:productId')
  @ApiOperation({ summary: 'Get products frequently bought together' })
  @ApiQuery({ name: 'limit', required: false })
  async getSimilarPurchases(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationService.getSimilarPurchases(productId, limit || 10);
  }

  @Post('track-view/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track product view for recommendations' })
  @ApiQuery({ name: 'category', required: false })
  async trackProductView(
    @Req() req: Request,
    @Param('productId') productId: string,
    @Query('category') category?: string,
  ) {
    await this.recommendationService.trackProductView((req as any).user.id, productId, category);
    return { success: true };
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user preference profile' })
  async getUserPreferences(@Req() req: Request) {
    return this.recommendationService.getUserPreferences((req as any).user.id);
  }

  @Post('rebuild-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rebuild preferences from order history' })
  async rebuildPreferences(@Req() req: Request) {
    await this.recommendationService.rebuildUserPreferences((req as any).user.id);
    return { success: true, message: 'Preferences rebuilt from order history' };
  }
}
