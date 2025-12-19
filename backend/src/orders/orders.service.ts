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
import { Repository, In } from 'typeorm';
import { Order, OrderItem, DeliveryAddress, PickupPoint } from '../database/entities/order.entity';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { WalletService } from '../wallet/wallet.service';
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

    if (dto.items && dto.items.length > 0) {
      // Use items provided in the request (from frontend cart)
      for (const item of dto.items) {
        const product = await this.productsService.findById(item.productId);
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.title}. Only ${product.stock} available.`,
          );
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

      // Validate stock for all items
      for (const item of cartItems) {
        const product = await this.productsService.findById(item.productId);
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.title}. Only ${product.stock} available.`,
          );
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

    // Create order
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
      status: OrderStatus.CREATED,
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
    });

    const savedOrder = await this.orderRepository.save(order);

    // Update product stock
    for (const item of cartItems) {
      await this.productsService.updateStock(item.productId, item.quantity);
      await this.productsService.incrementSales(item.productId, item.quantity);
    }

    // Clear cart
    await this.cartService.clearCart(buyerId);

    return savedOrder;
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['buyer', 'assignedRider'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['buyer', 'assignedRider'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findByBuyer(buyerId: string, page = 1, limit = 20): Promise<PaginatedResponseDto<Order>> {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { buyerId },
      relations: ['assignedRider'],
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

    return savedOrder;
  }

  /**
   * Process and distribute earnings to farmers and rider when order is delivered
   */
  private async processOrderEarnings(order: Order): Promise<void> {
    try {
      // Extract farmer IDs and their subtotals from order items
      const orderItems = order.items.map((item) => ({
        farmerId: item.farmerId,
        subtotal: item.subtotal,
      }));

      const farmerIds = [...new Set(orderItems.map((item) => item.farmerId))];

      // Process the earnings through wallet service
      const result = await this.walletService.processOrderEarnings(
        order.id,
        order.orderNumber,
        farmerIds,
        order.assignedRiderId,
        orderItems,
        order.deliveryFee,
        order.subtotal,
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
      if (order.assignedRiderId && order.deliveryFee > 0) {
        await this.notificationsService.sendPushNotification({
          userId: order.assignedRiderId,
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
   * Process refund to buyer's wallet when order is cancelled
   */
  private async processOrderRefund(order: Order): Promise<void> {
    try {
      // Only refund if payment was completed (confirmed status or later)
      if (order.paymentStatus !== PaymentStatus.COMPLETED) {
        this.logger.log(
          `No refund needed for order ${order.orderNumber} - payment status: ${order.paymentStatus}`,
        );
        return;
      }

      const refundAmount = Number(order.total) || Number(order.totalAmount);

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

    order.assignedRiderId = riderId;
    order.riderAcceptedAt = new Date();
    order.status = OrderStatus.ASSIGNED;

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
      [OrderStatus.PENDING]: [OrderStatus.CREATED, OrderStatus.CANCELLED],
      [OrderStatus.CREATED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
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

    // Buyers can only cancel orders while payment is still processing (pending or created)
    if (
      userRole === UserRole.BUYER &&
      newStatus === OrderStatus.CANCELLED &&
      ![OrderStatus.PENDING, OrderStatus.CREATED].includes(currentStatus)
    ) {
      throw new ForbiddenException(
        'You can only cancel orders while payment is still processing',
      );
    }
  }

  private calculateDeliveryFee(pickup: PickupPoint, delivery: DeliveryAddress): number {
    // Simple distance-based fee calculation
    // In production, use actual distance matrix API
    const baseFee = 500;
    const perKmFee = 50;
    const estimatedKm = 5; // Placeholder - use actual distance
    return baseFee + perKmFee * estimatedKm;
  }

  private async applyDiscount(code: string, subtotal: number): Promise<number> {
    // Placeholder - implement discount logic
    // Could check discount codes from a database
    if (code === 'FIRST10') {
      return Math.round(subtotal * 0.1);
    }
    return 0;
  }
}
