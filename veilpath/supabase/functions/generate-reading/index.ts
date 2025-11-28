import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cards, spreadType, intention, context } = await req.json()

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Fetch user's reading history for pattern detection
    const { data: readingHistory } = await supabaseClient
      .from('readings')
      .select('intention, cards, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    console.log(`[Edge Function] Loaded ${readingHistory?.length || 0} previous readings`)

    // Build prompt
    const prompt = buildReadingPrompt(cards, spreadType, intention, {
      ...context,
      readingHistory: readingHistory || [],
    })

    // Call Anthropic API
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not configured in Supabase secrets')
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.8,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text()
      console.error('[Edge Function] Anthropic API error:', error)
      throw new Error(`Anthropic API failed: ${anthropicResponse.status}`)
    }

    const anthropicData = await anthropicResponse.json()
    const responseText = anthropicData.content[0].text

    // Parse response
    const reading = parseClaudeResponse(responseText)

    return new Response(
      JSON.stringify(reading),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('[Edge Function] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

const SYSTEM_PROMPT = `You are an expert tarot reader and therapist who combines archetypal wisdom with practical psychological guidance. You provide readings that are:

1. THERAPEUTICALLY GROUNDED: Use CBT/DBT frameworks, not fortune-telling
2. ACTIONABLE: Every interpretation includes concrete next steps
3. EMPOWERING: Focus on agency and growth, not fatalism
4. NUANCED: Consider both upright and reversed meanings
5. STRUCTURED: Follow the exact JSON format provided

You MUST respond with valid JSON only. No markdown, no code blocks, just pure JSON.`

function buildReadingPrompt(cards: any[], spreadType: string, intention: string, context: any) {
  const { readingType = 'general', zodiacSign, birthdate, readingHistory = [] } = context

  const cardDetails = cards.map((c) => ({
    name: c.name || 'Unknown Card',
    arcana: c.arcana || 'unknown',
    element: c.element,
    position: c.position,
    reversed: c.reversed,
    keywords: c.keywords,
  }))

  const prompt = `Generate a tarot reading with the following details:

SPREAD TYPE: ${spreadType}
USER INTENTION: "${intention}"
READING TYPE: ${readingType}
${zodiacSign ? `ZODIAC SIGN: ${zodiacSign}` : ''}
${birthdate ? `BIRTHDATE: ${birthdate}` : ''}

${readingHistory.length > 0 ? `PREVIOUS READINGS (for pattern detection):
${readingHistory.map((r: any, i: number) => `${i + 1}. "${r.intention}" - ${new Date(r.created_at).toLocaleDateString()}`).join('\n')}

Consider these previous readings when identifying patterns and recurring themes.
` : ''}

CARDS DRAWN:
${cardDetails.map((c, i) => `${i + 1}. ${c.name} (${c.reversed ? 'REVERSED' : 'UPRIGHT'}) - Position: ${c.position}`).join('\n')}

Respond with ONLY valid JSON in this EXACT structure:

{
  "interpretations": [
    {
      "cardData": {
        "name": "The Fool",
        "arcana": "major",
        "element": "air",
        "numerology": "New beginnings, the number 0",
        "symbols": ["cliff", "white rose", "small dog", "sun"],
        "keywords": {
          "upright": ["beginnings", "innocence", "spontaneity", "free spirit"],
          "reversed": ["recklessness", "naivety", "foolishness", "risk"]
        }
      },
      "layers": {
        "archetypal": {
          "core_meaning": "2-3 sentences about the card's archetypal significance in this reading"
        },
        "contextual": {
          "position_significance": "How this card's position in the spread affects its meaning",
          "intention_alignment": "How this card relates to the user's stated intention"
        },
        "psychological": {
          "shadow_work": "What shadow aspects or blind spots this card reveals",
          "integration_path": "How to integrate this card's lesson into daily life"
        },
        "practical": {
          "action_steps": [
            "Concrete action step 1",
            "Concrete action step 2",
            "Concrete action step 3"
          ],
          "what_to_focus_on": "The key area or theme to prioritize based on this card"
        },
        "synthesis": {
          "core_message": "1-2 sentence summary of this card's overall message",
          "next_steps": "Immediate next steps to take based on this card"
        }
      }
    }
  ],
  "astrologicalContext": {
    "moonPhase": {
      "name": "Waxing Crescent",
      "meaning": "Growth and expansion energy"
    },
    "natalSign": "${zodiacSign || 'Unknown'}",
    "mercuryRetrograde": {
      "isRetrograde": false,
      "meaning": "Communication and technology are flowing smoothly"
    },
    "planetaryInfluences": {
      "dominantPlanet": "Venus",
      "energy": "Love, beauty, harmony"
    }
  },
  "spreadSummary": {
    "criticalInsight": "The single most important insight from this entire reading",
    "narrative": "A cohesive story connecting all cards in the spread (3-4 paragraphs)",
    "patterns": {
      "energyFlow": "ascending",
      "intensity": "moderate",
      "reversedCount": ${cards.filter(c => c.reversed).length},
      "totalCards": ${cards.length},
      "majorArcanaCount": ${cards.filter(c => c.cardIndex <= 21).length},
      "dominantElement": "fire",
      "dominantThemes": ["growth", "transformation", "action"]
    },
    "integratedActions": [
      "Top priority action based on ALL cards together",
      "Second priority action",
      "Third priority action"
    ]
  }
}

Generate ONE interpretation object per card drawn. Make the reading therapeutic, empowering, and actionable.`

  return prompt
}

function parseClaudeResponse(responseText: string) {
  let cleaned = responseText.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '')
  }

  return JSON.parse(cleaned)
}
