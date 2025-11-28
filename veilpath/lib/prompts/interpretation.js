/**
 * Card Interpretation Prompt Builder
 * Creates personalized prompts for single card interpretations
 */

import { DARK_FANTASY_SYSTEM_PROMPT } from './system.js';

/**
 * Build prompt for card interpretation with rich user context
 * Incorporates MBTI, journal history, past readings for personalization
 */
export function buildInterpretationPrompt(card, context = {}) {
  const {
    intention = 'seeking guidance',
    spreadType = 'single_card',
    userProfile = {},
    reversed = false
  } = context;

  const { darkFantasy, keywords, element, suit, arcana } = card;

  let prompt = `Interpret this tarot card for a seeker:\n\n`;

  // Card identity
  prompt += `**Card:** ${card.name}${reversed ? ' (Reversed)' : ''}\n`;
  if (darkFantasy?.title) {
    prompt += `**Dark Fantasy Title:** "${darkFantasy.title}"\n`;
  }
  if (arcana) {
    prompt += `**Arcana:** ${arcana === 'major' ? 'Major' : 'Minor'}\n`;
  }
  if (suit && element) {
    prompt += `**Suit:** ${suit} (${element})\n`;
  }
  prompt += `\n`;

  // Seeker's context
  prompt += `**Seeker's Context:**\n`;
  prompt += `- Intention: "${intention}"\n`;
  prompt += `- Spread: ${formatSpreadType(spreadType)}\n`;

  // Personality-based personalization (MBTI is key)
  if (userProfile.mbtiType) {
    const mbtiGuidance = getMBTIInterpretationStyle(userProfile.mbtiType);
    prompt += `- MBTI: ${userProfile.mbtiType}\n`;
    prompt += `  ${mbtiGuidance}\n`;
  }
  if (userProfile.zodiacSign) {
    prompt += `- Zodiac: ${userProfile.zodiacSign}\n`;
  }

  // Experience level affects depth
  if (userProfile.level) {
    const levelStyle = userProfile.level < 5 ? 'Be welcoming and explain symbolism clearly' :
                       userProfile.level < 15 ? 'Go deeper into archetypal meanings' :
                       'Be esoteric and reference advanced tarot concepts';
    prompt += `- Experience: Level ${userProfile.level} seeker (${levelStyle})\n`;
  }

  // Current streak suggests engagement level
  if (userProfile.currentStreak && userProfile.currentStreak >= 3) {
    prompt += `- Dedication: ${userProfile.currentStreak}-day streak (acknowledge their commitment)\n`;
  }

  // Recent readings provide thematic context
  if (userProfile.recentReadings && userProfile.recentReadings.length > 0) {
    prompt += `\n**Recent Reading Themes (for continuity):**\n`;
    userProfile.recentReadings.slice(0, 3).forEach(r => {
      if (r.intention) {
        prompt += `- "${r.intention.slice(0, 80)}..." (${r.date || 'recent'})\n`;
      }
    });
    prompt += `Consider weaving continuity if themes relate to current intention.\n`;
  }

  // Journal themes reveal emotional state
  if (userProfile.recentJournalThemes && userProfile.recentJournalThemes.length > 0) {
    prompt += `\n**Recent Journal Themes (emotional context):**\n`;
    userProfile.recentJournalThemes.slice(0, 2).forEach(j => {
      const themes = j.themes?.join(', ') || 'reflection';
      prompt += `- Mood: ${j.mood || 'reflective'}, Themes: ${themes}\n`;
    });
    prompt += `Let their emotional journey inform your tone.\n`;
  }

  prompt += `\n`;

  // Traditional meanings (only if keywords exist)
  if (keywords) {
    prompt += `**Traditional Keywords:**\n`;
    if (reversed && keywords.reversed) {
      prompt += `- Reversed: ${keywords.reversed.slice(0, 5).join(', ')}\n`;
    } else if (keywords.upright) {
      prompt += `- Upright: ${keywords.upright.slice(0, 5).join(', ')}\n`;
    }
    prompt += `\n`;
  }

  // Dark fantasy flavor (if available)
  if (darkFantasy?.description) {
    prompt += `**Shadowlands Imagery:**\n`;
    prompt += `"${darkFantasy.description}"\n\n`;
  }

  // Quest connection (if available)
  if (darkFantasy?.questTie) {
    prompt += `**Quest Connection:** ${darkFantasy.questTie}\n\n`;
  }

  // Instructions
  prompt += `Provide a personalized interpretation that:\n`;
  prompt += `1. Connects deeply to their intention: "${intention}"\n`;
  prompt += `2. Uses vivid dark fantasy imagery from the Shadowlands\n`;
  prompt += `3. Offers practical, actionable guidance\n`;
  prompt += `4. Honors the card's archetypal meaning${reversed ? ' in its reversed/shadow aspect' : ''}\n`;
  prompt += `5. Speaks in 2-3 rich, atmospheric paragraphs\n`;

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
 * Get MBTI-specific interpretation style guidance
 * Each type processes information differently
 */
function getMBTIInterpretationStyle(mbti) {
  const styles = {
    // Analysts (NT)
    'INTJ': 'Use logical frameworks and strategic insights. Appeal to their vision and long-term planning.',
    'INTP': 'Explore multiple possibilities and theoretical connections. They love intellectual depth.',
    'ENTJ': 'Be direct and action-oriented. Focus on efficiency and achieving goals.',
    'ENTP': 'Offer novel perspectives and connections. They enjoy exploring ideas and possibilities.',

    // Diplomats (NF)
    'INFJ': 'Speak to their intuitive understanding and deeper meaning. Use metaphor and symbolism richly.',
    'INFP': 'Honor their values and emotional depth. Be authentic and imaginative.',
    'ENFJ': 'Focus on how this affects relationships and others. They care about impact.',
    'ENFP': 'Be enthusiastic and inspiring. Connect to their sense of possibility and growth.',

    // Sentinels (SJ)
    'ISTJ': 'Be practical and grounded. Provide clear, structured guidance they can apply.',
    'ISFJ': 'Be warm and supportive. Focus on how this affects their duties and loved ones.',
    'ESTJ': 'Be organized and efficient. Give them actionable steps and clear direction.',
    'ESFJ': 'Be encouraging and harmonious. Focus on relationships and practical care.',

    // Explorers (SP)
    'ISTP': 'Be concise and logical. Focus on practical applications and hands-on insights.',
    'ISFP': 'Be gentle and aesthetic. Honor their personal values and artistic sensibility.',
    'ESTP': 'Be dynamic and direct. Focus on immediate action and real-world impact.',
    'ESFP': 'Be lively and engaging. Connect to their love of experience and present moment.',
  };

  return styles[mbti] || 'Tailor interpretation to their unique perspective.';
}

/**
 * Build prompt for card in position (multi-card spread)
 */
export function buildPositionInterpretationPrompt(card, position, context = {}) {
  const basePrompt = buildInterpretationPrompt(card, context);

  // Add position-specific context
  const positionContext = `\n**Position in Spread:** ${position}\n`;
  positionContext += getPositionMeaning(position, context.spreadType);

  // Insert position context before instructions
  const parts = basePrompt.split('Provide a personalized interpretation');
  return parts[0] + positionContext + '\n\nProvide a personalized interpretation' + parts[1];
}

/**
 * Get meaning of card position in spread
 */
function getPositionMeaning(position, spreadType) {
  const positions = {
    'three_card': {
      0: 'Past - What brought you here',
      1: 'Present - Where you are now',
      2: 'Future - Where you\'re heading'
    },
    'five_card': {
      0: 'Present Situation',
      1: 'Challenge/Obstacle',
      2: 'Past Influences',
      3: 'Future Trajectory',
      4: 'Advice/Outcome'
    },
    'celtic_cross': {
      0: 'Present Situation - The heart of the matter',
      1: 'Challenge - What crosses you',
      2: 'Foundation - Root cause',
      3: 'Recent Past - What\'s passing',
      4: 'Possible Future - Potential outcome',
      5: 'Near Future - What approaches',
      6: 'Your Approach - How you show up',
      7: 'External Influences - Others\' impact',
      8: 'Hopes & Fears - Inner landscape',
      9: 'Final Outcome - Where this leads'
    }
  };

  const spreadPositions = positions[spreadType];
  if (!spreadPositions) return '';

  return `Meaning: ${spreadPositions[position] || 'Card ' + (position + 1)}`;
}

export default {
  buildInterpretationPrompt,
  buildPositionInterpretationPrompt,
  DARK_FANTASY_SYSTEM_PROMPT
};
