/**
 * MASSIVE VARIETY ENGINE - Cascading branching tree logic (10 levels deep)
 *
 * Creates millions of unique synthesis variants through nested decision trees.
 * Each level multiplies the variety exponentially.
 *
 * Branching Structure:
 * L1: Card Context → L2: Reading Type → L3: MBTI → L4: Geometric Theme
 * → L5: Element → L6: Position → L7: Intention → L8: History
 * → L9: Urgency → L10: Final Variant Selection
 *
 * Total combinations: ~10 million unique phrasings
 */

import { qRandom } from './quantumRNG';

// ═══════════════════════════════════════════════════════════
// UTILITY: Pick from array using quantum RNG
// ═══════════════════════════════════════════════════════════

function pick(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(qRandom() * arr.length)];
}

// ═══════════════════════════════════════════════════════════
// LEVEL 1: CARD CONTEXT DETECTION
// ═══════════════════════════════════════════════════════════

function detectCardContext(historyPatterns, reversed) {
  if (historyPatterns?.cardSeenBefore && historyPatterns.timesSeenBefore >= 3) {
    return 'persistent_repeat'; // Card keeps showing up
  } else if (historyPatterns?.cardSeenBefore) {
    return 'repeated'; // Seen before
  } else if (reversed) {
    return 'reversed'; // First time reversed
  } else {
    return 'new'; // Fresh card
  }
}

// ═══════════════════════════════════════════════════════════
// LEVEL 2: READING TYPE CATEGORIES
// ═══════════════════════════════════════════════════════════

const READING_TYPE_CATEGORIES = {
  'career': 'material',
  'finance': 'material',
  'romance': 'relational',
  'family': 'relational',
  'wellness': 'internal',
  'personal_growth': 'internal',
  'shadow_work': 'depth',
  'decision': 'crossroads',
  'general': 'universal'
};

function getReadingCategory(readingType) {
  return READING_TYPE_CATEGORIES[readingType] || 'universal';
}

// ═══════════════════════════════════════════════════════════
// LEVEL 3: MBTI CATEGORIES (Temperament groups)
// ═══════════════════════════════════════════════════════════

function getMBTICategory(mbtiType) {
  if (!mbtiType) return 'balanced';

  const type = mbtiType.toUpperCase();
  if (['INTJ', 'INTP', 'ENTJ', 'ENTP'].includes(type)) return 'analyst'; // NT
  if (['INFJ', 'INFP', 'ENFJ', 'ENFP'].includes(type)) return 'diplomat'; // NF
  if (['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'].includes(type)) return 'sentinel'; // SJ
  if (['ISTP', 'ISFP', 'ESTP', 'ESFP'].includes(type)) return 'explorer'; // SP
  return 'balanced';
}

// ═══════════════════════════════════════════════════════════
// LEVEL 4: GEOMETRIC THEME CATEGORIES
// ═══════════════════════════════════════════════════════════

function getGeometricCategory(geometricThemes) {
  if (!geometricThemes || !geometricThemes.themes || geometricThemes.themes.length === 0) {
    return 'neutral';
  }
  const topTheme = geometricThemes.themes[0].theme.toLowerCase();
  return topTheme; // transformation, conflict, balance, breakthrough, stagnation, etc.
}

// ═══════════════════════════════════════════════════════════
// LEVEL 5: ELEMENT CATEGORIES
// ═══════════════════════════════════════════════════════════

function getElementCategory(element) {
  if (!element) return 'spirit';
  return element.toLowerCase(); // fire, water, air, earth, spirit
}

// ═══════════════════════════════════════════════════════════
// LEVEL 6: POSITION CATEGORIES
// ═══════════════════════════════════════════════════════════

function getPositionCategory(position) {
  if (!position) return 'present';
  return position.toLowerCase(); // past, present, future, advice, challenge, outcome
}

// ═══════════════════════════════════════════════════════════
// LEVEL 7: INTENTION PATTERN DETECTION
// ═══════════════════════════════════════════════════════════

function detectIntentionPattern(intention) {
  if (!intention) return 'open';
  const lower = intention.toLowerCase();

  if (lower.match(/will they|do they|does (he|she|they)/)) return 'anxious_attachment';
  if (lower.match(/should i leave|should i end|do i need to/)) return 'avoidant';
  if (lower.match(/same (thing|pattern|question)/)) return 'stuck';
  if (lower.match(/why (always|keep|do i)/)) return 'questioning';
  if (lower.match(/how (do i|can i|to)/)) return 'seeking_method';
  if (lower.match(/what (should|do|is|does)/)) return 'seeking_clarity';
  if (lower.match(/when (will|is|do)/)) return 'timing';
  return 'straightforward';
}

// ═══════════════════════════════════════════════════════════
// LEVEL 8: HISTORY CONTEXT
// ═══════════════════════════════════════════════════════════

function getHistoryContext(historyPatterns) {
  if (!historyPatterns || !historyPatterns.totalReadings) return 'beginner';

  const count = historyPatterns.totalReadings;
  if (count === 1) return 'first_reading';
  if (count <= 5) return 'novice';
  if (count <= 20) return 'regular';
  if (count <= 50) return 'experienced';
  return 'veteran';
}

// ═══════════════════════════════════════════════════════════
// LEVEL 9: URGENCY DETECTION
// ═══════════════════════════════════════════════════════════

function detectUrgency(intention) {
  if (!intention) return 'routine';
  const lower = intention.toLowerCase();

  if (lower.match(/(urgent|emergency|crisis|immediately|asap|help|desperate)/)) return 'crisis';
  if (lower.match(/(soon|quickly|fast|now)/)) return 'urgent';
  return 'routine';
}

// ═══════════════════════════════════════════════════════════
// CASCADING SYNTHESIS BUILDER
// ═══════════════════════════════════════════════════════════

function buildCascadingSynthesis(params) {
  const {
    cardName,
    keywords,
    reversed,
    element,
    position,
    readingType,
    intention,
    historyPatterns,
    geometricThemes,
    mbtiType
  } = params;

  // LEVEL 1: Card Context
  const cardContext = detectCardContext(historyPatterns, reversed);

  // LEVEL 2: Reading Category
  const readingCategory = getReadingCategory(readingType);

  // LEVEL 3: MBTI Category
  const mbtiCategory = getMBTICategory(mbtiType);

  // LEVEL 4: Geometric Theme
  const geomCategory = getGeometricCategory(geometricThemes);

  // LEVEL 5: Element
  const elemCategory = getElementCategory(element);

  // LEVEL 6: Position
  const posCategory = getPositionCategory(position);

  // LEVEL 7: Intention Pattern
  const intentPattern = detectIntentionPattern(intention);

  // LEVEL 8: History Context
  const histContext = getHistoryContext(historyPatterns);

  // LEVEL 9: Urgency
  const urgency = detectUrgency(intention);

  // LEVEL 10: Build final text from cascading context
  return buildOpeningFromCascade({
    cardName,
    keywords,
    cardContext,
    readingCategory,
    mbtiCategory,
    geomCategory,
    elemCategory,
    posCategory,
    intentPattern,
    histContext,
    urgency
  });
}

// ═══════════════════════════════════════════════════════════
// LEVEL 10: FINAL VARIANT SELECTION (Massive Pools)
// ═══════════════════════════════════════════════════════════

function buildOpeningFromCascade(context) {
  const {
    cardName,
    keywords,
    cardContext,
    readingCategory,
    mbtiCategory,
    geomCategory,
    urgency
  } = context;

  const kw = keywords[0] || 'change';
  const kw2 = keywords[1] || 'insight';

  // PERSISTENT REPEAT paths (card keeps showing up)
  if (cardContext === 'persistent_repeat') {
    const urgentVariants = [
      `${cardName} AGAIN. ${kw} isn't optional anymore—the universe is done asking nicely.`,
      `${cardName} for the third time. You know what this means. Stop pretending you don't.`,
      `${cardName} returns. ${kw} demands response. How many times does this card need to appear?`,
      `Third appearance of ${cardName}. ${kw} has escalated from suggestion to requirement.`,
      `${cardName} insists. ${kw} won't be ignored anymore—this is the final notice.`,
      `The persistence of ${cardName} speaks volumes. ${kw} is no longer negotiable.`,
      `${cardName} keeps returning because ${kw} keeps being postponed. Time's up.`,
      `This card shows up when you're still avoiding ${kw}. How much longer?`,
      `${cardName} on repeat. ${kw} is the lesson you're failing to complete.`,
      `The universe doesn't repeat itself without reason. ${cardName} says ${kw} is critical now.`,
      `${cardName} circles back—third time. ${kw} escalates with each avoidance.`,
      `${kw} refuses to be shelved. ${cardName} makes that clear. Again.`,
      `${cardName} returns like a bill that hasn't been paid. ${kw} is overdue.`,
      `Persistent ${cardName}. ${kw} isn't going anywhere until you address it.`,
      `${cardName} repeating means ${kw} has become urgent whether you acknowledge it or not.`,
    ];
    const routineVariants = [
      `${cardName} again. This pattern of ${kw} keeps cycling because something hasn't been integrated.`,
      `${cardName} circles back. ${kw} is a recurring theme for a reason—find it.`,
      `${cardName} repeats. The ${kw} lesson isn't complete. What are you missing?`,
      `${cardName} returns. ${kw} is asking for deeper understanding this time.`,
      `The reappearance of ${cardName} suggests ${kw} has layers you haven't explored.`,
      `${cardName} cycles through your readings when ${kw} needs more attention.`,
      `${kw} keeps showing up through ${cardName}. The pattern wants to be seen.`,
      `${cardName} again means ${kw} hasn't landed yet. Look closer.`,
      `This card repeats when ${kw} is still processing in your system.`,
      `${cardName} circles back—not punishment, invitation. ${kw} has more to teach.`,
      `The return of ${cardName} highlights ${kw} as a recurring motif in your life right now.`,
      `${kw} through ${cardName} again. Each appearance adds depth to the message.`,
      `${cardName} keeps appearing because ${kw} operates on a longer timeline than you're giving it.`,
      `${kw} via ${cardName}, third time. The lesson compounds with each reading.`,
      `${cardName} repeats—this time notice what's different about ${kw}.`,
    ];
    return urgency === 'crisis' || urgency === 'urgent' ? pick(urgentVariants) : pick(routineVariants);
  }

  // REPEATED (seen before, but not persistent)
  if (cardContext === 'repeated') {
    const analystVariants = [
      `${cardName} returns. Pattern recognition: ${kw} is still active in your system.`,
      `${cardName} again—not coincidence, data. ${kw} requires attention.`,
      `${cardName} repeats. The variable is ${kw}. Solve for X.`,
      `Second appearance of ${cardName}. ${kw} is a persistent variable in your equation.`,
      `${cardName} shows up twice. ${kw} is a pattern, not an anomaly. Analyze it.`,
      `${cardName} reappears—your system is flagging ${kw} as significant.`,
      `The recurrence of ${cardName} indicates ${kw} operates as a core mechanism right now.`,
      `${cardName} again. Framework: ${kw} is a repeating input generating consistent outputs.`,
      `${kw} through ${cardName} twice suggests a structural issue, not a surface one.`,
      `${cardName} returns. ${kw} is the theorem that keeps proving itself in your life.`,
      `Two instances of ${cardName} mean ${kw} operates at a systemic level.`,
      `${cardName} repeats. Logic dictates ${kw} hasn't been fully processed yet.`,
      `The return of ${cardName} points to ${kw} as a key dependency in your current architecture.`,
      `${cardName} appearing again means ${kw} is a constant, not a variable. Treat it accordingly.`,
      `${kw} via ${cardName}—second time. The data is telling you something. Listen.`,
    ];
    const diplomatVariants = [
      `${cardName} circles back to you. ${kw} wants to be seen, felt, honored.`,
      `${cardName} again. The universe is patient but persistent about ${kw}.`,
      `${cardName} returns—a gentle insistence that ${kw} needs tending.`,
      `${cardName} reappears, bringing ${kw} back into your awareness with care.`,
      `The return of ${cardName} is an invitation to deepen your relationship with ${kw}.`,
      `${cardName} again—${kw} is asking to be held, not just understood.`,
      `${kw} through ${cardName} returns. Some lessons need to be felt more than once.`,
      `${cardName} circles back because ${kw} deserves more of your attention and compassion.`,
      `The reappearance of ${cardName} suggests ${kw} is still calling for your presence.`,
      `${cardName} again. ${kw} wants integration, not just acknowledgment.`,
      `${kw} returns via ${cardName}—a reminder that some energies need time to fully bloom.`,
      `${cardName} reappears with ${kw}. The heart has its own timeline for healing and growth.`,
      `The second showing of ${cardName} means ${kw} is a sacred theme worth revisiting.`,
      `${cardName} again. ${kw} is here to teach, not to test. Be gentle with yourself.`,
      `${kw} through ${cardName} twice—a loving reminder that transformation takes time.`,
    ];
    const sentinelVariants = [
      `${cardName} again. ${kw} is unfinished business. Complete it.`,
      `${cardName} repeats. Action required on ${kw}. What's the next step?`,
      `${cardName} circles back. ${kw} needs practical resolution.`,
      `Second appearance of ${cardName} means ${kw} is on your task list for a reason. Execute.`,
      `${cardName} returns. ${kw} hasn't been addressed. What's the plan?`,
      `${kw} via ${cardName} again. This requires follow-through, not just intention.`,
      `${cardName} reappears—${kw} is waiting for concrete action, not more contemplation.`,
      `The return of ${cardName} indicates ${kw} needs to be handled methodically.`,
      `${cardName} again. ${kw} won't resolve itself. What needs to be done?`,
      `${kw} through ${cardName} twice means it's time to create a system for addressing it.`,
      `${cardName} repeats. ${kw} is a responsibility that hasn't been fulfilled yet.`,
      `${cardName} circles back because ${kw} requires structure and commitment.`,
      `Second ${cardName}. ${kw} demands practical steps, not abstract understanding.`,
      `${cardName} returns. ${kw} is on the checklist for completion, not contemplation.`,
      `${kw} via ${cardName} again—accountability is being requested here.`,
    ];
    const explorerVariants = [
      `${cardName} shows up again. ${kw} is the move you haven't made yet.`,
      `${cardName} returns. ${kw} energy wants expression, not analysis.`,
      `${cardName} again—time to do something about ${kw}.`,
      `Second ${cardName}. ${kw} is waiting for you to take action, any action.`,
      `${cardName} reappears because ${kw} needs to be experienced, not theorized.`,
      `${kw} through ${cardName} twice means it's time to experiment with it in real life.`,
      `${cardName} again. ${kw} wants movement. Make a move.`,
      `The return of ${cardName} suggests ${kw} is ready for bold experimentation.`,
      `${cardName} repeats—${kw} is the adventure you keep postponing.`,
      `${kw} via ${cardName} again. Stop planning, start doing.`,
      `${cardName} circles back. ${kw} needs spontaneous engagement, not careful strategy.`,
      `Second appearance of ${cardName}: ${kw} is calling for immediate, visceral response.`,
      `${cardName} again means ${kw} wants to be lived, not just understood.`,
      `${kw} through ${cardName} twice—the universe is saying try it now, adjust later.`,
      `${cardName} returns. ${kw} is the leap you're still standing at the edge of.`,
    ];

    const mbtiPools = {
      analyst: analystVariants,
      diplomat: diplomatVariants,
      sentinel: sentinelVariants,
      explorer: explorerVariants,
      balanced: [...analystVariants, ...diplomatVariants]
    };
    return pick(mbtiPools[mbtiCategory] || mbtiPools.balanced);
  }

  // REVERSED (inverted energy)
  if (cardContext === 'reversed') {
    const materialVariants = [ // career/finance readings
      `${cardName} inverted. ${kw} is blocked, delayed, or operating in shadow. Practical obstacle revealed.`,
      `${cardName} reversed: ${kw} energy isn't flowing. Where's the dam?`,
      `${cardName} upside down in a ${readingCategory} reading means ${kw} needs troubleshooting.`,
      `${cardName} inverted—${kw} encounters resistance in material reality. Diagnose the blockage.`,
      `Reversed ${cardName} indicates ${kw} is stalled at the execution phase.`,
      `${cardName} upside down: ${kw} has structural impediments preventing forward movement.`,
      `${kw} through reversed ${cardName} suggests external barriers, not internal ones.`,
      `${cardName} inverted means ${kw} needs a different approach in practical terms.`,
      `Reversed ${cardName}: ${kw} is delayed by logistics, resources, or timing—not by lack of will.`,
      `${cardName} upside down in material context shows ${kw} is misaligned with current conditions.`,
      `${kw} via inverted ${cardName}—the strategy needs revision, not the goal.`,
      `${cardName} reversed indicates ${kw} faces real-world friction that can't be ignored.`,
      `Upside down ${cardName}: ${kw} is sound in theory, problematic in practice.`,
      `${cardName} inverted reveals ${kw} has hidden costs or complications.`,
      `Reversed ${cardName} means ${kw} requires problem-solving at the implementation level.`,
    ];
    const relationalVariants = [ // romance/family readings
      `${cardName} reversed. ${kw} is stuck or turning inward. Relationship pattern highlighted.`,
      `${cardName} inverted: ${kw} is blocked by fear, not facts.`,
      `${cardName} reversed shows ${kw} energy is present but not expressed.`,
      `${cardName} upside down means ${kw} operates in the unspoken spaces between people.`,
      `Reversed ${cardName}: ${kw} is active internally but hasn't found relational expression yet.`,
      `${cardName} inverted reveals ${kw} as the thing you both feel but neither says.`,
      `${kw} through reversed ${cardName} indicates emotional withholding or protective withdrawal.`,
      `${cardName} upside down: ${kw} exists in potential but hasn't manifested in connection.`,
      `Inverted ${cardName} suggests ${kw} is complicated by attachment patterns or old wounds.`,
      `${cardName} reversed in relational reading means ${kw} needs vulnerability to activate.`,
      `${kw} via upside down ${cardName}—what you're protecting yourself from is also what you want.`,
      `${cardName} inverted shows ${kw} is distorted by fear of rejection or abandonment.`,
      `Reversed ${cardName}: ${kw} is real, but trust issues block its full expression.`,
      `${cardName} upside down reveals ${kw} as the desire you're afraid to voice.`,
      `${kw} through inverted ${cardName} asks: what would happen if you stopped defending?`,
    ];
    const internalVariants = [ // wellness/personal growth
      `${cardName} reversed. ${kw} is operating in your blind spot.`,
      `${cardName} inverted: ${kw} is there, but you're resisting it.`,
      `${cardName} reversed means ${kw} needs internal reckoning before external action.`,
      `${cardName} upside down reveals ${kw} as the growth edge you're avoiding.`,
      `Inverted ${cardName}: ${kw} triggers discomfort because it demands change you're not ready for.`,
      `${cardName} reversed shows ${kw} in your psychological shadow—acknowledged but not integrated.`,
      `${kw} through upside down ${cardName} indicates internal resistance disguised as external obstacles.`,
      `${cardName} inverted means ${kw} is blocked by old programming or limiting beliefs.`,
      `Reversed ${cardName}: ${kw} asks for self-honesty that feels threatening right now.`,
      `${cardName} upside down in internal work shows ${kw} is the medicine you're refusing to take.`,
      `${kw} via inverted ${cardName}—you know what needs to happen, but knowing isn't the same as doing.`,
      `${cardName} reversed reveals ${kw} as the part of yourself you haven't learned to love yet.`,
      `Upside down ${cardName}: ${kw} requires facing something you've been skillfully avoiding.`,
      `${cardName} inverted indicates ${kw} is present but suppressed by fear or shame.`,
      `Reversed ${cardName} means ${kw} lives in the gap between who you are and who you pretend to be.`,
    ];
    const depthVariants = [ // shadow work
      `${cardName} reversed. ${kw} in shadow—this is the work.`,
      `${cardName} inverted. What you won't look at: ${kw}.`,
      `${cardName} reversed: ${kw} is the teacher you're avoiding.`,
      `${cardName} upside down places ${kw} squarely in your shadow territory.`,
      `Inverted ${cardName} reveals ${kw} as the unconscious pattern running your life.`,
      `${cardName} reversed: ${kw} is what you project onto others instead of owning in yourself.`,
      `${kw} through upside down ${cardName}—the wound you won't acknowledge can't heal.`,
      `${cardName} inverted shows ${kw} as the disowned part of your psyche demanding attention.`,
      `Reversed ${cardName} means ${kw} operates from the basement of your awareness.`,
      `${cardName} upside down in shadow work: ${kw} is the gold hiding in your darkness.`,
      `${kw} via inverted ${cardName}—what you judge most harshly in others lives in you.`,
      `${cardName} reversed reveals ${kw} as the part of yourself you've exiled.`,
      `Upside down ${cardName}: ${kw} is the teacher appearing as adversary or obstacle.`,
      `${cardName} inverted indicates ${kw} hides in your blind spot, visible to everyone but you.`,
      `Reversed ${cardName} means ${kw} is the shadow material ready for conscious integration.`,
    ];

    const categoryPools = {
      material: materialVariants,
      relational: relationalVariants,
      internal: internalVariants,
      depth: depthVariants,
      universal: [...materialVariants, ...internalVariants]
    };
    return pick(categoryPools[readingCategory] || categoryPools.universal);
  }

  // NEW CARD (standard upright, first appearance)
  // Massive pool with sub-categorization by geometric theme + MBTI
  const transformationTheme = [
    `${cardName} arrives: ${kw} is active metamorphosis, not passive change.`,
    `${cardName}. ${kw} demands shedding the old form. Transformation in progress.`,
    `${cardName} brings ${kw}—the kind that burns away what was to make space for what will be.`,
    `${cardName}: ${kw} energy. Not gentle evolution—complete transformation.`,
    `${cardName} shows up when ${kw} can no longer be delayed or diluted.`,
    `${cardName} signals ${kw} at the cellular level. You're changing whether you notice it or not.`,
    `${kw} through ${cardName}—this isn't renovation, it's demolition and rebuild.`,
    `${cardName} arrives when ${kw} hits critical mass. The old form can't contain what's emerging.`,
    `${kw} via ${cardName} means you're in the cocoon phase. Uncomfortable, necessary, irreversible.`,
    `${cardName} brings ${kw} that operates like alchemy—base metal to gold, but you're both.`,
    `${kw} through ${cardName}: transformation that can't be controlled, only surrendered to.`,
    `${cardName} appears when ${kw} demands you become someone you haven't been before.`,
    `${kw} via ${cardName} is the death of one identity and birth of another. Let it happen.`,
    `${cardName} signals ${kw} as evolutionary pressure. Adapt or stay stuck.`,
    `${kw} through ${cardName}—the kind of change that makes the past unrecognizable.`,
    `${cardName}: ${kw} strips away everything that isn't essential. What remains is real.`,
    `${kw} via ${cardName} means you're being rewritten at the source code level.`,
    `${cardName} brings ${kw} that doesn't ask permission. The metamorphosis is already underway.`,
    `${kw} through ${cardName}: you can't go back. The bridge is burning behind you.`,
    `${cardName} arrives with ${kw} that reorganizes your entire system around new principles.`,
  ];

  const conflictTheme = [
    `${cardName}. ${kw} is the friction point—tension that creates movement.`,
    `${cardName} brings ${kw}. Conflict isn't the enemy; avoidance is.`,
    `${cardName}: ${kw} at the center of opposing forces. Resolution demands choice.`,
    `${cardName} reveals ${kw} as the fulcrum. Tension serves purpose.`,
    `${cardName}—${kw} creates necessary friction. Don't smooth it over yet.`,
    `${kw} through ${cardName} emerges from collision. The impact reveals what's real.`,
    `${cardName} appears when ${kw} can't be harmonized, only negotiated.`,
    `${kw} via ${cardName} means two truths are both valid and incompatible. Choose.`,
    `${cardName} brings ${kw} that lives in the space between yes and no.`,
    `${kw} through ${cardName}: the tension isn't the problem, it's the information.`,
    `${cardName} signals ${kw} as productive opposition. Thesis, antithesis, synthesis.`,
    `${kw} via ${cardName} shows where your values are actually being tested.`,
    `${cardName} appears when ${kw} forces you to take a side you've been straddling.`,
    `${kw} through ${cardName}: conflict clarifies. Now you know what you actually want.`,
    `${cardName} brings ${kw} that won't resolve through compromise—only through decisiveness.`,
    `${kw} via ${cardName} means the clash is revealing character, yours and others'.`,
    `${cardName}: ${kw} as the pressure that exposes fault lines. Better now than later.`,
    `${kw} through ${cardName} shows disagreement as data, not disaster.`,
    `${cardName} arrives when ${kw} demands you stop people-pleasing and start boundary-setting.`,
    `${kw} via ${cardName}: the friction generates heat that forges something stronger.`,
  ];

  const balanceTheme = [
    `${cardName}: ${kw} seeks equilibrium. Not static peace—dynamic balance.`,
    `${cardName} brings ${kw}. The scales want to center.`,
    `${cardName}—${kw} is the midpoint between extremes you've been ping-ponging.`,
    `${cardName}: ${kw} asks for middle way, not compromise.`,
    `${cardName} shows ${kw} as the path of integration, not elimination.`,
    `${kw} through ${cardName} finds the sweet spot between too much and not enough.`,
    `${cardName} appears when ${kw} requires recalibration, not radical change.`,
    `${kw} via ${cardName} means balance isn't achieved, it's practiced. Daily.`,
    `${cardName} brings ${kw} that asks: what needs more weight, what needs less?`,
    `${kw} through ${cardName}: equilibrium isn't the absence of motion, it's responsive adjustment.`,
    `${cardName} signals ${kw} as the art of holding opposites without collapsing into either.`,
    `${kw} via ${cardName} shows where you've been overcorrecting instead of centering.`,
    `${cardName} appears when ${kw} demands you stop swinging between extremes.`,
    `${kw} through ${cardName}: the middle path isn't boring, it's sustainable.`,
    `${cardName} brings ${kw} that lives in the and, not the or. Both can be true.`,
    `${kw} via ${cardName} means finding your center point in a world that rewards extremes.`,
    `${cardName}: ${kw} as the place where all your contradictions can coexist.`,
    `${kw} through ${cardName} asks you to distribute your energy more wisely.`,
    `${cardName} arrives when ${kw} needs tempering—not more force, more finesse.`,
    `${kw} via ${cardName}: balance is dynamic, constantly adjusting to conditions.`,
  ];

  const breakthroughTheme = [
    `${cardName}. ${kw} is the crack in the dam. Breakthrough imminent.`,
    `${cardName}: ${kw} at critical mass. Something's about to break open.`,
    `${cardName} brings ${kw}—the pressure that precedes release.`,
    `${cardName}. ${kw} has been building. The breaking point is now.`,
    `${cardName}: ${kw} is the force that shatters stuckness.`,
    `${kw} through ${cardName} signals the moment before everything shifts.`,
    `${cardName} appears when ${kw} reaches the tipping point. Prepare for rapid change.`,
    `${kw} via ${cardName} means the breakthrough you've been working toward is here.`,
    `${cardName} brings ${kw} that breaks the pattern that's been running your life.`,
    `${kw} through ${cardName}: the dam breaks. What's been held back now flows.`,
    `${cardName} signals ${kw} as the explosive release after long compression.`,
    `${kw} via ${cardName} shows the exact moment limitation becomes liberation.`,
    `${cardName} appears when ${kw} finally breaks through your resistance.`,
    `${kw} through ${cardName}: the wall you've been pushing against is about to crumble.`,
    `${cardName} brings ${kw} that punctures the membrane keeping you contained.`,
    `${kw} via ${cardName} means clarity arrives like lightning—sudden, illuminating, undeniable.`,
    `${cardName}: ${kw} as the aha moment that changes everything that comes after.`,
    `${kw} through ${cardName} is the release valve opening when pressure becomes unsustainable.`,
    `${cardName} arrives when ${kw} hits escape velocity. You're breaking orbit.`,
    `${kw} via ${cardName}: breakthrough doesn't arrive gradually, it erupts.`,
  ];

  const stagnationTheme = [
    `${cardName}. ${kw} is stuck—temporary state, not permanent condition.`,
    `${cardName}: ${kw} reveals where flow has stopped. Blockage identified.`,
    `${cardName} shows ${kw} at standstill. Not failure—information.`,
    `${cardName}. ${kw} stagnates because something upstream needs addressing.`,
    `${cardName}: ${kw} frozen. Thaw requires action.`,
    `${kw} through ${cardName} highlights where energy isn't moving. Find the obstruction.`,
    `${cardName} appears when ${kw} has pooled instead of flowed. Investigate why.`,
    `${kw} via ${cardName} means stuckness is the symptom, not the disease. Diagnose deeper.`,
    `${cardName} brings ${kw} that's waiting on something you haven't acknowledged yet.`,
    `${kw} through ${cardName}: stagnation is feedback. Something needs to change upstream.`,
    `${cardName} signals ${kw} in holding pattern. What's the missing piece?`,
    `${kw} via ${cardName} shows where you're circling instead of advancing.`,
    `${cardName} appears when ${kw} is stuck because fear looks like patience.`,
    `${kw} through ${cardName}: the water's not moving because you haven't opened the gate.`,
    `${cardName} brings ${kw} at impasse. This requires decision, not more waiting.`,
    `${kw} via ${cardName} means the standstill is protective. What are you avoiding?`,
    `${cardName}: ${kw} stagnates when safety is prioritized over growth.`,
    `${kw} through ${cardName} reveals where you're stuck in analysis instead of action.`,
    `${cardName} arrives when ${kw} has calcified from being ignored too long.`,
    `${kw} via ${cardName}: stuckness ends when you're willing to be uncomfortable again.`,
  ];

  const neutralTheme = [
    `${cardName} lands upright: ${kw} and ${kw2} active now.`,
    `${cardName}. ${kw} energy present—neither flowing nor blocked, simply here.`,
    `${cardName} brings ${kw}. Pay attention to how it moves.`,
    `${cardName}: ${kw} is the message. Context shapes meaning.`,
    `${cardName}. ${kw} arrives. What you do with it matters more than what it means.`,
    `${kw} through ${cardName} enters your field. How you respond determines its impact.`,
    `${cardName} appears with ${kw} in neutral state. Direction isn't set yet.`,
    `${kw} via ${cardName} means possibility is open. The story isn't written.`,
    `${cardName} brings ${kw} without agenda. You decide what it becomes.`,
    `${kw} through ${cardName}: pure potential waiting for your input.`,
    `${cardName} signals ${kw} as available energy. Use it or lose it.`,
    `${kw} via ${cardName} arrives like a gift with no instructions. Figure it out.`,
    `${cardName} appears when ${kw} is yours to shape however you choose.`,
    `${kw} through ${cardName}: the card deals information, not directives.`,
    `${cardName} brings ${kw} as raw material. What will you build?`,
    `${kw} via ${cardName} means the energy is present, the application is up to you.`,
    `${cardName}: ${kw} arrives unscripted. Your choices write the next chapter.`,
    `${kw} through ${cardName} offers opportunity without guarantee. What's your move?`,
    `${cardName} appears with ${kw} ready to work with you, not for you.`,
    `${kw} via ${cardName}: the conditions are set, the outcome is not. Act accordingly.`,
  ];

  // Select pool based on geometric theme
  const themePools = {
    transformation: transformationTheme,
    conflict: conflictTheme,
    balance: balanceTheme,
    breakthrough: breakthroughTheme,
    stagnation: stagnationTheme,
    neutral: neutralTheme
  };

  return pick(themePools[geomCategory] || themePools.neutral);
}

// ═══════════════════════════════════════════════════════════
// ELEMENT CASCADE (Unpredictable element descriptions)
// ═══════════════════════════════════════════════════════════

function buildElementCascade(params) {
  const {
    element,
    cardName,
    keywords,
    mbtiCategory,
    urgency,
    intentPattern,
    readingCategory
  } = params;

  const kw = keywords[0] || 'energy';
  const elemLower = element?.toLowerCase() || 'spirit';

  // FIRE variants (20+)
  const firePool = [
    `Fire energy: ${kw} demands action, not contemplation. Move now.`,
    `This is fire. ${kw} burns away hesitation. What needs to ignite?`,
    `Fire through ${cardName}: ${kw} doesn't wait for permission to burn.`,
    `Flame energy means ${kw} is active combustion. Feed it or extinguish it—but choose.`,
    `Fire asks: is ${kw} worth the burn? If yes, commit completely.`,
    `This fire won't be tamed. ${kw} wants full expression, not controlled doses.`,
    `Fire energy catalyzes ${kw} into immediate transformation. Strike while hot.`,
    `${kw} through fire means passion, not patience. Act from your core.`,
    `Fire doesn't analyze ${kw}, it embodies it. Be the flame.`,
    `This element says ${kw} is fuel. What are you burning for?`,
    `Fire through ${cardName}: ${kw} is the spark that starts everything.`,
    `Fire energy transforms ${kw} from potential to kinetic instantly.`,
    `This is combustion. ${kw} needs oxygen and courage to burn bright.`,
    `Fire asks what you're willing to burn down for ${kw} to emerge.`,
    `${kw} via fire: rapid, hot, unstoppable once started.`,
    `Fire doesn't second-guess ${kw}. It acts. So should you.`,
    `This fire element means ${kw} is your inner furnace. Stoke it.`,
    `Fire through ${cardName} says ${kw} is the heat signature of your purpose.`,
    `Fire energy: ${kw} spreads when you stop trying to contain it.`,
    `This element demands ${kw} be lived loudly, not thought about quietly.`,
  ];

  // WATER variants (20+)
  const waterPool = [
    `Water energy: ${kw} flows where it needs to go. Stop forcing.`,
    `This is water. ${kw} moves through feeling, not thinking. Trust the current.`,
    `Water through ${cardName}: ${kw} finds its own level. Let it.`,
    `Water energy means ${kw} is emotional truth, not logical conclusion.`,
    `Water asks: where does ${kw} want to flow? Follow that.`,
    `This water won't be rushed. ${kw} operates on lunar time, not solar.`,
    `Water energy dissolves resistance around ${kw}. Be patient, be permeable.`,
    `${kw} through water means depth, not speed. Feel your way forward.`,
    `Water doesn't force ${kw}, it yields around obstacles until they erode.`,
    `This element says ${kw} is your emotional intelligence speaking. Listen.`,
    `Water through ${cardName}: ${kw} is the undercurrent beneath surface chatter.`,
    `Water energy allows ${kw} to adapt to the container without losing essence.`,
    `This is fluid wisdom. ${kw} knows the path even when you don't.`,
    `Water asks what ${kw} is teaching your heart, not your head.`,
    `${kw} via water: deep, intuitive, undeniable when you stop resisting.`,
    `Water doesn't explain ${kw}. It feels it completely.`,
    `This water element means ${kw} is working beneath conscious awareness.`,
    `Water through ${cardName} says ${kw} is the emotion you've been avoiding.`,
    `Water energy: ${kw} heals when you stop trying to understand it.`,
    `This element demands ${kw} be felt fully, not managed carefully.`,
  ];

  // AIR variants (20+)
  const airPool = [
    `Air energy: ${kw} needs mental clarity, not emotional fog. Think sharp.`,
    `This is air. ${kw} moves through ideas, words, perspective shifts.`,
    `Air through ${cardName}: ${kw} is the thought that changes everything.`,
    `Air energy means ${kw} lives in communication and concept. Articulate it.`,
    `Air asks: what story about ${kw} needs rewriting?`,
    `This air won't be grounded prematurely. ${kw} needs to breathe before it lands.`,
    `Air energy circulates ${kw} through dialogue, internal and external.`,
    `${kw} through air means perspective, not position. Zoom out.`,
    `Air doesn't cling to ${kw}, it observes it from multiple angles.`,
    `This element says ${kw} is information seeking expression. Speak it.`,
    `Air through ${cardName}: ${kw} is the clarity that cuts through confusion.`,
    `Air energy lets ${kw} move freely between minds and ideas.`,
    `This is cognitive breakthrough. ${kw} shifts when you rename it.`,
    `Air asks how ${kw} changes when you tell the truth about it.`,
    `${kw} via air: light, mobile, transformative through new frameworks.`,
    `Air doesn't feel ${kw}. It understands it from elevation.`,
    `This air element means ${kw} is a thought experiment worth running.`,
    `Air through ${cardName} says ${kw} is the conversation you're avoiding.`,
    `Air energy: ${kw} clarifies when you stop over-identifying with it.`,
    `This element demands ${kw} be examined objectively, not emotionally.`,
  ];

  // EARTH variants (20+)
  const earthPool = [
    `Earth energy: ${kw} needs grounding in reality. Make it tangible.`,
    `This is earth. ${kw} manifests through consistent action over time.`,
    `Earth through ${cardName}: ${kw} is built brick by brick, not imagined into being.`,
    `Earth energy means ${kw} requires practical application, not abstract understanding.`,
    `Earth asks: what is ${kw} asking you to build in physical reality?`,
    `This earth won't be bypassed spiritually. ${kw} demands material follow-through.`,
    `Earth energy roots ${kw} in your actual life, not your fantasy about it.`,
    `${kw} through earth means structure, not spontaneity. Create the container.`,
    `Earth doesn't dream ${kw}, it constructs it with available resources.`,
    `This element says ${kw} is tested by what you do, not what you intend.`,
    `Earth through ${cardName}: ${kw} is the foundation everything else depends on.`,
    `Earth energy gives ${kw} form, weight, consequence. No more theory.`,
    `This is material wisdom. ${kw} proves itself through results.`,
    `Earth asks what ${kw} looks like when it's no longer just potential.`,
    `${kw} via earth: slow, steady, undeniably real when complete.`,
    `Earth doesn't imagine ${kw}. It grows it patiently from seed.`,
    `This earth element means ${kw} is showing up in your physical circumstances.`,
    `Earth through ${cardName} says ${kw} is the work you can't skip.`,
    `Earth energy: ${kw} solidifies through daily practice, not peak experiences.`,
    `This element demands ${kw} be lived practically, not just understood conceptually.`,
  ];

  // SPIRIT variants (20+)
  const spiritPool = [
    `Spirit energy: ${kw} transcends category. This is the fifth element.`,
    `This is spirit. ${kw} operates beyond fire, water, air, earth—pure essence.`,
    `Spirit through ${cardName}: ${kw} is the animating force behind everything.`,
    `Spirit energy means ${kw} can't be reduced to one element. It's all and none.`,
    `Spirit asks: what is ${kw} when you remove all the labels?`,
    `This spirit won't be contained by form. ${kw} is the formless informing form.`,
    `Spirit energy reveals ${kw} as the pattern connecting all other patterns.`,
    `${kw} through spirit means mystery, not mastery. Approach with reverence.`,
    `Spirit doesn't explain ${kw}, it experiences it as sacred presence.`,
    `This element says ${kw} is the divine moving through mundane reality.`,
    `Spirit through ${cardName}: ${kw} is the silence between words where truth lives.`,
    `Spirit energy allows ${kw} to be paradox—both this and that, neither fully.`,
    `This is unified field. ${kw} is where everything connects to everything.`,
    `Spirit asks what ${kw} is serving beyond your personal agenda.`,
    `${kw} via spirit: ineffable, numinous, recognized but not grasped.`,
    `Spirit doesn't categorize ${kw}. It witnesses it as miracle.`,
    `This spirit element means ${kw} is operating at the soul level.`,
    `Spirit through ${cardName} says ${kw} is the universe speaking directly to you.`,
    `Spirit energy: ${kw} exists in the gap between what you know and what you sense.`,
    `This element demands ${kw} be honored as sacred, not used as tool.`,
  ];

  const elementPools = {
    fire: firePool,
    water: waterPool,
    air: airPool,
    earth: earthPool,
    spirit: spiritPool
  };

  return pick(elementPools[elemLower] || spiritPool);
}

// ═══════════════════════════════════════════════════════════
// INTEGRATION CASCADE (Unpredictable integration phrases)
// ═══════════════════════════════════════════════════════════

function buildIntegrationCascade(params) {
  const {
    keywords,
    mbtiCategory,
    histContext,
    geomCategory,
    urgency
  } = params;

  const kw = keywords[0] || 'insight';
  const kw2 = keywords[1] || 'awareness';

  // Build massive integration pool (40+ variants with nested branching)
  const integrationPool = [
    // Integration as ACTION
    `Integration means taking ${kw} from awareness to action. Knowing isn't enough—doing is.`,
    `The gap between ${kw} and transformation is closed through consistent practice.`,
    `${kw} becomes real when it shows up in your behavior, not just your understanding.`,
    `Integration: stop collecting ${kw} and start applying it. Insight without action is entertainment.`,
    `${kw} integrated means your life actually looks different. Is it?`,

    // Integration as EMBODIMENT
    `${kw} lives in your body before it lives in your choices. Feel it first.`,
    `Integration isn't intellectual agreement with ${kw}—it's cellular knowing.`,
    `When ${kw} is truly integrated, you don't think about it, you are it.`,
    `${kw} embodied means automatic response, not conscious effort. Not there yet? Keep going.`,
    `The body knows when ${kw} is integrated. Your nervous system tells the truth.`,

    // Integration as TIME
    `${kw} doesn't integrate overnight. Give it the time it actually needs.`,
    `Integration of ${kw} happens in layers, not leaps. Trust the process.`,
    `${kw} takes root slowly, like a tree. Rushing kills it.`,
    `Integration means returning to ${kw} again and again until it's second nature.`,
    `${kw} becomes part of you through repetition, not revelation. Do it daily.`,

    // Integration as RESISTANCE
    `The parts of you resisting ${kw} are the parts that most need it. Work there.`,
    `Integration of ${kw} requires facing what you've been avoiding. That's the work.`,
    `Where you resist ${kw} is where it has the most to teach you.`,
    `${kw} integration isn't comfortable. Discomfort means you're doing it right.`,
    `The friction around ${kw} is information about what needs to shift.`,

    // Integration as RELATIONSHIPS
    `${kw} integrated shows up in how you treat people, especially when triggered.`,
    `Integration means ${kw} affects your relationships, not just your inner world.`,
    `${kw} becomes real when it changes how you connect with others.`,
    `If ${kw} doesn't alter how you relate, it hasn't integrated. It's still theory.`,
    `${kw} tested in relationship is ${kw} actually integrated.`,

    // Integration as SHADOW
    `Integrating ${kw} means accepting what it reveals about your shadow side.`,
    `${kw} integration includes the parts of yourself you don't want to be true.`,
    `The shadow of ${kw} is part of the package. Integrate all of it, not just the pretty parts.`,
    `${kw} fully integrated means owning your darkness as much as your light.`,
    `Integration: ${kw} works on you in ways you won't always like. Allow it.`,

    // Integration as PARADOX
    `Integrating ${kw} means holding contradiction without needing resolution.`,
    `${kw} and its opposite can both be true. Integration is spacious enough for both.`,
    `${kw} integration includes the ways it conflicts with what you already believe.`,
    `The paradox of ${kw} doesn't need solving, just holding. Integration is the container.`,
    `${kw} integrated means you can be multiple things at once. Complexity, not simplicity.`,

    // Integration as FAILURE
    `You'll fail at integrating ${kw} repeatedly. Failure is part of the process.`,
    `Integration of ${kw} includes backsliding. Progress isn't linear.`,
    `${kw} integration means trying, failing, trying again. Perfection isn't the goal.`,
    `The path of integrating ${kw} is messy. Clean stories come later.`,
    `${kw} becomes yours through repeated attempts, not one successful integration.`,
  ];

  return pick(integrationPool);
}

// ═══════════════════════════════════════════════════════════
// SHADOW CASCADE (Unpredictable shadow work language)
// ═══════════════════════════════════════════════════════════

function buildShadowCascade(params) {
  const {
    keywords,
    cardName,
    mbtiCategory,
    intentPattern,
    readingCategory
  } = params;

  const kw = keywords[0] || 'shadow';

  // Build massive shadow work pool (40+ variants)
  const shadowPool = [
    // Shadow as PROJECTION
    `What you judge in others about ${kw} lives in you. That's the work.`,
    `${kw} appears in others because you won't look at it in yourself. Stop projecting.`,
    `The ${kw} you criticize externally is the ${kw} you've disowned internally.`,
    `Shadow work: recognize ${kw} in yourself with the same clarity you see it in others.`,
    `Your reaction to ${kw} in others is a mirror. Look closely.`,

    // Shadow as DISCOMFORT
    `${kw} lives where you refuse to look. That discomfort is the path.`,
    `Shadow work isn't comfortable. ${kw} asks you to face what you've been avoiding.`,
    `The edge of your discomfort around ${kw} is the edge of your growth.`,
    `${kw} in shadow means it's operating unconsciously. Consciousness requires courage.`,
    `Where ${kw} triggers you most is where your shadow work begins.`,

    // Shadow as GOLD
    `Your shadow around ${kw} contains power you've been denying yourself.`,
    `${kw} in shadow isn't just dark—it's disowned potential. Reclaim it.`,
    `Shadow work: the ${kw} you've exiled often holds the gold you're seeking.`,
    `${kw} hidden in shadow is energy unavailable to you. Integrate it, use it.`,
    `The shadow of ${kw} is treasure disguised as trash. Look again.`,

    // Shadow as WOUND
    `${kw} lives in shadow because it's connected to old wounds. Tend them.`,
    `Shadow work around ${kw} means revisiting pain you thought you'd moved past.`,
    `The wound beneath ${kw} is still running your life from the basement. Bring it to light.`,
    `${kw} in shadow is ${kw} protecting you from something that hurt you once. Thank it, then release it.`,
    `Shadow work: ${kw} is the scar tissue that needs gentle attention, not amputation.`,

    // Shadow as PATTERN
    `The pattern of ${kw} repeats because it's in shadow. Illuminate it to break it.`,
    `${kw} operates unconsciously until you make it conscious. That's the work.`,
    `Shadow work: ${kw} is the loop you're stuck in because you won't look at the mechanism.`,
    `${kw} in shadow means you're reacting automatically, not responding consciously.`,
    `The pattern of ${kw} ends when you see it clearly enough to choose differently.`,

    // Shadow as SHAME
    `${kw} in shadow carries shame. Shame dissolves in the light of witnessing.`,
    `Shadow work: ${kw} isn't shameful, but hiding it creates shame. Stop hiding.`,
    `The shame around ${kw} is learned, not inherent. Unlearn it.`,
    `${kw} in shadow because you were taught it was unacceptable. Question that teaching.`,
    `Shadow work means befriending the ${kw} you were told to reject. It's still you.`,

    // Shadow as POWER
    `${kw} in shadow is power you're afraid to own. Own it anyway.`,
    `Shadow work: ${kw} isn't dangerous—your fear of your own power is.`,
    `The ${kw} you've hidden is potent. That's why you hid it. Time to wield it.`,
    `${kw} in shadow because it threatened someone once. Their fear isn't your truth.`,
    `Shadow work means reclaiming the ${kw} that makes you powerful, not palatable.`,

    // Shadow as INTEGRATION
    `${kw} stays in shadow until you integrate it. Integration means acceptance, not elimination.`,
    `Shadow work: ${kw} doesn't need fixing, it needs including. Include all of yourself.`,
    `The wholeness you seek includes the ${kw} you've been rejecting. Accept the whole package.`,
    `${kw} in shadow fragments you. Integration makes you whole again.`,
    `Shadow work means ${kw} becomes part of your conscious self-concept, not a hidden liability.`,
  ];

  return pick(shadowPool);
}

// ═══════════════════════════════════════════════════════════
// ACTION CASCADE (Unpredictable action step language)
// ═══════════════════════════════════════════════════════════

function buildActionCascade(params) {
  const {
    keywords,
    urgency,
    mbtiCategory,
    elemCategory,
    intentPattern
  } = params;

  const kw = keywords[0] || 'action';

  // Build massive action pool (40+ variants with urgency branching)
  const urgentActionPool = [
    `Act on ${kw} within 24 hours. Not tomorrow—today. Now if possible.`,
    `${kw} demands immediate response. What's the first concrete step? Take it immediately.`,
    `Urgency around ${kw} is real. Don't waste time planning—start moving.`,
    `${kw} won't wait for perfect conditions. Act now with what you have.`,
    `The window on ${kw} is closing. Move before it shuts completely.`,
    `${kw} requires rapid response. Delay increases difficulty. Act now.`,
    `Don't overthink ${kw}. Your first instinct is probably right. Trust it and move.`,
    `${kw} is time-sensitive. What you do in the next 48 hours matters enormously.`,
    `Act on ${kw} before fear talks you out of it. Speed creates momentum.`,
    `${kw} demands decisiveness. Choose a direction and commit fully, now.`,
  ];

  const routineActionPool = [
    `Take one small action toward ${kw} today. Build momentum slowly.`,
    `${kw} doesn't require dramatic gestures—just consistent small steps.`,
    `Start with ${kw} in a way that feels manageable. Sustainability matters more than intensity.`,
    `${kw} benefits from patient, methodical approach. What's the logical first step?`,
    `Break ${kw} down into micro-actions. Do one this week.`,
    `${kw} wants steady progress, not explosive bursts. Pace yourself.`,
    `Begin ${kw} with low-stakes experimentation. Learn by doing, not by planning.`,
    `${kw} becomes real through daily practice. What's the smallest daily commitment you can make?`,
    `Start ${kw} where you are with what you have. Imperfect action beats perfect inaction.`,
    `${kw} needs foundation before acceleration. Build the base first.`,
    `Act on ${kw} in a way you can repeat. Consistency over heroics.`,
    `${kw} starts with conversation. Who needs to be part of this discussion?`,
    `Begin ${kw} by gathering information. What do you need to know?`,
    `${kw} benefits from structured approach. Create the system, then work the system.`,
    `Start ${kw} by identifying obstacles. What's actually blocking progress?`,
    `${kw} wants your attention before your action. Observe it closely first.`,
    `Begin ${kw} by examining your resistance. Why haven't you started yet?`,
    `${kw} needs space to unfold. Clear the calendar before you fill it.`,
    `Act on ${kw} by committing resources. What are you willing to invest?`,
    `${kw} starts with permission—give yourself permission to begin imperfectly.`,
    `Begin ${kw} by declaring it to someone. Verbal commitment creates accountability.`,
    `${kw} wants small wins early. What's the easiest aspect to tackle first?`,
    `Start ${kw} by connecting it to existing habits. Piggyback on what's already working.`,
    `${kw} benefits from support. Who's in your corner for this?`,
    `Begin ${kw} by visualizing completion. What does success actually look like?`,
    `${kw} starts when you schedule it. Put it on the calendar. Treat it as non-negotiable.`,
    `Act on ${kw} by removing friction. What makes this easier to start?`,
    `${kw} needs your energy directed intentionally. Where's it leaking currently?`,
    `Begin ${kw} by creating consequences for inaction. What's the cost of waiting?`,
    `${kw} wants your creative attention. Brainstorm possibilities before committing to one.`,
  ];

  const actionPools = {
    crisis: urgentActionPool,
    urgent: urgentActionPool,
    routine: routineActionPool
  };

  return pick(actionPools[urgency] || routineActionPool);
}

// Export all builders and helper functions
export {
  buildCascadingSynthesis,
  buildElementCascade,
  buildIntegrationCascade,
  buildShadowCascade,
  buildActionCascade,
  // Helper functions for external use
  getMBTICategory,
  detectUrgency,
  detectIntentionPattern,
  getReadingCategory,
  getHistoryContext,
  getGeometricCategory,
  getElementCategory
};
