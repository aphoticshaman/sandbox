/**
 * Card Selection Spread - VeilPath WitchTok x Victorian Gothic
 * Card selection interface with cosmic aesthetic
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { useSafeDimensions } from '../utils/useSafeDimensions';

// Import VeilPath Design System
import { COSMIC } from './VeilPathDesign';

export default function CardSelectionSpread({
  cardCount = 3,
  onCardSelected,
  promptText = "Choose your card..."
}) {
  const { width: SCREEN_WIDTH } = useSafeDimensions();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [pulseAnims] = useState(
    Array(cardCount).fill(0).map(() => new Animated.Value(1))
  );
  const [glowAnims] = useState(
    Array(cardCount).fill(0).map(() => new Animated.Value(0.4))
  );

  // Start pulsing animation for all cards
  React.useEffect(() => {
    pulseAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.05,
            duration: 1000 + (index * 200),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000 + (index * 200),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    glowAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.9,
            duration: 1500 + (index * 150),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.4,
            duration: 1500 + (index * 150),
            useNativeDriver: false,
          }),
        ])
      ).start();
    });
  }, []);

  const handleCardTap = (index) => {
    if (selectedIndex !== null) return;

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate([0, 50, 100, 50]);
    }

    setSelectedIndex(index);

    pulseAnims.forEach(anim => anim.stopAnimation());
    glowAnims.forEach(anim => anim.stopAnimation());

    setTimeout(() => {
      onCardSelected && onCardSelected(index);
    }, 600);
  };

  const getCardLayout = () => {
    const cardWidth = SCREEN_WIDTH * 0.25;
    const cardHeight = cardWidth * 1.5;
    const spacing = 10;

    switch (cardCount) {
      case 3:
        return { cardWidth, cardHeight, spacing };
      case 5:
        return { cardWidth: SCREEN_WIDTH * 0.22, cardHeight: cardWidth * 1.5, spacing: 8 };
      case 7:
        return { cardWidth: SCREEN_WIDTH * 0.2, cardHeight: cardWidth * 1.5, spacing: 5 };
      default:
        return { cardWidth, cardHeight, spacing };
    }
  };

  const { cardWidth, cardHeight, spacing } = getCardLayout();

  return (
    <View style={styles.container}>
      {/* Prompt text */}
      <View style={styles.promptContainer}>
        <Text style={styles.promptText}>
          {promptText}
        </Text>
      </View>

      {/* Card spread */}
      <View style={[styles.cardRow, { gap: spacing }]}>
        {Array(cardCount).fill(0).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              {
                transform: [{ scale: pulseAnims[index] }],
                opacity: selectedIndex !== null && selectedIndex !== index ? 0.3 : 1,
              }
            ]}
          >
            <TouchableOpacity
              onPress={() => handleCardTap(index)}
              disabled={selectedIndex !== null}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.cardBack,
                  {
                    width: cardWidth,
                    height: cardHeight,
                    borderColor: selectedIndex === index ? COSMIC.candleFlame : COSMIC.brassVictorian,
                    borderWidth: selectedIndex === index ? 3 : 2,
                    shadowOpacity: glowAnims[index],
                    shadowColor: COSMIC.deepAmethyst,
                  }
                ]}
              >
                {/* Card back design */}
                <View style={styles.cardContent}>
                  {selectedIndex === index ? (
                    <Text style={styles.selectedLabel}>✓</Text>
                  ) : (
                    <View style={styles.cardDesign}>
                      <Text style={styles.cardSymbol}>🌙</Text>
                      <View style={styles.cardBorder} />
                    </View>
                  )}
                </View>

                {/* Card number indicator */}
                <View style={styles.cardNumber}>
                  <Text style={[
                    styles.numberText,
                    { color: selectedIndex === index ? COSMIC.candleFlame : COSMIC.crystalPink }
                  ]}>
                    {index + 1}
                  </Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Hint text */}
      {selectedIndex === null && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            Trust your intuition
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  promptContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  promptText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  cardBack: {
    borderRadius: 12,
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 10,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDesign: {
    alignItems: 'center',
    gap: 8,
  },
  cardSymbol: {
    fontSize: 28,
  },
  cardBorder: {
    width: 40,
    height: 2,
    backgroundColor: COSMIC.brassVictorian,
    opacity: 0.5,
    borderRadius: 1,
  },
  selectedLabel: {
    fontSize: 44,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  cardNumber: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  numberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  hintContainer: {
    marginTop: 28,
  },
  hintText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
});
