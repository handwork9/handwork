import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewType, Order, User, Rider, FarmerProfile } from '../database/entities';
import { OrderStatus } from '../common/enums';
import { CreateReviewDto, ReviewResponseDto, ReviewStatsDto } from './dto';
import { ContentModerationService } from '../admin/content-moderation.service';
import { ContentType } from '../database/entities/content-moderation.entity';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Rider)
    private riderRepository: Repository<Rider>,
    @InjectRepository(FarmerProfile)
    private farmerProfileRepository: Repository<FarmerProfile>,
    @Inject(forwardRef(() => ContentModerationService))
    private moderationService: ContentModerationService,
  ) {}

  /**
   * Submit a rating for a farmer
   */
  async rateFarmer(
    orderId: string,
    buyerId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['buyer'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only rate orders you placed');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('You can only rate after order is delivered');
    }

    if (order.hasRatedFarmer) {
      throw new BadRequestException('You have already rated the farmer for this order');
    }

    // Get the farmer ID from order items (first item's farmerId)
    const farmerId = order.items[0]?.farmerId;
    if (!farmerId) {
      throw new BadRequestException('No farmer associated with this order');
    }

    // Create the review
    const review = this.reviewRepository.create({
      orderId,
      reviewerId: buyerId,
      revieweeId: farmerId,
      type: ReviewType.FARMER,
      rating: dto.rating,
      comment: dto.comment,
      tags: dto.tags,
      isAnonymous: dto.isAnonymous || false,
    });

    await this.reviewRepository.save(review);

    // Submit review for moderation if it has a comment
    if (dto.comment) {
      try {
        await this.moderationService.submitForModeration({
          contentType: ContentType.REVIEW,
          contentId: review.id,
          authorId: buyerId,
          title: `Farmer Review - ${dto.rating} stars`,
          contentPreview: dto.comment,
          contentSnapshot: {
            rating: dto.rating,
            comment: dto.comment,
            tags: dto.tags,
            orderId,
            farmerId,
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to submit review ${review.id} for moderation: ${error.message}`);
      }
    }

    // Update order
    order.hasRatedFarmer = true;
    order.farmerRating = dto.rating;
    await this.orderRepository.save(order);

    // Update farmer's average rating
    await this.updateFarmerRating(farmerId);

    this.logger.log(`Farmer ${farmerId} rated ${dto.rating} stars for order ${orderId}`);

    return this.transformReview(review);
  }

  /**
   * Submit a rating for a rider
   */
  async rateRider(
    orderId: string,
    buyerId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['buyer', 'assignedRider'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only rate orders you placed');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('You can only rate after order is delivered');
    }

    if (order.hasRatedRider) {
      throw new BadRequestException('You have already rated the rider for this order');
    }

    if (!order.assignedRiderId) {
      throw new BadRequestException('No rider assigned to this order');
    }

    // Create the review
    const review = this.reviewRepository.create({
      orderId,
      reviewerId: buyerId,
      revieweeId: order.assignedRiderId,
      type: ReviewType.RIDER,
      rating: dto.rating,
      comment: dto.comment,
      tags: dto.tags,
      isAnonymous: dto.isAnonymous || false,
    });

    await this.reviewRepository.save(review);

    // Submit review for moderation if it has a comment
    if (dto.comment) {
      try {
        await this.moderationService.submitForModeration({
          contentType: ContentType.REVIEW,
          contentId: review.id,
          authorId: buyerId,
          title: `Rider Review - ${dto.rating} stars`,
          contentPreview: dto.comment,
          contentSnapshot: {
            rating: dto.rating,
            comment: dto.comment,
            tags: dto.tags,
            orderId,
            riderId: order.assignedRiderId,
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to submit review ${review.id} for moderation: ${error.message}`);
      }
    }

    // Update order
    order.hasRatedRider = true;
    order.riderRating = dto.rating;
    await this.orderRepository.save(order);

    // Update rider's average rating
    await this.updateRiderRating(order.assignedRiderId);

    this.logger.log(`Rider ${order.assignedRiderId} rated ${dto.rating} stars for order ${orderId}`);

    return this.transformReview(review);
  }

  /**
   * Get reviews for a farmer
   */
  async getFarmerReviews(
    farmerId: string,
    page = 1,
    limit = 10,
  ): Promise<{ reviews: ReviewResponseDto[]; total: number }> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { revieweeId: farmerId, type: ReviewType.FARMER, isVisible: true },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reviews: reviews.map((r) => this.transformReview(r)),
      total,
    };
  }

  /**
   * Get reviews for a rider
   */
  async getRiderReviews(
    riderId: string,
    page = 1,
    limit = 10,
  ): Promise<{ reviews: ReviewResponseDto[]; total: number }> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { revieweeId: riderId, type: ReviewType.RIDER, isVisible: true },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reviews: reviews.map((r) => this.transformReview(r)),
      total,
    };
  }

  /**
   * Get rating stats for a farmer
   */
  async getFarmerStats(farmerId: string): Promise<ReviewStatsDto> {
    return this.getStats(farmerId, ReviewType.FARMER);
  }

  /**
   * Get rating stats for a rider
   */
  async getRiderStats(riderId: string): Promise<ReviewStatsDto> {
    return this.getStats(riderId, ReviewType.RIDER);
  }

  /**
   * Respond to a review (for farmers/riders)
   */
  async respondToReview(
    reviewId: string,
    responderId: string,
    response: string,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.revieweeId !== responderId) {
      throw new ForbiddenException('You can only respond to reviews about you');
    }

    if (review.response) {
      throw new BadRequestException('You have already responded to this review');
    }

    review.response = response;
    review.respondedAt = new Date();
    await this.reviewRepository.save(review);

    return this.transformReview(review);
  }

  /**
   * Check if user can rate an order
   */
  async canRateOrder(orderId: string, buyerId: string): Promise<{
    canRateFarmer: boolean;
    canRateRider: boolean;
    hasRider: boolean;
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, buyerId },
    });

    if (!order || order.status !== OrderStatus.DELIVERED) {
      return { canRateFarmer: false, canRateRider: false, hasRider: false };
    }

    return {
      canRateFarmer: !order.hasRatedFarmer,
      canRateRider: !order.hasRatedRider && !!order.assignedRiderId,
      hasRider: !!order.assignedRiderId,
    };
  }

  /**
   * Get pending ratings for a user's orders
   */
  async getPendingRatings(buyerId: string): Promise<any[]> {
    const orders = await this.orderRepository.find({
      where: {
        buyerId,
        status: OrderStatus.DELIVERED,
      },
      order: { deliveredAt: 'DESC' },
      take: 10,
    });

    const pendingRatings = [];

    for (const order of orders) {
      if (!order.hasRatedFarmer || (!order.hasRatedRider && order.assignedRiderId)) {
        pendingRatings.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          deliveredAt: order.deliveredAt,
          canRateFarmer: !order.hasRatedFarmer,
          canRateRider: !order.hasRatedRider && !!order.assignedRiderId,
          farmerName: order.items[0]?.farmerName,
        });
      }
    }

    return pendingRatings;
  }

  // Private helper methods

  private async getStats(revieweeId: string, type: ReviewType): Promise<ReviewStatsDto> {
    const reviews = await this.reviewRepository.find({
      where: { revieweeId, type, isVisible: true },
      select: ['rating'],
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      ratingDistribution[r.rating as keyof typeof ratingDistribution]++;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
    };
  }

  private async updateFarmerRating(farmerId: string): Promise<void> {
    const stats = await this.getStats(farmerId, ReviewType.FARMER);
    
    await this.farmerProfileRepository.update(
      { userId: farmerId },
      { 
        rating: stats.averageRating,
        totalReviews: stats.totalReviews,
      },
    );
  }

  private async updateRiderRating(riderId: string): Promise<void> {
    const stats = await this.getStats(riderId, ReviewType.RIDER);
    
    await this.riderRepository.update(
      { id: riderId },
      { rating: stats.averageRating },
    );
  }

  /**
   * Get all reviews (admin)
   */
  async getAllReviews(page = 1, limit = 20, rating?: number) {
    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoinAndSelect('review.order', 'order');

    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    const [reviews, total] = await queryBuilder
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      reviews: reviews.map(r => ({
        id: r.id,
        userId: r.reviewerId,
        userName: r.reviewer?.name || 'Anonymous',
        userAvatar: r.reviewer?.avatar || null,
        productId: r.order?.items?.[0]?.productId || null,
        productName: r.order?.items?.[0]?.title || 'N/A',
        productImage: r.order?.items?.[0]?.image || null,
        rating: r.rating,
        comment: r.comment,
        helpful: 0,
        status: 'approved',
        createdAt: r.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get admin stats for reviews
   */
  async getAdminStats() {
    const totalReviews = await this.reviewRepository.count();
    
    const avgResult = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .getRawOne();
    
    const averageRating = parseFloat(avgResult?.avg || '0').toFixed(1);

    // Get rating distribution
    const distribution = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .groupBy('review.rating')
      .getRawMany();

    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(d => {
      ratingDistribution[d.rating] = parseInt(d.count);
    });

    return {
      totalReviews,
      averageRating: parseFloat(averageRating),
      ratingDistribution,
      promptsShown: 0, // App prompts tracked client-side
      promptsAccepted: 0,
      conversionRate: 0,
    };
  }

  private transformReview(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      orderId: review.orderId,
      reviewerId: review.reviewerId,
      reviewerName: review.isAnonymous ? 'Anonymous' : (review.reviewer?.name || 'User'),
      revieweeId: review.revieweeId,
      type: review.type,
      rating: review.rating,
      comment: review.comment,
      tags: review.tags,
      isAnonymous: review.isAnonymous,
      response: review.response,
      respondedAt: review.respondedAt,
      createdAt: review.createdAt,
    };
  }
}
