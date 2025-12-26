import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { UserRole } from '../common/enums';

@ApiTags('Farmers')
@Controller('farmers')
export class FarmersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  @Public()
  @Get('profile/:farmerId')
  @ApiOperation({ summary: 'Get farmer profile by ID (public)' })
  @ApiParam({ name: 'farmerId', description: 'Farmer ID' })
  async getFarmerProfile(@Param('farmerId') farmerId: string) {
    const farmer = await this.usersService.findByIdWithProfile(farmerId);
    
    if (!farmer || farmer.role !== UserRole.FARMER) {
      throw new NotFoundException('Farmer not found');
    }

    // Return only public farmer info
    return {
      id: farmer.id,
      name: farmer.name,
      email: farmer.email,
      phone: farmer.phone,
      state: farmer.state,
      city: farmer.city,
      rating: farmer.farmerProfile?.rating || 0,
      reviewCount: farmer.farmerProfile?.totalReviews || 0,
      joinedDate: farmer.createdAt,
      bio: farmer.farmerProfile?.primaryProducts || '',
      avatar: farmer.avatar,
      farmName: farmer.farmerProfile?.farmName,
      farmType: farmer.farmerProfile?.farmType,
      totalProducts: farmer.farmerProfile?.totalProducts || 0,
      totalSales: farmer.farmerProfile?.totalSales || 0,
    };
  }

  @Public()
  @Get('profile/:farmerId/products')
  @ApiOperation({ summary: 'Get farmer products by farmer ID (public)' })
  @ApiParam({ name: 'farmerId', description: 'Farmer ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async getFarmerProducts(
    @Param('farmerId') farmerId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    // First verify farmer exists and is actually a farmer
    const farmer = await this.usersService.findById(farmerId);
    
    if (!farmer || farmer.role !== UserRole.FARMER) {
      throw new NotFoundException('Farmer not found');
    }

    return this.productsService.findByFarmer(farmerId, page || 1, pageSize || 20);
  }
}
