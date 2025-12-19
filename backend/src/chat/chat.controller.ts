import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendMessageDto, MarkAsReadDto, GetMessagesQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get all conversations for the current user
   */
  @Get('conversations')
  async getConversations(@CurrentUser() user: any) {
    const conversations = await this.chatService.getConversations(user.id);
    return { conversations };
  }

  /**
   * Get or create a conversation
   */
  @Post('conversations')
  async createConversation(
    @CurrentUser() user: any,
    @Body() dto: CreateConversationDto,
  ) {
    const conversation = await this.chatService.getOrCreateConversation(
      user.id,
      user.role,
      dto,
    );
    return { conversation };
  }

  /**
   * Get a specific conversation
   */
  @Get('conversations/:conversationId')
  async getConversation(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
  ) {
    const conversation = await this.chatService.getConversation(user.id, conversationId);
    return { conversation };
  }

  /**
   * Get messages for a conversation
   */
  @Get('conversations/:conversationId/messages')
  async getMessages(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    const messages = await this.chatService.getMessages(user.id, conversationId, query);
    return { messages };
  }

  /**
   * Send a message in a conversation
   */
  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chatService.sendMessage(
      user.id,
      user.role,
      conversationId,
      dto,
    );
    return { message };
  }

  /**
   * Mark messages as read
   */
  @Patch('conversations/:conversationId/read')
  async markAsRead(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: MarkAsReadDto,
  ) {
    await this.chatService.markAsRead(user.id, conversationId, dto.messageIds);
    return { success: true };
  }
}
