/**
 * PSAN Tri-Fork Synthesizer - Patent #504
 * Predictive Scaffold Attention Networks for Multi-Stream Synthesis
 *
 * Processes three parallel data streams with momentum-gated attention:
 * 1. Temporal: Time-series patterns (mood, engagement over time)
 * 2. Symbolic: Discrete tokens (tarot cards, tags, archetypes)
 * 3. Contextual: Dense text (journal entries, chat history)
 *
 * The key innovation is cross-stream attention with momentum gating,
 * which amplifies consistent patterns and filters noise.
 */

import {
  MAJOR_ARCANA,
  SUIT_ELEMENTS,
  ELEMENT_MEANINGS,
  THERAPEUTIC_KEYWORDS,
  STOP_WORDS,
  PATTERN_TYPES,
  DEFAULT_ATTENTION_WEIGHTS
} from './types.js';

/**
 * Tri-Fork Synthesizer
 * Multi-stream data processor for Vera context generation
 */
export class TriForkSynthesizer {
  constructor() {
    // Momentum state for pattern stability
    this.momentumState = {
      alpha: 0.9, // Decay rate
      velocities: {} // Track pattern consistency
    };

    // Attention weights (can be dynamically adjusted)
    this.attentionWeights = { ...DEFAULT_ATTENTION_WEIGHTS };
  }

  /**
   * Main synthesis method - process all three streams
   *
   * @param {Object} input - Tri-fork input data
   * @param {Array} input.temporal - Array of TemporalSignal
   * @param {Array} input.symbolic - Array of SymbolicToken
   * @param {string} input.contextual - Raw text content
   * @returns {Object} Synthesis result with insights and prompt context
   */
  synthesize(input) {
    const { temporal = [], symbolic = [], contextual = '' } = input;

    // 1. Encode each stream
    const temporalEncoding = this.encodeTemporalStream(temporal);
    const symbolicEncoding = this.encodeSymbolicStream(symbolic);
    const contextualEncoding = this.encodeContextualStream(contextual);

    // 2. Cross-attention between streams
    const crossAttention = this.computeCrossAttention(
      temporalEncoding,
      symbolicEncoding,
      contextualEncoding
    );

    // 3. Momentum gating (stabilize consistent patterns)
    const gatedSignal = this.applyMomentumGate(crossAttention);

    // 4. Generate synthesis prompt
    return this.generateSynthesisResult(gatedSignal, input);
  }

  // ═══════════════════════════════════════════════════════════
  // STREAM ENCODERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Encode temporal stream - detect trends and patterns
   *
   * @param {Array} signals - Array of TemporalSignal
   * @returns {Object} Temporal encoding
   */
  encodeTemporalStream(signals) {
    if (!signals || signals.length < 3) {
      return {
        trend: 'insufficient_data',
        volatility: 0,
        dominantActivity: null,
        recentMoodAvg: 0,
        dataPoints: signals?.length || 0
      };
    }

    // Sort by timestamp
    const sorted = [...signals].sort((a, b) => a.timestamp - b.timestamp);

    // Compute mood trend (linear regression slope)
    const moodValues = sorted.map(s => s.moodScore || 0);
    const moodTrend = this.computeTrend(moodValues);

    // Compute volatility (std dev of changes)
    const volatility = this.computeVolatility(moodValues);

    // Find dominant activity
    const activityCounts = sorted.reduce((acc, s) => {
      if (s.activityType) {
        acc[s.activityType] = (acc[s.activityType] || 0) + 1;
      }
      return acc;
    }, {});

    const dominantActivity = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Recent mood average (last 7 signals)
    const recentSignals = sorted.slice(-7);
    const recentMoodAvg = recentSignals.reduce((a, s) => a + (s.moodScore || 0), 0) / recentSignals.length;

    // Engagement trend
    const engagementValues = sorted.map(s => s.engagementScore || 0.5);
    const engagementTrend = this.computeTrend(engagementValues);

    return {
      trend: moodTrend > 0.1 ? 'improving' : moodTrend < -0.1 ? 'declining' : 'stable',
      trendValue: moodTrend,
      volatility,
      dominantActivity,
      recentMoodAvg,
      engagementTrend: engagementTrend > 0.05 ? 'increasing' : engagementTrend < -0.05 ? 'decreasing' : 'stable',
      dataPoints: signals.length
    };
  }

  /**
   * Encode symbolic stream - weight by recency and frequency
   *
   * @param {Array} tokens - Array of SymbolicToken
   * @returns {Object} Symbolic encoding
   */
  encodeSymbolicStream(tokens) {
    if (!tokens || tokens.length === 0) {
      return {
        recurringThemes: [],
        dominantCard: null,
        elementBalance: {},
        tagCloud: [],
        majorArcanaPresence: 0
      };
    }

    // Separate by type
    const cards = tokens.filter(t => t.type === 'card');
    const tags = tokens.filter(t => t.type === 'tag');
    const themes = tokens.filter(t => t.type === 'theme' || t.type === 'archetype');

    // Count all values for recurrence detection
    const valueCounts = tokens.reduce((acc, t) => {
      acc[t.value] = (acc[t.value] || 0) + (t.weight || 1);
      return acc;
    }, {});

    // Find recurring themes (appears multiple times)
    const recurringThemes = Object.entries(valueCounts)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value]) => value);

    // Find dominant card (most recent major arcana)
    const majorCards = cards.filter(c =>
      MAJOR_ARCANA.some(ma => c.value.toLowerCase().includes(ma.toLowerCase()))
    );
    const dominantCard = majorCards[majorCards.length - 1]?.value || null;

    // Element balance
    const elementBalance = { fire: 0, water: 0, air: 0, earth: 0, spirit: 0 };
    cards.forEach(card => {
      // Check suit for minor arcana
      const cardLower = card.value.toLowerCase();
      if (cardLower.includes('wand')) elementBalance.fire += card.weight || 1;
      else if (cardLower.includes('cup')) elementBalance.water += card.weight || 1;
      else if (cardLower.includes('sword')) elementBalance.air += card.weight || 1;
      else if (cardLower.includes('pentacle') || cardLower.includes('coin')) elementBalance.earth += card.weight || 1;
      else elementBalance.spirit += card.weight || 1; // Major arcana
    });

    // Missing elements
    const totalCards = Object.values(elementBalance).reduce((a, b) => a + b, 0);
    const missingElements = Object.entries(elementBalance)
      .filter(([_, count]) => count === 0 && totalCards > 0)
      .map(([element]) => element);

    // Dominant element
    const dominantElement = Object.entries(elementBalance)
      .sort((a, b) => b[1] - a[1])[0];

    // Major arcana presence ratio
    const majorArcanaPresence = cards.length > 0
      ? majorCards.length / cards.length
      : 0;

    return {
      recurringThemes,
      dominantCard,
      elementBalance,
      dominantElement: dominantElement?.[1] > 0 ? dominantElement[0] : null,
      missingElements,
      tagCloud: tags.slice(-20).map(t => t.value),
      majorArcanaPresence,
      totalCards: cards.length
    };
  }

  /**
   * Encode contextual stream - extract themes from text
   *
   * @param {string} text - Raw text content
   * @returns {Object} Contextual encoding
   */
  encodeContextualStream(text) {
    if (!text || text.trim().length === 0) {
      return {
        topKeywords: [],
        sentiment: 0,
        questionCount: 0,
        emotionalTone: 'neutral',
        actionOrientation: 0,
        relationshipFocus: 0,
        textLength: 0
      };
    }

    const words = text.toLowerCase().split(/\s+/);

    // Keyword extraction (exclude stop words)
    const keywordCounts = words.reduce((acc, word) => {
      const clean = word.replace(/[^a-z]/g, '');
      if (clean.length > 3 && !STOP_WORDS.has(clean)) {
        acc[clean] = (acc[clean] || 0) + 1;
      }
      return acc;
    }, {});

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Sentiment analysis
    const positiveCount = words.filter(w =>
      THERAPEUTIC_KEYWORDS.positive.some(k => w.includes(k))
    ).length;
    const negativeCount = words.filter(w =>
      THERAPEUTIC_KEYWORDS.negative.some(k => w.includes(k))
    ).length;

    const totalEmotional = positiveCount + negativeCount;
    const sentiment = totalEmotional > 0
      ? (positiveCount - negativeCount) / totalEmotional
      : 0;

    // Question count (seeking answers indicator)
    const questionCount = (text.match(/\?/g) || []).length;

    // Action orientation
    const actionWords = words.filter(w =>
      THERAPEUTIC_KEYWORDS.action.some(k => w.includes(k))
    ).length;
    const actionOrientation = Math.min(1, actionWords / 10);

    // Relationship focus
    const relationshipWords = words.filter(w =>
      THERAPEUTIC_KEYWORDS.relationship.some(k => w.includes(k))
    ).length;
    const relationshipFocus = Math.min(1, relationshipWords / 8);

    // Emotional tone classification
    let emotionalTone = 'neutral';
    if (sentiment > 0.3) emotionalTone = 'positive';
    else if (sentiment < -0.3) emotionalTone = 'negative';
    else if (positiveCount > 0 && negativeCount > 0) emotionalTone = 'mixed';

    return {
      topKeywords,
      sentiment,
      questionCount,
      emotionalTone,
      actionOrientation,
      relationshipFocus,
      textLength: text.length,
      wordCount: words.length
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CROSS-ATTENTION
  // ═══════════════════════════════════════════════════════════

  /**
   * Compute cross-attention between all three streams
   * Identifies patterns that span multiple data sources
   *
   * @param {Object} temporal - Temporal encoding
   * @param {Object} symbolic - Symbolic encoding
   * @param {Object} contextual - Contextual encoding
   * @returns {Object} Cross-attention result
   */
  computeCrossAttention(temporal, symbolic, contextual) {
    const insights = [];
    const attentionShifts = [];

    // ──────────────────────────────────────────────────────
    // Pattern: TRANSFORMATION
    // Declining mood + Tower/Death + positive sentiment = transformation in progress
    if (temporal.trend === 'declining' &&
        (symbolic.dominantCard?.includes('Tower') || symbolic.dominantCard?.includes('Death')) &&
        contextual.sentiment > 0) {
      insights.push({
        type: PATTERN_TYPES.TRANSFORMATION,
        message: 'Mood decline coincides with transformation cards but positive tone - suggests conscious acceptance of necessary change',
        confidence: 0.8
      });
      attentionShifts.push({ from: 'temporal', to: 'symbolic', strength: 0.8 });
    }

    // ──────────────────────────────────────────────────────
    // Pattern: OVERWHELM
    // High volatility + negative sentiment + many questions
    if (temporal.volatility > 0.4 &&
        contextual.sentiment < -0.2 &&
        contextual.questionCount > 3) {
      insights.push({
        type: PATTERN_TYPES.OVERWHELM,
        message: 'Emotional volatility with negative tone and many questions - overwhelm state, need grounding',
        confidence: 0.75
      });
      attentionShifts.push({ from: 'temporal', to: 'contextual', strength: 0.7 });
    }

    // ──────────────────────────────────────────────────────
    // Pattern: SEEKING_CLARITY
    // Many questions + Swords dominance + stable mood
    if (contextual.questionCount > 2 &&
        symbolic.dominantElement === 'air' &&
        temporal.trend === 'stable') {
      insights.push({
        type: PATTERN_TYPES.SEEKING_CLARITY,
        message: 'Active questioning with mental/analytical focus - seeking intellectual clarity',
        confidence: 0.7
      });
      attentionShifts.push({ from: 'contextual', to: 'symbolic', strength: 0.6 });
    }

    // ──────────────────────────────────────────────────────
    // Pattern: RELATIONSHIP_FOCUS
    // Cups dominance + relationship keywords + emotional tone
    if (symbolic.dominantElement === 'water' &&
        contextual.relationshipFocus > 0.3) {
      insights.push({
        type: PATTERN_TYPES.RELATIONSHIP_FOCUS,
        message: 'Strong focus on relationships and emotional connections',
        confidence: 0.7
      });
      attentionShifts.push({ from: 'symbolic', to: 'contextual', strength: 0.6 });
    }

    // ──────────────────────────────────────────────────────
    // Pattern: GROUNDING_NEEDED
    // No earth element + high volatility + scattered activity
    if (symbolic.missingElements?.includes('earth') &&
        temporal.volatility > 0.3 &&
        !temporal.dominantActivity) {
      insights.push({
        type: PATTERN_TYPES.GROUNDING_NEEDED,
        message: 'Missing practical grounding - volatile patterns with no earth energy',
        confidence: 0.65
      });
      attentionShifts.push({ from: 'symbolic', to: 'temporal', strength: 0.5 });
    }

    // ──────────────────────────────────────────────────────
    // Pattern: BREAKTHROUGH
    // Improving mood + action language + engagement increasing
    if (temporal.trend === 'improving' &&
        contextual.actionOrientation > 0.3 &&
        temporal.engagementTrend === 'increasing') {
      insights.push({
        type: PATTERN_TYPES.BREAKTHROUGH,
        message: 'Positive momentum with action-oriented focus - breakthrough energy',
        confidence: 0.75
      });
      attentionShifts.push({ from: 'temporal', to: 'contextual', strength: 0.7 });
    }

    // ──────────────────────────────────────────────────────
    // Pattern: CREATIVE_SURGE
    // Wands/fire dominance + positive sentiment + engagement up
    if (symbolic.dominantElement === 'fire' &&
        contextual.sentiment > 0.2 &&
        temporal.engagementTrend !== 'decreasing') {
      insights.push({
        type: PATTERN_TYPES.CREATIVE_SURGE,
        message: 'Creative fire energy with positive engagement - channel into projects',
        confidence: 0.65
      });
    }

    // ──────────────────────────────────────────────────────
    // Pattern: RESISTANCE
    // Recurring theme + declining engagement + action avoidance
    if (symbolic.recurringThemes.length > 2 &&
        temporal.engagementTrend === 'decreasing' &&
        contextual.actionOrientation < 0.2) {
      insights.push({
        type: PATTERN_TYPES.RESISTANCE,
        message: 'Recurring themes with declining engagement and avoidance of action - resistance pattern',
        confidence: 0.7
      });
    }

    // Compute dynamic attention weights
    const dynamicWeights = this.computeDynamicWeights(attentionShifts);

    return {
      insights,
      dynamicWeights,
      temporal,
      symbolic,
      contextual,
      attentionShifts
    };
  }

  /**
   * Compute dynamic attention weights based on cross-stream patterns
   */
  computeDynamicWeights(attentionShifts) {
    const weights = { ...this.attentionWeights };

    for (const shift of attentionShifts) {
      weights[shift.to] += shift.strength * 0.1;
      weights[shift.from] -= shift.strength * 0.05;
    }

    // Normalize to sum to 1
    const sum = weights.temporal + weights.symbolic + weights.contextual;
    weights.temporal /= sum;
    weights.symbolic /= sum;
    weights.contextual /= sum;

    return weights;
  }

  // ═══════════════════════════════════════════════════════════
  // MOMENTUM GATING
  // ═══════════════════════════════════════════════════════════

  /**
   * Apply momentum gating to stabilize patterns
   * Consistent patterns are amplified, noise is filtered
   *
   * @param {Object} attention - Cross-attention result
   * @returns {Object} Gated signal
   */
  applyMomentumGate(attention) {
    const { alpha } = this.momentumState;

    // Update velocity for each insight type
    for (const insight of attention.insights) {
      const key = insight.type;
      const prevVelocity = this.momentumState.velocities[key] || 0;
      // Exponential moving average
      this.momentumState.velocities[key] = alpha * prevVelocity + (1 - alpha) * insight.confidence;
    }

    // Filter insights by momentum threshold
    const gatedInsights = attention.insights.filter(insight => {
      const velocity = this.momentumState.velocities[insight.type] || 0;
      return velocity > 0.25; // Threshold: must have some consistency
    });

    // Decay velocities for absent patterns
    for (const key of Object.keys(this.momentumState.velocities)) {
      if (!attention.insights.some(i => i.type === key)) {
        this.momentumState.velocities[key] *= 0.85; // Decay
      }
    }

    // Confidence is ratio of gated to total
    const confidence = attention.insights.length > 0
      ? gatedInsights.length / attention.insights.length
      : 0;

    return {
      insights: gatedInsights,
      confidence,
      weights: attention.dynamicWeights,
      rawAttention: attention,
      momentumState: { ...this.momentumState.velocities }
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SYNTHESIS OUTPUT
  // ═══════════════════════════════════════════════════════════

  /**
   * Generate final synthesis result for Vera prompt
   *
   * @param {Object} signal - Gated signal
   * @param {Object} input - Original input
   * @returns {Object} Synthesis result
   */
  generateSynthesisResult(signal, input) {
    const { temporal, symbolic, contextual } = signal.rawAttention;

    // Build synthesis prompt
    let prompt = `## ORACLE CONTEXT (PSAN Synthesis)\n\n`;

    // Temporal summary
    if (temporal.dataPoints > 0) {
      prompt += `### Temporal Patterns\n`;
      prompt += `- Mood Trend: ${temporal.trend}`;
      if (temporal.trendValue) prompt += ` (${temporal.trendValue > 0 ? '+' : ''}${(temporal.trendValue * 100).toFixed(0)}%)`;
      prompt += `\n`;
      prompt += `- Emotional Stability: ${temporal.volatility > 0.4 ? 'volatile' : temporal.volatility > 0.2 ? 'moderate' : 'stable'}\n`;
      if (temporal.dominantActivity) {
        prompt += `- Primary Activity: ${temporal.dominantActivity}\n`;
      }
      prompt += `- Recent Mood: ${temporal.recentMoodAvg > 0.3 ? 'positive' : temporal.recentMoodAvg < -0.3 ? 'low' : 'neutral'}\n\n`;
    }

    // Symbolic summary
    if (symbolic.totalCards > 0 || symbolic.recurringThemes.length > 0) {
      prompt += `### Symbolic Patterns\n`;
      if (symbolic.recurringThemes.length > 0) {
        prompt += `- Recurring Themes: ${symbolic.recurringThemes.join(', ')}\n`;
      }
      if (symbolic.dominantCard) {
        prompt += `- Dominant Card: ${symbolic.dominantCard}\n`;
      }
      if (symbolic.dominantElement) {
        const elementInfo = ELEMENT_MEANINGS[symbolic.dominantElement];
        prompt += `- Dominant Element: ${symbolic.dominantElement} (${elementInfo?.theme || 'various'})\n`;
      }
      if (symbolic.missingElements.length > 0) {
        prompt += `- Blind Spots: Missing ${symbolic.missingElements.join(', ')} energy\n`;
      }
      prompt += `\n`;
    }

    // Contextual summary
    if (contextual.textLength > 0) {
      prompt += `### Contextual Analysis\n`;
      if (contextual.topKeywords.length > 0) {
        prompt += `- Key Themes: ${contextual.topKeywords.slice(0, 5).join(', ')}\n`;
      }
      prompt += `- Emotional Tone: ${contextual.emotionalTone}\n`;
      if (contextual.questionCount > 2) {
        prompt += `- Seeking Answers: High question density (${contextual.questionCount} questions)\n`;
      }
      if (contextual.actionOrientation > 0.3) {
        prompt += `- Action-Oriented: Ready for guidance on next steps\n`;
      }
      if (contextual.relationshipFocus > 0.3) {
        prompt += `- Relationship Focus: Primary concern involves others\n`;
      }
      prompt += `\n`;
    }

    // Cross-stream insights (the magic)
    if (signal.insights.length > 0) {
      prompt += `### Synthesized Insights (Cross-Stream)\n`;
      for (const insight of signal.insights) {
        prompt += `- **${insight.type.replace(/_/g, ' ').toUpperCase()}**: ${insight.message}\n`;
      }
      prompt += `\n`;
    }

    // Attention weighting guidance
    prompt += `### Response Weighting\n`;
    prompt += `Prioritize attention (based on pattern strength):\n`;
    prompt += `- Emotional journey over time: ${Math.round(signal.weights.temporal * 100)}%\n`;
    prompt += `- Tarot symbolism and archetypes: ${Math.round(signal.weights.symbolic * 100)}%\n`;
    prompt += `- Explicit statements and questions: ${Math.round(signal.weights.contextual * 100)}%\n`;

    return {
      synthesisPrompt: prompt,
      confidence: signal.confidence,
      dominantStream: this.getDominantStream(signal.weights),
      insights: signal.insights.map(i => ({ type: i.type, message: i.message })),
      encodings: {
        temporal,
        symbolic,
        contextual
      }
    };
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Compute linear trend (simple linear regression slope)
   */
  computeTrend(values) {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((acc, y, x) => acc + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
  }

  /**
   * Compute volatility (standard deviation of changes)
   */
  computeVolatility(values) {
    if (values.length < 2) return 0;

    const changes = values.slice(1).map((v, i) => Math.abs(v - values[i]));
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((acc, c) => acc + (c - mean) ** 2, 0) / changes.length;

    return Math.sqrt(variance);
  }

  /**
   * Get dominant stream based on weights
   */
  getDominantStream(weights) {
    if (weights.temporal >= weights.symbolic && weights.temporal >= weights.contextual) {
      return 'temporal';
    }
    if (weights.symbolic >= weights.contextual) {
      return 'symbolic';
    }
    return 'contextual';
  }

  /**
   * Reset momentum state (start fresh pattern detection)
   */
  resetMomentum() {
    this.momentumState.velocities = {};
  }
}

/**
 * Factory function to create synthesizer
 */
export function createTriForkSynthesizer() {
  return new TriForkSynthesizer();
}

export default TriForkSynthesizer;
