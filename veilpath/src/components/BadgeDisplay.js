/**
 * Badge Display - VeilPath WitchTok x Victorian Gothic
 * Shows earned achievements on main screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { getFeaturedBadges } from '../services/achievementSystem';

// Import VeilPath Design System
import {
  COSMIC,
  VictorianCard,
} from './VeilPathDesign';

// Map badge colors to COSMIC palette
const getBadgeColor = (colorName) => {
  const colorMap = {
    hiCyan: COSMIC.etherealCyan,
    hiMagenta: COSMIC.deepAmethyst,
    hiGreen: COSMIC.candleFlame,
    hiYellow: COSMIC.candleFlame,
    hiRed: COSMIC.crystalPink,
    dimCyan: COSMIC.etherealCyan,
    dimMagenta: COSMIC.deepAmethyst,
  };
  return colorMap[colorName] || COSMIC.candleFlame;
};

export default function BadgeDisplay({ onPress, compact = false }) {
  const [badges, setBadges] = useState([]);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadBadges();

    // Subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadBadges = async () => {
    const featured = await getFeaturedBadges();
    setBadges(featured);
  };

  if (badges.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {badges.map((badge, index) => {
          const badgeColor = getBadgeColor(badge.color);
          return (
            <Animated.View
              key={badge.id}
              style={[
                styles.compactBadge,
                {
                  transform: [{ scale: pulseAnim }],
                  borderColor: badgeColor,
                },
              ]}
            >
              <Text style={[styles.compactIcon, { color: badgeColor }]}>
                {badge.icon}
              </Text>
            </Animated.View>
          );
        })}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
    >
      <VictorianCard style={styles.container}>
        <Text style={styles.label}>Achievements</Text>

        <View style={styles.badgeRow}>
          {badges.map((badge) => {
            const badgeColor = getBadgeColor(badge.color);
            return (
              <Animated.View
                key={badge.id}
                style={[
                  styles.badge,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: badgeColor,
                    shadowColor: badgeColor,
                  },
                ]}
              >
                <Text style={[styles.icon, { color: badgeColor }]}>
                  {badge.icon}
                </Text>

                <View style={[styles.tierIndicator, { backgroundColor: badgeColor }]}>
                  <Text style={styles.tierText}>
                    {badge.tier[0].toUpperCase()}
                  </Text>
                </View>
              </Animated.View>
            );
          })}

          {/* Show empty slots if less than 3 */}
          {badges.length < 3 &&
            Array(3 - badges.length).fill(0).map((_, index) => (
              <View key={`empty_${index}`} style={styles.emptyBadge}>
                <Text style={styles.emptyIcon}>?</Text>
              </View>
            ))
          }
        </View>

        <Text style={styles.hint}>Tap to view all</Text>
      </VictorianCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  compactBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: 'rgba(10, 5, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactIcon: {
    fontSize: 18,
  },

  // Full styles
  container: {
    padding: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: 'rgba(10, 5, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  icon: {
    fontSize: 28,
  },
  tierIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a1f3a',
  },
  emptyBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(10, 5, 20, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 24,
    color: COSMIC.crystalPink,
    opacity: 0.5,
  },
  hint: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.7,
  },
});
