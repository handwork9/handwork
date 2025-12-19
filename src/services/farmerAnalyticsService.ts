import apiClient from './apiClient';

export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  avgOrderValue: number;
  totalProducts: number;
  totalStock: number;
  totalSales: number;
  avgRating: number;
}

export interface SalesDataPoint {
  label: string;
  value: number;
  orders: number;
}

export interface ProductPerformance {
  id: string;
  title: string;
  sales: number;
  revenue: number;
  growth: number;
  images: string[];
  views: number;
  conversionRate: number;
  stock: number;
  category: string;
}

export interface CustomerInsight {
  metric: string;
  value: string;
  change: number;
  icon: string;
}

export interface RevenueBreakdown {
  total: number;
  breakdown: {
    category: string;
    revenue: number;
    percentage: number;
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

class FarmerAnalyticsService {
  /**
   * Get farmer dashboard stats
   */
  async getDashboard(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/farmers/analytics/dashboard');
    const result = response as any;
    return result?.data?.data || result?.data || result;
  }

  /**
   * Get sales data by time period
   */
  async getSalesData(period: 'week' | 'month' | 'year' = 'week'): Promise<SalesDataPoint[]> {
    const response = await apiClient.get<ApiResponse<SalesDataPoint[]>>(`/farmers/analytics/sales?period=${period}`);
    const result = response as any;
    return result?.data?.data || result?.data || result || [];
  }

  /**
   * Get top performing products
   */
  async getTopProducts(limit: number = 10): Promise<ProductPerformance[]> {
    const response = await apiClient.get<ApiResponse<ProductPerformance[]>>(`/farmers/analytics/products?limit=${limit}`);
    const result = response as any;
    return result?.data?.data || result?.data || result || [];
  }

  /**
   * Get customer insights
   */
  async getCustomerInsights(): Promise<CustomerInsight[]> {
    const response = await apiClient.get<ApiResponse<CustomerInsight[]>>('/farmers/analytics/customers');
    const result = response as any;
    return result?.data?.data || result?.data || result || [];
  }

  /**
   * Get revenue breakdown by category
   */
  async getRevenueBreakdown(): Promise<RevenueBreakdown> {
    const response = await apiClient.get<ApiResponse<RevenueBreakdown>>('/farmers/analytics/revenue-breakdown');
    const result = response as any;
    return result?.data?.data || result?.data || result || { total: 0, breakdown: [] };
  }

  /**
   * Get product sales history
   */
  async getProductSalesHistory(productId: string, period: 'week' | 'month' | 'year' = 'week'): Promise<SalesDataPoint[]> {
    const response = await apiClient.get<ApiResponse<SalesDataPoint[]>>(`/farmers/analytics/products/${productId}/sales?period=${period}`);
    const result = response as any;
    return result?.data?.data || result?.data || result || [];
  }

  /**
   * Get sales data with custom date range
   */
  async getSalesDataByDateRange(startDate: string, endDate: string): Promise<SalesDataPoint[]> {
    const response = await apiClient.get<ApiResponse<SalesDataPoint[]>>(
      `/farmers/analytics/sales?startDate=${startDate}&endDate=${endDate}`
    );
    const result = response as any;
    return result?.data?.data || result?.data || result || [];
  }

  /**
   * Get comparison data (current vs previous period)
   */
  async getComparisonData(period: 'week' | 'month' | 'year' = 'week'): Promise<{
    current: { revenue: number; orders: number; avgOrder: number };
    previous: { revenue: number; orders: number; avgOrder: number };
    changes: { revenue: number; orders: number; avgOrder: number };
  }> {
    const response = await apiClient.get<any>(`/farmers/analytics/comparison?period=${period}`);
    const result = response as any;
    return result?.data?.data || result?.data || result || {
      current: { revenue: 0, orders: 0, avgOrder: 0 },
      previous: { revenue: 0, orders: 0, avgOrder: 0 },
      changes: { revenue: 0, orders: 0, avgOrder: 0 },
    };
  }

  /**
   * Get/Set revenue goal
   */
  async getRevenueGoal(): Promise<{ goal: number; current: number; percentage: number } | null> {
    try {
      const response = await apiClient.get<any>('/farmers/analytics/goal');
      const result = response as any;
      return result?.data?.data || result?.data || null;
    } catch {
      return null;
    }
  }

  async setRevenueGoal(goal: number): Promise<void> {
    await apiClient.post('/farmers/analytics/goal', { goal });
  }

  /**
   * Get peak selling hours
   */
  async getPeakHours(): Promise<{ hour: number; orders: number; revenue: number }[]> {
    const response = await apiClient.get<any>('/farmers/analytics/peak-hours');
    const result = response as any;
    return result?.data?.data || result?.data || result || [];
  }

  /**
   * Get today's hourly sales for sparkline
   */
  async getTodayHourlySales(): Promise<{ hour: number; revenue: number }[]> {
    const response = await apiClient.get<any>('/farmers/analytics/today-hourly');
    const result = response as any;
    return result?.data?.data || result?.data || result || [];
  }
}

export const farmerAnalyticsService = new FarmerAnalyticsService();
export default farmerAnalyticsService;
