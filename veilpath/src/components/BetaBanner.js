/**
 * Beta Test Warning Banner
 *
 * Shows a prominent warning that the app is in beta testing.
 * Can be shown app-wide or on specific screens like Shop.
 *
 * Usage:
 * <BetaBanner />
 * <BetaBanner compact />
 * <BetaBanner dismissible onDismiss={() => setShowBanner(false)} />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { COSMIC } from './VeilPathDesign';

export default function BetaBanner({
  compact = false,
  dismissible = false,
  onDismiss,
  style,
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (compact) {
    return (
      <View style={[styles.compactBanner, style]}>
        <Text style={styles.compactIcon}>⚠️</Text>
        <Text style={styles.compactText}>
          BETA TEST - Do not spend real money. All purchases are temporary.
        </Text>
        {dismissible && (
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.banner, style]}>
      <View style={styles.bannerTop}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>BETA TEST MODE</Text>
        {dismissible && (
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.warningsContainer}>
        <View style={styles.warningRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.warningText}>
            <Text style={styles.strong}>DO NOT</Text> spend real money - all purchases are temporary
          </Text>
        </View>
        <View style={styles.warningRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.warningText}>
            Your progress may be reset at any time during beta
          </Text>
        </View>
        <View style={styles.warningRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.warningText}>
            Expect bugs! Please report any issues you find
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Thank you for helping us test VeilPath!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full banner
  banner: {
    backgroundColor: 'rgba(255, 68, 68, 0.12)',
    borderWidth: 2,
    borderColor: '#FF4444',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#FF4444',
  },

  // Warnings
  warningsContainer: {
    marginBottom: 10,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    color: '#FF6666',
    marginRight: 8,
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#FF8888',
    lineHeight: 18,
  },
  strong: {
    fontWeight: '900',
    color: '#FF4444',
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 68, 68, 0.3)',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 100, 100, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Dismiss button
  dismissBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 12,
    color: '#FF4444',
    fontWeight: '700',
  },

  // Compact version
  compactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  compactIcon: {
    fontSize: 14,
  },
  compactText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6666',
  },
});
