/**
 * Subscription Tier Configuration
 *
 * Tier symbols that show next to usernames on forum posts
 * and in the persistent tier badge.
 *
 * Tiers:
 * - free: No symbol (or subtle one)
 * - vip: Monthly premium subscriber
 * - vip_plus: Annual premium subscriber (VIP+)
 * - lifetime: Lifetime member (the ultimate flex)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    symbol: null, // No symbol for free users
    symbolAlt: '○', // Subtle option if we want to show something
    color: '#6B7280', // Gray
    bgColor: 'rgba(107, 114, 128, 0.2)',
    borderColor: '#4B5563',
    description: 'Free tier',
    perks: [],
  },

  vip: {
    id: 'vip',
    name: 'VIP',
    symbol: '✦', // Four-pointed star
    symbolAlt: '⬡', // Hexagon alternative
    color: '#A78BFA', // Purple
    bgColor: 'rgba(167, 139, 250, 0.2)',
    borderColor: '#8B5CF6',
    description: 'Monthly subscriber',
    perks: ['vip_lounge', 'monthly_shards', 'priority_support'],
  },

  vip_plus: {
    id: 'vip_plus',
    name: 'VIP+',
    symbol: '✧', // White four-pointed star (outlined)
    symbolAlt: '◆', // Diamond
    color: '#F59E0B', // Amber/Gold
    bgColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#D97706',
    description: 'Annual subscriber',
    perks: ['vip_lounge', 'monthly_shards', 'priority_support', 'annual_cosmetics'],
  },

  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    symbol: '♔', // Crown
    symbolAlt: '◈', // Diamond with dot
    color: '#FFD700', // Gold
    bgColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.4)',
    description: 'Lifetime member',
    perks: ['vip_lounge', 'monthly_shards', 'priority_support', 'lifetime_cosmetics', 'founder_status'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get tier config by subscription tier string
 */
export function getTierConfig(tier) {
  // Map common tier names to our config
  const tierMap = {
    'free': SUBSCRIPTION_TIERS.free,
    'premium': SUBSCRIPTION_TIERS.vip, // Monthly = VIP
    'vip': SUBSCRIPTION_TIERS.vip,
    'annual': SUBSCRIPTION_TIERS.vip_plus,
    'vip_plus': SUBSCRIPTION_TIERS.vip_plus,
    'yearly': SUBSCRIPTION_TIERS.vip_plus,
    'lifetime': SUBSCRIPTION_TIERS.lifetime,
    'founder': SUBSCRIPTION_TIERS.lifetime,
  };

  return tierMap[tier?.toLowerCase()] || SUBSCRIPTION_TIERS.free;
}

/**
 * Get tier symbol for display
 */
export function getTierSymbol(tier, options = {}) {
  const config = getTierConfig(tier);
  if (!config.symbol) return options.showEmpty ? '○' : '';
  return config.symbol;
}

/**
 * Format account age for display
 * "Est. Nov 2024" or "Since Day 1" for founders
 */
export function formatAccountAge(createdAt, isFounder = false) {
  if (!createdAt) return '';

  const date = new Date(createdAt);
  const now = new Date();

  // Check if they're a founder (joined in first month of beta)
  const founderCutoff = new Date('2025-01-01'); // Adjust this date
  if (date < founderCutoff || isFounder) {
    return 'Founding Member';
  }

  // Calculate how long ago
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Joined today';
  if (diffDays === 1) return 'Joined yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  // Format as "Est. Month Year"
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `Est. ${month} ${year}`;
}

/**
 * Get tier badge component props
 */
export function getTierBadgeProps(tier) {
  const config = getTierConfig(tier);
  return {
    symbol: config.symbol,
    color: config.color,
    bgColor: config.bgColor,
    borderColor: config.borderColor,
    name: config.name,
    glow: tier === 'lifetime',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * Tier Symbol Badge - Compact symbol for inline display
 * Use next to usernames in forum posts
 */
export function TierSymbol({ tier, size = 'small', style }) {
  const config = getTierConfig(tier);
  if (!config.symbol) return null;

  const sizeStyles = {
    tiny: { fontSize: 10, width: 14, height: 14 },
    small: { fontSize: 12, width: 18, height: 18 },
    medium: { fontSize: 16, width: 24, height: 24 },
    large: { fontSize: 20, width: 28, height: 28 },
  };

  const s = sizeStyles[size] || sizeStyles.small;

  return (
    <View style={[
      styles.symbolContainer,
      { width: s.width, height: s.height, backgroundColor: config.bgColor, borderColor: config.borderColor },
      tier === 'lifetime' && styles.lifetimeGlow,
      style,
    ]}>
      <Text style={[styles.symbol, { fontSize: s.fontSize, color: config.color }]}>
        {config.symbol}
      </Text>
    </View>
  );
}

/**
 * Tier Badge - Full badge with text for header display
 */
export function TierBadge({ tier, shards, style }) {
  const config = getTierConfig(tier);

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bgColor, borderColor: config.borderColor },
      tier === 'lifetime' && styles.lifetimeGlow,
      style,
    ]}>
      {config.symbol && (
        <Text style={[styles.badgeSymbol, { color: config.color }]}>
          {config.symbol}
        </Text>
      )}
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.name.toUpperCase()}
      </Text>
      {shards !== undefined && (
        <View style={styles.shardsContainer}>
          <Text style={styles.shardsIcon}>💎</Text>
          <Text style={styles.shardsText}>{shards}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Account Age Badge - Shows when user joined
 */
export function AccountAgeBadge({ createdAt, isFounder, style }) {
  const text = formatAccountAge(createdAt, isFounder);
  if (!text) return null;

  const isFounderDisplay = text === 'Founding Member';

  return (
    <Text style={[
      styles.accountAge,
      isFounderDisplay && styles.founderText,
      style,
    ]}>
      {text}
    </Text>
  );
}

/**
 * User Info Row - Complete user display for forum posts
 * Shows: Symbol + Username + Title + Account Age
 */
export function UserInfoRow({
  tier,
  username,
  displayName,
  title,
  createdAt,
  isFounder,
  style,
}) {
  const config = getTierConfig(tier);

  return (
    <View style={[styles.userInfoRow, style]}>
      {/* Tier Symbol */}
      {config.symbol && <TierSymbol tier={tier} size="small" />}

      {/* Name */}
      <Text style={styles.username}>{displayName || username}</Text>

      {/* Title */}
      {title && <Text style={styles.title}>· {title}</Text>}

      {/* Account Age */}
      <AccountAgeBadge createdAt={createdAt} isFounder={isFounder} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Symbol Container
  symbolContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
  },
  symbol: {
    fontWeight: '700',
  },
  lifetimeGlow: Platform.select({
    web: {
      boxShadow: '0 0 8px rgba(255, 215, 0, 0.4)',
    },
    default: {
      shadowColor: '#FFD700',
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 4,
    },
  }),

  // Full Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  badgeSymbol: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  shardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 4,
  },
  shardsIcon: {
    fontSize: 12,
  },
  shardsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
  },

  // Account Age
  accountAge: {
    fontSize: 10,
    color: 'rgba(225, 190, 231, 0.5)',
    marginLeft: 8,
  },
  founderText: {
    color: '#FFD700',
    fontWeight: '600',
  },

  // User Info Row
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5E6D3',
  },
  title: {
    fontSize: 12,
    color: '#B78E52',
    fontStyle: 'italic',
  },
});

export default SUBSCRIPTION_TIERS;
