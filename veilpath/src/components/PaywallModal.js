/**
 * PAYWALL MODAL
 * Shows when user hits a premium-locked feature or usage limit.
 * Clean, non-aggressive upsell that respects the user.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { USAGE_TIERS } from '../services/TokenEconomics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * PAYWALL TYPES:
 * - 'vera_limit' - Hit daily Vera chat limit
 * - 'feature_locked' - Trying to access premium feature
 * - 'upgrade_prompt' - General upgrade nudge
 */

export default function PaywallModal({
  visible,
  onClose,
  onUpgrade,
  type = 'vera_limit',
  featureName = '',
  currentTier = 'free',
  resetTime = null,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const getContent = () => {
    switch (type) {
      case 'vera_limit':
        return {
          icon: '🌙',
          title: "Vera's resting",
          subtitle: "You've used your daily chat",
          description: resetTime
            ? `Come back in ${resetTime.hours}h ${resetTime.minutes}m for another conversation, or unlock unlimited access.`
            : 'Your free daily chat with Vera has been used. Upgrade for more meaningful conversations.',
          cta: 'Unlock More Chats',
          showTiers: true,
        };

      case 'feature_locked':
        return {
          icon: '🔒',
          title: 'Premium Feature',
          subtitle: featureName || 'This feature requires an upgrade',
          description: 'Unlock this and many more features with a premium subscription.',
          cta: 'See Plans',
          showTiers: true,
        };

      case 'upgrade_prompt':
        return {
          icon: '✨',
          title: 'Level Up Your Journey',
          subtitle: 'Get more from VeilPath',
          description: 'Deeper conversations with Vera, exclusive spreads, and premium cosmetics await.',
          cta: 'View Premium',
          showTiers: true,
        };

      default:
        return {
          icon: '⭐',
          title: 'Upgrade Available',
          subtitle: '',
          description: 'Unlock premium features for the full experience.',
          cta: 'Learn More',
          showTiers: true,
        };
    }
  };

  const content = getContent();

  const handleUpgrade = (tier) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpgrade?.(tier);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f0f1a']}
            style={styles.modalGradient}
          >
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.icon}>{content.icon}</Text>
              <Text style={styles.title}>{content.title}</Text>
              {content.subtitle ? (
                <Text style={styles.subtitle}>{content.subtitle}</Text>
              ) : null}
              <Text style={styles.description}>{content.description}</Text>
            </View>

            {/* Tier cards */}
            {content.showTiers && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tiersContainer}
              >
                <TierCard
                  tier={USAGE_TIERS.seeker}
                  currentTier={currentTier}
                  onSelect={() => handleUpgrade('seeker')}
                />
                <TierCard
                  tier={USAGE_TIERS.adept}
                  currentTier={currentTier}
                  recommended
                  onSelect={() => handleUpgrade('adept')}
                />
                <TierCard
                  tier={USAGE_TIERS.mystic}
                  currentTier={currentTier}
                  onSelect={() => handleUpgrade('mystic')}
                />
              </ScrollView>
            )}

            {/* Maybe later button */}
            <TouchableOpacity style={styles.laterButton} onPress={handleClose}>
              <Text style={styles.laterButtonText}>Maybe later</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * Individual tier card
 */
function TierCard({ tier, currentTier, recommended, onSelect }) {
  const isCurrentTier = tier.id === currentTier;

  return (
    <TouchableOpacity
      style={[
        styles.tierCard,
        recommended && styles.tierCardRecommended,
        isCurrentTier && styles.tierCardCurrent,
      ]}
      onPress={onSelect}
      disabled={isCurrentTier}
      activeOpacity={0.8}
    >
      {recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>BEST VALUE</Text>
        </View>
      )}

      <Text style={styles.tierName}>{tier.name}</Text>
      <Text style={styles.tierPrice}>
        ${tier.price}
        <Text style={styles.tierPeriod}>/mo</Text>
      </Text>

      <View style={styles.tierFeatures}>
        <Text style={styles.tierFeature}>• {tier.dailyChats} daily chats</Text>
        <Text style={styles.tierFeature}>• {tier.maxResponseWords} word responses</Text>
        {tier.features.voiceOutput && (
          <Text style={styles.tierFeature}>• Voice output</Text>
        )}
        {tier.features.deepReflection && (
          <Text style={styles.tierFeature}>• Deep reflection mode</Text>
        )}
      </View>

      <View style={[styles.selectButton, recommended && styles.selectButtonRecommended]}>
        <Text style={[styles.selectButtonText, recommended && styles.selectButtonTextRecommended]}>
          {isCurrentTier ? 'Current Plan' : 'Select'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9945FF',
    marginBottom: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  tiersContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 12,
  },
  tierCard: {
    width: SCREEN_WIDTH * 0.65,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tierCardRecommended: {
    borderColor: '#9945FF',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
  },
  tierCardCurrent: {
    opacity: 0.5,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -1,
    left: 20,
    right: 20,
    backgroundColor: '#9945FF',
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
  },
  recommendedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00F0FF',
    marginBottom: 16,
  },
  tierPeriod: {
    fontSize: 14,
    fontWeight: 'normal',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tierFeatures: {
    marginBottom: 16,
  },
  tierFeature: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  selectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonRecommended: {
    backgroundColor: '#9945FF',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectButtonTextRecommended: {
    color: '#fff',
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  laterButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
});
