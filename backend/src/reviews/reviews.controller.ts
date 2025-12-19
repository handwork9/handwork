import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, RespondToReviewDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest {
  user: { id: string };
}

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Rate a farmer for an order
   * POST /reviews/farmer/:orderId
   */
  @Post('farmer/:orderId')
  async rateFarmer(
    @Param('orderId') orderId: string,
    @Body() dto: CreateReviewDto,
    @Request() req: AuthRequest,
  ) {
    return this.reviewsService.rateFarmer(orderId, req.user.id, dto);
  }

  /**
   * Rate a rider for an order
   * POST /reviews/rider/:orderId
   */
  @Post('rider/:orderId')
  async rateRider(
    @Param('orderId') orderId: string,
    @Body() dto: CreateReviewDto,
    @Request() req: AuthRequest,
  ) {
    return this.reviewsService.rateRider(orderId, req.user.id, dto);
  }

  /**
   * Get reviews for a farmer
   * GET /reviews/farmer/:farmerId
   */
  @Get('farmer/:farmerId')
  async getFarmerReviews(
    @Param('farmerId') farmerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.getFarmerReviews(farmerId, +page, +limit);
  }

  /**
   * Get reviews for a rider
   * GET /reviews/rider/:riderId
   */
  @Get('rider/:riderId')
  async getRiderReviews(
    @Param('riderId') riderId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.getRiderReviews(riderId, +page, +limit);
  }

  /**
   * Get farmer rating stats
   * GET /reviews/farmer/:farmerId/stats
   */
  @Get('farmer/:farmerId/stats')
  async getFarmerStats(@Param('farmerId') farmerId: string) {
    return this.reviewsService.getFarmerStats(farmerId);
  }

  /**
   * Get rider rating stats
   * GET /reviews/rider/:riderId/stats
   */
  @Get('rider/:riderId/stats')
  async getRiderStats(@Param('riderId') riderId: string) {
    return this.reviewsService.getRiderStats(riderId);
  }

  /**
   * Check if user can rate an order
   * GET /reviews/can-rate/:orderId
   */
  @Get('can-rate/:orderId')
  async canRateOrder(@Param('orderId') orderId: string, @Request() req: AuthRequest) {
    return this.reviewsService.canRateOrder(orderId, req.user.id);
  }

  /**
   * Get pending ratings for current user
   * GET /reviews/pending
   */
  @Get('pending')
  async getPendingRatings(@Request() req: AuthRequest) {
    return this.reviewsService.getPendingRatings(req.user.id);
  }

  /**
   * Respond to a review (for farmers/riders)
   * PATCH /reviews/:reviewId/respond
   */
  @Patch(':reviewId/respond')
  async respondToReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: RespondToReviewDto,
    @Request() req: AuthRequest,
  ) {
    return this.reviewsService.respondToReview(reviewId, req.user.id, dto.response);
  }
}
