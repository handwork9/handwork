/**
 * Environment Variables Validation
 * 
 * This module validates that all required environment variables are set
 * before the application starts. It helps catch configuration issues early.
 */

import { Logger } from '@nestjs/common';

interface EnvVar {
  name: string;
  required: boolean;
  production: boolean; // Only required in production
  description: string;
}

const ENV_VARS: EnvVar[] = [
  // Database
  { name: 'DATABASE_HOST', required: true, production: true, description: 'PostgreSQL host' },
  { name: 'DATABASE_PORT', required: false, production: false, description: 'PostgreSQL port (default: 5432)' },
  { name: 'DATABASE_USERNAME', required: true, production: true, description: 'PostgreSQL username' },
  { name: 'DATABASE_PASSWORD', required: true, production: true, description: 'PostgreSQL password' },
  { name: 'DATABASE_NAME', required: true, production: true, description: 'PostgreSQL database name' },
  
  // JWT
  { name: 'JWT_ACCESS_SECRET', required: true, production: true, description: 'JWT signing secret' },
  { name: 'JWT_REFRESH_SECRET', required: true, production: true, description: 'JWT refresh token secret' },
  
  // Redis
  { name: 'REDIS_HOST', required: false, production: true, description: 'Redis host' },
  { name: 'REDIS_PORT', required: false, production: false, description: 'Redis port (default: 6379)' },
  
  // External Services (Production) - Optional, logged as warnings
  { name: 'STRIPE_SECRET_KEY', required: false, production: false, description: 'Stripe secret key' },
  { name: 'PAYSTACK_SECRET_KEY', required: false, production: false, description: 'Paystack secret key' },
  { name: 'TWILIO_ACCOUNT_SID', required: false, production: false, description: 'Twilio account SID' },
  { name: 'TWILIO_AUTH_TOKEN', required: false, production: false, description: 'Twilio auth token' },
  { name: 'TWILIO_PHONE_NUMBER', required: false, production: false, description: 'Twilio phone number' },
  
  // Email - Optional
  { name: 'SMTP_HOST', required: false, production: false, description: 'SMTP host' },
  { name: 'SMTP_USER', required: false, production: false, description: 'SMTP username' },
  { name: 'SMTP_PASSWORD', required: false, production: false, description: 'SMTP password' },
  
  // Firebase/Expo Push - Optional
  { name: 'FIREBASE_PROJECT_ID', required: false, production: false, description: 'Firebase project ID' },
  
  // Sentry - Optional
  { name: 'SENTRY_DSN', required: false, production: false, description: 'Sentry DSN for error tracking' },
  
  // App Config - Optional
  { name: 'FRONTEND_URL', required: false, production: false, description: 'Frontend URL for CORS' },
  { name: 'API_URL', required: false, production: false, description: 'API URL' },
];

/**
 * Validate environment variables
 * Throws an error if required variables are missing in production
 */
export function validateEnv(): void {
  const logger = new Logger('EnvValidation');
  const isProduction = process.env.NODE_ENV === 'production';
  const missing: string[] = [];
  const warnings: string[] = [];

  logger.log(`Validating environment variables (${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode)`);

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];
    const isEmpty = !value || value.trim() === '';

    if (isEmpty) {
      if (envVar.required) {
        // Always required
        missing.push(`${envVar.name}: ${envVar.description}`);
      } else if (isProduction && envVar.production) {
        // Required in production
        missing.push(`${envVar.name}: ${envVar.description} (required in production)`);
      } else if (envVar.production) {
        // Optional but recommended
        warnings.push(`${envVar.name}: ${envVar.description}`);
      }
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Missing optional environment variables:');
    warnings.forEach(w => logger.warn(`  - ${w}`));
  }

  // Throw error for missing required variables in production
  if (missing.length > 0 && isProduction) {
    logger.error('Missing required environment variables:');
    missing.forEach(m => logger.error(`  - ${m}`));
    throw new Error(
      `Missing ${missing.length} required environment variable(s). ` +
      'Please set them before starting the application in production mode.'
    );
  } else if (missing.length > 0) {
    logger.warn('Missing environment variables (not enforced in development):');
    missing.forEach(m => logger.warn(`  - ${m}`));
  }

  // Validate JWT secrets are strong enough in production
  if (isProduction) {
    const jwtSecret = process.env.JWT_ACCESS_SECRET || '';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';

    if (jwtSecret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters in production');
    }
    if (jwtRefreshSecret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }
    if (jwtSecret === jwtRefreshSecret) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
    }
    
    // Check for placeholder secrets
    if (jwtSecret.includes('change_me') || jwtSecret.includes('your_jwt')) {
      throw new Error('JWT_ACCESS_SECRET contains placeholder text - generate a real secret!');
    }
    if (jwtRefreshSecret.includes('change_me') || jwtRefreshSecret.includes('your_jwt')) {
      throw new Error('JWT_REFRESH_SECRET contains placeholder text - generate a real secret!');
    }
  }

  logger.log('Environment validation completed successfully');
}

/**
 * Get an environment variable with a default fallback
 */
export function getEnv(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue;
}

/**
 * Get an environment variable as a number
 */
export function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get an environment variable as a boolean
 */
export function getEnvBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}
