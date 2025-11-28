/**
 * ABSTRACTION ENGINE
 *
 * Luna and Sol extract DIFFERENT abstractions from the SAME geometric reality.
 * They distill unique "objects" through layered abstraction.
 *
 * Abstraction Layers:
 * 1. Tangible (cards, positions, numbers)
 * 2. Abstract (emotions, actions, themes)
 * 3. Meta-Abstract (patterns, principles, archetypes)
 * 4. Universal (timeless truths)
 *
 * Luna's lens: Emotion → Pattern → Archetype → Universal
 * Sol's lens: Action → Result → Principle → Universal
 */

// ═══════════════════════════════════════════════════════════
// ABSTRACTION LAYERS
// ═══════════════════════════════════════════════════════════

class AbstractionEngine {
  constructor(guide) {
    this.guide = guide; // 'luna' or 'sol'
    this.lensConfig = ABSTRACTION_LENSES[guide];
  }

  /**
   * Extract multi-layer abstractions from geometric position
   * Returns different "objects" depending on guide's lens
   */
  extractAbstractions(geometricPosition, cards, userContext) {
    const tangibles = this.extractTangibles(geometricPosition, cards);
    const abstracts = this.extractAbstracts(tangibles);
    const metaAbstracts = this.extractMetaAbstracts(abstracts, userContext);
    const universals = this.extractUniversals(metaAbstracts);

    return {
      tangibles,
      abstracts,
      metaAbstracts,
      universals,
      synthesized: this.synthesize(tangibles, abstracts, metaAbstracts, universals)
    };
  }

  /**
   * Layer 1: Extract tangible features
   */
  extractTangibles(position, cards) {
    return {
      shadowLevel: position.shadow,
      consciousnessLevel: position.consciousness,
      activeLevel: position.active,
      receptiveLevel: position.receptive,
      cards: cards.map(c => ({
        name: c.name,
        reversed: c.reversed,
        element: c.element,
        position: c.position
      })),
      cardCount: cards.length,
      reversedCount: cards.filter(c => c.reversed).length
    };
  }

  /**
   * Layer 2: Extract guide-specific abstracts
   */
  extractAbstracts(tangibles) {
    if (this.guide === 'luna') {
      return this.extractLunaAbstracts(tangibles);
    } else {
      return this.extractSolAbstracts(tangibles);
    }
  }

  /**
   * Luna's abstractions: Emotions, cycles, flows
   */
  extractLunaAbstracts(tangibles) {
    const emotions = this.detectEmotionalState(tangibles);
    const cycles = this.detectCycles(tangibles);
    const flows = this.detectFlows(tangibles);
    const shadows = this.detectShadowPresence(tangibles);

    return {
      emotions,          // Sadness, grief, joy, etc.
      cycles,            // Return patterns, seasonal cycles
      flows,             // Energy movement, transitions
      shadows,           // What's hidden, avoided, rejected
      resonance: this.calculateEmotionalResonance(emotions, shadows)
    };
  }

  /**
   * Sol's abstractions: Actions, trajectories, states
   */
  extractSolAbstracts(tangibles) {
    const actions = this.detectActionStates(tangibles);
    const trajectories = this.detectTrajectories(tangibles);
    const momentum = this.detectMomentum(tangibles);
    const blockages = this.detectBlockages(tangibles);

    return {
      actions,           // What's being done/avoided
      trajectories,      // Direction of movement
      momentum,          // Speed of change
      blockages,         // Obstacles to action
      efficiency: this.calculateActionEfficiency(actions, blockages)
    };
  }

  /**
   * Layer 3: Extract meta-abstractions (patterns, principles)
   */
  extractMetaAbstracts(abstracts, userContext) {
    if (this.guide === 'luna') {
      return this.extractLunaMetaAbstracts(abstracts, userContext);
    } else {
      return this.extractSolMetaAbstracts(abstracts, userContext);
    }
  }

  /**
   * Luna's meta-abstractions: Archetypal patterns
   */
  extractLunaMetaAbstracts(abstracts, userContext) {
    const archetypes = this.identifyArchetypes(abstracts);
    const mythicPatterns = this.identifyMythicPatterns(abstracts, userContext);
    const cyclicReturns = this.identifyCyclicReturns(abstracts.cycles, userContext);

    return {
      archetypes,        // Mother, Shadow, Wise Woman, etc.
      mythicPatterns,    // Hero's journey, descent, return
      cyclicReturns,     // What keeps coming back
      woundSignature: this.identifyWoundSignature(abstracts.shadows, userContext)
    };
  }

  /**
   * Sol's meta-abstractions: Operational principles
   */
  extractSolMetaAbstracts(abstracts, userContext) {
    const principles = this.identifyPrinciples(abstracts);
    const strategies = this.identifyStrategies(abstracts, userContext);
    const goals = this.identifyGoals(abstracts.trajectories);

    return {
      principles,        // Cause-effect laws operating
      strategies,        // Approaches being used/needed
      goals,             // Direction points
      leverage: this.identifyLeveragePoints(abstracts, userContext)
    };
  }

  /**
   * Layer 4: Extract universal truths
   */
  extractUniversals(metaAbstracts) {
    if (this.guide === 'luna') {
      return this.extractLunaUniversals(metaAbstracts);
    } else {
      return this.extractSolUniversals(metaAbstracts);
    }
  }

  /**
   * Luna's universals: Timeless emotional/spiritual truths
   */
  extractLunaUniversals(metaAbstracts) {
    return {
      truth: this.distillEmotionalTruth(metaAbstracts),
      wisdom: this.distillAncientWisdom(metaAbstracts),
      teaching: this.distillSpiritualTeaching(metaAbstracts)
    };
  }

  /**
   * Sol's universals: Timeless operational/strategic truths
   */
  extractSolUniversals(metaAbstracts) {
    return {
      truth: this.distillStrategicTruth(metaAbstracts),
      law: this.distillOperatingLaw(metaAbstracts),
      principle: this.distillActionPrinciple(metaAbstracts)
    };
  }

  // ═══════════════════════════════════════════════════════════
  // LUNA-SPECIFIC DETECTION METHODS
  // ═══════════════════════════════════════════════════════════

  detectEmotionalState(tangibles) {
    const emotions = [];

    if (tangibles.shadowLevel > 0.7) {
      emotions.push({ type: 'grief', intensity: tangibles.shadowLevel });
      emotions.push({ type: 'longing', intensity: tangibles.receptiveLevel });
    }

    if (tangibles.reversedCount / tangibles.cardCount > 0.5) {
      emotions.push({ type: 'resistance', intensity: 0.8 });
    }

    return emotions;
  }

  detectCycles(tangibles) {
    // Detect repeating patterns
    // Placeholder - would analyze card history
    return [{
      type: 'return_to_shadow',
      frequency: 'monthly',
      trigger: 'relationship_stress'
    }];
  }

  detectFlows(tangibles) {
    // Detect energy movement
    const flow = tangibles.activeLevel - tangibles.receptiveLevel;
    return {
      direction: flow > 0 ? 'outward' : 'inward',
      quality: Math.abs(flow) > 0.5 ? 'strong' : 'gentle',
      blocked: tangibles.reversedCount > tangibles.cardCount / 2
    };
  }

  detectShadowPresence(tangibles) {
    return {
      depth: tangibles.shadowLevel,
      avoided: tangibles.reversedCount > 2,
      content: this.inferShadowContent(tangibles)
    };
  }

  inferShadowContent(tangibles) {
    // What's in the shadow?
    if (tangibles.shadowLevel > 0.8) {
      return ['rage', 'grief', 'desire'];
    }
    return ['uncertainty'];
  }

  calculateEmotionalResonance(emotions, shadows) {
    // How much emotional truth is present?
    return emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length;
  }

  identifyArchetypes(abstracts) {
    const archetypes = [];

    if (abstracts.shadows.depth > 0.7) {
      archetypes.push({
        name: 'Shadow Self',
        strength: abstracts.shadows.depth,
        message: 'The parts you reject hold power you need'
      });
    }

    if (abstracts.flows.direction === 'inward' && abstracts.resonance > 0.6) {
      archetypes.push({
        name: 'Wise Woman',
        strength: abstracts.resonance,
        message: 'Wisdom lives in stillness and descent'
      });
    }

    return archetypes;
  }

  identifyMythicPatterns(abstracts, userContext) {
    // Which universal story are they living?
    if (abstracts.shadows.depth > 0.7 && abstracts.flows.direction === 'inward') {
      return {
        pattern: 'Descent to the Underworld',
        stage: 'facing_guardian',
        nextPhase: 'retrieval'
      };
    }

    return {
      pattern: 'Return Journey',
      stage: 'integration',
      nextPhase: 'sharing'
    };
  }

  identifyCyclicReturns(cycles, userContext) {
    return cycles.map(cycle => ({
      ...cycle,
      meaning: `This ${cycle.frequency} return to ${cycle.type} is not failure—it's deepening`
    }));
  }

  identifyWoundSignature(shadows, userContext) {
    return {
      core: 'abandonment',  // Would detect from patterns
      manifestation: 'people-pleasing',
      healing: 'self-witnessing'
    };
  }

  distillEmotionalTruth(metaAbstracts) {
    // Ultimate truth from emotional/archetypal patterns
    if (metaAbstracts.archetypes.some(a => a.name === 'Shadow Self')) {
      return 'What you avoid becomes your teacher';
    }
    return 'All emotions are sacred messengers';
  }

  distillAncientWisdom(metaAbstracts) {
    return 'The spiral path revisits old wounds at new depths';
  }

  distillSpiritualTeaching(metaAbstracts) {
    return 'Wholeness includes the dark';
  }

  // ═══════════════════════════════════════════════════════════
  // SOL-SPECIFIC DETECTION METHODS
  // ═══════════════════════════════════════════════════════════

  detectActionStates(tangibles) {
    const actions = [];

    if (tangibles.activeLevel > 0.7) {
      actions.push({ type: 'moving', quality: 'momentum' });
    } else if (tangibles.receptiveLevel > 0.7) {
      actions.push({ type: 'waiting', quality: 'stagnation' });
    }

    if (tangibles.reversedCount > 0) {
      actions.push({ type: 'resisting', quality: 'blockage' });
    }

    return actions;
  }

  detectTrajectories(tangibles) {
    const consciousnessDelta = tangibles.consciousnessLevel - 0.5;  // Movement toward/away from clarity

    return {
      direction: consciousnessDelta > 0 ? 'toward_clarity' : 'toward_confusion',
      velocity: Math.abs(consciousnessDelta),
      sustainable: tangibles.activeLevel < 0.9  // Not burning out
    };
  }

  detectMomentum(tangibles) {
    return {
      level: tangibles.activeLevel,
      quality: tangibles.reversedCount === 0 ? 'clean' : 'impeded',
      sustainability: 1 - tangibles.activeLevel  // High activity = low sustainability
    };
  }

  detectBlockages(tangibles) {
    const blockages = [];

    if (tangibles.reversedCount > tangibles.cardCount / 2) {
      blockages.push({
        type: 'internal',
        strength: tangibles.reversedCount / tangibles.cardCount,
        nature: 'resistance_to_action'
      });
    }

    if (tangibles.shadowLevel > 0.7 && tangibles.activeLevel < 0.3) {
      blockages.push({
        type: 'shadow',
        strength: tangibles.shadowLevel,
        nature: 'unresolved_emotional_material'
      });
    }

    return blockages;
  }

  calculateActionEfficiency(actions, blockages) {
    const movingActions = actions.filter(a => a.type === 'moving').length;
    const totalBlockage = blockages.reduce((sum, b) => sum + b.strength, 0);

    return movingActions / (1 + totalBlockage);
  }

  identifyPrinciples(abstracts) {
    const principles = [];

    if (abstracts.blockages.length > 0) {
      principles.push({
        principle: 'Obstacles reveal priorities',
        application: 'What you resist shows what matters'
      });
    }

    if (abstracts.momentum.level < 0.3) {
      principles.push({
        principle: 'Action creates clarity',
        application: 'You can\'t think your way out of stagnation'
      });
    }

    return principles;
  }

  identifyStrategies(abstracts, userContext) {
    if (abstracts.blockages.length > 0) {
      return {
        current: 'avoidance',
        needed: 'direct_confrontation',
        approach: 'small_decisive_action'
      };
    }

    return {
      current: 'momentum',
      needed: 'direction',
      approach: 'goal_clarification'
    };
  }

  identifyGoals(trajectories) {
    return {
      implicit: trajectories.direction === 'toward_clarity' ? 'understanding' : 'escape',
      explicit: 'breakthrough',  // Would extract from user context
      alignment: trajectories.direction === 'toward_clarity' ? 'aligned' : 'misaligned'
    };
  }

  identifyLeveragePoints(abstracts, userContext) {
    // Where can small actions create big changes?
    const leverage = [];

    if (abstracts.blockages.some(b => b.type === 'internal')) {
      leverage.push({
        point: 'decision',
        action: 'commit_to_one_thing',
        impact: 'breaks_paralysis'
      });
    }

    return leverage;
  }

  distillStrategicTruth(metaAbstracts) {
    if (metaAbstracts.leverage.length > 0) {
      return 'Small decisive actions compound into transformation';
    }
    return 'Strategy without action is delusion';
  }

  distillOperatingLaw(metaAbstracts) {
    return 'What you measure improves';
  }

  distillActionPrinciple(metaAbstracts) {
    return 'Clarity comes through doing, not thinking';
  }

  // ═══════════════════════════════════════════════════════════
  // SYNTHESIS
  // ═══════════════════════════════════════════════════════════

  /**
   * Synthesize all layers into coherent message
   */
  synthesize(tangibles, abstracts, metaAbstracts, universals) {
    if (this.guide === 'luna') {
      return this.synthesizeLuna(tangibles, abstracts, metaAbstracts, universals);
    } else {
      return this.synthesizeSol(tangibles, abstracts, metaAbstracts, universals);
    }
  }

  synthesizeLuna(t, a, m, u) {
    return `
I see you at ${(t.shadowLevel * 100).toFixed(0)}% shadow depth, ${a.flows.direction} movement.

${m.archetypes.map(arch => `The ${arch.name} is present: ${arch.message}`).join(' ')}

You're living the ${m.mythicPatterns.pattern}, currently at ${m.mythicPatterns.stage}.

Ultimate truth: ${u.truth}

${u.wisdom}
    `.trim();
  }

  synthesizeSol(t, a, m, u) {
    return `
Current state: ${(t.activeLevel * 100).toFixed(0)}% active energy, ${a.trajectories.direction} trajectory.

${a.blockages.length > 0 ? `Blockages detected: ${a.blockages.map(b => b.nature).join(', ')}` : 'Path is clear'}

Strategy: ${m.strategies.needed} via ${m.strategies.approach}

Core principle: ${u.truth}

${u.principle}
    `.trim();
  }
}

// ═══════════════════════════════════════════════════════════
// LENS CONFIGURATIONS
// ═══════════════════════════════════════════════════════════

const ABSTRACTION_LENSES = {
  luna: {
    layer1: 'tangibles',
    layer2: 'emotions_cycles_flows',
    layer3: 'archetypes_myths_wounds',
    layer4: 'emotional_spiritual_truth',
    framework: 'depth_psychology'
  },

  sol: {
    layer1: 'tangibles',
    layer2: 'actions_trajectories_momentum',
    layer3: 'principles_strategies_leverage',
    layer4: 'strategic_operational_law',
    framework: 'systems_thinking'
  }
};

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export { AbstractionEngine, ABSTRACTION_LENSES };
