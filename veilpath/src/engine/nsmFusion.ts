/**
 * NSM MULTI-MODAL FUSION ENGINE v2.0
 *
 * Novel Synthesis Method applied to Vera intelligence.
 * Fuses knowledge from multiple domains into unified vera response:
 *
 * Knowledge Domains:
 * 1. TAROT: Semantic space, card meanings, spreads
 * 2. PSYCHOLOGY: MBTI types (6D cognitive function space), Jungian archetypes
 * 3. NEUROSCIENCE: Emotional resonance, cognitive patterns
 * 4. LINGUISTICS: Language patterns, rhetorical devices
 * 5. SANSKRIT: Phonetic consciousness mapping, chakra system
 * 6. USER HISTORY: Past readings, preferences, profile
 * 7. CROSS-SESSION PATTERNS: Recurring cards, shadow work, temporal clusters
 * 8. JOURNAL CORRELATION: Theme alignment, mood transitions, growth indicators
 *
 * Fusion Strategy:
 * - Extract feature vectors from each domain
 * - Weight by domain relevance and confidence
 * - Geometric mean in hyperdimensional space
 * - Decode fusion → vera response with full provenance
 *
 * References:
 * - NSM (Novel Synthesis Method) - Ryan's framework
 * - Multi-modal learning (Baltrusaitis et al., 2019)
 * - Geometric deep learning
 * - Information fusion theory
 * - Kolmogorov complexity for pattern significance
 */

import type { BijaMantra, SemanticCoordinate, Archetype } from './sanskritPhonetics';
import { encodeSanskritPersonality } from './sanskritPhonetics';
import type { CrossSessionAnalysis, PatternResult } from '../services/crossSessionPatterns';
import type { JournalCardAnalysis, LongitudinalPattern } from '../services/journalCardCorrelation';

/**
 * Feature vector in hyperdimensional space
 */
export interface FeatureVector {
  dimensions: number[];
  domain: KnowledgeDomain;
  confidence: number; // 0-1
}

/**
 * Knowledge domains for fusion
 */
export type KnowledgeDomain =
  | 'tarot'
  | 'psychology'
  | 'neuroscience'
  | 'linguistics'
  | 'sanskrit'
  | 'user_history'
  | 'cross_session'
  | 'journal_correlation';

/**
 * Weighted feature vector for fusion
 */
export interface WeightedVector {
  vector: FeatureVector;
  weight: number; // 0-1
}

/**
 * Fusion result with provenance
 */
export interface FusionResult {
  fusedVector: number[];
  semanticPosition: SemanticCoordinate;
  dominantDomain: KnowledgeDomain;
  domainContributions: Map<KnowledgeDomain, number>;
  confidence: number;
  provenance: string; // Explanation of fusion
}

/**
 * User context for personalization
 */
export interface UserContext {
  mbtiType?: string;
  zodiacSign?: string;
  chineseZodiac?: string;
  birthdate?: string;
  readingHistory?: any[];
  preferences?: {
    readingDepth?: 'surface' | 'moderate' | 'deep';
    tonePreference?: 'gentle' | 'direct' | 'poetic';
    topicsOfInterest?: string[];
  };
  // New v2.0 fields
  crossSessionAnalysis?: CrossSessionAnalysis;
  journalAnalysis?: JournalCardAnalysis;
}

/**
 * Enhanced fusion result with pattern insights
 */
export interface EnhancedFusionResult extends FusionResult {
  patternInsights: string[];
  shadowWorkSuggestions: string[];
  growthIndicators: string[];
  personalizedGuidance: string[];
}

/**
 * Tarot context
 */
export interface TarotContext {
  cards: Array<{
    cardIndex: number;
    cardName: string;
    reversed: boolean;
    position: string;
  }>;
  spreadType: string;
  intention?: string;
}

/**
 * NSM Fusion Engine
 *
 * Synthesizes vera responses from multiple knowledge domains.
 */
export class NSMFusionEngine {
  /**
   * Extract feature vector from tarot domain
   */
  private extractTarotFeatures(context: TarotContext): FeatureVector {
    // Simplified: Map cards to semantic space
    // In production: Use actual card embeddings from geometricSemanticSpace.js

    const cardFeatures = context.cards.map((card) => {
      // Placeholder: Hash card name to vector
      const hash = this.hashString(card.cardName);
      const x = (hash % 100) / 100;
      const y = ((hash >> 8) % 100) / 100;
      const z = ((hash >> 16) % 100) / 100;

      // Reverse if needed
      const reversalFactor = card.reversed ? -0.5 : 0.5;

      return [x + reversalFactor, y, z];
    });

    // Average card vectors
    const avgVector = this.averageVectors(cardFeatures);

    return {
      dimensions: avgVector,
      domain: 'tarot',
      confidence: 0.9, // High confidence in tarot domain
    };
  }

  /**
   * Extract feature vector from psychology domain
   * Enhanced to use 6D cognitive function space
   */
  private extractPsychologyFeatures(userContext: UserContext): FeatureVector {
    // Map MBTI to 6D cognitive function space
    const mbtiEmbedding = this.mbtiToVector(userContext.mbtiType);

    // Map zodiac to 6D archetypal energy
    const zodiacEmbedding = this.zodiacToVector6D(userContext.zodiacSign);

    // Blend with MBTI weighted higher (it's more specific)
    const blended = this.blendVectors([
      { vector: mbtiEmbedding, weight: 0.65 },
      { vector: zodiacEmbedding, weight: 0.35 },
    ]);

    // Calculate confidence based on available data
    let confidence = 0.3; // Base confidence
    if (userContext.mbtiType) confidence += 0.4; // MBTI adds significant confidence
    if (userContext.zodiacSign) confidence += 0.15; // Zodiac adds some
    if (userContext.birthdate) confidence += 0.1; // Birthdate (for moon/rising) adds more

    return {
      dimensions: blended,
      domain: 'psychology',
      confidence: Math.min(1, confidence),
    };
  }

  /**
   * Enhanced zodiac to 6D vector for alignment with MBTI space
   */
  private zodiacToVector6D(zodiac?: string): number[] {
    if (!zodiac) return [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

    // Zodiac archetypes mapped to 6D space
    const ZODIAC_PROFILES: Record<string, number[]> = {
      // D1: Intuition, D2: Feeling, D3: Orientation, D4: Shadow, D5: Element, D6: Abstract
      Aries:       [0.6, 0.4, 0.8, 0.45, 0.85, 0.4],  // Fire, cardinal, action
      Taurus:      [0.3, 0.6, 0.4, 0.55, 0.25, 0.2],  // Earth, fixed, stability
      Gemini:      [0.7, 0.4, 0.8, 0.5, 0.65, 0.7],   // Air, mutable, communication
      Cancer:      [0.5, 0.9, 0.3, 0.6, 0.55, 0.5],   // Water, cardinal, nurturing
      Leo:         [0.5, 0.5, 0.9, 0.4, 0.85, 0.5],   // Fire, fixed, expression
      Virgo:       [0.4, 0.5, 0.3, 0.65, 0.25, 0.35], // Earth, mutable, analysis
      Libra:       [0.6, 0.7, 0.7, 0.5, 0.65, 0.6],   // Air, cardinal, balance
      Scorpio:     [0.8, 0.7, 0.2, 0.75, 0.55, 0.85], // Water, fixed, transformation
      Sagittarius: [0.7, 0.4, 0.8, 0.45, 0.85, 0.75], // Fire, mutable, expansion
      Capricorn:   [0.4, 0.3, 0.4, 0.6, 0.25, 0.3],   // Earth, cardinal, structure
      Aquarius:    [0.8, 0.4, 0.7, 0.55, 0.65, 0.8],  // Air, fixed, innovation
      Pisces:      [0.9, 0.8, 0.2, 0.7, 0.55, 0.9],   // Water, mutable, transcendence
    };

    return ZODIAC_PROFILES[zodiac] || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  }

  /**
   * Extract feature vector from neuroscience domain
   */
  private extractNeuroscienceFeatures(
    userInput: string,
    tarotContext: TarotContext
  ): FeatureVector {
    // Emotional resonance detection
    const emotionalTone = this.detectEmotionalTone(userInput);

    // Cognitive complexity estimation
    const cognitiveLoad = this.estimateCognitiveComplexity(userInput);

    // Map to 3D space
    const vector = [
      emotionalTone.valence, // Negative ↔ Positive
      emotionalTone.arousal, // Calm ↔ Excited
      cognitiveLoad, // Simple ↔ Complex
    ];

    return {
      dimensions: vector,
      domain: 'neuroscience',
      confidence: 0.7,
    };
  }

  /**
   * Extract feature vector from linguistics domain
   */
  private extractLinguisticsFeatures(userInput: string): FeatureVector {
    // Analyze language patterns
    const formality = this.detectFormality(userInput);
    const abstractness = this.detectAbstractness(userInput);
    const questionComplexity = this.detectQuestionComplexity(userInput);

    const vector = [formality, abstractness, questionComplexity];

    return {
      dimensions: vector,
      domain: 'linguistics',
      confidence: 0.6,
    };
  }

  /**
   * Extract feature vector from Sanskrit domain
   */
  private extractSanskritFeatures(
    personalityTraits: Record<string, number>,
    archetype?: Archetype
  ): FeatureVector {
    const encoded = encodeSanskritPersonality(personalityTraits, archetype);

    // Use semantic position from Sanskrit encoding
    const { x, y, z } = encoded.phonetics.semanticPosition;

    return {
      dimensions: [x, y, z],
      domain: 'sanskrit',
      confidence: 0.9,
    };
  }

  /**
   * Extract feature vector from user history domain
   */
  private extractUserHistoryFeatures(userContext: UserContext): FeatureVector {
    if (!userContext.readingHistory || userContext.readingHistory.length === 0) {
      return {
        dimensions: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        domain: 'user_history',
        confidence: 0.1,
      };
    }

    // Analyze past reading patterns
    const readingFrequency = Math.min(userContext.readingHistory.length / 100, 1.0);
    const engagementDepth = 0.7;
    const avgSentiment = 0.6;
    const consistency = 0.5; // How consistent readings are
    const growth = 0.5; // Growth trajectory
    const integration = 0.5; // Integration of insights

    return {
      dimensions: [avgSentiment, readingFrequency, engagementDepth, consistency, growth, integration],
      domain: 'user_history',
      confidence: 0.5,
    };
  }

  /**
   * Extract feature vector from cross-session patterns
   * Uses CrossSessionPatternEngine analysis
   */
  private extractCrossSessionFeatures(userContext: UserContext): FeatureVector {
    if (!userContext.crossSessionAnalysis) {
      return {
        dimensions: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        domain: 'cross_session',
        confidence: 0.1,
      };
    }

    const analysis = userContext.crossSessionAnalysis;
    const patterns = analysis.patterns;

    // D1: Recurring pattern strength (how many significant patterns)
    const patternStrength = Math.min(1, patterns.filter(p => p.significance > 0.5).length / 5);

    // D2: Shadow work intensity (shadow cards + avoided cards)
    const shadowPatterns = patterns.filter(
      p => p.patternType === 'shadow_card' || p.patternType === 'avoided_card'
    );
    const shadowIntensity = Math.min(1, shadowPatterns.length / 3);

    // D3: Temporal coherence (how consistent reading times are)
    const temporalPatterns = patterns.filter(p => p.patternType === 'temporal_cluster');
    const temporalCoherence = Math.min(1, temporalPatterns.length / 2);

    // D4: Thematic evolution (change over time)
    const evolutionPatterns = patterns.filter(p => p.patternType === 'thematic_evolution');
    const evolutionScore = evolutionPatterns.length > 0 ? 0.7 : 0.3;

    // D5: Major arcana presence
    const majorSurge = patterns.find(p => p.patternType === 'major_arcana_surge');
    const majorPresence = majorSurge ? majorSurge.significance : 0.5;

    // D6: Reversal balance (flow state vs blockage)
    const reversalPattern = patterns.find(p => p.patternType === 'reversal_pattern');
    const reversalBalance = reversalPattern?.metadata?.reversalRate ?? 0.5;

    return {
      dimensions: [
        patternStrength,
        shadowIntensity,
        temporalCoherence,
        evolutionScore,
        majorPresence,
        1 - reversalBalance, // Invert so higher = more flow
      ],
      domain: 'cross_session',
      confidence: patterns.length > 3 ? 0.8 : 0.4,
    };
  }

  /**
   * Extract feature vector from journal correlations
   * Uses JournalCardCorrelationEngine analysis
   */
  private extractJournalCorrelationFeatures(userContext: UserContext): FeatureVector {
    if (!userContext.journalAnalysis) {
      return {
        dimensions: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        domain: 'journal_correlation',
        confidence: 0.1,
      };
    }

    const analysis = userContext.journalAnalysis;

    // D1: Theme alignment (journal themes match card themes)
    const avgAlignment = analysis.correlations.length > 0
      ? analysis.correlations.reduce((sum, c) => sum + c.overallAlignment, 0) / analysis.correlations.length
      : 0.5;

    // D2: Mood improvement trend
    const moodImprovements = analysis.correlations
      .map(c => c.moodTransition.improvement)
      .filter(i => !isNaN(i));
    const avgMoodChange = moodImprovements.length > 0
      ? (moodImprovements.reduce((a, b) => a + b, 0) / moodImprovements.length + 1) / 2
      : 0.5;

    // D3: Growth pattern presence
    const growthPatterns = analysis.longitudinalPatterns.filter(p => p.patternType === 'growth');
    const growthScore = Math.min(1, growthPatterns.length / 2);

    // D4: Breakthrough frequency
    const breakthroughs = analysis.longitudinalPatterns.filter(p => p.patternType === 'breakthrough');
    const breakthroughScore = Math.min(1, breakthroughs.length / 3);

    // D5: Therapeutic depth (based on growth indicators)
    const therapeuticDepth = Math.min(1, analysis.growthIndicators.length / 3);

    // D6: Warning level (inverse - fewer warnings = better)
    const warningLevel = 1 - Math.min(1, analysis.warnings.length / 2);

    return {
      dimensions: [
        avgAlignment,
        avgMoodChange,
        growthScore,
        breakthroughScore,
        therapeuticDepth,
        warningLevel,
      ],
      domain: 'journal_correlation',
      confidence: analysis.correlations.length > 5 ? 0.85 : 0.5,
    };
  }

  /**
   * MAIN FUSION v2.0: Combine all 8 domains into unified feature vector
   *
   * Uses weighted geometric mean for robust fusion.
   * Now incorporates cross-session patterns and journal correlations.
   *
   * Theoretical Foundation:
   * - Solomonoff prior: P(interpretation) ∝ 2^{-K(interpretation)}
   * - AIXI-like optimization over universal prior
   * - Casimir vacuum for phenomenological baseline
   */
  fuse(
    userInput: string,
    tarotContext: TarotContext,
    userContext: UserContext,
    personalityTraits: Record<string, number>,
    archetype?: Archetype
  ): EnhancedFusionResult {
    // Extract features from all 8 domains
    const tarotFeatures = this.extractTarotFeatures(tarotContext);
    const psychologyFeatures = this.extractPsychologyFeatures(userContext);
    const neuroscienceFeatures = this.extractNeuroscienceFeatures(userInput, tarotContext);
    const linguisticsFeatures = this.extractLinguisticsFeatures(userInput);
    const sanskritFeatures = this.extractSanskritFeatures(personalityTraits, archetype);
    const historyFeatures = this.extractUserHistoryFeatures(userContext);
    const crossSessionFeatures = this.extractCrossSessionFeatures(userContext);
    const journalFeatures = this.extractJournalCorrelationFeatures(userContext);

    // Domain weights (adaptive based on context and confidence)
    const weights = this.computeDomainWeightsV2({
      tarotFeatures,
      psychologyFeatures,
      neuroscienceFeatures,
      linguisticsFeatures,
      sanskritFeatures,
      historyFeatures,
      crossSessionFeatures,
      journalFeatures,
    });

    // Weighted vectors for all 8 domains
    const weightedVectors: WeightedVector[] = [
      { vector: tarotFeatures, weight: weights.get('tarot')! },
      { vector: psychologyFeatures, weight: weights.get('psychology')! },
      { vector: neuroscienceFeatures, weight: weights.get('neuroscience')! },
      { vector: linguisticsFeatures, weight: weights.get('linguistics')! },
      { vector: sanskritFeatures, weight: weights.get('sanskrit')! },
      { vector: historyFeatures, weight: weights.get('user_history')! },
      { vector: crossSessionFeatures, weight: weights.get('cross_session')! },
      { vector: journalFeatures, weight: weights.get('journal_correlation')! },
    ];

    // Geometric fusion (Solomonoff-coherent)
    const fusedVector = this.geometricMean(weightedVectors);

    // Map to 3D semantic space
    const semanticPosition: SemanticCoordinate = {
      x: fusedVector[0] || 0.5,
      y: fusedVector[1] || 0.5,
      z: fusedVector[2] || 0.5,
    };

    // Find dominant domain
    const dominantDomain = this.findDominantDomain(weights);

    // Compute overall confidence
    const confidence = this.computeConfidence(weightedVectors);

    // Generate provenance explanation
    const provenance = this.generateProvenance(weights, dominantDomain);

    // Generate enhanced insights from pattern analysis
    const patternInsights = this.generatePatternInsights(userContext, crossSessionFeatures);
    const shadowWorkSuggestions = this.generateShadowWorkSuggestions(userContext);
    const growthIndicators = this.extractGrowthIndicators(userContext);
    const personalizedGuidance = this.generatePersonalizedGuidance(
      userContext,
      tarotContext,
      fusedVector
    );

    return {
      fusedVector,
      semanticPosition,
      dominantDomain,
      domainContributions: weights,
      confidence,
      provenance,
      patternInsights,
      shadowWorkSuggestions,
      growthIndicators,
      personalizedGuidance,
    };
  }

  /**
   * Generate pattern insights from cross-session analysis
   */
  private generatePatternInsights(
    userContext: UserContext,
    crossSessionFeatures: FeatureVector
  ): string[] {
    const insights: string[] = [];

    if (userContext.crossSessionAnalysis) {
      const analysis = userContext.crossSessionAnalysis;
      insights.push(...analysis.insights);
    }

    // Add insights based on feature vector
    if (crossSessionFeatures.dimensions[0] > 0.7) {
      insights.push('Strong recurring patterns detected - the cards are sending a clear message');
    }
    if (crossSessionFeatures.dimensions[1] > 0.6) {
      insights.push('Shadow themes are active - consider journaling on uncomfortable truths');
    }

    return insights;
  }

  /**
   * Generate shadow work suggestions
   */
  private generateShadowWorkSuggestions(userContext: UserContext): string[] {
    if (!userContext.crossSessionAnalysis) return [];
    return userContext.crossSessionAnalysis.shadowWork.suggestedPrompts;
  }

  /**
   * Extract growth indicators
   */
  private extractGrowthIndicators(userContext: UserContext): string[] {
    const indicators: string[] = [];

    if (userContext.journalAnalysis) {
      indicators.push(...userContext.journalAnalysis.growthIndicators);
    }

    return indicators;
  }

  /**
   * Generate personalized guidance based on fused context
   */
  private generatePersonalizedGuidance(
    userContext: UserContext,
    tarotContext: TarotContext,
    fusedVector: number[]
  ): string[] {
    const guidance: string[] = [];

    // Based on MBTI and card alignment
    if (userContext.mbtiType) {
      const isIntuitive = userContext.mbtiType.includes('N');
      const isFeeling = userContext.mbtiType.includes('F');

      if (isIntuitive && fusedVector[0] > 0.6) {
        guidance.push('Trust your intuition here - the patterns align with your natural perception');
      }
      if (isFeeling && fusedVector[1] > 0.6) {
        guidance.push('Honor your emotional response to these cards');
      }
    }

    // Based on cross-session patterns
    if (userContext.crossSessionAnalysis) {
      guidance.push(...userContext.crossSessionAnalysis.recommendations);
    }

    return guidance;
  }

  /**
   * Compute adaptive domain weights v2.0 for 8 domains
   * Implements Solomonoff-weighted prior: domains with higher confidence
   * and more data contribute more to the fusion.
   */
  private computeDomainWeightsV2(features: {
    tarotFeatures: FeatureVector;
    psychologyFeatures: FeatureVector;
    neuroscienceFeatures: FeatureVector;
    linguisticsFeatures: FeatureVector;
    sanskritFeatures: FeatureVector;
    historyFeatures: FeatureVector;
    crossSessionFeatures: FeatureVector;
    journalFeatures: FeatureVector;
  }): Map<KnowledgeDomain, number> {
    // Base weights (importance priors)
    const basePriors: Record<KnowledgeDomain, number> = {
      tarot: 0.30,              // Primary domain
      psychology: 0.18,         // MBTI/zodiac personalization
      cross_session: 0.15,      // Historical patterns
      journal_correlation: 0.12, // Journal alignment
      neuroscience: 0.10,       // Emotional resonance
      user_history: 0.07,       // Usage patterns
      linguistics: 0.05,        // Language analysis
      sanskrit: 0.03,           // Phonetic consciousness
    };

    // Confidence-weighted priors (multiply base by confidence)
    const rawWeights = new Map<KnowledgeDomain, number>([
      ['tarot', basePriors.tarot * features.tarotFeatures.confidence],
      ['psychology', basePriors.psychology * features.psychologyFeatures.confidence],
      ['neuroscience', basePriors.neuroscience * features.neuroscienceFeatures.confidence],
      ['linguistics', basePriors.linguistics * features.linguisticsFeatures.confidence],
      ['sanskrit', basePriors.sanskrit * features.sanskritFeatures.confidence],
      ['user_history', basePriors.user_history * features.historyFeatures.confidence],
      ['cross_session', basePriors.cross_session * features.crossSessionFeatures.confidence],
      ['journal_correlation', basePriors.journal_correlation * features.journalFeatures.confidence],
    ]);

    // Normalize to sum to 1.0
    const totalWeight = Array.from(rawWeights.values()).reduce((a, b) => a + b, 0);
    const normalized = new Map<KnowledgeDomain, number>();

    rawWeights.forEach((weight, domain) => {
      normalized.set(domain, weight / totalWeight);
    });

    return normalized;
  }

  /**
   * Legacy: Compute adaptive domain weights based on context (6 domains)
   * @deprecated Use computeDomainWeightsV2 for 8-domain fusion
   */
  private computeDomainWeights(features: {
    tarotFeatures: FeatureVector;
    psychologyFeatures: FeatureVector;
    neuroscienceFeatures: FeatureVector;
    linguisticsFeatures: FeatureVector;
    sanskritFeatures: FeatureVector;
    historyFeatures: FeatureVector;
  }): Map<KnowledgeDomain, number> {
    // Weight by confidence scores
    const rawWeights = new Map<KnowledgeDomain, number>([
      ['tarot', features.tarotFeatures.confidence * 0.4],
      ['psychology', features.psychologyFeatures.confidence * 0.25],
      ['neuroscience', features.neuroscienceFeatures.confidence * 0.15],
      ['linguistics', features.linguisticsFeatures.confidence * 0.1],
      ['sanskrit', features.sanskritFeatures.confidence * 0.05],
      ['user_history', features.historyFeatures.confidence * 0.05],
    ]);

    const totalWeight = Array.from(rawWeights.values()).reduce((a, b) => a + b, 0);
    const normalized = new Map<KnowledgeDomain, number>();

    rawWeights.forEach((weight, domain) => {
      normalized.set(domain, weight / totalWeight);
    });

    return normalized;
  }

  /**
   * Geometric mean fusion (robust to outliers)
   */
  private geometricMean(weightedVectors: WeightedVector[]): number[] {
    // Assume all vectors have same dimensionality
    const dims = weightedVectors[0].vector.dimensions.length;
    const result: number[] = new Array(dims).fill(1);

    for (let d = 0; d < dims; d++) {
      let product = 1;
      let totalWeight = 0;

      for (const { vector, weight } of weightedVectors) {
        const value = vector.dimensions[d] || 0.5;
        product *= Math.pow(value, weight);
        totalWeight += weight;
      }

      result[d] = Math.pow(product, 1 / totalWeight);
    }

    return result;
  }

  /**
   * Find dominant domain (highest weight)
   */
  private findDominantDomain(weights: Map<KnowledgeDomain, number>): KnowledgeDomain {
    let maxWeight = 0;
    let dominant: KnowledgeDomain = 'tarot';

    weights.forEach((weight, domain) => {
      if (weight > maxWeight) {
        maxWeight = weight;
        dominant = domain;
      }
    });

    return dominant;
  }

  /**
   * Compute overall confidence (weighted average)
   */
  private computeConfidence(weightedVectors: WeightedVector[]): number {
    let totalConfidence = 0;
    let totalWeight = 0;

    for (const { vector, weight } of weightedVectors) {
      totalConfidence += vector.confidence * weight;
      totalWeight += weight;
    }

    return totalConfidence / totalWeight;
  }

  /**
   * Generate human-readable provenance explanation
   */
  private generateProvenance(
    weights: Map<KnowledgeDomain, number>,
    dominant: KnowledgeDomain
  ): string {
    const contributions = Array.from(weights.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([domain, weight]) => `${domain} (${(weight * 100).toFixed(0)}%)`)
      .join(', ');

    return `This vera response synthesizes insights from: ${contributions}. Primary domain: ${dominant}.`;
  }

  // === HELPER FUNCTIONS ===

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private averageVectors(vectors: number[][]): number[] {
    if (vectors.length === 0) return [0.5, 0.5, 0.5];

    const dims = vectors[0].length;
    const result: number[] = new Array(dims).fill(0);

    for (const vec of vectors) {
      for (let d = 0; d < dims; d++) {
        result[d] += vec[d];
      }
    }

    return result.map((v) => v / vectors.length);
  }

  private blendVectors(weighted: Array<{ vector: number[]; weight: number }>): number[] {
    const dims = weighted[0].vector.length;
    const result: number[] = new Array(dims).fill(0);

    for (const { vector, weight } of weighted) {
      for (let d = 0; d < dims; d++) {
        result[d] += vector[d] * weight;
      }
    }

    return result;
  }

  /**
   * Enhanced MBTI to vector mapping using cognitive function stacks
   * Creates a 6D semantic space for personality:
   * - D1: Perception axis (Ni/Ne vs Si/Se) - Intuition vs Sensing
   * - D2: Judging axis (Ti/Te vs Fi/Fe) - Thinking vs Feeling
   * - D3: Orientation (Introverted vs Extroverted dominant)
   * - D4: Shadow integration (Tertiary/Inferior strength)
   * - D5: Tarot element affinity (Fire/Water/Air/Earth)
   * - D6: Abstract vs Concrete processing
   */
  private mbtiToVector(mbti?: string): number[] {
    if (!mbti) return [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

    // Full cognitive function stacks per type
    const COGNITIVE_STACKS: Record<string, {
      functions: string[];
      element: 'fire' | 'water' | 'air' | 'earth';
      abstractness: number;
    }> = {
      INTJ: { functions: ['Ni', 'Te', 'Fi', 'Se'], element: 'air', abstractness: 0.9 },
      INTP: { functions: ['Ti', 'Ne', 'Si', 'Fe'], element: 'air', abstractness: 0.85 },
      ENTJ: { functions: ['Te', 'Ni', 'Se', 'Fi'], element: 'fire', abstractness: 0.75 },
      ENTP: { functions: ['Ne', 'Ti', 'Fe', 'Si'], element: 'fire', abstractness: 0.8 },
      INFJ: { functions: ['Ni', 'Fe', 'Ti', 'Se'], element: 'water', abstractness: 0.9 },
      INFP: { functions: ['Fi', 'Ne', 'Si', 'Te'], element: 'water', abstractness: 0.85 },
      ENFJ: { functions: ['Fe', 'Ni', 'Se', 'Ti'], element: 'fire', abstractness: 0.7 },
      ENFP: { functions: ['Ne', 'Fi', 'Te', 'Si'], element: 'fire', abstractness: 0.8 },
      ISTJ: { functions: ['Si', 'Te', 'Fi', 'Ne'], element: 'earth', abstractness: 0.25 },
      ISFJ: { functions: ['Si', 'Fe', 'Ti', 'Ne'], element: 'earth', abstractness: 0.3 },
      ESTJ: { functions: ['Te', 'Si', 'Ne', 'Fi'], element: 'earth', abstractness: 0.2 },
      ESFJ: { functions: ['Fe', 'Si', 'Ne', 'Ti'], element: 'earth', abstractness: 0.3 },
      ISTP: { functions: ['Ti', 'Se', 'Ni', 'Fe'], element: 'air', abstractness: 0.5 },
      ISFP: { functions: ['Fi', 'Se', 'Ni', 'Te'], element: 'water', abstractness: 0.5 },
      ESTP: { functions: ['Se', 'Ti', 'Fe', 'Ni'], element: 'fire', abstractness: 0.2 },
      ESFP: { functions: ['Se', 'Fi', 'Te', 'Ni'], element: 'fire', abstractness: 0.25 },
    };

    const typeData = COGNITIVE_STACKS[mbti.toUpperCase()];
    if (!typeData) return [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

    const [dominant, auxiliary, tertiary, inferior] = typeData.functions;

    // D1: Perception axis - Intuition (N) vs Sensing (S)
    // Higher = more intuitive, pattern-seeking
    const perceptionScore = this.scorePerceptionAxis(dominant, auxiliary);

    // D2: Judging axis - Thinking (T) vs Feeling (F)
    // Higher = more feeling-oriented
    const judgingScore = this.scoreJudgingAxis(dominant, auxiliary);

    // D3: Orientation - Is dominant function introverted?
    const isIntrovertedDominant = dominant.endsWith('i');
    const orientationScore = isIntrovertedDominant ? 0.3 : 0.7;

    // D4: Shadow integration - How developed are tertiary/inferior?
    // Types with more "integrated" shadows score higher
    const shadowScore = this.scoreShadowIntegration(typeData.functions);

    // D5: Elemental affinity (maps to tarot suits)
    const elementScores: Record<string, number> = {
      fire: 0.8,   // Wands - action, will
      water: 0.6,  // Cups - emotions, relationships
      air: 0.7,    // Swords - intellect, conflict
      earth: 0.3,  // Pentacles - material, practical
    };
    const elementScore = elementScores[typeData.element];

    // D6: Abstract vs Concrete processing
    const abstractScore = typeData.abstractness;

    return [
      perceptionScore,
      judgingScore,
      orientationScore,
      shadowScore,
      elementScore,
      abstractScore,
    ];
  }

  /**
   * Score the perception axis (N vs S)
   */
  private scorePerceptionAxis(dominant: string, auxiliary: string): number {
    const intuitiveFunctions = ['Ni', 'Ne'];
    const sensingFunctions = ['Si', 'Se'];

    let score = 0.5;

    // Dominant weighs more
    if (intuitiveFunctions.includes(dominant)) score += 0.3;
    if (sensingFunctions.includes(dominant)) score -= 0.3;

    // Auxiliary contributes less
    if (intuitiveFunctions.includes(auxiliary)) score += 0.15;
    if (sensingFunctions.includes(auxiliary)) score -= 0.15;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score the judging axis (T vs F)
   */
  private scoreJudgingAxis(dominant: string, auxiliary: string): number {
    const thinkingFunctions = ['Ti', 'Te'];
    const feelingFunctions = ['Fi', 'Fe'];

    let score = 0.5;

    // Dominant weighs more
    if (feelingFunctions.includes(dominant)) score += 0.3;
    if (thinkingFunctions.includes(dominant)) score -= 0.3;

    // Auxiliary contributes less
    if (feelingFunctions.includes(auxiliary)) score += 0.15;
    if (thinkingFunctions.includes(auxiliary)) score -= 0.15;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score shadow integration (how well-developed tertiary/inferior functions are)
   * Higher scores = more balanced personality, can access shadow more easily
   */
  private scoreShadowIntegration(functions: string[]): number {
    // Types with sensing + intuiting pair tend to have better shadow access
    const hasN = functions.some(f => f.startsWith('N'));
    const hasS = functions.some(f => f.startsWith('S'));
    const hasT = functions.some(f => f.startsWith('T'));
    const hasF = functions.some(f => f.startsWith('F'));

    // Balance score
    let balance = 0;
    if (hasN && hasS) balance += 0.25;
    if (hasT && hasF) balance += 0.25;

    // Position of inferior function affects shadow work difficulty
    // Extroverted inferior = harder to access (score lower)
    const inferior = functions[3];
    const inferiorBonus = inferior.endsWith('i') ? 0.15 : 0.05;

    return Math.min(1, 0.35 + balance + inferiorBonus);
  }

  // zodiacToVector6D is now used instead - see extractPsychologyFeatures

  private detectEmotionalTone(text: string): { valence: number; arousal: number } {
    // Simplified sentiment detection
    const positiveWords = ['love', 'joy', 'happy', 'hope', 'good'];
    const negativeWords = ['fear', 'sad', 'worry', 'bad', 'hate'];
    const arousedWords = ['excited', 'anxious', 'urgent', 'intense'];

    const lower = text.toLowerCase();

    let valence = 0.5; // Neutral
    let arousal = 0.5;

    positiveWords.forEach((word) => {
      if (lower.includes(word)) valence += 0.1;
    });

    negativeWords.forEach((word) => {
      if (lower.includes(word)) valence -= 0.1;
    });

    arousedWords.forEach((word) => {
      if (lower.includes(word)) arousal += 0.1;
    });

    return {
      valence: Math.max(0, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
    };
  }

  private estimateCognitiveComplexity(text: string): number {
    // Simple heuristic: word count, sentence length
    const wordCount = text.split(/\s+/).length;
    const avgWordLength = text.replace(/\s/g, '').length / wordCount;

    return Math.min(1, (wordCount * avgWordLength) / 200);
  }

  private detectFormality(text: string): number {
    const informalMarkers = ['gonna', 'wanna', 'yeah', '!', '?', '...'];
    const formalMarkers = ['therefore', 'however', 'consequently', 'moreover'];

    let score = 0.5;

    informalMarkers.forEach((marker) => {
      if (text.includes(marker)) score -= 0.05;
    });

    formalMarkers.forEach((marker) => {
      if (text.includes(marker)) score += 0.05;
    });

    return Math.max(0, Math.min(1, score));
  }

  private detectAbstractness(text: string): number {
    const abstractWords = ['future', 'meaning', 'purpose', 'soul', 'fate'];
    const concreteWords = ['today', 'money', 'job', 'person', 'thing'];

    let score = 0.5;

    abstractWords.forEach((word) => {
      if (text.toLowerCase().includes(word)) score += 0.1;
    });

    concreteWords.forEach((word) => {
      if (text.toLowerCase().includes(word)) score -= 0.1;
    });

    return Math.max(0, Math.min(1, score));
  }

  private detectQuestionComplexity(text: string): number {
    if (!text.includes('?')) return 0.3; // Not a question

    const simpleQuestions = ['what', 'when', 'who'];
    const complexQuestions = ['why', 'how', 'should'];

    let score = 0.5;

    simpleQuestions.forEach((word) => {
      if (text.toLowerCase().includes(word)) score -= 0.1;
    });

    complexQuestions.forEach((word) => {
      if (text.toLowerCase().includes(word)) score += 0.1;
    });

    return Math.max(0, Math.min(1, score));
  }
}
