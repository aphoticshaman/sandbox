/**
 * Card Interpretation Screen - VeilPath Magazine Layout
 * Clean two-column design with proper information hierarchy
 * - Left: Card hero + Vera interpretation
 * - Right: Quick facts + Actions
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { TarotCard } from '../components';
import { getInterpretation } from '../data/tarotDeckAdapter';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  CosmicButton,
  FeaturePill,
} from '../components/VeilPathDesign';

// Coherence integration with AdaptiveAI
import { useCoherence } from '../contexts/CoherenceContext';
import { useBehavioralSignals } from '../hooks/useBehavioralSignals';
import { adaptiveAI } from '../core/AdaptiveAI';

// Stores for personalized context
import { useUserStore } from '../stores/userStore';
import { useReadingStore } from '../stores/readingStore';
import { useJournalStore } from '../stores/journalStore';

// Responsive layout hook
const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
    height,
  };
};

export default function CardInterpretationScreen({ navigation, route }) {
  const {
    card,
    isReversed = false,
    readingType = 'single',
    position,
    tier = 'common',
    assetType = 'png',
    imageOverride = null,
  } = route.params;

  // Stores for personalized context
  const user = useUserStore();
  const readingStore = useReadingStore();
  const journalStore = useJournalStore();

  // Layout
  const { isMobile, isDesktop } = useResponsiveLayout();

  // LLM interpretation state
  const [llmInterpretation, setLlmInterpretation] = useState(null);
  const [llmLoading, setLlmLoading] = useState(true);
  const [llmError, setLlmError] = useState(null);
  const interpretationOpacity = useState(new Animated.Value(0))[0];

  // Expanded sections state
  const [expandedSection, setExpandedSection] = useState(null);

  // Coherence integration
  const { injectPhases, R, state, persona } = useCoherence();
  const { handlers, recordScreenChange } = useBehavioralSignals({
    onPhasesUpdate: (phaseData) => injectPhases(phaseData.phases),
  });

  useEffect(() => {
    recordScreenChange('CardInterpretationScreen');
  }, [recordScreenChange]);

  // Get coherence-gated AI prompt config
  const aiConfig = useMemo(() => {
    return adaptiveAI.getReadingPromptConfig(card, {
      isReversed,
      position,
      question: route.params?.intention,
    });
  }, [card, isReversed, position, route.params?.intention]);

  // Get recommendation based on coherence
  const recommendation = useMemo(() => {
    return adaptiveAI.getRecommendedAction();
  }, [R, state]);

  const interpretation = getInterpretation(card, isReversed);

  // Fetch personalized LLM interpretation
  const fetchLlmInterpretation = useCallback(async () => {
    setLlmLoading(true);
    setLlmError(null);

    try {
      const recentReadings = readingStore.history.slice(0, 5).map(r => ({
        type: r.type,
        intention: r.intention?.slice(0, 100),
        cardNames: r.cards?.map(c => c.cardId).slice(0, 3),
        date: r.completedAt?.slice(0, 10),
      }));

      const recentJournalThemes = journalStore.entries.slice(0, 3).map(e => ({
        mood: e.mood,
        themes: e.tags?.slice(0, 3),
        depth: e.depthScore,
        date: e.createdAt?.slice(0, 10),
      }));

      const userContext = {
        mbtiType: user.profile?.mbtiType,
        level: user.progression?.level,
        currentStreak: user.stats?.currentStreak,
        recentReadings: recentReadings.length > 0 ? recentReadings : undefined,
        recentJournalThemes: recentJournalThemes.length > 0 ? recentJournalThemes : undefined,
      };

      const response = await fetch('/api/interpret-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card: {
            id: card.id,
            name: card.name,
            arcana: card.arcana,
            suit: card.suit,
            element: card.element,
            darkFantasy: card.darkFantasy,
            keywords: card.keywords,
          },
          context: {
            intention: route.params?.intention || 'seeking guidance',
            spreadType: readingType,
            reversed: isReversed,
            position: position,
            userProfile: userContext,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.interpretation) {
        setLlmInterpretation(data.data.interpretation);
        Animated.timing(interpretationOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        setLlmError('Unable to generate personalized interpretation');
      }
    } catch (err) {
      console.error('[CardInterpretation] LLM error:', err);
      setLlmError('Connection issue - showing standard interpretation');
    } finally {
      setLlmLoading(false);
    }
  }, [card, isReversed, readingType, position, route.params?.intention, user, readingStore.history, journalStore.entries, interpretationOpacity]);

  useEffect(() => {
    fetchLlmInterpretation();
  }, [fetchLlmInterpretation]);

  const handleJournalPrompt = () => {
    navigation.navigate('JournalTab', {
      screen: 'JournalEditor',
      params: {
        linkedCardIds: [card.id],
        promptSuggestions: card.questions || interpretation.questions,
      },
    });
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER: Magazine Layout
  // ═══════════════════════════════════════════════════════════════════

  return (
    <VeilPathScreen intensity="medium" scrollable={true} showMoonPhases={false}>
      {/* Full-width Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{card.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Magazine Container */}
      <View style={[styles.magazineContainer, !isMobile && styles.magazineContainerWide]}>

        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN: Card Hero + Interpretation
        ═══════════════════════════════════════════════════════════ */}
        <View style={[styles.heroColumn, !isMobile && styles.heroColumnWide]}>

          {/* Card Display */}
          <VictorianCard style={styles.cardHero} glowColor={COSMIC.candleFlame}>
            <TarotCard
              card={card}
              isReversed={isReversed}
              size={isMobile ? "lg" : "xl"}
              showName={false}
              interactive={false}
              imageOverride={imageOverride}
              tier={tier}
              assetType={assetType}
            />
            <View style={styles.cardMeta}>
              <Text style={styles.cardNameLarge}>{card.name}</Text>
              {isReversed && <Text style={styles.reversedBadge}>Reversed</Text>}
              {position && <Text style={styles.positionBadge}>{position}</Text>}
            </View>
          </VictorianCard>

          {/* Keywords */}
          <View style={styles.keywordsRow}>
            {interpretation.keywords.slice(0, 5).map((keyword, i) => (
              <View key={i} style={styles.keywordPill}>
                <Text style={styles.keywordText}>{keyword}</Text>
              </View>
            ))}
          </View>

          {/* Vera's Interpretation (Primary Content) */}
          <VictorianCard style={styles.veraCard} glowColor={COSMIC.deepAmethyst}>
            <View style={styles.veraHeader}>
              <Text style={styles.veraIcon}>🔮</Text>
              <Text style={styles.veraTitle}>Vera Speaks</Text>
            </View>

            {llmLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={COSMIC.etherealCyan} />
                <Text style={styles.loadingText}>Weaving your interpretation...</Text>
              </View>
            ) : llmError ? (
              <Text style={styles.fallbackText}>{interpretation.description}</Text>
            ) : llmInterpretation ? (
              <Animated.View style={{ opacity: interpretationOpacity }}>
                <Text style={styles.veraText}>{llmInterpretation}</Text>
                {user.profile?.mbtiType && (
                  <Text style={styles.personalizedNote}>
                    ✨ Personalized for {user.profile.mbtiType}
                  </Text>
                )}
              </Animated.View>
            ) : (
              <Text style={styles.fallbackText}>{interpretation.description}</Text>
            )}
          </VictorianCard>

          {/* Breathing Prompt for low coherence */}
          {recommendation.action === 'breathingPrompt' && (
            <View style={styles.breathingPrompt}>
              <Text style={styles.breathingIcon}>🌙</Text>
              <Text style={styles.breathingText}>{recommendation.message}</Text>
            </View>
          )}
        </View>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT COLUMN: Quick Facts + Actions (Desktop) / Below (Mobile)
        ═══════════════════════════════════════════════════════════ */}
        <View style={[styles.infoColumn, !isMobile && styles.infoColumnWide]}>

          {/* Quick Facts Card */}
          <VictorianCard style={styles.quickFactsCard}>
            <Text style={styles.quickFactsTitle}>Quick Facts</Text>

            <View style={styles.factRow}>
              <Text style={styles.factLabel}>Element</Text>
              <Text style={styles.factValue}>{card.element}</Text>
            </View>

            <View style={styles.factRow}>
              <Text style={styles.factLabel}>Arcana</Text>
              <Text style={styles.factValue}>
                {card.arcana === 'major' ? 'Major Arcana' : `${card.suit || 'Minor'}`}
              </Text>
            </View>

            {interpretation.astrology && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Astrology</Text>
                <Text style={styles.factValue}>{interpretation.astrology}</Text>
              </View>
            )}

            {interpretation.numerology !== undefined && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Numerology</Text>
                <Text style={styles.factValue}>{interpretation.numerology}</Text>
              </View>
            )}

            {card.arcana === 'major' && card.jungian && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Archetype</Text>
                <Text style={styles.factValue}>{card.jungian}</Text>
              </View>
            )}
          </VictorianCard>

          {/* Expandable: Dark Fantasy Lore */}
          {interpretation.darkFantasy && (
            <TouchableOpacity
              style={styles.expandableSection}
              onPress={() => toggleSection('lore')}
            >
              <View style={styles.expandableHeader}>
                <Text style={styles.expandableIcon}>🌑</Text>
                <Text style={styles.expandableTitle}>The Veil's Whisper</Text>
                <Text style={styles.expandableChevron}>
                  {expandedSection === 'lore' ? '▼' : '▶'}
                </Text>
              </View>
              {expandedSection === 'lore' && (
                <View style={styles.expandableContent}>
                  <Text style={styles.loreTitle}>{interpretation.darkFantasy.title}</Text>
                  <Text style={styles.loreText}>{interpretation.darkFantasy.description}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Expandable: Shadow & Light */}
          {(interpretation.shadow || interpretation.light) && (
            <TouchableOpacity
              style={styles.expandableSection}
              onPress={() => toggleSection('duality')}
            >
              <View style={styles.expandableHeader}>
                <Text style={styles.expandableIcon}>☯️</Text>
                <Text style={styles.expandableTitle}>Shadow & Light</Text>
                <Text style={styles.expandableChevron}>
                  {expandedSection === 'duality' ? '▼' : '▶'}
                </Text>
              </View>
              {expandedSection === 'duality' && (
                <View style={styles.expandableContent}>
                  {interpretation.shadow && (
                    <>
                      <Text style={styles.dualityLabel}>🌑 Shadow</Text>
                      <Text style={styles.dualityText}>{interpretation.shadow}</Text>
                    </>
                  )}
                  {interpretation.light && (
                    <>
                      <Text style={[styles.dualityLabel, { marginTop: 12 }]}>🌕 Light</Text>
                      <Text style={styles.dualityText}>{interpretation.light}</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Expandable: Reflection Questions */}
          {interpretation.questions && interpretation.questions.length > 0 && (
            <TouchableOpacity
              style={styles.expandableSection}
              onPress={() => toggleSection('questions')}
            >
              <View style={styles.expandableHeader}>
                <Text style={styles.expandableIcon}>💭</Text>
                <Text style={styles.expandableTitle}>Reflection Questions</Text>
                <Text style={styles.expandableChevron}>
                  {expandedSection === 'questions' ? '▼' : '▶'}
                </Text>
              </View>
              {expandedSection === 'questions' && (
                <View style={styles.expandableContent}>
                  {interpretation.questions.map((q, i) => (
                    <View key={i} style={styles.questionItem}>
                      <Text style={styles.questionBullet}>✧</Text>
                      <Text style={styles.questionText}>{q}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Guidance */}
          {interpretation.advice && (
            <VictorianCard style={styles.guidanceCard} glowColor={COSMIC.candleFlame}>
              <Text style={styles.guidanceLabel}>🌟 Guidance</Text>
              <Text style={styles.guidanceText}>{interpretation.advice}</Text>
            </VictorianCard>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <CosmicButton
              title="Journal This"
              icon="📝"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleJournalPrompt}
            />

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('DeckViewer', { highlightCard: card.id })}
            >
              <Text style={styles.secondaryBtnText}>View in Deck</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => navigation.navigate('HomeTab')}
            >
              <Text style={styles.ghostBtnText}>← Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  // ═══════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(10, 10, 20, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: COSMIC.brassVictorian + '40',
    marginBottom: 24,
    marginHorizontal: -20,
    marginTop: -20,
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 60,
  },

  // ═══════════════════════════════════════════════════════════
  // MAGAZINE LAYOUT
  // ═══════════════════════════════════════════════════════════
  magazineContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  magazineContainerWide: {
    flexDirection: 'row',
    gap: 32,
  },

  // Hero Column (Left)
  heroColumn: {
    flex: 1,
  },
  heroColumnWide: {
    flex: 3,
    maxWidth: 600,
  },

  // Info Column (Right)
  infoColumn: {
    flex: 1,
  },
  infoColumnWide: {
    flex: 2,
    maxWidth: 400,
  },

  // ═══════════════════════════════════════════════════════════
  // CARD HERO
  // ═══════════════════════════════════════════════════════════
  cardHero: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  cardMeta: {
    alignItems: 'center',
    marginTop: 16,
  },
  cardNameLarge: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 3,
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    textAlign: 'center',
  },
  reversedBadge: {
    marginTop: 8,
    fontSize: 14,
    color: COSMIC.candleFlame,
    fontStyle: 'italic',
  },
  positionBadge: {
    marginTop: 8,
    fontSize: 12,
    color: COSMIC.etherealCyan,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COSMIC.etherealCyan + '60',
    overflow: 'hidden',
  },

  // ═══════════════════════════════════════════════════════════
  // KEYWORDS
  // ═══════════════════════════════════════════════════════════
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  keywordPill: {
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 167, 38, 0.4)',
  },
  keywordText: {
    fontSize: 13,
    color: COSMIC.candleFlame,
    fontWeight: '600',
  },

  // ═══════════════════════════════════════════════════════════
  // ORACLE INTERPRETATION
  // ═══════════════════════════════════════════════════════════
  veraCard: {
    padding: 24,
    marginBottom: 20,
  },
  veraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  veraIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  veraTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
    letterSpacing: 1,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
  },
  veraText: {
    fontSize: 16,
    color: COSMIC.moonGlow,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  fallbackText: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    opacity: 0.9,
  },
  personalizedNote: {
    marginTop: 16,
    fontSize: 12,
    color: COSMIC.etherealCyan,
    textAlign: 'center',
  },

  // ═══════════════════════════════════════════════════════════
  // BREATHING PROMPT
  // ═══════════════════════════════════════════════════════════
  breathingPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COSMIC.etherealCyan + '40',
  },
  breathingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  breathingText: {
    flex: 1,
    fontSize: 14,
    color: COSMIC.moonGlow,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // ═══════════════════════════════════════════════════════════
  // QUICK FACTS
  // ═══════════════════════════════════════════════════════════
  quickFactsCard: {
    padding: 20,
    marginBottom: 16,
  },
  quickFactsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.15)',
  },
  factLabel: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  factValue: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    fontWeight: '600',
  },

  // ═══════════════════════════════════════════════════════════
  // EXPANDABLE SECTIONS
  // ═══════════════════════════════════════════════════════════
  expandableSection: {
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COSMIC.brassVictorian + '30',
    overflow: 'hidden',
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  expandableIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  expandableTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.moonGlow,
  },
  expandableChevron: {
    fontSize: 12,
    color: COSMIC.crystalPink,
  },
  expandableContent: {
    padding: 16,
    paddingTop: 0,
  },

  // Lore
  loreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  loreText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    fontStyle: 'italic',
    opacity: 0.9,
  },

  // Duality
  dualityLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COSMIC.crystalPink,
    marginBottom: 4,
    letterSpacing: 1,
  },
  dualityText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 20,
    opacity: 0.9,
  },

  // Questions
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  questionBullet: {
    fontSize: 12,
    color: COSMIC.candleFlame,
    marginRight: 8,
    marginTop: 2,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 20,
  },

  // ═══════════════════════════════════════════════════════════
  // GUIDANCE
  // ═══════════════════════════════════════════════════════════
  guidanceCard: {
    padding: 20,
    marginBottom: 16,
  },
  guidanceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 12,
  },
  guidanceText: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // ═══════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════
  actionsContainer: {
    marginTop: 8,
    marginBottom: 40,
  },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
    alignItems: 'center',
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
  },
  secondaryBtnText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    fontWeight: '600',
    letterSpacing: 1,
  },
  ghostBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontSize: 14,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },
});
