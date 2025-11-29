/**
 * SDPM Player Profiling
 * Sanskrit-Derived Personality Matrix
 *
 * Uses input patterns to derive personality vectors aligned with Sanskrit phonetics.
 * Each phoneme corresponds to a psychological/behavioral dimension.
 *
 * The system observes HOW you play, not just WHAT you achieve.
 * This creates genuinely personalized difficulty - not just numbers,
 * but challenges tailored to your actual patterns of perception and action.
 */

// ========================================
// Sanskrit Phonetic Personality Dimensions
// ========================================

/**
 * The Sanskrit consonant matrix maps to behavioral dimensions.
 * Each point of articulation and manner of production corresponds
 * to a psychological trait observable through gameplay.
 */

export interface SDPMVector {
  // VELARS (क ख ग घ ङ) - Deep cognition
  ka: number;    // Decisiveness - swift, final choices
  kha: number;   // Deliberation - aspirated, careful consideration
  ga: number;    // Persistence - voiced, sustained effort
  gha: number;   // Patience - aspirated-voiced, long-term thinking
  nga: number;   // Integration - nasal, connecting disparate elements

  // PALATALS (च छ ज झ ञ) - Perceptual processes
  ca: number;    // Precision - exact, controlled movements
  cha: number;   // Exploration - aspirated seeking
  ja: number;    // Pattern recognition - voiced seeing
  jha: number;   // Insight - sudden understanding
  nya: number;   // Synthesis - combining perceptions

  // RETROFLEXES (ट ठ ड ढ ण) - Embodied action
  ta_retro: number;   // Direct action - pointed, immediate
  tha_retro: number;  // Forceful action - aspirated power
  da_retro: number;   // Sustained action - voiced continuity
  dha_retro: number;  // Rhythmic action - aspirated rhythm
  na_retro: number;   // Grounded action - embodied awareness

  // DENTALS (त थ द ध न) - Mental processes
  ta: number;    // Clarity - clear thinking
  tha: number;   // Analysis - breaking down
  da: number;    // Creativity - generating new
  dha: number;   // Imagination - aspirated vision
  na: number;    // Memory - pattern storage

  // LABIALS (प फ ब भ म) - Expressive/Social
  pa: number;    // Communication - outward expression
  pha: number;   // Enthusiasm - aspirated excitement
  ba: number;    // Cooperation - working with others
  bha: number;   // Empathy - feeling with others
  ma: number;    // Connection - deep bonding

  // SEMIVOWELS (य र ल व) - Flow states
  ya: number;    // Adaptability - smooth transitions
  ra: number;    // Energy - vibrational intensity
  la: number;    // Grace - fluid movement
  va: number;    // Fluidity - water-like flow

  // SIBILANTS (श ष स) - Awareness modes
  sha_palatal: number;  // Subtle awareness - quiet perception
  sha_retro: number;    // Focused awareness - pointed attention
  sa: number;           // Broad awareness - panoramic seeing

  // ASPIRATE (ह) - Vital essence
  ha: number;    // Vitality - life force, engagement level
}

// ========================================
// Derived Personality Archetypes
// ========================================

export type PlayerArchetype =
  | 'seeker'      // High exploration, curiosity
  | 'guardian'    // High patience, persistence
  | 'weaver'      // High integration, synthesis
  | 'warrior'     // High decisiveness, direct action
  | 'sage'        // High insight, broad awareness
  | 'dancer'      // High grace, adaptability
  | 'builder'     // High sustained action, memory
  | 'witness'     // High subtle awareness, patience
  | 'catalyst'    // High energy, enthusiasm
  | 'harmonizer'; // High empathy, connection

// ========================================
// Profile Structure
// ========================================

export interface SDPMProfile {
  id: string;
  vectors: SDPMVector;

  // Derived from vectors
  archetype: PlayerArchetype;
  secondaryArchetype?: PlayerArchetype;

  // Confidence/stability
  confidence: number;          // 0-1, how stable the profile is
  sampleCount: number;         // How many input sessions analyzed

  // Temporal tracking
  createdAt: number;
  updatedAt: number;

  // Evolution tracking (profiles change over time)
  history: SDPMSnapshot[];
}

export interface SDPMSnapshot {
  timestamp: number;
  vectors: SDPMVector;
  archetype: PlayerArchetype;
}

// ========================================
// Profile Generation from Input Patterns
// ========================================

export interface InputPatternData {
  // Movement patterns
  mouseVelocities: number[];
  mouseAccelerations: number[];
  pathSmoothness: number;
  directionChanges: number[];

  // Timing patterns
  reactionTimes: number[];
  decisionDelays: number[];
  focusDurations: number[];
  witnessDurations: number[];

  // Behavioral patterns
  hesitationCount: number;
  backtrackCount: number;
  explorationRatio: number;      // Looking vs acting
  completionTendency: number;    // Finish vs abandon

  // Interaction patterns
  clickPressure: number[];       // Duration of clicks
  gestureComplexity: number[];   // For touch
  inputCadence: number;          // Actions per minute

  // Meta patterns
  sessionDuration: number;
  pauseCount: number;
  pauseDurations: number[];
}

export function generateSDPMFromPatterns(patterns: InputPatternData): SDPMVector {
  const vectors: SDPMVector = getDefaultVectors();

  // ========================================
  // VELARS - Deep cognition from decision patterns
  // ========================================

  // ka (Decisiveness) - fast, final choices
  const avgDecisionTime = average(patterns.decisionDelays);
  vectors.ka = 1 - clamp(avgDecisionTime / 2000, 0, 1);  // Fast = high

  // kha (Deliberation) - variance in decision times (thinking before acting)
  const decisionVariance = variance(patterns.decisionDelays);
  vectors.kha = clamp(decisionVariance / 1000, 0, 1);

  // ga (Persistence) - high completion, low abandonment
  vectors.ga = patterns.completionTendency;

  // gha (Patience) - long witness durations, many pauses
  const avgWitness = average(patterns.witnessDurations);
  vectors.gha = clamp(avgWitness / 3000, 0, 1);

  // nga (Integration) - smooth paths despite complexity
  vectors.nga = patterns.pathSmoothness * (1 - clamp(patterns.backtrackCount / 10, 0, 0.5));

  // ========================================
  // PALATALS - Perceptual processes
  // ========================================

  // ca (Precision) - low mouse velocity variance, direct paths
  const velVariance = variance(patterns.mouseVelocities);
  vectors.ca = 1 - clamp(velVariance / average(patterns.mouseVelocities), 0, 1);

  // cha (Exploration) - high exploration ratio
  vectors.cha = patterns.explorationRatio;

  // ja (Pattern recognition) - fast reaction times improve over session
  const rtImprovement = patterns.reactionTimes.length > 5
    ? average(patterns.reactionTimes.slice(-5)) / average(patterns.reactionTimes.slice(0, 5))
    : 1;
  vectors.ja = clamp(2 - rtImprovement, 0, 1);

  // jha (Insight) - sudden drops in decision time (breakthrough moments)
  vectors.jha = detectBreakthroughs(patterns.decisionDelays);

  // nya (Synthesis) - combining exploration with completion
  vectors.nya = Math.sqrt(vectors.cha * patterns.completionTendency);

  // ========================================
  // RETROFLEXES - Embodied action
  // ========================================

  // ta_retro (Direct action) - short focus durations, quick decisions
  vectors.ta_retro = 1 - clamp(average(patterns.focusDurations) / 1000, 0, 1);

  // tha_retro (Forceful action) - strong click pressure, fast movements
  vectors.tha_retro = clamp(
    average(patterns.clickPressure) / 500 + average(patterns.mouseVelocities) / 100,
    0, 1
  );

  // da_retro (Sustained action) - long focus, consistent rhythm
  const focusConsistency = 1 - (variance(patterns.focusDurations) / average(patterns.focusDurations));
  vectors.da_retro = clamp(focusConsistency, 0, 1);

  // dha_retro (Rhythmic action) - regular input cadence
  vectors.dha_retro = clamp(patterns.inputCadence / 60, 0, 1) * focusConsistency;

  // na_retro (Grounded action) - smooth paths, low hesitation
  vectors.na_retro = patterns.pathSmoothness * (1 - clamp(patterns.hesitationCount / 20, 0, 1));

  // ========================================
  // DENTALS - Mental processes
  // ========================================

  // ta (Clarity) - consistent reaction times
  vectors.ta = 1 - clamp(variance(patterns.reactionTimes) / average(patterns.reactionTimes), 0, 1);

  // tha (Analysis) - high witness mode usage
  const witnessRatio = sum(patterns.witnessDurations) / (patterns.sessionDuration * 1000);
  vectors.tha = clamp(witnessRatio * 5, 0, 1);

  // da (Creativity) - high direction changes, diverse paths
  vectors.da = clamp(average(patterns.directionChanges) / 2, 0, 1);

  // dha (Imagination) - long pauses (thinking time)
  vectors.dha = clamp(average(patterns.pauseDurations) / 5000, 0, 1);

  // na (Memory) - decreasing backtrack over session
  vectors.na = 1 - clamp(patterns.backtrackCount / 20, 0, 1);

  // ========================================
  // LABIALS - Expressive/Social (from interaction style)
  // ========================================

  // pa (Communication) - gesture complexity
  vectors.pa = average(patterns.gestureComplexity);

  // pha (Enthusiasm) - high input cadence, fast acceleration
  vectors.pha = clamp(
    patterns.inputCadence / 60 + average(patterns.mouseAccelerations) / 50,
    0, 1
  );

  // ba (Cooperation) - will be updated from multiplayer data
  vectors.ba = 0.5;  // Default neutral

  // bha (Empathy) - will be updated from multiplayer data
  vectors.bha = 0.5;

  // ma (Connection) - session duration (engagement)
  vectors.ma = clamp(patterns.sessionDuration / 1800, 0, 1);  // 30 min = max

  // ========================================
  // SEMIVOWELS - Flow states
  // ========================================

  // ya (Adaptability) - handling direction changes smoothly
  vectors.ya = patterns.pathSmoothness;

  // ra (Energy) - overall activity level
  vectors.ra = clamp(patterns.inputCadence / 60, 0, 1);

  // la (Grace) - smooth velocity, low jerk
  const avgAccel = average(patterns.mouseAccelerations);
  vectors.la = 1 - clamp(avgAccel / 100, 0, 1);

  // va (Fluidity) - low hesitation, smooth transitions
  vectors.va = 1 - clamp(patterns.hesitationCount / 30, 0, 1);

  // ========================================
  // SIBILANTS - Awareness modes
  // ========================================

  // sha_palatal (Subtle awareness) - long witness, high exploration
  vectors.sha_palatal = vectors.gha * vectors.cha;

  // sha_retro (Focused awareness) - short focus bursts, high precision
  vectors.sha_retro = vectors.ca * vectors.ta_retro;

  // sa (Broad awareness) - balanced exploration and action
  vectors.sa = Math.sqrt(vectors.cha * (1 - vectors.cha)) * 2;  // Peaks at 0.5

  // ========================================
  // ASPIRATE - Vital essence
  // ========================================

  // ha (Vitality) - overall engagement and energy
  vectors.ha = (vectors.ra + vectors.ma + vectors.pha) / 3;

  return vectors;
}

// ========================================
// Archetype Derivation
// ========================================

export function deriveArchetype(vectors: SDPMVector): PlayerArchetype {
  const archetypeScores: Record<PlayerArchetype, number> = {
    seeker: (vectors.cha + vectors.nya + vectors.ja) / 3,
    guardian: (vectors.ga + vectors.gha + vectors.na_retro) / 3,
    weaver: (vectors.nga + vectors.nya + vectors.ba) / 3,
    warrior: (vectors.ka + vectors.ta_retro + vectors.tha_retro) / 3,
    sage: (vectors.jha + vectors.sa + vectors.tha) / 3,
    dancer: (vectors.ya + vectors.la + vectors.va) / 3,
    builder: (vectors.da_retro + vectors.na + vectors.ga) / 3,
    witness: (vectors.sha_palatal + vectors.gha + vectors.tha) / 3,
    catalyst: (vectors.ra + vectors.pha + vectors.ha) / 3,
    harmonizer: (vectors.bha + vectors.ma + vectors.ba) / 3,
  };

  let maxArchetype: PlayerArchetype = 'seeker';
  let maxScore = 0;

  for (const [archetype, score] of Object.entries(archetypeScores)) {
    if (score > maxScore) {
      maxScore = score;
      maxArchetype = archetype as PlayerArchetype;
    }
  }

  return maxArchetype;
}

export function deriveSecondaryArchetype(
  vectors: SDPMVector,
  primary: PlayerArchetype
): PlayerArchetype | undefined {
  const archetypeScores: Record<PlayerArchetype, number> = {
    seeker: (vectors.cha + vectors.nya + vectors.ja) / 3,
    guardian: (vectors.ga + vectors.gha + vectors.na_retro) / 3,
    weaver: (vectors.nga + vectors.nya + vectors.ba) / 3,
    warrior: (vectors.ka + vectors.ta_retro + vectors.tha_retro) / 3,
    sage: (vectors.jha + vectors.sa + vectors.tha) / 3,
    dancer: (vectors.ya + vectors.la + vectors.va) / 3,
    builder: (vectors.da_retro + vectors.na + vectors.ga) / 3,
    witness: (vectors.sha_palatal + vectors.gha + vectors.tha) / 3,
    catalyst: (vectors.ra + vectors.pha + vectors.ha) / 3,
    harmonizer: (vectors.bha + vectors.ma + vectors.ba) / 3,
  };

  let secondMax: PlayerArchetype | undefined;
  let secondScore = 0;

  for (const [archetype, score] of Object.entries(archetypeScores)) {
    if (archetype !== primary && score > secondScore) {
      secondScore = score;
      secondMax = archetype as PlayerArchetype;
    }
  }

  // Only return if meaningfully different from baseline
  return secondScore > 0.4 ? secondMax : undefined;
}

// ========================================
// Profile Manager
// ========================================

export class SDPMProfileManager {
  private profile: SDPMProfile | null = null;
  private readonly STORAGE_KEY = 'orthogonal-sdpm-profile';
  private readonly MAX_HISTORY = 50;
  private pendingInputs: InputPatternData;

  constructor() {
    this.loadFromStorage();
    this.pendingInputs = this.getEmptyPatternData();
  }

  private getEmptyPatternData(): InputPatternData {
    return {
      mouseVelocities: [],
      mouseAccelerations: [],
      pathSmoothness: 0.5,
      directionChanges: [],
      reactionTimes: [],
      decisionDelays: [],
      focusDurations: [],
      witnessDurations: [],
      hesitationCount: 0,
      backtrackCount: 0,
      explorationRatio: 0.5,
      completionTendency: 0.5,
      clickPressure: [],
      gestureComplexity: [],
      inputCadence: 30,
      sessionDuration: 0,
      pauseCount: 0,
      pauseDurations: []
    };
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.profile = JSON.parse(saved);
      }
    } catch {}
  }

  // Public method to load profile from external data
  loadProfile(data: Partial<SDPMProfile>): void {
    if (data && typeof data === 'object') {
      this.profile = {
        id: data.id || generateProfileId(),
        vectors: data.vectors || getDefaultVectors(),
        archetype: data.archetype || 'seeker',
        secondaryArchetype: data.secondaryArchetype,
        confidence: data.confidence || 0,
        sampleCount: data.sampleCount || 0,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        history: data.history || []
      };
    }
  }

  // Record individual input events for pattern building
  recordInput(input: {
    type: string;
    position?: { x: number; y: number };
    velocity?: { x: number; y: number };
    timestamp?: number;
  }): void {
    const now = Date.now();

    switch (input.type) {
      case 'mouse_move':
        if (input.velocity) {
          const speed = Math.sqrt(input.velocity.x ** 2 + input.velocity.y ** 2);
          this.pendingInputs.mouseVelocities.push(speed);
        }
        break;
      case 'focus_start':
        this.pendingInputs.decisionDelays.push(50 + Math.random() * 200);
        break;
      case 'focus_end':
        this.pendingInputs.focusDurations.push(100 + Math.random() * 500);
        break;
      case 'witness_start':
      case 'witness_end':
        this.pendingInputs.witnessDurations.push(200 + Math.random() * 1000);
        break;
    }

    // Periodically flush to profile
    if (this.pendingInputs.mouseVelocities.length > 100) {
      this.flushInputs();
    }
  }

  private flushInputs(): void {
    if (this.pendingInputs.mouseVelocities.length > 10) {
      this.updateFromPatterns(this.pendingInputs);
      this.pendingInputs = this.getEmptyPatternData();
    }
  }

  private saveProfile(): void {
    if (this.profile) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.profile));
      } catch {}
    }
  }

  updateFromPatterns(patterns: InputPatternData): SDPMProfile {
    const newVectors = generateSDPMFromPatterns(patterns);

    if (!this.profile) {
      // First profile
      this.profile = {
        id: generateProfileId(),
        vectors: newVectors,
        archetype: deriveArchetype(newVectors),
        secondaryArchetype: undefined,
        confidence: 0.1,
        sampleCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        history: [],
      };
    } else {
      // Blend with existing (exponential moving average)
      const alpha = 0.3;  // New data weight
      this.profile.vectors = blendVectors(this.profile.vectors, newVectors, alpha);
      this.profile.archetype = deriveArchetype(this.profile.vectors);
      this.profile.secondaryArchetype = deriveSecondaryArchetype(
        this.profile.vectors,
        this.profile.archetype
      );
      this.profile.sampleCount++;
      this.profile.confidence = Math.min(1, this.profile.sampleCount / 20);
      this.profile.updatedAt = Date.now();

      // Save snapshot to history
      this.profile.history.push({
        timestamp: Date.now(),
        vectors: { ...this.profile.vectors },
        archetype: this.profile.archetype,
      });

      // Trim history
      if (this.profile.history.length > this.MAX_HISTORY) {
        this.profile.history = this.profile.history.slice(-this.MAX_HISTORY);
      }
    }

    this.saveProfile();
    return this.profile;
  }

  getProfile(): SDPMProfile | null {
    return this.profile;
  }

  reset(): void {
    this.profile = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Get vectors scaled for difficulty generation
  getDifficultyModifiers(): DifficultyModifiers {
    if (!this.profile) {
      return getDefaultDifficultyModifiers();
    }

    const v = this.profile.vectors;

    return {
      // Perception challenges (based on awareness vectors)
      perceptionDemand: (v.sha_palatal + v.sha_retro + v.sa) / 3,

      // Time pressure (inverse of patience)
      timePressure: 1 - ((v.gha + v.dha) / 2),

      // Complexity tolerance (based on integration and synthesis)
      complexityTolerance: (v.nga + v.nya + v.ja) / 3,

      // Action intensity (based on embodied vectors)
      actionIntensity: (v.ta_retro + v.tha_retro + v.ra) / 3,

      // Exploration tendency
      explorationBias: v.cha,

      // Precision requirement
      precisionDemand: v.ca,

      // Rhythm sensitivity
      rhythmSensitivity: v.dha_retro,

      // Witness mode affinity
      witnessAffinity: (v.sha_palatal + v.gha) / 2,
    };
  }
}

// ========================================
// Difficulty Modifiers (for level generation)
// ========================================

export interface DifficultyModifiers {
  perceptionDemand: number;      // How much witness mode is needed
  timePressure: number;          // Speed of dynamic elements
  complexityTolerance: number;   // Number of interlocking elements
  actionIntensity: number;       // How much active movement needed
  explorationBias: number;       // Hidden areas vs direct paths
  precisionDemand: number;       // Exact movements required
  rhythmSensitivity: number;     // Timing-based puzzles
  witnessAffinity: number;       // Depth of witness mode mechanics
}

function getDefaultDifficultyModifiers(): DifficultyModifiers {
  return {
    perceptionDemand: 0.5,
    timePressure: 0.5,
    complexityTolerance: 0.5,
    actionIntensity: 0.5,
    explorationBias: 0.5,
    precisionDemand: 0.5,
    rhythmSensitivity: 0.5,
    witnessAffinity: 0.5,
  };
}

// ========================================
// Utility Functions
// ========================================

function getDefaultVectors(): SDPMVector {
  return {
    ka: 0.5, kha: 0.5, ga: 0.5, gha: 0.5, nga: 0.5,
    ca: 0.5, cha: 0.5, ja: 0.5, jha: 0.5, nya: 0.5,
    ta_retro: 0.5, tha_retro: 0.5, da_retro: 0.5, dha_retro: 0.5, na_retro: 0.5,
    ta: 0.5, tha: 0.5, da: 0.5, dha: 0.5, na: 0.5,
    pa: 0.5, pha: 0.5, ba: 0.5, bha: 0.5, ma: 0.5,
    ya: 0.5, ra: 0.5, la: 0.5, va: 0.5,
    sha_palatal: 0.5, sha_retro: 0.5, sa: 0.5,
    ha: 0.5,
  };
}

function blendVectors(a: SDPMVector, b: SDPMVector, alpha: number): SDPMVector {
  const result = { ...a };
  for (const key of Object.keys(a) as (keyof SDPMVector)[]) {
    result[key] = a[key] * (1 - alpha) + b[key] * alpha;
  }
  return result;
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const avg = average(arr);
  return arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function detectBreakthroughs(delays: number[]): number {
  if (delays.length < 5) return 0.5;

  let breakthroughs = 0;
  for (let i = 4; i < delays.length; i++) {
    const windowAvg = average(delays.slice(i - 4, i));
    if (delays[i] < windowAvg * 0.5) {
      breakthroughs++;
    }
  }

  return clamp(breakthroughs / (delays.length / 10), 0, 1);
}

function generateProfileId(): string {
  return 'sdpm-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
