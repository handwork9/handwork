import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, Between, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FlashSale, FlashSaleStatus } from '../database/entities/flash-sale.entity';
import { Product } from '../database/entities/product.entity';
import { CreateFlashSaleDto, UpdateFlashSaleDto, QueryFlashSalesDto } from './dto';

@Injectable()
export class FlashSalesService {
  private readonly logger = new Logger(FlashSalesService.name);

  constructor(
    @InjectRepository(FlashSale)
    private readonly flashSaleRepository: Repository<FlashSale>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Create a new flash sale
   */
  async create(farmerId: string, dto: CreateFlashSaleDto): Promise<FlashSale> {
    // Verify product exists and belongs to farmer
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, farmerId },
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to you');
    }

    // Check if product already has an active/scheduled flash sale
    const existingSale = await this.flashSaleRepository.findOne({
      where: {
        productId: dto.productId,
        status: In([FlashSaleStatus.ACTIVE, FlashSaleStatus.SCHEDULED]),
      },
    });

    if (existingSale) {
      throw new BadRequestException('This product already has an active or scheduled flash sale');
    }

    // Validate times
    const now = new Date();
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    
    // Allow start time up to 5 minutes in the past (for immediate sales)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    if (startTime < fiveMinutesAgo) {
      throw new BadRequestException('Start time cannot be more than 5 minutes in the past');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Calculate sale price
    const salePrice = product.price * (1 - dto.discountPercent / 100);

    // Determine status: ACTIVE if start time is now or in the past, otherwise SCHEDULED
    const status = startTime <= now ? FlashSaleStatus.ACTIVE : FlashSaleStatus.SCHEDULED;

    const flashSale = this.flashSaleRepository.create({
      ...dto,
      farmerId,
      originalPrice: product.price,
      salePrice: Math.round(salePrice * 100) / 100,
      status,
    });

    return this.flashSaleRepository.save(flashSale);
  }

  /**
   * Get all active flash sales
   */
  async getActive(query: QueryFlashSalesDto) {
    const { page = 1, limit = 20, category, featured } = query;

    const qb = this.flashSaleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.product', 'product')
      .leftJoinAndSelect('sale.farmer', 'farmer')
      .where('sale.status = :status', { status: FlashSaleStatus.ACTIVE })
      .andWhere('sale.endTime > :now', { now: new Date() })
      .andWhere('sale.soldQuantity < sale.totalQuantity');

    if (category) {
      qb.andWhere('product.category = :category', { category });
    }

    if (featured) {
      qb.andWhere('sale.isFeatured = :featured', { featured });
    }

    qb.orderBy('sale.endTime', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map(sale => this.formatFlashSale(sale)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get upcoming flash sales
   */
  async getUpcoming(query: QueryFlashSalesDto) {
    const { page = 1, limit = 20 } = query;

    const [data, total] = await this.flashSaleRepository.findAndCount({
      where: { status: FlashSaleStatus.SCHEDULED },
      relations: ['product', 'farmer'],
      order: { startTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: data.map(sale => this.formatFlashSale(sale)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get flash sale by ID
   */
  async getById(id: string): Promise<FlashSale> {
    const sale = await this.flashSaleRepository.findOne({
      where: { id },
      relations: ['product', 'farmer'],
    });

    if (!sale) {
      throw new NotFoundException('Flash sale not found');
    }

    // Increment views
    await this.flashSaleRepository.increment({ id }, 'views', 1);

    return sale;
  }

  /**
   * Get farmer's flash sales
   */
  async getByFarmer(farmerId: string, query: QueryFlashSalesDto) {
    const { page = 1, limit = 20, status } = query;

    const where: any = { farmerId };
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.flashSaleRepository.findAndCount({
      where,
      relations: ['product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update flash sale
   */
  async update(id: string, farmerId: string, dto: UpdateFlashSaleDto): Promise<FlashSale> {
    const sale = await this.flashSaleRepository.findOne({
      where: { id, farmerId },
      relations: ['product'],
    });

    if (!sale) {
      throw new NotFoundException('Flash sale not found');
    }

    if (sale.status !== FlashSaleStatus.SCHEDULED) {
      throw new BadRequestException('Can only update scheduled flash sales');
    }

    // If discount changed, recalculate sale price
    if (dto.discountPercent !== undefined) {
      sale.salePrice = sale.originalPrice * (1 - dto.discountPercent / 100);
      sale.discountPercent = dto.discountPercent;
    }

    Object.assign(sale, dto);
    return this.flashSaleRepository.save(sale);
  }

  /**
   * Cancel flash sale
   */
  async cancel(id: string, farmerId: string): Promise<void> {
    const sale = await this.flashSaleRepository.findOne({
      where: { id, farmerId },
    });

    if (!sale) {
      throw new NotFoundException('Flash sale not found');
    }

    if (sale.status === FlashSaleStatus.ENDED) {
      throw new BadRequestException('Cannot cancel an ended flash sale');
    }

    sale.status = FlashSaleStatus.CANCELLED;
    await this.flashSaleRepository.save(sale);
  }

  /**
   * Record a purchase from flash sale
   */
  async recordPurchase(id: string, quantity: number): Promise<void> {
    const sale = await this.flashSaleRepository.findOne({ where: { id } });
    
    if (!sale || sale.status !== FlashSaleStatus.ACTIVE) {
      throw new BadRequestException('Flash sale is not active');
    }

    if (sale.soldQuantity + quantity > sale.totalQuantity) {
      throw new BadRequestException('Not enough stock in flash sale');
    }

    sale.soldQuantity += quantity;
    
    if (sale.soldQuantity >= sale.totalQuantity) {
      sale.status = FlashSaleStatus.ENDED;
    }

    await this.flashSaleRepository.save(sale);
  }

  /**
   * Get today's deals
   */
  async getTodaysDeals() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await this.flashSaleRepository.find({
      where: {
        status: FlashSaleStatus.ACTIVE,
        startTime: LessThanOrEqual(new Date()),
        endTime: MoreThan(new Date()),
      },
      relations: ['product', 'farmer'],
      order: { discountPercent: 'DESC' },
      take: 10,
    });

    return sales.map(sale => this.formatFlashSale(sale));
  }

  /**
   * Cron: Activate scheduled flash sales
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async activateScheduledSales() {
    const now = new Date();

    const salesToActivate = await this.flashSaleRepository.find({
      where: {
        status: FlashSaleStatus.SCHEDULED,
        startTime: LessThanOrEqual(now),
      },
    });

    for (const sale of salesToActivate) {
      sale.status = FlashSaleStatus.ACTIVE;
      await this.flashSaleRepository.save(sale);
      this.logger.log(`Flash sale ${sale.id} activated`);
    }
  }

  /**
   * Cron: End expired flash sales
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async endExpiredSales() {
    const now = new Date();

    const salesToEnd = await this.flashSaleRepository.find({
      where: {
        status: FlashSaleStatus.ACTIVE,
        endTime: LessThanOrEqual(now),
      },
    });

    for (const sale of salesToEnd) {
      sale.status = FlashSaleStatus.ENDED;
      await this.flashSaleRepository.save(sale);
      this.logger.log(`Flash sale ${sale.id} ended`);
    }
  }

  private formatFlashSale(sale: FlashSale) {
    const now = new Date();
    const timeRemaining = sale.endTime.getTime() - now.getTime();

    return {
      id: sale.id,
      title: sale.title,
      description: sale.description,
      product: sale.product ? {
        id: sale.product.id,
        title: sale.product.title,
        images: sale.product.images,
        category: sale.product.category,
        unit: sale.product.unit,
      } : null,
      farmer: sale.farmer ? {
        id: sale.farmer.id,
        name: sale.farmer.name,
        avatar: sale.farmer.avatar,
      } : null,
      originalPrice: sale.originalPrice,
      salePrice: sale.salePrice,
      discountPercent: sale.discountPercent,
      totalQuantity: sale.totalQuantity,
      soldQuantity: sale.soldQuantity,
      remainingQuantity: sale.totalQuantity - sale.soldQuantity,
      startTime: sale.startTime,
      endTime: sale.endTime,
      timeRemainingMs: Math.max(0, timeRemaining),
      status: sale.status,
      isFeatured: sale.isFeatured,
      views: sale.views,
    };
  }
}
