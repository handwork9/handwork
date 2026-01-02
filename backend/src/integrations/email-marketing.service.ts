import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, LessThan, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User, Order, Product, EmailSubscription } from '../database/entities';
import { EmailService } from '../email/email.service';

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  targetAudience: 'all' | 'buyers' | 'farmers' | 'riders' | 'inactive' | 'high_value' | 'custom';
  customUserIds?: string[];
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  sentCount?: number;
  openCount?: number;
  clickCount?: number;
}

export interface NewsletterSubscription {
  email: string;
  name?: string;
  preferences: string[];
  subscribedAt: Date;
  isActive: boolean;
}

export interface AbandonedCartData {
  userId: string;
  userEmail: string;
  userName: string;
  cartItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  cartTotal: number;
  cartUpdatedAt: Date;
}

@Injectable()
export class EmailMarketingService {
  private readonly logger = new Logger(EmailMarketingService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    @InjectQueue('email-marketing') private readonly emailQueue: Queue,
  ) {}

  // ============ Email Templates ============

  /**
   * Generate newsletter HTML template
   */
  private generateNewsletterTemplate(
    title: string,
    content: string,
    products?: Array<{ name: string; price: number; imageUrl?: string; link: string }>,
    ctaText?: string,
    ctaLink?: string,
  ): string {
    const baseUrl = this.configService.get<string>('APP_URL') || 'https://handwork.app';
    
    const productCards = products?.map(p => `
      <div style="display: inline-block; width: 48%; margin: 1%; text-align: center; vertical-align: top;">
        ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" style="width: 100%; max-width: 200px; border-radius: 8px;">` : ''}
        <h4 style="margin: 8px 0 4px; color: #1a1a2e;">${p.name}</h4>
        <p style="margin: 0; color: #16a34a; font-weight: 600;">₦${p.price.toLocaleString()}</p>
        <a href="${p.link}" style="display: inline-block; margin-top: 8px; padding: 8px 16px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-size: 12px;">View Product</a>
      </div>
    `).join('') || '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 28px; letter-spacing: -0.5px;">🌾 Handwork</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Fresh from farm to table</p>
      </td>
    </tr>
    
    <!-- Title -->
    <tr>
      <td style="padding: 32px 24px 16px;">
        <h2 style="margin: 0; color: #1a1a2e; font-size: 24px;">${title}</h2>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <div style="color: #4a5568; line-height: 1.6;">
          ${content}
        </div>
      </td>
    </tr>
    
    ${products && products.length > 0 ? `
    <!-- Featured Products -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <h3 style="margin: 0 0 16px; color: #1a1a2e; font-size: 18px;">Featured Products</h3>
        <div style="text-align: center;">
          ${productCards}
        </div>
      </td>
    </tr>
    ` : ''}
    
    ${ctaText && ctaLink ? `
    <!-- CTA Button -->
    <tr>
      <td style="padding: 0 24px 32px; text-align: center;">
        <a href="${ctaLink}" style="display: inline-block; padding: 14px 32px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${ctaText}</a>
      </td>
    </tr>
    ` : ''}
    
    <!-- Footer -->
    <tr>
      <td style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
          © ${new Date().getFullYear()} Handwork. All rights reserved.
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          <a href="${baseUrl}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a> • 
          <a href="${baseUrl}/preferences" style="color: #9ca3af;">Email Preferences</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate abandoned cart email template
   */
  private generateAbandonedCartTemplate(data: AbandonedCartData): string {
    const baseUrl = this.configService.get<string>('APP_URL') || 'https://handwork.app';
    
    const itemRows = data.cartItems.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.productName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.productName}</strong><br>
          <span style="color: #6b7280;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ₦${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Order</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 28px;">🛒 Your Cart Misses You!</h1>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px;">
          Hi ${data.userName},<br><br>
          You left some fresh produce in your cart! Complete your order before they're gone.
        </p>
        
        <!-- Cart Items -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          ${itemRows}
          <tr>
            <td colspan="2" style="padding: 16px 12px; font-weight: 600;">Total</td>
            <td style="padding: 16px 12px; text-align: right; font-weight: 600; color: #16a34a; font-size: 18px;">
              ₦${data.cartTotal.toLocaleString()}
            </td>
          </tr>
        </table>
        
        <!-- CTA -->
        <div style="text-align: center;">
          <a href="${baseUrl}/cart" style="display: inline-block; padding: 16px 40px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Complete Your Order</a>
        </div>
        
        <p style="margin: 24px 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
          🚚 Free delivery on orders over ₦5,000!
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          <a href="${baseUrl}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate weekly deals email
   */
  private generateWeeklyDealsTemplate(
    userName: string,
    deals: Array<{ name: string; originalPrice: number; salePrice: number; discount: number; imageUrl?: string; link: string }>,
  ): string {
    const baseUrl = this.configService.get<string>('APP_URL') || 'https://handwork.app';
    
    const dealCards = deals.map(deal => `
      <div style="display: inline-block; width: 48%; margin: 1%; text-align: center; vertical-align: top; background: #f8f9fa; border-radius: 12px; padding: 16px;">
        ${deal.imageUrl ? `<img src="${deal.imageUrl}" alt="${deal.name}" style="width: 100%; max-width: 150px; border-radius: 8px;">` : ''}
        <h4 style="margin: 12px 0 4px; color: #1a1a2e; font-size: 14px;">${deal.name}</h4>
        <p style="margin: 0;">
          <span style="text-decoration: line-through; color: #9ca3af; font-size: 12px;">₦${deal.originalPrice.toLocaleString()}</span>
          <span style="color: #dc2626; font-weight: 700; font-size: 16px; margin-left: 8px;">₦${deal.salePrice.toLocaleString()}</span>
        </p>
        <span style="display: inline-block; background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-top: 8px;">-${deal.discount}% OFF</span>
        <br>
        <a href="${deal.link}" style="display: inline-block; margin-top: 12px; padding: 8px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;">Shop Now</a>
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Fresh Deals</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white;">
    <tr>
      <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 28px;">🔥 Weekly Fresh Deals</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Limited time offers on farm-fresh produce</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 24px; color: #4a5568;">Hi ${userName}, check out this week's best deals!</p>
        <div style="text-align: center;">
          ${dealCards}
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="${baseUrl}/deals" style="display: inline-block; padding: 16px 40px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View All Deals</a>
        </div>
      </td>
    </tr>
    
    <tr>
      <td style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          <a href="${baseUrl}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  // ============ Campaign Methods ============

  /**
   * Send newsletter to subscribers
   */
  async sendNewsletter(
    subject: string,
    title: string,
    content: string,
    targetAudience: 'all' | 'buyers' | 'farmers' | 'riders' = 'all',
    featuredProducts?: Array<{ name: string; price: number; imageUrl?: string; link: string }>,
    ctaText?: string,
    ctaLink?: string,
  ): Promise<{ queued: number }> {
    // Get target users
    let users: User[];
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.email IS NOT NULL')
      .andWhere('user.isActive = :isActive', { isActive: true });

    switch (targetAudience) {
      case 'buyers':
        users = await baseQuery.andWhere('user.role = :role', { role: 'buyer' }).getMany();
        break;
      case 'farmers':
        users = await baseQuery.andWhere('user.role = :role', { role: 'farmer' }).getMany();
        break;
      case 'riders':
        users = await baseQuery.andWhere('user.role = :role', { role: 'rider' }).getMany();
        break;
      default:
        users = await baseQuery.getMany();
    }

    const html = this.generateNewsletterTemplate(title, content, featuredProducts, ctaText, ctaLink);

    // Queue emails for background sending
    for (const user of users) {
      await this.emailQueue.add('send-newsletter', {
        to: user.email,
        subject,
        html,
        userId: user.id,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      });
    }

    this.logger.log(`Newsletter queued for ${users.length} users`);
    return { queued: users.length };
  }

  /**
   * Send abandoned cart reminders
   */
  async sendAbandonedCartReminders(): Promise<{ sent: number }> {
    // Find users with items in cart that haven't been updated in 2+ hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // This would query carts - simplified for now
    const abandonedCarts: AbandonedCartData[] = []; // Query from cart service

    for (const cart of abandonedCarts) {
      const html = this.generateAbandonedCartTemplate(cart);

      await this.emailQueue.add('send-abandoned-cart', {
        to: cart.userEmail,
        subject: `${cart.userName}, you left items in your cart! 🛒`,
        html,
        userId: cart.userId,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      });
    }

    this.logger.log(`Abandoned cart reminders queued for ${abandonedCarts.length} users`);
    return { sent: abandonedCarts.length };
  }

  /**
   * Send weekly deals email
   */
  async sendWeeklyDeals(): Promise<{ queued: number }> {
    // Get products on sale
    const deals = await this.productRepository
      .createQueryBuilder('product')
      .where('product.isOnSale = :isOnSale', { isOnSale: true })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('product.bulkDiscountPercent', 'DESC')
      .limit(6)
      .getMany();

    if (deals.length === 0) {
      this.logger.log('No deals to send');
      return { queued: 0 };
    }

    const formattedDeals = deals.map(p => ({
      name: p.title,
      originalPrice: Number(p.price),
      salePrice: Number(p.price) * (1 - (p.bulkDiscountPercent || 0) / 100),
      discount: p.bulkDiscountPercent || 0,
      imageUrl: p.images?.[0],
      link: `https://handwork.app/products/${p.id}`,
    }));

    // Get all active buyers
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email IS NOT NULL')
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.role = :role', { role: 'buyer' })
      .getMany();

    for (const user of users) {
      const html = this.generateWeeklyDealsTemplate(
        user.name || 'there',
        formattedDeals,
      );

      await this.emailQueue.add('send-weekly-deals', {
        to: user.email,
        subject: '🔥 This Week\'s Fresh Deals - Up to 50% Off!',
        html,
        userId: user.id,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      });
    }

    this.logger.log(`Weekly deals queued for ${users.length} users`);
    return { queued: users.length };
  }

  /**
   * Send re-engagement email to inactive users
   */
  async sendReEngagementEmails(): Promise<{ queued: number }> {
    // Find users who haven't ordered in 30+ days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const inactiveUsers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.orders', 'order')
      .where('user.email IS NOT NULL')
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.role = :role', { role: 'buyer' })
      .groupBy('user.id')
      .having('MAX(order.createdAt) < :date OR MAX(order.createdAt) IS NULL', { date: thirtyDaysAgo })
      .getMany();

    const baseUrl = this.configService.get<string>('APP_URL') || 'https://handwork.app';

    for (const user of inactiveUsers) {
      const html = this.generateNewsletterTemplate(
        'We Miss You! 💚',
        `
          <p>Hi ${user.name || 'there'},</p>
          <p>It's been a while since your last order. We've got fresh produce waiting for you!</p>
          <p>Come back and enjoy <strong>10% off</strong> your next order with code: <strong>WELCOMEBACK</strong></p>
        `,
        undefined,
        'Shop Now & Save 10%',
        `${baseUrl}/shop?coupon=WELCOMEBACK`,
      );

      await this.emailQueue.add('send-reengagement', {
        to: user.email,
        subject: `${user.name || 'Hey'}, we miss you! Here's 10% off 💚`,
        html,
        userId: user.id,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      });
    }

    this.logger.log(`Re-engagement emails queued for ${inactiveUsers.length} users`);
    return { queued: inactiveUsers.length };
  }

  /**
   * Send welcome series email (Day 1)
   */
  async sendWelcomeEmail(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.email) return false;

    const baseUrl = this.configService.get<string>('APP_URL') || 'https://handwork.app';

    const html = this.generateNewsletterTemplate(
      'Welcome to Handwork! 🌾',
      `
        <p>Hi ${user.name || 'there'},</p>
        <p>Welcome to Handwork - your gateway to fresh, farm-direct produce!</p>
        <p><strong>Here's what you can do:</strong></p>
        <ul style="color: #4a5568; line-height: 2;">
          <li>🛒 Browse thousands of fresh products from local farmers</li>
          <li>🚚 Get fast delivery right to your doorstep</li>
          <li>💰 Earn reward points on every purchase</li>
          <li>🌟 Rate and review products to help others</li>
        </ul>
        <p>As a welcome gift, enjoy <strong>free delivery</strong> on your first order!</p>
      `,
      undefined,
      'Start Shopping',
      `${baseUrl}/shop`,
    );

    await this.emailQueue.add('send-welcome', {
      to: user.email,
      subject: 'Welcome to Handwork! 🌾 Your first order gets free delivery',
      html,
      userId: user.id,
    });

    return true;
  }

  /**
   * Schedule follow-up emails in welcome series
   */
  async scheduleWelcomeSeries(userId: string): Promise<void> {
    // Day 3: Tips email
    await this.emailQueue.add('welcome-series-day3', { userId }, {
      delay: 3 * 24 * 60 * 60 * 1000, // 3 days
      attempts: 3,
    });

    // Day 7: First order reminder if no purchase
    await this.emailQueue.add('welcome-series-day7', { userId }, {
      delay: 7 * 24 * 60 * 60 * 1000, // 7 days
      attempts: 3,
    });
  }

  // ============ Scheduled Jobs ============

  /**
   * Weekly deals - runs every Monday at 9 AM
   */
  @Cron('0 9 * * 1')
  async scheduledWeeklyDeals() {
    this.logger.log('Running scheduled weekly deals email');
    await this.sendWeeklyDeals();
  }

  /**
   * Abandoned cart reminders - runs every 4 hours
   */
  @Cron('0 */4 * * *')
  async scheduledAbandonedCartReminders() {
    this.logger.log('Running scheduled abandoned cart reminders');
    await this.sendAbandonedCartReminders();
  }

  /**
   * Re-engagement emails - runs every Sunday at 10 AM
   */
  @Cron('0 10 * * 0')
  async scheduledReEngagement() {
    this.logger.log('Running scheduled re-engagement emails');
    await this.sendReEngagementEmails();
  }

  // ============ Analytics ============

  /**
   * Track email open
   */
  async trackOpen(emailId: string, userId: string): Promise<void> {
    // Update open count in database
    this.logger.log(`Email opened: ${emailId} by user ${userId}`);
  }

  /**
   * Track email click
   */
  async trackClick(emailId: string, userId: string, link: string): Promise<void> {
    // Update click count in database
    this.logger.log(`Email link clicked: ${emailId} by user ${userId}, link: ${link}`);
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<{
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }> {
    // Query from database
    return {
      sent: 0,
      opened: 0,
      clicked: 0,
      openRate: 0,
      clickRate: 0,
    };
  }
}
