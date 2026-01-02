import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities';
import { ContentModerationService } from './content-moderation.service';
import {
  ContentType,
  ModerationStatus,
  ModerationReason,
  ModerationPriority,
} from '../database/entities/content-moderation.entity';

@ApiTags('Content Moderation')
@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ContentModerationController {
  constructor(private readonly moderationService: ContentModerationService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get content moderation statistics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.moderationService.getModerationStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get moderation queue' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'contentType', required: false, enum: ContentType })
  @ApiQuery({ name: 'status', required: false, enum: ModerationStatus })
  @ApiQuery({ name: 'priority', required: false, enum: ModerationPriority })
  async getQueue(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('contentType') contentType?: ContentType,
    @Query('status') status?: ModerationStatus,
    @Query('priority') priority?: ModerationPriority,
  ) {
    return this.moderationService.getModerationQueue(
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
      contentType,
      status,
      priority,
    );
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a moderation item' })
  async getItem(@Param('id') id: string) {
    return this.moderationService.getModerationItem(id);
  }

  @Put('items/:id/approve')
  @ApiOperation({ summary: 'Approve content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string' },
      },
    },
  })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { notes?: string },
  ) {
    return this.moderationService.approveContent(id, user.id, body.notes);
  }

  @Put('items/:id/reject')
  @ApiOperation({ summary: 'Reject content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', enum: Object.values(ModerationReason) },
        notes: { type: 'string' },
        removeContent: { type: 'boolean', default: true },
        warnUser: { type: 'boolean', default: false },
        suspendUser: { type: 'boolean', default: false },
      },
      required: ['reason'],
    },
  })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: {
      reason: ModerationReason;
      notes?: string;
      removeContent?: boolean;
      warnUser?: boolean;
      suspendUser?: boolean;
    },
  ) {
    return this.moderationService.rejectContent(
      id,
      user.id,
      body.reason,
      body.notes,
      body.removeContent !== false,
      body.warnUser,
      body.suspendUser,
    );
  }

  @Put('items/:id/flag')
  @ApiOperation({ summary: 'Flag content for review' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        priority: { type: 'string', enum: Object.values(ModerationPriority) },
        notes: { type: 'string' },
      },
      required: ['priority'],
    },
  })
  async flag(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { priority: ModerationPriority; notes?: string },
  ) {
    return this.moderationService.flagContent(id, user.id, body.priority, body.notes);
  }

  @Post('bulk/approve')
  @ApiOperation({ summary: 'Bulk approve content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
      },
      required: ['ids'],
    },
  })
  async bulkApprove(@CurrentUser() user: User, @Body() body: { ids: string[] }) {
    return this.moderationService.bulkApprove(body.ids, user.id);
  }

  @Post('bulk/reject')
  @ApiOperation({ summary: 'Bulk reject content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        reason: { type: 'string', enum: Object.values(ModerationReason) },
      },
      required: ['ids', 'reason'],
    },
  })
  async bulkReject(
    @CurrentUser() user: User,
    @Body() body: { ids: string[]; reason: ModerationReason },
  ) {
    return this.moderationService.bulkReject(body.ids, user.id, body.reason);
  }

  @Get('users/:userId/history')
  @ApiOperation({ summary: 'Get user moderation history' })
  async getUserHistory(@Param('userId') userId: string) {
    return this.moderationService.getUserModerationHistory(userId);
  }

  @Post('report')
  @ApiOperation({ summary: 'Report content (can be used by any authenticated user)' })
  @Roles(UserRole.ADMIN, UserRole.BUYER, UserRole.FARMER, UserRole.RIDER)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contentType: { type: 'string', enum: Object.values(ContentType) },
        contentId: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['contentType', 'contentId', 'reason'],
    },
  })
  async reportContent(
    @CurrentUser() user: User,
    @Body() body: { contentType: ContentType; contentId: string; reason: string },
  ) {
    return this.moderationService.reportContent(
      body.contentType,
      body.contentId,
      user.id,
      body.reason,
    );
  }
}
