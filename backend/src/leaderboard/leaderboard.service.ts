import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Order } from '../database/entities/order.entity';
import { Product } from '../database/entities/product.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';
import { FarmerBadge, BADGE_INFO } from '../database/entities/farmer-badge.entity';
import { OrderStatus, UserRole } from '../common/enums';

export enum LeaderboardType {
  TOP_SELLERS = 'top_sellers',
  TOP_RATED = 'top_rated',
  TOP_REVENUE = 'top_revenue',
  TOP_PRODUCTS = 'top_products',
  TOP_BUYERS = 'top_buyers',
  BADGE_POINTS = 'badge_points',
}

export enum TimeFrame {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepository: Repository<FarmerProfile>,
    @InjectRepository(FarmerBadge)
    private readonly badgeRepository: Repository<FarmerBadge>,
  ) {}

  /**
   * Get leaderboard based on type and timeframe
   */
  async getLeaderboard(
    type: LeaderboardType = LeaderboardType.TOP_SELLERS,
    timeframe: TimeFrame = TimeFrame.MONTHLY,
    limit: number = 10,
  ) {
    const dateFilter = this.getDateFilter(timeframe);

    switch (type) {
      case LeaderboardType.TOP_SELLERS:
        return this.getTopSellers(dateFilter, limit);
      case LeaderboardType.TOP_RATED:
        return this.getTopRated(limit);
      case LeaderboardType.TOP_REVENUE:
        return this.getTopRevenue(dateFilter, limit);
      case LeaderboardType.TOP_PRODUCTS:
        return this.getTopProducts(dateFilter, limit);
      case LeaderboardType.TOP_BUYERS:
        return this.getTopBuyers(dateFilter, limit);
      case LeaderboardType.BADGE_POINTS:
        return this.getBadgePointsLeaderboard(limit);
      default:
        return this.getTopSellers(dateFilter, limit);
    }
  }

  /**
   * Top sellers by number of orders
   */
  private async getTopSellers(dateFilter: Date | null, limit: number) {
    // Get all delivered orders
    const query = this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.DELIVERED });

    if (dateFilter) {
      query.andWhere('order.createdAt >= :dateFilter', { dateFilter });
    }

    const orders = await query.getMany();

    // Extract farmer stats from order items
    const farmerStats = new Map<string, { count: number; revenue: number }>();

    orders.forEach(order => {
      const items = order.items || [];
      const itemsByFarmer = new Map<string, number>();
      
      items.forEach((item: any) => {
        if (item.farmerId) {
          const current = itemsByFarmer.get(item.farmerId) || 0;
          itemsByFarmer.set(item.farmerId, current + (item.subtotal || 0));
        }
      });

      itemsByFarmer.forEach((revenue, farmerId) => {
        const existing = farmerStats.get(farmerId) || { count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += revenue;
        farmerStats.set(farmerId, existing);
      });
    });

    // Get farmer details
    const farmerIds = Array.from(farmerStats.keys());
    const farmers = await this.userRepository.find({
      where: farmerIds.map(id => ({ id })),
      relations: ['farmerProfile'],
    });
    const farmerMap = new Map(farmers.map(f => [f.id, f]));

    const leaderboard = Array.from(farmerStats.entries())
      .map(([farmerId, stats]) => {
        const farmer = farmerMap.get(farmerId);
        return {
          rank: 0,
          userId: farmerId,
          name: farmer?.name || 'Unknown',
          avatar: farmer?.avatar,
          farmName: farmer?.farmerProfile?.farmName,
          metric: stats.count,
          metricLabel: 'Sales',
          revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.metric - a.metric)
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return {
      type: LeaderboardType.TOP_SELLERS,
      timeframe: dateFilter ? 'filtered' : 'all_time',
      leaderboard,
    };
  }

  /**
   * Top rated farmers
   */
  private async getTopRated(limit: number) {
    const profiles = await this.farmerProfileRepository.find({
      relations: ['user'],
      order: { rating: 'DESC' },
      take: limit * 2, // Get more to filter
    });

    const leaderboard = profiles
      .filter(p => (p.totalReviews || 0) >= 3) // At least 3 reviews
      .slice(0, limit)
      .map((profile, index) => ({
        rank: index + 1,
        userId: profile.userId,
        name: profile.user?.name || 'Unknown',
        avatar: profile.user?.avatar,
        farmName: profile.farmName,
        metric: profile.rating || 0,
        metricLabel: 'Rating',
        reviewCount: profile.totalReviews || 0,
      }));

    return {
      type: LeaderboardType.TOP_RATED,
      timeframe: 'all_time',
      leaderboard,
    };
  }

  /**
   * Top revenue earners
   */
  private async getTopRevenue(dateFilter: Date | null, limit: number) {
    // Get all delivered orders
    const query = this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.DELIVERED });

    if (dateFilter) {
      query.andWhere('order.createdAt >= :dateFilter', { dateFilter });
    }

    const orders = await query.getMany();

    // Extract farmer revenue from order items
    const farmerRevenue = new Map<string, { revenue: number; orderCount: number }>();

    orders.forEach(order => {
      const items = order.items || [];
      const itemsByFarmer = new Map<string, number>();
      
      items.forEach((item: any) => {
        if (item.farmerId) {
          const current = itemsByFarmer.get(item.farmerId) || 0;
          itemsByFarmer.set(item.farmerId, current + (item.subtotal || 0));
        }
      });

      itemsByFarmer.forEach((revenue, farmerId) => {
        const existing = farmerRevenue.get(farmerId) || { revenue: 0, orderCount: 0 };
        existing.revenue += revenue;
        existing.orderCount += 1;
        farmerRevenue.set(farmerId, existing);
      });
    });

    // Get farmer details
    const farmerIds = Array.from(farmerRevenue.keys());
    const farmers = await this.userRepository.find({
      where: farmerIds.map(id => ({ id })),
      relations: ['farmerProfile'],
    });
    const farmerMap = new Map(farmers.map(f => [f.id, f]));

    const leaderboard = Array.from(farmerRevenue.entries())
      .map(([farmerId, stats]) => {
        const farmer = farmerMap.get(farmerId);
        return {
          rank: 0,
          userId: farmerId,
          name: farmer?.name || 'Unknown',
          avatar: farmer?.avatar,
          farmName: farmer?.farmerProfile?.farmName,
          metric: stats.revenue,
          metricLabel: 'Revenue (₦)',
          orderCount: stats.orderCount,
        };
      })
      .sort((a, b) => b.metric - a.metric)
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return {
      type: LeaderboardType.TOP_REVENUE,
      timeframe: dateFilter ? 'filtered' : 'all_time',
      leaderboard,
    };
  }

  /**
   * Top products by sales
   */
  private async getTopProducts(dateFilter: Date | null, limit: number) {
    const products = await this.productRepository.find({
      relations: ['farmer', 'farmer.farmerProfile'],
      order: { salesCount: 'DESC' },
      take: limit,
    });

    const leaderboard = products.map((product, index) => ({
      rank: index + 1,
      productId: product.id,
      name: product.title,
      image: product.images?.[0],
      farmerName: product.farmer?.name || 'Unknown',
      farmName: product.farmer?.farmerProfile?.farmName,
      metric: product.salesCount || 0,
      metricLabel: 'Units Sold',
      price: product.price,
    }));

    return {
      type: LeaderboardType.TOP_PRODUCTS,
      timeframe: dateFilter ? 'filtered' : 'all_time',
      leaderboard,
    };
  }

  /**
   * Top buyers by orders
   */
  private async getTopBuyers(dateFilter: Date | null, limit: number) {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.buyerId', 'buyerId')
      .addSelect('SUM(order.totalAmount)', 'totalSpent')
      .addSelect('COUNT(order.id)', 'orderCount')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('order.buyerId')
      .orderBy('totalSpent', 'DESC')
      .limit(limit)
      .getRawMany();

    const buyerIds = result.map(r => r.buyerId);
    const buyers = await this.userRepository.find({
      where: buyerIds.map(id => ({ id })),
    });
    const buyerMap = new Map(buyers.map(b => [b.id, b]));

    const leaderboard = result.map((item, index) => {
      const buyer = buyerMap.get(item.buyerId);
      return {
        rank: index + 1,
        userId: item.buyerId,
        name: buyer?.name || 'Anonymous Buyer',
        avatar: buyer?.avatar,
        metric: parseFloat(item.totalSpent) || 0,
        metricLabel: 'Total Spent (₦)',
        orderCount: parseInt(item.orderCount),
      };
    });

    return {
      type: LeaderboardType.TOP_BUYERS,
      timeframe: dateFilter ? 'filtered' : 'all_time',
      leaderboard,
    };
  }

  /**
   * Badge points leaderboard
   */
  private async getBadgePointsLeaderboard(limit: number) {
    const badges = await this.badgeRepository.find();

    const farmerPoints = new Map<string, { points: number; badgeCount: number }>();

    badges.forEach(badge => {
      const points = BADGE_INFO[badge.badgeType]?.points || 0;
      const existing = farmerPoints.get(badge.farmerId) || {
        points: 0,
        badgeCount: 0,
      };
      existing.points += points;
      existing.badgeCount += 1;
      farmerPoints.set(badge.farmerId, existing);
    });

    // Get farmer details
    const farmerIds = Array.from(farmerPoints.keys());
    const farmers = await this.userRepository.find({
      where: farmerIds.map(id => ({ id })),
      relations: ['farmerProfile'],
    });
    const farmerMap = new Map(farmers.map(f => [f.id, f]));

    const leaderboard = Array.from(farmerPoints.entries())
      .map(([farmerId, stats]) => {
        const farmer = farmerMap.get(farmerId);
        return {
          rank: 0,
          userId: farmerId,
          name: farmer?.name || 'Unknown',
          avatar: farmer?.avatar,
          farmName: farmer?.farmerProfile?.farmName,
          metric: stats.points,
          metricLabel: 'Points',
          badgeCount: stats.badgeCount,
        };
      })
      .sort((a, b) => b.metric - a.metric)
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return {
      type: LeaderboardType.BADGE_POINTS,
      timeframe: 'all_time',
      leaderboard,
    };
  }

  /**
   * Get user's rank in a leaderboard
   */
  async getUserRank(userId: string, type: LeaderboardType) {
    const fullLeaderboard = await this.getLeaderboard(type, TimeFrame.ALL_TIME, 1000);
    const userEntry = fullLeaderboard.leaderboard.find(
      (entry: any) => entry.userId === userId
    );

    return {
      type,
      userId,
      rank: userEntry?.rank || null,
      metric: userEntry?.metric || 0,
      totalParticipants: fullLeaderboard.leaderboard.length,
    };
  }

  /**
   * Helper: Get date filter based on timeframe
   */
  private getDateFilter(timeframe: TimeFrame): Date | null {
    const now = new Date();
    switch (timeframe) {
      case TimeFrame.WEEKLY:
        return new Date(now.setDate(now.getDate() - 7));
      case TimeFrame.MONTHLY:
        return new Date(now.setMonth(now.getMonth() - 1));
      case TimeFrame.ALL_TIME:
      default:
        return null;
    }
  }
}
