/**
 * VIP Perks Screen
 *
 * Shows all VIP perks available to subscribers with claim functionality.
 * Includes welcome package, monthly shards, loyalty rewards, and exclusive cosmetics.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  CosmicButton,
} from '../components/VeilPathDesign';

import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../services/supabase';
import { TierBadge, getTierConfig } from '../config/subscriptionTiers';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function VIPPerksScreen({ navigation }) {
  const { tier, isPro } = useSubscription();
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionMonths, setSubscriptionMonths] = useState(0);

  useEffect(() => {
    loadPerks();
  }, []);

  const loadPerks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_vip_perks', {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data?.perks) {
        setPerks(data.perks);
        setSubscriptionMonths(data.subscription_months || 0);
      }
    } catch (error) {
      console.error('[VIPPerks] Failed to load:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleClaim = async (perk) => {
    if (!perk.can_claim || claiming) return;

    try {
      setClaiming(perk.id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('claim_vip_perk', {
        p_user_id: user.id,
        p_perk_id: perk.id,
      });

      if (error) throw error;

      if (data?.success) {
        // Refresh perks list
        await loadPerks();
      } else {
        console.error('[VIPPerks] Claim failed:', data?.error);
      }
    } catch (error) {
      console.error('[VIPPerks] Claim error:', error);
    } finally {
      setClaiming(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPerks();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // NON-SUBSCRIBER VIEW
  // ─────────────────────────────────────────────────────────────────────────────

  if (!isPro) {
    return (
      <VeilPathScreen intensity="medium" scrollable={true}>
        <VictorianCard style={styles.lockedCard}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>VIP Perks</Text>
          <Text style={styles.lockedText}>
            Subscribe to unlock exclusive perks including:
          </Text>
          <View style={styles.perkPreviewList}>
            <Text style={styles.perkPreviewItem}>🎁 500 Welcome Shards</Text>
            <Text style={styles.perkPreviewItem}>💎 200 Monthly Shards</Text>
            <Text style={styles.perkPreviewItem}>🎨 Exclusive Cosmetics</Text>
            <Text style={styles.perkPreviewItem}>🌟 Loyalty Rewards</Text>
            <Text style={styles.perkPreviewItem}>👨‍💻 Dev Corner Access</Text>
          </View>
          <CosmicButton
            title="See Subscription Options"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('SubscriptionScreen')}
            style={{ marginTop: 24 }}
          />
        </VictorianCard>
      </VeilPathScreen>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <VeilPathScreen intensity="medium" scrollable={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COSMIC.candleFlame} />
          <Text style={styles.loadingText}>Loading your perks...</Text>
        </View>
      </VeilPathScreen>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP PERKS BY TYPE
  // ─────────────────────────────────────────────────────────────────────────────

  const oneTimePerks = perks.filter(p => p.perk_type === 'one_time');
  const monthlyPerks = perks.filter(p => p.perk_type === 'monthly_reward');
  const featurePerks = perks.filter(p => p.perk_type === 'exclusive_feature');

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER PERK CARD
  // ─────────────────────────────────────────────────────────────────────────────

  const renderPerk = (perk) => {
    const isClaiming = claiming === perk.id;
    const canClaim = perk.can_claim && !isClaiming;
    const isClaimed = perk.claimed;
    const needsMoreMonths = perk.min_months > subscriptionMonths;

    return (
      <VictorianCard
        key={perk.id}
        style={[
          styles.perkCard,
          isClaimed && styles.perkCardClaimed,
          !canClaim && !isClaimed && styles.perkCardLocked,
        ]}
        showCorners={false}
      >
        <View style={styles.perkHeader}>
          <Text style={styles.perkIcon}>{perk.icon}</Text>
          <View style={styles.perkInfo}>
            <Text style={styles.perkName}>{perk.name}</Text>
            <Text style={styles.perkDesc}>{perk.description}</Text>
          </View>
        </View>

        {/* Value display */}
        {perk.shard_value > 0 && (
          <View style={styles.perkValue}>
            <Text style={styles.perkValueIcon}>💎</Text>
            <Text style={styles.perkValueText}>{perk.shard_value} Shards</Text>
          </View>
        )}

        {/* Status / Action */}
        <View style={styles.perkAction}>
          {isClaimed ? (
            <View style={styles.claimedBadge}>
              <Text style={styles.claimedText}>✓ CLAIMED</Text>
            </View>
          ) : needsMoreMonths ? (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedBadgeText}>
                🔒 {perk.min_months} months required
              </Text>
              <Text style={styles.progressText}>
                You: {subscriptionMonths} months
              </Text>
            </View>
          ) : canClaim ? (
            <TouchableOpacity
              style={styles.claimBtn}
              onPress={() => handleClaim(perk)}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.claimBtnText}>CLAIM NOW</Text>
              )}
            </TouchableOpacity>
          ) : perk.perk_type === 'monthly_reward' ? (
            <View style={styles.nextClaimBadge}>
              <Text style={styles.nextClaimText}>Available next month</Text>
            </View>
          ) : (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedBadgeText}>Coming soon</Text>
            </View>
          )}
        </View>
      </VictorianCard>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <VeilPathScreen intensity="medium" scrollable={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COSMIC.candleFlame}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>VIP PERKS</Text>
          <TierBadge tier={tier} />
        </View>

        <Text style={styles.subheader}>
          {subscriptionMonths > 0
            ? `Subscribed for ${subscriptionMonths} month${subscriptionMonths !== 1 ? 's' : ''}`
            : 'Welcome, new subscriber!'}
        </Text>

        {/* Claimable Perks */}
        {oneTimePerks.some(p => p.can_claim) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 AVAILABLE TO CLAIM</Text>
            {oneTimePerks.filter(p => p.can_claim).map(renderPerk)}
          </View>
        )}

        {/* Monthly Perks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💎 MONTHLY REWARDS</Text>
          {monthlyPerks.map(renderPerk)}
        </View>

        {/* Loyalty Perks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 LOYALTY MILESTONES</Text>
          {oneTimePerks
            .filter(p => p.min_months > 0)
            .sort((a, b) => a.min_months - b.min_months)
            .map(renderPerk)}
        </View>

        {/* Already Claimed */}
        {oneTimePerks.some(p => p.claimed) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✓ CLAIMED</Text>
            {oneTimePerks.filter(p => p.claimed && p.min_months === 0).map(renderPerk)}
          </View>
        )}

        {/* Exclusive Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ EXCLUSIVE FEATURES</Text>
          {featurePerks.map(renderPerk)}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </VeilPathScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 3,
    color: COSMIC.candleFlame,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  subheader: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    marginBottom: 24,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COSMIC.crystalPink,
  },

  // Locked (non-subscriber)
  lockedCard: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
  },
  lockedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 12,
  },
  lockedText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginBottom: 20,
  },
  perkPreviewList: {
    gap: 8,
  },
  perkPreviewItem: {
    fontSize: 14,
    color: COSMIC.moonGlow,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: COSMIC.candleFlame,
    marginBottom: 12,
  },

  // Perk Card
  perkCard: {
    padding: 16,
    marginBottom: 12,
  },
  perkCardClaimed: {
    opacity: 0.6,
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  perkCardLocked: {
    opacity: 0.7,
  },
  perkHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  perkIcon: {
    fontSize: 32,
  },
  perkInfo: {
    flex: 1,
  },
  perkName: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  perkDesc: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 18,
  },

  // Value
  perkValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  perkValueIcon: {
    fontSize: 18,
  },
  perkValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },

  // Action / Status
  perkAction: {
    alignItems: 'flex-start',
  },
  claimBtn: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  claimBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  claimedBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderWidth: 1,
    borderColor: '#00FF88',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  claimedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00FF88',
    letterSpacing: 1,
  },
  lockedBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  lockedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COSMIC.crystalPink,
  },
  progressText: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    opacity: 0.7,
    marginTop: 4,
  },
  nextClaimBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  nextClaimText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA',
  },

  bottomSpacer: {
    height: 40,
  },
});
