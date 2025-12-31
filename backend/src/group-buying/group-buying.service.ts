import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  GroupBuy,
  GroupBuyParticipant,
  GroupBuyStatus,
  GroupBuyParticipantStatus,
  GROUP_BUY_TIERS,
} from '../database/entities/group-buy.entity';
import { Product } from '../database/entities/product.entity';
import { User } from '../database/entities/user.entity';
import { WalletService, DebitWalletDto, CreditWalletDto } from '../wallet/wallet.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import {
  CreateGroupBuyDto,
  UpdateGroupBuyDto,
  JoinGroupBuyDto,
  PayGroupBuyDto,
  QueryGroupBuysDto,
} from './dto';
import { TransactionCategory, WalletOwnerType } from '../database/entities/wallet-transaction.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GroupBuyingService {
  private readonly logger = new Logger(GroupBuyingService.name);

  constructor(
    @InjectRepository(GroupBuy)
    private groupBuyRepository: Repository<GroupBuy>,
    @InjectRepository(GroupBuyParticipant)
    private participantRepository: Repository<GroupBuyParticipant>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateGroupBuyDto): Promise<GroupBuy> {
    this.logger.log(`Creating group buy for userId: ${userId}`);
    this.logger.log(`DTO: ${JSON.stringify(dto)}`);
    
    // Verify userId is valid
    if (!userId) {
      throw new BadRequestException('User ID is required to create a group buy');
    }

    // Verify product exists
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate deadline is in the future
    if (new Date(dto.deadline) <= new Date()) {
      throw new BadRequestException('Deadline must be in the future');
    }

    // Generate share code
    const shareCode = this.generateShareCode();

    // Calculate initial price (no discount yet)
    const groupBuyData = {
      title: dto.title,
      description: dto.description,
      productId: dto.productId,
      organizerId: userId,
      originalPrice: dto.originalPrice,
      currentPrice: dto.originalPrice,
      currentDiscount: 0,
      currentParticipants: 1, // Organizer counts as first participant
      shareCode,
      minParticipants: dto.minParticipants || 3,
      maxParticipants: dto.maxParticipants,
      quantityPerPerson: dto.quantityPerPerson || 1,
      deadline: dto.deadline,
      isPublic: dto.isPublic !== false,
      deliveryOptions: dto.deliveryOptions,
    };
    
    this.logger.log(`Group buy data before save: ${JSON.stringify(groupBuyData)}`);
    
    const groupBuy = this.groupBuyRepository.create(groupBuyData);

    const savedGroupBuy = await this.groupBuyRepository.save(groupBuy);

    // Add organizer as first participant
    const organizerParticipant = this.participantRepository.create({
      groupBuyId: savedGroupBuy.id,
      userId,
      quantity: dto.quantityPerPerson || 1,
      priceAtJoin: dto.originalPrice,
      isOrganizer: true,
      status: GroupBuyParticipantStatus.JOINED,
    });
    await this.participantRepository.save(organizerParticipant);

    return this.findOne(savedGroupBuy.id);
  }

  async findAll(query: QueryGroupBuysDto): Promise<{
    groupBuys: GroupBuy[];
    total: number;
  }> {
    const queryBuilder = this.groupBuyRepository
      .createQueryBuilder('gb')
      .leftJoinAndSelect('gb.product', 'product')
      .leftJoinAndSelect('gb.organizer', 'organizer')
      .where('gb.isPublic = :isPublic', { isPublic: true });

    if (query.status) {
      queryBuilder.andWhere('gb.status = :status', { status: query.status });
    } else {
      queryBuilder.andWhere('gb.status = :status', { status: GroupBuyStatus.ACTIVE });
    }

    if (query.productId) {
      queryBuilder.andWhere('gb.productId = :productId', { productId: query.productId });
    }

    if (query.category) {
      queryBuilder.andWhere('product.category = :category', { category: query.category });
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy('gb.deadline', 'ASC')
      .skip(query.offset || 0)
      .take(query.limit || 20);

    const groupBuys = await queryBuilder.getMany();

    // Add next tier info
    const enrichedGroupBuys = groupBuys.map((gb) => ({
      ...gb,
      nextTier: this.getNextTier(gb.currentParticipants),
    }));

    return { groupBuys: enrichedGroupBuys as GroupBuy[], total };
  }

  async findOne(id: string): Promise<GroupBuy> {
    const groupBuy = await this.groupBuyRepository.findOne({
      where: { id },
      relations: ['product', 'organizer', 'participants', 'participants.user'],
    });

    if (!groupBuy) {
      throw new NotFoundException('Group buy not found');
    }

    return {
      ...groupBuy,
      nextTier: this.getNextTier(groupBuy.currentParticipants),
    } as GroupBuy;
  }

  async findByShareCode(shareCode: string): Promise<GroupBuy> {
    const groupBuy = await this.groupBuyRepository.findOne({
      where: { shareCode },
      relations: ['product', 'organizer', 'participants', 'participants.user'],
    });

    if (!groupBuy) {
      throw new NotFoundException('Group buy not found');
    }

    return groupBuy;
  }

  async update(id: string, userId: string, dto: UpdateGroupBuyDto): Promise<GroupBuy> {
    const groupBuy = await this.findOne(id);

    if (groupBuy.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can update this group buy');
    }

    if (groupBuy.status !== GroupBuyStatus.ACTIVE) {
      throw new BadRequestException('Cannot update a non-active group buy');
    }

    Object.assign(groupBuy, dto);
    await this.groupBuyRepository.save(groupBuy);

    return this.findOne(id);
  }

  async join(id: string, userId: string, dto: JoinGroupBuyDto): Promise<GroupBuyParticipant> {
    const groupBuy = await this.findOne(id);

    if (groupBuy.status !== GroupBuyStatus.ACTIVE) {
      throw new BadRequestException('This group buy is no longer active');
    }

    if (new Date(groupBuy.deadline) < new Date()) {
      throw new BadRequestException('This group buy has ended');
    }

    if (groupBuy.maxParticipants && groupBuy.currentParticipants >= groupBuy.maxParticipants) {
      throw new BadRequestException('This group buy is full');
    }

    // Check if user already joined
    const existingParticipant = await this.participantRepository.findOne({
      where: { groupBuyId: id, userId },
    });

    if (existingParticipant) {
      throw new BadRequestException('You have already joined this group buy');
    }

    // Create participant
    const participant = this.participantRepository.create({
      groupBuyId: id,
      userId,
      quantity: dto.quantity || groupBuy.quantityPerPerson,
      priceAtJoin: groupBuy.currentPrice,
      deliveryPreference: dto.deliveryPreference,
      deliveryAddress: dto.deliveryAddress,
      status: GroupBuyParticipantStatus.JOINED,
    });

    await this.participantRepository.save(participant);

    // Update participant count and recalculate discount
    groupBuy.currentParticipants += 1;
    const newDiscount = this.calculateDiscount(groupBuy.currentParticipants);
    
    if (newDiscount > groupBuy.currentDiscount) {
      groupBuy.currentDiscount = newDiscount;
      groupBuy.currentPrice = Number(groupBuy.originalPrice) * (1 - newDiscount / 100);
      
      // Notify all participants about the new discount
      await this.notifyParticipantsAboutDiscount(groupBuy);
    }

    await this.groupBuyRepository.save(groupBuy);

    // Notify organizer
    await this.notificationsService.sendPushNotification({
      userId: groupBuy.organizerId,
      type: NotificationType.GENERAL,
      title: 'New Participant Joined!',
      body: `Someone joined your group buy "${groupBuy.title}". Current participants: ${groupBuy.currentParticipants}`,
      data: { type: 'group_buy_join', groupBuyId: id },
    });

    const result = await this.participantRepository.findOne({
      where: { id: participant.id },
      relations: ['user'],
    });

    return result!;
  }

  async leave(id: string, userId: string): Promise<void> {
    const groupBuy = await this.findOne(id);

    if (groupBuy.organizerId === userId) {
      throw new BadRequestException('Organizer cannot leave. Cancel the group buy instead.');
    }

    const participant = await this.participantRepository.findOne({
      where: { groupBuyId: id, userId },
    });

    if (!participant) {
      throw new NotFoundException('You are not a participant in this group buy');
    }

    if (participant.status === GroupBuyParticipantStatus.PAID) {
      throw new BadRequestException('Cannot leave after payment. Contact support for refund.');
    }

    await this.participantRepository.remove(participant);

    // Update participant count
    groupBuy.currentParticipants -= 1;
    const newDiscount = this.calculateDiscount(groupBuy.currentParticipants);
    groupBuy.currentDiscount = newDiscount;
    groupBuy.currentPrice = Number(groupBuy.originalPrice) * (1 - newDiscount / 100);

    await this.groupBuyRepository.save(groupBuy);
  }

  async pay(id: string, userId: string, dto: PayGroupBuyDto): Promise<GroupBuyParticipant> {
    const groupBuy = await this.findOne(id);
    
    if (groupBuy.status !== GroupBuyStatus.ACTIVE) {
      throw new BadRequestException('This group buy is no longer active');
    }

    const participant = await this.participantRepository.findOne({
      where: { groupBuyId: id, userId },
    });

    if (!participant) {
      throw new NotFoundException('You are not a participant in this group buy');
    }

    if (participant.status === GroupBuyParticipantStatus.PAID) {
      throw new BadRequestException('You have already paid');
    }

    // Get user's wallet balance
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalAmount = Number(groupBuy.currentPrice) * participant.quantity;
    const balance = Number(user.walletBalance) || 0;
    
    if (balance < totalAmount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Deduct from wallet
    const debitDto: DebitWalletDto = {
      ownerId: userId,
      ownerType: WalletOwnerType.USER,
      amount: totalAmount,
      category: TransactionCategory.GROUP_BUY,
      description: `Group Buy Payment - ${groupBuy.title}`,
      metadata: { groupBuyId: id, participantId: participant.id },
    };
    await this.walletService.debitWallet(debitDto);

    // Update participant
    participant.status = GroupBuyParticipantStatus.PAID;
    participant.amountPaid = totalAmount;
    participant.finalPrice = groupBuy.currentPrice;
    participant.paymentReference = dto.paymentReference;

    await this.participantRepository.save(participant);

    // Check if minimum participants met
    const paidParticipants = await this.participantRepository.count({
      where: { groupBuyId: id, status: GroupBuyParticipantStatus.PAID },
    });

    // Notify success
    await this.notificationsService.sendPushNotification({
      userId,
      type: NotificationType.GENERAL,
      title: 'Payment Successful!',
      body: `Your payment for "${groupBuy.title}" was successful.${paidParticipants >= groupBuy.minParticipants ? ' Group buy target reached!' : ''}`,
      data: { type: 'group_buy_payment', groupBuyId: id },
    });

    const result = await this.participantRepository.findOne({
      where: { id: participant.id },
      relations: ['user'],
    });

    return result!;
  }

  async cancel(id: string, userId: string): Promise<GroupBuy> {
    const groupBuy = await this.findOne(id);

    if (groupBuy.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can cancel this group buy');
    }

    if (groupBuy.status !== GroupBuyStatus.ACTIVE) {
      throw new BadRequestException('Cannot cancel a non-active group buy');
    }

    // Refund all paid participants
    const paidParticipants = await this.participantRepository.find({
      where: { groupBuyId: id, status: GroupBuyParticipantStatus.PAID },
    });

    for (const participant of paidParticipants) {
      if (participant.amountPaid) {
        // Credit back to wallet
        const creditDto: CreditWalletDto = {
          ownerId: participant.userId,
          ownerType: WalletOwnerType.USER,
          amount: Number(participant.amountPaid),
          category: TransactionCategory.GROUP_BUY,
          description: `Refund - Group Buy "${groupBuy.title}" cancelled`,
          metadata: { groupBuyId: id },
        };
        await this.walletService.creditWallet(creditDto);

        participant.status = GroupBuyParticipantStatus.REFUNDED;
        await this.participantRepository.save(participant);

        // Notify about refund
        await this.notificationsService.sendPushNotification({
          userId: participant.userId,
          type: NotificationType.GENERAL,
          title: 'Group Buy Cancelled',
          body: `The group buy "${groupBuy.title}" has been cancelled. Your payment has been refunded.`,
          data: { type: 'group_buy_cancelled', groupBuyId: id },
        });
      }
    }

    groupBuy.status = GroupBuyStatus.CANCELLED;
    await this.groupBuyRepository.save(groupBuy);

    return this.findOne(id);
  }

  async getMyGroupBuys(userId: string): Promise<{
    organized: GroupBuy[];
    joined: GroupBuy[];
  }> {
    // Group buys organized by user
    const organized = await this.groupBuyRepository.find({
      where: { organizerId: userId },
      relations: ['product', 'participants'],
      order: { createdAt: 'DESC' },
    });

    // Group buys joined by user (not as organizer)
    const participations = await this.participantRepository.find({
      where: { userId, isOrganizer: false },
      relations: ['groupBuy', 'groupBuy.product', 'groupBuy.organizer'],
    });

    const joined = participations.map((p) => p.groupBuy);

    return { organized, joined };
  }

  async getParticipants(id: string): Promise<GroupBuyParticipant[]> {
    return this.participantRepository.find({
      where: { groupBuyId: id },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  // Cron job to check for ended group buys
  @Cron(CronExpression.EVERY_HOUR)
  async processEndedGroupBuys(): Promise<void> {
    this.logger.log('Processing ended group buys...');
    
    const endedGroupBuys = await this.groupBuyRepository.find({
      where: {
        status: GroupBuyStatus.ACTIVE,
        deadline: LessThan(new Date()),
      },
      relations: ['participants'],
    });

    for (const groupBuy of endedGroupBuys) {
      try {
        const paidParticipants = groupBuy.participants.filter(
          (p: GroupBuyParticipant) => p.status === GroupBuyParticipantStatus.PAID,
        );

        if (paidParticipants.length >= groupBuy.minParticipants) {
          // Success - notify all paid participants
          groupBuy.status = GroupBuyStatus.SUCCESS;
          
          for (const participant of paidParticipants) {
            await this.notificationsService.sendPushNotification({
              userId: participant.userId,
              type: NotificationType.GENERAL,
              title: 'Group Buy Successful! 🎉',
              body: `"${groupBuy.title}" reached its target! Your order will be processed soon.`,
              data: { type: 'group_buy_success', groupBuyId: groupBuy.id },
            });
          }
        } else {
          // Failed - refund all paid participants
          groupBuy.status = GroupBuyStatus.FAILED;

          for (const participant of paidParticipants) {
            if (participant.amountPaid) {
              // Credit back to wallet
              const creditDto: CreditWalletDto = {
                ownerId: participant.userId,
                ownerType: WalletOwnerType.USER,
                amount: Number(participant.amountPaid),
                category: TransactionCategory.GROUP_BUY,
                description: `Refund - Group Buy "${groupBuy.title}" did not reach target`,
                metadata: { groupBuyId: groupBuy.id },
              };
              await this.walletService.creditWallet(creditDto);

              participant.status = GroupBuyParticipantStatus.REFUNDED;
              await this.participantRepository.save(participant);

              await this.notificationsService.sendPushNotification({
                userId: participant.userId,
                type: NotificationType.GENERAL,
                title: 'Group Buy Did Not Reach Target',
                body: `"${groupBuy.title}" did not reach the minimum participants. Your payment has been refunded.`,
                data: { type: 'group_buy_failed', groupBuyId: groupBuy.id },
              });
            }
          }
        }

        await this.groupBuyRepository.save(groupBuy);
        this.logger.log(`Processed group buy ${groupBuy.id} - status: ${groupBuy.status}`);
      } catch (error) {
        this.logger.error(`Error processing group buy ${groupBuy.id}: ${error.message}`);
      }
    }
  }

  // Helper methods
  private generateShareCode(): string {
    return uuidv4().substring(0, 8).toUpperCase();
  }

  private calculateDiscount(participants: number): number {
    let discount = 0;
    for (const tier of GROUP_BUY_TIERS) {
      if (participants >= tier.minParticipants) {
        discount = tier.discount;
      }
    }
    return discount;
  }

  private getNextTier(
    currentParticipants: number,
  ): { participantsNeeded: number; discount: number } | null {
    for (const tier of GROUP_BUY_TIERS) {
      if (currentParticipants < tier.minParticipants) {
        return {
          participantsNeeded: tier.minParticipants - currentParticipants,
          discount: tier.discount,
        };
      }
    }
    return null; // Already at max tier
  }

  private async notifyParticipantsAboutDiscount(groupBuy: GroupBuy): Promise<void> {
    const participants = await this.participantRepository.find({
      where: { groupBuyId: groupBuy.id },
    });

    for (const participant of participants) {
      await this.notificationsService.sendPushNotification({
        userId: participant.userId,
        type: NotificationType.GENERAL,
        title: 'Discount Unlocked! 🎊',
        body: `"${groupBuy.title}" now has ${groupBuy.currentDiscount}% off! Price dropped to ₦${Number(groupBuy.currentPrice).toLocaleString()}`,
        data: { type: 'group_buy_discount', groupBuyId: groupBuy.id },
      });
    }
  }
}
