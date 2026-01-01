import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { ChatbotService } from './chatbot.service';
import { SendChatMessageDto, RateConversationDto, EscalateConversationDto } from './dto';

@ApiTags('Chatbot')
@Controller('chatbot')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send a message to the AI chatbot' })
  @ApiResponse({ status: 200, description: 'Returns chatbot response' })
  async chat(@Request() req: any, @Body() dto: SendChatMessageDto) {
    return this.chatbotService.chat(req.user.id, dto.message, dto.conversationId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user\'s chatbot conversations' })
  @ApiResponse({ status: 200, description: 'Returns list of conversations' })
  async getConversations(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.chatbotService.getUserConversations(
      req.user.id,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('conversations/active')
  @ApiOperation({ summary: 'Get active conversation' })
  @ApiResponse({ status: 200, description: 'Returns active conversation if any' })
  async getActiveConversation(@Request() req: any) {
    return this.chatbotService.getActiveConversation(req.user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a specific conversation' })
  @ApiResponse({ status: 200, description: 'Returns conversation details' })
  async getConversation(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) conversationId: string,
  ) {
    return this.chatbotService.getConversation(req.user.id, conversationId);
  }

  @Put('conversations/:id/end')
  @ApiOperation({ summary: 'End a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation ended' })
  async endConversation(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) conversationId: string,
  ) {
    await this.chatbotService.endConversation(req.user.id, conversationId);
    return { success: true, message: 'Conversation ended' };
  }

  @Post('conversations/:id/escalate')
  @ApiOperation({ summary: 'Escalate conversation to human support' })
  @ApiResponse({ status: 200, description: 'Conversation escalated' })
  async escalateConversation(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Body() dto: EscalateConversationDto,
  ) {
    const conversation = await this.chatbotService.getConversation(req.user.id, conversationId);
    await this.chatbotService.escalateToSupport(conversation, dto.reason);
    return { success: true, message: 'Conversation escalated to support' };
  }

  @Post('conversations/:id/rate')
  @ApiOperation({ summary: 'Rate a conversation' })
  @ApiResponse({ status: 200, description: 'Rating submitted' })
  async rateConversation(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Body() dto: RateConversationDto,
  ) {
    await this.chatbotService.rateConversation(
      req.user.id,
      conversationId,
      dto.rating,
      dto.feedback,
    );
    return { success: true, message: 'Thank you for your feedback!' };
  }

  @Get('quick-replies')
  @ApiOperation({ summary: 'Get FAQ quick replies' })
  @ApiResponse({ status: 200, description: 'Returns quick replies' })
  getQuickReplies() {
    return this.chatbotService.getQuickReplies();
  }
}
