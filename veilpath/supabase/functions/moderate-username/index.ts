/**
 * MODERATE USERNAME
 * Uses LLM to detect inappropriate usernames that bypass pattern matching
 *
 * Catches:
 * - Leet speak (f4gg0t, n1gg4, etc.)
 * - Creative spelling (fuhck, sh1t, etc.)
 * - Hate speech and slurs
 * - Sexual content
 * - Harassment/violence references
 *
 * Uses Claude 3.5 Haiku for fast, cheap moderation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const MODERATION_PROMPT = `You are a username moderation system. Your job is to determine if a username is appropriate for a wellness/tarot app.

REJECT usernames that contain:
- Slurs or hate speech (including leet speak like n1gg4, f4gg0t, etc.)
- Sexual content or innuendo (including hidden references)
- References to violence, death, or self-harm
- Drug references beyond cannabis
- Impersonation of staff/admin roles
- Excessive profanity (even creatively spelled)
- Harassment or threatening language
- References to real tragedies or hate groups

ALLOW usernames that are:
- Normal names, words, or creative combinations
- Fantasy/mystical themes (dragons, moon, shadow, etc.)
- Gaming-style usernames with numbers
- Mild humor that isn't offensive
- Pop culture references that aren't harmful

Respond with ONLY a JSON object:
{"approved": true} if the username is acceptable
{"approved": false, "reason": "Brief explanation"} if rejected

Be strict but fair. When in doubt, reject.`;

interface ModerationResponse {
  approved: boolean;
  reason?: string;
}

async function moderateWithClaude(username: string): Promise<ModerationResponse> {
  if (!ANTHROPIC_API_KEY) {
    console.warn('[moderate-username] Anthropic API key not configured');
    // Fail closed - don't allow potentially bad usernames if moderation is disabled
    return { approved: false, reason: 'Moderation service not configured' };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: `${MODERATION_PROMPT}\n\nUsername to check: "${username}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[moderate-username] Claude API error:', response.status, errorText);
      return { approved: false, reason: 'Moderation service error' };
    }

    const result = await response.json();
    const content = result.content?.[0]?.text;

    if (!content) {
      console.error('[moderate-username] Empty response from Claude');
      return { approved: false, reason: 'Moderation check failed' };
    }

    // Parse the JSON response
    try {
      // Extract JSON from response (Claude sometimes adds extra text)
      const jsonMatch = content.match(/\{[^}]+\}/);
      if (!jsonMatch) {
        console.error('[moderate-username] No JSON in response:', content);
        return { approved: false, reason: 'Moderation check failed' };
      }

      const moderation: ModerationResponse = JSON.parse(jsonMatch[0]);
      console.log(`[moderate-username] "${username}" -> ${moderation.approved ? 'APPROVED' : `REJECTED: ${moderation.reason}`}`);
      return moderation;
    } catch (parseError) {
      console.error('[moderate-username] Failed to parse response:', content);
      return { approved: false, reason: 'Moderation check failed' };
    }
  } catch (error) {
    console.error('[moderate-username] Error:', error);
    return { approved: false, reason: 'Moderation service unavailable' };
  }
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ approved: false, reason: 'Invalid username provided' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Quick sanity check - username should be max 11 chars
    if (username.length > 11) {
      return new Response(
        JSON.stringify({ approved: false, reason: 'Username too long' }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const result = await moderateWithClaude(username);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('[moderate-username] Error:', error);

    return new Response(
      JSON.stringify({
        approved: false,
        reason: 'Moderation service error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
