import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmailMarketingService } from './email-marketing.service';

@ApiTags('Email Marketing')
@Controller('integrations/email-marketing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class EmailMarketingController {
  constructor(private readonly emailMarketingService: EmailMarketingService) {}

  @Post('newsletter')
  @ApiOperation({ summary: 'Send newsletter to subscribers (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        subject: { type: 'string', example: 'Fresh Produce This Week!' },
        title: { type: 'string', example: 'Weekly Newsletter' },
        content: { type: 'string', example: '<p>Check out our latest products...</p>' },
        targetAudience: {
          type: 'string',
          enum: ['all', 'buyers', 'farmers', 'riders'],
          example: 'buyers',
        },
        featuredProducts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price: { type: 'number' },
              imageUrl: { type: 'string' },
              link: { type: 'string' },
            },
          },
        },
        ctaText: { type: 'string', example: 'Shop Now' },
        ctaLink: { type: 'string', example: 'https://handwork.app/shop' },
      },
      required: ['subject', 'title', 'content'],
    },
  })
  async sendNewsletter(
    @Body()
    body: {
      subject: string;
      title: string;
      content: string;
      targetAudience?: 'all' | 'buyers' | 'farmers' | 'riders';
      featuredProducts?: Array<{ name: string; price: number; imageUrl?: string; link: string }>;
      ctaText?: string;
      ctaLink?: string;
    },
  ) {
    const result = await this.emailMarketingService.sendNewsletter(
      body.subject,
      body.title,
      body.content,
      body.targetAudience || 'all',
      body.featuredProducts,
      body.ctaText,
      body.ctaLink,
    );
    return { success: true, ...result };
  }

  @Post('weekly-deals')
  @ApiOperation({ summary: 'Manually trigger weekly deals email (Admin only)' })
  async sendWeeklyDeals() {
    const result = await this.emailMarketingService.sendWeeklyDeals();
    return { success: true, ...result };
  }

  @Post('abandoned-cart-reminders')
  @ApiOperation({ summary: 'Manually trigger abandoned cart reminders (Admin only)' })
  async sendAbandonedCartReminders() {
    const result = await this.emailMarketingService.sendAbandonedCartReminders();
    return { success: true, ...result };
  }

  @Post('re-engagement')
  @ApiOperation({ summary: 'Send re-engagement emails to inactive users (Admin only)' })
  async sendReEngagementEmails() {
    const result = await this.emailMarketingService.sendReEngagementEmails();
    return { success: true, ...result };
  }

  @Post('welcome/:userId')
  @ApiOperation({ summary: 'Manually send welcome email to a user (Admin only)' })
  async sendWelcomeEmail(@Param('userId') userId: string) {
    const success = await this.emailMarketingService.sendWelcomeEmail(userId);
    return { success };
  }

  @Get('campaigns/:campaignId/stats')
  @ApiOperation({ summary: 'Get campaign statistics (Admin only)' })
  async getCampaignStats(@Param('campaignId') campaignId: string) {
    const stats = await this.emailMarketingService.getCampaignStats(campaignId);
    return { success: true, data: stats };
  }

  // ============ Tracking Endpoints (Public) ============

  @Get('track/open/:emailId/:userId')
  @ApiOperation({ summary: 'Track email open (used in email pixel)' })
  async trackOpen(@Param('emailId') emailId: string, @Param('userId') userId: string) {
    await this.emailMarketingService.trackOpen(emailId, userId);
    // Return 1x1 transparent pixel
    return '';
  }

  @Get('track/click/:emailId/:userId')
  @ApiOperation({ summary: 'Track email link click' })
  @ApiQuery({ name: 'url', required: true })
  async trackClick(
    @Param('emailId') emailId: string,
    @Param('userId') userId: string,
    @Query('url') url: string,
  ) {
    await this.emailMarketingService.trackClick(emailId, userId, url);
    // Redirect to actual URL
    return { redirect: url };
  }
}
