-- VeilPath Shop, Quests, and Events System
-- Run this migration to set up automated content rotation

-- ============================================
-- COSMETICS TABLE (Master list of all cosmetics)
-- ============================================
CREATE TABLE IF NOT EXISTS cosmetics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('card_back', 'title', 'border', 'effect', 'avatar', 'theme')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  asset_path TEXT NOT NULL,
  preview_path TEXT,
  unlock_method TEXT DEFAULT 'purchase' CHECK (unlock_method IN ('purchase', 'achievement', 'event', 'quest', 'subscription')),
  base_price INTEGER NOT NULL DEFAULT 100,
  release_date DATE,
  event_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for shop queries
CREATE INDEX IF NOT EXISTS idx_cosmetics_purchasable ON cosmetics(unlock_method, release_date, active);
CREATE INDEX IF NOT EXISTS idx_cosmetics_type ON cosmetics(type);
CREATE INDEX IF NOT EXISTS idx_cosmetics_rarity ON cosmetics(rarity);

-- ============================================
-- SHOP ITEMS TABLE (Current shop inventory)
-- ============================================
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cosmetic_id TEXT NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,
  price_coins INTEGER NOT NULL,
  price_gems INTEGER,
  discount_percent INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  available_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  available_until TIMESTAMPTZ,
  rotation_pool TEXT DEFAULT 'standard' CHECK (rotation_pool IN ('standard', 'rare', 'event', 'holiday', 'flash_sale')),
  purchase_limit INTEGER, -- NULL = unlimited
  times_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cosmetic_id, available_from)
);

-- Index for current shop queries
CREATE INDEX IF NOT EXISTS idx_shop_items_current ON shop_items(available_from, available_until, featured);
CREATE INDEX IF NOT EXISTS idx_shop_items_rotation ON shop_items(rotation_pool);

-- ============================================
-- USER PURCHASES TABLE (Purchase history)
-- ============================================
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_id TEXT NOT NULL REFERENCES cosmetics(id),
  shop_item_id UUID REFERENCES shop_items(id),
  price_paid_coins INTEGER NOT NULL,
  price_paid_gems INTEGER DEFAULT 0,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cosmetic_id)
);

CREATE INDEX IF NOT EXISTS idx_user_purchases_user ON user_purchases(user_id);

-- ============================================
-- QUESTS TABLE (Quest definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'achievement', 'event', 'story')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB NOT NULL, -- { "action": "complete_reading", "count": 3, "card_type": "major_arcana" }
  rewards JSONB NOT NULL, -- { "coins": 50, "xp": 100, "cosmetic_id": null }
  difficulty TEXT DEFAULT 'normal' CHECK (difficulty IN ('easy', 'normal', 'hard', 'legendary')),
  rotation_pool TEXT DEFAULT 'standard',
  prerequisite_quest_id UUID REFERENCES quests(id),
  event_id TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type, active);
CREATE INDEX IF NOT EXISTS idx_quests_event ON quests(event_id);

-- ============================================
-- DAILY QUEST ASSIGNMENTS (User's current quests)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_quest_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  progress JSONB DEFAULT '{}', -- { "readings_completed": 2, "of": 3 }
  completed_at TIMESTAMPTZ,
  rewards_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_id, assigned_date)
);

CREATE INDEX IF NOT EXISTS idx_quest_assignments_user_date ON daily_quest_assignments(user_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_quest_assignments_incomplete ON daily_quest_assignments(user_id, completed) WHERE completed = false;

-- ============================================
-- EVENTS TABLE (Holidays, seasons, special events)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('holiday', 'seasonal', 'contest', 'flash_sale', 'community', 'story')),
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  config JSONB NOT NULL DEFAULT '{}', -- Event-specific settings
  cosmetics TEXT[], -- Array of cosmetic IDs available during event
  quests TEXT[], -- Array of quest IDs active during event
  banner_asset TEXT,
  theme_colors JSONB, -- { "primary": "#...", "secondary": "#..." }
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date, active);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

-- ============================================
-- ASSET QUEUE TABLE (CI/CD art pipeline)
-- ============================================
CREATE TABLE IF NOT EXISTS asset_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('card_back', 'title', 'border', 'effect', 'avatar', 'theme', 'banner')),
  name TEXT NOT NULL,
  prompt TEXT NOT NULL, -- AI generation prompt
  negative_prompt TEXT,
  style_reference TEXT, -- URL or asset path for style reference
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'review', 'approved', 'rejected', 'released')),
  generated_path TEXT,
  generation_provider TEXT, -- 'replicate', 'midjourney', 'dalle', etc.
  generation_metadata JSONB DEFAULT '{}',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  scheduled_release DATE,
  rarity TEXT DEFAULT 'common',
  event_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_queue_status ON asset_queue(status);
CREATE INDEX IF NOT EXISTS idx_asset_queue_release ON asset_queue(scheduled_release, status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get current shop items
CREATE OR REPLACE FUNCTION get_current_shop()
RETURNS TABLE (
  shop_item_id UUID,
  cosmetic_id TEXT,
  name TEXT,
  type TEXT,
  rarity TEXT,
  asset_path TEXT,
  price_coins INTEGER,
  price_gems INTEGER,
  discount_percent INTEGER,
  featured BOOLEAN,
  available_until TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id as shop_item_id,
    c.id as cosmetic_id,
    c.name,
    c.type,
    c.rarity,
    c.asset_path,
    si.price_coins,
    si.price_gems,
    si.discount_percent,
    si.featured,
    si.available_until
  FROM shop_items si
  JOIN cosmetics c ON c.id = si.cosmetic_id
  WHERE si.available_from <= NOW()
    AND (si.available_until IS NULL OR si.available_until > NOW())
    AND c.active = true
  ORDER BY si.featured DESC, c.rarity DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's daily quests
CREATE OR REPLACE FUNCTION get_user_daily_quests(p_user_id UUID)
RETURNS TABLE (
  assignment_id UUID,
  quest_id UUID,
  title TEXT,
  description TEXT,
  requirements JSONB,
  rewards JSONB,
  difficulty TEXT,
  progress JSONB,
  completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dqa.id as assignment_id,
    q.id as quest_id,
    q.title,
    q.description,
    q.requirements,
    q.rewards,
    q.difficulty,
    dqa.progress,
    dqa.completed
  FROM daily_quest_assignments dqa
  JOIN quests q ON q.id = dqa.quest_id
  WHERE dqa.user_id = p_user_id
    AND dqa.assigned_date = CURRENT_DATE
  ORDER BY dqa.completed ASC, q.sort_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user owns a cosmetic
CREATE OR REPLACE FUNCTION user_owns_cosmetic(p_user_id UUID, p_cosmetic_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_purchases
    WHERE user_id = p_user_id AND cosmetic_id = p_cosmetic_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quest_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_queue ENABLE ROW LEVEL SECURITY;

-- Cosmetics: Everyone can read active cosmetics
CREATE POLICY "Anyone can view active cosmetics"
  ON cosmetics FOR SELECT
  USING (active = true);

-- Shop items: Everyone can read current shop
CREATE POLICY "Anyone can view shop items"
  ON shop_items FOR SELECT
  USING (available_from <= NOW() AND (available_until IS NULL OR available_until > NOW()));

-- User purchases: Users can only see their own purchases
CREATE POLICY "Users can view own purchases"
  ON user_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON user_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Quests: Everyone can read active quests
CREATE POLICY "Anyone can view active quests"
  ON quests FOR SELECT
  USING (active = true);

-- Quest assignments: Users can only see their own
CREATE POLICY "Users can view own quest assignments"
  ON daily_quest_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own quest progress"
  ON daily_quest_assignments FOR UPDATE
  USING (auth.uid() = user_id);

-- Events: Everyone can read active events
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  USING (true);

-- Asset queue: Admin only (use service role key)
CREATE POLICY "Service role only for asset queue"
  ON asset_queue FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cosmetics_updated_at
  BEFORE UPDATE ON cosmetics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_asset_queue_updated_at
  BEFORE UPDATE ON asset_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA: Sample quests
-- ============================================
INSERT INTO quests (quest_type, title, description, requirements, rewards, difficulty) VALUES
  ('daily', 'Morning Draw', 'Complete your daily single card reading', '{"action": "complete_reading", "type": "single", "count": 1}', '{"coins": 25, "xp": 50}', 'easy'),
  ('daily', 'Deep Reflection', 'Write a journal entry of at least 100 words', '{"action": "journal_entry", "min_words": 100, "count": 1}', '{"coins": 50, "xp": 75}', 'normal'),
  ('daily', 'Mindful Moment', 'Complete a mindfulness exercise', '{"action": "complete_mindfulness", "count": 1}', '{"coins": 30, "xp": 50}', 'easy'),
  ('daily', 'Spread Master', 'Complete a three-card spread', '{"action": "complete_reading", "type": "three_card", "count": 1}', '{"coins": 40, "xp": 60}', 'normal'),
  ('daily', 'Chat with Vera', 'Have a conversation with Vera', '{"action": "vera_chat", "messages": 3}', '{"coins": 35, "xp": 50}', 'easy'),
  ('weekly', 'Dedicated Seeker', 'Complete readings on 5 different days', '{"action": "complete_reading", "unique_days": 5}', '{"coins": 200, "xp": 300, "cosmetic_id": null}', 'normal'),
  ('weekly', 'Journal Journey', 'Write 7 journal entries this week', '{"action": "journal_entry", "count": 7}', '{"coins": 250, "xp": 350}', 'hard')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: 2025-2026 Event Calendar
-- ============================================
INSERT INTO events (id, name, type, description, start_date, end_date, config) VALUES
  ('winter_solstice_2025', 'Winter Solstice', 'holiday', 'The longest night - a time for deep reflection', '2025-12-21 00:00:00+00', '2025-12-23 23:59:59+00', '{"theme": "winter", "bonus_xp": 1.5}'),
  ('christmas_2025', 'Mystic Christmas', 'holiday', 'Celebrate with special holiday cosmetics', '2025-12-24 00:00:00+00', '2025-12-26 23:59:59+00', '{"theme": "christmas", "bonus_coins": 2}'),
  ('new_year_2026', 'New Year Ritual', 'holiday', 'Set intentions for the year ahead', '2025-12-31 00:00:00+00', '2026-01-02 23:59:59+00', '{"theme": "new_year", "special_spread": true}'),
  ('lunar_new_year_2026', 'Lunar New Year', 'holiday', 'Year of the Snake - transformation awaits', '2026-01-29 00:00:00+00', '2026-02-02 23:59:59+00', '{"theme": "lunar", "zodiac": "snake"}'),
  ('valentines_2026', 'Love & Connection', 'holiday', 'Explore matters of the heart', '2026-02-12 00:00:00+00', '2026-02-15 23:59:59+00', '{"theme": "love", "special_spread": "relationship"}'),
  ('spring_equinox_2026', 'Spring Awakening', 'seasonal', 'Balance and new beginnings', '2026-03-19 00:00:00+00', '2026-03-22 23:59:59+00', '{"theme": "spring", "bonus_xp": 1.25}'),
  ('april_fools_2026', 'The Fool''s Journey', 'holiday', 'Embrace the unexpected', '2026-04-01 00:00:00+00', '2026-04-02 23:59:59+00', '{"theme": "fool", "surprise_rewards": true}'),
  ('beltane_2026', 'Beltane Fire', 'holiday', 'Celebrate growth and passion', '2026-04-30 00:00:00+00', '2026-05-02 23:59:59+00', '{"theme": "fire", "bonus_coins": 1.5}'),
  ('summer_solstice_2026', 'Summer Solstice', 'seasonal', 'The longest day - peak energy', '2026-06-20 00:00:00+00', '2026-06-22 23:59:59+00', '{"theme": "summer", "bonus_xp": 1.5}'),
  ('lammas_2026', 'First Harvest', 'holiday', 'Reap what you have sown', '2026-08-01 00:00:00+00', '2026-08-02 23:59:59+00', '{"theme": "harvest"}'),
  ('fall_equinox_2026', 'Autumn Balance', 'seasonal', 'Balance light and dark within', '2026-09-22 00:00:00+00', '2026-09-24 23:59:59+00', '{"theme": "autumn", "bonus_xp": 1.25}'),
  ('halloween_2026', 'Samhain', 'holiday', 'The veil between worlds grows thin', '2026-10-29 00:00:00+00', '2026-11-01 23:59:59+00', '{"theme": "samhain", "special_cosmetics": true}'),
  ('thanksgiving_2026', 'Gratitude Ritual', 'holiday', 'Reflect on abundance', '2026-11-26 00:00:00+00', '2026-11-27 23:59:59+00', '{"theme": "gratitude", "bonus_coins": 1.5}')
ON CONFLICT (id) DO NOTHING;

-- Done!
SELECT 'Migration complete! Tables created: cosmetics, shop_items, user_purchases, quests, daily_quest_assignments, events, asset_queue' as status;
