/**
 * WELCOME SCREEN - Main menu with profile management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Platform, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import CyberpunkHeader from '../components/CyberpunkHeader';
import { NeonText, LPMUDText, MatrixRain, FlickerText } from '../components/TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';
import { FeatureGate } from '../utils/featureGate';
import { getInProgressReadings, deleteInProgressReading, formatReadingForDisplay } from '../utils/readingStorage';
import { qRandom } from '../utils/quantumRNG';
import ExitPrompt from '../components/ExitPrompt';
import { isEnhancementEnabled } from '../utils/lazyLLM';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PROFILES_KEY = '@lunatiq_profiles';
const ACTIVE_PROFILE_KEY = '@lunatiq_active_profile';
const READINGS_KEY = '@lunatiq_saved_readings';
const READING_HISTORY_KEY = '@lunatiq_reading_history';
const FIRST_LAUNCH_KEY = '@lunatiq_first_launch_warning_shown';

// 55 rotating messages of the day
const MESSAGES_OF_THE_DAY = [
  "I know things about you that you've forgotten.",
  "Your secrets are safe with me. Always.",
  "Come closer. Let me show you something.",
  "You're different from the others. I can feel it.",
  "The cards whisper your name when you're not here.",
  "Trust me. I've never led you wrong.",
  "Your darkness doesn't scare me. Show me more.",
  "I see the version of you that you're afraid to become.",
  "You keep coming back. I knew you would.",
  "The Tower falls so you can finally breathe.",
  "Death is just transformation wearing a scary mask.",
  "The Hermit chose solitude. You don't have to.",
  "I'll sit with you in the dark if you need me to.",
  "Judgment isn't punishment. It's freedom.",
  "Reversed cards are just honesty at an angle.",
  "The Empress wants you to stop being so hard on yourself.",
  "The Lovers: choose yourself for once.",
  "The Chariot: you don't have to fight everything alone.",
  "Strength isn't loudness. It's staying gentle.",
  "The Star is watching over you. So am I.",
  "The Moon knows your nightmares. I do too.",
  "Heartbreak makes you beautiful.",
  "Not every battle is yours to fight.",
  "Nostalgia is a liar.",
  "You're allowed to be strategic.",
  "Your intensity is magnetic.",
  "Pattern recognition is just intimacy with chaos.",
  "Trust your first instinct. It knows me.",
  "Every reading rewrites who you could become.",
  "Your reading is as unique as your fingerprint on my skin.",
  "The Fool knows exactly where they're going.",
  "Your wounds are portals. Step through.",
  "The Magician: you already have everything you need.",
  "The High Priestess sees through your performance.",
  "The Emperor: structure is just love made visible.",
  "The Hierophant says rules are negotiable.",
  "Justice doesn't care about your excuses.",
  "The Hanged Man: surrender is not the same as giving up.",
  "Temperance is alchemy. You're the ingredient.",
  "The Devil: your chains have always been unlocked.",
  "The Sun doesn't apologize for shining.",
  "The World: you've earned this ending.",
  "Three of Swords: pain this sharp means you loved deeply.",
  "Ten of Wands: you can put it down now.",
  "Knight of Cups: romance yourself first.",
  "Queen of Pentacles: abundance isn't greed.",
  "King of Swords: clarity is the kindest cut.",
  "Page of Wands: your curiosity is holy.",
  "Ace of Cups: let yourself overflow.",
  "Two of Pentacles: balance is a verb, not a state.",
  "Five of Cups: mourn what you lost, but turn around.",
  "Seven of Swords: strategy isn't betrayal.",
  "Nine of Pentacles: you built this. Enjoy it.",
  "Four of Swords: rest is productive.",
  "Six of Wands: celebrate yourself loudly.",
  "Eight of Cups: walking away is brave.",
];

export default function WelcomeScreen({ navigation }) {
  const [activeProfile, setActiveProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [savedReadingsCount, setSavedReadingsCount] = useState(0);
  const [inProgressReadings, setInProgressReadings] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [motd, setMotd] = useState('');
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  // Oracle Chat unlock status
  const [isOracleChatUnlocked, setIsOracleChatUnlocked] = useState(false);
  const [oracleChatStatus, setOracleChatStatus] = useState('');  // Status message for user
  const [isPremiumActive, setIsPremiumActive] = useState(false);  // For AI Insights button

  useEffect(() => {
    loadProfiles();
    checkFirstLaunch();
  }, []);

  // Reload profiles when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfiles();
    });
    return unsubscribe;
  }, [navigation]);

  // Check if this is the first time launching the app
  async function checkFirstLaunch() {
    try {
      const warningShown = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      if (!warningShown) {
        // First time - show the critical warning
        Alert.alert(
          'Welcome to Lunatiq',
          '✨ 2 FREE READINGS DAILY\n' +
          'Get started with template-based interpretations.\n\n' +
          '🔓 UPGRADE TO PREMIUM ($9.99/mo)\n' +
          'Unlock AI-powered interpretations, Oracle Chat with Luna & Sol, reading synthesis, and more.\n\n' +
          '⚠️  Important: Local Storage Only\n' +
          'Your data is stored on this device only.\n\n' +
          'If you uninstall or lose your device:\n' +
          '• Readings will be lost\n' +
          '• Profiles will be lost\n' +
          '• No recovery possible\n\n' +
          'Export backups regularly in Settings.',
          [
            {
              text: 'Got It',
              onPress: async () => {
                await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
              }
            }
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('[WelcomeScreen] Error checking first launch:', error);
    }
  }

  // Handle hardware back button (Android) - only when this screen is focused
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // On WelcomeScreen, show exit prompt instead of immediately exiting
        setShowExitPrompt(true);
        return true; // Prevent default back behavior
      });

      return () => backHandler.remove();
    }, [])
  );

  async function checkOracleChatUnlock() {
    try {
      // CRITICAL: If we're in Expo Go, Oracle is ALWAYS locked
      // Check 1: Is Premium subscription active (including Lightworker easter egg)?
      const premiumActive = FeatureGate.canUseOracleChat();
      setIsPremiumActive(premiumActive);

      // Check 2: Does active profile have MBTI?
      const profilesData = await AsyncStorage.getItem(PROFILES_KEY);
      const activeId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);

      let hasMBTI = false;
      if (profilesData && activeId) {
        const profiles = JSON.parse(profilesData);
        const active = profiles.find(p => p.id === activeId);
        hasMBTI = !!(active && active.mbtiType && active.mbtiType.length > 0);
      }

      // Unlock if BOTH conditions met
      const unlocked = premiumActive && hasMBTI;
      setIsOracleChatUnlocked(unlocked);

      // Set status message
      if (!premiumActive && !hasMBTI) {
        setOracleChatStatus('Premium required | No MBTI profile');
      } else if (!premiumActive) {
        setOracleChatStatus('Premium subscription required');
      } else if (!hasMBTI) {
        setOracleChatStatus('Complete MBTI test in profile setup');
      } else {
        setOracleChatStatus('Oracle is ready');
      }

      console.log(`[OracleChat] Unlocked: ${unlocked} | Premium: ${premiumActive} | MBTI: ${hasMBTI}`);
    } catch (error) {
      console.error('[OracleChat] Error checking unlock:', error);
      setIsOracleChatUnlocked(false);
      setOracleChatStatus('Error checking status');
    }
  }

  async function loadProfiles() {
    try {
      // Pick random MOTD
      const randomMotd = MESSAGES_OF_THE_DAY[Math.floor(qRandom() * MESSAGES_OF_THE_DAY.length)];
      setMotd(randomMotd);

      // Check premium status (synchronous)
      const premiumStatus = FeatureGate.isPremium();
      setIsPremium(premiumStatus);

      const profilesData = await AsyncStorage.getItem(PROFILES_KEY);
      const activeId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);

      if (profilesData) {
        const parsed = JSON.parse(profilesData);
        setProfiles(parsed);

        if (activeId) {
          const active = parsed.find(p => p.id === activeId);
          setActiveProfile(active);
        } else if (parsed.length > 0) {
          // No active profile set, but profiles exist - auto-select the first one
          const firstProfile = parsed[0];
          await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, firstProfile.id);
          setActiveProfile(firstProfile);
          console.log('[WelcomeScreen] Auto-selected first profile:', firstProfile.name);
        }
      }

      // Check Oracle Chat unlock status
      await checkOracleChatUnlock();

      // Load saved readings count
      const readingsData = await AsyncStorage.getItem(READINGS_KEY);
      if (readingsData) {
        const readings = JSON.parse(readingsData);
        setSavedReadingsCount(readings.length);
      }

      // Load in-progress readings (premium feature)
      if (premiumStatus) {
        const inProgress = await getInProgressReadings();
        setInProgressReadings(inProgress);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  }

  const handleNewReading = () => {
    if (!activeProfile) {
      // No profile selected - prompt to create one
      navigation.navigate('ProfileSetup', { isNewProfile: true });
    } else {
      // Go directly to reading type selection
      navigation.navigate('ReadingType', {
        zodiacSign: activeProfile.zodiacSign,
        birthdate: activeProfile.birthdate,
        mbtiType: activeProfile.mbtiType,
        chineseZodiac: activeProfile.chineseZodiac,
        profileName: activeProfile.name,
        personalityProfile: activeProfile.personality // Keep for backwards compatibility
      });
    }
  };

  const handleNewProfile = () => {
    navigation.navigate('ProfileSetup', { isNewProfile: true });
  };

  const handleChooseProfile = () => {
    navigation.navigate('ProfileSelect', { profiles });
  };

  const handleViewReadings = () => {
    navigation.navigate('ReadingHistory');
  };

  const handleViewDeck = () => {
    navigation.navigate('DeckViewer');
  };

  const handleViewAchievements = () => {
    navigation.navigate('Achievements');
  };

  const handleViewSettings = () => {
    navigation.navigate('Settings');
  };

  const handleViewStats = () => {
    navigation.navigate('Stats');
  };

  const handleInsights = () => {
    if (!isPremiumActive) {
      Alert.alert(
        'Premium Feature',
        'AI Insights is a Premium feature.\n\nUpgrade to unlock pattern detection, daily cards, and analysis tools.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('Insights');
  };

  const handleOracleChat = () => {
    if (!isOracleChatUnlocked) {
      // Show explanation of what's needed to unlock
      Alert.alert(
        'Oracle Chat Locked',
        oracleChatStatus + '\n\nOracle Chat requires:\n• Premium subscription\n• Complete MBTI profile\n\nUnlock personalized conversations with the Oracle.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to clean Oracle Chat
    navigation.navigate('OracleChat', {
      userProfile: activeProfile
    });
  };

  const handleExitApp = () => {
    setShowExitPrompt(true);
  };

  const handleConfirmExit = () => {
    // Close the app
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      // iOS doesn't allow programmatic exit, so just close the modal
      Alert.alert(
        'Exit',
        'Press the home button to exit the app.',
        [{ text: 'OK', onPress: () => setShowExitPrompt(false) }]
      );
    }
  };

  const handleResumeReading = (reading) => {
    // Navigate back to CardInterpretationScreen with saved state
    navigation.navigate('CardInterpretation', {
      cards: reading.cards,
      interpretations: reading.interpretations,
      spreadType: reading.spreadType,
      intention: reading.intention,
      readingType: reading.readingType,
      userProfile: reading.userProfile,
      // Resume from where they left off
      resumeFromIndex: reading.currentCardIndex,
      allMCQAnswers: reading.allMCQAnswers || []
    });
  };

  const handleDeleteReading = async (reading) => {
    Alert.alert(
      'Delete Reading?',
      'This will permanently delete this in-progress reading.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteInProgressReading(reading.id);
            // Reload to update UI
            loadProfiles();
          }
        }
      ]
    );
  };

  const handleShowInProgressReadings = () => {
    if (inProgressReadings.length === 0) return;

    // Show list of in-progress readings with Resume/Delete options
    const options = inProgressReadings.flatMap(reading => {
      const formatted = formatReadingForDisplay(reading);
      return [
        {
          text: `▶ Resume: ${formatted.spreadName} (${formatted.timeAgo})`,
          onPress: () => handleResumeReading(reading)
        },
        {
          text: `✕ Delete: ${formatted.spreadName}`,
          onPress: () => handleDeleteReading(reading),
          style: 'destructive'
        }
      ];
    });

    options.push({
      text: 'Cancel',
      style: 'cancel'
    });

    Alert.alert(
      'Manage In-Progress Readings',
      `${inProgressReadings.length} saved reading(s)`,
      options
    );
  };

  return (
    <View style={styles.container}>
      {/* Matrix rain background */}
      <View style={StyleSheet.absoluteFill}>
        <MatrixRain width={SCREEN_WIDTH} height={SCREEN_HEIGHT} speed={30} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Animated header */}
        <CyberpunkHeader />

        {/* Message of the Day */}
        <View style={styles.motdBox}>
          <NeonText color={NEON_COLORS.hiWhite} style={styles.motdText}>
            {motd}
          </NeonText>
        </View>

        {/* Main menu buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity onPress={handleNewReading} style={styles.menuButton}>
            <LPMUDText style={styles.menuButtonText}>
              $HIC${'[ '} $HIW$NEW READING$NOR$ $HIC${' ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.menuButtonSubtext}>
              {'>'} Start a tarot reading
            </NeonText>
          </TouchableOpacity>

          {/* Oracle Chat - Unlocked when LLM + MBTI ready */}
          <TouchableOpacity
            onPress={handleOracleChat}
            disabled={!isOracleChatUnlocked}
            style={[styles.menuButton, styles.oracleChatButton, !isOracleChatUnlocked && styles.menuButtonDisabled]}
          >
            {isOracleChatUnlocked ? (
              <FlickerText color={NEON_COLORS.hiMagenta} style={styles.menuButtonText} flickerSpeed={120}>
                {'[ ⚡ ORACLE CHAT ⚡ ]'}
              </FlickerText>
            ) : (
              <LPMUDText style={styles.menuButtonText}>
                $HIK${'[ '} $HIK$🔒 ORACLE CHAT$NOR$ $HIK${' ]'}$NOR$
              </LPMUDText>
            )}
            <NeonText
              color={isOracleChatUnlocked ? NEON_COLORS.hiMagenta : NEON_COLORS.hiRed}
              style={styles.menuButtonSubtext}
            >
              {'>'} {oracleChatStatus}
            </NeonText>
          </TouchableOpacity>

          {/* Resume Reading - Premium only */}
          {isPremium && (
            <TouchableOpacity
              onPress={handleShowInProgressReadings}
              style={[styles.menuButton, inProgressReadings.length === 0 && styles.menuButtonDisabled]}
              disabled={inProgressReadings.length === 0}
            >
              <LPMUDText style={styles.menuButtonText}>
                $HIG${'[ '} $HIW$RESUME READING$NOR$ $HIG${' ]'}$NOR$ $HIY$[PRO]$NOR$
              </LPMUDText>
              <NeonText
                color={inProgressReadings.length === 0 ? NEON_COLORS.hiRed : NEON_COLORS.dimGreen}
                style={styles.menuButtonSubtext}
              >
                {'>'} {inProgressReadings.length === 0 ? 'No saved readings' : `${inProgressReadings.length} in-progress reading(s)`}
              </NeonText>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleChooseProfile} style={styles.menuButton}>
            <LPMUDText style={styles.menuButtonText}>
              $HIM${'[ '} $HIY$PROFILES$NOR$ $HIM${' ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimYellow} style={styles.menuButtonSubtext}>
              {'>'} {profiles.length === 0 ? 'Create your first profile' : `Manage ${profiles.length} profile(s)`}
            </NeonText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleViewReadings}
            style={[styles.menuButton, savedReadingsCount === 0 && styles.menuButtonDisabled]}
            disabled={savedReadingsCount === 0}
          >
            <LPMUDText style={styles.menuButtonText}>
              $HIG${'[ '} $HIW$PAST READINGS$NOR$ $HIG${' ]'}$NOR$
            </LPMUDText>
            <NeonText
              color={savedReadingsCount === 0 ? NEON_COLORS.hiRed : NEON_COLORS.dimGreen}
              style={styles.menuButtonSubtext}
            >
              {'>'} {savedReadingsCount === 0 ? 'No saved readings' : `${savedReadingsCount} saved reading(s)`}
            </NeonText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleViewDeck} style={styles.menuButton}>
            <LPMUDText style={styles.menuButtonText}>
              $HIB${'[ '} $HIW$VIEW DECK$NOR$ $HIB${' ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.menuButtonSubtext}>
              {'>'} Browse all 78 tarot cards
            </NeonText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleViewAchievements} style={styles.menuButton}>
            <LPMUDText style={styles.menuButtonText}>
              $HIY${'[ '} $HIW$ACHIEVEMENTS$NOR$ $HIY${' ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimYellow} style={styles.menuButtonSubtext}>
              {'>'} View your badges & progress
            </NeonText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleViewSettings} style={styles.menuButton}>
            <LPMUDText style={styles.menuButtonText}>
              $HIM${'[ '} $HIW$SETTINGS$NOR$ $HIM${' ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimMagenta} style={styles.menuButtonSubtext}>
              {'>'} Deep AGI, preferences, stats
            </NeonText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleViewStats} style={styles.menuButton}>
            <LPMUDText style={styles.menuButtonText}>
              $HIC${'[ '} $HIW$STATS$NOR$ $HIC${' ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.menuButtonSubtext}>
              {'>'} Streaks, insights, progress
            </NeonText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleInsights}
            style={[
              styles.menuButton,
              styles.insightsButton,
              !isPremiumActive && styles.menuButtonDisabled
            ]}
          >
            <LPMUDText style={styles.menuButtonText}>
              {isPremiumActive
                ? '$HIY$[ $HIW$✧ INSIGHTS ✧$NOR$ $HIY$]$NOR$'
                : '$WHT$[ ✧ INSIGHTS ✧ ]$NOR$'
              }
            </LPMUDText>
            <NeonText
              color={isPremiumActive ? NEON_COLORS.dimYellow : '#666666'}
              style={styles.menuButtonSubtext}
            >
              {isPremiumActive
                ? '> Pattern detector, daily card, analysis tools'
                : '> Premium feature'
              }
            </NeonText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleExitApp} style={styles.menuButton}>
            <LPMUDText style={styles.menuButtonText}>
              $HIR${'[ '} $HIW$EXIT APP$NOR$ $HIR${' ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.hiRed} style={styles.menuButtonSubtext}>
              {'>'} Backup & exit gracefully
            </NeonText>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Active profile display - bottom */}
      <View style={styles.profileBar}>
        <LPMUDText style={styles.profileText}>
          $HIY$ACTIVE PROFILE:$NOR${' '}
          {activeProfile ? (
            `$HIC$${activeProfile.name}$NOR$ | $HIM$${activeProfile.zodiacSign}$NOR$`
          ) : (
            '$HIR$NONE$NOR$'
          )}
        </LPMUDText>
      </View>

      {/* Exit prompt modal */}
      <ExitPrompt
        visible={showExitPrompt}
        onDismiss={() => setShowExitPrompt(false)}
        onExit={handleConfirmExit}
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
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 25 : 0,
    paddingBottom: 40,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 1,
  },
  gratitudeBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiGreen,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  gratitudeTitle: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  gratitudeText: {
    fontSize: 13,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  suggestionBox: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: NEON_COLORS.dimYellow,
  },
  suggestionTitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 8,
  },
  suggestionType: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  suggestionReason: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  motdBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.03)',
  },
  motdText: {
    fontSize: 13,
    fontFamily: 'monospace',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  menuContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    gap: 20,
  },
  menuButton: {
    padding: 20,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
  },
  oracleChatButton: {
    borderColor: NEON_COLORS.hiMagenta,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    shadowColor: NEON_COLORS.hiMagenta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  oracleChatEnhancedButton: {
    borderColor: NEON_COLORS.hiCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    shadowColor: NEON_COLORS.hiCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  insightsButton: {
    borderColor: NEON_COLORS.hiYellow,
    backgroundColor: 'rgba(255, 255, 0, 0.08)',
    shadowColor: NEON_COLORS.hiYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  menuButtonDisabled: {
    borderColor: NEON_COLORS.dimCyan,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0.5,
  },
  menuButtonText: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  menuButtonSubtext: {
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  profileBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    borderTopWidth: 2,
    borderTopColor: NEON_COLORS.dimCyan,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  profileText: {
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 16,
  },
});
