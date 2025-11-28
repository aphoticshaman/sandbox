-- ═══════════════════════════════════════════════════════════════════════════════
-- VeilPath User Profiles
-- Public profiles, usernames, showcases, and engagement tracking
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- USER PROFILES (Public-facing profile data)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Username (public, unique, alphanumeric + underscore)
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,

  -- Avatar (uses equipped card back thumbnail)
  avatar_card_back_id TEXT DEFAULT 'celestial_default',

  -- Profile visibility
  is_public BOOLEAN DEFAULT true,
  show_stats BOOLEAN DEFAULT true,
  show_showcase BOOLEAN DEFAULT true,
  show_achievements BOOLEAN DEFAULT true,

  -- Profile theme
  profile_theme TEXT DEFAULT 'cosmic',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  -- Username constraints
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,19}$'),
  CONSTRAINT username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 20),
  CONSTRAINT display_name_length CHECK (LENGTH(display_name) <= 50),
  CONSTRAINT bio_length CHECK (LENGTH(bio) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILE SHOWCASE (Featured items user wants to display)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_showcase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Showcase slot (1-6)
  slot_number INTEGER NOT NULL CHECK (slot_number >= 1 AND slot_number <= 6),

  -- Item being showcased
  item_type TEXT NOT NULL, -- card_back, flip_animation, achievement, badge, card
  item_id TEXT NOT NULL,

  -- Display order
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_profile_showcase_user ON profile_showcase(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILE STATS (Cached stats for quick profile loading)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reading stats
  total_readings INTEGER DEFAULT 0,
  favorite_card TEXT,
  favorite_spread TEXT,

  -- Engagement stats
  total_journal_entries INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,

  -- Community stats
  total_posts INTEGER DEFAULT 0,
  total_replies INTEGER DEFAULT 0,
  total_likes_received INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,

  -- Progression
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  title TEXT DEFAULT 'Seeker',

  -- Collection stats
  card_backs_owned INTEGER DEFAULT 3,
  flip_animations_owned INTEGER DEFAULT 2,
  achievements_earned INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,

  -- Rarity breakdown
  legendary_items INTEGER DEFAULT 0,
  mythic_items INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- MICRO-ENGAGEMENT TRACKING (For analytics pipeline)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,

  -- Event data (anonymizable)
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL, -- shop, reading, journal, community, navigation
  event_action TEXT, -- view, click, purchase, complete, share

  -- Non-PII context
  item_type TEXT, -- card_back, spread, etc.
  item_rarity TEXT,
  duration_ms INTEGER,

  -- Aggregate-safe metadata (no personal content)
  metadata JSONB DEFAULT '{}', -- { screen: 'shop', section: 'featured' }

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Note: This table is designed for aggregation only
  -- Individual rows should be deleted after 90 days
  -- Only aggregate reports should be retained
  expiration_date DATE DEFAULT (CURRENT_DATE + INTERVAL '90 days')
);

-- Index for time-range queries
CREATE INDEX IF NOT EXISTS idx_engagement_created ON engagement_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_category ON engagement_events(event_category);
CREATE INDEX IF NOT EXISTS idx_engagement_type ON engagement_events(event_type);

-- Note: Partial index on expiration_date removed because CURRENT_DATE is not immutable
-- Use application-level filtering or scheduled cleanup instead

-- ─────────────────────────────────────────────────────────────────────────────
-- AGGREGATED ANALYTICS (Safe to share/sell - no PII)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time bucket
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL, -- hourly, daily, weekly, monthly

  -- Aggregate category
  metric_category TEXT NOT NULL, -- reading_trends, shop_performance, engagement
  metric_name TEXT NOT NULL,

  -- Aggregated values (no PII)
  count_total INTEGER DEFAULT 0,
  count_unique_users INTEGER DEFAULT 0,
  sum_value NUMERIC,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,

  -- Breakdown (safe metadata only)
  breakdown JSONB DEFAULT '{}', -- { "by_spread": { "three_card": 45, "celtic_cross": 12 } }

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(period_start, period_type, metric_category, metric_name)
);

CREATE INDEX IF NOT EXISTS idx_analytics_period ON analytics_aggregates(period_start DESC, period_type);
CREATE INDEX IF NOT EXISTS idx_analytics_category ON analytics_aggregates(metric_category, metric_name);

-- ─────────────────────────────────────────────────────────────────────────────
-- USERNAME RESERVATION (Prevent typosquatting)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reserved_usernames (
  username TEXT PRIMARY KEY,
  reason TEXT NOT NULL, -- staff, brand, inappropriate, reserved
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reserve common brand/staff usernames
INSERT INTO reserved_usernames (username, reason) VALUES
  ('veilpath', 'brand'),
  ('admin', 'staff'),
  ('administrator', 'staff'),
  ('moderator', 'staff'),
  ('mod', 'staff'),
  ('support', 'staff'),
  ('help', 'staff'),
  ('official', 'brand'),
  ('team', 'brand'),
  ('vera', 'brand'),
  ('system', 'reserved'),
  ('null', 'reserved'),
  ('undefined', 'reserved'),
  ('anonymous', 'reserved')
ON CONFLICT (username) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Create profile on user signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO profile_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check username availability
CREATE OR REPLACE FUNCTION check_username_available(desired_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if reserved
  IF EXISTS (SELECT 1 FROM reserved_usernames WHERE username = LOWER(desired_username)) THEN
    RETURN FALSE;
  END IF;

  -- Check if taken
  IF EXISTS (SELECT 1 FROM user_profiles WHERE LOWER(username) = LOWER(desired_username)) THEN
    RETURN FALSE;
  END IF;

  -- Check format
  IF NOT (desired_username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,19}$') THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update last active
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET last_active_at = NOW(), updated_at = NOW()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired engagement data
CREATE OR REPLACE FUNCTION cleanup_expired_engagements()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM engagement_events
  WHERE expiration_date < CURRENT_DATE;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
CREATE TRIGGER trigger_create_user_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read for public profiles, owner can read/update
CREATE POLICY "Public profiles are viewable" ON user_profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Showcase: Public read if profile is public, owner can manage
CREATE POLICY "Public showcase viewable" ON profile_showcase
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = profile_showcase.user_id AND is_public = true)
  );

CREATE POLICY "Users can manage own showcase" ON profile_showcase
  FOR ALL USING (auth.uid() = user_id);

-- Stats: Public read if profile allows, owner can read
CREATE POLICY "Public stats viewable" ON profile_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = profile_stats.user_id AND is_public = true AND show_stats = true)
  );

CREATE POLICY "Users can view own stats" ON profile_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Engagement: Only system can write, no read access (aggregates only)
-- No user policies - only service role can access

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'User profiles and analytics tables created successfully!';
  RAISE NOTICE 'Tables: user_profiles, profile_showcase, profile_stats';
  RAISE NOTICE 'Analytics: engagement_events (90-day retention), analytics_aggregates (permanent)';
  RAISE NOTICE 'Functions: check_username_available, cleanup_expired_engagements';
  RAISE NOTICE 'RLS policies enabled.';
END $$;
