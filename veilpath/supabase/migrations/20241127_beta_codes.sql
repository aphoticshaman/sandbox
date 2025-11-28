-- ═══════════════════════════════════════════════════════════════════════════════
-- Beta Code System
-- Exclusive access for beta testers - makes them feel special, keeps out bots
--
-- Flow:
-- 1. User downloads app → sees "Enter Beta Code" screen
-- 2. User enters code → validated → granted access
-- 3. Code marked as used (or uses decremented for multi-use codes)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- BETA CODES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS beta_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The code itself (what users enter)
  code TEXT NOT NULL UNIQUE,

  -- Code metadata
  name TEXT, -- Internal name like "Twitter Giveaway Batch" or "Ryan's Friends"
  description TEXT,

  -- Usage limits
  max_uses INT DEFAULT 1, -- NULL = unlimited, 1 = single use, N = multi-use
  current_uses INT DEFAULT 0,

  -- Validity period
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- NULL = no expiry

  -- Perks granted with this code
  bonus_shards INT DEFAULT 0,
  bonus_cosmetics JSONB DEFAULT '[]'::JSONB, -- e.g., ["beta_tester_badge", "beta_card_back"]
  grants_title TEXT, -- e.g., "beta_tester" title ID

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Tracking
  created_by TEXT, -- Who generated this code
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Code type for analytics
  code_type TEXT DEFAULT 'standard' -- 'standard', 'influencer', 'friend', 'press', 'giveaway'
);

CREATE INDEX IF NOT EXISTS idx_beta_codes_code ON beta_codes(code);
CREATE INDEX IF NOT EXISTS idx_beta_codes_active ON beta_codes(is_active) WHERE is_active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- BETA CODE REDEMPTIONS
-- Track who used what code
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS beta_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES beta_codes(id) ON DELETE CASCADE,
  code_used TEXT NOT NULL, -- Store the actual code string for easy lookup

  -- What they got
  shards_granted INT DEFAULT 0,
  cosmetics_granted JSONB DEFAULT '[]'::JSONB,
  title_granted TEXT,

  -- When
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),

  -- User can only redeem one beta code ever
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON beta_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON beta_code_redemptions(code_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ADD BETA ACCESS FLAG TO PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_beta_access BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_code_used TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_joined_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- VALIDATE & REDEEM BETA CODE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION redeem_beta_code(
  p_user_id UUID,
  p_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_code RECORD;
  v_already_redeemed BOOLEAN;
BEGIN
  -- Normalize code (uppercase, trim)
  p_code := UPPER(TRIM(p_code));

  -- Check if user already has beta access
  SELECT EXISTS(
    SELECT 1 FROM beta_code_redemptions WHERE user_id = p_user_id
  ) INTO v_already_redeemed;

  IF v_already_redeemed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_redeemed',
      'message', 'You already have beta access!'
    );
  END IF;

  -- Find the code
  SELECT * INTO v_code
  FROM beta_codes
  WHERE code = p_code
    AND is_active = true;

  -- Code not found
  IF v_code IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Invalid beta code. Check for typos!'
    );
  END IF;

  -- Check if code is within valid period
  IF v_code.valid_from IS NOT NULL AND NOW() < v_code.valid_from THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_yet_valid',
      'message', 'This code isn''t active yet. Try again later!'
    );
  END IF;

  IF v_code.valid_until IS NOT NULL AND NOW() > v_code.valid_until THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'expired',
      'message', 'This code has expired.'
    );
  END IF;

  -- Check if code has uses remaining
  IF v_code.max_uses IS NOT NULL AND v_code.current_uses >= v_code.max_uses THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'max_uses_reached',
      'message', 'This code has been fully claimed.'
    );
  END IF;

  -- SUCCESS! Redeem the code

  -- Record the redemption
  INSERT INTO beta_code_redemptions (
    user_id, code_id, code_used,
    shards_granted, cosmetics_granted, title_granted
  ) VALUES (
    p_user_id, v_code.id, p_code,
    v_code.bonus_shards, v_code.bonus_cosmetics, v_code.grants_title
  );

  -- Increment code usage
  UPDATE beta_codes
  SET current_uses = current_uses + 1
  WHERE id = v_code.id;

  -- Grant beta access to user profile
  UPDATE profiles
  SET
    has_beta_access = true,
    beta_code_used = p_code,
    beta_joined_at = NOW(),
    shards = COALESCE(shards, 0) + v_code.bonus_shards
  WHERE id = p_user_id;

  -- Return success with perks info
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Welcome to the VeilPath beta!',
    'perks', jsonb_build_object(
      'shards', v_code.bonus_shards,
      'cosmetics', v_code.bonus_cosmetics,
      'title', v_code.grants_title
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- CHECK IF USER HAS BETA ACCESS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_beta_access(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_has_access BOOLEAN;
  v_code_used TEXT;
  v_joined_at TIMESTAMPTZ;
BEGIN
  SELECT has_beta_access, beta_code_used, beta_joined_at
  INTO v_has_access, v_code_used, v_joined_at
  FROM profiles
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'has_access', COALESCE(v_has_access, false),
    'code_used', v_code_used,
    'joined_at', v_joined_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- GENERATE BETA CODES (Admin function)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_beta_codes(
  p_count INT,
  p_name TEXT DEFAULT 'Batch',
  p_max_uses INT DEFAULT 1,
  p_bonus_shards INT DEFAULT 100,
  p_code_type TEXT DEFAULT 'standard',
  p_created_by TEXT DEFAULT 'system'
)
RETURNS TABLE(code TEXT) AS $$
DECLARE
  v_new_code TEXT;
  i INT;
BEGIN
  FOR i IN 1..p_count LOOP
    -- Generate a readable code like "VEIL-ABCD-1234"
    v_new_code := 'VEIL-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4);
    v_new_code := UPPER(v_new_code);

    -- Insert the code
    INSERT INTO beta_codes (
      code, name, max_uses, bonus_shards, code_type, created_by,
      bonus_cosmetics, grants_title
    ) VALUES (
      v_new_code,
      p_name || ' #' || i,
      p_max_uses,
      p_bonus_shards,
      p_code_type,
      p_created_by,
      '["beta_tester_badge"]'::JSONB,
      'beta_tester'
    );

    code := v_new_code;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- INSERT SOME INITIAL CODES
-- ─────────────────────────────────────────────────────────────────────────────

-- Ryan's personal codes (unlimited uses for testing)
INSERT INTO beta_codes (code, name, max_uses, bonus_shards, code_type, created_by, bonus_cosmetics, grants_title)
VALUES
  ('VEILPATH', 'Master Code', NULL, 500, 'friend', 'ryan', '["beta_tester_badge", "founder_card_back"]', 'beta_founder'),
  ('TAROT2024', 'Launch Code', 100, 200, 'giveaway', 'ryan', '["beta_tester_badge"]', 'beta_tester'),
  ('MYSTICBETA', 'Social Media', 50, 150, 'influencer', 'ryan', '["beta_tester_badge"]', 'beta_tester')
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN VIEW: Code usage stats
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW beta_code_stats AS
SELECT
  bc.code,
  bc.name,
  bc.code_type,
  bc.max_uses,
  bc.current_uses,
  CASE
    WHEN bc.max_uses IS NULL THEN 'unlimited'
    ELSE (bc.max_uses - bc.current_uses)::TEXT || ' remaining'
  END as availability,
  bc.bonus_shards,
  bc.is_active,
  bc.valid_until,
  bc.created_at
FROM beta_codes bc
ORDER BY bc.created_at DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE beta_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_code_redemptions ENABLE ROW LEVEL SECURITY;

-- No direct access to codes table (use functions)
-- Users can see their own redemption
CREATE POLICY "Users can view own redemption"
  ON beta_code_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'Beta code system created!';
  RAISE NOTICE '';
  RAISE NOTICE 'Initial codes:';
  RAISE NOTICE '  - VEILPATH: Master code (unlimited, 500 shards, founder rewards)';
  RAISE NOTICE '  - TAROT2024: Launch code (100 uses, 200 shards)';
  RAISE NOTICE '  - MYSTICBETA: Social media (50 uses, 150 shards)';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions:';
  RAISE NOTICE '  - redeem_beta_code(user_id, code): Validate and redeem';
  RAISE NOTICE '  - check_beta_access(user_id): Check if user has access';
  RAISE NOTICE '  - generate_beta_codes(count, name, ...): Create new codes';
END $$;
