import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { MBTI_QUESTIONS, calculateMBTI } from '../utils/mbtiTest';
import { NeonText, LPMUDText, MatrixRain, ScanLines } from '../components/TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';
import { checkBiometricSupport, setPIN, setSecuritySettings, authenticateWithBiometrics } from '../utils/profileSecurity';
import { Alert } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * MBTI Personality Test Screen
 *
 * Features:
 * - 50-question MBTI battery across 4 dimensions (E/I, S/N, T/F, J/P)
 * - "Vibe Mode" checkbox to skip testing (with warning popup)
 * - Progress tracking
 * - Results calculation and storage
 *
 * Flow:
 * 1. User sees intro with vibe mode option
 * 2. If vibe mode checked → show warning popup
 * 3. If skip confirmed → proceed with basic profile
 * 4. If not skipped → complete 50 questions
 * 5. Calculate MBTI type and save to profile
 */

const MBTITestScreen = ({ navigation, route }) => {
  const { userProfile, onComplete } = route.params || {};

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // Changed to object to persist answers by question ID
  const [showIntro, setShowIntro] = useState(true);
  const [vibeModeChecked, setVibeModeChecked] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mbtiResult, setMbtiResult] = useState(null);

  const currentQuestion = MBTI_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / MBTI_QUESTIONS.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const currentAnswer = answers[currentQuestion.id]; // Get saved answer for current question

  const handleVibeModeToggle = () => {
    if (!vibeModeChecked) {
      // User is trying to enable vibe mode - show warning
      setShowSkipWarning(true);
    } else {
      // User is unchecking vibe mode - just toggle
      setVibeModeChecked(false);
    }
  };

  const handleSkipConfirm = async () => {
    // User confirmed they want to skip MBTI test
    setVibeModeChecked(true);
    setShowSkipWarning(false);

    // Proceed with basic profile (no MBTI type)
    if (onComplete) {
      // Callback flow
      onComplete({
        ...userProfile,
        mbtiType: null,
        vibeModeEnabled: true,
      });
      navigation.goBack();
    } else {
      // Direct flow - save profile without MBTI
      await saveProfileWithoutMBTI();
    }
  };

  /**
   * Navigate to Welcome after profile creation
   * Security can be set up later in Settings to avoid stuck alerts
   */
  function navigateToWelcome() {
    // Simple navigation - no complex prompts that can get stuck
    navigation.navigate('Welcome');
  }

  async function saveProfileWithoutMBTI() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const PROFILES_KEY = '@lunatiq_profiles';
      const ACTIVE_PROFILE_KEY = '@lunatiq_active_profile';

      // Load existing profiles
      const profilesData = await AsyncStorage.getItem(PROFILES_KEY);
      const profiles = profilesData ? JSON.parse(profilesData) : [];

      // Create new profile without MBTI (vibe mode)
      const newProfile = {
        id: Date.now().toString(),
        name: userProfile.profileName,
        birthdate: userProfile.birthdate,
        zodiacSign: userProfile.zodiacSign,
        chineseZodiac: userProfile.chineseZodiac,
        gender: userProfile.gender,
        mbtiType: null,
        vibeModeEnabled: true,
        createdAt: new Date().toISOString()
      };

      // Add to profiles array
      profiles.push(newProfile);
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

      // Set as active profile
      await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, newProfile.id);

      console.log('[MBTITest] Profile saved successfully');

      // Navigate to welcome - security can be set up later in Settings
      navigateToWelcome();
    } catch (error) {
      console.error('[MBTITest] Error saving profile:', error);
      navigation.navigate('Welcome');
    }
  }

  const handleSkipCancel = () => {
    // User wants to complete their profile
    setShowSkipWarning(false);
    setVibeModeChecked(false);
  };

  const handleStartTest = () => {
    if (vibeModeChecked) {
      // Should not happen, but safety check
      setShowSkipWarning(true);
    } else {
      setShowIntro(false);
    }
  };

  const handleAnswer = async (optionIndex) => {
    // Save answer by question ID (persists when navigating back)
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOptionIndex: optionIndex,
      },
    };
    setAnswers(newAnswers);

    // Auto-advance to next question if not on last question
    if (currentQuestionIndex < MBTI_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < MBTI_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    // Convert answers object to array for calculateMBTI
    const answersArray = Object.values(answers);
    const result = calculateMBTI(answersArray);

    // Show results screen
    setMbtiResult(result);
    setShowResults(true);
  };

  const handleResultsContinue = async () => {
    if (onComplete) {
      // Callback flow (when called from another screen)
      onComplete({
        ...userProfile,
        mbtiType: mbtiResult.type,
        mbtiScores: mbtiResult.scores,
        mbtiStrengths: mbtiResult.strengths,
        mbtiDescription: mbtiResult.description,
        vibeModeEnabled: false,
      });
      navigation.goBack();
    } else {
      // Direct flow (from profile setup) - save profile and navigate
      await saveProfileWithMBTI(mbtiResult);
    }
  };

  async function saveProfileWithMBTI(mbtiResult) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const PROFILES_KEY = '@lunatiq_profiles';
      const ACTIVE_PROFILE_KEY = '@lunatiq_active_profile';

      // Load existing profiles
      const profilesData = await AsyncStorage.getItem(PROFILES_KEY);
      const profiles = profilesData ? JSON.parse(profilesData) : [];

      // Create new profile with MBTI results
      const newProfile = {
        id: Date.now().toString(),
        name: userProfile.profileName,
        birthdate: userProfile.birthdate,
        zodiacSign: userProfile.zodiacSign,
        chineseZodiac: userProfile.chineseZodiac,
        gender: userProfile.gender,
        mbtiType: mbtiResult.type,
        mbtiScores: mbtiResult.scores,
        mbtiStrengths: mbtiResult.strengths,
        mbtiDescription: mbtiResult.description,
        vibeModeEnabled: false,
        createdAt: new Date().toISOString()
      };

      // Add to profiles array
      profiles.push(newProfile);
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

      // Set as active profile
      await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, newProfile.id);

      console.log('[MBTITest] Profile saved successfully');

      // Navigate to welcome - security can be set up later in Settings
      navigateToWelcome();
    } catch (error) {
      console.error('[MBTITest] Error saving profile:', error);
      navigation.navigate('Welcome');
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Don't remove answers - they persist!
    } else {
      setShowIntro(true);
    }
  };

  // MBTI Results Screen
  if (showResults && mbtiResult) {
    return (
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill}>
          <MatrixRain width={SCREEN_WIDTH} height={SCREEN_HEIGHT} speed={30} />
        </View>
        <ScanLines />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <LPMUDText style={styles.title}>
              $HIG${'>'} PERSONALITY ANALYSIS COMPLETE$NOR$
            </LPMUDText>
          </View>

          <View style={styles.resultsContainer}>
            <LPMUDText style={styles.mbtiType}>
              $HIC${mbtiResult.type}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.hiMagenta} style={styles.mbtiNickname}>
              {mbtiResult.description.nickname}
            </NeonText>
          </View>

          <View style={styles.infoBox}>
            <NeonText color={NEON_COLORS.hiWhite} style={styles.descriptionText}>
              {mbtiResult.description.core}
            </NeonText>
          </View>

          <View style={styles.tarotStyleBox}>
            <LPMUDText style={styles.sectionTitle}>
              $HIY${'>'} HOW THIS AFFECTS YOUR READINGS:$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.tarotStyleText}>
              {mbtiResult.description.tarotStyle}
            </NeonText>
          </View>

          <View style={styles.communicationBox}>
            <LPMUDText style={styles.sectionTitle}>
              $HIM${'>'} COMMUNICATION STYLE:$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.communicationText}>
              {mbtiResult.description.communicationPreference}
            </NeonText>
          </View>

          <TouchableOpacity
            onPress={handleResultsContinue}
            style={styles.continueButton}
          >
            <NeonText color={NEON_COLORS.hiGreen} style={styles.continueButtonText}>
              {'[ CONTINUE → ]'}
            </NeonText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (showIntro) {
    return (
      <View style={styles.container}>
        {/* Matrix rain background */}
        <View style={StyleSheet.absoluteFill}>
          <MatrixRain width={SCREEN_WIDTH} height={SCREEN_HEIGHT} speed={30} />
        </View>
        <ScanLines />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <LPMUDText style={styles.title}>
              $HIC${'>'} PERSONALITY PROFILE$NOR$
            </LPMUDText>
          </View>

          <View style={styles.infoBox}>
            <NeonText color={NEON_COLORS.hiWhite} style={styles.subtitle}>
              Complete this 50-question assessment to receive deeply personalized readings
              that speak your unique psychological language.
            </NeonText>
          </View>

          <View style={styles.benefitsContainer}>
            <LPMUDText style={styles.benefitTitle}>
              $HIY$WHAT YOU'LL GET:$NOR$
            </LPMUDText>
            <LPMUDText style={styles.benefitText}>
              $HIG$•$NOR$ Interpretations tailored to your cognitive patterns
            </LPMUDText>
            <LPMUDText style={styles.benefitText}>
              $HIG$•$NOR$ Communication style that resonates with how you process information
            </LPMUDText>
            <LPMUDText style={styles.benefitText}>
              $HIG$•$NOR$ Guidance that honors your natural strengths and blind spots
            </LPMUDText>
            <LPMUDText style={styles.benefitText}>
              $HIG$•$NOR$ Truly unique syntheses (no two readings ever the same)
            </LPMUDText>
          </View>

          <View style={styles.estimateContainer}>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.estimateText}>
              Estimated time: 8-12 minutes
            </NeonText>
          </View>

          {/* Vibe Mode Checkbox */}
          <TouchableOpacity
            style={styles.vibeModeContainer}
            onPress={handleVibeModeToggle}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, vibeModeChecked && styles.checkboxChecked]}>
              {vibeModeChecked && <NeonText color={NEON_COLORS.hiMagenta} style={styles.checkmark}>✓</NeonText>}
            </View>
            <View style={styles.vibeModeTextContainer}>
              <LPMUDText style={styles.vibeModeLabel}>
                $HIM$VIBE MODE$NOR$
              </LPMUDText>
              <NeonText color={NEON_COLORS.dimYellow} style={styles.vibeModeSubtext}>
                Skip personality test (less accurate readings)
              </NeonText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.startButton, vibeModeChecked && styles.startButtonDisabled]}
            onPress={handleStartTest}
            disabled={vibeModeChecked}
          >
            <LPMUDText style={styles.startButtonText}>
              {vibeModeChecked ? '$DIM$Uncheck Vibe Mode to Start$NOR$' : '$HIG$[ BEGIN ASSESSMENT ]$NOR$'}
            </LPMUDText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.goBack()}
          >
            <LPMUDText style={styles.skipButtonText}>
              $DIM$Maybe Later (tap to go back)$NOR$
            </LPMUDText>
          </TouchableOpacity>
        </ScrollView>

        {/* Skip Warning Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showSkipWarning}
          onRequestClose={() => setShowSkipWarning(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LPMUDText style={styles.modalTitle}>
                $HIR$⚠️ LESS ACCURATE READINGS$NOR$
              </LPMUDText>

              <NeonText color={NEON_COLORS.hiWhite} style={styles.modalText}>
                Skipping personality profiling means your readings will lack the deep
                personalization that makes them truly transformative.
              </NeonText>

              <NeonText color={NEON_COLORS.dimCyan} style={styles.modalText}>
                Without knowing your cognitive patterns, the synthesis will be:
              </NeonText>

              <LPMUDText style={styles.modalBullet}>$HIY$•$NOR$ Less accurate to your psychology</LPMUDText>
              <LPMUDText style={styles.modalBullet}>$HIY$•$NOR$ Less unique and personalized</LPMUDText>
              <LPMUDText style={styles.modalBullet}>$HIY$•$NOR$ More generic in tone and guidance</LPMUDText>

              <NeonText color={NEON_COLORS.dimYellow} style={styles.modalQuestion}>
                Are you sure you want to proceed with Vibe Mode?
              </NeonText>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonNo]}
                  onPress={handleSkipCancel}
                >
                  <LPMUDText style={styles.modalButtonTextNo}>
                    $HIG$[ NO, COMPLETE MY PROFILE ]$NOR$
                  </LPMUDText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonYes]}
                  onPress={handleSkipConfirm}
                >
                  <LPMUDText style={styles.modalButtonTextYes}>
                    $DIM$Yes, Proceed Anyway$NOR$
                  </LPMUDText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Matrix rain background */}
      <View style={StyleSheet.absoluteFill}>
        <MatrixRain width={SCREEN_WIDTH} height={SCREEN_HEIGHT} speed={30} />
      </View>
      <ScanLines />

      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <LPMUDText style={styles.backButtonText}>
              $HIC${'←'} PREVIOUS$NOR$
            </LPMUDText>
          </TouchableOpacity>

          <LPMUDText style={styles.progressText}>
            $HIY$Q {currentQuestionIndex + 1}/{MBTI_QUESTIONS.length}$NOR$
          </LPMUDText>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, currentQuestionIndex >= MBTI_QUESTIONS.length - 1 && styles.nextButtonDisabled]}
            disabled={currentQuestionIndex >= MBTI_QUESTIONS.length - 1}
          >
            <LPMUDText style={styles.nextButtonText}>
              $HIC$NEXT {'→'}$NOR$
            </LPMUDText>
          </TouchableOpacity>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Answer count indicator */}
        <View style={styles.answerCountContainer}>
          <NeonText color={answeredCount === MBTI_QUESTIONS.length ? NEON_COLORS.hiGreen : NEON_COLORS.dimYellow} style={styles.answerCountText}>
            {currentAnswer ? '✓ ' : '○ '}Answered: {answeredCount} / {MBTI_QUESTIONS.length}
          </NeonText>
        </View>

        <ScrollView contentContainerStyle={styles.questionScrollContent}>
          <LPMUDText style={styles.dimensionLabel}>
            $HIM${currentQuestion.dimension}$NOR$
          </LPMUDText>

          <NeonText color={NEON_COLORS.hiWhite} style={styles.questionText}>
            {currentQuestion.question}
          </NeonText>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  currentAnswer?.selectedOptionIndex === index && styles.optionButtonSelected
                ]}
                onPress={() => handleAnswer(index)}
                activeOpacity={0.8}
              >
                <LPMUDText style={[
                  styles.optionText,
                  currentAnswer?.selectedOptionIndex === index && styles.optionTextSelected
                ]}>
                  {currentAnswer?.selectedOptionIndex === index ? '$HIG$✓ ' : '$NOR$'}
                  {option.text}$NOR$
                </LPMUDText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit button - only show when all answered */}
          {answeredCount === MBTI_QUESTIONS.length && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <LPMUDText style={styles.submitButtonText}>
                $HIG$[ SUBMIT & COMPLETE PROFILE ]$NOR$
              </LPMUDText>
            </TouchableOpacity>
          )}

          {/* Navigation hint */}
          <View style={styles.hintBox}>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.hintText}>
              💡 Use PREVIOUS/NEXT to navigate freely. Your answers are saved automatically.
            </NeonText>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 25 : 0,
    paddingBottom: 40,
  },
  questionScrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccccff',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#e6e6ff',
    marginBottom: 8,
    lineHeight: 20,
  },
  estimateContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  estimateText: {
    fontSize: 14,
    color: '#ccccff',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  vibeModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccccff',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#9966ff',
    borderColor: '#9966ff',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  vibeModeTextContainer: {
    flex: 1,
  },
  vibeModeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  vibeModeSubtext: {
    fontSize: 12,
    color: '#ccccff',
    fontStyle: 'italic',
  },
  startButton: {
    backgroundColor: '#9966ff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#ccccff',
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20, // Moved down 12px (was 8)
  },
  backButton: {
    padding: 8,
    minWidth: 100,
  },
  backButtonText: {
    fontSize: 14,
    color: '#ccccff',
  },
  nextButton: {
    padding: 8,
    minWidth: 100,
    alignItems: 'flex-end',
  },
  nextButtonDisabled: {
    opacity: 0.3,
  },
  nextButtonText: {
    fontSize: 14,
    color: '#ccccff',
  },
  progressText: {
    fontSize: 14,
    color: '#ccccff',
    fontWeight: 'bold',
  },
  answerCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  answerCountText: {
    fontSize: 12,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9966ff',
    borderRadius: 2,
  },
  dimensionLabel: {
    fontSize: 12,
    color: '#9966ff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 32,
    lineHeight: 28,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(153, 102, 255, 0.2)',
    borderColor: '#9966ff',
    borderWidth: 3,
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
  },
  optionTextSelected: {
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#9966ff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  hintBox: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a0033',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#9966ff',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#ccccff',
    marginBottom: 12,
    lineHeight: 24,
  },
  modalBullet: {
    fontSize: 14,
    color: '#e6e6ff',
    marginBottom: 8,
    marginLeft: 12,
    lineHeight: 20,
  },
  modalQuestion: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonNo: {
    backgroundColor: '#9966ff',
  },
  modalButtonYes: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666699',
  },
  modalButtonTextNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalButtonTextYes: {
    fontSize: 16,
    color: '#ccccff',
  },
  // Results screen styles
  resultsContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
  },
  mbtiType: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 8,
    lineHeight: 60,
  },
  mbtiNickname: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  tarotStyleBox: {
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimYellow,
  },
  communicationBox: {
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimMagenta,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 18,
  },
  tarotStyleText: {
    fontSize: 14,
    lineHeight: 22,
  },
  communicationText: {
    fontSize: 14,
    lineHeight: 22,
  },
  continueButton: {
    borderWidth: 2,
    borderColor: NEON_COLORS.hiGreen,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MBTITestScreen;
