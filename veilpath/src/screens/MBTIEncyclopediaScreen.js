/**
 * MBTI Encyclopedia Screen - VeilPath
 * Browse all 16 MBTI types with overview and dropdown selector
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { useUserStore } from '../stores/userStore';
import {
  MBTI_OVERVIEW,
  MBTI_TYPES,
  MBTI_DROPDOWN_OPTIONS,
  COGNITIVE_FUNCTIONS,
} from '../data/mbtiEncyclopedia';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

// Type groups for organized display
const TYPE_GROUPS = {
  analysts: {
    name: 'Analysts',
    subtitle: 'Intuitive Thinkers (NT)',
    icon: '🧠',
    color: COSMIC.etherealCyan,
    types: ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
  },
  diplomats: {
    name: 'Diplomats',
    subtitle: 'Intuitive Feelers (NF)',
    icon: '💫',
    color: COSMIC.crystalPink,
    types: ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
  },
  sentinels: {
    name: 'Sentinels',
    subtitle: 'Sensing Judgers (SJ)',
    icon: '🛡️',
    color: COSMIC.candleFlame,
    types: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
  },
  explorers: {
    name: 'Explorers',
    subtitle: 'Sensing Perceivers (SP)',
    icon: '🌟',
    color: COSMIC.deepAmethyst,
    types: ['ISTP', 'ISFP', 'ESTP', 'ESFP'],
  },
};

// Element colors
const ELEMENT_COLORS = {
  fire: '#FF6B35',
  water: '#4ECDC4',
  air: '#95E1D3',
  earth: '#C4A77D',
};

export default function MBTIEncyclopediaScreen({ navigation, route }) {
  const { setMBTI = false, fromQuiz = false } = route.params || {};
  const userStore = useUserStore();
  const currentMBTI = userStore.profile?.mbtiType;

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedType, setSelectedType] = useState(currentMBTI || null);

  // Handle type selection from dropdown
  const handleSelectType = (typeCode) => {
    setSelectedType(typeCode);
    setShowDropdown(false);

    if (setMBTI) {
      // If in set mode, save the type
      userStore.setMBTIType(typeCode, 'self-selected');
    }
  };

  // Navigate to type detail
  const handleViewType = (typeCode) => {
    navigation.navigate('MBTITypeDetail', { typeCode });
  };

  // Render type card
  const renderTypeCard = (typeCode) => {
    const type = MBTI_TYPES[typeCode];
    if (!type) return null;

    const isCurrentType = currentMBTI === typeCode;
    const elementColor = ELEMENT_COLORS[type.element] || COSMIC.candleFlame;

    return (
      <TouchableOpacity
        key={typeCode}
        onPress={() => handleViewType(typeCode)}
        style={styles.typeCardWrapper}
      >
        <VictorianCard
          style={[
            styles.typeCard,
            isCurrentType && styles.typeCardCurrent,
          ]}
          showCorners={false}
        >
          <View style={styles.typeCardHeader}>
            <Text style={[styles.typeCode, { color: elementColor }]}>
              {type.code}
            </Text>
            {isCurrentType && (
              <View style={styles.yourTypeBadge}>
                <Text style={styles.yourTypeText}>YOU</Text>
              </View>
            )}
          </View>
          <Text style={styles.typeNickname}>{type.nickname}</Text>
          <View style={[styles.elementBadge, { backgroundColor: `${elementColor}30` }]}>
            <Text style={[styles.elementText, { color: elementColor }]}>
              {type.element.charAt(0).toUpperCase() + type.element.slice(1)}
            </Text>
          </View>
        </VictorianCard>
      </TouchableOpacity>
    );
  };

  return (
    <VeilPathScreen intensity="medium" scrollable={true}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <SectionHeader
        icon="🔮"
        title="MBTI Encyclopedia"
        subtitle="Discover Your Type"
      />

      {/* Set Type Section (if in set mode or no type) */}
      {(setMBTI || !currentMBTI) && (
        <VictorianCard style={styles.setTypeCard} glowColor={COSMIC.deepAmethyst}>
          <Text style={styles.setTypeTitle}>
            {currentMBTI ? 'Change Your Type' : 'Select Your Type'}
          </Text>
          <Text style={styles.setTypeSubtext}>
            {currentMBTI
              ? 'Choose a different type if you know your MBTI'
              : 'Choose your type from the dropdown or explore below'}
          </Text>

          {/* Dropdown Selector */}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>
              {selectedType
                ? `${selectedType} - ${MBTI_TYPES[selectedType]?.nickname}`
                : 'Select your type...'}
            </Text>
            <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Dropdown Options */}
          {showDropdown && (
            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
              {MBTI_DROPDOWN_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownOption,
                    selectedType === option.value && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => handleSelectType(option.value)}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      selectedType === option.value && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.dropdownOptionElement}>
                    {option.element}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Confirm Button (if type selected and in set mode) */}
          {setMBTI && selectedType && selectedType !== currentMBTI && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                userStore.setMBTIType(selectedType, 'self-selected');
                navigation.goBack();
              }}
            >
              <Text style={styles.confirmButtonText}>
                Set as My Type
              </Text>
            </TouchableOpacity>
          )}
        </VictorianCard>
      )}

      {/* Current Type Highlight */}
      {currentMBTI && MBTI_TYPES[currentMBTI] && !setMBTI && (
        <TouchableOpacity onPress={() => handleViewType(currentMBTI)}>
          <VictorianCard style={styles.currentTypeCard} glowColor={COSMIC.candleFlame}>
            <View style={styles.currentTypeHeader}>
              <View>
                <Text style={styles.currentTypeLabel}>Your Type</Text>
                <Text style={styles.currentTypeCode}>{currentMBTI}</Text>
              </View>
              <View style={styles.currentTypeInfo}>
                <Text style={styles.currentTypeNickname}>
                  {MBTI_TYPES[currentMBTI].nickname}
                </Text>
                <Text style={styles.currentTypeSummary}>
                  {MBTI_TYPES[currentMBTI].summary}
                </Text>
              </View>
            </View>
            <Text style={styles.tapToLearn}>Tap to learn more →</Text>
          </VictorianCard>
        </TouchableOpacity>
      )}

      <CosmicDivider />

      {/* Overview Section */}
      <SectionHeader icon="📖" title="What is MBTI?" />
      <VictorianCard style={styles.overviewCard}>
        <Text style={styles.overviewText}>{MBTI_OVERVIEW.introduction}</Text>
      </VictorianCard>

      {/* Dimensions */}
      <SectionHeader icon="⚖️" title="The Four Dimensions" />
      <View style={styles.dimensionsGrid}>
        {MBTI_OVERVIEW.dimensions.map((dim, index) => (
          <VictorianCard key={index} style={styles.dimensionCard} showCorners={false}>
            <Text style={styles.dimensionName}>{dim.name}</Text>
            <View style={styles.polesRow}>
              <Text style={styles.pole}>{dim.poles[0]}</Text>
              <Text style={styles.poleVs}>vs</Text>
              <Text style={styles.pole}>{dim.poles[1]}</Text>
            </View>
            <Text style={styles.dimensionDesc}>{dim.description}</Text>
          </VictorianCard>
        ))}
      </View>

      <CosmicDivider />

      {/* Type Browser */}
      <SectionHeader icon="🎭" title="Browse All Types" />

      {/* Type Groups */}
      {Object.entries(TYPE_GROUPS).map(([groupId, group]) => (
        <View key={groupId} style={styles.groupSection}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupIcon}>{group.icon}</Text>
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, { color: group.color }]}>
                {group.name}
              </Text>
              <Text style={styles.groupSubtitle}>{group.subtitle}</Text>
            </View>
          </View>

          <View style={styles.typeGrid}>
            {group.types.map((typeCode) => renderTypeCard(typeCode))}
          </View>
        </View>
      ))}

      <CosmicDivider />

      {/* Cognitive Functions */}
      <SectionHeader icon="🧩" title="Cognitive Functions" />
      <VictorianCard style={styles.functionsCard}>
        <Text style={styles.functionsIntro}>{MBTI_OVERVIEW.cognitiveFunctions}</Text>

        <View style={styles.functionsGrid}>
          {Object.entries(COGNITIVE_FUNCTIONS).map(([code, func]) => (
            <View key={code} style={styles.functionItem}>
              <Text style={[styles.functionCode, { color: func.color }]}>
                {code}
              </Text>
              <Text style={styles.functionName}>{func.name}</Text>
            </View>
          ))}
        </View>
      </VictorianCard>

      {/* Take Quiz CTA */}
      {!currentMBTI && (
        <VictorianCard style={styles.quizCTA} glowColor={COSMIC.crystalPink}>
          <Text style={styles.quizCTATitle}>Not sure of your type?</Text>
          <Text style={styles.quizCTAText}>
            Take our personality quiz to discover which of the 16 types best describes you.
          </Text>
          <TouchableOpacity
            style={styles.quizButton}
            onPress={() => navigation.navigate('Onboarding', { skipToQuiz: true })}
          >
            <Text style={styles.quizButtonText}>Take the Quiz</Text>
          </TouchableOpacity>
        </VictorianCard>
      )}

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
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

  // Set Type Section
  setTypeCard: {
    padding: 20,
    marginBottom: 20,
  },
  setTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  setTypeSubtext: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 20,
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: COSMIC.candleFlame,
  },
  dropdownList: {
    maxHeight: 250,
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: COSMIC.brassVictorian,
    borderRadius: 10,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.2)',
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
  },
  dropdownOptionTextSelected: {
    color: COSMIC.candleFlame,
    fontWeight: '700',
  },
  dropdownOptionElement: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  confirmButton: {
    marginTop: 16,
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
    }),
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },

  // Current Type Card
  currentTypeCard: {
    padding: 20,
    marginBottom: 20,
  },
  currentTypeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currentTypeLabel: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  currentTypeCode: {
    fontSize: 36,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  currentTypeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  currentTypeNickname: {
    fontSize: 18,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 6,
  },
  currentTypeSummary: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.8,
    lineHeight: 18,
  },
  tapToLearn: {
    fontSize: 12,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Overview
  overviewCard: {
    padding: 16,
    marginBottom: 20,
  },
  overviewText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    opacity: 0.9,
  },

  // Dimensions
  dimensionsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  dimensionCard: {
    padding: 14,
  },
  dimensionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  polesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pole: {
    fontSize: 13,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    flex: 1,
  },
  poleVs: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.6,
    marginHorizontal: 8,
  },
  dimensionDesc: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.8,
    lineHeight: 18,
  },

  // Type Groups
  groupSection: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  groupSubtitle: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },

  // Type Grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCardWrapper: {
    width: '48%',
  },
  typeCard: {
    padding: 14,
    alignItems: 'center',
  },
  typeCardCurrent: {
    borderColor: COSMIC.candleFlame,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
  },
  typeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeCode: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  yourTypeBadge: {
    backgroundColor: COSMIC.candleFlame,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  yourTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },
  typeNickname: {
    fontSize: 11,
    color: COSMIC.moonGlow,
    textAlign: 'center',
    marginBottom: 6,
  },
  elementBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  elementText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Functions
  functionsCard: {
    padding: 16,
    marginBottom: 20,
  },
  functionsIntro: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.9,
  },
  functionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  functionItem: {
    width: '23%',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  functionCode: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  functionName: {
    fontSize: 9,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    opacity: 0.8,
  },

  // Quiz CTA
  quizCTA: {
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  quizCTATitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  quizCTAText: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.8,
  },
  quizButton: {
    backgroundColor: COSMIC.deepAmethyst,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COSMIC.candleFlame,
  },
  quizButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    letterSpacing: 1,
  },

  bottomSpacer: {
    height: 40,
  },
});
