/**
 * Early Access Gate
 *
 * Shows an early access banner - all purchases and progress
 * transfer to official release (Winter Solstice - Dec 21, 2025).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { COSMIC } from './VeilPathDesign';

export default function BetaGate({ children }) {
  return (
    <View style={styles.container}>
      {/* Early Access Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>✨</Text>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>EARLY ACCESS</Text>
          <Text style={styles.bannerSubtitle}>
            All purchases & progress transfer at launch (Dec 21)
          </Text>
        </View>
      </View>

      {/* The actual app */}
      <View style={styles.appContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appContainer: {
    flex: 1,
  },

  // Early Access Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COSMIC.deepAmethyst + '30',
    borderBottomWidth: 1,
    borderBottomColor: COSMIC.etherealCyan + '40',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  bannerIcon: {
    fontSize: 16,
  },
  bannerTextContainer: {
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: COSMIC.etherealCyan,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  bannerSubtitle: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    opacity: 0.9,
  },
});
