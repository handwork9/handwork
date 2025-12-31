import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Order } from '../database/entities/order.entity';
import { User } from '../database/entities/user.entity';
import { Payment } from '../database/entities/payment.entity';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL') || 'noreply@handwork.com';
    this.fromName = this.configService.get<string>('SMTP_FROM_NAME') || 'Handwork';

    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('Email service initialized with Gmail');
    } else {
      this.logger.warn('Email service not configured - emails will be logged only');
    }
  }

  /**
   * Get the base email styles - modern, clean design
   */
  private getBaseStyles(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        line-height: 1.6; 
        color: #1a1a2e; 
        background-color: #f8f9fa;
        -webkit-font-smoothing: antialiased;
      }
      .email-wrapper { 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff;
      }
      .email-header { 
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        padding: 32px 24px; 
        text-align: center; 
      }
      .logo { 
        width: 48px; 
        height: 48px; 
        margin-bottom: 12px;
      }
      .logo-text {
        font-size: 28px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: -0.5px;
      }
      .logo-tagline {
        font-size: 13px;
        color: rgba(255,255,255,0.85);
        margin-top: 4px;
      }
      .email-body { 
        padding: 32px 24px; 
        background-color: #ffffff;
      }
      .greeting {
        font-size: 15px;
        color: #6b7280;
        margin-bottom: 8px;
      }
      .main-title {
        font-size: 24px;
        font-weight: 700;
        color: #1a1a2e;
        margin-bottom: 16px;
        line-height: 1.3;
      }
      .subtitle {
        font-size: 15px;
        color: #4b5563;
        margin-bottom: 24px;
        line-height: 1.6;
      }
      .highlight-box {
        background-color: #f0fdf4;
        border-left: 4px solid #16a34a;
        padding: 16px 20px;
        margin: 24px 0;
      }
      .highlight-box.warning {
        background-color: #fef3c7;
        border-left-color: #f59e0b;
      }
      .highlight-box.error {
        background-color: #fef2f2;
        border-left-color: #ef4444;
      }
      .highlight-box.info {
        background-color: #eff6ff;
        border-left-color: #3b82f6;
      }
      .amount-display {
        font-size: 36px;
        font-weight: 700;
        color: #16a34a;
        text-align: center;
        padding: 24px 0;
      }
      .amount-display.error {
        color: #ef4444;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      .data-table th {
        text-align: left;
        padding: 12px 16px;
        background-color: #f9fafb;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid #e5e7eb;
      }
      .data-table td {
        padding: 14px 16px;
        font-size: 14px;
        color: #374151;
        border-bottom: 1px solid #f3f4f6;
      }
      .data-table tr:last-child td {
        border-bottom: none;
      }
      .data-table .total-row {
        background-color: #f9fafb;
        font-weight: 600;
      }
      .data-table .total-row td {
        border-top: 2px solid #e5e7eb;
        color: #1a1a2e;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #f3f4f6;
      }
      .info-row:last-child {
        border-bottom: none;
      }
      .info-label {
        font-size: 14px;
        color: #6b7280;
      }
      .info-value {
        font-size: 14px;
        color: #1a1a2e;
        font-weight: 500;
      }
      .status-badge {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 100px;
        font-size: 13px;
        font-weight: 600;
      }
      .status-badge.success {
        background-color: #dcfce7;
        color: #15803d;
      }
      .status-badge.warning {
        background-color: #fef3c7;
        color: #b45309;
      }
      .status-badge.error {
        background-color: #fee2e2;
        color: #dc2626;
      }
      .status-badge.info {
        background-color: #dbeafe;
        color: #1d4ed8;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        color: #ffffff !important;
        padding: 14px 32px;
        text-decoration: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        text-align: center;
        margin: 8px 0;
      }
      .cta-button.secondary {
        background: #f3f4f6;
        color: #374151 !important;
      }
      .divider {
        height: 1px;
        background-color: #e5e7eb;
        margin: 24px 0;
      }
      .email-footer {
        background-color: #f9fafb;
        padding: 32px 24px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      .social-links {
        margin: 20px 0;
      }
      .social-links a {
        display: inline-block;
        margin: 0 8px;
        width: 36px;
        height: 36px;
        background-color: #e5e7eb;
        border-radius: 50%;
        line-height: 36px;
        text-decoration: none;
      }
      .footer-text {
        font-size: 13px;
        color: #9ca3af;
        margin: 8px 0;
      }
      .footer-links {
        margin-top: 16px;
      }
      .footer-links a {
        font-size: 13px;
        color: #6b7280;
        text-decoration: none;
        margin: 0 12px;
      }
      .review-section {
        background-color: #fefce8;
        border: 1px solid #fef08a;
        padding: 24px;
        margin: 24px 0;
        text-align: center;
        border-radius: 12px;
      }
      .star-rating {
        font-size: 28px;
        letter-spacing: 4px;
        margin: 12px 0;
      }
      .icon-circle {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: rgba(255,255,255,0.2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }
      .icon-circle .emoji {
        font-size: 32px;
      }
    `;
  }

  /**
   * Get the email header with logo
   */
  private getEmailHeader(title?: string): string {
    return `
      <div class="email-header">
        <div class="icon-circle">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="white"/>
            <path d="M12 5c-1.5 0-2.5 1-2.5 2.5s1.5 3 2.5 4.5c1-1.5 2.5-3 2.5-4.5S13.5 5 12 5z" fill="#fbbf24"/>
            <path d="M8 12c-2.5 1.5-4 4-4 7h16c0-3-1.5-5.5-4-7" fill="#16a34a"/>
            <path d="M12 12v5" stroke="#166534" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="logo-text">Handwork</div>
        <div class="logo-tagline">Fresh from Farm to You</div>
        ${title ? `<div style="margin-top: 16px; font-size: 18px; color: rgba(255,255,255,0.95);">${title}</div>` : ''}
      </div>
    `;
  }

  /**
   * Get the email footer with social links
   */
  private getEmailFooter(): string {
    return `
      <div class="email-footer">
        <div style="margin-bottom: 16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align: middle;">
            <circle cx="12" cy="12" r="10" fill="#16a34a"/>
            <path d="M12 6c-1 0-2 .5-2 1.5s1 2 2 3c1-1 2-2 2-3S13 6 12 6z" fill="#fbbf24"/>
            <path d="M10 11c-2 1-3 3-3 5h10c0-2-1-4-3-5" fill="#22c55e"/>
          </svg>
          <span style="font-size: 18px; font-weight: 600; color: #1a1a2e; margin-left: 8px;">Handwork</span>
        </div>
        
        <div class="social-links">
          <a href="https://instagram.com/handwork" style="text-decoration: none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280"><rect x="2" y="2" width="20" height="20" rx="5" stroke="#6b7280" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="4" stroke="#6b7280" stroke-width="2" fill="none"/><circle cx="18" cy="6" r="1.5" fill="#6b7280"/></svg>
          </a>
          <a href="https://twitter.com/handwork" style="text-decoration: none; margin-left: 12px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://facebook.com/handwork" style="text-decoration: none; margin-left: 12px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          </a>
        </div>
        
        <p class="footer-text">Supporting local farmers, one delivery at a time.</p>
        <p class="footer-text">© ${new Date().getFullYear()} Handwork. All rights reserved.</p>
        
        <div class="footer-links">
          <a href="https://handwork.ng/help">Help Center</a>
          <a href="https://handwork.ng/privacy">Privacy Policy</a>
          <a href="https://handwork.ng/terms">Terms of Service</a>
        </div>
        
        <p style="font-size: 11px; color: #9ca3af; margin-top: 20px;">
          You received this email because you have an account with Handwork.<br>
          If you didn't request this, please contact support@handwork.ng
        </p>
      </div>
    `;
  }

  /**
   * Wrap content in the base email template
   */
  private wrapInTemplate(content: string, headerTitle?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Handwork</title>
        <style>${this.getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          ${this.getEmailHeader(headerTitle)}
          <div class="email-body">
            ${content}
          </div>
          ${this.getEmailFooter()}
        </div>
      </body>
      </html>
    `;
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"${this.fromName}" <${this.fromEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        this.logger.log(`📧 Email sent to ${options.to}: ${options.subject}`);
        return true;
      } else {
        // Log email in development when SMTP is not configured
        this.logger.log(`📧 [DEV] Email would be sent to ${options.to}:`);
        this.logger.log(`   Subject: ${options.subject}`);
        this.logger.debug(`   Body: ${options.html}`);
        return true;
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send a generic email (public method for other services)
   */
  async send(options: EmailOptions): Promise<boolean> {
    return this.sendEmail(options);
  }

  /**
   * Send order confirmation email to buyer
   */
  async sendOrderConfirmation(order: Order, buyer: User): Promise<boolean> {
    if (!buyer.email) {
      this.logger.warn(`Cannot send order confirmation - buyer ${buyer.id} has no email`);
      return false;
    }

    const itemsList = order.items
      .map(
        (item) =>
          `<tr>
            <td>${item.title}</td>
            <td style="text-align: center;">${item.quantity} ${item.unit}</td>
            <td style="text-align: right;">₦${item.subtotal.toLocaleString()}</td>
          </tr>`,
      )
      .join('');

    const content = `
      <p class="greeting">Hi ${buyer.name || 'there'},</p>
      <h1 class="main-title"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 8px;"><circle cx="12" cy="12" r="10" fill="#16a34a"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Your Order is Confirmed!</h1>
      <p class="subtitle">Thank you for your order. We've received it and it's now being processed.</p>
      
      <div class="highlight-box">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</div>
        <div style="font-size: 20px; font-weight: 700; color: #16a34a; margin-top: 4px;">#${order.orderNumber}</div>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span class="info-label">Order Date:</span>
        <span class="info-value">${new Date(order.createdAt).toLocaleDateString('en-NG', { dateStyle: 'full' })}</span>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px;">Order Items</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
          <tr>
            <td colspan="2">Subtotal</td>
            <td style="text-align: right;">₦${order.subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="2">Delivery Fee</td>
            <td style="text-align: right;">₦${order.deliveryFee.toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="2">Service Fee</td>
            <td style="text-align: right;">₦${order.serviceFee.toLocaleString()}</td>
          </tr>
          ${order.discount > 0 ? `<tr>
            <td colspan="2" style="color: #16a34a;">Discount</td>
            <td style="text-align: right; color: #16a34a;">-₦${order.discount.toLocaleString()}</td>
          </tr>` : ''}
          <tr class="total-row">
            <td colspan="2"><strong>Total</strong></td>
            <td style="text-align: right;"><strong>₦${order.total.toLocaleString()}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="divider"></div>
      
      <h3 style="font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 12px;">Delivery Address</h3>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">
        ${order.deliveryAddress.address}<br>
        ${order.deliveryAddress.city}, ${order.deliveryAddress.state}
        ${order.deliveryAddress.instructions ? `<br><span style="color: #6b7280; font-style: italic;">Note: ${order.deliveryAddress.instructions}</span>` : ''}
      </p>

      <div class="divider"></div>
      
      <p style="color: #4b5563; font-size: 14px;">We'll notify you when your order is on its way. Track your order in real-time using the Handwork app.</p>
      
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://handwork.ng/orders/${order.id}" class="cta-button">Track Your Order</a>
      </div>
    `;

    const html = this.wrapInTemplate(content, 'Order Confirmed');

    return this.sendEmail({
      to: buyer.email,
      subject: `Order Confirmed - #${order.orderNumber}`,
      html,
      text: `Order Confirmed! Your order #${order.orderNumber} has been placed. Total: ₦${order.total.toLocaleString()}`,
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(payment: Payment, user: User, order?: Order): Promise<boolean> {
    if (!user.email) {
      this.logger.warn(`Cannot send payment confirmation - user ${user.id} has no email`);
      return false;
    }

    const isWalletTopUp = payment.metadata?.type === 'wallet_topup';
    const subject = isWalletTopUp
      ? `Wallet Top-Up Successful - ₦${payment.amount.toLocaleString()}`
      : `Payment Received - Order #${order?.orderNumber}`;

    const content = `
      <p class="greeting">Hi ${user.name || 'there'},</p>
      <h1 class="main-title"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 8px;"><circle cx="12" cy="12" r="10" fill="#16a34a"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Payment Successful!</h1>
      <p class="subtitle">${isWalletTopUp ? 'Your wallet has been topped up successfully.' : 'We have received your payment for your order.'}</p>
      
      <div class="amount-display">₦${payment.amount.toLocaleString()}</div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <div class="info-row">
          <span class="info-label">Payment ID</span>
          <span class="info-value">${payment.id.slice(0, 8)}...</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method</span>
          <span class="info-value" style="text-transform: capitalize;">${payment.paymentMethod?.replace('_', ' ')}</span>
        </div>
        ${!isWalletTopUp && order ? `
        <div class="info-row">
          <span class="info-label">Order Number</span>
          <span class="info-value" style="color: #16a34a; font-weight: 600;">#${order.orderNumber}</span>
        </div>
        ` : ''}
        ${isWalletTopUp ? `
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">New Wallet Balance</span>
          <span class="info-value" style="color: #16a34a; font-weight: 600;">₦${(user.walletBalance || 0).toLocaleString()}</span>
        </div>
        ` : ''}
      </div>

      ${isWalletTopUp 
        ? '<p style="color: #4b5563; font-size: 14px;">Your wallet funds can be used for future orders on Handwork. Enjoy shopping!</p>' 
        : '<p style="color: #4b5563; font-size: 14px;">Your order is now being processed and will be delivered soon. We\'ll keep you updated on its progress.</p>'}
    `;

    const html = this.wrapInTemplate(content, 'Payment Received');

    return this.sendEmail({
      to: user.email,
      subject: `${subject}`,
      html,
      text: `Payment Successful! Amount: ₦${payment.amount.toLocaleString()}. ${isWalletTopUp ? 'Your wallet has been topped up.' : `Order #${order?.orderNumber} is confirmed.`}`,
    });
  }

  /**
   * Send payment failed email
   */
  async sendPaymentFailed(payment: Payment, user: User, reason?: string, order?: Order): Promise<boolean> {
    if (!user.email) {
      this.logger.warn(`Cannot send payment failed email - user ${user.id} has no email`);
      return false;
    }

    const isWalletTopUp = payment.metadata?.type === 'wallet_topup';
    const subject = isWalletTopUp
      ? `Payment Failed - Wallet Top-Up`
      : `Payment Declined - Order #${order?.orderNumber || 'N/A'}`;

    const content = `
      <p class="greeting">Hi ${user.name || 'there'},</p>
      <h1 class="main-title">Payment Could Not Be Processed</h1>
      <p class="subtitle">Unfortunately, we were unable to process your payment. No charges have been made to your account.</p>
      
      <div class="amount-display error">₦${payment.amount.toLocaleString()}</div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${new Date().toLocaleDateString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method</span>
          <span class="info-value" style="text-transform: capitalize;">${payment.paymentMethod?.replace('_', ' ')}</span>
        </div>
        ${!isWalletTopUp && order ? `
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Order Number</span>
          <span class="info-value">#${order.orderNumber}</span>
        </div>
        ` : ''}
      </div>

      ${reason ? `
        <div class="highlight-box error">
          <strong style="color: #dc2626;">Reason:</strong>
          <span style="color: #7f1d1d;">${reason}</span>
        </div>
      ` : ''}

      <h3 style="font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 24px 0 12px;">What you can do:</h3>
      <ul style="color: #4b5563; font-size: 14px; padding-left: 20px; line-height: 2;">
        <li>Verify your card details are correct</li>
        <li>Ensure you have sufficient funds</li>
        <li>Try a different payment method</li>
        <li>Contact your bank if the issue persists</li>
      </ul>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://handwork.ng" class="cta-button">Try Again</a>
      </div>
      
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px; text-align: center;">Need help? Contact us at support@handwork.ng</p>
    `;

    const html = this.wrapInTemplate(content, 'Payment Failed');

    return this.sendEmail({
      to: user.email,
      subject: `${subject}`,
      html,
      text: `Payment Failed. Amount: ₦${payment.amount.toLocaleString()}. ${reason ? `Reason: ${reason}. ` : ''}Please try again or use a different payment method.`,
    });
  }

  /**
   * Send payment cancelled email
   */
  async sendPaymentCancelled(payment: Payment, user: User, order?: Order): Promise<boolean> {
    if (!user.email) {
      this.logger.warn(`Cannot send payment cancelled email - user ${user.id} has no email`);
      return false;
    }

    const isWalletTopUp = payment.metadata?.type === 'wallet_topup';
    const subject = isWalletTopUp
      ? `Payment Cancelled - Wallet Top-Up`
      : `Payment Cancelled - Order #${order?.orderNumber || 'N/A'}`;

    const content = `
      <p class="greeting">Hi ${user.name || 'there'},</p>
      <h1 class="main-title">Payment Cancelled</h1>
      <p class="subtitle">Your payment has been cancelled as requested. No charges have been made.</p>
      
      <div class="amount-display warning">₦${payment.amount.toLocaleString()}</div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${new Date().toLocaleDateString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
        ${!isWalletTopUp && order ? `
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Order Number</span>
          <span class="info-value">#${order.orderNumber}</span>
        </div>
        ` : ''}
      </div>

      <div class="highlight-box warning">
        <strong style="color: #d97706;">Note:</strong>
        <span style="color: #92400e;">If you see any pending charges, they will be automatically released by your bank within 3-5 business days.</span>
      </div>

      <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">If you didn't cancel this payment or have any questions, please contact our support team immediately.</p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://handwork.ng" class="cta-button">Shop Again</a>
      </div>
    `;

    const html = this.wrapInTemplate(content, 'Payment Cancelled');

    return this.sendEmail({
      to: user.email,
      subject: `${subject}`,
      html,
      text: `Payment Cancelled. Amount: ₦${payment.amount.toLocaleString()}. No charges have been made to your account.`,
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(order: Order, buyer: User, status: string): Promise<boolean> {
    if (!buyer.email) {
      return false;
    }

    const statusMessages: Record<string, { emoji: string; title: string; message: string; type: 'success' | 'warning' | 'error' | 'info' }> = {
      confirmed: {
        emoji: '✅',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed and is being prepared.',
        type: 'success',
      },
      rider_assigned: {
        emoji: '🏍️',
        title: 'Rider Assigned',
        message: 'A rider has been assigned to deliver your order.',
        type: 'info',
      },
      assigned: {
        emoji: '🏍️',
        title: 'Rider Assigned',
        message: 'A rider has been assigned to deliver your order.',
        type: 'info',
      },
      picked_up: {
        emoji: '📦',
        title: 'Order Picked Up',
        message: 'Your order has been picked up and is on the way!',
        type: 'info',
      },
      in_transit: {
        emoji: '🚚',
        title: 'Out for Delivery',
        message: 'Your order is out for delivery. It will arrive soon!',
        type: 'info',
      },
      delivered: {
        emoji: '🎉',
        title: 'Order Delivered',
        message: 'Your order has been delivered. Enjoy!',
        type: 'success',
      },
      cancelled: {
        emoji: '❌',
        title: 'Order Cancelled',
        message: 'Your order has been cancelled.',
        type: 'error',
      },
      declined: {
        emoji: '🚫',
        title: 'Order Declined',
        message: 'Unfortunately, your order could not be fulfilled.',
        type: 'error',
      },
      rejected: {
        emoji: '⛔',
        title: 'Order Rejected',
        message: 'Your order has been rejected.',
        type: 'error',
      },
      refunded: {
        emoji: '💰',
        title: 'Order Refunded',
        message: 'Your order has been refunded.',
        type: 'info',
      },
    };

    const statusInfo = statusMessages[status.toLowerCase()] || {
      emoji: '📋',
      title: `Order ${status}`,
      message: `Your order status has been updated to: ${status}`,
      type: 'info',
    };

    const isNegativeStatus = ['cancelled', 'declined', 'rejected'].includes(status.toLowerCase());
    const isDelivered = status.toLowerCase() === 'delivered';
    const isRefunded = status.toLowerCase() === 'refunded';

    let content = `
      <p class="greeting">Hi ${buyer.name || 'there'},</p>
      <h1 class="main-title">${statusInfo.title}</h1>
      <p class="subtitle">${statusInfo.message}</p>
      
      <div class="highlight-box ${statusInfo.type}">
        <strong style="font-size: 18px;">Order #${order.orderNumber}</strong>
      </div>
    `;

    // Negative statuses: show reason and refund info
    if (isNegativeStatus) {
      if (order.cancellationReason) {
        content += `
          <div class="highlight-box error" style="margin-top: 16px;">
            <strong>Reason:</strong> ${order.cancellationReason}
          </div>
        `;
      }
      content += `
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <div class="info-row">
            <span class="info-label">Order Total</span>
            <span class="info-value">₦${order.total?.toLocaleString() || '0'}</span>
          </div>
          <div class="info-row" style="border-bottom: none;">
            <span class="info-label">Items</span>
            <span class="info-value">${order.itemCount || order.items?.length || 0} item(s)</span>
          </div>
        </div>
        <div class="highlight-box info">
          <strong>Refund Information</strong><br>
          <span style="color: #1e40af;">If payment was made, the refund will be processed within 3-5 business days. For wallet payments, the amount will be credited back immediately. For card payments, please allow your bank 5-7 days.</span>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you have any questions, please contact our support team.</p>
      `;
    }

    // Refunded status
    if (isRefunded) {
      content += `
        <div class="highlight-box success" style="margin-top: 16px;">
          <strong>Refund Amount:</strong> ₦${order.total?.toLocaleString() || '0'}
        </div>
        <p style="color: #4b5563; font-size: 14px; margin-top: 16px;">The refund has been initiated. For wallet payments, check your wallet balance. For card payments, the amount will reflect in your account within 5-7 business days.</p>
      `;
    }

    // Delivered status: show receipt and review request
    if (isDelivered) {
      content += `
        <div class="highlight-box success" style="margin-top: 16px;">
          <strong>Delivered on:</strong> ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today'}
        </div>

        <h3 style="font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 24px 0 16px;">Order Receipt</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;">Item</th>
              <th style="padding: 12px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600;">Qty</th>
              <th style="padding: 12px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.title}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${item.quantity} ${item.unit || ''}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">₦${item.subtotal?.toLocaleString() || '0'}</td>
              </tr>
            `).join('') || ''}
            <tr>
              <td colspan="2" style="padding: 12px; color: #6b7280;">Subtotal</td>
              <td style="padding: 12px; text-align: right; color: #374151;">₦${order.subtotal?.toLocaleString() || '0'}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 12px; color: #6b7280;">Delivery Fee</td>
              <td style="padding: 12px; text-align: right; color: #374151;">₦${order.deliveryFee?.toLocaleString() || '0'}</td>
            </tr>
            ${order.serviceFee ? `
            <tr>
              <td colspan="2" style="padding: 12px; color: #6b7280;">Service Fee</td>
              <td style="padding: 12px; text-align: right; color: #374151;">₦${order.serviceFee.toLocaleString()}</td>
            </tr>
            ` : ''}
            ${order.discount ? `
            <tr>
              <td colspan="2" style="padding: 12px; color: #16a34a;">Discount</td>
              <td style="padding: 12px; text-align: right; color: #16a34a;">-₦${order.discount.toLocaleString()}</td>
            </tr>
            ` : ''}
            <tr style="background: #f9fafb;">
              <td colspan="2" style="padding: 12px; font-weight: 600; color: #1a1a2e;">Total Paid</td>
              <td style="padding: 12px; text-align: right; font-weight: 600; color: #1a1a2e;">₦${order.total?.toLocaleString() || '0'}</td>
            </tr>
          </tbody>
        </table>

        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <p style="font-weight: 600; color: #92400e; margin: 0 0 8px;">How was your experience?</p>
          <div style="font-size: 32px; margin: 12px 0;">⭐⭐⭐⭐⭐</div>
          <p style="color: #78350f; font-size: 14px; margin: 0;">Your feedback helps farmers and riders improve their service!</p>
        </div>

        <p style="color: #4b5563; font-size: 14px; text-align: center;">We hope you enjoyed your fresh farm produce! Thank you for supporting local farmers. 🌾</p>
      `;
    }

    // Normal status updates
    if (!isNegativeStatus && !isDelivered && !isRefunded) {
      content += `
        <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">Track your order in the Handwork app for real-time updates.</p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://handwork.ng" class="cta-button">Track Order</a>
        </div>
      `;
    }

    const html = this.wrapInTemplate(content, `${statusInfo.emoji} ${statusInfo.title}`);

    return this.sendEmail({
      to: buyer.email,
      subject: `${statusInfo.title} - Order #${order.orderNumber}`,
      html,
      text: `${statusInfo.title}: ${statusInfo.message} Order #${order.orderNumber}`,
    });
  }

  /**
   * Send new order notification to farmer
   */
  async sendFarmerNewOrderNotification(order: Order, farmer: User): Promise<boolean> {
    if (!farmer.email) {
      return false;
    }

    const farmerItems = order.items.filter((item) => item.farmerId === farmer.id);
    const farmerTotal = farmerItems.reduce((sum, item) => sum + item.subtotal, 0);

    const itemsList = farmerItems
      .map(
        (item) =>
          `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.title}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${item.quantity} ${item.unit}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">₦${item.subtotal.toLocaleString()}</td>
          </tr>`,
      )
      .join('');

    const content = `
      <p class="greeting">Hi ${farmer.name || 'Farmer'},</p>
      <h1 class="main-title"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 8px;"><rect x="3" y="8" width="18" height="13" rx="2" fill="#16a34a"/><path d="M3 10l9 6 9-6" stroke="white" stroke-width="2"/><rect x="8" y="3" width="8" height="5" fill="#22c55e" rx="1"/></svg>New Order Received!</h1>
      <p class="subtitle">You have a new order waiting to be prepared.</p>
      
      <div class="highlight-box success">
        <strong style="font-size: 18px;">Order #${order.orderNumber}</strong>
      </div>
      
      <div class="amount-display">₦${farmerTotal.toLocaleString()}</div>
      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: -12px;">Your earnings from this order</p>

      <h3 style="font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 24px 0 16px;">Items Ordered</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;">Product</th>
            <th style="padding: 12px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600;">Qty</th>
            <th style="padding: 12px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
          <tr style="background: #f9fafb;">
            <td colspan="2" style="padding: 12px; font-weight: 600; color: #1a1a2e;">Total</td>
            <td style="padding: 12px; text-align: right; font-weight: 600; color: #16a34a;">₦${farmerTotal.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div class="highlight-box warning">
        <strong>Action Required:</strong> Please confirm this order in the app to begin preparation.
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://handwork.ng" class="cta-button">View Order Details</a>
      </div>
    `;

    const html = this.wrapInTemplate(content, 'New Order');

    return this.sendEmail({
      to: farmer.email,
      subject: `New Order - #${order.orderNumber}`,
      html,
      text: `New Order #${order.orderNumber}! You have items to prepare. Total: ₦${farmerTotal.toLocaleString()}`,
    });
  }

  /**
   * Send welcome email when user creates an account
   */
  async sendWelcomeEmail(user: User, deviceInfo?: { ip?: string; userAgent?: string; location?: string }): Promise<boolean> {
    if (!user.email) {
      this.logger.warn(`Cannot send welcome email - user ${user.id} has no email`);
      return false;
    }

    const roleWelcomeText: Record<string, string> = {
      buyer: 'Your journey to fresh, farm-direct products starts now!',
      farmer: 'Connect directly with thousands of eager buyers in your area!',
      rider: 'Join our fleet and start earning on your own schedule!',
    };

    const role = user.role as string;

    const signupTime = new Date().toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Parse user agent to get device info
    const parseUserAgent = (ua?: string) => {
      if (!ua) return 'Unknown Device';
      if (ua.includes('iPhone')) return 'iPhone';
      if (ua.includes('iPad')) return 'iPad';
      if (ua.includes('Android')) return 'Android Device';
      if (ua.includes('Windows')) return 'Windows PC';
      if (ua.includes('Mac')) return 'Mac';
      if (ua.includes('Linux')) return 'Linux';
      return 'Unknown Device';
    };

    const deviceName = parseUserAgent(deviceInfo?.userAgent);
    const location = deviceInfo?.location || 'Unknown Location';

    const roleFeatures: Record<string, string> = {
      buyer: `
        <li>Browse hundreds of farm-fresh products</li>
        <li>Secure checkout with wallet, card, or bank transfer</li>
        <li>Real-time order tracking</li>
        <li>Earn rewards on every purchase</li>
      `,
      farmer: `
        <li>List your products with photos and pricing</li>
        <li>Track sales with detailed analytics</li>
        <li>Get paid directly to your wallet</li>
        <li>Boost visibility with promotions</li>
      `,
      rider: `
        <li>Accept delivery requests in your area</li>
        <li>Earn competitive rates per delivery</li>
        <li>Work on your own flexible schedule</li>
        <li>Build your reputation with ratings</li>
      `,
    };

    const content = `
      <p class="greeting">Hi ${user.name || 'there'},</p>
      <h1 class="main-title"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 8px;"><circle cx="12" cy="12" r="10" fill="#16a34a"/><path d="M8 14c0-2 2-4 4-4s4 2 4 4" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="10" r="1.5" fill="white"/><circle cx="15" cy="10" r="1.5" fill="white"/></svg>Welcome to Handwork!</h1>
      <p class="subtitle">Your account has been created successfully. You're ready to get started!</p>
      
      <div class="highlight-box success">
        <strong style="font-size: 16px;">You're all set as a ${role.charAt(0).toUpperCase() + role.slice(1)}!</strong><br>
        <span style="color: #166534;">${roleWelcomeText[role] || 'Welcome to our platform!'}</span>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${user.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Created on</span>
          <span class="info-value">${signupTime}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Device</span>
          <span class="info-value">${deviceName}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Location</span>
          <span class="info-value">${location}</span>
        </div>
      </div>

      <h3 style="font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 24px 0 12px;">What you can do:</h3>
      <ul style="color: #4b5563; font-size: 14px; padding-left: 20px; line-height: 2;">
        ${roleFeatures[role] || roleFeatures.buyer}
      </ul>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://handwork.ng" class="cta-button">Open Handwork App</a>
      </div>
      
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px; text-align: center;">Need help getting started? Contact us at support@handwork.ng</p>
    `;

    const html = this.wrapInTemplate(content, 'Welcome!');

    return this.sendEmail({
      to: user.email,
      subject: `Welcome to Handwork, ${user.name || 'there'}!`,
      html,
      text: `Welcome to Handwork! Your account has been created successfully on ${signupTime}. ${roleWelcomeText[role] || ''}`,
    });
  }

  /**
   * Send login notification email
   */
  async sendLoginNotification(user: User, deviceInfo?: { ip?: string; userAgent?: string; location?: string }): Promise<boolean> {
    if (!user.email) {
      this.logger.warn(`Cannot send login notification - user ${user.id} has no email`);
      return false;
    }

    // Check if user has login alerts enabled
    if (user.loginAlertsEnabled === false) {
      this.logger.debug(`Login alerts disabled for user ${user.id}`);
      return false;
    }

    // Also check general email notifications (if the setting exists)
    if (user.emailNotificationsEnabled === false) {
      return false;
    }

    const loginTime = new Date().toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Parse user agent to get device info
    const parseUserAgent = (ua?: string) => {
      if (!ua) return { device: 'Unknown Device', browser: 'Unknown Browser' };
      
      let device = 'Unknown Device';
      let browser = 'Unknown Browser';
      
      if (ua.includes('iPhone')) device = 'iPhone';
      else if (ua.includes('iPad')) device = 'iPad';
      else if (ua.includes('Android')) device = 'Android Device';
      else if (ua.includes('Windows')) device = 'Windows PC';
      else if (ua.includes('Macintosh') || ua.includes('Mac OS')) device = 'Mac';
      else if (ua.includes('Linux')) device = 'Linux PC';
      
      if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edg')) browser = 'Edge';
      
      return { device, browser };
    };

    const parsedDevice = parseUserAgent(deviceInfo?.userAgent);
    const deviceDisplay = `${parsedDevice.browser} on ${parsedDevice.device}`;
    const location = deviceInfo?.location || 'Unknown Location';
    const ipAddress = deviceInfo?.ip || 'Unknown';

    const content = `
      <p class="greeting">Hi ${user.name || 'there'},</p>
      <h1 class="main-title"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 8px;"><path d="M12 2L4 6v6c0 5.5 3.4 10.3 8 12 4.6-1.7 8-6.5 8-12V6l-8-4z" fill="#3b82f6"/><path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>New Sign-in Detected</h1>
      <p class="subtitle">We noticed a login to your Handwork account. If this was you, no action is needed.</p>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <div class="info-row">
          <span class="info-label">Date & Time</span>
          <span class="info-value">${loginTime}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Device</span>
          <span class="info-value">${deviceDisplay}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Location</span>
          <span class="info-value">${location}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">IP Address</span>
          <span class="info-value">${ipAddress}</span>
        </div>
      </div>

      <div class="highlight-box success">
        <strong>If this was you</strong><br>
        <span style="color: #166534;">You can safely ignore this email. Your account is secure.</span>
      </div>

      <div class="highlight-box error" style="margin-top: 16px;">
        <strong>Wasn't you?</strong><br>
        <span style="color: #7f1d1d;">Change your password immediately and contact support.</span>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://handwork.ng" class="cta-button">Secure My Account</a>
      </div>
    `;

    const html = this.wrapInTemplate(content, 'Login Alert');

    return this.sendEmail({
      to: user.email,
      subject: `New login to your Handwork account`,
      html,
      text: `New login detected on your Handwork account at ${loginTime} from ${deviceDisplay} in ${location} (IP: ${ipAddress}). If this wasn't you, please secure your account immediately.`,
    });
  }

  /**
   * Send password reset email with OTP code
   */
  async sendPasswordResetEmail(user: User, otpCode: string, expiresInMinutes: number = 10): Promise<boolean> {
    if (!user.email) {
      this.logger.warn(`Cannot send password reset email - user ${user.id} has no email`);
      return false;
    }

    const content = `
      <p class="greeting">Hi ${user.name || 'there'},</p>
      <h1 class="main-title"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 8px;"><circle cx="12" cy="12" r="10" fill="#f59e0b"/><path d="M12 7v4l2 2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="white" stroke-width="2"/></svg>Reset Your Password</h1>
      <p class="subtitle">We received a request to reset the password for your Handwork account.</p>
      
      <div style="text-align: center; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 32px; border-radius: 12px; margin: 24px 0; border: 2px dashed #86efac;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #16a34a; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Verification Code</p>
        <p style="margin: 0; font-size: 36px; font-weight: 800; color: #166534; letter-spacing: 8px; font-family: monospace;">${otpCode}</p>
      </div>

      <div class="highlight-box warning">
        <strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10" stroke="#d97706" stroke-width="2"/><path d="M12 6v6l4 2" stroke="#d97706" stroke-width="2" stroke-linecap="round"/></svg>Code expires in ${expiresInMinutes} minutes</strong><br>
        <span style="color: #92400e;">For your security, this code has a limited validity period.</span>
      </div>

      <div class="highlight-box error" style="margin-top: 16px;">
        <strong>Didn't request this?</strong><br>
        <span style="color: #7f1d1d;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</span>
      </div>

      <h3 style="font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 24px 0 12px;">Strong Password Tips:</h3>
      <ul style="color: #4b5563; font-size: 14px; padding-left: 20px; line-height: 2;">
        <li>Use at least 8 characters</li>
        <li>Mix uppercase and lowercase letters</li>
        <li>Include numbers and special characters</li>
        <li>Don't reuse passwords from other accounts</li>
      </ul>
      
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px; text-align: center;">This is an automated security message. Please do not reply.</p>
    `;

    const html = this.wrapInTemplate(content, 'Password Reset');

    return this.sendEmail({
      to: user.email,
      subject: `Reset your Handwork password`,
      html,
      text: `Your Handwork password reset code is: ${otpCode}. This code expires in ${expiresInMinutes} minutes. If you didn't request this, please ignore this email.`,
    });
  }

  /**
   * Send generic verification code email (for login, signup, etc.)
   */
  async sendVerificationCodeEmail(
    email: string,
    code: string,
    options: {
      subject: string;
      title: string;
      description: string;
      expiresInMinutes?: number;
    }
  ): Promise<boolean> {
    const { subject, title, description, expiresInMinutes = 10 } = options;

    const content = `
      <p class="greeting">Hello,</p>
      <h1 class="main-title"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 8px;"><circle cx="12" cy="12" r="10" fill="#16a34a"/><path d="M12 7v5l3 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${title}</h1>
      <p class="subtitle">${description}</p>
      
      <div style="text-align: center; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 32px; border-radius: 12px; margin: 24px 0; border: 2px dashed #86efac;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #16a34a; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Code</p>
        <p style="margin: 0; font-size: 42px; font-weight: 800; color: #166534; letter-spacing: 12px; font-family: monospace;">${code}</p>
      </div>

      <div class="highlight-box warning">
        <strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10" stroke="#d97706" stroke-width="2"/><path d="M12 6v6l4 2" stroke="#d97706" stroke-width="2" stroke-linecap="round"/></svg>Code expires in ${expiresInMinutes} minutes</strong><br>
        <span style="color: #92400e;">Enter this code in the app to continue. Do not share it with anyone.</span>
      </div>

      <div class="highlight-box" style="background: #f3f4f6; border-left-color: #9ca3af; margin-top: 16px;">
        <strong>Security Tip:</strong><br>
        <span style="color: #4b5563;">Handwork will never call or text asking for your verification code. If someone asks for it, it's a scam.</span>
      </div>
      
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px; text-align: center;">If you didn't request this code, please ignore this email.</p>
    `;

    const html = this.wrapInTemplate(content, title);

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `Your Handwork verification code is: ${code}. This code expires in ${expiresInMinutes} minutes. Do not share this code with anyone.`,
    });
  }

  /**
   * Send password changed confirmation email
   */
  async sendPasswordChangedEmail(user: User): Promise<boolean> {
    if (!user.email) {
      this.logger.warn(`Cannot send password changed email - user ${user.id} has no email`);
      return false;
    }

    const changeTime = new Date().toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const content = `
      <p class="greeting">Hi ${user.name || 'there'},</p>
      <h1 class="main-title"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 8px;"><circle cx="12" cy="12" r="10" fill="#16a34a"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Password Changed Successfully</h1>
      <p class="subtitle">Your Handwork account password has been updated.</p>
      
      <div class="highlight-box success">
        <strong>Password updated on:</strong><br>
        <span style="color: #166534; font-size: 16px;">${changeTime}</span>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Account</span>
          <span class="info-value">${user.email}</span>
        </div>
      </div>

      <div class="highlight-box error">
        <strong>Wasn't you?</strong><br>
        <span style="color: #7f1d1d;">If you didn't change your password, your account may be compromised. Please:</span>
        <ol style="margin: 12px 0 0 0; padding-left: 20px; color: #7f1d1d; font-size: 14px;">
          <li>Reset your password immediately</li>
          <li>Enable two-factor authentication</li>
          <li>Contact our support team</li>
        </ol>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://handwork.ng" class="cta-button">Open Handwork App</a>
      </div>
      
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px; text-align: center;">Thank you for keeping your account secure!</p>
    `;

    const html = this.wrapInTemplate(content, 'Password Changed');

    return this.sendEmail({
      to: user.email,
      subject: `Your Handwork password has been changed`,
      html,
      text: `Your Handwork account password was successfully changed on ${changeTime}. If you didn't make this change, please reset your password immediately and contact support.`,
    });
  }


  /**
   * Send subscription expired email
   */
  async sendSubscriptionExpiredEmail(user: User, subscriptionDetails: {
    tier: string;
    userType: 'farmer' | 'rider';
    expiredAt: Date;
    benefits: string[];
  }): Promise<boolean> {
    if (!user.email) {
      this.logger.warn(`Cannot send subscription expired email - user ${user.id} has no email`);
      return false;
    }

    const { tier, userType, expiredAt, benefits } = subscriptionDetails;
    const expiredDate = expiredAt.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const userTypeDisplay = userType === 'farmer' ? 'Seller' : 'Rider';
    const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Expired - Handwork</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 40px rgba(239, 68, 68, 0.15);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%); padding: 50px 40px; text-align: center;">
                    <!-- Expired Icon SVG -->
                    <div style="margin-bottom: 24px;">
                      <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="35" cy="35" r="35" fill="rgba(255,255,255,0.15)"/>
                        <circle cx="35" cy="35" r="25" fill="rgba(255,255,255,0.2)"/>
                        <circle cx="35" cy="35" r="18" fill="white"/>
                        <path d="M35 25V35L41 38" stroke="#EF4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M28 42L42 28" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Subscription Expired</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 15px;">Your ${tierDisplay} ${userTypeDisplay} subscription has ended</p>
                  </td>
                </tr>

                <!-- Expired Illustration -->
                <tr>
                  <td style="padding: 40px 40px 0; text-align: center;">
                    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <!-- Calendar with X -->
                      <rect x="40" y="20" width="60" height="60" rx="8" fill="#FEE2E2" stroke="#EF4444" stroke-width="2"/>
                      <rect x="40" y="20" width="60" height="18" rx="8" fill="#EF4444"/>
                      <rect x="40" y="32" width="60" height="6" fill="#EF4444"/>
                      <path d="M55 55L85 75M55 75L85 55" stroke="#EF4444" stroke-width="4" stroke-linecap="round"/>
                      <!-- Decorative -->
                      <circle cx="20" cy="50" r="6" fill="#FECACA"/>
                      <circle cx="120" cy="40" r="4" fill="#FCA5A5"/>
                      <circle cx="25" cy="80" r="3" fill="#EF4444" opacity="0.3"/>
                    </svg>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 30px 40px 40px;">
                    <p style="font-size: 18px; color: #1F2937; margin: 0 0 16px; font-weight: 500;">Hello ${user.name || 'there'},</p>
                    <p style="font-size: 15px; color: #6B7280; line-height: 1.7; margin: 0 0 25px;">
                      Your <strong>${tierDisplay}</strong> ${userTypeDisplay} subscription expired on <strong>${expiredDate}</strong>. We're sad to see your premium benefits end.
                    </p>

                    <!-- Lost Benefits Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FEF2F2; border-radius: 16px; margin: 0 0 25px; border: 1px solid #FECACA;">
                      <tr>
                        <td style="padding: 24px;">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 44px; vertical-align: top;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 9V13M12 17H12.01M12 3L2 20H22L12 3Z" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                              </td>
                              <td>
                                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #991B1B;">Benefits You've Lost</p>
                                <table cellpadding="0" cellspacing="0">
                                  ${benefits.map(benefit => `
                                  <tr>
                                    <td style="padding: 4px 0; font-size: 13px; color: #7F1D1D;">
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 8px;">
                                        <path d="M4 4L12 12M4 12L12 4" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
                                      </svg>
                                      ${benefit}
                                    </td>
                                  </tr>
                                  `).join('')}
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Renew Now Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #8B5CF615 0%, #7C3AED15 100%); border-radius: 16px; margin: 0 0 30px; border: 1px solid #8B5CF630;">
                      <tr>
                        <td style="padding: 24px;">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 50px; vertical-align: top;">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="16" cy="16" r="16" fill="#8B5CF6"/>
                                  <path d="M16 10V16L20 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                  <path d="M22 14L22 22L14 22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                              </td>
                              <td>
                                <p style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #5B21B6;">Don't miss out!</p>
                                <p style="margin: 0; font-size: 14px; color: #6B7280; line-height: 1.5;">
                                  Renew your subscription now to restore all your premium benefits and continue growing your business.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                      <tr>
                        <td align="center">
                          <a href="#" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
                            Renew Subscription
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 14px; color: #9CA3AF; line-height: 1.7; margin: 0; text-align: center;">
                      Questions? Contact our support team for assistance.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto 16px;">
                      <tr>
                        <td>
                          <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="30" cy="30" r="30" fill="#8B5CF6"/>
                            <path d="M20 25C20 22.2386 22.2386 20 25 20H35C37.7614 20 40 22.2386 40 25V35C40 37.7614 37.7614 40 35 40H25C22.2386 40 20 37.7614 20 35V25Z" fill="white"/>
                            <path d="M26 28L30 32L34 28" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </td>
                        <td style="padding-left: 10px; font-size: 18px; font-weight: 700; color: #8B5CF6;">Handwork</td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #6B7280;">We'd love to have you back!</p>
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="#" style="text-decoration: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z"/>
                            </svg>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="#" style="text-decoration: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                              <path d="M23 3C22.0424 3.67548 20.9821 4.19211 19.86 4.53C19.2577 3.83751 18.4573 3.34669 17.567 3.12393C16.6767 2.90116 15.7395 2.9572 14.8821 3.28445C14.0247 3.61171 13.2884 4.1944 12.773 4.95372C12.2575 5.71303 11.9877 6.61234 12 7.53V8.53C10.2426 8.57557 8.50127 8.18581 6.93101 7.39545C5.36074 6.60508 4.01032 5.43864 3 4C3 4 -1 13 8 17C5.94053 18.398 3.48716 19.0989 1 19C10 24 21 19 21 7.5C20.9991 7.22145 20.9723 6.94359 20.92 6.67C21.9406 5.66349 22.6608 4.39271 23 3Z"/>
                            </svg>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="#" style="text-decoration: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                              <rect x="2" y="2" width="20" height="20" rx="5" stroke="#9CA3AF" stroke-width="2" fill="none"/>
                              <circle cx="12" cy="12" r="4" stroke="#9CA3AF" stroke-width="2" fill="none"/>
                              <circle cx="18" cy="6" r="1.5" fill="#9CA3AF"/>
                            </svg>
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 20px 0 0; font-size: 11px; color: #D1D5DB;">
                      © ${new Date().getFullYear()} Handwork. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Your ${tierDisplay} ${userTypeDisplay} Subscription has Expired`,
      html,
      text: `Your ${tierDisplay} ${userTypeDisplay} subscription expired on ${expiredDate}. Renew now to restore your premium benefits!`,
    });
  }

  /**
   * Send subscription renewed email
   */
  async sendSubscriptionRenewedEmail(user: User, subscriptionDetails: {
    tier: string;
    userType: 'farmer' | 'rider';
    startDate: Date;
    endDate: Date;
    amount: number;
    benefits: string[];
  }): Promise<boolean> {
    if (!user.email) {
      this.logger.warn(`Cannot send subscription renewed email - user ${user.id} has no email`);
      return false;
    }

    const { tier, userType, startDate, endDate, amount, benefits } = subscriptionDetails;
    const renewedDate = startDate.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const expiresDate = endDate.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const userTypeDisplay = userType === 'farmer' ? 'Seller' : 'Rider';
    const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Renewed - Handwork</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 40px rgba(16, 185, 129, 0.15);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%); padding: 50px 40px; text-align: center;">
                    <!-- Success Icon SVG -->
                    <div style="margin-bottom: 24px;">
                      <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="35" cy="35" r="35" fill="rgba(255,255,255,0.15)"/>
                        <circle cx="35" cy="35" r="25" fill="rgba(255,255,255,0.2)"/>
                        <circle cx="35" cy="35" r="18" fill="white"/>
                        <path d="M26 35L32 41L44 29" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Subscription Renewed!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 15px;">Your ${tierDisplay} ${userTypeDisplay} subscription is active</p>
                  </td>
                </tr>

                <!-- Success Illustration -->
                <tr>
                  <td style="padding: 40px 40px 0; text-align: center;">
                    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <!-- Star/Badge -->
                      <path d="M70 15L77 35H98L81 48L88 68L70 55L52 68L59 48L42 35H63L70 15Z" fill="#10B981" opacity="0.2" stroke="#10B981" stroke-width="2"/>
                      <circle cx="70" cy="42" r="12" fill="#10B981"/>
                      <path d="M65 42L68 45L75 38" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <!-- Decorative -->
                      <circle cx="25" cy="40" r="6" fill="#A7F3D0"/>
                      <circle cx="115" cy="50" r="4" fill="#6EE7B7"/>
                      <circle cx="30" cy="75" r="3" fill="#10B981" opacity="0.4"/>
                      <circle cx="110" cy="25" r="5" fill="#34D399" opacity="0.5"/>
                      <!-- Confetti -->
                      <rect x="20" y="30" width="4" height="8" rx="2" fill="#10B981" transform="rotate(15 20 30)" opacity="0.6"/>
                      <rect x="115" y="65" width="3" height="6" rx="1.5" fill="#059669" transform="rotate(-20 115 65)" opacity="0.5"/>
                    </svg>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 30px 40px 40px;">
                    <p style="font-size: 18px; color: #1F2937; margin: 0 0 16px; font-weight: 500;">Hello ${user.name || 'there'},</p>
                    <p style="font-size: 15px; color: #6B7280; line-height: 1.7; margin: 0 0 25px;">
                      Great news! Your <strong>${tierDisplay}</strong> ${userTypeDisplay} subscription has been successfully renewed. All your premium benefits are now active!
                    </p>

                    <!-- Subscription Details Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border-radius: 16px; margin: 0 0 25px; border: 1px solid #A7F3D0;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 1px;">Subscription Details</p>
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #A7F3D0;">
                                <table cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td style="width: 40px; vertical-align: top;">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#059669"/>
                                      </svg>
                                    </td>
                                    <td>
                                      <span style="font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">Plan</span><br>
                                      <span style="font-size: 14px; color: #1F2937; font-weight: 600;">${tierDisplay} ${userTypeDisplay}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #A7F3D0;">
                                <table cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td style="width: 40px; vertical-align: top;">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#059669" stroke-width="2"/>
                                        <path d="M16 2V6M8 2V6M3 10H21" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
                                      </svg>
                                    </td>
                                    <td>
                                      <span style="font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">Renewed On</span><br>
                                      <span style="font-size: 14px; color: #1F2937; font-weight: 600;">${renewedDate}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #A7F3D0;">
                                <table cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td style="width: 40px; vertical-align: top;">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="#059669" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
                                      </svg>
                                    </td>
                                    <td>
                                      <span style="font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">Valid Until</span><br>
                                      <span style="font-size: 14px; color: #1F2937; font-weight: 600;">${expiresDate}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0;">
                                <table cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td style="width: 40px; vertical-align: top;">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="#059669" stroke-width="2"/>
                                        <path d="M12 6V12M8 14H16" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
                                      </svg>
                                    </td>
                                    <td>
                                      <span style="font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</span><br>
                                      <span style="font-size: 14px; color: #1F2937; font-weight: 600;">₦${amount.toLocaleString()}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Benefits Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #F9FAFB; border-radius: 16px; margin: 0 0 30px; border: 1px solid #E5E7EB;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 1px;">Your Premium Benefits</p>
                          <table cellpadding="0" cellspacing="0">
                            ${benefits.map(benefit => `
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #374151;">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="vertical-align: middle; margin-right: 10px;">
                                  <circle cx="9" cy="9" r="9" fill="#10B981"/>
                                  <path d="M5 9L8 12L13 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                ${benefit}
                              </td>
                            </tr>
                            `).join('')}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                      <tr>
                        <td align="center">
                          <a href="#" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                            Start Earning More
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 14px; color: #9CA3AF; line-height: 1.7; margin: 0; text-align: center;">
                      Thank you for being a premium member!
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto 16px;">
                      <tr>
                        <td>
                          <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="30" cy="30" r="30" fill="#8B5CF6"/>
                            <path d="M20 25C20 22.2386 22.2386 20 25 20H35C37.7614 20 40 22.2386 40 25V35C40 37.7614 37.7614 40 35 40H25C22.2386 40 20 37.7614 20 35V25Z" fill="white"/>
                            <path d="M26 28L30 32L34 28" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </td>
                        <td style="padding-left: 10px; font-size: 18px; font-weight: 700; color: #8B5CF6;">Handwork</td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #6B7280;">Grow your business with us!</p>
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="#" style="text-decoration: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z"/>
                            </svg>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="#" style="text-decoration: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                              <path d="M23 3C22.0424 3.67548 20.9821 4.19211 19.86 4.53C19.2577 3.83751 18.4573 3.34669 17.567 3.12393C16.6767 2.90116 15.7395 2.9572 14.8821 3.28445C14.0247 3.61171 13.2884 4.1944 12.773 4.95372C12.2575 5.71303 11.9877 6.61234 12 7.53V8.53C10.2426 8.57557 8.50127 8.18581 6.93101 7.39545C5.36074 6.60508 4.01032 5.43864 3 4C3 4 -1 13 8 17C5.94053 18.398 3.48716 19.0989 1 19C10 24 21 19 21 7.5C20.9991 7.22145 20.9723 6.94359 20.92 6.67C21.9406 5.66349 22.6608 4.39271 23 3Z"/>
                            </svg>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="#" style="text-decoration: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                              <rect x="2" y="2" width="20" height="20" rx="5" stroke="#9CA3AF" stroke-width="2" fill="none"/>
                              <circle cx="12" cy="12" r="4" stroke="#9CA3AF" stroke-width="2" fill="none"/>
                              <circle cx="18" cy="6" r="1.5" fill="#9CA3AF"/>
                            </svg>
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 20px 0 0; font-size: 11px; color: #D1D5DB;">
                      © ${new Date().getFullYear()} Handwork. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Your ${tierDisplay} ${userTypeDisplay} Subscription has been Renewed!`,
      html,
      text: `Your ${tierDisplay} ${userTypeDisplay} subscription has been renewed on ${renewedDate} and is valid until ${expiresDate}. Amount paid: ₦${amount.toLocaleString()}.`,
    });
  }

  /**
   * Send subscription expiring soon email
   */
  async sendSubscriptionExpiringSoonEmail(user: User, subscriptionDetails: {
    tier: string;
    userType: 'farmer' | 'rider';
    expiresAt: Date;
    daysRemaining: number;
    renewalPrice: number;
  }): Promise<boolean> {
    if (!user.email) {
      this.logger.warn(`Cannot send subscription expiring soon email - user ${user.id} has no email`);
      return false;
    }

    const { tier, userType, expiresAt, daysRemaining, renewalPrice } = subscriptionDetails;
    const expiryDate = expiresAt.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const userTypeDisplay = userType === 'farmer' ? 'Seller' : 'Rider';
    const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1);
    
    // Set urgency color based on days remaining
    const urgencyColors = daysRemaining <= 1 
      ? { primary: '#EF4444', secondary: '#DC2626', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)' }
      : daysRemaining <= 3 
        ? { primary: '#F59E0B', secondary: '#D97706', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)' }
        : { primary: '#8B5CF6', secondary: '#7C3AED', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)' };

    const urgencyText = daysRemaining <= 1 ? 'Expires Tomorrow!' : daysRemaining <= 3 ? 'Expiring Very Soon!' : 'Expiring Soon';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Expiring - Handwork</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 40px ${urgencyColors.primary}25;">
                
                <!-- Header -->
                <tr>
                  <td style="background: ${urgencyColors.gradient}; padding: 50px 40px; text-align: center;">
                    <!-- Clock Warning Icon SVG -->
                    <div style="margin-bottom: 24px;">
                      <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="35" cy="35" r="35" fill="rgba(255,255,255,0.15)"/>
                        <circle cx="35" cy="35" r="25" fill="rgba(255,255,255,0.2)"/>
                        <circle cx="35" cy="35" r="18" stroke="white" stroke-width="3" fill="none"/>
                        <path d="M35 23V35L43 39" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="52" cy="52" r="10" fill="white"/>
                        <path d="M52 48V52L55 54" stroke="${urgencyColors.primary}" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${urgencyText}</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 15px;">Your subscription expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}</p>
                  </td>
                </tr>

                <!-- Countdown Display -->
                <tr>
                  <td style="padding: 40px 40px 0; text-align: center;">
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 20px 30px; background: ${urgencyColors.primary}15; border-radius: 16px; border: 2px solid ${urgencyColors.primary}30;">
                          <p style="margin: 0; font-size: 48px; font-weight: 700; color: ${urgencyColors.primary};">${daysRemaining}</p>
                          <p style="margin: 0; font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 2px;">Day${daysRemaining > 1 ? 's' : ''} Left</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 30px 40px 40px;">
                    <p style="font-size: 18px; color: #1F2937; margin: 0 0 16px; font-weight: 500;">Hello ${user.name || 'there'},</p>
                    <p style="font-size: 15px; color: #6B7280; line-height: 1.7; margin: 0 0 25px;">
                      Your <strong>${tierDisplay}</strong> ${userTypeDisplay} subscription will expire on <strong>${expiryDate}</strong>. Don't lose your premium benefits!
                    </p>

                    <!-- Expiry Details Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #F9FAFB; border-radius: 16px; margin: 0 0 25px; border: 1px solid #E5E7EB;">
                      <tr>
                        <td style="padding: 24px;">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                                <table cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td style="width: 40px; vertical-align: top;">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="${urgencyColors.primary}"/>
                                      </svg>
                                    </td>
                                    <td>
                                      <span style="font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">Current Plan</span><br>
                                      <span style="font-size: 14px; color: #1F2937; font-weight: 600;">${tierDisplay} ${userTypeDisplay}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                                <table cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td style="width: 40px; vertical-align: top;">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="${urgencyColors.primary}" stroke-width="2"/>
                                        <path d="M16 2V6M8 2V6M3 10H21" stroke="${urgencyColors.primary}" stroke-width="2" stroke-linecap="round"/>
                                      </svg>
                                    </td>
                                    <td>
                                      <span style="font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">Expires On</span><br>
                                      <span style="font-size: 14px; color: #1F2937; font-weight: 600;">${expiryDate}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0;">
                                <table cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td style="width: 40px; vertical-align: top;">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="${urgencyColors.primary}" stroke-width="2"/>
                                        <path d="M12 6V12M8 14H16" stroke="${urgencyColors.primary}" stroke-width="2" stroke-linecap="round"/>
                                      </svg>
                                    </td>
                                    <td>
                                      <span style="font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">Renewal Price</span><br>
                                      <span style="font-size: 14px; color: #1F2937; font-weight: 600;">₦${renewalPrice.toLocaleString()}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Renew CTA Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #10B98115 0%, #05966915 100%); border-radius: 16px; margin: 0 0 30px; border: 1px solid #10B98130;">
                      <tr>
                        <td style="padding: 24px;">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 50px; vertical-align: top;">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="16" cy="16" r="16" fill="#10B981"/>
                                  <path d="M12 16L15 19L20 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                              </td>
                              <td>
                                <p style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #047857;">Renew now to keep your benefits!</p>
                                <p style="margin: 0; font-size: 14px; color: #6B7280; line-height: 1.5;">
                                  Don't let your premium status expire. Renew today and continue enjoying all your exclusive benefits.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                      <tr>
                        <td align="center">
                          <a href="#" style="display: inline-block; background: ${urgencyColors.gradient}; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px ${urgencyColors.primary}40;">
                            Renew Now
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 14px; color: #9CA3AF; line-height: 1.7; margin: 0; text-align: center;">
                      Need help? Contact our support team.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto 16px;">
                      <tr>
                        <td>
                          <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="30" cy="30" r="30" fill="#8B5CF6"/>
                            <path d="M20 25C20 22.2386 22.2386 20 25 20H35C37.7614 20 40 22.2386 40 25V35C40 37.7614 37.7614 40 35 40H25C22.2386 40 20 37.7614 20 35V25Z" fill="white"/>
                            <path d="M26 28L30 32L34 28" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </td>
                        <td style="padding-left: 10px; font-size: 18px; font-weight: 700; color: #8B5CF6;">Handwork</td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #6B7280;">Keep growing with premium!</p>
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="#" style="text-decoration: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z"/>
                            </svg>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="#" style="text-decoration: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                              <path d="M23 3C22.0424 3.67548 20.9821 4.19211 19.86 4.53C19.2577 3.83751 18.4573 3.34669 17.567 3.12393C16.6767 2.90116 15.7395 2.9572 14.8821 3.28445C14.0247 3.61171 13.2884 4.1944 12.773 4.95372C12.2575 5.71303 11.9877 6.61234 12 7.53V8.53C10.2426 8.57557 8.50127 8.18581 6.93101 7.39545C5.36074 6.60508 4.01032 5.43864 3 4C3 4 -1 13 8 17C5.94053 18.398 3.48716 19.0989 1 19C10 24 21 19 21 7.5C20.9991 7.22145 20.9723 6.94359 20.92 6.67C21.9406 5.66349 22.6608 4.39271 23 3Z"/>
                            </svg>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="#" style="text-decoration: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
                              <rect x="2" y="2" width="20" height="20" rx="5" stroke="#9CA3AF" stroke-width="2" fill="none"/>
                              <circle cx="12" cy="12" r="4" stroke="#9CA3AF" stroke-width="2" fill="none"/>
                              <circle cx="18" cy="6" r="1.5" fill="#9CA3AF"/>
                            </svg>
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 20px 0 0; font-size: 11px; color: #D1D5DB;">
                      © ${new Date().getFullYear()} Handwork. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `${daysRemaining <= 1 ? 'URGENT: ' : ''}Your ${tierDisplay} ${userTypeDisplay} Subscription expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
      html,
      text: `Your ${tierDisplay} ${userTypeDisplay} subscription expires on ${expiryDate} (${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining). Renew now for ₦${renewalPrice.toLocaleString()} to keep your premium benefits!`,
    });
  }

  /**
   * Send promotional email to a user
   */
  async sendPromotionalEmail(
    user: { email: string; firstName?: string },
    subject: string,
    content: string,
    template: 'announcement' | 'promotion' | 'newsletter' | 'update',
    ctaButton?: { text: string; url: string },
    imageUrl?: string,
  ): Promise<boolean> {
    if (!user.email) {
      this.logger.warn('Cannot send promotional email - user has no email');
      return false;
    }

    const greeting = user.firstName ? `Hello ${user.firstName}` : 'Hello';
    
    // Template-specific styling
    const templateStyles = {
      announcement: {
        headerBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        accentColor: '#3b82f6',
        icon: '📢',
        title: 'Announcement',
      },
      promotion: {
        headerBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        accentColor: '#f59e0b',
        icon: '🎉',
        title: 'Special Offer',
      },
      newsletter: {
        headerBg: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
        accentColor: '#16a34a',
        icon: '📰',
        title: 'Newsletter',
      },
      update: {
        headerBg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        accentColor: '#8b5cf6',
        icon: '🚀',
        title: 'Update',
      },
    };

    const style = templateStyles[template];
    
    this.logger.log(`📧 Preparing promotional email with CTA: ${ctaButton ? `${ctaButton.text} -> ${ctaButton.url}` : 'none'}, Image: ${imageUrl || 'none'}`);
    
    const ctaHtml = ctaButton && ctaButton.text && ctaButton.url ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${ctaButton.url}" style="display: inline-block; padding: 14px 32px; background-color: ${style.accentColor}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
          ${ctaButton.text}
        </a>
      </div>
    ` : '';

    const imageHtml = imageUrl ? `
      <tr>
        <td style="padding: 0;">
          <img src="${imageUrl}" alt="Promotional Banner" style="width: 100%; max-height: 300px; object-fit: cover; display: block;" />
        </td>
      </tr>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                
                <!-- Header -->
                <tr>
                  <td style="background: ${style.headerBg}; padding: 40px 24px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 12px;">${style.icon}</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${style.title}</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Handwork Marketplace</p>
                  </td>
                </tr>

                <!-- Banner Image -->
                ${imageHtml}

                <!-- Body -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <p style="margin: 0 0 16px; color: #6b7280; font-size: 15px;">${greeting},</p>
                    
                    <div style="color: #374151; font-size: 15px; line-height: 1.7;">
                      ${content.split('\n').map(p => `<p style="margin: 0 0 16px;">${p}</p>`).join('')}
                    </div>

                    ${ctaHtml}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                      You received this email because you are a valued member of Handwork.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      © ${new Date().getFullYear()} Handwork. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `${greeting},\n\n${content}${ctaButton ? `\n\n${ctaButton.text}: ${ctaButton.url}` : ''}`,
    });
  }

  /**
   * Send bulk promotional emails to multiple users
   */
  async sendBulkPromotionalEmails(
    users: Array<{ email: string; firstName?: string }>,
    subject: string,
    content: string,
    template: 'announcement' | 'promotion' | 'newsletter' | 'update',
    ctaButton?: { text: string; url: string },
    imageUrl?: string,
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const result = await this.sendPromotionalEmail(user, subject, content, template, ctaButton, imageUrl);
      if (result) {
        sent++;
      } else {
        failed++;
      }
      // Small delay to avoid overwhelming the email server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.logger.log(`📧 Bulk promotional email completed: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }
}
