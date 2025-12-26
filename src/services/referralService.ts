import apiClient from './apiClient';

export interface ReferralCodeResponse {
  code: string;
  totalEarned: number;
  referralCount: number;
}

export interface ReferralStats {
  total: number;
  pending: number;
  joined: number;
  completed: number;
  expired: number;
  totalEarned: number;
}

export interface Referral {
  id: string;
  name: string;
  phone?: string;
  status: 'pending' | 'joined' | 'completed' | 'expired';
  rewardAmount: number;
  invitedDate: string;
  joinedDate?: string;
  completedDate?: string;
}

export interface ReferralDetail extends Referral {
  expiresAt?: string;
  referrerRewarded: boolean;
  referredRewarded: boolean;
}

// Backend wraps responses in { success: boolean, data: T }
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

class ReferralService {
  // Get user's referral code and earnings
  async getReferralCode(): Promise<ReferralCodeResponse> {
    const response = await apiClient.get<ApiResponse<ReferralCodeResponse>>('/referrals/code');
    return response.data;
  }

  // Generate referral code if not exists
  async generateReferralCode(): Promise<{ code: string }> {
    const response = await apiClient.post<ApiResponse<{ code: string }>>('/referrals/code/generate');
    return response.data;
  }

  // Get referral statistics
  async getStats(): Promise<ReferralStats> {
    const response = await apiClient.get<ApiResponse<ReferralStats>>('/referrals/stats');
    return response.data;
  }

  // Get referral history
  async getHistory(status?: string): Promise<Referral[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<ApiResponse<Referral[]>>('/referrals/history', { params });
    return response.data || [];
  }

  // Get single referral detail
  async getReferralDetail(id: string): Promise<ReferralDetail> {
    const response = await apiClient.get<ApiResponse<ReferralDetail>>(`/referrals/history/${id}`);
    return response.data;
  }

  // Create a pending invite
  async createInvite(name: string, phone?: string): Promise<Referral> {
    const response = await apiClient.post<ApiResponse<Referral>>('/referrals/invite', { name, phone });
    return response.data;
  }

  // Apply referral code
  async applyReferralCode(code: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/referrals/apply', { code });
    return response.data;
  }
}

export const referralService = new ReferralService();
export default referralService;
