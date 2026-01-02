import apiClient from './apiClient';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_delivery';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usedCount?: number;
  status: 'active' | 'expired' | 'disabled';
  firstOrderOnly?: boolean;
  newUsersOnly?: boolean;
  applicableCategories?: string[];
  applicableProductIds?: string[];
  excludedProductIds?: string[];
  source?: 'admin' | 'referral' | 'birthday' | 'loyalty' | 'welcome' | 'flash_sale' | 'promo' | 'milestone';
}

export interface CouponValidationResult {
  valid: boolean;
  discountAmount: number;
  discountType: 'percentage' | 'fixed_amount' | 'free_delivery';
  message: string;
  coupon?: Coupon;
}

export interface CartItem {
  productId: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface ValidateCouponRequest {
  code: string;
  subtotal: number;
  cartItems: CartItem[];
}

// Helper to map backend response to frontend Coupon interface
const mapBackendCoupon = (coupon: any): Coupon => ({
  id: coupon.id,
  code: coupon.code,
  name: coupon.name || 'Coupon',
  description: coupon.description,
  type: coupon.type === 'percentage' ? 'percentage' : coupon.type === 'free_delivery' ? 'free_delivery' : 'fixed_amount',
  value: parseFloat(coupon.value) || 0,
  minOrderAmount: parseFloat(coupon.minOrderAmount) || undefined,
  maxDiscountAmount: parseFloat(coupon.maxDiscountAmount) || undefined,
  startDate: coupon.startDate,
  endDate: coupon.endDate,
  usageLimit: coupon.usageLimit,
  usageLimitPerUser: coupon.usageLimitPerUser,
  usedCount: coupon.usageCount || 0,
  status: coupon.status || 'active',
  firstOrderOnly: coupon.firstOrderOnly,
  newUsersOnly: coupon.newUsersOnly,
  applicableCategories: coupon.applicableCategories,
  applicableProductIds: coupon.applicableProductIds,
  excludedProductIds: coupon.excludedProductIds,
  source: coupon.source || 'admin',
});

class CouponService {
  // Get available coupons for current user
  async getAvailableCoupons(): Promise<Coupon[]> {
    const response = await apiClient.get<any[]>('/coupons/available');
    // Map backend response to frontend interface
    if (Array.isArray(response)) {
      return response.map(mapBackendCoupon);
    }
    return [];
  }

  // Validate a coupon code
  async validateCoupon(
    code: string,
    subtotal: number,
    cartItems: CartItem[]
  ): Promise<CouponValidationResult> {
    return apiClient.post<CouponValidationResult>('/coupons/validate', {
      code,
      subtotal,
      cartItems,
    });
  }

  // Get coupon details by code (public info)
  async getCouponByCode(code: string): Promise<{ valid: boolean; coupon?: Coupon; message?: string }> {
    return apiClient.get<{ valid: boolean; coupon?: Coupon; message?: string }>(`/coupons/code/${code}`);
  }

  // Apply coupon to order
  async applyCoupon(
    code: string,
    orderId: string,
    discountAmount: number
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(`/coupons/apply/${code}`, {
      orderId,
      discountAmount,
    });
  }

  // Get user's coupon usage history
  async getMyCouponUsage(): Promise<any[]> {
    return apiClient.get<any[]>('/coupons/my-usage');
  }

  // Calculate discount based on coupon type
  calculateDiscount(
    coupon: Coupon,
    subtotal: number,
    deliveryFee: number = 0
  ): { discountAmount: number; finalAmount: number } {
    let discountAmount = 0;

    switch (coupon.type) {
      case 'percentage':
        discountAmount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
        break;
      case 'fixed_amount':
        discountAmount = Math.min(coupon.value, subtotal);
        break;
      case 'free_delivery':
        discountAmount = deliveryFee;
        break;
    }

    return {
      discountAmount,
      finalAmount: Math.max(0, subtotal + deliveryFee - discountAmount),
    };
  }

  // Format coupon for display
  formatCouponValue(coupon: Coupon): string {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}% OFF`;
      case 'fixed_amount':
        return `₦${coupon.value.toLocaleString()} OFF`;
      case 'free_delivery':
        return 'FREE DELIVERY';
      default:
        return '';
    }
  }

  // Check if coupon is expiring soon (within 3 days)
  isExpiringSoon(coupon: Coupon): boolean {
    const endDate = new Date(coupon.endDate);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return endDate <= threeDaysFromNow && endDate > now;
  }

  // Format expiry date
  formatExpiryDate(coupon: Coupon): string {
    const endDate = new Date(coupon.endDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return 'Expired';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else if (diffDays <= 7) {
      return `Expires in ${diffDays} days`;
    } else {
      return `Valid until ${endDate.toLocaleDateString()}`;
    }
  }
}

export const couponService = new CouponService();
export default couponService;
