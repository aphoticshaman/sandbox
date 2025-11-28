/**
 * JOURNAL-TO-CARD CORRELATION ENGINE
 * ===================================
 *
 * Analyzes correlations between journal content and tarot readings to:
 * 1. Find semantic alignment between journal themes and drawn cards
 * 2. Track mood transitions pre/post reading
 * 3. Detect CBT distortion patterns linked to specific cards
 * 4. Identify growth patterns through card-journal temporal analysis
 * 5. Generate personalized insights based on linguistic patterns
 *
 * This powers the "Palantir for the Soul" deep introspection system.
 */

import { CARD_DATABASE } from '../data/cardDatabase';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
  mood?: string;
  moodAfter?: string;
  linkedReadingId?: string;
  linkedCardIds?: string[];
  cbtDistortions?: string[];
  dbtSkills?: string[];
  depthScore?: number;
  wordCount?: number;
  tags?: string[];
}

export interface Reading {
  id: string;
  type: string;
  intention: string;
  cards: Array<{
    cardId?: string;
    cardIndex?: number;
    position: number;
    positionName: string;
    isReversed: boolean;
  }>;
  completedAt: string;
}

export interface ThemeSimilarity {
  theme: string;
  journalRelevance: number;
  cardRelevance: number;
  alignment: number;
}

export interface CorrelationResult {
  readingId: string;
  journalId: string;
  overallAlignment: number; // 0-1
  themeAlignments: ThemeSimilarity[];
  moodTransition: {
    before: string;
    after: string;
    improvement: number; // -1 to 1
  };
  keyInsights: string[];
  suggestedActions: string[];
}

export interface LongitudinalPattern {
  patternType: 'growth' | 'regression' | 'cycle' | 'breakthrough';
  description: string;
  evidence: string[];
  cards: string[];
  timespan: string;
  significance: number;
}

export interface JournalCardAnalysis {
  correlations: CorrelationResult[];
  longitudinalPatterns: LongitudinalPattern[];
  themeFrequency: Map<string, number>;
  moodCardMap: Map<string, string[]>;
  distortionCardMap: Map<string, string[]>;
  growthIndicators: string[];
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════
// THEME EXTRACTION (NLP-lite)
// ═══════════════════════════════════════════════════════════

// Theme keywords mapped to broader concepts
const THEME_KEYWORDS: Record<string, string[]> = {
  love: ['love', 'heart', 'relationship', 'partner', 'romance', 'affection', 'together'],
  fear: ['fear', 'scared', 'afraid', 'anxiety', 'worry', 'panic', 'dread'],
  growth: ['grow', 'learn', 'develop', 'improve', 'progress', 'evolve', 'change'],
  loss: ['loss', 'lost', 'grief', 'miss', 'gone', 'death', 'ending'],
  success: ['success', 'achieve', 'accomplish', 'win', 'goal', 'proud', 'triumph'],
  conflict: ['conflict', 'fight', 'argue', 'disagree', 'tension', 'clash'],
  family: ['family', 'parent', 'mother', 'father', 'child', 'sibling', 'home'],
  work: ['work', 'job', 'career', 'boss', 'project', 'office', 'professional'],
  money: ['money', 'financial', 'debt', 'salary', 'investment', 'wealth', 'poor'],
  health: ['health', 'sick', 'body', 'energy', 'tired', 'wellness', 'pain'],
  creativity: ['creative', 'art', 'music', 'write', 'paint', 'imagine', 'inspire'],
  spirituality: ['spirit', 'soul', 'meditation', 'prayer', 'divine', 'universe', 'faith'],
  identity: ['identity', 'self', 'who am i', 'authentic', 'true self', 'mask'],
  boundaries: ['boundary', 'boundaries', 'protect', 'limit', 'say no', 'space'],
  trust: ['trust', 'believe', 'faith', 'reliable', 'honest', 'betray'],
  control: ['control', 'power', 'helpless', 'stuck', 'freedom', 'choice'],
  communication: ['communicate', 'talk', 'listen', 'express', 'misunderstand', 'connect'],
  shadow: ['shadow', 'dark', 'hidden', 'suppress', 'deny', 'unconscious'],
};

// Card themes from database mapped to our theme system
const CARD_THEME_MAP: Record<number, string[]> = {
  // Major Arcana
  0: ['growth', 'identity', 'creativity'],          // Fool
  1: ['creativity', 'control', 'spirituality'],     // Magician
  2: ['spirituality', 'shadow', 'trust'],           // High Priestess
  3: ['love', 'creativity', 'family'],              // Empress
  4: ['control', 'work', 'boundaries'],             // Emperor
  5: ['spirituality', 'trust', 'identity'],         // Hierophant
  6: ['love', 'communication', 'identity'],         // Lovers
  7: ['success', 'control', 'growth'],              // Chariot
  8: ['boundaries', 'control', 'growth'],           // Strength
  9: ['identity', 'spirituality', 'shadow'],        // Hermit
  10: ['growth', 'loss', 'control'],                // Wheel of Fortune
  11: ['boundaries', 'trust', 'conflict'],          // Justice
  12: ['growth', 'shadow', 'spirituality'],         // Hanged Man
  13: ['loss', 'growth', 'shadow'],                 // Death
  14: ['health', 'boundaries', 'growth'],           // Temperance
  15: ['shadow', 'control', 'fear'],                // Devil
  16: ['loss', 'conflict', 'growth'],               // Tower
  17: ['spirituality', 'health', 'creativity'],     // Star
  18: ['shadow', 'fear', 'identity'],               // Moon
  19: ['success', 'health', 'creativity'],          // Sun
  20: ['growth', 'identity', 'spirituality'],       // Judgement
  21: ['success', 'growth', 'identity'],            // World

  // Wands (22-35) - fire, creativity, passion
  22: ['creativity', 'growth'],                     // Ace of Wands
  23: ['work', 'control', 'growth'],                // Two of Wands
  24: ['work', 'success', 'growth'],                // Three of Wands
  25: ['success', 'family', 'love'],                // Four of Wands
  26: ['conflict', 'work', 'communication'],        // Five of Wands
  27: ['success', 'work', 'growth'],                // Six of Wands
  28: ['boundaries', 'conflict', 'control'],        // Seven of Wands
  29: ['communication', 'work', 'growth'],          // Eight of Wands
  30: ['boundaries', 'fear', 'conflict'],           // Nine of Wands
  31: ['work', 'control', 'health'],                // Ten of Wands
  32: ['creativity', 'communication', 'growth'],    // Page of Wands
  33: ['growth', 'creativity', 'control'],          // Knight of Wands
  34: ['creativity', 'control', 'identity'],        // Queen of Wands
  35: ['control', 'work', 'identity'],              // King of Wands

  // Cups (36-49) - water, emotions, relationships
  36: ['love', 'creativity', 'spirituality'],       // Ace of Cups
  37: ['love', 'communication', 'trust'],           // Two of Cups
  38: ['love', 'family', 'success'],                // Three of Cups
  39: ['identity', 'growth', 'boundaries'],         // Four of Cups
  40: ['loss', 'grief', 'growth'],                  // Five of Cups
  41: ['family', 'love', 'growth'],                 // Six of Cups
  42: ['creativity', 'identity', 'shadow'],         // Seven of Cups
  43: ['growth', 'loss', 'identity'],               // Eight of Cups
  44: ['success', 'health', 'growth'],              // Nine of Cups
  45: ['love', 'family', 'success'],                // Ten of Cups
  46: ['creativity', 'love', 'communication'],      // Page of Cups
  47: ['love', 'creativity', 'identity'],           // Knight of Cups
  48: ['love', 'spirituality', 'identity'],         // Queen of Cups
  49: ['love', 'control', 'identity'],              // King of Cups

  // Swords (50-63) - air, thoughts, conflict
  50: ['communication', 'trust', 'growth'],         // Ace of Swords
  51: ['boundaries', 'conflict', 'trust'],          // Two of Swords
  52: ['loss', 'conflict', 'shadow'],               // Three of Swords
  53: ['health', 'boundaries', 'growth'],           // Four of Swords
  54: ['conflict', 'loss', 'shadow'],               // Five of Swords
  55: ['growth', 'loss', 'boundaries'],             // Six of Swords
  56: ['shadow', 'boundaries', 'trust'],            // Seven of Swords
  57: ['fear', 'shadow', 'control'],                // Eight of Swords
  58: ['fear', 'shadow', 'health'],                 // Nine of Swords
  59: ['loss', 'shadow', 'growth'],                 // Ten of Swords
  60: ['communication', 'conflict', 'growth'],      // Page of Swords
  61: ['conflict', 'communication', 'control'],     // Knight of Swords
  62: ['communication', 'boundaries', 'identity'],  // Queen of Swords
  63: ['communication', 'control', 'identity'],     // King of Swords

  // Pentacles (64-77) - earth, material, practical
  64: ['money', 'health', 'growth'],                // Ace of Pentacles
  65: ['money', 'control', 'boundaries'],           // Two of Pentacles
  66: ['work', 'growth', 'creativity'],             // Three of Pentacles
  67: ['money', 'control', 'boundaries'],           // Four of Pentacles
  68: ['money', 'health', 'loss'],                  // Five of Pentacles
  69: ['money', 'family', 'success'],               // Six of Pentacles
  70: ['work', 'growth', 'money'],                  // Seven of Pentacles
  71: ['work', 'growth', 'creativity'],             // Eight of Pentacles
  72: ['money', 'success', 'identity'],             // Nine of Pentacles
  73: ['family', 'money', 'success'],               // Ten of Pentacles
  74: ['work', 'growth', 'money'],                  // Page of Pentacles
  75: ['work', 'money', 'control'],                 // Knight of Pentacles
  76: ['money', 'health', 'identity'],              // Queen of Pentacles
  77: ['money', 'control', 'success'],              // King of Pentacles
};

// CBT Cognitive Distortions
const CBT_DISTORTIONS = [
  'all_or_nothing',
  'overgeneralization',
  'mental_filter',
  'disqualifying_positive',
  'jumping_to_conclusions',
  'magnification_minimization',
  'emotional_reasoning',
  'should_statements',
  'labeling',
  'personalization',
  'catastrophizing',
];

// Mood valence mapping
const MOOD_VALENCE: Record<string, number> = {
  joyful: 1.0,
  happy: 0.8,
  content: 0.6,
  hopeful: 0.5,
  neutral: 0.0,
  uncertain: -0.2,
  worried: -0.4,
  sad: -0.6,
  anxious: -0.7,
  angry: -0.8,
  depressed: -0.9,
};

// ═══════════════════════════════════════════════════════════
// JOURNAL-CARD CORRELATION ENGINE
// ═══════════════════════════════════════════════════════════

export class JournalCardCorrelationEngine {
  private journals: JournalEntry[];
  private readings: Reading[];

  constructor(journals: JournalEntry[], readings: Reading[]) {
    this.journals = journals;
    this.readings = readings;
  }

  /**
   * Run full journal-card correlation analysis
   */
  analyze(): JournalCardAnalysis {
    const correlations = this.analyzeLinkedPairs();
    const longitudinalPatterns = this.detectLongitudinalPatterns();
    const themeFrequency = this.calculateThemeFrequency();
    const moodCardMap = this.buildMoodCardMap();
    const distortionCardMap = this.buildDistortionCardMap();
    const growthIndicators = this.identifyGrowthIndicators();
    const warnings = this.generateWarnings();

    return {
      correlations,
      longitudinalPatterns,
      themeFrequency,
      moodCardMap,
      distortionCardMap,
      growthIndicators,
      warnings,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CORRELATION ANALYSIS
  // ═══════════════════════════════════════════════════════════

  /**
   * Analyze journal-reading linked pairs
   */
  private analyzeLinkedPairs(): CorrelationResult[] {
    const results: CorrelationResult[] = [];

    this.journals.forEach(journal => {
      if (!journal.linkedReadingId) return;

      const reading = this.readings.find(r => r.id === journal.linkedReadingId);
      if (!reading) return;

      // Extract themes from journal
      const journalThemes = this.extractThemes(journal.content);

      // Extract themes from cards
      const cardThemes = this.getCardThemes(reading.cards);

      // Calculate alignments
      const themeAlignments = this.calculateThemeAlignments(journalThemes, cardThemes);

      // Calculate mood transition
      const moodTransition = this.calculateMoodTransition(journal);

      // Generate insights
      const keyInsights = this.generateInsights(themeAlignments, moodTransition, journal);

      // Generate suggested actions
      const suggestedActions = this.generateActions(themeAlignments, journal);

      results.push({
        readingId: reading.id,
        journalId: journal.id,
        overallAlignment: this.calculateOverallAlignment(themeAlignments),
        themeAlignments,
        moodTransition,
        keyInsights,
        suggestedActions,
      });
    });

    return results;
  }

  /**
   * Extract themes from journal text
   */
  private extractThemes(text: string): Map<string, number> {
    const themes = new Map<string, number>();
    const lowerText = text.toLowerCase();

    Object.entries(THEME_KEYWORDS).forEach(([theme, keywords]) => {
      let count = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) count += matches.length;
      });

      if (count > 0) {
        // Normalize by text length
        const relevance = Math.min(1, count / Math.sqrt(text.length / 100));
        themes.set(theme, relevance);
      }
    });

    return themes;
  }

  /**
   * Get themes from card set
   */
  private getCardThemes(cards: Reading['cards']): Map<string, number> {
    const themes = new Map<string, number>();

    cards.forEach(card => {
      const idx = card.cardIndex ?? parseInt(card.cardId?.replace('index_', '') || '0');
      const cardThemes = CARD_THEME_MAP[idx] || [];

      cardThemes.forEach(theme => {
        const current = themes.get(theme) || 0;
        // Reversed cards slightly reduce theme strength
        const weight = card.isReversed ? 0.7 : 1.0;
        themes.set(theme, current + weight);
      });
    });

    // Normalize
    const max = Math.max(...themes.values());
    if (max > 0) {
      themes.forEach((value, key) => {
        themes.set(key, value / max);
      });
    }

    return themes;
  }

  /**
   * Calculate theme alignments between journal and cards
   */
  private calculateThemeAlignments(
    journalThemes: Map<string, number>,
    cardThemes: Map<string, number>
  ): ThemeSimilarity[] {
    const alignments: ThemeSimilarity[] = [];

    // Get all unique themes
    const allThemes = new Set([...journalThemes.keys(), ...cardThemes.keys()]);

    allThemes.forEach(theme => {
      const journalRelevance = journalThemes.get(theme) || 0;
      const cardRelevance = cardThemes.get(theme) || 0;

      // Alignment is high when both have the theme
      const alignment = Math.sqrt(journalRelevance * cardRelevance);

      if (journalRelevance > 0 || cardRelevance > 0) {
        alignments.push({
          theme,
          journalRelevance,
          cardRelevance,
          alignment,
        });
      }
    });

    return alignments.sort((a, b) => b.alignment - a.alignment);
  }

  /**
   * Calculate mood transition
   */
  private calculateMoodTransition(journal: JournalEntry): {
    before: string;
    after: string;
    improvement: number;
  } {
    const before = journal.mood || 'neutral';
    const after = journal.moodAfter || before;

    const beforeValence = MOOD_VALENCE[before] ?? 0;
    const afterValence = MOOD_VALENCE[after] ?? 0;

    return {
      before,
      after,
      improvement: afterValence - beforeValence,
    };
  }

  /**
   * Calculate overall alignment score
   */
  private calculateOverallAlignment(alignments: ThemeSimilarity[]): number {
    if (alignments.length === 0) return 0;

    const totalAlignment = alignments.reduce((sum, a) => sum + a.alignment, 0);
    return Math.min(1, totalAlignment / Math.min(alignments.length, 5));
  }

  // ═══════════════════════════════════════════════════════════
  // LONGITUDINAL PATTERNS
  // ═══════════════════════════════════════════════════════════

  /**
   * Detect patterns over time
   */
  private detectLongitudinalPatterns(): LongitudinalPattern[] {
    const patterns: LongitudinalPattern[] = [];

    // Sort journals by date
    const sortedJournals = [...this.journals].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (sortedJournals.length < 5) return patterns;

    // Detect mood trends
    const moodTrend = this.detectMoodTrend(sortedJournals);
    if (moodTrend) patterns.push(moodTrend);

    // Detect theme evolution
    const themeEvolution = this.detectThemeEvolution(sortedJournals);
    patterns.push(...themeEvolution);

    // Detect breakthrough moments
    const breakthroughs = this.detectBreakthroughs(sortedJournals);
    patterns.push(...breakthroughs);

    return patterns;
  }

  /**
   * Detect overall mood trend
   */
  private detectMoodTrend(journals: JournalEntry[]): LongitudinalPattern | null {
    if (journals.length < 5) return null;

    const third = Math.floor(journals.length / 3);
    const earlyJournals = journals.slice(0, third);
    const recentJournals = journals.slice(-third);

    const avgMood = (js: JournalEntry[]) => {
      const moods = js.filter(j => j.mood).map(j => MOOD_VALENCE[j.mood!] ?? 0);
      return moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
    };

    const earlyMood = avgMood(earlyJournals);
    const recentMood = avgMood(recentJournals);
    const change = recentMood - earlyMood;

    if (Math.abs(change) > 0.2) {
      return {
        patternType: change > 0 ? 'growth' : 'regression',
        description: change > 0
          ? 'Overall mood has improved over time'
          : 'Recent entries show lower mood - consider self-care practices',
        evidence: [
          `Early average mood: ${(earlyMood * 100).toFixed(0)}%`,
          `Recent average mood: ${(recentMood * 100).toFixed(0)}%`,
        ],
        cards: [],
        timespan: `${journals.length} entries`,
        significance: Math.min(1, Math.abs(change)),
      };
    }

    return null;
  }

  /**
   * Detect theme evolution
   */
  private detectThemeEvolution(journals: JournalEntry[]): LongitudinalPattern[] {
    const patterns: LongitudinalPattern[] = [];

    const half = Math.floor(journals.length / 2);
    const earlyJournals = journals.slice(0, half);
    const recentJournals = journals.slice(-half);

    const countThemes = (js: JournalEntry[]): Map<string, number> => {
      const themes = new Map<string, number>();
      js.forEach(j => {
        const extracted = this.extractThemes(j.content);
        extracted.forEach((relevance, theme) => {
          themes.set(theme, (themes.get(theme) || 0) + relevance);
        });
      });
      return themes;
    };

    const earlyThemes = countThemes(earlyJournals);
    const recentThemes = countThemes(recentJournals);

    // Find themes that decreased (potentially resolved)
    earlyThemes.forEach((earlyCount, theme) => {
      const recentCount = recentThemes.get(theme) || 0;
      const normalizedEarly = earlyCount / earlyJournals.length;
      const normalizedRecent = recentCount / recentJournals.length;

      if (normalizedEarly > 0.3 && normalizedRecent < normalizedEarly * 0.5) {
        patterns.push({
          patternType: 'growth',
          description: `${theme.charAt(0).toUpperCase() + theme.slice(1)} themes have decreased - possible resolution or integration`,
          evidence: [
            `Early frequency: ${(normalizedEarly * 100).toFixed(0)}%`,
            `Recent frequency: ${(normalizedRecent * 100).toFixed(0)}%`,
          ],
          cards: [],
          timespan: `${journals.length} entries`,
          significance: Math.min(1, normalizedEarly - normalizedRecent),
        });
      }
    });

    // Find themes that increased (emerging focus)
    recentThemes.forEach((recentCount, theme) => {
      const earlyCount = earlyThemes.get(theme) || 0;
      const normalizedEarly = earlyCount / earlyJournals.length;
      const normalizedRecent = recentCount / recentJournals.length;

      if (normalizedRecent > 0.3 && normalizedRecent > normalizedEarly * 1.5) {
        patterns.push({
          patternType: 'cycle',
          description: `${theme.charAt(0).toUpperCase() + theme.slice(1)} is emerging as a focus area`,
          evidence: [
            `Early frequency: ${(normalizedEarly * 100).toFixed(0)}%`,
            `Recent frequency: ${(normalizedRecent * 100).toFixed(0)}%`,
          ],
          cards: [],
          timespan: `${journals.length} entries`,
          significance: Math.min(1, normalizedRecent - normalizedEarly),
        });
      }
    });

    return patterns;
  }

  /**
   * Detect breakthrough moments
   */
  private detectBreakthroughs(journals: JournalEntry[]): LongitudinalPattern[] {
    const patterns: LongitudinalPattern[] = [];

    journals.forEach((journal, idx) => {
      if (idx < 2) return;

      const prevMood = MOOD_VALENCE[journals[idx - 1].mood || 'neutral'] ?? 0;
      const currentMood = MOOD_VALENCE[journal.mood || 'neutral'] ?? 0;
      const moodJump = currentMood - prevMood;

      // Significant positive mood jump after writing
      if (moodJump > 0.3 && journal.moodAfter) {
        const afterMood = MOOD_VALENCE[journal.moodAfter] ?? 0;
        const writingImprovement = afterMood - currentMood;

        if (writingImprovement > 0.2) {
          // Find linked reading
          const linkedReading = this.readings.find(r => r.id === journal.linkedReadingId);
          const cards = linkedReading?.cards.map(c =>
            CARD_DATABASE[c.cardIndex || 0]?.name || 'Unknown'
          ) || [];

          patterns.push({
            patternType: 'breakthrough',
            description: 'Significant breakthrough detected - journaling led to mood improvement',
            evidence: [
              `Mood before: ${journals[idx - 1].mood || 'unknown'}`,
              `Mood after journaling: ${journal.moodAfter}`,
              `Improvement: ${(writingImprovement * 100).toFixed(0)}%`,
            ],
            cards,
            timespan: new Date(journal.createdAt).toLocaleDateString(),
            significance: Math.min(1, moodJump + writingImprovement),
          });
        }
      }
    });

    return patterns;
  }

  // ═══════════════════════════════════════════════════════════
  // MAPS AND FREQUENCIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Calculate theme frequency across all journals
   */
  private calculateThemeFrequency(): Map<string, number> {
    const frequency = new Map<string, number>();

    this.journals.forEach(journal => {
      const themes = this.extractThemes(journal.content);
      themes.forEach((relevance, theme) => {
        frequency.set(theme, (frequency.get(theme) || 0) + relevance);
      });
    });

    return frequency;
  }

  /**
   * Build mood-to-card mapping
   */
  private buildMoodCardMap(): Map<string, string[]> {
    const moodCards = new Map<string, string[]>();

    this.journals.forEach(journal => {
      if (!journal.mood || !journal.linkedReadingId) return;

      const reading = this.readings.find(r => r.id === journal.linkedReadingId);
      if (!reading) return;

      const cards = moodCards.get(journal.mood) || [];
      reading.cards.forEach(card => {
        const name = CARD_DATABASE[card.cardIndex || 0]?.name || 'Unknown';
        if (!cards.includes(name)) {
          cards.push(name);
        }
      });
      moodCards.set(journal.mood, cards);
    });

    return moodCards;
  }

  /**
   * Build distortion-to-card mapping
   */
  private buildDistortionCardMap(): Map<string, string[]> {
    const distortionCards = new Map<string, string[]>();

    this.journals.forEach(journal => {
      if (!journal.cbtDistortions || !journal.linkedReadingId) return;

      const reading = this.readings.find(r => r.id === journal.linkedReadingId);
      if (!reading) return;

      journal.cbtDistortions.forEach(distortion => {
        const cards = distortionCards.get(distortion) || [];
        reading.cards.forEach(card => {
          const name = CARD_DATABASE[card.cardIndex || 0]?.name || 'Unknown';
          if (!cards.includes(name)) {
            cards.push(name);
          }
        });
        distortionCards.set(distortion, cards);
      });
    });

    return distortionCards;
  }

  // ═══════════════════════════════════════════════════════════
  // INSIGHT GENERATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Generate insights for a correlation
   */
  private generateInsights(
    alignments: ThemeSimilarity[],
    moodTransition: { before: string; after: string; improvement: number },
    journal: JournalEntry
  ): string[] {
    const insights: string[] = [];

    // Theme alignment insights
    const topAligned = alignments.filter(a => a.alignment > 0.5).slice(0, 2);
    if (topAligned.length > 0) {
      const themes = topAligned.map(a => a.theme).join(' and ');
      insights.push(`Strong alignment on ${themes} - the cards reflected your inner state`);
    }

    // Mood improvement insight
    if (moodTransition.improvement > 0.2) {
      insights.push('Mood improved after journaling - cathartic processing detected');
    } else if (moodTransition.improvement < -0.2) {
      insights.push('Mood decreased after journaling - consider this a signal for deeper exploration');
    }

    // CBT distortion insight
    if (journal.cbtDistortions && journal.cbtDistortions.length > 0) {
      insights.push(`Cognitive distortions identified: ${journal.cbtDistortions.join(', ')} - awareness is the first step`);
    }

    // Depth insight
    if (journal.depthScore && journal.depthScore >= 4) {
      insights.push('Deep therapeutic processing in this entry - excellent self-reflection');
    }

    return insights;
  }

  /**
   * Generate suggested actions
   */
  private generateActions(
    alignments: ThemeSimilarity[],
    journal: JournalEntry
  ): string[] {
    const actions: string[] = [];

    // Based on themes
    const highJournalLowCard = alignments.filter(
      a => a.journalRelevance > 0.5 && a.cardRelevance < 0.3
    );

    if (highJournalLowCard.length > 0) {
      const theme = highJournalLowCard[0].theme;
      actions.push(`Meditate on ${theme} - it's present in your mind but not reflected in the cards`);
    }

    // Based on distortions
    if (journal.cbtDistortions?.includes('catastrophizing')) {
      actions.push('Practice grounding: name 5 things you can see, 4 you can hear, 3 you can touch');
    }

    if (journal.cbtDistortions?.includes('all_or_nothing')) {
      actions.push('Challenge binary thinking: find the gray area in your situation');
    }

    // Based on mood
    if (journal.mood && MOOD_VALENCE[journal.mood] < -0.5) {
      actions.push('Consider reaching out to a support person or practicing self-compassion');
    }

    return actions;
  }

  /**
   * Identify growth indicators
   */
  private identifyGrowthIndicators(): string[] {
    const indicators: string[] = [];

    // Check for increasing depth scores
    const depthScores = this.journals
      .filter(j => j.depthScore !== undefined)
      .map(j => j.depthScore!);

    if (depthScores.length >= 5) {
      const earlyAvg = depthScores.slice(0, Math.floor(depthScores.length / 2))
        .reduce((a, b) => a + b, 0) / Math.floor(depthScores.length / 2);
      const recentAvg = depthScores.slice(-Math.floor(depthScores.length / 2))
        .reduce((a, b) => a + b, 0) / Math.floor(depthScores.length / 2);

      if (recentAvg > earlyAvg) {
        indicators.push('Journal depth is increasing - deeper self-reflection developing');
      }
    }

    // Check for increasing word counts
    const wordCounts = this.journals
      .filter(j => j.wordCount !== undefined)
      .map(j => j.wordCount!);

    if (wordCounts.length >= 5) {
      const earlyAvg = wordCounts.slice(0, Math.floor(wordCounts.length / 2))
        .reduce((a, b) => a + b, 0) / Math.floor(wordCounts.length / 2);
      const recentAvg = wordCounts.slice(-Math.floor(wordCounts.length / 2))
        .reduce((a, b) => a + b, 0) / Math.floor(wordCounts.length / 2);

      if (recentAvg > earlyAvg * 1.3) {
        indicators.push('Journal entries are getting longer - increased engagement');
      }
    }

    // Check for DBT skills usage
    const dbtUsage = this.journals.filter(j => j.dbtSkills && j.dbtSkills.length > 0).length;
    if (dbtUsage > this.journals.length * 0.3) {
      indicators.push('Regular DBT skill practice detected - excellent coping development');
    }

    return indicators;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(): string[] {
    const warnings: string[] = [];

    // Check for persistent negative moods
    const recentMoods = this.journals
      .slice(0, 5)
      .filter(j => j.mood)
      .map(j => MOOD_VALENCE[j.mood!] ?? 0);

    if (recentMoods.length >= 3 && recentMoods.every(m => m < -0.5)) {
      warnings.push('Persistent low mood detected in recent entries - consider professional support');
    }

    // Check for recurring distortions
    const distortionCounts = new Map<string, number>();
    this.journals.forEach(j => {
      j.cbtDistortions?.forEach(d => {
        distortionCounts.set(d, (distortionCounts.get(d) || 0) + 1);
      });
    });

    distortionCounts.forEach((count, distortion) => {
      if (count >= 5) {
        warnings.push(`Recurring cognitive distortion: ${distortion.replace(/_/g, ' ')} - may benefit from CBT work`);
      }
    });

    return warnings;
  }
}

/**
 * Convenience function for quick analysis
 */
export function analyzeJournalCardCorrelations(
  journals: JournalEntry[],
  readings: Reading[]
): JournalCardAnalysis {
  const engine = new JournalCardCorrelationEngine(journals, readings);
  return engine.analyze();
}
