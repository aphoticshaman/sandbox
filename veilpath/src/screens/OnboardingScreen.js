/**
 * Onboarding Screen
 * First-time user experience with swipeable pages
 * AAA-quality landing page on web, standard onboarding on mobile
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { Button, Card } from '../components';
import { THEME } from '../theme/theme';
import { useUserStore } from '../stores/userStore';
import { APP_BRANDING } from '../constants/appConstants';

// Import AAA landing page for web
import { LandingPage } from '../web';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_PAGES = [
  {
    id: 1,
    icon: '🌙',
    title: `Welcome to ${APP_BRANDING.NAME}`,
    subtitle: APP_BRANDING.TAGLINE,
    description: 'Combine the wisdom of archetypal reflection with proven therapeutic techniques: CBT, DBT, and mindfulness.',
    bullets: [
      'Therapeutic journaling',
      'Daily tarot insights',
      'Mindfulness practices',
      'Track your progress',
    ],
  },
  {
    id: 2,
    icon: '🎴',
    title: 'Tarot for Self-Reflection',
    subtitle: 'Archetypes, not fortune-telling',
    description: 'We use tarot as a mirror for self-reflection, not mystical predictions. Each card is mapped to therapeutic concepts.',
    bullets: [
      '78 cards with deep meanings',
      'Single card daily draws',
      '3-card Past/Present/Future',
      'Celtic Cross for big questions',
    ],
  },
  {
    id: 3,
    icon: '🧠',
    title: 'Evidence-Based Therapy',
    subtitle: 'Real science, real results',
    description: `${APP_BRANDING.NAME} integrates proven therapeutic frameworks used by licensed professionals worldwide.`,
    bullets: [
      'CBT: Challenge negative thoughts',
      'DBT: Manage intense emotions',
      'MBSR: Mindfulness meditation',
      '625+ therapeutic prompts',
    ],
  },
  {
    id: 4,
    icon: '📖',
    title: 'Journal Your Journey',
    subtitle: 'Write, reflect, grow',
    description: 'Journaling is one of the most powerful tools for mental wellness. Track your mood, identify patterns, and gain insights.',
    bullets: [
      'Mood tracking (before & after)',
      'Guided prompts for every card',
      'CBT distortion detection',
      'Private & encrypted',
    ],
  },
  {
    id: 5,
    icon: '🎯',
    title: 'Gamified Progress',
    subtitle: 'Level up your wellness',
    description: 'Earn XP, unlock achievements, and watch yourself grow. Motivation without manipulation—ethical gamification.',
    bullets: [
      '50 levels of progression',
      'Achievements & titles',
      'Skill tree (coming soon)',
      'Daily streak tracking',
    ],
  },
  {
    id: 6,
    icon: '🔒',
    title: 'Your Privacy Matters',
    subtitle: 'Local-first, always',
    description: 'All your data stays on your device. No cloud backup unless you opt-in. No tracking, no ads, no data selling.',
    bullets: [
      '100% local storage',
      'Optional encrypted backups',
      'No analytics without consent',
      'Export your data anytime',
    ],
  },
];

export default function OnboardingScreen({ navigation }) {
  const userStore = useUserStore();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);

  const handleNext = () => {
    if (currentPage < ONBOARDING_PAGES.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: SCREEN_WIDTH * nextPage,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    userStore.completeOnboarding('completedWelcome');
    navigation.replace('MainApp');
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const page = ONBOARDING_PAGES[currentPage];

  // Show AAA landing page on web
  if (Platform.OS === 'web') {
    return <LandingPage onEnter={handleComplete} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Skip Button */}
        {currentPage < ONBOARDING_PAGES.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Page Indicator */}
        <View style={styles.pageIndicator}>
          {ONBOARDING_PAGES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pageIndicatorDot,
                index === currentPage && styles.pageIndicatorDotActive,
              ]}
            />
          ))}
        </View>

        {/* Scrollable Pages */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {ONBOARDING_PAGES.map((item, index) => (
            <View key={item.id} style={styles.page}>
              <View style={styles.pageContent}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>

                {/* Title */}
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>

                {/* Description */}
                <Text style={styles.description}>{item.description}</Text>

                {/* Bullets */}
                <View style={styles.bulletsList}>
                  {item.bullets.map((bullet, idx) => (
                    <View key={idx} style={styles.bulletItem}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomSection}>
          <Button
            title={currentPage === ONBOARDING_PAGES.length - 1 ? "Get Started" : "Next"}
            variant="accent"
            size="lg"
            fullWidth
            onPress={handleNext}
          />

          {currentPage === ONBOARDING_PAGES.length - 1 && (
            <Text style={styles.disclaimer}>
              By continuing, you agree that {APP_BRANDING.NAME} is for wellness support, not a replacement for professional mental health care.
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.neutral[1000],
  },
  content: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: THEME.spacing[4],
    right: THEME.spacing[4],
    zIndex: 10,
    padding: THEME.spacing[2],
  },
  skipText: {
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.accent[400],
    fontWeight: '600',
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: THEME.spacing[6],
    gap: THEME.spacing[2],
  },
  pageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.neutral[700],
  },
  pageIndicatorDotActive: {
    width: 24,
    backgroundColor: THEME.colors.accent[500],
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: THEME.spacing[6],
  },
  pageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.colors.primary[900],
    borderWidth: 3,
    borderColor: THEME.colors.accent[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing[6],
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: THEME.typography.sizes['3xl'],
    fontWeight: '700',
    color: THEME.colors.neutral[0],
    textAlign: 'center',
    marginBottom: THEME.spacing[2],
  },
  subtitle: {
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.accent[400],
    textAlign: 'center',
    marginBottom: THEME.spacing[4],
    fontStyle: 'italic',
  },
  description: {
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.neutral[300],
    textAlign: 'center',
    lineHeight: THEME.typography.sizes.base * THEME.typography.lineHeights.relaxed,
    marginBottom: THEME.spacing[6],
    paddingHorizontal: THEME.spacing[4],
  },
  bulletsList: {
    alignSelf: 'stretch',
    paddingHorizontal: THEME.spacing[8],
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing[3],
  },
  bulletDot: {
    fontSize: THEME.typography.sizes.lg,
    color: THEME.colors.accent[500],
    marginRight: THEME.spacing[3],
    lineHeight: THEME.typography.sizes.base * THEME.typography.lineHeights.relaxed,
  },
  bulletText: {
    flex: 1,
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.neutral[200],
    lineHeight: THEME.typography.sizes.base * THEME.typography.lineHeights.relaxed,
  },
  bottomSection: {
    padding: THEME.spacing[6],
    paddingBottom: THEME.spacing[8],
  },
  disclaimer: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.neutral[600],
    textAlign: 'center',
    marginTop: THEME.spacing[4],
    lineHeight: THEME.typography.sizes.xs * THEME.typography.lineHeights.relaxed,
  },
});
