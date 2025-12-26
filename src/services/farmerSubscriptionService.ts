import apiClient from './apiClient';

export type FarmerSubscriptionTier = 'basic' | 'verified' | 'premium';
export type SubscriptionDuration = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export interface FarmerSubscription {
  id: string;
  userId: string;
  tier: FarmerSubscriptionTier;
  status: SubscriptionStatus;
  duration: SubscriptionDuration;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPricing {
  tier: FarmerSubscriptionTier;
  name: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  features: string[];
  visibilityBoost: number;
}

export interface CurrentSubscriptionResponse {
  hasActiveSubscription: boolean;
  subscription?: FarmerSubscription;
  premiumTier?: FarmerSubscriptionTier;
  premiumExpiresAt?: string;
}

export interface SubscriptionStatusResponse {
  isActive: boolean;
  subscription: FarmerSubscription | null;
  tier: FarmerSubscriptionTier;
  daysRemaining: number | null;
  expiresAt: string | null;
  promotionBenefits: {
    isShowingInVerifiedSection: boolean;
    visibilityBoost: number;
    tierBadge: string | null;
  };
  renewalInfo: {
    canRenew: boolean;
    isExpiringSoon: boolean;
    renewalPrice: number | null;
  };
}

export interface SubscribeResponse {
  success: boolean;
  subscription: FarmerSubscription;
  message: string;
}

class FarmerSubscriptionService {
  /**
   * Get subscription pricing tiers
   */
  async getPricing(): Promise<SubscriptionPricing[]> {
    return apiClient.get<SubscriptionPricing[]>('/farmers/subscription/pricing');
  }

  /**
   * Get available subscription tiers with details
   */
  async getTiers(): Promise<SubscriptionPricing[]> {
    return apiClient.get<SubscriptionPricing[]>('/farmers/subscription/tiers');
  }

  /**
   * Get current user's subscription status
   */
  async getCurrentSubscription(): Promise<CurrentSubscriptionResponse> {
    try {
      const response = await apiClient.get<any>('/farmers/subscription/current');
      console.log('[farmerSubscriptionService] getCurrentSubscription response:', JSON.stringify(response));
      // Handle wrapped response { success: true, data: {...} }
      const data = response?.data || response;
      return data;
    } catch (error: any) {
      console.error('[farmerSubscriptionService] getCurrentSubscription error:', error?.message, error?.response?.status);
      // If 404 or no subscription found, return default response
      if (error?.response?.status === 404) {
        return {
          hasActiveSubscription: false,
        };
      }
      // Return default on any error to prevent crash
      return {
        hasActiveSubscription: false,
      };
    }
  }

  /**
   * Subscribe to a plan
   */
  async subscribe(
    tier: FarmerSubscriptionTier,
    duration: SubscriptionDuration,
    paymentMethod: 'wallet' | 'card'
  ): Promise<SubscribeResponse> {
    const response = await apiClient.post<any>('/farmers/subscription/subscribe', {
      tier,
      duration,
      paymentMethod,
    });
    console.log('[farmerSubscriptionService] subscribe response:', JSON.stringify(response));
    // Handle wrapped response { success: true, data: {...} }
    const data = response?.data || response;
    return data;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>('/farmers/subscription/cancel');
  }

  /**
   * Update auto-renewal setting
   */
  async updateAutoRenew(autoRenew: boolean): Promise<{ success: boolean }> {
    return apiClient.patch<{ success: boolean }>('/farmers/subscription/auto-renew', {
      autoRenew,
    });
  }

  /**
   * Get subscription history
   */
  async getHistory(): Promise<FarmerSubscription[]> {
    return apiClient.get<FarmerSubscription[]>('/farmers/subscription/history');
  }

  /**
   * Calculate price based on tier and duration
   */
  calculatePrice(tier: FarmerSubscriptionTier, duration: SubscriptionDuration): number {
    const pricing: Record<FarmerSubscriptionTier, Record<SubscriptionDuration, number>> = {
      basic: { monthly: 0, quarterly: 0, yearly: 0 },
      verified: { monthly: 3000, quarterly: 7500, yearly: 25000 },
      premium: { monthly: 7000, quarterly: 18000, yearly: 60000 },
    };
    return pricing[tier][duration];
  }

  /**
   * Get savings percentage for longer durations
   */
  getSavingsPercentage(tier: FarmerSubscriptionTier, duration: SubscriptionDuration): number {
    if (tier === 'basic') return 0;
    
    const monthlyPrice = this.calculatePrice(tier, 'monthly');
    const actualPrice = this.calculatePrice(tier, duration);
    
    let expectedPrice: number;
    if (duration === 'quarterly') {
      expectedPrice = monthlyPrice * 3;
    } else if (duration === 'yearly') {
      expectedPrice = monthlyPrice * 12;
    } else {
      return 0;
    }
    
    const savings = expectedPrice - actualPrice;
    return Math.round((savings / expectedPrice) * 100);
  }

  /**
   * Get tier display name
   */
  getTierDisplayName(tier: FarmerSubscriptionTier): string {
    const names: Record<FarmerSubscriptionTier, string> = {
      basic: 'Basic',
      verified: 'Verified Seller',
      premium: 'Premium Seller',
    };
    return names[tier];
  }

  /**
   * Get tier features
   */
  getTierFeatures(tier: FarmerSubscriptionTier): string[] {
    const features: Record<FarmerSubscriptionTier, string[]> = {
      basic: [
        'Standard product listing',
        'Basic customer support',
      ],
      verified: [
        'Verified seller badge on products',
        '1.5x visibility boost in search',
        'Priority customer support',
        'Featured in verified sellers section',
        'Trust badge builds buyer confidence',
      ],
      premium: [
        'Premium seller badge on products',
        '2.5x visibility boost in search',
        'VIP 24/7 customer support',
        'Top placement in category listings',
        'Featured on homepage',
        'Lower platform commission',
      ],
    };
    return features[tier];
  }

  /**
   * Get detailed subscription status with promotion visibility info
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    try {
      return await apiClient.get<SubscriptionStatusResponse>('/farmers/subscription/status');
    } catch (error: any) {
      // If error, return default basic status
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        return {
          isActive: false,
          subscription: null,
          tier: 'basic',
          daysRemaining: null,
          expiresAt: null,
          promotionBenefits: {
            isShowingInVerifiedSection: false,
            visibilityBoost: 1.0,
            tierBadge: null,
          },
          renewalInfo: {
            canRenew: true,
            isExpiringSoon: false,
            renewalPrice: null,
          },
        };
      }
      throw error;
    }
  }

  /**
   * Activate farmer account (one-time payment to start selling)
   * This must debit the wallet BEFORE confirming activation
   */
  async activateAccount(paymentMethod: 'wallet' | 'card' = 'wallet'): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/farmers/subscription/activate', {
      paymentMethod,
    });
  }

  /**
   * Get activation fee info
   */
  async getActivationFee(): Promise<{ fee: number; display: string }> {
    try {
      return await apiClient.get<{ fee: number; display: string }>('/farmers/subscription/activation-fee');
    } catch {
      // Fallback to default
      return { fee: 25000, display: '₦25,000' };
    }
  }
}

export const farmerSubscriptionService = new FarmerSubscriptionService();
export default farmerSubscriptionService;
