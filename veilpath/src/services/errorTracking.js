/**
 * ERROR TRACKING SERVICE
 *
 * Sentry integration for crash reporting and error tracking.
 * Free tier: 5K errors/month
 *
 * Setup in Sentry Dashboard:
 * 1. Create React Native project
 * 2. Get DSN from Project Settings → Client Keys
 * 3. Add to .env: EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

let isInitialized = false;

/**
 * Initialize Sentry error tracking
 * Call this in App.js before rendering
 */
export function initErrorTracking() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.log('[Sentry] No DSN configured - add EXPO_PUBLIC_SENTRY_DSN to .env');
    return;
  }

  if (isInitialized) {
    console.log('[Sentry] Already initialized');
    return;
  }

  try {
    Sentry.init({
      dsn,
      // Set environment
      environment: __DEV__ ? 'development' : 'production',
      // Performance monitoring - sample 20% of transactions
      tracesSampleRate: 0.2,
      // Only send errors in production
      enabled: !__DEV__,
      // App version for release tracking
      release: 'veilpath@1.0.0',
      // Additional context
      initialScope: {
        tags: {
          platform: Platform.OS,
        },
      },
      // Filter out noisy errors
      beforeSend(event, hint) {
        // Don't send network errors (user's connection issue)
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }
        return event;
      },
    });

    isInitialized = true;
    console.log('[Sentry] Initialized for error tracking');
  } catch (error) {
    console.error('[Sentry] Init failed:', error);
  }
}

/**
 * Capture an exception manually
 */
export function captureException(error, context = {}) {
  if (!isInitialized) {
    console.error('[Sentry] Not initialized, error:', error);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message (for non-exception issues)
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!isInitialized) {
    console.log('[Sentry] Not initialized, message:', message);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context (call on login)
 */
export function setUser(userId, email = null, traits = {}) {
  if (!isInitialized) return;

  Sentry.setUser({
    id: userId,
    email,
    ...traits,
  });
}

/**
 * Clear user context (call on logout)
 */
export function clearUser() {
  if (!isInitialized) return;
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(message, category = 'app', data = {}) {
  if (!isInitialized) return;

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Wrap a component with Sentry error boundary
 * Usage: export default withErrorBoundary(MyComponent)
 */
export const withErrorBoundary = Sentry.wrap;

/**
 * Start a performance transaction
 */
export function startTransaction(name, op = 'navigation') {
  if (!isInitialized) return null;
  return Sentry.startTransaction({ name, op });
}

export default {
  init: initErrorTracking,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  withErrorBoundary,
  startTransaction,
};
