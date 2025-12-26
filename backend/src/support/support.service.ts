import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { SupportTicket, SupportMessage, User, TicketStatus, TicketPriority, TicketCategory, MessageSender, SupportMessageType, SupportReport, ReportType, ReportStatus } from '../database/entities';
import { SupportGateway } from './support.gateway';
import { CreateTicketDto, SendMessageDto, UpdateTicketDto, AssignTicketDto, CreateReportDto, UpdateReportDto } from './dto';
import { UserRole } from '../common/enums';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepository: Repository<SupportTicket>,
    @InjectRepository(SupportMessage)
    private messageRepository: Repository<SupportMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SupportReport)
    private reportRepository: Repository<SupportReport>,
    @Inject(forwardRef(() => SupportGateway))
    private supportGateway: SupportGateway,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Generate a unique ticket number
   */
  private generateTicketNumber(): string {
    const prefix = 'TKT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create a new support ticket
   */
  async createTicket(userId: string, dto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.ticketRepository.create({
      ticketNumber: this.generateTicketNumber(),
      userId,
      subject: dto.subject,
      category: dto.category || TicketCategory.OTHER,
      priority: dto.priority || TicketPriority.MEDIUM,
      relatedOrderId: dto.orderId,
      metadata: dto.metadata,
    });

    await this.ticketRepository.save(ticket);

    // Create initial message if provided
    if (dto.initialMessage) {
      await this.sendMessage(ticket.id, userId, {
        content: dto.initialMessage,
        type: SupportMessageType.TEXT,
      }, MessageSender.USER);
    }

    // Notify admins about new ticket
    this.supportGateway.notifyNewTicket(ticket);

    return this.getTicketById(ticket.id);
  }

  /**
   * Get or create an active ticket for a user
   */
  async getOrCreateActiveTicket(userId: string, dto?: CreateTicketDto): Promise<SupportTicket> {
    // Check if user has an open or recently resolved ticket (within last 24 hours)
    const existingTicket = await this.ticketRepository.findOne({
      where: {
        userId,
        status: In([TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_USER, TicketStatus.RESOLVED]),
      },
      order: { createdAt: 'DESC' },
    });

    // If ticket exists and is either open or resolved within last 24 hours, return it
    if (existingTicket) {
      const isRecentlyResolved = existingTicket.status === TicketStatus.RESOLVED && 
        existingTicket.resolvedAt && 
        (Date.now() - new Date(existingTicket.resolvedAt).getTime()) < 24 * 60 * 60 * 1000;
      
      // Return existing ticket if it's still open OR if it was recently resolved
      if (existingTicket.status !== TicketStatus.RESOLVED || isRecentlyResolved) {
        return this.getTicketById(existingTicket.id);
      }
    }

    // Create new ticket only if no active/recent ticket exists
    return this.createTicket(userId, dto || {
      subject: 'Live Support Chat',
      category: TicketCategory.OTHER,
    });
  }

  /**
   * Get ticket by ID with relations
   */
  async getTicketById(ticketId: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['user', 'assignedTo', 'messages', 'messages.sender'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  /**
   * Get all tickets for a user
   */
  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    return this.ticketRepository.find({
      where: { userId },
      relations: ['assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all tickets (admin)
   */
  async getAllTickets(filters?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    assignedToId?: string;
    unassigned?: boolean;
  }): Promise<SupportTicket[]> {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.category) where.category = filters.category;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.unassigned) where.assignedToId = IsNull();

    return this.ticketRepository.find({
      where,
      relations: ['user', 'assignedTo'],
      order: { 
        priority: 'DESC',
        lastMessageAt: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Get open tickets count (admin)
   */
  async getOpenTicketsCount(): Promise<number> {
    return this.ticketRepository.count({
      where: {
        status: In([TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS]),
      },
    });
  }

  /**
   * Assign ticket to admin
   */
  async assignTicket(ticketId: string, adminId: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    ticket.assignedToId = adminId;
    ticket.status = TicketStatus.ASSIGNED;
    await this.ticketRepository.save(ticket);

    // Create system message
    await this.sendMessage(ticketId, adminId, {
      content: 'An agent has joined the chat',
      type: SupportMessageType.SYSTEM,
    }, MessageSender.SYSTEM);

    // Notify user
    this.supportGateway.notifyTicketAssigned(ticket, adminId);

    return this.getTicketById(ticketId);
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    ticket.status = status;
    if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
      ticket.resolvedAt = new Date();
    }

    await this.ticketRepository.save(ticket);

    return this.getTicketById(ticketId);
  }

  /**
   * Send a message to a ticket
   */
  async sendMessage(
    ticketId: string,
    senderId: string,
    dto: SendMessageDto,
    senderType: MessageSender,
  ): Promise<SupportMessage> {
    this.logger.log(`[sendMessage] Received DTO: ${JSON.stringify(dto)}`);
    
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const message = this.messageRepository.create({
      ticketId,
      senderId,
      senderType,
      content: dto.content,
      type: dto.type || SupportMessageType.TEXT,
      attachments: dto.attachments,
      metadata: dto.metadata,
    });

    this.logger.log(`[sendMessage] Created message entity: ${JSON.stringify(message)}`);

    await this.messageRepository.save(message);
    
    this.logger.log(`[sendMessage] Saved message with attachments: ${JSON.stringify(message.attachments)}`);

    // Update ticket
    ticket.lastMessageAt = new Date();
    if (senderType === MessageSender.USER) {
      ticket.unreadCount += 1;
      if (ticket.status === TicketStatus.WAITING_USER) {
        ticket.status = TicketStatus.IN_PROGRESS;
      }
    }
    await this.ticketRepository.save(ticket);

    // Get sender info
    const sender = await this.userRepository.findOne({ where: { id: senderId } });

    // Broadcast message via WebSocket
    this.supportGateway.broadcastMessage(ticketId, {
      ...message,
      sender: sender ? {
        id: sender.id,
        name: sender.name,
        avatar: sender.avatar,
        role: sender.role,
      } : null,
    });

    return message;
  }

  /**
   * Get messages for a ticket
   */
  async getTicketMessages(ticketId: string, limit: number | string = 50, before?: string): Promise<SupportMessage[]> {
    const takeLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    
    const query = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.ticketId = :ticketId', { ticketId })
      .orderBy('message.createdAt', 'DESC')
      .take(takeLimit || 50);

    if (before) {
      query.andWhere('message.createdAt < :before', { before });
    }

    const messages = await query.getMany();
    return messages.reverse();
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(ticketId: string, messageIds?: string[]): Promise<void> {
    const query = this.messageRepository
      .createQueryBuilder()
      .update()
      .set({ isRead: true, readAt: new Date() })
      .where('ticketId = :ticketId', { ticketId })
      .andWhere('isRead = false');

    if (messageIds?.length) {
      query.andWhere('id IN (:...messageIds)', { messageIds });
    }

    await query.execute();

    // Reset unread count on ticket
    await this.ticketRepository.update(ticketId, { unreadCount: 0 });
  }

  /**
   * Rate support experience
   */
  async rateTicket(ticketId: string, userId: string, rating: number, feedback?: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId, userId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    ticket.rating = rating;
    if (feedback) {
      ticket.feedback = feedback;
    }
    await this.ticketRepository.save(ticket);

    return this.getTicketById(ticketId);
  }

  /**
   * Get support statistics (admin)
   */
  async getStatistics(): Promise<{
    totalTickets: number;
    openTickets: number;
    resolvedToday: number;
    averageRating: number;
    averageResponseTime: number;
    ticketsByCategory: Record<string, number>;
    ticketsByStatus: Record<string, number>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalTickets = await this.ticketRepository.count();
    const openTickets = await this.ticketRepository.count({
      where: {
        status: In([TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS]),
      },
    });

    const resolvedToday = await this.ticketRepository.count({
      where: {
        status: In([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
        resolvedAt: Not(IsNull()),
      },
    });

    const ratingResult = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('AVG(ticket.rating)', 'avgRating')
      .where('ticket.rating IS NOT NULL')
      .getRawOne();

    const categoryStats = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.category')
      .getRawMany();

    const statusStats = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.status')
      .getRawMany();

    // Calculate average response time from first agent response
    const responseTimeResult = await this.messageRepository
      .createQueryBuilder('msg')
      .innerJoin('support_tickets', 'ticket', 'ticket.id = msg.ticketId')
      .select('AVG(EXTRACT(EPOCH FROM (msg.createdAt - ticket.createdAt)) / 60)', 'avgMinutes')
      .where('msg.senderType = :agentType', { agentType: MessageSender.AGENT })
      .andWhere(
        `msg.id = (
          SELECT m2.id FROM support_messages m2 
          WHERE m2.ticketId = msg.ticketId 
          AND m2.senderType = :agentType 
          ORDER BY m2.createdAt ASC 
          LIMIT 1
        )`,
        { agentType: MessageSender.AGENT }
      )
      .getRawOne();

    const averageResponseMinutes = parseFloat(responseTimeResult?.avgMinutes || '0');

    return {
      totalTickets,
      openTickets,
      resolvedToday,
      averageRating: parseFloat(ratingResult?.avgRating || '0'),
      averageResponseTime: Math.round(averageResponseMinutes), // in minutes
      ticketsByCategory: categoryStats.reduce((acc, { category, count }) => {
        acc[category] = parseInt(count);
        return acc;
      }, {}),
      ticketsByStatus: statusStats.reduce((acc, { status, count }) => {
        acc[status] = parseInt(count);
        return acc;
      }, {}),
    };
  }

  /**
   * Get support team members (admins with support roles)
   */
  async getSupportTeamMembers() {
    const SUPPORT_ROLES = [
      UserRole.ADMIN,
      UserRole.SUPERADMIN,
      UserRole.SUPPORT,
    ];

    const members = await this.userRepository.find({
      where: {
        role: In(SUPPORT_ROLES),
        isActive: true,
      },
      select: ['id', 'name', 'email', 'phone', 'role', 'avatar', 'createdAt'],
      order: { name: 'ASC' },
    });

    // Get active ticket counts per team member
    const assignedCounts = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.assignedToId', 'assignedToId')
      .addSelect('COUNT(*)', 'count')
      .where('ticket.status IN (:...statuses)', { statuses: [TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_USER] })
      .andWhere('ticket.assignedToId IS NOT NULL')
      .groupBy('ticket.assignedToId')
      .getRawMany();

    const countMap = assignedCounts.reduce((acc, { assignedToId, count }) => {
      acc[assignedToId] = parseInt(count);
      return acc;
    }, {} as Record<string, number>);

    return members.map(member => ({
      ...member,
      activeTickets: countMap[member.id] || 0,
    }));
  }

  // ==================== REPORT MANAGEMENT ====================

  /**
   * Create a new report
   */
  async createReport(userId: string, dto: CreateReportDto): Promise<SupportReport> {
    const report = this.reportRepository.create({
      userId,
      ticketId: dto.ticketId,
      type: dto.type,
      description: dto.description,
      status: ReportStatus.PENDING,
    });

    await this.reportRepository.save(report);
    this.logger.log(`New report created: ${report.id} by user ${userId}`);

    return this.getReportById(report.id);
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string): Promise<SupportReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['user', 'ticket', 'reviewer'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  /**
   * Get all reports (admin only)
   */
  async getReports(filters?: {
    status?: ReportStatus;
    type?: ReportType;
    page?: number;
    limit?: number;
  }): Promise<{ reports: SupportReport[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reportRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.ticket', 'ticket')
      .leftJoinAndSelect('report.reviewer', 'reviewer')
      .orderBy('report.createdAt', 'DESC');

    if (filters?.status) {
      queryBuilder.andWhere('report.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      queryBuilder.andWhere('report.type = :type', { type: filters.type });
    }

    const [reports, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { reports, total, page, limit };
  }

  /**
   * Get user's own reports (for feedback tracking)
   */
  async getUserReports(userId: string, filters?: {
    status?: ReportStatus;
    page?: number;
    limit?: number;
  }): Promise<{ reports: SupportReport[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reportRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.ticket', 'ticket')
      .leftJoinAndSelect('report.reviewer', 'reviewer')
      .where('report.userId = :userId', { userId })
      .orderBy('report.createdAt', 'DESC');

    if (filters?.status) {
      queryBuilder.andWhere('report.status = :status', { status: filters.status });
    }

    const [reports, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { reports, total, page, limit };
  }

  /**
   * Get a specific report by ID for the user (only their own)
   */
  async getUserReportById(userId: string, reportId: string): Promise<SupportReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, userId },
      relations: ['ticket', 'reviewer'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  /**
   * Update a report (admin only)
   */
  async updateReport(reportId: string, adminId: string, dto: UpdateReportDto): Promise<SupportReport> {
    const report = await this.getReportById(reportId);
    const previousStatus = report.status;

    if (dto.status) {
      report.status = dto.status;
      if (dto.status !== ReportStatus.PENDING) {
        report.reviewedBy = adminId;
        report.reviewedAt = new Date();
      }
    }

    if (dto.adminNotes !== undefined) {
      report.adminNotes = dto.adminNotes;
    }

    await this.reportRepository.save(report);

    // Send notification to user if status changed
    if (dto.status && dto.status !== previousStatus) {
      await this.notifyUserOfReportStatusChange(report, dto.status);
    }

    return this.getReportById(reportId);
  }

  /**
   * Notify user of report status change
   */
  private async notifyUserOfReportStatusChange(report: SupportReport, newStatus: ReportStatus): Promise<void> {
    try {
      let notificationType: NotificationType;
      let title: string;
      let body: string;

      switch (newStatus) {
        case ReportStatus.REVIEWED:
          notificationType = NotificationType.SUPPORT_REPORT_REVIEWED;
          title = 'Report Under Review';
          body = 'Your report is being reviewed by our support team.';
          break;
        case ReportStatus.RESOLVED:
          notificationType = NotificationType.SUPPORT_REPORT_RESOLVED;
          title = 'Report Resolved';
          body = report.adminNotes 
            ? `Your report has been resolved. Response: ${report.adminNotes.substring(0, 100)}${report.adminNotes.length > 100 ? '...' : ''}`
            : 'Your report has been resolved. Thank you for your feedback.';
          break;
        case ReportStatus.DISMISSED:
          notificationType = NotificationType.SUPPORT_REPORT_DISMISSED;
          title = 'Report Closed';
          body = report.adminNotes 
            ? `Your report has been reviewed. Response: ${report.adminNotes.substring(0, 100)}${report.adminNotes.length > 100 ? '...' : ''}`
            : 'Your report has been reviewed and closed.';
          break;
        default:
          return;
      }

      await this.notificationsService.sendPushNotification({
        userId: report.userId,
        type: notificationType,
        title,
        body,
        data: {
          reportId: report.id,
          reportType: report.type,
          status: newStatus,
        },
      });

      this.logger.log(`Notification sent to user ${report.userId} for report ${report.id} status change to ${newStatus}`);
    } catch (error) {
      this.logger.error(`Failed to send report notification: ${error.message}`);
    }
  }

  /**
   * Get report statistics
   */
  async getReportStats(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
    byType: Record<string, number>;
  }> {
    const reports = await this.reportRepository.find();

    const stats = {
      total: reports.length,
      pending: 0,
      reviewed: 0,
      resolved: 0,
      dismissed: 0,
      byType: {} as Record<string, number>,
    };

    reports.forEach(report => {
      stats[report.status]++;
      stats.byType[report.type] = (stats.byType[report.type] || 0) + 1;
    });

    return stats;
  }
}
