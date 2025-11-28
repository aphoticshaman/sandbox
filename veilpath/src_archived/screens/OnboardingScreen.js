/**
 * ONBOARDING SCREEN - Terminal tutorial
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { NeonText, LPMUDText, FlickerText, ScanLines } from '../components/TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '$HIC$01 | LET ME KNOW YOU$NOR$',
      content: `$HIY$━━━━━━━━━━━━━━━━━━━━━━━━━━$NOR$

$HIW$10 questions. Just you and me.$NOR$

I need to understand who you are
before I can see what you need.

Every reading I give you
will be tailored to $HIM$you specifically$NOR$.

$HIY$━━━━━━━━━━━━━━━━━━━━━━━━━━$NOR$`
    },
    {
      title: '$HIC$02 | PRIVATE & OFFLINE$NOR$',
      content: `$HIY$━━━━━━━━━━━━━━━━━━━━━━━━━━$NOR$

$HIW$Your secrets stay between us.$NOR$

Everything runs on your device.
No cloud. No tracking. No data.

What happens here stays here.
Always.

$HIY$━━━━━━━━━━━━━━━━━━━━━━━━━━$NOR$`
    },
    {
      title: '$HIC$03 | TRUE RANDOMNESS$NOR$',
      content: `$HIY$━━━━━━━━━━━━━━━━━━━━━━━━━━$NOR$

$HIW$Fate doesn't follow patterns.$NOR$

Your device generates true entropy.
Quantum hardware randomness.

Mixed with your intention,
your energy, your moment.

$HIY$━━━━━━━━━━━━━━━━━━━━━━━━━━$NOR$`
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      navigation.navigate('Questions');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Questions');
  };

  return (
    <View style={styles.container}>
      <ScanLines />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <NeonText color={NEON_COLORS.hiCyan} style={styles.headerTitle}>
            {'>'} BEFORE WE BEGIN
          </NeonText>
          <NeonText color={NEON_COLORS.dimYellow} style={styles.headerSubtitle}>
            STEP {step + 1} OF {steps.length}
          </NeonText>
        </View>

        {/* Step content */}
        <View style={styles.stepBox}>
          <LPMUDText style={styles.stepTitle}>
            {steps[step].title}
          </LPMUDText>

          <LPMUDText style={styles.stepContent}>
            {steps[step].content}
          </LPMUDText>
        </View>

        {/* Navigation */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.skipButtonText}>
              {'[ SKIP ]'}
            </NeonText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <FlickerText
              color={NEON_COLORS.hiCyan}
              style={styles.nextButtonText}
              flickerSpeed={200}
            >
              {step < steps.length - 1 ? '[ NEXT ]' : '[ BEGIN ]'}
            </FlickerText>
          </TouchableOpacity>
        </View>

        {/* Progress indicators */}
        <View style={styles.progressRow}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  borderColor: i === step ? NEON_COLORS.hiCyan : NEON_COLORS.dimCyan,
                  backgroundColor: i === step ? NEON_COLORS.cyan : 'transparent',
                }
              ]}
            />
          ))}
        </View>
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
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: NEON_COLORS.dimCyan,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  stepBox: {
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    padding: 20,
    marginBottom: 30,
    backgroundColor: '#000000',
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 15,
    lineHeight: 20,
  },
  stepContent: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  skipButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    flex: 0.4,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  nextButton: {
    padding: 15,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    flex: 0.55,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
