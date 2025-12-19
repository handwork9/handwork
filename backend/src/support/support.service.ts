import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { SupportTicket, SupportMessage, User, TicketStatus, TicketPriority, TicketCategory, MessageSender, SupportMessageType } from '../database/entities';
import { SupportGateway } from './support.gateway';
import { CreateTicketDto, SendMessageDto, UpdateTicketDto, AssignTicketDto } from './dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepository: Repository<SupportTicket>,
    @InjectRepository(SupportMessage)
    private messageRepository: Repository<SupportMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => SupportGateway))
    private supportGateway: SupportGateway,
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
    // Check if user has an open ticket
    const existingTicket = await this.ticketRepository.findOne({
      where: {
        userId,
        status: In([TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_USER]),
      },
      order: { createdAt: 'DESC' },
    });

    if (existingTicket) {
      return this.getTicketById(existingTicket.id);
    }

    // Create new ticket
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

    await this.messageRepository.save(message);

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

    return {
      totalTickets,
      openTickets,
      resolvedToday,
      averageRating: parseFloat(ratingResult?.avgRating || '0'),
      averageResponseTime: 0, // TODO: Calculate from first message response
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
}
