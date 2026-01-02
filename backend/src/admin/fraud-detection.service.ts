import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  FraudAlert,
  FraudType,
  FraudSeverity,
  FraudAlertStatus,
} from '../database/entities/fraud-alert.entity';
import { User, Order, Payment, Review, WalletTransaction } from '../database/entities';
import { CouponUsage } from '../database/entities/coupon.entity';
import { PaymentStatus } from '../common/enums';

export interface FraudStats {
  totalAlerts: number;
  openAlerts: number;
  investigatingAlerts: number;
  confirmedFraud: number;
  falsePositives: number;
  resolvedAlerts: number;
  alertsByType: { type: string; count: number }[];
  alertsBySeverity: { severity: string; count: number }[];
  recentAlerts: FraudAlert[];
  riskTrend: { date: string; count: number; severity: string }[];
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  type: FraudType;
  enabled: boolean;
  threshold: number;
  severity: FraudSeverity;
  conditions: any;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  // Configurable fraud detection rules
  private fraudRules: FraudRule[] = [
    {
      id: 'multiple_accounts_same_device',
      name: 'Multiple Accounts Same Device',
      description: 'Detect multiple accounts from same device fingerprint',
      type: FraudType.MULTIPLE_ACCOUNTS,
      enabled: true,
      threshold: 3,
      severity: FraudSeverity.HIGH,
      conditions: { maxAccountsPerDevice: 3 },
    },
    {
      id: 'unusual_transaction_amount',
      name: 'Unusual Transaction Amount',
      description: 'Detect transactions significantly higher than user average',
      type: FraudType.UNUSUAL_TRANSACTION,
      enabled: true,
      threshold: 5, // 5x user average
      severity: FraudSeverity.MEDIUM,
      conditions: { multiplierThreshold: 5 },
    },
    {
      id: 'velocity_abuse',
      name: 'Order Velocity Abuse',
      description: 'Detect unusually high number of orders in short time',
      type: FraudType.VELOCITY_ABUSE,
      enabled: true,
      threshold: 10, // 10 orders per hour
      severity: FraudSeverity.MEDIUM,
      conditions: { maxOrdersPerHour: 10 },
    },
    {
      id: 'fake_reviews_pattern',
      name: 'Fake Reviews Pattern',
      description: 'Detect suspicious review patterns',
      type: FraudType.FAKE_REVIEWS,
      enabled: true,
      threshold: 5,
      severity: FraudSeverity.MEDIUM,
      conditions: { maxReviewsPerDay: 5, minTimeBetweenReviews: 60 },
    },
    {
      id: 'promo_abuse',
      name: 'Promo Code Abuse',
      description: 'Detect excessive promo code usage',
      type: FraudType.PROMO_ABUSE,
      enabled: true,
      threshold: 5,
      severity: FraudSeverity.LOW,
      conditions: { maxPromoUsagePerDay: 5 },
    },
    {
      id: 'refund_abuse',
      name: 'Refund Abuse',
      description: 'Detect excessive refund requests',
      type: FraudType.REFUND_ABUSE,
      enabled: true,
      threshold: 30, // 30% refund rate
      severity: FraudSeverity.HIGH,
      conditions: { refundRateThreshold: 30 },
    },
  ];

  constructor(
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepository: Repository<FraudAlert>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
  ) {}

  /**
   * Get fraud detection dashboard stats
   */
  async getFraudStats(startDate?: Date, endDate?: Date): Promise<FraudStats> {
    const dateFilter = startDate && endDate
      ? { createdAt: Between(startDate, endDate) }
      : {};

    const [
      totalAlerts,
      openAlerts,
      investigatingAlerts,
      confirmedFraud,
      falsePositives,
      resolvedAlerts,
      alertsByType,
      alertsBySeverity,
      recentAlerts,
      riskTrend,
    ] = await Promise.all([
      this.fraudAlertRepository.count({ where: dateFilter }),
      this.fraudAlertRepository.count({ where: { ...dateFilter, status: FraudAlertStatus.OPEN } }),
      this.fraudAlertRepository.count({ where: { ...dateFilter, status: FraudAlertStatus.INVESTIGATING } }),
      this.fraudAlertRepository.count({ where: { ...dateFilter, status: FraudAlertStatus.CONFIRMED } }),
      this.fraudAlertRepository.count({ where: { ...dateFilter, status: FraudAlertStatus.FALSE_POSITIVE } }),
      this.fraudAlertRepository.count({ where: { ...dateFilter, status: FraudAlertStatus.RESOLVED } }),
      this.getAlertsByType(startDate, endDate),
      this.getAlertsBySeverity(startDate, endDate),
      this.fraudAlertRepository.find({
        where: dateFilter,
        relations: ['user', 'assignedTo'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.getRiskTrend(startDate, endDate),
    ]);

    return {
      totalAlerts,
      openAlerts,
      investigatingAlerts,
      confirmedFraud,
      falsePositives,
      resolvedAlerts,
      alertsByType,
      alertsBySeverity,
      recentAlerts,
      riskTrend,
    };
  }

  private async getAlertsByType(startDate?: Date, endDate?: Date) {
    const query = this.fraudAlertRepository
      .createQueryBuilder('alert')
      .select('alert.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.type');

    if (startDate && endDate) {
      query.where('alert.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return query.getRawMany();
  }

  private async getAlertsBySeverity(startDate?: Date, endDate?: Date) {
    const query = this.fraudAlertRepository
      .createQueryBuilder('alert')
      .select('alert.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.severity');

    if (startDate && endDate) {
      query.where('alert.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return query.getRawMany();
  }

  private async getRiskTrend(startDate?: Date, endDate?: Date) {
    const query = this.fraudAlertRepository
      .createQueryBuilder('alert')
      .select("DATE(alert.createdAt)", 'date')
      .addSelect('alert.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy("DATE(alert.createdAt)")
      .addGroupBy('alert.severity')
      .orderBy('date', 'ASC');

    if (startDate && endDate) {
      query.where('alert.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return query.getRawMany();
  }

  /**
   * Get all fraud alerts with filters
   */
  async getAlerts(
    page: number = 1,
    limit: number = 20,
    status?: FraudAlertStatus,
    type?: FraudType,
    severity?: FraudSeverity,
    userId?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;

    const [alerts, total] = await this.fraudAlertRepository.findAndCount({
      where,
      relations: ['user', 'assignedTo', 'resolvedBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      alerts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single fraud alert
   */
  async getAlert(id: string): Promise<FraudAlert> {
    const alert = await this.fraudAlertRepository.findOne({
      where: { id },
      relations: ['user', 'assignedTo', 'resolvedBy'],
    });

    if (!alert) {
      throw new NotFoundException('Fraud alert not found');
    }

    return alert;
  }

  /**
   * Create a fraud alert manually
   */
  async createAlert(data: {
    userId?: string;
    type: FraudType;
    severity: FraudSeverity;
    title: string;
    description: string;
    metadata?: any;
    riskScore?: number;
  }): Promise<FraudAlert> {
    const alert = this.fraudAlertRepository.create({
      ...data,
      autoDetected: false,
    });

    return this.fraudAlertRepository.save(alert);
  }

  /**
   * Update fraud alert status
   */
  async updateAlertStatus(
    id: string,
    status: FraudAlertStatus,
    adminId: string,
    resolution?: string,
  ): Promise<FraudAlert> {
    const alert = await this.getAlert(id);
    const admin = await this.userRepository.findOne({ where: { id: adminId } });

    alert.status = status;

    if (status === FraudAlertStatus.RESOLVED || status === FraudAlertStatus.CONFIRMED || status === FraudAlertStatus.FALSE_POSITIVE) {
      alert.resolvedById = adminId;
      alert.resolvedAt = new Date();
      if (resolution) alert.resolution = resolution;
    }

    alert.notes.push({
      authorId: adminId,
      authorName: admin?.fullName || 'Admin',
      content: `Status changed to ${status}${resolution ? `: ${resolution}` : ''}`,
      createdAt: new Date(),
    });

    return this.fraudAlertRepository.save(alert);
  }

  /**
   * Assign alert to admin
   */
  async assignAlert(id: string, assigneeId: string, adminId: string): Promise<FraudAlert> {
    const alert = await this.getAlert(id);
    const admin = await this.userRepository.findOne({ where: { id: adminId } });
    const assignee = await this.userRepository.findOne({ where: { id: assigneeId } });

    alert.assignedToId = assigneeId;
    alert.status = FraudAlertStatus.INVESTIGATING;

    alert.notes.push({
      authorId: adminId,
      authorName: admin?.fullName || 'Admin',
      content: `Assigned to ${assignee?.fullName || 'team member'}`,
      createdAt: new Date(),
    });

    return this.fraudAlertRepository.save(alert);
  }

  /**
   * Add note to alert
   */
  async addNote(id: string, adminId: string, content: string): Promise<FraudAlert> {
    const alert = await this.getAlert(id);
    const admin = await this.userRepository.findOne({ where: { id: adminId } });

    alert.notes.push({
      authorId: adminId,
      authorName: admin?.fullName || 'Admin',
      content,
      createdAt: new Date(),
    });

    return this.fraudAlertRepository.save(alert);
  }

  /**
   * Block user from fraud alert
   */
  async blockUser(alertId: string, adminId: string): Promise<FraudAlert> {
    const alert = await this.getAlert(alertId);
    
    if (alert.userId) {
      await this.userRepository.update(alert.userId, { 
        isActive: false,
      });
      
      alert.userBlocked = true;
      alert.notes.push({
        authorId: adminId,
        authorName: 'Admin',
        content: 'User account has been blocked',
        createdAt: new Date(),
      });
    }

    return this.fraudAlertRepository.save(alert);
  }

  /**
   * Run fraud detection scan
   */
  @Cron(CronExpression.EVERY_HOUR)
  async runFraudDetection(): Promise<void> {
    this.logger.log('Running fraud detection scan...');

    try {
      await Promise.all([
        this.detectVelocityAbuse(),
        this.detectUnusualTransactions(),
        this.detectRefundAbuse(),
        this.detectPromoAbuse(),
        this.detectFakeReviews(),
      ]);

      this.logger.log('Fraud detection scan completed');
    } catch (error) {
      this.logger.error('Fraud detection scan failed', error);
    }
  }

  /**
   * Detect velocity abuse - too many orders in short time
   */
  private async detectVelocityAbuse(): Promise<void> {
    const rule = this.fraudRules.find(r => r.id === 'velocity_abuse');
    if (!rule?.enabled) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const suspiciousUsers = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.buyerId', 'userId')
      .addSelect('COUNT(*)', 'orderCount')
      .where('order.createdAt >= :oneHourAgo', { oneHourAgo })
      .groupBy('order.buyerId')
      .having('COUNT(*) >= :threshold', { threshold: rule.threshold })
      .getRawMany();

    for (const { userId, orderCount } of suspiciousUsers) {
      // Check if alert already exists
      const existingAlert = await this.fraudAlertRepository.findOne({
        where: {
          userId,
          type: FraudType.VELOCITY_ABUSE,
          status: In([FraudAlertStatus.OPEN, FraudAlertStatus.INVESTIGATING]),
        },
      });

      if (!existingAlert) {
        await this.createAutoAlert({
          userId,
          type: FraudType.VELOCITY_ABUSE,
          severity: rule.severity,
          title: 'High Order Velocity Detected',
          description: `User placed ${orderCount} orders in the last hour (threshold: ${rule.threshold})`,
          riskScore: Math.min((orderCount / rule.threshold) * 50, 100),
          metadata: { orderCount, threshold: rule.threshold },
        });
      }
    }
  }

  /**
   * Detect unusual transaction amounts
   */
  private async detectUnusualTransactions(): Promise<void> {
    const rule = this.fraudRules.find(r => r.id === 'unusual_transaction_amount');
    if (!rule?.enabled) return;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get recent high-value transactions
    const recentTransactions = await this.paymentRepository.find({
      where: {
        createdAt: MoreThanOrEqual(oneDayAgo),
        status: PaymentStatus.COMPLETED,
      },
      relations: ['order'],
    });

    for (const transaction of recentTransactions) {
      if (!transaction.order?.buyerId) continue;

      // Get user's average transaction
      const avgResult = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('AVG(payment.amount)', 'avg')
        .innerJoin('payment.order', 'order')
        .where('order.buyerId = :userId', { userId: transaction.order.buyerId })
        .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('payment.id != :currentId', { currentId: transaction.id })
        .getRawOne();

      const avgAmount = parseFloat(avgResult?.avg || '0');
      
      if (avgAmount > 0 && transaction.amount > avgAmount * rule.threshold) {
        const existingAlert = await this.fraudAlertRepository.findOne({
          where: {
            userId: transaction.order.buyerId,
            type: FraudType.UNUSUAL_TRANSACTION,
            status: In([FraudAlertStatus.OPEN, FraudAlertStatus.INVESTIGATING]),
          },
        });

        if (!existingAlert) {
          await this.createAutoAlert({
            userId: transaction.order.buyerId,
            type: FraudType.UNUSUAL_TRANSACTION,
            severity: rule.severity,
            title: 'Unusual Transaction Amount',
            description: `Transaction of ₦${transaction.amount.toLocaleString()} is ${(transaction.amount / avgAmount).toFixed(1)}x higher than user average (₦${avgAmount.toLocaleString()})`,
            riskScore: Math.min((transaction.amount / avgAmount) * 20, 100),
            metadata: {
              transactionId: transaction.id,
              amount: transaction.amount,
              userAverage: avgAmount,
              multiplier: transaction.amount / avgAmount,
            },
          });
        }
      }
    }
  }

  /**
   * Detect refund abuse
   */
  private async detectRefundAbuse(): Promise<void> {
    const rule = this.fraudRules.find(r => r.id === 'refund_abuse');
    if (!rule?.enabled) return;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get users with high refund rates
    const refundStats = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.buyerId', 'userId')
      .addSelect('COUNT(*)', 'totalOrders')
      .addSelect("SUM(CASE WHEN order.status = 'cancelled' OR order.status = 'refunded' THEN 1 ELSE 0 END)", 'refundedOrders')
      .where('order.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('order.buyerId')
      .having('COUNT(*) >= 5')
      .getRawMany();

    for (const { userId, totalOrders, refundedOrders } of refundStats) {
      const refundRate = (refundedOrders / totalOrders) * 100;

      if (refundRate >= rule.threshold) {
        const existingAlert = await this.fraudAlertRepository.findOne({
          where: {
            userId,
            type: FraudType.REFUND_ABUSE,
            status: In([FraudAlertStatus.OPEN, FraudAlertStatus.INVESTIGATING]),
          },
        });

        if (!existingAlert) {
          await this.createAutoAlert({
            userId,
            type: FraudType.REFUND_ABUSE,
            severity: rule.severity,
            title: 'High Refund Rate Detected',
            description: `User has ${refundRate.toFixed(1)}% refund rate (${refundedOrders}/${totalOrders} orders) in the last 30 days`,
            riskScore: Math.min(refundRate, 100),
            metadata: { totalOrders, refundedOrders, refundRate },
          });
        }
      }
    }
  }

  /**
   * Detect promo code abuse
   */
  private async detectPromoAbuse(): Promise<void> {
    const rule = this.fraudRules.find(r => r.id === 'promo_abuse');
    if (!rule?.enabled) return;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const promoUsage = await this.couponUsageRepository
      .createQueryBuilder('usage')
      .select('usage.userId', 'userId')
      .addSelect('COUNT(*)', 'usageCount')
      .where('usage.usedAt >= :oneDayAgo', { oneDayAgo })
      .groupBy('usage.userId')
      .having('COUNT(*) >= :threshold', { threshold: rule.threshold })
      .getRawMany();

    for (const { userId, usageCount } of promoUsage) {
      const existingAlert = await this.fraudAlertRepository.findOne({
        where: {
          userId,
          type: FraudType.PROMO_ABUSE,
          status: In([FraudAlertStatus.OPEN, FraudAlertStatus.INVESTIGATING]),
        },
      });

      if (!existingAlert) {
        await this.createAutoAlert({
          userId,
          type: FraudType.PROMO_ABUSE,
          severity: rule.severity,
          title: 'Excessive Promo Code Usage',
          description: `User used ${usageCount} promo codes in the last 24 hours (threshold: ${rule.threshold})`,
          riskScore: Math.min((usageCount / rule.threshold) * 40, 100),
          metadata: { usageCount, threshold: rule.threshold },
        });
      }
    }
  }

  /**
   * Detect fake reviews
   */
  private async detectFakeReviews(): Promise<void> {
    const rule = this.fraudRules.find(r => r.id === 'fake_reviews_pattern');
    if (!rule?.enabled) return;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Users with many reviews in short time
    const suspiciousReviewers = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.userId', 'userId')
      .addSelect('COUNT(*)', 'reviewCount')
      .where('review.createdAt >= :oneDayAgo', { oneDayAgo })
      .groupBy('review.userId')
      .having('COUNT(*) >= :threshold', { threshold: rule.threshold })
      .getRawMany();

    for (const { userId, reviewCount } of suspiciousReviewers) {
      const existingAlert = await this.fraudAlertRepository.findOne({
        where: {
          userId,
          type: FraudType.FAKE_REVIEWS,
          status: In([FraudAlertStatus.OPEN, FraudAlertStatus.INVESTIGATING]),
        },
      });

      if (!existingAlert) {
        await this.createAutoAlert({
          userId,
          type: FraudType.FAKE_REVIEWS,
          severity: rule.severity,
          title: 'Suspicious Review Pattern',
          description: `User posted ${reviewCount} reviews in the last 24 hours (threshold: ${rule.threshold})`,
          riskScore: Math.min((reviewCount / rule.threshold) * 40, 100),
          metadata: { reviewCount, threshold: rule.threshold },
        });
      }
    }
  }

  /**
   * Create auto-detected alert
   */
  private async createAutoAlert(data: {
    userId: string;
    type: FraudType;
    severity: FraudSeverity;
    title: string;
    description: string;
    riskScore: number;
    metadata?: any;
  }): Promise<FraudAlert> {
    const alert = this.fraudAlertRepository.create({
      ...data,
      autoDetected: true,
    });

    this.logger.log(`Auto-detected fraud: ${data.type} for user ${data.userId}`);

    return this.fraudAlertRepository.save(alert);
  }

  /**
   * Get fraud rules
   */
  getFraudRules(): FraudRule[] {
    return this.fraudRules;
  }

  /**
   * Update fraud rule
   */
  updateFraudRule(ruleId: string, updates: Partial<FraudRule>): FraudRule {
    const ruleIndex = this.fraudRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      throw new NotFoundException('Fraud rule not found');
    }

    this.fraudRules[ruleIndex] = { ...this.fraudRules[ruleIndex], ...updates };
    return this.fraudRules[ruleIndex];
  }

  /**
   * Get user risk profile
   */
  async getUserRiskProfile(userId: string) {
    const [
      user,
      alertCount,
      confirmedFraudCount,
      orderStats,
      recentAlerts,
    ] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.fraudAlertRepository.count({ where: { userId } }),
      this.fraudAlertRepository.count({ 
        where: { userId, status: FraudAlertStatus.CONFIRMED } 
      }),
      this.orderRepository
        .createQueryBuilder('order')
        .select('COUNT(*)', 'totalOrders')
        .addSelect("SUM(CASE WHEN order.status = 'cancelled' THEN 1 ELSE 0 END)", 'cancelledOrders')
        .where('order.buyerId = :userId', { userId })
        .getRawOne(),
      this.fraudAlertRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    // Calculate risk score
    let riskScore = 0;
    riskScore += confirmedFraudCount * 30;
    riskScore += alertCount * 5;

    const cancelRate = orderStats?.totalOrders > 0 
      ? (orderStats.cancelledOrders / orderStats.totalOrders) * 100 
      : 0;
    riskScore += Math.min(cancelRate, 30);

    return {
      user,
      riskScore: Math.min(riskScore, 100),
      riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
      alertCount,
      confirmedFraudCount,
      orderStats,
      recentAlerts,
    };
  }
}
