import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ProductDiscount, DiscountStatus, DiscountType } from '../database/entities/product-discount.entity';
import { Product } from '../database/entities/product.entity';
import { CreateDiscountDto, UpdateDiscountDto, DiscountQueryDto, ApplyPromoCodeDto } from './dto';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(ProductDiscount)
    private discountRepo: Repository<ProductDiscount>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async create(farmerId: string, dto: CreateDiscountDto): Promise<ProductDiscount> {
    // Verify product exists and belongs to farmer
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, farmerId },
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to you');
    }

    // Check if product already has an active discount
    const existingDiscount = await this.discountRepo.findOne({
      where: {
        productId: dto.productId,
        status: DiscountStatus.ACTIVE,
      },
    });

    if (existingDiscount) {
      throw new BadRequestException('Product already has an active discount. Please update or remove it first.');
    }

    // Validate discount value
    if (dto.discountType === DiscountType.PERCENTAGE && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    if (dto.discountType === DiscountType.FIXED && dto.discountValue >= dto.originalPrice) {
      throw new BadRequestException('Fixed discount cannot be greater than or equal to original price');
    }

    // Validate promo code uniqueness if used
    if (dto.usePromoCode && dto.promoCode) {
      const existingCode = await this.discountRepo.findOne({
        where: {
          promoCode: dto.promoCode.toUpperCase(),
          status: DiscountStatus.ACTIVE,
        },
      });

      if (existingCode) {
        throw new BadRequestException('Promo code already in use');
      }
    }

    // Determine status based on dates
    let status = DiscountStatus.ACTIVE;
    if (dto.isLimitedTime && dto.startDate) {
      const startDate = new Date(dto.startDate);
      if (startDate > new Date()) {
        status = DiscountStatus.SCHEDULED;
      }
    }

    const discount = this.discountRepo.create({
      productId: dto.productId,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      originalPrice: dto.originalPrice,
      discountedPrice: dto.discountedPrice,
      minQuantity: dto.minQuantity,
      isLimitedTime: dto.isLimitedTime,
      usePromoCode: dto.usePromoCode,
      maxUsage: dto.maxUsage,
      farmerId,
      promoCode: dto.promoCode?.toUpperCase(),
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      status,
    } as Partial<ProductDiscount>);

    return this.discountRepo.save(discount) as Promise<ProductDiscount>;
  }

  async findAllByFarmer(farmerId: string, query: DiscountQueryDto): Promise<{ discounts: ProductDiscount[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const whereConditions: any = { farmerId };

    if (query.productId) {
      whereConditions.productId = query.productId;
    }

    if (query.status) {
      whereConditions.status = query.status;
    }

    const [discounts, total] = await this.discountRepo.findAndCount({
      where: whereConditions,
      relations: ['product'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { discounts, total, page, limit };
  }

  async findOne(id: string, farmerId: string): Promise<ProductDiscount> {
    const discount = await this.discountRepo.findOne({
      where: { id, farmerId },
      relations: ['product'],
    });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    return discount;
  }

  async findByProduct(productId: string): Promise<ProductDiscount | null> {
    // Find active discount for a product (for buyers)
    const now = new Date();
    
    const discount = await this.discountRepo.findOne({
      where: [
        {
          productId,
          status: DiscountStatus.ACTIVE,
          isLimitedTime: false,
        },
        {
          productId,
          status: DiscountStatus.ACTIVE,
          isLimitedTime: true,
          startDate: LessThanOrEqual(now),
          endDate: MoreThanOrEqual(now),
        },
      ],
    });

    return discount;
  }

  async update(id: string, farmerId: string, dto: UpdateDiscountDto): Promise<ProductDiscount> {
    const discount = await this.findOne(id, farmerId);

    // Validate promo code uniqueness if changed
    if (dto.promoCode && dto.promoCode !== discount.promoCode) {
      const existingCode = await this.discountRepo.findOne({
        where: {
          promoCode: dto.promoCode.toUpperCase(),
          status: DiscountStatus.ACTIVE,
        },
      });

      if (existingCode && existingCode.id !== id) {
        throw new BadRequestException('Promo code already in use');
      }
    }

    Object.assign(discount, {
      ...dto,
      promoCode: dto.promoCode?.toUpperCase() || discount.promoCode,
      startDate: dto.startDate ? new Date(dto.startDate) : discount.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : discount.endDate,
    });

    return this.discountRepo.save(discount);
  }

  async pause(id: string, farmerId: string): Promise<ProductDiscount> {
    const discount = await this.findOne(id, farmerId);
    discount.status = DiscountStatus.PAUSED;
    return this.discountRepo.save(discount);
  }

  async resume(id: string, farmerId: string): Promise<ProductDiscount> {
    const discount = await this.findOne(id, farmerId);
    
    // Check if it should be active or scheduled
    if (discount.isLimitedTime && discount.startDate && discount.startDate > new Date()) {
      discount.status = DiscountStatus.SCHEDULED;
    } else {
      discount.status = DiscountStatus.ACTIVE;
    }
    
    return this.discountRepo.save(discount);
  }

  async remove(id: string, farmerId: string): Promise<void> {
    const discount = await this.findOne(id, farmerId);
    await this.discountRepo.remove(discount);
  }

  async applyPromoCode(dto: ApplyPromoCodeDto): Promise<{ discount: ProductDiscount; discountedPrice: number; savings: number }> {
    const now = new Date();
    
    const discount = await this.discountRepo.findOne({
      where: {
        promoCode: dto.promoCode.toUpperCase(),
        productId: dto.productId,
        usePromoCode: true,
        status: DiscountStatus.ACTIVE,
      },
      relations: ['product'],
    });

    if (!discount) {
      throw new NotFoundException('Invalid or expired promo code');
    }

    // Check if limited time discount is within valid period
    if (discount.isLimitedTime) {
      if (discount.startDate && discount.startDate > now) {
        throw new BadRequestException('Promo code is not yet active');
      }
      if (discount.endDate && discount.endDate < now) {
        throw new BadRequestException('Promo code has expired');
      }
    }

    // Check max usage
    if (discount.maxUsage && discount.usageCount >= discount.maxUsage) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    // Check min quantity
    const quantity = dto.quantity || 1;
    if (quantity < discount.minQuantity) {
      throw new BadRequestException(`Minimum quantity of ${discount.minQuantity} required for this discount`);
    }

    const savings = discount.originalPrice - discount.discountedPrice;

    return {
      discount,
      discountedPrice: discount.discountedPrice,
      savings,
    };
  }

  async incrementUsage(discountId: string): Promise<void> {
    await this.discountRepo.increment({ id: discountId }, 'usageCount', 1);
  }

  // Cron job helper: Update expired discounts
  async updateExpiredDiscounts(): Promise<number> {
    const now = new Date();
    
    const result = await this.discountRepo.update(
      {
        status: DiscountStatus.ACTIVE,
        isLimitedTime: true,
        endDate: LessThanOrEqual(now),
      },
      { status: DiscountStatus.EXPIRED }
    );

    return result.affected || 0;
  }

  // Cron job helper: Activate scheduled discounts
  async activateScheduledDiscounts(): Promise<number> {
    const now = new Date();
    
    const result = await this.discountRepo.update(
      {
        status: DiscountStatus.SCHEDULED,
        startDate: LessThanOrEqual(now),
      },
      { status: DiscountStatus.ACTIVE }
    );

    return result.affected || 0;
  }

  async getDiscountStats(farmerId: string): Promise<{
    totalDiscounts: number;
    activeDiscounts: number;
    totalUsage: number;
    averageDiscount: number;
  }> {
    const discounts = await this.discountRepo.find({
      where: { farmerId },
    });

    const activeDiscounts = discounts.filter(d => d.status === DiscountStatus.ACTIVE).length;
    const totalUsage = discounts.reduce((sum, d) => sum + d.usageCount, 0);
    
    let averageDiscount = 0;
    if (discounts.length > 0) {
      const totalDiscount = discounts.reduce((sum, d) => {
        if (d.discountType === DiscountType.PERCENTAGE) {
          return sum + d.discountValue;
        } else {
          return sum + ((d.discountValue / d.originalPrice) * 100);
        }
      }, 0);
      averageDiscount = totalDiscount / discounts.length;
    }

    return {
      totalDiscounts: discounts.length,
      activeDiscounts,
      totalUsage,
      averageDiscount: Math.round(averageDiscount * 100) / 100,
    };
  }
}
