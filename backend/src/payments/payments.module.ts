import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { Payment, Order, User } from '../database/entities';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order, User]),
    forwardRef(() => OrdersModule),
    forwardRef(() => UsersModule),
    EmailModule,
  ],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, PaystackService],
  exports: [PaymentsService, PaystackService],
})
export class PaymentsModule {}
