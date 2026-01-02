import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Coupon, CouponUsage, CouponType, CouponStatus, CouponSource } from '../database/entities/coupon.entity';
import { Order } from '../database/entities/order.entity';
import { User } from '../database/entities/user.entity';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  message?: string;
}

export interface CartItem {
  productId: string;
  price: number;
  quantity: number;
  category?: string;
}

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private couponUsageRepository: Repository<CouponUsage>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(dto: CreateCouponDto): Promise<Coupon> {
    // Check if code already exists
    const existing = await this.couponRepository.findOne({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    const coupon = this.couponRepository.create({
      ...dto,
      code: dto.code.toUpperCase(),
    });

    return this.couponRepository.save(coupon);
  }

  async findAll(options?: {
    status?: CouponStatus;
    page?: number;
    limit?: number;
  }, type?: CouponType): Promise<{ coupons: Coupon[]; total: number }> {
    const query = this.couponRepository.createQueryBuilder('coupon');

    if (options?.status) {
      query.andWhere('coupon.status = :status', { status: options.status });
    }

    if (type) {
      query.andWhere('coupon.type = :type', { type });
    }

    const total = await query.getCount();

    query
      .orderBy('coupon.createdAt', 'DESC')
      .skip(((options?.page || 1) - 1) * (options?.limit || 20))
      .take(options?.limit || 20);

    const coupons = await query.getMany();

    return { coupons, total };
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.couponRepository.findOne({
      where: { code: code.toUpperCase() },
    });
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);

    if (dto.code && dto.code !== coupon.code) {
      const existing = await this.findByCode(dto.code);
      if (existing) {
        throw new BadRequestException('Coupon code already exists');
      }
      dto.code = dto.code.toUpperCase();
    }

    Object.assign(coupon, dto);
    return this.couponRepository.save(coupon);
  }

  async delete(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
  }

  async validateCoupon(
    code: string,
    userId: string,
    cartItems: CartItem[],
    subtotal: number,
  ): Promise<CouponValidationResult> {
    const coupon = await this.findByCode(code);

    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code' };
    }

    // Check status
    if (coupon.status !== CouponStatus.ACTIVE) {
      return { valid: false, message: 'This coupon is no longer active' };
    }

    // Check dates
    const now = new Date();
    if (now < new Date(coupon.startDate)) {
      return { valid: false, message: 'This coupon is not yet active' };
    }
    if (now > new Date(coupon.endDate)) {
      return { valid: false, message: 'This coupon has expired' };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, message: 'This coupon has reached its usage limit' };
    }

    // Check per-user usage
    const userUsageCount = await this.couponUsageRepository.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsageCount >= coupon.usageLimitPerUser) {
      return { valid: false, message: 'You have already used this coupon' };
    }

    // Check user-specific coupon
    if (coupon.userId && coupon.userId !== userId) {
      return { valid: false, message: 'This coupon is not valid for your account' };
    }

    // Check first order only
    if (coupon.firstOrderOnly) {
      const orderCount = await this.orderRepository.count({
        where: { buyerId: userId },
      });
      if (orderCount > 0) {
        return { valid: false, message: 'This coupon is only valid for first orders' };
      }
    }

    // Check new users only
    if (coupon.newUsersOnly) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        const daysSinceJoined = Math.floor(
          (now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceJoined > 30) {
          return { valid: false, message: 'This coupon is only for new users' };
        }
      }
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        message: `Minimum order amount is ₦${coupon.minOrderAmount.toLocaleString()}`,
      };
    }

    // Check applicable categories/products
    let applicableSubtotal = subtotal;
    if (coupon.applicableCategories?.length || coupon.applicableProductIds?.length) {
      applicableSubtotal = cartItems
        .filter((item) => {
          if (coupon.excludedProductIds?.includes(item.productId)) return false;
          if (coupon.applicableProductIds?.length) {
            return coupon.applicableProductIds.includes(item.productId);
          }
          if (coupon.applicableCategories?.length && item.category) {
            return coupon.applicableCategories.includes(item.category);
          }
          return true;
        })
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (applicableSubtotal === 0) {
        return { valid: false, message: 'This coupon is not applicable to items in your cart' };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discountAmount = (applicableSubtotal * coupon.value) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
        break;
      case CouponType.FIXED_AMOUNT:
        discountAmount = Math.min(coupon.value, applicableSubtotal);
        break;
      case CouponType.FREE_DELIVERY:
        discountAmount = 0; // Delivery fee handled separately
        break;
    }

    return {
      valid: true,
      coupon,
      discountAmount: Math.round(discountAmount * 100) / 100,
      message: 'Coupon applied successfully',
    };
  }

  async applyCoupon(
    couponId: string,
    userId: string,
    orderId: string,
    discountApplied: number,
  ): Promise<CouponUsage> {
    const coupon = await this.findOne(couponId);

    // Create usage record
    const usage = this.couponUsageRepository.create({
      couponId,
      userId,
      orderId,
      discountApplied,
    });
    await this.couponUsageRepository.save(usage);

    // Increment usage count
    coupon.usageCount += 1;
    await this.couponRepository.save(coupon);

    this.logger.log(`Coupon ${coupon.code} applied to order ${orderId}, discount: ₦${discountApplied}`);

    return usage;
  }

  async getAvailableCoupons(userId: string): Promise<Coupon[]> {
    const now = new Date();

    // Get public active coupons
    const coupons = await this.couponRepository.find({
      where: [
        {
          status: CouponStatus.ACTIVE,
          startDate: LessThanOrEqual(now),
          endDate: MoreThanOrEqual(now),
          userId: null as any,
        },
        {
          status: CouponStatus.ACTIVE,
          startDate: LessThanOrEqual(now),
          endDate: MoreThanOrEqual(now),
          userId,
        },
      ],
      order: { endDate: 'ASC' },
    });

    // Filter out coupons the user has already maxed out
    const userUsages = await this.couponUsageRepository.find({
      where: { userId, couponId: In(coupons.map(c => c.id)) },
    });

    const usageMap = new Map<string, number>();
    userUsages.forEach((u) => {
      usageMap.set(u.couponId, (usageMap.get(u.couponId) || 0) + 1);
    });

    return coupons.filter((coupon) => {
      const userUsage = usageMap.get(coupon.id) || 0;
      if (userUsage >= coupon.usageLimitPerUser) return false;
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return false;
      return true;
    });
  }

  async getUserCouponUsage(userId: string): Promise<CouponUsage[]> {
    return this.couponUsageRepository.find({
      where: { userId },
      relations: ['coupon'],
      order: { usedAt: 'DESC' },
    });
  }

  async getCouponUsage(couponId: string): Promise<{
    coupon: Coupon;
    usages: CouponUsage[];
    totalUsage: number;
    totalDiscount: number;
  }> {
    const coupon = await this.findOne(couponId);
    const usages = await this.couponUsageRepository.find({
      where: { couponId },
      relations: ['user'],
      order: { usedAt: 'DESC' },
      take: 100,
    });

    const totalDiscount = usages.reduce((sum, u) => sum + Number(u.discountApplied), 0);

    return {
      coupon,
      usages,
      totalUsage: coupon.usageCount,
      totalDiscount,
    };
  }

  // ==================== AUTO-GENERATED COUPONS ====================

  /**
   * Generate a unique coupon code
   */
  private generateCouponCode(prefix: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = prefix;
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create welcome coupon for new users (10% off first order)
   */
  async createWelcomeCoupon(userId: string): Promise<Coupon> {
    const code = this.generateCouponCode('WELCOME');
    
    // Check if user already has a welcome coupon
    const existing = await this.couponRepository.findOne({
      where: { userId, source: CouponSource.WELCOME },
    });
    
    if (existing) {
      this.logger.log(`User ${userId} already has welcome coupon: ${existing.code}`);
      return existing;
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Valid for 30 days

    const coupon = this.couponRepository.create({
      code,
      name: 'Welcome Discount',
      description: 'Welcome to Handwork! Enjoy 10% off your first order.',
      type: CouponType.PERCENTAGE,
      value: 10,
      minOrderAmount: 5000, // Minimum ₦5,000
      maxDiscountAmount: 5000, // Max ₦5,000 discount
      startDate: new Date(),
      endDate,
      usageLimit: 1,
      usageLimitPerUser: 1,
      firstOrderOnly: true,
      newUsersOnly: true,
      userId,
      source: CouponSource.WELCOME,
      status: CouponStatus.ACTIVE,
    });

    await this.couponRepository.save(coupon);
    this.logger.log(`Created welcome coupon ${code} for user ${userId}`);
    return coupon;
  }

  /**
   * Create referral coupon for user who referred someone
   */
  async createReferralCoupon(referrerId: string, referredUserName: string): Promise<Coupon> {
    const code = this.generateCouponCode('REF');
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60); // Valid for 60 days

    const coupon = this.couponRepository.create({
      code,
      name: 'Referral Reward',
      description: `Thanks for referring ${referredUserName}! Enjoy ₦500 off your next order.`,
      type: CouponType.FIXED_AMOUNT,
      value: 500,
      minOrderAmount: 3000, // Minimum ₦3,000
      startDate: new Date(),
      endDate,
      usageLimit: 1,
      usageLimitPerUser: 1,
      userId: referrerId,
      source: CouponSource.REFERRAL,
      status: CouponStatus.ACTIVE,
    });

    await this.couponRepository.save(coupon);
    this.logger.log(`Created referral coupon ${code} for referrer ${referrerId}`);
    return coupon;
  }

  /**
   * Create milestone coupon when user reaches order milestones
   */
  async createMilestoneCoupon(userId: string, orderCount: number): Promise<Coupon | null> {
    // Define milestone rewards
    const milestones: Record<number, { discount: number; type: CouponType; name: string }> = {
      5: { discount: 500, type: CouponType.FIXED_AMOUNT, name: '5th Order Reward' },
      10: { discount: 15, type: CouponType.PERCENTAGE, name: '10th Order Reward' },
      25: { discount: 2000, type: CouponType.FIXED_AMOUNT, name: '25th Order Reward' },
      50: { discount: 20, type: CouponType.PERCENTAGE, name: '50th Order Reward' },
      100: { discount: 5000, type: CouponType.FIXED_AMOUNT, name: '100th Order Reward' },
    };

    const milestone = milestones[orderCount];
    if (!milestone) return null;

    // Check if user already received this milestone coupon
    const existingCount = await this.couponRepository.count({
      where: { 
        userId, 
        source: CouponSource.MILESTONE,
        name: milestone.name,
      },
    });

    if (existingCount > 0) {
      this.logger.log(`User ${userId} already received ${milestone.name} coupon`);
      return null;
    }

    const code = this.generateCouponCode('MILE');
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90); // Valid for 90 days

    const coupon = this.couponRepository.create({
      code,
      name: milestone.name,
      description: `Congratulations on ${orderCount} orders! Here's a special reward.`,
      type: milestone.type,
      value: milestone.discount,
      minOrderAmount: 3000,
      maxDiscountAmount: milestone.type === CouponType.PERCENTAGE ? 3000 : undefined,
      startDate: new Date(),
      endDate,
      usageLimit: 1,
      usageLimitPerUser: 1,
      userId,
      source: CouponSource.MILESTONE,
      status: CouponStatus.ACTIVE,
    });

    await this.couponRepository.save(coupon);
    this.logger.log(`Created milestone coupon ${code} for user ${userId} (${orderCount} orders)`);
    return coupon;
  }

  /**
   * Check and create milestone coupon after order completion
   */
  async checkAndCreateMilestoneCoupon(userId: string): Promise<Coupon | null> {
    const orderCount = await this.orderRepository.count({
      where: { buyerId: userId, status: In(['delivered', 'completed']) },
    });
    
    return this.createMilestoneCoupon(userId, orderCount);
  }
}
