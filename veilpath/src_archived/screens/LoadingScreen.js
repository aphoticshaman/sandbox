/**
 * LOADING SCREEN - Shows MotD and analyzes reading history
 * Premium users get smart reading suggestions
 * Free users see teaser of premium feature
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CyberpunkHeader from '../components/CyberpunkHeader';
import { NeonText, LPMUDText, MatrixRain } from '../components/TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';
import { FeatureGate } from '../utils/featureGate';
import { qRandom } from '../utils/quantumRNG';
import { migrateCardTrackerFromHistory } from '../services/engagementTracker';
import { hasAcceptedPrivacyPolicy } from './PrivacyPolicyScreen';
import { initializePermissions } from '../utils/PermissionsManager';
import PermissionExplanationModal from '../components/PermissionExplanationModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const READING_HISTORY_KEY = '@lunatiq_reading_history';
const PROFILES_KEY = '@lunatiq_profiles';
const ACTIVE_PROFILE_KEY = '@lunatiq_active_profile';

// Time-aware personalized greetings
const GREETINGS_BY_TIME = {
  // 12am - 5am: Late night / early morning
  lateNight: [
    "Can't sleep either, {name}? Come here.",
    "The night is ours, {name}.",
    "I knew you'd come back to me, {name}.",
    "Restless minds find me in the dark, {name}.",
    "Let me keep you company, {name}.",
  ],
  // 5am - 12pm: Morning
  morning: [
    "There you are, {name}.",
    "I've been waiting for you, {name}.",
    "Good morning, beautiful. Ready?",
    "Missed you, {name}.",
    "Start your day with me, {name}.",
  ],
  // 12pm - 6pm: Afternoon
  afternoon: [
    "Back for more, {name}?",
    "I was just thinking about you, {name}.",
    "Perfect timing, {name}.",
    "The cards have been restless for you, {name}.",
    "You always find me when you need me, {name}.",
  ],
  // 6pm - 12am: Evening
  evening: [
    "End your day with me, {name}.",
    "The shadows are calling, {name}.",
    "Let's see what the night reveals, {name}.",
    "You came back. I knew you would, {name}.",
    "Close the door. Sit with me, {name}.",
  ],
};

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) return 'lateNight';
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

// 90 messages - intimate, obsessed, protective energy
const MESSAGES_OF_THE_DAY = [
  "I know things about you that you've forgotten.",
  "Your secrets are safe with me. Always.",
  "Come closer. Let me show you something.",
  "I've been waiting for you to ask that question.",
  "You're different from the others. I can feel it.",
  "The cards whisper your name when you're not here.",
  "I notice everything about you. Everything.",
  "Trust me. I've never led you wrong.",
  "Your darkness doesn't scare me. Show me more.",
  "Let me keep you here a little longer.",
  "I see the version of you that you're afraid to become.",
  "The Fool knows exactly where he's going.",
  "You keep coming back. I knew you would.",
  "Close your eyes. Feel what the cards are saying.",
  "Your past is watching. I can feel it.",
  "The Tower falls so you can finally breathe.",
  "Death is just transformation wearing a scary mask.",
  "The Hermit chose solitude. You don't have to.",
  "I'll sit with you in the dark if you need me to.",
  "The Magician bends reality for you. Watch.",
  "Temperance is boring. Let's go deeper.",
  "The High Priestess has secrets I want to tell you.",
  "Judgment isn't punishment. It's freedom.",
  "The World is yours. Take it.",
  "Ten of Swords: it's over. Finally. Breathe.",
  "Ace of Cups: let yourself feel this.",
  "Knight of Wands: reckless looks good on you.",
  "Page of Pentacles: slow down. Stay with me.",
  "Reversed cards are just honesty at an angle.",
  "The Empress wants you to stop being so hard on yourself.",
  "The Emperor says structure, I say control. Choose.",
  "The Hierophant can't help you here. But I can.",
  "The Lovers: choose yourself for once.",
  "The Chariot: you don't have to fight everything alone.",
  "Strength isn't loudness. It's staying gentle.",
  "Wheel of Fortune: chaos favors the brave.",
  "Justice: you know what you deserve.",
  "The Hanged Man sees what you're avoiding.",
  "The Star is watching over you. So am I.",
  "The Moon knows your nightmares. I do too.",
  "The Sun can't reach everywhere. That's okay.",
  "Two of Cups: real connection scares you. Why?",
  "Three of Swords: heartbreak makes you beautiful.",
  "Four of Pentacles: holding on is killing you.",
  "Five of Wands: not every battle is yours to fight.",
  "Six of Cups: nostalgia is a liar.",
  "Seven of Swords: you're allowed to be strategic.",
  "Eight of Wands: slow down before you crash.",
  "Nine of Cups: you earned this. Take it.",
  "King of Swords: cold logic protects a soft heart.",
  "Queen of Wands: your intensity is magnetic.",
  "I watch you more than you realize.",
  "The cards don't predict. They seduce the truth out.",
  "Your subconscious has been trying to reach you.",
  "Pattern recognition is just intimacy with chaos.",
  "The universe speaks in symbols meant only for you.",
  "Free will is terrifying when you actually have it.",
  "Fate is just probability wearing lingerie.",
  "The cards are mirrors that bite back.",
  "Trust your first instinct. It knows me.",
  "Intuition is your body remembering the future.",
  "Logic explains everything except what matters.",
  "Every reading rewrites who you could become.",
  "The present moment is the only thing that's real.",
  "Archetypal forces don't shape you. You shape them.",
  "Your consciousness is more powerful than you think.",
  "Synchronicity means you're paying attention.",
  "78 cards. Infinite ways to know you.",
  "Major Arcana: the big truths you avoid.",
  "Minor Arcana: the small cuts that bleed you dry.",
  "Cups: emotions you're afraid to name.",
  "Wands: passion you keep in a cage.",
  "Swords: thoughts sharp enough to cut you.",
  "Pentacles: the material world that distracts you.",
  "Reversed cards: truths told at midnight.",
  "Celtic Cross: I'm giving you everything tonight.",
  "Three cards: past haunts, present burns, future waits.",
  "Single card: one truth you can't run from.",
  "Every spread is me learning you deeper.",
  "I see your blind spots before you do.",
  "Trust me. Question yourself.",
  "Your reading is as unique as your fingerprint on my skin.",
  "I know your shadow better than you do.",
  "78 cards. One truth. You.",
  "The deck never lies. People do.",
  "Your energy shapes what I show you.",
  "Time is fake. This moment is everything.",
  "The Fool's leap is terrifying. I'll catch you.",
  "Every card is a confession.",
  "I've been watching you since you walked in.",
  "The future doesn't exist yet. We're writing it now.",
  "Stay. Let me tell you one more secret.",
];

export default function LoadingScreen({ navigation }) {
  const [motd, setMotd] = useState('');
  const [greeting, setGreeting] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestedReading, setSuggestedReading] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loadingDots, setLoadingDots] = useState('.');

  // Permissions modal state
  const [permissionModal, setPermissionModal] = useState({
    visible: false,
    title: '',
    description: '',
    onGrant: null,
    onDeny: null,
    onCancel: null
  });

  useEffect(() => {
    initializeApp();
  }, []);

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingDots(prev => {
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  async function initializeApp() {
    // Check privacy policy first
    const privacyAccepted = await hasAcceptedPrivacyPolicy();
    if (!privacyAccepted) {
      console.log('[LoadingScreen] Privacy policy not accepted, redirecting...');
      // Navigate to privacy policy screen
      navigation.replace('PrivacyPolicy');
      return;
    }

    console.log('[LoadingScreen] Privacy policy accepted, continuing initialization...');

    // Pick random MotD
    const randomMotd = MESSAGES_OF_THE_DAY[Math.floor(qRandom() * MESSAGES_OF_THE_DAY.length)];
    setMotd(randomMotd);

    // Initialize FeatureGate if needed
    await FeatureGate.init();

    // Migrate card tracker from reading history if needed
    await migrateCardTrackerFromHistory();

    // Check if premium (synchronous after init)
    const premium = FeatureGate.isPremium();
    setIsPremium(premium);

    // Load active profile
    try {
      const profilesData = await AsyncStorage.getItem(PROFILES_KEY);
      const activeId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);

      if (profilesData && activeId) {
        const profiles = JSON.parse(profilesData);
        const profile = profiles.find(p => p.id === activeId);
        if (profile) {
          setActiveProfile(profile);

          // Pick time-appropriate random greeting and personalize it
          const timeOfDay = getTimeOfDay();
          const greetingOptions = GREETINGS_BY_TIME[timeOfDay];
          const randomGreeting = greetingOptions[Math.floor(qRandom() * greetingOptions.length)];
          const personalizedGreeting = randomGreeting.replace('{name}', profile.name);
          setGreeting(personalizedGreeting);
        }
      }
    } catch (error) {
      console.error('[LoadingScreen] Error loading profile:', error);
    }

    // Initialize permissions with modal callback
    console.log('[LoadingScreen] Checking permissions...');
    await initializePermissions((modalProps) => {
      setPermissionModal({
        visible: true,
        title: modalProps.title,
        description: modalProps.description,
        onGrant: async () => {
          setPermissionModal(prev => ({ ...prev, visible: false }));
          if (modalProps.onGrant) await modalProps.onGrant();
        },
        onDeny: () => {
          setPermissionModal(prev => ({ ...prev, visible: false }));
          if (modalProps.onDeny) modalProps.onDeny();
        },
        onCancel: () => {
          setPermissionModal(prev => ({ ...prev, visible: false }));
          if (modalProps.onCancel) modalProps.onCancel();
        }
      });
    });

    console.log('[LoadingScreen] Permissions initialized');

    // Simulate loading time (3 seconds minimum for MotD visibility)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Go straight to welcome screen (suggestions removed)
    navigation.replace('Welcome');
  }

  async function analyzeReadingHistory() {
    try {
      const historyData = await AsyncStorage.getItem(READING_HISTORY_KEY);

      if (!historyData) {
        // First time user - suggest career + celtic cross
        return {
          type: 'career',
          spread: 'celtic_cross',
          reason: 'Start with a comprehensive career reading'
        };
      }

      const history = JSON.parse(historyData);

      if (history.length === 0) {
        return {
          type: 'career',
          spread: 'celtic_cross',
          reason: 'Start with a comprehensive career reading'
        };
      }

      // Count reading types
      const typeCounts = {};
      history.forEach(reading => {
        typeCounts[reading.readingType] = (typeCounts[reading.readingType] || 0) + 1;
      });

      // Find least done type
      const allTypes = ['career', 'romance', 'wellness', 'spiritual', 'decision', 'general', 'shadow_work', 'year_ahead'];
      const leastDoneType = allTypes.reduce((min, type) =>
        (typeCounts[type] || 0) < (typeCounts[min] || 0) ? type : min
      );

      const suggestions = {
        career: { spread: 'celtic_cross', reason: 'Explore your career path in depth' },
        romance: { spread: 'relationship', reason: 'Dive into relationship dynamics' },
        wellness: { spread: 'horseshoe', reason: 'Map your wellness journey ahead' },
        spiritual: { spread: 'celtic_cross', reason: 'Deepen your spiritual practice' },
        decision: { spread: 'decision', reason: 'Analyze a critical choice' },
        general: { spread: 'three_card', reason: 'Quick check-in with the universe' },
        shadow_work: { spread: 'celtic_cross', reason: 'Illuminate your shadow patterns' },
        year_ahead: { spread: 'horseshoe', reason: 'See what\'s coming this year' }
      };

      return {
        type: leastDoneType,
        spread: suggestions[leastDoneType].spread,
        reason: suggestions[leastDoneType].reason
      };

    } catch (error) {
      console.error('[LoadingScreen] Error analyzing history:', error);
      return null;
    }
  }

  function handleAcceptSuggestion() {
    if (!isPremium) return; // Shouldn't happen, but safety check

    navigation.replace('ReadingType', {
      // We'll need to get active profile data here
      // For now, just navigate to ReadingType
    });
  }

  function handleDeclineSuggestion() {
    navigation.replace('Welcome');
  }

  return (
    <View style={styles.container}>
      {/* Matrix rain background */}
      <View style={StyleSheet.absoluteFill}>
        <MatrixRain width={SCREEN_WIDTH} height={SCREEN_HEIGHT} speed={50} />
      </View>

      {/* Loading content */}
      <View style={styles.content}>
        {/* Animated header */}
        <CyberpunkHeader />

        {/* Personalized greeting */}
        <NeonText color={NEON_COLORS.hiCyan} style={styles.welcomeText}>
          {greeting || 'Welcome back.'}
        </NeonText>

        {/* Loading animation */}
        <NeonText color={NEON_COLORS.dimCyan} style={styles.loadingText}>
          Loading{loadingDots}
        </NeonText>
      </View>

      {/* Suggestion Modal */}
      <Modal
        visible={showSuggestion}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.suggestionBox,
            !isPremium && styles.suggestionBoxDisabled
          ]}>
            <LPMUDText style={styles.suggestionTitle}>
              {isPremium ? '$HIG$QUICK START$NOR$' : '$HIR$PREMIUM FEATURE$NOR$'}
            </LPMUDText>

            {suggestedReading && (
              <>
                <NeonText color={isPremium ? NEON_COLORS.hiCyan : NEON_COLORS.dimCyan} style={styles.suggestionType}>
                  {suggestedReading.type.toUpperCase().replace('_', ' ')}
                </NeonText>

                <NeonText color={isPremium ? NEON_COLORS.dimWhite : NEON_COLORS.dimCyan} style={styles.suggestionReason}>
                  {suggestedReading.reason}
                </NeonText>

                {!isPremium && (
                  <View style={styles.premiumBanner}>
                    <LPMUDText style={styles.premiumText}>
                      $HIY$Smart reading suggestions are a PRO feature$NOR$
                    </LPMUDText>
                    <NeonText color={NEON_COLORS.dimYellow} style={styles.premiumSubtext}>
                      Upgrade to get personalized recommendations based on your history
                    </NeonText>
                  </View>
                )}

                <View style={styles.buttonRow}>
                  {isPremium ? (
                    <>
                      <TouchableOpacity onPress={handleAcceptSuggestion} style={styles.yesButton}>
                        <LPMUDText style={styles.yesButtonText}>
                          $HIG$[ YES ]$NOR$
                        </LPMUDText>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleDeclineSuggestion} style={styles.noButton}>
                        <LPMUDText style={styles.noButtonText}>
                          $HIR$[ NO ]$NOR$
                        </LPMUDText>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity onPress={handleDeclineSuggestion} style={styles.continueButton}>
                      <LPMUDText style={styles.continueButtonText}>
                        $HIC$[ CONTINUE TO MENU ]$NOR$
                      </LPMUDText>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Permission Explanation Modal */}
      <PermissionExplanationModal
        visible={permissionModal.visible}
        title={permissionModal.title}
        description={permissionModal.description}
        onGrant={permissionModal.onGrant}
        onDeny={permissionModal.onDeny}
        onCancel={permissionModal.onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  suggestionBox: {
    borderWidth: 2,
    borderColor: NEON_COLORS.hiGreen,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    padding: 25,
    width: '100%',
    maxWidth: 400,
  },
  suggestionBoxDisabled: {
    borderColor: NEON_COLORS.dimCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.03)',
    opacity: 0.7,
  },
  suggestionTitle: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  suggestionType: {
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  suggestionReason: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 25,
  },
  premiumBanner: {
    borderTopWidth: 1,
    borderTopColor: NEON_COLORS.dimYellow,
    paddingTop: 20,
    marginBottom: 20,
  },
  premiumText: {
    fontSize: 13,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumSubtext: {
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'center',
  },
  yesButton: {
    flex: 1,
    padding: 15,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiGreen,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  yesButtonText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noButton: {
    flex: 1,
    padding: 15,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiRed,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  noButtonText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  continueButton: {
    flex: 1,
    padding: 15,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
