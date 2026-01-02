import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import {
  PickupLocation,
  PickupLocationType,
  PickupLocationStatus,
} from '../database/entities/pickup-location.entity';

export interface CreatePickupLocationDto {
  name: string;
  code: string;
  type?: PickupLocationType;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  directions?: string;
  description?: string;
  operatingHours?: any;
  images?: string[];
  totalCapacity?: number;
  storageFee?: number;
  freeStorageDays?: number;
  deliveryDiscount?: number;
  deliveryDiscountPercent?: number;
  partnerName?: string;
  partnerId?: string;
  hasRefrigeration?: boolean;
  hasParking?: boolean;
  isWheelchairAccessible?: boolean;
  acceptsCash?: boolean;
}

export interface UpdatePickupLocationDto extends Partial<CreatePickupLocationDto> {
  status?: PickupLocationStatus;
  currentOccupancy?: number;
}

export interface FindPickupLocationsDto {
  city?: string;
  state?: string;
  type?: PickupLocationType;
  status?: PickupLocationStatus;
  includeAllStatuses?: boolean; // For admin to see all statuses
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  hasRefrigeration?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class PickupLocationsService {
  constructor(
    @InjectRepository(PickupLocation)
    private readonly pickupLocationRepository: Repository<PickupLocation>,
  ) {}

  /**
   * Create a new pickup location
   */
  async create(dto: CreatePickupLocationDto): Promise<PickupLocation> {
    const pickupLocation = this.pickupLocationRepository.create({
      ...dto,
      status: PickupLocationStatus.ACTIVE,
    });
    return this.pickupLocationRepository.save(pickupLocation);
  }

  /**
   * Find pickup locations with filtering and proximity search
   */
  async findAll(dto: FindPickupLocationsDto): Promise<{
    pickupLocations: PickupLocation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      city,
      state,
      type,
      status,
      includeAllStatuses,
      latitude,
      longitude,
      radiusKm = 10,
      hasRefrigeration,
      search,
      page = 1,
      limit = 20,
    } = dto;

    // Build where conditions
    const where: FindOptionsWhere<PickupLocation> = {};
    
    if (city) where.city = city;
    if (state) where.state = state;
    if (type) where.type = type;
    
    // Handle status filtering
    if (status) {
      where.status = status;
    } else if (!includeAllStatuses) {
      // Only default to active if not explicitly including all statuses
      where.status = PickupLocationStatus.ACTIVE;
    }
    // If includeAllStatuses is true and no status specified, don't filter by status
    
    if (hasRefrigeration !== undefined) where.hasRefrigeration = hasRefrigeration;

    // For proximity search with lat/lng, we need a raw query
    if (latitude && longitude) {
      return this.findNearby(latitude, longitude, radiusKm, dto);
    }

    // Standard query with pagination
    const queryBuilder = this.pickupLocationRepository.createQueryBuilder('pl');
    
    queryBuilder.where(where);

    if (search) {
      queryBuilder.andWhere(
        '(pl.name ILIKE :search OR pl.address ILIKE :search OR pl.city ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('pl.popularityScore', 'DESC')
      .addOrderBy('pl.avgRating', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [pickupLocations, total] = await queryBuilder.getManyAndCount();

    return {
      pickupLocations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find pickup locations near a specific location
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    dto?: Partial<FindPickupLocationsDto>,
  ): Promise<{
    pickupLocations: (PickupLocation & { distanceKm: number })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { city, state, type, hasRefrigeration, search, page = 1, limit = 20 } = dto || {};

    // Haversine formula for distance calculation
    const queryBuilder = this.pickupLocationRepository
      .createQueryBuilder('pl')
      .addSelect(
        `(6371 * acos(
          cos(radians(:lat)) * cos(radians(pl.latitude)) *
          cos(radians(pl.longitude) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(pl.latitude))
        ))`,
        'distanceKm',
      )
      .setParameters({ lat: latitude, lng: longitude })
      .where('pl.status = :status', { status: PickupLocationStatus.ACTIVE })
      .andWhere(
        `(6371 * acos(
          cos(radians(:lat)) * cos(radians(pl.latitude)) *
          cos(radians(pl.longitude) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(pl.latitude))
        )) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      );

    if (city) queryBuilder.andWhere('pl.city = :city', { city });
    if (state) queryBuilder.andWhere('pl.state = :state', { state });
    if (type) queryBuilder.andWhere('pl.type = :type', { type });
    if (hasRefrigeration !== undefined) {
      queryBuilder.andWhere('pl.hasRefrigeration = :hasRefrigeration', { hasRefrigeration });
    }
    if (search) {
      queryBuilder.andWhere(
        '(pl.name ILIKE :search OR pl.address ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Count total before pagination
    const countQuery = queryBuilder.clone();
    const total = await countQuery.getCount();

    // Apply pagination and ordering
    queryBuilder
      .orderBy('distanceKm', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const rawResults = await queryBuilder.getRawAndEntities();
    
    // Merge distance into entities
    const pickupLocations = rawResults.entities.map((entity, index) => ({
      ...entity,
      distanceKm: parseFloat(rawResults.raw[index]?.distanceKm || '0'),
    }));

    return {
      pickupLocations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single pickup location by ID
   */
  async findOne(id: string): Promise<PickupLocation> {
    const pickupLocation = await this.pickupLocationRepository.findOne({
      where: { id },
    });
    
    if (!pickupLocation) {
      throw new NotFoundException(`Pickup location with ID ${id} not found`);
    }
    
    return pickupLocation;
  }

  /**
   * Find a pickup location by code
   */
  async findByCode(code: string): Promise<PickupLocation> {
    const pickupLocation = await this.pickupLocationRepository.findOne({
      where: { code },
    });
    
    if (!pickupLocation) {
      throw new NotFoundException(`Pickup location with code ${code} not found`);
    }
    
    return pickupLocation;
  }

  /**
   * Update a pickup location
   */
  async update(id: string, dto: UpdatePickupLocationDto): Promise<PickupLocation> {
    const pickupLocation = await this.findOne(id);
    
    Object.assign(pickupLocation, dto);
    
    return this.pickupLocationRepository.save(pickupLocation);
  }

  /**
   * Delete a pickup location (soft delete by setting status to inactive)
   */
  async remove(id: string): Promise<void> {
    const pickupLocation = await this.findOne(id);
    pickupLocation.status = PickupLocationStatus.INACTIVE;
    await this.pickupLocationRepository.save(pickupLocation);
  }

  /**
   * Hard delete a pickup location
   */
  async hardRemove(id: string): Promise<void> {
    const pickupLocation = await this.findOne(id);
    await this.pickupLocationRepository.remove(pickupLocation);
  }

  /**
   * Increment pickup count (called when order is picked up)
   */
  async incrementPickupCount(id: string): Promise<void> {
    await this.pickupLocationRepository.increment({ id }, 'totalPickups', 1);
    await this.updatePopularityScore(id);
  }

  /**
   * Update occupancy for lockers
   */
  async updateOccupancy(id: string, change: number): Promise<PickupLocation> {
    const location = await this.findOne(id);
    
    location.currentOccupancy = Math.max(0, location.currentOccupancy + change);
    
    // Update status if full
    if (location.totalCapacity > 0 && location.currentOccupancy >= location.totalCapacity) {
      location.status = PickupLocationStatus.FULL;
    } else if (location.status === PickupLocationStatus.FULL && location.currentOccupancy < location.totalCapacity) {
      location.status = PickupLocationStatus.ACTIVE;
    }
    
    return this.pickupLocationRepository.save(location);
  }

  /**
   * Add rating to pickup location
   */
  async addRating(id: string, rating: number): Promise<void> {
    const location = await this.findOne(id);
    
    const newTotalRatings = location.totalRatings + 1;
    const newAvgRating = 
      (location.avgRating * location.totalRatings + rating) / newTotalRatings;
    
    location.totalRatings = newTotalRatings;
    location.avgRating = Math.round(newAvgRating * 100) / 100;
    
    await this.pickupLocationRepository.save(location);
    await this.updatePopularityScore(id);
  }

  /**
   * Update popularity score based on activity
   */
  private async updatePopularityScore(id: string): Promise<void> {
    const location = await this.findOne(id);
    
    // Simple popularity formula: (pickups * 2) + (rating * 20)
    const popularityScore = Math.round(
      (location.totalPickups * 2) + (location.avgRating * 20),
    );
    
    await this.pickupLocationRepository.update(id, { popularityScore });
  }

  /**
   * Get pickup locations for a specific state/city
   */
  async getByLocation(state: string, city?: string): Promise<PickupLocation[]> {
    const where: FindOptionsWhere<PickupLocation> = {
      state,
      status: PickupLocationStatus.ACTIVE,
    };
    
    if (city) where.city = city;
    
    return this.pickupLocationRepository.find({
      where,
      order: { popularityScore: 'DESC' },
    });
  }

  /**
   * Check if a pickup location is available (not full, active)
   */
  async isAvailable(id: string): Promise<boolean> {
    const location = await this.findOne(id);
    
    if (location.status !== PickupLocationStatus.ACTIVE) {
      return false;
    }
    
    if (location.totalCapacity > 0 && location.currentOccupancy >= location.totalCapacity) {
      return false;
    }
    
    return true;
  }
}
