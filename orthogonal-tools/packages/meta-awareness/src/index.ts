/**
 * Meta-Awareness Engine
 * Tracks, measures, and adapts to player consciousness states
 *
 * This is the brain of Orthogonal - understanding what level
 * of awareness the player is operating at and responding accordingly.
 */

// ============================================================================
// Core Types
// ============================================================================

export interface MetaState {
  // Current awareness levels (0-1 each)
  levels: {
    immersed: number;     // Lost in experience (level 0)
    aware: number;        // Noticing experience (level 1)
    metaAware: number;    // Noticing noticing (level 2)
    multiLevel: number;   // Holding multiple simultaneously (level 3)
    fluid: number;        // Moving freely between levels (level 4)
  };

  // Computed meta-awareness score (0-4 scale)
  metaLevel: number;

  // Witness mode metrics
  witness: {
    totalTime: number;           // Total time in witness mode
    currentActivation: number;   // Current witness depth (0-1)
    timingAccuracy: number;      // How well-timed are witness moments
    utilityScore: number;        // Are witnesses productive?
  };

  // Question tolerance
  questions: {
    held: Question[];            // Currently unresolved questions
    anxietyLevel: number;        // How much they revisit without resolving
    maxSimultaneous: number;     // Most questions held at once
    resolutionRate: number;      // How many get resolved vs abandoned
  };

  // Paradox handling
  paradox: {
    encountered: number;         // Total paradoxes encountered
    resolved: number;            // Successfully held/resolved
    tolerance: number;           // Computed tolerance (0-1)
    interferenceTime: number;    // Time spent in interference zones
  };

  // Scale awareness (tree → forest → galaxy)
  scale: {
    currentLevel: string;        // Current scale of attention
    transitions: number;         // How many scale shifts
    fluidityScore: number;       // How smooth are transitions
    deepestReached: string;      // Deepest scale explored
  };

  // Flow state
  flow: {
    currentDepth: number;        // Current flow depth (0-1)
    averageDepth: number;        // Session average
    sustainedPeriods: number;    // Times flow > 0.7 for 5+ min
    flowWithMeta: number;        // Times in flow AND meta-aware
  };

  // Session stats
  session: {
    duration: number;            // Current session length
    dimensions: DimensionVisit[];
    insights: Insight[];
    fragmentsWitnessed: string[];
  };

  // Long-term evolution
  lifetime: {
    totalPlaytime: number;
    sessionsPlayed: number;
    peakMetaLevel: number;
    eliteEligible: boolean;
    contributionScore: number;   // For distributed compute
  };
}

export interface Question {
  id: string;
  text: string;
  source: string;             // Where it emerged
  timestamp: number;
  revisitCount: number;       // How many times checked without resolving
  anxietyIndicators: number;  // Signs of discomfort
  resolved: boolean;
  resolutionMethod?: 'answered' | 'transcended' | 'abandoned';
}

export interface Insight {
  id: string;
  category: 'logical' | 'perceptual' | 'metacognitive' | 'relational' | 'integrative';
  description: string;
  timestamp: number;
  dimension: string;
  metaLevelWhenGained: number;
}

export interface DimensionVisit {
  dimension: string;
  enteredAt: number;
  duration: number;
  metaLevelAverage: number;
  puzzlesSolved: number;
  witnessEvents: number;
}

// ============================================================================
// Engine Configuration
// ============================================================================

export interface MetaEngineConfig {
  // How quickly witness activation rises/falls
  witnessActivationRate: number;
  witnessDecayRate: number;

  // Question anxiety thresholds
  anxietyRevisitThreshold: number;
  maxQuestionsBeforeOverload: number;

  // Flow detection parameters
  flowThreshold: number;
  flowSustainedDuration: number;

  // Meta-level calculation weights
  levelWeights: {
    witnessUtility: number;
    questionTolerance: number;
    paradoxHandling: number;
    scaleAwareness: number;
    flowWithMeta: number;
  };

  // Elite mode thresholds
  eliteMetaLevel: number;
  eliteMinHours: number;
}

const DEFAULT_CONFIG: MetaEngineConfig = {
  witnessActivationRate: 0.02,
  witnessDecayRate: 0.05,
  anxietyRevisitThreshold: 3,
  maxQuestionsBeforeOverload: 7,
  flowThreshold: 0.7,
  flowSustainedDuration: 300000, // 5 minutes
  levelWeights: {
    witnessUtility: 0.25,
    questionTolerance: 0.2,
    paradoxHandling: 0.2,
    scaleAwareness: 0.15,
    flowWithMeta: 0.2,
  },
  eliteMetaLevel: 3.5,
  eliteMinHours: 100,
};

// ============================================================================
// Meta-Awareness Engine
// ============================================================================

export class MetaAwarenessEngine {
  private state: MetaState;
  private config: MetaEngineConfig;
  private listeners: Map<string, ((state: MetaState) => void)[]> = new Map();
  private lastUpdate: number = Date.now();

  constructor(config: Partial<MetaEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.initializeState();
  }

  private initializeState(): MetaState {
    return {
      levels: {
        immersed: 1.0,
        aware: 0.0,
        metaAware: 0.0,
        multiLevel: 0.0,
        fluid: 0.0,
      },
      metaLevel: 0,
      witness: {
        totalTime: 0,
        currentActivation: 0,
        timingAccuracy: 0.5,
        utilityScore: 0.5,
      },
      questions: {
        held: [],
        anxietyLevel: 0,
        maxSimultaneous: 0,
        resolutionRate: 0,
      },
      paradox: {
        encountered: 0,
        resolved: 0,
        tolerance: 0,
        interferenceTime: 0,
      },
      scale: {
        currentLevel: 'local',
        transitions: 0,
        fluidityScore: 0,
        deepestReached: 'local',
      },
      flow: {
        currentDepth: 0,
        averageDepth: 0,
        sustainedPeriods: 0,
        flowWithMeta: 0,
      },
      session: {
        duration: 0,
        dimensions: [],
        insights: [],
        fragmentsWitnessed: [],
      },
      lifetime: {
        totalPlaytime: 0,
        sessionsPlayed: 0,
        peakMetaLevel: 0,
        eliteEligible: false,
        contributionScore: 0,
      },
    };
  }

  // ========================================================================
  // Core Updates
  // ========================================================================

  update(deltaMs: number): void {
    const now = Date.now();
    const delta = deltaMs / 1000; // Convert to seconds

    // Update session duration
    this.state.session.duration += deltaMs;

    // Decay witness activation if not actively witnessing
    if (this.state.witness.currentActivation > 0) {
      this.state.witness.currentActivation = Math.max(
        0,
        this.state.witness.currentActivation - this.config.witnessDecayRate * delta
      );
    }

    // Update flow metrics
    this.updateFlowState(delta);

    // Recalculate meta-level
    this.recalculateMetaLevel();

    // Check elite eligibility
    this.checkEliteEligibility();

    // Emit update
    this.emit('update', this.state);

    this.lastUpdate = now;
  }

  // ========================================================================
  // Witness Mode
  // ========================================================================

  engageWitness(active: boolean): void {
    if (active) {
      this.state.witness.currentActivation = Math.min(
        1,
        this.state.witness.currentActivation + this.config.witnessActivationRate
      );
    }
  }

  onWitness(target: { id: string; type: string }, duration: number): void {
    this.state.witness.totalTime += duration;

    // Evaluate if this was a useful witness moment
    const utility = this.evaluateWitnessUtility(target);

    // Update timing accuracy (exponential moving average)
    this.state.witness.timingAccuracy =
      this.state.witness.timingAccuracy * 0.9 + (utility ? 1 : 0) * 0.1;

    // Update utility score
    this.state.witness.utilityScore =
      this.state.witness.utilityScore * 0.95 + (utility ? 1 : 0) * 0.05;

    // Update awareness levels based on witnessing pattern
    this.updateAwarenessLevels('witness', utility);

    this.emit('witness', { target, duration, utility });
  }

  private evaluateWitnessUtility(target: { id: string; type: string }): boolean {
    // Heuristics for useful witnessing:
    // - Witnessed something that wasn't fully explored
    // - Witnessed at a decision point
    // - Witnessed revealed hidden structure
    // For now, simplified: any witness has 70% chance of being useful
    // (In real implementation, this would check game state)
    return Math.random() < 0.7;
  }

  // ========================================================================
  // Question Management
  // ========================================================================

  surfaceQuestion(question: Omit<Question, 'id' | 'timestamp' | 'revisitCount' | 'anxietyIndicators' | 'resolved'>): void {
    const newQuestion: Question = {
      ...question,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      revisitCount: 0,
      anxietyIndicators: 0,
      resolved: false,
    };

    this.state.questions.held.push(newQuestion);

    // Update max simultaneous
    if (this.state.questions.held.length > this.state.questions.maxSimultaneous) {
      this.state.questions.maxSimultaneous = this.state.questions.held.length;
    }

    // Check for overload
    if (this.state.questions.held.length > this.config.maxQuestionsBeforeOverload) {
      this.emit('questionOverload', { count: this.state.questions.held.length });
    }

    this.emit('questionSurfaced', newQuestion);
  }

  revisitQuestion(questionId: string): void {
    const question = this.state.questions.held.find(q => q.id === questionId);
    if (!question) return;

    question.revisitCount++;

    // Check for anxiety
    if (question.revisitCount >= this.config.anxietyRevisitThreshold) {
      question.anxietyIndicators++;
      this.state.questions.anxietyLevel =
        this.state.questions.held.reduce((sum, q) => sum + q.anxietyIndicators, 0) /
        this.state.questions.held.length;

      this.emit('questionAnxiety', question);
    }
  }

  resolveQuestion(questionId: string, method: 'answered' | 'transcended' | 'abandoned'): void {
    const index = this.state.questions.held.findIndex(q => q.id === questionId);
    if (index === -1) return;

    const question = this.state.questions.held[index];
    question.resolved = true;
    question.resolutionMethod = method;

    // Remove from held
    this.state.questions.held.splice(index, 1);

    // Update resolution rate
    // 'transcended' counts as best resolution
    // 'answered' is good
    // 'abandoned' is neutral (not bad, sometimes necessary)
    const resolutionQuality = method === 'transcended' ? 1.0 : method === 'answered' ? 0.7 : 0.3;
    this.state.questions.resolutionRate =
      this.state.questions.resolutionRate * 0.9 + resolutionQuality * 0.1;

    // Transcending a question improves meta-awareness
    if (method === 'transcended') {
      this.updateAwarenessLevels('transcendence', true);
    }

    this.emit('questionResolved', { question, method });
  }

  // ========================================================================
  // Paradox Handling
  // ========================================================================

  onParadoxEncountered(paradoxId: string): void {
    this.state.paradox.encountered++;
    this.emit('paradoxEncountered', paradoxId);
  }

  onParadoxResolved(paradoxId: string, held: boolean): void {
    if (held) {
      this.state.paradox.resolved++;
      this.state.paradox.tolerance = Math.min(
        1,
        this.state.paradox.tolerance + 0.1
      );
      this.updateAwarenessLevels('paradoxHold', true);
    } else {
      // Escaped rather than held - slight tolerance decrease
      this.state.paradox.tolerance = Math.max(
        0,
        this.state.paradox.tolerance - 0.02
      );
    }

    this.emit('paradoxResolved', { paradoxId, held });
  }

  onInterferenceZone(entering: boolean, duration?: number): void {
    if (entering) {
      this.emit('interferenceEnter', null);
    } else if (duration) {
      this.state.paradox.interferenceTime += duration;
      this.emit('interferenceExit', { duration });
    }
  }

  // ========================================================================
  // Scale Awareness
  // ========================================================================

  onScaleShift(from: string, to: string): void {
    this.state.scale.transitions++;
    this.state.scale.currentLevel = to;

    // Track deepest reached
    const scaleDepths: Record<string, number> = {
      'local': 0,
      'glade': 1,
      'forest': 2,
      'region': 3,
      'world': 4,
      'solar': 5,
      'galactic': 6,
      'cosmic': 7,
      'beyond': 8,
    };

    if ((scaleDepths[to] || 0) > (scaleDepths[this.state.scale.deepestReached] || 0)) {
      this.state.scale.deepestReached = to;
    }

    // Calculate fluidity (smooth transitions vs jarring jumps)
    const jump = Math.abs((scaleDepths[to] || 0) - (scaleDepths[from] || 0));
    const smooth = jump <= 1;
    this.state.scale.fluidityScore =
      this.state.scale.fluidityScore * 0.9 + (smooth ? 1 : 0) * 0.1;

    this.emit('scaleShift', { from, to, smooth });
  }

  // ========================================================================
  // Flow State
  // ========================================================================

  private updateFlowState(delta: number): void {
    // Flow is measured by:
    // - Consistent progress without frustration pauses
    // - Witness mode usage (engaged but not over-analyzing)
    // - Question tolerance (not anxious)

    const witnessBalance = 1 - Math.abs(this.state.witness.currentActivation - 0.3) * 2;
    const questionCalm = 1 - this.state.questions.anxietyLevel;
    const progressHeuristic = 0.7; // Placeholder - would measure actual progress

    const targetFlow = (witnessBalance + questionCalm + progressHeuristic) / 3;

    // Smooth transition to target
    this.state.flow.currentDepth +=
      (targetFlow - this.state.flow.currentDepth) * delta * 0.5;

    // Update average
    this.state.flow.averageDepth =
      this.state.flow.averageDepth * 0.999 + this.state.flow.currentDepth * 0.001;

    // Check for sustained periods
    if (this.state.flow.currentDepth > this.config.flowThreshold) {
      // Would track sustained time here
    }

    // Flow with meta-awareness (the goal)
    if (this.state.flow.currentDepth > 0.6 && this.state.metaLevel >= 2) {
      this.state.flow.flowWithMeta++;
    }
  }

  // ========================================================================
  // Awareness Level Calculation
  // ========================================================================

  private updateAwarenessLevels(event: string, positive: boolean): void {
    const delta = positive ? 0.02 : -0.01;

    switch (event) {
      case 'witness':
        this.state.levels.aware = Math.min(1, Math.max(0,
          this.state.levels.aware + delta
        ));
        break;

      case 'transcendence':
      case 'paradoxHold':
        this.state.levels.metaAware = Math.min(1, Math.max(0,
          this.state.levels.metaAware + delta * 2
        ));
        this.state.levels.multiLevel = Math.min(1, Math.max(0,
          this.state.levels.multiLevel + delta
        ));
        break;
    }

    // Immersion decreases as awareness increases
    const totalAwareness =
      this.state.levels.aware +
      this.state.levels.metaAware +
      this.state.levels.multiLevel +
      this.state.levels.fluid;

    this.state.levels.immersed = Math.max(0, 1 - totalAwareness / 2);
  }

  private recalculateMetaLevel(): void {
    const weights = this.config.levelWeights;

    const witnessScore = this.state.witness.utilityScore;
    const questionScore = 1 - this.state.questions.anxietyLevel;
    const paradoxScore = this.state.paradox.tolerance;
    const scaleScore = this.state.scale.fluidityScore;
    const flowMetaScore = this.state.flow.flowWithMeta > 0 ? 1 : 0;

    const weighted =
      witnessScore * weights.witnessUtility +
      questionScore * weights.questionTolerance +
      paradoxScore * weights.paradoxHandling +
      scaleScore * weights.scaleAwareness +
      flowMetaScore * weights.flowWithMeta;

    // Scale to 0-4
    this.state.metaLevel = weighted * 4;

    // Track peak
    if (this.state.metaLevel > this.state.lifetime.peakMetaLevel) {
      this.state.lifetime.peakMetaLevel = this.state.metaLevel;
    }
  }

  // ========================================================================
  // Elite Mode
  // ========================================================================

  private checkEliteEligibility(): void {
    const hours = this.state.lifetime.totalPlaytime / 3600000;
    const metaLevel = this.state.lifetime.peakMetaLevel;

    this.state.lifetime.eliteEligible =
      hours >= this.config.eliteMinHours &&
      metaLevel >= this.config.eliteMetaLevel;
  }

  isEliteEligible(): boolean {
    return this.state.lifetime.eliteEligible;
  }

  // ========================================================================
  // Public Getters
  // ========================================================================

  getState(): MetaState {
    return { ...this.state };
  }

  getMetaLevel(): number {
    return this.state.metaLevel;
  }

  getWitnessLevel(): number {
    return this.state.witness.currentActivation;
  }

  getFlowState(): number {
    return this.state.flow.currentDepth;
  }

  getCurrentScale(): string {
    return this.state.scale.currentLevel;
  }

  // ========================================================================
  // Export for VeilPath/Vera
  // ========================================================================

  exportForVera(): VeraContext {
    return {
      metaLevel: this.state.metaLevel,
      questionsHeld: this.state.questions.held.map(q => q.text),
      insights: this.state.session.insights,
      sessionDuration: this.state.session.duration,
      flowState: this.state.flow.currentDepth,
      dominantDimension: this.getDominantDimension(),
      significantEvents: this.getSignificantEvents(),
    };
  }

  private getDominantDimension(): string {
    const visits = this.state.session.dimensions;
    if (visits.length === 0) return 'unknown';

    const timeByDimension: Record<string, number> = {};
    for (const visit of visits) {
      timeByDimension[visit.dimension] =
        (timeByDimension[visit.dimension] || 0) + visit.duration;
    }

    return Object.entries(timeByDimension)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  private getSignificantEvents(): string[] {
    const events: string[] = [];

    if (this.state.paradox.resolved > 0) {
      events.push(`Held ${this.state.paradox.resolved} paradox(es)`);
    }

    if (this.state.scale.deepestReached !== 'local') {
      events.push(`Reached ${this.state.scale.deepestReached} scale`);
    }

    if (this.state.flow.flowWithMeta > 0) {
      events.push('Achieved flow-with-awareness');
    }

    return events;
  }

  // ========================================================================
  // Events
  // ========================================================================

  on(event: string, callback: (state: MetaState) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }

  // ========================================================================
  // Persistence
  // ========================================================================

  serialize(): string {
    return JSON.stringify(this.state);
  }

  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.state = { ...this.initializeState(), ...parsed };
    } catch (e) {
      console.error('Failed to deserialize MetaState:', e);
    }
  }
}

// ============================================================================
// VeilPath Integration Types
// ============================================================================

export interface VeraContext {
  metaLevel: number;
  questionsHeld: string[];
  insights: Insight[];
  sessionDuration: number;
  flowState: number;
  dominantDimension: string;
  significantEvents: string[];
}

// ============================================================================
// Factory
// ============================================================================

export function createMetaEngine(config?: Partial<MetaEngineConfig>): MetaAwarenessEngine {
  return new MetaAwarenessEngine(config);
}

export default MetaAwarenessEngine;
