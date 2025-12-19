// Enable mock mode for development without a backend
export const MOCK_MODE = false; // Backend is now available

// Use your machine's IP for mobile device/emulator access
// For iOS Simulator, localhost works. For Android emulator, use 10.0.2.2
// For real devices, use your machine's IP address
const DEV_API_HOST = '192.168.0.138'; // Your local network IP

export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? `http://${DEV_API_HOST}:3001/api/v1` 
    : 'https://api.handwork.com/api/v1',
  TIMEOUT: 30000,
  WS_URL: __DEV__
    ? `ws://${DEV_API_HOST}:3001`
    : 'wss://api.handwork.com',
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
