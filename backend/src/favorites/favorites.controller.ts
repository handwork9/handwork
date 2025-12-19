import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, Product } from '../database/entities';
import { AddFavoriteDto } from './dto';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user favorites with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'List of favorite products',
  })
  async getFavorites(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.favoritesService.getFavorites(user.id, Number(page), Number(limit));
  }

  @Get('ids')
  @ApiOperation({ summary: 'Get all favorite product IDs' })
  @ApiResponse({
    status: 200,
    description: 'List of favorite product IDs',
  })
  async getFavoriteIds(@CurrentUser() user: User): Promise<{ productIds: string[] }> {
    const productIds = await this.favoritesService.getFavoriteProductIds(user.id);
    return { productIds };
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total favorites count' })
  @ApiResponse({
    status: 200,
    description: 'Favorites count',
  })
  async getFavoritesCount(@CurrentUser() user: User): Promise<{ count: number }> {
    const count = await this.favoritesService.getFavoritesCount(user.id);
    return { count };
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if a product is favorited' })
  @ApiParam({ name: 'productId', description: 'Product ID to check' })
  @ApiResponse({
    status: 200,
    description: 'Favorite status',
  })
  async checkFavorite(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ): Promise<{ isFavorite: boolean }> {
    const isFavorite = await this.favoritesService.isFavorite(user.id, productId);
    return { isFavorite };
  }

  @Post('check-multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check multiple products favorite status' })
  @ApiResponse({
    status: 200,
    description: 'Map of product IDs to favorite status',
  })
  async checkMultipleFavorites(
    @CurrentUser() user: User,
    @Body() body: { productIds: string[] },
  ): Promise<{ favorites: Record<string, boolean> }> {
    const favorites = await this.favoritesService.checkMultipleFavorites(user.id, body.productIds);
    return { favorites };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product to favorites' })
  @ApiResponse({
    status: 201,
    description: 'Product added to favorites',
  })
  @ApiResponse({
    status: 409,
    description: 'Product already in favorites',
  })
  async addFavorite(
    @CurrentUser() user: User,
    @Body() dto: AddFavoriteDto,
  ) {
    await this.favoritesService.addFavorite(user.id, dto.productId);
    return { message: 'Product added to favorites', productId: dto.productId };
  }

  @Post('toggle/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle product favorite status' })
  @ApiParam({ name: 'productId', description: 'Product ID to toggle' })
  @ApiResponse({
    status: 200,
    description: 'Favorite status toggled',
  })
  async toggleFavorite(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ): Promise<{ isFavorite: boolean; message: string }> {
    const result = await this.favoritesService.toggleFavorite(user.id, productId);
    return {
      ...result,
      message: result.isFavorite ? 'Added to favorites' : 'Removed from favorites',
    };
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove product from favorites' })
  @ApiParam({ name: 'productId', description: 'Product ID to remove' })
  @ApiResponse({
    status: 200,
    description: 'Product removed from favorites',
  })
  async removeFavorite(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ) {
    await this.favoritesService.removeFavorite(user.id, productId);
    return { message: 'Product removed from favorites', productId };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all favorites' })
  @ApiResponse({
    status: 200,
    description: 'All favorites cleared',
  })
  async clearAllFavorites(@CurrentUser() user: User) {
    await this.favoritesService.clearAllFavorites(user.id);
    return { message: 'All favorites cleared' };
  }
}
