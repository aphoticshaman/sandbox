/**
 * Variance Classifier
 *
 * Classifies mutation vectors into response variance categories.
 * The "20 bomb techs" distribution:
 * - 75% solid: Therapeutically grounded, contextually appropriate
 * - 15% creative: Unexpected angle, novel reframe
 * - 10% edge: High-variance, filtered for safety
 *
 * Classification is deterministic given mutation vector,
 * ensuring reproducibility while maintaining distribution.
 */

export class VarianceClassifier {
  constructor(options = {}) {
    // Distribution thresholds
    this.thresholds = {
      solid: options.solidThreshold || 0.75,      // 75% solid
      creative: options.creativeThreshold || 0.90, // 15% creative (75-90%)
      edge: 1.0                                    // 10% edge (90-100%)
    };

    // Safety bounds per class
    this.safetyBounds = {
      solid: {
        maxTemperature: 0.75,
        maxCreativity: 0.3,
        minStability: 0.7
      },
      creative: {
        maxTemperature: 0.88,
        maxCreativity: 0.5,
        minStability: 0.5
      },
      edge: {
        maxTemperature: 0.95,
        maxCreativity: 0.7,
        minStability: 0.4
      }
    };

    // Class characteristics for prompt injection
    this.characteristics = {
      solid: {
        approach: 'grounded',
        riskTolerance: 'low',
        noveltyBias: 0.2,
        therapeuticWeight: 0.9
      },
      creative: {
        approach: 'exploratory',
        riskTolerance: 'moderate',
        noveltyBias: 0.5,
        therapeuticWeight: 0.7
      },
      edge: {
        approach: 'experimental',
        riskTolerance: 'high',
        noveltyBias: 0.8,
        therapeuticWeight: 0.5
      }
    };
  }

  /**
   * Classify a mutation vector
   * @param {MutationVector} mutation - The mutation vector
   * @returns {string} Class: 'solid', 'creative', or 'edge'
   */
  classify(mutation) {
    // Use selector value for classification (deterministic)
    const selector = mutation.selector;

    if (selector < this.thresholds.solid) {
      return 'solid';
    } else if (selector < this.thresholds.creative) {
      return 'creative';
    } else {
      return 'edge';
    }
  }

  /**
   * Get safety bounds for a variance class
   * @param {string} varianceClass - The class
   * @returns {object} Safety bounds
   */
  getBounds(varianceClass) {
    return this.safetyBounds[varianceClass] || this.safetyBounds.solid;
  }

  /**
   * Get characteristics for a variance class
   * @param {string} varianceClass - The class
   * @returns {object} Class characteristics
   */
  getCharacteristics(varianceClass) {
    return this.characteristics[varianceClass] || this.characteristics.solid;
  }

  /**
   * Check if mutation is within safety bounds for its class
   * @param {MutationVector} mutation - The mutation vector
   * @returns {boolean} True if safe
   */
  isSafe(mutation) {
    const bounds = this.getBounds(mutation.varianceClass);

    return (
      mutation.thermal <= bounds.maxTemperature &&
      mutation.creative <= bounds.maxCreativity &&
      (mutation.stability || 1) >= bounds.minStability
    );
  }

  /**
   * Clamp mutation to safety bounds
   * @param {MutationVector} mutation - The mutation vector
   * @returns {MutationVector} Clamped mutation
   */
  clampToSafety(mutation) {
    const bounds = this.getBounds(mutation.varianceClass);

    return {
      ...mutation,
      thermal: Math.min(mutation.thermal, bounds.maxTemperature),
      creative: Math.min(mutation.creative, bounds.maxCreativity),
      stability: Math.max(mutation.stability || 0.5, bounds.minStability),
      clamped: true
    };
  }

  /**
   * Get class distribution over recent mutations
   * @param {MutationVector[]} mutations - Recent mutations
   * @returns {object} Distribution stats
   */
  getDistribution(mutations) {
    const counts = { solid: 0, creative: 0, edge: 0 };

    for (const m of mutations) {
      const cls = m.varianceClass || this.classify(m);
      counts[cls]++;
    }

    const total = mutations.length || 1;
    return {
      counts,
      percentages: {
        solid: (counts.solid / total) * 100,
        creative: (counts.creative / total) * 100,
        edge: (counts.edge / total) * 100
      },
      expectedPercentages: {
        solid: this.thresholds.solid * 100,
        creative: (this.thresholds.creative - this.thresholds.solid) * 100,
        edge: (1 - this.thresholds.creative) * 100
      }
    };
  }

  /**
   * Adjust thresholds based on user preference
   * @param {string} preference - 'conservative', 'balanced', or 'adventurous'
   */
  setUserPreference(preference) {
    switch (preference) {
      case 'conservative':
        this.thresholds.solid = 0.85;
        this.thresholds.creative = 0.95;
        break;
      case 'adventurous':
        this.thresholds.solid = 0.60;
        this.thresholds.creative = 0.85;
        break;
      case 'balanced':
      default:
        this.thresholds.solid = 0.75;
        this.thresholds.creative = 0.90;
    }
  }

  /**
   * Generate class-appropriate prompt modifier
   * @param {string} varianceClass - The class
   * @returns {string} Prompt modifier text
   */
  getPromptModifier(varianceClass) {
    const modifiers = {
      solid: `Respond with grounded therapeutic insight. Prioritize clarity,
              established frameworks, and direct applicability to the user's
              situation. Be warm but substantive.`,

      creative: `Take a slightly unexpected angle. Find a connection or
                 reframe the user might not have considered. Balance novelty
                 with therapeutic value. Surprise them gently.`,

      edge: `Be bold. Say something true that might challenge them.
             Find the paradox or the deeper pattern. Take a creative
             risk while maintaining compassion. Make them think.`
    };

    return modifiers[varianceClass] || modifiers.solid;
  }
}

export default VarianceClassifier;
