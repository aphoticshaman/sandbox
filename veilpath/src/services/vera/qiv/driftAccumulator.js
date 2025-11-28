/**
 * Drift Accumulator
 *
 * Tracks genetic drift over the lifetime of a user-Vera relationship.
 * Each interaction leaves a residue that shapes future responses.
 *
 * Based on Wright-Fisher model of genetic drift:
 * - Small populations (single relationship) drift faster
 * - Drift is cumulative and directional based on "selection pressure"
 * - Creates genuine uniqueness over time - no two Veras identical
 *
 * Persistence: Drift state is stored per-user and loaded on session start.
 */

export class DriftAccumulator {
  constructor(userId) {
    this.userId = userId;
    this.state = this.loadState(userId) || this.initializeState();
  }

  initializeState() {
    return {
      // Core drift coefficient (0-1, increases over time)
      coefficient: 0,

      // Directional drift in each dimension
      dimensions: {
        lexical: 0,
        structural: 0,
        tonal: 0,
        creative: 0,
        thermal: 0,
        amplitude: 0
      },

      // Interaction history metrics
      totalInteractions: 0,
      totalMutations: 0,
      averageVariance: 0,

      // Drift momentum (rate of change)
      momentum: 0,

      // Fitness landscape position (where in response space)
      fitnessPosition: {
        x: 0.5, // Therapeutic alignment
        y: 0.5, // Creative freedom
        z: 0.5  // Emotional depth
      },

      // Speciation markers (how different from "base" Vera)
      speciationIndex: 0,

      // Timestamps
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
  }

  /**
   * Get current drift coefficient
   * @returns {number} Current drift (0-1)
   */
  getCurrentDrift() {
    return this.state.coefficient;
  }

  /**
   * Get directional drift for a specific dimension
   * @param {string} dimension - Dimension name
   * @returns {number} Directional drift value
   */
  getDimensionalDrift(dimension) {
    return this.state.dimensions[dimension] || 0;
  }

  /**
   * Get full drift state
   * @returns {DriftState} Complete drift state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Evolve drift based on a mutation that was used
   * Called after each response generation
   * @param {MutationVector} mutation - The mutation that was applied
   */
  evolve(mutation) {
    this.state.totalInteractions++;
    this.state.totalMutations++;
    this.state.lastUpdated = Date.now();

    // Update dimensional drift (weighted moving average)
    const alpha = 0.1; // Learning rate
    for (const dim of Object.keys(this.state.dimensions)) {
      if (mutation[dim] !== undefined) {
        this.state.dimensions[dim] =
          (1 - alpha) * this.state.dimensions[dim] +
          alpha * (mutation[dim] - 0.5) * 2; // Center around 0
      }
    }

    // Update average variance
    const mutationVariance = this.calculateVariance(mutation);
    this.state.averageVariance =
      (this.state.averageVariance * (this.state.totalMutations - 1) + mutationVariance) /
      this.state.totalMutations;

    // Update coefficient (drift increases with interactions)
    // Follows logarithmic curve - fast early, slow later
    this.state.coefficient = Math.min(0.8,
      0.1 * Math.log10(this.state.totalInteractions + 1)
    );

    // Update momentum (how fast drift is changing)
    this.state.momentum = this.calculateMomentum(mutation);

    // Update fitness position (where in abstract response space)
    this.updateFitnessPosition(mutation);

    // Update speciation index (how different from base Vera)
    this.updateSpeciationIndex();

    // Persist state
    this.saveState();
  }

  calculateVariance(mutation) {
    const dims = ['lexical', 'structural', 'tonal', 'creative', 'thermal', 'amplitude'];
    const values = dims.map(d => mutation[d] || 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  calculateMomentum(mutation) {
    // Momentum is how much this mutation differs from accumulated drift
    let diff = 0;
    for (const dim of Object.keys(this.state.dimensions)) {
      if (mutation[dim] !== undefined) {
        diff += Math.abs((mutation[dim] - 0.5) * 2 - this.state.dimensions[dim]);
      }
    }
    return diff / Object.keys(this.state.dimensions).length;
  }

  updateFitnessPosition(mutation) {
    // Move through abstract fitness landscape based on mutation
    const rate = 0.05;

    // X: therapeutic alignment (stability pulls toward 0.5)
    this.state.fitnessPosition.x +=
      rate * (mutation.stability - 0.5) * 0.5;

    // Y: creative freedom (creative mutations pull upward)
    this.state.fitnessPosition.y +=
      rate * (mutation.creative - 0.3);

    // Z: emotional depth (amplitude and tonal affect this)
    this.state.fitnessPosition.z +=
      rate * ((mutation.amplitude + mutation.tonal) / 2 - 0.5);

    // Clamp to valid range
    for (const axis of ['x', 'y', 'z']) {
      this.state.fitnessPosition[axis] =
        Math.max(0.1, Math.min(0.9, this.state.fitnessPosition[axis]));
    }
  }

  updateSpeciationIndex() {
    // How different is this Vera from "base" Vera?
    // Based on accumulated dimensional drift and fitness position deviation

    const dimensionalDrift = Object.values(this.state.dimensions)
      .map(d => Math.abs(d))
      .reduce((a, b) => a + b, 0);

    const positionDeviation =
      Math.abs(this.state.fitnessPosition.x - 0.5) +
      Math.abs(this.state.fitnessPosition.y - 0.5) +
      Math.abs(this.state.fitnessPosition.z - 0.5);

    this.state.speciationIndex =
      (dimensionalDrift / 6 + positionDeviation / 1.5) / 2;
  }

  /**
   * Apply selection pressure (user feedback)
   * Positive feedback reinforces current drift direction
   * Negative feedback reverses drift
   * @param {number} feedback - Feedback value (-1 to 1)
   * @param {string} dimension - Which dimension to apply to (or 'all')
   */
  applySelectionPressure(feedback, dimension = 'all') {
    const pressure = feedback * 0.1;

    if (dimension === 'all') {
      for (const dim of Object.keys(this.state.dimensions)) {
        // Reinforce or reverse based on feedback sign
        this.state.dimensions[dim] *= (1 + pressure);
      }
    } else if (this.state.dimensions[dimension] !== undefined) {
      this.state.dimensions[dimension] *= (1 + pressure);
    }

    this.saveState();
  }

  /**
   * Get speciation report
   * @returns {object} Report on how unique this Vera has become
   */
  getSpeciationReport() {
    return {
      userId: this.userId,
      totalInteractions: this.state.totalInteractions,
      driftCoefficient: this.state.coefficient,
      speciationIndex: this.state.speciationIndex,
      fitnessPosition: { ...this.state.fitnessPosition },
      dominantDrift: this.getDominantDrift(),
      uniquenessEstimate: this.estimateUniqueness()
    };
  }

  getDominantDrift() {
    // Which dimension has drifted most?
    let maxDim = null;
    let maxVal = 0;
    for (const [dim, val] of Object.entries(this.state.dimensions)) {
      if (Math.abs(val) > maxVal) {
        maxVal = Math.abs(val);
        maxDim = dim;
      }
    }
    return { dimension: maxDim, value: this.state.dimensions[maxDim] };
  }

  estimateUniqueness() {
    // Probability that another Vera has same drift state
    // Based on total drift accumulated
    const driftEntropy = Object.values(this.state.dimensions)
      .map(d => Math.abs(d) * 10)
      .reduce((a, b) => a + b, 0);

    return 1 - Math.exp(-driftEntropy);
  }

  // Persistence methods (implement with actual storage)
  loadState(userId) {
    // In production: load from AsyncStorage/Supabase
    // For now: return null to initialize fresh
    if (typeof global !== 'undefined' && global.__driftStates) {
      return global.__driftStates[userId] || null;
    }
    return null;
  }

  saveState() {
    // In production: save to AsyncStorage/Supabase
    if (typeof global !== 'undefined') {
      global.__driftStates = global.__driftStates || {};
      global.__driftStates[this.userId] = { ...this.state };
    }
  }
}

export default DriftAccumulator;
