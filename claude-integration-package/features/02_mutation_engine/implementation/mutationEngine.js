/**
 * Mutation Engine
 *
 * Generates mutation vectors from entropy state using
 * biologically-inspired variance modeling.
 *
 * Mutation types (genetic analogy):
 * - Point mutations: Small lexical variations
 * - Crossover: Structural recombination
 * - Insertion/Deletion: Content density variance
 * - Regulatory: Tonal/emotional modulation
 *
 * Each mutation vector is unique. Collision probability
 * approaches zero given sufficient entropy input.
 */

export class MutationEngine {
  constructor() {
    // Mutation rate coefficients (tunable)
    this.rates = {
      lexical: 0.15,      // Word choice variance
      structural: 0.12,   // Sentence structure
      tonal: 0.18,        // Emotional coloring
      creative: 0.22,     // Novel connections
      thermal: 0.20,      // Temperature modulation
      amplitude: 0.16     // Response intensity
    };

    // Bounds for therapeutic safety
    this.bounds = {
      minStability: 0.4,  // Never go below this coherence
      maxVariance: 0.95,  // Never exceed this chaos
      safetyFloor: 0.6    // Therapeutic safety minimum
    };
  }

  /**
   * Generate mutation vector from entropy state
   * @param {EntropyState} entropy - Mixed entropy state
   * @param {number} driftCoefficient - Accumulated drift
   * @returns {MutationVector} Unique mutation vector
   */
  generate(entropy, driftCoefficient) {
    // Extract random values from entropy state
    const randoms = this.extractRandoms(entropy.state);

    // Apply genetic operators
    const baseVector = this.applyGeneticOperators(randoms);

    // Modulate by drift (evolutionary pressure over time)
    const driftedVector = this.applyDrift(baseVector, driftCoefficient);

    // Ensure therapeutic bounds
    const boundedVector = this.applyBounds(driftedVector);

    // Add uniqueness signature
    boundedVector.signature = this.generateSignature(entropy, boundedVector);
    boundedVector.timestamp = entropy.timestamp;
    boundedVector.entropyBits = entropy.totalEntropy;

    return boundedVector;
  }

  extractRandoms(state) {
    // Convert entropy state to normalized random values [0,1)
    return state.map(v => (v >>> 0) / 0xFFFFFFFF);
  }

  applyGeneticOperators(randoms) {
    return {
      // Point mutation: lexical variance
      lexical: this.pointMutation(randoms[0], this.rates.lexical),

      // Crossover: structural recombination
      structural: this.crossover(randoms[1], randoms[2], this.rates.structural),

      // Regulatory mutation: tonal modulation
      tonal: this.regulatory(randoms[3], this.rates.tonal),

      // Insertion: creative additions
      creative: this.insertion(randoms[4], randoms[5], this.rates.creative),

      // Thermal: temperature coefficient
      thermal: this.thermal(randoms[6], this.rates.thermal),

      // Amplitude: response intensity
      amplitude: this.amplitude(randoms[7], this.rates.amplitude),

      // Selector: for choosing among options
      selector: randoms[8],

      // Phase: for cyclic variations
      phase: randoms[9] * Math.PI * 2
    };
  }

  pointMutation(random, rate) {
    // Small variations following power law distribution
    // Most mutations are small, occasional large jumps
    const base = Math.pow(random, 1.5); // Bias toward smaller values
    return base * rate * 2; // Scale to mutation rate
  }

  crossover(r1, r2, rate) {
    // Two-point crossover simulation
    // Combines two random values with variable breakpoint
    const breakpoint = r1;
    const contribution1 = r1 * breakpoint;
    const contribution2 = r2 * (1 - breakpoint);
    return (contribution1 + contribution2) * rate * 2;
  }

  regulatory(random, rate) {
    // Regulatory genes have switch-like behavior
    // Sigmoid transformation for smoother transitions
    const sigmoid = 1 / (1 + Math.exp(-10 * (random - 0.5)));
    return sigmoid * rate * 2;
  }

  insertion(r1, r2, rate) {
    // Insertions can be significant - use product distribution
    // Creates occasional high-impact creative mutations
    const impact = r1 * r2; // Product biases toward smaller values
    const boosted = Math.pow(impact, 0.7); // But allow occasional large ones
    return boosted * rate * 3; // Higher ceiling for creativity
  }

  thermal(random, rate) {
    // Temperature follows beta distribution shape
    // Centered with tails for occasional extremes
    const beta = this.betaDistribution(random, 2, 2);
    return beta * rate * 2;
  }

  amplitude(random, rate) {
    // Amplitude modulation - how intense is the response
    // Normal-ish distribution centered at 0.5
    const normal = this.boxMuller(random, 0.5, 0.15);
    return Math.max(0, Math.min(1, normal)) * rate * 2;
  }

  betaDistribution(u, a, b) {
    // Approximate beta distribution using Kumaraswamy
    const v = 1 - Math.pow(1 - Math.pow(u, 1/a), 1/b);
    return v;
  }

  boxMuller(u, mean, std) {
    // Approximate normal from uniform
    // Using rational approximation for speed
    const t = Math.sqrt(-2 * Math.log(Math.max(0.0001, u)));
    const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
    const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
    const z = t - (c0 + c1*t + c2*t*t) / (1 + d1*t + d2*t*t + d3*t*t*t);
    return mean + z * std * (u > 0.5 ? 1 : -1);
  }

  applyDrift(vector, driftCoefficient) {
    // Drift amplifies or dampens mutations over time
    // Older relationships have more accumulated drift
    const driftFactor = 1 + (driftCoefficient * 0.3);

    return {
      ...vector,
      lexical: vector.lexical * driftFactor,
      structural: vector.structural * driftFactor,
      tonal: vector.tonal * driftFactor,
      creative: Math.min(0.6, vector.creative * driftFactor), // Cap creative drift
      thermal: vector.thermal * (1 + driftCoefficient * 0.1),
      amplitude: vector.amplitude * driftFactor,
      driftApplied: driftCoefficient
    };
  }

  applyBounds(vector) {
    // Ensure all values stay within therapeutic safety bounds
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    return {
      ...vector,
      lexical: clamp(vector.lexical, 0, this.bounds.maxVariance),
      structural: clamp(vector.structural, 0, this.bounds.maxVariance),
      tonal: clamp(vector.tonal, 0, this.bounds.maxVariance),
      creative: clamp(vector.creative, 0, this.bounds.maxVariance),
      thermal: clamp(vector.thermal, 0.1, 0.9), // Temperature always bounded
      amplitude: clamp(vector.amplitude, 0.2, 0.9),
      stability: Math.max(this.bounds.minStability,
                         1 - (vector.lexical + vector.structural + vector.creative) / 3)
    };
  }

  generateSignature(entropy, vector) {
    // Create unique signature for this mutation
    // Used for collision detection and drift tracking
    const components = [
      entropy.timestamp,
      entropy.state[0],
      entropy.state[7],
      Math.floor(vector.lexical * 1000000),
      Math.floor(vector.creative * 1000000),
      Math.floor(vector.thermal * 1000000)
    ];

    // Simple hash combination
    let hash = 0;
    for (const c of components) {
      hash = ((hash << 5) - hash + c) >>> 0;
    }

    return hash.toString(16).padStart(8, '0');
  }
}

export default MutationEngine;
