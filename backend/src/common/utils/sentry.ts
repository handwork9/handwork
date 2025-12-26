/**
 * Sentry Error Tracking Configuration for Backend
 * 
 * This file provides Sentry initialization and utility functions
 * for the NestJS backend.
 */

import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN || '';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Initialize Sentry for the NestJS backend
 * Call this function before creating the Nest application
 */
export const initSentry = (): void => {
  if (!SENTRY_DSN) {
    if (isProduction) {
      console.warn('[Sentry] SENTRY_DSN is not set. Error tracking is disabled.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Enable in production
    enabled: isProduction,
    
    // Environment tag
    environment: process.env.NODE_ENV || 'development',
    
    // App version
    release: process.env.APP_VERSION || '1.0.0',
    
    // Sample rate for performance monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      // Enable HTTP instrumentation
      Sentry.httpIntegration(),
      // Enable PostgreSQL instrumentation
      Sentry.postgresIntegration(),
    ],
    
    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive data from event
      if (event.request) {
        // Remove authorization headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        
        // Remove sensitive body fields
        if (event.request.data && typeof event.request.data === 'object') {
          const data: Record<string, unknown> = { ...event.request.data };
          const sensitiveFields = ['password', 'token', 'secret', 'pin', 'otp'];
          sensitiveFields.forEach(field => {
            if (data[field]) data[field] = '[REDACTED]';
          });
          event.request.data = data;
        }
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Ignore network-related errors
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
    ],
  });

  console.log('[Sentry] Backend initialized successfully');
};

/**
 * Capture an exception with optional context
 */
export const captureException = (
  error: Error | unknown,
  context?: Record<string, unknown>,
): void => {
  if (!SENTRY_DSN) {
    console.error('[Error]', error);
    return;
  }

  if (context) {
    Sentry.withScope(scope => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Set user context for better error tracking
 */
export const setUserContext = (userId: string | null): void => {
  if (!SENTRY_DSN) return;
  
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
};

export default Sentry;
