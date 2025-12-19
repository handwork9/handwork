import apiClient from './apiClient';

// Types for profile stats
export interface FarmerProfileStats {
  totalProducts: number;
  totalOrders: number;
  avgRating: number;
}

export interface RiderProfileStats {
  totalDeliveries: number;
  totalEarnings: number;
  avgRating: number;
}

export interface BuyerProfileStats {
  totalOrders: number;
  totalSaved: number;
  totalReviews: number;
}

export type ProfileStats = FarmerProfileStats | RiderProfileStats | BuyerProfileStats;

// Helper to extract data from wrapped response { success: true, data: {...} }
const extractData = <T>(response: any): T => {
  if (response && response.success && response.data !== undefined) {
    return response.data;
  }
  return response;
};

export const profileStatsService = {
  /**
   * Get farmer profile stats from analytics dashboard
   */
  async getFarmerStats(): Promise<FarmerProfileStats> {
    try {
      const response = await apiClient.get<any>('/farmers/analytics/dashboard');
      const data = extractData<any>(response);
      return {
        totalProducts: data.totalProducts || 0,
        totalOrders: data.totalOrders || 0,
        avgRating: data.avgRating || 0,
      };
    } catch (error) {
      console.error('Error fetching farmer stats:', error);
      return {
        totalProducts: 0,
        totalOrders: 0,
        avgRating: 0,
      };
    }
  },

  /**
   * Get rider profile stats from earnings endpoint
   */
  async getRiderStats(): Promise<RiderProfileStats> {
    try {
      const response = await apiClient.get<any>('/riders/earnings?period=all');
      const data = extractData<any>(response);
      
      // Also fetch rider profile for rating
      const profileResponse = await apiClient.get<any>('/riders/profile');
      const profileData = extractData<any>(profileResponse);
      
      return {
        totalDeliveries: data.totalDeliveries || profileData.totalDeliveries || 0,
        totalEarnings: data.thisMonth || profileData.totalEarnings || 0,
        avgRating: profileData.rating || 0,
      };
    } catch (error) {
      console.error('Error fetching rider stats:', error);
      return {
        totalDeliveries: 0,
        totalEarnings: 0,
        avgRating: 0,
      };
    }
  },

  /**
   * Get buyer profile stats (aggregated from multiple endpoints)
   */
  async getBuyerStats(): Promise<BuyerProfileStats> {
    try {
      // Fetch orders count
      const ordersResponse = await apiClient.get<any>('/orders?page=1&limit=1');
      const ordersData = extractData<any>(ordersResponse);
      const totalOrders = ordersData.total || ordersData.pagination?.total || 0;

      // Fetch favorites for "saved" count
      const favoritesResponse = await apiClient.get<any>('/favorites/ids');
      const favoritesData = extractData<any>(favoritesResponse);
      const totalSaved = favoritesData.productIds?.length || 0;

      // Fetch rewards points as a proxy for engagement/savings
      let rewardsPoints = 0;
      try {
        const rewardsResponse = await apiClient.get<any>('/rewards/summary');
        const rewardsData = extractData<any>(rewardsResponse);
        rewardsPoints = rewardsData.currentPoints || 0;
      } catch {
        // Rewards might not be available
      }

      return {
        totalOrders,
        totalSaved,
        totalReviews: rewardsPoints, // Using reward points as engagement metric
      };
    } catch (error) {
      console.error('Error fetching buyer stats:', error);
      return {
        totalOrders: 0,
        totalSaved: 0,
        totalReviews: 0,
      };
    }
  },

  /**
   * Get profile stats based on user role
   */
  async getStats(role: 'farmer' | 'rider' | 'buyer'): Promise<ProfileStats> {
    switch (role) {
      case 'farmer':
        return this.getFarmerStats();
      case 'rider':
        return this.getRiderStats();
      case 'buyer':
      default:
        return this.getBuyerStats();
    }
  },
};

export default profileStatsService;
