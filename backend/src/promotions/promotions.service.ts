import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ProductPromotion,
  PromotionStatus,
  PromotionPlanId,
  PromotionBoostType,
  TargetAudienceType,
} from '../database/entities/product-promotion.entity';
import { Product } from '../database/entities/product.entity';
import { User } from '../database/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletOwnerType, TransactionCategory } from '../database/entities/wallet-transaction.entity';
import { PaginatedResponseDto } from '../common/dto';
import { generateReference } from '../common/utils/helpers';
import {
  CreatePromotionDto,
  QueryPromotionsDto,
  PromotionResponseDto,
  PromotionStatsDto,
  PROMOTION_PLANS,
  BOOST_PRICES,
  AUDIENCE_MULTIPLIERS,
} from './dto';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    @InjectRepository(ProductPromotion)
    private readonly promotionRepository: Repository<ProductPromotion>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Calculate promotion cost based on plan, boosts, and audience
   */
  calculatePromotionCost(
    planId: PromotionPlanId,
    boosts: PromotionBoostType[] = [],
    targetAudience: TargetAudienceType = TargetAudienceType.ALL,
  ): number {
    const plan = PROMOTION_PLANS[planId];
    if (!plan) {
      throw new BadRequestException('Invalid promotion plan');
    }

    let totalCost = plan.basePrice;

    // Add boost costs
    for (const boost of boosts) {
      if (BOOST_PRICES[boost]) {
        totalCost += BOOST_PRICES[boost];
      }
    }

    // Apply audience multiplier
    const multiplier = AUDIENCE_MULTIPLIERS[targetAudience] || 1.0;
    totalCost = Math.round(totalCost * multiplier);

    return totalCost;
  }

  /**
   * Create a new promotion for a product (paid from wallet)
   */
  async createPromotion(
    farmerId: string,
    dto: CreatePromotionDto,
  ): Promise<PromotionResponseDto> {
    // Verify product exists and belongs to farmer
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, farmerId },
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to you');
    }

    // Check if product already has an active promotion
    const existingPromotion = await this.promotionRepository.findOne({
      where: {
        productId: dto.productId,
        status: PromotionStatus.ACTIVE,
      },
    });

    if (existingPromotion) {
      throw new BadRequestException('Product already has an active promotion');
    }

    // Calculate and verify cost
    const calculatedCost = this.calculatePromotionCost(
      dto.planId,
      dto.boosts,
      dto.targetAudience,
    );

    // Allow small rounding differences
    if (Math.abs(calculatedCost - dto.totalCost) > 10) {
      throw new BadRequestException(
        `Price mismatch. Expected: ₦${calculatedCost}, Got: ₦${dto.totalCost}`,
      );
    }

    // Check wallet balance
    const walletBalance = await this.walletService.getUserWalletBalance(farmerId);
    if (walletBalance < calculatedCost) {
      throw new BadRequestException(
        `Insufficient wallet balance. Required: ₦${calculatedCost}, Available: ₦${walletBalance}`,
      );
    }

    // Debit wallet
    const transactionRef = generateReference('PROMO');
    await this.walletService.debitWallet({
      ownerId: farmerId,
      ownerType: WalletOwnerType.FARMER,
      amount: calculatedCost,
      category: TransactionCategory.PROMOTION,
      description: `Promotion for ${product.title} - ${PROMOTION_PLANS[dto.planId].name} plan`,
      metadata: {
        productId: dto.productId,
        planId: dto.planId,
        reference: transactionRef,
      },
    });

    // Calculate dates
    const plan = PROMOTION_PLANS[dto.planId];
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Create promotion
    const promotion = this.promotionRepository.create({
      productId: dto.productId,
      farmerId,
      planId: dto.planId,
      durationDays: plan.durationDays,
      boosts: dto.boosts || [],
      targetAudience: dto.targetAudience || TargetAudienceType.ALL,
      totalCost: calculatedCost,
      status: PromotionStatus.ACTIVE,
      startDate,
      endDate,
      transactionReference: transactionRef,
    });

    const savedPromotion = await this.promotionRepository.save(promotion);

    // Update product promotion status
    await this.productRepository.update(dto.productId, {
      isPromoted: true,
      promotionExpiresAt: endDate,
    });

    this.logger.log(
      `Promotion created for product ${dto.productId} by farmer ${farmerId}. Cost: ₦${calculatedCost}`,
    );

    return this.toResponseDto(savedPromotion);
  }

  /**
   * Get farmer's promotions with pagination
   */
  async getFarmerPromotions(
    farmerId: string,
    query: QueryPromotionsDto,
  ): Promise<PaginatedResponseDto<PromotionResponseDto>> {
    const { page = 1, limit = 10, status, productId } = query;
    const skip = (page - 1) * limit;

    const where: any = { farmerId };
    if (status) where.status = status;
    if (productId) where.productId = productId;

    const [promotions, total] = await this.promotionRepository.findAndCount({
      where,
      relations: ['product'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    return {
      data: promotions.map((p) => this.toResponseDto(p)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Get single promotion by ID
   */
  async getPromotionById(
    farmerId: string,
    promotionId: string,
  ): Promise<PromotionResponseDto> {
    const promotion = await this.promotionRepository.findOne({
      where: { id: promotionId, farmerId },
      relations: ['product'],
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return this.toResponseDto(promotion);
  }

  /**
   * Cancel an active promotion (no refund)
   */
  async cancelPromotion(farmerId: string, promotionId: string): Promise<void> {
    const promotion = await this.promotionRepository.findOne({
      where: { id: promotionId, farmerId },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.status !== PromotionStatus.ACTIVE) {
      throw new BadRequestException('Only active promotions can be cancelled');
    }

    // Update promotion status
    await this.promotionRepository.update(promotionId, {
      status: PromotionStatus.CANCELLED,
    });

    // Update product promotion status
    await this.productRepository.update(promotion.productId, {
      isPromoted: false,
      promotionExpiresAt: null,
    });

    this.logger.log(`Promotion ${promotionId} cancelled by farmer ${farmerId}`);
  }

  /**
   * Get promotion statistics for a farmer
   */
  async getPromotionStats(farmerId: string): Promise<PromotionStatsDto> {
    const promotions = await this.promotionRepository.find({
      where: { farmerId },
    });

    const activePromotions = promotions.filter(
      (p) => p.status === PromotionStatus.ACTIVE,
    ).length;

    const totalSpent = promotions.reduce(
      (sum, p) => sum + Number(p.totalCost),
      0,
    );

    const totalViews = promotions.reduce((sum, p) => sum + p.views, 0);
    const totalClicks = promotions.reduce((sum, p) => sum + p.clicks, 0);
    const totalConversions = promotions.reduce((sum, p) => sum + p.conversions, 0);

    const averageConversionRate =
      totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      totalPromotions: promotions.length,
      activePromotions,
      totalSpent,
      totalViews,
      totalClicks,
      totalConversions,
      averageConversionRate: Math.round(averageConversionRate * 100) / 100,
    };
  }

  /**
   * Record a view on a promoted product
   */
  async recordView(productId: string): Promise<void> {
    const promotion = await this.promotionRepository.findOne({
      where: { productId, status: PromotionStatus.ACTIVE },
    });

    if (promotion) {
      await this.promotionRepository.increment(
        { id: promotion.id },
        'views',
        1,
      );
    }
  }

  /**
   * Record a click on a promoted product
   */
  async recordClick(productId: string): Promise<void> {
    const promotion = await this.promotionRepository.findOne({
      where: { productId, status: PromotionStatus.ACTIVE },
    });

    if (promotion) {
      await this.promotionRepository.increment(
        { id: promotion.id },
        'clicks',
        1,
      );
    }
  }

  /**
   * Record a conversion (purchase) on a promoted product
   */
  async recordConversion(productId: string): Promise<void> {
    const promotion = await this.promotionRepository.findOne({
      where: { productId, status: PromotionStatus.ACTIVE },
    });

    if (promotion) {
      await this.promotionRepository.increment(
        { id: promotion.id },
        'conversions',
        1,
      );
    }
  }

  /**
   * Get promotion plans (static data)
   */
  getPromotionPlans() {
    return Object.values(PROMOTION_PLANS);
  }

  /**
   * Cron job to expire promotions
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expirePromotions(): Promise<void> {
    const now = new Date();

    const expiredPromotions = await this.promotionRepository.find({
      where: {
        status: PromotionStatus.ACTIVE,
        endDate: LessThanOrEqual(now),
      },
    });

    for (const promotion of expiredPromotions) {
      // Update promotion status
      await this.promotionRepository.update(promotion.id, {
        status: PromotionStatus.EXPIRED,
      });

      // Update product promotion status
      await this.productRepository.update(promotion.productId, {
        isPromoted: false,
        promotionExpiresAt: null,
      });

      this.logger.log(`Promotion ${promotion.id} expired for product ${promotion.productId}`);
    }

    if (expiredPromotions.length > 0) {
      this.logger.log(`Expired ${expiredPromotions.length} promotions`);
    }
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(promotion: ProductPromotion): PromotionResponseDto {
    return {
      id: promotion.id,
      productId: promotion.productId,
      farmerId: promotion.farmerId,
      planId: promotion.planId,
      durationDays: promotion.durationDays,
      boosts: promotion.boosts || [],
      targetAudience: promotion.targetAudience,
      totalCost: Number(promotion.totalCost),
      status: promotion.status,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      views: promotion.views,
      clicks: promotion.clicks,
      conversions: promotion.conversions,
      createdAt: promotion.createdAt,
    };
  }
}
