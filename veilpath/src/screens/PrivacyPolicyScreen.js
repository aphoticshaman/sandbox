/**
 * Privacy Policy Screen - VeilPath WitchTok x Victorian Gothic
 * First-run agreement screen with privacy policy and terms
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

const PRIVACY_ACCEPTED_KEY = '@veilpath_privacy_accepted';

export default function PrivacyPolicyScreen({ navigation }) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      return;
    }

    try {
      // Mark privacy policy as accepted
      await AsyncStorage.setItem(PRIVACY_ACCEPTED_KEY, 'true');
      await AsyncStorage.setItem('@veilpath_privacy_accepted_date', new Date().toISOString());

      // Navigate to main app (LoadingScreen will handle permissions)
      navigation.replace('Loading');
    } catch (error) {
      console.error('[Privacy] Error saving acceptance:', error);
    }
  };

  return (
    <VeilPathScreen intensity="medium" scrollable={false}>
      {/* Header */}
      <SectionHeader
        icon="🔮"
        title="VeilPath"
        subtitle="Privacy Policy & Terms of Use"
      />

      {/* Scrollable Privacy Policy */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Section 1 */}
        <VictorianCard style={styles.section}>
          <Text style={styles.sectionTitle}>1. Your Privacy Is Sacred</Text>
          <Text style={styles.sectionText}>
            VeilPath is 100% privacy-first. We believe your readings, profile, and spiritual journey are YOUR business alone.
          </Text>
          <Text style={styles.bulletList}>
            {'\u2022'} All data stays on YOUR device only{'\n'}
            {'\u2022'} No cloud syncing (unless YOU choose to backup){'\n'}
            {'\u2022'} No analytics, tracking, or telemetry{'\n'}
            {'\u2022'} No account required{'\n'}
            {'\u2022'} No data collection whatsoever
          </Text>
        </VictorianCard>

        {/* Section 2 */}
        <VictorianCard style={styles.section}>
          <Text style={styles.sectionTitle}>2. What We Store (Locally)</Text>
          <Text style={styles.sectionText}>
            Everything is stored in your device's secure local storage:
          </Text>
          <Text style={styles.bulletList}>
            {'\u2022'} Your profile (zodiac, MBTI, birthday){'\n'}
            {'\u2022'} Reading history and interpretations{'\n'}
            {'\u2022'} Achievements and streaks{'\n'}
            {'\u2022'} App preferences and settings{'\n'}
            {'\u2022'} Optional: LLM API keys (encrypted, never sent to us)
          </Text>
        </VictorianCard>

        {/* Section 3 */}
        <VictorianCard style={styles.section}>
          <Text style={styles.sectionTitle}>3. Quantum Randomness</Text>
          <Text style={styles.sectionText}>
            Card draws use quantum-derived randomness from Australia National University's quantum server (qrng.anu.edu.au).
          </Text>
          <Text style={styles.sectionText}>
            No personal data is sent - we only fetch random numbers for your readings.
          </Text>
        </VictorianCard>

        {/* Section 4 */}
        <VictorianCard style={styles.section}>
          <Text style={styles.sectionTitle}>4. Deep AGI (Premium Optional)</Text>
          <Text style={styles.sectionText}>
            If you enable Deep AGI and provide your own API keys:
          </Text>
          <Text style={styles.bulletList}>
            {'\u2022'} Keys stored encrypted on YOUR device only{'\n'}
            {'\u2022'} Readings sent directly to Anthropic/OpenAI (not through us){'\n'}
            {'\u2022'} We never see your keys or reading content{'\n'}
            {'\u2022'} You control what's sent to AI providers
          </Text>
          <Text style={styles.sectionText}>
            Anthropic and OpenAI have their own privacy policies. By using Deep AGI, you agree to their terms.
          </Text>
        </VictorianCard>

        {/* Section 5 */}
        <VictorianCard style={styles.section}>
          <Text style={styles.sectionTitle}>5. In-App Purchases</Text>
          <Text style={styles.sectionText}>
            Premium features are processed through Apple App Store or Google Play Store. We don't handle payment information.
          </Text>
        </VictorianCard>

        {/* Section 6 */}
        <VictorianCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COSMIC.crystalPink }]}>6. No Warranty</Text>
          <Text style={styles.sectionText}>
            VeilPath is for entertainment and self-reflection purposes only. Tarot readings are not a substitute for professional advice (medical, financial, legal, etc.).
          </Text>
          <Text style={styles.sectionText}>
            By using this app, you acknowledge that readings are interpretive and should not be used for critical life decisions without consulting appropriate professionals.
          </Text>
        </VictorianCard>

        {/* Section 7 */}
        <VictorianCard style={styles.section}>
          <Text style={styles.sectionTitle}>7. Backups & Data Export</Text>
          <Text style={styles.sectionText}>
            You can create encrypted backups saved to your Downloads/Documents folder. These files are:
          </Text>
          <Text style={styles.bulletList}>
            {'\u2022'} Encrypted with AES-256{'\n'}
            {'\u2022'} Protected by password/PIN you create{'\n'}
            {'\u2022'} Stored locally on YOUR device{'\n'}
            {'\u2022'} Never uploaded anywhere unless YOU choose to
          </Text>
        </VictorianCard>

        {/* Section 8 */}
        <VictorianCard style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact & Updates</Text>
          <Text style={styles.sectionText}>
            Developer: AphoticShaman (indie){'\n'}
            Email: thespectralshaman@gmail.com{'\n'}
            Updates: Check app store for new versions
          </Text>
          <Text style={[styles.sectionText, { marginTop: 12, opacity: 0.7 }]}>
            This privacy policy was last updated: 17 Nov 2025
          </Text>
        </VictorianCard>

        {/* Final Note */}
        <VictorianCard style={styles.finalNote} glowColor={COSMIC.deepAmethyst}>
          <Text style={styles.finalNoteText}>
            By tapping "I AGREE" below, you confirm that you have read and agree to this Privacy Policy and Terms of Use.
          </Text>
        </VictorianCard>
      </ScrollView>

      <CosmicDivider />

      {/* Agreement Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setAccepted(!accepted)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkboxBox, accepted && styles.checkboxBoxChecked]}>
          {accepted && <Text style={styles.checkboxCheck}>✓</Text>}
        </View>
        <Text style={[styles.checkboxLabel, accepted && styles.checkboxLabelActive]}>
          I have read and agree to the Privacy Policy and Terms of Use
        </Text>
      </TouchableOpacity>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.agreeButton, !accepted && styles.agreeButtonDisabled]}
        onPress={handleAccept}
        disabled={!accepted}
      >
        <Text style={[styles.agreeButtonText, !accepted && styles.agreeButtonTextDisabled]}>
          {accepted ? 'I AGREE - CONTINUE' : 'I AGREE - CONTINUE'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.warningText}>
        You must accept to use VeilPath
      </Text>
    </VeilPathScreen>
  );
}

/**
 * Check if user has accepted privacy policy
 */
export async function hasAcceptedPrivacyPolicy() {
  try {
    const accepted = await AsyncStorage.getItem(PRIVACY_ACCEPTED_KEY);
    return accepted === 'true';
  } catch (error) {
    console.error('[Privacy] Error checking acceptance:', error);
    return false;
  }
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  section: {
    marginBottom: 12,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  sectionText: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.9,
  },
  bulletList: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    paddingLeft: 8,
  },

  finalNote: {
    marginTop: 8,
    marginBottom: 20,
    padding: 20,
  },
  finalNoteText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 14,
  },
  checkboxBox: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  checkboxBoxChecked: {
    borderColor: COSMIC.candleFlame,
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
  },
  checkboxCheck: {
    fontSize: 16,
    color: COSMIC.candleFlame,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
  },
  checkboxLabelActive: {
    color: COSMIC.moonGlow,
  },

  agreeButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
  agreeButtonDisabled: {
    backgroundColor: 'rgba(184, 134, 11, 0.3)',
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  agreeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  agreeButtonTextDisabled: {
    color: COSMIC.crystalPink,
    opacity: 0.5,
  },

  warningText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    opacity: 0.7,
  },
});
