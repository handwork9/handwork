import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FarmerSubscriptionService, FarmerSubscribeDto } from './farmer-subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, Public } from '../common/decorators';
import { UserRole } from '../common/enums';
import { User } from '../database/entities/user.entity';

class SubscribeDto {
  tier: string;
  duration: string;
  paymentMethod?: 'wallet' | 'card';
  autoRenew?: boolean;
}

@ApiTags('Farmer Subscription')
@Controller('farmers/subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FarmerSubscriptionController {
  constructor(private readonly subscriptionService: FarmerSubscriptionService) {}

  @Public()
  @Get('pricing')
  @ApiOperation({ summary: 'Get subscription pricing' })
  getPricing() {
    return this.subscriptionService.getPricing();
  }

  @Public()
  @Get('tiers')
  @ApiOperation({ summary: 'Get all subscription tiers with benefits' })
  getTiers() {
    return this.subscriptionService.getTiers();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription status' })
  @Roles(UserRole.FARMER)
  async getCurrentSubscription(@CurrentUser() user: User) {
    const subscription = await this.subscriptionService.getCurrentSubscription(user.id);
    return {
      hasActiveSubscription: !!subscription,
      subscription,
      isPremium: user.isPremium,
      premiumTier: user.premiumTier,
      premiumExpiresAt: user.premiumExpiresAt,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get subscription history' })
  @Roles(UserRole.FARMER)
  async getSubscriptionHistory(@CurrentUser() user: User) {
    return this.subscriptionService.getSubscriptionHistory(user.id);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a tier' })
  @Roles(UserRole.FARMER)
  async subscribe(@CurrentUser() user: User, @Body() dto: SubscribeDto) {
    return this.subscriptionService.subscribe({
      farmerId: user.id,
      tier: dto.tier as any,
      duration: dto.duration as any,
      paymentMethod: dto.paymentMethod,
      autoRenew: dto.autoRenew,
    });
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Cancel current subscription' })
  @Roles(UserRole.FARMER)
  async cancelSubscription(@CurrentUser() user: User, @Body() body: { reason?: string }) {
    return this.subscriptionService.cancelSubscription(user.id, body.reason);
  }

  @Get('verified-status')
  @ApiOperation({ summary: 'Check if farmer is a verified seller' })
  @Roles(UserRole.FARMER)
  async isVerifiedSeller(@CurrentUser() user: User) {
    const isVerified = await this.subscriptionService.isVerifiedSeller(user.id);
    const boost = await this.subscriptionService.getVisibilityBoost(user.id);
    return {
      isVerifiedSeller: isVerified,
      visibilityBoost: boost,
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get detailed subscription status with promotion info' })
  @Roles(UserRole.FARMER)
  async getSubscriptionStatus(@CurrentUser() user: User) {
    return this.subscriptionService.getSubscriptionStatus(user.id);
  }

  @Public()
  @Get('activation-fee')
  @ApiOperation({ summary: 'Get farmer activation fee' })
  getActivationFee() {
    return this.subscriptionService.getActivationFee();
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate farmer account (one-time payment)' })
  @Roles(UserRole.FARMER)
  async activateFarmerAccount(
    @CurrentUser() user: User,
    @Body() body: { paymentMethod?: 'wallet' | 'card' },
  ) {
    return this.subscriptionService.activateFarmerAccount(user.id, body.paymentMethod);
  }
}
