/**
 * WebSocket CORS Configuration
 * 
 * Centralizes CORS settings for all WebSocket gateways.
 * In production, origins are restricted to specific domains.
 * In development, all origins are allowed for easier testing.
 */

const isProduction = process.env.NODE_ENV === 'production';

// Allowed origins in production
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'https://handwork.com',
  process.env.ADMIN_URL || 'https://admin.handwork.com',
  // Add mobile app schemes if needed
  'handwork://',
];

/**
 * Get CORS options for WebSocket gateways
 */
export function getWebSocketCorsOptions() {
  if (isProduction) {
    return {
      origin: ALLOWED_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST'],
    };
  }

  // Development: Allow all origins for easier testing
  return {
    origin: true, // Allows the origin from the request
    credentials: true,
    methods: ['GET', 'POST'],
  };
}

/**
 * CORS options object for use in @WebSocketGateway decorator
 * Note: This returns the resolved value, use getWebSocketCorsOptions() for dynamic config
 */
export const WS_CORS_OPTIONS = getWebSocketCorsOptions();
