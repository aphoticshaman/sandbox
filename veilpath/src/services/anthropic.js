/**
 * ANTHROPIC SERVICE - Secure Claude API Integration
 * Generates tarot card interpretations using Claude via Supabase Edge Function
 * PRODUCTION VERSION - API key stored securely server-side
 */

import { supabase } from './supabase';

/**
 * Generate reading interpretation using Claude
 * Calls Supabase Edge Function which securely handles Anthropic API
 */
export async function generateReading(cards, spreadType, intention, context = {}) {
  const { readingType, zodiacSign, birthdate } = context;

  try {
    console.log('[Anthropic] Calling Edge Function...');

    // Get current session for auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[Anthropic] No active session, using fallback');
      return generateFallbackReading(cards, spreadType, intention, context);
    }

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-reading', {
      body: {
        cards,
        spreadType,
        intention,
        context: {
          readingType,
          zodiacSign,
          birthdate,
        },
      },
    });

    if (error) {
      console.error('[Anthropic] Edge Function error:', error);
      throw error;
    }

    console.log('[Anthropic] Reading generated successfully');
    return data;
  } catch (error) {
    console.error('[Anthropic] Failed to generate reading:', error);
    return generateFallbackReading(cards, spreadType, intention, context);
  }
}

/**
 * Fallback reading generator (used when Edge Function fails or user is offline)
 */
function generateFallbackReading(cards, spreadType, intention, context) {
  console.warn('[Anthropic] Using fallback reading');

  return {
    interpretations: cards.map((card) => {
      const cardData = getCardData(card.cardIndex);
      return {
        cardData: {
          name: cardData?.name || 'Unknown Card',
          arcana: cardData?.arcana || 'unknown',
          element: cardData?.element || 'spirit',
          numerology: 'Numerology data unavailable',
          symbols: cardData?.symbols || [],
          keywords: cardData?.keywords || { upright: [], reversed: [] },
        },
        layers: {
          archetypal: {
            core_meaning: `This card represents ${cardData?.keywords?.upright?.[0] || 'transformation'} in your journey.`,
          },
          contextual: {
            position_significance: `In the ${card.position} position, this card suggests a key area of focus.`,
            intention_alignment: `This relates to your intention: "${intention}"`,
          },
          psychological: {
            shadow_work: 'Reflect on what this card brings to light.',
            integration_path: 'Consider how to embody this energy daily.',
          },
          practical: {
            action_steps: [
              'Reflect on this card in your journal',
              'Identify where this applies',
              'Take one small inspired action',
            ],
            what_to_focus_on: cardData?.keywords?.upright?.[0] || 'Self-reflection',
          },
          synthesis: {
            core_message: 'This card invites deeper reflection.',
            next_steps: 'Journal about how this resonates.',
          },
        },
      };
    }),
    astrologicalContext: {
      moonPhase: { name: 'Current Phase', meaning: 'Astrological data unavailable' },
      natalSign: context.zodiacSign || 'Unknown',
      mercuryRetrograde: { isRetrograde: false, meaning: 'Unknown' },
      planetaryInfluences: { dominantPlanet: 'Unknown', energy: 'Neutral' },
    },
    spreadSummary: {
      criticalInsight: 'Reflect deeply on the cards and their connection to your intention.',
      narrative: `This ${spreadType} reading offers guidance on "${intention}".`,
      patterns: {
        energyFlow: 'balanced',
        intensity: 'moderate',
        reversedCount: cards.filter(c => c.reversed).length,
        totalCards: cards.length,
        majorArcanaCount: cards.filter(c => c.cardIndex <= 21).length,
        dominantElement: 'unknown',
        dominantThemes: ['reflection', 'growth'],
      },
      integratedActions: [
        'Journal about your reading',
        'Reflect on connections to your life',
        'Revisit in a week to track insights',
      ],
    },
  };
}

function getCardData(cardIndex) {
  try {
    const { CARD_DATABASE } = require('../data/cardDatabase');
    return CARD_DATABASE[cardIndex];
  } catch (error) {
    console.error('[Anthropic] Failed to load card database:', error);
    return null;
  }
}

export default { generateReading };
