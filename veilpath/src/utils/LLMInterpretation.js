/**
 * LLM Interpretation Client
 * Connects React Native app to Vercel API endpoints
 */

import { CARD_DATABASE } from '../data/cardDatabase';

// API base URL - configure in .env or app.config.js
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-vercel-app.vercel.app';

/**
 * Interpret a single card
 */
export async function interpretCard(card, context = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interpret-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        card: {
          id: card.id,
          name: card.name,
          arcana: card.arcana,
          suit: card.suit,
          element: card.element,
          keywords: card.keywords,
          darkFantasy: card.darkFantasy
        },
        context: {
          intention: context.question || context.intention || 'seeking guidance',
          spreadType: context.spreadType || 'single_card',
          reversed: card.reversed || false,
          position: context.position || null,
          userProfile: getUserProfile()
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to interpret card');
    }

    const result = await response.json();

    return {
      name: card.name,
      meaning: result.data.interpretation,
      card: card,
      meta: result.meta // tokens, cached, model
    };

  } catch (error) {
    console.error('[LLMInterpretation] interpretCard error:', error);

    // Fallback to stub if API fails
    return {
      name: card.name || "Unknown Card",
      meaning: "Card interpretation temporarily unavailable. Please check your connection and try again.",
      error: true
    };
  }
}

/**
 * Interpret full reading (multiple cards)
 */
export async function interpretReading(cards, question, spreadType = 'three_card') {
  try {
    // Step 1: Get individual card interpretations
    const cardInterpretations = await Promise.all(
      cards.map((card, index) =>
        interpretCard(card, {
          question,
          spreadType,
          position: getPositionName(index, spreadType)
        })
      )
    );

    // Step 2: Synthesize into cohesive narrative
    const synthesisResponse = await fetch(`${API_BASE_URL}/api/synthesize-reading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cards: cards.map((card, index) => ({
          id: card.id,
          name: card.name,
          arcana: card.arcana,
          suit: card.suit,
          reversed: card.reversed || false,
          position: getPositionName(index, spreadType)
        })),
        interpretations: cardInterpretations.map(interp => ({
          cardData: interp.card,
          interpretation: interp.meaning
        })),
        context: {
          intention: question,
          spreadType,
          userProfile: getUserProfile()
        }
      })
    });

    if (!synthesisResponse.ok) {
      const errorData = await synthesisResponse.json();
      throw new Error(errorData.error?.message || 'Failed to synthesize reading');
    }

    const synthesisResult = await synthesisResponse.json();

    return {
      summary: synthesisResult.data.synthesis,
      cards: cardInterpretations.map((interp, index) => ({
        card: cards[index],
        meaning: interp.meaning,
        position: getPositionName(index, spreadType)
      })),
      patterns: synthesisResult.data.patterns,
      meta: synthesisResult.meta
    };

  } catch (error) {
    console.error('[LLMInterpretation] interpretReading error:', error);

    // Fallback to stub if API fails
    return {
      summary: "Reading interpretation temporarily unavailable. Please check your connection and try again.",
      cards: cards.map(c => ({
        card: c,
        meaning: "Individual card interpretation temporarily unavailable."
      })),
      error: true
    };
  }
}

/**
 * Get Luna's narration for a moment
 */
export async function getLunaNarration(moment, context = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/narrate/luna`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moment, context })
    });

    if (!response.ok) {
      throw new Error('Failed to get Luna narration');
    }

    const result = await response.json();
    return result.data.narration;

  } catch (error) {
    console.error('[LLMInterpretation] getLunaNarration error:', error);
    return getDefaultNarration('luna', moment);
  }
}

/**
 * Get Sol's narration for a moment
 */
export async function getSolNarration(moment, context = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/narrate/sol`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moment, context })
    });

    if (!response.ok) {
      throw new Error('Failed to get Sol narration');
    }

    const result = await response.json();
    return result.data.narration;

  } catch (error) {
    console.error('[LLMInterpretation] getSolNarration error:', error);
    return getDefaultNarration('sol', moment);
  }
}

/**
 * Generate post-card reflection questions
 */
export async function generatePostCardQuestions(cards) {
  // For now, return contextual questions based on card count
  // Can be enhanced with LLM in future iteration
  const cardCount = cards.length;

  if (cardCount === 1) {
    return [
      "What aspect of this card speaks most directly to you?",
      "How might this card's wisdom apply to your current path?",
      "What shadow or challenge does this card illuminate?"
    ];
  } else if (cardCount === 3) {
    return [
      "How do you see these three cards speaking to each other?",
      "Which card feels most urgent or relevant right now?",
      "What pattern or thread connects all three cards?"
    ];
  } else {
    return [
      "What resonates most with you from this reading?",
      "Where do you see yourself in these cards?",
      "What action might you take based on this guidance?"
    ];
  }
}

/**
 * Generate mega synthesis (placeholder for future multi-reading analysis)
 */
export async function generateMegaSynthesis(readings) {
  // TODO: Implement multi-reading synthesis endpoint
  return {
    synthesis: "Multi-reading synthesis coming in Phase 4.",
    themes: [],
    insights: []
  };
}

// ===== HELPER FUNCTIONS =====

/**
 * Get position name for spread
 */
function getPositionName(index, spreadType) {
  const positions = {
    'single_card': ['Card'],
    'three_card': ['Past', 'Present', 'Future'],
    'five_card': ['Present Situation', 'Challenge', 'Past Influences', 'Future Trajectory', 'Advice'],
    'celtic_cross': [
      'Present Situation',
      'Challenge',
      'Foundation',
      'Recent Past',
      'Possible Future',
      'Near Future',
      'Your Approach',
      'External Influences',
      'Hopes & Fears',
      'Final Outcome'
    ]
  };

  const spreadPositions = positions[spreadType] || positions['three_card'];
  return spreadPositions[index] || `Card ${index + 1}`;
}

/**
 * Get user profile from storage
 * TODO: Implement proper user profile storage/retrieval
 */
function getUserProfile() {
  // For now, return empty profile
  // In future, retrieve from AsyncStorage or user state
  return {
    // mbtiType: 'INFJ',
    // zodiacSign: 'Pisces'
  };
}

/**
 * Default narration fallbacks
 */
function getDefaultNarration(narrator, moment) {
  const defaults = {
    luna: {
      reading_start: "Welcome, seeker. The Veil parts for you tonight.",
      card_drawn: "Another truth reveals itself beneath the moonlight.",
      reading_complete: "Your reading is complete. May its wisdom guide you through the cycles ahead.",
      reflection: "Sit with these revelations. Wisdom unfolds in its own time."
    },
    sol: {
      reading_start: "The cards are ready. Let's find the clarity you seek.",
      card_drawn: "Here is your next piece of the puzzle.",
      reading_complete: "You have your answer. Now choose your path forward.",
      action_needed: "The cards point to action. What will you do?"
    }
  };

  return defaults[narrator]?.[moment] || "The Shadowlands await.";
}

// Export all functions
export default {
  interpretCard,
  interpretReading,
  getLunaNarration,
  getSolNarration,
  generatePostCardQuestions,
  generateMegaSynthesis
};
