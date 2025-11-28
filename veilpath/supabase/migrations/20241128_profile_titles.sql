-- ═══════════════════════════════════════════════════════════════════════════════
-- VeilPath Profile Titles Migration
-- Adds title columns to user_profiles for earned title display
--
-- REQUIRES: 20241127_user_profiles.sql to be run first
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add title columns to user_profiles (only if table exists)
DO $$
BEGIN
  -- Primary title (always visible)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'primary_title_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN primary_title_id TEXT DEFAULT 'seeker';
  END IF;

  -- Secondary title (optional, shown after primary)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'secondary_title_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN secondary_title_id TEXT DEFAULT NULL;
  END IF;
END $$;

-- Add additional stats columns needed for title unlocking
DO $$
BEGIN
  -- Quest completions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_stats' AND column_name = 'quests_completed'
  ) THEN
    ALTER TABLE profile_stats ADD COLUMN quests_completed INTEGER DEFAULT 0;
  END IF;

  -- Helpful replies given
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_stats' AND column_name = 'helpful_replies'
  ) THEN
    ALTER TABLE profile_stats ADD COLUMN helpful_replies INTEGER DEFAULT 0;
  END IF;

  -- Daily card share streak
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_stats' AND column_name = 'daily_card_share_streak'
  ) THEN
    ALTER TABLE profile_stats ADD COLUMN daily_card_share_streak INTEGER DEFAULT 0;
  END IF;

  -- Account age (calculated field, but cache for performance)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_stats' AND column_name = 'account_age_days'
  ) THEN
    ALTER TABLE profile_stats ADD COLUMN account_age_days INTEGER DEFAULT 0;
  END IF;

  -- Unique cards drawn (for "Full Deck" achievement)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_stats' AND column_name = 'unique_cards_drawn'
  ) THEN
    ALTER TABLE profile_stats ADD COLUMN unique_cards_drawn TEXT[] DEFAULT '{}';
  END IF;

  -- Unique major arcana drawn
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_stats' AND column_name = 'unique_major_arcana'
  ) THEN
    ALTER TABLE profile_stats ADD COLUMN unique_major_arcana TEXT[] DEFAULT '{}';
  END IF;

  -- User flags (for special achievements like beta_tester, found_easter_egg)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_stats' AND column_name = 'flags'
  ) THEN
    ALTER TABLE profile_stats ADD COLUMN flags TEXT[] DEFAULT '{}';
  END IF;

  -- Special reading counts for hidden titles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_stats' AND column_name = 'midnight_readings'
  ) THEN
    ALTER TABLE profile_stats ADD COLUMN midnight_readings INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_stats' AND column_name = 'full_moon_readings'
  ) THEN
    ALTER TABLE profile_stats ADD COLUMN full_moon_readings INTEGER DEFAULT 0;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Update account age daily
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_account_ages()
RETURNS VOID AS $$
BEGIN
  UPDATE profile_stats ps
  SET account_age_days = EXTRACT(DAY FROM NOW() - u.created_at)::INTEGER
  FROM user_profiles up
  JOIN auth.users u ON up.user_id = u.id
  WHERE ps.user_id = up.user_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Track unique card draw
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION track_unique_card_draw(p_user_id UUID, p_card_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_is_major BOOLEAN;
BEGIN
  -- Check if it's a major arcana card (0-21)
  v_is_major := p_card_id ~ '^(0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21)$'
                OR p_card_id ~ '^major_';

  -- Add to unique_cards_drawn if not already present
  UPDATE profile_stats
  SET unique_cards_drawn = array_append(unique_cards_drawn, p_card_id)
  WHERE user_id = p_user_id
    AND NOT (p_card_id = ANY(unique_cards_drawn));

  -- Add to unique_major_arcana if applicable
  IF v_is_major THEN
    UPDATE profile_stats
    SET unique_major_arcana = array_append(unique_major_arcana, p_card_id)
    WHERE user_id = p_user_id
      AND NOT (p_card_id = ANY(unique_major_arcana));
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Add user flag (for special achievements)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION add_user_flag(p_user_id UUID, p_flag TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profile_stats
  SET flags = array_append(flags, p_flag)
  WHERE user_id = p_user_id
    AND NOT (p_flag = ANY(flags));
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'Profile titles migration complete!';
  RAISE NOTICE 'Added: primary_title_id, secondary_title_id to user_profiles';
  RAISE NOTICE 'Added stats: quests_completed, helpful_replies, daily_card_share_streak, etc.';
  RAISE NOTICE 'Created functions: update_account_ages, track_unique_card_draw, add_user_flag';
END $$;
