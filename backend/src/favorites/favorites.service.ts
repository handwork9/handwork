import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Favorite, Product } from '../database/entities';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addFavorite(userId: string, productId: string): Promise<Favorite> {
    // Check if product exists
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already favorited
    const existing = await this.favoriteRepository.findOne({
      where: { userId, productId },
    });
    if (existing) {
      throw new ConflictException('Product already in favorites');
    }

    const favorite = this.favoriteRepository.create({ userId, productId });
    return this.favoriteRepository.save(favorite);
  }

  async removeFavorite(userId: string, productId: string): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, productId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
  }

  async getFavorites(userId: string, page = 1, limit = 20): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [favorites, total] = await this.favoriteRepository.findAndCount({
      where: { userId },
      relations: ['product', 'product.farmer'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const items = favorites
      .map(f => f.product)
      .filter(p => p && p.isAvailable);

    // Enrich products with farmer info
    const enrichedItems = items.map(product => ({
      ...product,
      farmerName: product.farmer?.name || 'Unknown',
      isFavorite: true,
    }));

    return {
      items: enrichedItems as Product[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const count = await this.favoriteRepository.count({
      where: { userId, productId },
    });
    return count > 0;
  }

  async getFavoriteProductIds(userId: string): Promise<string[]> {
    const favorites = await this.favoriteRepository.find({
      where: { userId },
      select: ['productId'],
    });
    return favorites.map(f => f.productId);
  }

  async toggleFavorite(userId: string, productId: string): Promise<{ isFavorite: boolean }> {
    const existing = await this.favoriteRepository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      await this.favoriteRepository.remove(existing);
      return { isFavorite: false };
    }

    // Check if product exists
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const favorite = this.favoriteRepository.create({ userId, productId });
    await this.favoriteRepository.save(favorite);
    return { isFavorite: true };
  }

  async getFavoritesCount(userId: string): Promise<number> {
    return this.favoriteRepository.count({ where: { userId } });
  }

  async clearAllFavorites(userId: string): Promise<void> {
    await this.favoriteRepository.delete({ userId });
  }

  async checkMultipleFavorites(userId: string, productIds: string[]): Promise<Record<string, boolean>> {
    if (!productIds.length) return {};

    const favorites = await this.favoriteRepository.find({
      where: {
        userId,
        productId: In(productIds),
      },
      select: ['productId'],
    });

    const favoriteSet = new Set(favorites.map(f => f.productId));
    return productIds.reduce((acc, id) => {
      acc[id] = favoriteSet.has(id);
      return acc;
    }, {} as Record<string, boolean>);
  }
}
