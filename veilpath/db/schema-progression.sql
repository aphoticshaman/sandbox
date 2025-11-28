-- LunatIQ Tarot - Progression & Authentication Schema
-- Server-authoritative user data

-- ═══════════════════════════════════════════════════════════
-- USERS (Authentication)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY, -- Anonymous ID or Firebase UID

  -- Authentication (optional - can be anonymous)
  email TEXT UNIQUE,
  password_hash TEXT, -- bcrypt hash if email/password auth
  is_anonymous BOOLEAN DEFAULT true,

  -- Device info (for anonymous users)
  device_id TEXT,

  -- Account status
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMP,
  battle_pass_active BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

-- ═══════════════════════════════════════════════════════════
-- USER PROGRESSION (Server-authoritative)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_progression (
  user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,

  -- Core progression
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,

  -- Currency balances (SOURCE OF TRUTH)
  moonlight INTEGER NOT NULL DEFAULT 0 CHECK (moonlight >= 0),
  veil_shards INTEGER NOT NULL DEFAULT 0 CHECK (veil_shards >= 0),

  -- Stats
  total_readings INTEGER DEFAULT 0,
  total_journal_entries INTEGER DEFAULT 0,
  total_reflections INTEGER DEFAULT 0,

  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_reading_date DATE,

  -- Unlocks (JSONB array of unlocked spread types)
  unlocked_spreads JSONB DEFAULT '["single_card"]'::jsonb,
  unlocked_cosmetics JSONB DEFAULT '[]'::jsonb,

  -- Achievements
  achievements JSONB DEFAULT '[]'::jsonb,

  -- Daily state
  daily_free_reading_used BOOLEAN DEFAULT false,
  daily_reading_count INTEGER DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progression_level ON user_progression(level DESC);
CREATE INDEX IF NOT EXISTS idx_progression_moonlight ON user_progression(moonlight DESC);

-- ═══════════════════════════════════════════════════════════
-- WEEKLY CHALLENGES (Server-authoritative)
-- ═══════════════════════════════════════════════════════════
-- NOTE: We only store completion metadata, NOT journal content (privacy)

CREATE TABLE IF NOT EXISTS weekly_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

  -- Week tracking
  week_number INTEGER NOT NULL, -- ISO week number
  year INTEGER NOT NULL,
  week_start_date DATE NOT NULL,

  -- Challenge state (completion only, no content)
  completed BOOLEAN DEFAULT false,
  word_count INTEGER, -- Just for stats, not actual content
  quality_score INTEGER, -- LLM verification score (1-10)

  -- Rewards
  moonlight_reward INTEGER,
  xp_reward INTEGER,
  streak_multiplier FLOAT,

  -- Timestamps
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint: one challenge per user per week
  CONSTRAINT weekly_challenges_unique UNIQUE (user_id, year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_challenges_user ON weekly_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_week ON weekly_challenges(year, week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_completed ON weekly_challenges(user_id, completed);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at for progression
DROP TRIGGER IF EXISTS update_user_progression_updated_at ON user_progression;
CREATE TRIGGER update_user_progression_updated_at
  BEFORE UPDATE ON user_progression
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Reset daily state at midnight (call this via cron or check on each API call)
CREATE OR REPLACE FUNCTION check_daily_reset()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_daily_reset < CURRENT_DATE THEN
    NEW.daily_free_reading_used = false;
    NEW.daily_reading_count = 0;
    NEW.last_daily_reset = CURRENT_DATE;

    -- Update streak
    IF NEW.last_reading_date IS NULL THEN
      -- No streak yet
      NULL;
    ELSIF NEW.last_reading_date = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Streak continues (reading was yesterday)
      NULL;
    ELSIF NEW.last_reading_date < CURRENT_DATE - INTERVAL '1 day' THEN
      -- Streak broken (no reading yesterday)
      NEW.current_streak = 0;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_progression_daily_reset ON user_progression;
CREATE TRIGGER user_progression_daily_reset
  BEFORE UPDATE ON user_progression
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_reset();

-- ═══════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════

-- Award currency (with validation)
CREATE OR REPLACE FUNCTION award_currency(
  p_user_id TEXT,
  p_currency_type TEXT,
  p_amount INTEGER,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_result JSONB;
BEGIN
  -- Get current balance
  IF p_currency_type = 'moonlight' THEN
    SELECT moonlight INTO v_balance_before FROM user_progression WHERE user_id = p_user_id;
  ELSIF p_currency_type = 'veilShards' THEN
    SELECT veil_shards INTO v_balance_before FROM user_progression WHERE user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Invalid currency type: %', p_currency_type;
  END IF;

  v_balance_after = v_balance_before + p_amount;

  -- Update balance
  IF p_currency_type = 'moonlight' THEN
    UPDATE user_progression SET moonlight = v_balance_after WHERE user_id = p_user_id;
  ELSE
    UPDATE user_progression SET veil_shards = v_balance_after WHERE user_id = p_user_id;
  END IF;

  -- Log transaction
  INSERT INTO currency_transactions (user_id, currency_type, amount, transaction_type, reason, balance_before, balance_after)
  VALUES (p_user_id, p_currency_type, p_amount, 'earn', p_reason, v_balance_before, v_balance_after);

  v_result = jsonb_build_object(
    'success', true,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'amount_awarded', p_amount
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Spend currency (with validation)
CREATE OR REPLACE FUNCTION spend_currency(
  p_user_id TEXT,
  p_currency_type TEXT,
  p_amount INTEGER,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_result JSONB;
BEGIN
  -- Get current balance
  IF p_currency_type = 'moonlight' THEN
    SELECT moonlight INTO v_balance_before FROM user_progression WHERE user_id = p_user_id;
  ELSIF p_currency_type = 'veilShards' THEN
    SELECT veil_shards INTO v_balance_before FROM user_progression WHERE user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Invalid currency type: %', p_currency_type;
  END IF;

  -- Check sufficient balance
  IF v_balance_before < p_amount THEN
    v_result = jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance',
      'balance', v_balance_before,
      'required', p_amount
    );
    RETURN v_result;
  END IF;

  v_balance_after = v_balance_before - p_amount;

  -- Update balance
  IF p_currency_type = 'moonlight' THEN
    UPDATE user_progression SET moonlight = v_balance_after WHERE user_id = p_user_id;
  ELSE
    UPDATE user_progression SET veil_shards = v_balance_after WHERE user_id = p_user_id;
  END IF;

  -- Log transaction
  INSERT INTO currency_transactions (user_id, currency_type, amount, transaction_type, reason, balance_before, balance_after)
  VALUES (p_user_id, p_currency_type, p_amount, 'spend', p_reason, v_balance_before, v_balance_after);

  v_result = jsonb_build_object(
    'success', true,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'amount_spent', p_amount
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Award XP and handle level ups
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id TEXT,
  p_xp_amount INTEGER,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_current_level INTEGER;
  v_current_xp INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN;
  v_result JSONB;
BEGIN
  SELECT level, xp INTO v_current_level, v_current_xp FROM user_progression WHERE user_id = p_user_id;

  v_new_xp = v_current_xp + p_xp_amount;
  v_new_level = calculate_level(v_new_xp);
  v_leveled_up = v_new_level > v_current_level;

  -- Update XP and level
  UPDATE user_progression
  SET xp = v_new_xp, level = v_new_level
  WHERE user_id = p_user_id;

  v_result = jsonb_build_object(
    'xp_gained', p_xp_amount,
    'new_xp', v_new_xp,
    'leveled_up', v_leveled_up,
    'old_level', v_current_level,
    'new_level', v_new_level
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Calculate level from XP (matches client-side logic)
CREATE OR REPLACE FUNCTION calculate_level(p_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_thresholds INTEGER[] := ARRAY[0, 100, 250, 500, 1000, 1750, 2750, 4000, 6000, 8500];
  v_level INTEGER := 1;
  v_i INTEGER;
BEGIN
  FOR v_i IN REVERSE array_upper(v_thresholds, 1)..1 LOOP
    IF p_xp >= v_thresholds[v_i] THEN
      v_level = v_i;
      EXIT;
    END IF;
  END LOOP;

  RETURN v_level;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE users IS 'User authentication and account status';
COMMENT ON TABLE user_progression IS 'Server-authoritative progression data (currency, XP, levels, unlocks)';
COMMENT ON TABLE weekly_challenges IS 'Weekly journal challenge completions and streaks';
COMMENT ON FUNCTION award_currency IS 'Award Moonlight or Veil Shards with transaction logging';
COMMENT ON FUNCTION spend_currency IS 'Spend currency with balance validation and logging';
COMMENT ON FUNCTION award_xp IS 'Award XP and automatically handle level ups';
