import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Dispute, DisputeMessage, User, Order, DisputeStatus, DisputePriority, DisputeResolution } from '../database/entities';
import { WalletOwnerType, TransactionCategory } from '../database/entities/wallet-transaction.entity';
import { DisputeGateway } from './dispute.gateway';
import { CreateDisputeDto, UpdateDisputeDto, AssignDisputeDto, SendDisputeMessageDto, ResolveDisputeDto } from './dto';
import { UserRole } from '../common/enums';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';

@Injectable()
export class DisputeService {
  constructor(
    @InjectRepository(Dispute)
    private disputeRepository: Repository<Dispute>,
    @InjectRepository(DisputeMessage)
    private messageRepository: Repository<DisputeMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @Inject(forwardRef(() => DisputeGateway))
    private disputeGateway: DisputeGateway,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Generate a unique dispute number
   */
  private generateDisputeNumber(): string {
    const prefix = 'DSP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create a new dispute
   */
  async createDispute(userId: string, dto: CreateDisputeDto): Promise<Dispute> {
    // Verify order exists and belongs to user
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, buyerId: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to you');
    }

    // Check if dispute already exists for this order
    const existingDispute = await this.disputeRepository.findOne({
      where: {
        orderId: dto.orderId,
        status: In([DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.AWAITING_RESPONSE, DisputeStatus.ESCALATED]),
      },
    });

    if (existingDispute) {
      throw new BadRequestException('An active dispute already exists for this order');
    }

    // Determine priority based on order value
    let priority = DisputePriority.MEDIUM;
    if (order.total >= 50000) {
      priority = DisputePriority.HIGH;
    } else if (order.total >= 100000) {
      priority = DisputePriority.URGENT;
    }

    const dispute = this.disputeRepository.create({
      disputeNumber: this.generateDisputeNumber(),
      userId,
      orderId: dto.orderId,
      type: dto.type,
      subject: dto.subject,
      description: dto.description,
      images: dto.images,
      requestedAmount: dto.requestedAmount,
      priority,
      metadata: {
        ...dto.metadata,
        orderNumber: order.orderNumber,
        orderTotal: order.total,
      },
    });

    await this.disputeRepository.save(dispute);

    // Create initial system message
    await this.createSystemMessage(dispute.id, `Dispute #${dispute.disputeNumber} has been created. Our support team will review your case shortly.`);

    // Notify admins about new dispute
    this.disputeGateway.notifyNewDispute(dispute);

    // Send notification to admins
    await this.notifyAdmins('New Dispute', `New dispute #${dispute.disputeNumber} requires attention`);

    return this.getDisputeById(dispute.id);
  }

  /**
   * Get dispute by ID with relations
   */
  async getDisputeById(disputeId: string): Promise<Dispute> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ['user', 'assignedTo', 'order', 'messages', 'messages.sender'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  /**
   * Get user's disputes
   */
  async getUserDisputes(userId: string, status?: DisputeStatus): Promise<Dispute[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.disputeRepository.find({
      where,
      relations: ['order', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get disputes for an order
   */
  async getOrderDisputes(orderId: string, userId?: string): Promise<Dispute[]> {
    const where: any = { orderId };
    if (userId) {
      where.userId = userId;
    }

    return this.disputeRepository.find({
      where,
      relations: ['user', 'assignedTo', 'messages'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all disputes (admin)
   */
  async getAllDisputes(filters: {
    status?: DisputeStatus;
    priority?: DisputePriority;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ disputes: Dispute[]; total: number }> {
    const { status, priority, assignedToId, page = 1, limit = 20 } = filters;
    
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;

    const [disputes, total] = await this.disputeRepository.findAndCount({
      where,
      relations: ['user', 'assignedTo', 'order', 'messages', 'messages.sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { disputes, total };
  }

  /**
   * Update dispute (admin)
   */
  async updateDispute(disputeId: string, dto: UpdateDisputeDto, adminId: string): Promise<Dispute> {
    const dispute = await this.getDisputeById(disputeId);

    if (dto.status) {
      dispute.status = dto.status;
      if (dto.status === DisputeStatus.RESOLVED) {
        dispute.resolvedAt = new Date();
      }
    }

    if (dto.priority) dispute.priority = dto.priority;
    if (dto.resolution) dispute.resolution = dto.resolution;
    if (dto.refundedAmount !== undefined) dispute.refundedAmount = dto.refundedAmount;
    if (dto.resolutionNotes) dispute.resolutionNotes = dto.resolutionNotes;
    if (dto.adminNotes) dispute.adminNotes = dto.adminNotes;

    await this.disputeRepository.save(dispute);

    // Notify user of status change
    if (dto.status) {
      await this.createSystemMessage(disputeId, `Dispute status updated to: ${dto.status.replace('_', ' ').toUpperCase()}`);
      this.disputeGateway.notifyStatusChange(dispute);
      
      await this.notificationsService.sendPushNotification({
        userId: dispute.userId,
        type: NotificationType.GENERAL,
        title: 'Dispute Update',
        body: `Your dispute #${dispute.disputeNumber} status has been updated to ${dto.status.replace('_', ' ')}`,
        data: { disputeId: dispute.id },
      });
    }

    return this.getDisputeById(disputeId);
  }

  /**
   * Assign dispute to admin
   */
  async assignDispute(disputeId: string, dto: AssignDisputeDto): Promise<Dispute> {
    const dispute = await this.getDisputeById(disputeId);
    const admin = await this.userRepository.findOne({
      where: { id: dto.adminId, role: In([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT]) },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    dispute.assignedToId = dto.adminId;
    dispute.assignedTo = admin;
    
    if (dispute.status === DisputeStatus.OPEN) {
      dispute.status = DisputeStatus.UNDER_REVIEW;
    }

    await this.disputeRepository.save(dispute);

    await this.createSystemMessage(disputeId, `Dispute assigned to ${admin.name}. They will review your case.`);

    return this.getDisputeById(disputeId);
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(disputeId: string, dto: ResolveDisputeDto, adminId: string): Promise<Dispute> {
    const dispute = await this.getDisputeById(disputeId);

    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolution = dto.resolution;
    dispute.resolutionNotes = dto.resolutionNotes;
    dispute.resolvedAt = new Date();

    // Process refund if applicable
    if (dto.refundedAmount && dto.refundedAmount > 0) {
      dispute.refundedAmount = dto.refundedAmount;
      
      // Credit user's wallet
      await this.walletService.creditWallet({
        ownerId: dispute.userId,
        ownerType: WalletOwnerType.BUYER,
        amount: dto.refundedAmount,
        category: TransactionCategory.REFUND,
        description: `Refund for dispute #${dispute.disputeNumber}`,
        metadata: { disputeId: dispute.id, orderId: dispute.orderId },
      });
    }

    await this.disputeRepository.save(dispute);

    // Create resolution message
    let resolutionMessage = `Your dispute has been resolved. Resolution: ${dto.resolution.replace('_', ' ').toUpperCase()}.`;
    if (dto.refundedAmount) {
      resolutionMessage += ` A refund of ₦${dto.refundedAmount.toLocaleString()} has been credited to your wallet.`;
    }
    await this.createSystemMessage(disputeId, resolutionMessage);

    // Notify user
    this.disputeGateway.notifyStatusChange(dispute);
    await this.notificationsService.sendPushNotification({
      userId: dispute.userId,
      type: NotificationType.GENERAL,
      title: 'Dispute Resolved',
      body: `Your dispute #${dispute.disputeNumber} has been resolved.`,
      data: { disputeId: dispute.id },
    });

    return this.getDisputeById(disputeId);
  }

  /**
   * Send message in dispute
   */
  async sendMessage(
    disputeId: string,
    senderId: string,
    dto: SendDisputeMessageDto,
    senderType: 'user' | 'admin' | 'farmer' | 'rider',
  ): Promise<DisputeMessage> {
    console.log(`[DisputeService] sendMessage called with disputeId: "${disputeId}" (type: ${typeof disputeId})`);
    
    if (!disputeId || disputeId === 'null' || disputeId === 'undefined') {
      throw new Error(`Invalid disputeId: ${disputeId}`);
    }
    
    const dispute = await this.getDisputeById(disputeId);

    // Access verification is now handled in the controller using canAccessDispute

    // Use query builder to insert directly to avoid TypeORM relation issues
    const insertResult = await this.messageRepository
      .createQueryBuilder()
      .insert()
      .into(DisputeMessage)
      .values({
        disputeId: disputeId,
        senderId: senderId,
        senderType: senderType,
        content: dto.content,
        attachments: dto.attachments || [],
      })
      .execute();
    
    const messageId = insertResult.identifiers[0].id;
    console.log(`[DisputeService] Message inserted with id: ${messageId}`);

    // Update dispute status if non-admin responds while waiting
    if (senderType !== 'admin' && dispute.status === DisputeStatus.AWAITING_RESPONSE) {
      dispute.status = DisputeStatus.UNDER_REVIEW;
      await this.disputeRepository.save(dispute);
    }

    // Fetch the saved message with relations
    const savedMessage = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });
    this.disputeGateway.emitMessage(savedMessage!);

    return savedMessage!;
  }

  /**
   * Create system message
   */
  private async createSystemMessage(disputeId: string, content: string): Promise<void> {
    // Use query builder to insert directly to avoid TypeORM relation issues
    const insertResult = await this.messageRepository
      .createQueryBuilder()
      .insert()
      .into(DisputeMessage)
      .values({
        disputeId: disputeId,
        senderId: null,
        senderType: 'system',
        content: content,
        attachments: [],
      })
      .execute();
    
    const messageId = insertResult.identifiers[0].id;
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });
    
    if (message) {
      this.disputeGateway.emitMessage(message);
    }
  }

  /**
   * Notify admins
   */
  private async notifyAdmins(title: string, message: string): Promise<void> {
    const admins = await this.userRepository.find({
      where: { role: In([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT]) },
    });

    for (const admin of admins) {
      await this.notificationsService.sendPushNotification({
        userId: admin.id,
        type: NotificationType.GENERAL,
        title,
        body: message,
      });
    }
  }

  /**
   * Get dispute statistics (admin)
   */
  async getDisputeStats(): Promise<{
    total: number;
    open: number;
    underReview: number;
    resolved: number;
    avgResolutionTime: number;
    totalRefunded: number;
  }> {
    const total = await this.disputeRepository.count();
    const open = await this.disputeRepository.count({ where: { status: DisputeStatus.OPEN } });
    const underReview = await this.disputeRepository.count({ where: { status: In([DisputeStatus.UNDER_REVIEW, DisputeStatus.AWAITING_RESPONSE]) } });
    const resolved = await this.disputeRepository.count({ where: { status: In([DisputeStatus.RESOLVED, DisputeStatus.CLOSED]) } });

    // Calculate average resolution time
    const resolvedDisputes = await this.disputeRepository.find({
      where: { status: In([DisputeStatus.RESOLVED, DisputeStatus.CLOSED]) },
      select: ['createdAt', 'resolvedAt'],
    });

    let avgResolutionTime = 0;
    if (resolvedDisputes.length > 0) {
      const totalTime = resolvedDisputes.reduce((sum, d) => {
        if (d.resolvedAt) {
          return sum + (new Date(d.resolvedAt).getTime() - new Date(d.createdAt).getTime());
        }
        return sum;
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedDisputes.length / (1000 * 60 * 60)); // hours
    }

    // Calculate total refunded
    const refundResult = await this.disputeRepository
      .createQueryBuilder('dispute')
      .select('SUM(dispute.refundedAmount)', 'total')
      .where('dispute.refundedAmount IS NOT NULL')
      .getRawOne();
    const totalRefunded = parseFloat(refundResult?.total || '0');

    return {
      total,
      open,
      underReview,
      resolved,
      avgResolutionTime,
      totalRefunded,
    };
  }

  /**
   * Get disputes for farmer (disputes involving their products)
   */
  async getFarmerDisputes(farmerId: string, status?: DisputeStatus): Promise<Dispute[]> {
    // Get all orders that contain products from this farmer
    const ordersWithFarmerProducts = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.id')
      .where(`order.items @> :farmerFilter`, { farmerFilter: JSON.stringify([{ farmerId }]) })
      .getMany();

    if (ordersWithFarmerProducts.length === 0) {
      return [];
    }

    const orderIds = ordersWithFarmerProducts.map(o => o.id);

    const where: any = { orderId: In(orderIds) };
    if (status) {
      where.status = status;
    }

    return this.disputeRepository.find({
      where,
      relations: ['user', 'order', 'assignedTo', 'messages', 'messages.sender'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get disputes for rider (disputes involving their deliveries)
   */
  async getRiderDisputes(riderId: string, status?: DisputeStatus): Promise<Dispute[]> {
    // Get all orders assigned to this rider
    const riderOrders = await this.orderRepository.find({
      where: { assignedRiderId: riderId },
      select: ['id'],
    });

    if (riderOrders.length === 0) {
      return [];
    }

    const orderIds = riderOrders.map(o => o.id);

    const where: any = { orderId: In(orderIds) };
    if (status) {
      where.status = status;
    }

    return this.disputeRepository.find({
      where,
      relations: ['user', 'order', 'assignedTo', 'messages', 'messages.sender'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Check if user has access to a dispute (buyer, farmer, rider, or admin)
   */
  async canAccessDispute(disputeId: string, userId: string, userRole: string, farmerId?: string, riderId?: string): Promise<boolean> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ['order'],
    });

    if (!dispute) return false;

    // Admins always have access
    if (['admin', 'superadmin', 'support'].includes(userRole)) {
      return true;
    }

    // Buyer who filed the dispute
    if (dispute.userId === userId) {
      return true;
    }

    // Farmer whose products are in the order
    if (farmerId && dispute.order?.items) {
      const farmerInOrder = dispute.order.items.some((item: any) => item.farmerId === farmerId);
      if (farmerInOrder) return true;
    }

    // Rider assigned to the order
    if (riderId && dispute.order?.assignedRiderId === riderId) {
      return true;
    }

    return false;
  }
}
