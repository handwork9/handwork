import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { FarmerAnalyticsService } from './farmer-analytics.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

@ApiTags('Farmer Analytics')
@Controller('farmers/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FARMER)
@ApiBearerAuth()
export class FarmerAnalyticsController {
  constructor(private readonly analyticsService: FarmerAnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get farmer dashboard analytics' })
  async getDashboard(@Request() req: AuthenticatedRequest) {
    console.log('[FarmerAnalytics] Dashboard request from user:', req.user.id, 'role:', req.user.role);
    try {
      const data = await this.analyticsService.getDashboardStats(req.user.id);
      console.log('[FarmerAnalytics] Dashboard data:', JSON.stringify(data));
      // Return data directly - ResponseInterceptor will wrap it in { success: true, data }
      return data;
    } catch (error) {
      console.error('[FarmerAnalytics] Dashboard error:', error);
      throw error;
    }
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales data by time period' })
  @ApiQuery({ name: 'period', enum: ['week', 'month', 'year'], required: false })
  async getSalesData(
    @Request() req: AuthenticatedRequest,
    @Query('period') period: 'week' | 'month' | 'year' = 'week',
  ) {
    return this.analyticsService.getSalesData(req.user.id, period);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get top performing products' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopProducts(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit: number = 10,
  ) {
    return this.analyticsService.getTopProducts(req.user.id, limit);
  }

  @Get('products/:productId/sales')
  @ApiOperation({ summary: 'Get sales history for a specific product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'period', enum: ['week', 'month', 'year'], required: false })
  async getProductSalesHistory(
    @Request() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Query('period') period: 'week' | 'month' | 'year' = 'week',
  ) {
    return this.analyticsService.getProductSalesHistory(req.user.id, productId, period);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer insights' })
  async getCustomerInsights(@Request() req: AuthenticatedRequest) {
    return this.analyticsService.getCustomerInsights(req.user.id);
  }

  @Get('revenue-breakdown')
  @ApiOperation({ summary: 'Get revenue breakdown by category' })
  async getRevenueBreakdown(@Request() req: AuthenticatedRequest) {
    return this.analyticsService.getRevenueBreakdown(req.user.id);
  }

  @Get('today-hourly')
  @ApiOperation({ summary: 'Get today\'s hourly sales for sparkline chart' })
  async getTodayHourlySales(@Request() req: AuthenticatedRequest) {
    return this.analyticsService.getTodayHourlySales(req.user.id);
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Get peak selling hours' })
  async getPeakHours(@Request() req: AuthenticatedRequest) {
    return this.analyticsService.getPeakHours(req.user.id);
  }

  @Get('goal')
  @ApiOperation({ summary: 'Get farmer revenue goal' })
  async getRevenueGoal(@Request() req: AuthenticatedRequest) {
    return this.analyticsService.getRevenueGoal(req.user.id);
  }

  @Post('goal')
  @ApiOperation({ summary: 'Set farmer revenue goal' })
  async setRevenueGoal(
    @Request() req: AuthenticatedRequest,
    @Body() body: { goal: number },
  ) {
    await this.analyticsService.setRevenueGoal(req.user.id, body.goal);
    return { message: 'Revenue goal updated successfully' };
  }
}
