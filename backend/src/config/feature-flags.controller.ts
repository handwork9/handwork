import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
}

interface Experiment {
  id: string;
  name: string;
  variants: string[];
  weights: number[];
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

@ApiTags('Config')
@Controller('config')
export class FeatureFlagsController {
  private featureFlags: Record<string, boolean>;
  private experiments: Experiment[];

  constructor(private readonly configService: ConfigService) {
    // Default feature flags - can be overridden by environment variables
    this.featureFlags = {
      new_checkout_flow: this.configService.get('FEATURE_NEW_CHECKOUT', 'false') === 'true',
      social_features: this.configService.get('FEATURE_SOCIAL', 'true') === 'true',
      video_stories: this.configService.get('FEATURE_VIDEO_STORIES', 'false') === 'true',
      premium_subscription: this.configService.get('FEATURE_PREMIUM', 'false') === 'true',
      group_buying: this.configService.get('FEATURE_GROUP_BUYING', 'true') === 'true',
      live_streaming: this.configService.get('FEATURE_LIVE_STREAMING', 'true') === 'true',
      ai_chatbot: this.configService.get('FEATURE_AI_CHATBOT', 'true') === 'true',
      price_alerts: this.configService.get('FEATURE_PRICE_ALERTS', 'true') === 'true',
      subscription_boxes: this.configService.get('FEATURE_SUBSCRIPTION_BOXES', 'true') === 'true',
      dark_mode: this.configService.get('FEATURE_DARK_MODE', 'true') === 'true',
      biometric_auth: this.configService.get('FEATURE_BIOMETRIC_AUTH', 'true') === 'true',
      voice_search: this.configService.get('FEATURE_VOICE_SEARCH', 'false') === 'true',
      ar_product_preview: this.configService.get('FEATURE_AR_PREVIEW', 'false') === 'true',
      offline_mode: this.configService.get('FEATURE_OFFLINE_MODE', 'true') === 'true',
    };

    // Default experiments
    this.experiments = [
      {
        id: 'checkout_flow_v2',
        name: 'New Checkout Flow Test',
        variants: ['control', 'variant_a', 'variant_b'],
        weights: [34, 33, 33],
        isActive: false,
      },
      {
        id: 'home_layout',
        name: 'Home Screen Layout Test',
        variants: ['grid', 'list'],
        weights: [50, 50],
        isActive: true,
      },
      {
        id: 'product_card_design',
        name: 'Product Card Design Test',
        variants: ['current', 'compact', 'detailed'],
        weights: [40, 30, 30],
        isActive: true,
      },
    ];
  }

  @Public()
  @Get('feature-flags')
  @ApiOperation({ summary: 'Get feature flags for the app' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for personalized flags' })
  @ApiQuery({ name: 'bucket', required: false, description: 'User bucket (0-99) for A/B testing' })
  @ApiResponse({
    status: 200,
    description: 'Feature flags and experiments',
    schema: {
      type: 'object',
      properties: {
        flags: {
          type: 'object',
          additionalProperties: { type: 'boolean' },
        },
        experiments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              variants: { type: 'array', items: { type: 'string' } },
              weights: { type: 'array', items: { type: 'number' } },
              isActive: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  getFeatureFlags(
    @Query('userId') userId?: string,
    @Query('bucket') bucket?: string,
  ): { flags: Record<string, boolean>; experiments: Experiment[] } {
    // Could customize flags based on userId or bucket here
    // For now, return the same flags for everyone
    const userBucket = bucket ? parseInt(bucket, 10) : null;
    
    // Filter active experiments
    const activeExperiments = this.experiments.filter(exp => exp.isActive);

    return {
      flags: this.featureFlags,
      experiments: activeExperiments,
    };
  }

  @Get('feature-flags/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all feature flags including inactive (admin)' })
  getAllFeatureFlags(): { flags: Record<string, boolean>; experiments: Experiment[] } {
    return {
      flags: this.featureFlags,
      experiments: this.experiments,
    };
  }

  @Get('app-config')
  @Public()
  @ApiOperation({ summary: 'Get app configuration' })
  @ApiResponse({
    status: 200,
    description: 'App configuration',
  })
  getAppConfig(): {
    minAppVersion: string;
    latestAppVersion: string;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    storeUrls: { ios: string; android: string };
    supportEmail: string;
    supportPhone: string;
  } {
    return {
      minAppVersion: this.configService.get('MIN_APP_VERSION', '1.0.0'),
      latestAppVersion: this.configService.get('LATEST_APP_VERSION', '1.0.0'),
      maintenanceMode: this.configService.get('MAINTENANCE_MODE', 'false') === 'true',
      maintenanceMessage: this.configService.get('MAINTENANCE_MESSAGE'),
      storeUrls: {
        ios: this.configService.get('APP_STORE_URL', 'https://apps.apple.com/app/handwork'),
        android: this.configService.get('PLAY_STORE_URL', 'https://play.google.com/store/apps/details?id=com.handwork.app'),
      },
      supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@handwork.ng'),
      supportPhone: this.configService.get('SUPPORT_PHONE', '+234 800 HANDWORK'),
    };
  }
}
