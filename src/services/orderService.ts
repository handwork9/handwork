import { apiClient } from './apiClient';
import {
  Order,
  OrderStatus,
  CreateOrderData,
  DeliveryConfirmation,
  ApiResponse,
  PaginatedResponse,
} from '../types';

interface OrdersQueryParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  status?: OrderStatus;
}

// Helper to extract data from wrapped response { success: true, data: {...} }
const extractData = <T>(response: any): T => {
  if (response && response.success && response.data !== undefined) {
    return response.data;
  }
  return response;
};

export const orderService = {
  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    return apiClient.post('/orders', data);
  },

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<any>(`/orders/${id}`);
    const order = extractData<Order>(response);
    console.log('[orderService.getOrderById] Order:', JSON.stringify(order, null, 2));
    console.log('[orderService.getOrderById] assignedRider:', order?.assignedRider);
    return order;
  },

  /**
   * Get orders (generic method with filters)
   */
  async getOrders(
    params: OrdersQueryParams = {}
  ): Promise<{ orders: Order[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.status) queryParams.append('status', params.status);
    
    const response = await apiClient.get<any>(
      `/orders?${queryParams.toString()}`
    );
    
    console.log('[orderService.getOrders] Raw response keys:', Object.keys(response || {}));
    console.log('[orderService.getOrders] response.success:', response?.success);
    console.log('[orderService.getOrders] response.data type:', typeof response?.data);
    if (response?.data && typeof response.data === 'object') {
      console.log('[orderService.getOrders] response.data keys:', Object.keys(response.data));
    }
    
    // Backend wraps with ResponseInterceptor: { success: true, data: PaginatedResponseDto }
    // PaginatedResponseDto has { data: [...orders], total: N, page: N, ... }
    let ordersArray: any[] = [];
    let total = 0;
    
    if (response?.success && response?.data) {
      // Wrapped response: { success: true, data: { data: [...], total: N } }
      const paginatedData = response.data;
      ordersArray = paginatedData?.data || [];
      total = paginatedData?.total || 0;
    } else if (Array.isArray(response?.data)) {
      // Direct array in data
      ordersArray = response.data;
      total = response.total || ordersArray.length;
    } else if (Array.isArray(response)) {
      // Direct array response
      ordersArray = response;
      total = ordersArray.length;
    }
    
    console.log('[orderService.getOrders] Extracted ordersArray length:', ordersArray.length);
    
    // Filter out invalid orders
    const validOrders = ordersArray.filter((o: any) => o != null && o.id != null);
    return {
      orders: validOrders,
      total: total || validOrders.length,
    };
  },

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<ApiResponse<Order>> {
    return apiClient.patch(`/orders/${orderId}/status`, { status });
  },

  /**
   * Get user's orders
   */
  async getUserOrders(
    page?: number,
    pageSize?: number
  ): Promise<ApiResponse<PaginatedResponse<Order>>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('pageSize', pageSize.toString());
    
    return apiClient.get(`/orders?${params.toString()}`);
  },

  /**
   * Get farmer's orders
   */
  async getFarmerOrders(
    farmerId: string,
    page?: number,
    pageSize?: number
  ): Promise<ApiResponse<PaginatedResponse<Order>>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('pageSize', pageSize.toString());
    
    // Farmers get their orders through the general /orders endpoint which filters by role
    return apiClient.get(`/orders?${params.toString()}`);
  },

  /**
   * Cancel an order
   */
  async cancelOrder(
    orderId: string,
    reason: string
  ): Promise<ApiResponse<Order>> {
    return apiClient.patch(`/orders/${orderId}/status`, { status: 'cancelled', reason });
  },

  /**
   * Rate an order (buyer)
   */
  async rateOrder(
    orderId: string,
    rating: number,
    review?: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`/orders/${orderId}/rate`, { rating, review });
  },
};

export const riderService = {
  /**
   * Get available delivery jobs for rider
   */
  async getAvailableJobs(latitude?: number, longitude?: number): Promise<ApiResponse<Order[]>> {
    const params = new URLSearchParams();
    if (latitude) params.append('latitude', latitude.toString());
    if (longitude) params.append('longitude', longitude.toString());
    return apiClient.get(`/dispatch/available-jobs?${params.toString()}`);
  },

  /**
   * Accept a delivery job via dispatch
   */
  async acceptJob(orderId: string): Promise<ApiResponse<{
    assignment: any;
    order: Order;
  }>> {
    return apiClient.post('/dispatch/accept', { orderId });
  },

  /**
   * Reject a delivery job via dispatch
   */
  async rejectJob(
    orderId: string,
    reason?: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/dispatch/decline', { orderId, reason });
  },

  /**
   * Update delivery status (rider)
   */
  async updateDeliveryStatus(
    deliveryId: string,
    status: string,
    proofOfDeliveryPhoto?: string
  ): Promise<ApiResponse<Order>> {
    return apiClient.patch(`/riders/deliveries/${deliveryId}/status`, { 
      status,
      ...(proofOfDeliveryPhoto && { proofOfDeliveryPhoto }),
    });
  },

  /**
   * Update rider location
   */
  async updateLocation(lat: number, lng: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch('/riders/location', { lat, lng });
  },

  /**
   * Get active delivery for rider
   */
  async getActiveDelivery(): Promise<ApiResponse<{ delivery: Order | null }>> {
    return apiClient.get('/riders/active-delivery');
  },

  /**
   * Get rider earnings
   */
  async getEarnings(period: 'today' | 'week' | 'month' | 'all' = 'week'): Promise<ApiResponse<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalDeliveries: number;
    averagePerDelivery: number;
    pendingPayout: number;
    recentDeliveries: any[];
    weeklyBreakdown: any[];
    dailyGoal?: number;
    rating?: number;
    completionRate?: number;
    streakDays?: number;
  }>> {
    return apiClient.get(`/riders/earnings?period=${period}`);
  },

  /**
   * Update daily earning goal
   */
  async updateDailyGoal(dailyGoal: number): Promise<ApiResponse<{ success: boolean; dailyGoal: number }>> {
    return apiClient.patch('/riders/daily-goal', { dailyGoal });
  },

  /**
   * Toggle rider availability
   */
  async toggleAvailability(isOnline?: boolean, isAvailable?: boolean): Promise<ApiResponse<{ isOnline: boolean; isAvailable: boolean }>> {
    return apiClient.patch('/riders/status', { isOnline, isAvailable });
  },

  /**
   * Get rider profile
   */
  async getProfile(): Promise<ApiResponse<any>> {
    return apiClient.get('/riders/profile');
  },

  /**
   * Get subscription pricing for all tiers
   */
  async getSubscriptionPricing(): Promise<ApiResponse<any>> {
    return apiClient.get('/riders/subscriptions/pricing');
  },

  /**
   * Get all subscription tiers with benefits
   */
  async getSubscriptionTiers(): Promise<ApiResponse<any>> {
    return apiClient.get('/riders/subscriptions/tiers');
  },

  /**
   * Subscribe to a premium tier
   */
  async subscribeToPremium(
    tier: 'basic' | 'silver' | 'gold' | 'platinum',
    duration: 'weekly' | 'monthly' | 'quarterly',
    paymentMethod: 'wallet' | 'card' = 'wallet',
    autoRenew: boolean = false
  ): Promise<ApiResponse<any>> {
    return apiClient.post('/riders/subscriptions/subscribe', {
      tier,
      duration,
      paymentMethod,
      autoRenew,
    });
  },

  /**
   * Cancel current subscription
   */
  async cancelSubscription(reason?: string): Promise<ApiResponse<any>> {
    return apiClient.post('/riders/subscriptions/cancel', { reason });
  },

  /**
   * Get current active subscription
   */
  async getCurrentSubscription(): Promise<ApiResponse<any>> {
    return apiClient.get('/riders/subscriptions/current');
  },

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(): Promise<ApiResponse<any>> {
    return apiClient.get('/riders/subscriptions/history');
  },
};
