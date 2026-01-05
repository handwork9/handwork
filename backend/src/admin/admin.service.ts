import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, ILike } from 'typeorm';
import { User, Order, Product, Rider, Payment, DispatchLog, FarmerProfile, AuditLog, AppSettings, PlatformRevenue, FarmerSubscription, RiderSubscription } from '../database/entities';
import { AuditAction, AuditCategory } from '../database/entities/audit-log.entity';
import { RevenueType, RevenueStatus } from '../database/entities/platform-revenue.entity';
import { FarmerSubscriptionStatus, FarmerSubscriptionTier } from '../database/entities/farmer-subscription.entity';
import { SubscriptionStatus as RiderSubscriptionStatus, SubscriptionTier as RiderSubscriptionTier } from '../database/entities/rider-subscription.entity';
import { UserRole, OrderStatus, PaymentStatus, RiderStatus, FarmerApplicationStatus, RiderApplicationStatus, ProductApprovalStatus } from '../common/enums';
import { EmailService } from '../email/email.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';

// Default settings structure
export interface SettingsData {
  // General Settings
  appName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  
  // Business Settings
  commissionRate: number;
  riderCommissionRate: number;
  serviceFeeRate: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  defaultDeliveryFee: number;
  freeDeliveryThreshold: number;
  farmerActivationFee: number;
  
  // Notification Settings
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;
  orderNotificationEmails: string;
  
  // Security Settings
  maxLoginAttempts: number;
  sessionTimeout: number;
  requireEmailVerification: boolean;
  require2FA: boolean;
  
  // Operational Settings
  operatingHoursStart: string;
  operatingHoursEnd: string;
  enableMaintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
}

export const DEFAULT_SETTINGS: SettingsData = {
  appName: 'Handwork Marketplace',
  supportEmail: 'support@handwork.com',
  supportPhone: '+234 706 210 3875',
  currency: 'NGN',
  timezone: 'Africa/Lagos',
  
  commissionRate: 10,
  riderCommissionRate: 15,
  serviceFeeRate: 2,
  minOrderAmount: 500,
  maxOrderAmount: 1000000,
  defaultDeliveryFee: 500,
  freeDeliveryThreshold: 10000,
  farmerActivationFee: 25000,
  
  enableEmailNotifications: true,
  enableSmsNotifications: true,
  enablePushNotifications: true,
  orderNotificationEmails: 'orders@handwork.com',
  
  maxLoginAttempts: 5,
  sessionTimeout: 30,
  requireEmailVerification: true,
  require2FA: false,
  
  operatingHoursStart: '08:00',
  operatingHoursEnd: '22:00',
  enableMaintenanceMode: false,
  maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
  allowNewRegistrations: true,
};

export interface DashboardMetrics {
  totalUsers: number;
  totalFarmers: number;
  totalRiders: number;
  totalBuyers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  onlineRiders: number;
  activeProducts: number;
}

export interface OrderMetrics {
  date: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
}

export interface RevenueMetrics {
  date: string;
  revenue: number;
  paymentCount: number;
  averagePayment: number;
}

export interface UserGrowth {
  date: string;
  buyers: number;
  farmers: number;
  riders: number;
  total: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(DispatchLog)
    private readonly dispatchLogRepository: Repository<DispatchLog>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepository: Repository<FarmerProfile>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(AppSettings)
    private readonly appSettingsRepository: Repository<AppSettings>,
    @InjectRepository(PlatformRevenue)
    private readonly platformRevenueRepository: Repository<PlatformRevenue>,
    @InjectRepository(FarmerSubscription)
    private readonly farmerSubscriptionRepository: Repository<FarmerSubscription>,
    @InjectRepository(RiderSubscription)
    private readonly riderSubscriptionRepository: Repository<RiderSubscription>,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get dashboard overview metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [
      totalUsers,
      totalFarmers,
      totalRiders,
      totalBuyers,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      onlineRiders,
      activeProducts,
      revenueData,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: UserRole.FARMER } }),
      this.userRepository.count({ where: { role: UserRole.RIDER } }),
      this.userRepository.count({ where: { role: UserRole.BUYER } }),
      this.orderRepository.count(),
      this.orderRepository.count({
        where: { status: OrderStatus.PENDING },
      }),
      this.orderRepository.count({
        where: { status: OrderStatus.DELIVERED },
      }),
      this.orderRepository.count({
        where: { status: OrderStatus.CANCELLED },
      }),
      this.riderRepository.count({
        where: { status: RiderStatus.AVAILABLE },
      }),
      this.productRepository.count({
        where: { isAvailable: true },
      }),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .addSelect('COUNT(*)', 'count')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne(),
    ]);

    const totalRevenue = parseFloat(revenueData?.total || '0');
    const paymentCount = parseInt(revenueData?.count || '0', 10);

    return {
      totalUsers,
      totalFarmers,
      totalRiders,
      totalBuyers,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue: paymentCount > 0 ? totalRevenue / paymentCount : 0,
      onlineRiders,
      activeProducts,
    };
  }

  /**
   * Get order metrics for a date range
   */
  async getOrderMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<OrderMetrics[]> {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .select("DATE(order.createdAt)", 'date')
      .addSelect('COUNT(*)', 'totalOrders')
      .addSelect(
        `SUM(CASE WHEN order.status = '${OrderStatus.DELIVERED}' THEN 1 ELSE 0 END)`,
        'completedOrders',
      )
      .addSelect(
        `SUM(CASE WHEN order.status = '${OrderStatus.CANCELLED}' THEN 1 ELSE 0 END)`,
        'cancelledOrders',
      )
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy("DATE(order.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return orders.map((o) => ({
      date: o.date,
      totalOrders: parseInt(o.totalOrders, 10),
      completedOrders: parseInt(o.completedOrders, 10),
      cancelledOrders: parseInt(o.cancelledOrders, 10),
      revenue: parseFloat(o.revenue || '0'),
    }));
  }

  /**
   * Get revenue metrics for a date range
   */
  async getRevenueMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueMetrics[]> {
    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select("DATE(payment.paidAt)", 'date')
      .addSelect('SUM(payment.amount)', 'revenue')
      .addSelect('COUNT(*)', 'paymentCount')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('payment.paidAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy("DATE(payment.paidAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return payments.map((p) => {
      const revenue = parseFloat(p.revenue || '0');
      const paymentCount = parseInt(p.paymentCount, 10);
      return {
        date: p.date,
        revenue,
        paymentCount,
        averagePayment: paymentCount > 0 ? revenue / paymentCount : 0,
      };
    });
  }

  /**
   * Get comprehensive reports data
   */
  async getReports(type: string, startDate: Date, endDate: Date): Promise<any> {
    // Get summary metrics
    const [
      orderMetrics,
      revenueMetrics,
      topFarmers,
      topRiders,
      dispatchAnalytics,
    ] = await Promise.all([
      this.getOrderMetrics(startDate, endDate),
      this.getRevenueMetrics(startDate, endDate),
      this.getTopFarmers(5),
      this.getTopRiders(5),
      this.getDispatchAnalytics(startDate, endDate),
    ]);

    // Calculate summary
    const totalRevenue = revenueMetrics.reduce((sum, m) => sum + m.revenue, 0);
    const totalOrders = orderMetrics.reduce((sum, m) => sum + m.totalOrders, 0);
    const completedOrders = orderMetrics.reduce((sum, m) => sum + (m.completedOrders || 0), 0);
    const totalDeliveries = dispatchAnalytics?.totalDeliveries || completedOrders;
    const avgDeliveryTime = dispatchAnalytics?.averageDeliveryTime || 35;
    const cancellationRate = totalOrders > 0 
      ? (orderMetrics.reduce((sum, m) => sum + (m.cancelledOrders || 0), 0) / totalOrders) * 100 
      : 0;

    // Get orders by category
    const ordersByCategory = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.items', 'item')
      .leftJoin('item.product', 'product')
      .select('product.category', 'category')
      .addSelect('COUNT(DISTINCT order.id)', 'orders')
      .addSelect('SUM(item.subtotal)', 'revenue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('product.category IS NOT NULL')
      .groupBy('product.category')
      .orderBy('orders', 'DESC')
      .getRawMany();

    return {
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        totalDeliveries,
        avgDeliveryTime,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
      },
      revenueByDay: revenueMetrics.map(m => ({
        date: m.date,
        revenue: m.revenue,
        orders: m.paymentCount,
      })),
      ordersByCategory: ordersByCategory.map(c => ({
        category: c.category || 'Other',
        orders: parseInt(c.orders, 10),
        revenue: parseFloat(c.revenue || '0'),
      })),
      topFarmers: topFarmers.map(f => ({
        name: f.businessName || `${f.firstName} ${f.lastName}`,
        orders: f.orderCount || 0,
        revenue: f.totalRevenue || 0,
      })),
      topRiders: topRiders.map(r => ({
        name: `${r.firstName} ${r.lastName}`,
        deliveries: r.deliveryCount || 0,
        earnings: r.totalEarnings || 0,
      })),
    };
  }

  /**
   * Get user growth over time
   */
  async getUserGrowth(startDate: Date, endDate: Date): Promise<UserGrowth[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .select("DATE(user.createdAt)", 'date')
      .addSelect(
        `SUM(CASE WHEN user.role = '${UserRole.BUYER}' THEN 1 ELSE 0 END)`,
        'buyers',
      )
      .addSelect(
        `SUM(CASE WHEN user.role = '${UserRole.FARMER}' THEN 1 ELSE 0 END)`,
        'farmers',
      )
      .addSelect(
        `SUM(CASE WHEN user.role = '${UserRole.RIDER}' THEN 1 ELSE 0 END)`,
        'riders',
      )
      .addSelect('COUNT(*)', 'total')
      .where('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy("DATE(user.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return users.map((u) => ({
      date: u.date,
      buyers: parseInt(u.buyers, 10),
      farmers: parseInt(u.farmers, 10),
      riders: parseInt(u.riders, 10),
      total: parseInt(u.total, 10),
    }));
  }

  /**
   * Get top performing farmers
   */
  async getTopFarmers(limit = 10): Promise<any[]> {
    // Orders store items as JSONB with farmerId in each item
    // Use raw query to aggregate by farmerId from the items array
    const result = await this.orderRepository.query(`
      SELECT 
        item->>'farmerId' as "farmerId",
        COUNT(DISTINCT o.id) as "totalOrders",
        SUM((item->>'subtotal')::numeric) as "totalRevenue"
      FROM orders o,
           jsonb_array_elements(o.items) as item
      WHERE o.status = $1
      GROUP BY item->>'farmerId'
      ORDER BY "totalRevenue" DESC NULLS LAST
      LIMIT $2
    `, [OrderStatus.DELIVERED, limit]);

    // Get farmer details
    const farmerIds = result.map((r: any) => r.farmerId).filter(Boolean);
    if (farmerIds.length === 0) {
      return [];
    }

    const farmers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...farmerIds)', { farmerIds })
      .getMany();

    const farmerMap = new Map(farmers.map((f) => [f.id, f]));

    return result.map((r: any) => {
      const farmer = farmerMap.get(r.farmerId);
      return {
        id: r.farmerId,
        name: farmer?.fullName || farmer?.name || 'Unknown Farmer',
        email: farmer?.email || '',
        totalOrders: parseInt(r.totalOrders, 10) || 0,
        totalRevenue: parseFloat(r.totalRevenue || '0'),
      };
    }).filter((f: any) => f.id);
  }

  /**
   * Get top performing riders
   */
  async getTopRiders(limit = 10): Promise<any[]> {
    const riders = await this.riderRepository
      .createQueryBuilder('rider')
      .leftJoin('rider.user', 'user')
      .leftJoin('rider.orders', 'order')
      .select('rider.id', 'id')
      .addSelect('user.fullName', 'name')
      .addSelect('rider.rating', 'rating')
      .addSelect('rider.totalDeliveries', 'totalDeliveries')
      .addSelect('COUNT(order.id)', 'recentOrders')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('rider.id')
      .addGroupBy('user.fullName')
      .addGroupBy('rider.rating')
      .addGroupBy('rider.totalDeliveries')
      .orderBy('rider.rating', 'DESC')
      .addOrderBy('rider.totalDeliveries', 'DESC')
      .limit(limit)
      .getRawMany();

    return riders.map((r) => ({
      id: r.id,
      name: r.name,
      rating: parseFloat(r.rating || '0'),
      totalDeliveries: parseInt(r.totalDeliveries, 10),
      recentOrders: parseInt(r.recentOrders, 10),
    }));
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(
    page = 1,
    limit = 20,
    role?: UserRole,
  ): Promise<{ users: User[]; total: number; pages: number }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Include rider profile if filtering by rider role
    if (role === UserRole.RIDER) {
      queryBuilder.leftJoinAndSelect('user.riderProfile', 'rider');
    }

    if (role) {
      queryBuilder.where('user.role = :role', { role });
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limitNum)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      users,
      total,
      pages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Get all orders with pagination
   */
  async getAllOrders(
    page = 1,
    limit = 20,
    status?: OrderStatus,
  ): Promise<{ orders: Order[]; total: number; pages: number }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.buyer', 'buyer')
      .leftJoinAndSelect('order.assignedRider', 'assignedRider')
      .leftJoinAndSelect('assignedRider.user', 'riderUser');
    // Note: 'items' is a JSONB column, not a relation, so it's included automatically

    if (status) {
      queryBuilder.where('order.status = :status', { status });
    }

    const [orders, total] = await queryBuilder
      .skip(skip)
      .take(limitNum)
      .orderBy('order.createdAt', 'DESC')
      .getManyAndCount();

    return {
      orders,
      total,
      pages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Suspend or unsuspend a user
   */
  async toggleUserSuspension(
    userId: string,
    suspend: boolean,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = !suspend;
    await this.userRepository.save(user);

    this.logger.log(
      `User ${userId} ${suspend ? 'suspended' : 'unsuspended'}`,
    );

    return user;
  }

  /**
   * Verify a rider
   */
  async verifyRider(riderId: string): Promise<Rider> {
    const rider = await this.riderRepository.findOne({
      where: { id: riderId },
      relations: ['user'],
    });

    if (!rider) {
      throw new Error('Rider not found');
    }

    rider.isVerified = true;
    await this.riderRepository.save(rider);

    this.logger.log(`Rider ${riderId} verified`);

    return rider;
  }

  /**
   * Set manual priority boost for a rider
   */
  async setRiderManualBoost(
    riderId: string,
    boost: number,
    expiresInHours: number | undefined,
    reason: string,
    adminId: string,
  ): Promise<{ message: string; rider: Rider }> {
    const rider = await this.riderRepository.findOne({
      where: { id: riderId },
      relations: ['user'],
    });

    if (!rider) {
      throw new Error('Rider not found');
    }

    // Validate boost value
    const boostValue = Math.min(Math.max(boost, 1.0), 5.0);
    
    // Calculate expiry
    let expiresAt: Date | undefined = undefined;
    if (expiresInHours && expiresInHours > 0) {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    rider.manualBoost = boostValue;
    rider.manualBoostExpiresAt = expiresAt as any;
    rider.manualBoostReason = reason;
    rider.manualBoostSetBy = adminId;
    
    await this.riderRepository.save(rider);

    this.logger.log(
      `Admin ${adminId} set manual boost ${boostValue}x for rider ${riderId}` +
      (expiresAt ? ` (expires: ${expiresAt.toISOString()})` : ' (permanent)') +
      `: ${reason}`
    );

    return {
      message: `Priority boost of ${boostValue}x applied successfully`,
      rider,
    };
  }

  /**
   * Remove manual priority boost from a rider
   */
  async removeRiderManualBoost(
    riderId: string,
    adminId: string,
  ): Promise<{ message: string; rider: Rider }> {
    const rider = await this.riderRepository.findOne({
      where: { id: riderId },
      relations: ['user'],
    });

    if (!rider) {
      throw new Error('Rider not found');
    }

    rider.manualBoost = 1.0;
    rider.manualBoostExpiresAt = undefined as any;
    rider.manualBoostReason = undefined as any;
    rider.manualBoostSetBy = undefined as any;
    
    await this.riderRepository.save(rider);

    this.logger.log(`Admin ${adminId} removed manual boost for rider ${riderId}`);

    return {
      message: 'Priority boost removed successfully',
      rider,
    };
  }

  /**
   * Get all farmer applications with pagination
   */
  async getFarmerApplications(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<{ applications: FarmerProfile[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.farmerProfileRepository.createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .orderBy('profile.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('profile.applicationStatus = :status', { status });
    }

    const [applications, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      applications,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Approve a farmer application
   */
  async approveFarmerApplication(applicationId: string, adminId: string) {
    const profile = await this.farmerProfileRepository.findOne({
      where: { id: applicationId },
      relations: ['user'],
    });

    if (!profile) {
      throw new Error('Farmer application not found');
    }

    if (profile.applicationStatus !== FarmerApplicationStatus.PENDING) {
      throw new Error('Application is not pending');
    }

    // Update farmer profile status
    profile.applicationStatus = FarmerApplicationStatus.APPROVED;
    profile.approvedAt = new Date();
    profile.approvedBy = adminId;
    await this.farmerProfileRepository.save(profile);

    // Change user role to farmer
    await this.userRepository.update(profile.userId, {
      role: UserRole.FARMER,
      isActivated: true,
      activatedAt: new Date(),
    });

    // Send approval email notification
    if (profile.user) {
      this.emailService.sendFarmerApprovalEmail(profile.user, {
        farmName: profile.farmName || 'Your Farm',
        approvedAt: profile.approvedAt,
      }).catch(err => this.logger.error(`Failed to send farmer approval email: ${err.message}`));
    }

    this.logger.log(`Farmer application ${applicationId} approved by admin ${adminId}`);

    return {
      success: true,
      message: 'Farmer application approved',
      applicationId: profile.id,
      userId: profile.userId,
      farmName: profile.farmName,
    };
  }

  /**
   * Verify a farmer by user ID (approve their farmer application)
   */
  async verifyFarmerByUserId(userId: string, adminId: string) {
    // Find the farmer profile by user ID
    const profile = await this.farmerProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new Error('Farmer profile not found for this user');
    }

    if (profile.applicationStatus === FarmerApplicationStatus.APPROVED) {
      return {
        success: true,
        message: 'Farmer is already verified',
        applicationId: profile.id,
        userId: profile.userId,
        farmName: profile.farmName || profile.user?.name,
      };
    }

    // Update farmer profile status
    profile.applicationStatus = FarmerApplicationStatus.APPROVED;
    profile.approvedAt = new Date();
    profile.approvedBy = adminId;
    await this.farmerProfileRepository.save(profile);

    // Change user role to farmer and activate
    await this.userRepository.update(profile.userId, {
      role: UserRole.FARMER,
      isActivated: true,
      activatedAt: new Date(),
    });

    // Send approval email notification
    if (profile.user) {
      this.emailService.sendFarmerApprovalEmail(profile.user, {
        farmName: profile.farmName || 'Your Farm',
        approvedAt: profile.approvedAt,
      }).catch(err => this.logger.error(`Failed to send farmer approval email: ${err.message}`));
    }

    this.logger.log(`Farmer (user: ${userId}) verified by admin ${adminId}`);

    return {
      success: true,
      message: 'Farmer verified successfully',
      applicationId: profile.id,
      userId: profile.userId,
      farmName: profile.farmName || profile.user?.name,
    };
  }

  /**
   * Reject a farmer application
   */
  async rejectFarmerApplication(applicationId: string, reason: string, adminId: string) {
    const profile = await this.farmerProfileRepository.findOne({
      where: { id: applicationId },
      relations: ['user'],
    });

    if (!profile) {
      throw new Error('Farmer application not found');
    }

    if (profile.applicationStatus !== FarmerApplicationStatus.PENDING) {
      throw new Error('Application is not pending');
    }

    profile.applicationStatus = FarmerApplicationStatus.REJECTED;
    profile.rejectionReason = reason;
    await this.farmerProfileRepository.save(profile);

    // Send rejection email notification
    if (profile.user) {
      this.emailService.sendFarmerRejectionEmail(profile.user, {
        farmName: profile.farmName || 'Your Farm',
        reason: reason,
        rejectedAt: new Date(),
      }).catch(err => this.logger.error(`Failed to send farmer rejection email: ${err.message}`));
    }

    this.logger.log(`Farmer application ${applicationId} rejected by admin ${adminId}: ${reason}`);

    return {
      success: true,
      message: 'Farmer application rejected',
      applicationId: profile.id,
      userId: profile.userId,
      reason,
    };
  }

  /**
   * Get rider applications with pagination and optional status filter
   */
  async getRiderApplications(
    page = 1,
    limit = 20,
    status?: string,
    search?: string,
  ): Promise<{ items: any[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.riderRepository.createQueryBuilder('rider')
      .leftJoinAndSelect('rider.user', 'user')
      .leftJoinAndSelect('rider.guarantors', 'guarantors')
      .orderBy('rider.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('rider.applicationStatus = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [applications, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Transform to match frontend expectations
    const items = applications.map((rider) => ({
      id: rider.id,
      name: rider.user?.name || 'Unknown',
      firstName: rider.user?.name?.split(' ')[0],
      lastName: rider.user?.name?.split(' ').slice(1).join(' '),
      email: rider.user?.email,
      phone: rider.user?.phone,
      profileImage: rider.user?.avatar,
      vehicleType: rider.vehicleType,
      vehiclePlate: rider.vehiclePlate,
      vehicleModel: rider.vehicleModel,
      vehicleColor: rider.vehicleColor,
      licenseNumber: rider.licenseNumber,
      licenseImage: rider.licenseImage,
      idCardImage: rider.idCardImage,
      state: rider.state,
      city: rider.city,
      applicationStatus: rider.applicationStatus,
      rejectionReason: rider.rejectionReason,
      createdAt: rider.createdAt,
      guarantors: rider.guarantors || [],
    }));

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single rider application by ID
   */
  async getRiderApplication(applicationId: string) {
    const rider = await this.riderRepository.findOne({
      where: { id: applicationId },
      relations: ['user', 'guarantors'],
    });

    if (!rider) {
      throw new Error('Rider application not found');
    }

    return {
      id: rider.id,
      name: rider.user?.name || 'Unknown',
      firstName: rider.user?.name?.split(' ')[0],
      lastName: rider.user?.name?.split(' ').slice(1).join(' '),
      email: rider.user?.email,
      phone: rider.user?.phone,
      profileImage: rider.user?.avatar,
      vehicleType: rider.vehicleType,
      vehiclePlate: rider.vehiclePlate,
      vehicleModel: rider.vehicleModel,
      vehicleColor: rider.vehicleColor,
      licenseNumber: rider.licenseNumber,
      licenseImage: rider.licenseImage,
      idCardImage: rider.idCardImage,
      state: rider.state,
      city: rider.city,
      applicationStatus: rider.applicationStatus,
      rejectionReason: rider.rejectionReason,
      createdAt: rider.createdAt,
      guarantors: rider.guarantors || [],
    };
  }

  /**
   * Get available riders for order assignment
   * Returns riders who are verified, online, and available for deliveries
   * Filters by state to ensure riders can only be assigned to orders in their operating state
   */
  async getAvailableRiders(
    page = 1,
    limit = 100,
    state?: string,
  ): Promise<{ items: any[]; total: number; pages: number }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 100;
    const skip = (pageNum - 1) * limitNum;

    const queryBuilder = this.riderRepository.createQueryBuilder('rider')
      .leftJoinAndSelect('rider.user', 'user')
      .where('rider.isVerified = :isVerified', { isVerified: true })
      .andWhere('rider.applicationStatus = :status', { status: RiderApplicationStatus.APPROVED })
      .andWhere('rider.isOnline = :isOnline', { isOnline: true });

    // Filter by state if provided - only show riders operating in the same state
    if (state) {
      queryBuilder.andWhere('LOWER(rider.currentState) = LOWER(:state)', { state });
    }

    queryBuilder.orderBy('rider.rating', 'DESC')
      .addOrderBy('rider.completedDeliveries', 'DESC');

    const [riders, total] = await queryBuilder
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    // Transform to match frontend expectations
    const items = riders.map((rider) => ({
      id: rider.id,
      userId: rider.userId,
      name: rider.user?.name || 'Unknown',
      firstName: rider.user?.name?.split(' ')[0],
      lastName: rider.user?.name?.split(' ').slice(1).join(' '),
      email: rider.user?.email,
      phone: rider.user?.phone || '',
      profileImage: rider.user?.avatar,
      vehicleType: rider.vehicleType,
      isAvailable: rider.status === RiderStatus.AVAILABLE,
      isOnline: rider.isOnline,
      rating: rider.rating,
      currentState: rider.currentState,
      completedDeliveries: rider.completedDeliveries,
    }));

    return {
      items,
      total,
      pages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Approve a rider application
   */
  async approveRiderApplication(applicationId: string, adminId: string) {
    const rider = await this.riderRepository.findOne({
      where: { id: applicationId },
      relations: ['user'],
    });

    if (!rider) {
      throw new Error('Rider application not found');
    }

    if (rider.applicationStatus !== RiderApplicationStatus.PENDING) {
      throw new Error('Application is not pending');
    }

    // Update rider profile status
    rider.applicationStatus = RiderApplicationStatus.APPROVED;
    rider.approvedAt = new Date();
    rider.approvedBy = adminId;
    rider.isVerified = true;
    await this.riderRepository.save(rider);

    // Ensure user has rider role and is active
    await this.userRepository.update(rider.userId, {
      role: UserRole.RIDER,
      isActive: true,
    });

    // Send approval email notification
    if (rider.user) {
      this.emailService.sendRiderApprovalEmail(rider.user, {
        vehicleType: rider.vehicleType || 'N/A',
        state: rider.state || 'Nigeria',
        approvedAt: rider.approvedAt,
      }).catch(err => this.logger.error(`Failed to send rider approval email: ${err.message}`));
    }

    this.logger.log(`Rider application ${applicationId} approved by admin ${adminId}`);

    return {
      success: true,
      message: 'Rider application approved',
      applicationId: rider.id,
      userId: rider.userId,
    };
  }

  /**
   * Reject a rider application
   */
  async rejectRiderApplication(applicationId: string, reason: string, adminId: string) {
    const rider = await this.riderRepository.findOne({
      where: { id: applicationId },
      relations: ['user'],
    });

    if (!rider) {
      throw new Error('Rider application not found');
    }

    if (rider.applicationStatus !== RiderApplicationStatus.PENDING) {
      throw new Error('Application is not pending');
    }

    rider.applicationStatus = RiderApplicationStatus.REJECTED;
    rider.rejectionReason = reason;
    await this.riderRepository.save(rider);

    // Send rejection email notification
    if (rider.user) {
      this.emailService.sendRiderRejectionEmail(rider.user, {
        reason: reason,
        rejectedAt: new Date(),
      }).catch(err => this.logger.error(`Failed to send rider rejection email: ${err.message}`));
    }

    this.logger.log(`Rider application ${applicationId} rejected by admin ${adminId}: ${reason}`);

    return {
      success: true,
      message: 'Rider application rejected',
      applicationId: rider.id,
      userId: rider.userId,
      reason,
    };
  }

  /**
   * Get dispatch analytics
   */
  async getDispatchAnalytics(startDate: Date, endDate: Date): Promise<any> {
    const analytics = await this.dispatchLogRepository
      .createQueryBuilder('log')
      .select('log.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(log.attemptCount)', 'avgAttempts')
      .where('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('log.status')
      .getRawMany();

    const totalDispatches = analytics.reduce(
      (sum, a) => sum + parseInt(a.count, 10),
      0,
    );

    return {
      total: totalDispatches,
      byStatus: analytics.map((a) => ({
        status: a.status,
        count: parseInt(a.count, 10),
        avgAttempts: parseFloat(a.avgAttempts || '0'),
        percentage:
          totalDispatches > 0
            ? ((parseInt(a.count, 10) / totalDispatches) * 100).toFixed(2)
            : '0',
      })),
    };
  }

  /**
   * Get all products with pagination (Admin)
   */
  async getAllProducts(
    page = 1,
    limit = 20,
    category?: string,
    search?: string,
  ): Promise<{ products: Product[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .orderBy('product.createdAt', 'DESC');

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.title ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [products, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      products,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a product (Admin)
   */
  async updateProduct(
    productId: string,
    data: Partial<Product>,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    Object.assign(product, data);
    return this.productRepository.save(product);
  }

  /**
   * Create a product for a farmer (Admin)
   */
  async createProductForFarmer(
    farmerId: string,
    productData: Partial<Product>,
  ): Promise<Product> {
    // Verify user exists - allow both farmers and admins to create products
    const farmer = await this.userRepository.findOne({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw new Error('User not found');
    }

    // Only allow farmers or admins to create products
    if (farmer.role !== UserRole.FARMER && farmer.role !== UserRole.ADMIN) {
      throw new Error('Only farmers or admins can create products');
    }

    // Use farmer's location if available, otherwise use defaults (Lagos)
    const pickupLat = farmer.latitude || 6.5244;
    const pickupLng = farmer.longitude || 3.3792;
    const pickupState = farmer.state || 'Lagos';
    const pickupCity = farmer.city || 'Lagos';
    const pickupAddress = farmer.address || '';

    const product = this.productRepository.create({
      ...productData,
      farmer,
      farmerId,
      pickupLat,
      pickupLng,
      pickupState,
      pickupCity,
      pickupAddress,
      isAvailable: true,
    });

    return this.productRepository.save(product);
  }

  /**
   * Get list of farmers for product creation dropdown
   */
  async getFarmersForDropdown(): Promise<{ id: string; name: string; businessName: string }[]> {
    // Get approved farmer profiles with user data
    const farmerProfiles = await this.farmerProfileRepository.find({
      where: { applicationStatus: FarmerApplicationStatus.APPROVED },
      relations: ['user'],
    });

    return farmerProfiles
      .filter(fp => fp.user && fp.user.isActive)
      .map(fp => ({
        id: fp.userId,
        name: fp.user.name,
        businessName: fp.farmName || `${fp.user.name}'s Farm`,
      }));
  }

  /**
   * Delete a product (Admin)
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.productRepository.delete(productId);
  }

  // ==================== AUDIT LOG METHODS ====================

  /**
   * Create an audit log entry
   */
  async createAuditLog(data: {
    action: AuditAction;
    category: AuditCategory;
    adminId: string;
    targetId?: string;
    targetType?: string;
    description?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }

  /**
   * Get audit logs with pagination and filtering
   */
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: AuditAction;
    category?: AuditCategory;
    adminId?: string;
    targetId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { 
      page = 1, 
      limit = 20, 
      action, 
      category, 
      adminId, 
      targetId,
      search,
      startDate,
      endDate,
    } = params;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.admin', 'admin')
      .orderBy('audit.createdAt', 'DESC');

    if (action) {
      queryBuilder.andWhere('audit.action = :action', { action });
    }

    if (category) {
      queryBuilder.andWhere('audit.category = :category', { category });
    }

    if (adminId) {
      queryBuilder.andWhere('audit.adminId = :adminId', { adminId });
    }

    if (targetId) {
      queryBuilder.andWhere('audit.targetId = :targetId', { targetId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(audit.description ILIKE :search OR admin.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { 
        startDate: new Date(startDate) 
      });
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('audit.createdAt <= :endDate', { 
        endDate: endDateTime 
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({
      where: { id },
      relations: ['admin'],
    });
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalLogs: number;
    byCategory: Record<string, number>;
    byAction: Record<string, number>;
    recentActivity: AuditLog[];
  }> {
    const { startDate, endDate } = params;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { 
        startDate: new Date(startDate) 
      });
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('audit.createdAt <= :endDate', { 
        endDate: endDateTime 
      });
    }

    const totalLogs = await queryBuilder.getCount();

    // Get counts by category
    const categoryStats = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.category')
      .getRawMany();

    const byCategory: Record<string, number> = {};
    categoryStats.forEach(stat => {
      byCategory[stat.category] = parseInt(stat.count, 10);
    });

    // Get counts by action
    const actionStats = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.action')
      .getRawMany();

    const byAction: Record<string, number> = {};
    actionStats.forEach(stat => {
      byAction[stat.action] = parseInt(stat.count, 10);
    });

    // Get recent activity
    const recentActivity = await this.auditLogRepository.find({
      relations: ['admin'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      totalLogs,
      byCategory,
      byAction,
      recentActivity,
    };
  }

  /**
   * Get list of admins for audit log filtering
   */
  async getAdminsForDropdown(): Promise<{ id: string; name: string }[]> {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
      select: ['id', 'name'],
    });

    return admins.map(admin => ({
      id: admin.id,
      name: admin.name,
    }));
  }

  // ==================== SETTINGS METHODS ====================

  // Default dispatch configuration
  private readonly DEFAULT_DISPATCH_CONFIG = {
    // Pricing
    baseFee: 500,
    perKmRate: 100,
    peakHoursMultiplier: 1.5,
    minFee: 300,
    maxFee: 5000,
    
    // Timing
    maxDeliveryRadius: 25,
    estimatedPrepTime: 30,
    avgDeliverySpeed: 25,
    bufferTime: 10,
    
    // Auto-dispatch
    autoDispatchEnabled: true,
    autoDispatchDelay: 30,
    maxAutoDispatchAttempts: 5,
    prioritizeVerifiedRiders: true,
    maxActiveOrdersPerRider: 3,
    minRiderRating: 3.5,
    
    // Features
    enableLiveTracking: true,
    enableRiderChat: true,
    enableOrderScheduling: true,
    enableExpressDelivery: true,
    
    // Express delivery
    expressDeliveryMultiplier: 1.8,
    expressDeliveryMaxDistance: 10,
  };

  /**
   * Get dispatch configuration
   */
  async getDispatchConfig(): Promise<Record<string, any>> {
    const setting = await this.appSettingsRepository.findOne({
      where: { key: 'dispatch_config' },
    });

    if (setting?.value?.data) {
      return { ...this.DEFAULT_DISPATCH_CONFIG, ...setting.value.data };
    }

    return this.DEFAULT_DISPATCH_CONFIG;
  }

  /**
   * Update dispatch configuration
   */
  async updateDispatchConfig(
    config: Record<string, any>,
    adminId?: string,
  ): Promise<Record<string, any>> {
    let setting = await this.appSettingsRepository.findOne({
      where: { key: 'dispatch_config' },
    });

    if (!setting) {
      setting = this.appSettingsRepository.create({
        key: 'dispatch_config',
        category: 'dispatch',
        description: 'Dispatch and delivery configuration',
        value: { data: config },
      });
    } else {
      const existingData = setting.value?.data || {};
      setting.value = { data: { ...existingData, ...config } };
    }

    await this.appSettingsRepository.save(setting);

    // Create audit log
    if (adminId) {
      await this.createAuditLog({
        action: AuditAction.SETTINGS_UPDATE,
        category: AuditCategory.SYSTEM,
        adminId,
        description: 'Updated dispatch configuration',
        newValues: config,
      });
    }

    return this.getDispatchConfig();
  }

  /**
   * Get all settings as a unified object
   */
  async getSettings(): Promise<SettingsData> {
    const settings = await this.appSettingsRepository.find();
    
    // Start with defaults
    const result: SettingsData = { ...DEFAULT_SETTINGS };
    
    // Override with saved settings
    for (const setting of settings) {
      const value = setting.value;
      if (value && typeof value === 'object' && 'data' in value) {
        Object.assign(result, value.data);
      }
    }
    
    return result;
  }

  /**
   * Update settings by category
   */
  async updateSettings(
    category: string,
    data: Partial<SettingsData>,
    adminId?: string,
  ): Promise<SettingsData> {
    // Find existing setting for this category
    let setting = await this.appSettingsRepository.findOne({
      where: { key: `settings_${category}` },
    });

    if (!setting) {
      setting = this.appSettingsRepository.create({
        key: `settings_${category}`,
        category,
        description: `${category} settings`,
        value: { data },
      });
    } else {
      // Merge existing data with new data
      const existingData = setting.value?.data || {};
      setting.value = { data: { ...existingData, ...data } };
    }

    await this.appSettingsRepository.save(setting);

    // Create audit log for settings update
    if (adminId) {
      await this.createAuditLog({
        action: AuditAction.SETTINGS_UPDATE,
        category: AuditCategory.SYSTEM,
        adminId,
        description: `Updated ${category} settings`,
        newValues: data,
      });
    }

    return this.getSettings();
  }

  /**
   * Get a specific setting value
   */
  async getSetting<K extends keyof SettingsData>(key: K): Promise<SettingsData[K]> {
    const settings = await this.getSettings();
    return settings[key];
  }

  /**
   * Initialize default settings if none exist
   */
  async initializeSettings(): Promise<void> {
    const existingSettings = await this.appSettingsRepository.count();
    
    if (existingSettings === 0) {
      this.logger.log('Initializing default settings...');
      
      const categories = ['general', 'business', 'notifications', 'security', 'operational'];
      
      for (const category of categories) {
        const categorySettings: Partial<SettingsData> = {};
        
        // Group settings by category
        if (category === 'general') {
          categorySettings.appName = DEFAULT_SETTINGS.appName;
          categorySettings.supportEmail = DEFAULT_SETTINGS.supportEmail;
          categorySettings.supportPhone = DEFAULT_SETTINGS.supportPhone;
          categorySettings.currency = DEFAULT_SETTINGS.currency;
          categorySettings.timezone = DEFAULT_SETTINGS.timezone;
        } else if (category === 'business') {
          categorySettings.commissionRate = DEFAULT_SETTINGS.commissionRate;
          categorySettings.minOrderAmount = DEFAULT_SETTINGS.minOrderAmount;
          categorySettings.maxOrderAmount = DEFAULT_SETTINGS.maxOrderAmount;
          categorySettings.defaultDeliveryFee = DEFAULT_SETTINGS.defaultDeliveryFee;
          categorySettings.freeDeliveryThreshold = DEFAULT_SETTINGS.freeDeliveryThreshold;
        } else if (category === 'notifications') {
          categorySettings.enableEmailNotifications = DEFAULT_SETTINGS.enableEmailNotifications;
          categorySettings.enableSmsNotifications = DEFAULT_SETTINGS.enableSmsNotifications;
          categorySettings.enablePushNotifications = DEFAULT_SETTINGS.enablePushNotifications;
          categorySettings.orderNotificationEmails = DEFAULT_SETTINGS.orderNotificationEmails;
        } else if (category === 'security') {
          categorySettings.maxLoginAttempts = DEFAULT_SETTINGS.maxLoginAttempts;
          categorySettings.sessionTimeout = DEFAULT_SETTINGS.sessionTimeout;
          categorySettings.requireEmailVerification = DEFAULT_SETTINGS.requireEmailVerification;
          categorySettings.require2FA = DEFAULT_SETTINGS.require2FA;
        } else if (category === 'operational') {
          categorySettings.operatingHoursStart = DEFAULT_SETTINGS.operatingHoursStart;
          categorySettings.operatingHoursEnd = DEFAULT_SETTINGS.operatingHoursEnd;
          categorySettings.enableMaintenanceMode = DEFAULT_SETTINGS.enableMaintenanceMode;
          categorySettings.maintenanceMessage = DEFAULT_SETTINGS.maintenanceMessage;
          categorySettings.allowNewRegistrations = DEFAULT_SETTINGS.allowNewRegistrations;
        }
        
        const setting = this.appSettingsRepository.create({
          key: `settings_${category}`,
          category,
          description: `${category} settings`,
          value: { data: categorySettings },
        });
        
        await this.appSettingsRepository.save(setting);
      }
      
      this.logger.log('Default settings initialized');
    }
  }

  // ==================== PLATFORM REVENUE METHODS ====================

  /**
   * Get platform revenue dashboard stats
   */
  async getRevenueDashboard(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    farmerCommissions: number;
    riderCommissions: number;
    serviceFees: number;
    revenueByType: Array<{ type: string; amount: number; count: number }>;
    revenueByDay: Array<{ date: string; amount: number }>;
    topFarmerContributors: Array<{ userId: string; name: string; totalCommission: number }>;
    topRiderContributors: Array<{ userId: string; name: string; totalCommission: number }>;
  }> {
    const queryBuilder = this.platformRevenueRepository.createQueryBuilder('revenue');

    if (startDate) {
      queryBuilder.andWhere('revenue.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('revenue.createdAt <= :endDate', { endDate });
    }

    // Total revenue
    const totalResult = await queryBuilder
      .clone()
      .select('SUM(revenue.amount)', 'total')
      .getRawOne();
    const totalRevenue = Number(totalResult?.total || 0);

    // Revenue by type
    const revenueByType = await queryBuilder
      .clone()
      .select('revenue.type', 'type')
      .addSelect('SUM(revenue.amount)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .groupBy('revenue.type')
      .getRawMany();

    const farmerCommissions = Number(
      revenueByType.find((r) => r.type === RevenueType.FARMER_COMMISSION)?.amount || 0,
    );
    const riderCommissions = Number(
      revenueByType.find((r) => r.type === RevenueType.RIDER_COMMISSION)?.amount || 0,
    );
    const serviceFees = Number(
      revenueByType.find((r) => r.type === RevenueType.SERVICE_FEE)?.amount || 0,
    );

    // Revenue by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByDay = await this.platformRevenueRepository
      .createQueryBuilder('revenue')
      .select("TO_CHAR(revenue.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(revenue.amount)', 'amount')
      .where('revenue.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy("TO_CHAR(revenue.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    // Top farmer contributors
    const topFarmerContributors = await this.platformRevenueRepository
      .createQueryBuilder('revenue')
      .select('revenue.sourceUserId', 'userId')
      .addSelect('SUM(revenue.amount)', 'totalCommission')
      .where('revenue.type = :type', { type: RevenueType.FARMER_COMMISSION })
      .andWhere('revenue.sourceUserId IS NOT NULL')
      .groupBy('revenue.sourceUserId')
      .orderBy('totalCommission', 'DESC')
      .limit(10)
      .getRawMany();

    // Get farmer names
    for (const farmer of topFarmerContributors) {
      const user = await this.userRepository.findOne({ where: { id: farmer.userId } });
      farmer.name = user?.name || 'Unknown';
      farmer.totalCommission = Number(farmer.totalCommission);
    }

    // Top rider contributors
    const topRiderContributors = await this.platformRevenueRepository
      .createQueryBuilder('revenue')
      .select('revenue.sourceUserId', 'userId')
      .addSelect('SUM(revenue.amount)', 'totalCommission')
      .where('revenue.type = :type', { type: RevenueType.RIDER_COMMISSION })
      .andWhere('revenue.sourceUserId IS NOT NULL')
      .groupBy('revenue.sourceUserId')
      .orderBy('totalCommission', 'DESC')
      .limit(10)
      .getRawMany();

    // Get rider names
    for (const rider of topRiderContributors) {
      const riderEntity = await this.riderRepository.findOne({
        where: { id: rider.userId },
        relations: ['user'],
      });
      rider.name = riderEntity?.user?.name || 'Unknown';
      rider.totalCommission = Number(rider.totalCommission);
    }

    return {
      totalRevenue,
      farmerCommissions,
      riderCommissions,
      serviceFees,
      revenueByType: revenueByType.map((r) => ({
        type: r.type,
        amount: Number(r.amount),
        count: Number(r.count),
      })),
      revenueByDay: revenueByDay.map((r) => ({
        date: r.date,
        amount: Number(r.amount),
      })),
      topFarmerContributors,
      topRiderContributors,
    };
  }

  /**
   * Get revenue transactions with pagination
   */
  async getRevenueTransactions(
    page = 1,
    limit = 20,
    type?: RevenueType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    data: PlatformRevenue[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.platformRevenueRepository
      .createQueryBuilder('revenue')
      .orderBy('revenue.createdAt', 'DESC');

    if (type) {
      queryBuilder.andWhere('revenue.type = :type', { type });
    }
    if (startDate) {
      queryBuilder.andWhere('revenue.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('revenue.createdAt <= :endDate', { endDate });
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get revenue summary by period
   */
  async getRevenueSummary(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<{
    currentPeriod: number;
    previousPeriod: number;
    percentageChange: number;
    breakdown: {
      farmerCommissions: number;
      riderCommissions: number;
      serviceFees: number;
    };
  }> {
    const now = new Date();
    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;

    switch (period) {
      case 'daily':
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 1);
        break;
      case 'weekly':
        currentStart = new Date(now);
        currentStart.setDate(currentStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 7);
        break;
      case 'monthly':
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousEnd = new Date(currentStart);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'yearly':
        currentStart = new Date(now.getFullYear(), 0, 1);
        previousEnd = new Date(currentStart);
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        break;
    }

    // Current period revenue
    const currentResult = await this.platformRevenueRepository
      .createQueryBuilder('revenue')
      .select('SUM(revenue.amount)', 'total')
      .addSelect('revenue.type', 'type')
      .where('revenue.createdAt >= :currentStart', { currentStart })
      .groupBy('revenue.type')
      .getRawMany();

    const currentTotal = currentResult.reduce((sum, r) => sum + Number(r.total), 0);

    // Previous period revenue
    const previousResult = await this.platformRevenueRepository
      .createQueryBuilder('revenue')
      .select('SUM(revenue.amount)', 'total')
      .where('revenue.createdAt >= :previousStart', { previousStart })
      .andWhere('revenue.createdAt < :previousEnd', { previousEnd })
      .getRawOne();

    const previousTotal = Number(previousResult?.total || 0);
    const percentageChange = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : currentTotal > 0 ? 100 : 0;

    return {
      currentPeriod: currentTotal,
      previousPeriod: previousTotal,
      percentageChange: Math.round(percentageChange * 100) / 100,
      breakdown: {
        farmerCommissions: Number(
          currentResult.find((r) => r.type === RevenueType.FARMER_COMMISSION)?.total || 0,
        ),
        riderCommissions: Number(
          currentResult.find((r) => r.type === RevenueType.RIDER_COMMISSION)?.total || 0,
        ),
        serviceFees: Number(
          currentResult.find((r) => r.type === RevenueType.SERVICE_FEE)?.total || 0,
        ),
      },
    };
  }

  // ==================== PRODUCT PROMOTION MANAGEMENT ====================

  /**
   * Toggle product promotion status
   */
  async toggleProductPromotion(
    productId: string,
    isPromoted: boolean,
    promotionDays?: number,
    adminId?: string,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new Error('Product not found');
    }

    product.isPromoted = isPromoted;
    
    if (isPromoted && promotionDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + promotionDays);
      product.promotionExpiresAt = expiresAt;
    } else if (!isPromoted) {
      product.promotionExpiresAt = null;
    }

    const savedProduct = await this.productRepository.save(product);

    // Log the action
    if (adminId) {
      await this.createAuditLog({
        action: AuditAction.PRODUCT_UPDATE,
        category: AuditCategory.PRODUCT,
        adminId,
        targetId: productId,
        targetType: 'product',
        description: isPromoted ? 'Product promoted' : 'Product unpromoted',
        metadata: { action: isPromoted ? 'promoted' : 'unpromoted', promotionDays },
      });
    }

    return savedProduct;
  }

  /**
   * Toggle admin product status (Official Store)
   */
  async toggleAdminProduct(
    productId: string,
    isAdminProduct: boolean,
    adminId?: string,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new Error('Product not found');
    }

    product.isAdminProduct = isAdminProduct;
    const savedProduct = await this.productRepository.save(product);

    // Log the action
    if (adminId) {
      await this.createAuditLog({
        action: AuditAction.PRODUCT_UPDATE,
        category: AuditCategory.PRODUCT,
        adminId,
        targetId: productId,
        targetType: 'product',
        description: isAdminProduct ? 'Added to Official Store' : 'Removed from Official Store',
        metadata: { action: isAdminProduct ? 'added_to_official_store' : 'removed_from_official_store' },
      });
    }

    return savedProduct;
  }

  /**
   * Update product recommendation score
   */
  async updateRecommendationScore(
    productId: string,
    score: number,
    adminId?: string,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new Error('Product not found');
    }

    // Clamp score between 0 and 100
    product.recommendationScore = Math.max(0, Math.min(100, score));
    const savedProduct = await this.productRepository.save(product);

    // Log the action
    if (adminId) {
      await this.createAuditLog({
        action: AuditAction.PRODUCT_UPDATE,
        category: AuditCategory.PRODUCT,
        adminId,
        targetId: productId,
        targetType: 'product',
        description: 'Updated recommendation score',
        metadata: { action: 'recommendation_score_updated', score },
      });
    }

    return savedProduct;
  }

  /**
   * Get all promoted products for admin management
   */
  async getPromotedProducts(page = 1, limit = 20): Promise<{ products: Product[]; total: number; pages: number }> {
    const [products, total] = await this.productRepository.findAndCount({
      where: { isPromoted: true },
      relations: ['farmer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      products,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all admin-curated products for admin management
   */
  async getAdminCuratedProducts(page = 1, limit = 20): Promise<{ products: Product[]; total: number; pages: number }> {
    const [products, total] = await this.productRepository.findAndCount({
      where: { isAdminProduct: true },
      relations: ['farmer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      products,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // ==================== PRODUCT APPROVAL MANAGEMENT ====================

  /**
   * Get all products pending approval
   */
  async getPendingApprovalProducts(page = 1, limit = 20): Promise<{ products: Product[]; total: number; pages: number }> {
    const [products, total] = await this.productRepository.findAndCount({
      where: { approvalStatus: ProductApprovalStatus.PENDING },
      relations: ['farmer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      products,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Approve a product listing
   */
  async approveProduct(productId: string, adminId: string): Promise<Product> {
    const product = await this.productRepository.findOne({ 
      where: { id: productId },
      relations: ['farmer'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.approvalStatus = ProductApprovalStatus.APPROVED;
    product.approvedAt = new Date();
    product.approvedById = adminId;
    product.rejectionReason = null as any;

    const savedProduct = await this.productRepository.save(product);

    // Notify farmer
    if (product.farmer) {
      await this.notificationsService.sendPushNotification({
        userId: product.farmerId,
        type: NotificationType.GENERAL,
        title: 'Product Approved ✅',
        body: `Your product "${product.title}" has been approved and is now visible to buyers.`,
        data: { productId: product.id },
      });

      // Send email notification
      if (product.farmer.email) {
        await this.emailService.sendProductApprovalEmail(
          product.farmer.email,
          product.farmer.name || 'Farmer',
          product.title,
        );
      }
    }

    return savedProduct;
  }

  /**
   * Reject a product listing
   */
  async rejectProduct(productId: string, reason: string, adminId: string): Promise<Product> {
    const product = await this.productRepository.findOne({ 
      where: { id: productId },
      relations: ['farmer'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.approvalStatus = ProductApprovalStatus.REJECTED;
    product.rejectionReason = reason;
    product.isAvailable = false;

    const savedProduct = await this.productRepository.save(product);

    // Notify farmer
    if (product.farmer) {
      await this.notificationsService.sendPushNotification({
        userId: product.farmerId,
        type: NotificationType.GENERAL,
        title: 'Product Rejected',
        body: `Your product "${product.title}" was not approved. Reason: ${reason}`,
        data: { productId: product.id },
      });

      // Send email notification
      if (product.farmer.email) {
        await this.emailService.sendProductRejectionEmail(
          product.farmer.email,
          product.farmer.name || 'Farmer',
          product.title,
          reason,
        );
      }
    }

    return savedProduct;
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  /**
   * Get all subscriptions dashboard stats
   */
  async getSubscriptionsDashboard() {
    // Farmer subscription stats
    const [
      totalFarmerSubscriptions,
      activeFarmerSubscriptions,
      farmerSubscriptionRevenue,
      farmerTierBreakdown,
    ] = await Promise.all([
      this.farmerSubscriptionRepository.count(),
      this.farmerSubscriptionRepository.count({ 
        where: { status: FarmerSubscriptionStatus.ACTIVE } 
      }),
      this.farmerSubscriptionRepository
        .createQueryBuilder('sub')
        .select('SUM(sub.amount)', 'total')
        .where('sub.status IN (:...statuses)', { 
          statuses: [FarmerSubscriptionStatus.ACTIVE, FarmerSubscriptionStatus.EXPIRED] 
        })
        .getRawOne(),
      this.farmerSubscriptionRepository
        .createQueryBuilder('sub')
        .select('sub.tier', 'tier')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(sub.amount)', 'revenue')
        .where('sub.status = :status', { status: FarmerSubscriptionStatus.ACTIVE })
        .groupBy('sub.tier')
        .getRawMany(),
    ]);

    // Rider subscription stats
    const [
      totalRiderSubscriptions,
      activeRiderSubscriptions,
      riderSubscriptionRevenue,
      riderTierBreakdown,
    ] = await Promise.all([
      this.riderSubscriptionRepository.count(),
      this.riderSubscriptionRepository.count({ 
        where: { status: RiderSubscriptionStatus.ACTIVE } 
      }),
      this.riderSubscriptionRepository
        .createQueryBuilder('sub')
        .select('SUM(sub.amount)', 'total')
        .where('sub.status IN (:...statuses)', { 
          statuses: [RiderSubscriptionStatus.ACTIVE, RiderSubscriptionStatus.EXPIRED] 
        })
        .getRawOne(),
      this.riderSubscriptionRepository
        .createQueryBuilder('sub')
        .select('sub.tier', 'tier')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(sub.amount)', 'revenue')
        .where('sub.status = :status', { status: RiderSubscriptionStatus.ACTIVE })
        .groupBy('sub.tier')
        .getRawMany(),
    ]);

    // Get expiring soon subscriptions (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [farmerExpiringSoon, riderExpiringSoon] = await Promise.all([
      this.farmerSubscriptionRepository.count({
        where: {
          status: FarmerSubscriptionStatus.ACTIVE,
          endDate: Between(new Date(), sevenDaysFromNow),
        },
      }),
      this.riderSubscriptionRepository.count({
        where: {
          status: RiderSubscriptionStatus.ACTIVE,
          endDate: Between(new Date(), sevenDaysFromNow),
        },
      }),
    ]);

    return {
      farmer: {
        total: totalFarmerSubscriptions,
        active: activeFarmerSubscriptions,
        revenue: parseFloat(farmerSubscriptionRevenue?.total || '0'),
        expiringSoon: farmerExpiringSoon,
        tierBreakdown: farmerTierBreakdown,
      },
      rider: {
        total: totalRiderSubscriptions,
        active: activeRiderSubscriptions,
        revenue: parseFloat(riderSubscriptionRevenue?.total || '0'),
        expiringSoon: riderExpiringSoon,
        tierBreakdown: riderTierBreakdown,
      },
      totalRevenue: parseFloat(farmerSubscriptionRevenue?.total || '0') + parseFloat(riderSubscriptionRevenue?.total || '0'),
      totalActive: activeFarmerSubscriptions + activeRiderSubscriptions,
      totalExpiringSoon: farmerExpiringSoon + riderExpiringSoon,
    };
  }

  /**
   * Get all farmer subscriptions with pagination and filters
   */
  async getFarmerSubscriptions(options: {
    page?: number;
    limit?: number;
    status?: FarmerSubscriptionStatus;
    tier?: FarmerSubscriptionTier;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, tier, search } = options;

    const qb = this.farmerSubscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.farmer', 'farmer')
      .orderBy('sub.createdAt', 'DESC');

    if (status) {
      qb.andWhere('sub.status = :status', { status });
    }

    if (tier) {
      qb.andWhere('sub.tier = :tier', { tier });
    }

    if (search) {
      qb.andWhere('(farmer.name ILIKE :search OR farmer.email ILIKE :search OR farmer.phone ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [subscriptions, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      subscriptions,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all rider subscriptions with pagination and filters
   */
  async getRiderSubscriptions(options: {
    page?: number;
    limit?: number;
    status?: RiderSubscriptionStatus;
    tier?: RiderSubscriptionTier;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, tier, search } = options;

    const qb = this.riderSubscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.rider', 'rider')
      .leftJoinAndSelect('rider.user', 'user')
      .orderBy('sub.createdAt', 'DESC');

    if (status) {
      qb.andWhere('sub.status = :status', { status });
    }

    if (tier) {
      qb.andWhere('sub.tier = :tier', { tier });
    }

    if (search) {
      qb.andWhere('(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [subscriptions, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      subscriptions,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get recent subscriptions for all user types
   */
  async getRecentSubscriptions(limit = 10) {
    const [farmerSubs, riderSubs] = await Promise.all([
      this.farmerSubscriptionRepository.find({
        relations: ['farmer'],
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.riderSubscriptionRepository.find({
        relations: ['rider', 'rider.user'],
        order: { createdAt: 'DESC' },
        take: limit,
      }),
    ]);

    // Combine and sort by creation date
    const allSubs = [
      ...farmerSubs.map(sub => ({
        ...sub,
        userType: 'farmer' as const,
        userName: sub.farmer?.name || 'Unknown',
        userEmail: sub.farmer?.email || '',
        userPhone: sub.farmer?.phone || '',
      })),
      ...riderSubs.map(sub => ({
        ...sub,
        userType: 'rider' as const,
        userName: sub.rider?.user?.name || 'Unknown',
        userEmail: sub.rider?.user?.email || '',
        userPhone: sub.rider?.user?.phone || '',
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return allSubs;
  }

  /**
   * Get subscription revenue over time
   */
  async getSubscriptionRevenueOverTime(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [farmerRevenue, riderRevenue] = await Promise.all([
      this.farmerSubscriptionRepository
        .createQueryBuilder('sub')
        .select("DATE(sub.createdAt)", 'date')
        .addSelect('SUM(sub.amount)', 'revenue')
        .addSelect('COUNT(*)', 'count')
        .where('sub.createdAt >= :startDate', { startDate })
        .groupBy('DATE(sub.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany(),
      this.riderSubscriptionRepository
        .createQueryBuilder('sub')
        .select("DATE(sub.createdAt)", 'date')
        .addSelect('SUM(sub.amount)', 'revenue')
        .addSelect('COUNT(*)', 'count')
        .where('sub.createdAt >= :startDate', { startDate })
        .groupBy('DATE(sub.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany(),
    ]);

    // Merge the data by date
    const dateMap = new Map<string, { date: string; farmerRevenue: number; riderRevenue: number; farmerCount: number; riderCount: number }>();

    for (const item of farmerRevenue) {
      const dateStr = item.date;
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { date: dateStr, farmerRevenue: 0, riderRevenue: 0, farmerCount: 0, riderCount: 0 });
      }
      const entry = dateMap.get(dateStr)!;
      entry.farmerRevenue = parseFloat(item.revenue || '0');
      entry.farmerCount = parseInt(item.count || '0');
    }

    for (const item of riderRevenue) {
      const dateStr = item.date;
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { date: dateStr, farmerRevenue: 0, riderRevenue: 0, farmerCount: 0, riderCount: 0 });
      }
      const entry = dateMap.get(dateStr)!;
      entry.riderRevenue = parseFloat(item.revenue || '0');
      entry.riderCount = parseInt(item.count || '0');
    }

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Bulk update products that have no images with category-appropriate placeholder images
   */
  async bulkUpdateProductImages(category?: string): Promise<{ updated: number; products: { id: string; title: string; images: string[] }[] }> {
    // Category-specific placeholder images from Unsplash
    const categoryImages: Record<string, string[]> = {
      vegetables: [
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400',
      ],
      fruits: [
        'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400',
        'https://images.unsplash.com/photo-1568702846914-96b305d2uj9e?w=400',
      ],
      tubers: [
        'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400',
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
      ],
      grains: [
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      ],
      poultry: [
        'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
        'https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?w=400',
      ],
      livestock: [
        'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=400',
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400',
      ],
      seafood: [
        'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400',
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400',
      ],
      dairy: [
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
      ],
      oils: [
        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
      ],
      honey: [
        'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400',
        'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400',
      ],
      herbs: [
        'https://images.unsplash.com/photo-1515586838455-8f8f940d6853?w=400',
        'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400',
      ],
      legumes: [
        'https://images.unsplash.com/photo-1515543904913-a9073c854f15?w=400',
        'https://images.unsplash.com/photo-1599949104055-2d04026aee1e?w=400',
      ],
      nuts: [
        'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400',
        'https://images.unsplash.com/photo-1573851552153-88fca3d3d4bd?w=400',
      ],
      seeds: [
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
        'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=400',
      ],
      processed: [
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
        'https://images.unsplash.com/photo-1582169296194-e4d8f05c7f30?w=400',
      ],
      beverages: [
        'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
        'https://images.unsplash.com/photo-1601903268178-26ac75bd2e7d?w=400',
      ],
      eggs: [
        'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
        'https://images.unsplash.com/photo-1491524062933-cb0289f389f4?w=400',
      ],
      meat: [
        'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400',
        'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400',
      ],
      others: [
        'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400',
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      ],
    };

    const defaultImages = [
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400',
    ];

    // Build query for products without images
    const qb = this.productRepository
      .createQueryBuilder('product')
      .where("product.images IS NULL OR product.images = ''");

    if (category) {
      qb.andWhere('LOWER(product.category) = LOWER(:category)', { category });
    }

    const products = await qb.getMany();
    const updatedProducts: { id: string; title: string; images: string[] }[] = [];

    for (const product of products) {
      const categoryKey = (product.category || 'others').toLowerCase();
      const images = categoryImages[categoryKey] || defaultImages;
      
      // Use a random image from the category
      const selectedImage = images[Math.floor(Math.random() * images.length)];
      
      product.images = [selectedImage];
      await this.productRepository.save(product);
      
      updatedProducts.push({
        id: product.id,
        title: product.title,
        images: product.images,
      });
    }

    this.logger.log(`Bulk updated ${updatedProducts.length} products with placeholder images`);

    return {
      updated: updatedProducts.length,
      products: updatedProducts,
    };
  }

  /**
   * Update images for a specific product
   */
  async updateProductImages(productId: string, images: string[]): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    product.images = images;
    await this.productRepository.save(product);

    this.logger.log(`Updated images for product ${productId}`);
    return product;
  }

  /**
   * Get users for promotional email based on target audience
   */
  async getUsersForPromotionalEmail(
    targetAudience: 'all' | 'buyers' | 'farmers' | 'riders',
  ): Promise<Array<{ email: string; firstName?: string }>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select(['user.email', 'user.name'])
      .where('user.email IS NOT NULL')
      .andWhere('user.isActive = :isActive', { isActive: true });

    switch (targetAudience) {
      case 'buyers':
        queryBuilder.andWhere('user.role = :role', { role: UserRole.BUYER });
        break;
      case 'farmers':
        queryBuilder.andWhere('user.role = :role', { role: UserRole.FARMER });
        break;
      case 'riders':
        queryBuilder.andWhere('user.role = :role', { role: UserRole.RIDER });
        break;
      case 'all':
      default:
        // Include all active users with emails
        break;
    }

    const users = await queryBuilder.getMany();
    this.logger.log(`Found ${users.length} users for promotional email (audience: ${targetAudience})`);
    // Extract first name from full name (take first word)
    return users.map(u => ({ 
      email: u.email, 
      firstName: u.name?.split(' ')[0] 
    }));
  }

  /**
   * Log an audit action (simplified version for promotional emails)
   */
  async logAuditAction(
    adminId: string,
    action: string,
    category: string,
    description: string,
  ): Promise<void> {
    try {
      await this.createAuditLog({
        action: action as AuditAction,
        category: category as AuditCategory,
        adminId,
        description,
      });
    } catch (error) {
      this.logger.warn(`Failed to log audit action: ${error.message}`);
    }
  }
}
