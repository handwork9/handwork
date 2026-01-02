import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities';
import { ContentModerationService } from '../admin/content-moderation.service';
import { ContentType } from '../database/entities/content-moderation.entity';

@ApiTags('Moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ContentModerationService) {}

  @Post('report')
  @ApiOperation({ summary: 'Report content for moderation' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contentType: { 
          type: 'string', 
          enum: ['product', 'review', 'social_post', 'farm_story', 'comment', 'user_profile', 'chat_message'],
          description: 'Type of content being reported'
        },
        contentId: { type: 'string', description: 'ID of the content being reported' },
        reason: { type: 'string', description: 'Reason for reporting' },
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

  @Post('submit')
  @ApiOperation({ summary: 'Submit content for moderation (internal use)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contentType: { 
          type: 'string', 
          enum: ['product', 'review', 'social_post', 'farm_story', 'comment', 'user_profile', 'chat_message'],
        },
        contentId: { type: 'string' },
        title: { type: 'string' },
        contentPreview: { type: 'string' },
        contentSnapshot: { type: 'object' },
      },
      required: ['contentType', 'contentId'],
    },
  })
  async submitContent(
    @CurrentUser() user: User,
    @Body() body: {
      contentType: ContentType;
      contentId: string;
      title?: string;
      contentPreview?: string;
      contentSnapshot?: any;
    },
  ) {
    return this.moderationService.submitForModeration({
      contentType: body.contentType,
      contentId: body.contentId,
      authorId: user.id,
      title: body.title,
      contentPreview: body.contentPreview,
      contentSnapshot: body.contentSnapshot,
    });
  }
}
