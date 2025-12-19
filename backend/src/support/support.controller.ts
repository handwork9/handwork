import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SupportService } from './support.service';
import { CreateTicketDto, SendMessageDto, UpdateTicketDto } from './dto';
import { TicketStatus, TicketPriority, TicketCategory, MessageSender } from '../database/entities';
import { UserRole } from '../common/enums';

interface AuthenticatedRequest {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /**
   * Start or continue a live chat (for app users)
   */
  @Post('chat/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start or continue a live chat session' })
  async startChat(@Request() req: AuthenticatedRequest, @Body() dto: CreateTicketDto) {
    const ticket = await this.supportService.getOrCreateActiveTicket(req.user.id, dto);
    return { ticket };
  }

  /**
   * Get current active chat session
   */
  @Get('chat/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active chat session' })
  async getActiveChat(@Request() req: AuthenticatedRequest) {
    const ticket = await this.supportService.getOrCreateActiveTicket(req.user.id);
    const messages = await this.supportService.getTicketMessages(ticket.id);
    return { ticket, messages };
  }

  /**
   * Send a message in chat
   */
  @Post('chat/:ticketId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message in support chat' })
  async sendMessage(
    @Request() req: AuthenticatedRequest,
    @Param('ticketId') ticketId: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.supportService.sendMessage(
      ticketId,
      req.user.id,
      dto,
      MessageSender.USER,
    );
    return { message };
  }

  /**
   * Get chat messages
   */
  @Get('chat/:ticketId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages for a support ticket' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'before', required: false, type: String })
  async getMessages(
    @Param('ticketId') ticketId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    const messages = await this.supportService.getTicketMessages(ticketId, limit, before);
    return { messages };
  }

  /**
   * Mark messages as read
   */
  @Patch('chat/:ticketId/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark messages as read' })
  async markAsRead(
    @Param('ticketId') ticketId: string,
    @Body() body: { messageIds?: string[] },
  ) {
    await this.supportService.markMessagesAsRead(ticketId, body.messageIds);
    return { marked: true };
  }

  /**
   * End chat and rate experience
   */
  @Post('chat/:ticketId/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End chat session and optionally rate' })
  async endChat(
    @Request() req: AuthenticatedRequest,
    @Param('ticketId') ticketId: string,
    @Body() body: { rating?: number; feedback?: string },
  ) {
    await this.supportService.updateTicketStatus(ticketId, TicketStatus.RESOLVED);
    if (body.rating) {
      await this.supportService.rateTicket(ticketId, req.user.id, body.rating, body.feedback);
    }
    return { ended: true };
  }

  /**
   * Get user's ticket history
   */
  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user ticket history' })
  async getUserTickets(@Request() req: AuthenticatedRequest) {
    const tickets = await this.supportService.getUserTickets(req.user.id);
    return { tickets };
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all tickets (admin)
   */
  @Get('admin/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all support tickets (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TicketPriority })
  @ApiQuery({ name: 'category', required: false, enum: TicketCategory })
  @ApiQuery({ name: 'assignedToId', required: false, type: String })
  @ApiQuery({ name: 'unassigned', required: false, type: Boolean })
  async getAllTickets(
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('category') category?: TicketCategory,
    @Query('assignedToId') assignedToId?: string,
    @Query('unassigned') unassigned?: boolean,
  ) {
    const tickets = await this.supportService.getAllTickets({
      status,
      priority,
      category,
      assignedToId,
      unassigned: unassigned === true,
    });
    return { tickets };
  }

  /**
   * Get ticket details (admin)
   */
  @Get('admin/tickets/:ticketId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket details (admin)' })
  async getTicketDetails(@Param('ticketId') ticketId: string) {
    const ticket = await this.supportService.getTicketById(ticketId);
    const messages = await this.supportService.getTicketMessages(ticketId);
    return { ticket, messages };
  }

  /**
   * Assign ticket to self (admin)
   */
  @Post('admin/tickets/:ticketId/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign ticket to self (admin)' })
  async assignTicket(@Request() req: AuthenticatedRequest, @Param('ticketId') ticketId: string) {
    const ticket = await this.supportService.assignTicket(ticketId, req.user.id);
    return { ticket };
  }

  /**
   * Get ticket messages (admin)
   */
  @Get('admin/tickets/:ticketId/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket messages (admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'before', required: false, type: String })
  async getAdminTicketMessages(
    @Param('ticketId') ticketId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    const messages = await this.supportService.getTicketMessages(ticketId, limit, before);
    return { messages };
  }

  /**
   * Send message as admin
   */
  @Post('admin/tickets/:ticketId/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message as admin' })
  async sendAdminMessage(
    @Request() req: AuthenticatedRequest,
    @Param('ticketId') ticketId: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.supportService.sendMessage(
      ticketId,
      req.user.id,
      dto,
      MessageSender.AGENT,
    );
    return { message };
  }

  /**
   * Update ticket status (admin)
   */
  @Patch('admin/tickets/:ticketId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket status (admin)' })
  async updateTicketStatus(
    @Param('ticketId') ticketId: string,
    @Body() body: { status: TicketStatus },
  ) {
    const ticket = await this.supportService.updateTicketStatus(ticketId, body.status);
    return { ticket };
  }

  /**
   * Get support statistics (admin)
   */
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get support statistics (admin)' })
  async getStatistics() {
    const statistics = await this.supportService.getStatistics();
    return { statistics };
  }
}
