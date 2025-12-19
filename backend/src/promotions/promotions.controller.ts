import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { PromotionsService } from './promotions.service';
import {
  CreatePromotionDto,
  QueryPromotionsDto,
  PromotionResponseDto,
  PromotionStatsDto,
  PromotionStatus,
  PromotionPlanId,
  PromotionBoostType,
  TargetAudienceType,
} from './dto';

@ApiTags('Promotions')
@Controller('promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('plans')
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Get available promotion plans' })
  @ApiResponse({
    status: 200,
    description: 'List of available promotion plans with pricing',
  })
  getPromotionPlans() {
    return {
      success: true,
      data: this.promotionsService.getPromotionPlans(),
    };
  }

  @Get('calculate')
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Calculate promotion cost' })
  @ApiQuery({ name: 'planId', enum: PromotionPlanId })
  @ApiQuery({ name: 'boosts', required: false, type: String, description: 'Comma-separated boost types' })
  @ApiQuery({ name: 'targetAudience', required: false, enum: TargetAudienceType })
  @ApiResponse({ status: 200, description: 'Calculated promotion cost' })
  calculateCost(
    @Query('planId') planId: PromotionPlanId,
    @Query('boosts') boostsString?: string,
    @Query('targetAudience') targetAudience?: TargetAudienceType,
  ) {
    const boosts = boostsString
      ? (boostsString.split(',') as PromotionBoostType[])
      : [];

    const cost = this.promotionsService.calculatePromotionCost(
      planId,
      boosts,
      targetAudience,
    );

    return {
      success: true,
      data: { cost, planId, boosts, targetAudience },
    };
  }

  @Post()
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Create a new promotion (deducts from wallet)' })
  @ApiResponse({
    status: 201,
    description: 'Promotion created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or insufficient wallet balance',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async createPromotion(
    @Request() req: any,
    @Body() dto: CreatePromotionDto,
  ): Promise<{ success: boolean; data: PromotionResponseDto }> {
    const promotion = await this.promotionsService.createPromotion(
      req.user.id,
      dto,
    );

    return {
      success: true,
      data: promotion,
    };
  }

  @Get('my')
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Get my promotions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: PromotionStatus })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of promotions' })
  async getMyPromotions(
    @Request() req: any,
    @Query() query: QueryPromotionsDto,
  ) {
    const result = await this.promotionsService.getFarmerPromotions(
      req.user.id,
      query,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Get promotion statistics' })
  @ApiResponse({ status: 200, description: 'Promotion statistics' })
  async getPromotionStats(
    @Request() req: any,
  ): Promise<{ success: boolean; data: PromotionStatsDto }> {
    const stats = await this.promotionsService.getPromotionStats(req.user.id);

    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Get promotion by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Promotion details' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  async getPromotion(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; data: PromotionResponseDto }> {
    const promotion = await this.promotionsService.getPromotionById(
      req.user.id,
      id,
    );

    return {
      success: true,
      data: promotion,
    };
  }

  @Delete(':id')
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Cancel an active promotion (no refund)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Promotion cancelled' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel non-active promotion' })
  async cancelPromotion(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.promotionsService.cancelPromotion(req.user.id, id);

    return {
      success: true,
      message: 'Promotion cancelled successfully',
    };
  }

  @Post(':productId/view')
  @ApiOperation({ summary: 'Record a view on a promoted product' })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 200, description: 'View recorded' })
  async recordView(@Param('productId', ParseUUIDPipe) productId: string) {
    await this.promotionsService.recordView(productId);
    return { success: true };
  }

  @Post(':productId/click')
  @ApiOperation({ summary: 'Record a click on a promoted product' })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 200, description: 'Click recorded' })
  async recordClick(@Param('productId', ParseUUIDPipe) productId: string) {
    await this.promotionsService.recordClick(productId);
    return { success: true };
  }
}
