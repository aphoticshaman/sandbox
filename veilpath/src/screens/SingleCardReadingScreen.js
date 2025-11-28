/**
 * Single Card Reading Screen - VeilPath WitchTok x Victorian Gothic
 * Draw and reveal a single tarot card with cosmic design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { TarotCard } from '../components';
import { useUserStore } from '../stores/userStore';
import { useReadingStore } from '../stores/readingStore';
import { drawCards } from '../data/tarotDeckAdapter';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

// Coherence integration
import { useCoherence } from '../contexts/CoherenceContext';
import { useBehavioralSignals } from '../hooks/useBehavioralSignals';

export default function SingleCardReadingScreen({ navigation, route }) {
  const { intention = '' } = route.params || {};
  const userStore = useUserStore();
  const readingStore = useReadingStore();

  // Coherence integration
  const { injectPhases } = useCoherence();
  const { handlers, recordScreenChange } = useBehavioralSignals({
    onPhasesUpdate: (phaseData) => injectPhases(phaseData.phases),
  });

  useEffect(() => {
    recordScreenChange('SingleCardReadingScreen');
  }, [recordScreenChange]);

  const [drawnCard, setDrawnCard] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for placeholder
  useEffect(() => {
    if (!drawnCard && !isDrawing) {
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [drawnCard, isDrawing]);

  const handleDrawCard = () => {
    setIsDrawing(true);

    setTimeout(() => {
      const drawn = drawCards(1, true);
      if (drawn.length > 0) {
        setDrawnCard(drawn[0]);

        readingStore.startReading('single', intention);
        readingStore.addCardToReading(
          drawn[0].card.id.toString(),
          0,
          'Present',
          drawn[0].isReversed
        );

        setIsDrawing(false);
      }
    }, 1500);
  };

  const handleViewInterpretation = () => {
    if (!drawnCard) return;

    readingStore.completeReading();
    userStore.awardXP(10);
    userStore.incrementStat('totalReadings', 1);

    navigation.navigate('CardInterpretation', {
      card: drawnCard.card,
      isReversed: drawnCard.isReversed,
      readingType: 'single',
      // Tiered asset info
      tier: drawnCard.tier,
      assetType: drawnCard.assetType,
      imageOverride: drawnCard.image,
    });
  };

  return (
    <VeilPathScreen intensity="full" scrollable={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <SectionHeader
            icon="🎴"
            title="Single Card"
            subtitle="Focus on your question"
          />
        </View>

        {/* Intention */}
        {intention && (
          <VictorianCard style={styles.intentionCard} showCorners={false}>
            <Text style={styles.intentionLabel}>YOUR INTENTION</Text>
            <Text style={styles.intentionText}>"{intention}"</Text>
          </VictorianCard>
        )}

        {/* Card Display */}
        <View style={styles.cardContainer}>
          {drawnCard ? (
            <VictorianCard style={styles.revealedCard} glowColor={COSMIC.candleFlame}>
              <TarotCard
                card={drawnCard.card}
                isReversed={drawnCard.isReversed}
                size="full"
                showName={true}
                imageOverride={drawnCard.image}
                tier={drawnCard.tier}
                assetType={drawnCard.assetType}
              />
            </VictorianCard>
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <VictorianCard style={styles.placeholder} glowColor={COSMIC.deepAmethyst}>
                <Text style={styles.placeholderEmoji}>
                  {isDrawing ? '✨' : '🌙'}
                </Text>
                <Text style={styles.placeholderText}>
                  {isDrawing ? 'Shuffling the cosmos...' : 'Ready to draw'}
                </Text>
                <Text style={styles.placeholderSubtext}>
                  {isDrawing ? 'Your card is emerging' : 'Tap below when ready'}
                </Text>
              </VictorianCard>
            </Animated.View>
          )}
        </View>

        <CosmicDivider />

        {/* Actions */}
        <View style={styles.actions}>
          {!drawnCard ? (
            <TouchableOpacity
              style={[styles.primaryButton, isDrawing && styles.buttonDisabled]}
              onPress={handleDrawCard}
              disabled={isDrawing}
            >
              <Text style={styles.primaryButtonText}>
                {isDrawing ? '✨ Drawing...' : '🎴 Draw Your Card'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleViewInterpretation}
              >
                <Text style={styles.primaryButtonText}>
                  ✨ View Full Interpretation
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setDrawnCard(null)}
              >
                <Text style={styles.secondaryButtonText}>
                  Draw Another Card
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.ghostButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coherence: {
    marginTop: 8,
  },

  intentionCard: {
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  intentionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COSMIC.crystalPink,
    letterSpacing: 2,
    marginBottom: 8,
  },
  intentionText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COSMIC.moonGlow,
    textAlign: 'center',
    lineHeight: 22,
  },

  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  revealedCard: {
    padding: 16,
    alignItems: 'center',
  },
  placeholder: {
    width: 260,
    height: 420,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    opacity: 0.8,
    textAlign: 'center',
  },

  actions: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
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
      web: {
        boxShadow: `0 4px 20px ${COSMIC.candleFlame}50`,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#1a1f3a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
  },
  secondaryButtonText: {
    color: COSMIC.moonGlow,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  ghostButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ghostButtonText: {
    color: COSMIC.etherealCyan,
    fontSize: 14,
    fontWeight: '600',
  },
});
