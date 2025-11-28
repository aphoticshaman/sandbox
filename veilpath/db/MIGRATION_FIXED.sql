-- ═══════════════════════════════════════════════════════════
-- LunatIQ Tarot - FIXED Progression Migration for Neon
-- ═══════════════════════════════════════════════════════════
-- Works with EXISTING users table structure (id UUID)
-- COPY THIS ENTIRE FILE AND PASTE INTO NEON SQL EDITOR
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- PREREQUISITE: update_updated_at_column() function
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════
-- EXISTING USERS TABLE - Add missing columns
-- ═══════════════════════════════════════════════════════════
-- The users table already exists with id UUID as primary key
-- We just add the is_premium column if missing

DO $$
BEGIN
  -- Add is_premium column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;

  -- Add premium_expires_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'premium_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN premium_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add battle_pass_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'battle_pass_active'
  ) THEN
    ALTER TABLE users ADD COLUMN battle_pass_active BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- USER PROGRESSION TABLE
-- ═══════════════════════════════════════════════════════════
-- References existing users.id (UUID) column

CREATE TABLE IF NOT EXISTS user_progression (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progression_level ON user_progression(level DESC);
CREATE INDEX IF NOT EXISTS idx_progression_moonlight ON user_progression(moonlight DESC);
CREATE INDEX IF NOT EXISTS idx_progression_user_id ON user_progression(user_id);

-- ═══════════════════════════════════════════════════════════
-- CURRENCY TRANSACTIONS TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS currency_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Transaction details
  currency_type TEXT NOT NULL CHECK (currency_type IN ('veilShards', 'moonlight')),
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend')),
  reason TEXT,

  -- Balance tracking
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT currency_transactions_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_currency_user_id ON currency_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_created_at ON currency_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_currency_user_created ON currency_transactions(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- WEEKLY CHALLENGES TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS weekly_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Week tracking
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  week_start_date DATE NOT NULL,

  -- Challenge state (completion only, no content)
  completed BOOLEAN DEFAULT false,
  word_count INTEGER,
  quality_score INTEGER,

  -- Rewards
  moonlight_reward INTEGER,
  xp_reward INTEGER,
  streak_multiplier FLOAT,

  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

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

-- Reset daily state at midnight
CREATE OR REPLACE FUNCTION check_daily_reset()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_daily_reset < CURRENT_DATE THEN
    NEW.daily_free_reading_used = false;
    NEW.daily_reading_count = 0;
    NEW.last_daily_reset = CURRENT_DATE;

    -- Update streak
    IF NEW.last_reading_date IS NULL THEN
      NULL;
    ELSIF NEW.last_reading_date = CURRENT_DATE - INTERVAL '1 day' THEN
      NULL;
    ELSIF NEW.last_reading_date < CURRENT_DATE - INTERVAL '1 day' THEN
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

-- Calculate level from XP
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

-- Award XP and handle level ups
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
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

-- Award currency
CREATE OR REPLACE FUNCTION award_currency(
  p_user_id UUID,
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
  IF p_currency_type = 'moonlight' THEN
    SELECT moonlight INTO v_balance_before FROM user_progression WHERE user_id = p_user_id;
  ELSIF p_currency_type = 'veilShards' THEN
    SELECT veil_shards INTO v_balance_before FROM user_progression WHERE user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Invalid currency type: %', p_currency_type;
  END IF;

  v_balance_after = v_balance_before + p_amount;

  IF p_currency_type = 'moonlight' THEN
    UPDATE user_progression SET moonlight = v_balance_after WHERE user_id = p_user_id;
  ELSE
    UPDATE user_progression SET veil_shards = v_balance_after WHERE user_id = p_user_id;
  END IF;

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

-- Spend currency
CREATE OR REPLACE FUNCTION spend_currency(
  p_user_id UUID,
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
  IF p_currency_type = 'moonlight' THEN
    SELECT moonlight INTO v_balance_before FROM user_progression WHERE user_id = p_user_id;
  ELSIF p_currency_type = 'veilShards' THEN
    SELECT veil_shards INTO v_balance_before FROM user_progression WHERE user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Invalid currency type: %', p_currency_type;
  END IF;

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

  IF p_currency_type = 'moonlight' THEN
    UPDATE user_progression SET moonlight = v_balance_after WHERE user_id = p_user_id;
  ELSE
    UPDATE user_progression SET veil_shards = v_balance_after WHERE user_id = p_user_id;
  END IF;

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

-- ═══════════════════════════════════════════════════════════
-- BACKFILL EXISTING USERS
-- ═══════════════════════════════════════════════════════════

INSERT INTO user_progression (user_id)
SELECT id FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_progression WHERE user_progression.user_id = users.id
);

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (uncomment to test)
-- ═══════════════════════════════════════════════════════════

-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_progression_rows FROM user_progression;
-- SELECT COUNT(*) as total_transactions FROM currency_transactions;
-- SELECT * FROM user_progression LIMIT 5;

-- ═══════════════════════════════════════════════════════════
-- MIGRATION COMPLETE ✅
-- ═══════════════════════════════════════════════════════════
