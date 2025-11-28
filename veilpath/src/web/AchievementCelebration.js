/**
 * ACHIEVEMENT CELEBRATION - AAA Quality
 * Epic achievement unlocks with Midjourney animated assets
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import soundManager from './SoundManager';

export function AchievementCelebration({
  title,
  description,
  icon,
  visible = false,
  onComplete,
  duration = 4000,
}) {
  const [slideAnim] = useState(new Animated.Value(-200));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Play achievement sound
      soundManager.play('achievement');

      // Animation sequence
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 20,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Achievement card */}
      <View style={styles.card}>
        {/* Animated sparkle decoration (CSS-based) */}
        {Platform.OS === 'web' && (
          <View style={styles.animationContainer}>
            <Text style={styles.sparkleEmoji}>✨</Text>
          </View>
        )}

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon || '🏆'}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.label}>ACHIEVEMENT UNLOCKED</Text>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>

        {/* Border decoration */}
        <View style={styles.borderTop} />
        <View style={styles.borderBottom} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    top: 0,
    right: 20,
    zIndex: 9999,
    minWidth: 350,
    maxWidth: 450,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    borderRadius: 12,
    zIndex: -1,
  },
  card: {
    backgroundColor: 'rgba(26, 10, 46, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    position: 'relative',
    overflow: 'visible',
  },
  animationContainer: {
    position: 'absolute',
    width: '100%',
    height: 60,
    top: -30,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  sparkleEmoji: {
    fontSize: 48,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    gap: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 5,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  description: {
    fontSize: 13,
    color: '#D8BFD8',
    lineHeight: 18,
  },
  borderTop: {
    position: 'absolute',
    top: -2,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#8A2BE2',
  },
  borderBottom: {
    position: 'absolute',
    bottom: -2,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#8A2BE2',
  },
});

export default AchievementCelebration;
