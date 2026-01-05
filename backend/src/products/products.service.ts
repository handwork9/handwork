import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';
import { CreateProductDto, UpdateProductDto, QueryProductsDto } from './dto';
import { PaginatedResponseDto } from '../common/dto';
import { calculateDistance } from '../common/utils/helpers';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { ContentModerationService } from '../admin/content-moderation.service';
import { ContentType } from '../database/entities/content-moderation.entity';
import { PriceAlertsService } from '../price-alerts/price-alerts.service';
import { FarmerApplicationStatus, ProductApprovalStatus } from '../common/enums';

// Low stock threshold - notify farmer when stock falls below this
const LOW_STOCK_THRESHOLD = 10;

// Extended product type with farmer info
export interface ProductWithFarmerInfo extends Product {
  farmerName?: string;
  farmerPhone?: string;
  farmerAvatar?: string;
  isVerifiedSeller?: boolean;
  isSponsored?: boolean;
  sponsorTier?: string;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepository: Repository<FarmerProfile>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => ContentModerationService))
    private readonly moderationService: ContentModerationService,
    @Inject(forwardRef(() => PriceAlertsService))
    private readonly priceAlertsService: PriceAlertsService,
  ) {}

  /**
   * Transform a product entity to include farmer info for frontend
   */
  private transformProduct(product: Product): ProductWithFarmerInfo {
    const transformed: ProductWithFarmerInfo = {
      ...product,
      farmerName: product.farmer?.name,
      farmerPhone: product.farmer?.phone,
      farmerAvatar: product.farmer?.avatar,
      // Farmer is verified if they have an active premium subscription
      isVerifiedSeller: product.farmer?.isPremium && 
        (!product.farmer?.premiumExpiresAt || new Date(product.farmer.premiumExpiresAt) > new Date()),
    };
    // Remove nested farmer object to reduce payload size
    delete (transformed as any).farmer;
    return transformed;
  }

  /**
   * Transform multiple products
   */
  private transformProducts(products: Product[]): ProductWithFarmerInfo[] {
    return products.map(p => this.transformProduct(p));
  }

  async create(farmerId: string, dto: CreateProductDto): Promise<Product> {
    // Check if farmer is approved by admin before allowing product listing
    const farmerProfile = await this.farmerProfileRepository.findOne({
      where: { userId: farmerId },
    });

    if (!farmerProfile) {
      throw new BadRequestException(
        'You need to complete your farmer registration before listing products. Please go to Profile → Become a Farmer to register.'
      );
    }

    if (farmerProfile.applicationStatus === FarmerApplicationStatus.PENDING) {
      throw new BadRequestException(
        'Your farmer account is pending admin approval. You will be able to list products once approved. This usually takes 24-48 hours.'
      );
    }

    if (farmerProfile.applicationStatus === FarmerApplicationStatus.REJECTED) {
      throw new BadRequestException(
        `Your farmer application was rejected. Reason: ${farmerProfile.rejectionReason || 'Not specified'}. Please update your profile and reapply.`
      );
    }

    const product = this.productRepository.create({
      ...dto,
      farmerId,
    });
    const savedProduct = await this.productRepository.save(product);

    // Submit product for moderation
    try {
      await this.moderationService.submitForModeration({
        contentType: ContentType.PRODUCT,
        contentId: savedProduct.id,
        authorId: farmerId,
        title: savedProduct.title,
        contentPreview: savedProduct.description,
        contentSnapshot: {
          title: savedProduct.title,
          description: savedProduct.description,
          price: savedProduct.price,
          category: savedProduct.category,
          images: savedProduct.images,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to submit product ${savedProduct.id} for moderation: ${error.message}`);
    }

    return savedProduct;
  }

  async findAll(query: QueryProductsDto): Promise<PaginatedResponseDto<ProductWithFarmerInfo & { distance?: number }>> {
    const { page = 1, limit = 20, lat, lng, state, radius, category, subcategory, searchQuery, isOrganic, sortBy } = query;
    const skip = (page - 1) * limit;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .where('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('product.stock > 0')
      .andWhere('product.approvalStatus = :approvalStatus', { approvalStatus: ProductApprovalStatus.APPROVED });

    // Filter by state
    if (state) {
      qb.andWhere('LOWER(product.pickupState) = LOWER(:state)', { state });
    }

    // Filter by category
    if (category) {
      qb.andWhere('product.category = :category', { category });
    }

    // Filter by subcategory
    if (subcategory) {
      qb.andWhere('product.subcategory = :subcategory', { subcategory });
    }

    // Filter by organic
    if (isOrganic !== undefined) {
      qb.andWhere('product.isOrganic = :isOrganic', { isOrganic });
    }

    // Search by title, description, or category
    if (searchQuery) {
      qb.andWhere(
        '(LOWER(product.title) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search) OR LOWER(product.category) LIKE LOWER(:search) OR LOWER(product.subcategory) LIKE LOWER(:search))',
        { search: `%${searchQuery}%` },
      );
    }

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        qb.orderBy('product.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('product.price', 'DESC');
        break;
      case 'rating':
        qb.orderBy('product.rating', 'DESC');
        break;
      case 'newest':
        qb.orderBy('product.createdAt', 'DESC');
        break;
      case 'popular':
        qb.orderBy('product.salesCount', 'DESC');
        break;
      default:
        qb.orderBy('product.createdAt', 'DESC');
    }

    const [products, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Transform products to include farmer info
    const transformedProducts = this.transformProducts(products);

    // Calculate distance if lat/lng provided
    let productsWithDistance: (ProductWithFarmerInfo & { distance?: number })[] = transformedProducts.map((product) => {
      if (lat && lng) {
        const distance = calculateDistance(lat, lng, product.pickupLat, product.pickupLng);
        return { ...product, distance: Math.round(distance * 10) / 10 };
      }
      return { ...product, distance: undefined };
    });

    // Filter by radius if provided
    if (radius && lat && lng) {
      productsWithDistance = productsWithDistance.filter(
        (p) => p.distance !== undefined && p.distance <= radius,
      );
    }

    // Sort by distance if lat/lng provided
    if (lat && lng && !sortBy) {
      productsWithDistance.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    return new PaginatedResponseDto(productsWithDistance, total, page, limit);
  }

  async findById(id: string): Promise<ProductWithFarmerInfo> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['farmer'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.transformProduct(product);
  }

  async findByFarmer(farmerId: string, page = 1, limit = 20): Promise<PaginatedResponseDto<Product>> {
    const [products, total] = await this.productRepository.findAndCount({
      where: { farmerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(products, total, page, limit);
  }

  async update(id: string, farmerId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    if (product.farmerId !== farmerId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Track price changes for price drop alerts
    const oldPrice = Number(product.price);
    const newPrice = dto.price !== undefined ? Number(dto.price) : oldPrice;

    Object.assign(product, dto);
    const updatedProduct = await this.productRepository.save(product);

    // Record price change if price was updated
    if (dto.price !== undefined && oldPrice !== newPrice) {
      try {
        await this.priceAlertsService.recordPriceChange(id, oldPrice, newPrice);
      } catch (error) {
        this.logger.error(`Failed to record price change for product ${id}:`, error);
      }
    }

    return updatedProduct;
  }

  async delete(id: string, farmerId: string): Promise<void> {
    const product = await this.findById(id);

    if (product.farmerId !== farmerId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productRepository.remove(product);
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    await this.productRepository.decrement({ id }, 'stock', quantity);
    
    // Check for low stock and send notification
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['farmer'],
    });
    
    if (product && product.stock <= LOW_STOCK_THRESHOLD && product.stock >= 0) {
      // Send low stock alert to farmer
      this.notificationsService.sendPushNotification({
        userId: product.farmerId,
        type: NotificationType.GENERAL,
        title: '⚠️ Low Stock Alert',
        body: `${product.title} has only ${product.stock} ${product.unit}(s) left in stock.`,
        data: {
          type: 'low_stock',
          productId: product.id,
          productTitle: product.title,
          stock: product.stock,
        },
      }).catch((err) => {
        this.logger.warn(`Failed to send low stock alert: ${err.message}`);
      });
      
      // If out of stock, mark as unavailable
      if (product.stock <= 0) {
        await this.productRepository.update(id, { isAvailable: false });
        
        this.notificationsService.sendPushNotification({
          userId: product.farmerId,
          type: NotificationType.GENERAL,
          title: '❌ Product Out of Stock',
          body: `${product.title} is now out of stock and has been marked unavailable.`,
          data: {
            type: 'out_of_stock',
            productId: product.id,
            productTitle: product.title,
          },
        }).catch((err) => {
          this.logger.warn(`Failed to send out of stock alert: ${err.message}`);
        });
      }
    }
  }

  async restoreStock(id: string, quantity: number): Promise<void> {
    await this.productRepository.increment({ id }, 'stock', quantity);
  }

  async incrementSales(id: string, quantity: number): Promise<void> {
    await this.productRepository.increment({ id }, 'salesCount', quantity);
  }

  async decrementSales(id: string, quantity: number): Promise<void> {
    await this.productRepository.decrement({ id }, 'salesCount', quantity);
  }

  async getNearbyProducts(lat: number, lng: number, radiusKm: number, limit = 10): Promise<ProductWithFarmerInfo[]> {
    const products = await this.productRepository.find({
      where: { isAvailable: true },
      relations: ['farmer'],
    });

    // Filter by distance and sort
    const nearbyProducts = products
      .map((p) => ({
        ...this.transformProduct(p),
        distance: calculateDistance(lat, lng, p.pickupLat, p.pickupLng),
      }))
      .filter((p) => p.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return nearbyProducts;
  }

  async getFeaturedProducts(state?: string, limit = 10): Promise<ProductWithFarmerInfo[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .where('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('product.isFeatured = :isFeatured', { isFeatured: true });

    if (state) {
      qb.andWhere('LOWER(product.pickupState) = LOWER(:state)', { state });
    }

    const products = await qb.orderBy('product.rating', 'DESC').take(limit).getMany();
    return this.transformProducts(products);
  }

  /**
   * Get promoted/sponsored products (paid promotions by farmers)
   */
  async getPromotedProducts(state?: string, limit = 10): Promise<ProductWithFarmerInfo[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .where('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('product.isPromoted = :isPromoted', { isPromoted: true })
      .andWhere('product.stock > 0')
      .andWhere('(product.promotionExpiresAt IS NULL OR product.promotionExpiresAt > :now)', { now: new Date() });

    if (state) {
      qb.andWhere('LOWER(product.pickupState) = LOWER(:state)', { state });
    }

    const products = await qb.orderBy('product.createdAt', 'DESC').take(limit).getMany();
    return this.transformProducts(products);
  }

  /**
   * Get admin-curated official store products
   */
  async getAdminProducts(state?: string, limit = 10): Promise<ProductWithFarmerInfo[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .where('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('product.isAdminProduct = :isAdminProduct', { isAdminProduct: true })
      .andWhere('product.stock > 0');

    if (state) {
      qb.andWhere('LOWER(product.pickupState) = LOWER(:state)', { state });
    }

    const products = await qb.orderBy('product.rating', 'DESC').take(limit).getMany();
    return this.transformProducts(products);
  }

  /**
   * Get recommended products based on various factors
   */
  async getRecommendedProducts(userId?: string, state?: string, limit = 20): Promise<ProductWithFarmerInfo[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .where('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('product.stock > 0');

    if (state) {
      qb.andWhere('LOWER(product.pickupState) = LOWER(:state)', { state });
    }

    // Order by recommendation score, then rating, then sales count
    const products = await qb
      .orderBy('product.recommendationScore', 'DESC')
      .addOrderBy('product.rating', 'DESC')
      .addOrderBy('product.salesCount', 'DESC')
      .take(limit)
      .getMany();

    return this.transformProducts(products);
  }

  /**
   * Get sponsored products from verified/premium sellers
   * Products from farmers with active subscriptions are displayed as sponsored
   * Premium sellers (2.5x boost) appear before Verified sellers (1.5x boost)
   */
  async getSponsoredProducts(state?: string, limit = 12): Promise<ProductWithFarmerInfo[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .addSelect(
        "CASE WHEN farmer.premiumTier = 'premium' THEN 1 WHEN farmer.premiumTier = 'verified' THEN 2 ELSE 3 END",
        'tier_priority'
      )
      .where('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('product.stock > 0')
      .andWhere('farmer.isPremium = :isPremium', { isPremium: true })
      .andWhere('(farmer.premiumExpiresAt IS NULL OR farmer.premiumExpiresAt > :now)', { now: new Date() });

    if (state) {
      qb.andWhere('LOWER(product.pickupState) = LOWER(:state)', { state });
    }

    // Order by premium tier (premium > verified), then by rating and sales
    const products = await qb
      .orderBy('tier_priority', 'ASC')
      .addOrderBy('product.rating', 'DESC')
      .addOrderBy('product.salesCount', 'DESC')
      .take(limit)
      .getMany();

    // Transform and mark as sponsored
    return products.map(product => ({
      ...this.transformProduct(product),
      isSponsored: true,
      sponsorTier: product.farmer?.premiumTier || 'verified',
    }));
  }

  /**
   * Get products from verified sellers only
   */
  async getVerifiedSellerProducts(state?: string, limit = 10): Promise<ProductWithFarmerInfo[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .where('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('product.stock > 0')
      .andWhere('farmer.isPremium = :isPremium', { isPremium: true })
      .andWhere('farmer.premiumTier = :tier', { tier: 'verified' })
      .andWhere('(farmer.premiumExpiresAt IS NULL OR farmer.premiumExpiresAt > :now)', { now: new Date() });

    if (state) {
      qb.andWhere('LOWER(product.pickupState) = LOWER(:state)', { state });
    }

    const products = await qb
      .orderBy('product.rating', 'DESC')
      .addOrderBy('product.salesCount', 'DESC')
      .take(limit)
      .getMany();

    return this.transformProducts(products);
  }

  /**
   * Get products from premium sellers only
   */
  async getPremiumSellerProducts(state?: string, limit = 10): Promise<ProductWithFarmerInfo[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .where('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('product.stock > 0')
      .andWhere('farmer.isPremium = :isPremium', { isPremium: true })
      .andWhere('farmer.premiumTier = :tier', { tier: 'premium' })
      .andWhere('(farmer.premiumExpiresAt IS NULL OR farmer.premiumExpiresAt > :now)', { now: new Date() });

    if (state) {
      qb.andWhere('LOWER(product.pickupState) = LOWER(:state)', { state });
    }

    const products = await qb
      .orderBy('product.rating', 'DESC')
      .addOrderBy('product.salesCount', 'DESC')
      .take(limit)
      .getMany();

    return this.transformProducts(products);
  }
}
