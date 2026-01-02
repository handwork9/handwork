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
import { CreateTicketDto, SendMessageDto, UpdateTicketDto, CreateReportDto, UpdateReportDto, CreateGuestTicketDto, SendGuestMessageDto } from './dto';
import { TicketStatus, TicketPriority, TicketCategory, MessageSender, ReportType, ReportStatus } from '../database/entities';
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

  // ==================== GUEST ENDPOINTS (No Auth Required) ====================

  /**
   * Create a guest support ticket
   */
  @Post('guest/ticket')
  @ApiOperation({ summary: 'Create a guest support ticket (no auth required)' })
  async createGuestTicket(@Body() dto: CreateGuestTicketDto) {
    const result = await this.supportService.createGuestTicket({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      category: dto.category,
      message: dto.message,
      deviceInfo: dto.deviceInfo,
    });
    return result;
  }

  /**
   * Send a message as guest
   */
  @Post('guest/message')
  @ApiOperation({ summary: 'Send a message as guest' })
  async sendGuestMessage(@Body() dto: SendGuestMessageDto) {
    const message = await this.supportService.sendGuestMessage(dto.sessionId, dto.content);
    return { message };
  }

  /**
   * Get guest chat messages
   */
  @Get('guest/messages/:sessionId')
  @ApiOperation({ summary: 'Get messages for a guest session' })
  async getGuestMessages(@Param('sessionId') sessionId: string) {
    const messages = await this.supportService.getGuestMessages(sessionId);
    return { messages };
  }

  /**
   * Get guest ticket info
   */
  @Get('guest/ticket/:sessionId')
  @ApiOperation({ summary: 'Get guest ticket by session ID' })
  async getGuestTicket(@Param('sessionId') sessionId: string) {
    const ticket = await this.supportService.getGuestTicketBySession(sessionId);
    return { ticket };
  }

  // ==================== AUTHENTICATED USER ENDPOINTS ====================

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
   * Get all guest tickets (admin)
   */
  @Get('admin/guest-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all guest support tickets (admin)' })
  async getGuestTickets() {
    const tickets = await this.supportService.getGuestTickets();
    return { tickets };
  }

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
   * Get support team members (admin)
   */
  @Get('admin/team')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get support team members' })
  async getSupportTeam() {
    const team = await this.supportService.getSupportTeamMembers();
    return { success: true, data: team };
  }

  /**
   * Assign ticket to admin (admin)
   */
  @Post('admin/tickets/:ticketId/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign ticket to self or specific admin' })
  async assignTicket(
    @Request() req: AuthenticatedRequest,
    @Param('ticketId') ticketId: string,
    @Body() body: { adminId?: string },
  ) {
    const assignToId = body.adminId || req.user.id;
    const ticket = await this.supportService.assignTicket(ticketId, assignToId);
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

  // ==================== REPORT ENDPOINTS ====================

  /**
   * Submit a report (user)
   */
  @Post('reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a report' })
  async createReport(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateReportDto,
  ) {
    const report = await this.supportService.createReport(req.user.id, dto);
    return { report };
  }

  /**
   * Get user's own reports (for feedback/status tracking)
   */
  @Get('reports/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s submitted reports' })
  @ApiQuery({ name: 'status', enum: ReportStatus, required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMyReports(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: ReportStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.supportService.getUserReports(req.user.id, {
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, data: result };
  }

  /**
   * Get a specific report by ID (user - only their own reports)
   */
  @Get('reports/my/:reportId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get details of a specific report (user)' })
  async getMyReportById(
    @Request() req: AuthenticatedRequest,
    @Param('reportId') reportId: string,
  ) {
    const report = await this.supportService.getUserReportById(req.user.id, reportId);
    return { success: true, data: { report } };
  }

  /**
   * Get all reports (admin)
   */
  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reports (admin)' })
  @ApiQuery({ name: 'status', enum: ReportStatus, required: false })
  @ApiQuery({ name: 'type', enum: ReportType, required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReports(
    @Query('status') status?: ReportStatus,
    @Query('type') type?: ReportType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.supportService.getReports({
      status,
      type,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return result;
  }

  /**
   * Get report by ID (admin)
   */
  @Get('admin/reports/:reportId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report by ID (admin)' })
  async getReport(@Param('reportId') reportId: string) {
    const report = await this.supportService.getReportById(reportId);
    return { report };
  }

  /**
   * Update report (admin)
   */
  @Patch('admin/reports/:reportId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report (admin)' })
  async updateReport(
    @Request() req: AuthenticatedRequest,
    @Param('reportId') reportId: string,
    @Body() dto: UpdateReportDto,
  ) {
    const report = await this.supportService.updateReport(reportId, req.user.id, dto);
    return { report };
  }

  /**
   * Get report statistics (admin)
   */
  @Get('admin/reports/stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report statistics (admin)' })
  async getReportStats() {
    const stats = await this.supportService.getReportStats();
    return { stats };
  }
}
