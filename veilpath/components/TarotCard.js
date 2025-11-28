import React from 'react';
import { View, Text, Image, StyleSheet, useSafeDimensions } from 'react-native';
import { useSafeDimensions } from '../src/utils/useSafeDimensions';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Tarot Card Display Component
 *
 * Displays tarot card with:
 * - Card image (from Midjourney)
 * - Roman numeral overlay at bottom
 * - Upside-down rotation if reversed
 * - Ornate border
 */
export default function TarotCard({ card, isReversed = false, size = 'large' }) {
  const dimensions = useSafeDimensions();
  // Explicit check for Hermes compatibility - avoid optional chaining on potentially undefined object
  const screenWidth = (dimensions && typeof dimensions.width === 'number') ? dimensions.width : 375;

  // Card dimensions (2:3 aspect ratio) - calculated conditionally for Hermes compatibility
  let cardWidth, cardHeight;
  if (size === 'small') {
    cardWidth = 120;
    cardHeight = 180;
  } else if (size === 'medium') {
    cardWidth = 200;
    cardHeight = 300;
  } else {
    // Default to large
    cardWidth = screenWidth * 0.6;
    cardHeight = screenWidth * 0.9;
  }

  // Convert card ID to Roman numeral
  const toRoman = (num) => {
    if (num === 0) return '0'; // The Fool
    const romanNumerals = [
      '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
      'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'
    ];
    return romanNumerals[num] || '';
  };

  // Get card image (placeholder for now - will use Midjourney images)
  const getCardImage = () => {
    // TODO: Map card.id to actual Midjourney generated images
    // For now, use placeholder
    if (card.arcana === 'Major') {
      return require('../assets/art/ui/aphoticshaman_tarot_card_back_design_intricate_mystical_patte_d043370c-c951-4959-a91c-582cf7567b50_0.png');
    }
    return require('../assets/art/ui/aphoticshaman_tarot_card_back_design_intricate_mystical_patte_d043370c-c951-4959-a91c-582cf7567b50_0.png');
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: cardWidth,
          height: cardHeight,
          transform: [{ rotate: isReversed ? '180deg' : '0deg' }],
        },
      ]}
    >
      {/* Outer glow */}
      <View style={[styles.glow, { width: cardWidth + 20, height: cardHeight + 20 }]} />

      {/* Card frame */}
      <LinearGradient
        colors={['#8a2be2', '#6a1bb2', '#4a0b92']}
        style={[styles.frame, { width: cardWidth, height: cardHeight }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Inner border */}
        <View style={styles.innerBorder}>
          {/* Card image */}
          <Image
            source={getCardImage()}
            style={styles.cardImage}
            resizeMode="cover"
          />

          {/* Text overlays at bottom (over designed blank space in art) */}
          <View style={styles.textOverlayContainer}>
            {/* Card name */}
            <Text style={styles.cardName} numberOfLines={1}>
              {card.name.toUpperCase()}
            </Text>

            {/* Roman numeral (Major Arcana only) */}
            {card.arcana === 'Major' && (
              <Text style={styles.romanNumeral}>
                {toRoman(card.id)}
              </Text>
            )}
          </View>

          {/* Reversed indicator */}
          {isReversed && (
            <View style={styles.reversedBadge}>
              <Text style={styles.reversedText}>REVERSED</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Corner ornaments */}
      <View style={[styles.cornerOrnament, styles.topLeft]} />
      <View style={[styles.cornerOrnament, styles.topRight]} />
      <View style={[styles.cornerOrnament, styles.bottomLeft]} />
      <View style={[styles.cornerOrnament, styles.bottomRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#8a2be2',
    opacity: 0.3,
    borderRadius: 15,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  frame: {
    borderRadius: 10,
    padding: 3,
  },
  innerBorder: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00ffff',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  textOverlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // This overlays on the solid dark banner that Midjourney creates
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 2,
    marginBottom: 4,
  },
  romanNumeral: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: '#8a2be2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 4,
  },
  reversedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#00ffff',
  },
  reversedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cornerOrnament: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: '#00ffff',
    borderWidth: 2,
  },
  topLeft: {
    top: 5,
    left: 5,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 5,
    right: 5,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 5,
    left: 5,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 5,
    right: 5,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});
