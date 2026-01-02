import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import axios, { AxiosInstance } from 'axios';

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'image' | 'document' | 'interactive';
  text?: { body: string; preview_url?: boolean };
  template?: {
    name: string;
    language: { code: string };
    components?: Array<{
      type: 'header' | 'body' | 'button';
      parameters: Array<{ type: string; text?: string; image?: { link: string } }>;
    }>;
  };
  image?: { link: string; caption?: string };
  document?: { link: string; filename: string; caption?: string };
  interactive?: {
    type: 'button' | 'list';
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: any;
  };
}

export interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  languageCode: string;
  components?: Array<{
    type: 'header' | 'body' | 'button';
    sub_type?: 'url' | 'quick_reply';
    index?: number;
    parameters: Array<{ type: string; text?: string; image?: { link: string } }>;
  }>;
}

export interface OrderNotificationData {
  customerPhone: string;
  customerName: string;
  orderId: string;
  orderTotal: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryAddress?: string;
  estimatedDelivery?: string;
}

export interface DeliveryUpdateData {
  customerPhone: string;
  orderId: string;
  status: 'confirmed' | 'preparing' | 'on_the_way' | 'delivered';
  riderName?: string;
  riderPhone?: string;
  estimatedTime?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private client: AxiosInstance | null = null;
  private readonly phoneNumberId: string;
  private readonly businessAccountId: string;
  private readonly accessToken: string;
  private readonly apiVersion = 'v18.0';

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('whatsapp') private readonly whatsappQueue: Queue,
  ) {
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || '';
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
    this.businessAccountId = this.configService.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID') || '';

    if (this.accessToken && this.phoneNumberId) {
      this.client = axios.create({
        baseURL: `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log('WhatsApp Business API client initialized');
    } else {
      this.logger.warn('WhatsApp Business API not configured - WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID required');
    }
  }

  /**
   * Format phone number to WhatsApp format (with country code, no + or spaces)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If Nigerian number without country code, add 234
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '234' + cleaned.substring(1);
    }
    
    // If doesn't start with country code, assume Nigeria
    if (cleaned.length === 10) {
      cleaned = '234' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, message: string, previewUrl = false): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('WhatsApp not configured, message not sent');
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      
      const response = await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message, preview_url: previewUrl },
      });

      this.logger.log(`WhatsApp text message sent to ${formattedPhone}: ${response.data.messages?.[0]?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`, error.response?.data);
      return false;
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(data: WhatsAppTemplateMessage): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('WhatsApp not configured, template message not sent');
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(data.to);
      
      const response = await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: data.templateName,
          language: { code: data.languageCode },
          components: data.components,
        },
      });

      this.logger.log(`WhatsApp template message sent to ${formattedPhone}: ${response.data.messages?.[0]?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp template: ${error.message}`, error.response?.data);
      return false;
    }
  }

  /**
   * Send an image message
   */
  async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('WhatsApp not configured, image message not sent');
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      
      const response = await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'image',
        image: { link: imageUrl, caption },
      });

      this.logger.log(`WhatsApp image message sent to ${formattedPhone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp image: ${error.message}`, error.response?.data);
      return false;
    }
  }

  /**
   * Send interactive button message
   */
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    header?: string,
    footer?: string,
  ): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('WhatsApp not configured, button message not sent');
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      
      const message: any = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.slice(0, 3).map(btn => ({
              type: 'reply',
              reply: { id: btn.id, title: btn.title.substring(0, 20) },
            })),
          },
        },
      };

      if (header) {
        message.interactive.header = { type: 'text', text: header };
      }
      if (footer) {
        message.interactive.footer = { text: footer };
      }

      const response = await this.client.post('/messages', message);
      this.logger.log(`WhatsApp button message sent to ${formattedPhone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp buttons: ${error.message}`, error.response?.data);
      return false;
    }
  }

  /**
   * Send interactive list message
   */
  async sendListMessage(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    header?: string,
    footer?: string,
  ): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('WhatsApp not configured, list message not sent');
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      
      const message: any = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: bodyText },
          action: {
            button: buttonText.substring(0, 20),
            sections: sections.slice(0, 10).map(section => ({
              title: section.title.substring(0, 24),
              rows: section.rows.slice(0, 10).map(row => ({
                id: row.id,
                title: row.title.substring(0, 24),
                description: row.description?.substring(0, 72),
              })),
            })),
          },
        },
      };

      if (header) {
        message.interactive.header = { type: 'text', text: header };
      }
      if (footer) {
        message.interactive.footer = { text: footer };
      }

      const response = await this.client.post('/messages', message);
      this.logger.log(`WhatsApp list message sent to ${formattedPhone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp list: ${error.message}`, error.response?.data);
      return false;
    }
  }

  // ============ Order Notification Methods ============

  /**
   * Send order confirmation to customer
   */
  async sendOrderConfirmation(data: OrderNotificationData): Promise<boolean> {
    const itemsList = data.items
      .map(item => `• ${item.name} x${item.quantity} - ₦${item.price.toLocaleString()}`)
      .join('\n');

    const message = `🎉 *Order Confirmed!*

Hi ${data.customerName},

Your order *#${data.orderId}* has been placed successfully!

*Order Summary:*
${itemsList}

*Total:* ₦${data.orderTotal.toLocaleString()}

${data.deliveryAddress ? `*Delivery Address:*\n${data.deliveryAddress}\n` : ''}
${data.estimatedDelivery ? `*Estimated Delivery:* ${data.estimatedDelivery}` : ''}

Track your order in the Handwork app.

Thank you for shopping with us! 🌾`;

    return this.sendTextMessage(data.customerPhone, message);
  }

  /**
   * Send delivery status update
   */
  async sendDeliveryUpdate(data: DeliveryUpdateData): Promise<boolean> {
    const statusMessages = {
      confirmed: '✅ Your order has been confirmed and is being prepared.',
      preparing: '👨‍🍳 Your order is being prepared by the farmer.',
      on_the_way: `🚴 Your order is on the way!${data.riderName ? `\n\nRider: ${data.riderName}` : ''}${data.riderPhone ? `\nContact: ${data.riderPhone}` : ''}`,
      delivered: '🎉 Your order has been delivered! Enjoy your fresh produce!',
    };

    const message = `*Order Update #${data.orderId}*

${statusMessages[data.status]}

${data.estimatedTime ? `⏰ Estimated arrival: ${data.estimatedTime}` : ''}

Track your order in the Handwork app.`;

    return this.sendTextMessage(data.customerPhone, message);
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    phone: string,
    orderId: string,
    amount: number,
    paymentMethod: string,
  ): Promise<boolean> {
    const message = `💳 *Payment Received*

Your payment of *₦${amount.toLocaleString()}* for order *#${orderId}* has been received successfully!

Payment Method: ${paymentMethod}

Your order is now being processed.

Thank you for your purchase! 🛒`;

    return this.sendTextMessage(phone, message);
  }

  /**
   * Send farmer new order notification
   */
  async sendFarmerNewOrder(
    farmerPhone: string,
    farmerName: string,
    orderId: string,
    items: Array<{ name: string; quantity: number }>,
    totalAmount: number,
  ): Promise<boolean> {
    const itemsList = items.map(item => `• ${item.name} x${item.quantity}`).join('\n');

    const message = `🔔 *New Order Alert!*

Hi ${farmerName},

You have a new order *#${orderId}*!

*Items:*
${itemsList}

*Total Amount:* ₦${totalAmount.toLocaleString()}

Please confirm the order in your Handwork Farmer app.`;

    return this.sendButtonMessage(
      farmerPhone,
      message,
      [
        { id: `confirm_${orderId}`, title: '✅ Confirm Order' },
        { id: `view_${orderId}`, title: '👁️ View Details' },
      ],
    );
  }

  /**
   * Send rider delivery assignment
   */
  async sendRiderAssignment(
    riderPhone: string,
    riderName: string,
    orderId: string,
    pickupAddress: string,
    deliveryAddress: string,
    estimatedEarnings: number,
  ): Promise<boolean> {
    const message = `🚴 *New Delivery Request!*

Hi ${riderName},

New delivery available for order *#${orderId}*!

*Pickup:* ${pickupAddress}
*Delivery:* ${deliveryAddress}

*Estimated Earnings:* ₦${estimatedEarnings.toLocaleString()}

Accept quickly to secure this delivery!`;

    return this.sendButtonMessage(
      riderPhone,
      message,
      [
        { id: `accept_${orderId}`, title: '✅ Accept' },
        { id: `decline_${orderId}`, title: '❌ Decline' },
      ],
    );
  }

  // ============ Marketing & Support Methods ============

  /**
   * Send promotional message
   */
  async sendPromoMessage(
    phone: string,
    promoTitle: string,
    promoDescription: string,
    discountCode?: string,
    expiryDate?: string,
  ): Promise<boolean> {
    let message = `🎁 *${promoTitle}*

${promoDescription}`;

    if (discountCode) {
      message += `\n\n🏷️ Use code: *${discountCode}*`;
    }

    if (expiryDate) {
      message += `\n⏰ Offer expires: ${expiryDate}`;
    }

    message += '\n\nShop now on Handwork! 🌾';

    return this.sendTextMessage(phone, message);
  }

  /**
   * Send customer support greeting
   */
  async sendSupportGreeting(phone: string, customerName: string): Promise<boolean> {
    return this.sendListMessage(
      phone,
      `Hi ${customerName}! 👋\n\nWelcome to Handwork Support. How can we help you today?`,
      'Select Issue',
      [
        {
          title: 'Order Issues',
          rows: [
            { id: 'track_order', title: 'Track My Order', description: 'Check order status' },
            { id: 'cancel_order', title: 'Cancel Order', description: 'Request cancellation' },
            { id: 'refund', title: 'Request Refund', description: 'Refund assistance' },
          ],
        },
        {
          title: 'Account & Payment',
          rows: [
            { id: 'payment_issue', title: 'Payment Problem', description: 'Payment failed or issues' },
            { id: 'account_help', title: 'Account Help', description: 'Login or profile issues' },
          ],
        },
        {
          title: 'Other',
          rows: [
            { id: 'speak_agent', title: 'Speak to Agent', description: 'Connect with support' },
            { id: 'feedback', title: 'Give Feedback', description: 'Share your experience' },
          ],
        },
      ],
      '🌾 Handwork Support',
      'We typically respond within minutes',
    );
  }

  // ============ Queue Methods for Background Processing ============

  /**
   * Queue a WhatsApp message for background sending
   */
  async queueMessage(
    type: 'text' | 'template' | 'order_confirmation' | 'delivery_update' | 'promo',
    data: any,
    delay?: number,
  ): Promise<void> {
    await this.whatsappQueue.add(
      type,
      data,
      {
        delay: delay || 0,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log(`WhatsApp message queued: ${type}`);
  }

  /**
   * Bulk send messages (for campaigns)
   */
  async sendBulkMessages(
    phones: string[],
    message: string,
    batchSize = 50,
    delayBetweenBatches = 1000,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < phones.length; i += batchSize) {
      const batch = phones.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(phone => this.sendTextMessage(phone, message)),
      );

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          success++;
        } else {
          failed++;
        }
      });

      // Delay between batches to avoid rate limiting
      if (i + batchSize < phones.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    this.logger.log(`Bulk WhatsApp send complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  // ============ Webhook Handler ============

  /**
   * Handle incoming webhook from WhatsApp Business API
   */
  async handleWebhook(body: any): Promise<{ type: string; data: any } | null> {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) return null;

      // Handle incoming messages
      if (value.messages) {
        const message = value.messages[0];
        const from = message.from;
        const messageType = message.type;

        let content: any = null;

        switch (messageType) {
          case 'text':
            content = message.text?.body;
            break;
          case 'interactive':
            if (message.interactive?.type === 'button_reply') {
              content = {
                buttonId: message.interactive.button_reply.id,
                buttonTitle: message.interactive.button_reply.title,
              };
            } else if (message.interactive?.type === 'list_reply') {
              content = {
                listId: message.interactive.list_reply.id,
                listTitle: message.interactive.list_reply.title,
              };
            }
            break;
          case 'image':
            content = { imageId: message.image?.id, caption: message.image?.caption };
            break;
          case 'location':
            content = { lat: message.location?.latitude, lng: message.location?.longitude };
            break;
        }

        return {
          type: 'message',
          data: {
            from,
            messageType,
            content,
            timestamp: message.timestamp,
            messageId: message.id,
          },
        };
      }

      // Handle status updates
      if (value.statuses) {
        const status = value.statuses[0];
        return {
          type: 'status',
          data: {
            messageId: status.id,
            status: status.status, // sent, delivered, read, failed
            recipientId: status.recipient_id,
            timestamp: status.timestamp,
            errors: status.errors,
          },
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Error processing WhatsApp webhook: ${error.message}`);
      return null;
    }
  }
}
