import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import { DeliverySlot } from './entities/delivery-slot.entity';
import { ScheduledDelivery } from './entities/scheduled-delivery.entity';
import { Order } from '../database/entities/order.entity';
import { ScheduleDeliveryDto, UpdateScheduledDeliveryDto } from './dto/delivery-scheduling.dto';

@Injectable()
export class DeliverySchedulingService {
  constructor(
    @InjectRepository(DeliverySlot)
    private deliverySlotRepository: Repository<DeliverySlot>,
    @InjectRepository(ScheduledDelivery)
    private scheduledDeliveryRepository: Repository<ScheduledDelivery>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  /**
   * Get available delivery slots for a specific date
   */
  async getAvailableSlots(date: string, state?: string, city?: string) {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Get all active slots
    const slots = await this.deliverySlotRepository.find({
      where: { isActive: true },
    });

    // Filter slots by location and day availability
    const filteredSlots = slots.filter(slot => {
      // Check if slot is available on this day
      if (slot.availableDays && slot.availableDays.length > 0) {
        if (!slot.availableDays.includes(dayOfWeek)) {
          return false;
        }
      }

      // Check location constraints
      if (slot.state && state && slot.state.toLowerCase() !== state.toLowerCase()) {
        return false;
      }
      if (slot.city && city && slot.city.toLowerCase() !== city.toLowerCase()) {
        return false;
      }

      return true;
    });

    // Get booking counts for each slot on this date
    const slotsWithAvailability = await Promise.all(
      filteredSlots.map(async (slot) => {
        const bookingCount = await this.scheduledDeliveryRepository.count({
          where: {
            slotId: slot.id,
            scheduledDate: new Date(date),
            status: In(['pending', 'confirmed']),
          },
        });

        const availableCapacity = slot.maxCapacity - bookingCount;

        return {
          id: slot.id,
          name: slot.name,
          startTime: slot.startTime,
          endTime: slot.endTime,
          additionalFee: slot.additionalFee,
          availableCapacity,
          isAvailable: availableCapacity > 0,
          displayTime: `${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}`,
        };
      })
    );

    return slotsWithAvailability;
  }

  /**
   * Schedule a delivery for an order
   */
  async scheduleDelivery(userId: string, dto: ScheduleDeliveryDto) {
    // Verify order belongs to user
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, buyerId: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify slot exists and is available
    const slot = await this.deliverySlotRepository.findOne({
      where: { id: dto.slotId, isActive: true },
    });

    if (!slot) {
      throw new NotFoundException('Delivery slot not found');
    }

    // Check slot capacity
    const bookingCount = await this.scheduledDeliveryRepository.count({
      where: {
        slotId: dto.slotId,
        scheduledDate: new Date(dto.scheduledDate),
        status: In(['pending', 'confirmed']),
      },
    });

    if (bookingCount >= slot.maxCapacity) {
      throw new BadRequestException('This delivery slot is fully booked');
    }

    // Check if order already has a scheduled delivery
    const existingSchedule = await this.scheduledDeliveryRepository.findOne({
      where: { orderId: dto.orderId },
    });

    if (existingSchedule) {
      // Update existing schedule
      existingSchedule.slotId = dto.slotId;
      existingSchedule.scheduledDate = new Date(dto.scheduledDate);
      existingSchedule.specialInstructions = dto.specialInstructions || existingSchedule.specialInstructions;
      existingSchedule.isExpress = dto.isExpress || false;
      existingSchedule.schedulingFee = Number(slot.additionalFee);

      return this.scheduledDeliveryRepository.save(existingSchedule);
    }

    // Create new scheduled delivery
    const scheduledDelivery = this.scheduledDeliveryRepository.create({
      orderId: dto.orderId,
      slotId: dto.slotId,
      scheduledDate: new Date(dto.scheduledDate),
      specialInstructions: dto.specialInstructions,
      isExpress: dto.isExpress || false,
      schedulingFee: Number(slot.additionalFee),
      status: 'pending',
    });

    return this.scheduledDeliveryRepository.save(scheduledDelivery);
  }

  /**
   * Get scheduled delivery for an order
   */
  async getScheduledDelivery(orderId: string, userId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, buyerId: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const scheduledDelivery = await this.scheduledDeliveryRepository.findOne({
      where: { orderId },
      relations: ['slot'],
    });

    if (!scheduledDelivery) {
      return null;
    }

    return {
      id: scheduledDelivery.id,
      scheduledDate: scheduledDelivery.scheduledDate,
      slot: {
        id: scheduledDelivery.slot.id,
        name: scheduledDelivery.slot.name,
        displayTime: `${this.formatTime(scheduledDelivery.slot.startTime)} - ${this.formatTime(scheduledDelivery.slot.endTime)}`,
      },
      status: scheduledDelivery.status,
      specialInstructions: scheduledDelivery.specialInstructions,
      isExpress: scheduledDelivery.isExpress,
      schedulingFee: scheduledDelivery.schedulingFee,
    };
  }

  /**
   * Update a scheduled delivery
   */
  async updateScheduledDelivery(
    scheduledDeliveryId: string,
    userId: string,
    dto: UpdateScheduledDeliveryDto,
  ) {
    const scheduledDelivery = await this.scheduledDeliveryRepository.findOne({
      where: { id: scheduledDeliveryId },
      relations: ['order'],
    });

    if (!scheduledDelivery) {
      throw new NotFoundException('Scheduled delivery not found');
    }

    // Verify ownership
    if (scheduledDelivery.order.buyerId !== userId) {
      throw new NotFoundException('Scheduled delivery not found');
    }

    // Can't update if already in progress or completed
    if (['in_progress', 'completed'].includes(scheduledDelivery.status)) {
      throw new BadRequestException('Cannot update delivery that is in progress or completed');
    }

    if (dto.slotId) {
      const slot = await this.deliverySlotRepository.findOne({
        where: { id: dto.slotId, isActive: true },
      });
      if (!slot) {
        throw new NotFoundException('Delivery slot not found');
      }
      scheduledDelivery.slotId = dto.slotId;
      scheduledDelivery.schedulingFee = Number(slot.additionalFee);
    }

    if (dto.scheduledDate) {
      scheduledDelivery.scheduledDate = new Date(dto.scheduledDate);
    }

    if (dto.specialInstructions !== undefined) {
      scheduledDelivery.specialInstructions = dto.specialInstructions;
    }

    return this.scheduledDeliveryRepository.save(scheduledDelivery);
  }

  /**
   * Cancel a scheduled delivery
   */
  async cancelScheduledDelivery(scheduledDeliveryId: string, userId: string) {
    const scheduledDelivery = await this.scheduledDeliveryRepository.findOne({
      where: { id: scheduledDeliveryId },
      relations: ['order'],
    });

    if (!scheduledDelivery) {
      throw new NotFoundException('Scheduled delivery not found');
    }

    if (scheduledDelivery.order.buyerId !== userId) {
      throw new NotFoundException('Scheduled delivery not found');
    }

    if (['in_progress', 'completed'].includes(scheduledDelivery.status)) {
      throw new BadRequestException('Cannot cancel delivery that is in progress or completed');
    }

    scheduledDelivery.status = 'cancelled';
    return this.scheduledDeliveryRepository.save(scheduledDelivery);
  }

  /**
   * Get user's upcoming scheduled deliveries
   */
  async getUserScheduledDeliveries(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduledDeliveries = await this.scheduledDeliveryRepository.find({
      where: {
        order: { buyerId: userId },
        scheduledDate: MoreThanOrEqual(today),
        status: In(['pending', 'confirmed']),
      },
      relations: ['order', 'slot'],
      order: { scheduledDate: 'ASC' },
    });

    return scheduledDeliveries.map(sd => ({
      id: sd.id,
      orderId: sd.orderId,
      orderNumber: sd.order.orderNumber,
      scheduledDate: sd.scheduledDate,
      slot: {
        id: sd.slot.id,
        name: sd.slot.name,
        displayTime: `${this.formatTime(sd.slot.startTime)} - ${this.formatTime(sd.slot.endTime)}`,
      },
      status: sd.status,
      isExpress: sd.isExpress,
    }));
  }

  /**
   * Initialize default delivery slots (run once on setup)
   */
  async initializeDefaultSlots() {
    const existingSlots = await this.deliverySlotRepository.count();
    if (existingSlots > 0) {
      return { message: 'Slots already initialized' };
    }

    const defaultSlots = [
      {
        name: 'Morning',
        startTime: '08:00:00',
        endTime: '12:00:00',
        maxCapacity: 50,
        additionalFee: 0,
      },
      {
        name: 'Afternoon',
        startTime: '12:00:00',
        endTime: '16:00:00',
        maxCapacity: 50,
        additionalFee: 0,
      },
      {
        name: 'Evening',
        startTime: '16:00:00',
        endTime: '20:00:00',
        maxCapacity: 50,
        additionalFee: 0,
      },
      {
        name: 'Express (2 hours)',
        startTime: '09:00:00',
        endTime: '19:00:00',
        maxCapacity: 20,
        additionalFee: 500,
      },
    ];

    for (const slot of defaultSlots) {
      await this.deliverySlotRepository.save(this.deliverySlotRepository.create(slot));
    }

    return { message: 'Default slots initialized', count: defaultSlots.length };
  }

  private formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
}
