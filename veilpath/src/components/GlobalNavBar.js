/**
 * Global Navigation Bar
 *
 * Persistent top bar across all screens showing:
 * - Left: Shop button + Subscription tier
 * - Center: VEILPATH logo
 * - Right: Level + XP (tap → Profile)
 *
 * Usage: Import and place at top of any screen, or wrap in navigation
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../stores/userStore';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useCosmeticsStore } from '../stores/cosmeticsStore';
import { COSMIC } from './VeilPathDesign';

export default function GlobalNavBar({ showLogo = true, title = null }) {
  const navigation = useNavigation();
  const user = useUserStore();

  // Get subscription info with fallback for when context isn't available
  let tier = 'free';
  let isPro = false;
  let hasLifetime = false;

  try {
    const subscription = useSubscription();
    tier = subscription.tier;
    isPro = subscription.isPro;
    hasLifetime = subscription.hasLifetime;
  } catch (e) {
    // Context not available, use defaults
  }

  const tierDisplay = hasLifetime ? 'Lifetime' : isPro ? 'Premium' : 'Free';

  // Get currency
  const currency = user.progression?.currency || 0;

  const handleShopPress = () => {
    navigation.navigate('MeTab', { screen: 'Shop' });
  };

  const handleProfilePress = () => {
    navigation.navigate('MeTab', { screen: 'ProfileMain' });
  };

  return (
    <View style={styles.navBar}>
      {/* Left: Shop + Tier */}
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.shopChip} onPress={handleShopPress}>
          <Text style={styles.shopIcon}>💎</Text>
          <Text style={styles.shopText}>{currency > 0 ? currency : 'Shop'}</Text>
        </TouchableOpacity>
        <View style={[styles.tierChip, isPro && styles.tierChipPremium]}>
          <Text style={[styles.tierText, isPro && styles.tierTextPremium]}>
            {tierDisplay}
          </Text>
        </View>
      </View>

      {/* Center: Logo or Custom Title */}
      {showLogo ? (
        <Text style={styles.logo}>VEILPATH</Text>
      ) : title ? (
        <Text style={styles.pageTitle}>{title}</Text>
      ) : (
        <View style={styles.spacer} />
      )}

      {/* Right: Level + XP */}
      <TouchableOpacity style={styles.levelChip} onPress={handleProfilePress}>
        <Text style={styles.levelText}>Lv.{user.progression?.level || 1}</Text>
        <View style={styles.xpBarMini}>
          <View
            style={[
              styles.xpFillMini,
              {
                width: `${((user.progression?.xp || 0) / (user.progression?.xpToNextLevel || 100)) * 100}%`
              }
            ]}
          />
        </View>
        <Text style={styles.xpText}>{user.progression?.xp || 0} XP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COSMIC.brassVictorian + '40',
    width: '100%',
    ...(Platform.OS === 'web' ? {
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    } : {}),
  },

  // Left section
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(183, 142, 82, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COSMIC.candleFlame + '60',
  },
  shopIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  shopText: {
    color: COSMIC.candleFlame,
    fontSize: 14,
    fontWeight: '700',
  },
  tierChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.4)',
  },
  tierChipPremium: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: COSMIC.candleFlame + '60',
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(200, 200, 200, 0.8)',
    textTransform: 'uppercase',
  },
  tierTextPremium: {
    color: COSMIC.candleFlame,
  },

  // Center
  logo: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    letterSpacing: 1,
  },
  spacer: {
    flex: 1,
  },

  // Right section
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(106, 76, 147, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst + '60',
    gap: 8,
  },
  levelText: {
    color: COSMIC.etherealCyan,
    fontSize: 12,
    fontWeight: '700',
  },
  xpBarMini: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpFillMini: {
    height: '100%',
    backgroundColor: COSMIC.deepAmethyst,
  },
  xpText: {
    color: COSMIC.crystalPink,
    fontSize: 10,
    fontWeight: '600',
  },
});
