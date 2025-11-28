/**
 * WELCOME BONUS MODAL
 *
 * Displays a gorgeous animated popup when users earn first-time bonuses.
 * "Your first trip to the shop is on us! Here's 1,000 Veil Shards!"
 *
 * Features:
 * - Sparkle/particle effects
 * - Animated gem/shard icons
 * - Pulsing glow
 * - Satisfying entrance/exit animations
 * - Sound effect trigger (optional)
 *
 * SECURITY: This component is DISPLAY ONLY.
 * Actual bonus claiming happens server-side via SecureBonusService.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sparkle particle component
const Sparkle = ({ delay, startX, startY }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      opacity.setValue(0);
      translateY.setValue(0);
      translateX.setValue(0);
      scale.setValue(0);
      rotation.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100 - Math.random() * 100,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: (Math.random() - 0.5) * 150,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            delay: 500,
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate());
    };

    animate();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        {
          left: startX,
          top: startY,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { scale },
            { rotate: spin },
          ],
        },
      ]}
    >
      ✦
    </Animated.Text>
  );
};

// Floating gem icon
const FloatingGem = ({ delay = 0 }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: 1000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 10,
          duration: 1000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.gemContainer}>
      <Animated.View
        style={[
          styles.gemGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: 1.5 }],
          },
        ]}
      />
      <Animated.Text
        style={[
          styles.gemIcon,
          {
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        💎
      </Animated.Text>
    </View>
  );
};

// Animated counter for bonus amount
const AnimatedCounter = ({ value, duration = 1500 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.floor(v));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value]);

  return (
    <Text style={styles.bonusAmount}>
      {displayValue.toLocaleString()}
    </Text>
  );
};

export default function WelcomeBonusModal({
  visible,
  onClose,
  bonusAmount = 1000,
  bonusType = 'first_shop_visit',
  currencyName = 'Veil Shards',
  title = "Welcome, Seeker!",
  message = "Your first trip to the shop is on us!",
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowSparkles(true);

      // Shimmer animation for the card
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Entry animation
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        easing: Easing.in(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSparkles(false);
      onClose?.();
    });
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  // Generate sparkle positions
  const sparkles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH * 0.6 + SCREEN_WIDTH * 0.2,
    y: Math.random() * 200 + 150,
    delay: Math.random() * 2000,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropAnim },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouch}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sparkles */}
      {showSparkles && sparkles.map((s) => (
        <Sparkle
          key={s.id}
          startX={s.x}
          startY={s.y}
          delay={s.delay}
        />
      ))}

      {/* Main Card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: opacityAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.card}>
          <LinearGradient
            colors={['#2D1B4E', '#1A0B2E', '#0F0E13']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Shimmer overlay */}
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />

            {/* Decorative border glow */}
            <View style={styles.borderGlow} />

            {/* Content */}
            <View style={styles.content}>
              {/* Title with decorative elements */}
              <View style={styles.titleContainer}>
                <Text style={styles.decorLeft}>✧</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.decorRight}>✧</Text>
              </View>

              {/* Floating gem */}
              <FloatingGem />

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Bonus display */}
              <View style={styles.bonusContainer}>
                <Text style={styles.bonusLabel}>Here's</Text>
                <View style={styles.bonusRow}>
                  <AnimatedCounter value={bonusAmount} />
                  <Text style={styles.gemEmoji}>💎</Text>
                </View>
                <Text style={styles.currencyName}>{currencyName}</Text>
              </View>

              {/* Decorative divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerStar}>✦</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Claim button */}
              <TouchableOpacity
                style={styles.claimButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#B78E52', '#D3BA8E', '#B78E52']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Claim Reward</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Subtle footer */}
              <Text style={styles.footer}>
                Your reward has been added to your account
              </Text>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 5, 20, 0.92)',
  },
  backdropTouch: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    // Glow effect
    shadowColor: '#B78E52',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  cardGradient: {
    padding: 2, // Border width
    borderRadius: 24,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ skewX: '-20deg' }],
  },
  borderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(183, 142, 82, 0.5)',
  },
  content: {
    backgroundColor: 'rgba(26, 11, 46, 0.95)',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  decorLeft: {
    fontSize: 20,
    color: '#B78E52',
    marginRight: 12,
  },
  decorRight: {
    fontSize: 20,
    color: '#B78E52',
    marginLeft: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EFE6CA',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, Georgia, serif' : 'System',
    textShadowColor: 'rgba(183, 142, 82, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
  gemContainer: {
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  gemGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6644AE',
  },
  gemIcon: {
    fontSize: 64,
    textShadowColor: 'rgba(102, 68, 174, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  message: {
    fontSize: 16,
    color: '#ABA5C0',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'System',
    lineHeight: 24,
  },
  bonusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bonusLabel: {
    fontSize: 14,
    color: '#8B859D',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bonusAmount: {
    fontSize: 56,
    fontWeight: '800',
    color: '#EFE6CA',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, Georgia, serif' : 'System',
    textShadowColor: 'rgba(183, 142, 82, 0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 15,
  },
  gemEmoji: {
    fontSize: 40,
    marginLeft: 12,
  },
  currencyName: {
    fontSize: 18,
    color: '#B78E52',
    marginTop: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, Georgia, serif' : 'System',
    letterSpacing: 2,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(183, 142, 82, 0.3)',
  },
  dividerStar: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#B78E52',
  },
  claimButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    // Button glow
    shadowColor: '#B78E52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A0B2E',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, Georgia, serif' : 'System',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    fontSize: 12,
    color: '#6B657A',
    textAlign: 'center',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
    color: '#B78E52',
    zIndex: 1000,
  },
});
