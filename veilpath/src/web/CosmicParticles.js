/**
 * COSMIC PARTICLES BACKGROUND
 * Floating particle effect for epic atmosphere
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export function CosmicParticles({ count = 30 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10000 + 10000,
      delay: Math.random() * 5000,
      anim: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Animate all particles
    particles.forEach((particle) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(particle.delay),
          Animated.timing(particle.anim, {
            toValue: 1,
            duration: particle.duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => {
        const translateY = particle.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [height, -100],
        });

        const translateX = particle.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, particle.x > width / 2 ? 50 : -50, 0],
        });

        const opacity = particle.anim.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                width: particle.size,
                height: particle.size,
                opacity,
                transform: [{ translateY }, { translateX }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      web: {
        position: 'fixed', // Fixed position for web to stay visible across all screens
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        zIndex: 0, // Above screen backgrounds but below content
        overflow: 'hidden',
        pointerEvents: 'none', // Don't block clicks
      },
      default: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: -1,
        overflow: 'hidden',
      },
    }),
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#00FFFF',
    borderRadius: 50,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px #00FFFF',
      },
    }),
  },
});

export default CosmicParticles;
