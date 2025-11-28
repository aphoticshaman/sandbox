/**
 * CROSS-SESSION PATTERN RECOGNITION ENGINE
 * ==========================================
 *
 * Analyzes reading history to detect:
 * 1. Recurring card patterns across sessions
 * 2. Temporal correlations (time-of-day, lunar phase, seasonal)
 * 3. Thematic clusters and evolution
 * 4. Shadow card detection (cards that appear when avoided)
 * 5. Journal-to-reading sentiment correlation
 *
 * Palantir for the Soul - Deep pattern mining for introspective insight
 *
 * References:
 * - Sequential pattern mining (Agrawal & Srikant, 1995)
 * - Time series clustering
 * - Kolmogorov complexity for pattern significance
 */

import { CARD_DATABASE } from '../data/cardDatabase';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface Reading {
  id: string;
  type: string;
  intention: string;
  cards: Array<{
    cardId: string;
    cardIndex?: number;
    position: number;
    positionName: string;
    isReversed: boolean;
  }>;
  startedAt: string;
  completedAt: string;
  linkedJournalId?: string;
  tags?: string[];
}

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
}

export interface PatternResult {
  patternType: PatternType;
  significance: number; // 0-1, higher = more significant
  description: string;
  cards?: string[];
  timeframe?: string;
  frequency?: number;
  metadata?: Record<string, any>;
}

export type PatternType =
  | 'recurring_card'
  | 'recurring_pair'
  | 'recurring_triplet'
  | 'shadow_card'
  | 'avoided_card'
  | 'temporal_cluster'
  | 'lunar_correlation'
  | 'mood_correlation'
  | 'thematic_evolution'
  | 'reversal_pattern'
  | 'suit_dominance'
  | 'major_arcana_surge';

export interface CrossSessionAnalysis {
  patterns: PatternResult[];
  insights: string[];
  recommendations: string[];
  shadowWork: {
    cards: string[];
    themes: string[];
    suggestedPrompts: string[];
  };
  temporalProfile: {
    peakHours: number[];
    peakDays: number[];
    lunarPreference?: string;
  };
}

// ═══════════════════════════════════════════════════════════
// CROSS-SESSION PATTERN ENGINE
// ═══════════════════════════════════════════════════════════

export class CrossSessionPatternEngine {
  private readings: Reading[];
  private journals: JournalEntry[];

  constructor(readings: Reading[], journals: JournalEntry[] = []) {
    this.readings = readings.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    this.journals = journals;
  }

  /**
   * Run full cross-session analysis
   */
  analyze(): CrossSessionAnalysis {
    const patterns: PatternResult[] = [];

    // Card frequency patterns
    patterns.push(...this.detectRecurringCards());
    patterns.push(...this.detectRecurringPairs());
    patterns.push(...this.detectRecurringTriplets());

    // Shadow work patterns
    patterns.push(...this.detectShadowCards());
    patterns.push(...this.detectAvoidedCards());

    // Temporal patterns
    patterns.push(...this.detectTemporalClusters());
    patterns.push(...this.detectLunarCorrelations());

    // Thematic evolution
    patterns.push(...this.detectThematicEvolution());

    // Reversal patterns
    patterns.push(...this.detectReversalPatterns());

    // Suit/arcana dominance
    patterns.push(...this.detectSuitDominance());
    patterns.push(...this.detectMajorArcanaSurges());

    // Journal correlations (if available)
    if (this.journals.length > 0) {
      patterns.push(...this.detectMoodCorrelations());
    }

    // Generate insights and recommendations
    const insights = this.generateInsights(patterns);
    const recommendations = this.generateRecommendations(patterns);
    const shadowWork = this.generateShadowWorkGuidance(patterns);
    const temporalProfile = this.buildTemporalProfile();

    return {
      patterns: patterns.sort((a, b) => b.significance - a.significance),
      insights,
      recommendations,
      shadowWork,
      temporalProfile,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CARD FREQUENCY PATTERNS
  // ═══════════════════════════════════════════════════════════

  /**
   * Detect cards that appear with unusual frequency
   */
  private detectRecurringCards(): PatternResult[] {
    const cardCounts = new Map<string, number>();
    let totalCards = 0;

    this.readings.forEach(reading => {
      reading.cards.forEach(card => {
        const key = card.cardId || `index_${card.cardIndex}`;
        cardCounts.set(key, (cardCounts.get(key) || 0) + 1);
        totalCards++;
      });
    });

    const patterns: PatternResult[] = [];
    const avgFrequency = totalCards / 78; // 78 cards in deck

    cardCounts.forEach((count, cardId) => {
      const expectedFrequency = avgFrequency;
      const actualFrequency = count;

      // Significance based on deviation from expected
      if (actualFrequency >= expectedFrequency * 2) {
        const cardData = this.getCardName(cardId);
        const significance = Math.min(1, (actualFrequency / expectedFrequency - 1) / 3);

        patterns.push({
          patternType: 'recurring_card',
          significance,
          description: `${cardData} has appeared ${count} times - ${Math.round(significance * 100)}% above expected frequency`,
          cards: [cardId],
          frequency: count,
          metadata: {
            expectedFrequency: Math.round(expectedFrequency * 100) / 100,
            ratio: Math.round((actualFrequency / expectedFrequency) * 100) / 100,
          },
        });
      }
    });

    return patterns.slice(0, 5); // Top 5 recurring cards
  }

  /**
   * Detect card pairs that appear together frequently
   */
  private detectRecurringPairs(): PatternResult[] {
    const pairCounts = new Map<string, number>();

    this.readings.forEach(reading => {
      const cards = reading.cards.map(c => c.cardId || `index_${c.cardIndex}`);
      // Generate all pairs
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const pair = [cards[i], cards[j]].sort().join('|');
          pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
        }
      }
    });

    const patterns: PatternResult[] = [];

    pairCounts.forEach((count, pairKey) => {
      if (count >= 3) { // Pair appeared at least 3 times
        const [card1, card2] = pairKey.split('|');
        const significance = Math.min(1, count / 10);

        patterns.push({
          patternType: 'recurring_pair',
          significance,
          description: `${this.getCardName(card1)} and ${this.getCardName(card2)} appear together frequently (${count} times)`,
          cards: [card1, card2],
          frequency: count,
        });
      }
    });

    return patterns.sort((a, b) => b.significance - a.significance).slice(0, 3);
  }

  /**
   * Detect triplets that appear together
   */
  private detectRecurringTriplets(): PatternResult[] {
    const tripletCounts = new Map<string, number>();

    this.readings.forEach(reading => {
      if (reading.cards.length < 3) return;
      const cards = reading.cards.map(c => c.cardId || `index_${c.cardIndex}`);

      // Generate all triplets
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          for (let k = j + 1; k < cards.length; k++) {
            const triplet = [cards[i], cards[j], cards[k]].sort().join('|');
            tripletCounts.set(triplet, (tripletCounts.get(triplet) || 0) + 1);
          }
        }
      }
    });

    const patterns: PatternResult[] = [];

    tripletCounts.forEach((count, tripletKey) => {
      if (count >= 2) { // Triplet appeared at least twice
        const [card1, card2, card3] = tripletKey.split('|');
        const significance = Math.min(1, count / 5);

        patterns.push({
          patternType: 'recurring_triplet',
          significance,
          description: `Triplet pattern detected: ${this.getCardName(card1)}, ${this.getCardName(card2)}, ${this.getCardName(card3)} (${count} times)`,
          cards: [card1, card2, card3],
          frequency: count,
        });
      }
    });

    return patterns.sort((a, b) => b.significance - a.significance).slice(0, 2);
  }

  // ═══════════════════════════════════════════════════════════
  // SHADOW WORK PATTERNS
  // ═══════════════════════════════════════════════════════════

  /**
   * Detect "shadow cards" - cards that keep appearing despite being
   * unwanted or uncomfortable (often reversed)
   */
  private detectShadowCards(): PatternResult[] {
    const reversalCounts = new Map<string, { reversed: number; upright: number }>();

    this.readings.forEach(reading => {
      reading.cards.forEach(card => {
        const key = card.cardId || `index_${card.cardIndex}`;
        const current = reversalCounts.get(key) || { reversed: 0, upright: 0 };
        if (card.isReversed) {
          current.reversed++;
        } else {
          current.upright++;
        }
        reversalCounts.set(key, current);
      });
    });

    const patterns: PatternResult[] = [];

    reversalCounts.forEach((counts, cardId) => {
      const total = counts.reversed + counts.upright;
      const reversalRate = counts.reversed / total;

      // Shadow cards: appear frequently AND often reversed
      if (total >= 3 && reversalRate >= 0.6) {
        const significance = Math.min(1, (reversalRate * total) / 10);

        patterns.push({
          patternType: 'shadow_card',
          significance,
          description: `${this.getCardName(cardId)} appears as a shadow card - ${Math.round(reversalRate * 100)}% reversed across ${total} appearances`,
          cards: [cardId],
          frequency: total,
          metadata: {
            reversalRate,
            reversedCount: counts.reversed,
            uprightCount: counts.upright,
          },
        });
      }
    });

    return patterns.sort((a, b) => b.significance - a.significance).slice(0, 3);
  }

  /**
   * Detect cards that are conspicuously absent
   * (Cards that should statistically appear but haven't)
   */
  private detectAvoidedCards(): PatternResult[] {
    if (this.readings.length < 20) return []; // Need enough data

    const cardsSeen = new Set<number>();
    this.readings.forEach(reading => {
      reading.cards.forEach(card => {
        const idx = card.cardIndex ?? parseInt(card.cardId?.replace('index_', '') || '0');
        cardsSeen.add(idx);
      });
    });

    const totalCards = this.readings.reduce((sum, r) => sum + r.cards.length, 0);
    const expectedMinAppearances = Math.floor(totalCards / 78);

    const patterns: PatternResult[] = [];

    // Find cards never seen
    for (let i = 0; i < 78; i++) {
      if (!cardsSeen.has(i) && expectedMinAppearances >= 2) {
        const cardName = CARD_DATABASE[i]?.name || `Card ${i}`;
        patterns.push({
          patternType: 'avoided_card',
          significance: 0.7,
          description: `${cardName} has never appeared in ${this.readings.length} readings - may represent unconscious avoidance`,
          cards: [`index_${i}`],
          metadata: {
            totalReadings: this.readings.length,
            expectedAppearances: expectedMinAppearances,
          },
        });
      }
    }

    return patterns.slice(0, 3);
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPORAL PATTERNS
  // ═══════════════════════════════════════════════════════════

  /**
   * Detect temporal clusters - times when readings cluster
   */
  private detectTemporalClusters(): PatternResult[] {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);

    this.readings.forEach(reading => {
      const date = new Date(reading.startedAt);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    });

    const patterns: PatternResult[] = [];

    // Find peak hours
    const maxHourCount = Math.max(...hourCounts);
    const avgHourCount = this.readings.length / 24;

    hourCounts.forEach((count, hour) => {
      if (count > avgHourCount * 2 && count >= 3) {
        const hourName = hour === 0 ? 'midnight' : hour < 12 ? `${hour}am` : hour === 12 ? 'noon' : `${hour - 12}pm`;
        patterns.push({
          patternType: 'temporal_cluster',
          significance: Math.min(1, count / maxHourCount),
          description: `You often read around ${hourName} (${count} readings)`,
          timeframe: `${hour}:00`,
          frequency: count,
        });
      }
    });

    // Find peak days
    const maxDayCount = Math.max(...dayCounts);
    const avgDayCount = this.readings.length / 7;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    dayCounts.forEach((count, day) => {
      if (count > avgDayCount * 1.5 && count >= 3) {
        patterns.push({
          patternType: 'temporal_cluster',
          significance: Math.min(1, count / maxDayCount),
          description: `${dayNames[day]}s are your most active reading day (${count} readings)`,
          timeframe: dayNames[day],
          frequency: count,
        });
      }
    });

    return patterns.sort((a, b) => b.significance - a.significance).slice(0, 3);
  }

  /**
   * Detect lunar phase correlations
   */
  private detectLunarCorrelations(): PatternResult[] {
    // Simplified lunar phase calculation
    const getLunarPhase = (date: Date): string => {
      const lp = 2551443; // lunar period in seconds
      const known = new Date(1970, 0, 7, 20, 35, 0); // known new moon
      const diff = (date.getTime() - known.getTime()) / 1000;
      const phase = (diff % lp) / lp;

      if (phase < 0.125) return 'new';
      if (phase < 0.25) return 'waxing_crescent';
      if (phase < 0.375) return 'first_quarter';
      if (phase < 0.5) return 'waxing_gibbous';
      if (phase < 0.625) return 'full';
      if (phase < 0.75) return 'waning_gibbous';
      if (phase < 0.875) return 'last_quarter';
      return 'waning_crescent';
    };

    const phaseCounts: Record<string, number> = {};

    this.readings.forEach(reading => {
      const phase = getLunarPhase(new Date(reading.startedAt));
      phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
    });

    const patterns: PatternResult[] = [];
    const avgCount = this.readings.length / 8;

    Object.entries(phaseCounts).forEach(([phase, count]) => {
      if (count > avgCount * 1.5 && count >= 3) {
        const phaseNames: Record<string, string> = {
          new: 'New Moon',
          waxing_crescent: 'Waxing Crescent',
          first_quarter: 'First Quarter',
          waxing_gibbous: 'Waxing Gibbous',
          full: 'Full Moon',
          waning_gibbous: 'Waning Gibbous',
          last_quarter: 'Last Quarter',
          waning_crescent: 'Waning Crescent',
        };

        patterns.push({
          patternType: 'lunar_correlation',
          significance: Math.min(1, (count / avgCount - 1) / 2),
          description: `You read more during ${phaseNames[phase]} phases (${count} readings)`,
          timeframe: phase,
          frequency: count,
        });
      }
    });

    return patterns;
  }

  // ═══════════════════════════════════════════════════════════
  // THEMATIC PATTERNS
  // ═══════════════════════════════════════════════════════════

  /**
   * Detect thematic evolution over time
   */
  private detectThematicEvolution(): PatternResult[] {
    if (this.readings.length < 10) return [];

    // Split readings into thirds (past, middle, recent)
    const third = Math.floor(this.readings.length / 3);
    const recentReadings = this.readings.slice(0, third);
    const pastReadings = this.readings.slice(third * 2);

    // Count suits in each period
    const countSuits = (readings: Reading[]) => {
      const counts: Record<string, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0, major: 0 };
      readings.forEach(r => {
        r.cards.forEach(c => {
          const cardData = CARD_DATABASE[c.cardIndex || 0];
          if (cardData) {
            if (cardData.arcana === 'major') {
              counts.major++;
            } else if (cardData.suit) {
              counts[cardData.suit.toLowerCase()]++;
            }
          }
        });
      });
      return counts;
    };

    const recentSuits = countSuits(recentReadings);
    const pastSuits = countSuits(pastReadings);

    const patterns: PatternResult[] = [];

    // Detect shifts
    Object.entries(recentSuits).forEach(([suit, count]) => {
      const pastCount = pastSuits[suit] || 0;
      const normalizedRecent = count / recentReadings.length;
      const normalizedPast = pastCount / pastReadings.length;

      if (normalizedRecent > normalizedPast * 1.5 && normalizedRecent > 0.5) {
        const suitMeanings: Record<string, string> = {
          wands: 'action, passion, and will',
          cups: 'emotions and relationships',
          swords: 'thoughts and conflicts',
          pentacles: 'material and practical matters',
          major: 'soul-level transformations',
        };

        patterns.push({
          patternType: 'thematic_evolution',
          significance: Math.min(1, (normalizedRecent / normalizedPast - 1) / 2),
          description: `Your readings are shifting toward ${suitMeanings[suit]} (${suit} energy increasing)`,
          metadata: {
            suit,
            recentRatio: Math.round(normalizedRecent * 100) / 100,
            pastRatio: Math.round(normalizedPast * 100) / 100,
          },
        });
      }
    });

    return patterns;
  }

  // ═══════════════════════════════════════════════════════════
  // REVERSAL & ARCANA PATTERNS
  // ═══════════════════════════════════════════════════════════

  /**
   * Detect reversal patterns
   */
  private detectReversalPatterns(): PatternResult[] {
    let totalCards = 0;
    let reversedCards = 0;

    this.readings.forEach(r => {
      r.cards.forEach(c => {
        totalCards++;
        if (c.isReversed) reversedCards++;
      });
    });

    const reversalRate = reversedCards / totalCards;
    const patterns: PatternResult[] = [];

    // Expect ~50% reversals if truly random
    if (reversalRate > 0.65) {
      patterns.push({
        patternType: 'reversal_pattern',
        significance: Math.min(1, (reversalRate - 0.5) * 2),
        description: `High reversal rate (${Math.round(reversalRate * 100)}%) - shadow themes may need attention`,
        metadata: { reversalRate },
      });
    } else if (reversalRate < 0.35) {
      patterns.push({
        patternType: 'reversal_pattern',
        significance: Math.min(1, (0.5 - reversalRate) * 2),
        description: `Low reversal rate (${Math.round(reversalRate * 100)}%) - generally aligned flow`,
        metadata: { reversalRate },
      });
    }

    return patterns;
  }

  /**
   * Detect suit dominance
   */
  private detectSuitDominance(): PatternResult[] {
    const suitCounts: Record<string, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
    let minorTotal = 0;

    this.readings.forEach(r => {
      r.cards.forEach(c => {
        const cardData = CARD_DATABASE[c.cardIndex || 0];
        if (cardData && cardData.arcana !== 'major' && cardData.suit) {
          suitCounts[cardData.suit.toLowerCase()]++;
          minorTotal++;
        }
      });
    });

    const patterns: PatternResult[] = [];

    if (minorTotal > 10) {
      Object.entries(suitCounts).forEach(([suit, count]) => {
        const ratio = count / minorTotal;
        if (ratio > 0.35) { // More than 35% of one suit
          const suitMeanings: Record<string, string> = {
            wands: 'creative energy, passion, will',
            cups: 'emotional matters, relationships',
            swords: 'mental activity, conflicts',
            pentacles: 'material world, stability',
          };

          patterns.push({
            patternType: 'suit_dominance',
            significance: Math.min(1, (ratio - 0.25) * 2),
            description: `${suit.charAt(0).toUpperCase() + suit.slice(1)} dominate your readings (${Math.round(ratio * 100)}%) - focus on ${suitMeanings[suit]}`,
            cards: [suit],
            metadata: { ratio, count },
          });
        }
      });
    }

    return patterns;
  }

  /**
   * Detect major arcana surges
   */
  private detectMajorArcanaSurges(): PatternResult[] {
    if (this.readings.length < 5) return [];

    // Check recent readings for major arcana ratio
    const recentReadings = this.readings.slice(0, Math.min(10, this.readings.length));
    let majorCount = 0;
    let totalCards = 0;

    recentReadings.forEach(r => {
      r.cards.forEach(c => {
        totalCards++;
        const cardData = CARD_DATABASE[c.cardIndex || 0];
        if (cardData && cardData.arcana === 'major') {
          majorCount++;
        }
      });
    });

    const majorRatio = majorCount / totalCards;
    const expectedRatio = 22 / 78; // ~28%

    const patterns: PatternResult[] = [];

    if (majorRatio > expectedRatio * 1.5 && majorRatio > 0.4) {
      patterns.push({
        patternType: 'major_arcana_surge',
        significance: Math.min(1, (majorRatio - expectedRatio) * 2),
        description: `Major Arcana surge in recent readings (${Math.round(majorRatio * 100)}%) - soul-level themes are active`,
        metadata: { majorRatio, majorCount, totalCards },
      });
    }

    return patterns;
  }

  // ═══════════════════════════════════════════════════════════
  // JOURNAL CORRELATIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Detect mood correlations with card patterns
   */
  private detectMoodCorrelations(): PatternResult[] {
    const linkedReadings = this.readings.filter(r =>
      this.journals.some(j => j.linkedReadingId === r.id)
    );

    if (linkedReadings.length < 5) return [];

    const moodCardCorrelations: Record<string, Map<string, number>> = {};

    linkedReadings.forEach(reading => {
      const journal = this.journals.find(j => j.linkedReadingId === reading.id);
      if (!journal?.mood) return;

      if (!moodCardCorrelations[journal.mood]) {
        moodCardCorrelations[journal.mood] = new Map();
      }

      reading.cards.forEach(card => {
        const key = card.cardId || `index_${card.cardIndex}`;
        const current = moodCardCorrelations[journal.mood].get(key) || 0;
        moodCardCorrelations[journal.mood].set(key, current + 1);
      });
    });

    const patterns: PatternResult[] = [];

    Object.entries(moodCardCorrelations).forEach(([mood, cardMap]) => {
      cardMap.forEach((count, cardId) => {
        if (count >= 3) {
          patterns.push({
            patternType: 'mood_correlation',
            significance: Math.min(1, count / 5),
            description: `${this.getCardName(cardId)} appears when you're feeling ${mood} (${count} times)`,
            cards: [cardId],
            frequency: count,
            metadata: { mood },
          });
        }
      });
    });

    return patterns.sort((a, b) => b.significance - a.significance).slice(0, 3);
  }

  // ═══════════════════════════════════════════════════════════
  // INSIGHT GENERATION
  // ═══════════════════════════════════════════════════════════

  private generateInsights(patterns: PatternResult[]): string[] {
    const insights: string[] = [];

    // High-significance patterns
    const highSig = patterns.filter(p => p.significance >= 0.7);
    if (highSig.length > 0) {
      insights.push(`Strong patterns detected: ${highSig.length} significant recurring themes in your readings`);
    }

    // Shadow work needed
    const shadowPatterns = patterns.filter(p =>
      p.patternType === 'shadow_card' || p.patternType === 'avoided_card'
    );
    if (shadowPatterns.length > 0) {
      insights.push('Shadow work opportunities present - consider journaling on uncomfortable themes');
    }

    // Temporal insights
    const temporalPatterns = patterns.filter(p => p.patternType === 'temporal_cluster');
    if (temporalPatterns.length > 0) {
      const times = temporalPatterns.map(p => p.timeframe).join(', ');
      insights.push(`Your intuitive connection peaks during: ${times}`);
    }

    // Thematic evolution
    const evolution = patterns.find(p => p.patternType === 'thematic_evolution');
    if (evolution) {
      insights.push(evolution.description);
    }

    return insights;
  }

  private generateRecommendations(patterns: PatternResult[]): string[] {
    const recommendations: string[] = [];

    // Based on shadow cards
    const shadowCards = patterns.filter(p => p.patternType === 'shadow_card');
    if (shadowCards.length > 0) {
      const cardName = shadowCards[0].cards?.[0];
      recommendations.push(`Meditate on ${this.getCardName(cardName || '')} - it's seeking your attention`);
    }

    // Based on suit dominance
    const suitDom = patterns.find(p => p.patternType === 'suit_dominance');
    if (suitDom) {
      const suit = suitDom.cards?.[0];
      const opposites: Record<string, string> = {
        wands: 'pentacles',
        cups: 'swords',
        swords: 'cups',
        pentacles: 'wands',
      };
      if (suit && opposites[suit]) {
        recommendations.push(`Balance ${suit} energy with ${opposites[suit]} - seek complementary perspectives`);
      }
    }

    // Based on temporal clusters
    const temporal = patterns.find(p => p.patternType === 'temporal_cluster');
    if (temporal) {
      recommendations.push(`Schedule important readings during your peak time: ${temporal.timeframe}`);
    }

    return recommendations;
  }

  private generateShadowWorkGuidance(patterns: PatternResult[]): {
    cards: string[];
    themes: string[];
    suggestedPrompts: string[];
  } {
    const shadowCards = patterns
      .filter(p => p.patternType === 'shadow_card' || p.patternType === 'avoided_card')
      .flatMap(p => p.cards || []);

    const themes: string[] = [];
    shadowCards.forEach(cardId => {
      const cardData = CARD_DATABASE[parseInt(cardId.replace('index_', '')) || 0];
      if (cardData?.themes) {
        themes.push(...cardData.themes);
      }
    });

    const uniqueThemes = [...new Set(themes)];

    const suggestedPrompts = [
      'What am I avoiding confronting in my life right now?',
      'What truth am I not ready to accept?',
      `Explore your feelings about: ${uniqueThemes.slice(0, 3).join(', ')}`,
    ];

    return {
      cards: shadowCards.map(id => this.getCardName(id)),
      themes: uniqueThemes.slice(0, 5),
      suggestedPrompts,
    };
  }

  private buildTemporalProfile(): {
    peakHours: number[];
    peakDays: number[];
    lunarPreference?: string;
  } {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);

    this.readings.forEach(reading => {
      const date = new Date(reading.startedAt);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    });

    const avgHour = this.readings.length / 24;
    const avgDay = this.readings.length / 7;

    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > avgHour)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);

    const peakDays = dayCounts
      .map((count, day) => ({ day, count }))
      .filter(d => d.count > avgDay)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(d => d.day);

    return { peakHours, peakDays };
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  private getCardName(cardId: string): string {
    const idx = parseInt(cardId.replace('index_', '')) || 0;
    return CARD_DATABASE[idx]?.name || cardId;
  }
}

/**
 * Convenience function for quick analysis
 */
export function analyzeReadingPatterns(
  readings: Reading[],
  journals: JournalEntry[] = []
): CrossSessionAnalysis {
  const engine = new CrossSessionPatternEngine(readings, journals);
  return engine.analyze();
}
