/**
 * CardShuffleAnimation - Animated card shuffle effect
 * Shows cards being shuffled before a reading begins
 */

import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { useSafeDimensions } from '../utils/useSafeDimensions';
import { ASSETS } from '../assets/CuratedAssets';

const NUM_CARDS = 7; // Number of cards to animate

export default function CardShuffleAnimation({ onComplete, duration = 2500 }) {
  const { width } = useSafeDimensions();
  const CARD_WIDTH = width * 0.35;
  const CARD_HEIGHT = CARD_WIDTH * 1.5;
  const cards = useRef(
    Array(NUM_CARDS)
      .fill(0)
      .map(() => ({
        translateX: useRef(new Animated.Value(0)).current,
        translateY: useRef(new Animated.Value(0)).current,
        rotate: useRef(new Animated.Value(0)).current,
        opacity: useRef(new Animated.Value(1)).current,
        scale: useRef(new Animated.Value(1)).current,
      }))
  ).current;

  useEffect(() => {
    startShuffle();
  }, []);

  function startShuffle() {
    const animations = cards.map((card, index) => {
      const delay = index * 80;

      return Animated.sequence([
        // Initial delay for staggered effect
        Animated.delay(delay),

        // Shuffle motion (move out and back in)
        Animated.parallel([
          // Move to the side and back
          Animated.sequence([
            Animated.timing(card.translateX, {
              toValue: (index % 2 === 0 ? 1 : -1) * 50,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(card.translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),

          // Move up and down
          Animated.sequence([
            Animated.timing(card.translateY, {
              toValue: -30,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(card.translateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),

          // Rotate
          Animated.sequence([
            Animated.timing(card.rotate, {
              toValue: (index % 2 === 0 ? 1 : -1) * 15,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(card.rotate, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),

          // Pulse scale
          Animated.sequence([
            Animated.timing(card.scale, {
              toValue: 1.05,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(card.scale, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    // Run all animations in parallel, then fade out
    Animated.parallel(animations).start(() => {
      // Fade out all cards
      Animated.parallel(
        cards.map(card =>
          Animated.timing(card.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          })
        )
      ).start(() => {
        if (onComplete) {
          onComplete();
        }
      });
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.cardStack, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
        {cards.map((card, index) => (
          <Animated.View
            key={index}
            style={[
              styles.card,
              {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                zIndex: NUM_CARDS - index,
                transform: [
                  { translateX: card.translateX },
                  { translateY: card.translateY },
                  { rotate: card.rotate.interpolate({
                    inputRange: [-360, 360],
                    outputRange: ['-360deg', '360deg']
                  })},
                  { scale: card.scale },
                ],
                opacity: card.opacity,
              },
            ]}
          >
            <Image
              source={ASSETS.cards.back.path}
              style={styles.cardImage}
              resizeMode="contain"
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStack: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    borderRadius: 8,
    shadowColor: '#9945FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});
