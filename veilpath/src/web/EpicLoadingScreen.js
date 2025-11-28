/**
 * EPIC LOADING SCREEN - AAA Quality
 * Cinematic loading experience with CSS-based styling
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export function EpicLoadingScreen({ progress = 0, message = 'Loading...' }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a0a2e', '#16213e', '#0a0a1a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Nebula overlay effect */}
      <View style={styles.nebulaOverlay} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={styles.logo}>VEILPATH</Text>
        </Animated.View>

        {/* Animated loader */}
        <View style={styles.loaderContainer}>
          <Animated.View
            style={[
              styles.loader,
              {
                transform: [{ rotate: rotation }],
              },
            ]}
          >
            <View style={styles.loaderRing} />
            <View style={[styles.loaderRing, styles.loaderRingInner]} />
          </Animated.View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        {/* Loading message */}
        <Text style={styles.message}>{message}</Text>

        {/* Decorative elements */}
        <View style={styles.decoration}>
          {[...Array(6)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.star,
                {
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 20}%`,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.3, 0.8],
                  }),
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  nebulaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    opacity: 0.7,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  logo: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: '#8B4513',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
    letterSpacing: 12,
    marginBottom: 60,
  },
  loaderContainer: {
    width: 200,
    height: 200,
    marginBottom: 40,
    position: 'relative',
  },
  loader: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: '#8A2BE2',
    borderStyle: 'solid',
    borderTopColor: '#00FFFF',
    borderRightColor: '#00FFFF',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  loaderRingInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderTopColor: '#FFD700',
    borderRightColor: '#FFD700',
    borderBottomColor: '#8A2BE2',
    borderLeftColor: '#8A2BE2',
  },
  progressContainer: {
    width: '80%',
    maxWidth: 600,
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#8A2BE2',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8A2BE2',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  progressText: {
    fontSize: 16,
    color: '#E6E6FA',
    fontWeight: '600',
  },
  message: {
    fontSize: 18,
    color: '#D8BFD8',
    textAlign: 'center',
    marginTop: 10,
  },
  decoration: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  star: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#00FFFF',
    borderRadius: 2,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
});

export default EpicLoadingScreen;
