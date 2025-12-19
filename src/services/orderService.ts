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
    return extractData<Order>(response);
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
    
    const response = await apiClient.get<{ orders: Order[]; total: number }>(
      `/orders?${queryParams.toString()}`
    );
    return response;
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
    
    return apiClient.get(`/farmers/${farmerId}/orders?${params.toString()}`);
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
    status: string
  ): Promise<ApiResponse<Order>> {
    return apiClient.patch(`/riders/deliveries/${deliveryId}/status`, { status });
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
  }>> {
    return apiClient.get(`/riders/earnings?period=${period}`);
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
};
