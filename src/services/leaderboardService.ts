import { apiClient } from './apiClient';

export type LeaderboardType = 
  | 'top_sellers'
  | 'top_rated'
  | 'top_revenue'
  | 'top_products'
  | 'top_buyers'
  | 'badge_points';

export type TimeFrame = 'weekly' | 'monthly' | 'all_time';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  farmName?: string;
  metric: number;
  metricLabel: string;
  revenue?: number;
  reviewCount?: number;
  badgeCount?: number;
  productName?: string;
  productImage?: string;
  salesCount?: number;
}

export interface LeaderboardResponse {
  type: LeaderboardType;
  timeframe: string;
  leaderboard: LeaderboardEntry[];
}

export interface MyRankResponse {
  rank: number | null;
  metric: number;
  metricLabel: string;
  totalParticipants: number;
}

class LeaderboardService {
  /**
   * Get leaderboard data
   */
  async getLeaderboard(
    type: LeaderboardType = 'top_sellers',
    timeframe: TimeFrame = 'monthly',
    limit: number = 10
  ): Promise<LeaderboardResponse> {
    const response = await apiClient.get<LeaderboardResponse>('/leaderboard', {
      params: { type, timeframe, limit }
    });
    return response;
  }

  /**
   * Get top sellers leaderboard
   */
  async getTopSellers(timeframe: TimeFrame = 'monthly', limit: number = 10): Promise<LeaderboardResponse> {
    const response = await apiClient.get<LeaderboardResponse>('/leaderboard/top-sellers', {
      params: { timeframe, limit }
    });
    return response;
  }

  /**
   * Get top rated farmers
   */
  async getTopRated(limit: number = 10): Promise<LeaderboardResponse> {
    const response = await apiClient.get<LeaderboardResponse>('/leaderboard/top-rated', {
      params: { limit }
    });
    return response;
  }

  /**
   * Get top revenue farmers
   */
  async getTopRevenue(timeframe: TimeFrame = 'monthly', limit: number = 10): Promise<LeaderboardResponse> {
    const response = await apiClient.get<LeaderboardResponse>('/leaderboard/top-revenue', {
      params: { timeframe, limit }
    });
    return response;
  }

  /**
   * Get top products
   */
  async getTopProducts(limit: number = 10): Promise<LeaderboardResponse> {
    const response = await apiClient.get<LeaderboardResponse>('/leaderboard/top-products', {
      params: { limit }
    });
    return response;
  }

  /**
   * Get top buyers
   */
  async getTopBuyers(timeframe: TimeFrame = 'monthly', limit: number = 10): Promise<LeaderboardResponse> {
    const response = await apiClient.get<LeaderboardResponse>('/leaderboard/top-buyers', {
      params: { timeframe, limit }
    });
    return response;
  }

  /**
   * Get badge points leaderboard
   */
  async getBadgePointsLeaderboard(limit: number = 10): Promise<LeaderboardResponse> {
    const response = await apiClient.get<LeaderboardResponse>('/leaderboard/badge-points', {
      params: { limit }
    });
    return response;
  }

  /**
   * Get current user's rank in a leaderboard
   */
  async getMyRank(type: LeaderboardType = 'top_sellers'): Promise<MyRankResponse> {
    const response = await apiClient.get<MyRankResponse>('/leaderboard/my-rank', {
      params: { type }
    });
    return response;
  }

  /**
   * Get label for leaderboard type
   */
  getTypeLabel(type: LeaderboardType): string {
    const labels: Record<LeaderboardType, string> = {
      top_sellers: 'Top Sellers',
      top_rated: 'Top Rated',
      top_revenue: 'Top Earners',
      top_products: 'Best Products',
      top_buyers: 'Top Buyers',
      badge_points: 'Badge Champions',
    };
    return labels[type] || type;
  }

  /**
   * Get icon for leaderboard type
   */
  getTypeIcon(type: LeaderboardType): string {
    const icons: Record<LeaderboardType, string> = {
      top_sellers: 'trending-up',
      top_rated: 'star',
      top_revenue: 'cash',
      top_products: 'cube',
      top_buyers: 'cart',
      badge_points: 'ribbon',
    };
    return icons[type] || 'trophy';
  }

  /**
   * Get color for rank
   */
  getRankColor(rank: number): string {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#6B7280'; // Gray
  }

  /**
   * Get medal emoji for rank
   */
  getRankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }
}

export const leaderboardService = new LeaderboardService();
export default leaderboardService;
