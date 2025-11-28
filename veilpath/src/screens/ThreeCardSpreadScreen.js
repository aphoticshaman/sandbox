/**
 * Three-Card Spread Screen - VeilPath WitchTok x Victorian Gothic
 * Past / Present / Future reading with cosmic design
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

const POSITIONS = [
  { id: 0, name: 'Past', description: 'What has led you here', emoji: '🌘' },
  { id: 1, name: 'Present', description: 'Where you are now', emoji: '🌕' },
  { id: 2, name: 'Future', description: 'What is emerging', emoji: '🌒' },
];

export default function ThreeCardSpreadScreen({ navigation, route }) {
  const { intention = '' } = route.params || {};
  const userStore = useUserStore();
  const readingStore = useReadingStore();

  // Coherence integration
  const { injectPhases } = useCoherence();
  const { handlers, recordScreenChange } = useBehavioralSignals({
    onPhasesUpdate: (phaseData) => injectPhases(phaseData.phases),
  });

  useEffect(() => {
    recordScreenChange('ThreeCardSpreadScreen');
  }, [recordScreenChange]);

  const [drawnCards, setDrawnCards] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for current position
  useEffect(() => {
    if (!isComplete && !isDrawing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isComplete, isDrawing, currentPosition]);

  const handleDrawCard = () => {
    setIsDrawing(true);

    setTimeout(() => {
      const drawn = drawCards(1, true);
      if (drawn.length > 0) {
        const newCard = drawn[0];
        const newCards = [...drawnCards, newCard];
        setDrawnCards(newCards);

        if (currentPosition === 0) {
          readingStore.startReading('three-card', intention);
        }

        readingStore.addCardToReading(
          newCard.card.id.toString(),
          currentPosition,
          POSITIONS[currentPosition].name,
          newCard.isReversed
        );

        if (currentPosition < 2) {
          setCurrentPosition(currentPosition + 1);
        } else {
          setIsComplete(true);
          readingStore.completeReading();
          userStore.awardXP(20, { containsCBT: false, containsDBT: false });
          userStore.incrementStat('totalReadings', 1);
        }

        setIsDrawing(false);
      }
    }, 1500);
  };

  const handleViewCard = (index) => {
    const cardData = drawnCards[index];
    navigation.navigate('CardInterpretation', {
      card: cardData.card,
      isReversed: cardData.isReversed,
      readingType: 'three-card',
      position: POSITIONS[index].name,
      // Tiered asset info
      tier: cardData.tier,
      assetType: cardData.assetType,
      imageOverride: cardData.image,
    });
  };

  const handleViewFullReading = () => {
    navigation.navigate('ThreeCardInterpretation', {
      cards: drawnCards,
      positions: POSITIONS,
      intention,
    });
  };

  const handleReset = () => {
    setDrawnCards([]);
    setCurrentPosition(0);
    setIsComplete(false);
  };

  return (
    <VeilPathScreen intensity="full" scrollable={true}>
      {/* Header */}
      <View style={styles.header}>
        <SectionHeader
          icon="✨"
          title="Three-Card Spread"
          subtitle="Past • Present • Future"
        />
      </View>

      {/* Intention */}
      {intention && (
        <VictorianCard style={styles.intentionCard} showCorners={false}>
          <Text style={styles.intentionLabel}>YOUR INTENTION</Text>
          <Text style={styles.intentionText}>"{intention}"</Text>
        </VictorianCard>
      )}

      {/* Progress Indicator */}
      {!isComplete && (
        <VictorianCard style={styles.progressCard} glowColor={COSMIC.deepAmethyst}>
          <Text style={styles.progressEmoji}>{POSITIONS[currentPosition].emoji}</Text>
          <Text style={styles.progressTitle}>
            Drawing: {POSITIONS[currentPosition].name}
          </Text>
          <Text style={styles.progressSubtext}>
            {POSITIONS[currentPosition].description}
          </Text>
          <View style={styles.progressDots}>
            {POSITIONS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < drawnCards.length && styles.progressDotFilled,
                  i === currentPosition && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </VictorianCard>
      )}

      {/* Cards Display */}
      <View style={styles.cardsContainer}>
        {POSITIONS.map((position, index) => (
          <TouchableOpacity
            key={position.id}
            style={styles.cardPosition}
            onPress={() => drawnCards[index] && handleViewCard(index)}
            disabled={!drawnCards[index]}
          >
            <Text style={styles.positionEmoji}>{position.emoji}</Text>
            <Text style={styles.positionLabel}>{position.name}</Text>

            {drawnCards[index] ? (
              <VictorianCard style={styles.cardWrapper} showCorners={false} glowColor={COSMIC.candleFlame}>
                <TarotCard
                  card={drawnCards[index].card}
                  isReversed={drawnCards[index].isReversed}
                  size="sm"
                  showName={false}
                  imageOverride={drawnCards[index].image}
                  tier={drawnCards[index].tier}
                  assetType={drawnCards[index].assetType}
                />
              </VictorianCard>
            ) : (
              <Animated.View
                style={[
                  styles.cardPlaceholder,
                  index === currentPosition && { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <VictorianCard
                  style={[
                    styles.placeholderCard,
                    index === currentPosition && styles.placeholderCardActive,
                  ]}
                  showCorners={false}
                >
                  <Text style={styles.placeholderText}>
                    {index === currentPosition ? '?' : '•'}
                  </Text>
                </VictorianCard>
              </Animated.View>
            )}

            <Text style={styles.positionDescription}>
              {position.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <CosmicDivider />

      {/* Actions */}
      <View style={styles.actions}>
        {!isComplete ? (
          <TouchableOpacity
            style={[styles.primaryButton, isDrawing && styles.buttonDisabled]}
            onPress={handleDrawCard}
            disabled={isDrawing}
          >
            <Text style={styles.primaryButtonText}>
              {isDrawing
                ? '✨ Drawing...'
                : `🎴 Draw ${POSITIONS[currentPosition].name}`
              }
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Completion Card */}
            <VictorianCard style={styles.completeCard} glowColor={COSMIC.candleFlame}>
              <Text style={styles.completeEmoji}>✨</Text>
              <Text style={styles.completeTitle}>Reading Complete</Text>
              <Text style={styles.completeText}>+20 XP earned • Saved to history</Text>
            </VictorianCard>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleViewFullReading}
            >
              <Text style={styles.primaryButtonText}>
                🔮 View Full Reading
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleReset}
            >
              <Text style={styles.secondaryButtonText}>
                New Three-Card Reading
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.ghostButton}
          onPress={() => navigation.navigate('HomeTab')}
        >
          <Text style={styles.ghostButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
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

  progressCard: {
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  progressEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  progressSubtext: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    opacity: 0.8,
    marginBottom: 12,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(184, 134, 11, 0.3)',
    borderWidth: 1,
    borderColor: COSMIC.brassVictorian,
  },
  progressDotFilled: {
    backgroundColor: COSMIC.candleFlame,
    borderColor: COSMIC.candleFlame,
  },
  progressDotActive: {
    backgroundColor: COSMIC.etherealCyan,
    borderColor: COSMIC.etherealCyan,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.etherealCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
    }),
  },

  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  cardPosition: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  positionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  positionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardWrapper: {
    padding: 8,
    alignItems: 'center',
  },
  cardPlaceholder: {
    // Animation wrapper
  },
  placeholderCard: {
    width: 90,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
  },
  placeholderCardActive: {
    borderColor: COSMIC.etherealCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
  placeholderText: {
    fontSize: 32,
    color: COSMIC.moonGlow,
    opacity: 0.5,
  },
  positionDescription: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },

  completeCard: {
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  completeEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  completeText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    opacity: 0.8,
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
