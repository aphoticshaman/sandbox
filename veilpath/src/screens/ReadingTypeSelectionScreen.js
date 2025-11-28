/**
 * Reading Type Selection Screen - VeilPath WitchTok x Victorian Gothic
 * Choose spread type before reading with real-time intention analysis
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useUserStore } from '../stores/userStore';
import { MBTISelector } from '../components/MBTISelector';
import { validateIntention } from '../utils/intentionValidator';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

// Custom debounce hook
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

const SPREAD_TYPES = [
  {
    id: 'single',
    name: 'Single Card',
    icon: '🎴',
    description: 'Quick insight for a specific question',
    cards: 1,
    xp: 10,
  },
  {
    id: 'three-card',
    name: 'Three-Card Spread',
    icon: '🔮',
    description: 'Past, Present, and Future guidance',
    cards: 3,
    xp: 20,
  },
  {
    id: 'celtic-cross',
    name: 'Celtic Cross',
    icon: '✨',
    description: 'Deep dive into a complex situation - 10 cards',
    cards: 10,
    xp: 100,
    disabled: false,
  },
];

export default function ReadingTypeSelectionScreen({ navigation, route }) {
  const { preselectedType } = route.params || {};
  const [intention, setIntention] = useState('');
  const [selectedType, setSelectedType] = useState(preselectedType || null);

  // Intention analysis state
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const analysisOpacity = useRef(new Animated.Value(0)).current;

  // MBTI reminder modal
  const [showMBTIModal, setShowMBTIModal] = useState(false);
  const user = useUserStore();
  const mbtiType = user.profile?.mbtiType;
  const setMBTIType = user.setMBTIType;

  // Show MBTI reminder if not set (once per session)
  const mbtiReminderShown = useRef(false);
  useEffect(() => {
    if (!mbtiType && !mbtiReminderShown.current) {
      const timer = setTimeout(() => {
        setShowMBTIModal(true);
        mbtiReminderShown.current = true;
      }, 1500); // Show after 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [mbtiType]);

  // Analyze intention with LLM
  const analyzeIntention = useCallback(async (text) => {
    if (!text || text.trim().length < 20) {
      setAnalysis(null);
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-intention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, spreadType: selectedType }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        setAnalysis(data.data);
        // Animate in
        Animated.timing(analysisOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } catch (err) {
      console.error('[IntentionAnalysis] Error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [selectedType, analysisOpacity]);

  // Debounced analysis (2.5 seconds after stop typing)
  const debouncedAnalyze = useDebounce(analyzeIntention, 2500);

  // Trigger analysis when intention changes
  useEffect(() => {
    if (intention.trim().length >= 20) {
      debouncedAnalyze(intention);
    } else {
      setAnalysis(null);
    }
  }, [intention, debouncedAnalyze]);

  // Get analysis color based on score
  const getAnalysisColor = () => {
    if (!analysis) return COSMIC.crystalPink;
    switch (analysis.color) {
      case 'red': return '#FF4444';
      case 'yellow': return '#FFD700';
      case 'green': return '#00FF88';
      default: return COSMIC.crystalPink;
    }
  };

  const getAnalysisBgColor = () => {
    if (!analysis) return 'rgba(255, 255, 255, 0.05)';
    switch (analysis.color) {
      case 'red': return 'rgba(255, 68, 68, 0.15)';
      case 'yellow': return 'rgba(255, 215, 0, 0.15)';
      case 'green': return 'rgba(0, 255, 136, 0.15)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  const handleSelectType = (type) => {
    if (type.disabled) return;
    setSelectedType(type.id);
  };

  const handleMBTISelect = (type) => {
    setMBTIType(type, 'self-selected');
    setShowMBTIModal(false);
  };

  const handleMBTISkip = () => {
    setShowMBTIModal(false);
  };

  // Check if intention is valid enough to proceed
  const isIntentionValid = useCallback(() => {
    // Must have minimum length
    if (!intention || intention.trim().length < 20) {
      return false;
    }

    // If we have LLM analysis, use its result
    if (analysis) {
      // Green = definitely valid, Yellow = acceptable, Red = blocked
      return analysis.color !== 'red';
    }

    // Fallback to local validation if LLM analysis isn't available
    const localValidation = validateIntention(intention);
    return localValidation.valid;
  }, [intention, analysis]);

  const handleBeginReading = () => {
    if (!selectedType) return;
    if (!isIntentionValid()) return;

    const type = SPREAD_TYPES.find(t => t.id === selectedType);
    if (!type || type.disabled) return;

    if (selectedType === 'single') {
      navigation.navigate('SingleCardReading', { intention });
    } else if (selectedType === 'three-card') {
      navigation.navigate('ThreeCardSpread', { intention });
    } else if (selectedType === 'celtic-cross') {
      navigation.navigate('CelticCrossSpread', { intention });
    }
  };

  const getButtonTitle = () => {
    if (!selectedType) return 'Select a Spread';
    if (!intention || intention.trim().length < 20) return 'Enter Your Intention First';
    if (analysis && analysis.color === 'red') return 'Improve Your Intention';
    if (analyzing) return 'Analyzing...';
    const spread = SPREAD_TYPES.find(t => t.id === selectedType);
    return spread ? `✨ Begin ${spread.name}` : 'Select a Spread';
  };

  const canBeginReading = selectedType && isIntentionValid() && !analyzing;

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <SectionHeader
        icon="🌙"
        title="Choose Your Reading"
        subtitle="Select a spread and set your intention"
      />

      {/* Intention Input */}
      <VictorianCard style={styles.intentionCard} glowColor={COSMIC.deepAmethyst}>
        <Text style={styles.inputLabel}>Set Your Intention</Text>
        <Text style={styles.inputSubtext}>
          What's on your mind? What do you want to explore, reflect on, or understand?
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., I'm facing a career decision and want clarity about my path forward... I've been feeling disconnected from my purpose lately..."
          placeholderTextColor={`${COSMIC.crystalPink}60`}
          value={intention}
          onChangeText={setIntention}
          multiline
          numberOfLines={5}
          maxLength={1000}
          textAlignVertical="top"
        />
        <View style={styles.intentionFooter}>
          <Text style={styles.intentionNote}>
            ✨ Your intention grounds Vera's wisdom in YOUR journey
          </Text>
          <Text style={styles.charCount}>{intention.length}/1000</Text>
        </View>

        {/* Real-time Intention Analysis */}
        {(analyzing || analysis) && (
          <Animated.View
            style={[
              styles.analysisBox,
              { backgroundColor: getAnalysisBgColor(), borderColor: getAnalysisColor(), opacity: analyzing ? 0.7 : analysisOpacity },
            ]}
          >
            {analyzing ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator size="small" color={COSMIC.etherealCyan} />
                <Text style={styles.analyzingText}>Vera is sensing your intention...</Text>
              </View>
            ) : analysis && (
              <>
                {/* Score & Color Header */}
                <View style={styles.analysisHeader}>
                  <View style={[styles.scoreBadge, { backgroundColor: getAnalysisColor() }]}>
                    <Text style={styles.scoreText}>{analysis.overall_score}/10</Text>
                  </View>
                  <Text style={[styles.analysisStatus, { color: getAnalysisColor() }]}>
                    {analysis.color === 'red' && '⚠️ Needs More Grounding'}
                    {analysis.color === 'yellow' && '🌟 Good Start'}
                    {analysis.color === 'green' && '✨ Excellent Intention'}
                  </Text>
                </View>

                {/* 5W+H Progress */}
                {analysis.fiveWH && (
                  <View style={styles.fiveWhSection}>
                    <Text style={styles.fiveWhLabel}>5W+H Completeness:</Text>
                    <View style={styles.fiveWhTags}>
                      {['who', 'what', 'when', 'where', 'why', 'how'].map((w) => (
                        <View
                          key={w}
                          style={[
                            styles.whTag,
                            analysis.fiveWH.present?.includes(w) ? styles.whTagPresent : styles.whTagMissing,
                          ]}
                        >
                          <Text style={[
                            styles.whTagText,
                            analysis.fiveWH.present?.includes(w) && styles.whTagTextPresent,
                          ]}>
                            {w.toUpperCase()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Suggestion */}
                {analysis.suggestion && (
                  <View style={styles.suggestionBox}>
                    <Text style={styles.suggestionLabel}>💡 Suggestion:</Text>
                    <Text style={styles.suggestionText}>{analysis.suggestion}</Text>
                  </View>
                )}

                {/* Encouragement */}
                {analysis.encouragement && (
                  <Text style={styles.encouragementText}>"{analysis.encouragement}"</Text>
                )}

                {/* Ready indicator */}
                {analysis.ready && (
                  <View style={styles.readyBadge}>
                    <Text style={styles.readyText}>✓ Ready for a powerful reading</Text>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        )}
      </VictorianCard>

      <CosmicDivider />

      {/* MBTI Reminder Modal */}
      <Modal
        visible={showMBTIModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMBTIModal(false)}
      >
        <View style={styles.mbtiModalOverlay}>
          <View style={styles.mbtiModalContainer}>
            <View style={styles.mbtiModalHeader}>
              <Text style={styles.mbtiModalIcon}>🔮</Text>
              <Text style={styles.mbtiModalTitle}>Enhance Your Readings</Text>
              <Text style={styles.mbtiModalSubtitle}>
                Your personality type helps Vera tailor interpretations to YOUR unique way of seeing the world.
              </Text>
            </View>
            <MBTISelector
              onSelect={handleMBTISelect}
              onSkip={handleMBTISkip}
              selectedType={mbtiType}
            />
          </View>
        </View>
      </Modal>

      {/* Spread Types */}
      <Text style={styles.sectionTitle}>Available Spreads</Text>

      {SPREAD_TYPES.map((spread) => (
        <TouchableOpacity
          key={spread.id}
          onPress={() => handleSelectType(spread)}
          disabled={spread.disabled}
        >
          <VictorianCard
            style={[
              styles.spreadCard,
              selectedType === spread.id && styles.spreadCardSelected,
              spread.disabled && styles.spreadCardDisabled,
            ]}
            glowColor={selectedType === spread.id ? COSMIC.candleFlame : undefined}
            showCorners={selectedType === spread.id}
          >
            <View style={styles.spreadContent}>
              <Text style={styles.spreadIcon}>{spread.icon}</Text>
              <View style={styles.spreadInfo}>
                <Text style={[
                  styles.spreadName,
                  selectedType === spread.id && styles.spreadNameSelected
                ]}>
                  {spread.name}
                </Text>
                <Text style={styles.spreadDescription}>{spread.description}</Text>
                <View style={styles.spreadMeta}>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaText}>{spread.cards} cards</Text>
                  </View>
                  <View style={[styles.metaBadge, styles.xpBadge]}>
                    <Text style={styles.xpText}>{spread.xp} XP</Text>
                  </View>
                </View>
              </View>
              {selectedType === spread.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
          </VictorianCard>
        </TouchableOpacity>
      ))}

      {/* Begin Button */}
      <TouchableOpacity
        style={[styles.beginButton, !canBeginReading && styles.beginButtonDisabled]}
        onPress={handleBeginReading}
        disabled={!canBeginReading}
      >
        <Text style={[styles.beginButtonText, !canBeginReading && styles.beginButtonTextDisabled]}>
          {getButtonTitle()}
        </Text>
      </TouchableOpacity>

      {/* Intention requirement notice */}
      {selectedType && !isIntentionValid() && (
        <Text style={styles.intentionRequiredNotice}>
          {intention.trim().length < 20
            ? '📝 Please describe your question or situation in at least a few sentences'
            : analysis?.color === 'red'
            ? '⚠️ Your intention needs more detail for a meaningful reading'
            : 'Vera needs context to guide you'}
        </Text>
      )}
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  intentionCard: {
    padding: 20,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  inputSubtext: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    marginBottom: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COSMIC.moonGlow,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  intentionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  intentionNote: {
    fontSize: 12,
    color: COSMIC.etherealCyan,
    fontStyle: 'italic',
    flex: 1,
  },
  charCount: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
    marginLeft: 12,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 14,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  spreadCard: {
    marginBottom: 12,
    padding: 18,
  },
  spreadCardSelected: {
    borderColor: COSMIC.candleFlame,
    borderWidth: 3,
  },
  spreadCardDisabled: {
    opacity: 0.5,
  },
  spreadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spreadIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  spreadInfo: {
    flex: 1,
  },
  spreadName: {
    fontSize: 17,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  spreadNameSelected: {
    color: COSMIC.candleFlame,
  },
  spreadDescription: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    marginBottom: 10,
    lineHeight: 20,
    opacity: 0.9,
  },
  spreadMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaBadge: {
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    fontWeight: '600',
  },
  xpBadge: {
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
  },
  xpText: {
    fontSize: 11,
    color: COSMIC.candleFlame,
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 24,
    color: COSMIC.candleFlame,
    fontWeight: '700',
    marginLeft: 10,
  },

  beginButton: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  beginButtonDisabled: {
    backgroundColor: 'rgba(184, 134, 11, 0.3)',
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  beginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  beginButtonTextDisabled: {
    color: COSMIC.crystalPink,
    opacity: 0.5,
  },
  intentionRequiredNotice: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    opacity: 0.9,
  },

  // Intention Analysis Box Styles
  analysisBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: {
    fontSize: 13,
    color: COSMIC.etherealCyan,
    fontStyle: 'italic',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  analysisStatus: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  fiveWhSection: {
    marginBottom: 14,
  },
  fiveWhLabel: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fiveWhTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  whTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  whTagPresent: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: '#00FF88',
  },
  whTagMissing: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  whTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  whTagTextPresent: {
    color: '#00FF88',
  },
  suggestionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  suggestionLabel: {
    fontSize: 11,
    color: COSMIC.candleFlame,
    fontWeight: '700',
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    lineHeight: 20,
  },
  encouragementText: {
    fontSize: 12,
    color: COSMIC.etherealCyan,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  readyBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  readyText: {
    fontSize: 13,
    color: '#00FF88',
    fontWeight: '700',
  },

  // MBTI Modal Styles
  mbtiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 25, 0.95)',
    justifyContent: 'center',
  },
  mbtiModalContainer: {
    backgroundColor: COSMIC.midnightVoid,
    marginHorizontal: 16,
    borderRadius: 20,
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.4)',
    overflow: 'hidden',
  },
  mbtiModalHeader: {
    padding: 20,
    paddingBottom: 0,
    alignItems: 'center',
  },
  mbtiModalIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  mbtiModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  mbtiModalSubtitle: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
});
