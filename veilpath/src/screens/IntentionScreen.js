/**
 * INTENTION SCREEN - Set reading intention
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { NeonText, LPMUDText, FlickerText, ScanLines } from '../components/TemporaryTextComponents';
import { NEON_COLORS } from '../components/TemporaryTextComponents';
import { validateIntention, critiqueIntentionWithLLM } from '../utils/intentionValidator';
import { FeatureGate } from '../utils/featureGate';
import UpgradePromptManager from '../utils/UpgradePromptManager';
import { isEnhancementEnabled } from '../utils/lazyLLM';

const SPREAD_TYPES = [
  {
    id: 'single_card',
    name: 'SINGLE CARD',
    description: 'One truth. Sharp and quick.',
    cardCount: 1,
    pattern: 'linear'
  },
  {
    id: 'three_card',
    name: 'PAST-PRESENT-FUTURE',
    description: "Where you've been. Where you are. Where we're going.",
    cardCount: 3,
    pattern: 'linear'
  },
  {
    id: 'daily',
    name: 'DAILY CHECK-IN',
    description: "What to embrace. What to avoid. What you'll receive.",
    cardCount: 3,
    pattern: 'linear'
  },
  {
    id: 'decision',
    name: 'DECISION TREE',
    description: "Two paths. I'll show you both. You choose.",
    cardCount: 6,
    pattern: 'tree'
  },
  {
    id: 'relationship',
    name: 'RELATIONSHIP',
    description: 'The connection. The chemistry. The truth beneath.',
    cardCount: 6,
    pattern: 'spatial'
  },
  {
    id: 'celtic_cross',
    name: 'CELTIC CROSS',
    description: 'Everything. The full story. Just you and me.',
    cardCount: 10,
    pattern: 'spatial'
  }
];

export default function IntentionScreen({ route, navigation }) {
  const { readingType, zodiacSign, birthdate } = route.params;
  const [intention, setIntention] = useState('');
  const [spreadType, setSpreadType] = useState('three_card');
  const [error, setError] = useState('');
  const [validation, setValidation] = useState(null);
  const [vibeMode, setVibeMode] = useState(false); // NEW: "Vibe with me!" mode

  // LLM Critique state
  const [llmCritique, setLlmCritique] = useState(null);
  const [isLoadingCritique, setIsLoadingCritique] = useState(false);
  const [llmAvailable, setLlmAvailable] = useState(false);

  const selectedSpread = SPREAD_TYPES.find(s => s.id === spreadType);

  // Check if LLM is available on mount
  useEffect(() => {
    async function checkLLM() {
      const enabled = await isEnhancementEnabled();
      setLlmAvailable(enabled);
    }
    checkLLM();
  }, []);

  // Get LLM critique for intention
  const getLLMCritique = async () => {
    if (!intention.trim() || isLoadingCritique) return;

    setIsLoadingCritique(true);
    setLlmCritique(null);

    try {
      const critique = await critiqueIntentionWithLLM(intention, { readingType });
      if (critique) {
        setLlmCritique(critique);
      }
    } catch (err) {
      console.error('[IntentionScreen] LLM critique error:', err);
    } finally {
      setIsLoadingCritique(false);
    }
  };

  // Apply improved version from LLM
  const applyImprovedVersion = () => {
    if (llmCritique?.improvedVersion) {
      setIntention(llmCritique.improvedVersion);
      setLlmCritique(null);
      setError('');
    }
  };

  // Validate intention on change (skip if vibe mode)
  useEffect(() => {
    if (vibeMode) {
      setValidation(null);
      return;
    }
    if (intention.trim().length > 0) {
      const result = validateIntention(intention);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [intention, vibeMode]);

  const handleContinue = () => {
    // Check if spread is locked
    if (!FeatureGate.isSpreadAvailable(spreadType)) {
      const spreadName = SPREAD_TYPES.find(s => s.id === spreadType)?.name || 'this spread';
      UpgradePromptManager.show(
        `Unlock ${spreadName}`,
        `${spreadName} is a premium feature. Upgrade to unlock all spreads!`,
        navigation
      );
      return;
    }

    // Vibe mode: use generic intention based on reading type
    if (vibeMode) {
      const genericIntentions = {
        career: 'What guidance do I need for my career right now?',
        romance: 'What do I need to know about my love life?',
        wellness: 'What should I focus on for my wellbeing?',
        finance: 'What guidance do I need about my finances?',
        personal_growth: 'What do I need for my personal growth?',
        decision: 'What do I need to know to make the right decision?',
        general: 'What guidance does the universe have for me today?',
        shadow_work: 'What shadow work do I need to address?'
      };

      const genericIntention = genericIntentions[readingType] || genericIntentions.general;

      navigation.navigate('CardDrawing', {
        readingType,
        zodiacSign,
        birthdate,
        intention: genericIntention,
        spreadType
      });
      return;
    }

    // Normal validation flow
    if (!intention.trim()) {
      setError('Intention required');
      return;
    }

    if (intention.trim().length < 3) {
      setError('Intention too short');
      return;
    }

    // Validate with 5W+H checker
    const validationResult = validateIntention(intention);

    // BLOCK if validation fails (score < 33%)
    if (!validationResult.valid) {
      setError('AGI REFUSES: Intention lacks context. See feedback below.');
      return;
    }

    // Navigate to card drawing
    navigation.navigate('CardDrawing', {
      readingType,
      zodiacSign,
      birthdate,
      intention: intention.trim(),
      spreadType
    });
  };

  return (
    <View style={styles.container}>
      <ScanLines />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <LPMUDText style={styles.headerTitle}>
            $HIC${'>'} TELL ME WHAT YOU NEED$NOR$
          </LPMUDText>
          <NeonText color={NEON_COLORS.dimYellow} style={styles.headerSubtitle}>
            {readingType.toUpperCase()} | {zodiacSign}
          </NeonText>
        </View>

        {/* Intention input */}
        <View style={styles.inputSection}>
          <LPMUDText style={styles.inputLabel}>
            $HIY$YOUR QUESTION:$NOR$
          </LPMUDText>

          <TextInput
            style={[
              styles.textInput,
              vibeMode && styles.textInputDisabled
            ]}
            value={intention}
            onChangeText={(text) => {
              setIntention(text);
              setError('');
            }}
            placeholder={vibeMode ? "Shhh. Just feel. I'll guide you." : "Ask me anything. I'm listening."}
            placeholderTextColor={vibeMode ? NEON_COLORS.dimMagenta : NEON_COLORS.dimCyan}
            multiline
            numberOfLines={4}
            maxLength={1000}
            editable={!vibeMode}
          />

          {/* Vibe Mode Checkbox */}
          <TouchableOpacity
            style={styles.vibeModeRow}
            onPress={() => {
              setVibeMode(!vibeMode);
              setError('');
            }}
          >
            <View style={[
              styles.checkbox,
              vibeMode && styles.checkboxChecked
            ]}>
              {vibeMode && (
                <NeonText color={NEON_COLORS.hiMagenta} style={styles.checkmark}>
                  ✓
                </NeonText>
              )}
            </View>
            <LPMUDText style={styles.vibeModeLabel}>
              {vibeMode ? '$HIM$' : '$DIM$'}[ ] Vibe with me!$NOR$ {vibeMode ? '(Question skipped)' : '(Skip the question)'}
            </LPMUDText>
          </TouchableOpacity>

          {/* 5W+H Validation Feedback */}
          {validation && (
            <View style={[
              styles.validationBox,
              validation.valid ? styles.validationGood : styles.validationPoor
            ]}>
              <View style={styles.validationHeader}>
                <NeonText
                  color={validation.score >= 0.67 ? NEON_COLORS.hiGreen : validation.score >= 0.33 ? NEON_COLORS.hiYellow : NEON_COLORS.hiRed}
                  style={styles.validationScore}
                >
                  5W+H SCORE: {Math.round(validation.score * 100)}%
                </NeonText>
                <NeonText
                  color={NEON_COLORS.dimCyan}
                  style={styles.validationElements}
                >
                  [{validation.present.join(', ').toUpperCase()}]
                </NeonText>
              </View>
              <LPMUDText style={styles.validationFeedback}>
                {validation.score >= 0.67 ? '$HIG$' : validation.score >= 0.33 ? '$HIY$' : '$HIR$'}
                {validation.feedback}
                $NOR$
              </LPMUDText>
            </View>
          )}

          {/* LLM Critique Button */}
          {llmAvailable && intention.trim().length > 10 && !vibeMode && (
            <TouchableOpacity
              style={[styles.critiqueButton, isLoadingCritique && styles.critiqueButtonDisabled]}
              onPress={getLLMCritique}
              disabled={isLoadingCritique}
            >
              <LPMUDText style={styles.critiqueButtonText}>
                {isLoadingCritique ? '$DIM$Analyzing...$NOR$' : '$HIM$[ GET AI CRITIQUE ]$NOR$'}
              </LPMUDText>
            </TouchableOpacity>
          )}

          {/* LLM Critique Display */}
          {llmCritique && (
            <View style={styles.critiqueBox}>
              <LPMUDText style={styles.critiqueTitle}>
                $HIM$AI CRITIQUE$NOR$
              </LPMUDText>

              <NeonText color={NEON_COLORS.hiWhite} style={styles.critiqueText}>
                {llmCritique.critique}
              </NeonText>

              {llmCritique.suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <LPMUDText style={styles.suggestionsTitle}>
                    $HIY$SUGGESTIONS:$NOR$
                  </LPMUDText>
                  {llmCritique.suggestions.map((suggestion, idx) => (
                    <NeonText key={idx} color={NEON_COLORS.dimCyan} style={styles.suggestionItem}>
                      {'\u2022'} {suggestion}
                    </NeonText>
                  ))}
                </View>
              )}

              {llmCritique.improvedVersion && (
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyImprovedVersion}
                >
                  <LPMUDText style={styles.applyButtonText}>
                    $HIG$[ USE IMPROVED VERSION ]$NOR$
                  </LPMUDText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {error && (
            <NeonText color={NEON_COLORS.hiRed} style={styles.errorText}>
              {'>'} {error}
            </NeonText>
          )}

          <NeonText color={NEON_COLORS.dimCyan} style={styles.charCount}>
            {intention.length} / 1000
          </NeonText>
        </View>

        {/* Spread selection */}
        <View style={styles.spreadSection}>
          <LPMUDText style={styles.spreadLabel}>
            $HIY$SPREAD TYPE:$NOR$
          </LPMUDText>

          <View style={styles.spreadList}>
            {SPREAD_TYPES.map((spread) => {
              const isLocked = !FeatureGate.isSpreadAvailable(spread.id);
              const isPremiumSpread = !['single_card', 'three_card', 'daily'].includes(spread.id);

              // Badge logic for that post-purchase dopamine hit:
              // - Premium spread + locked: 🔒 red [PRO]
              // - Premium spread + unlocked: green [PRO] ✨
              // - Free spread: no badge
              let badge = '';
              if (isPremiumSpread) {
                if (isLocked) {
                  badge = ' 🔒 $HIR$[PRO]$NOR$';
                } else {
                  badge = ' $HIG$[PRO]$NOR$';
                }
              }

              return (
              <TouchableOpacity
                key={spread.id}
                onPress={() => setSpreadType(spread.id)}
                style={[
                  styles.spreadCard,
                  spreadType === spread.id && styles.spreadCardSelected
                ]}
              >
                <View style={styles.spreadHeader}>
                  <LPMUDText style={styles.spreadName}>
                    {`${spreadType === spread.id ? '$HIC$' : '$NOR$'}${spread.name}${badge}$NOR$`}
                  </LPMUDText>
                  <NeonText
                    color={spreadType === spread.id ? NEON_COLORS.hiCyan : NEON_COLORS.dimCyan}
                    style={styles.cardCount}
                  >
                    [{spread.cardCount} CARDS]
                  </NeonText>
                </View>

                <NeonText
                  color={NEON_COLORS.dimWhite}
                  style={styles.spreadDescription}
                >
                  {spread.description}
                </NeonText>

                {spreadType === spread.id && (
                  <View style={styles.selectedIndicator}>
                    <NeonText color={NEON_COLORS.hiCyan} style={styles.selectedText}>
                      {'[ SELECTED ]'}
                    </NeonText>
                  </View>
                )}
              </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Continue button */}
        <TouchableOpacity
          onPress={handleContinue}
          style={styles.continueButton}
        >
          <FlickerText
            color={NEON_COLORS.hiGreen}
            style={styles.continueButtonText}
            flickerSpeed={150}
          >
            {'[ DRAW CARDS ]'}
          </FlickerText>
        </TouchableOpacity>

        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <NeonText color={NEON_COLORS.dimCyan} style={styles.backButtonText}>
            {'[ ← BACK ]'}
          </NeonText>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: NEON_COLORS.dimCyan,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 5,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 10,
    lineHeight: 16,
  },
  textInput: {
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    color: NEON_COLORS.hiWhite,
    backgroundColor: '#000000',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  charCount: {
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 5,
    textAlign: 'right',
  },
  validationBox: {
    marginTop: 12,
    padding: 12,
    borderWidth: 2,
    backgroundColor: '#000000',
  },
  validationGood: {
    borderColor: NEON_COLORS.hiGreen,
  },
  validationPoor: {
    borderColor: NEON_COLORS.hiRed,
  },
  validationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: NEON_COLORS.dimCyan,
  },
  validationScore: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  validationElements: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  validationFeedback: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  spreadSection: {
    marginBottom: 25,
  },
  spreadLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 10,
    lineHeight: 16,
  },
  spreadList: {
    gap: 10,
  },
  spreadCard: {
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    padding: 12,
    backgroundColor: '#000000',
  },
  spreadCardSelected: {
    borderColor: NEON_COLORS.hiCyan,
    borderWidth: 3,
  },
  spreadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spreadName: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    lineHeight: 16,
  },
  cardCount: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  spreadDescription: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  selectedIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: NEON_COLORS.hiCyan,
  },
  selectedText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  continueButton: {
    padding: 18,
    borderWidth: 3,
    borderColor: NEON_COLORS.hiGreen,
    alignItems: 'center',
    marginBottom: 15,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  backButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  spacer: {
    height: 40,
  },
  textInputDisabled: {
    opacity: 0.5,
    backgroundColor: '#0a000a',
  },
  vibeModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimMagenta,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    borderColor: NEON_COLORS.hiMagenta,
    backgroundColor: '#1a001a',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  vibeModeLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
    flex: 1,
  },
  // LLM Critique styles
  critiqueButton: {
    marginTop: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiMagenta,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    alignItems: 'center',
  },
  critiqueButtonDisabled: {
    opacity: 0.5,
  },
  critiqueButtonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  critiqueBox: {
    marginTop: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiMagenta,
    backgroundColor: 'rgba(30, 0, 30, 0.8)',
  },
  critiqueTitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  critiqueText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
    marginBottom: 10,
  },
  suggestionsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: NEON_COLORS.dimMagenta,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  suggestionItem: {
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
    marginLeft: 8,
    marginBottom: 4,
  },
  applyButton: {
    marginTop: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiGreen,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
