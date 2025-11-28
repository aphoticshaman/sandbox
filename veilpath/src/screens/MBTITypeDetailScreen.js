/**
 * MBTI Type Detail Screen - VeilPath
 * Full 250-500 word entry for individual personality types
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useUserStore } from '../stores/userStore';
import { MBTI_TYPES, COGNITIVE_FUNCTIONS } from '../data/mbtiEncyclopedia';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

// Element colors
const ELEMENT_COLORS = {
  fire: '#FF6B35',
  water: '#4ECDC4',
  air: '#95E1D3',
  earth: '#C4A77D',
};

// Tarot suit icons
const SUIT_ICONS = {
  wands: '🔥',
  cups: '💧',
  swords: '💨',
  pentacles: '🌍',
};

export default function MBTITypeDetailScreen({ navigation, route }) {
  const { typeCode } = route.params || {};
  const userStore = useUserStore();
  const currentMBTI = userStore.profile?.mbtiType;

  const type = MBTI_TYPES[typeCode];

  if (!type) {
    return (
      <VeilPathScreen intensity="medium" scrollable={false}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <VictorianCard style={styles.errorCard}>
          <Text style={styles.errorText}>Type not found</Text>
        </VictorianCard>
      </VeilPathScreen>
    );
  }

  const elementColor = ELEMENT_COLORS[type.element] || COSMIC.candleFlame;
  const isCurrentType = currentMBTI === typeCode;

  // Handle setting this as user's type
  const handleSetAsMyType = () => {
    userStore.updateProfile({ mbtiType: typeCode });
  };

  // Navigate to another type
  const handleNavigateToType = (code) => {
    navigation.push('MBTITypeDetail', { typeCode: code });
  };

  // Get related types (same temperament group)
  const getRelatedTypes = () => {
    const allTypes = Object.keys(MBTI_TYPES);
    const temperament = typeCode.substring(1, 3); // NT, NF, SJ, SP

    return allTypes.filter((t) => {
      if (t === typeCode) return false;
      const tTemp = t.substring(1, 3);
      // Match similar temperament
      return tTemp === temperament;
    });
  };

  const relatedTypes = getRelatedTypes();

  return (
    <VeilPathScreen intensity="medium" scrollable={true}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back to Encyclopedia</Text>
      </TouchableOpacity>

      {/* Hero Section */}
      <VictorianCard style={styles.heroCard} glowColor={elementColor}>
        <View style={styles.heroHeader}>
          <View style={styles.heroLeft}>
            <Text style={[styles.typeCode, { color: elementColor }]}>
              {type.code}
            </Text>
            <Text style={styles.typeNickname}>{type.nickname}</Text>
          </View>
          <View style={styles.heroRight}>
            {isCurrentType && (
              <View style={styles.yourTypeBadge}>
                <Text style={styles.yourTypeText}>YOUR TYPE</Text>
              </View>
            )}
            <View style={[styles.elementBadge, { backgroundColor: `${elementColor}30` }]}>
              <Text style={[styles.elementText, { color: elementColor }]}>
                {type.element.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <Text style={styles.summary}>{type.summary}</Text>

        {/* Set as My Type Button */}
        {!isCurrentType && (
          <TouchableOpacity
            style={styles.setTypeButton}
            onPress={handleSetAsMyType}
          >
            <Text style={styles.setTypeButtonText}>Set as My Type</Text>
          </TouchableOpacity>
        )}
      </VictorianCard>

      {/* Cognitive Functions */}
      <SectionHeader icon="🧩" title="Cognitive Stack" />
      <VictorianCard style={styles.functionsCard}>
        <View style={styles.functionStack}>
          {type.cognitiveFunctions.map((funcCode, index) => {
            const func = COGNITIVE_FUNCTIONS[funcCode];
            const labels = ['Dominant', 'Auxiliary', 'Tertiary', 'Inferior'];
            return (
              <View key={funcCode} style={styles.functionRow}>
                <View style={styles.functionPosition}>
                  <Text style={styles.functionPositionNum}>{index + 1}</Text>
                  <Text style={styles.functionPositionLabel}>
                    {labels[index]}
                  </Text>
                </View>
                <View style={styles.functionInfo}>
                  <Text style={[styles.functionCode, { color: func?.color || COSMIC.candleFlame }]}>
                    {funcCode}
                  </Text>
                  <Text style={styles.functionName}>
                    {func?.name || funcCode}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </VictorianCard>

      <CosmicDivider />

      {/* Full Description */}
      <SectionHeader icon="📖" title="Full Profile" />
      <VictorianCard style={styles.descriptionCard}>
        <Text style={styles.fullDescription}>{type.fullDescription}</Text>
      </VictorianCard>

      <CosmicDivider />

      {/* Strengths & Challenges */}
      <View style={styles.traitsRow}>
        <VictorianCard style={styles.traitCard}>
          <Text style={styles.traitTitle}>✨ Strengths</Text>
          {type.strengths.map((strength, index) => (
            <View key={index} style={styles.traitItem}>
              <Text style={styles.traitBullet}>•</Text>
              <Text style={styles.traitText}>{strength}</Text>
            </View>
          ))}
        </VictorianCard>

        <VictorianCard style={styles.traitCard}>
          <Text style={[styles.traitTitle, { color: COSMIC.crystalPink }]}>
            🌑 Challenges
          </Text>
          {type.challenges.map((challenge, index) => (
            <View key={index} style={styles.traitItem}>
              <Text style={styles.traitBullet}>•</Text>
              <Text style={styles.traitText}>{challenge}</Text>
            </View>
          ))}
        </VictorianCard>
      </View>

      <CosmicDivider />

      {/* Tarot Connection */}
      <SectionHeader icon="🎴" title="Tarot Affinity" />
      <VictorianCard style={styles.tarotCard} glowColor={COSMIC.deepAmethyst}>
        <View style={styles.tarotHeader}>
          <Text style={styles.tarotSuitIcon}>
            {SUIT_ICONS[type.tarotAffinity]}
          </Text>
          <View style={styles.tarotSuitInfo}>
            <Text style={styles.tarotSuitName}>
              {type.tarotAffinity.charAt(0).toUpperCase() + type.tarotAffinity.slice(1)}
            </Text>
            <Text style={styles.tarotSuitDesc}>Primary Suit Resonance</Text>
          </View>
        </View>

        <Text style={styles.tarotCardsLabel}>Associated Cards:</Text>
        <View style={styles.tarotCardsRow}>
          {type.tarotCards.map((card, index) => (
            <View key={index} style={styles.tarotCardChip}>
              <Text style={styles.tarotCardText}>{card}</Text>
            </View>
          ))}
        </View>
      </VictorianCard>

      {/* Growth Path */}
      <SectionHeader icon="🌱" title="Growth Path" />
      <VictorianCard style={styles.growthCard}>
        <Text style={styles.growthText}>{type.growthPath}</Text>
      </VictorianCard>

      <CosmicDivider />

      {/* Related Types */}
      <SectionHeader icon="🔗" title="Related Types" />
      <View style={styles.relatedGrid}>
        {relatedTypes.map((code) => {
          const relatedType = MBTI_TYPES[code];
          if (!relatedType) return null;
          const relatedColor = ELEMENT_COLORS[relatedType.element] || COSMIC.candleFlame;

          return (
            <TouchableOpacity
              key={code}
              style={styles.relatedCard}
              onPress={() => handleNavigateToType(code)}
            >
              <VictorianCard style={styles.relatedCardInner} showCorners={false}>
                <Text style={[styles.relatedCode, { color: relatedColor }]}>
                  {code}
                </Text>
                <Text style={styles.relatedNickname}>{relatedType.nickname}</Text>
              </VictorianCard>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Browse All Link */}
      <TouchableOpacity
        style={styles.browseAllButton}
        onPress={() => navigation.navigate('MBTIEncyclopedia')}
      >
        <Text style={styles.browseAllText}>Browse All 16 Types →</Text>
      </TouchableOpacity>

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

  // Hero
  heroCard: {
    padding: 24,
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLeft: {},
  heroRight: {
    alignItems: 'flex-end',
  },
  typeCode: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    letterSpacing: 2,
  },
  typeNickname: {
    fontSize: 20,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  yourTypeBadge: {
    backgroundColor: COSMIC.candleFlame,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  yourTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },
  elementBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  elementText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  summary: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 16,
  },
  setTypeButton: {
    backgroundColor: 'rgba(74, 20, 140, 0.4)',
    borderWidth: 1,
    borderColor: COSMIC.candleFlame,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  setTypeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    letterSpacing: 1,
  },

  // Functions
  functionsCard: {
    padding: 16,
    marginBottom: 20,
  },
  functionStack: {
    gap: 12,
  },
  functionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  functionPosition: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  functionPositionNum: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginRight: 6,
  },
  functionPositionLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  functionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  functionCode: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
  },
  functionName: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    opacity: 0.8,
  },

  // Description
  descriptionCard: {
    padding: 20,
    marginBottom: 20,
  },
  fullDescription: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    opacity: 0.9,
  },

  // Traits
  traitsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  traitCard: {
    flex: 1,
    padding: 14,
  },
  traitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 10,
  },
  traitItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  traitBullet: {
    fontSize: 12,
    color: COSMIC.etherealCyan,
    marginRight: 8,
  },
  traitText: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    flex: 1,
    lineHeight: 18,
    opacity: 0.85,
  },

  // Tarot
  tarotCard: {
    padding: 18,
    marginBottom: 20,
  },
  tarotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tarotSuitIcon: {
    fontSize: 36,
    marginRight: 14,
  },
  tarotSuitInfo: {},
  tarotSuitName: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  tarotSuitDesc: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  tarotCardsLabel: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tarotCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tarotCardChip: {
    backgroundColor: 'rgba(74, 20, 140, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  tarotCardText: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    fontWeight: '500',
  },

  // Growth
  growthCard: {
    padding: 18,
    marginBottom: 20,
  },
  growthText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    fontStyle: 'italic',
    opacity: 0.9,
  },

  // Related
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  relatedCard: {
    width: '31%',
  },
  relatedCardInner: {
    padding: 12,
    alignItems: 'center',
  },
  relatedCode: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  relatedNickname: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textAlign: 'center',
  },

  // Browse All
  browseAllButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  browseAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: COSMIC.etherealCyan,
    letterSpacing: 1,
  },

  // Error
  errorCard: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COSMIC.crystalPink,
  },

  bottomSpacer: {
    height: 40,
  },
});
