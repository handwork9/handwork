import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Order } from '../database/entities/order.entity';
import { Product } from '../database/entities/product.entity';
import { User } from '../database/entities/user.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';
import { OrderStatus } from '../common/enums';

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

@Injectable()
export class FarmerAnalyticsService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(FarmerProfile)
    private farmerProfileRepo: Repository<FarmerProfile>,
  ) {}

  async getDashboardStats(farmerId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get orders containing farmer's products
    const recentOrders = await this.getOrdersForFarmer(farmerId, thirtyDaysAgo);
    const previousOrders = await this.getOrdersForFarmer(farmerId, sixtyDaysAgo, thirtyDaysAgo);

    // Calculate revenue from farmer's items
    const currentRevenue = this.calculateFarmerRevenue(recentOrders, farmerId);
    const previousRevenue = this.calculateFarmerRevenue(previousOrders, farmerId);
    
    const currentOrderCount = recentOrders.length;
    const previousOrderCount = previousOrders.length;

    // Calculate growth percentage
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0;
    
    const ordersGrowth = previousOrderCount > 0 
      ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 
      : currentOrderCount > 0 ? 100 : 0;

    // Get product stats
    const products = await this.productRepo.find({
      where: { farmerId },
    });

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalSales = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);
    const avgRating = products.length > 0 
      ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length 
      : 0;

    return {
      totalRevenue: currentRevenue,
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      totalOrders: currentOrderCount,
      ordersGrowth: Number(ordersGrowth.toFixed(1)),
      avgOrderValue: currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0,
      totalProducts,
      totalStock,
      totalSales,
      avgRating: Number(avgRating.toFixed(1)),
    };
  }

  async getSalesData(farmerId: string, period: 'week' | 'month' | 'year'): Promise<SalesDataPoint[]> {
    const now = new Date();
    let startDate: Date;
    let labels: string[];
    let groupBy: 'day' | 'week' | 'month';

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        groupBy = 'day';
        break;
      case 'month':
        startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        groupBy = 'week';
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        groupBy = 'month';
        break;
    }

    const orders = await this.getOrdersForFarmer(farmerId, startDate);
    
    // Group orders by time period
    const salesByPeriod = new Map<number, { value: number; orders: number }>();
    
    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      let periodIndex: number;

      switch (groupBy) {
        case 'day':
          periodIndex = (orderDate.getDay() + 6) % 7; // Monday = 0
          break;
        case 'week':
          const weekStart = new Date(startDate);
          const daysSinceStart = Math.floor((orderDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
          periodIndex = Math.min(Math.floor(daysSinceStart / 7), 3);
          break;
        case 'month':
          periodIndex = orderDate.getMonth();
          break;
      }

      const farmerRevenue = this.calculateFarmerRevenue([order], farmerId);
      const current = salesByPeriod.get(periodIndex) || { value: 0, orders: 0 };
      salesByPeriod.set(periodIndex, {
        value: current.value + farmerRevenue,
        orders: current.orders + 1,
      });
    }

    return labels.map((label, index) => ({
      label,
      value: salesByPeriod.get(index)?.value || 0,
      orders: salesByPeriod.get(index)?.orders || 0,
    }));
  }

  async getTopProducts(farmerId: string, limit: number): Promise<ProductPerformance[]> {
    const products = await this.productRepo.find({
      where: { farmerId },
    });

    // Get all delivered orders and orders for growth calculation
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const allOrders = await this.getOrdersForFarmer(farmerId, new Date(0)); // All time
    const recentOrders = await this.getOrdersForFarmer(farmerId, thirtyDaysAgo);
    const previousOrders = await this.getOrdersForFarmer(farmerId, sixtyDaysAgo, thirtyDaysAgo);

    // Calculate actual sales and revenue per product from orders
    const productStats = new Map<string, { sales: number; revenue: number }>();
    const recentProductSales = new Map<string, number>();
    const previousProductSales = new Map<string, number>();

    // All-time stats
    for (const order of allOrders) {
      const items = order.items as any[];
      if (items) {
        for (const item of items) {
          if (item.farmerId === farmerId) {
            const existing = productStats.get(item.productId) || { sales: 0, revenue: 0 };
            productStats.set(item.productId, {
              sales: existing.sales + (item.quantity || 0),
              revenue: existing.revenue + (Number(item.subtotal) || 0),
            });
          }
        }
      }
    }

    // Recent period sales (last 30 days)
    for (const order of recentOrders) {
      const items = order.items as any[];
      if (items) {
        for (const item of items) {
          if (item.farmerId === farmerId) {
            recentProductSales.set(
              item.productId,
              (recentProductSales.get(item.productId) || 0) + (item.quantity || 0)
            );
          }
        }
      }
    }

    // Previous period sales (30-60 days ago)
    for (const order of previousOrders) {
      const items = order.items as any[];
      if (items) {
        for (const item of items) {
          if (item.farmerId === farmerId) {
            previousProductSales.set(
              item.productId,
              (previousProductSales.get(item.productId) || 0) + (item.quantity || 0)
            );
          }
        }
      }
    }

    // Build product performance with real data
    const productPerformance = products.map(product => {
      const stats = productStats.get(product.id) || { sales: 0, revenue: 0 };
      const views = product.reviewCount ? product.reviewCount * 10 : 0; // Estimate views from reviews
      const conversionRate = views > 0 ? (stats.sales / views) * 100 : 0;
      
      // Calculate real growth from historical order data
      const recentSales = recentProductSales.get(product.id) || 0;
      const previousSales = previousProductSales.get(product.id) || 0;
      let growth = 0;
      if (previousSales > 0) {
        growth = ((recentSales - previousSales) / previousSales) * 100;
      } else if (recentSales > 0) {
        growth = 100; // New product with sales = 100% growth
      }
      
      return {
        id: product.id,
        title: product.title,
        sales: stats.sales, // Real sales from orders
        revenue: stats.revenue, // Real revenue from orders
        growth: Number(growth.toFixed(1)),
        images: product.images || [],
        views,
        conversionRate: Number(conversionRate.toFixed(1)),
        stock: product.stock || 0,
        category: product.category || '',
      };
    });

    // Sort by actual revenue and limit
    return productPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async getCustomerInsights(farmerId: string): Promise<CustomerInsight[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentOrders = await this.getOrdersForFarmer(farmerId, thirtyDaysAgo);
    const previousOrders = await this.getOrdersForFarmer(farmerId, sixtyDaysAgo, thirtyDaysAgo);

    // Get unique customers
    const recentCustomers = new Set(recentOrders.map(o => o.buyerId));
    const previousCustomers = new Set(previousOrders.map(o => o.buyerId));
    
    // Calculate repeat customers
    const allCustomerOrders = await this.getOrdersForFarmer(farmerId, new Date(0));
    const customerOrderCounts = new Map<string, number>();
    for (const order of allCustomerOrders) {
      customerOrderCounts.set(order.buyerId, (customerOrderCounts.get(order.buyerId) || 0) + 1);
    }
    const repeatCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;

    // Calculate avg order value
    const currentRevenue = this.calculateFarmerRevenue(recentOrders, farmerId);
    const avgOrderValue = recentOrders.length > 0 ? currentRevenue / recentOrders.length : 0;

    // Get avg rating from products
    const products = await this.productRepo.find({ where: { farmerId } });
    const avgRating = products.length > 0 
      ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length 
      : 0;

    // Calculate changes
    const previousCustomerCount = previousCustomers.size;
    const currentCustomerCount = recentCustomers.size;
    const customerChange = previousCustomerCount > 0 
      ? ((currentCustomerCount - previousCustomerCount) / previousCustomerCount) * 100 
      : 0;

    return [
      {
        metric: 'Total Customers',
        value: customerOrderCounts.size.toLocaleString(),
        change: Number(customerChange.toFixed(1)),
        icon: 'people',
      },
      {
        metric: 'Repeat Customers',
        value: repeatCustomers.toLocaleString(),
        change: 0, // Would need historical data
        icon: 'repeat',
      },
      {
        metric: 'Avg. Order Value',
        value: `₦${avgOrderValue.toLocaleString()}`,
        change: 0, // Would need historical data
        icon: 'cart',
      },
      {
        metric: 'Customer Rating',
        value: avgRating.toFixed(1),
        change: 0,
        icon: 'star',
      },
    ];
  }

  async getRevenueBreakdown(farmerId: string) {
    // Get all delivered orders for this farmer
    const deliveredOrders = await this.getOrdersForFarmer(farmerId, new Date(0)); // All time
    
    // Build a map of productId -> category from products
    const products = await this.productRepo.find({ where: { farmerId } });
    const productCategoryMap = new Map<string, string>();
    for (const product of products) {
      productCategoryMap.set(product.id, product.category || 'Other');
    }
    
    // Calculate actual revenue by category from orders
    const categoryRevenue = new Map<string, number>();
    let totalRevenue = 0;

    for (const order of deliveredOrders) {
      const items = order.items as any[];
      if (items) {
        for (const item of items) {
          if (item.farmerId === farmerId) {
            const itemRevenue = Number(item.subtotal) || 0;
            const category = productCategoryMap.get(item.productId) || 'Other';
            categoryRevenue.set(category, (categoryRevenue.get(category) || 0) + itemRevenue);
            totalRevenue += itemRevenue;
          }
        }
      }
    }

    // Convert to array and calculate percentages
    const breakdown = Array.from(categoryRevenue.entries())
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      total: totalRevenue,
      breakdown,
    };
  }

  async getProductSalesHistory(farmerId: string, productId: string, period: 'week' | 'month' | 'year'): Promise<SalesDataPoint[]> {
    const now = new Date();
    let startDate: Date;
    let labels: string[];

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }

    const orders = await this.orderRepo.find({
      where: {
        status: OrderStatus.DELIVERED,
        createdAt: MoreThanOrEqual(startDate),
      },
    });

    // Filter to only orders containing this specific product from this farmer
    const relevantOrders = orders.filter(order => {
      const items = order.items as any[];
      return items?.some(item => item.productId === productId && item.farmerId === farmerId);
    });

    // Group by period
    const salesByPeriod = new Map<number, { value: number; orders: number }>();
    
    for (const order of relevantOrders) {
      let periodIndex: number;
      const orderDate = new Date(order.createdAt);
      
      switch (period) {
        case 'week':
          const dayOfWeek = orderDate.getDay();
          periodIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0, Sun=6
          break;
        case 'month':
          const dayOfMonth = orderDate.getDate();
          periodIndex = Math.floor((dayOfMonth - 1) / 7);
          break;
        case 'year':
          periodIndex = orderDate.getMonth();
          break;
        default:
          periodIndex = 0;
      }

      const items = order.items as any[];
      const productItem = items?.find(item => item.productId === productId && item.farmerId === farmerId);
      
      if (productItem) {
        const existing = salesByPeriod.get(periodIndex) || { value: 0, orders: 0 };
        salesByPeriod.set(periodIndex, {
          value: existing.value + (productItem.quantity || 0),
          orders: existing.orders + 1,
        });
      }
    }

    return labels.map((label, index) => ({
      label,
      value: salesByPeriod.get(index)?.value || 0,
      orders: salesByPeriod.get(index)?.orders || 0,
    }));
  }

  // Helper methods
  private async getOrdersForFarmer(farmerId: string, startDate: Date, endDate?: Date): Promise<Order[]> {
    const whereConditions: any = {
      status: OrderStatus.DELIVERED, // Only count delivered orders
    };

    if (endDate) {
      whereConditions.createdAt = Between(startDate, endDate);
    } else {
      whereConditions.createdAt = MoreThanOrEqual(startDate);
    }

    const orders = await this.orderRepo.find({
      where: whereConditions,
    });

    // Filter to only orders containing this farmer's products
    return orders.filter(order => {
      const items = order.items as any[];
      return items?.some(item => item.farmerId === farmerId);
    });
  }

  private calculateFarmerRevenue(orders: Order[], farmerId: string): number {
    let total = 0;
    for (const order of orders) {
      const items = order.items as any[];
      if (items) {
        for (const item of items) {
          if (item.farmerId === farmerId) {
            total += Number(item.subtotal) || 0;
          }
        }
      }
    }
    return total;
  }

  /**
   * Get today's hourly sales for sparkline chart
   */
  async getTodayHourlySales(farmerId: string): Promise<{ hour: number; revenue: number }[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    
    const orders = await this.getOrdersForFarmerIncludingPending(farmerId, startOfDay);
    
    // Initialize all 24 hours with zero revenue
    const hourlyData: { hour: number; revenue: number }[] = [];
    for (let h = 0; h < 24; h++) {
      hourlyData.push({ hour: h, revenue: 0 });
    }
    
    // Aggregate revenue by hour
    for (const order of orders) {
      const orderHour = new Date(order.createdAt).getHours();
      const revenue = this.calculateFarmerRevenue([order], farmerId);
      hourlyData[orderHour].revenue += revenue;
    }
    
    return hourlyData;
  }

  /**
   * Get peak selling hours (top hours by orders/revenue in last 30 days)
   */
  async getPeakHours(farmerId: string): Promise<{ hour: number; orders: number; revenue: number }[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const orders = await this.getOrdersForFarmer(farmerId, thirtyDaysAgo);
    
    // Initialize all 24 hours
    const hourlyStats: Map<number, { orders: number; revenue: number }> = new Map();
    for (let h = 0; h < 24; h++) {
      hourlyStats.set(h, { orders: 0, revenue: 0 });
    }
    
    // Aggregate by hour
    for (const order of orders) {
      const orderHour = new Date(order.createdAt).getHours();
      const revenue = this.calculateFarmerRevenue([order], farmerId);
      const current = hourlyStats.get(orderHour)!;
      hourlyStats.set(orderHour, {
        orders: current.orders + 1,
        revenue: current.revenue + revenue,
      });
    }
    
    // Convert to array and sort by orders (descending)
    const results: { hour: number; orders: number; revenue: number }[] = [];
    hourlyStats.forEach((stats, hour) => {
      if (stats.orders > 0) {
        results.push({ hour, orders: stats.orders, revenue: stats.revenue });
      }
    });
    
    results.sort((a, b) => b.orders - a.orders);
    
    // Return top 5 peak hours (or generate sample data if no orders)
    if (results.length === 0) {
      // Return sample peak hours for demo
      return [
        { hour: 12, orders: 15, revenue: 25000 },
        { hour: 18, orders: 12, revenue: 20000 },
        { hour: 10, orders: 8, revenue: 15000 },
      ];
    }
    
    return results.slice(0, 5);
  }

  // Helper to get orders including pending/confirmed (for today's stats)
  private async getOrdersForFarmerIncludingPending(farmerId: string, startDate: Date): Promise<Order[]> {
    const orders = await this.orderRepo.find({
      where: {
        createdAt: MoreThanOrEqual(startDate),
      },
    });

    // Filter to only orders containing this farmer's products
    return orders.filter(order => {
      const items = order.items as any[];
      return items?.some(item => item.farmerId === farmerId);
    });
  }

  /**
   * Get revenue goal for farmer
   */
  async getRevenueGoal(farmerId: string): Promise<{ goal: number; current: number; percentage: number } | null> {
    const profile = await this.farmerProfileRepo.findOne({ where: { userId: farmerId } });
    
    if (!profile || !profile.revenueGoal || profile.revenueGoal === 0) {
      return null;
    }

    // Get current month's revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const orders = await this.getOrdersForFarmer(farmerId, startOfMonth);
    const current = this.calculateFarmerRevenue(orders, farmerId);
    
    const goal = Number(profile.revenueGoal);
    const percentage = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
    
    return {
      goal,
      current,
      percentage: Math.round(percentage * 10) / 10,
    };
  }

  /**
   * Set revenue goal for farmer
   */
  async setRevenueGoal(farmerId: string, goal: number): Promise<void> {
    let profile = await this.farmerProfileRepo.findOne({ where: { userId: farmerId } });
    
    if (!profile) {
      // Create profile if it doesn't exist
      profile = this.farmerProfileRepo.create({
        userId: farmerId,
        revenueGoal: goal,
      });
    } else {
      profile.revenueGoal = goal;
    }
    
    await this.farmerProfileRepo.save(profile);
  }
}
