import apiClient from './apiClient';

// Review Tags
export const FARMER_REVIEW_TAGS = [
  'Fresh Products',
  'Great Quality',
  'Fair Prices',
  'Good Packaging',
  'Accurate Description',
  'Fast Preparation',
  'Friendly Service',
  'Would Buy Again',
] as const;

export const RIDER_REVIEW_TAGS = [
  'Fast Delivery',
  'Careful Handling',
  'Professional',
  'Friendly',
  'On Time',
  'Good Communication',
  'Safe Driver',
  'Excellent Service',
] as const;

export type FarmerReviewTag = typeof FARMER_REVIEW_TAGS[number];
export type RiderReviewTag = typeof RIDER_REVIEW_TAGS[number];

export interface CreateReviewDto {
  rating: number;
  comment?: string;
  tags?: string[];
  isAnonymous?: boolean;
}

export interface ReviewResponse {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  type: 'farmer' | 'rider';
  rating: number;
  comment?: string;
  tags?: string[];
  isAnonymous: boolean;
  response?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CanRateResponse {
  canRateFarmer: boolean;
  canRateRider: boolean;
  hasRider: boolean;
}

export interface PendingRating {
  orderId: string;
  orderNumber: string;
  deliveredAt: string;
  canRateFarmer: boolean;
  canRateRider: boolean;
  farmerName?: string;
}

class ReviewService {
  /**
   * Submit a rating for a farmer
   */
  async rateFarmer(orderId: string, data: CreateReviewDto): Promise<ReviewResponse> {
    return apiClient.post<ReviewResponse>(`/reviews/farmer/${orderId}`, data);
  }

  /**
   * Submit a rating for a rider
   */
  async rateRider(orderId: string, data: CreateReviewDto): Promise<ReviewResponse> {
    return apiClient.post<ReviewResponse>(`/reviews/rider/${orderId}`, data);
  }

  /**
   * Get reviews for a farmer
   */
  async getFarmerReviews(
    farmerId: string,
    page = 1,
    limit = 10
  ): Promise<{ reviews: ReviewResponse[]; total: number }> {
    return apiClient.get<{ reviews: ReviewResponse[]; total: number }>(`/reviews/farmer/${farmerId}`, {
      params: { page, limit },
    });
  }

  /**
   * Get reviews for a rider
   */
  async getRiderReviews(
    riderId: string,
    page = 1,
    limit = 10
  ): Promise<{ reviews: ReviewResponse[]; total: number }> {
    return apiClient.get<{ reviews: ReviewResponse[]; total: number }>(`/reviews/rider/${riderId}`, {
      params: { page, limit },
    });
  }

  /**
   * Get farmer rating stats
   */
  async getFarmerStats(farmerId: string): Promise<ReviewStats> {
    return apiClient.get<ReviewStats>(`/reviews/farmer/${farmerId}/stats`);
  }

  /**
   * Get rider rating stats
   */
  async getRiderStats(riderId: string): Promise<ReviewStats> {
    return apiClient.get<ReviewStats>(`/reviews/rider/${riderId}/stats`);
  }

  /**
   * Check if user can rate an order
   */
  async canRateOrder(orderId: string): Promise<CanRateResponse> {
    return apiClient.get<CanRateResponse>(`/reviews/can-rate/${orderId}`);
  }

  /**
   * Get pending ratings for current user
   */
  async getPendingRatings(): Promise<PendingRating[]> {
    return apiClient.get<PendingRating[]>('/reviews/pending');
  }

  /**
   * Respond to a review (for farmers/riders)
   */
  async respondToReview(reviewId: string, responseText: string): Promise<ReviewResponse> {
    return apiClient.patch<ReviewResponse>(`/reviews/${reviewId}/respond`, { response: responseText });
  }
}

export const reviewService = new ReviewService();
export default reviewService;
