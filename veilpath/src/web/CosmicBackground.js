/**
 * COSMIC BACKGROUND - Reusable Mystical Effects
 * WitchTok x Victorian Gothic ambient effects
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';

const { height } = Dimensions.get('window');

// VeilPath Theme Colors
const THEME = {
  midnightVoid: '#0a0514',
  deepAmethyst: '#4a148c',
  moonGlow: '#e1bee7',
  crystalPink: '#f8bbd0',
  candleFlame: '#ffa726',
  shadowPurple: '#311b92',
};

export function CosmicBackground({
  showCrystals = true,
  showHerbs = true,
  showMoonPhases = true,
  showCandleGlow = true,
  crystalCount = 6,
  variant = 'default', // 'default', 'reading', 'journal', 'profile'
}) {
  const gradients = {
    default: `linear-gradient(135deg, ${THEME.deepAmethyst} 0%, ${THEME.midnightVoid} 50%, ${THEME.shadowPurple} 100%)`,
    reading: `radial-gradient(circle at 30% 30%, rgba(74, 20, 140, 0.4) 0%, ${THEME.midnightVoid} 70%)`,
    journal: `linear-gradient(180deg, ${THEME.midnightVoid} 0%, ${THEME.shadowPurple} 100%)`,
    profile: `radial-gradient(ellipse at 50% 0%, ${THEME.deepAmethyst} 0%, ${THEME.midnightVoid} 70%)`,
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <View
        style={[
          styles.gradientBackground,
          Platform.OS === 'web' && { background: gradients[variant] || gradients.default },
        ]}
      />

      {/* Floating Crystals */}
      {showCrystals && [...Array(crystalCount)].map((_, i) => (
        <Crystal key={`crystal-${i}`} delay={i * 3} left={`${10 + (i * (80 / crystalCount))}%`} />
      ))}

      {/* Candle Glow Effects */}
      {showCandleGlow && (
        <>
          <CandleGlow style={{ top: '10%', left: '5%' }} />
          <CandleGlow style={{ bottom: '20%', right: '10%' }} delay={1.5} />
          <CandleGlow style={{ top: '50%', right: '5%' }} delay={0.5} />
        </>
      )}

      {/* Floating Herbs */}
      {showHerbs && (
        <>
          <FloatingHerb emoji="🌿" delay={0} left="15%" />
          <FloatingHerb emoji="🌾" delay={4} left="45%" />
          <FloatingHerb emoji="🌱" delay={8} left="75%" />
          <FloatingHerb emoji="🍃" delay={12} left="30%" />
        </>
      )}

      {/* Moon Phases Header */}
      {showMoonPhases && (
        <View style={styles.moonPhases}>
          {['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'].map((moon, i) => (
            <MoonPhase key={i} emoji={moon} index={i} />
          ))}
        </View>
      )}
    </View>
  );
}

// Moon Phase with subtle animation
function MoonPhase({ emoji, index }) {
  const [opacity] = useState(new Animated.Value(0.4));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 3000,
          delay: index * 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text style={[styles.moonEmoji, { opacity }]}>
      {emoji}
    </Animated.Text>
  );
}

// Floating Crystal Component
function Crystal({ delay, left }) {
  const [animValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const startAnimation = () => {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }).start(() => startAnimation());
    };

    const timeout = setTimeout(startAnimation, delay * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height + 50, -100],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.8, 0.8, 0],
  });

  const rotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.crystal,
        {
          left,
          opacity,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    />
  );
}

// Candle Glow Component with flicker
function CandleGlow({ style, delay = 0 }) {
  const [flicker] = useState(new Animated.Value(1));

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flicker, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(flicker, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(flicker, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(flicker, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, []);

  const scale = flicker.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0.95, 1.1],
  });

  return (
    <Animated.View
      style={[
        styles.candleGlow,
        style,
        {
          opacity: flicker,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

// Floating Herb Component
function FloatingHerb({ emoji, delay, left }) {
  const [animValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const startAnimation = () => {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      }).start(() => startAnimation());
    };

    const timeout = setTimeout(startAnimation, delay * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height + 50, -100],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.6, 0.6, 0],
  });

  const rotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.herb,
        {
          left,
          opacity,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.midnightVoid,
  },
  crystal: {
    position: 'absolute',
    width: 4,
    height: 8,
    backgroundColor: THEME.crystalPink,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  herb: {
    position: 'absolute',
    fontSize: 20,
  },
  candleGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
  },
  moonPhases: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    zIndex: 5,
  },
  moonEmoji: {
    fontSize: 24,
  },
});

export default CosmicBackground;
