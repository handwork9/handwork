/**
 * Security Configuration Constants
 * 
 * Centralized security settings for the application.
 */

/**
 * Bcrypt configuration
 * 
 * Rounds = 12 provides good security vs performance balance.
 * Each increment doubles the computation time:
 * - 10 rounds: ~10 hashes/sec
 * - 12 rounds: ~2-3 hashes/sec
 * - 14 rounds: ~0.5 hashes/sec
 */
export const BCRYPT_ROUNDS = 12;

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  MIN_SECRET_LENGTH: 32,
};

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  // Default rate limit
  DEFAULT: {
    ttl: 60000, // 1 minute
    limit: 100,
  },
  // Strict rate limit for auth endpoints
  AUTH: {
    ttl: 60000, // 1 minute
    limit: 5, // 5 attempts per minute
  },
  // OTP rate limit
  OTP: {
    ttl: 60000, // 1 minute
    limit: 3, // 3 OTP requests per minute
  },
  // Password reset rate limit
  PASSWORD_RESET: {
    ttl: 300000, // 5 minutes
    limit: 3, // 3 reset requests per 5 minutes
  },
};

/**
 * File Upload Configuration
 */
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BODY_SIZE: '10mb',
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
};

/**
 * Password Policy
 */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,
};
