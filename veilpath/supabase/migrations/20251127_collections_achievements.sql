-- ============================================================================
-- VEILPATH COLLECTIONS & ACHIEVEMENTS SYSTEM
-- Migration: 20251127_collections_achievements.sql
--
-- Supports:
-- - Collection sets with synergy bonuses
-- - Evolution paths (Base → Enhanced → Perfected → Transcendent)
-- - Achievement progression chains
-- - Prestige indicators
-- ============================================================================

-- ============================================================================
-- COLLECTIONS SYSTEM
-- ============================================================================

-- Collections master table
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  theme TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- Collection items (which cosmetics belong to which collection)
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id TEXT NOT NULL REFERENCES collections(id),
  cosmetic_id TEXT NOT NULL REFERENCES cosmetics(id),
  required_for_bonus BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  UNIQUE(collection_id, cosmetic_id)
);

-- Collection set bonuses
CREATE TABLE IF NOT EXISTS collection_set_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id TEXT NOT NULL REFERENCES collections(id),
  min_items INT NOT NULL,
  effect_id TEXT NOT NULL,
  effect_description TEXT NOT NULL,
  visual_modifier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User collection progress
CREATE TABLE IF NOT EXISTS user_collection_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  collection_id TEXT NOT NULL REFERENCES collections(id),
  items_owned INT DEFAULT 0,
  set_bonus_unlocked BOOLEAN DEFAULT false,
  highest_bonus_tier INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, collection_id)
);

-- ============================================================================
-- EVOLUTION SYSTEM
-- ============================================================================

-- Evolution tiers for cosmetics
CREATE TYPE evolution_tier AS ENUM ('base', 'enhanced', 'perfected', 'transcendent');

-- Evolution paths (defines upgrade tree)
CREATE TABLE IF NOT EXISTS evolution_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_cosmetic_id TEXT NOT NULL REFERENCES cosmetics(id),
  collection_id TEXT REFERENCES collections(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evolution tiers within a path
CREATE TABLE IF NOT EXISTS evolution_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evolution_path_id UUID NOT NULL REFERENCES evolution_paths(id),
  tier evolution_tier NOT NULL,
  cosmetic_id TEXT NOT NULL REFERENCES cosmetics(id),
  bonuses JSONB DEFAULT '[]',
  UNIQUE(evolution_path_id, tier)
);

-- Evolution requirements
CREATE TABLE IF NOT EXISTS evolution_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evolution_tier_id UUID NOT NULL REFERENCES evolution_tiers(id),
  requirement_type TEXT NOT NULL, -- 'shards', 'duplicates', 'achievement', 'streak', 'readings', 'collection'
  amount INT NOT NULL,
  target_id TEXT -- specific item/achievement id if applicable
);

-- User evolution progress
CREATE TABLE IF NOT EXISTS user_evolution_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  evolution_path_id UUID NOT NULL REFERENCES evolution_paths(id),
  current_tier evolution_tier DEFAULT 'base',
  evolved_at TIMESTAMPTZ,
  UNIQUE(user_id, evolution_path_id)
);

-- ============================================================================
-- ACHIEVEMENTS SYSTEM
-- ============================================================================

-- Achievement tiers
CREATE TYPE achievement_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

-- Achievement categories
CREATE TYPE achievement_category AS ENUM (
  'journey', 'mastery', 'dedication', 'collection', 'social', 'discovery', 'seasonal'
);

-- Achievements master table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category achievement_category NOT NULL,
  tier achievement_tier NOT NULL,
  hidden BOOLEAN DEFAULT false,
  lore TEXT,
  chain_id TEXT, -- for achievement chains
  xp_reward INT DEFAULT 0,
  coin_reward INT DEFAULT 0,
  shard_reward INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  release_date DATE DEFAULT CURRENT_DATE
);

-- Achievement requirements
CREATE TABLE IF NOT EXISTS achievement_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  requirement_type TEXT NOT NULL,
  value INT NOT NULL,
  target TEXT -- specific target if applicable
);

-- Achievement prerequisites
CREATE TABLE IF NOT EXISTS achievement_prerequisites (
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  prerequisite_id TEXT NOT NULL REFERENCES achievements(id),
  PRIMARY KEY (achievement_id, prerequisite_id)
);

-- Achievement rewards (cosmetics, titles, etc.)
CREATE TABLE IF NOT EXISTS achievement_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  reward_type TEXT NOT NULL, -- 'cosmetic', 'title', 'prestige_badge', 'showcase_slot', 'collection_bonus'
  reward_value TEXT NOT NULL,
  rarity TEXT -- for cosmetic rewards
);

-- Achievement chains (groups of progressive achievements)
CREATE TABLE IF NOT EXISTS achievement_chains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  completion_bonuses JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (unlocked)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- User achievement progress (for tracking towards achievements)
CREATE TABLE IF NOT EXISTS user_achievement_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  progress_type TEXT NOT NULL,
  current_value INT DEFAULT 0,
  target_value INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id, progress_type)
);

-- ============================================================================
-- PRESTIGE SYSTEM
-- ============================================================================

-- Prestige indicators
CREATE TABLE IF NOT EXISTS prestige_indicators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  indicator_type TEXT NOT NULL, -- 'badge', 'frame_accent', 'title_prefix', 'particle_effect'
  rarity TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prestige requirements
CREATE TABLE IF NOT EXISTS prestige_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestige_id TEXT NOT NULL REFERENCES prestige_indicators(id),
  requirement_type TEXT NOT NULL,
  value INT NOT NULL,
  collection_id TEXT
);

-- User prestige (unlocked indicators)
CREATE TABLE IF NOT EXISTS user_prestige (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  prestige_id TEXT NOT NULL REFERENCES prestige_indicators(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  equipped BOOLEAN DEFAULT false,
  UNIQUE(user_id, prestige_id)
);

-- ============================================================================
-- SYNERGY SYSTEM
-- ============================================================================

-- Synergies (bonuses for combining items)
CREATE TABLE IF NOT EXISTS synergies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  effect_id TEXT NOT NULL,
  visual_effect TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Synergy requirements
CREATE TABLE IF NOT EXISTS synergy_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  synergy_id TEXT NOT NULL REFERENCES synergies(id),
  requirement_type TEXT NOT NULL, -- 'category', 'collection', 'rarity', 'theme'
  value TEXT NOT NULL,
  count INT DEFAULT 1
);

-- User active synergies (calculated based on equipped items)
CREATE TABLE IF NOT EXISTS user_active_synergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  synergy_id TEXT NOT NULL REFERENCES synergies(id),
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, synergy_id)
);

-- ============================================================================
-- SHOWCASE SYSTEM
-- ============================================================================

-- Showcase layouts
CREATE TABLE IF NOT EXISTS showcase_layouts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unlock_requirement TEXT, -- prestige or achievement id
  slot_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User showcase configuration
CREATE TABLE IF NOT EXISTS user_showcase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  layout_id TEXT NOT NULL REFERENCES showcase_layouts(id) DEFAULT 'showcase_basic',
  equipped_items JSONB DEFAULT '{}', -- { slot_number: cosmetic_id }
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER STATS (for achievement tracking)
-- ============================================================================

-- Comprehensive user stats table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  readings_total INT DEFAULT 0,
  readings_daily INT DEFAULT 0,
  cards_seen JSONB DEFAULT '[]', -- array of card ids
  cards_reversed INT DEFAULT 0,
  journal_entries INT DEFAULT 0,
  streak_current INT DEFAULT 0,
  streak_max INT DEFAULT 0,
  streak_last_date DATE,
  xp_total INT DEFAULT 0,
  level INT DEFAULT 1,
  cosmetics_owned INT DEFAULT 0,
  cosmetics_evolved INT DEFAULT 0,
  collections_completed INT DEFAULT 0,
  quests_completed INT DEFAULT 0,
  quests_daily_streak INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  coins_spent INT DEFAULT 0,
  shards_earned INT DEFAULT 0,
  shards_spent INT DEFAULT 0,
  vera_conversations INT DEFAULT 0,
  mindfulness_sessions INT DEFAULT 0,
  time_in_app_minutes INT DEFAULT 0,
  first_login TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  signup_order INT, -- for founder achievements
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_cosmetic ON collection_items(cosmetic_id);
CREATE INDEX IF NOT EXISTS idx_user_collection_progress_user ON user_collection_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_tiers_path ON evolution_tiers(evolution_path_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_requirements_achievement ON achievement_requirements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievement_progress_user ON user_achievement_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(level);
CREATE INDEX IF NOT EXISTS idx_user_stats_streak ON user_stats(streak_max);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_collection_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_evolution_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievement_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prestige ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_active_synergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own data
CREATE POLICY "Users can view own collection progress"
  ON user_collection_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own evolution progress"
  ON user_evolution_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievement progress"
  ON user_achievement_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own prestige"
  ON user_prestige FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own showcase"
  ON user_showcase FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Public can view showcase (for profile viewing)
CREATE POLICY "Anyone can view showcases"
  ON user_showcase FOR SELECT
  USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update user stats
CREATE OR REPLACE FUNCTION update_user_stats(
  p_user_id UUID,
  p_stat_type TEXT,
  p_increment INT DEFAULT 1
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  EXECUTE format(
    'UPDATE user_stats SET %I = COALESCE(%I, 0) + $1, updated_at = NOW() WHERE user_id = $2',
    p_stat_type, p_stat_type
  ) USING p_increment, p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Check achievement completion
CREATE OR REPLACE FUNCTION check_achievement(
  p_user_id UUID,
  p_achievement_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_completed BOOLEAN := true;
  v_req RECORD;
  v_current INT;
BEGIN
  -- Check each requirement
  FOR v_req IN
    SELECT requirement_type, value, target
    FROM achievement_requirements
    WHERE achievement_id = p_achievement_id
  LOOP
    -- Get current value from user_stats
    EXECUTE format(
      'SELECT COALESCE(%I, 0) FROM user_stats WHERE user_id = $1',
      v_req.requirement_type
    ) INTO v_current USING p_user_id;

    IF v_current IS NULL OR v_current < v_req.value THEN
      v_completed := false;
      EXIT;
    END IF;
  END LOOP;

  RETURN v_completed;
END;
$$ LANGUAGE plpgsql;

-- Grant achievement
CREATE OR REPLACE FUNCTION grant_achievement(
  p_user_id UUID,
  p_achievement_id TEXT
)
RETURNS void AS $$
DECLARE
  v_achievement achievements%ROWTYPE;
BEGIN
  -- Get achievement details
  SELECT * INTO v_achievement FROM achievements WHERE id = p_achievement_id;

  IF v_achievement IS NULL THEN
    RETURN;
  END IF;

  -- Check prerequisites
  IF EXISTS (
    SELECT 1 FROM achievement_prerequisites ap
    WHERE ap.achievement_id = p_achievement_id
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = ap.prerequisite_id
    )
  ) THEN
    RETURN; -- Prerequisites not met
  END IF;

  -- Grant achievement
  INSERT INTO user_achievements (user_id, achievement_id)
  VALUES (p_user_id, p_achievement_id)
  ON CONFLICT DO NOTHING;

  -- Grant rewards
  IF v_achievement.xp_reward > 0 THEN
    PERFORM update_user_stats(p_user_id, 'xp_total', v_achievement.xp_reward);
  END IF;

  IF v_achievement.coin_reward > 0 THEN
    UPDATE user_currencies
    SET coins = coins + v_achievement.coin_reward
    WHERE user_id = p_user_id;
  END IF;

  IF v_achievement.shard_reward > 0 THEN
    UPDATE user_currencies
    SET shards = shards + v_achievement.shard_reward
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update collection progress when cosmetic acquired
CREATE OR REPLACE FUNCTION update_collection_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
  v_collection RECORD;
BEGIN
  -- Find collections this cosmetic belongs to
  FOR v_collection IN
    SELECT ci.collection_id, c.id
    FROM collection_items ci
    JOIN collections c ON ci.collection_id = c.id
    WHERE ci.cosmetic_id = NEW.cosmetic_id
  LOOP
    -- Upsert user collection progress
    INSERT INTO user_collection_progress (user_id, collection_id, items_owned)
    VALUES (NEW.user_id, v_collection.collection_id, 1)
    ON CONFLICT (user_id, collection_id)
    DO UPDATE SET
      items_owned = user_collection_progress.items_owned + 1,
      updated_at = NOW();

    -- Check for set bonus unlock
    UPDATE user_collection_progress
    SET set_bonus_unlocked = true,
        highest_bonus_tier = (
          SELECT MAX(min_items) FROM collection_set_bonuses
          WHERE collection_id = v_collection.collection_id
          AND min_items <= user_collection_progress.items_owned
        )
    WHERE user_id = NEW.user_id
    AND collection_id = v_collection.collection_id
    AND items_owned >= (
      SELECT MIN(min_items) FROM collection_set_bonuses
      WHERE collection_id = v_collection.collection_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_on_purchase
  AFTER INSERT ON user_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_on_purchase();

-- ============================================================================
-- SEED DATA: Collections
-- ============================================================================

-- Elemental Collections
INSERT INTO collections (id, name, description, lore, theme) VALUES
('celestial_fire', 'Celestial Fire', 'Harness the power of cosmic flames',
 'Born from the death of ancient stars, the Celestial Fire collection channels the primal energy that sparked all creation.',
 'fire'),
('abyssal_depths', 'Abyssal Depths', 'Embrace the mysteries of the deep',
 'In the lightless depths where pressure crushes stone, ancient wisdom waits for those brave enough to descend.',
 'water'),
('verdant_grove', 'Verdant Grove', 'Channel the eternal cycle of growth',
 'Where the oldest trees stand, their roots touch memories of the first seed.',
 'earth'),
('ethereal_winds', 'Ethereal Winds', 'Ride the currents between worlds',
 'The wind carries whispers from realms unseen.',
 'air'),
('void_walker', 'Void Walker', 'Step between the spaces that are not',
 'Beyond the stars lies the Void—not emptiness, but the canvas upon which reality is painted.',
 'cosmic'),
('golden_dawn', 'Golden Dawn', 'Illuminate the path to enlightenment',
 'When the sun first rose over the primordial world, it blessed certain souls with fragments of its light.',
 'celestial'),
('winter_solstice_2025', 'Winter Solstice 2025', 'Celebrate the return of light',
 'On the longest night, when darkness seems eternal, a single candle can remind us that light always returns.',
 'seasonal')
ON CONFLICT (id) DO NOTHING;

-- Collection set bonuses
INSERT INTO collection_set_bonuses (collection_id, min_items, effect_id, effect_description, visual_modifier) VALUES
('celestial_fire', 2, 'ember_particles', 'Subtle embers float around equipped items', NULL),
('celestial_fire', 4, 'flame_aura', 'Your profile radiates a warm glow', NULL),
('celestial_fire', 6, 'phoenix_trail', 'Phoenix feathers trail your actions', NULL),
('celestial_fire', 8, 'celestial_crown', 'Crown of stars appears on your avatar', 'celestial-fire-crown'),
('abyssal_depths', 2, 'bubble_particles', 'Gentle bubbles rise from equipped items', NULL),
('abyssal_depths', 4, 'bioluminescent_glow', 'Soft blue glow emanates from your profile', NULL),
('abyssal_depths', 6, 'current_flow', 'Flowing water currents animate your cards', NULL),
('abyssal_depths', 8, 'leviathan_presence', 'A massive shadow swims behind your profile', 'abyssal-leviathan'),
('void_walker', 3, 'void_ripple', 'Reality ripples around your actions', NULL),
('void_walker', 5, 'star_field', 'A personal constellation surrounds you', NULL),
('void_walker', 8, 'dimensional_tear', 'Glimpses of other dimensions appear', NULL),
('void_walker', 10, 'void_ascension', 'You become one with the cosmic void', 'void-ascended')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Achievements
-- ============================================================================

INSERT INTO achievements (id, name, description, category, tier, hidden, lore, chain_id, xp_reward, coin_reward, shard_reward) VALUES
-- Journey achievements
('journey_first_reading', 'The Seeker Awakens', 'Complete your first tarot reading', 'journey', 'bronze', false,
 'Every journey begins with a single step. You have taken yours.', NULL, 50, 100, 0),
('journey_10_readings', 'Curious Mind', 'Complete 10 tarot readings', 'journey', 'bronze', false, NULL, 'journey_readings', 100, 200, 0),
('journey_50_readings', 'Dedicated Student', 'Complete 50 tarot readings', 'journey', 'silver', false,
 'The cards begin to feel familiar in your hands.', 'journey_readings', 200, 500, 0),
('journey_100_readings', 'Practiced Reader', 'Complete 100 tarot readings', 'journey', 'gold', false,
 'Your intuition strengthens with each reading.', 'journey_readings', 300, 1000, 50),
('journey_500_readings', 'Seasoned Oracle', 'Complete 500 tarot readings', 'journey', 'platinum', false,
 'The veil between worlds grows thin in your presence.', 'journey_readings', 500, 0, 200),
('journey_1000_readings', 'Master of the Veil', 'Complete 1000 tarot readings', 'journey', 'diamond', false,
 'You have walked a thousand paths through the cards. The universe itself takes notice.', 'journey_readings', 1000, 0, 500),

-- Mastery achievements
('mastery_all_major', 'Keeper of Keys', 'Encounter all 22 Major Arcana cards', 'mastery', 'silver', false,
 'The 22 keys of the Major Arcana have all revealed themselves to you.', NULL, 200, 0, 0),
('mastery_full_deck', 'Complete the Circle', 'Encounter all 78 cards of the tarot', 'mastery', 'gold', false,
 'Every card has shared its wisdom with you. The full circle is complete.', NULL, 400, 0, 150),
('mastery_wands', 'Master of Wands', 'Encounter all 14 cards of the Wands suit', 'mastery', 'silver', false,
 'The fire of creation burns within you.', 'mastery_elements', 150, 0, 0),
('mastery_cups', 'Master of Cups', 'Encounter all 14 cards of the Cups suit', 'mastery', 'silver', false,
 'The depths of emotion flow through you.', 'mastery_elements', 150, 0, 0),
('mastery_swords', 'Master of Swords', 'Encounter all 14 cards of the Swords suit', 'mastery', 'silver', false,
 'Your mind cuts through illusion like a blade.', 'mastery_elements', 150, 0, 0),
('mastery_pentacles', 'Master of Pentacles', 'Encounter all 14 cards of the Pentacles suit', 'mastery', 'silver', false,
 'The material world bends to your will.', 'mastery_elements', 150, 0, 0),

-- Dedication achievements
('dedication_streak_7', 'Weekly Devotion', 'Maintain a 7-day reading streak', 'dedication', 'bronze', false,
 'A week of dedication - the first flame is lit.', 'dedication_streak', 75, 250, 0),
('dedication_streak_30', 'Monthly Mastery', 'Maintain a 30-day reading streak', 'dedication', 'silver', false,
 'A full moon cycle of practice.', 'dedication_streak', 200, 0, 75),
('dedication_streak_100', 'Century of Wisdom', 'Maintain a 100-day reading streak', 'dedication', 'gold', false,
 'One hundred sunrises spent in reflection.', 'dedication_streak', 500, 0, 200),
('dedication_streak_365', 'Year of Enlightenment', 'Maintain a 365-day reading streak', 'dedication', 'diamond', false,
 'A full turn of the wheel.', 'dedication_streak', 1500, 0, 1000),

-- Discovery achievements (hidden)
('discovery_death', 'Embrace Change', 'Draw the Death card for the first time', 'discovery', 'bronze', true,
 'Death is not an ending, but a transformation.', NULL, 100, 0, 0),
('discovery_tower', 'Weathered the Storm', 'Draw the Tower card three times', 'discovery', 'silver', true,
 'Three towers have fallen around you, yet you still stand.', NULL, 200, 0, 0),

-- Founder achievements
('founder_pioneer', 'Pioneer', 'Be among the first 100 users', 'discovery', 'diamond', true,
 'You were there at the beginning.', NULL, 500, 0, 0),
('founder_1000', 'Founding Seeker', 'Be among the first 1000 users', 'discovery', 'platinum', true,
 'You believed before the crowds came.', NULL, 300, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Achievement chains
INSERT INTO achievement_chains (id, name, description, completion_bonuses) VALUES
('journey_readings', 'The Reading Path', 'Progress from seeker to master through readings',
 '[{"type": "title", "value": "Grandmaster Reader"}, {"type": "prestige_badge", "value": "grandmaster"}]'),
('dedication_streak', 'The Eternal Flame', 'Maintain an ever-growing streak of dedication',
 '[{"type": "title", "value": "Eternal"}, {"type": "cosmetic", "value": "back_eternal_flame", "rarity": "mythic"}]'),
('mastery_elements', 'Elemental Mastery', 'Master all four elements through the Minor Arcana',
 '[{"type": "title", "value": "Elemental Master"}, {"type": "collection_bonus", "value": "unlock_elemental_collection"}]')
ON CONFLICT (id) DO NOTHING;

-- Achievement requirements
INSERT INTO achievement_requirements (achievement_id, requirement_type, value, target) VALUES
('journey_first_reading', 'readings_total', 1, NULL),
('journey_10_readings', 'readings_total', 10, NULL),
('journey_50_readings', 'readings_total', 50, NULL),
('journey_100_readings', 'readings_total', 100, NULL),
('journey_500_readings', 'readings_total', 500, NULL),
('journey_1000_readings', 'readings_total', 1000, NULL),
('mastery_all_major', 'major_arcana_count', 22, NULL),
('mastery_full_deck', 'cards_seen', 78, NULL),
('mastery_wands', 'card_suit_mastery', 14, 'wands'),
('mastery_cups', 'card_suit_mastery', 14, 'cups'),
('mastery_swords', 'card_suit_mastery', 14, 'swords'),
('mastery_pentacles', 'card_suit_mastery', 14, 'pentacles'),
('dedication_streak_7', 'streak_current', 7, NULL),
('dedication_streak_30', 'streak_current', 30, NULL),
('dedication_streak_100', 'streak_current', 100, NULL),
('dedication_streak_365', 'streak_current', 365, NULL),
('discovery_death', 'specific_card', 1, 'death'),
('discovery_tower', 'specific_card', 3, 'tower')
ON CONFLICT DO NOTHING;

-- Achievement prerequisites
INSERT INTO achievement_prerequisites (achievement_id, prerequisite_id) VALUES
('journey_10_readings', 'journey_first_reading'),
('journey_50_readings', 'journey_10_readings'),
('journey_100_readings', 'journey_50_readings'),
('journey_500_readings', 'journey_100_readings'),
('journey_1000_readings', 'journey_500_readings'),
('mastery_full_deck', 'mastery_all_major'),
('dedication_streak_30', 'dedication_streak_7'),
('dedication_streak_100', 'dedication_streak_30'),
('dedication_streak_365', 'dedication_streak_100')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Prestige Indicators
-- ============================================================================

INSERT INTO prestige_indicators (id, name, indicator_type, rarity) VALUES
('prestige_collector_bronze', 'Bronze Collector', 'badge', 'uncommon'),
('prestige_collector_silver', 'Silver Collector', 'badge', 'rare'),
('prestige_collector_gold', 'Gold Collector', 'badge', 'epic'),
('prestige_collector_platinum', 'Platinum Collector', 'frame_accent', 'legendary'),
('prestige_transcendent', 'Transcendent', 'title_prefix', 'legendary'),
('prestige_founder', 'Founding Seeker', 'badge', 'legendary'),
('prestige_pioneer', 'Pioneer', 'frame_accent', 'mythic'),
('prestige_devoted', 'Devoted', 'badge', 'epic'),
('prestige_eternal', 'Eternal', 'title_prefix', 'mythic')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DATA: Synergies
-- ============================================================================

INSERT INTO synergies (id, name, description, effect_id, visual_effect) VALUES
('synergy_elemental_harmony', 'Elemental Harmony', 'Equip 4+ items from any elemental collection',
 'elemental_harmony', 'Elemental particles swirl in harmony'),
('synergy_cosmic_convergence', 'Cosmic Convergence', 'Equip items from different cosmic collections',
 'cosmic_convergence', 'Stars and light merge in your profile'),
('synergy_legendary_ensemble', 'Legendary Ensemble', 'Equip 5+ legendary items simultaneously',
 'legendary_aura', 'Golden legendary aura surrounds your profile'),
('synergy_perfect_match', 'Perfect Match', 'Equip card back, frame, and flip animation from the same collection',
 'perfect_match', 'Card animations are enhanced with extra flair')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DATA: Showcase Layouts
-- ============================================================================

INSERT INTO showcase_layouts (id, name, unlock_requirement, slot_config) VALUES
('showcase_basic', 'Basic Showcase', NULL,
 '[{"position": 1, "category": "avatar", "size": "large", "animated": true},
   {"position": 2, "category": "card_back", "size": "medium", "animated": true},
   {"position": 3, "category": "title", "size": "small", "animated": false}]'),
('showcase_collector', 'Collector''s Display', 'prestige_collector_bronze',
 '[{"position": 1, "category": "avatar", "size": "featured", "animated": true},
   {"position": 2, "category": "card_back", "size": "large", "animated": true},
   {"position": 3, "category": "card_frame", "size": "medium", "animated": true},
   {"position": 4, "category": "profile_border", "size": "medium", "animated": true},
   {"position": 5, "category": "title", "size": "small", "animated": false},
   {"position": 6, "category": "any", "size": "small", "animated": true}]'),
('showcase_master', 'Master Showcase', 'prestige_collector_gold',
 '[{"position": 1, "category": "avatar", "size": "featured", "animated": true},
   {"position": 2, "category": "card_back", "size": "featured", "animated": true},
   {"position": 3, "category": "card_frame", "size": "large", "animated": true},
   {"position": 4, "category": "flip_animation", "size": "large", "animated": true},
   {"position": 5, "category": "reveal_effect", "size": "medium", "animated": true},
   {"position": 6, "category": "profile_border", "size": "medium", "animated": true},
   {"position": 7, "category": "touch_trail", "size": "medium", "animated": true},
   {"position": 8, "category": "title", "size": "small", "animated": false}]')
ON CONFLICT (id) DO NOTHING;
