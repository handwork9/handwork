import apiClient from './apiClient';

// Enums matching backend
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum DiscountStatus {
  ACTIVE = 'active',
  SCHEDULED = 'scheduled',
  EXPIRED = 'expired',
  PAUSED = 'paused',
}

// Types
export interface ProductDiscount {
  id: string;
  productId: string;
  farmerId: string;
  discountType: DiscountType;
  discountValue: number;
  originalPrice: number;
  discountedPrice: number;
  minQuantity: number;
  isLimitedTime: boolean;
  startDate: string | null;
  endDate: string | null;
  usePromoCode: boolean;
  promoCode: string | null;
  status: DiscountStatus;
  usageCount: number;
  maxUsage: number | null;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

export interface CreateDiscountRequest {
  productId: string;
  discountType: DiscountType;
  discountValue: number;
  originalPrice: number;
  discountedPrice: number;
  minQuantity?: number;
  isLimitedTime?: boolean;
  startDate?: string;
  endDate?: string;
  usePromoCode?: boolean;
  promoCode?: string;
  maxUsage?: number;
}

export interface UpdateDiscountRequest {
  discountType?: DiscountType;
  discountValue?: number;
  discountedPrice?: number;
  minQuantity?: number;
  isLimitedTime?: boolean;
  startDate?: string;
  endDate?: string;
  usePromoCode?: boolean;
  promoCode?: string;
  maxUsage?: number;
  status?: DiscountStatus;
}

export interface DiscountStats {
  totalDiscounts: number;
  activeDiscounts: number;
  totalUsage: number;
  averageDiscount: number;
}

export interface ApplyPromoCodeRequest {
  promoCode: string;
  productId: string;
  quantity?: number;
}

export interface ApplyPromoCodeResponse {
  discount: ProductDiscount;
  discountedPrice: number;
  savings: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

class DiscountService {
  /**
   * Create a discount for a product
   */
  async createDiscount(data: CreateDiscountRequest): Promise<ProductDiscount> {
    const response = await apiClient.post<ApiResponse<ProductDiscount>>('/discounts', data);
    const result = response as any;
    // Handle double-wrapped response
    if (result?.data?.data) {
      return result.data.data;
    }
    return result.data;
  }

  /**
   * Get all discounts for the current farmer
   */
  async getMyDiscounts(params?: {
    productId?: string;
    status?: DiscountStatus;
    page?: number;
    limit?: number;
  }): Promise<{ discounts: ProductDiscount[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = `/discounts/my${query ? `?${query}` : ''}`;
    
    const response = await apiClient.get<ApiResponse<ProductDiscount[]>>(url);
    const result = response as any;
    
    // Handle double-wrapped response
    if (result?.data?.data) {
      return {
        discounts: result.data.data,
        total: result.data.total || 0,
        page: result.data.page || 1,
        limit: result.data.limit || 20,
      };
    }
    
    return {
      discounts: result.data || [],
      total: result.total || 0,
      page: result.page || 1,
      limit: result.limit || 20,
    };
  }

  /**
   * Get discount statistics for the current farmer
   */
  async getDiscountStats(): Promise<DiscountStats> {
    const response = await apiClient.get<ApiResponse<DiscountStats>>('/discounts/stats');
    const result = response as any;
    if (result?.data?.data) {
      return result.data.data;
    }
    return result.data;
  }

  /**
   * Get a specific discount by ID
   */
  async getDiscount(id: string): Promise<ProductDiscount> {
    const response = await apiClient.get<ApiResponse<ProductDiscount>>(`/discounts/${id}`);
    const result = response as any;
    if (result?.data?.data) {
      return result.data.data;
    }
    return result.data;
  }

  /**
   * Get active discount for a product (public)
   */
  async getProductDiscount(productId: string): Promise<ProductDiscount | null> {
    const response = await apiClient.get<ApiResponse<ProductDiscount | null>>(`/discounts/product/${productId}`);
    const result = response as any;
    if (result?.data?.data !== undefined) {
      return result.data.data;
    }
    return result.data;
  }

  /**
   * Update a discount
   */
  async updateDiscount(id: string, data: UpdateDiscountRequest): Promise<ProductDiscount> {
    const response = await apiClient.put<ApiResponse<ProductDiscount>>(`/discounts/${id}`, data);
    const result = response as any;
    if (result?.data?.data) {
      return result.data.data;
    }
    return result.data;
  }

  /**
   * Pause a discount
   */
  async pauseDiscount(id: string): Promise<ProductDiscount> {
    const response = await apiClient.patch<ApiResponse<ProductDiscount>>(`/discounts/${id}/pause`);
    const result = response as any;
    if (result?.data?.data) {
      return result.data.data;
    }
    return result.data;
  }

  /**
   * Resume a paused discount
   */
  async resumeDiscount(id: string): Promise<ProductDiscount> {
    const response = await apiClient.patch<ApiResponse<ProductDiscount>>(`/discounts/${id}/resume`);
    const result = response as any;
    if (result?.data?.data) {
      return result.data.data;
    }
    return result.data;
  }

  /**
   * Delete a discount
   */
  async deleteDiscount(id: string): Promise<void> {
    await apiClient.delete(`/discounts/${id}`);
  }

  /**
   * Apply a promo code to a product
   */
  async applyPromoCode(data: ApplyPromoCodeRequest): Promise<ApplyPromoCodeResponse> {
    const response = await apiClient.post<ApiResponse<ApplyPromoCodeResponse>>('/discounts/apply-promo', data);
    const result = response as any;
    if (result?.data?.data) {
      return result.data.data;
    }
    return result.data;
  }
}

export default new DiscountService();
