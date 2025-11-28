/**
 * CBT Tools Screen - VeilPath WitchTok x Victorian Gothic
 * Cognitive Behavioral Therapy tools with cosmic design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { getContent } from '../data/contentLoader';
import { useUserStore } from '../stores/userStore';
import { useJournalStore } from '../stores/journalStore';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
  FeaturePill,
} from '../components/VeilPathDesign';

const TOOL_MODES = {
  DISTORTIONS: 'distortions',
  THOUGHT_RECORD: 'thought_record',
  DETAIL: 'detail',
};

// Cross-platform alert
const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  if (Platform.OS === 'web') {
    const confirmed = buttons.length > 1
      ? window.confirm(`${title}\n\n${message}`)
      : (window.alert(`${title}\n\n${message}`), true);
    if (confirmed && buttons.length > 0) {
      const okButton = buttons.find(b => b.text === 'OK' || b.style !== 'cancel');
      if (okButton?.onPress) okButton.onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function CBTToolsScreen({ navigation }) {
  const userStore = useUserStore();
  const journalStore = useJournalStore();

  const [mode, setMode] = useState(TOOL_MODES.DISTORTIONS);
  const [distortions, setDistortions] = useState([]);
  const [selectedDistortion, setSelectedDistortion] = useState(null);
  const [thoughtRecord, setThoughtRecord] = useState({
    situation: '',
    automaticThought: '',
    emotion: '',
    evidence_for: '',
    evidence_against: '',
    alternative_thought: '',
  });

  useEffect(() => {
    const contentLib = getContent();
    const allDistortions = contentLib.getAllCBTDistortions();
    setDistortions(allDistortions);
  }, []);

  const handleDistortionPress = (distortion) => {
    setSelectedDistortion(distortion);
    setMode(TOOL_MODES.DETAIL);
  };

  const handleBackToList = () => {
    setMode(TOOL_MODES.DISTORTIONS);
    setSelectedDistortion(null);
  };

  const handleStartThoughtRecord = () => {
    setMode(TOOL_MODES.THOUGHT_RECORD);
  };

  const handleSaveThoughtRecord = () => {
    const content = `**CBT Thought Record**

**Situation:** ${thoughtRecord.situation}

**Automatic Thought:** ${thoughtRecord.automaticThought}

**Emotion:** ${thoughtRecord.emotion}

**Evidence Supporting Thought:**
${thoughtRecord.evidence_for}

**Evidence Against Thought:**
${thoughtRecord.evidence_against}

**Alternative/Balanced Thought:**
${thoughtRecord.alternative_thought}
`;

    journalStore.startDraft(null, null, null);
    journalStore.updateDraft(content);
    const entry = journalStore.saveDraft({
      mood: null,
      moodAfter: null,
      linkedCardIds: [],
      tags: ['CBT', 'Thought Record'],
      cbtDistortions: [],
      dbtSkills: [],
    });

    if (entry) {
      userStore.awardXP(entry.xpAwarded * 1.5);
      userStore.incrementStat('totalCBTExercises', 1);

      showAlert(
        '✨ Thought Record Saved',
        `+${Math.round(entry.xpAwarded * 1.5)} XP earned!\n\nGreat work challenging your thoughts.`,
        [{
          text: 'OK',
          onPress: () => {
            setMode(TOOL_MODES.DISTORTIONS);
            setThoughtRecord({
              situation: '',
              automaticThought: '',
              emotion: '',
              evidence_for: '',
              evidence_against: '',
              alternative_thought: '',
            });
          },
        }]
      );
    }
  };

  const renderDistortionsList = () => (
    <>
      <SectionHeader icon="🧠" title="CBT Tools" subtitle="Identify and reframe cognitive distortions" />

      <VictorianCard style={styles.infoCard} glowColor={COSMIC.deepAmethyst}>
        <Text style={styles.infoTitle}>✨ Evidence-Based CBT</Text>
        <Text style={styles.infoText}>
          From Aaron Beck, David Burns, and Albert Ellis. These tools help you recognize and challenge unhelpful thinking patterns.
        </Text>
        <View style={styles.pillsRow}>
          <FeaturePill icon="🎴" text="Tarot-Integrated" />
          <FeaturePill icon="📖" text="Journal-Linked" />
        </View>
      </VictorianCard>

      <TouchableOpacity style={styles.primaryButton} onPress={handleStartThoughtRecord}>
        <Text style={styles.primaryButtonText}>📝 Start Thought Record</Text>
      </TouchableOpacity>

      <CosmicDivider />

      <SectionHeader icon="💭" title="Cognitive Distortions" />

      {distortions.map((distortion) => (
        <TouchableOpacity
          key={distortion.id}
          onPress={() => handleDistortionPress(distortion)}
        >
          <VictorianCard style={styles.distortionCard} showCorners={false}>
            <View style={styles.distortionHeader}>
              <Text style={styles.distortionName}>{distortion.name}</Text>
              <Text style={styles.chevron}>→</Text>
            </View>
            <Text style={styles.distortionDefinition}>
              {distortion.definition}
            </Text>
            <Text style={styles.distortionExample}>
              Example: "{distortion.example}"
            </Text>
          </VictorianCard>
        </TouchableOpacity>
      ))}
    </>
  );

  const renderDistortionDetail = () => {
    if (!selectedDistortion) return null;

    return (
      <>
        <TouchableOpacity onPress={handleBackToList}>
          <Text style={styles.backLink}>← Back to Distortions</Text>
        </TouchableOpacity>

        <VictorianCard style={styles.detailHero} glowColor={COSMIC.candleFlame}>
          <Text style={styles.detailTitle}>{selectedDistortion.name}</Text>
          {selectedDistortion.aka && selectedDistortion.aka.length > 0 && (
            <Text style={styles.aka}>
              Also known as: {selectedDistortion.aka.join(', ')}
            </Text>
          )}
          <Text style={styles.definition}>{selectedDistortion.definition}</Text>
        </VictorianCard>

        <SectionHeader icon="💡" title="Example" />
        <VictorianCard style={styles.contentCard} showCorners={false}>
          <Text style={styles.exampleText}>"{selectedDistortion.example}"</Text>
        </VictorianCard>

        {selectedDistortion.tarot_cards && selectedDistortion.tarot_cards.length > 0 && (
          <>
            <SectionHeader icon="🎴" title="Tarot Correspondences" />
            <VictorianCard style={styles.contentCard} showCorners={false}>
              {selectedDistortion.tarot_cards.map((card, index) => (
                <View key={index} style={styles.tarotItem}>
                  <Text style={styles.tarotCard}>{card}</Text>
                  {selectedDistortion.card_meanings?.[card] && (
                    <Text style={styles.tarotMeaning}>
                      {selectedDistortion.card_meanings[card]}
                    </Text>
                  )}
                </View>
              ))}
            </VictorianCard>
          </>
        )}

        {selectedDistortion.therapeutic_prompts && selectedDistortion.therapeutic_prompts.length > 0 && (
          <>
            <SectionHeader icon="🔍" title="Challenge Questions" />
            <VictorianCard style={styles.contentCard} showCorners={false}>
              {selectedDistortion.therapeutic_prompts.map((prompt, index) => (
                <View key={index} style={styles.promptRow}>
                  <Text style={styles.promptBullet}>✧</Text>
                  <Text style={styles.promptItem}>{prompt}</Text>
                </View>
              ))}
            </VictorianCard>
          </>
        )}

        {selectedDistortion.reframing_questions && selectedDistortion.reframing_questions.length > 0 && (
          <>
            <SectionHeader icon="💭" title="Reframing Questions" />
            <VictorianCard style={styles.contentCard} showCorners={false}>
              {selectedDistortion.reframing_questions.map((question, index) => (
                <View key={index} style={styles.promptRow}>
                  <Text style={styles.promptBullet}>✧</Text>
                  <Text style={styles.promptItem}>{question}</Text>
                </View>
              ))}
            </VictorianCard>
          </>
        )}

        {selectedDistortion.behavioral_activation && (
          <VictorianCard style={styles.actionCard} glowColor={COSMIC.etherealCyan}>
            <Text style={styles.actionEmoji}>⚡</Text>
            <Text style={styles.actionTitle}>Action Step</Text>
            <Text style={styles.actionText}>
              {selectedDistortion.behavioral_activation}
            </Text>
          </VictorianCard>
        )}

        <CosmicDivider />

        <TouchableOpacity style={styles.primaryButton} onPress={handleStartThoughtRecord}>
          <Text style={styles.primaryButtonText}>📝 Use in Thought Record</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderThoughtRecord = () => (
    <>
      <TouchableOpacity onPress={handleBackToList}>
        <Text style={styles.backLink}>← Back to Tools</Text>
      </TouchableOpacity>

      <SectionHeader icon="📝" title="Thought Record" subtitle="Challenge your automatic thoughts" />

      <VictorianCard style={styles.infoCard} showCorners={false}>
        <Text style={styles.infoText}>
          A structured way to examine and challenge automatic thoughts. Take your time with each question.
        </Text>
      </VictorianCard>

      <VictorianCard style={styles.inputCard} showCorners={false}>
        <Text style={styles.inputLabel}>1. What happened? (Situation)</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe the situation objectively..."
          placeholderTextColor="rgba(225, 190, 231, 0.4)"
          value={thoughtRecord.situation}
          onChangeText={(text) => setThoughtRecord({ ...thoughtRecord, situation: text })}
          multiline
        />
      </VictorianCard>

      <VictorianCard style={styles.inputCard} showCorners={false}>
        <Text style={styles.inputLabel}>2. What thought went through your mind?</Text>
        <TextInput
          style={styles.input}
          placeholder="What did you think when this happened?"
          placeholderTextColor="rgba(225, 190, 231, 0.4)"
          value={thoughtRecord.automaticThought}
          onChangeText={(text) => setThoughtRecord({ ...thoughtRecord, automaticThought: text })}
          multiline
        />
      </VictorianCard>

      <VictorianCard style={styles.inputCard} showCorners={false}>
        <Text style={styles.inputLabel}>3. What emotion did you feel?</Text>
        <TextInput
          style={styles.input}
          placeholder="Anxious, sad, angry, overwhelmed..."
          placeholderTextColor="rgba(225, 190, 231, 0.4)"
          value={thoughtRecord.emotion}
          onChangeText={(text) => setThoughtRecord({ ...thoughtRecord, emotion: text })}
        />
      </VictorianCard>

      <VictorianCard style={styles.inputCard} showCorners={false}>
        <Text style={styles.inputLabel}>4. Evidence that SUPPORTS this thought</Text>
        <TextInput
          style={styles.input}
          placeholder="What facts support this thought?"
          placeholderTextColor="rgba(225, 190, 231, 0.4)"
          value={thoughtRecord.evidence_for}
          onChangeText={(text) => setThoughtRecord({ ...thoughtRecord, evidence_for: text })}
          multiline
        />
      </VictorianCard>

      <VictorianCard style={styles.inputCard} showCorners={false}>
        <Text style={styles.inputLabel}>5. Evidence AGAINST this thought</Text>
        <TextInput
          style={styles.input}
          placeholder="What facts contradict this thought?"
          placeholderTextColor="rgba(225, 190, 231, 0.4)"
          value={thoughtRecord.evidence_against}
          onChangeText={(text) => setThoughtRecord({ ...thoughtRecord, evidence_against: text })}
          multiline
        />
      </VictorianCard>

      <VictorianCard style={styles.inputCard} showCorners={false}>
        <Text style={styles.inputLabel}>6. Alternative/Balanced Thought</Text>
        <TextInput
          style={styles.input}
          placeholder="A more balanced way to think about this..."
          placeholderTextColor="rgba(225, 190, 231, 0.4)"
          value={thoughtRecord.alternative_thought}
          onChangeText={(text) => setThoughtRecord({ ...thoughtRecord, alternative_thought: text })}
          multiline
        />
      </VictorianCard>

      <CosmicDivider />

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!thoughtRecord.situation || !thoughtRecord.automaticThought || !thoughtRecord.emotion) && styles.buttonDisabled,
        ]}
        onPress={handleSaveThoughtRecord}
        disabled={!thoughtRecord.situation || !thoughtRecord.automaticThought || !thoughtRecord.emotion}
      >
        <Text style={styles.primaryButtonText}>✨ Save Thought Record</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {mode === TOOL_MODES.DISTORTIONS && renderDistortionsList()}
      {mode === TOOL_MODES.DETAIL && renderDistortionDetail()}
      {mode === TOOL_MODES.THOUGHT_RECORD && renderThoughtRecord()}
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    marginBottom: 20,
  },

  infoCard: {
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    opacity: 0.9,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  primaryButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  primaryButtonText: {
    color: '#1a1f3a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  distortionCard: {
    marginBottom: 12,
    padding: 16,
  },
  distortionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distortionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    flex: 1,
  },
  chevron: {
    fontSize: 18,
    color: COSMIC.candleFlame,
  },
  distortionDefinition: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.9,
  },
  distortionExample: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
    opacity: 0.7,
  },

  detailHero: {
    padding: 24,
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 1,
    color: COSMIC.moonGlow,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  aka: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    marginBottom: 12,
    opacity: 0.7,
  },
  definition: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    opacity: 0.9,
  },

  contentCard: {
    padding: 16,
    marginBottom: 16,
  },
  exampleText: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    fontStyle: 'italic',
    lineHeight: 24,
  },

  tarotItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.2)',
  },
  tarotCard: {
    fontSize: 15,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    marginBottom: 4,
  },
  tarotMeaning: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    opacity: 0.9,
  },

  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  promptBullet: {
    fontSize: 14,
    color: COSMIC.candleFlame,
    marginRight: 10,
    marginTop: 2,
  },
  promptItem: {
    flex: 1,
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    opacity: 0.9,
  },

  actionCard: {
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
    marginBottom: 8,
    letterSpacing: 1,
  },
  actionText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },

  inputCard: {
    marginBottom: 12,
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.crystalPink,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 14,
    minHeight: 60,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
});
