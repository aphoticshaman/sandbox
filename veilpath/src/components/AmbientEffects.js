/**
 * AmbientEffects - Floating particles and atmospheric effects
 * Creates immersive dark fantasy ambience with CSS-based animated particles
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useSafeDimensions } from '../utils/useSafeDimensions';

/**
 * Single floating particle with random motion (CSS-based, no image assets)
 */
function FloatingParticle({ delay = 0, speed = 'normal' }) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useSafeDimensions();
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  // Random starting position
  const startX = Math.random() * SCREEN_WIDTH;
  const startY = Math.random() * SCREEN_HEIGHT;

  // Random particle properties
  const driftDistance = 50 + Math.random() * 100;
  const speedMultiplier = speed === 'fast' ? 0.7 : speed === 'slow' ? 1.5 : 1;
  const duration = (8000 + Math.random() * 4000) * speedMultiplier;

  // Random particle color
  const particleColors = ['#9945FF', '#00F0FF', '#FFD700', '#FF69B4'];
  const color = particleColors[Math.floor(Math.random() * particleColors.length)];
  const size = 4 + Math.random() * 8;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 0.6 + Math.random() * 0.3,
      duration: 1000,
      delay,
      useNativeDriver: true,
    }).start();

    // Floating animation (up and sideways drift)
    Animated.loop(
      Animated.parallel([
        // Gentle upward float
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -driftDistance,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
        // Horizontal drift
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: driftDistance * 0.5,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        // Gentle pulse
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: duration * 0.6,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
      ]}
    />
  );
}

/**
 * Full ambient effects overlay
 */
export default function AmbientEffects({ intensity = 'medium', style }) {
  // Determine number of particles based on intensity
  const particleCount =
    intensity === 'low' ? 5 :
    intensity === 'medium' ? 10 :
    intensity === 'high' ? 20 : 10;

  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(
      <FloatingParticle
        key={`particle-${i}`}
        delay={i * 200}
        speed={intensity === 'high' ? 'fast' : intensity === 'low' ? 'slow' : 'normal'}
      />
    );
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {particles}
    </View>
  );
}

/**
 * Holographic aura overlay for special moments (level up, achievements)
 * CSS-based - no image assets needed
 */
export function HoloAuraOverlay({ visible = true, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in and expand
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Gentle rotation
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        style,
        {
          opacity,
          transform: [
            { scale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {/* CSS-based aura effect */}
      <View style={styles.auraInner} />
      <View style={styles.auraOuter} />
    </Animated.View>
  );
}

/**
 * Light beams shooting across screen
 */
export function LightBeams({ color = '#9945FF', count = 3, style }) {
  const { width, height } = useSafeDimensions();
  const beams = [];

  for (let i = 0; i < count; i++) {
    beams.push(<AnimatedBeam key={`beam-${i}`} color={color} delay={i * 1000} screenWidth={width} screenHeight={height} />);
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {beams}
    </View>
  );
}

function AnimatedBeam({ color, delay, screenWidth, screenHeight }) {
  const translateX = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Random vertical position
  const top = Math.random() * screenHeight;

  useEffect(() => {
    const animate = () => {
      translateX.setValue(-200);
      opacity.setValue(0);

      Animated.sequence([
        // Fade in
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 300,
          useNativeDriver: true,
        }),
        // Shoot across screen
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: screenWidth + 200,
            duration: 2000,
            useNativeDriver: true,
          }),
          // Fade out at the end
          Animated.sequence([
            Animated.delay(1500),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Wait before next beam
        Animated.delay(3000 + Math.random() * 2000),
      ]).start(() => animate());
    };

    setTimeout(animate, delay);
  }, []);

  return (
    <Animated.View
      style={[
        styles.beam,
        {
          top,
          opacity,
          backgroundColor: color,
          transform: [{ translateX }],
        },
      ]}
    />
  );
}

/**
 * Preset ambient effects for different screens
 */
export function MainMenuAmbience() {
  return (
    <>
      <AmbientEffects intensity="medium" />
      <LightBeams color="rgba(153, 69, 255, 0.3)" count={2} />
    </>
  );
}

export function CardReadingAmbience() {
  return (
    <>
      <AmbientEffects intensity="high" />
      <LightBeams color="rgba(0, 240, 255, 0.3)" count={3} />
    </>
  );
}

export function LevelUpAmbience() {
  return (
    <>
      <HoloAuraOverlay visible={true} />
      <AmbientEffects intensity="high" />
      <LightBeams color="rgba(255, 215, 0, 0.5)" count={5} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraInner: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 1000,
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(153, 69, 255, 0.3)',
  },
  auraOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  beam: {
    position: 'absolute',
    width: 150,
    height: 2,
    shadowColor: '#9945FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
});
