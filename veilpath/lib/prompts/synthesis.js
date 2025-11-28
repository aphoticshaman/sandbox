/**
 * Reading Synthesis Prompt Builder
 * Creates prompts for multi-card synthesis
 */

import { DARK_FANTASY_SYSTEM_PROMPT } from './system.js';

/**
 * Build prompt for reading synthesis
 */
export function buildSynthesisPrompt(cards, interpretations, context = {}) {
  const {
    intention = 'seeking guidance',
    spreadType = 'three_card',
    userProfile = {}
  } = context;

  let prompt = `Synthesize this complete tarot reading into a cohesive narrative:\n\n`;

  // Seeker's context
  prompt += `**Seeker's Intention:** "${intention}"\n`;
  prompt += `**Spread:** ${formatSpreadType(spreadType)}\n`;
  if (userProfile.mbtiType) {
    prompt += `**MBTI:** ${userProfile.mbtiType}\n`;
  }
  prompt += `\n`;

  // Cards drawn
  prompt += `**Cards Drawn:**\n`;
  cards.forEach((card, index) => {
    const cardData = interpretations[index]?.cardData || card;
    prompt += `${index + 1}. ${cardData.name}${card.reversed ? ' (Reversed)' : ''}`;
    if (card.position) {
      prompt += ` - Position: ${card.position}`;
    }
    prompt += `\n`;
  });
  prompt += `\n`;

  // Individual interpretations
  prompt += `**Individual Card Interpretations:**\n\n`;
  interpretations.forEach((interp, index) => {
    prompt += `**Card ${index + 1}: ${interp.cardData?.name || 'Unknown'}**\n`;
    prompt += `${interp.interpretation || interp.text || '(No interpretation)'}\n\n`;
  });

  // Synthesis instructions
  prompt += `---\n\n`;
  prompt += `Now, weave these individual interpretations into a **unified narrative** that:\n\n`;
  prompt += `1. **Tells a Story:** Create a cohesive journey through the cards\n`;
  prompt += `2. **Identifies Patterns:** Note recurring themes, elements, or energies\n`;
  prompt += `3. **Addresses the Intention:** Directly respond to "${intention}"\n`;
  prompt += `4. **Offers Guidance:** Provide clear, actionable next steps\n`;
  prompt += `5. **Uses Dark Fantasy Imagery:** Ground the synthesis in Shadowlands atmosphere\n`;
  prompt += `6. **Considers Card Relationships:** How do the cards speak to each other?\n\n`;

  prompt += `Structure your synthesis:\n`;
  prompt += `- **Opening:** Acknowledge the seeker's journey and what the cards reveal\n`;
  prompt += `- **The Pattern:** Describe the narrative arc through all cards\n`;
  prompt += `- **The Wisdom:** What the cards are teaching\n`;
  prompt += `- **The Path Forward:** Specific guidance for next steps\n\n`;

  prompt += `Length: 3-4 rich, atmospheric paragraphs.\n`;
  prompt += `Tone: Insightful, poetic, empowering, honest.\n`;

  return prompt;
}

/**
 * Format spread type for readability
 */
function formatSpreadType(spreadType) {
  const types = {
    'single_card': 'Single Card Reading',
    'three_card': 'Three Card Spread (Past-Present-Future)',
    'five_card': 'Five Card Cross',
    'celtic_cross': 'Celtic Cross (10 cards)',
    'relationship': 'Relationship Spread',
    'career': 'Career Guidance Spread'
  };

  return types[spreadType] || spreadType;
}

/**
 * Build prompt for pattern analysis (optional enhancement)
 */
export function buildPatternAnalysisPrompt(cards) {
  let prompt = `Analyze the patterns in this tarot spread:\n\n`;

  // Count major vs minor arcana
  const majorCount = cards.filter(c => c.arcana === 'major').length;
  const minorCount = cards.length - majorCount;

  prompt += `**Arcana Balance:**\n`;
  prompt += `- Major Arcana: ${majorCount} (archetypal, fate-driven)\n`;
  prompt += `- Minor Arcana: ${minorCount} (day-to-day, free will)\n\n`;

  // Count suits
  const suits = {};
  cards.forEach(c => {
    if (c.suit) {
      suits[c.suit] = (suits[c.suit] || 0) + 1;
    }
  });

  if (Object.keys(suits).length > 0) {
    prompt += `**Elemental Distribution:**\n`;
    Object.entries(suits).forEach(([suit, count]) => {
      const element = getSuitElement(suit);
      prompt += `- ${suit} (${element}): ${count}\n`;
    });
    prompt += `\n`;
  }

  // Count reversals
  const reversedCount = cards.filter(c => c.reversed).length;
  if (reversedCount > 0) {
    prompt += `**Reversed Cards:** ${reversedCount}/${cards.length}\n`;
    prompt += `(Indicates internal/blocked/shadow energy)\n\n`;
  }

  prompt += `Based on these patterns, what does the overall energy of this reading suggest?\n`;
  prompt += `Provide 2-3 sentences summarizing the dominant themes and energy signature.`;

  return prompt;
}

/**
 * Get element for suit
 */
function getSuitElement(suit) {
  const elements = {
    'wands': 'Fire',
    'cups': 'Water',
    'swords': 'Air',
    'pentacles': 'Earth'
  };
  return elements[suit.toLowerCase()] || 'Unknown';
}

export default {
  buildSynthesisPrompt,
  buildPatternAnalysisPrompt,
  DARK_FANTASY_SYSTEM_PROMPT
};
