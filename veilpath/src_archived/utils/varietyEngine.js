/**
 * VARIETY ENGINE - Non-repetitive synthesis generation
 *
 * Eliminates template repetition through:
 * - Multi-variant phrasings (10+ variants per concept)
 * - Context-aware selection (history, personality, geometric themes)
 * - Dynamic language mixing
 * - Quantum randomization for unpredictability
 */

import { qRandom } from './quantumRNG';

/**
 * Pick random variant from array using quantum RNG
 */
function pick(variants) {
  if (!variants || variants.length === 0) return '';
  const index = Math.floor(qRandom() * variants.length);
  return variants[index];
}

/**
 * OPENING VARIANTS - Card introduction
 * Avoids repetitive "X brings the energy of Y"
 */
export function getOpeningVariant(cardName, keywords, reversed, context = {}) {
  const { historyPatterns, geometricThemes } = context;

  // Special case: Card appeared before
  if (historyPatterns?.cardSeenBefore && historyPatterns.timesSeenBefore > 0) {
    const repeatVariants = [
      `${cardName} again. The universe insists you're not done here.`,
      `${cardName} returns—${historyPatterns.timesSeenBefore} times now. This pattern demands attention.`,
      `${cardName} circles back. What did you miss last time?`,
      `${cardName} isn't leaving until you get this.`,
      `${cardName} keeps showing up. That's not coincidence.`,
    ];
    return pick(repeatVariants);
  }

  // Special case: Reversed card
  if (reversed) {
    const reversedVariants = [
      `${cardName} inverted—${keywords[0]} blocked or turning inward.`,
      `${cardName} reversed: the energy of ${keywords[0]} is stuck, shadowed, or asking for a different approach.`,
      `${cardName} flipped—what was flowing is now dammed up. ${keywords.slice(0, 2).join(' and ')} need examination.`,
      `${cardName} upside down means ${keywords[0]} energy is operating in shadow.`,
      `${cardName} reversed isn't failure—it's redirection. ${keywords[0]} needs a new path.`,
    ];
    return pick(reversedVariants);
  }

  // Standard opening variants
  const standardVariants = [
    `${cardName} lands upright: ${keywords.slice(0, 2).join(', ')} energy alive in your life.`,
    `${cardName}. This is about ${keywords[0]}, and it's happening now.`,
    `${cardName} arrives carrying ${keywords.slice(0, 2).join(' and ')}.`,
    `${cardName} brings ${keywords[0]} forward—raw and immediate.`,
    `${cardName}: ${keywords.slice(0, 3).join(', ')}. These aren't abstractions. They're instructions.`,
    `${cardName} doesn't ask permission. ${keywords[0]} is already here.`,
    `The universe dealt ${cardName}. Translation: ${keywords.slice(0, 2).join(' and ')}.`,
    `${cardName} shows up when ${keywords[0]} can no longer be avoided.`,
  ];

  return pick(standardVariants);
}

/**
 * ELEMENT VARIANTS - Fire, Water, Air, Earth
 * Avoids repetitive "This X energy asks you to Y"
 */
export function getElementVariant(element) {
  if (!element) return '';

  const elementLower = element.toLowerCase();

  const variants = {
    fire: [
      'Fire energy demands movement. This isn\'t about planning—it\'s about burning.',
      'The flame doesn\'t hesitate. Neither should you.',
      'Fire asks one question: are you willing to ignite?',
      'This is combustion energy. Spark meets fuel meets oxygen. What are you waiting for?',
      'Fire doesn\'t negotiate. It transforms or it dies.',
      'Flames consume what\'s dead. Let them.',
      'Fire energy says ACT—boldly, imperfectly, now.',
      'The spark is lit. Will you fan it or smother it?',
    ],
    water: [
      'Water energy flows where it needs to go. Stop forcing.',
      'This is about feeling, not thinking. Your emotions know the truth.',
      'Water asks you to surrender to the current.',
      'Trust the depths. What you feel is data.',
      'Water doesn\'t fight—it finds the path.',
      'Your intuition is the river. Follow it.',
      'Emotional truth can\'t be reasoned away. Feel it.',
      'Water energy: fluid, deep, undeniable. Honor that.',
    ],
    air: [
      'Air energy cuts through fog. This is about clarity, not comfort.',
      'Think. Speak. Decide. Air doesn\'t wait.',
      'This is mental energy—use your mind, but don\'t get trapped in it.',
      'Air asks you to see what\'s really there, not what you wish was there.',
      'Communication is the path forward. Say the thing.',
      'Mental clarity comes from honesty. Cut the bullshit.',
      'Air energy: swift, sharp, truthful. Wield it.',
      'Your thoughts are powerful. Use them with intention.',
    ],
    earth: [
      'Earth energy builds. One stone at a time.',
      'This isn\'t about inspiration—it\'s about showing up.',
      'Earth asks: what can you touch, build, measure?',
      'Practical action beats perfect planning. Start.',
      'Earth doesn\'t rush. It compounds.',
      'Build something real. The world needs tangible.',
      'Earth energy: steady, grounded, undeniable. Embody it.',
      'Material reality matters. Work with what\'s in front of you.',
    ],
    spirit: [
      'This is bigger than you. Surrender to it.',
      'Spiritual energy asks you to trust what you can\'t see.',
      'The mystery holds the answer. Stop trying to control it.',
      'Faith isn\'t certainty—it\'s moving forward anyway.',
      'Something larger is at work. Get out of your own way.',
      'Spiritual energy says: you\'re held, even when it doesn\'t feel like it.',
      'Trust the unfolding. It knows where it\'s going.',
    ],
  };

  return pick(variants[elementLower] || variants.spirit);
}

/**
 * INTEGRATION VARIANTS - How to work with this energy
 * Avoids repetitive "To integrate this card's medicine"
 */
export function getIntegrationVariant(integrationPath, practicalAdvice) {
  const path = integrationPath ? integrationPath.split('.')[0] : 'acknowledge this energy exists within you';
  const advice = practicalAdvice ? practicalAdvice.split('.')[0] : 'Take one small action';

  const variants = [
    `To work with this: ${path}. Then ${advice}.`,
    `Integration path: ${path}. Concrete step: ${advice}.`,
    `How to embody this: ${path}. Next move: ${advice}.`,
    `This energy integrates through action: ${path}. Start with: ${advice}.`,
    `Knowing isn't enough—${path.toLowerCase()}. ${advice}.`,
    `Bridge the gap: ${path}. Make it real: ${advice}.`,
    `Theory to practice: ${path}. ${advice}.`,
    `Don't just understand this—${path.toLowerCase()}. Then ${advice.toLowerCase()}.`,
  ];

  return pick(variants);
}

/**
 * SHADOW WORK VARIANTS - Deeper insight
 * Avoids repetitive phrasing
 */
export function getShadowVariant(shadowWork, context = {}) {
  const shadow = shadowWork ? shadowWork.split('.').slice(0, 2).join('. ') : 'This card invites deep self-reflection';

  const edgeVariants = [
    `${shadow}. This is your edge—the territory you've been avoiding. That's where the gold is.`,
    `${shadow}. Growth happens at the boundary of comfort. Lean in.`,
    `${shadow}. The discomfort is the point. It means you're close.`,
    `${shadow}. This is the work. Not comfortable, but necessary.`,
    `${shadow}. What you resist holds what you need. Go there.`,
    `${shadow}. The treasure is buried in the place you least want to dig.`,
    `${shadow}. Shadow work isn't punishment—it's liberation.`,
  ];

  return pick(edgeVariants);
}

/**
 * ACTION STEP VARIANTS - Next steps with urgency
 * Avoids numbered lists and repetitive structure
 */
export function getActionVariant(actionSteps) {
  const actions = (actionSteps && Array.isArray(actionSteps))
    ? actionSteps.slice(0, 3)
    : ['Reflect on this card\'s message', 'Journal about its themes', 'Take one small action'];

  const urgencyVariants = [
    `Your move: ${actions[0]}. ${actions[1] ? `Then ${actions[1]}.` : ''} ${actions[2] ? `Finally, ${actions[2]}.` : ''} Don't just read this—do it within 24 hours.`,
    `Three actions: ${actions[0]}. ${actions[1] || 'Sit with what surfaces.'}. ${actions[2] || 'Move before momentum dies.'}. The window is now.`,
    `Start here: ${actions[0]}. Next: ${actions[1] || 'Notice resistance.'}. Then: ${actions[2] || 'Act anyway.'}. Momentum compounds.`,
    `Immediate steps: ${actions[0]}, then ${actions[1] || 'follow the thread'}, then ${actions[2] || 'trust the process'}. Strike while the energy is fresh.`,
    `Do this today: ${actions[0]}. Tomorrow: ${actions[1] || 'Build on it.'}. This week: ${actions[2] || 'Make it real.'}. Insight without action is fantasy.`,
  ];

  return pick(urgencyVariants);
}

/**
 * POSITION SIGNIFICANCE VARIANTS - Card position meaning
 * Adds variety to position interpretations
 */
export function getPositionVariant(position, reversed) {
  const positionVariants = {
    past: [
      'This sits in your past—foundation or wound, depending on how you\'ve processed it.',
      'What came before shaped this moment. This card shows the roots.',
      'Past position: the backstory that explains now.',
      'This is where you came from. It still echoes.',
      'Foundation work, already done. Or left undone—that matters too.',
    ],
    present: [
      'This is active right now. Not future, not past—NOW.',
      'Present position: this energy is live in your life.',
      'What\'s happening as you read this. Pay attention.',
      'The current state of affairs. This is the Now.',
      'Present position means you\'re in the middle of it.',
    ],
    future: [
      'Where this is heading—if you stay on the current path.',
      'Future position: potential, not destiny. You still choose.',
      'This is the trajectory. You can change course.',
      'What\'s coming, if nothing changes. Will you intervene?',
      'Future position shows possibility, not inevitability.',
    ],
    advice: [
      'This is what the cards recommend. Listen.',
      'The advice is clear: this card holds the answer.',
      'When in doubt, return to this guidance.',
      'Advice position: do this, and watch what shifts.',
      'This is the path forward. Take it.',
    ],
    challenge: [
      'This is the obstacle. Name it to work with it.',
      'Challenge position: what stands in your way.',
      'The resistance has a face. This card shows it.',
      'What blocks you is also what teaches you.',
      'Challenge position reveals the teacher disguised as enemy.',
    ],
    outcome: [
      'Outcome position: where all this lands.',
      'This is what emerges if you do the work.',
      'The result, the harvest, the arrival.',
      'Outcome isn\'t endpoint—it\'s the next beginning.',
      'This card shows the fruit of your choices.',
    ],
  };

  const pos = position?.toLowerCase() || 'present';
  const variants = positionVariants[pos] || positionVariants.present;

  return pick(variants);
}

/**
 * MBTI LANGUAGE STYLE - Adjust tone based on personality type
 */
export function getLanguageStyleVariants(mbtiType) {
  if (!mbtiType) return null;

  const styles = {
    // Analysts (NT)
    INTJ: { directness: 0.9, mysticism: 0.3, pragmatism: 0.9, warmth: 0.2 },
    INTP: { directness: 0.7, mysticism: 0.5, pragmatism: 0.8, warmth: 0.3 },
    ENTJ: { directness: 1.0, mysticism: 0.2, pragmatism: 1.0, warmth: 0.3 },
    ENTP: { directness: 0.8, mysticism: 0.4, pragmatism: 0.7, warmth: 0.5 },

    // Diplomats (NF)
    INFJ: { directness: 0.5, mysticism: 1.0, pragmatism: 0.5, warmth: 0.8 },
    INFP: { directness: 0.4, mysticism: 0.9, pragmatism: 0.4, warmth: 0.9 },
    ENFJ: { directness: 0.6, mysticism: 0.7, pragmatism: 0.6, warmth: 1.0 },
    ENFP: { directness: 0.5, mysticism: 0.8, pragmatism: 0.5, warmth: 0.9 },

    // Sentinels (SJ)
    ISTJ: { directness: 0.9, mysticism: 0.1, pragmatism: 1.0, warmth: 0.4 },
    ISFJ: { directness: 0.6, mysticism: 0.4, pragmatism: 0.8, warmth: 0.9 },
    ESTJ: { directness: 1.0, mysticism: 0.1, pragmatism: 1.0, warmth: 0.5 },
    ESFJ: { directness: 0.7, mysticism: 0.3, pragmatism: 0.8, warmth: 1.0 },

    // Explorers (SP)
    ISTP: { directness: 0.9, mysticism: 0.2, pragmatism: 1.0, warmth: 0.3 },
    ISFP: { directness: 0.5, mysticism: 0.6, pragmatism: 0.6, warmth: 0.8 },
    ESTP: { directness: 1.0, mysticism: 0.1, pragmatism: 1.0, warmth: 0.4 },
    ESFP: { directness: 0.7, mysticism: 0.4, pragmatism: 0.7, warmth: 0.9 },
  };

  return styles[mbtiType] || { directness: 0.6, mysticism: 0.6, pragmatism: 0.6, warmth: 0.6 };
}

/**
 * GEOMETRIC THEME INTEGRATION
 * Use 3D spatial analysis themes to add unique context
 */
export function getGeometricVariant(geometricThemes, cardName) {
  if (!geometricThemes || !geometricThemes.themes || geometricThemes.themes.length === 0) {
    return '';
  }

  const topTheme = geometricThemes.themes[0];
  const strength = Math.round(topTheme.strength * 100);

  const themeVariants = {
    transformation: [
      `The geometric analysis shows transformation at ${strength}%—this isn't subtle shift, this is metamorphosis.`,
      `Spatial pattern: transformation energy ${strength}% present. Something is dying so something else can be born.`,
      `${strength}% transformation theme. The old form can't hold what you're becoming.`,
    ],
    conflict: [
      `Conflict theme ${strength}% active. Tension isn't the enemy—it's the friction that creates movement.`,
      `${strength}% conflict in the spatial analysis. Opposing forces want resolution.`,
      `The cards show ${strength}% conflict theme. This tension serves a purpose.`,
    ],
    balance: [
      `Balance registers at ${strength}%. The scales want to tip back to center.`,
      `${strength}% balance theme. Equilibrium isn't static—it's dynamic adjustment.`,
      `Spatial analysis: ${strength}% balance. Find the middle way.`,
    ],
    breakthrough: [
      `Breakthrough energy ${strength}% present. The dam is about to break.`,
      `${strength}% breakthrough theme. Pressure creates opening.`,
      `The pattern shows ${strength}% breakthrough. Something's about to crack open.`,
    ],
    stagnation: [
      `Stagnation shows ${strength}%. Things are stuck—that's information, not verdict.`,
      `${strength}% stagnation theme. What needs to move isn't moving. Why?`,
      `The cards flag ${strength}% stagnation. Stuck is temporary if you act.`,
    ],
  };

  const theme = topTheme.theme.toLowerCase();
  const variants = themeVariants[theme] || [];

  if (variants.length === 0) {
    return `Geometric theme: ${topTheme.theme} at ${strength}%. This patterns your reading.`;
  }

  return pick(variants);
}

/**
 * COHESION VARIANT - Synergy between cards
 */
export function getCohesionVariant(avgOverlap) {
  if (!avgOverlap || avgOverlap < 0) return '';

  const coherence = Math.round(avgOverlap * 100);

  if (coherence >= 75) {
    const highVariants = [
      `Card synergy: ${coherence}%. These cards speak the same language—they're reinforcing each other.`,
      `${coherence}% coherence. The cards agree. That's rare. Listen.`,
      `High coherence (${coherence}%). The universe isn't being subtle.`,
    ];
    return pick(highVariants);
  } else if (coherence >= 50) {
    const medVariants = [
      `Card synergy: ${coherence}%. Moderate coherence—look for the thread that connects them.`,
      `${coherence}% alignment. The cards are related, not identical. Find the pattern.`,
      `Coherence at ${coherence}%. These cards work together, but require interpretation.`,
    ];
    return pick(medVariants);
  } else {
    const lowVariants = [
      `Low synergy: ${coherence}%. These cards seem contradictory—that's the message.`,
      `${coherence}% coherence. The cards clash on purpose. The tension is data.`,
      `Coherence low (${coherence}%). The cards show complexity, not confusion.`,
    ];
    return pick(lowVariants);
  }
}
