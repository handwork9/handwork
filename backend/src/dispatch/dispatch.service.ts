import { Injectable, Inject, forwardRef, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { DispatchLog, Order, Rider, SubscriptionTier, SUBSCRIPTION_BOOST } from '../database/entities';
import { OrderStatus, RiderStatus, DispatchStatus } from '../common/enums';
import { RidersService } from '../riders/riders.service';
import { DispatchGateway } from './dispatch.gateway';

export interface RiderCandidate {
  rider: Rider;
  distanceKm: number;
  etaMinutes: number;
  score: number;
}

export interface DispatchResult {
  success: boolean;
  orderId: string;
  riderId?: string;
  message: string;
  dispatchLogId?: string;
  scheduledDelivery?: boolean;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  // Dispatch configuration
  private readonly maxDeliveryTimeMinutes: number;
  private readonly quickDeliveryThresholdMinutes: number;
  private readonly riderAcceptTimeoutSeconds: number;
  private readonly maxDispatchAttempts: number;
  private readonly locationStaleThresholdSeconds: number;
  private readonly searchRadiusKm: number;
  private readonly maxRidersToOffer: number;
  private readonly retryDelaySeconds: number;

  constructor(
    @InjectRepository(DispatchLog)
    private readonly dispatchLogRepository: Repository<DispatchLog>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
    @InjectQueue('dispatch')
    private readonly dispatchQueue: Queue,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => RidersService))
    private readonly ridersService: RidersService,
    private readonly dispatchGateway: DispatchGateway,
  ) {
    // Load dispatch configuration
    this.maxDeliveryTimeMinutes = this.configService.get('dispatch.maxDeliveryTimeMinutes', 45);
    this.quickDeliveryThresholdMinutes = this.configService.get('dispatch.quickDeliveryThresholdMinutes', 30);
    this.riderAcceptTimeoutSeconds = this.configService.get('dispatch.riderAcceptTimeoutSeconds', 30);
    this.maxDispatchAttempts = this.configService.get('dispatch.maxDispatchAttempts', 5);
    this.locationStaleThresholdSeconds = this.configService.get('dispatch.locationStaleThresholdSeconds', 60);
    this.searchRadiusKm = this.configService.get('dispatch.searchRadiusKm', 15);
    this.maxRidersToOffer = this.configService.get('dispatch.maxRidersToOffer', 3);
    this.retryDelaySeconds = this.configService.get('dispatch.retryDelaySeconds', 10);
  }

  /**
   * Main dispatch algorithm as specified:
   * 1. Check same-state constraint
   * 2. Query available riders with recent location (< 60s stale)
   * 3. Compute ETA using distance matrix
   * 4. Filter by quickDeliveryThresholdMinutes (30min)
   * 5. Rank by ETA ascending, rating desc, distance
   * 6. Offer to top N riders via push/WS with 30s timeout
   * 7. Fallback to scheduled delivery if no match
   */
  async dispatchOrder(orderId: string): Promise<DispatchResult> {
    this.logger.log(`Starting dispatch for order ${orderId}`);

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException(`Order ${orderId} is not in CONFIRMED status`);
    }

    // Create dispatch log entry
    const dispatchLog = this.dispatchLogRepository.create({
      orderId,
      status: DispatchStatus.SEARCHING,
      attemptCount: 0,
      metadata: {},
    });
    await this.dispatchLogRepository.save(dispatchLog);

    try {
      // Step 1: Get pickup location from order's pickup point
      const pickupPoint = order.pickupPoint;
      if (!pickupPoint) {
        throw new BadRequestException('Order has no valid pickup location');
      }

      const pickupState = order.pickupState;
      const pickupLat = pickupPoint.lat;
      const pickupLng = pickupPoint.lng;

      this.logger.debug(`Pickup location: ${pickupState} (${pickupLat}, ${pickupLng})`);

      // Step 2: Find available riders in same state with fresh location
      const staleThreshold = new Date(Date.now() - this.locationStaleThresholdSeconds * 1000);
      
      const availableRiders = await this.findEligibleRiders(
        pickupState,
        pickupLat,
        pickupLng,
        staleThreshold,
      );

      if (availableRiders.length === 0) {
        this.logger.warn(`No available riders found for order ${orderId}`);
        return this.handleNoRidersAvailable(order, dispatchLog);
      }

      // Step 3 & 4: Compute ETA and filter by quick delivery threshold
      const deliveryLat = order.deliveryAddress?.lat || order.deliveryLatitude;
      const deliveryLng = order.deliveryAddress?.lng || order.deliveryLongitude;
      
      const candidatesWithEta = await this.computeCandidateScores(
        availableRiders,
        pickupLat,
        pickupLng,
        deliveryLat,
        deliveryLng,
      );

      const eligibleCandidates = candidatesWithEta.filter(
        (c) => c.etaMinutes <= this.quickDeliveryThresholdMinutes,
      );

      if (eligibleCandidates.length === 0) {
        this.logger.warn(`No riders can deliver within ${this.quickDeliveryThresholdMinutes} minutes`);
        return this.handleNoRidersAvailable(order, dispatchLog);
      }

      // Step 5: Rank candidates
      const rankedCandidates = this.rankCandidates(eligibleCandidates);
      const topCandidates = rankedCandidates.slice(0, this.maxRidersToOffer);

      this.logger.debug(`Found ${topCandidates.length} eligible riders for order ${orderId}`);

      // Update dispatch log
      dispatchLog.attemptCount = 1;
      dispatchLog.metadata = {
        candidatesFound: topCandidates.length,
        riderIds: topCandidates.map((c) => c.rider.id),
      };
      await this.dispatchLogRepository.save(dispatchLog);

      // Step 6: Offer to riders sequentially with timeout
      const assignedRider = await this.offerToRiders(order, topCandidates, dispatchLog);

      if (assignedRider) {
        return {
          success: true,
          orderId: order.id,
          riderId: assignedRider.id,
          message: `Order assigned to rider ${assignedRider.user?.fullName || assignedRider.id}`,
          dispatchLogId: dispatchLog.id,
        };
      }

      // Step 7: All riders declined, fallback to scheduled
      return this.handleNoRidersAvailable(order, dispatchLog);

    } catch (error) {
      this.logger.error(`Dispatch failed for order ${orderId}: ${error.message}`);
      dispatchLog.status = DispatchStatus.FAILED;
      dispatchLog.metadata = { ...dispatchLog.metadata, error: error.message };
      await this.dispatchLogRepository.save(dispatchLog);

      throw error;
    }
  }

  /**
   * Find riders that are:
   * - In same state as pickup
   * - Currently available
   * - Have recent location update
   * - Within search radius
   */
  private async findEligibleRiders(
    state: string,
    pickupLat: number,
    pickupLng: number,
    staleThreshold: Date,
  ): Promise<Rider[]> {
    // Using raw query for PostGIS distance calculation
    const riders = await this.riderRepository
      .createQueryBuilder('rider')
      .leftJoinAndSelect('rider.user', 'user')
      .where('rider.currentState = :state', { state })
      .andWhere('rider.status = :status', { status: RiderStatus.AVAILABLE })
      .andWhere('rider.isVerified = :verified', { verified: true })
      .andWhere('rider.locationUpdatedAt > :staleThreshold', { staleThreshold })
      .andWhere(
        `ST_DWithin(
          rider.currentLocation::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radiusMeters
        )`,
        {
          lat: pickupLat,
          lng: pickupLng,
          radiusMeters: this.searchRadiusKm * 1000,
        },
      )
      .orderBy(
        `ST_Distance(
          rider.currentLocation::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        )`,
        'ASC',
      )
      .setParameters({ lat: pickupLat, lng: pickupLng })
      .take(20) // Limit initial candidates
      .getMany();

    return riders;
  }

  /**
   * Compute ETA and score for each candidate
   * Using simple distance-based estimation (can be replaced with Google Maps API)
   */
  private async computeCandidateScores(
    riders: Rider[],
    pickupLat: number,
    pickupLng: number,
    deliveryLat: number,
    deliveryLng: number,
  ): Promise<RiderCandidate[]> {
    const candidates: RiderCandidate[] = [];

    for (const rider of riders) {
      // Calculate distances using Haversine formula
      const riderLat = rider.currentLatitude || rider.currentLat;
      const riderLng = rider.currentLongitude || rider.currentLng;
      
      const distanceToPickup = this.calculateDistance(
        riderLat,
        riderLng,
        pickupLat,
        pickupLng,
      );

      const distancePickupToDelivery = this.calculateDistance(
        pickupLat,
        pickupLng,
        deliveryLat,
        deliveryLng,
      );

      const totalDistanceKm = distanceToPickup + distancePickupToDelivery;

      // Estimate ETA: assume average speed of 25 km/h in city + 5 min pickup time
      const avgSpeedKmh = 25;
      const pickupTimeMinutes = 5;
      const etaMinutes = Math.ceil((totalDistanceKm / avgSpeedKmh) * 60) + pickupTimeMinutes;

      // Get premium boost (1.0 for basic, up to 3.0 for platinum)
      const premiumBoost = this.getRiderPremiumBoost(rider);

      // Calculate score (lower is better)
      // Weight: ETA (50%), Distance (30%), Rating (20% inverse)
      // Premium riders get their score reduced by their boost multiplier
      const riderRating = rider.rating || 3.0;
      const baseScore =
        etaMinutes * 0.5 +
        totalDistanceKm * 0.3 +
        (5 - riderRating) * 10 * 0.2; // Invert rating so higher is better
      
      // Apply premium boost - dividing score by boost gives premium riders priority
      const score = baseScore / premiumBoost;

      candidates.push({
        rider,
        distanceKm: totalDistanceKm,
        etaMinutes,
        score,
      });
    }

    return candidates;
  }

  /**
   * Rank candidates by score (ETA, rating, distance)
   */
  private rankCandidates(candidates: RiderCandidate[]): RiderCandidate[] {
    return candidates.sort((a, b) => a.score - b.score);
  }

  /**
   * Offer order to riders sequentially with timeout
   */
  private async offerToRiders(
    order: Order,
    candidates: RiderCandidate[],
    dispatchLog: DispatchLog,
  ): Promise<Rider | null> {
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const rider = candidate.rider;

      this.logger.log(`Offering order ${order.id} to rider ${rider.id} (attempt ${i + 1})`);

      // Update dispatch log
      dispatchLog.attemptCount = i + 1;
      dispatchLog.status = DispatchStatus.OFFERED;
      dispatchLog.riderId = rider.id;
      dispatchLog.metadata = {
        ...dispatchLog.metadata,
        currentOffer: {
          riderId: rider.id,
          etaMinutes: candidate.etaMinutes,
          distanceKm: candidate.distanceKm,
        },
      };
      await this.dispatchLogRepository.save(dispatchLog);

      // Send offer via WebSocket
      const pickupAddress = order.pickupPoint?.address || 'Unknown';
      const deliveryAddr = typeof order.deliveryAddress === 'object' 
        ? order.deliveryAddress.address 
        : order.deliveryAddress;
      
      const offerData = {
        orderId: order.id,
        pickupAddress: pickupAddress,
        deliveryAddress: deliveryAddr,
        estimatedDistance: candidate.distanceKm.toFixed(2),
        estimatedEta: candidate.etaMinutes,
        totalAmount: order.totalAmount || order.total,
        timeoutSeconds: this.riderAcceptTimeoutSeconds,
      };

      // Emit offer to specific rider
      this.dispatchGateway.sendOfferToRider(rider.id, offerData);

      // Wait for rider response with timeout
      const accepted = await this.waitForRiderResponse(
        order.id,
        rider.id,
        this.riderAcceptTimeoutSeconds,
      );

      if (accepted) {
        // Rider accepted - assign order
        await this.assignOrderToRider(order, rider, dispatchLog);
        return rider;
      }

      this.logger.debug(`Rider ${rider.id} declined or timed out for order ${order.id}`);
    }

    return null;
  }

  /**
   * Wait for rider to accept/decline with timeout
   * In production, this would use Redis pub/sub or a more robust mechanism
   */
  private async waitForRiderResponse(
    orderId: string,
    riderId: string,
    timeoutSeconds: number,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.dispatchGateway.removeResponseListener(orderId, riderId);
        resolve(false);
      }, timeoutSeconds * 1000);

      this.dispatchGateway.onRiderResponse(orderId, riderId, (accepted: boolean) => {
        clearTimeout(timeout);
        resolve(accepted);
      });
    });
  }

  /**
   * Assign order to rider and update statuses
   */
  private async assignOrderToRider(
    order: Order,
    rider: Rider,
    dispatchLog: DispatchLog,
  ): Promise<void> {
    // Update order
    order.riderId = rider.id;
    order.status = OrderStatus.ASSIGNED;
    order.assignedAt = new Date();
    await this.orderRepository.save(order);

    // Update rider status
    rider.status = RiderStatus.BUSY;
    rider.currentOrderId = order.id;
    await this.riderRepository.save(rider);

    // Update dispatch log
    dispatchLog.status = DispatchStatus.MATCHED;
    dispatchLog.riderId = rider.id;
    dispatchLog.matchedAt = new Date();
    await this.dispatchLogRepository.save(dispatchLog);

    // Notify via WebSocket
    this.dispatchGateway.notifyOrderAssigned(order.id, rider.id);

    this.logger.log(`Order ${order.id} assigned to rider ${rider.id}`);
  }

  /**
   * Handle case when no riders are available - schedule for later
   */
  private async handleNoRidersAvailable(
    order: Order,
    dispatchLog: DispatchLog,
  ): Promise<DispatchResult> {
    if (dispatchLog.attemptCount >= this.maxDispatchAttempts) {
      // Max attempts reached - mark as scheduled delivery
      dispatchLog.status = DispatchStatus.SCHEDULED;
      dispatchLog.metadata = {
        ...dispatchLog.metadata,
        reason: 'No riders available after max attempts',
      };
      await this.dispatchLogRepository.save(dispatchLog);

      return {
        success: false,
        orderId: order.id,
        message: 'No riders available. Order scheduled for later delivery.',
        dispatchLogId: dispatchLog.id,
        scheduledDelivery: true,
      };
    }

    // Queue retry job
    dispatchLog.status = DispatchStatus.PENDING;
    await this.dispatchLogRepository.save(dispatchLog);

    await this.dispatchQueue.add(
      'retry-dispatch',
      {
        orderId: order.id,
        dispatchLogId: dispatchLog.id,
        attemptCount: dispatchLog.attemptCount + 1,
      },
      {
        delay: this.retryDelaySeconds * 1000,
        jobId: `dispatch-${order.id}-${dispatchLog.attemptCount + 1}`,
      },
    );

    return {
      success: false,
      orderId: order.id,
      message: `No riders available. Retry scheduled in ${this.retryDelaySeconds} seconds.`,
      dispatchLogId: dispatchLog.id,
    };
  }

  /**
   * Queue a new dispatch job
   */
  async queueDispatch(orderId: string): Promise<void> {
    await this.dispatchQueue.add(
      'dispatch-order',
      { orderId },
      {
        jobId: `dispatch-${orderId}`,
        priority: 1,
      },
    );

    this.logger.log(`Dispatch job queued for order ${orderId}`);
  }

  /**
   * Handle rider accepting an order offer
   */
  async acceptOrder(orderId: string, riderId: string): Promise<DispatchResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    if (order.riderId && order.riderId !== riderId) {
      throw new BadRequestException('Order already assigned to another rider');
    }

    const rider = await this.riderRepository.findOne({
      where: { id: riderId },
    });

    if (!rider) {
      throw new BadRequestException(`Rider ${riderId} not found`);
    }

    // Get or create dispatch log
    let dispatchLog = await this.dispatchLogRepository.findOne({
      where: { orderId, riderId },
      order: { createdAt: 'DESC' },
    });

    if (!dispatchLog) {
      dispatchLog = this.dispatchLogRepository.create({
        orderId,
        riderId,
        status: DispatchStatus.OFFERED,
        attemptCount: 1,
      });
    }

    await this.assignOrderToRider(order, rider, dispatchLog);

    return {
      success: true,
      orderId: order.id,
      riderId: rider.id,
      message: 'Order accepted successfully',
      dispatchLogId: dispatchLog.id,
    };
  }

  /**
   * Handle rider declining an order offer
   */
  async declineOrder(orderId: string, riderId: string, reason?: string): Promise<void> {
    const dispatchLog = await this.dispatchLogRepository.findOne({
      where: { orderId, riderId },
      order: { createdAt: 'DESC' },
    });

    if (dispatchLog) {
      dispatchLog.metadata = {
        ...dispatchLog.metadata,
        declinedAt: new Date(),
        declineReason: reason,
      };
      await this.dispatchLogRepository.save(dispatchLog);
    }

    // Notify dispatch gateway to continue with next rider
    this.dispatchGateway.notifyRiderDeclined(orderId, riderId);

    this.logger.log(`Rider ${riderId} declined order ${orderId}: ${reason}`);
  }

  /**
   * Get dispatch status for an order
   */
  async getDispatchStatus(orderId: string): Promise<DispatchLog | null> {
    return this.dispatchLogRepository.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
      relations: ['rider', 'order'],
    });
  }

  /**
   * Haversine formula to calculate distance between two points
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

  /**
   * Get premium boost multiplier for a rider
   * Premium riders with active subscriptions get priority in dispatch
   */
  private getRiderPremiumBoost(rider: Rider): number {
    // Check if rider has active premium subscription
    if (!rider.isPremium || !rider.subscriptionExpiresAt) {
      return 1.0; // No boost for basic tier
    }

    // Check if subscription is still valid
    if (new Date() > rider.subscriptionExpiresAt) {
      return 1.0; // Expired subscription
    }

    // Return boost based on tier
    const tier = rider.currentTier || SubscriptionTier.BASIC;
    return SUBSCRIPTION_BOOST[tier] || 1.0;
  }
}
