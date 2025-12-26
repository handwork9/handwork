import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, MoreThanOrEqual, Between, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Rider } from '../database/entities/rider.entity';
import { User } from '../database/entities/user.entity';
import { Order } from '../database/entities/order.entity';
import { FarmerProfile } from '../database/entities/farmer-profile.entity';
import { Product } from '../database/entities/product.entity';
import { RegisterRiderDto, UpdateRiderLocationDto, UpdateRiderStatusDto } from './dto';
import { calculateDistance } from '../common/utils/helpers';
import { UserRole, OrderStatus, VehicleType } from '../common/enums';
import { DispatchGateway } from '../dispatch/dispatch.gateway';
import { WalletService } from '../wallet/wallet.service';

export interface AvailableRider {
  rider: Rider;
  distance: number;
  estimatedMinutes: number;
}

@Injectable()
export class RidersService {
  private readonly logger = new Logger(RidersService.name);

  constructor(
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepository: Repository<FarmerProfile>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => DispatchGateway))
    private readonly dispatchGateway: DispatchGateway,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
  ) {}

  async register(userId: string, dto: RegisterRiderDto): Promise<Rider> {
    // Check if already registered
    const existing = await this.riderRepository.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('User is already registered as a rider');
    }

    // Update user role
    await this.userRepository.update(userId, { role: UserRole.RIDER });

    // Create rider profile
    const rider = this.riderRepository.create({
      userId,
      state: dto.state,
      city: dto.city,
      vehicleType: dto.vehicleType,
      vehiclePlate: dto.vehiclePlate,
      vehicleModel: dto.vehicleModel,
      licenseNumber: dto.licenseNumber,
      licenseImage: dto.licenseImage,
      idCardImage: dto.idCardImage,
    });

    return this.riderRepository.save(rider);
  }

  async findById(id: string): Promise<Rider> {
    const rider = await this.riderRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }
    return rider;
  }

  async findByUserId(userId: string): Promise<Rider> {
    let rider = await this.riderRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    
    if (!rider) {
      // Check if user exists and has RIDER role
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user && user.role === UserRole.RIDER) {
        // Auto-create a basic rider profile
        rider = this.riderRepository.create({
          userId,
          state: '',
          city: '',
          vehicleType: VehicleType.MOTORCYCLE,
          isOnline: false,
          isAvailable: false,
          totalDeliveries: 0,
          totalEarnings: 0,
          rating: 5.0,
        });
        rider = await this.riderRepository.save(rider);
        rider.user = user;
      } else {
        throw new NotFoundException('Rider profile not found');
      }
    }
    return rider;
  }

  async updateLocation(riderId: string, dto: UpdateRiderLocationDto): Promise<void> {
    const now = new Date();

    // Update in database
    await this.riderRepository.update(riderId, {
      currentLat: dto.lat,
      currentLng: dto.lng,
      lastSeenAt: now,
    });

    // Cache in Redis for quick access
    const cacheKey = `rider:location:${riderId}`;
    await this.cacheManager.set(
      cacheKey,
      {
        lat: dto.lat,
        lng: dto.lng,
        timestamp: now.toISOString(),
      },
      60 * 1000, // 1 minute TTL
    );

    // Broadcast to buyers tracking orders assigned to this rider
    const activeOrders = await this.orderRepository.find({
      where: {
        assignedRiderId: riderId,
        status: In([
          OrderStatus.CONFIRMED,
          OrderStatus.ASSIGNED,
          OrderStatus.PICKED_UP,
          OrderStatus.IN_TRANSIT,
        ]),
      },
      select: ['id'],
    });

    // Broadcast location to each order's tracking room
    for (const order of activeOrders) {
      this.dispatchGateway.broadcastRiderLocation(order.id, riderId, dto.lat, dto.lng);
    }
  }

  async updateStatus(riderId: string, dto: UpdateRiderStatusDto): Promise<Rider> {
    const rider = await this.findById(riderId);

    if (dto.isOnline !== undefined) {
      rider.isOnline = dto.isOnline;
    }
    if (dto.isAvailable !== undefined) {
      rider.isAvailable = dto.isAvailable;
    }

    return this.riderRepository.save(rider);
  }

  async getAvailableRiders(
    state: string,
    pickupLat: number,
    pickupLng: number,
    radiusKm?: number,
  ): Promise<AvailableRider[]> {
    const searchRadius = radiusKm ?? this.configService.get('dispatch.riderSearchRadiusKm') ?? 15;
    const staleSeconds = this.configService.get('dispatch.locationStaleSeconds', 120);
    const staleThreshold = new Date(Date.now() - staleSeconds * 1000);

    // Get online and available riders in same state with recent location
    const riders = await this.riderRepository.find({
      where: {
        state,
        isOnline: true,
        isAvailable: true,
        isVerified: true,
        lastSeenAt: MoreThan(staleThreshold),
      },
      relations: ['user'],
    });

    // Calculate distance and filter by radius
    const availableRiders: AvailableRider[] = [];

    for (const rider of riders) {
      if (rider.currentLat && rider.currentLng) {
        const distance = calculateDistance(
          pickupLat,
          pickupLng,
          rider.currentLat,
          rider.currentLng,
        );

        if (distance <= searchRadius) {
          // Estimate time based on distance (assuming 30 km/h average speed in urban areas)
          const estimatedMinutes = Math.ceil((distance / 30) * 60);

          availableRiders.push({
            rider,
            distance: Math.round(distance * 10) / 10,
            estimatedMinutes,
          });
        }
      }
    }

    // Sort by distance then rating
    return availableRiders.sort((a, b) => {
      if (a.estimatedMinutes !== b.estimatedMinutes) {
        return a.estimatedMinutes - b.estimatedMinutes;
      }
      return b.rider.rating - a.rider.rating;
    });
  }

  async getRiderLocation(riderId: string): Promise<{ lat: number; lng: number } | null> {
    // Try cache first
    const cacheKey = `rider:location:${riderId}`;
    const cached = await this.cacheManager.get<{ lat: number; lng: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fall back to database
    const rider = await this.riderRepository.findOne({ where: { id: riderId } });
    if (rider?.currentLat && rider?.currentLng) {
      return { lat: rider.currentLat, lng: rider.currentLng };
    }
    return null;
  }

  async markAsUnavailable(riderId: string): Promise<void> {
    await this.riderRepository.update(riderId, { isAvailable: false });
  }

  async markAsAvailable(riderId: string): Promise<void> {
    await this.riderRepository.update(riderId, { isAvailable: true });
  }

  async updateEarnings(riderId: string, amount: number): Promise<void> {
    await this.riderRepository.increment({ id: riderId }, 'totalEarnings', amount);
    await this.riderRepository.increment({ id: riderId }, 'walletBalance', amount);
    await this.riderRepository.increment({ id: riderId }, 'completedDeliveries', 1);
  }

  async updateDailyGoal(riderId: string, dailyGoal: number): Promise<{ success: boolean; dailyGoal: number }> {
    console.log('[RidersService] updateDailyGoal called with:', { riderId, dailyGoal });
    
    // Handle undefined/null
    if (dailyGoal === undefined || dailyGoal === null) {
      throw new Error('Daily goal is required');
    }
    
    // Validate goal amount (minimum ₦1,000, maximum ₦100,000)
    const validGoal = Math.max(1000, Math.min(100000, Number(dailyGoal)));
    console.log('[RidersService] Valid goal:', validGoal);
    
    await this.riderRepository.update(riderId, { dailyGoal: validGoal });
    console.log('[RidersService] Updated rider daily goal');
    
    return { success: true, dailyGoal: validGoal };
  }

  async verifyRider(riderId: string): Promise<Rider> {
    const rider = await this.findById(riderId);
    rider.isVerified = true;
    return this.riderRepository.save(rider);
  }

  async getActiveDelivery(riderId: string): Promise<any | null> {
    console.log(`[RidersService] Looking for active delivery for rider: ${riderId}`);
    
    // Find any order assigned to this rider that is in progress
    const activeOrder = await this.orderRepository.findOne({
      where: [
        { assignedRiderId: riderId, status: OrderStatus.ASSIGNED },
        { assignedRiderId: riderId, status: OrderStatus.PICKED_UP },
        { assignedRiderId: riderId, status: OrderStatus.IN_TRANSIT },
      ],
      relations: ['buyer', 'assignedRider'],
    });

    console.log(`[RidersService] Active order found: ${activeOrder ? activeOrder.id : 'none'}`);

    if (!activeOrder) {
      return null;
    }

    // Get the first farmer from items (simplified - in real app might need to handle multi-farmer orders)
    const firstItem = activeOrder.items?.[0];
    
    // Lookup farmer details to get phone and address
    let farmerPhone = '';
    let farmerAddress = activeOrder.pickupPoint?.address || 'Farm location';
    let pickupLat = activeOrder.pickupPoint?.lat || 0;
    let pickupLng = activeOrder.pickupPoint?.lng || 0;
    
    if (firstItem?.farmerId) {
      // Get farmer profile
      const farmerProfile = await this.farmerProfileRepository.findOne({
        where: { userId: firstItem.farmerId },
        relations: ['user'],
      });
      
      if (farmerProfile) {
        farmerPhone = farmerProfile.user?.phone || '';
        // Use farmAddress from farmer profile if available, else fallback to pickupPoint
        farmerAddress = farmerProfile.farmAddress || activeOrder.pickupPoint?.address || 'Farm location';
      }
    }

    // If pickupPoint coordinates are missing (0,0), try to get from product
    if (pickupLat === 0 || pickupLng === 0) {
      // Query the product to get pickup coordinates
      if (firstItem?.productId) {
        const productRepo = this.orderRepository.manager.getRepository(Product);
        const product = await productRepo.findOne({
          where: { id: firstItem.productId },
          select: ['id', 'pickupLat', 'pickupLng', 'pickupAddress'],
        });
        if (product) {
          pickupLat = Number(product.pickupLat) || 0;
          pickupLng = Number(product.pickupLng) || 0;
          if (!farmerAddress || farmerAddress === 'Farm location') {
            farmerAddress = product.pickupAddress || farmerAddress;
          }
        }
      }
    }

    console.log(`[RidersService] Pickup location: lat=${pickupLat}, lng=${pickupLng}, address=${farmerAddress}`);

    // Calculate ETA in minutes from estimatedDeliveryTime
    let eta: number | null = null;
    if (activeOrder.estimatedDeliveryTime) {
      const now = new Date();
      const estimatedTime = new Date(activeOrder.estimatedDeliveryTime);
      const diffMs = estimatedTime.getTime() - now.getTime();
      eta = Math.max(0, Math.ceil(diffMs / (1000 * 60))); // Convert to minutes, minimum 0
    }

    return {
      id: activeOrder.id,
      orderId: activeOrder.id,
      status: this.mapOrderStatusToDeliveryStatus(activeOrder.status),
      pickupAddress: farmerAddress,
      deliveryAddress: activeOrder.deliveryAddress?.address || 'Buyer location',
      pickupLocation: {
        latitude: pickupLat,
        longitude: pickupLng,
      },
      deliveryLocation: {
        latitude: activeOrder.deliveryAddress?.lat || activeOrder.deliveryLatitude || 0,
        longitude: activeOrder.deliveryAddress?.lng || activeOrder.deliveryLongitude || 0,
      },
      farmer: {
        id: firstItem?.farmerId || '', // User ID of the farmer for chat
        name: firstItem?.farmerName || 'Farmer',
        phone: farmerPhone,
        address: farmerAddress,
      },
      buyer: {
        id: activeOrder.buyer?.id || '', // User ID of the buyer for chat
        name: activeOrder.buyer?.name || 'Buyer',
        phone: activeOrder.buyer?.phone || '',
      },
      items: activeOrder.items?.map(item => ({
        name: item.title || 'Product',
        quantity: item.quantity,
      })) || [],
      earnings: Number(activeOrder.deliveryFee) || 0,
      eta,
      estimatedDeliveryTime: activeOrder.estimatedDeliveryTime?.toISOString() || new Date().toISOString(),
    };
  }

  private mapOrderStatusToDeliveryStatus(status: OrderStatus): 'accepted' | 'picked_up' | 'in_transit' {
    switch (status) {
      case OrderStatus.ASSIGNED:
        return 'accepted';
      case OrderStatus.PICKED_UP:
        return 'picked_up';
      case OrderStatus.IN_TRANSIT:
      default:
        return 'in_transit';
    }
  }

  async updateDeliveryStatus(riderId: string, orderId: string, status: string, proofOfDeliveryPhoto?: string): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, assignedRiderId: riderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found or not assigned to this rider');
    }

    // Map delivery status to order status
    const statusMap: Record<string, OrderStatus> = {
      'accepted': OrderStatus.ASSIGNED,
      'picked_up': OrderStatus.PICKED_UP,
      'in_transit': OrderStatus.IN_TRANSIT,
      'delivered': OrderStatus.DELIVERED,
    };

    const newStatus = statusMap[status];
    if (!newStatus) {
      throw new BadRequestException('Invalid status');
    }

    order.status = newStatus;
    if (status === 'picked_up') {
      order.pickedUpAt = new Date();
      
      // Recalculate ETA from pickup point to delivery
      const rider = await this.findById(riderId);
      const pickupLat = order.pickupPoint?.lat;
      const pickupLng = order.pickupPoint?.lng;
      const deliveryLat = order.deliveryAddress?.lat || order.deliveryLatitude;
      const deliveryLng = order.deliveryAddress?.lng || order.deliveryLongitude;
      
      if (pickupLat && pickupLng && deliveryLat && deliveryLng) {
        const distance = this.calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng);
        const avgSpeedKmh = 25;
        const etaMinutes = Math.ceil((distance / avgSpeedKmh) * 60);
        order.estimatedDeliveryTime = new Date(Date.now() + etaMinutes * 60 * 1000);
      }
    }
    if (status === 'in_transit') {
      // Update ETA based on rider's current location
      const rider = await this.findById(riderId);
      const riderLat = rider.currentLatitude || rider.currentLat;
      const riderLng = rider.currentLongitude || rider.currentLng;
      const deliveryLat = order.deliveryAddress?.lat || order.deliveryLatitude;
      const deliveryLng = order.deliveryAddress?.lng || order.deliveryLongitude;
      
      if (riderLat && riderLng && deliveryLat && deliveryLng) {
        const distance = this.calculateDistance(riderLat, riderLng, deliveryLat, deliveryLng);
        const avgSpeedKmh = 25;
        const etaMinutes = Math.ceil((distance / avgSpeedKmh) * 60);
        order.estimatedDeliveryTime = new Date(Date.now() + etaMinutes * 60 * 1000);
      }
    }
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.actualDeliveryTime = new Date();
      
      // Save proof of delivery photo if provided
      if (proofOfDeliveryPhoto) {
        order.proofOfDeliveryPhoto = proofOfDeliveryPhoto;
      }
      
      // Process earnings for both farmers and rider through wallet service
      try {
        // Extract farmer IDs and their subtotals from order items
        const orderItems = (order.items || []).map((item: any) => ({
          farmerId: item.farmerId,
          subtotal: Number(item.subtotal) || 0,
        }));
        
        const farmerIds = [...new Set(orderItems.map((item: any) => item.farmerId))];
        
        this.logger.log(`Processing earnings for order ${order.orderNumber}: ` +
          `FarmerIds=${farmerIds.join(', ')}, RiderId=${riderId}, ` +
          `DeliveryFee=${order.deliveryFee}, Subtotal=${order.subtotal}`);
        
        // Process all earnings through wallet service (handles farmers, rider, and platform revenue)
        const result = await this.walletService.processOrderEarnings(
          order.id,
          order.orderNumber,
          farmerIds,
          riderId,
          orderItems,
          Number(order.deliveryFee) || 0,
          Number(order.subtotal) || 0,
        );
        
        // Update rider stats
        await this.riderRepository.increment({ id: riderId }, 'completedDeliveries', 1);
        
        this.logger.log(`Order ${order.orderNumber} earnings processed: ` +
          `Farmers earned ${result.farmerEarnings}, Rider earned ${result.riderEarnings}`);
      } catch (error) {
        this.logger.error(`Failed to process earnings for order ${order.orderNumber}: ${error.message}`, error.stack);
        // Don't fail the delivery status update, but log the error
      }
    }

    return this.orderRepository.save(order);
  }

  async getEarnings(riderId: string, period: 'today' | 'week' | 'month' | 'all' = 'week') {
    const rider = await this.findById(riderId);
    const now = new Date();
    
    // Calculate date ranges
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch delivered orders for this rider (use assignedRiderId which is the correct column)
    const allDeliveredOrders = await this.orderRepository.find({
      where: {
        assignedRiderId: riderId,
        status: OrderStatus.DELIVERED,
      },
      order: { createdAt: 'DESC' },
    });

    // Calculate earnings for each time period
    let todayEarnings = 0;
    let thisWeekEarnings = 0;
    let thisMonthEarnings = 0;

    const recentDeliveries: Array<{
      id: string;
      date: string;
      amount: number;
      distance: number;
      duration: number;
    }> = [];

    const weeklyBreakdown = new Map<string, number>();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => weeklyBreakdown.set(day, 0));

    for (const order of allDeliveredOrders) {
      const orderDate = new Date(order.createdAt);
      const deliveryFee = Number(order.deliveryFee) || 0;
      
      // Today's earnings
      if (orderDate >= startOfToday) {
        todayEarnings += deliveryFee;
      }
      
      // This week's earnings
      if (orderDate >= startOfWeek) {
        thisWeekEarnings += deliveryFee;
        const dayName = days[orderDate.getDay()];
        weeklyBreakdown.set(dayName, (weeklyBreakdown.get(dayName) || 0) + deliveryFee);
      }
      
      // This month's earnings
      if (orderDate >= startOfMonth) {
        thisMonthEarnings += deliveryFee;
      }

      // Add to recent deliveries (limit to 10)
      if (recentDeliveries.length < 10) {
        recentDeliveries.push({
          id: order.id,
          date: order.createdAt.toISOString(),
          amount: deliveryFee,
          distance: 0, // Distance not tracked in Order entity
          duration: 30, // Default duration in minutes
        });
      }
    }

    const totalDeliveries = allDeliveredOrders.length;
    const totalEarnings = typeof rider.totalEarnings === 'string' 
      ? parseFloat(rider.totalEarnings) 
      : (rider.totalEarnings || 0);
    const averagePerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

    // Ensure walletBalance is a number (decimal columns return strings in PostgreSQL)
    const pendingPayout = typeof rider.walletBalance === 'string' 
      ? parseFloat(rider.walletBalance) 
      : (rider.walletBalance || 0);

    // Calculate completion rate
    const completionRate = rider.totalDeliveries > 0 
      ? Math.round((rider.completedDeliveries / rider.totalDeliveries) * 100) 
      : 100;

    // Calculate streak days (consecutive days with at least 1 delivery)
    let streakDays = 0;
    const deliveryDates = new Set<string>();
    for (const order of allDeliveredOrders) {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      deliveryDates.add(dateKey);
    }
    
    // Count consecutive days from today backwards
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];
      if (deliveryDates.has(dateKey)) {
        streakDays++;
      } else if (i > 0) {
        // Allow today to not have deliveries yet, but break streak on previous days
        break;
      }
    }

    // Get rider's rating
    const rating = typeof rider.rating === 'string' 
      ? parseFloat(rider.rating) 
      : (rider.rating || 5.0);

    // Get rider's daily goal
    const dailyGoal = typeof rider.dailyGoal === 'string' 
      ? parseFloat(rider.dailyGoal) 
      : (rider.dailyGoal || 5000);

    return {
      today: todayEarnings,
      thisWeek: thisWeekEarnings,
      thisMonth: thisMonthEarnings,
      totalDeliveries,
      averagePerDelivery: Math.round(averagePerDelivery),
      pendingPayout,
      recentDeliveries,
      weeklyBreakdown: days.map(day => ({
        day,
        earnings: weeklyBreakdown.get(day) || 0,
      })),
      // Performance metrics
      rating,
      completionRate,
      streakDays,
      dailyGoal,
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
