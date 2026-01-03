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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BundlesService, CreateBundleDto, UpdateBundleDto } from './bundles.service';

@Controller('bundles')
@UseGuards(JwtAuthGuard)
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  /**
   * Get active bundles (for buyers)
   * GET /bundles?state=Lagos&city=Ikeja
   */
  @Get()
  async getActiveBundles(
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
  ) {
    const bundles = await this.bundlesService.getActiveBundles(
      state,
      city,
      limit ? parseInt(limit) : 20,
    );

    return {
      success: true,
      data: bundles.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description,
        items: b.items,
        originalTotal: b.originalTotal,
        bundlePrice: b.bundlePrice,
        discountPercentage: b.discountPercentage,
        images: b.images,
        stock: b.stock,
        farmerName: b.farmer?.name || 'Unknown',
        farmerId: b.farmerId,
        pickupState: b.pickupState,
        pickupCity: b.pickupCity,
        startDate: b.startDate,
        endDate: b.endDate,
      })),
    };
  }

  /**
   * Get bundle by ID
   * GET /bundles/:id
   */
  @Get(':id')
  async getBundleById(@Param('id') id: string) {
    const bundle = await this.bundlesService.getBundleById(id);

    return {
      success: true,
      data: {
        id: bundle.id,
        title: bundle.title,
        description: bundle.description,
        items: bundle.items,
        originalTotal: bundle.originalTotal,
        bundlePrice: bundle.bundlePrice,
        discountPercentage: bundle.discountPercentage,
        images: bundle.images,
        stock: bundle.stock,
        salesCount: bundle.salesCount,
        farmerName: bundle.farmer?.name || 'Unknown',
        farmerId: bundle.farmerId,
        pickupState: bundle.pickupState,
        pickupCity: bundle.pickupCity,
        startDate: bundle.startDate,
        endDate: bundle.endDate,
        createdAt: bundle.createdAt,
      },
    };
  }

  /**
   * Get farmer's bundles
   * GET /bundles/farmer/my-bundles
   */
  @Get('farmer/my-bundles')
  async getMyBundles(@Req() req: any) {
    const bundles = await this.bundlesService.getFarmerBundles(req.user.userId);

    return {
      success: true,
      data: bundles,
    };
  }

  /**
   * Create a new bundle (farmers only)
   * POST /bundles
   */
  @Post()
  async createBundle(@Req() req: any, @Body() dto: CreateBundleDto) {
    const bundle = await this.bundlesService.createBundle(req.user.userId, dto);

    return {
      success: true,
      data: bundle,
      message: 'Bundle created successfully',
    };
  }

  /**
   * Update a bundle (farmers only)
   * PUT /bundles/:id
   */
  @Put(':id')
  async updateBundle(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBundleDto,
  ) {
    const bundle = await this.bundlesService.updateBundle(id, req.user.userId, dto);

    return {
      success: true,
      data: bundle,
      message: 'Bundle updated successfully',
    };
  }

  /**
   * Delete a bundle (farmers only)
   * DELETE /bundles/:id
   */
  @Delete(':id')
  async deleteBundle(@Req() req: any, @Param('id') id: string) {
    await this.bundlesService.deleteBundle(id, req.user.userId);

    return {
      success: true,
      message: 'Bundle deleted successfully',
    };
  }
}
