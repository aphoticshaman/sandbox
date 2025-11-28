import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
} from 'react-native';
import { useSafeDimensions } from '../src/utils/useSafeDimensions';
// import { LinearGradient } from 'expo-linear-gradient'; // TEMPORARILY DISABLED TO DEBUG
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASSETS } from '../src/assets/CuratedAssets';
// import AmbientEffects from '../src/components/AmbientEffects'; // TEMPORARILY DISABLED TO DEBUG

export default function LoadingScreenNew({ navigation }) {
  const { width, height } = useSafeDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [loadingDots, setLoadingDots] = useState('');

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Loading dots animation
    const dotInterval = setInterval(() => {
      setLoadingDots(prev => {
        if (prev === '') return '.';
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '';
      });
    }, 500);

    // Initialize app and navigate
    setTimeout(async () => {
      await initializeApp();
    }, 3000);

    return () => clearInterval(dotInterval);
  }, []);

  const initializeApp = async () => {
    try {
      // Check for existing profile
      const activeProfile = await AsyncStorage.getItem('@lunatiq_active_profile');

      // Navigate to main menu
      navigation.replace('MainMenu');
    } catch (error) {
      console.error('[Loading] Error:', error);
      // Navigate anyway
      navigation.replace('MainMenu');
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated particle background */}
      <ImageBackground
        source={ASSETS.backgrounds.cosmic_nebula.path}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Ambient effects - floating particles */}
        {/* <AmbientEffects intensity="high" /> */}

        {/* Dark gradient overlay */}
        {/* <LinearGradient
          colors={['rgba(10,10,15,0.8)', 'rgba(26,26,46,0.9)', 'rgba(10,10,15,1)']}
          style={StyleSheet.absoluteFill}
        /> */}

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Main logo with pulse */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.logoContainer}>
              {/* "LunatIQ" in huge mystical font */}
              <Text style={styles.logoText}>
                LunatIQ
              </Text>

              {/* Subtle glow effect */}
              <View style={styles.logoGlow} />
            </View>

            {/* "Tarot" subtitle */}
            <Text style={styles.subtitleText}>
              T A R O T
            </Text>
          </Animated.View>

          {/* Decorative divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerSymbol}>✦</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Mystical tagline */}
          <Text style={styles.tagline}>
            Journey into the Mystic
          </Text>

          {/* Loading indicator */}
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              Shuffling the deck{loadingDots}
            </Text>

            {/* Loading bar */}
            <View style={styles.loadingBar}>
              {/* <LinearGradient
                colors={['#8a2be2', '#00ffff', '#8a2be2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loadingBarFill}
              /> */}
              <View style={styles.loadingBarFill} />
            </View>
          </View>

          {/* Mystical symbols floating */}
          <View style={styles.symbolsContainer}>
            <Text style={styles.symbol}>☽</Text>
            <Text style={styles.symbol}>✦</Text>
            <Text style={styles.symbol}>☾</Text>
          </View>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: '#8a2be2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    letterSpacing: 4,
    // When you add custom fonts, use: fontFamily: 'Cinzel-Bold'
  },
  logoGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    backgroundColor: '#8a2be2',
    opacity: 0.2,
    borderRadius: 150,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  subtitleText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 12,
    marginBottom: 40,
    opacity: 0.9,
    // When you add custom fonts, use: fontFamily: 'Philosopher-Bold'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
    width: '60%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#8a2be2',
    opacity: 0.6,
  },
  dividerSymbol: {
    fontSize: 20,
    color: '#00ffff',
    marginHorizontal: 15,
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.7,
    fontStyle: 'italic',
    marginBottom: 60,
    letterSpacing: 1,
  },
  loadingContainer: {
    width: '80%',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.6,
    marginBottom: 15,
    letterSpacing: 1,
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#8a2be2', // Temporary replacement for LinearGradient
  },
  symbolsContainer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    gap: 40,
  },
  symbol: {
    fontSize: 24,
    color: '#00ffff',
    opacity: 0.4,
  },
});
