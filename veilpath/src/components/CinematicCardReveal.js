/**
 * Cinematic Card Reveal Transition
 *
 * Hollywood-style transition when viewing a card interpretation:
 * 1. Card shakes/wiggles (0.5s)
 * 2. Everything EXCEPT the card fades to black (1.5s)
 * 3. Card flip animation plays (1s)
 * 4. Card moves to its position on interpretation page (0.5s)
 * 5. Interpretation page fades in around the settled card (1s)
 *
 * Total: 4.5 seconds of pure cinema
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { TarotCard } from '../components';
import { COSMIC } from './VeilPathDesign';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation phases
const PHASE = {
  IDLE: 'idle',
  SHAKE: 'shake',
  FADE_OUT: 'fade_out',
  FLIP: 'flip',
  MOVE: 'move',
  FADE_IN: 'fade_in',
  COMPLETE: 'complete',
};

/**
 * Hook to control the cinematic reveal
 */
export function useCinematicReveal(navigation) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [cardData, setCardData] = useState(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardX = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(0)).current;

  const triggerReveal = useCallback((card, position, navParams) => {
    // Store card info
    setCardData({ card, navParams });
    setCardPosition(position);
    setIsActive(true);
    setPhase(PHASE.SHAKE);

    // Reset animations
    shakeAnim.setValue(0);
    overlayOpacity.setValue(0);
    flipAnim.setValue(0);
    cardScale.setValue(1);
    cardX.setValue(0);
    cardY.setValue(0);

    // Target position (center-top of screen for interpretation page)
    const targetX = SCREEN_WIDTH / 2 - position.width / 2 - position.x;
    const targetY = 100 - position.y;

    // PHASE 1: Shake (0.5s)
    const shakeSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 30, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 30, useNativeDriver: true }),
      ]),
      { iterations: 8 }
    );

    // PHASE 2: Fade to black (1.5s) - starts after shake
    const fadeToBlack = Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    });

    // PHASE 3: Flip animation (1s)
    const flipCard = Animated.spring(flipAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    });

    // PHASE 4: Move to position (0.5s)
    const moveToPosition = Animated.parallel([
      Animated.timing(cardX, {
        toValue: targetX,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cardY, {
        toValue: targetY,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1.1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    // Run the sequence
    shakeSequence.start(() => {
      setPhase(PHASE.FADE_OUT);
      shakeAnim.setValue(0);

      fadeToBlack.start(() => {
        setPhase(PHASE.FLIP);

        flipCard.start(() => {
          setPhase(PHASE.MOVE);

          moveToPosition.start(() => {
            // Navigate now - screen should start black
            navigation.navigate('CardInterpretation', {
              ...navParams,
              cinematicEntry: true,
            });

            // Clean up after navigation
            setTimeout(() => {
              setIsActive(false);
              setPhase(PHASE.IDLE);
              setCardData(null);
              overlayOpacity.setValue(0);
              flipAnim.setValue(0);
              cardScale.setValue(1);
              cardX.setValue(0);
              cardY.setValue(0);
            }, 100);
          });
        });
      });
    });
  }, [navigation, shakeAnim, overlayOpacity, flipAnim, cardScale, cardX, cardY]);

  return {
    isActive,
    phase,
    cardData,
    cardPosition,
    triggerReveal,
    animations: {
      shakeAnim,
      overlayOpacity,
      flipAnim,
      cardScale,
      cardX,
      cardY,
    },
  };
}

/**
 * Overlay component that renders during the cinematic transition
 */
export function CinematicOverlay({
  isActive,
  phase,
  cardData,
  cardPosition,
  animations,
}) {
  if (!isActive || !cardData) return null;

  const {
    shakeAnim,
    overlayOpacity,
    flipAnim,
    cardScale,
    cardX,
    cardY,
  } = animations;

  const { card, navParams } = cardData;

  // Shake interpolation
  const shakeTranslate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3px', '0px', '3px'],
  });

  const shakeRotate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-2deg', '0deg', '2deg'],
  });

  // Flip interpolation
  const flipRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backFlipRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  // Front face opacity (hide at midpoint)
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  // Back face opacity (show at midpoint)
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={styles.container} pointerEvents={isActive ? 'auto' : 'none'}>
      {/* Black overlay - doesn't cover the card due to mask */}
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayOpacity },
        ]}
      />

      {/* Animated Card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            left: cardPosition.x,
            top: cardPosition.y,
            width: cardPosition.width,
            height: cardPosition.height,
            transform: [
              { translateX: cardX },
              { translateY: cardY },
              { translateX: Platform.OS === 'web' ? shakeTranslate : 0 },
              { rotate: Platform.OS === 'web' ? shakeRotate : '0deg' },
              { scale: cardScale },
              { perspective: 1000 },
            ],
          },
        ]}
      >
        {/* Card Back (visible initially) */}
        <Animated.View
          style={[
            styles.cardFace,
            {
              opacity: frontOpacity,
              transform: [{ rotateY: flipRotateY }],
              backfaceVisibility: 'hidden',
            },
          ]}
        >
          <TarotCard
            card={card}
            isReversed={navParams?.isReversed}
            showBack={true}
            size="lg"
            interactive={false}
          />
        </Animated.View>

        {/* Card Front (revealed) */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardFaceBack,
            {
              opacity: backOpacity,
              transform: [{ rotateY: backFlipRotateY }],
              backfaceVisibility: 'hidden',
            },
          ]}
        >
          <TarotCard
            card={card}
            isReversed={navParams?.isReversed}
            showBack={false}
            size="lg"
            interactive={false}
          />
        </Animated.View>
      </Animated.View>

      {/* Ambient particles during transition */}
      {phase === PHASE.FLIP && (
        <View style={styles.particleContainer}>
          {Array.from({ length: 15 }).map((_, i) => (
            <CinematicParticle key={i} index={i} />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Individual particle for the cinematic effect
 */
function CinematicParticle({ index }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startX = Math.random() * SCREEN_WIDTH;
    const startY = SCREEN_HEIGHT / 2 + (Math.random() - 0.5) * 200;

    translateX.setValue(startX);
    translateY.setValue(startY);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateY, {
        toValue: startY - 200 - Math.random() * 100,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: startX + (Math.random() - 0.5) * 100,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const particles = ['✨', '💫', '⭐', '🌟'];
  const particle = particles[index % particles.length];

  return (
    <Animated.Text
      style={[
        styles.particle,
        {
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      {particle}
    </Animated.Text>
  );
}

/**
 * Context provider for cinematic reveal
 */
import { createContext, useContext } from 'react';

const CinematicRevealContext = createContext(null);

export function CinematicRevealProvider({ children, navigation }) {
  const reveal = useCinematicReveal(navigation);

  return (
    <CinematicRevealContext.Provider value={reveal}>
      {children}
      <CinematicOverlay
        isActive={reveal.isActive}
        phase={reveal.phase}
        cardData={reveal.cardData}
        cardPosition={reveal.cardPosition}
        animations={reveal.animations}
      />
    </CinematicRevealContext.Provider>
  );
}

export function useCinematicRevealContext() {
  const context = useContext(CinematicRevealContext);
  if (!context) {
    throw new Error('useCinematicRevealContext must be used within CinematicRevealProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  cardContainer: {
    position: 'absolute',
    zIndex: 10000,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardFaceBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
  },
});

export default {
  useCinematicReveal,
  CinematicOverlay,
  CinematicRevealProvider,
  useCinematicRevealContext,
};
