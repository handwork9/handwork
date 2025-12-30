/**
 * Mock mode configuration
 * 
 * When MOCK_MODE is true:
 * - Authentication uses hardcoded test credentials
 * - OTP verification accepts "123456" as valid code
 * - 2FA verification accepts "123456" as valid code
 * - Useful for development/testing without backend
 * 
 * In production, MOCK_MODE should always be false.
 * 
 * SECURITY: This is enforced - MOCK_MODE will always be false
 * when __DEV__ is false (production builds)
 */
const _MOCK_MODE_DEV = false; // Set to true only for local development
export const MOCK_MODE = __DEV__ ? _MOCK_MODE_DEV : false;

// Validate MOCK_MODE is never true in production
if (!__DEV__ && MOCK_MODE) {
  console.error('CRITICAL SECURITY ERROR: MOCK_MODE cannot be true in production!');
  throw new Error('MOCK_MODE must be false in production builds');
}

// API Configuration
// Always use production API (deployed on Railway)
const API_URL = 'https://handwork-api-production.up.railway.app/api/v1';
const WS_URL = 'https://handwork-api-production.up.railway.app';

export const API_CONFIG = {
  BASE_URL: API_URL,
  TIMEOUT: 30000,
  WS_URL: WS_URL,
};

export const MAP_CONFIG = {
  // Replace with your actual API keys
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  DEFAULT_REGION: {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
};

export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};

// Export individual Stripe key for easier import
export const STRIPE_PUBLISHABLE_KEY = STRIPE_CONFIG.PUBLISHABLE_KEY;

// Google OAuth Client IDs
// Get these from Google Cloud Console: https://console.cloud.google.com
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export const DELIVERY_CONFIG = {
  // Same-state delivery constraints
  MAX_DELIVERY_DISTANCE_KM: 50, // Maximum delivery distance in kilometers
  MIN_DELIVERY_TIME_MINUTES: 15, // Minimum delivery time
  MAX_DELIVERY_TIME_MINUTES: 120, // Maximum delivery time
  RIDER_SEARCH_RADIUS_KM: 10, // Search radius for available riders
  ETA_UPDATE_INTERVAL_MS: 15000, // Update ETA every 15 seconds
  SAME_STATE_ONLY: true, // Enforce same-state deliveries
};

export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'handwork-notifications',
  CHANNEL_NAME: 'Handwork Notifications',
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  QUALITY: 0.8,
};

export const PRODUCT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Seafood',
  'Dairy',
  'Eggs',
  'Meat',
  'Poultry',
  'See All',
  'Grains',
  'Honey',
  'Nuts',
  'Seeds',
  'Other',
] as const;

export const UNITS = [
  'kg',
  'g',
  'lb',
  'oz',
  'liter',
  'ml',
  'piece',
  'dozen',
  'bunch',
  'bag',
] as const;
