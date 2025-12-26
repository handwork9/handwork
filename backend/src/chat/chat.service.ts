import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation, Message, MessageStatus, MessageType, User } from '../database/entities';
import { CreateConversationDto, SendMessageDto, GetMessagesQueryDto } from './dto';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<any[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participantIds)', { userId })
      .andWhere('NOT (:userId = ANY(COALESCE(conversation.deletedBy, ARRAY[]::uuid[])))', { userId })
      .orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST')
      .getMany();

    // Get participant details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const participants = await this.userRepository.findBy({
          id: In(conv.participantIds),
        });

        const unreadCount = await this.messageRepository.count({
          where: {
            conversationId: conv.id,
            status: In([MessageStatus.SENT, MessageStatus.DELIVERED]),
            senderId: In(conv.participantIds.filter(id => id !== userId)),
          },
        });

        return {
          id: conv.id,
          orderId: conv.orderId,
          participants: participants.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            phone: p.phone,
            avatar: p.avatar,
          })),
          lastMessage: conv.lastMessageText ? {
            id: conv.lastMessageId,
            text: conv.lastMessageText,
            createdAt: conv.lastMessageAt,
          } : null,
          unreadCount,
          isMuted: (conv.mutedBy || []).includes(userId),
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      }),
    );

    return conversationsWithDetails;
  }

  /**
   * Get or create a conversation
   */
  async getOrCreateConversation(
    userId: string,
    userRole: string,
    dto: CreateConversationDto,
  ): Promise<any> {
    // Check if conversation already exists between these participants
    const participantIds = [userId, dto.participantId].sort();
    
    // Build the query to find existing conversation
    let queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.participantIds = :participantIds', { 
        participantIds: `{${participantIds.join(',')}}` 
      });

    // Add orderId or productId condition if provided
    if (dto.orderId) {
      queryBuilder = queryBuilder.andWhere('conversation.orderId = :orderId', { orderId: dto.orderId });
    } else if (dto.productId) {
      queryBuilder = queryBuilder.andWhere('conversation.productId = :productId', { productId: dto.productId });
    }

    let conversation = await queryBuilder.getOne();

    if (!conversation) {
      // Create new conversation
      const newConversation = new Conversation();
      newConversation.orderId = dto.orderId || undefined;
      newConversation.productId = dto.productId || undefined;
      newConversation.participantIds = participantIds;
      conversation = await this.conversationRepository.save(newConversation);
    }

    // Get participant details
    const participants = await this.userRepository.findBy({
      id: In(participantIds),
    });

    return {
      id: conversation.id,
      orderId: conversation.orderId,
      productId: conversation.productId,
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        phone: p.phone,
        avatar: p.avatar,
      })),
      unreadCount: 0,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    userId: string,
    conversationId: string,
    query: GetMessagesQueryDto,
  ): Promise<Message[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createdAt', 'DESC')
      .take(query.limit || 50);

    if (query.before) {
      queryBuilder.andWhere('message.createdAt < :before', { before: new Date(query.before) });
    }

    const messages = await queryBuilder.getMany();
    return messages.reverse(); // Return in chronological order
  }

  /**
   * Send a message
   */
  async sendMessage(
    userId: string,
    userRole: string,
    conversationId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Create message
    const message = this.messageRepository.create({
      conversationId,
      senderId: userId,
      senderRole: userRole,
      text: dto.text,
      type: (dto.type as MessageType) || MessageType.TEXT,
      status: MessageStatus.SENT,
      metadata: dto.metadata,
    });

    await this.messageRepository.save(message);

    // Update conversation with last message
    await this.conversationRepository.update(conversation.id, {
      lastMessageId: message.id,
      lastMessageText: dto.text.substring(0, 100),
      lastMessageAt: message.createdAt,
    });

    // Broadcast message to all participants in the conversation via WebSocket
    this.chatGateway.broadcastMessage(conversationId, {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderRole: message.senderRole,
      text: message.text,
      type: message.type,
      status: message.status,
      metadata: message.metadata,
      createdAt: message.createdAt,
    });

    // Get sender info for notifications
    const sender = await this.userRepository.findOne({ where: { id: userId } });
    const senderName = sender?.name || 'Someone';
    const senderAvatar = sender?.avatar;

    // Also notify each participant directly (in case they're not in the conversation room)
    for (const participantId of conversation.participantIds) {
      if (participantId !== userId) {
        this.chatGateway.notifyUser(participantId, 'chat:new_message', {
          conversationId,
          message: {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderName,
            senderAvatar,
            senderRole: message.senderRole,
            text: message.text,
            type: message.type,
            status: message.status,
            metadata: message.metadata,
            createdAt: message.createdAt,
          },
        });
      }
    }

    return message;
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    userId: string,
    conversationId: string,
    messageIds?: string[],
  ): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const queryBuilder = this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ status: MessageStatus.READ, readAt: new Date() })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('status != :readStatus', { readStatus: MessageStatus.READ });

    if (messageIds && messageIds.length > 0) {
      queryBuilder.andWhere('id IN (:...messageIds)', { messageIds });
    }

    await queryBuilder.execute();
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(userId: string, conversationId: string): Promise<any> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const participants = await this.userRepository.findBy({
      id: In(conversation.participantIds),
    });

    const unreadCount = await this.messageRepository.count({
      where: {
        conversationId: conversation.id,
        status: In([MessageStatus.SENT, MessageStatus.DELIVERED]),
        senderId: In(conversation.participantIds.filter(id => id !== userId)),
      },
    });

    return {
      id: conversation.id,
      orderId: conversation.orderId,
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        phone: p.phone,
        avatar: p.avatar,
      })),
      unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  /**
   * Delete a conversation (soft delete for user - removes from their list)
   */
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Track deleted conversations per user (soft delete)
    const deletedBy = conversation.deletedBy || [];
    if (!deletedBy.includes(userId)) {
      deletedBy.push(userId);
    }

    await this.conversationRepository.update(conversationId, { deletedBy });
  }

  /**
   * Mute/unmute a conversation for a user
   */
  async muteConversation(userId: string, conversationId: string, muted: boolean): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Track muted conversations per user
    let mutedBy = conversation.mutedBy || [];
    if (muted && !mutedBy.includes(userId)) {
      mutedBy.push(userId);
    } else if (!muted) {
      mutedBy = mutedBy.filter((id: string) => id !== userId);
    }

    await this.conversationRepository.update(conversationId, { mutedBy });
  }
}
