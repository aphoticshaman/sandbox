/**
 * SOLOMONOFF-CASIMIR COMPRESSION ENGINE
 * ======================================
 *
 * Implements universal induction for interpretation selection:
 *
 * Core Theoretical Foundations:
 *
 * 1. SOLOMONOFF PRIOR
 *    P(interpretation) ∝ 2^{-K(interpretation)}
 *    where K is Kolmogorov complexity (approximated via compression)
 *
 * 2. CASIMIR VACUUM MODEL
 *    The phenomenological "floor" of user resistance:
 *    - Compressed traces of rejected/skipped interpretations
 *    - Zero-point energy E_0 from accumulated resistance
 *    - Future readings must compress deeper than this floor
 *
 * 3. AIXI-LIKE OPTIMIZATION
 *    π*(h) = argmax_a Σ_o [r(h,a,o) + γ·V(hao)] · P(o|h,a)
 *    where P(o|h,a) = Σ_q 2^{-K(q)} · q(o|h,a)
 *
 * This is the first consumer implementation of universal prediction
 * applied to human-AI dialogue for introspective insight.
 *
 * References:
 * - Solomonoff (1964), A Formal Theory of Inductive Inference
 * - Hutter (2004), Universal Artificial Intelligence (AIXI)
 * - Benzi et al. (1981), Stochastic resonance
 * - Li & Vitányi (2008), An Introduction to Kolmogorov Complexity
 *
 * @author VeilPath - Palantir for the Soul
 */

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

/**
 * Compressed trace of an interpretation/reading
 */
export interface CompressedTrace {
  id: string;
  timestamp: number;
  originalLength: number;
  compressedLength: number;
  compressionRatio: number;
  kolmogorovEstimate: number; // -log2(compressionRatio)
  content: string;
  metadata: {
    readingId?: string;
    accepted: boolean;
    resonanceScore?: number;
    mood?: string;
  };
}

/**
 * Casimir vacuum state - the phenomenological floor
 */
export interface CasimirVacuumState {
  zeroPointEnergy: number; // E_0 - baseline compression threshold
  resistanceAccumulator: number; // Sum of rejected trace complexities
  acceptanceAccumulator: number; // Sum of accepted trace complexities
  traceCount: number;
  averageComplexity: number;
  lastUpdated: number;
}

/**
 * Interpretation candidate for AIXI selection
 */
export interface InterpretationCandidate {
  id: string;
  text: string;
  compressedLength?: number;
  prior?: number; // Solomonoff prior 2^{-K}
  resonanceEstimate?: number;
  score?: number; // Final AIXI score
}

/**
 * AIXI action result
 */
export interface AIXIResult {
  selectedInterpretation: InterpretationCandidate;
  alternatives: InterpretationCandidate[];
  vacuumState: CasimirVacuumState;
  provenance: {
    method: string;
    priorWeight: number;
    resonanceWeight: number;
    vacuumAdjustment: number;
  };
}

// ═══════════════════════════════════════════════════════════
// COMPRESSION UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Simple LZ-based compression approximation
 * In production, use pako/brotli for true compression
 */
function estimateCompressedLength(text: string): number {
  if (!text || text.length === 0) return 0;

  // LZ77-like sliding window compression estimate
  const seen = new Map<string, number>();
  let compressedBits = 0;
  const windowSize = 32;

  for (let i = 0; i < text.length; i++) {
    // Try to find longest match
    let matchLength = 0;
    let matchPos = 0;

    for (let len = Math.min(windowSize, text.length - i); len > 0; len--) {
      const substr = text.substring(i, i + len);
      if (seen.has(substr)) {
        matchLength = len;
        matchPos = seen.get(substr)!;
        break;
      }
    }

    if (matchLength >= 3) {
      // Encode as (offset, length) - approximately log2(windowSize) + log2(maxLength) bits
      compressedBits += Math.log2(windowSize) + Math.log2(matchLength);
      i += matchLength - 1;
    } else {
      // Literal byte
      compressedBits += 8;
    }

    // Update seen dictionary
    for (let len = 1; len <= Math.min(windowSize, text.length - i); len++) {
      seen.set(text.substring(i, i + len), i);
    }
  }

  return Math.ceil(compressedBits / 8);
}

/**
 * Calculate Kolmogorov complexity estimate
 * K(x) ≈ |compress(x)|
 */
function estimateKolmogorov(text: string): number {
  const originalLength = text.length;
  const compressedLength = estimateCompressedLength(text);
  const ratio = compressedLength / Math.max(originalLength, 1);

  // Return in bits (log2 scale)
  return compressedLength * 8;
}

/**
 * Calculate Solomonoff prior
 * P(x) ∝ 2^{-K(x)}
 */
function solomonoffPrior(text: string): number {
  const k = estimateKolmogorov(text);
  // Normalize to avoid underflow for long strings
  // Use log-space: log2(P) = -K
  const logPrior = -k / 1000; // Scale down for numerical stability
  return Math.pow(2, logPrior);
}

// ═══════════════════════════════════════════════════════════
// SOLOMONOFF-CASIMIR ENGINE
// ═══════════════════════════════════════════════════════════

export class SolomonoffCasimirEngine {
  private vacuumState: CasimirVacuumState;
  private traces: CompressedTrace[] = [];
  private readonly maxTraces = 1000;

  constructor(initialVacuumState?: CasimirVacuumState) {
    this.vacuumState = initialVacuumState || {
      zeroPointEnergy: 0.5,
      resistanceAccumulator: 0,
      acceptanceAccumulator: 0,
      traceCount: 0,
      averageComplexity: 0,
      lastUpdated: Date.now(),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // TRACE MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Add a trace to the Casimir vacuum
   * Updates the phenomenological floor based on user response
   */
  addTrace(
    content: string,
    accepted: boolean,
    metadata: Partial<CompressedTrace['metadata']> = {}
  ): CompressedTrace {
    const originalLength = content.length;
    const compressedLength = estimateCompressedLength(content);
    const compressionRatio = compressedLength / Math.max(originalLength, 1);
    const kolmogorovEstimate = estimateKolmogorov(content);

    const trace: CompressedTrace = {
      id: `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      originalLength,
      compressedLength,
      compressionRatio,
      kolmogorovEstimate,
      content: content.substring(0, 200), // Store preview only
      metadata: {
        ...metadata,
        accepted,
      },
    };

    this.traces.push(trace);

    // Trim old traces
    if (this.traces.length > this.maxTraces) {
      this.traces = this.traces.slice(-this.maxTraces);
    }

    // Update vacuum state
    this.updateVacuumState(trace);

    return trace;
  }

  /**
   * Update Casimir vacuum based on new trace
   */
  private updateVacuumState(trace: CompressedTrace): void {
    const complexity = trace.kolmogorovEstimate;

    if (trace.metadata.accepted) {
      this.vacuumState.acceptanceAccumulator += complexity;
    } else {
      this.vacuumState.resistanceAccumulator += complexity;
    }

    this.vacuumState.traceCount++;
    this.vacuumState.averageComplexity =
      (this.vacuumState.acceptanceAccumulator + this.vacuumState.resistanceAccumulator) /
      this.vacuumState.traceCount;

    // Zero-point energy: threshold below which interpretations are likely rejected
    // Higher resistance → higher floor → need more compressed (simpler, truer) interpretations
    const resistanceRatio =
      this.vacuumState.resistanceAccumulator /
      (this.vacuumState.acceptanceAccumulator + this.vacuumState.resistanceAccumulator + 1);

    this.vacuumState.zeroPointEnergy =
      this.vacuumState.averageComplexity * (0.5 + resistanceRatio * 0.5);

    this.vacuumState.lastUpdated = Date.now();
  }

  // ═══════════════════════════════════════════════════════════
  // AIXI SELECTION
  // ═══════════════════════════════════════════════════════════

  /**
   * AIXI-like selection of optimal interpretation
   *
   * π*(h) = argmax_a Σ_o [r(h,a,o) + γ·V(hao)] · P(o|h,a)
   *
   * Simplified to:
   * score = prior × resonance × vacuumBonus
   */
  selectInterpretation(
    candidates: InterpretationCandidate[],
    userContext?: {
      recentMood?: string;
      preferredComplexity?: 'simple' | 'moderate' | 'deep';
      sessionDepth?: number;
    }
  ): AIXIResult {
    if (candidates.length === 0) {
      throw new Error('No candidates provided for AIXI selection');
    }

    // Calculate scores for all candidates
    const scored = candidates.map((candidate) => {
      // 1. Solomonoff prior (simpler = higher prior)
      const prior = solomonoffPrior(candidate.text);

      // 2. Compression analysis
      const compressedLength = estimateCompressedLength(candidate.text);
      const complexity = estimateKolmogorov(candidate.text);

      // 3. Vacuum adjustment (must beat zero-point energy)
      const belowVacuum = complexity < this.vacuumState.zeroPointEnergy;
      const vacuumBonus = belowVacuum
        ? 1 + (this.vacuumState.zeroPointEnergy - complexity) / this.vacuumState.zeroPointEnergy
        : 0.5;

      // 4. Resonance estimate (from user context if available)
      let resonanceEstimate = candidate.resonanceEstimate || 0.5;
      if (userContext?.preferredComplexity) {
        const textComplexity = complexity / 1000;
        const targetComplexity = {
          simple: 0.3,
          moderate: 0.5,
          deep: 0.8,
        }[userContext.preferredComplexity];

        // Bonus for matching preferred complexity
        resonanceEstimate += 0.2 * (1 - Math.abs(textComplexity - targetComplexity));
      }

      // 5. AIXI score: combine prior, resonance, and vacuum
      const score = prior * resonanceEstimate * vacuumBonus;

      return {
        ...candidate,
        compressedLength,
        prior,
        resonanceEstimate,
        score,
      };
    });

    // Sort by score (descending)
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));

    const selected = scored[0];
    const alternatives = scored.slice(1);

    return {
      selectedInterpretation: selected,
      alternatives,
      vacuumState: { ...this.vacuumState },
      provenance: {
        method: 'AIXI-Solomonoff-Casimir',
        priorWeight: selected.prior || 0,
        resonanceWeight: selected.resonanceEstimate || 0,
        vacuumAdjustment:
          (selected.score || 0) / ((selected.prior || 1) * (selected.resonanceEstimate || 1)),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SIMILARITY DETECTION
  // ═══════════════════════════════════════════════════════════

  /**
   * Normalized Compression Distance (NCD)
   * NCD(x,y) = (K(x|y) - min(K(x), K(y))) / max(K(x), K(y))
   *
   * Approximated using compression:
   * NCD(x,y) ≈ (C(xy) - min(C(x), C(y))) / max(C(x), C(y))
   */
  normalizedCompressionDistance(text1: string, text2: string): number {
    const c1 = estimateCompressedLength(text1);
    const c2 = estimateCompressedLength(text2);
    const c12 = estimateCompressedLength(text1 + text2);

    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);

    if (maxC === 0) return 0;

    return (c12 - minC) / maxC;
  }

  /**
   * Find similar traces in history
   */
  findSimilarTraces(text: string, topK = 5): CompressedTrace[] {
    const distances = this.traces.map((trace) => ({
      trace,
      distance: this.normalizedCompressionDistance(text, trace.content),
    }));

    distances.sort((a, b) => a.distance - b.distance);

    return distances.slice(0, topK).map((d) => d.trace);
  }

  /**
   * Calculate interpretation redundancy
   * How much new information does this interpretation add?
   */
  calculateRedundancy(text: string): number {
    if (this.traces.length === 0) return 0;

    // Compress text against concatenated history
    const historyPreview = this.traces.slice(-10).map((t) => t.content).join(' ');
    const solo = estimateCompressedLength(text);
    const combined = estimateCompressedLength(historyPreview + ' ' + text);

    // Redundancy: how little the combined adds over history alone
    const historyLength = estimateCompressedLength(historyPreview);
    const increment = combined - historyLength;

    return 1 - increment / Math.max(solo, 1);
  }

  // ═══════════════════════════════════════════════════════════
  // PATTERN SIGNIFICANCE
  // ═══════════════════════════════════════════════════════════

  /**
   * K×f multiplicative pruning significance
   *
   * A pattern is significant if:
   * K(pattern) × frequency > threshold
   *
   * This balances complexity against recurrence.
   */
  calculatePatternSignificance(
    pattern: string,
    frequency: number,
    threshold = 100
  ): { significant: boolean; score: number } {
    const k = estimateKolmogorov(pattern);
    const score = k * frequency;

    return {
      significant: score > threshold,
      score,
    };
  }

  /**
   * Extract significant patterns from trace history
   */
  extractSignificantPatterns(minFrequency = 2): Array<{
    pattern: string;
    frequency: number;
    significance: number;
  }> {
    // Build n-gram frequency map
    const ngrams = new Map<string, number>();
    const ngramLengths = [3, 4, 5, 6, 7, 8];

    this.traces.forEach((trace) => {
      const text = trace.content.toLowerCase();
      ngramLengths.forEach((n) => {
        for (let i = 0; i <= text.length - n; i++) {
          const ngram = text.substring(i, i + n);
          ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1);
        }
      });
    });

    // Filter by frequency and calculate significance
    const patterns: Array<{
      pattern: string;
      frequency: number;
      significance: number;
    }> = [];

    ngrams.forEach((freq, ngram) => {
      if (freq >= minFrequency) {
        const { significant, score } = this.calculatePatternSignificance(ngram, freq);
        if (significant) {
          patterns.push({
            pattern: ngram,
            frequency: freq,
            significance: score,
          });
        }
      }
    });

    // Sort by significance
    patterns.sort((a, b) => b.significance - a.significance);

    return patterns.slice(0, 20);
  }

  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  getVacuumState(): CasimirVacuumState {
    return { ...this.vacuumState };
  }

  getTraces(): CompressedTrace[] {
    return [...this.traces];
  }

  getStatistics(): {
    totalTraces: number;
    acceptedTraces: number;
    rejectedTraces: number;
    averageComplexity: number;
    zeroPointEnergy: number;
  } {
    const accepted = this.traces.filter((t) => t.metadata.accepted).length;
    const rejected = this.traces.filter((t) => !t.metadata.accepted).length;

    return {
      totalTraces: this.traces.length,
      acceptedTraces: accepted,
      rejectedTraces: rejected,
      averageComplexity: this.vacuumState.averageComplexity,
      zeroPointEnergy: this.vacuumState.zeroPointEnergy,
    };
  }

  /**
   * Export state for persistence
   */
  exportState(): { vacuumState: CasimirVacuumState; traces: CompressedTrace[] } {
    return {
      vacuumState: this.getVacuumState(),
      traces: this.getTraces(),
    };
  }

  /**
   * Import state from persistence
   */
  importState(state: { vacuumState: CasimirVacuumState; traces: CompressedTrace[] }): void {
    this.vacuumState = { ...state.vacuumState };
    this.traces = [...state.traces];
  }

  /**
   * Reset vacuum state (clear resistance)
   */
  resetVacuum(): void {
    this.vacuumState = {
      zeroPointEnergy: 0.5,
      resistanceAccumulator: 0,
      acceptanceAccumulator: 0,
      traceCount: 0,
      averageComplexity: 0,
      lastUpdated: Date.now(),
    };
    this.traces = [];
  }
}

// ═══════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════

/**
 * Quick compression distance calculation
 */
export function compressionDistance(text1: string, text2: string): number {
  const engine = new SolomonoffCasimirEngine();
  return engine.normalizedCompressionDistance(text1, text2);
}

/**
 * Quick Solomonoff prior calculation
 */
export function getSolomonoffPrior(text: string): number {
  return solomonoffPrior(text);
}

/**
 * Quick Kolmogorov estimate
 */
export function getKolmogorovEstimate(text: string): number {
  return estimateKolmogorov(text);
}

/**
 * Create singleton engine instance
 */
let globalEngine: SolomonoffCasimirEngine | null = null;

export function getGlobalEngine(): SolomonoffCasimirEngine {
  if (!globalEngine) {
    globalEngine = new SolomonoffCasimirEngine();
  }
  return globalEngine;
}
