import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { User, PlatformRevenue, RevenueType, RevenueStatus } from '../database/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, IsNull, Not, MoreThan, LessThan } from 'typeorm';
import { BUYER_PREMIUM_PRICING } from '../users/users.service';

@ApiTags('Admin - Buyer Premium')
@ApiBearerAuth()
@Controller('admin/buyer-premium')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class AdminBuyerPremiumController {
  private readonly logger = new Logger(AdminBuyerPremiumController.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PlatformRevenue)
    private platformRevenueRepository: Repository<PlatformRevenue>,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get buyer premium statistics' })
  async getStats() {
    const now = new Date();
    
    // Total premium buyers (currently active)
    const totalPremium = await this.userRepository.count({
      where: {
        role: UserRole.BUYER,
        isPremium: true,
        premiumExpiresAt: MoreThan(now),
      },
    });

    // By tier
    const basicCount = await this.userRepository.count({
      where: {
        role: UserRole.BUYER,
        isPremium: true,
        premiumTier: 'basic',
        premiumExpiresAt: MoreThan(now),
      },
    });

    const goldCount = await this.userRepository.count({
      where: {
        role: UserRole.BUYER,
        isPremium: true,
        premiumTier: 'gold',
        premiumExpiresAt: MoreThan(now),
      },
    });

    const platinumCount = await this.userRepository.count({
      where: {
        role: UserRole.BUYER,
        isPremium: true,
        premiumTier: 'platinum',
        premiumExpiresAt: MoreThan(now),
      },
    });

    // Expiring soon (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringSoon = await this.userRepository.count({
      where: {
        role: UserRole.BUYER,
        isPremium: true,
        premiumExpiresAt: Between(now, sevenDaysFromNow),
      },
    });

    // Expired (was premium but expired)
    const expired = await this.userRepository.count({
      where: {
        role: UserRole.BUYER,
        isPremium: true,
        premiumExpiresAt: LessThan(now),
      },
    });

    // Total revenue from buyer premium
    const revenueResult = await this.platformRevenueRepository
      .createQueryBuilder('revenue')
      .select('SUM(revenue.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('revenue.type = :type', { type: RevenueType.SUBSCRIPTION })
      .andWhere("revenue.metadata->>'premiumType' = 'buyer'")
      .getRawOne();

    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayRevenue = await this.platformRevenueRepository
      .createQueryBuilder('revenue')
      .select('SUM(revenue.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('revenue.type = :type', { type: RevenueType.SUBSCRIPTION })
      .andWhere("revenue.metadata->>'premiumType' = 'buyer'")
      .andWhere('revenue.createdAt BETWEEN :start AND :end', { start: today, end: todayEnd })
      .getRawOne();

    // This month's revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthRevenue = await this.platformRevenueRepository
      .createQueryBuilder('revenue')
      .select('SUM(revenue.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('revenue.type = :type', { type: RevenueType.SUBSCRIPTION })
      .andWhere("revenue.metadata->>'premiumType' = 'buyer'")
      .andWhere('revenue.createdAt BETWEEN :start AND :end', { start: monthStart, end: todayEnd })
      .getRawOne();

    return {
      totalPremium,
      byTier: {
        basic: basicCount,
        gold: goldCount,
        platinum: platinumCount,
      },
      expiringSoon,
      expired,
      revenue: {
        total: Number(revenueResult?.total || 0),
        totalCount: Number(revenueResult?.count || 0),
        today: Number(todayRevenue?.total || 0),
        todayCount: Number(todayRevenue?.count || 0),
        thisMonth: Number(monthRevenue?.total || 0),
        thisMonthCount: Number(monthRevenue?.count || 0),
      },
      pricing: BUYER_PREMIUM_PRICING,
    };
  }

  @Get('subscribers')
  @ApiOperation({ summary: 'Get all premium buyers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tier', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String, enum: ['active', 'expiring', 'expired'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getSubscribers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('tier') tier?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.BUYER })
      .andWhere('user.isPremium = true')
      .orderBy('user.premiumExpiresAt', 'DESC');

    // Filter by tier
    if (tier) {
      queryBuilder.andWhere('user.premiumTier = :tier', { tier });
    }

    // Filter by status
    if (status === 'active') {
      queryBuilder.andWhere('user.premiumExpiresAt > :now', { now });
    } else if (status === 'expiring') {
      queryBuilder.andWhere('user.premiumExpiresAt BETWEEN :now AND :soon', { now, soon: sevenDaysFromNow });
    } else if (status === 'expired') {
      queryBuilder.andWhere('user.premiumExpiresAt < :now', { now });
    }

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const total = await queryBuilder.getCount();

    const subscribers = await queryBuilder
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.phone',
        'user.avatar',
        'user.isPremium',
        'user.premiumTier',
        'user.premiumExpiresAt',
        'user.walletBalance',
        'user.createdAt',
      ])
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Enrich with subscription info
    const enrichedSubscribers = subscribers.map(user => {
      const expiresAt = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
      let subscriptionStatus = 'unknown';
      let daysRemaining = 0;

      if (expiresAt) {
        if (expiresAt < now) {
          subscriptionStatus = 'expired';
          daysRemaining = Math.ceil((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)) * -1;
        } else if (expiresAt <= sevenDaysFromNow) {
          subscriptionStatus = 'expiring';
          daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          subscriptionStatus = 'active';
          daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        tier: user.premiumTier,
        expiresAt: user.premiumExpiresAt,
        status: subscriptionStatus,
        daysRemaining,
        walletBalance: Number(user.walletBalance || 0),
        joinedAt: user.createdAt,
      };
    });

    return {
      subscribers: enrichedSubscribers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get premium subscription transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tier', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('tier') tier?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const queryBuilder = this.platformRevenueRepository
      .createQueryBuilder('revenue')
      .where('revenue.type = :type', { type: RevenueType.SUBSCRIPTION })
      .andWhere("revenue.metadata->>'premiumType' = 'buyer'")
      .orderBy('revenue.createdAt', 'DESC');

    if (tier) {
      queryBuilder.andWhere("revenue.metadata->>'tier' = :tier", { tier });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('revenue.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate + 'T23:59:59.999Z'),
      });
    }

    const total = await queryBuilder.getCount();

    const transactions = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Fetch users for each transaction
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        let user = null;
        if (tx.sourceUserId) {
          user = await this.userRepository.findOne({
            where: { id: tx.sourceUserId },
            select: ['id', 'name', 'email', 'phone'],
          });
        }
        return {
          id: tx.id,
          amount: Number(tx.amount),
          tier: tx.metadata?.tier,
          duration: tx.metadata?.duration,
          paymentReference: tx.metadata?.paymentReference,
          status: tx.status,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          } : null,
          createdAt: tx.createdAt,
        };
      })
    );

    return {
      transactions: enrichedTransactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('subscribers/:id')
  @ApiOperation({ summary: 'Get subscriber details' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getSubscriber(@Param('id') id: string) {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.BUYER },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get payment history
    const payments = await this.platformRevenueRepository.find({
      where: {
        type: RevenueType.SUBSCRIPTION,
        sourceUserId: id,
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const now = new Date();
    const expiresAt = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
    let status = 'never';
    let daysRemaining = 0;

    if (user.isPremium && expiresAt) {
      if (expiresAt < now) {
        status = 'expired';
        daysRemaining = Math.ceil((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)) * -1;
      } else {
        status = 'active';
        daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      isPremium: user.isPremium,
      tier: user.premiumTier,
      expiresAt: user.premiumExpiresAt,
      status,
      daysRemaining,
      walletBalance: Number(user.walletBalance || 0),
      joinedAt: user.createdAt,
      payments: payments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        tier: p.metadata?.tier,
        duration: p.metadata?.duration,
        reference: p.metadata?.paymentReference,
        createdAt: p.createdAt,
      })),
      totalSpent: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    };
  }

  @Post('subscribers/:id/extend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extend a subscriber premium (admin gift)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['days'],
      properties: {
        days: { type: 'number', description: 'Number of days to extend' },
        reason: { type: 'string', description: 'Reason for extension' },
      },
    },
  })
  async extendSubscription(
    @Param('id') id: string,
    @Body() body: { days: number; reason?: string },
    @CurrentUser() admin: User,
  ) {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.BUYER },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    let newExpiresAt: Date;

    if (user.premiumExpiresAt && user.premiumExpiresAt > now) {
      // Extend from current expiry
      newExpiresAt = new Date(user.premiumExpiresAt);
    } else {
      // Start from now
      newExpiresAt = new Date();
    }
    newExpiresAt.setDate(newExpiresAt.getDate() + body.days);

    // Set tier if not already set
    if (!user.premiumTier) {
      user.premiumTier = 'basic';
    }

    user.isPremium = true;
    user.premiumExpiresAt = newExpiresAt;
    await this.userRepository.save(user);

    this.logger.log(`Admin ${admin.id} extended premium for user ${id} by ${body.days} days. Reason: ${body.reason || 'Not specified'}`);

    return {
      success: true,
      message: `Premium extended by ${body.days} days`,
      user: {
        id: user.id,
        name: user.name,
        tier: user.premiumTier,
        expiresAt: user.premiumExpiresAt,
      },
    };
  }

  @Post('subscribers/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a subscriber premium' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for cancellation' },
      },
    },
  })
  async cancelSubscription(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() admin: User,
  ) {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.BUYER },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isPremium) {
      throw new BadRequestException('User does not have premium');
    }

    user.isPremium = false;
    user.premiumExpiresAt = new Date(); // Set to now (expired)
    await this.userRepository.save(user);

    this.logger.log(`Admin ${admin.id} cancelled premium for user ${id}. Reason: ${body.reason || 'Not specified'}`);

    return {
      success: true,
      message: 'Premium subscription cancelled',
    };
  }

  @Patch('subscribers/:id/tier')
  @ApiOperation({ summary: 'Change subscriber tier' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['tier'],
      properties: {
        tier: { type: 'string', enum: ['basic', 'gold', 'platinum'] },
        reason: { type: 'string' },
      },
    },
  })
  async changeTier(
    @Param('id') id: string,
    @Body() body: { tier: string; reason?: string },
    @CurrentUser() admin: User,
  ) {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.BUYER },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!['basic', 'gold', 'platinum'].includes(body.tier)) {
      throw new BadRequestException('Invalid tier');
    }

    const previousTier = user.premiumTier;
    user.premiumTier = body.tier;
    await this.userRepository.save(user);

    this.logger.log(`Admin ${admin.id} changed tier for user ${id} from ${previousTier} to ${body.tier}. Reason: ${body.reason || 'Not specified'}`);

    return {
      success: true,
      message: `Tier changed from ${previousTier} to ${body.tier}`,
      user: {
        id: user.id,
        name: user.name,
        tier: user.premiumTier,
      },
    };
  }
}
