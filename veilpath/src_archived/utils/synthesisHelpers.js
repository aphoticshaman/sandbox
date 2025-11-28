/**
 * SYNTHESIS HELPERS - Metaprogrammed transitions and templates
 *
 * Compresses repetitive hardcoded arrays in megaSynthesisEngine.js
 * using template-based generation.
 */

import { qRandom } from './quantumRNG';

function pick(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(qRandom() * arr.length)];
}

// ═══════════════════════════════════════════════════════════
// META-PATTERNS - Compressed transition generators
// ═══════════════════════════════════════════════════════════

const TRANSITION_PATTERNS = {
  skepticism: [
    'If part of you thinks this is bullshit, {action}. {reason}.',
    'You might be tempted to {dismiss}. {counter}.',
    'Tarot {truth}—because it\'s {metaphor}.',
    'If you\'re skeptical, {validation}. But {warning}.'
  ],

  skepticismVariables: {
    action: [
      'notice that reaction',
      'sit with that',
      'acknowledge it',
      'pay attention to why'
    ],
    reason: [
      'Sometimes skepticism is wisdom. Sometimes it\'s fear of being seen',
      'What are you defending against?',
      'That resistance is information',
      'The charge reveals something'
    ],
    dismiss: [
      'dismiss this as confirmation bias',
      'rationalize this away',
      'explain this as coincidence'
    ],
    counter: [
      'Fair enough. But ask yourself: why does that bother you? What would it mean if this WAS meaningful?',
      'But what if you\'re using logic to avoid feeling?',
      'Your need to debunk might be defending against vulnerability'
    ],
    truth: [
      'works whether you believe in it or not',
      'isn\'t magic, it\'s mirroring',
      'doesn\'t require faith'
    ],
    metaphor: [
      'a mirror, not a magic 8-ball',
      'psychology dressed in symbols',
      'pattern recognition, not prophecy'
    ],
    validation: [
      'good. Blind faith is dangerous',
      'healthy skepticism beats gullibility',
      'question everything'
    ],
    warning: [
      'so is cynicism that protects you from uncomfortable truths',
      'don\'t let skepticism become an excuse for avoidance',
      'intellectual superiority can be its own defense mechanism'
    ]
  },

  empowerment: [
    'These cards don\'t tell you what WILL happen—they {reveal}. {truth}.',
    '{denial}. It\'s about {reality}. {agency}.',
    '{warning}. Use it as {purpose}. {choice}.',
    'If you came here hoping the cards would {dependency}, they won\'t. {redirect}. Then YOU choose.'
  ],

  empowermentVariables: {
    reveal: [
      'show you what\'s possible if you choose it',
      'illuminate options you have now',
      'map terrain, not destiny'
    ],
    truth: [
      'The universe doesn\'t decide for you. You decide, and the universe responds',
      'Your agency is the point, not a variable',
      'Free will meets probability here'
    ],
    denial: [
      'Reading tarot isn\'t about predicting a fixed future',
      'This isn\'t fortune-telling',
      'Don\'t mistake this for prophecy'
    ],
    reality: [
      'seeing your options clearly so you can make better choices NOW',
      'intel for decision-making',
      'information, not predestination'
    ],
    agency: [
      'Your agency is the point, not a variable',
      'You\'re the decision-maker, the cards are advisors',
      'Power stays with you'
    ],
    warning: [
      'Don\'t use this reading as permission to wait',
      'Action beats contemplation',
      'Insight without application is entertainment'
    ],
    purpose: [
      'intel to act',
      'information for movement',
      'fuel for decision'
    ],
    choice: [
      'The cards show terrain, but you choose the path. Sitting still IS a choice—just usually the wrong one',
      'Direction is yours to determine',
      'Maps don\'t walk themselves'
    ],
    dependency: [
      'make the decision for you',
      'remove the burden of choice',
      'tell you what to do'
    ],
    redirect: [
      'They\'ll show you what you already know but haven\'t admitted',
      'They reveal, they don\'t command',
      'The wisdom is already yours'
    ]
  }
};

// ═══════════════════════════════════════════════════════════
// TRANSITION GENERATORS
// ═══════════════════════════════════════════════════════════

export function getSkepticismStatement() {
  const pattern = pick(TRANSITION_PATTERNS.skepticism);
  const vars = TRANSITION_PATTERNS.skepticismVariables;

  return pattern.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] ? pick(vars[key]) : match;
  });
}

export function getEmpowermentStatement() {
  const pattern = pick(TRANSITION_PATTERNS.empowerment);
  const vars = TRANSITION_PATTERNS.empowermentVariables;

  return pattern.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] ? pick(vars[key]) : match;
  });
}

// Simple template-based transitions
const SIMPLE_TRANSITIONS = {
  card: [
    'Now, let\'s look at what the cards themselves are saying.',
    'The cards laid out before you tell a specific story.',
    'Here\'s where we get into the heart of your reading.',
    'Let me walk you through what each card reveals.'
  ],

  pattern: (verb = 'examine') => [
    `Now let's ${verb} how these cards speak to each other and what patterns emerge.`,
    'Individual cards tell part of the story. The spaces between them tell the rest.',
    'The cards you drew aren\'t random. They form a constellation of meaning.',
    'Beyond the surface reading, there are deeper currents at work here.'
  ],

  spiritual: [
    'This brings me to something bigger—the spiritual landscape you\'re navigating.',
    'Let\'s zoom out to the spiritual framework underpinning all of this.',
    'Now, about the spiritual territory you\'re crossing.',
    'There\'s a meta-level worth addressing here.'
  ],

  mbti: (type = 'personality') => [
    `Now, let's talk about how your ${type} type processes all of this.`,
    `Given your ${type}, there are specific things you need to know.`,
    `Your ${type} matters here. Here's why.`,
    `As a${type.includes('MBTI') ? 'n' : ''} ${type}, you'll want to pay attention to this.`
  ],

  action: [
    '## What To Do Now',
    '## Your Next Steps',
    '## From Insight to Action',
    '## Making This Real'
  ],

  closing: [
    '\n\n* * *\n\n',
    '\n\n---\n\n',
    '\n\n•••\n\n'
  ],

  wisdom: [
    '\n\n━━ WISDOM TO CARRY FORWARD ━━\n\n',
    '\n\n━━ REFLECTIONS FOR YOUR PATH ━━\n\n',
    '\n\n━━ GUIDANCE FROM THE CARDS ━━\n\n',
    '\n\n━━ WORDS TO REMEMBER ━━\n\n'
  ]
};

export function getCardTransition() {
  return pick(SIMPLE_TRANSITIONS.card);
}

export function getPatternTransition(verb) {
  const transitions = SIMPLE_TRANSITIONS.pattern(verb);
  return pick(transitions);
}

export function getSpiritualTransition() {
  return pick(SIMPLE_TRANSITIONS.spiritual);
}

export function getMBTITransition(mbtiType) {
  const transitions = SIMPLE_TRANSITIONS.mbti(mbtiType || 'personality');
  return pick(transitions);
}

export function getActionTransition() {
  return pick(SIMPLE_TRANSITIONS.action);
}

export function getClosingTransition() {
  return pick(SIMPLE_TRANSITIONS.closing);
}

export function getWisdomTransition() {
  return pick(SIMPLE_TRANSITIONS.wisdom);
}

// ═══════════════════════════════════════════════════════════
// STRUCTURE VARIATIONS - Card introduction formats
// ═══════════════════════════════════════════════════════════

const STRUCTURE_META_PATTERNS = [
  // Standard (20%)
  '**{cardName}** in {position}: {sentence}',

  // Position-first
  'In {position}, **{cardName}** emerges. {sentence}',
  'The {position} position holds **{cardName}**. {sentence}',
  '{position}: Here we find **{cardName}**. {sentence}',

  // Card-first, no position header
  '**{cardName}** speaks to {position}. {sentence}',
  '**{cardName}**. {sentence} This is the energy of {position}.',

  // Direct dive
  '{sentence} This is **{cardName}** in {position}.',
  '{sentence} **{cardName}** has appeared in {position}.',

  // Conversational
  'Let\'s talk about **{cardName}** in {position}. {sentence}',
  '**{cardName}** showed up in {position}—and that\'s significant. {sentence}',

  // Mystical
  'The cards reveal **{cardName}** in {position}. {sentence}',
  '**{cardName}**. {position}. {sentence}'
];

export function getCardStructureVariation(cardName, position, sentence, seed = qRandom()) {
  const pattern = STRUCTURE_META_PATTERNS[Math.floor(seed * STRUCTURE_META_PATTERNS.length) % STRUCTURE_META_PATTERNS.length];

  return pattern
    .replace('{cardName}', cardName)
    .replace('{position}', position)
    .replace('{sentence}', sentence);
}
