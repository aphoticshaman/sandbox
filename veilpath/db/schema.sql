-- LunatIQ Tarot - Neon Database Schema
-- Phase 3: LLM Integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- READINGS HISTORY
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,

  -- Reading data
  cards JSONB NOT NULL,
  interpretations JSONB NOT NULL,
  synthesis TEXT,

  -- Context
  intention TEXT,
  spread_type TEXT,
  reading_type TEXT,

  -- User context (for personalization)
  user_profile JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CONSTRAINT readings_cards_check CHECK (jsonb_typeof(cards) = 'array'),
  CONSTRAINT readings_interpretations_check CHECK (jsonb_typeof(interpretations) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_readings_user_id ON readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_user_created ON readings(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- LLM RESPONSE CACHE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS llm_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Cache key (SHA-256 hash of prompt)
  prompt_hash TEXT UNIQUE NOT NULL,

  -- Response data
  response JSONB NOT NULL,
  model TEXT NOT NULL,
  tokens_used INTEGER,

  -- TTL
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  -- Stats
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT llm_cache_response_check CHECK (jsonb_typeof(response) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_cache_prompt_hash ON llm_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON llm_cache(expires_at);

-- ═══════════════════════════════════════════════════════════
-- USER PROFILES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,

  -- Profile data
  mbti_type TEXT,
  zodiac_sign TEXT,
  birthdate DATE,

  -- Preferences
  preferred_guide TEXT CHECK (preferred_guide IN ('luna', 'sol')),
  enable_narration BOOLEAN DEFAULT false,
  enable_voice BOOLEAN DEFAULT false,

  -- Stats
  reading_count INTEGER DEFAULT 0,
  total_cards_drawn INTEGER DEFAULT 0,
  favorite_cards JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_reading_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_reading ON user_profiles(last_reading_at DESC);

-- ═══════════════════════════════════════════════════════════
-- CURRENCY TRANSACTIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS currency_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,

  -- Transaction details
  currency_type TEXT NOT NULL CHECK (currency_type IN ('veilShards', 'moonlight')),
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend')),
  reason TEXT,

  -- Balance tracking
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT currency_transactions_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_currency_user_id ON currency_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_created_at ON currency_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_currency_user_created ON currency_transactions(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for readings
DROP TRIGGER IF EXISTS update_readings_updated_at ON readings;
CREATE TRIGGER update_readings_updated_at
  BEFORE UPDATE ON readings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Increment cache hit count
CREATE OR REPLACE FUNCTION increment_cache_hit(p_prompt_hash TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE llm_cache
  SET hit_count = hit_count + 1,
      last_accessed_at = NOW()
  WHERE prompt_hash = p_prompt_hash;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired cache entries (call periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM llm_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════

-- User stats view
CREATE OR REPLACE VIEW user_stats AS
SELECT
  up.user_id,
  up.reading_count,
  up.total_cards_drawn,
  up.preferred_guide,
  COUNT(DISTINCT r.id) AS total_readings_db,
  MAX(r.created_at) AS last_reading_db,
  SUM(CASE WHEN ct.transaction_type = 'earn' AND ct.currency_type = 'moonlight' THEN ct.amount ELSE 0 END) AS total_moonlight_earned,
  SUM(CASE WHEN ct.transaction_type = 'spend' AND ct.currency_type = 'moonlight' THEN ct.amount ELSE 0 END) AS total_moonlight_spent,
  SUM(CASE WHEN ct.transaction_type = 'earn' AND ct.currency_type = 'veilShards' THEN ct.amount ELSE 0 END) AS total_veil_shards_earned,
  SUM(CASE WHEN ct.transaction_type = 'spend' AND ct.currency_type = 'veilShards' THEN ct.amount ELSE 0 END) AS total_veil_shards_spent
FROM user_profiles up
LEFT JOIN readings r ON up.user_id = r.user_id
LEFT JOIN currency_transactions ct ON up.user_id = ct.user_id
GROUP BY up.user_id, up.reading_count, up.total_cards_drawn, up.preferred_guide;

-- Cache stats view
CREATE OR REPLACE VIEW cache_stats AS
SELECT
  COUNT(*) AS total_entries,
  COUNT(*) FILTER (WHERE expires_at > NOW()) AS active_entries,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) AS expired_entries,
  SUM(hit_count) AS total_hits,
  SUM(tokens_used) AS total_tokens_cached,
  AVG(tokens_used) AS avg_tokens_per_entry,
  MAX(hit_count) AS max_hits_single_entry
FROM llm_cache;

-- ═══════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════

COMMENT ON TABLE readings IS 'Complete tarot reading history with cards, interpretations, and synthesis';
COMMENT ON TABLE llm_cache IS 'Cached LLM responses to reduce API costs (7-day TTL)';
COMMENT ON TABLE user_profiles IS 'User preferences and personalization data';
COMMENT ON TABLE currency_transactions IS 'Veil Shards and Moonlight transaction log';

COMMENT ON COLUMN llm_cache.prompt_hash IS 'SHA-256 hash of the full prompt (for cache lookups)';
COMMENT ON COLUMN llm_cache.hit_count IS 'Number of times this cached response was used';
COMMENT ON COLUMN user_profiles.favorite_cards IS 'Array of card IDs the user has favorited';
