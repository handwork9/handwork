import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards';
import { ReferralsService } from './referrals.service';
import { ApplyReferralCodeDto, CreateReferralInviteDto } from './dto';
import { ReferralStatus } from '../database/entities/referral.entity';

interface AuthenticatedRequest extends ExpressRequest {
  user: { id: string; [key: string]: any };
}

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  // Get user's referral code
  @Get('code')
  async getReferralCode(@Request() req: AuthenticatedRequest) {
    return this.referralsService.getReferralCode(req.user.id);
  }

  // Generate referral code if not exists
  @Post('code/generate')
  async generateReferralCode(@Request() req: AuthenticatedRequest) {
    const code = await this.referralsService.generateReferralCode(req.user.id);
    return { code };
  }

  // Get referral stats
  @Get('stats')
  async getStats(@Request() req: AuthenticatedRequest) {
    return this.referralsService.getStats(req.user.id);
  }

  // Get referral history
  @Get('history')
  async getHistory(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: ReferralStatus,
  ) {
    return this.referralsService.getHistory(req.user.id, status);
  }

  // Get single referral detail
  @Get('history/:id')
  async getReferralDetail(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.referralsService.getReferralDetail(req.user.id, id);
  }

  // Create a pending invite
  @Post('invite')
  async createInvite(@Request() req: AuthenticatedRequest, @Body() dto: CreateReferralInviteDto) {
    return this.referralsService.createInvite(req.user.id, dto);
  }

  // Apply referral code
  @Post('apply')
  async applyReferralCode(@Request() req: AuthenticatedRequest, @Body() dto: ApplyReferralCodeDto) {
    return this.referralsService.applyReferralCode(req.user.id, dto.code);
  }

  // Admin: Get all referrals
  @Get('admin')
  @UseGuards(AdminGuard)
  async getAllReferrals(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: ReferralStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.referralsService.getAllReferrals({
      page: Number(page),
      limit: Number(limit),
      status,
      search,
      startDate,
      endDate,
    });
  }

  // Admin: Get referral stats
  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getAdminStats() {
    return this.referralsService.getAdminStats();
  }
}
