import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsBoolean, IsArray, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Optional comment', required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ description: 'Quick feedback tags', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Submit review anonymously', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}

export class RespondToReviewDto {
  @ApiProperty({ description: 'Response to the review' })
  @IsString()
  response: string;
}

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  reviewerId: string;

  @ApiProperty({ required: false })
  reviewerName?: string;

  @ApiProperty()
  revieweeId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  rating: number;

  @ApiProperty({ required: false })
  comment?: string;

  @ApiProperty({ required: false })
  tags?: string[];

  @ApiProperty()
  isAnonymous: boolean;

  @ApiProperty({ required: false })
  response?: string;

  @ApiProperty({ required: false })
  respondedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class ReviewStatsDto {
  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty({ description: 'Count of reviews per rating (1-5)' })
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Quick feedback tags for farmers
export const FARMER_REVIEW_TAGS = [
  'Fresh products',
  'Good quality',
  'Fair prices',
  'Fast confirmation',
  'Good packaging',
  'Friendly',
  'Accurate description',
  'Would buy again',
];

// Quick feedback tags for riders
export const RIDER_REVIEW_TAGS = [
  'Fast delivery',
  'Careful handling',
  'Friendly',
  'Professional',
  'Good communication',
  'On time',
  'Followed instructions',
  'Polite',
];
