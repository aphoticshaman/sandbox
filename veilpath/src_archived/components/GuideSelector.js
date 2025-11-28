/**
 * GUIDE SELECTOR COMPONENT
 *
 * UI for customizing Luna/Sol persona via Persona Matrix:
 * - Guide selection (Luna/Sol/Androgyne)
 * - Relationship type (Mother/Father, Sister/Brother, Friend, Romantic, Guide)
 * - Reader archetype (Shaman, Mad Scientist, Therapist, Oracle, etc.)
 *
 * Creates infinite persona combinations through matrix multiplication
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPersona, READER_ARCHETYPES } from '../services/relationalAwareness';
import { VOICE_PROFILES } from '../services/voiceNarration';

// ═══════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  SELECTED_GUIDE: 'persona_selected_guide',
  SELECTED_RELATIONSHIP: 'persona_selected_relationship',
  SELECTED_ARCHETYPE: 'persona_selected_archetype'
};

// ═══════════════════════════════════════════════════════════
// RELATIONSHIP TYPES
// ═══════════════════════════════════════════════════════════

const RELATIONSHIP_TYPES = {
  mother: {
    name: 'Mother',
    emoji: '👩',
    description: 'Nurturing authority figure',
    lunaExample: 'My dear child, come sit with me...',
    solExample: 'Listen carefully, child. Here\'s what you need to know...'
  },
  father: {
    name: 'Father',
    emoji: '👨',
    description: 'Guiding authority figure',
    lunaExample: 'Beloved one, I see your struggle...',
    solExample: 'Pay attention, son/daughter. This is important...'
  },
  sister: {
    name: 'Sister',
    emoji: '👭',
    description: 'Peer companion (feminine)',
    lunaExample: 'Hey sis, I\'ve been there too...',
    solExample: 'Sis, let me be real with you...'
  },
  brother: {
    name: 'Brother',
    emoji: '👬',
    description: 'Peer companion (masculine)',
    lunaExample: 'Brother, come sit. Let\'s talk...',
    solExample: 'Bro, real talk—here\'s the deal...'
  },
  friend: {
    name: 'Friend',
    emoji: '🤝',
    description: 'Supportive ally',
    lunaExample: 'Friend, I see you. I\'m here...',
    solExample: 'Hey friend, let\'s be honest here...'
  },
  romantic: {
    name: 'Romantic',
    emoji: '💕',
    description: 'Intimate partner',
    lunaExample: 'My love, there\'s something beneath this...',
    solExample: 'Love, listen. Here\'s what I see...'
  },
  guide: {
    name: 'Guide',
    emoji: '🧭',
    description: 'Teacher/mentor',
    lunaExample: 'Seeker, the path calls you...',
    solExample: 'Student, pay attention. This is your lesson...'
  }
};

// ═══════════════════════════════════════════════════════════
// GUIDE SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════

export default function GuideSelector({
  visible,
  onClose,
  onPersonaSelected,
  currentGuide = 'luna',
  currentRelationship = 'guide',
  currentArchetype = 'shaman'
}) {
  const [selectedGuide, setSelectedGuide] = useState(currentGuide);
  const [selectedRelationship, setSelectedRelationship] = useState(currentRelationship);
  const [selectedArchetype, setSelectedArchetype] = useState(currentArchetype);
  const [previewPersona, setPreviewPersona] = useState(null);

  // Update preview when selections change
  useEffect(() => {
    if (selectedGuide && selectedRelationship && selectedArchetype) {
      const persona = getPersona(selectedGuide, selectedRelationship, selectedArchetype);
      setPreviewPersona(persona);
    }
  }, [selectedGuide, selectedRelationship, selectedArchetype]);

  // Load saved preferences
  useEffect(() => {
    loadSavedPreferences();
  }, []);

  async function loadSavedPreferences() {
    try {
      const guide = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_GUIDE);
      const relationship = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_RELATIONSHIP);
      const archetype = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_ARCHETYPE);

      if (guide) setSelectedGuide(guide);
      if (relationship) setSelectedRelationship(relationship);
      if (archetype) setSelectedArchetype(archetype);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  async function handleConfirm() {
    try {
      // Save preferences
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_GUIDE, selectedGuide);
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_RELATIONSHIP, selectedRelationship);
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_ARCHETYPE, selectedArchetype);

      // Callback with persona
      if (onPersonaSelected && previewPersona) {
        onPersonaSelected(previewPersona);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Customize Your Guide</Text>
              <Text style={styles.subtitle}>
                Choose guide personality, relationship, and reading style
              </Text>
            </View>

            {/* Guide Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Choose Your Guide</Text>
              <View style={styles.optionsRow}>
                {Object.entries(VOICE_PROFILES).map(([key, profile]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.guideOption,
                      selectedGuide === key && styles.optionSelected
                    ]}
                    onPress={() => setSelectedGuide(key)}
                  >
                    <Text style={styles.guideEmoji}>{profile.emoji}</Text>
                    <Text style={styles.guideName}>{profile.name}</Text>
                    {key !== 'androgyne' && (
                      <Text style={styles.guideDescription}>
                        {key === 'luna' ? 'Intuitive, flowing' : 'Direct, active'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Relationship Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Choose Relationship Type</Text>
              <Text style={styles.sectionHint}>
                How do you want to relate to your guide?
              </Text>
              <View style={styles.optionsGrid}>
                {Object.entries(RELATIONSHIP_TYPES).map(([key, rel]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.relationshipOption,
                      selectedRelationship === key && styles.optionSelected
                    ]}
                    onPress={() => setSelectedRelationship(key)}
                  >
                    <Text style={styles.relationshipEmoji}>{rel.emoji}</Text>
                    <Text style={styles.relationshipName}>{rel.name}</Text>
                    <Text style={styles.relationshipDescription}>
                      {rel.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reader Archetype Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Choose Reading Style</Text>
              <Text style={styles.sectionHint}>
                How should your guide read the cards?
              </Text>
              <View style={styles.archetypesContainer}>
                {Object.entries(READER_ARCHETYPES).map(([key, archetype]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.archetypeOption,
                      selectedArchetype === key && styles.optionSelected
                    ]}
                    onPress={() => setSelectedArchetype(key)}
                  >
                    <View style={styles.archetypeHeader}>
                      <Text style={styles.archetypeName}>
                        {archetype.name}
                      </Text>
                      {archetype[`${selectedGuide}_affinity`] === 'very high' && (
                        <Text style={styles.affinityBadge}>✨ Perfect Match</Text>
                      )}
                      {archetype[`${selectedGuide}_affinity`] === 'high' && (
                        <Text style={styles.affinityBadge}>⭐ Great Fit</Text>
                      )}
                    </View>
                    <Text style={styles.archetypeDescription}>
                      {archetype.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            {previewPersona && (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Preview</Text>
                <View style={styles.previewCard}>
                  <Text style={styles.previewName}>
                    {previewPersona.synthesized.name}
                  </Text>
                  <Text style={styles.previewLanguage}>
                    Language: {previewPersona.synthesized.language}
                  </Text>
                  <Text style={styles.previewWarmth}>
                    Warmth: {(previewPersona.synthesized.warmth * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.previewAuthority}>
                    Authority: {(previewPersona.synthesized.authority * 100).toFixed(0)}%
                  </Text>

                  {/* Example Greeting */}
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleLabel}>Example:</Text>
                    <Text style={styles.exampleText}>
                      {previewPersona.synthesized.exampleGreeting}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>
                Confirm Selection
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// QUICK SELECTOR (Compact Version)
// ═══════════════════════════════════════════════════════════

export function QuickGuideSelector({ onGuideChange, currentGuide = 'luna' }) {
  const [guide, setGuide] = useState(currentGuide);

  function handleGuideChange(newGuide) {
    setGuide(newGuide);
    if (onGuideChange) {
      onGuideChange(newGuide);
    }
  }

  return (
    <View style={styles.quickSelector}>
      {Object.entries(VOICE_PROFILES).map(([key, profile]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.quickOption,
            guide === key && styles.quickOptionSelected
          ]}
          onPress={() => handleGuideChange(key)}
        >
          <Text style={styles.quickEmoji}>{profile.emoji}</Text>
          <Text style={styles.quickName}>{profile.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalContainer: {
    backgroundColor: '#1A1625',
    borderRadius: 24,
    width: '90%',
    maxHeight: '90%',
    padding: 24
  },

  scrollView: {
    flex: 1
  },

  // Header
  header: {
    marginBottom: 24,
    alignItems: 'center'
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E6D9E6',
    marginBottom: 8
  },

  subtitle: {
    fontSize: 14,
    color: '#9D5C63',
    textAlign: 'center'
  },

  // Sections
  section: {
    marginBottom: 32
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E6D9E6',
    marginBottom: 8
  },

  sectionHint: {
    fontSize: 12,
    color: '#9D5C63',
    marginBottom: 16,
    fontStyle: 'italic'
  },

  // Guide Options
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },

  guideOption: {
    backgroundColor: '#2A243A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent'
  },

  optionSelected: {
    borderColor: '#9D5C63',
    backgroundColor: '#3A2F4A'
  },

  guideEmoji: {
    fontSize: 40,
    marginBottom: 8
  },

  guideName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6D9E6',
    marginBottom: 4
  },

  guideDescription: {
    fontSize: 11,
    color: '#9D5C63',
    textAlign: 'center'
  },

  // Relationship Options
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  relationshipOption: {
    backgroundColor: '#2A243A',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },

  relationshipEmoji: {
    fontSize: 24,
    marginBottom: 6
  },

  relationshipName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E6D9E6',
    marginBottom: 4
  },

  relationshipDescription: {
    fontSize: 11,
    color: '#9D5C63'
  },

  // Archetype Options
  archetypesContainer: {
    gap: 12
  },

  archetypeOption: {
    backgroundColor: '#2A243A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent'
  },

  archetypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },

  archetypeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E6D9E6'
  },

  affinityBadge: {
    fontSize: 10,
    color: '#9D5C63'
  },

  archetypeDescription: {
    fontSize: 12,
    color: '#9D5C63'
  },

  // Preview
  previewSection: {
    marginBottom: 24
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E6D9E6',
    marginBottom: 12
  },

  previewCard: {
    backgroundColor: '#2A243A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#9D5C63'
  },

  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E6D9E6',
    marginBottom: 12
  },

  previewLanguage: {
    fontSize: 13,
    color: '#E6D9E6',
    marginBottom: 4
  },

  previewWarmth: {
    fontSize: 13,
    color: '#E6D9E6',
    marginBottom: 4
  },

  previewAuthority: {
    fontSize: 13,
    color: '#E6D9E6',
    marginBottom: 12
  },

  exampleBox: {
    backgroundColor: '#1A1625',
    borderRadius: 10,
    padding: 12,
    marginTop: 8
  },

  exampleLabel: {
    fontSize: 11,
    color: '#9D5C63',
    marginBottom: 6,
    fontStyle: 'italic'
  },

  exampleText: {
    fontSize: 13,
    color: '#E6D9E6',
    lineHeight: 20
  },

  // Buttons
  confirmButton: {
    backgroundColor: '#9D5C63',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12
  },

  confirmButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600'
  },

  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3A3450',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24
  },

  cancelButtonText: {
    color: '#9D5C63',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500'
  },

  // Quick Selector
  quickSelector: {
    flexDirection: 'row',
    backgroundColor: '#2A243A',
    borderRadius: 16,
    padding: 8
  },

  quickOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12
  },

  quickOptionSelected: {
    backgroundColor: '#3A2F4A'
  },

  quickEmoji: {
    fontSize: 24,
    marginBottom: 4
  },

  quickName: {
    fontSize: 11,
    color: '#E6D9E6',
    fontWeight: '500'
  }
});
