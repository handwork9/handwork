/**
 * Sentry Error Tracking Configuration for Mobile App
 * 
 * This file initializes Sentry for crash reporting and error monitoring.
 * Make sure to set EXPO_PUBLIC_SENTRY_DSN in your environment variables.
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Sentry DSN from environment
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

// Check if we're in production
const isProduction = !__DEV__;

/**
 * Initialize Sentry for error tracking
 * Call this function at app startup (in App.tsx or index.ts)
 */
export const initSentry = (): void => {
  // Only initialize if DSN is configured
  if (!SENTRY_DSN) {
    if (isProduction) {
      console.warn('[Sentry] EXPO_PUBLIC_SENTRY_DSN is not set. Error tracking is disabled.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Enable in production, disable in development (but can be overridden)
    enabled: isProduction,
    
    // Environment tag
    environment: isProduction ? 'production' : 'development',
    
    // App version from expo config
    release: Constants.expoConfig?.version || '1.0.0',
    
    // Sample rate for performance monitoring (1.0 = 100% of transactions)
    tracesSampleRate: isProduction ? 0.2 : 1.0,
    
    // Adjust this for production to reduce noise
    sampleRate: isProduction ? 0.8 : 1.0,
    
    // Capture unhandled promise rejections
    enableAutoPerformanceTracing: true,
    
    // Attach stack traces to messages
    attachStacktrace: true,
    
    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive data from event
      if (event.user) {
        // Don't send email to Sentry
        delete event.user.email;
      }
      
      // Remove auth tokens from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            const data = { ...breadcrumb.data };
            // Remove authorization headers
            if (data.headers) {
              delete data.headers.authorization;
              delete data.headers.Authorization;
            }
            // Remove tokens
            delete data.accessToken;
            delete data.refreshToken;
            delete data.token;
            breadcrumb.data = data;
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Ignore network errors that are usually user connectivity issues
      'Network request failed',
      'Failed to fetch',
      // Ignore user-cancelled operations
      'User cancelled',
      'cancelled',
    ],
  });

  console.log('[Sentry] Initialized successfully');
};

/**
 * Set user context for better error tracking
 */
export const setUserContext = (userId: string | null, extras?: Record<string, string>): void => {
  if (!SENTRY_DSN) return;
  
  if (userId) {
    Sentry.setUser({
      id: userId,
      ...extras,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Capture an exception with optional context
 */
export const captureException = (
  error: Error | unknown,
  context?: Record<string, unknown>
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
 * Capture a message with severity level
 */
export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void => {
  if (!SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
};

/**
 * Add a breadcrumb for context in error reports
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>
): void => {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

/**
 * Wrap a component with Sentry error boundary
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

export default Sentry;
