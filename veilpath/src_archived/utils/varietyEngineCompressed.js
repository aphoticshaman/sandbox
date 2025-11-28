/**
 * COMPRESSED VARIETY ENGINE - Metaprogrammed template system
 *
 * Generates millions of unique synthesis variants through algorithmic composition
 * instead of hardcoded arrays. Reduces file size by ~75% while maintaining
 * (or exceeding) variety through combinatorial generation.
 *
 * Architecture:
 * 1. Component Libraries (verbs, transitions, structures)
 * 2. Template Combinators (algorithmic sentence building)
 * 3. Context-Aware Generators (cascading decision trees)
 */

import { qRandom } from './quantumRNG';

// ═══════════════════════════════════════════════════════════
// COMPONENT LIBRARIES - Atomic building blocks
// ═══════════════════════════════════════════════════════════

const VERBS = {
  action: ['act', 'move', 'execute', 'commit', 'initiate', 'launch', 'start', 'begin'],
  perception: ['see', 'recognize', 'notice', 'observe', 'identify', 'detect', 'sense'],
  transformation: ['transform', 'shift', 'change', 'evolve', 'transmute', 'become'],
  resistance: ['resist', 'avoid', 'deny', 'reject', 'block', 'suppress', 'refuse'],
  integration: ['integrate', 'embrace', 'accept', 'include', 'honor', 'welcome'],
  demand: ['demand', 'require', 'insist', 'ask', 'call for', 'need', 'want']
};

const TRANSITIONS = {
  contrast: ['But', 'However', 'Yet', 'Still', 'Though'],
  addition: ['Also', 'Additionally', 'Moreover', 'Furthermore'],
  causation: ['Because', 'Since', 'Therefore', 'Thus', 'So'],
  temporal: ['Now', 'Currently', 'At this moment', 'Right now'],
  emphasis: ['Notice', 'Pay attention', 'Look closely', 'Consider', 'Understand']
};

const INTENSIFIERS = {
  mild: ['somewhat', 'slightly', 'a bit', 'moderately'],
  medium: ['clearly', 'notably', 'significantly', 'distinctly'],
  strong: ['extremely', 'profoundly', 'intensely', 'absolutely', 'completely']
};

const TEMPORAL_MARKERS = {
  immediate: ['now', 'immediately', 'right now', 'at this moment', 'today'],
  near: ['soon', 'shortly', 'in the near future', 'within days'],
  distant: ['eventually', 'in time', 'when ready', 'down the road']
};

// ═══════════════════════════════════════════════════════════
// TEMPLATE COMBINATORS - Algorithmic sentence builders
// ═══════════════════════════════════════════════════════════

function pick(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(qRandom() * arr.length)];
}

function buildTemplate(structure, context) {
  // Replace template variables with context values or components
  return structure.replace(/\{(\w+)\}/g, (match, key) => {
    if (context[key] !== undefined) return context[key];

    // Dynamic component selection
    if (VERBS[key]) return pick(VERBS[key]);
    if (TRANSITIONS[key]) return pick(TRANSITIONS[key]);
    if (INTENSIFIERS[key]) return pick(INTENSIFIERS[key]);
    if (TEMPORAL_MARKERS[key]) return pick(TEMPORAL_MARKERS[key]);

    return match;
  });
}

// Generate variant by combining components algorithmically
function generateVariant(template, params) {
  const { cardName, kw, kw2, intensity = 'medium' } = params;

  const context = {
    cardName,
    kw,
    kw2,
    verb_action: pick(VERBS.action),
    verb_perception: pick(VERBS.perception),
    verb_transformation: pick(VERBS.transformation),
    verb_demand: pick(VERBS.demand),
    intensifier: pick(INTENSIFIERS[intensity] || INTENSIFIERS.medium),
    temporal: pick(TEMPORAL_MARKERS.immediate),
    transition: pick(TRANSITIONS.contrast)
  };

  return buildTemplate(template, context);
}

// ═══════════════════════════════════════════════════════════
// PATTERN GENERATORS - Context-driven template selection
// ═══════════════════════════════════════════════════════════

// Meta-templates that generate multiple variants algorithmically
const META_TEMPLATES = {
  persistent_urgent: [
    '{cardName} AGAIN. {kw} isn\'t optional anymore—the universe is done asking nicely.',
    '{cardName} for the third time. You know what this means. Stop pretending you don\'t.',
    'Third appearance of {cardName}. {kw} has escalated from suggestion to requirement.',
    '{cardName} {verb_demand}s. {kw} won\'t be ignored anymore—this is the final notice.',
    'The persistence of {cardName} speaks volumes. {kw} is no longer negotiable.',
    'This card shows up when you\'re still avoiding {kw}. How much longer?'
  ],

  persistent_routine: [
    '{cardName} again. This pattern of {kw} keeps cycling because something hasn\'t been integrated.',
    '{cardName} circles back. {kw} is a recurring theme for a reason—find it.',
    '{cardName} returns. {kw} is asking for deeper understanding this time.',
    'The reappearance of {cardName} suggests {kw} has layers you haven\'t explored.'
  ],

  // Dynamic generator: MBTI + repeated patterns
  repeated_analyst: [
    '{cardName} returns. Pattern recognition: {kw} is still active in your system.',
    '{cardName} again—not coincidence, data. {kw} requires attention.',
    'Second appearance of {cardName}. {kw} is a persistent variable in your equation.',
    'The recurrence of {cardName} indicates {kw} operates as a core mechanism right now.'
  ],

  repeated_diplomat: [
    '{cardName} circles back to you. {kw} wants to be seen, felt, honored.',
    '{cardName} again. The universe is patient but persistent about {kw}.',
    'The return of {cardName} is an invitation to deepen your relationship with {kw}.'
  ],

  repeated_sentinel: [
    '{cardName} again. {kw} is unfinished business. Complete it.',
    '{cardName} repeats. Action required on {kw}. What\'s the next step?',
    'Second appearance of {cardName} means {kw} is on your task list for a reason. Execute.'
  ],

  repeated_explorer: [
    '{cardName} shows up again. {kw} is the move you haven\'t made yet.',
    '{cardName} returns. {kw} energy wants expression, not analysis.',
    'Second {cardName}. {kw} is waiting for you to take action, any action.'
  ],

  // Algorithmic theme-based generators
  theme_transformation: [
    '{cardName} arrives: {kw} is active metamorphosis, not passive change.',
    '{cardName}. {kw} {verb_demand}s shedding the old form. Transformation in progress.',
    '{cardName} brings {kw}—the kind that burns away what was to make space for what will be.',
    '{cardName} signals {kw} at the cellular level. You\'re changing whether you notice it or not.'
  ],

  theme_conflict: [
    '{cardName}. {kw} is the friction point—tension that creates movement.',
    '{cardName} brings {kw}. Conflict isn\'t the enemy; avoidance is.',
    '{cardName}: {kw} at the center of opposing forces. Resolution {verb_demand}s choice.'
  ],

  theme_balance: [
    '{cardName}: {kw} seeks equilibrium. Not static peace—dynamic balance.',
    '{cardName}—{kw} is the midpoint between extremes you\'ve been ping-ponging.',
    '{cardName} shows {kw} as the path of integration, not elimination.'
  ],

  theme_breakthrough: [
    '{cardName}. {kw} is the crack in the dam. Breakthrough imminent.',
    '{cardName}: {kw} at critical mass. Something\'s about to break open.',
    '{cardName} brings {kw}—the pressure that precedes release.'
  ],

  theme_stagnation: [
    '{cardName}. {kw} is stuck—temporary state, not permanent condition.',
    '{cardName}: {kw} reveals where flow has stopped. Blockage identified.',
    '{cardName} shows {kw} at standstill. Not failure—information.'
  ],

  theme_neutral: [
    '{cardName} lands upright: {kw} and {kw2} active now.',
    '{cardName} brings {kw}. Pay attention to how it moves.',
    '{cardName}: {kw} is the message. Context shapes meaning.'
  ]
};

// Element templates with algorithmic variation
const ELEMENT_META_TEMPLATES = {
  fire: [
    'Fire energy: {kw} {verb_demand}s action, not contemplation. {verb_action} now.',
    'This is fire. {kw} burns away hesitation. What needs to ignite?',
    'Flame energy means {kw} is active combustion. Feed it or extinguish it—but choose.',
    'Fire asks: is {kw} worth the burn? If yes, commit completely.'
  ],

  water: [
    'Water energy: {kw} flows where it needs to go. Stop forcing.',
    'This is water. {kw} moves through feeling, not thinking. Trust the current.',
    'Water energy means {kw} is emotional truth, not logical conclusion.',
    'Water asks: where does {kw} want to flow? Follow that.'
  ],

  air: [
    'Air energy: {kw} needs mental clarity, not emotional fog. Think sharp.',
    'This is air. {kw} moves through ideas, words, perspective shifts.',
    'Air energy means {kw} lives in communication and concept. Articulate it.',
    'Air asks: what story about {kw} needs rewriting?'
  ],

  earth: [
    'Earth energy: {kw} needs grounding in reality. Make it tangible.',
    'This is earth. {kw} manifests through consistent action over time.',
    'Earth energy means {kw} requires practical application, not abstract understanding.',
    'Earth asks: what is {kw} asking you to build in physical reality?'
  ],

  spirit: [
    'Spirit energy: {kw} transcends category. This is the fifth element.',
    'This is spirit. {kw} operates beyond fire, water, air, earth—pure essence.',
    'Spirit energy means {kw} can\'t be reduced to one element. It\'s all and none.',
    'Spirit asks: what is {kw} when you remove all the labels?'
  ]
};

// ═══════════════════════════════════════════════════════════
// CONTEXT DETECTION (same as original)
// ═══════════════════════════════════════════════════════════

function detectCardContext(historyPatterns, reversed) {
  if (historyPatterns?.cardSeenBefore && historyPatterns.timesSeenBefore >= 3) {
    return 'persistent_repeat';
  } else if (historyPatterns?.cardSeenBefore) {
    return 'repeated';
  } else if (reversed) {
    return 'reversed';
  }
  return 'new';
}

const READING_CATEGORIES = {
  career: 'material', finance: 'material',
  romance: 'relational', family: 'relational',
  wellness: 'internal', personal_growth: 'internal',
  shadow_work: 'depth', decision: 'crossroads',
  general: 'universal'
};

function getReadingCategory(readingType) {
  return READING_CATEGORIES[readingType] || 'universal';
}

function getMBTICategory(mbtiType) {
  if (!mbtiType) return 'balanced';
  const type = mbtiType.toUpperCase();
  if (['INTJ', 'INTP', 'ENTJ', 'ENTP'].includes(type)) return 'analyst';
  if (['INFJ', 'INFP', 'ENFJ', 'ENFP'].includes(type)) return 'diplomat';
  if (['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'].includes(type)) return 'sentinel';
  if (['ISTP', 'ISFP', 'ESTP', 'ESFP'].includes(type)) return 'explorer';
  return 'balanced';
}

function getGeometricCategory(geometricThemes) {
  if (!geometricThemes?.themes || geometricThemes.themes.length === 0) return 'neutral';
  return geometricThemes.themes[0].theme.toLowerCase();
}

function getElementCategory(element) {
  if (!element) return 'spirit';
  return element.toLowerCase(); // fire, water, air, earth, spirit
}

function detectUrgency(intention) {
  if (!intention) return 'routine';
  const lower = intention.toLowerCase();
  if (lower.match(/(urgent|emergency|crisis|immediately|asap|help|desperate)/)) return 'crisis';
  if (lower.match(/(soon|quickly|fast|now)/)) return 'urgent';
  return 'routine';
}

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

function getHistoryContext(historyPatterns) {
  if (!historyPatterns?.totalReadings) return 'beginner';
  const count = historyPatterns.totalReadings;
  if (count === 1) return 'first_reading';
  if (count <= 5) return 'novice';
  if (count <= 20) return 'regular';
  if (count <= 50) return 'experienced';
  return 'veteran';
}

// ═══════════════════════════════════════════════════════════
// REVERSED PATTERNS - Category-specific generators
// ═══════════════════════════════════════════════════════════

const REVERSED_META_TEMPLATES = {
  material: [
    '{cardName} inverted. {kw} is blocked, delayed, or operating in shadow. Practical obstacle revealed.',
    '{cardName} reversed: {kw} energy isn\'t flowing. Where\'s the dam?',
    '{cardName} upside down means {kw} needs troubleshooting.',
    'Reversed {cardName} indicates {kw} is stalled at the execution phase.'
  ],

  relational: [
    '{cardName} reversed. {kw} is stuck or turning inward. Relationship pattern highlighted.',
    '{cardName} inverted: {kw} is blocked by fear, not facts.',
    '{cardName} reversed shows {kw} energy is present but not expressed.',
    '{cardName} upside down means {kw} operates in the unspoken spaces between people.'
  ],

  internal: [
    '{cardName} reversed. {kw} is operating in your blind spot.',
    '{cardName} inverted: {kw} is there, but you\'re resisting it.',
    '{cardName} upside down reveals {kw} as the growth edge you\'re avoiding.',
    'Inverted {cardName}: {kw} triggers discomfort because it {verb_demand}s change you\'re not ready for.'
  ],

  depth: [
    '{cardName} reversed. {kw} in shadow—this is the work.',
    '{cardName} inverted. What you won\'t look at: {kw}.',
    '{cardName} reversed: {kw} is the teacher you\'re avoiding.',
    'Inverted {cardName} reveals {kw} as the unconscious pattern running your life.'
  ],

  universal: [
    '{cardName} reversed. {kw} encounters resistance or operates inverted.',
    '{cardName} upside down suggests {kw} needs a different approach.',
    'Reversed {cardName}: {kw} is present but not flowing naturally.'
  ]
};

// ═══════════════════════════════════════════════════════════
// INTEGRATION, SHADOW, ACTION - Compressed meta-templates
// ═══════════════════════════════════════════════════════════

const INTEGRATION_TEMPLATES = {
  action: 'Integration means taking {kw} from awareness to action. Knowing isn\'t enough—doing is.',
  embodiment: '{kw} lives in your body before it lives in your choices. Feel it first.',
  time: '{kw} doesn\'t integrate overnight. Give it the time it actually needs.',
  resistance: 'The parts of you resisting {kw} are the parts that most need it. Work there.',
  relationships: '{kw} integrated shows up in how you treat people, especially when triggered.',
  shadow: 'Integrating {kw} means accepting what it reveals about your shadow side.',
  paradox: 'Integrating {kw} means holding contradiction without needing resolution.',
  failure: 'You\'ll fail at integrating {kw} repeatedly. Failure is part of the process.'
};

const SHADOW_TEMPLATES = {
  projection: 'What you judge in others about {kw} lives in you. That\'s the work.',
  discomfort: '{kw} lives where you refuse to look. That discomfort is the path.',
  gold: 'Your shadow around {kw} contains power you\'ve been denying yourself.',
  wound: '{kw} lives in shadow because it\'s connected to old wounds. Tend them.',
  pattern: 'The pattern of {kw} repeats because it\'s in shadow. Illuminate it to break it.',
  shame: '{kw} in shadow carries shame. Shame dissolves in the light of witnessing.',
  power: '{kw} in shadow is power you\'re afraid to own. Own it anyway.',
  integration: '{kw} stays in shadow until you integrate it. Integration means acceptance, not elimination.'
};

const ACTION_TEMPLATES = {
  urgent: 'Act on {kw} within 24 hours. Not tomorrow—today. Now if possible.',
  immediate: '{kw} {verb_demand}s immediate response. What\'s the first concrete step? Take it immediately.',
  deadline: 'The window on {kw} is closing. {verb_action} before it shuts completely.',
  rapid: 'Don\'t overthink {kw}. Your first instinct is probably right. Trust it and {verb_action}.',

  routine: 'Take one small action toward {kw} today. Build momentum slowly.',
  steady: '{kw} doesn\'t require dramatic gestures—just consistent small steps.',
  foundation: '{kw} needs foundation before acceleration. Build the base first.',
  sustainable: 'Act on {kw} in a way you can repeat. Consistency over heroics.'
};

// ═══════════════════════════════════════════════════════════
// MAIN BUILDERS - Cascading synthesis (compressed)
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

  const kw = keywords[0] || 'change';
  const kw2 = keywords[1] || 'insight';

  const cardContext = detectCardContext(historyPatterns, reversed);
  const readingCategory = getReadingCategory(readingType);
  const mbtiCategory = getMBTICategory(mbtiType);
  const geomCategory = getGeometricCategory(geometricThemes);
  const urgency = detectUrgency(intention);

  const templateParams = { cardName, kw, kw2, intensity: urgency === 'crisis' ? 'strong' : 'medium' };

  // Select template pool based on cascading context
  let templatePool;

  if (cardContext === 'persistent_repeat') {
    templatePool = urgency === 'crisis' || urgency === 'urgent'
      ? META_TEMPLATES.persistent_urgent
      : META_TEMPLATES.persistent_routine;
  } else if (cardContext === 'repeated') {
    const mbtiKey = `repeated_${mbtiCategory}`;
    templatePool = META_TEMPLATES[mbtiKey] || META_TEMPLATES.repeated_analyst;
  } else if (cardContext === 'reversed') {
    const categoryKey = readingCategory;
    templatePool = REVERSED_META_TEMPLATES[categoryKey] || REVERSED_META_TEMPLATES.universal;
  } else {
    // New card - use geometric theme
    const themeKey = `theme_${geomCategory}`;
    templatePool = META_TEMPLATES[themeKey] || META_TEMPLATES.theme_neutral;
  }

  const template = pick(templatePool);
  return generateVariant(template, templateParams);
}

function buildElementCascade(params) {
  const { element, cardName, keywords } = params;
  const kw = keywords[0] || 'energy';
  const elemLower = element?.toLowerCase() || 'spirit';

  const templatePool = ELEMENT_META_TEMPLATES[elemLower] || ELEMENT_META_TEMPLATES.spirit;
  const template = pick(templatePool);

  return generateVariant(template, { cardName, kw });
}

function buildIntegrationCascade(params) {
  const { keywords } = params;
  const kw = keywords[0] || 'insight';

  const aspects = Object.keys(INTEGRATION_TEMPLATES);
  const selectedAspect = pick(aspects);
  const template = INTEGRATION_TEMPLATES[selectedAspect];

  return generateVariant(template, { kw });
}

function buildShadowCascade(params) {
  const { keywords } = params;
  const kw = keywords[0] || 'shadow';

  const aspects = Object.keys(SHADOW_TEMPLATES);
  const selectedAspect = pick(aspects);
  const template = SHADOW_TEMPLATES[selectedAspect];

  return generateVariant(template, { kw });
}

function buildActionCascade(params) {
  const { keywords, urgency } = params;
  const kw = keywords[0] || 'action';

  const urgencyLevel = urgency === 'crisis' || urgency === 'urgent' ? 'urgent' : 'routine';

  // Filter templates by urgency
  const relevantTemplates = Object.entries(ACTION_TEMPLATES)
    .filter(([key]) => {
      if (urgencyLevel === 'urgent') {
        return ['urgent', 'immediate', 'deadline', 'rapid'].includes(key);
      }
      return ['routine', 'steady', 'foundation', 'sustainable'].includes(key);
    })
    .map(([, template]) => template);

  const template = pick(relevantTemplates);
  return generateVariant(template, { kw });
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export {
  buildCascadingSynthesis,
  buildElementCascade,
  buildIntegrationCascade,
  buildShadowCascade,
  buildActionCascade,
  getMBTICategory,
  detectUrgency,
  detectIntentionPattern,
  getReadingCategory,
  getHistoryContext,
  getGeometricCategory,
  getElementCategory
};
