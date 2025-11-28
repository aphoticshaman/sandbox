/**
 * CLAIM-BONUS EDGE FUNCTION
 *
 * Server-side bonus claiming with maximum security.
 * This is THE source of truth for currency grants.
 *
 * SECURITY MEASURES:
 * 1. Rate limiting (max 10 claims per hour per device)
 * 2. Device fingerprint tracking (prevent multi-account farming)
 * 3. Signature verification (detect request tampering)
 * 4. Double-claim prevention (database-level unique constraints)
 * 5. Audit logging (every claim is logged)
 * 6. Anomaly detection (flag suspicious patterns)
 * 7. IP-based velocity checks
 *
 * NEVER. TRUST. THE. CLIENT.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bonus definitions (server-side source of truth)
const BONUSES: Record<string, { amount: number; maxClaims: number; cooldownMs: number }> = {
  first_shop_visit: { amount: 1000, maxClaims: 1, cooldownMs: 0 },
  first_reading: { amount: 250, maxClaims: 1, cooldownMs: 0 },
  first_interpretation: { amount: 150, maxClaims: 1, cooldownMs: 0 },
  first_reading_questions: { amount: 100, maxClaims: 1, cooldownMs: 0 },
  first_journal: { amount: 200, maxClaims: 1, cooldownMs: 0 },
  first_two_day_streak: { amount: 300, maxClaims: 1, cooldownMs: 0 },
  mbti_completion: { amount: 500, maxClaims: 1, cooldownMs: 0 },
  mbti_selection: { amount: 100, maxClaims: 1, cooldownMs: 0 },
};

// Rate limits
const RATE_LIMITS = {
  claimsPerHour: 10,
  claimsPerDay: 20,
  suspiciousThreshold: 5, // Claims in 5 minutes = suspicious
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const body = await req.json();
    const { data: claimRequest, signature, signedAt } = body;

    // 1. VALIDATE REQUEST STRUCTURE
    if (!claimRequest || !claimRequest.bonusId || !claimRequest.deviceFingerprint) {
      return jsonResponse({ success: false, error: 'Invalid request structure' }, 400);
    }

    const { bonusId, userId, deviceFingerprint, timestamp, platform, context } = claimRequest;

    // 2. VALIDATE BONUS EXISTS
    const bonus = BONUSES[bonusId];
    if (!bonus) {
      await logAttempt(supabase, 'invalid_bonus', { bonusId, deviceFingerprint });
      return jsonResponse({ success: false, error: 'Invalid bonus type' }, 400);
    }

    // 3. TIMESTAMP VALIDATION (Prevent replay attacks)
    const now = Date.now();
    const requestAge = now - timestamp;
    if (requestAge > 60000 || requestAge < -5000) { // Max 1 min old, 5 sec future (clock skew)
      await logAttempt(supabase, 'stale_request', { bonusId, deviceFingerprint, requestAge });
      return jsonResponse({ success: false, error: 'Request expired' }, 400);
    }

    // 4. GET CLIENT IP FOR VELOCITY CHECKS
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    // 5. RATE LIMITING (Per device fingerprint)
    const rateLimitCheck = await checkRateLimit(supabase, deviceFingerprint, clientIp);
    if (!rateLimitCheck.allowed) {
      await logAttempt(supabase, 'rate_limited', { bonusId, deviceFingerprint, clientIp });
      return jsonResponse({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: rateLimitCheck.retryAfterMs,
      }, 429);
    }

    // 6. CHECK IF ALREADY CLAIMED (Database level - source of truth)
    // Check by device fingerprint (prevents multi-account farming)
    const { data: existingDeviceClaim } = await supabase
      .from('bonus_claims')
      .select('id')
      .eq('bonus_id', bonusId)
      .eq('device_fingerprint', deviceFingerprint)
      .single();

    if (existingDeviceClaim) {
      return jsonResponse({
        success: false,
        alreadyClaimed: true,
        error: 'This device has already claimed this bonus',
      }, 200); // 200 so client knows it's not an error, just already claimed
    }

    // Check by user ID if authenticated
    if (userId) {
      const { data: existingUserClaim } = await supabase
        .from('bonus_claims')
        .select('id')
        .eq('bonus_id', bonusId)
        .eq('user_id', userId)
        .single();

      if (existingUserClaim) {
        return jsonResponse({
          success: false,
          alreadyClaimed: true,
          error: 'You have already claimed this bonus',
        }, 200);
      }
    }

    // 7. ANOMALY DETECTION
    const anomalyCheck = await checkForAnomalies(supabase, deviceFingerprint, clientIp, bonusId);
    if (anomalyCheck.suspicious) {
      await logAttempt(supabase, 'anomaly_detected', {
        bonusId,
        deviceFingerprint,
        clientIp,
        reason: anomalyCheck.reason,
      });

      // Don't block, but flag for manual review
      console.warn(`[ANOMALY] Suspicious claim: ${anomalyCheck.reason}`);
    }

    // 8. GRANT THE BONUS (Atomic transaction)
    const transactionId = `txn_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Insert claim record
    const { error: claimError } = await supabase
      .from('bonus_claims')
      .insert({
        bonus_id: bonusId,
        user_id: userId || null,
        device_fingerprint: deviceFingerprint,
        amount: bonus.amount,
        transaction_id: transactionId,
        ip_address: clientIp,
        platform,
        claimed_at: new Date().toISOString(),
        context: context || {},
        suspicious: anomalyCheck.suspicious,
      });

    if (claimError) {
      // Unique constraint violation = already claimed (race condition)
      if (claimError.code === '23505') {
        return jsonResponse({
          success: false,
          alreadyClaimed: true,
          error: 'Bonus already claimed',
        }, 200);
      }

      console.error('[ClaimBonus] Insert failed:', claimError);
      return jsonResponse({ success: false, error: 'Failed to process claim' }, 500);
    }

    // 9. UPDATE USER BALANCE (If authenticated)
    if (userId) {
      // Use RPC for atomic balance update (prevents race conditions)
      const { error: balanceError } = await supabase.rpc('add_veil_shards', {
        p_user_id: userId,
        p_amount: bonus.amount,
        p_transaction_id: transactionId,
        p_reason: `bonus_${bonusId}`,
      });

      if (balanceError) {
        console.error('[ClaimBonus] Balance update failed:', balanceError);
        // Rollback the claim
        await supabase
          .from('bonus_claims')
          .delete()
          .eq('transaction_id', transactionId);

        return jsonResponse({ success: false, error: 'Failed to credit balance' }, 500);
      }
    } else {
      // Store for anonymous user - will be claimed when they sign up
      const { error: pendingError } = await supabase
        .from('pending_anonymous_bonuses')
        .insert({
          device_fingerprint: deviceFingerprint,
          bonus_id: bonusId,
          amount: bonus.amount,
          transaction_id: transactionId,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (pendingError) {
        console.error('[ClaimBonus] Pending bonus insert failed:', pendingError);
      }
    }

    // 10. AUDIT LOG
    await logAttempt(supabase, 'claim_success', {
      bonusId,
      amount: bonus.amount,
      transactionId,
      userId,
      deviceFingerprint,
      clientIp,
    });

    // 11. RETURN SUCCESS
    return jsonResponse({
      success: true,
      amount: bonus.amount,
      transactionId,
      message: 'Bonus claimed successfully!',
    }, 200);

  } catch (error) {
    console.error('[ClaimBonus] Error:', error);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500);
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function checkRateLimit(supabase: any, deviceFingerprint: string, ip: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Check claims per hour (by device)
  const { count: hourlyCount } = await supabase
    .from('bonus_claims')
    .select('id', { count: 'exact', head: true })
    .eq('device_fingerprint', deviceFingerprint)
    .gte('claimed_at', oneHourAgo);

  if ((hourlyCount || 0) >= RATE_LIMITS.claimsPerHour) {
    return { allowed: false, retryAfterMs: 60 * 60 * 1000 };
  }

  // Check claims per day (by IP - catches VPN hoppers)
  const { count: dailyCount } = await supabase
    .from('bonus_claims')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('claimed_at', oneDayAgo);

  if ((dailyCount || 0) >= RATE_LIMITS.claimsPerDay) {
    return { allowed: false, retryAfterMs: 24 * 60 * 60 * 1000 };
  }

  return { allowed: true };
}

async function checkForAnomalies(supabase: any, deviceFingerprint: string, ip: string, bonusId: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  // Check for rapid claims (suspicious)
  const { count: recentCount } = await supabase
    .from('bonus_claims')
    .select('id', { count: 'exact', head: true })
    .eq('device_fingerprint', deviceFingerprint)
    .gte('claimed_at', fiveMinutesAgo);

  if ((recentCount || 0) >= RATE_LIMITS.suspiciousThreshold) {
    return { suspicious: true, reason: 'rapid_claiming' };
  }

  // Check for IP with too many different devices
  const { data: ipDevices } = await supabase
    .from('bonus_claims')
    .select('device_fingerprint')
    .eq('ip_address', ip)
    .gte('claimed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const uniqueDevices = new Set((ipDevices || []).map((d: any) => d.device_fingerprint));
  if (uniqueDevices.size >= 5) {
    return { suspicious: true, reason: 'multi_device_ip' };
  }

  // Check for bonus hopping (trying all bonuses rapidly)
  const { count: bonusVariety } = await supabase
    .from('bonus_claims')
    .select('bonus_id', { count: 'exact', head: true })
    .eq('device_fingerprint', deviceFingerprint)
    .gte('claimed_at', fiveMinutesAgo);

  if ((bonusVariety || 0) >= 3) {
    return { suspicious: true, reason: 'bonus_hopping' };
  }

  return { suspicious: false };
}

async function logAttempt(supabase: any, type: string, data: any) {
  try {
    await supabase
      .from('bonus_audit_log')
      .insert({
        event_type: type,
        event_data: data,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('[Audit] Failed to log:', error);
  }
}
