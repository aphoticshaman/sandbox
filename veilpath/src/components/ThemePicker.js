/**
 * Theme Picker Component
 *
 * Displays available themes in a grid with preview swatches
 * Allows users to:
 * - Select unlocked themes
 * - Preview locked themes
 * - Purchase themes with cosmic dust
 * - Toggle light/dark mode
 * - Claim monthly subscriber rewards
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COSMIC, VictorianCard } from './VeilPathDesign';
import { useTheme } from '../contexts/ThemeContext';
import { useCosmeticsStore } from '../stores/cosmeticsStore';
import { THEMES, getThemeColors } from '../theme/themes';
import { useSubscription } from '../contexts/SubscriptionContext';

// ═══════════════════════════════════════════════════════════════════════════════
// RARITY COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const RARITY_COLORS = {
  common: '#9E9E9E',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF9800',
};

// ═══════════════════════════════════════════════════════════════════════════════
// THEME SWATCH COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ThemeSwatch({ theme, isSelected, isUnlocked, onPress, size = 'normal' }) {
  const colors = getThemeColors(theme.id, 'dark');
  const lightColors = getThemeColors(theme.id, 'light');

  const swatchSize = size === 'large' ? 100 : size === 'small' ? 60 : 80;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.swatchContainer,
        { width: swatchSize, height: swatchSize + 30 },
        isSelected && styles.swatchSelected,
      ]}
      activeOpacity={0.7}
    >
      {/* Color Preview */}
      <View style={[styles.swatchPreview, { width: swatchSize, height: swatchSize }]}>
        {/* Dark mode preview (top) */}
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.swatchGradientTop}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Light mode preview (bottom) */}
        <LinearGradient
          colors={lightColors.gradientPrimary}
          style={styles.swatchGradientBottom}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Accent dot */}
        <View style={[styles.swatchAccent, { backgroundColor: colors.accent }]} />

        {/* Lock overlay */}
        {!isUnlocked && (
          <View style={styles.swatchLockOverlay}>
            <Text style={styles.swatchLockIcon}>🔒</Text>
          </View>
        )}

        {/* Selected checkmark */}
        {isSelected && (
          <View style={styles.swatchCheckmark}>
            <Text style={styles.swatchCheckmarkIcon}>✓</Text>
          </View>
        )}
      </View>

      {/* Theme name */}
      <Text style={styles.swatchName} numberOfLines={1}>
        {theme.icon} {theme.name.split(' ')[0]}
      </Text>

      {/* Price or status */}
      {!isUnlocked && theme.price > 0 && (
        <Text style={styles.swatchPrice}>{theme.price}</Text>
      )}
      {!isUnlocked && theme.unlockMethod === 'level' && (
        <Text style={styles.swatchUnlock}>Lv{theme.unlockRequirement?.level}</Text>
      )}
      {!isUnlocked && theme.unlockMethod === 'achievement' && (
        <Text style={styles.swatchUnlock}>🏆</Text>
      )}
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODE TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ModeToggle({ mode, onModeChange }) {
  const modes = [
    { id: 'dark', label: '🌙 Dark' },
    { id: 'light', label: '☀️ Light' },
    { id: 'system', label: '⚙️ Auto' },
  ];

  return (
    <View style={styles.modeToggleContainer}>
      {modes.map((m) => (
        <TouchableOpacity
          key={m.id}
          onPress={() => onModeChange(m.id)}
          style={[
            styles.modeToggleButton,
            mode === m.id && styles.modeToggleButtonActive,
          ]}
        >
          <Text style={[
            styles.modeToggleText,
            mode === m.id && styles.modeToggleTextActive,
          ]}>
            {m.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBER REWARD BANNER
// ═══════════════════════════════════════════════════════════════════

function SubscriberRewardBanner({ onClaim }) {
  const { isPro } = useSubscription() || {};
  const canClaim = useCosmeticsStore((state) => state.canClaimMonthlyTheme?.() || false);
  const getMonthlyRewardTheme = useCosmeticsStore((state) => state.getMonthlyRewardTheme);

  if (!isPro) return null;

  const rewardTheme = getMonthlyRewardTheme?.();
  if (!rewardTheme) return null;

  return (
    <TouchableOpacity
      style={[
        styles.rewardBanner,
        !canClaim && styles.rewardBannerClaimed,
      ]}
      onPress={canClaim ? onClaim : null}
      activeOpacity={canClaim ? 0.7 : 1}
    >
      <View style={styles.rewardBannerContent}>
        <Text style={styles.rewardBannerIcon}>
          {canClaim ? '🎁' : '✅'}
        </Text>
        <View style={styles.rewardBannerText}>
          <Text style={styles.rewardBannerTitle}>
            {canClaim ? 'Monthly Theme Reward!' : 'Claimed This Month'}
          </Text>
          <Text style={styles.rewardBannerSubtitle}>
            {rewardTheme.icon} {rewardTheme.name}
          </Text>
        </View>
        {canClaim && (
          <View style={styles.rewardBannerButton}>
            <Text style={styles.rewardBannerButtonText}>Claim</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN THEME PICKER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ThemePicker({ compact = false }) {
  const {
    currentThemeId,
    mode,
    setTheme,
    setColorMode,
    isThemeUnlocked,
    colors,
  } = useTheme();

  const cosmicDust = useCosmeticsStore((state) => state.cosmicDust);
  const purchaseTheme = useCosmeticsStore((state) => state.purchaseTheme);
  const claimMonthlyThemeReward = useCosmeticsStore((state) => state.claimMonthlyThemeReward);

  const [selectedPreview, setSelectedPreview] = useState(null);

  // Group themes by rarity
  const themesByRarity = {
    common: [],
    rare: [],
    epic: [],
    legendary: [],
  };

  Object.values(THEMES).forEach((theme) => {
    if (themesByRarity[theme.rarity]) {
      themesByRarity[theme.rarity].push(theme);
    }
  });

  // Handle theme selection
  const handleThemePress = useCallback((theme) => {
    const unlocked = isThemeUnlocked(theme.id);

    if (unlocked) {
      // Equip the theme
      setTheme(theme.id);
    } else {
      // Show preview/purchase modal
      setSelectedPreview(theme);
    }
  }, [isThemeUnlocked, setTheme]);

  // Handle purchase
  const handlePurchase = useCallback((theme) => {
    if (cosmicDust < theme.price) {
      Alert.alert(
        'Not Enough Shards',
        `You need ${theme.price - cosmicDust} more cosmic shards to purchase this theme.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Purchase Theme',
      `Purchase ${theme.name} for ${theme.price} cosmic shards?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            const result = purchaseTheme(theme.id);
            if (result.success) {
              setSelectedPreview(null);
              setTheme(theme.id);
            } else {
              Alert.alert('Purchase Failed', result.error);
            }
          },
        },
      ]
    );
  }, [cosmicDust, purchaseTheme, setTheme]);

  // Handle monthly reward claim
  const handleClaimReward = useCallback(() => {
    const result = claimMonthlyThemeReward();

    if (result.success) {
      if (result.alreadyOwned) {
        Alert.alert(
          'Already Owned!',
          `You already have ${result.theme.name}. Received ${result.bonusDust} bonus cosmic shards instead!`,
          [{ text: 'Nice!' }]
        );
      } else {
        Alert.alert(
          'Theme Unlocked!',
          `You received ${result.theme.icon} ${result.theme.name} as your monthly subscriber reward!`,
          [
            { text: 'Equip Now', onPress: () => setTheme(result.themeId) },
            { text: 'Later' },
          ]
        );
      }
    } else {
      Alert.alert('Cannot Claim', result.error);
    }
  }, [claimMonthlyThemeReward, setTheme]);

  // Render theme grid
  const renderThemeGrid = (themes, rarityLabel) => {
    if (themes.length === 0) return null;

    return (
      <View style={styles.raritySection}>
        <Text style={[styles.rarityLabel, { color: RARITY_COLORS[themes[0]?.rarity] }]}>
          {rarityLabel}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themeGrid}
        >
          {themes.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              theme={theme}
              isSelected={currentThemeId === theme.id}
              isUnlocked={isThemeUnlocked(theme.id)}
              onPress={() => handleThemePress(theme)}
              size={compact ? 'small' : 'normal'}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Mode Toggle */}
      <ModeToggle mode={mode} onModeChange={setColorMode} />

      {/* Subscriber Reward Banner */}
      <SubscriberRewardBanner onClaim={handleClaimReward} />

      {/* Theme Grids by Rarity */}
      {renderThemeGrid(themesByRarity.common, 'Free Themes')}
      {renderThemeGrid(themesByRarity.rare, 'Rare Themes')}
      {renderThemeGrid(themesByRarity.epic, 'Epic Themes')}
      {renderThemeGrid(themesByRarity.legendary, 'Legendary Themes')}

      {/* Preview/Purchase Modal */}
      <Modal
        visible={!!selectedPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPreview(null)}
      >
        {selectedPreview && (
          <View style={styles.modalOverlay}>
            <VictorianCard style={styles.previewModal}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewIcon}>{selectedPreview.icon}</Text>
                <Text style={styles.previewName}>{selectedPreview.name}</Text>
                <Text style={[styles.previewRarity, { color: RARITY_COLORS[selectedPreview.rarity] }]}>
                  {selectedPreview.rarity.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.previewDescription}>
                {selectedPreview.description}
              </Text>

              {/* Large preview swatch */}
              <View style={styles.previewSwatchContainer}>
                <ThemeSwatch
                  theme={selectedPreview}
                  isSelected={false}
                  isUnlocked={true}
                  onPress={() => {}}
                  size="large"
                />
              </View>

              {/* Unlock info */}
              <View style={styles.previewUnlockInfo}>
                {selectedPreview.unlockMethod === 'purchase' && (
                  <>
                    <Text style={styles.previewPrice}>
                      {selectedPreview.price} Cosmic Shards
                    </Text>
                    <Text style={styles.previewBalance}>
                      You have: {cosmicDust}
                    </Text>
                  </>
                )}
                {selectedPreview.unlockMethod === 'level' && (
                  <Text style={styles.previewUnlockText}>
                    Reach Level {selectedPreview.unlockRequirement?.level} to unlock
                  </Text>
                )}
                {selectedPreview.unlockMethod === 'achievement' && (
                  <Text style={styles.previewUnlockText}>
                    Complete achievement to unlock
                  </Text>
                )}
                {selectedPreview.unlockMethod === 'event' && (
                  <Text style={styles.previewUnlockText}>
                    Limited time event theme
                  </Text>
                )}
              </View>

              {/* Action buttons */}
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={styles.previewCancelButton}
                  onPress={() => setSelectedPreview(null)}
                >
                  <Text style={styles.previewCancelText}>Close</Text>
                </TouchableOpacity>

                {selectedPreview.unlockMethod === 'purchase' && (
                  <TouchableOpacity
                    style={[
                      styles.previewPurchaseButton,
                      cosmicDust < selectedPreview.price && styles.previewPurchaseButtonDisabled,
                    ]}
                    onPress={() => handlePurchase(selectedPreview)}
                    disabled={cosmicDust < selectedPreview.price}
                  >
                    <Text style={styles.previewPurchaseText}>
                      Purchase
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </VictorianCard>
          </View>
        )}
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  // Mode Toggle
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  modeToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  modeToggleButtonActive: {
    backgroundColor: COSMIC.deepAmethyst,
  },
  modeToggleText: {
    color: COSMIC.moonGlow,
    fontSize: 13,
    opacity: 0.6,
  },
  modeToggleTextActive: {
    opacity: 1,
    fontWeight: '600',
  },

  // Reward Banner
  rewardBanner: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderWidth: 1,
    borderColor: COSMIC.candleFlame,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  rewardBannerClaimed: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    borderColor: COSMIC.brassVictorian,
  },
  rewardBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardBannerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  rewardBannerText: {
    flex: 1,
  },
  rewardBannerTitle: {
    color: COSMIC.moonGlow,
    fontSize: 14,
    fontWeight: '600',
  },
  rewardBannerSubtitle: {
    color: COSMIC.crystalPink,
    fontSize: 12,
    marginTop: 2,
  },
  rewardBannerButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  rewardBannerButtonText: {
    color: '#1a1a1a',
    fontWeight: '700',
    fontSize: 12,
  },

  // Rarity Sections
  raritySection: {
    marginBottom: 20,
  },
  rarityLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  themeGrid: {
    paddingHorizontal: 4,
    gap: 12,
    flexDirection: 'row',
  },

  // Theme Swatch
  swatchContainer: {
    alignItems: 'center',
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: COSMIC.etherealCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
  swatchPreview: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  swatchGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  swatchGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  swatchAccent: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  swatchLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchLockIcon: {
    fontSize: 20,
  },
  swatchCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COSMIC.etherealCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchCheckmarkIcon: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  swatchName: {
    color: COSMIC.moonGlow,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  swatchPrice: {
    color: COSMIC.candleFlame,
    fontSize: 10,
    fontWeight: '600',
  },
  swatchUnlock: {
    color: COSMIC.crystalPink,
    fontSize: 10,
  },

  // Preview Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModal: {
    width: '100%',
    maxWidth: 350,
    padding: 24,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  previewName: {
    color: COSMIC.moonGlow,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewRarity: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  previewDescription: {
    color: COSMIC.crystalPink,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  previewSwatchContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewUnlockInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewPrice: {
    color: COSMIC.candleFlame,
    fontSize: 24,
    fontWeight: '700',
  },
  previewBalance: {
    color: COSMIC.moonGlow,
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  previewUnlockText: {
    color: COSMIC.moonGlow,
    fontSize: 14,
    textAlign: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COSMIC.brassVictorian,
    alignItems: 'center',
  },
  previewCancelText: {
    color: COSMIC.moonGlow,
    fontWeight: '600',
  },
  previewPurchaseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COSMIC.candleFlame,
    alignItems: 'center',
  },
  previewPurchaseButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  previewPurchaseText: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
});
