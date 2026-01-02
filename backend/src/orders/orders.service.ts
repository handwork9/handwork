import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Order, OrderItem, DeliveryAddress, PickupPoint } from '../database/entities/order.entity';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { WalletService } from '../wallet/wallet.service';
import { PaystackService } from '../payments/paystack.service';
import { WalletOwnerType, TransactionCategory } from '../database/entities/wallet-transaction.entity';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { RecommendationService } from '../recommendations/recommendation.service';
import { RidersService } from '../riders/riders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { OrderStatus, UserRole, PaymentStatus } from '../common/enums';
import { generateOrderNumber, isSameState } from '../common/utils/helpers';
import { PaginatedResponseDto } from '../common/dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
    private readonly walletService: WalletService,
    private readonly paystackService: PaystackService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly recommendationService: RecommendationService,
    @Inject(forwardRef(() => RidersService))
    private readonly ridersService: RidersService,
  ) {}

  async create(buyerId: string, dto: CreateOrderDto): Promise<Order> {
    // Use items from DTO if provided, otherwise get from server-side cart
    let cartItems: any[] = [];
    let cartTotal = 0;
    let cartItemCount = 0;
    let hasPerishableItems = false;

    if (dto.items && dto.items.length > 0) {
      // Use items provided in the request (from frontend cart)
      for (const item of dto.items) {
        const product = await this.productsService.findById(item.productId);
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.title}. Only ${product.stock} available.`,
          );
        }
        // Track if any item is perishable
        if (product.isPerishable !== false) {
          hasPerishableItems = true;
        }
        cartItems.push({
          productId: product.id,
          title: product.title,
          price: Number(product.price),
          quantity: item.quantity,
          unit: product.unit,
          image: product.images?.[0],
          farmerId: product.farmerId,
          farmerName: product.farmer?.fullName || 'Farmer',
          pickupLat: product.pickupLat,
          pickupLng: product.pickupLng,
          pickupState: product.pickupState,
          isPerishable: product.isPerishable !== false,
        });
        cartTotal += Number(product.price) * item.quantity;
        cartItemCount += item.quantity;
      }
    } else {
      // Fall back to server-side cart
      const cart = await this.cartService.getCart(buyerId);
      if (cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }
      cartItems = cart.items;
      cartTotal = cart.total;
      cartItemCount = cart.itemCount;

      // Validate stock for all items and check perishability
      for (const item of cartItems) {
        const product = await this.productsService.findById(item.productId);
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.title}. Only ${product.stock} available.`,
          );
        }
        if (product.isPerishable !== false) {
          hasPerishableItems = true;
        }
      }
    }

    // Calculate pickup point (from first item - assuming single farmer for simplicity)
    // In production, might need to handle multi-farmer orders differently
    const firstItem = cartItems[0];
    const pickupPoint: PickupPoint = {
      address: firstItem.pickupAddress || 'Farm Location',
      city: firstItem.pickupCity || '',
      state: firstItem.pickupState,
      lat: firstItem.pickupLat,
      lng: firstItem.pickupLng,
    };

    // Delivery address
    const deliveryAddress: DeliveryAddress = {
      address: dto.deliveryAddress.address,
      city: dto.deliveryAddress.city,
      state: dto.deliveryAddress.state,
      lat: dto.deliveryAddress.lat,
      lng: dto.deliveryAddress.lng,
      instructions: dto.deliveryAddress.instructions,
    };

    // Check if same state for quick delivery eligibility
    const sameState = isSameState(pickupPoint.state, deliveryAddress.state);

    // Block interstate shipping for perishable products
    if (!sameState && hasPerishableItems) {
      const perishableItemNames = cartItems
        .filter((item) => item.isPerishable !== false)
        .map((item) => item.title)
        .slice(0, 3)
        .join(', ');
      
      throw new BadRequestException(
        `Interstate delivery is not available for perishable products to ensure freshness. ` +
        `The following items are perishable: ${perishableItemNames}${cartItems.filter(i => i.isPerishable !== false).length > 3 ? '...' : ''}. ` +
        `Please select a delivery address within ${pickupPoint.state} state.`,
      );
    }

    // Calculate fees
    const subtotal = cartTotal;
    const deliveryFee = this.calculateDeliveryFee(pickupPoint, deliveryAddress);
    const serviceFee = Math.round(subtotal * 0.02); // 2% service fee
    const discount = dto.discountCode ? await this.applyDiscount(dto.discountCode, subtotal) : 0;
    const total = subtotal + deliveryFee + serviceFee - discount;

    // Create order items
    const orderItems: OrderItem[] = cartItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit,
      subtotal: item.price * item.quantity,
      farmerId: item.farmerId,
      farmerName: item.farmerName,
    }));

    // Determine payment status based on payment method and reference
    let paymentStatus = PaymentStatus.PENDING;
    let paymentVerified = false;
    
    if (dto.paymentMethod === 'wallet') {
      // Wallet payments are completed immediately
      paymentStatus = PaymentStatus.COMPLETED;
    } else if (dto.paymentMethod === 'card' && dto.paymentReference) {
      // For card payments with a reference, verify the payment
      this.logger.log(`[createOrder] Verifying card payment with reference: ${dto.paymentReference}`);
      try {
        const verifyResult = await this.paystackService.verifyTransaction(dto.paymentReference);
        if (verifyResult.status === 'success') {
          this.logger.log(`[createOrder] Payment verified successfully for reference: ${dto.paymentReference}`);
          paymentStatus = PaymentStatus.COMPLETED;
          paymentVerified = true;
        } else {
          this.logger.warn(`[createOrder] Payment verification returned status: ${verifyResult.status}`);
        }
      } catch (verifyError: any) {
        this.logger.warn(`[createOrder] Payment verification failed: ${verifyError.message}. Continuing with PENDING status.`);
      }
    }

    // Create order
    this.logger.log(`[createOrder] Creating order with paymentMethod: ${dto.paymentMethod}, paymentStatus: ${paymentStatus}`);
    
    const order = this.orderRepository.create({
      orderNumber: generateOrderNumber(),
      buyerId,
      items: orderItems,
      itemCount: cartItemCount,
      subtotal,
      deliveryFee,
      serviceFee,
      discount,
      total,
      status: paymentStatus === PaymentStatus.COMPLETED ? OrderStatus.CONFIRMED : OrderStatus.CREATED,
      paymentStatus,
      paymentMethod: dto.paymentMethod,
      pickupPoint,
      deliveryAddress,
      pickupState: pickupPoint.state,
      deliveryState: deliveryAddress.state,
      isSameState: sameState,
      customerNotes: dto.notes,
      riderNote: dto.riderNote,
      farmerMessage: dto.farmerMessage,
      isGift: dto.isGift || false,
      giftDetails: dto.giftDetails,
      deliveryType: dto.deliveryType || 'ASAP',
      ...(dto.scheduledDeliveryTime && { scheduledDeliveryTime: new Date(dto.scheduledDeliveryTime) }),
      ...(paymentVerified && { confirmedAt: new Date() }),
    });

    const savedOrder = await this.orderRepository.save(order);
    this.logger.log(`[createOrder] Order ${savedOrder.orderNumber} created with paymentStatus: ${savedOrder.paymentStatus}, status: ${savedOrder.status}`);

    // If payment method is wallet, process the wallet deduction now with the real order ID
    if (dto.paymentMethod === 'wallet') {
      try {
        this.logger.log(`[createOrder] Processing wallet payment for order ${savedOrder.id}, amount: ${total}`);
        await this.walletService.debitWallet({
          ownerId: buyerId,
          ownerType: WalletOwnerType.BUYER,
          amount: total,
          category: TransactionCategory.PURCHASE,
          description: `Payment for order #${savedOrder.orderNumber}`,
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          metadata: { 
            orderId: savedOrder.id,
            orderNumber: savedOrder.orderNumber,
            paymentMethod: 'wallet',
          },
        });
        this.logger.log(`[createOrder] Wallet payment successful for order ${savedOrder.id}`);
      } catch (walletError: any) {
        // If wallet deduction fails, we need to rollback the order
        this.logger.error(`[createOrder] Wallet payment failed for order ${savedOrder.id}: ${walletError.message}`);
        // Delete the order since payment failed
        await this.orderRepository.remove(savedOrder);
        throw new BadRequestException(`Wallet payment failed: ${walletError.message}`);
      }
    }

    // Update product stock
    for (const item of cartItems) {
      await this.productsService.updateStock(item.productId, item.quantity);
      await this.productsService.incrementSales(item.productId, item.quantity);
    }

    // Clear cart
    await this.cartService.clearCart(buyerId);

    // Send notification to farmers about new order
    const farmerIds = [...new Set(cartItems.map(item => item.farmerId))];
    for (const farmerId of farmerIds) {
      // Calculate farmer's portion of the order
      const farmerItems = cartItems.filter(item => item.farmerId === farmerId);
      const farmerTotal = farmerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      await this.notificationsService.sendPushNotification({
        userId: farmerId,
        type: NotificationType.ORDER_PLACED,
        title: '🛒 New Order Received!',
        body: `You have a new order worth ₦${farmerTotal.toLocaleString()}. ${farmerItems.length} item${farmerItems.length > 1 ? 's' : ''} ordered.`,
        data: {
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          total: farmerTotal,
          itemCount: farmerItems.length,
        },
      });
    }

    return savedOrder;
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['buyer', 'assignedRider', 'assignedRider.user'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['buyer', 'assignedRider', 'assignedRider.user'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findByBuyer(buyerId: string, page = 1, limit = 20): Promise<PaginatedResponseDto<Order>> {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { buyerId },
      relations: ['assignedRider', 'assignedRider.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(orders, total, page, limit);
  }

  async findByRider(riderId: string, page = 1, limit = 20): Promise<PaginatedResponseDto<Order>> {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { assignedRiderId: riderId },
      relations: ['buyer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(orders, total, page, limit);
  }

  async findByFarmer(farmerId: string, page = 1, limit = 20): Promise<PaginatedResponseDto<Order>> {
    // Query orders where items JSONB array contains at least one item with this farmerId
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.buyer', 'buyer')
      .leftJoinAndSelect('order.assignedRider', 'assignedRider')
      .leftJoinAndSelect('assignedRider.user', 'riderUser')
      .where(`order.items @> :farmerFilter`, {
        farmerFilter: JSON.stringify([{ farmerId }]),
      })
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();
    return new PaginatedResponseDto(orders, total, page, limit);
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    userId: string,
    userRole: string,
  ): Promise<Order> {
    const order = await this.findById(id);

    // Validate status transition
    this.validateStatusTransition(order.status, dto.status, userRole);

    // Update status
    order.status = dto.status;

    // Set timestamps based on status
    switch (dto.status) {
      case OrderStatus.PICKED_UP:
        order.pickedUpAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        order.deliveredAt = new Date();
        order.actualDeliveryTime = new Date();
        // Process earnings for farmers and rider
        await this.processOrderEarnings(order);
        // Update user preferences for recommendations (async, don't block)
        this.recommendationService.updatePreferencesFromOrder(order.buyerId, order).catch((err) => {
          this.logger.warn(`Failed to update recommendations: ${err.message}`);
        });
        break;
      case OrderStatus.CANCELLED:
        order.cancelledAt = new Date();
        order.cancellationReason = dto.reason;
        // Restore stock to farmers' products
        await this.restoreOrderStock(order);
        // Process refund to buyer's wallet if payment was completed
        await this.processOrderRefund(order);
        break;
    }

    const savedOrder = await this.orderRepository.save(order);

    // Send email notification for status change (async, don't block)
    if (order.buyer?.emailNotificationsEnabled !== false) {
      this.emailService.sendOrderStatusUpdate(savedOrder, order.buyer, dto.status).catch((err) => {
        this.logger.warn(`Failed to send order status email: ${err.message}`);
      });
    }

    // Send push notification to buyer for status updates
    const statusMessages: Record<string, { title: string; body: string }> = {
      confirmed: {
        title: '✅ Order Confirmed',
        body: `Your order ${order.orderNumber} has been confirmed by the farmer.`,
      },
      assigned: {
        title: '🚴 Rider Assigned',
        body: `A rider has been assigned to pick up your order ${order.orderNumber}.`,
      },
      picked_up: {
        title: '📦 Order Picked Up',
        body: `Your order ${order.orderNumber} has been picked up and is on the way!`,
      },
      in_transit: {
        title: '🚀 On The Way',
        body: `Your order ${order.orderNumber} is on the way to you!`,
      },
      delivered: {
        title: '🎉 Order Delivered',
        body: `Your order ${order.orderNumber} has been delivered. Enjoy!`,
      },
      cancelled: {
        title: '❌ Order Cancelled',
        body: `Your order ${order.orderNumber} has been cancelled.`,
      },
    };

    const message = statusMessages[dto.status];
    if (message && order.buyerId) {
      await this.notificationsService.sendPushNotification({
        userId: order.buyerId,
        type: dto.status === 'delivered' ? NotificationType.ORDER_DELIVERED : 
              dto.status === 'cancelled' ? NotificationType.ORDER_CANCELLED :
              dto.status === 'picked_up' ? NotificationType.ORDER_PICKED_UP :
              dto.status === 'assigned' ? NotificationType.ORDER_ASSIGNED :
              NotificationType.ORDER_CONFIRMED,
        title: message.title,
        body: message.body,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: dto.status,
        },
      });
    }

    // Send notification to farmer when order is confirmed/assigned/picked up
    if (['confirmed', 'assigned', 'picked_up', 'in_transit'].includes(dto.status)) {
      const farmerIds = [...new Set((order.items as any[]).map(item => item.farmerId))];
      const farmerStatusMessages: Record<string, { title: string; body: string }> = {
        confirmed: {
          title: '✅ Order Confirmed',
          body: `Order ${order.orderNumber} confirmed. Prepare items for pickup.`,
        },
        assigned: {
          title: '🚴 Rider Assigned',
          body: `A rider has been assigned to pick up order ${order.orderNumber}.`,
        },
        picked_up: {
          title: '📦 Order Picked Up',
          body: `Order ${order.orderNumber} has been picked up by the rider.`,
        },
        in_transit: {
          title: '🚀 Order In Transit',
          body: `Order ${order.orderNumber} is on the way to the customer.`,
        },
      };
      
      const farmerMessage = farmerStatusMessages[dto.status];
      if (farmerMessage) {
        for (const farmerId of farmerIds) {
          await this.notificationsService.sendPushNotification({
            userId: farmerId,
            type: dto.status === 'picked_up' ? NotificationType.ORDER_PICKED_UP :
                  dto.status === 'assigned' ? NotificationType.ORDER_ASSIGNED :
                  NotificationType.ORDER_CONFIRMED,
            title: farmerMessage.title,
            body: farmerMessage.body,
            data: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: dto.status,
            },
          });
        }
      }
    }

    return savedOrder;
  }

  /**
   * Process and distribute earnings to farmers and rider when order is delivered
   */
  private async processOrderEarnings(order: Order): Promise<void> {
    try {
      this.logger.log(`Processing earnings for order ${order.orderNumber}...`);
      this.logger.log(`Order items: ${JSON.stringify(order.items)}`);
      
      // Extract farmer IDs and their subtotals from order items
      const orderItems = order.items.map((item) => ({
        farmerId: item.farmerId,
        subtotal: Number(item.subtotal) || 0,
      }));

      this.logger.log(`Processed order items: ${JSON.stringify(orderItems)}`);

      const farmerIds = [...new Set(orderItems.map((item) => item.farmerId))];
      this.logger.log(`Farmer IDs: ${farmerIds.join(', ')}`);
      this.logger.log(`Assigned Rider ID: ${order.assignedRiderId}`);
      this.logger.log(`Delivery Fee: ${order.deliveryFee}, Subtotal: ${order.subtotal}`);

      // Process the earnings through wallet service
      const result = await this.walletService.processOrderEarnings(
        order.id,
        order.orderNumber,
        farmerIds,
        order.assignedRiderId,
        orderItems,
        Number(order.deliveryFee) || 0,
        Number(order.subtotal) || 0,
      );

      this.logger.log(
        `Order ${order.orderNumber} earnings processed: ` +
        `Farmers earned ${result.farmerEarnings}, ` +
        `Rider earned ${result.riderEarnings}, ` +
        `Platform commission ${result.platformCommission}`,
      );

      // Send notifications to farmers about their earnings
      for (const farmerId of farmerIds) {
        const farmerItems = orderItems.filter((item) => item.farmerId === farmerId);
        const farmerTotal = farmerItems.reduce((sum, item) => sum + item.subtotal, 0);
        
        await this.notificationsService.sendPushNotification({
          userId: farmerId,
          type: NotificationType.EARNINGS_RECEIVED,
          title: 'Earnings Received! 💰',
          body: `You earned from order ${order.orderNumber}. Check your wallet for details.`,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            grossAmount: String(farmerTotal),
          },
        });
      }

      // Send notification to rider about their delivery earnings
      if (order.assignedRider?.userId && order.deliveryFee > 0) {
        await this.notificationsService.sendPushNotification({
          userId: order.assignedRider.userId,
          type: NotificationType.DELIVERY_EARNINGS,
          title: 'Delivery Earnings! 🏍️',
          body: `You earned ₦${order.deliveryFee.toLocaleString()} for delivering order ${order.orderNumber}.`,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: String(order.deliveryFee),
          },
        });
      }
    } catch (error) {
      // Log the error but don't fail the order status update
      this.logger.error(
        `Failed to process earnings for order ${order.orderNumber}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Restore stock to farmers' products when order is cancelled
   */
  private async restoreOrderStock(order: Order): Promise<void> {
    try {
      this.logger.log(`Restoring stock for cancelled order ${order.orderNumber}...`);
      
      const orderItems = order.items as any[];
      
      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        this.logger.warn(`No items found for order ${order.orderNumber}, skipping stock restoration`);
        return;
      }
      
      for (const item of orderItems) {
        // Restore the stock
        await this.productsService.restoreStock(item.productId, item.quantity);
        // Decrement the sales count
        await this.productsService.decrementSales(item.productId, item.quantity);
        
        this.logger.log(
          `Restored ${item.quantity} units of product ${item.productId} (${item.title})`,
        );
      }
      
      this.logger.log(`Stock restored for all items in order ${order.orderNumber}`);
    } catch (error) {
      // Log the error but don't fail the order cancellation
      this.logger.error(
        `Failed to restore stock for order ${order.orderNumber}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process refund to buyer's wallet when order is cancelled
   */
  private async processOrderRefund(order: Order): Promise<void> {
    this.logger.log(
      `[processOrderRefund] Processing refund for order ${order.orderNumber}, paymentStatus: ${order.paymentStatus}, paymentMethod: ${order.paymentMethod}`,
    );
    
    try {
      // Only refund if payment was completed (confirmed status or later)
      if (order.paymentStatus !== PaymentStatus.COMPLETED) {
        this.logger.log(
          `No refund needed for order ${order.orderNumber} - payment status: ${order.paymentStatus}`,
        );
        return;
      }

      const refundAmount = Number(order.total) || Number(order.totalAmount);
      this.logger.log(`[processOrderRefund] Refund amount: ${refundAmount}, buyerId: ${order.buyerId}`);

      if (!refundAmount || refundAmount <= 0) {
        this.logger.warn(`Invalid refund amount for order ${order.orderNumber}: ${refundAmount}`);
        return;
      }

      // Credit the buyer's wallet with the refund
      await this.walletService.creditWallet({
        ownerId: order.buyerId,
        ownerType: WalletOwnerType.BUYER,
        amount: refundAmount,
        category: TransactionCategory.REFUND,
        description: `Refund for cancelled order #${order.orderNumber}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        metadata: {
          reason: order.cancellationReason || 'Order cancelled',
          originalTotal: order.total,
          deliveryFee: order.deliveryFee,
          serviceFee: order.serviceFee,
        },
      });

      // Update payment status to refunded
      order.paymentStatus = PaymentStatus.REFUNDED;
      this.logger.log(`[processOrderRefund] Refund successful, updated paymentStatus to REFUNDED`);

      this.logger.log(
        `Refunded ₦${refundAmount.toLocaleString()} to buyer ${order.buyerId} for order ${order.orderNumber}`,
      );

      // Send notification to buyer about refund
      await this.notificationsService.sendPushNotification({
        userId: order.buyerId,
        type: NotificationType.ORDER_CANCELLED,
        title: 'Order Cancelled - Refund Processed 💰',
        body: `Your order #${order.orderNumber} has been cancelled. ₦${refundAmount.toLocaleString()} has been refunded to your wallet.`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          refundAmount: String(refundAmount),
        },
      });
    } catch (error) {
      // Log the error but don't fail the order cancellation
      this.logger.error(
        `Failed to process refund for order ${order.orderNumber}: ${error.message}`,
        error.stack,
      );
    }
  }

  async assignRider(orderId: string, riderId: string): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.assignedRiderId) {
      throw new BadRequestException('Order already has an assigned rider');
    }

    // Get rider details to find their userId for notifications
    const rider = await this.ridersService.findById(riderId);

    // Calculate ETA based on distances
    const riderLat = rider.currentLatitude || rider.currentLat;
    const riderLng = rider.currentLongitude || rider.currentLng;
    const pickupLat = order.pickupPoint?.lat;
    const pickupLng = order.pickupPoint?.lng;
    const deliveryLat = order.deliveryAddress?.lat || order.deliveryLatitude;
    const deliveryLng = order.deliveryAddress?.lng || order.deliveryLongitude;

    let etaMinutes = 45; // Default 45 minutes
    if (riderLat && riderLng && pickupLat && pickupLng && deliveryLat && deliveryLng) {
      const distanceToPickup = this.calculateDistance(riderLat, riderLng, pickupLat, pickupLng);
      const distancePickupToDelivery = this.calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng);
      const totalDistanceKm = distanceToPickup + distancePickupToDelivery;
      const avgSpeedKmh = 25; // Average speed in city
      const pickupTimeMinutes = 5; // Time for pickup
      etaMinutes = Math.ceil((totalDistanceKm / avgSpeedKmh) * 60) + pickupTimeMinutes;
    }

    const estimatedDeliveryTime = new Date(Date.now() + etaMinutes * 60 * 1000);

    order.assignedRiderId = riderId;
    order.riderAcceptedAt = new Date();
    order.status = OrderStatus.ASSIGNED;
    order.estimatedDeliveryTime = estimatedDeliveryTime;

    const savedOrder = await this.orderRepository.save(order);

    // Send notification to the rider
    try {
      await this.notificationsService.sendPushNotification({
        userId: rider.userId,
        type: NotificationType.ORDER_ASSIGNED,
        title: 'New Order Assigned',
        body: `You have been assigned order #${order.orderNumber}. Check the app for details.`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          pickupAddress: order.pickupPoint?.address || 'Pickup location',
          deliveryAddress: order.deliveryAddress?.address || 'Delivery location',
        },
        priority: 'high',
      });
      this.logger.log(`Notification sent to rider ${riderId} for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to rider: ${error.message}`);
    }

    return savedOrder;
  }

  async getOrdersForDispatch(state: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        status: OrderStatus.CONFIRMED,
        pickupState: state,
        isSameState: true,
      },
      order: { createdAt: 'ASC' },
    });
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    userRole: string,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CREATED, OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CREATED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.ASSIGNED, OrderStatus.RIDER_ASSIGNED, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
      [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.RIDER_ASSIGNED, OrderStatus.ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
      [OrderStatus.RIDER_ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
      [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
      [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
      [OrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }

    // Buyers can cancel orders until the rider has picked up the order
    if (
      userRole === UserRole.BUYER &&
      newStatus === OrderStatus.CANCELLED &&
      ![OrderStatus.PENDING, OrderStatus.CREATED, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.RIDER_ASSIGNED, OrderStatus.ASSIGNED].includes(currentStatus)
    ) {
      throw new ForbiddenException(
        'You can only cancel orders before they are picked up by the rider',
      );
    }
  }

  private calculateDeliveryFee(pickup: PickupPoint, delivery: DeliveryAddress): number {
    // Distance-based fee calculation using actual coordinates
    const baseFee = 500;
    const perKmFee = 50;
    
    // Calculate actual distance if coordinates are available
    let distanceKm = 5; // Default fallback
    
    if (
      pickup.lat && pickup.lng && 
      delivery.lat && delivery.lng
    ) {
      distanceKm = this.calculateDistance(
        pickup.lat,
        pickup.lng,
        delivery.lat,
        delivery.lng
      );
    }
    
    // Apply pricing tiers based on distance
    let fee: number;
    if (distanceKm <= 5) {
      // Tier 1: 0-5km - Base rate
      fee = baseFee + perKmFee * distanceKm;
    } else if (distanceKm <= 10) {
      // Tier 2: 5-10km - Slightly higher rate
      fee = baseFee + (perKmFee * 5) + (perKmFee * 1.2 * (distanceKm - 5));
    } else if (distanceKm <= 20) {
      // Tier 3: 10-20km - Medium rate
      fee = baseFee + (perKmFee * 5) + (perKmFee * 1.2 * 5) + (perKmFee * 1.5 * (distanceKm - 10));
    } else {
      // Tier 4: >20km - Higher rate for long distance
      fee = baseFee + (perKmFee * 5) + (perKmFee * 1.2 * 5) + (perKmFee * 1.5 * 10) + (perKmFee * 2 * (distanceKm - 20));
    }
    
    return Math.round(fee);
  }

  private async applyDiscount(code: string, subtotal: number): Promise<number> {
    // Placeholder - implement discount logic
    // Could check discount codes from a database
    if (code === 'FIRST10') {
      return Math.round(subtotal * 0.1);
    }
    return 0;
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

  /**
   * Get spending insights for a buyer
   */
  async getSpendingInsights(buyerId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Get orders for the period
    const orders = await this.orderRepository.find({
      where: {
        buyerId,
        status: In([OrderStatus.DELIVERED, OrderStatus.CONFIRMED, OrderStatus.IN_TRANSIT]),
        createdAt: MoreThanOrEqual(startDate),
      },
      order: { createdAt: 'ASC' },
    });

    // Calculate spending data by time period
    const spendingData: { label: string; amount: number; orders: number }[] = [];
    const categoryMap = new Map<string, { amount: number; count: number }>();
    const farmerMap = new Map<string, { id: string; name: string; totalOrders: number; totalSpent: number }>();
    let totalSpent = 0;
    let totalOrders = orders.length;
    let totalSaved = 0;

    // Group by period
    if (period === 'week') {
      // Group by day
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });
        const amount = dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        spendingData.push({
          label: dayNames[date.getDay()],
          amount,
          orders: dayOrders.length,
        });
      }
    } else if (period === 'month') {
      // Group by week
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const weekOrders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= weekStart && orderDate < weekEnd;
        });
        const amount = weekOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        spendingData.push({
          label: `Week ${i + 1}`,
          amount,
          orders: weekOrders.length,
        });
      }
    } else {
      // Group by month for quarter/year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsToShow = period === 'quarter' ? 3 : 12;
      for (let i = 0; i < monthsToShow; i++) {
        const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const monthOrders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.getMonth() === monthDate.getMonth() && orderDate.getFullYear() === monthDate.getFullYear();
        });
        const amount = monthOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        spendingData.push({
          label: monthNames[monthDate.getMonth()],
          amount,
          orders: monthOrders.length,
        });
      }
    }

    // Process orders for category and farmer data
    for (const order of orders) {
      totalSpent += Number(order.total || 0);
      totalSaved += Number(order.discount || 0);

      for (const item of order.items || []) {
        // Category tracking (using farmer name as category for now)
        const category = 'Fresh Produce'; // Default category
        const existing = categoryMap.get(category) || { amount: 0, count: 0 };
        existing.amount += Number(item.subtotal || item.price * item.quantity || 0);
        existing.count += 1;
        categoryMap.set(category, existing);

        // Farmer tracking
        if (item.farmerId) {
          const farmerData = farmerMap.get(item.farmerId) || {
            id: item.farmerId,
            name: item.farmerName || 'Unknown Farmer',
            totalOrders: 0,
            totalSpent: 0,
          };
          farmerData.totalOrders += 1;
          farmerData.totalSpent += Number(item.subtotal || item.price * item.quantity || 0);
          farmerMap.set(item.farmerId, farmerData);
        }
      }
    }

    // Build category breakdown with colors
    const categoryColors = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#F44336'];
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data], index) => ({
      category,
      amount: data.amount,
      percentage: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0,
      color: categoryColors[index % categoryColors.length],
      icon: 'leaf' as const,
    }));

    // Get top farmers
    const favoriteFarmers = Array.from(farmerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        name: f.name,
        totalOrders: f.totalOrders,
        totalSpent: f.totalSpent,
        avatar: null,
      }));

    // Calculate savings breakdown
    const savingsSummary = {
      couponSavings: Math.round(totalSaved * 0.4),
      bulkDiscounts: Math.round(totalSaved * 0.3),
      premiumSavings: Math.round(totalSaved * 0.2),
      referralCredits: Math.round(totalSaved * 0.1),
      totalSaved,
    };

    return {
      spendingData,
      categoryBreakdown,
      favoriteFarmers,
      savingsSummary,
      summary: {
        totalSpent,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0,
        totalSaved,
      },
      monthlyBudget: {
        budget: 100000, // Default budget
        spent: totalSpent,
        remaining: Math.max(0, 100000 - totalSpent),
        percentage: Math.min(100, Math.round((totalSpent / 100000) * 100)),
      },
    };
  }

  /**
   * Fix earnings for delivered orders that weren't processed
   * This should be called once to fix historical data
   */
  async fixMissingEarnings(): Promise<{ processed: number; failed: number; errors: string[] }> {
    const deliveredOrders = await this.orderRepository.find({
      where: { status: OrderStatus.DELIVERED },
      relations: ['buyer', 'assignedRider'],
    });

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const order of deliveredOrders) {
      try {
        // Check if earnings already processed by looking at wallet transactions
        const existingTransaction = await this.walletService.checkEarningsProcessed(order.id);
        
        if (!existingTransaction) {
          await this.processOrderEarnings(order);
          this.logger.log(`Processed missing earnings for order ${order.orderNumber}`);
          processed++;
        } else {
          this.logger.log(`Order ${order.orderNumber} already has earnings processed`);
        }
      } catch (error) {
        failed++;
        const errorMsg = `Failed to process order ${order.orderNumber}: ${error.message}`;
        errors.push(errorMsg);
        this.logger.error(errorMsg);
      }
    }

    return { processed, failed, errors };
  }
}
