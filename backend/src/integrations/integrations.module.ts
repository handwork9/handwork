import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { EmailMarketingService } from './email-marketing.service';
import { EmailMarketingController } from './email-marketing.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { User, Order, Product, EmailSubscription, AnalyticsEvent } from '../database/entities';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Order, Product, EmailSubscription, AnalyticsEvent]),
    BullModule.registerQueue(
      { name: 'whatsapp' },
      { name: 'email-marketing' },
      { name: 'analytics' },
    ),
    EmailModule,
  ],
  controllers: [WhatsAppController, EmailMarketingController, AnalyticsController],
  providers: [WhatsAppService, EmailMarketingService, AnalyticsService],
  exports: [WhatsAppService, EmailMarketingService, AnalyticsService],
})
export class IntegrationsModule {}
