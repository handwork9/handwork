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
    "Hello! 👋 Welcome to Handwork support. I'm your AI assistant, and I'm here to help you with:\n\n📦 Order tracking & delivery\n💳 Payments & wallet\n🎁 Coupons & rewards\n👨‍🌾 Becoming a farmer\n🚴 Becoming a rider\n\nHow can I assist you today?",
    "Hi there! 👋 I'm your Handwork AI assistant. I can help you with orders, payments, deliveries, and more.\n\nWhat would you like help with?",
    "Welcome to Handwork! 🌱 I'm here to make your experience smooth. Whether it's tracking orders, resolving issues, or learning about our services - I've got you covered!\n\nHow may I help you?",
  ],
  
  orderStatus: {
    keywords: ['order', 'status', 'where', 'track', 'delivery', 'shipped', 'when', 'my order'],
    responses: {
      pending: '⏳ **Status: Pending**\nYour order is awaiting confirmation from the farmer. They usually respond within 30 minutes.',
      created: '📝 **Status: Created**\nYour order has been placed and is waiting for the farmer to confirm.',
      confirmed: '✅ **Status: Confirmed**\nGreat news! The farmer has confirmed your order and is now preparing it.',
      preparing: '👨‍🍳 **Status: Preparing**\nYour order is being carefully prepared by the farmer. Almost ready!',
      ready_for_pickup: '📦 **Status: Ready for Pickup**\nYour order is packed and waiting for a rider to collect it.',
      rider_assigned: '🚴 **Status: Rider Assigned**\nA delivery rider has been assigned and will pick up your order shortly.',
      assigned: '🚴 **Status: Rider Assigned**\nA delivery rider has been assigned and will pick up your order shortly.',
      picked_up: '🛵 **Status: Picked Up**\nYour order is on the way! Track the rider in real-time on the app.',
      in_transit: '🚚 **Status: In Transit**\nYour order is on its way to you. You can track the rider live!',
      delivered: '🎉 **Status: Delivered**\nYour order has been delivered successfully. Enjoy your fresh produce!',
      cancelled: '❌ **Status: Cancelled**\nThis order has been cancelled. Any payment will be refunded to your wallet.',
      refunded: '💰 **Status: Refunded**\nThis order has been refunded. Check your wallet for the credit.',
    } as Record<string, string>,
  },

  refund: {
    keywords: ['refund', 'money back', 'return', 'cancel order', 'get my money'],
    response: '💰 **Refund Information**\n\n**Before Pickup:**\n• Cancel anytime for a full refund\n• Go to Orders → Select order → Cancel\n\n**After Pickup:**\n• Contact support for assistance\n• Partial refunds may apply\n\n**Refund Timeline:**\n• Wallet: Instant\n• Card/Bank: 3-5 business days\n\n⚠️ For quality issues, report within 24 hours with photos.\n\nWould you like me to connect you with support?',
  },

  payment: {
    keywords: ['payment', 'pay', 'card', 'transaction', 'failed', 'payment failed', 'cant pay', 'not working'],
    response: '💳 **Payment Troubleshooting**\n\n**Quick Fixes:**\n1. ✅ Verify card details are correct\n2. ✅ Check sufficient balance\n3. ✅ Try a different card\n4. ✅ Use Handwork Wallet instead\n\n**Still Failing?**\n• Clear app cache & retry\n• Wait 5 minutes before retrying\n• Check with your bank for blocks\n\n**Alternative Payment:**\n💡 Top up your Handwork Wallet for instant, hassle-free payments!\n\nNeed more help?',
  },

  delivery: {
    keywords: ['delivery', 'deliver', 'shipping', 'late', 'delay', 'not arrived', 'taking long'],
    response: '🚚 **Delivery Information**\n\n**Delivery Times:**\n• Same City: 1-3 hours\n• Peak Hours: May take longer\n\n**Track Your Order:**\n1. Go to Orders tab\n2. Tap your order\n3. View live rider location\n\n**Delivery Fees:**\n• Based on distance (₦200-₦1000)\n• Premium members: FREE delivery!\n\n**Running Late?**\n• Contact rider directly from the app\n• Check traffic conditions\n\nAnything specific I can help with?',
  },

  farmer: {
    keywords: ['farmer', 'sell', 'vendor', 'become farmer', 'register as farmer', 'start selling'],
    response: '👨‍🌾 **Become a Handwork Farmer**\n\n**Benefits:**\n• Earn up to 90% per sale\n• Reach thousands of customers\n• Free listing & promotion tools\n• Flexible schedule\n\n**How to Register:**\n1. Go to Profile → Become a Farmer\n2. Fill in your farm details\n3. Upload documents (ID + farm photos)\n4. Submit for review\n\n**Approval Time:** 24-48 hours\n\n**Requirements:**\n• Valid ID\n• Farm/business registration (optional)\n• Quality product photos\n\nReady to start selling?',
  },

  rider: {
    keywords: ['rider', 'dispatch', 'driver', 'become rider', 'delivery job', 'deliver for handwork'],
    response: '🚴 **Become a Handwork Rider**\n\n**Earnings:**\n• Competitive pay per delivery\n• Keep 100% of tips\n• Weekly bonuses\n• Flexible hours\n\n**Requirements:**\n• Valid ID\n• Smartphone with internet\n• Own vehicle (bike/motorcycle)\n• Guarantor information\n\n**How to Apply:**\n1. Profile → Become a Rider\n2. Complete application form\n3. Upload documents\n4. Background verification\n\n**Approval:** Usually 2-3 days\n\nReady to ride with us?',
  },

  account: {
    keywords: ['account', 'password', 'login', 'profile', 'delete account', 'change email', 'change phone'],
    response: '👤 **Account Help**\n\n**Common Actions:**\n\n🔐 **Reset Password:**\nLogin screen → Forgot Password → Enter email/phone\n\n✏️ **Update Profile:**\nProfile → Settings → Edit Profile\n\n📱 **Change Phone/Email:**\nSettings → Edit Profile → Update contact\n\n🗑️ **Delete Account:**\nSettings → Account → Delete Account\n(Warning: This is permanent!)\n\n**Security Tips:**\n• Enable 2FA for extra protection\n• Set a transaction PIN\n\nWhat would you like to do?',
  },

  contact: {
    keywords: ['contact', 'phone', 'email', 'support', 'help', 'human', 'agent', 'talk to someone', 'speak to', 'real person'],
    response: '👨‍💼 **Connect with Human Support**\n\nI can connect you with our support team right away.\n\n**Support Hours:**\n• Live Chat: 8am - 10pm daily\n• Email: support@handwork.ng\n\n**Average Response:**\n• Live Chat: Under 5 minutes\n• Email: Within 24 hours\n\nWould you like me to create a support ticket for you?',
    shouldEscalate: true,
  },

  // Wallet & Finance
  wallet: {
    keywords: ['wallet', 'balance', 'top up', 'add money', 'fund', 'topup', 'withdraw', 'withdrawal'],
    response: '💰 **Handwork Wallet**\n\n**Top Up:**\n1. Wallet → Top Up\n2. Enter amount\n3. Pay with card/bank transfer\n\n**Withdraw:**\n1. Wallet → Withdraw\n2. Enter amount\n3. Select bank account\n4. Confirm with PIN\n\n**Benefits:**\n✅ Instant payments\n✅ No transaction failures\n✅ Earn cashback on orders\n✅ Easy refunds\n\n**Transfer:**\nSend money to other Handwork users instantly!\n\nHow can I help with your wallet?',
  },

  // Rewards & Points
  rewards: {
    keywords: ['reward', 'points', 'earn', 'cashback', 'bonus', 'loyalty', 'referral bonus'],
    response: '🎁 **Handwork Rewards**\n\n**Earn Points:**\n• Every ₦100 spent = 1 point\n• Complete challenges for bonus\n• Refer friends for extra rewards\n\n**Redeem Points:**\n• 100 points = ₦50 discount\n• Use at checkout\n\n**Cashback:**\n• Up to 5% on orders\n• 10% for Premium members\n\n**Referral Program:**\n• Share your code\n• Get ₦500 when friend orders\n• Friend gets ₦500 too!\n\nCheck rewards: Profile → Rewards',
  },

  // Coupons & Discounts
  coupons: {
    keywords: ['coupon', 'discount', 'promo', 'code', 'voucher', 'offer', 'deal', 'save money'],
    response: '🎟️ **Coupons & Discounts**\n\n**Find Coupons:**\nHome → Menu → Coupons\n\n**How to Apply:**\n1. Add items to cart\n2. Go to checkout\n3. Tap "Apply Coupon"\n4. Enter code or select available\n\n**Types of Discounts:**\n• % off entire order\n• ₦ off specific amount\n• Free delivery\n• Category-specific\n\n**Pro Tips:**\n💡 Check expiry dates\n💡 Some have minimum order\n💡 New coupons added weekly!\n\nWant to see available coupons?',
  },

  // Group Buying
  groupBuying: {
    keywords: ['group buy', 'group buying', 'bulk', 'together', 'group order', 'share order', 'split'],
    response: '👥 **Group Buying**\n\n**What is it?**\nBuy together with others for bulk discounts!\n\n**How it Works:**\n1. Browse group buys or create one\n2. Share with friends/neighbors\n3. Reach target quantity\n4. Everyone saves 10-30%!\n\n**Perfect For:**\n• Families buying together\n• Office orders\n• Neighborhood groups\n\n**Benefits:**\n✅ Lower prices\n✅ Fresher bulk produce\n✅ Split delivery costs\n\nExplore: Home → Group Buying',
  },

  // Subscription Boxes
  subscription: {
    keywords: ['subscription', 'subscribe', 'weekly', 'monthly', 'regular delivery', 'auto order', 'box'],
    response: '📦 **Subscription Boxes**\n\n**Plans:**\n• Weekly: Fresh produce every week\n• Bi-weekly: Every 2 weeks\n• Monthly: Once a month\n\n**Customize:**\n• Choose box size\n• Select preferences\n• Add/remove items\n\n**Savings:**\n• Up to 15% off regular prices\n• Free delivery on subscription\n\n**Flexibility:**\n• Pause anytime\n• Skip a delivery\n• Cancel when you want\n\nSetup: Home → Subscription Box',
  },

  // Shopping Lists
  shoppingList: {
    keywords: ['shopping list', 'list', 'save items', 'favorites', 'wishlist', 'save for later'],
    response: '📝 **Shopping Lists**\n\n**Create Lists:**\n• Weekly Groceries\n• Party Supplies\n• Office Snacks\n• And more!\n\n**Features:**\n✅ Share with family\n✅ Quick add to cart\n✅ Set reorder reminders\n✅ Track prices\n\n**How to Use:**\n1. Home → Shopping Lists\n2. Create new list\n3. Add products\n4. Shop with one tap!\n\n**Pro Tip:**\nShare lists with household members for coordinated shopping.',
  },

  // Product Quality
  quality: {
    keywords: ['quality', 'fresh', 'bad', 'spoiled', 'rotten', 'expired', 'damaged', 'wrong item'],
    response: '⚠️ **Quality Issue Report**\n\n**What to Do:**\n1. 📸 Take clear photos immediately\n2. Keep the product\n3. Report within 24 hours\n\n**How to Report:**\nOrders → Select order → Report Issue → Quality Problem → Upload photos\n\n**Resolution Options:**\n• Full refund\n• Free replacement\n• Partial credit\n\n**Our Promise:**\n🛡️ 100% Quality Guarantee\nWe take product quality seriously!\n\nWant me to help you report an issue?',
  },

  // Pricing
  pricing: {
    keywords: ['price', 'expensive', 'cost', 'fee', 'charge', 'how much', 'pricing'],
    response: '💵 **Pricing Guide**\n\n**Product Prices:**\n• Set by farmers (competitive rates)\n• Compare across sellers\n\n**Fees:**\n• Delivery: ₦200-₦1000 (distance-based)\n• Service fee: 5% of order\n• No hidden charges!\n\n**Save Money:**\n✅ Use coupons\n✅ Join group buys\n✅ Subscribe for discounts\n✅ Go Premium = Free delivery\n\n**Price Match:**\nFound it cheaper? Let us know!',
  },

  // Premium/Go Premium
  premium: {
    keywords: ['premium', 'go premium', 'membership', 'free delivery', 'vip', 'subscribe premium'],
    response: '⭐ **Handwork Premium**\n\n**Benefits:**\n🚚 FREE delivery on ALL orders\n💬 Priority customer support\n🎁 Exclusive discounts\n⏰ Early access to deals\n💰 Higher cashback (10%)\n🏷️ Premium badge\n\n**Plans:**\n• Monthly: ₦2,999/month\n• Yearly: ₦24,999/year (Save 30%!)\n\n**Worth It If:**\n• You order 3+ times/month\n• Average order over ₦5,000\n\nUpgrade: Profile → Go Premium',
  },

  // App Help
  appHelp: {
    keywords: ['app', 'crash', 'bug', 'slow', 'not loading', 'error', 'update', 'version'],
    response: '📱 **App Troubleshooting**\n\n**Quick Fixes:**\n1. Update to latest version\n2. Settings → Clear Cache\n3. Check internet connection\n4. Restart the app\n5. Restart your phone\n\n**Still Not Working?**\n• Uninstall & reinstall\n• Check storage space\n• Try on WiFi\n\n**Report a Bug:**\nHelp → Report Bug → Describe issue\n\n**Current Version:**\nCheck: Profile → About → Version\n\nNeed more help?',
  },

  // Security
  security: {
    keywords: ['security', 'hack', 'stolen', 'unauthorized', 'suspicious', 'fraud', 'scam', '2fa', 'pin'],
    response: '🔐 **Account Security**\n\n**Protect Your Account:**\n\n📱 **Enable 2FA:**\nSettings → Security → Two-Factor Auth\n\n🔢 **Set Transaction PIN:**\nSettings → Security → Set PIN\n\n⚠️ **Never Share:**\n• OTP codes\n• Transaction PIN\n• Password\n\n**Red Flags:**\n❌ Handwork never asks for passwords\n❌ Don\'t click suspicious links\n❌ Verify official communications\n\n**Suspect Fraud?**\n🚨 Contact support IMMEDIATELY!\n\nIs your account compromised?',
  },

  // Location & Address
  address: {
    keywords: ['address', 'location', 'change address', 'add address', 'delivery address', 'wrong address'],
    response: '📍 **Managing Addresses**\n\n**Add New Address:**\nProfile → My Addresses → Add Address\n\n**Set Default:**\nTap address → Set as Default\n\n**Edit/Delete:**\nTap address → Edit or Delete\n\n**Tips for Better Delivery:**\n✅ Include landmarks\n✅ Add building/floor number\n✅ Provide gate code if needed\n✅ Add delivery instructions\n\n**Multiple Addresses:**\n• Home\n• Work\n• Family\n• Friends\n\nNeed help with an address?',
  },

  // Notifications
  notifications: {
    keywords: ['notification', 'alert', 'message', 'not receiving', 'too many', 'turn off'],
    response: '🔔 **Notification Settings**\n\n**Manage Notifications:**\nProfile → Settings → Notifications\n\n**Types:**\n• Order updates (Recommended ON)\n• Promotions & deals\n• Chat messages\n• Price alerts\n\n**Not Receiving?**\n1. Check phone settings\n2. Enable push notifications\n3. Check spam folder (email)\n4. Update app\n\n**Too Many?**\nCustomize which notifications you receive in settings.\n\nWhat would you like to adjust?',
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
      const systemPrompt = `You are a helpful, friendly customer support assistant for Handwork, a farm-to-table marketplace app in Nigeria.

**User Info:**
- Name: ${user?.name || 'Customer'}
- Role: ${user?.role || 'buyer'}
- Recent Orders: ${recentOrders.map(o => `#${o.orderNumber} (${o.status})`).join(', ') || 'None'}

**Response Guidelines:**
1. Be warm, friendly, and helpful - use emojis appropriately 😊
2. Use Nigerian English where appropriate (e.g., "How may I assist you today?")
3. Structure responses clearly with bullet points or numbered steps
4. Use **bold** for important information and section headers
5. Keep responses concise but informative (under 200 words)
6. Always provide actionable next steps

**Formatting Rules:**
- Use emojis for visual appeal (📦 🚚 💰 ✅ ⚠️ 💡)
- Use **bold** for headers and key terms
- Use bullet points (•) for lists
- Use numbered steps (1. 2. 3.) for instructions
- Add helpful tips with 💡

**Topic-Specific Guidance:**
- Order issues: Ask for order number if not provided, check status
- Payments: Suggest wallet as alternative, explain retry steps
- Delivery: Provide tracking info, estimated times
- Refunds: Explain policy, timelines, process
- Becoming farmer/rider: Guide through registration steps
- Premium: Highlight free delivery and other benefits

**Escalation:**
If you cannot resolve the issue, offer: "Would you like me to connect you with our support team for further assistance?"

Never share sensitive information or make promises outside policy.`;

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
          max_tokens: 400,
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

    // NEW: Check for wallet queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.wallet.keywords)) {
      return {
        message: KNOWLEDGE_BASE.wallet.response,
        suggestedActions: ['Top up wallet', 'Withdraw funds', 'View balance'],
      };
    }

    // NEW: Check for rewards queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.rewards.keywords)) {
      return {
        message: KNOWLEDGE_BASE.rewards.response,
        suggestedActions: ['View rewards', 'Redeem points', 'Refer a friend'],
      };
    }

    // NEW: Check for coupon queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.coupons.keywords)) {
      return {
        message: KNOWLEDGE_BASE.coupons.response,
        suggestedActions: ['View coupons', 'How to apply', 'Get new codes'],
      };
    }

    // NEW: Check for group buying queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.groupBuying.keywords)) {
      return {
        message: KNOWLEDGE_BASE.groupBuying.response,
        suggestedActions: ['Browse group buys', 'Create group buy', 'Invite friends'],
      };
    }

    // NEW: Check for subscription queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.subscription.keywords)) {
      return {
        message: KNOWLEDGE_BASE.subscription.response,
        suggestedActions: ['View plans', 'Create subscription', 'Manage subscription'],
      };
    }

    // NEW: Check for shopping list queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.shoppingList.keywords)) {
      return {
        message: KNOWLEDGE_BASE.shoppingList.response,
        suggestedActions: ['View lists', 'Create new list', 'Share list'],
      };
    }

    // NEW: Check for quality queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.quality.keywords)) {
      return {
        message: KNOWLEDGE_BASE.quality.response,
        suggestedActions: ['Report issue', 'Request refund', 'Contact support'],
        shouldEscalate: true,
      };
    }

    // NEW: Check for pricing queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.pricing.keywords)) {
      return {
        message: KNOWLEDGE_BASE.pricing.response,
        suggestedActions: ['View pricing', 'Go premium', 'Compare farmers'],
      };
    }

    // NEW: Check for premium queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.premium.keywords)) {
      return {
        message: KNOWLEDGE_BASE.premium.response,
        suggestedActions: ['Go premium', 'View benefits', 'Check price'],
      };
    }

    // NEW: Check for app help queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.appHelp.keywords)) {
      return {
        message: KNOWLEDGE_BASE.appHelp.response,
        suggestedActions: ['Update app', 'Clear cache', 'Contact support'],
      };
    }

    // NEW: Check for security queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.security.keywords)) {
      return {
        message: KNOWLEDGE_BASE.security.response,
        suggestedActions: ['Enable 2FA', 'Set PIN', 'Report fraud'],
        shouldEscalate: lowerMessage.includes('hack') || lowerMessage.includes('fraud') || lowerMessage.includes('stolen'),
      };
    }

    // NEW: Check for address queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.address.keywords)) {
      return {
        message: KNOWLEDGE_BASE.address.response,
        suggestedActions: ['Add address', 'Edit address', 'Set default'],
      };
    }

    // NEW: Check for notification queries
    if (this.matchesKeywords(lowerMessage, KNOWLEDGE_BASE.notifications.keywords)) {
      return {
        message: KNOWLEDGE_BASE.notifications.response,
        suggestedActions: ['Notification settings', 'Enable alerts', 'Turn off promos'],
      };
    }

    // Default response
    return {
      message: '🤔 I\'m not quite sure what you\'re asking about. Let me show you what I can help with:\n\n**🛒 Orders & Delivery**\n• Track your order\n• Delivery status\n• Cancel or refund\n\n**💰 Payments & Wallet**\n• Payment issues\n• Top up wallet\n• Withdraw funds\n\n**🎁 Savings & Rewards**\n• Coupons & discounts\n• Rewards points\n• Group buying\n\n**👤 Account**\n• Profile settings\n• Security\n• Notifications\n\n**🚀 Get Started**\n• Become a farmer\n• Become a rider\n• Go premium\n\n💬 You can also say **"talk to support"** to connect with a human agent.\n\nWhat would you like help with?',
      suggestedActions: ['Track order', 'Wallet help', 'View coupons', 'Talk to support'],
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
    if (lowerMessage.includes('wallet') || lowerMessage.includes('balance')) {
      return ['Top up wallet', 'Withdraw', 'View transactions'];
    }
    if (lowerMessage.includes('coupon') || lowerMessage.includes('discount')) {
      return ['View coupons', 'Apply code', 'Get deals'];
    }
    
    return ['Track order', 'Wallet help', 'Talk to support'];
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
