import apiClient from './apiClient';

export interface LoyaltyTier {
  name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  multiplier: number;
}

export interface EarnMethod {
  id: string;
  icon: string;
  title: string;
  description: string;
  points: string;
  details: string;
}

export interface PointTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'adjusted';
  source: string;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'free_delivery' | 'cashback' | 'product' | 'voucher';
  value?: number;
  imageUrl?: string;
  requiredTier?: string;
  stock: number;
  redeemCount: number;
  maxPerUser: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  terms?: string[];
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  reward?: Reward;
  pointsSpent: number;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  redemptionCode: string;
  usedAt?: string;
  orderId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface RewardsSummary {
  currentPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  tier: string;
  tierMultiplier: number;
  nextTier: string | null;
  pointsToNextTier: number;
  tierProgress: number;
  currentStreak: number;
  availableRewardsCount: number;
  recentTransactions: PointTransaction[];
  earnMethods: EarnMethod[];
}

export interface CheckInResult {
  points: number;
  streak: number;
  bonusEarned: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PointsHistoryParams {
  page?: number;
  limit?: number;
  source?: string;
  type?: 'earned' | 'redeemed';
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  progress: number;
  target: number;
  completed: boolean;
  type: string;
}

export interface DailyChallengesResponse {
  date: string;
  challenges: DailyChallenge[];
  totalPointsAvailable: number;
  pointsEarned: number;
  allCompleted: boolean;
  streakDays: number;
}

class RewardService {
  /**
   * Get rewards summary for the current user
   */
  async getRewardsSummary(): Promise<RewardsSummary> {
    const response = await apiClient.get<{ success: boolean; data: RewardsSummary }>('/rewards/summary');
    return response.data;
  }

  /**
   * Get available rewards for the current user
   */
  async getAvailableRewards(): Promise<Reward[]> {
    const response = await apiClient.get<{ success: boolean; data: Reward[] }>('/rewards/available');
    return response.data || [];
  }

  /**
   * Get points history for the current user
   */
  async getPointsHistory(params?: PointsHistoryParams): Promise<PaginatedResponse<PointTransaction>> {
    const response = await apiClient.get<{ success: boolean; data: PaginatedResponse<PointTransaction> }>('/rewards/history', {
      params,
    });
    return response.data;
  }

  /**
   * Get user's redemptions
   */
  async getRedemptions(): Promise<RewardRedemption[]> {
    const response = await apiClient.get<{ success: boolean; data: RewardRedemption[] }>('/rewards/redemptions');
    return response.data || [];
  }

  /**
   * Daily check-in to earn points
   */
  async dailyCheckIn(): Promise<CheckInResult> {
    const response = await apiClient.post<{ success: boolean; data: CheckInResult }>('/rewards/checkin');
    return response.data;
  }

  /**
   * Redeem a reward
   */
  async redeemReward(rewardId: string): Promise<RewardRedemption> {
    const response = await apiClient.post<{ success: boolean; data: RewardRedemption }>('/rewards/redeem', {
      rewardId,
    });
    return response.data;
  }

  /**
   * Share a product to earn points
   */
  async shareProduct(productId: string): Promise<{ success: boolean; points: number; message: string }> {
    const response = await apiClient.post<{ success: boolean; data: { success: boolean; points: number; message: string } }>(
      `/rewards/share/${productId}`
    );
    return response.data;
  }

  /**
   * Get daily challenges for the current user
   */
  async getDailyChallenges(): Promise<DailyChallengesResponse> {
    const response = await apiClient.get<{ success: boolean; data: DailyChallengesResponse }>('/rewards/challenges/daily');
    return response.data;
  }

  /**
   * Complete a challenge
   */
  async completeChallenge(challengeId: string): Promise<{ success: boolean; pointsEarned: number; newBalance: number; message: string }> {
    const response = await apiClient.post<{ success: boolean; data: { success: boolean; pointsEarned: number; newBalance: number; message: string } }>(
      `/rewards/challenges/${challengeId}/complete`
    );
    return response.data;
  }

  /**
   * Get reward by ID from available rewards
   */
  async getRewardById(rewardId: string): Promise<Reward | undefined> {
    const rewards = await this.getAvailableRewards();
    return rewards.find(r => r.id === rewardId);
  }

  /**
   * Calculate tier color based on tier name
   */
  getTierColor(tier: string): string {
    const colors: Record<string, string> = {
      Bronze: '#CD7F32',
      Silver: '#9CA3AF',
      Gold: '#F59E0B',
      Platinum: '#6366F1',
    };
    return colors[tier] || '#CD7F32';
  }

  /**
   * Get tier info
   */
  getTierInfo(tier: string): { name: string; color: string; icon: string } {
    const tiers: Record<string, { name: string; color: string; icon: string }> = {
      Bronze: { name: 'Bronze', color: '#CD7F32', icon: 'shield' },
      Silver: { name: 'Silver', color: '#9CA3AF', icon: 'shield' },
      Gold: { name: 'Gold', color: '#F59E0B', icon: 'shield' },
      Platinum: { name: 'Platinum', color: '#6366F1', icon: 'shield' },
    };
    return tiers[tier] || tiers.Bronze;
  }

  /**
   * Format points with commas
   */
  formatPoints(points: number): string {
    return points.toLocaleString();
  }

  /**
   * Get source display name
   */
  getSourceDisplayName(source: string): string {
    const names: Record<string, string> = {
      purchase: 'Purchase',
      referral: 'Referral',
      rating: 'Order Rating',
      daily_checkin: 'Daily Check-in',
      profile_completion: 'Profile Completed',
      share_product: 'Product Share',
      first_order: 'First Order Bonus',
      weekly_streak: 'Weekly Streak',
      birthday: 'Birthday Bonus',
      promotion: 'Promotion',
      redemption: 'Redemption',
      admin_adjustment: 'Adjustment',
    };
    return names[source] || source;
  }

  /**
   * Get source icon
   */
  getSourceIcon(source: string): string {
    const icons: Record<string, string> = {
      purchase: 'cart-outline',
      referral: 'people-outline',
      rating: 'star-outline',
      daily_checkin: 'calendar-outline',
      profile_completion: 'checkmark-circle-outline',
      share_product: 'share-social-outline',
      first_order: 'gift-outline',
      weekly_streak: 'flame-outline',
      birthday: 'balloon-outline',
      promotion: 'megaphone-outline',
      redemption: 'ticket-outline',
      admin_adjustment: 'settings-outline',
    };
    return icons[source] || 'ellipse-outline';
  }

  /**
   * Get reward type display name
   */
  getRewardTypeDisplay(type: string): string {
    const types: Record<string, string> = {
      discount: 'Discount',
      free_delivery: 'Free Delivery',
      cashback: 'Cashback',
      product: 'Free Product',
      voucher: 'Voucher',
    };
    return types[type] || type;
  }

  /**
   * Get reward type icon
   */
  getRewardTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      discount: 'pricetag-outline',
      free_delivery: 'bicycle-outline',
      cashback: 'wallet-outline',
      product: 'gift-outline',
      voucher: 'ticket-outline',
    };
    return icons[type] || 'gift-outline';
  }
}

export const rewardService = new RewardService();
export default rewardService;
