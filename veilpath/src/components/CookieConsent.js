/**
 * COOKIE CONSENT BANNER
 * GDPR/CCPA compliant cookie consent for web
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Linking,
} from 'react-native';
import { COSMIC } from './VeilPathDesign';

const CONSENT_KEY = 'veilpath_cookie_consent';
const PRIVACY_URL = 'https://veilpath.app/privacy';
const COOKIE_POLICY_URL = 'https://veilpath.app/cookies';

/**
 * Get consent status from localStorage
 */
function getConsentStatus() {
  if (Platform.OS !== 'web') return null;
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent ? JSON.parse(consent) : null;
  } catch {
    return null;
  }
}

/**
 * Save consent status to localStorage
 */
function saveConsentStatus(status) {
  if (Platform.OS !== 'web') return;
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      ...status,
      timestamp: Date.now(),
      version: '1.0',
    }));
  } catch (e) {
    console.error('[CookieConsent] Failed to save consent:', e);
  }
}

/**
 * Check if consent is needed (no prior consent or consent expired)
 */
function needsConsent() {
  const consent = getConsentStatus();
  if (!consent) return true;

  // Re-prompt if consent is older than 1 year
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (Date.now() - consent.timestamp > oneYear) return true;

  return false;
}

export function CookieConsent({ onConsentChange }) {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [slideAnim] = useState(new Animated.Value(100));

  useEffect(() => {
    // Only show on web
    if (Platform.OS !== 'web') return;

    // Check if consent is needed
    if (needsConsent()) {
      setVisible(true);
      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    } else {
      // Already consented, notify parent
      const consent = getConsentStatus();
      onConsentChange?.(consent);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      essential: true,
      analytics: true,
      marketing: false, // We don't do marketing cookies
    };
    saveConsentStatus(consent);
    onConsentChange?.(consent);
    animateOut();
  };

  const handleAcceptEssential = () => {
    const consent = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    saveConsentStatus(consent);
    onConsentChange?.(consent);
    animateOut();
  };

  const animateOut = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const openLink = (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  if (!visible || Platform.OS !== 'web') return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={styles.title}>🍪 Cookie Preferences</Text>
          <Text style={styles.description}>
            We use cookies to enhance your mystical journey. Essential cookies keep VeilPath working.
            Analytics cookies help us understand how seekers use the app.
          </Text>

          {showDetails && (
            <View style={styles.detailsSection}>
              <View style={styles.cookieType}>
                <Text style={styles.cookieLabel}>Essential Cookies</Text>
                <Text style={styles.cookieDesc}>
                  Required for authentication, security, and basic functionality.
                  Cannot be disabled.
                </Text>
              </View>
              <View style={styles.cookieType}>
                <Text style={styles.cookieLabel}>Analytics Cookies</Text>
                <Text style={styles.cookieDesc}>
                  Help us understand app usage via PostHog.
                  No personal data is sold or shared with advertisers.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.links}>
            <TouchableOpacity onPress={() => openLink(PRIVACY_URL)}>
              <Text style={styles.link}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity onPress={() => openLink(COOKIE_POLICY_URL)}>
              <Text style={styles.link}>Cookie Policy</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity onPress={() => setShowDetails(!showDetails)}>
              <Text style={styles.link}>
                {showDetails ? 'Hide Details' : 'Learn More'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.acceptAllButton}
            onPress={handleAcceptAll}
          >
            <Text style={styles.acceptAllText}>Accept All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.essentialButton}
            onPress={handleAcceptEssential}
          >
            <Text style={styles.essentialText}>Essential Only</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * Hook to check cookie consent status
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setConsent(getConsentStatus());
    }
  }, []);

  return {
    consent,
    hasAnalyticsConsent: consent?.analytics ?? false,
    hasEssentialConsent: consent?.essential ?? true,
    updateConsent: (newConsent) => {
      saveConsentStatus(newConsent);
      setConsent(newConsent);
    },
  };
}

/**
 * Reset consent (for settings page)
 */
export function resetCookieConsent() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(CONSENT_KEY);
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 5, 20, 0.98)',
    borderTopWidth: 2,
    borderTopColor: COSMIC.deepAmethyst,
    zIndex: 9999,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
    }),
  },
  content: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
  },
  textSection: {
    flex: 1,
    minWidth: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 20,
    marginBottom: 10,
  },
  detailsSection: {
    backgroundColor: 'rgba(45, 27, 78, 0.5)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  cookieType: {
    marginBottom: 10,
  },
  cookieLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.etherealCyan,
    marginBottom: 4,
  },
  cookieDesc: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    lineHeight: 18,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  link: {
    fontSize: 13,
    color: COSMIC.etherealCyan,
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    color: COSMIC.crystalPink,
    opacity: 0.5,
  },
  buttonSection: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  acceptAllButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  acceptAllText: {
    color: COSMIC.midnightVoid,
    fontSize: 14,
    fontWeight: '700',
  },
  essentialButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COSMIC.deepAmethyst,
    minWidth: 120,
    alignItems: 'center',
  },
  essentialText: {
    color: COSMIC.moonGlow,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CookieConsent;
