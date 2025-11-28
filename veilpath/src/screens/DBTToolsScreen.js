/**
 * DBT Tools Screen - VeilPath WitchTok x Victorian Gothic
 * Dialectical Behavior Therapy with cosmic design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { getContent } from '../data/contentLoader';
import { useUserStore } from '../stores/userStore';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
  FeaturePill,
} from '../components/VeilPathDesign';

const MODES = {
  MODULES: 'modules',
  CRISIS: 'crisis',
  TIPP: 'tipp',
  WISE_MIND: 'wise_mind',
};

// Cross-platform alert
const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (buttons[0]?.onPress) buttons[0].onPress();
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function DBTToolsScreen({ navigation }) {
  const userStore = useUserStore();
  const [mode, setMode] = useState(MODES.MODULES);
  const [dbtData, setDbtData] = useState(null);

  useEffect(() => {
    const contentLib = getContent();
    const mindfulness = contentLib.getDBTModule('module_1_mindfulness');
    const distressTolerance = contentLib.getDBTModule('module_2_distress_tolerance');
    const emotionRegulation = contentLib.getDBTModule('module_3_emotion_regulation');
    const interpersonal = contentLib.getDBTModule('module_4_interpersonal_effectiveness');

    setDbtData({ mindfulness, distressTolerance, emotionRegulation, interpersonal });
  }, []);

  const handleCrisisMode = () => setMode(MODES.CRISIS);
  const handleTIPP = () => setMode(MODES.TIPP);
  const handleWiseMind = () => setMode(MODES.WISE_MIND);
  const handleBack = () => setMode(MODES.MODULES);

  const handleUsedSkill = (skillName, xp) => {
    userStore.awardXP(xp * 1.5);
    userStore.incrementStat('totalDBTSkills', 1);
    showAlert('✨ Skill Used', `Great work using ${skillName}!\n+${Math.round(xp * 1.5)} XP earned.`);
  };

  const renderModules = () => (
    <>
      <SectionHeader icon="🌙" title="DBT Tools" subtitle="Dialectical Behavior Therapy" />

      <VictorianCard style={styles.infoCard} glowColor={COSMIC.deepAmethyst}>
        <Text style={styles.infoTitle}>☯️ The Dialectic: Acceptance AND Change</Text>
        <Text style={styles.infoText}>
          DBT balances accepting yourself as you are RIGHT NOW with working to change for the better. This is the Middle Way. Both are true.
        </Text>
        <Text style={styles.tarotCorrespondence}>
          🎴 Temperance: Blending opposites - one foot in water (emotion), one on land (logic)
        </Text>
      </VictorianCard>

      {/* Crisis Card */}
      <VictorianCard style={styles.crisisCard} glowColor={COSMIC.candleFlame}>
        <Text style={styles.crisisEmoji}>🚨</Text>
        <Text style={styles.crisisTitle}>In Crisis Right Now?</Text>
        <Text style={styles.crisisSubtitle}>
          Emotion intensity 8-10/10? Use crisis survival skills.
        </Text>
        <TouchableOpacity style={styles.crisisButton} onPress={handleCrisisMode}>
          <Text style={styles.crisisButtonText}>Crisis Tools</Text>
        </TouchableOpacity>
      </VictorianCard>

      <CosmicDivider />

      <SectionHeader icon="📚" title="Four DBT Modules" />

      <TouchableOpacity onPress={handleWiseMind}>
        <VictorianCard style={styles.moduleCard} showCorners={false}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleEmoji}>🧘</Text>
            <View style={styles.moduleTitleContainer}>
              <Text style={styles.moduleTitle}>Mindfulness</Text>
              <Text style={styles.moduleSubtitle}>Wise Mind • What & How Skills</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </View>
          <Text style={styles.moduleDescription}>
            Core skill underlying all DBT. Being present, aware, non-judgmental.
          </Text>
        </VictorianCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleCrisisMode}>
        <VictorianCard style={styles.moduleCard} showCorners={false}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleEmoji}>🛡️</Text>
            <View style={styles.moduleTitleContainer}>
              <Text style={styles.moduleTitle}>Distress Tolerance</Text>
              <Text style={styles.moduleSubtitle}>TIPP • ACCEPTS • Radical Acceptance</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </View>
          <Text style={styles.moduleDescription}>
            Survive crisis without making it worse.
          </Text>
        </VictorianCard>
      </TouchableOpacity>

      <VictorianCard style={styles.moduleCard} showCorners={false}>
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleEmoji}>💭</Text>
          <View style={styles.moduleTitleContainer}>
            <Text style={styles.moduleTitle}>Emotion Regulation</Text>
            <Text style={styles.moduleSubtitle}>ABC PLEASE • Opposite Action</Text>
          </View>
          <Text style={styles.comingSoon}>Coming Soon</Text>
        </View>
        <Text style={styles.moduleDescription}>
          Understand and manage emotions. Reduce emotional vulnerability.
        </Text>
      </VictorianCard>

      <VictorianCard style={styles.moduleCard} showCorners={false}>
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleEmoji}>🤝</Text>
          <View style={styles.moduleTitleContainer}>
            <Text style={styles.moduleTitle}>Interpersonal Effectiveness</Text>
            <Text style={styles.moduleSubtitle}>DEAR MAN • GIVE • FAST</Text>
          </View>
          <Text style={styles.comingSoon}>Coming Soon</Text>
        </View>
        <Text style={styles.moduleDescription}>
          Ask for what you need, say no, maintain self-respect.
        </Text>
      </VictorianCard>
    </>
  );

  const renderCrisis = () => (
    <>
      <TouchableOpacity onPress={handleBack}>
        <Text style={styles.backLink}>← Back to Modules</Text>
      </TouchableOpacity>

      <SectionHeader icon="🚨" title="Crisis Survival" subtitle="When emotions are 8-10/10" />

      <VictorianCard style={styles.alertCard} glowColor={COSMIC.candleFlame}>
        <Text style={styles.alertEmoji}>⚡</Text>
        <Text style={styles.alertTitle}>When to Use These Skills</Text>
        <Text style={styles.alertText}>
          • Emotion intensity 8-10/10{'\n'}
          • About to do something destructive{'\n'}
          • Need immediate relief{'\n'}
          • Can't solve the problem right now
        </Text>
      </VictorianCard>

      <VictorianCard style={styles.skillCard} showCorners={false}>
        <Text style={styles.skillTitle}>🧊 TIPP</Text>
        <Text style={styles.skillSubtitle}>Fast-acting nervous system reset</Text>
        <Text style={styles.skillDescription}>
          Temperature • Intense exercise • Paced breathing • Paired muscle relaxation
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleTIPP}>
          <Text style={styles.primaryButtonText}>Use TIPP Skills</Text>
        </TouchableOpacity>
      </VictorianCard>

      <VictorianCard style={styles.skillCard} showCorners={false}>
        <Text style={styles.skillTitle}>📋 ACCEPTS</Text>
        <Text style={styles.skillSubtitle}>Distraction techniques (short-term relief)</Text>
        <View style={styles.acceptsList}>
          <Text style={styles.acceptsItem}><Text style={styles.acceptsLetter}>A</Text>ctivities: Do something engaging</Text>
          <Text style={styles.acceptsItem}><Text style={styles.acceptsLetter}>C</Text>ontributing: Help someone else</Text>
          <Text style={styles.acceptsItem}><Text style={styles.acceptsLetter}>C</Text>omparisons: Remember times you coped</Text>
          <Text style={styles.acceptsItem}><Text style={styles.acceptsLetter}>E</Text>motions: Create opposite emotion</Text>
          <Text style={styles.acceptsItem}><Text style={styles.acceptsLetter}>P</Text>ushing away: Mentally push problem away</Text>
          <Text style={styles.acceptsItem}><Text style={styles.acceptsLetter}>T</Text>houghts: Count, lists, focus elsewhere</Text>
          <Text style={styles.acceptsItem}><Text style={styles.acceptsLetter}>S</Text>ensations: Strong sensation (ice, music)</Text>
        </View>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => handleUsedSkill('ACCEPTS', 15)}>
          <Text style={styles.secondaryButtonText}>I Used ACCEPTS</Text>
        </TouchableOpacity>
      </VictorianCard>

      <VictorianCard style={styles.noteCard} showCorners={false}>
        <Text style={styles.noteText}>
          💡 These skills don't solve the problem - they buy you time until you can address it from Wise Mind.
        </Text>
      </VictorianCard>
    </>
  );

  const renderTIPP = () => (
    <>
      <TouchableOpacity onPress={() => setMode(MODES.CRISIS)}>
        <Text style={styles.backLink}>← Back to Crisis Tools</Text>
      </TouchableOpacity>

      <SectionHeader icon="🧊" title="TIPP Skills" subtitle="Fast nervous system reset" />

      <VictorianCard style={styles.tippCard} glowColor={COSMIC.etherealCyan}>
        <View style={styles.tippHeader}>
          <Text style={styles.tippEmoji}>❄️</Text>
          <View style={styles.tippTitleContainer}>
            <Text style={styles.tippTitle}>T - Temperature</Text>
            <Text style={styles.tippSubtitle}>Activate dive reflex</Text>
          </View>
        </View>
        <Text style={styles.tippHow}>
          <Text style={styles.bold}>How:</Text> Splash ice-cold water on face, hold ice cube
        </Text>
        <Text style={styles.tippWhy}>
          <Text style={styles.bold}>Why:</Text> Activates dive reflex, slows heart rate
        </Text>
        <Text style={styles.tippTarot}>🎴 Ace of Cups (cold water)</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => handleUsedSkill('Temperature (TIPP)', 15)}>
          <Text style={styles.primaryButtonText}>I Used Temperature</Text>
        </TouchableOpacity>
      </VictorianCard>

      <VictorianCard style={styles.tippCard} showCorners={false}>
        <View style={styles.tippHeader}>
          <Text style={styles.tippEmoji}>🏃</Text>
          <View style={styles.tippTitleContainer}>
            <Text style={styles.tippTitle}>I - Intense Exercise</Text>
            <Text style={styles.tippSubtitle}>Burn off adrenaline</Text>
          </View>
        </View>
        <Text style={styles.tippHow}>
          <Text style={styles.bold}>How:</Text> Run, jump, burpees - anything vigorous
        </Text>
        <Text style={styles.tippWhy}>
          <Text style={styles.bold}>Why:</Text> Burns off adrenaline, releases endorphins
        </Text>
        <Text style={styles.tippTarot}>🎴 The Chariot (movement)</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => handleUsedSkill('Intense Exercise (TIPP)', 15)}>
          <Text style={styles.primaryButtonText}>I Used Intense Exercise</Text>
        </TouchableOpacity>
      </VictorianCard>

      <VictorianCard style={styles.tippCard} showCorners={false}>
        <View style={styles.tippHeader}>
          <Text style={styles.tippEmoji}>🌬️</Text>
          <View style={styles.tippTitleContainer}>
            <Text style={styles.tippTitle}>P - Paced Breathing</Text>
            <Text style={styles.tippSubtitle}>Activate calm response</Text>
          </View>
        </View>
        <Text style={styles.tippHow}>
          <Text style={styles.bold}>How:</Text> In for 4, hold for 4, out for 6. Repeat.
        </Text>
        <Text style={styles.tippWhy}>
          <Text style={styles.bold}>Why:</Text> Longer exhale activates parasympathetic
        </Text>
        <Text style={styles.tippTarot}>🎴 Temperance (balance)</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('MindfulnessTab', { screen: 'MindfulnessHome' })}
        >
          <Text style={styles.secondaryButtonText}>Practice Breathing</Text>
        </TouchableOpacity>
      </VictorianCard>

      <VictorianCard style={styles.tippCard} showCorners={false}>
        <View style={styles.tippHeader}>
          <Text style={styles.tippEmoji}>💪</Text>
          <View style={styles.tippTitleContainer}>
            <Text style={styles.tippTitle}>P - Paired Muscle Relaxation</Text>
            <Text style={styles.tippSubtitle}>Release tension</Text>
          </View>
        </View>
        <Text style={styles.tippHow}>
          <Text style={styles.bold}>How:</Text> Tense muscle for 10 sec, release. Progress through body.
        </Text>
        <Text style={styles.tippWhy}>
          <Text style={styles.bold}>Why:</Text> Releases physical tension, grounds you
        </Text>
        <Text style={styles.tippTarot}>🎴 Four of Swords (rest)</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => handleUsedSkill('Paired Muscle (TIPP)', 15)}>
          <Text style={styles.primaryButtonText}>I Used Paired Muscle</Text>
        </TouchableOpacity>
      </VictorianCard>
    </>
  );

  const renderWiseMind = () => (
    <>
      <TouchableOpacity onPress={handleBack}>
        <Text style={styles.backLink}>← Back to Modules</Text>
      </TouchableOpacity>

      <SectionHeader icon="🌟" title="Wise Mind" subtitle="The integration of logic and emotion" />

      <VictorianCard style={styles.mindCard} showCorners={false}>
        <Text style={styles.mindTitle}>🧠 Reasonable Mind</Text>
        <Text style={styles.mindDescription}>
          Logical, analytical, problem-solving mode. Cold facts.
        </Text>
        <Text style={styles.mindExample}>
          Example: Analyzing data, planning logically
        </Text>
        <Text style={styles.mindLimitation}>
          ⚠️ Limitation: Ignores emotions, can be robotic
        </Text>
        <Text style={styles.mindTarot}>
          🎴 The Magician, King of Swords, Ace of Swords
        </Text>
      </VictorianCard>

      <VictorianCard style={styles.mindCard} showCorners={false}>
        <Text style={styles.mindTitle}>❤️ Emotion Mind</Text>
        <Text style={styles.mindDescription}>
          Feelings drive thoughts and actions. Hot emotions.
        </Text>
        <Text style={styles.mindExample}>
          Example: Crying at sad movie, impulsive anger, passionate love
        </Text>
        <Text style={styles.mindLimitation}>
          ⚠️ Limitation: Can be overwhelming, clouds judgment
        </Text>
        <Text style={styles.mindTarot}>
          🎴 The Moon, Queen of Cups, Five of Cups
        </Text>
      </VictorianCard>

      <VictorianCard style={styles.wiseMindCard} glowColor={COSMIC.candleFlame}>
        <Text style={styles.wiseMindEmoji}>✨</Text>
        <Text style={styles.wiseMindTitle}>Wise Mind</Text>
        <Text style={styles.wiseMindDescription}>
          You KNOW the right answer, combining logic and feeling. Makes decisions you won't regret later.
        </Text>
        <View style={styles.wiseMindAccess}>
          <Text style={styles.wiseMindAccessTitle}>How to Access:</Text>
          <Text style={styles.wiseMindAccessText}>
            Ask: "What do I deeply know is right?"
          </Text>
          <Text style={styles.wiseMindAccessText}>
            Feel it in your gut + think it through your head.
          </Text>
        </View>
        <Text style={styles.wiseMindTarot}>
          🎴 Temperance, The High Priestess, The Hermit, Justice
        </Text>
      </VictorianCard>

      <VictorianCard style={styles.noteCard} showCorners={false}>
        <Text style={styles.noteText}>
          💡 Practice: When facing a decision, pause. Notice if you're in Reasonable Mind or Emotion Mind. Then ask your gut: "What do I deeply know is right?" That's Wise Mind speaking.
        </Text>
      </VictorianCard>

      <CosmicDivider />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          navigation.navigate('JournalTab', {
            screen: 'JournalEditor',
            params: {
              mode: 'new',
              promptSuggestions: ['Describe a time you acted from Wise Mind.'],
            },
          });
        }}
      >
        <Text style={styles.primaryButtonText}>📝 Journal About Wise Mind</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {mode === MODES.MODULES && renderModules()}
      {mode === MODES.CRISIS && renderCrisis()}
      {mode === MODES.TIPP && renderTIPP()}
      {mode === MODES.WISE_MIND && renderWiseMind()}
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
    marginBottom: 8,
  },
  tarotCorrespondence: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
    marginTop: 8,
  },

  crisisCard: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  crisisEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  crisisTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  crisisSubtitle: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  crisisButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  crisisButtonText: {
    color: '#1a1f3a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },

  moduleCard: {
    marginBottom: 12,
    padding: 16,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  moduleEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  moduleTitleContainer: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  chevron: {
    fontSize: 18,
    color: COSMIC.candleFlame,
  },
  comingSoon: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  moduleDescription: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    opacity: 0.9,
  },

  alertCard: {
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  alertEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    opacity: 0.9,
  },

  skillCard: {
    marginBottom: 16,
    padding: 20,
  },
  skillTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 4,
  },
  skillSubtitle: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    marginBottom: 12,
    opacity: 0.8,
  },
  skillDescription: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    marginBottom: 16,
    opacity: 0.9,
  },
  acceptsList: {
    marginBottom: 16,
  },
  acceptsItem: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    marginBottom: 6,
    opacity: 0.9,
  },
  acceptsLetter: {
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },

  noteCard: {
    padding: 16,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  tippCard: {
    marginBottom: 16,
    padding: 20,
  },
  tippHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tippEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  tippTitleContainer: {
    flex: 1,
  },
  tippTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  tippSubtitle: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  tippHow: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    lineHeight: 20,
    marginBottom: 6,
    opacity: 0.9,
  },
  tippWhy: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.9,
  },
  tippTarot: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },

  mindCard: {
    marginBottom: 16,
    padding: 20,
  },
  mindTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 8,
  },
  mindDescription: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    marginBottom: 8,
    opacity: 0.9,
  },
  mindExample: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
    marginBottom: 8,
    opacity: 0.8,
  },
  mindLimitation: {
    fontSize: 13,
    color: COSMIC.candleFlame,
    marginBottom: 8,
    opacity: 0.8,
  },
  mindTarot: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
  },

  wiseMindCard: {
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
  },
  wiseMindEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  wiseMindTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  wiseMindDescription: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.9,
  },
  wiseMindAccess: {
    width: '100%',
    marginBottom: 16,
  },
  wiseMindAccessTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
    marginBottom: 8,
    letterSpacing: 1,
  },
  wiseMindAccessText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    marginBottom: 4,
    opacity: 0.9,
  },
  wiseMindTarot: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  primaryButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
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
  secondaryButton: {
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
  },
  secondaryButtonText: {
    color: COSMIC.moonGlow,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
