/**
 * MIDJOURNEY TAROT CARD COMPONENT
 * AAA-Quality tarot cards with animations for web
 * Uses card_art/common assets
 */

import React, { useState, useEffect } from 'react';
import { View, Image, Animated, StyleSheet, TouchableOpacity } from 'react-native';

// Static require map for Metro bundler - card_art/common assets
const CARD_IMAGES = {
  // Major Arcana
  'the fool': require('../../assets/art/card_art/common/fool.png'),
  'the magician': require('../../assets/art/card_art/common/magician.png'),
  'the high priestess': require('../../assets/art/card_art/common/highpriestess.png'),
  'the empress': require('../../assets/art/card_art/common/empress.png'),
  'the emperor': require('../../assets/art/card_art/common/emperor.png'),
  'the hierophant': require('../../assets/art/card_art/common/hierophant.png'),
  'the lovers': require('../../assets/art/card_art/common/lovers.png'),
  'the chariot': require('../../assets/art/card_art/common/chariot.png'),
  'strength': require('../../assets/art/card_art/common/strength.png'),
  'the hermit': require('../../assets/art/card_art/common/hermit.png'),
  'wheel of fortune': require('../../assets/art/card_art/common/wheeloffortune.png'),
  'justice': require('../../assets/art/card_art/common/justice.png'),
  'the hanged man': require('../../assets/art/card_art/common/hangedman.png'),
  'death': require('../../assets/art/card_art/common/death.png'),
  'temperance': require('../../assets/art/card_art/common/temperance.png'),
  'the devil': require('../../assets/art/card_art/common/devil.png'),
  'the tower': require('../../assets/art/card_art/common/tower.png'),
  'the star': require('../../assets/art/card_art/common/star.png'),
  'the moon': require('../../assets/art/card_art/common/moon.png'),
  'the sun': require('../../assets/art/card_art/common/sun.png'),
  'judgement': require('../../assets/art/card_art/common/judgment.png'),
  'the world': require('../../assets/art/card_art/common/world.png'),
  // Wands
  'ace of wands': require('../../assets/art/card_art/common/acewands.png'),
  'two of wands': require('../../assets/art/card_art/common/twowands.png'),
  'three of wands': require('../../assets/art/card_art/common/threewands.png'),
  'four of wands': require('../../assets/art/card_art/common/fourwands.png'),
  'five of wands': require('../../assets/art/card_art/common/fivewands.png'),
  'six of wands': require('../../assets/art/card_art/common/sixwands.png'),
  'seven of wands': require('../../assets/art/card_art/common/sevenwands.png'),
  'eight of wands': require('../../assets/art/card_art/common/eightwands.png'),
  'nine of wands': require('../../assets/art/card_art/common/ninewands.png'),
  'ten of wands': require('../../assets/art/card_art/common/tenwands.png'),
  'page of wands': require('../../assets/art/card_art/common/pagewands.png'),
  'knight of wands': require('../../assets/art/card_art/common/knightwands.png'),
  'queen of wands': require('../../assets/art/card_art/common/queenwands.png'),
  'king of wands': require('../../assets/art/card_art/common/kingwands.png'),
  // Cups
  'ace of cups': require('../../assets/art/card_art/common/acecups.png'),
  'two of cups': require('../../assets/art/card_art/common/twocups.png'),
  'three of cups': require('../../assets/art/card_art/common/threecups.png'),
  'four of cups': require('../../assets/art/card_art/common/fourcups.png'),
  'five of cups': require('../../assets/art/card_art/common/fivecups.png'),
  'six of cups': require('../../assets/art/card_art/common/sixcups.png'),
  'seven of cups': require('../../assets/art/card_art/common/sevencups.png'),
  'eight of cups': require('../../assets/art/card_art/common/eightcups.png'),
  'nine of cups': require('../../assets/art/card_art/common/ninecups.png'),
  'ten of cups': require('../../assets/art/card_art/common/tencups.png'),
  'page of cups': require('../../assets/art/card_art/common/pagecups.png'),
  'knight of cups': require('../../assets/art/card_art/common/knightcups.png'),
  'queen of cups': require('../../assets/art/card_art/common/queencups.png'),
  'king of cups': require('../../assets/art/card_art/common/kingcups.png'),
  // Swords
  'ace of swords': require('../../assets/art/card_art/common/aceswords.png'),
  'two of swords': require('../../assets/art/card_art/common/twoswords.png'),
  'three of swords': require('../../assets/art/card_art/common/threeswords.png'),
  'four of swords': require('../../assets/art/card_art/common/fourswords.png'),
  'five of swords': require('../../assets/art/card_art/common/fiveswords.png'),
  'six of swords': require('../../assets/art/card_art/common/sixswords.png'),
  'seven of swords': require('../../assets/art/card_art/common/sevenswords.png'),
  'eight of swords': require('../../assets/art/card_art/common/eightswords.png'),
  'nine of swords': require('../../assets/art/card_art/common/nineswords.png'),
  'ten of swords': require('../../assets/art/card_art/common/tenswords.png'),
  'page of swords': require('../../assets/art/card_art/common/pageswords.png'),
  'knight of swords': require('../../assets/art/card_art/common/knightswords.png'),
  'queen of swords': require('../../assets/art/card_art/common/queenswords.png'),
  'king of swords': require('../../assets/art/card_art/common/kingswords.png'),
  // Pentacles
  'ace of pentacles': require('../../assets/art/card_art/common/acepentacles.png'),
  'two of pentacles': require('../../assets/art/card_art/common/twopentacles.png'),
  'three of pentacles': require('../../assets/art/card_art/common/threepentacles.png'),
  'four of pentacles': require('../../assets/art/card_art/common/fourpentacles.png'),
  'five of pentacles': require('../../assets/art/card_art/common/fivepentacles.png'),
  'six of pentacles': require('../../assets/art/card_art/common/sixpentacles.png'),
  'seven of pentacles': require('../../assets/art/card_art/common/sevenpentacles.png'),
  'eight of pentacles': require('../../assets/art/card_art/common/eightpentacles.png'),
  'nine of pentacles': require('../../assets/art/card_art/common/ninepentacles.png'),
  'ten of pentacles': require('../../assets/art/card_art/common/tenpentacles.png'),
  'page of pentacles': require('../../assets/art/card_art/common/pagepentacles.png'),
  'knight of pentacles': require('../../assets/art/card_art/common/knightpentacles.png'),
  'queen of pentacles': require('../../assets/art/card_art/common/queenpentacles.png'),
  'king of pentacles': require('../../assets/art/card_art/common/kingpentacles.png'),
};

const CARD_BACK = require('../../assets/art/cardback/card_back.png');

export function MidjourneyTarotCard({
  cardName,
  onPress,
  revealed = false,
  animated = true,
  size = 'medium',
  style,
}) {
  const [flipAnim] = useState(new Animated.Value(revealed ? 180 : 0));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (revealed) {
      // Flip animation
      Animated.timing(flipAnim, {
        toValue: 180,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [revealed]);

  const sizeStyles = {
    small: { width: 150, height: 250 },
    medium: { width: 200, height: 333 },
    large: { width: 300, height: 500 },
  };

  const dimensions = sizeStyles[size];

  // Get card image from map
  const getCardImage = (name) => {
    const normalizedName = name?.toLowerCase()?.trim();
    return CARD_IMAGES[normalizedName] || CARD_BACK;
  };

  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.container, style]}>
      <View style={[styles.cardContainer, dimensions]}>
        {/* Glow effect */}
        {revealed && (
          <Animated.View
            style={[
              styles.glow,
              dimensions,
              {
                opacity: glowOpacity,
              },
            ]}
          />
        )}

        {/* Card back */}
        <Animated.View
          style={[
            styles.cardFace,
            dimensions,
            {
              transform: [{ rotateY: frontRotation }],
              backfaceVisibility: 'hidden',
            },
          ]}
        >
          <Image source={CARD_BACK} style={[styles.cardImage, dimensions]} resizeMode="cover" />
        </Animated.View>

        {/* Card front */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardFront,
            dimensions,
            {
              transform: [{ rotateY: backRotation }],
              backfaceVisibility: 'hidden',
            },
          ]}
        >
          <Image
            source={getCardImage(cardName)}
            style={[styles.cardImage, dimensions]}
            resizeMode="cover"
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardFront: {
    // Front is on top when revealed
  },
  cardImage: {
    borderRadius: 12,
  },
  glow: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: 'transparent',
    shadowColor: '#9b59b6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 0,
  },
});

export default MidjourneyTarotCard;
