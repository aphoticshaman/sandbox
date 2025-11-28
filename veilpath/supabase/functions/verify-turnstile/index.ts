/**
 * VERIFY TURNSTILE TOKEN
 * Validates Cloudflare Turnstile tokens before auth operations
 *
 * This Edge Function validates Turnstile tokens using Cloudflare's
 * siteverify API before allowing signup/signin operations.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface TurnstileValidationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Validate Turnstile token with Cloudflare siteverify API
 */
async function validateTurnstileToken(
  token: string,
  remoteip?: string
): Promise<TurnstileValidationResponse> {
  if (!TURNSTILE_SECRET_KEY || TURNSTILE_SECRET_KEY === 'YOUR_TURNSTILE_SECRET_KEY') {
    console.warn('[Turnstile] Secret key not configured, allowing request');
    return { success: true }; // Graceful fallback if not configured
  }

  const formData = new FormData();
  formData.append('secret', TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  if (remoteip) {
    formData.append('remoteip', remoteip);
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const result: TurnstileValidationResponse = await response.json();
    return result;
  } catch (error) {
    console.error('[Turnstile] Validation error:', error);
    return {
      success: false,
      'error-codes': ['internal-error'],
    };
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

  try {
    const { action, email, password, turnstileToken } = await req.json();

    // Get client IP
    const remoteip = req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-forwarded-for') ||
                     'unknown';

    // Validate Turnstile token if provided
    if (turnstileToken) {
      const validation = await validateTurnstileToken(turnstileToken, remoteip);

      if (!validation.success) {
        return new Response(
          JSON.stringify({
            error: 'Captcha verification failed',
            details: validation['error-codes'],
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      console.log('[Turnstile] Token validated successfully');
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Perform auth action
    let result;
    if (action === 'signup') {
      result = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Require email confirmation
      });
    } else if (action === 'signin') {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    } else {
      throw new Error('Invalid action. Must be "signup" or "signin"');
    }

    if (result.error) {
      return new Response(
        JSON.stringify({
          error: result.error.message,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        user: result.data.user,
        session: result.data.session,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('[verify-turnstile] Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
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
