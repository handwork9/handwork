import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual, LessThanOrEqual, And } from 'typeorm';
import { ProductBundle, BundleItem } from '../database/entities/product-bundle.entity';
import { Product } from '../database/entities/product.entity';
import { ProductApprovalStatus } from '../common/enums';

export interface CreateBundleDto {
  title: string;
  description?: string;
  items: { productId: string; quantity: number }[];
  bundlePrice: number;
  stock?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateBundleDto {
  title?: string;
  description?: string;
  items?: { productId: string; quantity: number }[];
  bundlePrice?: number;
  stock?: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class BundlesService {
  constructor(
    @InjectRepository(ProductBundle)
    private bundleRepository: Repository<ProductBundle>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Create a new product bundle
   */
  async createBundle(farmerId: string, dto: CreateBundleDto): Promise<ProductBundle> {
    // Get all products for this bundle (only approved products)
    const productIds = dto.items.map(item => item.productId);
    const products = await this.productRepository.find({
      where: { id: In(productIds), farmerId, approvalStatus: ProductApprovalStatus.APPROVED },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products not found, not approved, or do not belong to you');
    }

    // Build bundle items with pricing
    const bundleItems: BundleItem[] = [];
    let originalTotal = 0;

    for (const item of dto.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      const itemTotal = Number(product.price) * item.quantity;
      originalTotal += itemTotal;

      bundleItems.push({
        productId: product.id,
        productTitle: product.title,
        productImage: product.images?.[0],
        originalPrice: Number(product.price),
        bundlePrice: 0, // Will be calculated below
        quantity: item.quantity,
      });
    }

    if (dto.bundlePrice >= originalTotal) {
      throw new BadRequestException('Bundle price must be less than original total');
    }

    const discountPercentage = ((originalTotal - dto.bundlePrice) / originalTotal) * 100;

    // Distribute savings proportionally across items
    for (const item of bundleItems) {
      const itemOriginal = item.originalPrice * item.quantity;
      const itemShare = itemOriginal / originalTotal;
      item.bundlePrice = (dto.bundlePrice * itemShare) / item.quantity;
    }

    // Get location from first product
    const firstProduct = products[0];

    const bundle = this.bundleRepository.create({
      title: dto.title,
      description: dto.description,
      farmerId,
      items: bundleItems,
      originalTotal,
      bundlePrice: dto.bundlePrice,
      discountPercentage,
      images: products.slice(0, 4).map(p => p.images?.[0]).filter(Boolean),
      stock: dto.stock || 10,
      pickupState: firstProduct.pickupState,
      pickupCity: firstProduct.pickupCity,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    return this.bundleRepository.save(bundle);
  }

  /**
   * Get active bundles (for buyers)
   */
  async getActiveBundles(state?: string, city?: string, limit = 20): Promise<ProductBundle[]> {
    const now = new Date();
    const queryBuilder = this.bundleRepository
      .createQueryBuilder('bundle')
      .leftJoinAndSelect('bundle.farmer', 'farmer')
      .where('bundle.isActive = :isActive', { isActive: true })
      .andWhere('bundle.stock > 0')
      .andWhere('(bundle.startDate IS NULL OR bundle.startDate <= :now)', { now })
      .andWhere('(bundle.endDate IS NULL OR bundle.endDate >= :now)', { now });

    if (state) {
      queryBuilder.andWhere('bundle.pickupState = :state', { state });
    }

    if (city) {
      queryBuilder.andWhere('bundle.pickupCity = :city', { city });
    }

    return queryBuilder
      .orderBy('bundle.discountPercentage', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Get bundle by ID
   */
  async getBundleById(id: string): Promise<ProductBundle> {
    const bundle = await this.bundleRepository.findOne({
      where: { id },
      relations: ['farmer'],
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    return bundle;
  }

  /**
   * Get farmer's bundles
   */
  async getFarmerBundles(farmerId: string): Promise<ProductBundle[]> {
    return this.bundleRepository.find({
      where: { farmerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update a bundle
   */
  async updateBundle(id: string, farmerId: string, dto: UpdateBundleDto): Promise<ProductBundle> {
    const bundle = await this.bundleRepository.findOne({ where: { id } });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    if (bundle.farmerId !== farmerId) {
      throw new ForbiddenException('You can only update your own bundles');
    }

    // If items are being updated, recalculate pricing
    if (dto.items && dto.bundlePrice) {
      const productIds = dto.items.map(item => item.productId);
      const products = await this.productRepository.find({
        where: { id: In(productIds), farmerId, approvalStatus: ProductApprovalStatus.APPROVED },
      });

      const bundleItems: BundleItem[] = [];
      let originalTotal = 0;

      for (const item of dto.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;

        const itemTotal = Number(product.price) * item.quantity;
        originalTotal += itemTotal;

        bundleItems.push({
          productId: product.id,
          productTitle: product.title,
          productImage: product.images?.[0],
          originalPrice: Number(product.price),
          bundlePrice: 0,
          quantity: item.quantity,
        });
      }

      const discountPercentage = ((originalTotal - dto.bundlePrice) / originalTotal) * 100;

      for (const item of bundleItems) {
        const itemOriginal = item.originalPrice * item.quantity;
        const itemShare = itemOriginal / originalTotal;
        item.bundlePrice = (dto.bundlePrice * itemShare) / item.quantity;
      }

      bundle.items = bundleItems;
      bundle.originalTotal = originalTotal;
      bundle.bundlePrice = dto.bundlePrice;
      bundle.discountPercentage = discountPercentage;
      bundle.images = products.slice(0, 4).map(p => p.images?.[0]).filter(Boolean);
    }

    if (dto.title) bundle.title = dto.title;
    if (dto.description !== undefined) bundle.description = dto.description;
    if (dto.stock !== undefined) bundle.stock = dto.stock;
    if (dto.isActive !== undefined) bundle.isActive = dto.isActive;
    if (dto.startDate !== undefined) bundle.startDate = dto.startDate;
    if (dto.endDate !== undefined) bundle.endDate = dto.endDate;

    return this.bundleRepository.save(bundle);
  }

  /**
   * Delete a bundle
   */
  async deleteBundle(id: string, farmerId: string): Promise<void> {
    const bundle = await this.bundleRepository.findOne({ where: { id } });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    if (bundle.farmerId !== farmerId) {
      throw new ForbiddenException('You can only delete your own bundles');
    }

    await this.bundleRepository.remove(bundle);
  }

  /**
   * Decrement bundle stock after purchase
   */
  async decrementStock(id: string, quantity = 1): Promise<void> {
    await this.bundleRepository.decrement({ id }, 'stock', quantity);
    await this.bundleRepository.increment({ id }, 'salesCount', quantity);
  }
}
