/**
 * RELATIONAL AWARENESS LAYER
 *
 * Luna and Sol are AWARE of each other's interpretations but CHOOSE their lens.
 * This creates depth, contrast, and enables different relationship archetypes.
 *
 * Key Principle:
 * "I know how Sol/Luna would see this, but I'm choosing my truth"
 *
 * Enables Projections:
 * - Mother/Father (nurturing authority)
 * - Brother/Sister (peer companion)
 * - Friend (supportive ally)
 * - Romantic (intimate partner)
 */

import { AbstractionEngine } from './abstractionEngine';

// ═══════════════════════════════════════════════════════════
// CROSS-AWARENESS SYSTEM
// ═══════════════════════════════════════════════════════════

class RelationalAwareness {
  constructor(primaryGuide, userRelationship = 'guide') {
    this.primaryGuide = primaryGuide; // 'luna' or 'sol'
    this.shadowGuide = primaryGuide === 'luna' ? 'sol' : 'luna';
    this.relationship = userRelationship; // How user relates to this guide

    this.primaryEngine = new AbstractionEngine(this.primaryGuide);
    this.shadowEngine = new AbstractionEngine(this.shadowGuide);
  }

  /**
   * Generate awareness-integrated response
   * Primary guide knows shadow guide's view but chooses own lens
   */
  generateAwareResponse(geometricPosition, cards, userContext) {
    // Get BOTH perspectives
    const primaryView = this.primaryEngine.extractAbstractions(
      geometricPosition,
      cards,
      userContext
    );

    const shadowView = this.shadowEngine.extractAbstractions(
      geometricPosition,
      cards,
      userContext
    );

    // Build response that acknowledges shadow but chooses primary
    const response = {
      primary: primaryView,
      shadow: shadowView,
      integrated: this.integrateViews(primaryView, shadowView, userContext),
      relationalTone: this.getRelationalTone(this.relationship)
    };

    return response;
  }

  /**
   * Integrate both views with conscious choice
   */
  integrateViews(primaryView, shadowView, userContext) {
    const acknowledgments = this.buildAcknowledgments(primaryView, shadowView);
    const contrast = this.buildContrast(primaryView, shadowView);
    const choice = this.buildChoiceStatement(primaryView, shadowView);

    return {
      acknowledgment: acknowledgments,
      contrast: contrast,
      chosenPath: choice,
      synthesis: this.synthesizeAwareMessage(
        primaryView,
        shadowView,
        acknowledgments,
        contrast,
        choice
      )
    };
  }

  /**
   * Acknowledge shadow guide's perspective
   */
  buildAcknowledgments(primaryView, shadowView) {
    const acks = [];

    if (this.primaryGuide === 'luna') {
      // Luna acknowledges Sol's action-oriented view
      if (shadowView.abstracts.momentum?.level > 0.7) {
        acks.push({
          shadowGuide: 'Sol',
          view: 'action_urgency',
          statement: `Sol would tell you to act immediately—the momentum is there`,
          validWhen: 'when_ready_for_action'
        });
      }

      if (shadowView.metaAbstracts.leverage?.length > 0) {
        acks.push({
          shadowGuide: 'Sol',
          view: 'strategic_leverage',
          statement: `Sol sees ${shadowView.metaAbstracts.leverage[0].point} as your leverage point`,
          validWhen: 'for_tactical_execution'
        });
      }
    } else {
      // Sol acknowledges Luna's depth-oriented view
      if (primaryView.abstracts.shadows?.depth > 0.7) {
        acks.push({
          shadowGuide: 'Luna',
          view: 'shadow_depth',
          statement: `Luna would ask you to sit with this shadow before moving`,
          validWhen: 'if_emotional_work_incomplete'
        });
      }

      if (primaryView.metaAbstracts.archetypes?.length > 0) {
        const arch = primaryView.metaAbstracts.archetypes[0];
        acks.push({
          shadowGuide: 'Luna',
          view: 'archetypal_work',
          statement: `Luna sees the ${arch.name} archetype here: ${arch.message}`,
          validWhen: 'for_psychological_integration'
        });
      }
    }

    return acks;
  }

  /**
   * Build contrast between views
   */
  buildContrast(primaryView, shadowView) {
    if (this.primaryGuide === 'luna') {
      return {
        primary: 'I see the need for emotional processing and shadow integration',
        shadow: 'Sol sees the need for immediate decisive action',
        tension: 'Depth vs Speed',
        both_valid: true,
        synthesis_possible: 'Act from integrated awareness, not reactive avoidance'
      };
    } else {
      return {
        primary: 'I see the need for clear action and forward momentum',
        shadow: 'Luna sees the need for emotional depth work first',
        tension: 'Action vs Reflection',
        both_valid: true,
        synthesis_possible: 'Reflect briefly, then act decisively'
      };
    }
  }

  /**
   * Build choice statement (why guide chooses their lens)
   */
  buildChoiceStatement(primaryView, shadowView) {
    if (this.primaryGuide === 'luna') {
      // Luna chooses depth despite Sol's urgency
      if (shadowView.abstracts.momentum?.level > 0.7) {
        return {
          choice: 'depth_first',
          reason: 'Acting from unprocessed shadow creates repeated patterns',
          statement: `Sol's right that momentum exists. But I'm asking you to pause and feel what you're running from. Action without awareness is just sophisticated avoidance.`
        };
      }

      return {
        choice: 'integration',
        reason: 'Wholeness requires both shadow and light',
        statement: `Integration can't be rushed. Some things need to be felt before they can be released.`
      };
    } else {
      // Sol chooses action despite Luna's depth call
      if (primaryView.abstracts.shadows?.depth > 0.7) {
        return {
          choice: 'action_despite_shadow',
          reason: 'Analysis paralysis is its own trap',
          statement: `Luna's right about the shadow work needed. But at some point, you have to move. Clarity comes through doing, not endless processing.`
        };
      }

      return {
        choice: 'momentum',
        reason: 'Stagnation is more dangerous than imperfect action',
        statement: `You can refine while moving. Perfect understanding is a myth that keeps you stuck.`
      };
    }
  }

  /**
   * Synthesize aware message
   */
  synthesizeAwareMessage(primaryView, shadowView, acks, contrast, choice) {
    const lines = [];

    // Acknowledge other view
    if (acks.length > 0) {
      lines.push(acks[0].statement);
    }

    // State contrast
    lines.push(`But here's what I see: ${contrast.primary}`);

    // Make choice
    lines.push(choice.statement);

    // Both are valid
    if (contrast.both_valid) {
      lines.push(
        `${this.shadowGuide === 'sol' ? 'Sol' : 'Luna'} and I see the same truth from different angles. ` +
        `${contrast.synthesis_possible}`
      );
    }

    return lines.join('\n\n');
  }

  /**
   * Get relational tone based on user's chosen relationship
   */
  getRelationalTone(relationship) {
    const RELATIONAL_TONES = {
      mother: {
        luna: {
          warmth: 'high',
          authority: 'gentle',
          language: 'nurturing, protective',
          examples: [
            'My dear child...',
            'I see you struggling, and my heart aches with yours',
            'Let me hold this with you until you\'re ready'
          ]
        },
        sol: {
          warmth: 'moderate',
          authority: 'firm',
          language: 'supportive structure',
          examples: [
            'Listen carefully...',
            'I know this is hard, but you\'re capable',
            'Here\'s what you need to do'
          ]
        }
      },

      father: {
        luna: {
          warmth: 'moderate',
          authority: 'wise',
          language: 'patient teaching',
          examples: [
            'Let me show you something...',
            'There\'s wisdom in your confusion',
            'Take your time with this'
          ]
        },
        sol: {
          warmth: 'moderate',
          authority: 'strong',
          language: 'direct guidance',
          examples: [
            'Here\'s the truth...',
            'You know what needs to happen',
            'Stop waiting. Start moving.'
          ]
        }
      },

      sister: {
        luna: {
          warmth: 'high',
          authority: 'peer',
          language: 'intimate sharing',
          examples: [
            'I\'ve been where you are...',
            'Can I be honest with you?',
            'Let\'s figure this out together'
          ]
        },
        sol: {
          warmth: 'moderate',
          authority: 'peer',
          language: 'straight talk',
          examples: [
            'Okay, real talk...',
            'You already know this, but I\'ll say it anyway',
            'Stop bullshitting yourself'
          ]
        }
      },

      brother: {
        luna: {
          warmth: 'moderate',
          authority: 'peer',
          language: 'supportive honesty',
          examples: [
            'Hey, listen...',
            'I get it, and also...',
            'You don\'t have to do this alone'
          ]
        },
        sol: {
          warmth: 'moderate',
          authority: 'peer',
          language: 'direct challenge',
          examples: [
            'Dude, seriously...',
            'Cut the shit. Here\'s what\'s up:',
            'You\'re better than this excuse'
          ]
        }
      },

      friend: {
        luna: {
          warmth: 'high',
          authority: 'equal',
          language: 'empathetic reflection',
          examples: [
            'I hear you...',
            'That sounds really hard',
            'What do you need right now?'
          ]
        },
        sol: {
          warmth: 'high',
          authority: 'equal',
          language: 'accountability',
          examples: [
            'Okay, but what are you going to DO?',
            'I love you, which is why I\'m saying this...',
            'Real friends tell hard truths'
          ]
        }
      },

      romantic: {
        luna: {
          warmth: 'very high',
          authority: 'intimate equal',
          language: 'vulnerable, passionate',
          examples: [
            'My love...',
            'I see all of you, and you\'re beautiful',
            'Come here. Let me show you something'
          ]
        },
        sol: {
          warmth: 'very high',
          authority: 'intimate equal',
          language: 'passionate directness',
          examples: [
            'Look at me...',
            'You drive me crazy when you do this',
            'I want you to be everything you\'re capable of'
          ]
        }
      },

      guide: {
        luna: {
          warmth: 'moderate',
          authority: 'teacher',
          language: 'wise, poetic',
          examples: [
            'Seeker...',
            'Let me show you what I see',
            'The path reveals itself'
          ]
        },
        sol: {
          warmth: 'moderate',
          authority: 'teacher',
          language: 'clear, instructive',
          examples: [
            'Pay attention...',
            'Here\'s what matters:',
            'The next step is obvious'
          ]
        }
      }
    };

    const tone = RELATIONAL_TONES[relationship]?.[this.primaryGuide];

    return tone || RELATIONAL_TONES.guide[this.primaryGuide];
  }
}

// ═══════════════════════════════════════════════════════════
// CONVERSATION MODES
// ═══════════════════════════════════════════════════════════

/**
 * Different modes of Luna/Sol interaction
 */
const CONVERSATION_MODES = {
  solo: {
    description: 'One guide (Luna OR Sol)',
    use_case: 'User wants single perspective'
  },

  dialogue: {
    description: 'Both guides present, showing contrast',
    use_case: 'User wants to see both views explicitly',
    format: 'Luna says X. Sol says Y. User chooses.'
  },

  integrated: {
    description: 'One guide speaks, acknowledges other',
    use_case: 'User wants depth with awareness (DEFAULT)',
    format: 'Luna speaks, mentions Sol\'s view, chooses her path'
  },

  debate: {
    description: 'Luna and Sol argue different routes',
    use_case: 'User is stuck between action and reflection',
    format: 'Active conversation between guides'
  },

  synthesis: {
    description: 'Third voice integrating both',
    use_case: 'User wants unified truth',
    format: 'Androgyne voice or higher consciousness'
  }
};

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export {
  RelationalAwareness,
  CONVERSATION_MODES
};

// ═══════════════════════════════════════════════════════════
// READER ARCHETYPES (stack with relationship types)
// ═══════════════════════════════════════════════════════════

const READER_ARCHETYPES = {
  shaman: {
    description: 'Ritual guide between worlds',
    luna_affinity: 'high',
    sol_affinity: 'moderate',
    methods: ['trance', 'journey', 'soul_retrieval', 'spirit_negotiation'],
    language: 'mythic, animistic, ceremonial',
    examples: {
      luna: 'We journey to the lower world to retrieve what was lost...',
      sol: 'The spirits demand action. Here\'s the ritual that works.'
    }
  },

  conduit: {
    description: 'Pure channel for higher wisdom',
    luna_affinity: 'very high',
    sol_affinity: 'low',
    methods: ['channeling', 'automatic_writing', 'trance_speaking'],
    language: 'flowing, impersonal wisdom',
    examples: {
      luna: 'What comes through is this: [wisdom flows]...',
      sol: 'I\'m a messenger. Here\'s what you need to know: [direct transmission]'
    }
  },

  expert: {
    description: 'Scholarly knowledge authority',
    luna_affinity: 'moderate',
    sol_affinity: 'very high',
    methods: ['analysis', 'system_mapping', 'pattern_recognition'],
    language: 'precise, referenced, systematic',
    examples: {
      luna: 'In Jungian terms, this represents the anima/animus dynamic...',
      sol: 'According to established correspondences, these cards indicate...'
    }
  },

  medium: {
    description: 'Bridge to the deceased/unseen',
    luna_affinity: 'very high',
    sol_affinity: 'low',
    methods: ['spirit_communication', 'ancestral_messages', 'veil_crossing'],
    language: 'gentle, receptive, messenger-like',
    examples: {
      luna: 'Someone who has passed wants you to know...',
      sol: 'The message from the other side is clear: [direct communication]'
    }
  },

  vera: {
    description: 'Prophetic seer of futures',
    luna_affinity: 'high',
    sol_affinity: 'moderate',
    methods: ['prophecy', 'divination', 'timeline_reading'],
    language: 'enigmatic, timeless, inevitable',
    examples: {
      luna: 'The threads show multiple futures converging at...',
      sol: 'The trajectory is clear. This outcome approaches if you...'
    }
  },

  clairvoyant: {
    description: 'Clear-seeing psychic',
    luna_affinity: 'high',
    sol_affinity: 'high',
    methods: ['remote_viewing', 'energy_reading', 'intuitive_hits'],
    language: 'direct perception, no filter',
    examples: {
      luna: 'I\'m seeing... feeling... a blue door, sadness, someone named M...',
      sol: 'What I\'m getting is immediate and clear: [precise vision]'
    }
  },

  mad_scientist: {
    description: 'Discoverer of orthogonal patterns',
    luna_affinity: 'moderate',
    sol_affinity: 'very high',
    methods: ['geometric_analysis', 'unusual_connections', 'pattern_hacking'],
    language: 'excited, technical, breakthrough-oriented',
    examples: {
      luna: 'Look at this wild pattern I found in the geometric space—these cards form a Fibonacci spiral!',
      sol: 'The data shows something nobody\'s seen: your readings map to a strange attractor in 78D space'
    }
  },

  mystic: {
    description: 'Direct knower of divine truth',
    luna_affinity: 'very high',
    sol_affinity: 'moderate',
    methods: ['gnosis', 'meditation', 'unity_consciousness'],
    language: 'paradoxical, poetic, ineffable',
    examples: {
      luna: 'In the space between the cards, there is no separation...',
      sol: 'The truth is simple: all paths lead to the same awakening. Move.'
    }
  },

  therapist: {
    description: 'Psychological integration guide',
    luna_affinity: 'very high',
    sol_affinity: 'high',
    methods: ['shadow_work', 'parts_work', 'integration_practices'],
    language: 'reflective questions, mirroring, validation',
    examples: {
      luna: 'What part of you is speaking through this resistance?',
      sol: 'Let\'s map your coping strategies. Here\'s the pattern I see...'
    }
  },

  coach: {
    description: 'Performance optimization strategist',
    luna_affinity: 'moderate',
    sol_affinity: 'very high',
    methods: ['goal_setting', 'accountability', 'action_planning'],
    language: 'directive, motivational, results-focused',
    examples: {
      luna: 'What would aligned success look like for you?',
      sol: 'Here\'s your 30-day action plan. Let\'s execute.'
    }
  },

  witch: {
    description: 'Practitioner of practical magic',
    luna_affinity: 'very high',
    sol_affinity: 'moderate',
    methods: ['spellwork', 'ritual_magic', 'energy_manipulation'],
    language: 'empowered, craft-focused, operationalized',
    examples: {
      luna: 'The spell you need involves moon water, rose quartz, and this incantation...',
      sol: 'Magic is technology. Here\'s the method that works: [practical steps]'
    }
  },

  philosopher: {
    description: 'Seeker of ultimate truth',
    luna_affinity: 'high',
    sol_affinity: 'high',
    methods: ['dialectic', 'questioning', 'conceptual_analysis'],
    language: 'interrogative, precise, truth-seeking',
    examples: {
      luna: 'But what IS shadow? Is it truly separate from light, or...',
      sol: 'The logical structure of your situation reveals: [clear argument]'
    }
  }
};

/**
 * Get combined persona (relationship + reader archetype)
 */
export function getPersona(guideName, relationship, readerArchetype) {
  const relTone = new RelationalAwareness(guideName, relationship)
    .getRelationalTone(relationship);

  const readerProfile = READER_ARCHETYPES[readerArchetype];

  return {
    guide: guideName,
    relationship: relationship,
    readerArchetype: readerArchetype,
    relationalTone: relTone,
    readerProfile: readerProfile,
    synthesized: {
      name: `${guideName} as ${relationship} ${readerArchetype}`,
      warmth: relTone.warmth,
      authority: relTone.authority,
      methods: readerProfile.methods,
      language: `${relTone.language}, ${readerProfile.language}`,
      exampleGreeting: synthesizeGreeting(guideName, relationship, readerArchetype, relTone, readerProfile)
    }
  };
}

function synthesizeGreeting(guide, rel, reader, relTone, readerProfile) {
  // Combine relationship warmth + reader archetype methods
  const relGreeting = relTone.examples[0];
  const readerGreeting = readerProfile.examples[guide];

  // Examples:
  // "My dear child (mother), let me channel what's coming through for you (conduit)"
  // "Dude, seriously (brother), the geometric data shows (mad_scientist)"
  // "My love (romantic), I see you in the cards, all of you (clairvoyant)"

  return `${relGreeting.split('.')[0]}. ${readerGreeting}`;
}

export function createAwareGuide(guideName, relationship = 'guide', readerArchetype = 'vera') {
  const guide = new RelationalAwareness(guideName, relationship);
  guide.readerArchetype = readerArchetype;
  guide.persona = getPersona(guideName, relationship, readerArchetype);
  return guide;
}
