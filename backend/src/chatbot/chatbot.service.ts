import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  ChatbotConversation,
  ChatbotConversationStatus,
  ChatbotMessage,
} from '../database/entities/chatbot-conversation.entity';
import { User } from '../database/entities/user.entity';
import { Order } from '../database/entities/order.entity';
import { Product } from '../database/entities/product.entity';
import { SupportService } from '../support/support.service';
import { TicketCategory } from '../database/entities';

interface ChatResponse {
  message: string;
  suggestedActions?: string[];
  shouldEscalate?: boolean;
  escalationReason?: string;
}

// Knowledge base for common questions
const KNOWLEDGE_BASE = {
  greetings: [
    'Hello! Welcome to Handwork support. How can I help you today?',
    'Hi there! I\'m here to assist you. What can I help you with?',
    'Welcome! How may I assist you today?',
  ],
  
  orderStatus: {
    keywords: ['order', 'status', 'where', 'track', 'delivery', 'shipped', 'when'],
    responses: {
      pending: 'Your order is pending confirmation. The farmer will confirm it shortly.',
      created: 'Your order has been created and is awaiting confirmation.',
      confirmed: 'Great news! Your order has been confirmed and is being prepared.',
      preparing: 'Your order is being prepared by the farmer.',
      ready_for_pickup: 'Your order is ready and waiting for a rider to pick it up.',
      rider_assigned: 'A rider has been assigned to deliver your order.',
      assigned: 'A rider has been assigned to deliver your order.',
      picked_up: 'Your order has been picked up and is on the way!',
      in_transit: 'Your order is currently in transit to your location.',
      delivered: 'Your order has been delivered. Enjoy!',
      cancelled: 'This order has been cancelled.',
      refunded: 'This order has been refunded.',
    } as Record<string, string>,
  },

  refund: {
    keywords: ['refund', 'money back', 'return', 'cancel order'],
    response: 'For refund requests, please note:\n• Orders can be cancelled before pickup for a full refund\n• After pickup, contact support for assistance\n• Refunds are processed within 3-5 business days\n\nWould you like me to connect you with a support agent for your refund request?',
  },

  payment: {
    keywords: ['payment', 'pay', 'card', 'wallet', 'transaction', 'failed'],
    response: 'For payment issues:\n• Check your card details are correct\n• Ensure sufficient balance\n• Try using wallet payment as an alternative\n• Wait a few minutes and retry\n\nIf the issue persists, I can connect you with support.',
  },

  delivery: {
    keywords: ['delivery', 'deliver', 'shipping', 'rider', 'late', 'delay'],
    response: 'Regarding delivery:\n• Standard delivery takes 1-3 hours within the same city\n• Track your order in real-time in the app\n• Contact the rider directly for updates\n• Delivery fees vary by distance\n\nIs there a specific delivery concern I can help with?',
  },

  farmer: {
    keywords: ['farmer', 'sell', 'vendor', 'become', 'register'],
    response: 'To become a farmer/vendor on Handwork:\n1. Go to Profile > Become a Farmer\n2. Fill in your farm details\n3. Upload required documents\n4. Wait for approval (usually 24-48 hours)\n\nWould you like more details about selling on Handwork?',
  },

  rider: {
    keywords: ['rider', 'dispatch', 'driver', 'become rider'],
    response: 'To become a Handwork rider:\n1. Go to Profile > Become a Rider\n2. Provide personal information\n3. Add guarantor details\n4. Upload required documents\n5. Complete the verification process\n\nRiders earn competitive rates per delivery!',
  },

  account: {
    keywords: ['account', 'password', 'login', 'profile', 'delete account'],
    response: 'For account-related issues:\n• Reset password: Use "Forgot Password" on login\n• Update profile: Go to Settings > Edit Profile\n• Delete account: Settings > Account > Delete Account\n\nWhat specific account help do you need?',
  },

  contact: {
    keywords: ['contact', 'phone', 'email', 'support', 'help', 'human', 'agent', 'talk to someone'],
    response: 'I can connect you with our support team. Would you like me to create a support ticket for you?',
    shouldEscalate: true,
  },
};

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly openaiApiKey: string;
  private readonly useAI: boolean;

  constructor(
    @InjectRepository(ChatbotConversation)
    private conversationRepository: Repository<ChatbotConversation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private configService: ConfigService,
    private supportService: SupportService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.useAI = !!this.openaiApiKey;
    
    if (!this.useAI) {
      this.logger.warn('OpenAI API key not configured - using rule-based responses');
    }
  }

  /**
   * Start or continue a conversation
   */
  async chat(userId: string, message: string, conversationId?: string): Promise<{
    conversationId: string;
    response: string;
    suggestedActions?: string[];
    escalated?: boolean;
  }> {
    let conversation: ChatbotConversation | null = null;

    if (conversationId) {
      conversation = await this.conversationRepository.findOne({
        where: { id: conversationId, userId },
      });
      
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.status === ChatbotConversationStatus.ESCALATED) {
        throw new BadRequestException('This conversation has been escalated to support');
      }
    }

    if (!conversation) {
      // Create new conversation
      conversation = this.conversationRepository.create({
        userId,
        messages: [],
        status: ChatbotConversationStatus.ACTIVE,
      });
      await this.conversationRepository.save(conversation);
    }

    // Add user message
    const userMessage: ChatbotMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);
    conversation.messageCount++;

    // Generate response
    let chatResponse: ChatResponse;
    
    if (this.useAI) {
      chatResponse = await this.generateAIResponse(conversation, message, userId);
    } else {
      chatResponse = await this.generateRuleBasedResponse(message, userId);
    }

    // Add assistant message
    const assistantMessage: ChatbotMessage = {
      role: 'assistant',
      content: chatResponse.message,
      timestamp: new Date(),
      metadata: {
        suggestedActions: chatResponse.suggestedActions,
      },
    };
    conversation.messages.push(assistantMessage);

    // Handle escalation
    if (chatResponse.shouldEscalate) {
      await this.escalateToSupport(conversation, chatResponse.escalationReason);
    }

    await this.conversationRepository.save(conversation);

    return {
      conversationId: conversation.id,
      response: chatResponse.message,
      suggestedActions: chatResponse.suggestedActions,
      escalated: chatResponse.shouldEscalate,
    };
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateAIResponse(
    conversation: ChatbotConversation,
    message: string,
    userId: string,
  ): Promise<ChatResponse> {
    try {
      // Get user context
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const recentOrders = await this.orderRepository.find({
        where: { buyerId: userId },
        order: { createdAt: 'DESC' },
        take: 3,
      });

      // Build context for AI
      const systemPrompt = `You are a helpful customer support assistant for Handwork, a farm-to-table marketplace app in Nigeria.

User Info:
- Name: ${user?.name || 'Customer'}
- Role: ${user?.role || 'buyer'}

Recent Orders: ${recentOrders.map(o => `#${o.orderNumber} (${o.status})`).join(', ') || 'None'}

Guidelines:
1. Be friendly, helpful, and concise
2. Use Nigerian English where appropriate
3. For order issues, always ask for the order number if not provided
4. For payment issues, suggest using wallet or retrying
5. If you cannot resolve an issue, offer to connect them with human support
6. Never share sensitive information
7. Keep responses under 200 words

Common topics: order tracking, delivery issues, refunds, payments, becoming a farmer/rider`;

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversation.messages.slice(-10).map(m => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: message },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const aiResponse = data.choices[0].message.content;
        
        // Check if escalation is needed
        const escalationKeywords = ['cannot help', 'human support', 'speak to someone', 'support agent', 'escalate'];
        const shouldEscalate = escalationKeywords.some(k => aiResponse.toLowerCase().includes(k));

        return {
          message: aiResponse,
          suggestedActions: this.getSuggestedActions(message),
          shouldEscalate,
          escalationReason: shouldEscalate ? 'AI suggested human support' : undefined,
        };
      }

      // Fallback to rule-based if AI fails
      return this.generateRuleBasedResponse(message, userId);
    } catch (error) {
      this.logger.error(`AI response generation failed: ${error.message}`);
      return this.generateRuleBasedResponse(message, userId);
    }
  }

  /**
   * Generate rule-based response
   */
  private async generateRuleBasedResponse(message: string, userId: string): Promise<ChatResponse> {
    const lowerMessage = message.toLowerCase();

    // Check for greetings
    if (this.matchesKeywords(lowerMessage, ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
      return {
        message: KNOWLEDGE_BASE.greetings[Math.floor(Math.random() * KNOWLEDGE_BASE.greetings.length)],
        suggestedActions: ['Track my order', 'Payment help', 'Delivery info', 'Talk to support'],
      };
    }

    // Check for order status queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.orderStatus.keywords)) {
      // Try to find order number in message
      const orderMatch = message.match(/ORD-[A-Z0-9]+/i);
      if (orderMatch) {
        const order = await this.orderRepository.findOne({
          where: { orderNumber: orderMatch[0].toUpperCase() },
        });
        
        if (order) {
          const statusResponse = KNOWLEDGE_BASE.orderStatus.responses[order.status] || 'Order status unknown';
          return {
            message: `Order #${order.orderNumber}:\n${statusResponse}`,
            suggestedActions: ['View order details', 'Contact rider', 'Report issue'],
          };
        }
      }

      // Check user's recent orders
      const recentOrder = await this.orderRepository.findOne({
        where: { buyerId: userId },
        order: { createdAt: 'DESC' },
      });

      if (recentOrder) {
        const statusResponse = KNOWLEDGE_BASE.orderStatus.responses[recentOrder.status] || 'Order status unknown';
        return {
          message: `Your most recent order #${recentOrder.orderNumber}:\n${statusResponse}\n\nIf you meant a different order, please provide the order number.`,
          suggestedActions: ['View order details', 'Contact rider', 'Track on map'],
        };
      }

      return {
        message: 'Please provide your order number (e.g., ORD-ABC123) so I can check the status for you.',
        suggestedActions: ['View my orders', 'Need help finding order number'],
      };
    }

    // Check for refund queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.refund.keywords)) {
      return {
        message: KNOWLEDGE_BASE.refund.response,
        suggestedActions: ['Cancel my order', 'Talk to support', 'View refund policy'],
        shouldEscalate: lowerMessage.includes('refund'),
      };
    }

    // Check for payment queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.payment.keywords)) {
      return {
        message: KNOWLEDGE_BASE.payment.response,
        suggestedActions: ['Retry payment', 'Add wallet funds', 'Talk to support'],
      };
    }

    // Check for delivery queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.delivery.keywords)) {
      return {
        message: KNOWLEDGE_BASE.delivery.response,
        suggestedActions: ['Track my order', 'Contact rider', 'Report late delivery'],
      };
    }

    // Check for farmer queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.farmer.keywords)) {
      return {
        message: KNOWLEDGE_BASE.farmer.response,
        suggestedActions: ['Start farmer registration', 'Learn more'],
      };
    }

    // Check for rider queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.rider.keywords)) {
      return {
        message: KNOWLEDGE_BASE.rider.response,
        suggestedActions: ['Start rider registration', 'Learn more'],
      };
    }

    // Check for account queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.account.keywords)) {
      return {
        message: KNOWLEDGE_BASE.account.response,
        suggestedActions: ['Reset password', 'Edit profile', 'Contact support'],
      };
    }

    // Check for human support request
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.contact.keywords)) {
      return {
        message: KNOWLEDGE_BASE.contact.response,
        shouldEscalate: true,
        escalationReason: 'User requested human support',
      };
    }

    // Default response
    return {
      message: 'I\'m not sure I understand. Here are some things I can help with:\n\n• Track your order status\n• Payment issues\n• Delivery information\n• Refund requests\n• Becoming a farmer or rider\n\nOr you can say "talk to support" to connect with a human agent.',
      suggestedActions: ['Track order', 'Payment help', 'Delivery info', 'Talk to support'],
    };
  }

  /**
   * Check if message contains any of the keywords
   */
  private matchesKeywords(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  /**
   * Get suggested actions based on message content
   */
  private getSuggestedActions(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('order')) {
      return ['Track order', 'Cancel order', 'Contact rider'];
    }
    if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
      return ['Retry payment', 'Use wallet', 'Contact support'];
    }
    if (lowerMessage.includes('delivery')) {
      return ['Track delivery', 'Contact rider', 'Report issue'];
    }
    
    return ['Track order', 'Payment help', 'Talk to support'];
  }

  /**
   * Escalate conversation to human support
   */
  async escalateToSupport(conversation: ChatbotConversation, reason?: string): Promise<void> {
    // Create support ticket
    const ticket = await this.supportService.createTicket(conversation.userId, {
      subject: `Chatbot Escalation: ${conversation.topic || 'Support Request'}`,
      category: TicketCategory.OTHER,
      initialMessage: `This conversation was escalated from the AI chatbot.\n\nReason: ${reason || 'User requested human support'}\n\n--- Conversation History ---\n${conversation.messages.map(m => `${m.role}: ${m.content}`).join('\n')}`,
      metadata: { chatbotConversationId: conversation.id },
    });

    // Update conversation status
    conversation.status = ChatbotConversationStatus.ESCALATED;
    conversation.escalatedToTicketId = ticket.id;
    await this.conversationRepository.save(conversation);

    this.logger.log(`Conversation ${conversation.id} escalated to ticket ${ticket.id}`);
  }

  /**
   * Get conversation history
   */
  async getConversation(userId: string, conversationId: string): Promise<ChatbotConversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string, limit: number = 10): Promise<ChatbotConversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get active conversation for user
   */
  async getActiveConversation(userId: string): Promise<ChatbotConversation | null> {
    return this.conversationRepository.findOne({
      where: { 
        userId, 
        status: ChatbotConversationStatus.ACTIVE,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * End conversation
   */
  async endConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.status = ChatbotConversationStatus.RESOLVED;
    conversation.resolvedAt = new Date();
    await this.conversationRepository.save(conversation);
  }

  /**
   * Rate conversation
   */
  async rateConversation(
    userId: string,
    conversationId: string,
    rating: number,
    feedback?: string,
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.satisfactionRating = rating;
    if (feedback) {
      conversation.feedback = feedback;
    }
    await this.conversationRepository.save(conversation);
  }

  /**
   * Get quick replies/FAQ
   */
  getQuickReplies(): { question: string; answer: string }[] {
    return [
      { question: 'How do I track my order?', answer: 'Go to Orders in the app and tap on your order to see real-time tracking.' },
      { question: 'How long does delivery take?', answer: 'Delivery typically takes 1-3 hours within the same city.' },
      { question: 'How do I become a farmer?', answer: 'Go to Profile > Become a Farmer and complete the registration process.' },
      { question: 'What payment methods are available?', answer: 'We accept cards, bank transfers, and wallet payments.' },
      { question: 'How do I get a refund?', answer: 'Cancel before pickup for instant refund, or contact support for other cases.' },
    ];
  }
}
