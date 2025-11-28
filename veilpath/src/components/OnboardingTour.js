/**
 * ONBOARDING TOUR COMPONENT
 *
 * First-time user tour that guides through the app.
 * Shows once and only once, with option to skip.
 *
 * Features:
 * - Step-by-step spotlight guidance
 * - Smooth animations between steps
 * - Skip button with confirmation
 * - Triggers welcome bonus on completion
 * - Remembers completion state
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerFirstShopVisitBonus } from '../services/SecureBonusService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Storage key
const TOUR_STORAGE_KEY = '@veilpath_tour_completed';

// Tour steps definition
const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to VeilPath',
    subtitle: 'Your sanctuary awaits',
    content: 'Tarot wisdom, mindfulness practices, and therapeutic tools—all in one mystical space.',
    icon: '✧',
    highlight: null, // Full screen modal
    position: 'center',
  },
  {
    id: 'daily_vera',
    title: 'Your Daily Vera',
    subtitle: 'Guidance every day',
    content: 'Each morning, a new card awaits. Tap to reveal your daily message from the cosmos.',
    icon: '🌙',
    highlight: 'HomeTab',
    position: 'bottom',
  },
  {
    id: 'readings',
    title: 'Deep Readings',
    subtitle: 'Explore the cards',
    content: 'From quick single-card pulls to full Celtic Cross spreads. Choose your depth.',
    icon: '🔮',
    highlight: 'ReadingTab',
    position: 'bottom',
  },
  {
    id: 'journal',
    title: 'Sacred Journal',
    subtitle: 'Capture your journey',
    content: 'Write your reflections, track your mood, and connect insights across time.',
    icon: '📔',
    highlight: 'JournalTab',
    position: 'bottom',
  },
  {
    id: 'vera_chat',
    title: 'Meet Vera',
    subtitle: 'Your personal guide',
    content: 'Vera is your AI life coach—warm, genuine, and here to help you find clarity. She uses tarot as a tool, not a crystal ball.',
    icon: '✨',
    highlight: 'VeraTab',
    position: 'bottom',
  },
  {
    id: 'profile',
    title: 'Your Sanctuary',
    subtitle: 'Shop, collect, progress',
    content: 'Level up, unlock achievements, collect card backs, and customize your experience.',
    icon: '👤',
    highlight: 'ProfileTab',
    position: 'bottom',
  },
  {
    id: 'gift',
    title: 'A Gift for You',
    subtitle: 'Your journey begins',
    content: 'Here\'s 1,000 Veil Shards to explore the Mystical Shop. Your first trip is on us!',
    icon: '💎',
    highlight: null,
    position: 'center',
    isGiftStep: true,
  },
  {
    id: 'complete',
    title: 'You\'re Ready, Seeker',
    subtitle: 'The veil awaits',
    content: 'Start by revealing your Daily Vera, or dive into a full reading. The path is yours.',
    icon: '✦',
    highlight: null,
    position: 'center',
    isFinalStep: true,
  },
];

// Animated sparkle for gift step
const GiftSparkle = ({ delay = 0 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      opacity.setValue(0);
      scale.setValue(0);
      rotation.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 500, delay: 800, useNativeDriver: true }),
          Animated.timing(rotation, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        {
          opacity,
          transform: [{ scale }, { rotate: spin }],
          left: Math.random() * 200 + 50,
          top: Math.random() * 100 + 50,
        },
      ]}
    >
      ✦
    </Animated.Text>
  );
};

export default function OnboardingTour({ visible, onComplete, onSkip, onNavigate }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const prevStepRef = useRef(currentStep);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (visible) {
      animateIn();

      // Auto-navigate to the tab for this step
      if (step.highlight && onNavigate && prevStepRef.current !== currentStep) {
        // Map step highlight to navigation target
        const navMap = {
          'HomeTab': 'Home',
          'ReadingTab': 'Reading',
          'JournalTab': 'Journal',
          'VeraTab': 'Vera',
          'ProfileTab': 'Profile',
          'ShopTab': 'Shop',
        };
        const target = navMap[step.highlight];
        if (target) {
          // Small delay so the step animation starts first
          setTimeout(() => {
            onNavigate(target);
          }, 300);
        }
      }
      prevStepRef.current = currentStep;
    }
  }, [visible, currentStep]);

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.9);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
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
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: (currentStep + 1) / TOUR_STEPS.length,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animateOut = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      animateOut(() => {
        setCurrentStep(currentStep + 1);
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateOut(() => {
        setCurrentStep(currentStep - 1);
      });
    }
  };

  const handleComplete = async () => {
    try {
      // Mark tour as completed
      await AsyncStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({
        completed: true,
        completedAt: new Date().toISOString(),
      }));

      // Trigger welcome bonus
      await triggerFirstShopVisitBonus();

      onComplete?.();
    } catch (error) {
      console.error('[Tour] Complete error:', error);
      onComplete?.();
    }
  };

  const handleSkip = async () => {
    if (!showSkipConfirm) {
      setShowSkipConfirm(true);
      return;
    }

    try {
      await AsyncStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({
        completed: true,
        skipped: true,
        skippedAt: new Date().toISOString(),
      }));

      // Still give them the bonus even if skipped
      await triggerFirstShopVisitBonus();

      onSkip?.();
    } catch (error) {
      console.error('[Tour] Skip error:', error);
      onSkip?.();
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      {/* Backdrop */}
      <View style={styles.backdrop}>
        {/* Sparkles for gift step */}
        {step.isGiftStep && (
          <>
            {Array.from({ length: 15 }).map((_, i) => (
              <GiftSparkle key={i} delay={i * 150} />
            ))}
          </>
        )}

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} / {TOUR_STEPS.length}
          </Text>
        </View>

        {/* Main card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#2D1B4E', '#1A0B2E', '#0F0E13']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative border */}
            <View style={styles.cardBorder} />

            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{step.icon}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.subtitle}>{step.subtitle}</Text>

            {/* Content */}
            <Text style={styles.content}>{step.content}</Text>

            {/* Gift amount display */}
            {step.isGiftStep && (
              <View style={styles.giftContainer}>
                <Text style={styles.giftAmount}>1,000</Text>
                <Text style={styles.giftEmoji}>💎</Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerDot}>✦</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              {currentStep > 0 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.nextButton, isLastStep && styles.finalButton]}
                onPress={handleNext}
              >
                <LinearGradient
                  colors={isLastStep ? ['#B78E52', '#D3BA8E'] : ['#6644AE', '#8266BE']}
                  style={styles.nextButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.nextButtonText, isLastStep && styles.finalButtonText]}>
                    {isLastStep ? 'Begin Journey' : 'Next →'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Skip option */}
            {!isLastStep && (
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>
                  {showSkipConfirm ? 'Tap again to skip tour' : 'Skip tour'}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Step indicators */}
        <View style={styles.stepIndicators}>
          {TOUR_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index === currentStep && styles.stepDotActive,
                index < currentStep && styles.stepDotCompleted,
              ]}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Hook to check if tour should be shown
 */
export async function shouldShowTour() {
  try {
    const stored = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return !data.completed;
    }
    return true; // First time user
  } catch {
    return true;
  }
}

/**
 * Reset tour (for testing)
 */
export async function resetTour() {
  await AsyncStorage.removeItem(TOUR_STORAGE_KEY);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 5, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#B78E52',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(183, 142, 82, 0.3)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(102, 68, 174, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(183, 142, 82, 0.5)',
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EFE6CA',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, Georgia, serif' : 'System',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#B78E52',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'System',
    fontStyle: 'italic',
  },
  content: {
    fontSize: 16,
    color: '#ABA5C0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  giftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  giftAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#EFE6CA',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, Georgia, serif' : 'System',
    textShadowColor: 'rgba(183, 142, 82, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  giftEmoji: {
    fontSize: 36,
    marginLeft: 12,
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
  dividerDot: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#B78E52',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(183, 142, 82, 0.4)',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#B78E52',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  finalButton: {
    flex: 1,
  },
  nextButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  finalButtonText: {
    color: '#1A0B2E',
  },
  skipButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },
  stepIndicators: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotActive: {
    backgroundColor: '#B78E52',
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: 'rgba(183, 142, 82, 0.5)',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
    color: '#B78E52',
  },
});
