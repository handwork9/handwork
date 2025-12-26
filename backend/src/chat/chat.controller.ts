import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateConversationDto, SendMessageDto, MarkAsReadDto, GetMessagesQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

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

  /**
   * Delete a conversation (soft delete for user)
   */
  @Delete('conversations/:conversationId')
  async deleteConversation(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
  ) {
    await this.chatService.deleteConversation(user.id, conversationId);
    return { success: true, message: 'Conversation deleted' };
  }

  /**
   * Mute/unmute a conversation
   */
  @Patch('conversations/:conversationId/mute')
  async muteConversation(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: { muted: boolean },
  ) {
    await this.chatService.muteConversation(user.id, conversationId, dto.muted);
    return { success: true, muted: dto.muted };
  }

  /**
   * Get online status for a list of users
   */
  @Post('online-status')
  async getOnlineStatus(
    @Body() dto: { userIds: string[] },
  ) {
    const onlineUsers = this.chatGateway.getOnlineUsers(dto.userIds);
    const statusMap: Record<string, boolean> = {};
    dto.userIds.forEach(userId => {
      statusMap[userId] = onlineUsers.includes(userId);
    });
    return { onlineStatus: statusMap };
  }
}
