/**
 * SpreadMiniMap - Mini-map HUD overlay showing spread layout
 * Displays tiny card indicators with revealed/unrevealed states and highlight
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * SpreadMiniMap Component
 * @param {string} spreadType - Type of spread (single_card, three_card, five_card, celtic_cross)
 * @param {number} totalCards - Total number of cards in spread
 * @param {number} currentIndex - Currently displayed card index (-1 for none/all revealed)
 * @param {number} revealedCount - Number of cards revealed so far
 */
export default function SpreadMiniMap({
  spreadType = 'single_card',
  totalCards = 1,
  currentIndex = -1,
  revealedCount = 0,
}) {
  const cardPositions = getSpreadPositions(spreadType, totalCards);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(10, 10, 15, 0.9)', 'rgba(26, 26, 46, 0.85)']}
        style={styles.background}
      >
        <View style={styles.spreadContainer}>
          {cardPositions.map((pos, index) => (
            <MiniCard
              key={index}
              position={pos}
              isRevealed={index < revealedCount}
              isCurrent={index === currentIndex}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * Individual mini card indicator
 */
function MiniCard({ position, isRevealed, isCurrent }) {
  return (
    <View
      style={[
        styles.miniCard,
        {
          left: position.x,
          top: position.y,
          transform: [{ rotate: `${position.rotation || 0}deg` }],
        },
      ]}
    >
      {/* Current card highlight (green aura) */}
      {isCurrent && (
        <View style={styles.currentAura}>
          <LinearGradient
            colors={['rgba(0, 255, 100, 0.6)', 'rgba(0, 255, 100, 0.1)']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* Card outline */}
      <View
        style={[
          styles.cardOutline,
          isRevealed ? styles.cardRevealed : styles.cardHidden,
          isCurrent && styles.cardCurrent,
        ]}
      />
    </View>
  );
}

/**
 * Get card positions for each spread type
 * Returns array of {x, y, rotation} for each card (relative positions)
 */
function getSpreadPositions(spreadType, totalCards) {
  const CARD_WIDTH = 12;
  const CARD_HEIGHT = 18;
  const SPACING = 18;

  switch (spreadType) {
    case 'single_card':
      return [{ x: 35, y: 15 }];

    case 'three_card':
      // Horizontal row: Past, Present, Future
      return [
        { x: 10, y: 15 }, // Past
        { x: 35, y: 15 }, // Present
        { x: 60, y: 15 }, // Future
      ];

    case 'five_card':
      // Cross pattern
      return [
        { x: 35, y: 5 },  // Card 1: Present (center-top)
        { x: 10, y: 20 }, // Card 2: Challenge (left)
        { x: 35, y: 20 }, // Card 3: Past (center)
        { x: 60, y: 20 }, // Card 4: Future (right)
        { x: 35, y: 35 }, // Card 5: Outcome (bottom)
      ];

    case 'celtic_cross':
      // Traditional 10-card layout (simplified for mini-map)
      return [
        { x: 28, y: 20 }, // 1: Present
        { x: 28, y: 20, rotation: 90 }, // 2: Challenge (crossing)
        { x: 28, y: 5 },  // 3: Foundation (above)
        { x: 10, y: 20 }, // 4: Recent Past (left)
        { x: 28, y: 35 }, // 5: Possible Future (below)
        { x: 46, y: 20 }, // 6: Near Future (right)
        { x: 70, y: 35 }, // 7: Self
        { x: 70, y: 25 }, // 8: Environment
        { x: 70, y: 15 }, // 9: Hopes/Fears
        { x: 70, y: 5 },  // 10: Outcome
      ];

    default:
      // Fallback: horizontal row
      const positions = [];
      for (let i = 0; i < totalCards; i++) {
        positions.push({
          x: 10 + i * SPACING,
          y: 15,
        });
      }
      return positions;
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(138, 43, 226, 0.6)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  background: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  spreadContainer: {
    width: 90,
    height: 50,
    position: 'relative',
  },
  miniCard: {
    position: 'absolute',
    width: 12,
    height: 18,
  },
  currentAura: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 4,
  },
  cardOutline: {
    width: 12,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  cardHidden: {
    borderColor: 'rgba(153, 69, 255, 0.5)',
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
  },
  cardRevealed: {
    borderColor: 'rgba(0, 240, 255, 0.8)',
    backgroundColor: 'rgba(0, 240, 255, 0.3)',
  },
  cardCurrent: {
    borderColor: '#00FF64',
    borderWidth: 2,
    shadowColor: '#00FF64',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
