/**
 * READING TYPE SCREEN - Select reading category
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NeonText, LPMUDText, GlitchText, ScanLines } from '../components/TemporaryTextComponents';
import { NEON_COLORS } from '../components/TemporaryTextComponents';
import { FeatureGate } from '../utils/featureGate';
import BadgeDisplay from '../components/BadgeDisplay';

const READING_TYPES = [
  {
    id: 'career',
    name: 'CAREER',
    color: '$HIC$',
    description: 'Your ambition hungers. Let me feed it.',
    icon: '▲'
  },
  {
    id: 'romance',
    name: 'ROMANCE',
    color: '$HIM$',
    description: 'The heart craves what it craves. Show me.',
    icon: '♥'
  },
  {
    id: 'wellness',
    name: 'WELLNESS',
    color: '$HIG$',
    description: "Your body whispers secrets. I'm listening.",
    icon: '+'
  },
  {
    id: 'finance',
    name: 'FINANCE',
    color: '$HIY$',
    description: 'Power flows where attention goes. Claim it.',
    icon: '$'
  },
  {
    id: 'personal_growth',
    name: 'PERSONAL GROWTH',
    color: '$HIW$',
    description: "Transformation is brutal. You're ready.",
    icon: '◆'
  },
  {
    id: 'decision',
    name: 'DECISION',
    color: '$HIR$',
    description: 'Two paths. One truth. Choose with me.',
    icon: '⚡'
  },
  {
    id: 'general',
    name: 'GENERAL',
    color: '$HIC$',
    description: 'No questions yet? Let fate decide for you.',
    icon: '◉'
  },
  {
    id: 'shadow_work',
    name: 'SHADOW WORK',
    color: '$HIM$',
    description: "Face what you've buried. I'll hold your hand.",
    icon: '◢'
  },
  {
    id: 'family',
    name: 'FAMILY',
    color: '$HIG$',
    description: 'Blood or chosen - these bonds shape you. Explore them.',
    icon: '◈'
  }
];

// Obfuscated pattern checker
const _map = { career: 0, romance: 1, wellness: 2, finance: 3, personal_growth: 4, decision: 5, general: 6, shadow_work: 7, family: 8 };
const _p = [0, 4, 1, 0, 4, 1, 0, 4, 1]; // C.P.R. x3
const _pReverse = [1, 4, 0, 1, 4, 0, 1, 4, 0]; // R.P.C. x3
const _key = '@_lw_active';
const _seqKey = '@_pattern_seq'; // Persist sequence across navigations

// Check if sequence is valid SO FAR (progressive validation)
function _isValidSoFar(seq) {
  if (seq.length === 0) return true;

  // Check if it matches CPR pattern so far
  let matchesCPR = true;
  for (let i = 0; i < seq.length; i++) {
    if (seq[i] !== _p[i]) {
      matchesCPR = false;
      break;
    }
  }

  // Check if it matches RPC pattern so far
  let matchesRPC = true;
  for (let i = 0; i < seq.length; i++) {
    if (seq[i] !== _pReverse[i]) {
      matchesRPC = false;
      break;
    }
  }

  return matchesCPR || matchesRPC;
}

// Check if complete pattern is CPR
function _isCompleteCPR(seq) {
  if (seq.length !== _p.length) return false;
  for (let i = 0; i < _p.length; i++) {
    if (seq[i] !== _p[i]) return false;
  }
  return true;
}

// Check if complete pattern is RPC
function _isCompleteRPC(seq) {
  if (seq.length !== _pReverse.length) return false;
  for (let i = 0; i < _pReverse.length; i++) {
    if (seq[i] !== _pReverse[i]) return false;
  }
  return true;
}

async function _clearSeq() {
  await AsyncStorage.removeItem(_seqKey);
}

async function _saveSeq(seq) {
  await AsyncStorage.setItem(_seqKey, JSON.stringify(seq));
  await AsyncStorage.setItem('@_pattern_last_activity', Date.now().toString());
}

async function _loadSeq() {
  try {
    const data = await AsyncStorage.getItem(_seqKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

async function _unlock() {
  try {
    await AsyncStorage.setItem(_key, 'true');
    await AsyncStorage.setItem('@veilpath_premium_override', 'lightworker');
    await _clearSeq(); // Clear pattern
    FeatureGate.setOverride(true); // Update cache immediately

    // Unlock achievement
    const { unlockAchievements } = require('../services/achievementSystem');
    await unlockAchievements(['lightworker_mode']);

    Alert.alert(
      '◢ You found the pattern.',
      "Clever.\n\nI've been waiting for someone like you.\n\nThe doors are open now. Everything I have is yours.\n\n[Achievement Unlocked: The Seeker]",
      [
        {
          text: 'Show me',
          onPress: () => {
            // Optional: Navigate to welcome screen to refresh UI
          }
        }
      ]
    );
  } catch (error) {
    console.error('_unlock error:', error);
  }
}

async function _lock() {
  try {
    await AsyncStorage.removeItem('@veilpath_premium_override');
    await AsyncStorage.removeItem(_key);
    await _clearSeq(); // Clear pattern
    FeatureGate.setOverride(false); // Update cache immediately

    // Unlock achievement
    const { unlockAchievements } = require('../services/achievementSystem');
    await unlockAchievements(['shut_the_door']);

    Alert.alert(
      '◢ Pattern reversed.',
      "The doors close.\n\nYou're back where you started.\n\nFind the pattern again when you're ready.\n\n[Achievement Unlocked: The Closer]",
      [
        {
          text: 'Understood',
          onPress: () => {
            // Optional: Navigate to welcome screen to refresh UI
          }
        }
      ]
    );
  } catch (error) {
    console.error('_lock error:', error);
  }
}

export default function ReadingTypeScreen({ route, navigation }) {
  const { zodiacSign, birthdate } = route.params;
  const [selected, setSelected] = useState(null);
  const [_k, _setK] = useState([]);

  // Load persisted sequence on mount, but clear if stale (>5 minutes old)
  useEffect(() => {
    const initSequence = async () => {
      const seq = await _loadSeq();
      const lastActivity = await AsyncStorage.getItem('@_pattern_last_activity');
      const now = Date.now();

      if (lastActivity && (now - parseInt(lastActivity)) > 5 * 60 * 1000) {
        // Stale pattern (>5 min old) - clear it
        await _clearSeq();
        _setK([]);
      } else {
        _setK(seq);
      }
    };
    initSequence();
  }, []);

  // Clear pattern on unmount or navigation away
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      _clearSeq();
    });

    return () => {
      _clearSeq();
      unsubscribe();
    };
  }, [navigation]);

  const handleSelect = async (type) => {
    const currentSeq = await _loadSeq();
    const newSeq = [...currentSeq, _map[type]];

    // Check if sequence is valid so far (progressive validation)
    if (!_isValidSoFar(newSeq)) {
      // Pattern broken - reset immediately
      await _clearSeq();
      _setK([]);
      // Continue to normal selection
    } else if (_isCompleteCPR(newSeq)) {
      // CPR x3 complete - unlock premium
      await _unlock();
      _setK([]);
      return; // Don't navigate or select
    } else if (_isCompleteRPC(newSeq)) {
      // RPC x3 complete - lock premium
      await _lock();
      _setK([]);
      return; // Don't navigate or select
    } else {
      // Pattern still building - save progress
      await _saveSeq(newSeq);
      _setK(newSeq);
    }

    // Normal selection behavior
    if (selected === type) {
      // Second tap - confirm and navigate (also clears pattern)
      await _clearSeq();
      navigation.navigate('Intention', { readingType: type, zodiacSign, birthdate });
    } else {
      // First tap - select
      setSelected(type);
    }
  };

  return (
    <View style={styles.container}>
      <ScanLines />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Navigation bar - Back and Settings */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <NeonText color={NEON_COLORS.hiYellow} style={styles.backText}>
              {'[ ← BACK ]'}
            </NeonText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <NeonText color={NEON_COLORS.dimCyan} style={styles.settingsText}>
              {'⚙'}
            </NeonText>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <GlitchText style={styles.headerTitle} glitchChance={0.03}>
            {'>'} WHAT DO YOU CRAVE?
          </GlitchText>
          <NeonText color={NEON_COLORS.dimYellow} style={styles.headerSubtitle}>
            Tell me what keeps you up at night.
          </NeonText>
        </View>

        {/* Badge Display */}
        <BadgeDisplay
          onPress={() => navigation.navigate('Achievements')}
          compact={false}
        />

        {/* Quick stats navigation */}
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => navigation.navigate('Stats')}
        >
          <NeonText color={NEON_COLORS.hiCyan} style={styles.statsButtonText}>
            {'[ VIEW STATS & INSIGHTS ]'}
          </NeonText>
        </TouchableOpacity>

        {/* Reading types grid */}
        <View style={styles.grid}>
          {READING_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => handleSelect(type.id)}
              style={[
                styles.typeCard,
                selected === type.id && styles.typeCardSelected
              ]}
            >
              <View style={styles.typeHeader}>
                <LPMUDText style={styles.typeIcon}>
                  {type.color}{type.icon}$NOR$
                </LPMUDText>
                <LPMUDText style={styles.typeName}>
                  {type.color}{type.name}$NOR$
                </LPMUDText>
              </View>

              <NeonText
                color={NEON_COLORS.dimWhite}
                style={styles.typeDescription}
              >
                {type.description}
              </NeonText>

              {selected === type.id && (
                <View style={styles.selectedIndicator}>
                  <NeonText color={NEON_COLORS.hiCyan} style={styles.selectedText}>
                    {'[ TAP AGAIN TO CONFIRM ]'}
                  </NeonText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

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
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    marginTop: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  settingsButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
  },
  settingsText: {
    fontSize: 20,
    fontFamily: 'monospace',
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
    color: NEON_COLORS.hiCyan,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  grid: {
    gap: 15,
  },
  typeCard: {
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    padding: 15,
    backgroundColor: '#000000',
  },
  typeCardSelected: {
    borderColor: NEON_COLORS.hiCyan,
    borderWidth: 3,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  typeIcon: {
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  typeName: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  typeDescription: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  selectedIndicator: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: NEON_COLORS.hiCyan,
  },
  selectedText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  spacer: {
    height: 40,
  },
  statsButton: {
    padding: 12,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#0a0a0a',
  },
  statsButtonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
