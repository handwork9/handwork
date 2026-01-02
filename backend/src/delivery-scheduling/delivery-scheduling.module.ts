import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliverySchedulingController } from './delivery-scheduling.controller';
import { DeliverySchedulingService } from './delivery-scheduling.service';
import { DeliverySlot } from './entities/delivery-slot.entity';
import { ScheduledDelivery } from './entities/scheduled-delivery.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliverySlot, ScheduledDelivery, Order]),
  ],
  controllers: [DeliverySchedulingController],
  providers: [DeliverySchedulingService],
  exports: [DeliverySchedulingService],
})
export class DeliverySchedulingModule {}
