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

class ReferralService {
  // Get user's referral code and earnings
  async getReferralCode(): Promise<ReferralCodeResponse> {
    const response = await apiClient.get<ReferralCodeResponse>('/referrals/code');
    return response;
  }

  // Generate referral code if not exists
  async generateReferralCode(): Promise<{ code: string }> {
    const response = await apiClient.post<{ code: string }>('/referrals/code/generate');
    return response;
  }

  // Get referral statistics
  async getStats(): Promise<ReferralStats> {
    const response = await apiClient.get<ReferralStats>('/referrals/stats');
    return response;
  }

  // Get referral history
  async getHistory(status?: string): Promise<Referral[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<Referral[]>('/referrals/history', { params });
    return response;
  }

  // Get single referral detail
  async getReferralDetail(id: string): Promise<ReferralDetail> {
    const response = await apiClient.get<ReferralDetail>(`/referrals/history/${id}`);
    return response;
  }

  // Create a pending invite
  async createInvite(name: string, phone?: string): Promise<Referral> {
    const response = await apiClient.post<Referral>('/referrals/invite', { name, phone });
    return response;
  }

  // Apply referral code
  async applyReferralCode(code: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/referrals/apply', { code });
    return response;
  }
}

export const referralService = new ReferralService();
export default referralService;
