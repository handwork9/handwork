import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { Product, User, Order, UserPreference, Favorite } from '../database/entities';
import { ProductApprovalStatus } from '../common/enums';

export interface RecommendedProduct extends Product {
  recommendationReason?: string;
  personalScore?: number;
}

interface RecommendationWeights {
  categoryPreference: number;
  purchaseHistory: number;
  favoriteFarmers: number;
  locationMatch: number;
  popularity: number;
  recency: number;
  priceRange: number;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  // Default weights for recommendation factors
  private readonly defaultWeights: RecommendationWeights = {
    categoryPreference: 0.25,   // User's preferred categories
    purchaseHistory: 0.20,      // Products similar to past purchases
    favoriteFarmers: 0.15,      // Products from farmers they've bought from
    locationMatch: 0.15,        // Products in user's state
    popularity: 0.10,           // Overall product popularity (rating, sales)
    recency: 0.10,              // Recently added products
    priceRange: 0.05,           // Within user's typical price range
  };

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(UserPreference)
    private preferenceRepository: Repository<UserPreference>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
  ) {}

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    state?: string,
    limit = 20,
  ): Promise<RecommendedProduct[]> {
    try {
      // Get user and their preferences
      const [user, preferences] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.getOrCreatePreferences(userId),
      ]);

      // If no purchase history, return popular products
      if (!preferences || preferences.totalPurchases === 0) {
        return this.getPopularProducts(state, limit, userId);
      }

      // Get candidate products
      const candidates = await this.getCandidateProducts(state, limit * 3, userId);

      // Score each product based on user preferences
      const scoredProducts = candidates.map(product => ({
        ...product,
        personalScore: this.calculatePersonalScore(product, preferences, user || undefined),
        recommendationReason: this.getRecommendationReason(product, preferences),
      }));

      // Sort by personal score and return top results
      scoredProducts.sort((a, b) => (b.personalScore || 0) - (a.personalScore || 0));

      return scoredProducts.slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting personalized recommendations: ${error.message}`);
      // Fallback to popular products
      return this.getPopularProducts(state, limit, userId);
    }
  }

  /**
   * Calculate personal recommendation score for a product
   */
  private calculatePersonalScore(
    product: Product,
    preferences: UserPreference,
    user?: User,
  ): number {
    let score = 0;
    const weights = this.defaultWeights;

    // 1. Category Preference Score
    const categoryScore = preferences.categoryScores[product.category?.toLowerCase()] || 0;
    const maxCategoryScore = Math.max(...Object.values(preferences.categoryScores), 1);
    score += weights.categoryPreference * (categoryScore / maxCategoryScore);

    // 2. Favorite Farmer Score
    const farmerScore = preferences.favoriteFarmers[product.farmerId] || 0;
    const maxFarmerScore = Math.max(...Object.values(preferences.favoriteFarmers), 1);
    score += weights.favoriteFarmers * (farmerScore / maxFarmerScore);

    // 3. Location Match Score
    if (user?.state && product.pickupState?.toLowerCase() === user.state.toLowerCase()) {
      score += weights.locationMatch;
    }

    // 4. Popularity Score (rating + salesCount)
    const ratingScore = (product.rating || 0) / 5;
    const salesScore = Math.min((product.salesCount || 0) / 100, 1); // Cap at 100 sales
    score += weights.popularity * ((ratingScore + salesScore) / 2);

    // 5. Recency Score (products added in last 30 days get boost)
    const daysSinceCreated = this.getDaysSince(product.createdAt);
    const recencyScore = Math.max(0, 1 - daysSinceCreated / 30);
    score += weights.recency * recencyScore;

    // 6. Price Range Score
    if (preferences.avgPurchasePrice) {
      const priceDiff = Math.abs(Number(product.price) - Number(preferences.avgPurchasePrice));
      const priceRange = Number(preferences.maxPurchasePrice) - Number(preferences.minPurchasePrice) || 1000;
      const priceScore = Math.max(0, 1 - priceDiff / priceRange);
      score += weights.priceRange * priceScore;
    }

    // 7. Admin recommendation boost
    score += (product.recommendationScore || 0) / 100 * 0.2;

    return score;
  }

  /**
   * Get recommendation reason for display
   */
  private getRecommendationReason(
    product: Product,
    preferences: UserPreference,
  ): string {
    const categoryScore = preferences.categoryScores[product.category?.toLowerCase()] || 0;
    const farmerScore = preferences.favoriteFarmers[product.farmerId] || 0;

    if (farmerScore > 2) {
      return 'From a farmer you love';
    }
    if (categoryScore > 3) {
      return `Because you like ${product.category}`;
    }
    if (product.rating >= 4.5) {
      return 'Highly rated';
    }
    if (this.getDaysSince(product.createdAt) <= 7) {
      return 'New arrival';
    }
    if (product.salesCount > 50) {
      return 'Popular choice';
    }
    return 'Recommended for you';
  }

  /**
   * Get candidate products for recommendation
   */
  private async getCandidateProducts(
    state?: string,
    limit = 60,
    excludeUserId?: string,
  ): Promise<Product[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .where('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('product.stock > 0')
      .andWhere('product.approvalStatus = :approvalStatus', { approvalStatus: ProductApprovalStatus.APPROVED });

    if (state) {
      qb.andWhere('LOWER(product.pickupState) = LOWER(:state)', { state });
    }

    // Don't recommend user's own products if they're a farmer
    if (excludeUserId) {
      qb.andWhere('product.farmerId != :excludeUserId', { excludeUserId });
    }

    return qb
      .orderBy('product.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Get popular products (fallback for new users)
   */
  async getPopularProducts(
    state?: string,
    limit = 20,
    excludeUserId?: string,
  ): Promise<RecommendedProduct[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farmer', 'farmer')
      .where('product.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('product.stock > 0');

    if (state) {
      qb.andWhere('LOWER(product.pickupState) = LOWER(:state)', { state });
    }

    if (excludeUserId) {
      qb.andWhere('product.farmerId != :excludeUserId', { excludeUserId });
    }

    const products = await qb
      .orderBy('product.recommendationScore', 'DESC')
      .addOrderBy('product.rating', 'DESC')
      .addOrderBy('product.salesCount', 'DESC')
      .take(limit)
      .getMany();

    return products.map(p => ({
      ...p,
      recommendationReason: this.getPopularReason(p),
    }));
  }

  private getPopularReason(product: Product): string {
    if (product.recommendationScore > 80) return 'Staff pick';
    if (product.rating >= 4.5) return 'Highly rated';
    if (product.salesCount > 50) return 'Popular choice';
    if (this.getDaysSince(product.createdAt) <= 7) return 'New arrival';
    return 'Recommended';
  }

  /**
   * Track a product view
   */
  async trackProductView(userId: string, productId: string, category?: string): Promise<void> {
    try {
      const preferences = await this.getOrCreatePreferences(userId);

      // Add to recently viewed (keep last 50)
      const recentlyViewed = preferences.recentlyViewed || [];
      const filtered = recentlyViewed.filter(id => id !== productId);
      filtered.unshift(productId);
      preferences.recentlyViewed = filtered.slice(0, 50);

      // Increment view count
      preferences.totalViews = (preferences.totalViews || 0) + 1;

      // Boost category score slightly for views
      if (category) {
        const cat = category.toLowerCase();
        preferences.categoryScores[cat] = (preferences.categoryScores[cat] || 0) + 0.1;
      }

      await this.preferenceRepository.save(preferences);
    } catch (error) {
      this.logger.error(`Error tracking product view: ${error.message}`);
    }
  }

  /**
   * Update preferences from a completed order
   */
  async updatePreferencesFromOrder(userId: string, order: Order): Promise<void> {
    try {
      const preferences = await this.getOrCreatePreferences(userId);
      
      const items = order.items || [];
      let totalPrice = 0;

      for (const item of items) {
        // Update category scores (stronger signal than views)
        const product = await this.productRepository.findOne({ where: { id: item.productId } });
        if (product?.category) {
          const cat = product.category.toLowerCase();
          preferences.categoryScores[cat] = (preferences.categoryScores[cat] || 0) + item.quantity;
        }

        // Update favorite farmers
        if (item.farmerId) {
          preferences.favoriteFarmers[item.farmerId] = 
            (preferences.favoriteFarmers[item.farmerId] || 0) + 1;
        }

        totalPrice += item.price * item.quantity;
      }

      // Update purchase count
      preferences.totalPurchases = (preferences.totalPurchases || 0) + 1;

      // Update price range preferences
      const avgItemPrice = totalPrice / Math.max(items.length, 1);
      if (!preferences.avgPurchasePrice) {
        preferences.avgPurchasePrice = avgItemPrice;
        preferences.minPurchasePrice = avgItemPrice;
        preferences.maxPurchasePrice = avgItemPrice;
      } else {
        // Moving average
        const purchases = preferences.totalPurchases;
        preferences.avgPurchasePrice = 
          (Number(preferences.avgPurchasePrice) * (purchases - 1) + avgItemPrice) / purchases;
        preferences.minPurchasePrice = 
          Math.min(Number(preferences.minPurchasePrice), avgItemPrice);
        preferences.maxPurchasePrice = 
          Math.max(Number(preferences.maxPurchasePrice), avgItemPrice);
      }

      await this.preferenceRepository.save(preferences);
    } catch (error) {
      this.logger.error(`Error updating preferences from order: ${error.message}`);
    }
  }

  /**
   * Get "Users who bought X also bought Y" recommendations
   */
  async getSimilarPurchases(productId: string, limit = 10): Promise<Product[]> {
    try {
      // Find orders containing this product
      const ordersWithProduct = await this.orderRepository
        .createQueryBuilder('order')
        .where(`order.items @> :item`, { 
          item: JSON.stringify([{ productId }]) 
        })
        .select('order.buyerId')
        .getMany();

      if (ordersWithProduct.length === 0) return [];

      const buyerIds = ordersWithProduct.map(o => o.buyerId);

      // Find other products these buyers purchased
      const otherOrders = await this.orderRepository
        .createQueryBuilder('order')
        .where('order.buyerId IN (:...buyerIds)', { buyerIds })
        .getMany();

      // Count product occurrences
      const productCounts: Record<string, number> = {};
      for (const order of otherOrders) {
        for (const item of order.items || []) {
          if (item.productId !== productId) {
            productCounts[item.productId] = (productCounts[item.productId] || 0) + 1;
          }
        }
      }

      // Get top products
      const sortedProductIds = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      if (sortedProductIds.length === 0) return [];

      return this.productRepository.find({
        where: {
          id: In(sortedProductIds),
          isAvailable: true,
          approvalStatus: ProductApprovalStatus.APPROVED,
        },
        relations: ['farmer'],
      });
    } catch (error) {
      this.logger.error(`Error getting similar purchases: ${error.message}`);
      return [];
    }
  }

  /**
   * Get or create user preferences
   */
  private async getOrCreatePreferences(userId: string): Promise<UserPreference> {
    let preferences = await this.preferenceRepository.findOne({ where: { userId } });
    
    if (!preferences) {
      preferences = this.preferenceRepository.create({
        userId,
        categoryScores: {},
        recentlyViewed: [],
        favoriteFarmers: {},
        totalPurchases: 0,
        totalViews: 0,
      });
      await this.preferenceRepository.save(preferences);
    }

    return preferences;
  }

  /**
   * Get user's preference profile (for debugging/admin)
   */
  async getUserPreferences(userId: string): Promise<UserPreference | null> {
    return this.preferenceRepository.findOne({ where: { userId } });
  }

  /**
   * Helper to calculate days since a date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Rebuild preferences from order history (for existing users)
   */
  async rebuildUserPreferences(userId: string): Promise<void> {
    try {
      // Get all completed orders for the user
      const orders = await this.orderRepository.find({
        where: { 
          buyerId: userId,
          status: In(['completed', 'delivered']),
        },
        order: { createdAt: 'ASC' },
      });

      // Reset preferences
      let preferences = await this.preferenceRepository.findOne({ where: { userId } });
      if (!preferences) {
        preferences = this.preferenceRepository.create({ userId });
      }

      preferences.categoryScores = {};
      preferences.favoriteFarmers = {};
      preferences.totalPurchases = 0;
      preferences.avgPurchasePrice = 0;
      preferences.minPurchasePrice = 0;
      preferences.maxPurchasePrice = 0;

      // Process each order
      for (const order of orders) {
        await this.updatePreferencesFromOrder(userId, order);
      }

      this.logger.log(`Rebuilt preferences for user ${userId} from ${orders.length} orders`);
    } catch (error) {
      this.logger.error(`Error rebuilding preferences: ${error.message}`);
    }
  }
}
