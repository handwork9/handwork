import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PriceHistory, Product, Favorite, User } from '../database/entities';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PriceAlertsService {
  private readonly logger = new Logger(PriceAlertsService.name);

  constructor(
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Record a price change for a product
   */
  async recordPriceChange(productId: string, oldPrice: number, newPrice: number): Promise<PriceHistory | null> {
    // Only record if price actually changed
    if (Number(oldPrice) === Number(newPrice)) {
      return null;
    }

    const percentageChange = ((Number(newPrice) - Number(oldPrice)) / Number(oldPrice)) * 100;

    const priceHistory = this.priceHistoryRepository.create({
      productId,
      oldPrice: Number(oldPrice),
      newPrice: Number(newPrice),
      percentageChange,
    });

    const saved = await this.priceHistoryRepository.save(priceHistory);
    this.logger.log(`Recorded price change for product ${productId}: ${oldPrice} -> ${newPrice} (${percentageChange.toFixed(2)}%)`);

    // If price dropped, notify users who have this product favorited
    if (percentageChange < 0) {
      await this.notifyPriceDropSubscribers(productId, oldPrice, newPrice, percentageChange);
    }

    return saved;
  }

  /**
   * Notify users who have favorited a product about a price drop
   */
  async notifyPriceDropSubscribers(
    productId: string,
    oldPrice: number,
    newPrice: number,
    percentageChange: number,
  ): Promise<void> {
    try {
      // Get the product details
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['farmer'],
      });

      if (!product) {
        this.logger.warn(`Product ${productId} not found for price drop notification`);
        return;
      }

      // Find all users who have favorited this product
      const favorites = await this.favoriteRepository.find({
        where: { productId },
        select: ['userId'],
      });

      if (favorites.length === 0) {
        this.logger.log(`No users have favorited product ${productId}`);
        return;
      }

      const userIds = favorites.map(f => f.userId);
      
      // Get users with push tokens enabled
      const users = await this.userRepository.find({
        where: { 
          id: In(userIds),
          pushToken: MoreThan('') as any,
        },
        select: ['id', 'pushToken', 'name'],
      });

      if (users.length === 0) {
        this.logger.log(`No users with push tokens have favorited product ${productId}`);
        return;
      }

      const discount = Math.abs(percentageChange).toFixed(0);
      
      // Send notification to each user
      for (const user of users) {
        try {
          await this.notificationsService.sendPushNotification(
            user.id,
            `🔥 Price Drop Alert!`,
            `${product.title} is now ₦${Number(newPrice).toLocaleString()} (${discount}% off)! Was ₦${Number(oldPrice).toLocaleString()}.`,
            {
              type: 'price_drop',
              productId,
              productTitle: product.title,
              oldPrice: oldPrice.toString(),
              newPrice: newPrice.toString(),
              percentageOff: discount,
              productImage: product.images?.[0] || '',
            },
          );
          this.logger.log(`Sent price drop notification to user ${user.id} for product ${product.title}`);
        } catch (error) {
          this.logger.error(`Failed to send price drop notification to user ${user.id}:`, error);
        }
      }

      // Also create in-app notifications
      for (const favorite of favorites) {
        try {
          await this.notificationsService.createNotification(
            favorite.userId,
            'price_alert',
            `Price Drop: ${product.title}`,
            `${product.title} dropped from ₦${Number(oldPrice).toLocaleString()} to ₦${Number(newPrice).toLocaleString()} (${discount}% off)!`,
            {
              type: 'price_drop',
              productId,
              productTitle: product.title,
              oldPrice: oldPrice.toString(),
              newPrice: newPrice.toString(),
              percentageOff: discount,
              productImage: product.images?.[0] || '',
            },
          );
        } catch (error) {
          this.logger.error(`Failed to create in-app notification for user ${favorite.userId}:`, error);
        }
      }

      this.logger.log(`Notified ${users.length} users about price drop for ${product.title}`);
    } catch (error) {
      this.logger.error(`Failed to notify price drop subscribers for product ${productId}:`, error);
    }
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(productId: string, limit = 30): Promise<PriceHistory[]> {
    return this.priceHistoryRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get recent price drops across all favorited products for a user
   */
  async getUserPriceDrops(userId: string, days = 7): Promise<{
    product: Product;
    priceHistory: PriceHistory;
  }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get user's favorited product IDs
    const favorites = await this.favoriteRepository.find({
      where: { userId },
      select: ['productId'],
    });

    if (favorites.length === 0) {
      return [];
    }

    const productIds = favorites.map(f => f.productId);

    // Get price drops for those products
    const priceDrops = await this.priceHistoryRepository
      .createQueryBuilder('ph')
      .leftJoinAndSelect('ph.product', 'product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .where('ph.productId IN (:...productIds)', { productIds })
      .andWhere('ph.percentageChange < 0')
      .andWhere('ph.createdAt > :since', { since })
      .orderBy('ph.createdAt', 'DESC')
      .take(20)
      .getMany();

    return priceDrops.map(ph => ({
      product: ph.product,
      priceHistory: ph,
    }));
  }

  /**
   * Clean up old price history records (keep last 90 days)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldPriceHistory(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await this.priceHistoryRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Cleaned up ${result.affected || 0} old price history records`);
  }
}
