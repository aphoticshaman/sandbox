/**
 * TarotCardFlip - 3D animated card flip with rarity visual effects
 * Shows card back (from curated assets), flips to reveal front with interpretation
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeDimensions } from '../utils/useSafeDimensions';
import * as Haptics from 'expo-haptics';
import TarotCard from './TarotCard';
import { ASSETS } from '../assets/CuratedAssets';
import { getCardRarity } from '../utils/CardRaritySystem';
import { COSMIC } from './VeilPathDesign';

/**
 * TarotCardFlip Component
 * @param {object} cardData - Card data { id, name, image, suit, arcana, upright/reversed }
 * @param {boolean} isReversed - Whether card is reversed
 * @param {function} onFlipComplete - Callback when flip animation finishes
 * @param {boolean} autoReveal - If true, auto-flips after mount (default: false)
 * @param {number} autoRevealDelay - Delay before auto-reveal (ms, default: 800)
 */
export default function TarotCardFlip({
  cardData,
  isReversed = false,
  onFlipComplete,
  autoReveal = false,
  autoRevealDelay = 800,
}) {
  const { width: SCREEN_WIDTH } = useSafeDimensions();
  const CARD_WIDTH = SCREEN_WIDTH * 0.7;
  const CARD_HEIGHT = CARD_WIDTH * 1.5;

  const [isFlipped, setIsFlipped] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [cardRarity, setCardRarity] = useState('common');

  const flipAnim = useRef(new Animated.Value(0)).current;
  const impactScale = useRef(new Animated.Value(1)).current;
  const interpretationFade = useRef(new Animated.Value(0)).current;

  // Load card rarity on mount
  useEffect(() => {
    const loadRarity = async () => {
      const rarity = await getCardRarity(`card_${cardData.id}`);
      setCardRarity(rarity);
    };
    loadRarity();
  }, [cardData.id]);

  // Auto-reveal if specified
  useEffect(() => {
    if (autoReveal) {
      setTimeout(handleFlip, autoRevealDelay);
    }
  }, [autoReveal, autoRevealDelay]);

  const handleFlip = () => {
    if (isFlipped) return; // Already flipped

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsFlipped(true);

    // 3D flip animation (1.2 seconds with spring)
    Animated.spring(flipAnim, {
      toValue: 1,
      tension: 12,
      friction: 7,
      useNativeDriver: true,
    }).start(() => {
      // Flip complete - impact effect
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.sequence([
        Animated.timing(impactScale, {
          toValue: 1.05,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(impactScale, {
          toValue: 1,
          tension: 30,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Show interpretation after brief pause
      setTimeout(() => {
        setShowInterpretation(true);
        Animated.timing(interpretationFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          if (onFlipComplete) {
            onFlipComplete();
          }
        });
      }, 300);
    });
  };

  // Interpolate rotation (3D flip)
  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  // Get card meaning based on upright/reversed
  const meaning = isReversed ? cardData.reversed : cardData.upright;

  return (
    <View style={styles.container}>
      {/* Tap hint (before flip) */}
      {!isFlipped && (
        <Animated.View style={styles.tapHint}>
          <Text style={styles.tapText}>[ TAP TO REVEAL ]</Text>
        </Animated.View>
      )}

      <Animated.View style={{ transform: [{ scale: impactScale }] }}>
        <TouchableOpacity
          onPress={handleFlip}
          activeOpacity={1}
          disabled={isFlipped}
          style={styles.cardContainer}
        >
          {/* Card Back (face-down) */}
          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              {
                transform: [{ rotateY: frontRotation }],
                opacity: frontOpacity,
              },
            ]}
          >
            <TarotCard
              cardId={`card_${cardData.id}`}
              cardData={{
                name: 'Card Back',
                image: ASSETS.cards.back.path,
                suit: null,
                arcana: null,
              }}
              rarity={cardRarity}
              size="large"
            />
          </Animated.View>

          {/* Card Front (face-up with interpretation) */}
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              {
                transform: [
                  { rotateY: backRotation },
                  ...(isReversed ? [{ rotate: '180deg' }] : []),
                ],
                opacity: backOpacity,
              },
            ]}
          >
            <TarotCard
              cardId={`card_${cardData.id}`}
              cardData={{
                name: cardData.name,
                image: cardData.image,
                suit: cardData.suit,
                arcana: cardData.arcana,
              }}
              rarity={cardRarity}
              size="large"
            />

            {/* Interpretation overlay (fades in after flip) */}
            {showInterpretation && (
              <Animated.View
                style={[
                  styles.interpretationOverlay,
                  {
                    opacity: interpretationFade,
                  },
                ]}
              >
                <View style={styles.interpretationContainer}>
                  {/* Card name */}
                  <Text style={styles.cardName}>{cardData.name}</Text>

                  {/* Reversed indicator */}
                  {isReversed && (
                    <View style={styles.reversedBadge}>
                      <Text style={styles.reversedText}>REVERSED</Text>
                    </View>
                  )}

                  {/* Meaning */}
                  <Text style={styles.meaningText}>{meaning?.meaning}</Text>

                  {/* Message */}
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>"{meaning?.message}"</Text>
                  </View>

                  {/* Keywords */}
                  <View style={styles.keywordsContainer}>
                    {cardData.keywords?.map((keyword, index) => (
                      <View key={index} style={styles.keywordBadge}>
                        <Text style={styles.keywordText}>{keyword}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  tapHint: {
    marginBottom: 15,
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#9945FF',
  },
  tapText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00F0FF',
    letterSpacing: 2,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardContainer: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    // Card back styling handled by TarotCard component
  },
  cardFront: {
    // Card front styling handled by TarotCard component
  },
  interpretationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  interpretationContainer: {
    alignItems: 'center',
  },
  cardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COSMIC.candleFlame,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: COSMIC.deepAmethyst,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  reversedBadge: {
    backgroundColor: 'rgba(220, 20, 60, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  reversedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  meaningText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  messageContainer: {
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#9945FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 13,
    color: '#00F0FF',
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  keywordBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  keywordText: {
    fontSize: 11,
    color: '#00F0FF',
    fontWeight: '600',
  },
});
