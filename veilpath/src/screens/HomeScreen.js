/**
 * Home Screen - VeilPath Magazine Layout
 * Responsive two-column design that uses horizontal space intelligently
 * - Desktop/Tablet: Card on left, info/actions on right
 * - Mobile: Stacked layout with horizontal stat chips
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { TarotCard } from '../components';
import { useUserStore } from '../stores/userStore';
import { useCosmeticsStore, getCardBackAsset } from '../stores/cosmeticsStore';
import { useSubscription } from '../contexts/SubscriptionContext';
import { drawCards } from '../data/tarotDeckAdapter';
import * as Haptics from 'expo-haptics';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  CosmicButton,
  SectionHeader,
  FeaturePill,
  CosmicDivider,
} from '../components/VeilPathDesign';

// AAA web components
import { AnimatedTarotCard, soundManager, CosmicParticles } from '../web';

// Default card back asset
const DEFAULT_CARD_BACK = require('../../assets/art/cardback/card_back.png');

// Responsive layout hook
const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  return {
    isMobile: width < 600,
    isTablet: width >= 600 && width < 1024,
    isDesktop: width >= 1024,
    columns: width < 600 ? 1 : 2,
    width,
    height,
  };
};

export default function HomeScreen({ navigation }) {
  const user = useUserStore();
  const getDailyCard = useUserStore((state) => state.getDailyCard);
  const setDailyCardInStore = useUserStore((state) => state.setDailyCard);
  const getDailyCardRevealed = useUserStore((state) => state.getDailyCardRevealed);
  const setDailyCardRevealed = useUserStore((state) => state.setDailyCardRevealed);
  const [dailyCard, setDailyCard] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Get subscription info
  const { tier, isPro, hasLifetime } = useSubscription();
  const tierDisplay = hasLifetime ? 'Lifetime' : isPro ? 'Premium' : 'Free';

  // Get equipped card back from cosmetics store
  const equippedCardBackId = useCosmeticsStore((state) => state.equipped.cardBack);
  const cardBackSource = getCardBackAsset(equippedCardBackId);

  useEffect(() => {
    const existingCard = getDailyCard();

    if (existingCard) {
      // Re-generate the image source since require() results don't serialize to storage
      // The image property will be null/undefined after JSON parse from AsyncStorage
      const { getCardImage } = require('../data/tarotDeckAdapter');
      const regeneratedImage = getCardImage(existingCard.card, existingCard.tier || 'common');
      setDailyCard({
        ...existingCard,
        image: regeneratedImage,
      });
      // Check if already revealed today
      setIsRevealed(getDailyCardRevealed?.() || false);
    } else {
      const drawn = drawCards(1, false);
      if (drawn.length > 0) {
        const newCard = drawn[0];
        setDailyCard(newCard);
        setDailyCardInStore(newCard);
        setIsRevealed(false);
      }
    }
  }, [getDailyCard, setDailyCardInStore, getDailyCardRevealed]);

  // Handle revealing the daily card with epic animation
  const handleRevealCard = () => {
    if (isRevealed) {
      // Already revealed, go to interpretation
      handleDailyCardPress();
      return;
    }

    // Trigger haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Sound disabled - was annoying beep

    // Set revealed state
    setIsRevealed(true);
    setDailyCardRevealed?.(true);
  };

  const handleQuickReading = (type) => {
    navigation.navigate('ReadingType', { preselectedType: type });
  };

  const handleDailyCardPress = () => {
    if (dailyCard) {
      navigation.navigate('CardInterpretation', {
        card: dailyCard.card,
        isReversed: dailyCard.isReversed,
        context: 'daily',
        // Tiered asset info
        tier: dailyCard.tier,
        assetType: dailyCard.assetType,
        imageOverride: dailyCard.image,
      });
    }
  };

  // Use responsive layout hook
  const { isMobile, isTablet, isDesktop, width } = useResponsiveLayout();

  // Web version - Magazine Layout
  if (Platform.OS === 'web') {
    return (
      <VeilPathScreen intensity="full" scrollable={true} showMoonPhases={false}>
        <CosmicParticles count={25} />

        {/* ═══════════════════════════════════════════════════════════════════
            PERSISTENT TOP BAR - Full-width navigation
        ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.topBar}>
          {/* Left: Shop + Tier */}
          <View style={styles.leftChips}>
            <TouchableOpacity
              style={styles.currencyChip}
              onPress={() => navigation.navigate('MeTab', { screen: 'Shop' })}
            >
              <Text style={styles.currencyIcon}>💎</Text>
              <Text style={styles.currencyText}>Shop</Text>
            </TouchableOpacity>
            <View style={[styles.tierChip, isPro && styles.tierChipPremium]}>
              <Text style={[styles.tierText, isPro && styles.tierTextPremium]}>
                {tierDisplay}
              </Text>
            </View>
          </View>

          {/* Center: Logo/Title */}
          <Text style={styles.topBarTitle}>VEILPATH</Text>

          {/* Level + XP (tap → Profile) */}
          <TouchableOpacity
            style={styles.levelChip}
            onPress={() => navigation.navigate('MeTab', { screen: 'ProfileMain' })}
          >
            <Text style={styles.levelChipText}>Lv.{user.progression.level}</Text>
            <View style={styles.xpBarMini}>
              <View
                style={[
                  styles.xpFillMini,
                  { width: `${(user.progression.xp / user.progression.xpToNextLevel) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.xpTextMini}>{user.progression.xp} XP</Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            MAGAZINE LAYOUT - Two columns on tablet/desktop
        ═══════════════════════════════════════════════════════════════════ */}
        <View style={[
          styles.magazineContainer,
          !isMobile && styles.magazineContainerWide
        ]}>

          {/* LEFT COLUMN: Daily Card (hero) */}
          <View style={[
            styles.cardColumn,
            !isMobile && styles.cardColumnWide
          ]}>
            {dailyCard && (
              <VictorianCard style={styles.dailyCardContainerMag} glowColor={COSMIC.candleFlame}>
                <Text style={styles.cardSectionTitle}>🌙 TODAY'S GUIDANCE</Text>

                <View style={styles.dailyCardWrapperMag}>
                  <AnimatedTarotCard
                    cardName={dailyCard.card.name}
                    revealed={isRevealed}
                    onPress={handleRevealCard}
                    size={isMobile ? "medium" : "large"}
                    enableParticles={true}
                    enable3D={true}
                  />
                </View>

                {!isRevealed ? (
                  <CosmicButton
                    title="Tap to Reveal"
                    icon="✨"
                    variant="primary"
                    size="lg"
                    onPress={handleRevealCard}
                  />
                ) : (
                  <View style={styles.revealedInfo}>
                    <Text style={styles.cardName}>{dailyCard.card.name}</Text>
                    <Text style={styles.cardOrientation}>
                      {dailyCard.isReversed ? 'reversed' : 'upright'}
                    </Text>
                  </View>
                )}
              </VictorianCard>
            )}
          </View>

          {/* RIGHT COLUMN: Info + Actions (visible on tablet+) */}
          {!isMobile && (
            <View style={styles.infoColumn}>
              {/* Card Details (after reveal) */}
              {isRevealed && dailyCard && (
                <VictorianCard style={styles.cardDetailsCard}>
                  <Text style={styles.cardDetailTitle}>Today's Message</Text>
                  <Text style={styles.cardDetailKeyword}>
                    {dailyCard.card.keywords?.[0] || 'New beginnings'}
                  </Text>
                  <Text style={styles.cardDetailHint}>
                    {dailyCard.isReversed
                      ? 'Consider what might be blocked or inverted'
                      : 'This energy flows freely into your day'}
                  </Text>
                  <CosmicButton
                    title="Full Reading →"
                    variant="primary"
                    size="md"
                    onPress={handleDailyCardPress}
                    style={{ marginTop: 16 }}
                  />
                </VictorianCard>
              )}

              {/* Quick Actions */}
              <VictorianCard style={styles.quickActionsCard}>
                <Text style={styles.quickActionsTitle}>🔮 QUICK START</Text>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => handleQuickReading('single')}
                  >
                    <Text style={styles.quickActionIcon}>🎴</Text>
                    <Text style={styles.quickActionText}>Single</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => handleQuickReading('three-card')}
                  >
                    <Text style={styles.quickActionIcon}>✨</Text>
                    <Text style={styles.quickActionText}>3-Card</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => navigation.navigate('PracticeTab', { screen: 'VeraChat' })}
                  >
                    <Text style={styles.quickActionIcon}>💬</Text>
                    <Text style={styles.quickActionText}>Vera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => navigation.navigate('ReadingType')}
                  >
                    <Text style={styles.quickActionIcon}>🌟</Text>
                    <Text style={styles.quickActionText}>More...</Text>
                  </TouchableOpacity>
                </View>
              </VictorianCard>
            </View>
          )}
        </View>

        {/* Mobile-only: Quick actions below card */}
        {isMobile && (
          <View style={styles.mobileActions}>
            <View style={styles.mobileActionsRow}>
              <CosmicButton
                title="Single Card"
                icon="🎴"
                variant="primary"
                size="md"
                onPress={() => handleQuickReading('single')}
                style={{ flex: 1, marginRight: 8 }}
              />
              <CosmicButton
                title="3-Card"
                icon="✨"
                variant="primary"
                size="md"
                onPress={() => handleQuickReading('three-card')}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
            <CosmicButton
              title="Talk to Vera"
              icon="💬"
              variant="ghost"
              size="md"
              onPress={() => navigation.navigate('PracticeTab', { screen: 'VeraChat' })}
              fullWidth
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            HISTORY & STATS BOX - Consolidated widget
        ═══════════════════════════════════════════════════════════════════ */}
        <VictorianCard style={styles.historyStatsCard}>
          {/* Reading History Button */}
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('ReadingHistory')}
          >
            <Text style={styles.historyButtonIcon}>📖</Text>
            <Text style={styles.historyButtonText}>Reading History</Text>
            <Text style={styles.historyButtonArrow}>→</Text>
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsRowInCard}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>{user.stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🔮</Text>
              <Text style={styles.statValue}>{user.stats.totalReadings}</Text>
              <Text style={styles.statLabel}>Readings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📝</Text>
              <Text style={styles.statValue}>{user.stats.totalJournalEntries}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
          </View>
        </VictorianCard>
      </VeilPathScreen>
    );
  }

  // Mobile version with cosmic design
  return (
    <VeilPathScreen
      intensity="medium"
      scrollable={true}
      contentStyle={styles.mobileContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>
            Welcome back, {user.progression.currentTitle}
          </Text>
        </View>

        <VictorianCard style={styles.levelCard} showCorners={false}>
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>LEVEL {user.progression.level}</Text>
            <Text style={styles.xpText}>
              {user.progression.xp} / {user.progression.xpToNextLevel} XP
            </Text>
          </View>
          <View style={styles.xpBar}>
            <View
              style={[
                styles.xpFill,
                { width: `${(user.progression.xp / user.progression.xpToNextLevel) * 100}%` }
              ]}
            />
          </View>
        </VictorianCard>
      </View>

      {/* Daily Card */}
      {dailyCard && (
        <View style={styles.dailyCardSection}>
          <SectionHeader
            icon="🌙"
            title="Daily Vera"
            subtitle="Your guidance for today"
          />

          <VictorianCard style={styles.dailyCardContainer} glowColor={COSMIC.candleFlame}>
            <View style={styles.dailyCardWrapper}>
              <TarotCard
                card={dailyCard.card}
                isReversed={dailyCard.isReversed}
                size="lg"
                showName={true}
                showBack={true}
                onPress={handleDailyCardPress}
                cardBackSource={cardBackSource}
              />
            </View>

            <TouchableOpacity style={styles.interpretButton} onPress={handleDailyCardPress}>
              <Text style={styles.interpretButtonText}>View Interpretation</Text>
            </TouchableOpacity>
          </VictorianCard>
        </View>
      )}

      <CosmicDivider />

      {/* Quick Actions */}
      <SectionHeader icon="🔮" title="Begin Reading" />

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => handleQuickReading('single')}
        >
          <Text style={styles.actionIcon}>🎴</Text>
          <Text style={styles.primaryActionText}>Single Card</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => handleQuickReading('three-card')}
        >
          <Text style={styles.actionIcon}>✨</Text>
          <Text style={styles.secondaryActionText}>Three-Card Spread</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostAction}
          onPress={() => navigation.navigate('ReadingType')}
        >
          <Text style={styles.ghostActionText}>Choose Spread →</Text>
        </TouchableOpacity>
      </View>

      <CosmicDivider />

      {/* Stats */}
      <SectionHeader icon="📊" title="Your Practice" />

      <VictorianCard style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{user.stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statEmoji}>🔮</Text>
            <Text style={styles.statValue}>{user.stats.totalReadings}</Text>
            <Text style={styles.statLabel}>Readings</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={styles.statValue}>{user.stats.totalJournalEntries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
        </View>
      </VictorianCard>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('ReadingHistory')}
      >
        <Text style={styles.historyButtonText}>View Reading History →</Text>
      </TouchableOpacity>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  // ═══════════════════════════════════════════════════════════
  // MOBILE STYLES
  // ═══════════════════════════════════════════════════════════
  mobileContent: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 1,
    color: COSMIC.moonGlow,
    flex: 1,
    textAlign: 'center',
  },
  levelCard: {
    padding: 16,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    color: COSMIC.etherealCyan,
  },
  xpText: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  xpBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: COSMIC.deepAmethyst,
    borderRadius: 3,
  },

  dailyCardSection: {
    marginBottom: 20,
  },
  dailyCardContainer: {
    alignItems: 'center',
    padding: 24,
  },
  dailyCardWrapper: {
    marginBottom: 20,
  },
  interpretButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  interpretButtonText: {
    color: '#1a1f3a',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },

  actions: {
    marginBottom: 20,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionIcon: {
    fontSize: 20,
  },
  primaryActionText: {
    color: '#1a1f3a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
  },
  secondaryActionText: {
    color: COSMIC.moonGlow,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  ghostAction: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ghostActionText: {
    color: COSMIC.etherealCyan,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },

  statsCard: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  historyButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 40,
  },
  historyButtonText: {
    color: COSMIC.etherealCyan,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // ═══════════════════════════════════════════════════════════
  // WEB STYLES
  // ═══════════════════════════════════════════════════════════
  headerWeb: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  headerTopWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  greetingWeb: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 3,
    color: COSMIC.moonGlow,
    fontFamily: 'Cinzel, serif',
    textShadowColor: 'rgba(225, 190, 231, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  levelCardWeb: {
    alignItems: 'center',
    padding: 24,
    minWidth: 300,
  },
  levelLabelWeb: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    color: COSMIC.etherealCyan,
    marginBottom: 12,
  },
  xpBarWeb: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst,
  },
  xpFillWeb: {
    height: '100%',
    backgroundColor: COSMIC.deepAmethyst,
    boxShadow: `0 0 10px ${COSMIC.deepAmethyst}`,
  },
  xpTextWeb: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    fontWeight: '600',
  },

  dailyCardSectionWeb: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  dailyCardContainerWeb: {
    alignItems: 'center',
    padding: 40,
    width: '100%',
  },
  dailyCardWrapperWeb: {
    marginBottom: 30,
  },

  actionsWeb: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  actionButtonWeb: {
    marginBottom: 16,
  },

  statsCardWeb: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: 30,
  },
  statsRowWeb: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statWeb: {
    alignItems: 'center',
    flex: 1,
  },
  statDividerWeb: {
    width: 1,
    height: 60,
    backgroundColor: COSMIC.brassVictorian,
    opacity: 0.3,
  },
  statValueWeb: {
    fontSize: 36,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 4,
  },
  statLabelWeb: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statEmojiWeb: {
    fontSize: 24,
    opacity: 0.6,
  },

  featuresWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 30,
    marginBottom: 30,
  },

  historyButtonWeb: {
    marginTop: 20,
    marginBottom: 60,
  },

  // ═══════════════════════════════════════════════════════════
  // MAGAZINE LAYOUT STYLES
  // ═══════════════════════════════════════════════════════════

  // Top Bar (always visible, full-width)
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COSMIC.brassVictorian + '40',
    marginBottom: 24,
    width: '100%',
  },
  leftChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(183, 142, 82, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COSMIC.candleFlame + '60',
  },
  currencyIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  currencyText: {
    color: COSMIC.candleFlame,
    fontSize: 16,
    fontWeight: '700',
  },
  tierChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.4)',
  },
  tierChipPremium: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: COSMIC.candleFlame + '60',
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(200, 200, 200, 0.8)',
    textTransform: 'uppercase',
  },
  tierTextPremium: {
    color: COSMIC.candleFlame,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 6,
    color: COSMIC.moonGlow,
    fontFamily: 'Cinzel, serif',
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(106, 76, 147, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst + '60',
    gap: 12,
  },
  levelChipText: {
    color: COSMIC.etherealCyan,
    fontSize: 14,
    fontWeight: '700',
  },
  xpBarMini: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFillMini: {
    height: '100%',
    backgroundColor: COSMIC.deepAmethyst,
  },
  xpTextMini: {
    color: COSMIC.crystalPink,
    fontSize: 12,
    fontWeight: '600',
  },

  // Magazine Container (two-column)
  magazineContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  magazineContainerWide: {
    flexDirection: 'row',
    gap: 32,
  },

  // Card Column (left side)
  cardColumn: {
    flex: 1,
  },
  cardColumnWide: {
    flex: 3,
    maxWidth: 600,
  },
  dailyCardContainerMag: {
    alignItems: 'center',
    padding: 32,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    color: COSMIC.candleFlame,
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  dailyCardWrapperMag: {
    marginBottom: 24,
  },
  revealedInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    fontFamily: 'Cinzel, serif',
    marginBottom: 4,
  },
  cardOrientation: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
    textTransform: 'lowercase',
  },

  // Info Column (right side)
  infoColumn: {
    flex: 2,
    maxWidth: 400,
    gap: 24,
  },
  cardDetailsCard: {
    padding: 24,
  },
  cardDetailTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: COSMIC.etherealCyan,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  cardDetailKeyword: {
    fontSize: 28,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    fontFamily: 'Cinzel, serif',
    marginBottom: 12,
  },
  cardDetailHint: {
    fontSize: 16,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // Quick Actions Card
  quickActionsCard: {
    padding: 24,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    color: COSMIC.candleFlame,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(106, 76, 147, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COSMIC.brassVictorian + '40',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    fontWeight: '600',
  },

  // History & Stats Card (consolidated)
  historyStatsCard: {
    padding: 0,
    marginHorizontal: 24,
    marginBottom: 40,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: COSMIC.brassVictorian + '30',
  },
  historyButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  historyButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    letterSpacing: 1,
  },
  historyButtonArrow: {
    fontSize: 18,
    color: COSMIC.candleFlame,
  },
  statsRowInCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  statLabel: {
    fontSize: 10,
    color: COSMIC.moonGlow,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COSMIC.brassVictorian + '30',
  },

  // Mobile Actions
  mobileActions: {
    paddingHorizontal: 24,
    marginBottom: 24,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  mobileActionsRow: {
    flexDirection: 'row',
  },

});
