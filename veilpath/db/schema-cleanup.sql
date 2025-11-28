-- Remove tables that store sensitive personal data
-- We're privacy-first: readings/journals stay client-side only

-- Drop readings table (stores card interpretations - should be private)
DROP TABLE IF EXISTS readings CASCADE;

-- Drop user_profiles.favorite_cards (analyzing user's spiritual preferences - too invasive)
-- We'll keep basic preferences like narrator choice, but not detailed spiritual tracking
ALTER TABLE user_profiles DROP COLUMN IF EXISTS favorite_cards;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS reading_count;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS total_cards_drawn;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS last_reading_at;

-- Update user_profiles to only store preferences (no tracking)
COMMENT ON TABLE user_profiles IS 'User preferences ONLY - no spiritual/personal data tracking';

-- Update view to remove references to deleted tables
DROP VIEW IF EXISTS user_stats;
CREATE OR REPLACE VIEW user_stats AS
SELECT
  up.user_id,
  up.preferred_guide,
  prog.level,
  prog.xp,
  prog.moonlight,
  prog.veil_shards,
  prog.total_readings,
  prog.total_journal_entries,
  prog.current_streak,
  prog.longest_streak,
  SUM(CASE WHEN ct.transaction_type = 'earn' AND ct.currency_type = 'moonlight' THEN ct.amount ELSE 0 END) AS total_moonlight_earned,
  SUM(CASE WHEN ct.transaction_type = 'spend' AND ct.currency_type = 'moonlight' THEN ct.amount ELSE 0 END) AS total_moonlight_spent
FROM user_profiles up
JOIN user_progression prog ON up.user_id = prog.user_id
LEFT JOIN currency_transactions ct ON up.user_id = ct.user_id
GROUP BY up.user_id, up.preferred_guide, prog.level, prog.xp, prog.moonlight, prog.veil_shards,
         prog.total_readings, prog.total_journal_entries, prog.current_streak, prog.longest_streak;
