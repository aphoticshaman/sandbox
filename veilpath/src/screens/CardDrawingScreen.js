/**
 * Card Drawing Screen - VeilPath WitchTok x Victorian Gothic
 * Beautiful cosmic loading screen while quantum cards are drawn
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { performReading } from '../utils/quantumRNG';
import { interpretCard } from '../utils/temporaryUtilStubs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
} from '../components/VeilPathDesign';

const READING_HISTORY_KEY = '@veilpath_reading_history';

/**
 * Format interpretation object into readable text for encrypted reveal
 */
function formatInterpretation(interpretation) {
  if (!interpretation) {
    console.error('formatInterpretation: interpretation is undefined');
    return 'ERROR: No interpretation generated';
  }

  const { cardData, layers, position, reversed } = interpretation;

  if (!cardData || !layers) {
    console.error('formatInterpretation: Missing cardData or layers', interpretation);
    return `ERROR: Invalid interpretation structure\n${JSON.stringify(interpretation, null, 2)}`;
  }

  try {
    let text = '';

    // Card header
    text += `${cardData.name || 'Unknown Card'}${reversed ? ' (Reversed)' : ''}\n`;
    text += `Position: ${position || 'Unknown'}\n`;
    text += `Element: ${layers.archetypal?.element || 'Spirit'}\n\n`;

    // Archetypal layer
    text += `== ARCHETYPAL MEANING ==\n\n`;
    text += `${layers.archetypal?.core_meaning || 'No meaning available'}\n\n\n`;

    // Contextual layer
    text += `== IN YOUR SITUATION ==\n\n`;
    text += `${layers.contextual?.position_significance || 'No context'}\n\n`;
    text += `${layers.contextual?.intention_alignment || 'No alignment'}\n\n\n`;

    // Psychological layer
    text += `== DEEPER INSIGHT ==\n\n`;
    text += `${layers.psychological?.shadow_work || 'None'}\n\n`;
    text += `${layers.psychological?.integration_path || 'None'}\n\n\n`;

    // Practical layer - use simple placeholders (no numbers in placeholder)
    text += `== ACTION STEPS ==\n\n`;
    const steps = layers.practical?.action_steps || [];
    if (steps.length > 0) {
      steps.forEach((step, i) => {
        text += `__STEPMARK__${step}\n`;
      });
      text += `\n`;
    }
    text += `${layers.practical?.what_to_focus_on || 'General focus'}\n\n\n`;

    // Synthesis
    text += `== KEY MESSAGE ==\n\n`;
    text += `${layers.synthesis?.core_message || 'No message'}\n\n`;
    text += `${layers.synthesis?.next_steps || 'Continue forward'}`;

    // NUCLEAR OPTION: Remove ALL digits from ENTIRE text (no exceptions)
    text = text.replace(/\d+/g, '');

    // Now add back sequential numbering ONLY to action steps
    let stepCounter = 1;
    text = text.replace(/__STEPMARK__/g, () => {
      const num = stepCounter++;
      return `${num}. `;
    });

    // Clean up any extra whitespace created by removals
    text = text.replace(/\n{4,}/g, '\n\n\n');
    text = text.replace(/  +/g, ' ');
    text = text.trim();

    return text;
  } catch (error) {
    console.error('formatInterpretation error:', error);
    return `ERROR: Failed to format interpretation\n${error.message}`;
  }
}

export default function CardDrawingScreen({ route, navigation }) {
  const { spreadType, intention, readingType, zodiacSign, birthdate, userProfile } = route.params;

  useEffect(() => {
    performQuantumDraw();
  }, []);

  async function performQuantumDraw() {
    try {
      // Simple delay for loading screen (3 seconds)
      await sleep(3000);

      // Draw cards
      const readingData = await performReading(spreadType, intention);
      const { cards, quantumSeed, timestamp } = readingData;

      // Load reading history for pattern detection in poetry
      let readingHistory = [];
      try {
        const historyData = await AsyncStorage.getItem(READING_HISTORY_KEY);
        if (historyData) {
          readingHistory = JSON.parse(historyData);
        }
      } catch (error) {
      }

      // Generate individual card interpretations WITH POETRY ENGINE
      const interpretations = cards.map((card, index) => {
        const interpretation = interpretCard(
          card,
          intention,
          readingType,
          { zodiacSign, birthdate, ...userProfile }, // Spread userProfile to include mbtiType
          readingHistory, // Pass reading history for pattern detection
          true // usePoetry = TRUE (default)
        );

        // Convert interpretation to readable text format
        const formatted = formatInterpretation(interpretation);
        return formatted;
      });

      await sleep(500);

      // Navigate to card interpretation screen (card-by-card with MCQs)
      navigation.replace('CardInterpretation', {
        cards,
        interpretations,
        spreadType,
        intention,
        readingType,
        zodiacSign,
        birthdate,
        userProfile: userProfile || { zodiacSign, birthdate },
        quantumSeed,
        timestamp
      });

    } catch (error) {
      console.error('Draw error:', error);
      // Retry after brief delay
      await sleep(2000);
      performQuantumDraw();
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return (
    <VeilPathScreen intensity="heavy" scrollable={false}>
      <View style={styles.container}>
        {/* Centered cosmic loading card */}
        <VictorianCard style={styles.loadingCard} glowColor={COSMIC.deepAmethyst}>
          <Text style={styles.loadingIcon}>🔮</Text>
          <Text style={styles.loadingTitle}>Drawing Your Cards</Text>
          <Text style={styles.loadingSubtitle}>
            Channeling quantum randomness...
          </Text>

          <ActivityIndicator
            size="large"
            color={COSMIC.candleFlame}
            style={styles.spinner}
          />

          <Text style={styles.thankYouText}>
            Thank you for your patience
          </Text>
        </VictorianCard>

        {/* Intention reminder */}
        <View style={styles.intentionBox}>
          <Text style={styles.intentionLabel}>Your Intention</Text>
          <Text style={styles.intentionText} numberOfLines={2}>
            "{intention}"
          </Text>
        </View>
      </View>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  loadingCard: {
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    marginBottom: 28,
    textAlign: 'center',
    opacity: 0.9,
  },
  spinner: {
    marginBottom: 24,
  },
  thankYouText: {
    fontSize: 13,
    color: COSMIC.candleFlame,
    fontStyle: 'italic',
    opacity: 0.9,
  },

  intentionBox: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    maxWidth: 340,
    width: '100%',
  },
  intentionLabel: {
    fontSize: 11,
    color: COSMIC.brassVictorian,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  intentionText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
});
