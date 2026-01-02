import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import axios, { AxiosInstance } from 'axios';

export interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
}

export interface PageView {
  page_title: string;
  page_location: string;
  page_path: string;
  userId?: string;
  sessionId?: string;
}

export interface EcommerceEvent {
  event: 'view_item' | 'add_to_cart' | 'remove_from_cart' | 'begin_checkout' | 'purchase' | 'refund';
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category?: string;
    item_brand?: string;
    price: number;
    quantity: number;
  }>;
  transaction_id?: string;
  userId?: string;
}

export interface UserProperty {
  userId: string;
  properties: Record<string, string | number | boolean>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private client: AxiosInstance | null = null;
  private readonly measurementId: string;
  private readonly apiSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
  ) {
    this.measurementId = this.configService.get<string>('GA_MEASUREMENT_ID') || '';
    this.apiSecret = this.configService.get<string>('GA_API_SECRET') || '';

    if (this.measurementId && this.apiSecret) {
      this.client = axios.create({
        baseURL: 'https://www.google-analytics.com',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.logger.log('Google Analytics Measurement Protocol initialized');
    } else {
      this.logger.warn('Google Analytics not configured - GA_MEASUREMENT_ID and GA_API_SECRET required');
    }
  }

  /**
   * Send event to Google Analytics 4
   */
  private async sendToGA4(clientId: string, events: AnalyticsEvent[], userId?: string): Promise<boolean> {
    if (!this.client) {
      this.logger.debug('GA4 not configured, event not sent');
      return false;
    }

    try {
      const payload: any = {
        client_id: clientId,
        events: events.map(event => ({
          name: event.name,
          params: {
            ...event.params,
            engagement_time_msec: '100',
          },
        })),
      };

      if (userId) {
        payload.user_id = userId;
      }

      await this.client.post(
        `/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`,
        payload,
      );

      this.logger.debug(`GA4 events sent: ${events.map(e => e.name).join(', ')}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send GA4 events: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate a client ID for server-side tracking
   */
  private generateClientId(): string {
    return `${Date.now()}.${Math.random().toString(36).substring(2, 15)}`;
  }

  // ============ Event Tracking Methods ============

  /**
   * Track a custom event
   */
  async trackEvent(
    eventName: string,
    params?: Record<string, any>,
    userId?: string,
    clientId?: string,
  ): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: eventName,
      params: params || {},
    }], userId);
  }

  /**
   * Track page view
   */
  async trackPageView(pageView: PageView, clientId?: string): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: 'page_view',
      params: {
        page_title: pageView.page_title,
        page_location: pageView.page_location,
        page_path: pageView.page_path,
      },
    }], pageView.userId);
  }

  /**
   * Track screen view (for mobile app)
   */
  async trackScreenView(
    screenName: string,
    screenClass: string,
    userId?: string,
    clientId?: string,
  ): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: 'screen_view',
      params: {
        screen_name: screenName,
        screen_class: screenClass,
      },
    }], userId);
  }

  /**
   * Track user signup
   */
  async trackSignUp(method: string, userId: string, clientId?: string): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: 'sign_up',
      params: { method },
    }], userId);
  }

  /**
   * Track user login
   */
  async trackLogin(method: string, userId: string, clientId?: string): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: 'login',
      params: { method },
    }], userId);
  }

  /**
   * Track search
   */
  async trackSearch(
    searchTerm: string,
    resultsCount?: number,
    userId?: string,
    clientId?: string,
  ): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: 'search',
      params: {
        search_term: searchTerm,
        ...(resultsCount !== undefined && { results_count: resultsCount }),
      },
    }], userId);
  }

  // ============ E-commerce Tracking ============

  /**
   * Track product view
   */
  async trackViewItem(
    item: {
      id: string;
      name: string;
      category?: string;
      price: number;
      brand?: string;
    },
    userId?: string,
    clientId?: string,
  ): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: 'view_item',
      params: {
        currency: 'NGN',
        value: item.price,
        items: [{
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          item_brand: item.brand || 'Handwork',
          price: item.price,
          quantity: 1,
        }],
      },
    }], userId);
  }

  /**
   * Track add to cart
   */
  async trackAddToCart(
    item: {
      id: string;
      name: string;
      category?: string;
      price: number;
      quantity: number;
    },
    userId?: string,
    clientId?: string,
  ): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: 'add_to_cart',
      params: {
        currency: 'NGN',
        value: item.price * item.quantity,
        items: [{
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          quantity: item.quantity,
        }],
      },
    }], userId);
  }

  /**
   * Track remove from cart
   */
  async trackRemoveFromCart(
    item: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    },
    userId?: string,
    clientId?: string,
  ): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: 'remove_from_cart',
      params: {
        currency: 'NGN',
        value: item.price * item.quantity,
        items: [{
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        }],
      },
    }], userId);
  }

  /**
   * Track begin checkout
   */
  async trackBeginCheckout(
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      category?: string;
    }>,
    totalValue: number,
    coupon?: string,
    userId?: string,
    clientId?: string,
  ): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: 'begin_checkout',
      params: {
        currency: 'NGN',
        value: totalValue,
        ...(coupon && { coupon }),
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    }], userId);
  }

  /**
   * Track purchase (conversion)
   */
  async trackPurchase(
    transactionId: string,
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      category?: string;
    }>,
    totalValue: number,
    shipping?: number,
    tax?: number,
    coupon?: string,
    userId?: string,
    clientId?: string,
  ): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    return this.sendToGA4(cid, [{
      name: 'purchase',
      params: {
        transaction_id: transactionId,
        currency: 'NGN',
        value: totalValue,
        ...(shipping !== undefined && { shipping }),
        ...(tax !== undefined && { tax }),
        ...(coupon && { coupon }),
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    }], userId);
  }

  /**
   * Track refund
   */
  async trackRefund(
    transactionId: string,
    value: number,
    items?: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>,
    userId?: string,
    clientId?: string,
  ): Promise<boolean> {
    const cid = clientId || this.generateClientId();
    
    const params: any = {
      transaction_id: transactionId,
      currency: 'NGN',
      value,
    };

    if (items) {
      params.items = items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));
    }
    
    return this.sendToGA4(cid, [{
      name: 'refund',
      params,
    }], userId);
  }

  // ============ Custom Events ============

  /**
   * Track farmer registration
   */
  async trackFarmerRegistration(userId: string, farmLocation?: string, clientId?: string): Promise<boolean> {
    return this.trackEvent('farmer_registration', {
      user_type: 'farmer',
      farm_location: farmLocation,
    }, userId, clientId);
  }

  /**
   * Track rider registration
   */
  async trackRiderRegistration(userId: string, vehicleType?: string, clientId?: string): Promise<boolean> {
    return this.trackEvent('rider_registration', {
      user_type: 'rider',
      vehicle_type: vehicleType,
    }, userId, clientId);
  }

  /**
   * Track product listing by farmer
   */
  async trackProductListing(
    productId: string,
    category: string,
    price: number,
    farmerId: string,
    clientId?: string,
  ): Promise<boolean> {
    return this.trackEvent('product_listing', {
      product_id: productId,
      category,
      price,
    }, farmerId, clientId);
  }

  /**
   * Track delivery completion
   */
  async trackDeliveryComplete(
    orderId: string,
    deliveryTime: number, // in minutes
    riderId: string,
    distance?: number, // in km
    clientId?: string,
  ): Promise<boolean> {
    return this.trackEvent('delivery_complete', {
      order_id: orderId,
      delivery_time_minutes: deliveryTime,
      ...(distance && { delivery_distance_km: distance }),
    }, riderId, clientId);
  }

  /**
   * Track product rating
   */
  async trackProductRating(
    productId: string,
    rating: number,
    userId: string,
    clientId?: string,
  ): Promise<boolean> {
    return this.trackEvent('product_rating', {
      product_id: productId,
      rating,
    }, userId, clientId);
  }

  /**
   * Track coupon usage
   */
  async trackCouponUsage(
    couponCode: string,
    discountValue: number,
    orderId: string,
    userId: string,
    clientId?: string,
  ): Promise<boolean> {
    return this.trackEvent('coupon_usage', {
      coupon_code: couponCode,
      discount_value: discountValue,
      order_id: orderId,
    }, userId, clientId);
  }

  /**
   * Track referral
   */
  async trackReferral(
    referrerId: string,
    referredUserId: string,
    clientId?: string,
  ): Promise<boolean> {
    return this.trackEvent('referral_complete', {
      referrer_id: referrerId,
      referred_user_id: referredUserId,
    }, referrerId, clientId);
  }

  /**
   * Track wallet top-up
   */
  async trackWalletTopUp(
    amount: number,
    method: string,
    userId: string,
    clientId?: string,
  ): Promise<boolean> {
    return this.trackEvent('wallet_topup', {
      value: amount,
      currency: 'NGN',
      payment_method: method,
    }, userId, clientId);
  }

  /**
   * Track chat message sent
   */
  async trackChatMessage(
    chatType: 'farmer' | 'rider' | 'support',
    userId: string,
    clientId?: string,
  ): Promise<boolean> {
    return this.trackEvent('chat_message', {
      chat_type: chatType,
    }, userId, clientId);
  }

  // ============ Queue Methods for Background Processing ============

  /**
   * Queue an analytics event for background processing
   */
  async queueEvent(
    eventName: string,
    params?: Record<string, any>,
    userId?: string,
    clientId?: string,
  ): Promise<void> {
    await this.analyticsQueue.add('track-event', {
      eventName,
      params,
      userId,
      clientId,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });
  }

  /**
   * Queue e-commerce event
   */
  async queueEcommerceEvent(event: EcommerceEvent, clientId?: string): Promise<void> {
    await this.analyticsQueue.add('track-ecommerce', {
      event,
      clientId,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });
  }

  // ============ Data Export ============

  /**
   * Get analytics summary (for admin dashboard)
   * Note: For full analytics, use Google Analytics dashboard directly
   */
  async getAnalyticsSummary(startDate: Date, endDate: Date): Promise<{
    totalEvents: number;
    uniqueUsers: number;
    topEvents: Array<{ name: string; count: number }>;
  }> {
    // This would query from a local events table if you store events locally
    // For full analytics, use Google Analytics Data API or BigQuery
    return {
      totalEvents: 0,
      uniqueUsers: 0,
      topEvents: [],
    };
  }
}
