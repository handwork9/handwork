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
import { DeliverySchedulingService } from './delivery-scheduling.service';
import { ScheduleDeliveryDto, UpdateScheduledDeliveryDto } from './dto/delivery-scheduling.dto';

@Controller('delivery-scheduling')
@UseGuards(JwtAuthGuard)
export class DeliverySchedulingController {
  constructor(private readonly deliverySchedulingService: DeliverySchedulingService) {}

  /**
   * Get available delivery slots for a specific date
   * GET /delivery-scheduling/slots?date=2026-01-03&state=Lagos&city=Ikeja
   */
  @Get('slots')
  async getAvailableSlots(
    @Query('date') date: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
  ) {
    const slots = await this.deliverySchedulingService.getAvailableSlots(date, state, city);
    return {
      success: true,
      data: slots,
    };
  }

  /**
   * Schedule a delivery for an order
   * POST /delivery-scheduling
   */
  @Post()
  async scheduleDelivery(
    @Req() req: any,
    @Body() dto: ScheduleDeliveryDto,
  ) {
    const scheduledDelivery = await this.deliverySchedulingService.scheduleDelivery(
      req.user.userId,
      dto,
    );
    return {
      success: true,
      data: scheduledDelivery,
      message: 'Delivery scheduled successfully',
    };
  }

  /**
   * Get scheduled delivery for an order
   * GET /delivery-scheduling/order/:orderId
   */
  @Get('order/:orderId')
  async getScheduledDelivery(
    @Req() req: any,
    @Param('orderId') orderId: string,
  ) {
    const scheduledDelivery = await this.deliverySchedulingService.getScheduledDelivery(
      orderId,
      req.user.userId,
    );
    return {
      success: true,
      data: scheduledDelivery,
    };
  }

  /**
   * Get user's upcoming scheduled deliveries
   * GET /delivery-scheduling/upcoming
   */
  @Get('upcoming')
  async getUserScheduledDeliveries(@Req() req: any) {
    const scheduledDeliveries = await this.deliverySchedulingService.getUserScheduledDeliveries(
      req.user.userId,
    );
    return {
      success: true,
      data: scheduledDeliveries,
    };
  }

  /**
   * Update a scheduled delivery
   * PUT /delivery-scheduling/:id
   */
  @Put(':id')
  async updateScheduledDelivery(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateScheduledDeliveryDto,
  ) {
    const updatedDelivery = await this.deliverySchedulingService.updateScheduledDelivery(
      id,
      req.user.userId,
      dto,
    );
    return {
      success: true,
      data: updatedDelivery,
      message: 'Scheduled delivery updated',
    };
  }

  /**
   * Cancel a scheduled delivery
   * DELETE /delivery-scheduling/:id
   */
  @Delete(':id')
  async cancelScheduledDelivery(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    await this.deliverySchedulingService.cancelScheduledDelivery(id, req.user.userId);
    return {
      success: true,
      message: 'Scheduled delivery cancelled',
    };
  }

  /**
   * Initialize default delivery slots (admin only, called once)
   * POST /delivery-scheduling/init-slots
   */
  @Post('init-slots')
  async initializeSlots() {
    const result = await this.deliverySchedulingService.initializeDefaultSlots();
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get all scheduled deliveries (admin)
   * GET /delivery-scheduling/scheduled
   */
  @Get('scheduled')
  async getAllScheduledDeliveries(
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const deliveries = await this.deliverySchedulingService.getAllScheduledDeliveries(status, date);
    return {
      success: true,
      data: deliveries,
    };
  }

  /**
   * Create or update a delivery slot (admin)
   * POST /delivery-scheduling/slots
   */
  @Post('slots')
  async createSlot(@Body() dto: any) {
    const slot = await this.deliverySchedulingService.createOrUpdateSlot(dto);
    return {
      success: true,
      data: slot,
    };
  }

  /**
   * Update a delivery slot (admin)
   * PUT /delivery-scheduling/slots/:id
   */
  @Put('slots/:id')
  async updateSlot(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const slot = await this.deliverySchedulingService.createOrUpdateSlot({ ...dto, id });
    return {
      success: true,
      data: slot,
    };
  }

  /**
   * Delete a delivery slot (admin)
   * DELETE /delivery-scheduling/slots/:id
   */
  @Delete('slots/:id')
  async deleteSlot(@Param('id') id: string) {
    await this.deliverySchedulingService.deleteSlot(id);
    return {
      success: true,
      message: 'Slot deleted',
    };
  }
}
