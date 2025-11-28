/**
 * Celtic Cross Interpretation Screen - VeilPath WitchTok x Victorian Gothic
 * Display all 10 cards with their positions and meanings
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { TarotCard } from '../components/TarotCard';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

const POSITIONS = [
  { id: 0, name: 'Present Situation', description: 'Where you are right now', icon: '🎯', interpretation: 'This card represents your current circumstances and the central theme of the reading.' },
  { id: 1, name: 'Challenge', description: 'What crosses you', icon: '⚔️', interpretation: 'This card shows the obstacle, challenge, or opposing force you must work with or overcome.' },
  { id: 2, name: 'Foundation', description: 'Root cause', icon: '🏛️', interpretation: 'This reveals the underlying basis, root cause, or foundation of the situation.' },
  { id: 3, name: 'Recent Past', description: 'What is leaving', icon: '🌅', interpretation: 'This shows what is passing away, what has influenced you recently but is now moving into the past.' },
  { id: 4, name: 'Crown', description: 'Best outcome', icon: '👑', interpretation: 'This represents your conscious goal, aspiration, or the best possible outcome you can achieve.' },
  { id: 5, name: 'Near Future', description: 'What approaches', icon: '🌄', interpretation: 'This shows what is coming into being, approaching, or will manifest in the near future.' },
  { id: 6, name: 'Your Approach', description: 'How you see yourself', icon: '🪞', interpretation: 'This reveals your attitude, how you approach the situation, and how you see yourself in it.' },
  { id: 7, name: 'External Influences', description: 'How others see you', icon: '🌍', interpretation: 'This shows external forces, how others perceive you, and environmental factors affecting the situation.' },
  { id: 8, name: 'Hopes & Fears', description: 'Aspirations and anxieties', icon: '💭', interpretation: 'This reveals what you hope for and what you fear, often showing unconscious desires or blocks.' },
  { id: 9, name: 'Final Outcome', description: 'Where this leads', icon: '✨', interpretation: 'This shows the culmination, final outcome, or where the situation is ultimately heading.' },
];

export default function CelticCrossInterpretationScreen({ navigation, route }) {
  const { cards, intention } = route.params;

  const handleJournalReflection = () => {
    const cardIds = cards.map((c) => c.card.id);
    navigation.navigate('JournalTab', {
      screen: 'JournalEditor',
      params: {
        mode: 'new',
        linkedCardIds: cardIds,
        promptSuggestions: [
          `Reflect on your Celtic Cross reading for: "${intention}"`,
          'Which card resonated most strongly with you? Why?',
          'How do the Past, Present, and Future cards connect?',
          'What action will you take based on this reading?',
        ],
      },
    });
  };

  const renderCardSection = (position) => {
    const drawnCard = cards[position.id];
    if (!drawnCard) return null;

    const card = drawnCard.card;
    const isReversed = drawnCard.isReversed;

    return (
      <VictorianCard key={position.id} style={styles.cardSection}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={styles.positionNumber}>{position.id + 1}</Text>
            <View style={styles.positionInfo}>
              <Text style={styles.positionName}>{position.name}</Text>
              <Text style={styles.positionDescription}>
                {position.description}
              </Text>
            </View>
          </View>
          <Text style={styles.positionIcon}>{position.icon}</Text>
        </View>

        <View style={styles.cardDisplay}>
          <TarotCard
            card={card}
            isReversed={isReversed}
            size="md"
            showName={true}
          />
        </View>

        <View style={styles.cardMeaning}>
          <Text style={styles.meaningTitle}>Position Meaning</Text>
          <Text style={styles.meaningText}>{position.interpretation}</Text>

          {isReversed && (
            <View style={styles.reversedNotice}>
              <Text style={styles.reversedIcon}>🔄</Text>
              <Text style={styles.reversedText}>
                This card appears reversed, suggesting blocked energy, resistance, or the inverse of its upright meaning.
              </Text>
            </View>
          )}
        </View>
      </VictorianCard>
    );
  };

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <SectionHeader
        icon="✨"
        title="Celtic Cross Reading"
        subtitle="Your complete interpretation"
      />

      {/* Intention */}
      {intention && (
        <VictorianCard style={styles.intentionCard} glowColor={COSMIC.deepAmethyst}>
          <Text style={styles.intentionLabel}>Your Question</Text>
          <Text style={styles.intentionText}>{intention}</Text>
        </VictorianCard>
      )}

      <CosmicDivider />

      {/* Cross Layout (Positions 1-6) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>The Cross: Core Energy</Text>
        {POSITIONS.slice(0, 6).map(renderCardSection)}
      </View>

      <CosmicDivider />

      {/* Staff Layout (Positions 7-10) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>The Staff: Inner & Outer Journey</Text>
        {POSITIONS.slice(6, 10).map(renderCardSection)}
      </View>

      <CosmicDivider />

      {/* Synthesis Section */}
      <VictorianCard style={styles.synthesisCard} glowColor={COSMIC.etherealCyan}>
        <Text style={styles.synthesisTitle}>💭 Synthesis & Reflection</Text>
        <Text style={styles.synthesisText}>
          The Celtic Cross reveals a complex narrative. Consider:
        </Text>
        <Text style={styles.synthesisList}>
          • How do Past (#4), Present (#1), and Future (#6) connect?{'\n'}
          • What does the Challenge (#2) teach you?{'\n'}
          • How does your Approach (#7) align with External Influences (#8)?{'\n'}
          • Are your Hopes & Fears (#9) supporting or blocking the Outcome (#10)?
        </Text>
        <Text style={styles.synthesisText}>
          Sit with this reading. Return to it over the coming days as insights emerge.
        </Text>
      </VictorianCard>

      {/* Actions */}
      <TouchableOpacity style={styles.journalButton} onPress={handleJournalReflection}>
        <Text style={styles.journalButtonText}>📝 Journal About This Reading</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.navigate('HomeTab')}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    marginBottom: 16,
  },

  intentionCard: {
    marginBottom: 16,
    padding: 20,
    alignItems: 'center',
  },
  intentionLabel: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  intentionText: {
    fontSize: 17,
    color: COSMIC.moonGlow,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
  },

  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },

  cardSection: {
    marginBottom: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardHeaderText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  positionNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginRight: 14,
    width: 30,
  },
  positionInfo: {
    flex: 1,
  },
  positionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  positionDescription: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  positionIcon: {
    fontSize: 32,
  },
  cardDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardMeaning: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.2)',
    paddingTop: 16,
  },
  meaningTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  meaningText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    lineHeight: 22,
    opacity: 0.9,
  },
  reversedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    padding: 14,
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst,
  },
  reversedIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  reversedText: {
    flex: 1,
    fontSize: 12,
    color: COSMIC.moonGlow,
    lineHeight: 20,
    opacity: 0.9,
  },

  synthesisCard: {
    marginBottom: 20,
    padding: 22,
  },
  synthesisTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 14,
  },
  synthesisText: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 22,
    marginBottom: 14,
    opacity: 0.9,
  },
  synthesisList: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    marginBottom: 14,
    paddingLeft: 8,
  },

  journalButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
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
  journalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },

  doneButton: {
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(184, 134, 11, 0.1)',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    letterSpacing: 1,
  },
});
