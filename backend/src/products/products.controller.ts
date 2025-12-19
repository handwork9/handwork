import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, QueryProductsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, Public } from '../common/decorators';
import { UserRole } from '../common/enums';
import { User } from '../database/entities/user.entity';
import { RecommendationService } from '../recommendations/recommendation.service';
import { Request } from 'express';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly recommendationService: RecommendationService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'lat', required: false })
  @ApiQuery({ name: 'lng', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'radius', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'searchQuery', required: false })
  async findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFeatured(
    @Query('state') state?: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getFeaturedProducts(state, limit || 10);
  }

  @Public()
  @Get('sponsored')
  @ApiOperation({ summary: 'Get sponsored products from verified/premium sellers' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getSponsored(
    @Query('state') state?: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getSponsoredProducts(state, limit || 12);
  }

  @Public()
  @Get('verified-sellers')
  @ApiOperation({ summary: 'Get products from verified sellers' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getVerifiedSellerProducts(
    @Query('state') state?: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getVerifiedSellerProducts(state, limit || 10);
  }

  @Public()
  @Get('premium-sellers')
  @ApiOperation({ summary: 'Get products from premium sellers' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPremiumSellerProducts(
    @Query('state') state?: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getPremiumSellerProducts(state, limit || 10);
  }

  @Public()
  @Get('promoted')
  @ApiOperation({ summary: 'Get promoted/sponsored products' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPromoted(
    @Query('state') state?: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getPromotedProducts(state, limit || 10);
  }

  @Public()
  @Get('admin-products')
  @ApiOperation({ summary: 'Get admin-curated official store products' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAdminProducts(
    @Query('state') state?: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getAdminProducts(state, limit || 10);
  }

  @Public()
  @Get('recommended')
  @ApiOperation({ summary: 'Get recommended products (personalized if authenticated)' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getRecommended(
    @Query('state') state?: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: User,
  ) {
    // Use personalized recommendations if user is authenticated
    if (user?.id) {
      return this.recommendationService.getPersonalizedRecommendations(
        user.id,
        state,
        limit || 20,
      );
    }
    // Fall back to popular products for anonymous users
    return this.recommendationService.getPopularProducts(state, limit || 20);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby products by location' })
  async getNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getNearbyProducts(lat, lng, radius || 10, limit || 10);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @Get('farmer/my-products')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get farmer own products' })
  async getMyProducts(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findByFarmer(user.id, page || 1, limit || 20);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product (Farmer only)' })
  async create(@CurrentUser() user: User, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a product (Farmer only)' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a product (Farmer only)' })
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    await this.productsService.delete(id, user.id);
    return { message: 'Product deleted successfully' };
  }
}
