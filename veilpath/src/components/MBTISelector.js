/**
 * MBTI Type Selector - VeilPath WitchTok x Victorian Gothic
 * Dropdown for selecting personality type during onboarding
 * Now with cosmic design and cognitive function hints
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { COSMIC, VictorianCard } from './VeilPathDesign';

// Enhanced MBTI with cognitive function stacks for deeper analysis
const MBTI_TYPES = [
  { code: 'INTJ', name: 'The Architect', description: 'Strategic, analytical, independent',
    functions: ['Ni', 'Te', 'Fi', 'Se'], element: 'air', tarotAffinity: 'swords' },
  { code: 'INTP', name: 'The Logician', description: 'Innovative, curious, philosophical',
    functions: ['Ti', 'Ne', 'Si', 'Fe'], element: 'air', tarotAffinity: 'swords' },
  { code: 'ENTJ', name: 'The Commander', description: 'Bold, decisive, leadership-oriented',
    functions: ['Te', 'Ni', 'Se', 'Fi'], element: 'fire', tarotAffinity: 'wands' },
  { code: 'ENTP', name: 'The Debater', description: 'Quick-witted, strategic, challenging',
    functions: ['Ne', 'Ti', 'Fe', 'Si'], element: 'fire', tarotAffinity: 'wands' },
  { code: 'INFJ', name: 'The Advocate', description: 'Insightful, principled, empathetic',
    functions: ['Ni', 'Fe', 'Ti', 'Se'], element: 'water', tarotAffinity: 'cups' },
  { code: 'INFP', name: 'The Mediator', description: 'Idealistic, creative, compassionate',
    functions: ['Fi', 'Ne', 'Si', 'Te'], element: 'water', tarotAffinity: 'cups' },
  { code: 'ENFJ', name: 'The Protagonist', description: 'Charismatic, inspiring, altruistic',
    functions: ['Fe', 'Ni', 'Se', 'Ti'], element: 'fire', tarotAffinity: 'wands' },
  { code: 'ENFP', name: 'The Campaigner', description: 'Enthusiastic, creative, sociable',
    functions: ['Ne', 'Fi', 'Te', 'Si'], element: 'fire', tarotAffinity: 'wands' },
  { code: 'ISTJ', name: 'The Logistician', description: 'Practical, reliable, responsible',
    functions: ['Si', 'Te', 'Fi', 'Ne'], element: 'earth', tarotAffinity: 'pentacles' },
  { code: 'ISFJ', name: 'The Defender', description: 'Dedicated, warm, protective',
    functions: ['Si', 'Fe', 'Ti', 'Ne'], element: 'earth', tarotAffinity: 'pentacles' },
  { code: 'ESTJ', name: 'The Executive', description: 'Organized, traditional, decisive',
    functions: ['Te', 'Si', 'Ne', 'Fi'], element: 'earth', tarotAffinity: 'pentacles' },
  { code: 'ESFJ', name: 'The Consul', description: 'Caring, social, loyal',
    functions: ['Fe', 'Si', 'Ne', 'Ti'], element: 'earth', tarotAffinity: 'pentacles' },
  { code: 'ISTP', name: 'The Virtuoso', description: 'Bold, practical, experiential',
    functions: ['Ti', 'Se', 'Ni', 'Fe'], element: 'air', tarotAffinity: 'swords' },
  { code: 'ISFP', name: 'The Adventurer', description: 'Flexible, charming, artistic',
    functions: ['Fi', 'Se', 'Ni', 'Te'], element: 'water', tarotAffinity: 'cups' },
  { code: 'ESTP', name: 'The Entrepreneur', description: 'Energetic, perceptive, spontaneous',
    functions: ['Se', 'Ti', 'Fe', 'Ni'], element: 'fire', tarotAffinity: 'wands' },
  { code: 'ESFP', name: 'The Entertainer', description: 'Spontaneous, outgoing, playful',
    functions: ['Se', 'Fi', 'Te', 'Ni'], element: 'fire', tarotAffinity: 'wands' },
];

// Cognitive function descriptions for deeper understanding
const COGNITIVE_FUNCTIONS = {
  Ni: { name: 'Introverted Intuition', icon: '🔮', desc: 'Pattern recognition, foresight' },
  Ne: { name: 'Extroverted Intuition', icon: '✨', desc: 'Possibilities, connections' },
  Ti: { name: 'Introverted Thinking', icon: '🧠', desc: 'Logical frameworks, analysis' },
  Te: { name: 'Extroverted Thinking', icon: '⚡', desc: 'Efficiency, organization' },
  Fi: { name: 'Introverted Feeling', icon: '💜', desc: 'Values, authenticity' },
  Fe: { name: 'Extroverted Feeling', icon: '💕', desc: 'Harmony, empathy' },
  Si: { name: 'Introverted Sensing', icon: '📚', desc: 'Memory, tradition' },
  Se: { name: 'Extroverted Sensing', icon: '🌟', desc: 'Present moment, action' },
};

// Element colors for type display
const ELEMENT_COLORS = {
  fire: COSMIC.candleFlame,
  water: COSMIC.etherealCyan,
  air: COSMIC.crystalPink,
  earth: COSMIC.brassVictorian,
};

export function MBTISelector({ onSelect, onSkip, selectedType = null }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelection, setTempSelection] = useState(selectedType);

  const handleSelect = (type) => {
    setTempSelection(type);
  };

  const handleConfirm = () => {
    if (tempSelection) {
      onSelect(tempSelection);
      setModalVisible(false);
    }
  };

  const selectedTypeData = MBTI_TYPES.find(t => t.code === selectedType);

  // Render cognitive function badges
  const renderFunctionStack = (functions, compact = false) => (
    <View style={[styles.functionStack, compact && styles.functionStackCompact]}>
      {functions.map((fn, idx) => (
        <View key={fn} style={[styles.functionBadge, { opacity: 1 - (idx * 0.15) }]}>
          <Text style={styles.functionIcon}>{COGNITIVE_FUNCTIONS[fn]?.icon}</Text>
          {!compact && <Text style={styles.functionCode}>{fn}</Text>}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Do you know your MBTI type?</Text>
      <Text style={styles.subtitle}>
        Your cognitive function stack shapes how Vera interprets cards for you.
      </Text>

      {/* Current Selection Display */}
      {selectedType && selectedTypeData ? (
        <VictorianCard style={styles.selectedBox} glowColor={ELEMENT_COLORS[selectedTypeData.element]}>
          <View style={styles.selectedHeader}>
            <Text style={[styles.selectedCode, { color: ELEMENT_COLORS[selectedTypeData.element] }]}>
              {selectedTypeData.code}
            </Text>
            <View style={[styles.elementBadge, { backgroundColor: `${ELEMENT_COLORS[selectedTypeData.element]}30` }]}>
              <Text style={[styles.elementText, { color: ELEMENT_COLORS[selectedTypeData.element] }]}>
                {selectedTypeData.element.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.selectedName}>{selectedTypeData.name}</Text>
          <Text style={styles.selectedDescription}>{selectedTypeData.description}</Text>

          {/* Cognitive Function Stack */}
          <View style={styles.functionSection}>
            <Text style={styles.functionLabel}>Cognitive Stack:</Text>
            {renderFunctionStack(selectedTypeData.functions)}
          </View>

          <Text style={styles.tarotHint}>
            Tarot Affinity: {selectedTypeData.tarotAffinity.charAt(0).toUpperCase() + selectedTypeData.tarotAffinity.slice(1)}
          </Text>

          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.changeButtonText}>Change Selection</Text>
          </TouchableOpacity>
        </VictorianCard>
      ) : (
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.selectButtonText}>Select Your Type</Text>
        </TouchableOpacity>
      )}

      {/* Skip Option */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>
          {selectedType ? 'Continue without selection' : 'I\'ll take the full assessment later'}
        </Text>
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your MBTI Type</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.typeList} contentContainerStyle={styles.typeListContent}>
              {MBTI_TYPES.map((type) => {
                const isSelected = tempSelection === type.code;
                const elementColor = ELEMENT_COLORS[type.element];

                return (
                  <TouchableOpacity
                    key={type.code}
                    style={[
                      styles.typeCard,
                      isSelected && styles.typeCardSelected,
                      isSelected && { borderColor: elementColor },
                    ]}
                    onPress={() => handleSelect(type.code)}
                  >
                    <View style={styles.typeHeader}>
                      <View style={styles.typeHeaderLeft}>
                        <Text style={[
                          styles.typeCode,
                          isSelected && { color: elementColor },
                        ]}>
                          {type.code}
                        </Text>
                        <View style={[styles.elementDot, { backgroundColor: elementColor }]} />
                      </View>
                      {isSelected && (
                        <Text style={[styles.checkmark, { color: elementColor }]}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.typeName}>{type.name}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>

                    {/* Compact function stack in modal */}
                    <View style={styles.typeFooter}>
                      {renderFunctionStack(type.functions, true)}
                      <Text style={[styles.suitHint, { color: elementColor }]}>
                        {type.tarotAffinity}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !tempSelection && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!tempSelection}
            >
              <Text style={styles.confirmButtonText}>
                Confirm Selection
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  subtitle: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  selectedBox: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  selectedCode: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  elementBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  elementText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 6,
  },
  selectedDescription: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  functionSection: {
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  functionLabel: {
    fontSize: 11,
    color: COSMIC.brassVictorian,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  functionStack: {
    flexDirection: 'row',
    gap: 8,
  },
  functionStackCompact: {
    gap: 4,
  },
  functionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  functionIcon: {
    fontSize: 14,
  },
  functionCode: {
    fontSize: 11,
    color: COSMIC.moonGlow,
    fontWeight: '600',
  },
  tarotHint: {
    fontSize: 12,
    color: COSMIC.etherealCyan,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  changeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  changeButtonText: {
    fontSize: 14,
    color: COSMIC.candleFlame,
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: COSMIC.candleFlame,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
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
  selectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 25, 0.95)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COSMIC.midnightVoid,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingTop: 20,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.4)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  modalClose: {
    fontSize: 28,
    color: COSMIC.crystalPink,
    fontWeight: '300',
  },
  typeList: {
    flex: 1,
  },
  typeListContent: {
    padding: 16,
    paddingBottom: 40,
  },
  typeCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.2)',
  },
  typeCardSelected: {
    backgroundColor: 'rgba(75, 0, 130, 0.3)',
    borderWidth: 2,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeCode: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  elementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkmark: {
    fontSize: 24,
    fontWeight: '700',
  },
  typeName: {
    fontSize: 15,
    fontWeight: '600',
    color: COSMIC.crystalPink,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    opacity: 0.8,
    marginBottom: 10,
  },
  typeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.15)',
  },
  suitHint: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  confirmButton: {
    backgroundColor: COSMIC.candleFlame,
    margin: 20,
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
  confirmButtonDisabled: {
    backgroundColor: 'rgba(184, 134, 11, 0.3)',
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },
});

// Export cognitive function data for use in other components
export { MBTI_TYPES, COGNITIVE_FUNCTIONS, ELEMENT_COLORS };
export default MBTISelector;
