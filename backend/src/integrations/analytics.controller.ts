import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Analytics Integration')
@Controller('integrations/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('event')
  @Public()
  @ApiOperation({ summary: 'Track a custom analytics event' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        eventName: { type: 'string', example: 'button_click' },
        params: { type: 'object', example: { button_id: 'checkout_btn' } },
        userId: { type: 'string', example: 'user123' },
        clientId: { type: 'string', example: '1234567890.1234567890' },
      },
      required: ['eventName'],
    },
  })
  async trackEvent(
    @Body()
    body: {
      eventName: string;
      params?: Record<string, any>;
      userId?: string;
      clientId?: string;
    },
  ) {
    const success = await this.analyticsService.trackEvent(
      body.eventName,
      body.params,
      body.userId,
      body.clientId,
    );
    return { success };
  }

  @Post('page-view')
  @Public()
  @ApiOperation({ summary: 'Track a page view' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        page_title: { type: 'string', example: 'Home Page' },
        page_location: { type: 'string', example: 'https://handwork.app/' },
        page_path: { type: 'string', example: '/' },
        userId: { type: 'string' },
        clientId: { type: 'string' },
      },
      required: ['page_title', 'page_location', 'page_path'],
    },
  })
  async trackPageView(
    @Body()
    body: {
      page_title: string;
      page_location: string;
      page_path: string;
      userId?: string;
      clientId?: string;
    },
  ) {
    const success = await this.analyticsService.trackPageView(
      {
        page_title: body.page_title,
        page_location: body.page_location,
        page_path: body.page_path,
        userId: body.userId,
      },
      body.clientId,
    );
    return { success };
  }

  @Post('screen-view')
  @Public()
  @ApiOperation({ summary: 'Track a screen view (mobile app)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        screenName: { type: 'string', example: 'HomeScreen' },
        screenClass: { type: 'string', example: 'HomeScreen' },
        userId: { type: 'string' },
        clientId: { type: 'string' },
      },
      required: ['screenName', 'screenClass'],
    },
  })
  async trackScreenView(
    @Body()
    body: {
      screenName: string;
      screenClass: string;
      userId?: string;
      clientId?: string;
    },
  ) {
    const success = await this.analyticsService.trackScreenView(
      body.screenName,
      body.screenClass,
      body.userId,
      body.clientId,
    );
    return { success };
  }

  // ============ E-commerce Events ============

  @Post('ecommerce/view-item')
  @Public()
  @ApiOperation({ summary: 'Track product view' })
  async trackViewItem(
    @Body()
    body: {
      item: {
        id: string;
        name: string;
        category?: string;
        price: number;
        brand?: string;
      };
      userId?: string;
      clientId?: string;
    },
  ) {
    const success = await this.analyticsService.trackViewItem(
      body.item,
      body.userId,
      body.clientId,
    );
    return { success };
  }

  @Post('ecommerce/add-to-cart')
  @Public()
  @ApiOperation({ summary: 'Track add to cart' })
  async trackAddToCart(
    @Body()
    body: {
      item: {
        id: string;
        name: string;
        category?: string;
        price: number;
        quantity: number;
      };
      userId?: string;
      clientId?: string;
    },
  ) {
    const success = await this.analyticsService.trackAddToCart(
      body.item,
      body.userId,
      body.clientId,
    );
    return { success };
  }

  @Post('ecommerce/begin-checkout')
  @Public()
  @ApiOperation({ summary: 'Track checkout start' })
  async trackBeginCheckout(
    @Body()
    body: {
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        category?: string;
      }>;
      totalValue: number;
      coupon?: string;
      userId?: string;
      clientId?: string;
    },
  ) {
    const success = await this.analyticsService.trackBeginCheckout(
      body.items,
      body.totalValue,
      body.coupon,
      body.userId,
      body.clientId,
    );
    return { success };
  }

  @Post('ecommerce/purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track purchase (requires auth)' })
  async trackPurchase(
    @Req() req: any,
    @Body()
    body: {
      transactionId: string;
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        category?: string;
      }>;
      totalValue: number;
      shipping?: number;
      tax?: number;
      coupon?: string;
      clientId?: string;
    },
  ) {
    const success = await this.analyticsService.trackPurchase(
      body.transactionId,
      body.items,
      body.totalValue,
      body.shipping,
      body.tax,
      body.coupon,
      req.user.id,
      body.clientId,
    );
    return { success };
  }

  // ============ Custom Events ============

  @Post('custom/signup')
  @Public()
  @ApiOperation({ summary: 'Track user signup' })
  async trackSignUp(
    @Body()
    body: {
      method: string;
      userId: string;
      clientId?: string;
    },
  ) {
    const success = await this.analyticsService.trackSignUp(
      body.method,
      body.userId,
      body.clientId,
    );
    return { success };
  }

  @Post('custom/login')
  @Public()
  @ApiOperation({ summary: 'Track user login' })
  async trackLogin(
    @Body()
    body: {
      method: string;
      userId: string;
      clientId?: string;
    },
  ) {
    const success = await this.analyticsService.trackLogin(
      body.method,
      body.userId,
      body.clientId,
    );
    return { success };
  }

  @Post('custom/search')
  @Public()
  @ApiOperation({ summary: 'Track search' })
  async trackSearch(
    @Body()
    body: {
      searchTerm: string;
      resultsCount?: number;
      userId?: string;
      clientId?: string;
    },
  ) {
    const success = await this.analyticsService.trackSearch(
      body.searchTerm,
      body.resultsCount,
      body.userId,
      body.clientId,
    );
    return { success };
  }

  // ============ Admin Analytics ============

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics summary (Admin only)' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getAnalyticsSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const summary = await this.analyticsService.getAnalyticsSummary(
      new Date(startDate),
      new Date(endDate),
    );
    return { success: true, data: summary };
  }
}
