import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { redisStore } from 'cache-manager-redis-yet';
import { join } from 'path';

// Configuration
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { redisConfig } from './config/redis.config';
import { servicesConfig } from './config/services.config';
import { dispatchConfig } from './config/dispatch.config';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { RidersModule } from './riders/riders.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { ChatModule } from './chat/chat.module';
import { SupportModule } from './support/support.module';
import { WalletModule } from './wallet/wallet.module';
import { ReferralsModule } from './referrals/referrals.module';
import { RewardsModule } from './rewards/rewards.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PromotionsModule } from './promotions/promotions.module';
import { DiscountsModule } from './discounts/discounts.module';
import { EmailModule } from './email/email.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RecommendationModule } from './recommendations/recommendation.module';
import { FarmersModule } from './farmers/farmers.module';
import { UploadsModule } from './uploads/uploads.module';
import { DisputeModule } from './disputes/dispute.module';
import { BillsModule } from './bills/bills.module';
import { SubscriptionBoxesModule } from './subscription-boxes/subscription-boxes.module';
import { GroupBuyingModule } from './group-buying/group-buying.module';
import { CouponsModule } from './coupons/coupons.module';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';
import { FlashSalesModule } from './flash-sales/flash-sales.module';
import { BadgesModule } from './badges/badges.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { SocialModule } from './social/social.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ModerationModule } from './moderation/moderation.module';
import { PickupLocationsModule } from './pickup-locations/pickup-locations.module';
import { PriceAlertsModule } from './price-alerts/price-alerts.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, servicesConfig, dispatchConfig],
      envFilePath: ['.env', '.env.local'],
    }),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Serve static files from uploads directory
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        // Use DATABASE_URL if available (for Neon and other external databases)
        if (databaseUrl) {
          console.log(`[Database] Connecting via DATABASE_URL`);
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: configService.get('NODE_ENV') === 'development',
            retryAttempts: 15,
            retryDelay: 3000,
          };
        }
        
        // Fallback to individual parameters
        const host = configService.get<string>('database.host');
        const port = configService.get<number>('database.port');
        console.log(`[Database] Connecting to ${host}:${port}`);
        return {
          type: 'postgres',
          host,
          port,
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.name'),
          ssl: configService.get('database.ssl') ? { rejectUnauthorized: false } : false,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: configService.get('NODE_ENV') === 'development',
          retryAttempts: 15,
          retryDelay: 3000,
        };
      },
      inject: [ConfigService],
    }),

    // Redis Cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
          },
          password: configService.get('redis.password') || undefined,
        }),
        ttl: 60 * 1000, // 1 minute default
      }),
      inject: [ConfigService],
    }),

    // BullMQ for Job Queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get('THROTTLE_TTL', 60) * 1000,
            limit: configService.get('THROTTLE_LIMIT', 100),
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    RidersModule,
    DispatchModule,
    PaymentsModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
    ChatModule,
    SupportModule,
    WalletModule,
    ReferralsModule,
    RewardsModule,
    FavoritesModule,
    PromotionsModule,
    DiscountsModule,
    EmailModule,
    ReviewsModule,
    RecommendationModule,
    FarmersModule,
    UploadsModule,
    DisputeModule,
    BillsModule,
    SubscriptionBoxesModule,
    GroupBuyingModule,
    CouponsModule,
    ShoppingListsModule,
    FlashSalesModule,
    BadgesModule,
    LeaderboardModule,
    ChatbotModule,
    SocialModule,
    IntegrationsModule,
    ModerationModule,
    PickupLocationsModule,
    PriceAlertsModule,
  ],
})
export class AppModule {}

