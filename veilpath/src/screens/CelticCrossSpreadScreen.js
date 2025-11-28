/**
 * Celtic Cross Spread Screen - VeilPath WitchTok x Victorian Gothic
 * 10-card advanced reading with sequential draw
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { TarotCard } from '../components/TarotCard';
import { drawCards } from '../data/tarotDeckAdapter';
import { useReadingStore } from '../stores/readingStore';
import { useUserStore } from '../stores/userStore';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

// Cross-platform alert
const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && buttons[1]?.onPress) buttons[1].onPress();
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message, buttons);
  }
};

const POSITIONS = [
  { id: 0, name: 'Present Situation', description: 'Where you are right now', icon: '🎯' },
  { id: 1, name: 'Challenge', description: 'What crosses you / obstacle to overcome', icon: '⚔️' },
  { id: 2, name: 'Foundation', description: 'Root cause / basis of the situation', icon: '🏛️' },
  { id: 3, name: 'Recent Past', description: 'What is leaving / passing away', icon: '🌅' },
  { id: 4, name: 'Crown', description: 'Best possible outcome / conscious goal', icon: '👑' },
  { id: 5, name: 'Near Future', description: 'What is approaching / coming soon', icon: '🌄' },
  { id: 6, name: 'Your Approach', description: 'How you see yourself / your attitude', icon: '🪞' },
  { id: 7, name: 'External Influences', description: 'How others see you / environment', icon: '🌍' },
  { id: 8, name: 'Hopes & Fears', description: 'Your aspirations and anxieties', icon: '💭' },
  { id: 9, name: 'Final Outcome', description: 'Where this is all leading', icon: '✨' },
];

export default function CelticCrossSpreadScreen({ navigation, route }) {
  const { intention = '' } = route.params || {};
  const readingStore = useReadingStore();
  const userStore = useUserStore();

  const [drawnCards, setDrawnCards] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleDrawCard = () => {
    if (isComplete) return;

    setIsDrawing(true);
    setTimeout(() => {
      const drawn = drawCards(1, true);
      const newCard = drawn[0];
      const newCards = [...drawnCards, newCard];
      setDrawnCards(newCards);

      if (currentPosition === 0) {
        readingStore.startReading('celtic-cross', intention);
      }

      readingStore.addCardToReading(
        newCard.card.id.toString(),
        currentPosition,
        POSITIONS[currentPosition].name,
        newCard.isReversed
      );

      if (currentPosition < 9) {
        setCurrentPosition(currentPosition + 1);
      } else {
        setIsComplete(true);
        readingStore.completeReading();
        userStore.awardXP(100);
        userStore.incrementStat('totalReadings', 1);
      }
      setIsDrawing(false);
    }, 1500);
  };

  const handleViewReading = () => {
    navigation.navigate('CelticCrossInterpretation', {
      cards: drawnCards,
      intention,
    });
  };

  const handleBack = () => {
    if (drawnCards.length > 0 && !isComplete) {
      showAlert(
        'Leave Reading?',
        'Your reading is in progress. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const getCurrentPositionInfo = () => {
    if (isComplete) return null;
    return POSITIONS[currentPosition];
  };

  const positionInfo = getCurrentPositionInfo();

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <TouchableOpacity onPress={handleBack}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <SectionHeader
        icon="✨"
        title="Celtic Cross"
        subtitle="10-Card Advanced Reading"
      />

      {/* Intention */}
      {intention && (
        <VictorianCard style={styles.intentionCard} showCorners={false}>
          <Text style={styles.intentionLabel}>Your Intention</Text>
          <Text style={styles.intentionText}>{intention}</Text>
        </VictorianCard>
      )}

      {/* Progress */}
      <VictorianCard style={styles.progressCard} glowColor={COSMIC.deepAmethyst}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{drawnCards.length} / 10</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${(drawnCards.length / 10) * 100}%` },
            ]}
          />
        </View>
      </VictorianCard>

      {/* Current Position (before completion) */}
      {!isComplete && positionInfo && (
        <VictorianCard style={styles.positionCard} glowColor={COSMIC.candleFlame}>
          <Text style={styles.positionIcon}>{positionInfo.icon}</Text>
          <Text style={styles.positionNumber}>
            Position {currentPosition + 1}
          </Text>
          <Text style={styles.positionName}>{positionInfo.name}</Text>
          <Text style={styles.positionDescription}>
            {positionInfo.description}
          </Text>
        </VictorianCard>
      )}

      <CosmicDivider />

      {/* Drawn Cards Grid */}
      {drawnCards.length > 0 && (
        <View style={styles.cardsSection}>
          <Text style={styles.sectionTitle}>Drawn Cards</Text>
          <View style={styles.cardsGrid}>
            {drawnCards.map((drawnCard, index) => (
              <View key={index} style={styles.cardItem}>
                <TarotCard
                  card={drawnCard.card}
                  isReversed={drawnCard.isReversed}
                  size="sm"
                  showName={false}
                  imageOverride={drawnCard.image}
                  tier={drawnCard.tier}
                  assetType={drawnCard.assetType}
                />
                <Text style={styles.cardPosition}>{index + 1}</Text>
                <Text style={styles.cardPositionName}>
                  {POSITIONS[index].name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Draw Button */}
      {!isComplete && (
        <TouchableOpacity
          style={[styles.drawButton, isDrawing && styles.drawButtonDisabled]}
          onPress={handleDrawCard}
          disabled={isDrawing}
        >
          <Text style={styles.drawButtonText}>
            {isDrawing ? '✨ Drawing...' : drawnCards.length === 0 ? '✨ Draw First Card' : '✨ Draw Next Card'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Complete - View Reading */}
      {isComplete && (
        <>
          <VictorianCard style={styles.completeCard} glowColor={COSMIC.candleFlame}>
            <Text style={styles.completeIcon}>✨</Text>
            <Text style={styles.completeTitle}>Reading Complete</Text>
            <Text style={styles.completeSubtitle}>
              All 10 cards have been drawn
            </Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpEarned}>+100 XP earned!</Text>
            </View>
          </VictorianCard>

          <TouchableOpacity style={styles.viewButton} onPress={handleViewReading}>
            <Text style={styles.viewButtonText}>View Full Interpretation</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Celtic Cross Info */}
      <VictorianCard style={styles.infoCard} showCorners={false}>
        <Text style={styles.infoTitle}>🔮 About the Celtic Cross</Text>
        <Text style={styles.infoText}>
          The Celtic Cross is the most popular and comprehensive tarot spread. It provides deep insight into complex situations by examining past, present, future, internal and external influences.
        </Text>
        <Text style={styles.infoText}>
          Take your time with each card. This reading is meant for serious questions and life-changing decisions.
        </Text>
      </VictorianCard>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    marginBottom: 16,
  },

  intentionCard: {
    marginBottom: 16,
    padding: 18,
  },
  intentionLabel: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  intentionText: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    fontStyle: 'italic',
    lineHeight: 24,
  },

  progressCard: {
    marginBottom: 16,
    padding: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COSMIC.candleFlame,
    borderRadius: 4,
  },

  positionCard: {
    marginBottom: 16,
    padding: 28,
    alignItems: 'center',
  },
  positionIcon: {
    fontSize: 48,
    marginBottom: 14,
  },
  positionNumber: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.7,
  },
  positionName: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  positionDescription: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },

  cardsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardItem: {
    alignItems: 'center',
    width: '30%',
  },
  cardPosition: {
    fontSize: 11,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginTop: 8,
  },
  cardPositionName: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    opacity: 0.7,
  },

  drawButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  drawButtonDisabled: {
    opacity: 0.6,
  },
  drawButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },

  completeCard: {
    marginBottom: 16,
    padding: 32,
    alignItems: 'center',
  },
  completeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  completeSubtitle: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    marginBottom: 16,
    opacity: 0.9,
  },
  xpBadge: {
    backgroundColor: 'rgba(74, 20, 140, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  xpEarned: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },

  viewButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },

  infoCard: {
    marginBottom: 40,
    padding: 20,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 14,
  },
  infoText: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 22,
    marginBottom: 10,
    opacity: 0.9,
  },
});
