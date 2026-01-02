import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { PickupLocationsService, CreatePickupLocationDto, UpdatePickupLocationDto, FindPickupLocationsDto } from './pickup-locations.service';
import { PickupLocationType, PickupLocationStatus } from '../database/entities/pickup-location.entity';

@Controller('pickup-locations')
export class PickupLocationsController {
  constructor(private readonly pickupLocationsService: PickupLocationsService) {}

  /**
   * Get all pickup locations (public)
   * GET /api/v1/pickup-locations
   */
  @Get()
  async findAll(
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('type') type?: PickupLocationType,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('hasRefrigeration') hasRefrigeration?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const dto: FindPickupLocationsDto = {
      city,
      state,
      type,
      status: PickupLocationStatus.ACTIVE, // Public API only shows active
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : 10,
      hasRefrigeration: hasRefrigeration === 'true' ? true : hasRefrigeration === 'false' ? false : undefined,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 50) : 20,
    };

    const result = await this.pickupLocationsService.findAll(dto);
    
    return {
      success: true,
      data: result.pickupLocations,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Get nearby pickup locations
   * GET /api/v1/pickup-locations/nearby
   */
  @Get('nearby')
  async findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('type') type?: PickupLocationType,
    @Query('hasRefrigeration') hasRefrigeration?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!latitude || !longitude) {
      return {
        success: false,
        error: 'Latitude and longitude are required',
      };
    }

    const result = await this.pickupLocationsService.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      radiusKm ? parseFloat(radiusKm) : 10,
      {
        type,
        hasRefrigeration: hasRefrigeration === 'true' ? true : hasRefrigeration === 'false' ? false : undefined,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? Math.min(parseInt(limit, 10), 50) : 20,
      },
    );

    return {
      success: true,
      data: result.pickupLocations,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Get pickup location by code (public)
   * GET /api/v1/pickup-locations/code/:code
   */
  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    const pickupLocation = await this.pickupLocationsService.findByCode(code);
    return {
      success: true,
      data: pickupLocation,
    };
  }

  /**
   * Get pickup location by ID (public)
   * GET /api/v1/pickup-locations/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const pickupLocation = await this.pickupLocationsService.findOne(id);
    return {
      success: true,
      data: pickupLocation,
    };
  }

  /**
   * Create a new pickup location (admin only)
   * POST /api/v1/pickup-locations
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async create(@Body() dto: CreatePickupLocationDto) {
    const pickupLocation = await this.pickupLocationsService.create(dto);
    return {
      success: true,
      data: pickupLocation,
    };
  }

  /**
   * Update a pickup location (admin only)
   * PATCH /api/v1/pickup-locations/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdatePickupLocationDto) {
    const pickupLocation = await this.pickupLocationsService.update(id, dto);
    return {
      success: true,
      data: pickupLocation,
    };
  }

  /**
   * Delete a pickup location (admin only)
   * DELETE /api/v1/pickup-locations/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async remove(@Param('id') id: string) {
    await this.pickupLocationsService.remove(id);
    return {
      success: true,
      message: 'Pickup location deleted successfully',
    };
  }

  /**
   * Check availability of a pickup location
   * GET /api/v1/pickup-locations/:id/availability
   */
  @Get(':id/availability')
  async checkAvailability(@Param('id') id: string) {
    const available = await this.pickupLocationsService.isAvailable(id);
    const location = await this.pickupLocationsService.findOne(id);
    
    return {
      success: true,
      data: {
        available,
        status: location.status,
        currentOccupancy: location.currentOccupancy,
        totalCapacity: location.totalCapacity,
      },
    };
  }
}
