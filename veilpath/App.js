/**
 * VEILPATH APP - Main Entry Point
 * Mental wellness & tarot guidance platform
 * Build: 2025-01-24 - Auth screen polish & background fix
 */

// Dimensions patch is now loaded in index.js BEFORE this file
// See index.js and pre-init-dimensions.js for the React 19 + Hermes fix

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initializeAllStores } from './src/stores';
import { initializeContent } from './src/data/contentLoader';
import { useUserStore } from './src/stores/userStore';
import { useCosmeticsStore } from './src/stores/cosmeticsStore';
import { ErrorBoundary } from './src/components';
import { THEME } from './src/theme/theme';
import { initAnalytics, startSession, trackScreen } from './src/services/analytics';
import { initErrorTracking } from './src/services/errorTracking';
import { initProgressionSync } from './src/services/progressionSync';
import CookieConsent from './src/components/CookieConsent';
import SupportButton, { initLogCapture } from './src/components/SupportButton';
import BetaGate from './src/components/BetaGate';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';

// BotID protection (web only) - invisible bot detection
let initBotId;
if (Platform.OS === 'web') {
  try {
    initBotId = require('botid/client/core').initBotId;
  } catch (e) {
    console.warn('[BotID] Failed to load:', e);
  }
}

// Initialize Sentry ASAP (before any other code runs)
initErrorTracking();

// Start capturing console logs for bug reports
initLogCapture();

// PostHog API Key from environment variable
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;

// Import AAA web components
import { EpicLoadingScreen, CosmicParticles } from './src/web';

// Navigation state persistence key
const NAVIGATION_STATE_KEY = 'veilpath_navigation_state';

// Helper to get active route name from navigation state
function getActiveRouteName(state) {
  if (!state || !state.routes) return null;

  const route = state.routes[state.index];
  if (route.state) {
    // Nested navigator - recurse
    return getActiveRouteName(route.state);
  }
  return route.name;
}

// Deep linking configuration for web URL persistence
// Updated for 4-tab navigation: Home, Practice, Journal, Me
const linking = {
  prefixes: ['veilpath://', 'https://veilpath.vercel.app'],
  config: {
    screens: {
      Auth: 'auth',
      Onboarding: 'onboarding',
      MainApp: {
        screens: {
          // TAB 1: HOME
          HomeTab: {
            screens: {
              HomeMain: 'home',
              ReadingType: 'reading-type',
              SingleCardReading: 'single-card',
              ThreeCardSpread: 'three-card',
              CelticCrossSpread: 'celtic-cross',
              CelticCrossInterpretation: 'celtic-interpretation',
              CardInterpretation: 'interpretation',
              ReadingHistory: 'history',
            },
          },
          // TAB 2: PRACTICE (Readings + Vera + Mindfulness)
          PracticeTab: {
            screens: {
              ReadingType: 'practice',
              Intention: 'practice/intention',
              SingleCardReading: 'practice/single',
              ThreeCardSpread: 'practice/three-card',
              CelticCrossSpread: 'practice/celtic-cross',
              CelticCrossInterpretation: 'practice/celtic-interpretation',
              CardInterpretation: 'practice/interpretation',
              VeraChat: 'vera',
              MindfulnessHome: 'mindfulness',
              MindfulnessPractice: 'mindfulness/practice',
              CBTTools: 'mindfulness/cbt',
              DBTTools: 'mindfulness/dbt',
            },
          },
          // TAB 3: JOURNAL
          JournalTab: {
            screens: {
              JournalList: 'journal',
              JournalEditor: 'journal/edit',
              JournalDetail: 'journal/detail',
            },
          },
          // TAB 4: ME (Profile + Shop + Locker + Quests + Settings)
          MeTab: {
            screens: {
              ProfileMain: 'me',
              Achievements: 'me/achievements',
              Statistics: 'me/stats',
              Shop: 'shop',
              Locker: 'locker',
              DeckViewer: 'locker/deck',
              Quests: 'quests',
              Settings: 'settings',
              NotificationSettings: 'settings/notifications',
              DataExport: 'settings/export',
              AccessibilityScreen: 'settings/accessibility',
              MBTIEncyclopedia: 'mbti',
              MBTITypeDetail: 'mbti/detail',
            },
          },
        },
      },
      Terms: 'terms',
      Privacy: 'privacy',
    },
  },
};


export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [initialNavState, setInitialNavState] = useState(undefined);
  const hasCompletedOnboarding = useUserStore((state) => state.onboarding.completedWelcome);
  const hasVerifiedAge = useUserStore((state) => !!state.profile.ageVerifiedAt);
  const userTier = useUserStore((state) => state.subscription?.tier || 'free');
  const cosmicDust = useCosmeticsStore((state) => state.cosmicDust || 0);

  useEffect(() => {
    // Force cache clear on version change (web only)
    if (Platform.OS === 'web') {
      const APP_VERSION = '1.0.3'; // Increment this on breaking changes - v1.0.3: 4-tab navigation
      const NAV_VERSION = '2'; // Increment when navigation structure changes
      const cachedVersion = localStorage.getItem('veilpath_version');
      const cachedNavVersion = localStorage.getItem('veilpath_nav_version');

      // Clear navigation state if nav structure changed
      if (cachedNavVersion !== NAV_VERSION) {
        console.log('[App] Navigation structure changed, clearing nav state...');
        localStorage.removeItem(NAVIGATION_STATE_KEY);
        localStorage.setItem('veilpath_nav_version', NAV_VERSION);
      }

      if (cachedVersion !== APP_VERSION) {
        console.log('[App] Version change detected, clearing cache...');
        localStorage.setItem('veilpath_version', APP_VERSION);
        // Clear cache and hard reload
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
        window.location.reload(true);
        return; // Don't continue initialization, we're reloading
      }

      // Restore navigation state from localStorage
      try {
        const savedState = localStorage.getItem(NAVIGATION_STATE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          console.log('[App] Restoring navigation state from localStorage');
          setInitialNavState(parsedState);
        }
      } catch (e) {
        console.warn('[App] Failed to restore navigation state:', e);
        // Clear bad state
        localStorage.removeItem(NAVIGATION_STATE_KEY);
      }
    }

    async function initialize() {
      try {
        // Initialize BotID protection (web only)
        // Invisible bot detection for sensitive API endpoints
        if (Platform.OS === 'web' && initBotId) {
          try {
            initBotId({
              protect: [
                // Auth endpoints
                { path: '/api/auth/register', method: 'POST' },
                // AI/expensive endpoints
                { path: '/api/vera/chat', method: 'POST' },
                { path: '/api/synthesize-reading', method: 'POST' },
                { path: '/api/interpret-card', method: 'POST' },
                { path: '/api/analyze-intention', method: 'POST' },
                { path: '/api/analyze-journal-live', method: 'POST' },
                { path: '/api/verify-journal', method: 'POST' },
                { path: '/api/insights', method: 'POST' },
                { path: '/api/oracle', method: 'POST' },
                { path: '/api/embed', method: 'POST' },
              ],
            });
            console.log('[BotID] Initialized - protecting AI endpoints from bots');
          } catch (err) {
            console.warn('[BotID] Init failed (non-fatal):', err);
          }
        }

        // Initialize PostHog analytics (non-blocking)
        if (POSTHOG_API_KEY) {
          initAnalytics(POSTHOG_API_KEY).then(() => {
            startSession(); // Start friction tracking session
          }).catch(err => {
            console.warn('[App] Analytics init failed (non-fatal):', err);
          });
        } else {
          console.log('[App] PostHog not configured - add EXPO_PUBLIC_POSTHOG_KEY to .env');
        }

        // Initialize content library (load JSON files)
        await initializeContent();

        // Initialize all Zustand stores (load from AsyncStorage)
        await initializeAllStores();

        // Initialize Supabase progression sync (non-blocking)
        // This will sync XP, streaks, and quests to the server
        initProgressionSync().catch(err => {
          console.warn('[App] Progression sync init failed (non-fatal):', err);
        });

        setIsReady(true);
      } catch (err) {
        console.error('[App] Initialization failed:', err);
        setError(err.message);
      }
    }

    initialize();
  }, []);

  // Loading screen - AAA quality on web
  if (!isReady) {
    if (Platform.OS === 'web') {
      return <EpicLoadingScreen progress={50} message="Initializing therapeutic content..." />;
    }

    return (
      <View style={styles.loading}>
        <Text style={styles.loadingTitle}>VeilPath</Text>
        <Text style={styles.loadingSubtitle}>Lift the veil on your inner journey</Text>
        <ActivityIndicator size="large" color={THEME.colors.primary[400]} style={styles.spinner} />
        <Text style={styles.loadingText}>Initializing therapeutic content...</Text>
      </View>
    );
  }

  // Error screen
  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>Please restart the app</Text>
      </View>
    );
  }

  // Tier badge config
  const tierConfig = {
    free: { label: 'FREE', color: '#888', bgColor: 'rgba(100,100,100,0.3)' },
    seeker: { label: 'SEEKER', color: '#00F0FF', bgColor: 'rgba(0,240,255,0.2)' },
    adept: { label: 'ADEPT', color: '#9945FF', bgColor: 'rgba(153,69,255,0.2)' },
    mystic: { label: 'MYSTIC', color: '#FFD700', bgColor: 'rgba(255,215,0,0.2)' },
  };
  const tier = tierConfig[userTier] || tierConfig.free;

  // Main app - with AAA web enhancements
  return (
    <ErrorBoundary>
      <SubscriptionProvider>
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Cosmic particle background on web */}
        {Platform.OS === 'web' && <CosmicParticles count={30} />}

        {/* PERSISTENT TIER BADGE - Always visible on all screens */}
        {hasCompletedOnboarding && (
          <View style={[styles.tierBadge, { backgroundColor: tier.bgColor, borderColor: tier.color }]}>
            <Text style={[styles.tierBadgeText, { color: tier.color }]}>{tier.label}</Text>
            <View style={styles.tierGemsBadge}>
              <Text style={styles.tierGemsIcon}>💎</Text>
              <Text style={styles.tierGemsText}>{cosmicDust}</Text>
            </View>
          </View>
        )}

        <BetaGate>
          <NavigationContainer
            linking={Platform.OS === 'web' ? linking : undefined}
            initialState={Platform.OS === 'web' ? initialNavState : undefined}
            onStateChange={(state) => {
              // Track screen views in PostHog
              if (state) {
                const currentRoute = getActiveRouteName(state);
                if (currentRoute) {
                  trackScreen(currentRoute);
                }
              }

              // Persist navigation state to localStorage on web
              if (Platform.OS === 'web' && state) {
                try {
                  localStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
                } catch (e) {
                  // Ignore storage errors
                }
              }
            }}
          >
            {/* Route determination:
                1. No age verification -> AgeGate (handled by AppNavigator)
                2. Age verified but no onboarding -> Onboarding
                3. Everything complete -> MainApp */}
            <AppNavigator
              initialRouteName={
                !hasVerifiedAge ? 'AgeGate' :
                hasCompletedOnboarding ? 'MainApp' : 'Onboarding'
              }
            />
            {/* Floating Support Button - Inside NavigationContainer because it uses useNavigation */}
            {hasCompletedOnboarding && <SupportButton />}
          </NavigationContainer>
        </BetaGate>

        {/* GDPR Cookie Consent Banner (web only) */}
        {Platform.OS === 'web' && <CookieConsent />}
      </View>
      </SubscriptionProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.neutral[1000],
    padding: 20,
  },
  loadingTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: THEME.colors.primary[400],
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: THEME.colors.neutral[300],
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: THEME.colors.neutral[400],
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.semantic.error.base,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: THEME.colors.neutral[200],
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: THEME.colors.neutral[400],
  },
  // Persistent Tier Badge
  tierBadge: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 50,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 9999,
    gap: 8,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tierGemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tierGemsIcon: {
    fontSize: 12,
  },
  tierGemsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
  },
});
