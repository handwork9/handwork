import apiClient from './apiClient';

// Enums matching backend
export enum PromotionPlanId {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum PromotionBoostType {
  HOMEPAGE = 'homepage_feature',
  CATEGORY = 'category_top',
  SEARCH = 'search_priority',
  BADGE = 'promoted_badge',
}

export enum TargetAudienceType {
  ALL = 'all_buyers',
  PREMIUM = 'premium_buyers',
  LOCAL = 'local_buyers',
  REPEAT = 'repeat_customers',
}

export enum PromotionStatus {
  PENDING_PAYMENT = 'pending_payment',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Types
export interface PromotionPlan {
  id: PromotionPlanId;
  name: string;
  basePrice: number;
  duration: string;
  durationDays: number;
  features: string[];
  maxBoosts: number;
}

export interface CreatePromotionRequest {
  productId: string;
  planId: PromotionPlanId;
  durationDays: number;
  boosts?: PromotionBoostType[];
  targetAudience?: TargetAudienceType;
  totalCost: number;
}

export interface Promotion {
  id: string;
  productId: string;
  farmerId: string;
  planId: PromotionPlanId;
  durationDays: number;
  boosts: PromotionBoostType[];
  targetAudience: TargetAudienceType;
  totalCost: number;
  status: PromotionStatus;
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;
  conversions: number;
  createdAt: string;
}

export interface PromotionStats {
  totalPromotions: number;
  activePromotions: number;
  totalSpent: number;
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  averageConversionRate: number;
}

export interface CalculateCostResponse {
  cost: number;
  planId: PromotionPlanId;
  boosts: PromotionBoostType[];
  targetAudience: TargetAudienceType;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class PromotionService {
  /**
   * Get available promotion plans
   */
  async getPromotionPlans(): Promise<PromotionPlan[]> {
    const response = await apiClient.get<ApiResponse<PromotionPlan[]>>('/promotions/plans');
    
    // Handle double-wrapped response: { success, data: { success, data: [...] } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = response as any;
    
    // Check for double-wrapped response (data.data pattern)
    if (result?.data?.data && Array.isArray(result.data.data)) {
      return result.data.data;
    }
    // Check for single-wrapped response (data pattern)
    if (result?.data && Array.isArray(result.data)) {
      return result.data;
    }
    // Fallback: if response is already an array
    if (Array.isArray(response)) {
      return response;
    }
    console.log('Unexpected plans response format:', JSON.stringify(response));
    return [];
  }

  /**
   * Calculate promotion cost
   */
  async calculateCost(
    planId: PromotionPlanId,
    boosts: PromotionBoostType[] = [],
    targetAudience: TargetAudienceType = TargetAudienceType.ALL,
  ): Promise<CalculateCostResponse> {
    const boostsString = boosts.length > 0 ? boosts.join(',') : undefined;
    const params = new URLSearchParams({
      planId,
      ...(boostsString && { boosts: boostsString }),
      ...(targetAudience && { targetAudience }),
    });

    const response = await apiClient.get<ApiResponse<CalculateCostResponse>>(
      `/promotions/calculate?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Create a new promotion (deducts from wallet)
   */
  async createPromotion(request: CreatePromotionRequest): Promise<Promotion> {
    const response = await apiClient.post<ApiResponse<Promotion>>('/promotions', request);
    return response.data;
  }

  /**
   * Get farmer's promotions
   */
  async getMyPromotions(params?: {
    page?: number;
    limit?: number;
    status?: PromotionStatus;
    productId?: string;
  }): Promise<PaginatedResponse<Promotion>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.productId) queryParams.set('productId', params.productId);

    const url = `/promotions/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<PaginatedResponse<Promotion>>(url);
  }

  /**
   * Get promotion by ID
   */
  async getPromotion(promotionId: string): Promise<Promotion> {
    const response = await apiClient.get<ApiResponse<Promotion>>(`/promotions/${promotionId}`);
    return response.data;
  }

  /**
   * Get promotion statistics
   */
  async getPromotionStats(): Promise<PromotionStats> {
    const response = await apiClient.get<ApiResponse<PromotionStats>>('/promotions/stats');
    return response.data;
  }

  /**
   * Cancel an active promotion (no refund)
   */
  async cancelPromotion(promotionId: string): Promise<void> {
    await apiClient.delete(`/promotions/${promotionId}`);
  }

  /**
   * Record a view on a promoted product
   */
  async recordView(productId: string): Promise<void> {
    await apiClient.post(`/promotions/${productId}/view`);
  }

  /**
   * Record a click on a promoted product
   */
  async recordClick(productId: string): Promise<void> {
    await apiClient.post(`/promotions/${productId}/click`);
  }
}

export const promotionService = new PromotionService();
export default promotionService;
