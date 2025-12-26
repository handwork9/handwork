import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { DispatchProcessor } from './dispatch.processor';
import { DispatchGateway } from './dispatch.gateway';
import { DispatchLog, Order, Rider } from '../database/entities';
import { OrdersModule } from '../orders/orders.module';
import { RidersModule } from '../riders/riders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DispatchLog, Order, Rider]),
    BullModule.registerQueue({
      name: 'dispatch',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || 'redis123',
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    }),
    forwardRef(() => OrdersModule),
    forwardRef(() => RidersModule),
  ],
  controllers: [DispatchController],
  providers: [DispatchService, DispatchProcessor, DispatchGateway],
  exports: [DispatchService, DispatchGateway],
})
export class DispatchModule {}
