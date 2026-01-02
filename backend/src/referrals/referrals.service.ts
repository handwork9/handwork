import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Referral, ReferralStatus } from '../database/entities/referral.entity';
import { User } from '../database/entities/user.entity';
import { CreateReferralInviteDto } from './dto';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';

@Injectable()
export class ReferralsService {
  private readonly REFERRAL_REWARD = 500; // ₦500 reward
  private readonly REFERRAL_EXPIRY_DAYS = 30;

  constructor(
    @InjectRepository(Referral)
    private referralsRepository: Repository<Referral>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => CouponsService))
    private couponsService: CouponsService,
    private notificationsService: NotificationsService,
  ) {}

  // Generate unique referral code for user
  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.referralCode) return user.referralCode;

    // Generate code: First 4 chars of name + random 6 chars
    const namePrefix = user.name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${namePrefix}${randomSuffix}`;

    // Ensure uniqueness
    const existing = await this.usersRepository.findOne({ where: { referralCode: code } });
    if (existing) {
      return this.generateReferralCode(userId); // Retry
    }

    await this.usersRepository.update(userId, { referralCode: code });
    return code;
  }

  // Get user's referral code
  async getReferralCode(userId: string): Promise<{ code: string; totalEarned: number; referralCount: number }> {
    let user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.referralCode) {
      const code = await this.generateReferralCode(userId);
      user = await this.usersRepository.findOne({ where: { id: userId } });
    }

    return {
      code: user!.referralCode,
      totalEarned: Number(user!.referralEarnings) || 0,
      referralCount: user!.referralCount || 0,
    };
  }

  // Get referral stats
  async getStats(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const [referrals, total] = await this.referralsRepository.findAndCount({
      where: { referrerId: userId },
    });

    const pending = referrals.filter(r => r.status === ReferralStatus.PENDING).length;
    const joined = referrals.filter(r => r.status === ReferralStatus.JOINED).length;
    const completed = referrals.filter(r => r.status === ReferralStatus.COMPLETED).length;
    const expired = referrals.filter(r => r.status === ReferralStatus.EXPIRED).length;

    return {
      total,
      pending,
      joined,
      completed,
      expired,
      totalEarned: Number(user.referralEarnings) || 0,
    };
  }

  // Get referral history
  async getHistory(userId: string, status?: ReferralStatus) {
    const where: any = { referrerId: userId };
    if (status) where.status = status;

    const referrals = await this.referralsRepository.find({
      where,
      relations: ['referredUser'],
      order: { createdAt: 'DESC' },
    });

    return referrals.map(r => ({
      id: r.id,
      name: r.referredUser?.name || r.referredName || 'Unknown',
      phone: r.referredUser?.phone || r.referredPhone,
      status: r.status,
      rewardAmount: Number(r.rewardAmount),
      invitedDate: r.createdAt,
      joinedDate: r.joinedAt,
      completedDate: r.completedAt,
    }));
  }

  // Get single referral detail
  async getReferralDetail(userId: string, referralId: string) {
    const referral = await this.referralsRepository.findOne({
      where: { id: referralId, referrerId: userId },
      relations: ['referredUser'],
    });

    if (!referral) throw new NotFoundException('Referral not found');

    return {
      id: referral.id,
      name: referral.referredUser?.name || referral.referredName || 'Unknown',
      phone: referral.referredUser?.phone || referral.referredPhone,
      status: referral.status,
      rewardAmount: Number(referral.rewardAmount),
      invitedDate: referral.createdAt,
      joinedDate: referral.joinedAt,
      completedDate: referral.completedAt,
      expiresAt: referral.expiresAt,
      referrerRewarded: referral.referrerRewarded,
      referredRewarded: referral.referredRewarded,
    };
  }

  // Create a pending referral invite (when user shares code)
  async createInvite(userId: string, dto: CreateReferralInviteDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if phone already invited
    if (dto.phone) {
      const existing = await this.referralsRepository.findOne({
        where: { referrerId: userId, referredPhone: dto.phone },
      });
      if (existing) {
        throw new BadRequestException('This phone number has already been invited');
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFERRAL_EXPIRY_DAYS);

    const referral = this.referralsRepository.create({
      referrerId: userId,
      referredName: dto.name,
      referredPhone: dto.phone,
      status: ReferralStatus.PENDING,
      expiresAt,
    });

    await this.referralsRepository.save(referral);
    return referral;
  }

  // Apply referral code during signup
  async applyReferralCode(newUserId: string, code: string) {
    const referrer = await this.usersRepository.findOne({ where: { referralCode: code } });
    if (!referrer) throw new BadRequestException('Invalid referral code');

    const newUser = await this.usersRepository.findOne({ where: { id: newUserId } });
    if (!newUser) throw new NotFoundException('User not found');

    if (referrer.id === newUserId) {
      throw new BadRequestException('You cannot use your own referral code');
    }

    if (newUser.referredByCode) {
      throw new BadRequestException('Referral code has already been applied');
    }

    // Update new user with referral code
    await this.usersRepository.update(newUserId, { referredByCode: code });

    // Check if there's a pending referral by phone
    let referral = await this.referralsRepository.findOne({
      where: { referrerId: referrer.id, referredPhone: newUser.phone, status: ReferralStatus.PENDING },
    });

    if (referral) {
      // Update existing pending referral
      referral.referredUserId = newUserId;
      referral.status = ReferralStatus.JOINED;
      referral.joinedAt = new Date();
    } else {
      // Create new referral
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.REFERRAL_EXPIRY_DAYS);

      referral = this.referralsRepository.create({
        referrerId: referrer.id,
        referredUserId: newUserId,
        referredName: newUser.name,
        referredPhone: newUser.phone,
        status: ReferralStatus.JOINED,
        joinedAt: new Date(),
        expiresAt,
      });
    }

    await this.referralsRepository.save(referral);

    // Update referrer's count
    await this.usersRepository.increment({ id: referrer.id }, 'referralCount', 1);

    return { success: true, message: 'Referral code applied successfully' };
  }

  // Complete referral (called when referred user makes first order)
  async completeReferral(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.referredByCode) return;

    const referral = await this.referralsRepository.findOne({
      where: { referredUserId: userId, status: ReferralStatus.JOINED },
    });

    if (!referral) return;

    // Mark as completed
    referral.status = ReferralStatus.COMPLETED;
    referral.completedAt = new Date();
    referral.rewardAmount = this.REFERRAL_REWARD;
    referral.referrerRewarded = true;
    referral.referredRewarded = true;

    await this.referralsRepository.save(referral);

    // Credit both users
    await this.usersRepository.increment({ id: referral.referrerId }, 'walletBalance', this.REFERRAL_REWARD);
    await this.usersRepository.increment({ id: referral.referrerId }, 'referralEarnings', this.REFERRAL_REWARD);
    await this.usersRepository.increment({ id: userId }, 'walletBalance', this.REFERRAL_REWARD);

    // Create referral coupon for the referrer
    try {
      const coupon = await this.couponsService.createReferralCoupon(referral.referrerId, user.name);
      // Notify referrer about the coupon
      await this.notificationsService.sendPushNotification({
        userId: referral.referrerId,
        type: NotificationType.GENERAL,
        title: '🎉 Referral Reward!',
        body: `${user.name} made their first order! You earned ₦${this.REFERRAL_REWARD} + a ₦500 coupon (${coupon.code})`,
        data: { couponCode: coupon.code },
      });
    } catch (err) {
      console.error('Failed to create referral coupon:', err);
    }

    return { referrerId: referral.referrerId, referredUserId: userId, reward: this.REFERRAL_REWARD };
  }

  // Expire old pending referrals (cron job)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expirePendingReferrals() {
    const now = new Date();
    await this.referralsRepository.update(
      {
        status: ReferralStatus.PENDING,
        expiresAt: LessThan(now),
      },
      { status: ReferralStatus.EXPIRED },
    );
  }

  // Admin: Get all referrals
  async getAllReferrals(params: {
    page?: number;
    limit?: number;
    status?: ReferralStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, status, search, startDate, endDate } = params;

    const queryBuilder = this.referralsRepository
      .createQueryBuilder('referral')
      .leftJoinAndSelect('referral.referrer', 'referrer')
      .leftJoinAndSelect('referral.referredUser', 'referredUser');

    if (status) {
      queryBuilder.andWhere('referral.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(referrer.name ILIKE :search OR referrer.email ILIKE :search OR referredUser.name ILIKE :search OR referral.referredName ILIKE :search OR referral.referredPhone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (startDate) {
      queryBuilder.andWhere('referral.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      queryBuilder.andWhere('referral.createdAt <= :endDate', { endDate: new Date(endDate) });
    }

    queryBuilder.orderBy('referral.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [referrals, total] = await queryBuilder.getManyAndCount();

    return {
      data: referrals.map(r => ({
        id: r.id,
        referrer: { 
          id: r.referrer?.id, 
          name: r.referrer?.name, 
          email: r.referrer?.email 
        },
        referredUser: r.referredUser ? { 
          id: r.referredUser.id, 
          name: r.referredUser.name, 
          email: r.referredUser.email 
        } : null,
        referredName: r.referredName,
        referredPhone: r.referredPhone,
        status: r.status,
        referrerReward: Number(r.rewardAmount),
        referredReward: Number(r.rewardAmount),
        completedAt: r.completedAt,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Admin: Get referral stats overview
  async getAdminStats() {
    const totalReferrals = await this.referralsRepository.count();
    const pendingReferrals = await this.referralsRepository.count({ where: { status: ReferralStatus.PENDING } });
    const joinedReferrals = await this.referralsRepository.count({ where: { status: ReferralStatus.JOINED } });
    const completedReferrals = await this.referralsRepository.count({ where: { status: ReferralStatus.COMPLETED } });
    const expiredReferrals = await this.referralsRepository.count({ where: { status: ReferralStatus.EXPIRED } });

    const totalRewardsResult = await this.referralsRepository
      .createQueryBuilder('referral')
      .select('SUM(referral.rewardAmount * 2)', 'total') // x2 for both referrer and referred
      .where('referral.status = :status', { status: ReferralStatus.COMPLETED })
      .getRawOne();

    return {
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      joinedReferrals,
      expiredReferrals,
      totalRewardsGiven: Number(totalRewardsResult?.total) || 0,
    };
  }
}
