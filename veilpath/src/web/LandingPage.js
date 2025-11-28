/**
 * LANDING PAGE - VeilPath WitchTok x Victorian Gothic
 * AAA-Quality Premium Design with Mystical Elegance
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// VeilPath Theme Colors
const THEME = {
  midnightVoid: '#0a0514',
  deepAmethyst: '#4a148c',
  moonGlow: '#e1bee7',
  crystalPink: '#f8bbd0',
  sageGreen: '#87a96b',
  candleFlame: '#ffa726',
  bloodMoon: '#8b0000',
  starlight: '#fff9c4',
  shadowPurple: '#311b92',
  brassVictorian: '#b8860b',
};

export function LandingPage({ onEnter }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [symbolRotation] = useState(new Animated.Value(0));
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({ online: 0, activeToday: 0, total: 0 });

  // Fetch real stats on mount (only renders when page loads = efficient)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        // Silent fail - just don't show stats
        console.log('[LandingPage] Stats fetch failed:', error.message);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Pulse animation for CTA
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
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

    // Symbol rotation
    Animated.loop(
      Animated.timing(symbolRotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleMouseMove = (e) => {
    if (Platform.OS === 'web') {
      const x = (e.nativeEvent.clientX / width - 0.5) * 15;
      const y = (e.nativeEvent.clientY / height - 0.5) * 15;
      setMousePosition({ x, y });
    }
  };

  const spin = symbolRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container} onMouseMove={handleMouseMove}>
      {/* Cosmic Background */}
      <View style={styles.cosmicBackground}>
        {/* Floating Crystals */}
        {[...Array(8)].map((_, i) => (
          <Crystal key={i} delay={i * 2.5} left={`${10 + i * 12}%`} />
        ))}

        {/* Candle Glow Effects */}
        <View style={[styles.candleGlow, { top: '10%', left: '5%' }]} />
        <View style={[styles.candleGlow, { bottom: '20%', right: '10%' }]} />
        <View style={[styles.candleGlow, { top: '40%', right: '5%' }]} />

        {/* Floating Herbs */}
        <FloatingHerb emoji="🌿" delay={0} left="15%" />
        <FloatingHerb emoji="🌾" delay={4} left="45%" />
        <FloatingHerb emoji="🌱" delay={8} left="75%" />
        <FloatingHerb emoji="🍃" delay={12} left="30%" />
      </View>

      {/* Moon Phases Header */}
      <View style={styles.moonPhases}>
        {['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'].map((moon, i) => (
          <Text key={i} style={styles.moonEmoji}>{moon}</Text>
        ))}
      </View>

      {/* Main Content with Parallax */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: Platform.OS === 'web' ? [
              { translateX: mousePosition.x },
              { translateY: mousePosition.y },
            ] : [],
          }
        ]}
      >
        {/* Victorian Gothic Card Frame */}
        <View style={styles.loginCard}>
          {/* Ornate Corners */}
          <View style={[styles.cornerOrnament, styles.topLeft]} />
          <View style={[styles.cornerOrnament, styles.topRight]} />
          <View style={[styles.cornerOrnament, styles.bottomLeft]} />
          <View style={[styles.cornerOrnament, styles.bottomRight]} />

          {/* Active Today Badge - only show if there are real users */}
          {stats.activeToday > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>✨ {stats.activeToday.toLocaleString()} ACTIVE TODAY</Text>
            </View>
          )}

          {/* Logo Section */}
          <View style={styles.logoSection}>
            {/* Rotating Mystical Symbol */}
            <Animated.View style={[styles.mysticalSymbol, { transform: [{ rotate: spin }] }]}>
              <MysticalSymbolSVG />
            </Animated.View>

            <Text style={styles.logo}>VEILPATH</Text>
            <Text style={styles.tagline}>Your Mystical Wellness Grimoire</Text>
          </View>

          {/* Hero Description */}
          <View style={styles.heroText}>
            <Text style={styles.description}>
              Harness the power of Cognitive Behavioral Therapy{'\n'}
              guided by the ancient wisdom of Tarot
            </Text>
          </View>

          {/* CTA Button - Premium Polish */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity onPress={onEnter} activeOpacity={0.9} style={styles.ctaButton}>
              <View style={styles.buttonShine} />
              <Text style={styles.ctaText}>BEGIN YOUR JOURNEY</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Social Proof */}
          <View style={styles.socialProof}>
            {/* Only show online count if there are real users online */}
            {stats.online > 0 && (
              <View style={styles.activeWitches}>
                <Text style={styles.activeCount}>
                  {stats.online.toLocaleString()} {stats.online === 1 ? 'witch' : 'witches'} online
                </Text>
                <View style={styles.witchAvatars}>
                  {['🌙', '⭐', '🔮', '✨', '+'].map((emoji, i) => (
                    <View key={i} style={[styles.witchAvatar, { marginLeft: i > 0 ? -10 : 0 }]}>
                      <Text style={styles.avatarEmoji}>{emoji}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Features */}
            <View style={styles.features}>
              <FeaturePill icon="📜" text="78 Tarot Cards" />
              <FeaturePill icon="🌙" text="Moon Tracking" />
              <FeaturePill icon="📝" text="Journal Streaks" />
              <FeaturePill icon="🏆" text="Coven Battles" />
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
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

// Feature Pill Component
function FeaturePill({ icon, text }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

// Mystical Symbol SVG Component
function MysticalSymbolSVG() {
  if (Platform.OS === 'web') {
    return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="symbolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={THEME.moonGlow} stopOpacity="1" />
            <stop offset="50%" stopColor={THEME.candleFlame} stopOpacity="1" />
            <stop offset="100%" stopColor={THEME.moonGlow} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" stroke="url(#symbolGrad)" strokeWidth="1" fill="none"/>
        <path d="M50,10 L61,40 L90,40 L65,60 L76,90 L50,70 L24,90 L35,60 L10,40 L39,40 Z"
              stroke="url(#symbolGrad)" strokeWidth="2" fill="none"/>
        <circle cx="50" cy="50" r="15" stroke="url(#symbolGrad)" strokeWidth="1" fill="none"/>
      </svg>
    );
  }
  // Fallback for non-web platforms
  return (
    <View style={styles.symbolFallback}>
      <Text style={styles.symbolText}>⭐</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: THEME.midnightVoid,
    position: 'relative',
    overflow: 'hidden',
  },
  cosmicBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    // Gradient applied via Platform-specific code
    ...(Platform.OS === 'web' ? {
      background: `linear-gradient(135deg, ${THEME.deepAmethyst} 0%, ${THEME.midnightVoid} 50%, ${THEME.shadowPurple} 100%)`,
    } : {
      backgroundColor: THEME.midnightVoid,
    }),
  },
  crystal: {
    position: 'absolute',
    width: 4,
    height: 8,
    backgroundColor: THEME.crystalPink,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
    opacity: 0.6,
  },
  moonEmoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 10,
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px) saturate(1.5)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
    } : {}),
    borderWidth: 2,
    borderColor: THEME.brassVictorian,
    borderRadius: 20,
    padding: 40,
    position: 'relative',
    shadowColor: THEME.deepAmethyst,
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 20,
  },
  cornerOrnament: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: THEME.brassVictorian,
    opacity: 0.6,
  },
  topLeft: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  streakBadge: {
    position: 'absolute',
    top: -15,
    right: -15,
    backgroundColor: THEME.candleFlame,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: THEME.bloodMoon,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  streakText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mysticalSymbol: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  symbolFallback: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 50,
    color: THEME.candleFlame,
  },
  logo: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 4,
    color: THEME.moonGlow,
    marginBottom: 5,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    textShadowColor: 'rgba(225, 190, 231, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  tagline: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 3,
    opacity: 0.7,
    color: THEME.crystalPink,
  },
  heroText: {
    marginBottom: 30,
  },
  description: {
    fontSize: 14,
    color: THEME.moonGlow,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: THEME.candleFlame,
    borderRadius: 10,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: THEME.candleFlame,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    marginBottom: 25,
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  ctaText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  socialProof: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(225, 190, 231, 0.1)',
    paddingTop: 25,
  },
  activeWitches: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  activeCount: {
    fontSize: 12,
    opacity: 0.8,
    color: THEME.crystalPink,
  },
  witchAvatars: {
    flexDirection: 'row',
  },
  witchAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: THEME.midnightVoid,
    backgroundColor: THEME.crystalPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 14,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 15,
    borderRadius: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillIcon: {
    fontSize: 16,
  },
  pillText: {
    fontSize: 11,
    color: THEME.moonGlow,
    opacity: 0.7,
  },
});

export default LandingPage;
