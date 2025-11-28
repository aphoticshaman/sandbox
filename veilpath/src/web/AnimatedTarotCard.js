/**
 * ANIMATED TAROT CARD - Web Component
 * Flip animations with 3D transforms and particle effects
 * Uses existing card_art assets (no video support currently)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Pressable, Platform, Image } from 'react-native';

// Card back asset
const CARD_BACK = require('../../assets/art/cardback/card_back.png');

// Static card images from card_art/common (78 cards)
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

// Get card image
function getCardImage(cardName) {
  const normalizedName = cardName?.toLowerCase()?.trim();
  return CARD_IMAGES[normalizedName] || CARD_BACK;
}

export function AnimatedTarotCard({
  cardName,
  revealed = false,
  onPress,
  size = 'medium',
  enableParticles = true,
  enable3D = true,
  style,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const flipAnim = useRef(new Animated.Value(revealed ? 180 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0))
  ).current;

  const sizeMap = {
    small: { width: 150, height: 250 },
    medium: { width: 240, height: 400 },
    large: { width: 300, height: 500 },
  };

  const dimensions = sizeMap[size];

  useEffect(() => {
    if (revealed) {
      // Epic reveal animation sequence
      Animated.sequence([
        // Flip card
        Animated.spring(flipAnim, {
          toValue: 180,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        // Glow pulse
        Animated.parallel([
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(glowAnim, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ])
          ),
          // Particle burst
          Animated.stagger(
            50,
            particleAnims.map((anim) =>
              Animated.timing(anim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              })
            )
          ),
        ]),
      ]).start();
    }
  }, [revealed]);

  useEffect(() => {
    if (isHovered && enable3D) {
      // 3D hover effect
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isHovered]);

  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const backRotation = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const rotateY = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '8deg'],
  });

  const rotateX = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-8deg'],
  });

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.cardWrapper,
          dimensions,
          {
            transform: [
              { scale: scaleAnim },
              { perspective: 1000 },
              { rotateY },
              { rotateX },
            ],
          },
        ]}
      >
        {/* Particle effects */}
        {revealed && enableParticles && (
          <View style={styles.particles}>
            {particleAnims.map((anim, i) => {
              const translateY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -200 - Math.random() * 100],
              });
              const translateX = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, (Math.random() - 0.5) * 200],
              });
              const opacity = anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              });

              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.particle,
                    {
                      left: `${Math.random() * 100}%`,
                      opacity,
                      transform: [{ translateY }, { translateX }],
                    },
                  ]}
                />
              );
            })}
          </View>
        )}

        {/* Glow effect */}
        {revealed && (
          <Animated.View
            style={[
              styles.glow,
              dimensions,
              {
                opacity: glowOpacity,
                shadowColor: '#8A2BE2',
              },
            ]}
          />
        )}

        {/* Card back */}
        <Animated.View
          style={[
            styles.card,
            dimensions,
            {
              transform: [{ rotateY: backRotation }],
              backfaceVisibility: 'hidden',
            },
          ]}
        >
          <Image
            source={CARD_BACK}
            style={styles.cardImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Card front */}
        <Animated.View
          style={[
            styles.card,
            dimensions,
            {
              transform: [{ rotateY: frontRotation }],
              backfaceVisibility: 'hidden',
              position: 'absolute',
            },
          ]}
        >
          <View style={styles.cardFrame}>
            <Image
              source={getCardImage(cardName)}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'relative',
  },
  card: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardFrame: {
    width: '100%',
    height: '100%',
    padding: 8,
    backgroundColor: 'rgba(10, 10, 26, 0.9)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#8A2BE2',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  glow: {
    position: 'absolute',
    borderRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    zIndex: -1,
  },
  particles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 10,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FFFF',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});

export default AnimatedTarotCard;
