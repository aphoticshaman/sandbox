/**
 * INSIGHTS SCREEN - Premium analysis tools
 *
 * Features:
 * - Pattern Detector: Find recurring cards/themes in history
 * - Weekly Digest: Summarize past 7 days of readings
 * - Spread Recommender: Suggest best spread for a question
 * - Daily Card: Personalized daily draw + message
 * - 3D Semantic Visualizer: See cards in meaning-space
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NeonText, LPMUDText, MatrixRain, FlickerText, GlitchText } from '../components/TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';
import { CARD_DATABASE } from '../data/cardDatabase';
import { initializeLLM, isEnhancementEnabled } from '../utils/lazyLLM';
import { qRandom } from '../utils/quantumRNG';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const READINGS_KEY = '@lunatiq_saved_readings';
const PROFILES_KEY = '@lunatiq_profiles';
const ACTIVE_PROFILE_KEY = '@lunatiq_active_profile';
const DAILY_CARD_KEY = '@lunatiq_daily_card';

export default function InsightsScreen({ navigation }) {
  const [isLLMAvailable, setIsLLMAvailable] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTool, setLoadingTool] = useState(null);
  const [result, setResult] = useState(null);
  const [spreadQuestion, setSpreadQuestion] = useState('');
  const [dailyCard, setDailyCard] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Check premium features availability
      const llmEnabled = await isEnhancementEnabled();
      setIsLLMAvailable(llmEnabled);

      // Load profile
      const profilesData = await AsyncStorage.getItem(PROFILES_KEY);
      const activeId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
      if (profilesData && activeId) {
        const profiles = JSON.parse(profilesData);
        const profile = profiles.find(p => p.id === activeId);
        setActiveProfile(profile);
      }

      // Load readings
      const readingsData = await AsyncStorage.getItem(READINGS_KEY);
      if (readingsData) {
        setReadings(JSON.parse(readingsData));
      }

      // Check for today's daily card
      const dailyData = await AsyncStorage.getItem(DAILY_CARD_KEY);
      if (dailyData) {
        const { date, card, insight } = JSON.parse(dailyData);
        const today = new Date().toDateString();
        if (date === today) {
          setDailyCard({ card, insight });
        }
      }
    } catch (error) {
      console.error('[Insights] Error loading data:', error);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // PATTERN DETECTOR
  // ═══════════════════════════════════════════════════════════

  const handlePatternDetector = async () => {
    if (readings.length < 3) {
      Alert.alert('Not Enough Data', 'Complete at least 3 readings to detect patterns.');
      return;
    }

    setLoadingTool('pattern');
    setIsLoading(true);
    setResult(null);

    try {
      // Analyze card frequency
      const cardCounts = {};
      const suitCounts = { Wands: 0, Cups: 0, Swords: 0, Pentacles: 0, Major: 0 };
      const reversedCount = { total: 0, reversed: 0 };

      readings.forEach(reading => {
        if (reading.cards) {
          reading.cards.forEach(card => {
            const cardData = CARD_DATABASE[card.cardIndex];
            if (cardData) {
              // Count card appearances
              cardCounts[cardData.name] = (cardCounts[cardData.name] || 0) + 1;

              // Count suits
              if (cardData.arcana === 'Major') {
                suitCounts.Major++;
              } else if (cardData.suit) {
                suitCounts[cardData.suit]++;
              }

              // Count reversals
              reversedCount.total++;
              if (card.reversed) reversedCount.reversed++;
            }
          });
        }
      });

      // Find most frequent cards
      const sortedCards = Object.entries(cardCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Find dominant suit
      const dominantSuit = Object.entries(suitCounts)
        .sort((a, b) => b[1] - a[1])[0];

      // Generate LLM insight if available
      let llmInsight = '';
      if (isLLMAvailable) {
        const context = await initializeLLM();
        if (context) {
          const prompt = `You are a tarot pattern analyst. The user has completed ${readings.length} readings.

Most frequent cards: ${sortedCards.map(([name, count]) => `${name} (${count}x)`).join(', ')}
Dominant energy: ${dominantSuit[0]} (${dominantSuit[1]} cards)
Reversal rate: ${Math.round((reversedCount.reversed / reversedCount.total) * 100)}%
User MBTI: ${activeProfile?.mbtiType || 'Unknown'}

In 2-3 sentences, explain what patterns you see and what they might mean for this person. Be specific and insightful.

Analysis:`;

          const response = await context.completion({
            prompt,
            temperature: 0.7,
            max_tokens: 100,
            stop: ['\n\n']
          });

          llmInsight = response.text?.trim() || '';
        }
      }

      setResult({
        type: 'pattern',
        topCards: sortedCards,
        dominantSuit,
        reversalRate: Math.round((reversedCount.reversed / reversedCount.total) * 100),
        totalReadings: readings.length,
        llmInsight
      });

    } catch (error) {
      console.error('[Insights] Pattern detection error:', error);
      Alert.alert('Error', 'Failed to analyze patterns.');
    } finally {
      setIsLoading(false);
      setLoadingTool(null);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // WEEKLY DIGEST
  // ═══════════════════════════════════════════════════════════

  const handleWeeklyDigest = async () => {
    // Get readings from past 7 days
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weekReadings = readings.filter(r => {
      const readingDate = new Date(r.timestamp || r.date).getTime();
      return readingDate >= oneWeekAgo;
    });

    if (weekReadings.length === 0) {
      Alert.alert('No Recent Readings', 'No readings found from the past 7 days.');
      return;
    }

    setLoadingTool('weekly');
    setIsLoading(true);
    setResult(null);

    try {
      // Collect all cards from the week
      const weekCards = [];
      weekReadings.forEach(reading => {
        if (reading.cards) {
          reading.cards.forEach(card => {
            const cardData = CARD_DATABASE[card.cardIndex];
            if (cardData) {
              weekCards.push(cardData.name);
            }
          });
        }
      });

      let llmInsight = '';
      if (isLLMAvailable && weekCards.length > 0) {
        const context = await initializeLLM();
        if (context) {
          const prompt = `You are a tarot weekly digest creator. Summarize this week's readings.

Readings this week: ${weekReadings.length}
Cards drawn: ${weekCards.join(', ')}
User MBTI: ${activeProfile?.mbtiType || 'Unknown'}
User zodiac: ${activeProfile?.zodiacSign || 'Unknown'}

In 2-3 sentences, summarize the week's themes and suggest a focus for the coming week. Be encouraging but honest.

Weekly Summary:`;

          const response = await context.completion({
            prompt,
            temperature: 0.7,
            max_tokens: 120,
            stop: ['\n\n']
          });

          llmInsight = response.text?.trim() || '';
        }
      }

      setResult({
        type: 'weekly',
        readingCount: weekReadings.length,
        cardCount: weekCards.length,
        llmInsight
      });

    } catch (error) {
      console.error('[Insights] Weekly digest error:', error);
      Alert.alert('Error', 'Failed to generate weekly digest.');
    } finally {
      setIsLoading(false);
      setLoadingTool(null);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // SPREAD RECOMMENDER
  // ═══════════════════════════════════════════════════════════

  const handleSpreadRecommender = async () => {
    if (!spreadQuestion.trim()) {
      Alert.alert('Enter Question', 'Please enter your question first.');
      return;
    }

    if (!isLLMAvailable) {
      Alert.alert('Premium Required', 'Upgrade to Premium to unlock this feature.');
      return;
    }

    setLoadingTool('spread');
    setIsLoading(true);
    setResult(null);

    try {
      const context = await initializeLLM();
      if (context) {
        const prompt = `You are a tarot spread advisor. Recommend the best spread for this question.

Available spreads:
1. Single Card - Quick insight, yes/no questions
2. Three Card - Past/Present/Future or Situation/Action/Outcome
3. Celtic Cross - Deep comprehensive analysis
4. Decision Point - Choosing between options
5. Relationship - Understanding dynamics between people
6. Shadow Self - Inner work, unconscious patterns
7. Wheel of the Year - Long-term cycles and timing
8. Astrological - Life domains and planetary influences

User's question: "${spreadQuestion}"
User MBTI: ${activeProfile?.mbtiType || 'Unknown'}

Recommend ONE spread and explain why in 1-2 sentences. Format: "SPREAD NAME: explanation"

Recommendation:`;

        const response = await context.completion({
          prompt,
          temperature: 0.6,
          max_tokens: 80,
          stop: ['\n\n']
        });

        setResult({
          type: 'spread',
          question: spreadQuestion,
          recommendation: response.text?.trim() || 'Unable to generate recommendation'
        });
      }
    } catch (error) {
      console.error('[Insights] Spread recommender error:', error);
      Alert.alert('Error', 'Failed to get spread recommendation.');
    } finally {
      setIsLoading(false);
      setLoadingTool(null);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // DAILY CARD
  // ═══════════════════════════════════════════════════════════

  const handleDailyCard = async () => {
    // Check if already drawn today
    const today = new Date().toDateString();
    const dailyData = await AsyncStorage.getItem(DAILY_CARD_KEY);
    if (dailyData) {
      const { date } = JSON.parse(dailyData);
      if (date === today && dailyCard) {
        // Already have today's card, just show it
        setResult({
          type: 'daily',
          card: dailyCard.card,
          insight: dailyCard.insight
        });
        return;
      }
    }

    setLoadingTool('daily');
    setIsLoading(true);
    setResult(null);

    try {
      // Draw random card using quantum RNG
      const cardIndex = Math.floor(qRandom() * 78);
      const isReversed = qRandom() > 0.7;
      const cardData = CARD_DATABASE[cardIndex];

      let insight = '';
      if (isLLMAvailable) {
        const context = await initializeLLM();
        if (context) {
          const prompt = `You are giving a personalized daily tarot message.

Today's card: ${cardData.name}${isReversed ? ' (Reversed)' : ''}
User MBTI: ${activeProfile?.mbtiType || 'Unknown'}
User zodiac: ${activeProfile?.zodiacSign || 'Unknown'}

Give a brief, personalized morning message (2-3 sentences) that connects this card to the user's day ahead. Be warm but not fluffy. Reference their MBTI traits if available.

Daily Message:`;

          const response = await context.completion({
            prompt,
            temperature: 0.8,
            max_tokens: 80,
            stop: ['\n\n']
          });

          insight = response.text?.trim() || '';
        }
      } else {
        insight = `${cardData.name} invites you to ${isReversed ? 'reflect on blockages' : 'embrace opportunities'} today.`;
      }

      // Save for today
      const cardResult = {
        cardIndex,
        name: cardData.name,
        reversed: isReversed
      };

      await AsyncStorage.setItem(DAILY_CARD_KEY, JSON.stringify({
        date: today,
        card: cardResult,
        insight
      }));

      setDailyCard({ card: cardResult, insight });
      setResult({
        type: 'daily',
        card: cardResult,
        insight
      });

    } catch (error) {
      console.error('[Insights] Daily card error:', error);
      Alert.alert('Error', 'Failed to draw daily card.');
    } finally {
      setIsLoading(false);
      setLoadingTool(null);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 3D SEMANTIC VISUALIZER
  // ═══════════════════════════════════════════════════════════

  const handle3DVisualizer = () => {
    // Navigate to Semantic Visualizer screen
    navigation.navigate('SemanticVisualizer');
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  const renderResult = () => {
    if (!result) return null;

    switch (result.type) {
      case 'pattern':
        return (
          <View style={styles.resultBox}>
            <LPMUDText style={styles.resultTitle}>
              $HIM${'>'} PATTERN ANALYSIS$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.resultStats}>
              {result.totalReadings} readings analyzed
            </NeonText>

            <LPMUDText style={styles.resultSubtitle}>
              $HIY$Top Recurring Cards:$NOR$
            </LPMUDText>
            {result.topCards.map(([name, count], i) => (
              <NeonText key={name} color={NEON_COLORS.hiWhite} style={styles.resultItem}>
                {i + 1}. {name} - {count}x
              </NeonText>
            ))}

            <LPMUDText style={styles.resultSubtitle}>
              $HIY$Dominant Energy:$NOR$ {result.dominantSuit[0]}
            </LPMUDText>
            <LPMUDText style={styles.resultSubtitle}>
              $HIY$Reversal Rate:$NOR$ {result.reversalRate}%
            </LPMUDText>

            {result.llmInsight && (
              <View style={styles.llmInsightBox}>
                <NeonText color={NEON_COLORS.hiGreen} style={styles.llmInsightText}>
                  {result.llmInsight}
                </NeonText>
              </View>
            )}
          </View>
        );

      case 'weekly':
        return (
          <View style={styles.resultBox}>
            <LPMUDText style={styles.resultTitle}>
              $HIM${'>'} WEEKLY DIGEST$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.resultStats}>
              {result.readingCount} readings | {result.cardCount} cards drawn
            </NeonText>

            {result.llmInsight && (
              <View style={styles.llmInsightBox}>
                <NeonText color={NEON_COLORS.hiGreen} style={styles.llmInsightText}>
                  {result.llmInsight}
                </NeonText>
              </View>
            )}
          </View>
        );

      case 'spread':
        return (
          <View style={styles.resultBox}>
            <LPMUDText style={styles.resultTitle}>
              $HIM${'>'} SPREAD RECOMMENDATION$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.resultStats}>
              For: "{result.question}"
            </NeonText>

            <View style={styles.llmInsightBox}>
              <NeonText color={NEON_COLORS.hiGreen} style={styles.llmInsightText}>
                {result.recommendation}
              </NeonText>
            </View>
          </View>
        );

      case 'daily':
        return (
          <View style={styles.resultBox}>
            <LPMUDText style={styles.resultTitle}>
              $HIM${'>'} TODAY'S CARD$NOR$
            </LPMUDText>
            <LPMUDText style={styles.dailyCardName}>
              $HIC${result.card.name}$NOR${result.card.reversed ? ' $HIR$(Reversed)$NOR$' : ''}
            </LPMUDText>

            <View style={styles.llmInsightBox}>
              <NeonText color={NEON_COLORS.hiGreen} style={styles.llmInsightText}>
                {result.insight}
              </NeonText>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <MatrixRain width={SCREEN_WIDTH} height={SCREEN_HEIGHT} speed={30} />
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <NeonText color={NEON_COLORS.hiCyan} style={styles.backButtonText}>
          ← BACK
        </NeonText>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <FlickerText color={NEON_COLORS.hiCyan} style={styles.headerTitle} flickerSpeed={5100}>
            <GlitchText color={NEON_COLORS.hiMagenta} glitchChance={0.04} glitchSpeed={900}>INSIGHTS</GlitchText>
          </FlickerText>
          <NeonText color={NEON_COLORS.dimCyan} style={styles.headerSubtitle}>
            Premium analysis tools
          </NeonText>
        </View>

        {/* Tool Buttons */}
        <View style={styles.toolsContainer}>
          {/* Daily Card */}
          <TouchableOpacity
            style={[styles.toolButton, loadingTool === 'daily' && styles.toolButtonActive]}
            onPress={handleDailyCard}
            disabled={isLoading}
          >
            <LPMUDText style={styles.toolButtonText}>
              $HIY${'[ ☼ DAILY CARD ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimYellow} style={styles.toolHint}>
              {dailyCard ? 'View today\'s insight' : 'Draw your daily card'}
            </NeonText>
          </TouchableOpacity>

          {/* Pattern Detector */}
          <TouchableOpacity
            style={[styles.toolButton, loadingTool === 'pattern' && styles.toolButtonActive]}
            onPress={handlePatternDetector}
            disabled={isLoading}
          >
            <LPMUDText style={styles.toolButtonText}>
              $HIC${'[ ◉ PATTERN DETECTOR ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.toolHint}>
              Find recurring cards & themes
            </NeonText>
          </TouchableOpacity>

          {/* Weekly Digest */}
          <TouchableOpacity
            style={[styles.toolButton, loadingTool === 'weekly' && styles.toolButtonActive]}
            onPress={handleWeeklyDigest}
            disabled={isLoading}
          >
            <LPMUDText style={styles.toolButtonText}>
              $HIG${'[ ◈ WEEKLY DIGEST ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimGreen} style={styles.toolHint}>
              Summarize your week's readings
            </NeonText>
          </TouchableOpacity>

          {/* Spread Recommender */}
          <View style={styles.spreadRecommenderContainer}>
            <TextInput
              style={styles.spreadInput}
              value={spreadQuestion}
              onChangeText={setSpreadQuestion}
              placeholder="Enter your question..."
              placeholderTextColor={NEON_COLORS.dimCyan}
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.toolButton, loadingTool === 'spread' && styles.toolButtonActive]}
              onPress={handleSpreadRecommender}
              disabled={isLoading || !isLLMAvailable}
            >
              <LPMUDText style={styles.toolButtonText}>
                $HIM${'[ ⬡ SPREAD ADVISOR ]'}$NOR$
              </LPMUDText>
              <NeonText color={NEON_COLORS.dimMagenta} style={styles.toolHint}>
                Get the best spread for your question
              </NeonText>
            </TouchableOpacity>
          </View>

          {/* 3D Visualizer */}
          <TouchableOpacity
            style={[styles.toolButton, styles.visualizerButton]}
            onPress={handle3DVisualizer}
          >
            <LPMUDText style={styles.toolButtonText}>
              $HIB${'[ ⎔ 3D SEMANTIC SPACE ]'}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimBlue} style={styles.toolHint}>
              Your personalized meaning-space map
            </NeonText>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingBox}>
            <NeonText color={NEON_COLORS.hiCyan} style={styles.loadingText}>
              Processing...
            </NeonText>
          </View>
        )}

        {/* Results */}
        {renderResult()}

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
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 15,
    zIndex: 100,
    padding: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 5,
  },
  statusBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 16,
  },
  toolsContainer: {
    gap: 15,
  },
  toolButton: {
    padding: 15,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
  },
  toolButtonActive: {
    borderColor: NEON_COLORS.hiYellow,
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
  },
  toolButtonComingSoon: {
    opacity: 0.6,
    borderStyle: 'dashed',
  },
  visualizerButton: {
    borderColor: NEON_COLORS.hiBlue,
    backgroundColor: 'rgba(0, 100, 255, 0.1)',
    shadowColor: NEON_COLORS.hiBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  toolButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 18,
  },
  toolHint: {
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 5,
  },
  spreadRecommenderContainer: {
    gap: 10,
  },
  spreadInput: {
    borderWidth: 2,
    borderColor: NEON_COLORS.hiMagenta,
    padding: 12,
    fontSize: 13,
    fontFamily: 'monospace',
    color: NEON_COLORS.hiWhite,
    backgroundColor: 'rgba(255, 0, 255, 0.05)',
  },
  loadingBox: {
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: NEON_COLORS.hiCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiGreen,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  resultTitle: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 10,
    lineHeight: 18,
  },
  resultStats: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  resultSubtitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 8,
    lineHeight: 16,
  },
  resultItem: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginLeft: 10,
    lineHeight: 16,
  },
  dailyCardName: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 20,
  },
  llmInsightBox: {
    marginTop: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimGreen,
    backgroundColor: 'rgba(0, 255, 0, 0.08)',
  },
  llmInsightText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  spacer: {
    height: 40,
  },
});
