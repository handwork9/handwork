import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RiderSubscriptionService, SubscribeToPremiumDto } from './rider-subscription.service';
import { SubscriptionTier, SubscriptionDuration, Rider, User } from '../database/entities';

interface RequestWithUser {
  user: User;
}

@ApiTags('Rider Subscriptions')
@Controller('riders/subscriptions')
export class RiderSubscriptionController {
  constructor(
    private readonly subscriptionService: RiderSubscriptionService,
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
  ) {}

  /**
   * Helper to get rider ID from user
   */
  private async getRiderIdFromUser(user: User): Promise<string> {
    const rider = await this.riderRepository.findOne({
      where: { userId: user.id },
      select: ['id'],
    });
    if (!rider) {
      throw new BadRequestException('User is not a rider');
    }
    return rider.id;
  }

  @Get('pricing')
  @ApiOperation({ summary: 'Get subscription pricing for all tiers' })
  @ApiResponse({ status: 200, description: 'Returns subscription pricing' })
  getPricing() {
    return this.subscriptionService.getPricing();
  }

  @Get('tiers')
  @ApiOperation({ summary: 'Get all subscription tiers with benefits' })
  @ApiResponse({ status: 200, description: 'Returns all subscription tiers' })
  getTiers() {
    return this.subscriptionService.getTiers();
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a premium tier' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient funds' })
  async subscribe(
    @Request() req: RequestWithUser,
    @Body() body: {
      tier: SubscriptionTier;
      duration: SubscriptionDuration;
      paymentMethod?: 'wallet' | 'card';
      autoRenew?: boolean;
    },
  ) {
    // Get rider ID from user
    const riderId = await this.getRiderIdFromUser(req.user);

    const dto: SubscribeToPremiumDto = {
      riderId,
      tier: body.tier,
      duration: body.duration,
      paymentMethod: body.paymentMethod,
      autoRenew: body.autoRenew,
    };

    return this.subscriptionService.subscribe(dto);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  async cancelSubscription(
    @Request() req: RequestWithUser,
    @Body() body: { reason?: string },
  ) {
    const riderId = await this.getRiderIdFromUser(req.user);
    return this.subscriptionService.cancelSubscription(riderId, body.reason);
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current active subscription' })
  @ApiResponse({ status: 200, description: 'Returns current subscription or null' })
  async getCurrentSubscription(@Request() req: RequestWithUser) {
    const riderId = await this.getRiderIdFromUser(req.user);
    const subscription = await this.subscriptionService.getCurrentSubscription(riderId);
    return { subscription };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns subscription history' })
  async getSubscriptionHistory(
    @Request() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const riderId = await this.getRiderIdFromUser(req.user);
    return this.subscriptionService.getSubscriptionHistory(riderId, +page, +limit);
  }

  // Admin endpoint to view subscription stats
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Returns subscription statistics' })
  async getSubscriptionStats() {
    return this.subscriptionService.getSubscriptionStats();
  }
}
