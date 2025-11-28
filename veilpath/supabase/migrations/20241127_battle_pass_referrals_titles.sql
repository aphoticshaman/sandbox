-- ═══════════════════════════════════════════════════════════════════════════════
-- VeilPath Battle Pass, Referrals, Titles, and Art Contest System
--
-- This migration adds:
-- 1. Referral tracking system
-- 2. Quest progress tracking (subscriber battle pass)
-- 3. Binary title system (prefix + suffix)
-- 4. Art contest forum channel
-- 5. Subscription rewards tracking
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- REFERRAL SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════

-- User referral codes with rate limiting
CREATE TABLE IF NOT EXISTS user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Rate limiting: max 3 link generations per day
  generation_count INT DEFAULT 0,
  last_generation_date DATE,
  CONSTRAINT unique_user_referral UNIQUE(user_id)
);

-- Completed referrals
CREATE TABLE IF NOT EXISTS referral_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rewards_claimed BOOLEAN DEFAULT FALSE,
  rewards_claimed_at TIMESTAMPTZ,
  CONSTRAINT unique_referee UNIQUE(referee_id),
  CONSTRAINT no_self_referral CHECK(referrer_id != referee_id)
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_referral_completions_referrer ON referral_completions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_code_lookup ON user_referrals(referral_code);

-- Leaderboard function
CREATE OR REPLACE FUNCTION get_referral_leaderboard(limit_count INT DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  referral_count BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.referrer_id as user_id,
    p.display_name,
    COUNT(*) as referral_count,
    RANK() OVER (ORDER BY COUNT(*) DESC) as rank
  FROM referral_completions rc
  LEFT JOIN profiles p ON p.id = rc.referrer_id
  GROUP BY rc.referrer_id, p.display_name
  ORDER BY referral_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- QUEST PROGRESS TRACKING (Battle Pass)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Track daily/weekly/monthly quest progress
CREATE TABLE IF NOT EXISTS quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id VARCHAR(100) NOT NULL,
  quest_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'seasonal', 'lifetime'
  progress INT NOT NULL DEFAULT 0,
  target INT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  rewards_claimed BOOLEAN DEFAULT FALSE,
  rewards_claimed_at TIMESTAMPTZ,
  period_start DATE NOT NULL, -- For resetting daily/weekly/monthly
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_quest_period UNIQUE(user_id, quest_id, period_start)
);

-- Lifetime quest completions (never reset)
CREATE TABLE IF NOT EXISTS lifetime_quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id VARCHAR(100) NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rewards_claimed BOOLEAN DEFAULT FALSE,
  CONSTRAINT unique_lifetime_quest UNIQUE(user_id, quest_id)
);

-- Index for efficient quest lookups
CREATE INDEX IF NOT EXISTS idx_quest_progress_user ON quest_progress(user_id, quest_type);
CREATE INDEX IF NOT EXISTS idx_quest_progress_period ON quest_progress(period_start);

-- Function to update quest progress
CREATE OR REPLACE FUNCTION update_quest_progress(
  p_user_id UUID,
  p_quest_id VARCHAR(100),
  p_quest_type VARCHAR(20),
  p_increment INT DEFAULT 1,
  p_target INT DEFAULT 1
)
RETURNS TABLE (
  new_progress INT,
  is_completed BOOLEAN,
  just_completed BOOLEAN
) AS $$
DECLARE
  v_period_start DATE;
  v_current_progress INT;
  v_was_completed BOOLEAN;
BEGIN
  -- Determine period start based on quest type
  CASE p_quest_type
    WHEN 'daily' THEN
      v_period_start := CURRENT_DATE;
    WHEN 'weekly' THEN
      v_period_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
    WHEN 'monthly' THEN
      v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    WHEN 'seasonal' THEN
      v_period_start := DATE_TRUNC('quarter', CURRENT_DATE)::DATE;
    ELSE
      v_period_start := '1970-01-01'::DATE; -- Lifetime
  END CASE;

  -- Insert or update progress
  INSERT INTO quest_progress (
    user_id, quest_id, quest_type, progress, target, period_start
  ) VALUES (
    p_user_id, p_quest_id, p_quest_type, p_increment, p_target, v_period_start
  )
  ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
    progress = LEAST(quest_progress.progress + p_increment, quest_progress.target),
    updated_at = NOW()
  RETURNING
    progress,
    completed,
    (progress >= target AND NOT completed)
  INTO v_current_progress, v_was_completed, just_completed;

  -- Mark as completed if target reached
  IF v_current_progress >= p_target AND NOT v_was_completed THEN
    UPDATE quest_progress
    SET completed = TRUE, completed_at = NOW()
    WHERE user_id = p_user_id
      AND quest_id = p_quest_id
      AND period_start = v_period_start;
    just_completed := TRUE;
  ELSE
    just_completed := FALSE;
  END IF;

  new_progress := v_current_progress;
  is_completed := v_current_progress >= p_target;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BINARY TITLE SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════

-- User's unlocked title parts
CREATE TABLE IF NOT EXISTS user_title_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_type VARCHAR(10) NOT NULL CHECK (part_type IN ('prefix', 'suffix')),
  part_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlock_source VARCHAR(50), -- 'level', 'achievement', 'referral', 'subscription', etc.
  CONSTRAINT unique_user_title_part UNIQUE(user_id, part_type, part_id)
);

-- User's currently equipped title
CREATE TABLE IF NOT EXISTS user_equipped_title (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prefix_id VARCHAR(50) NOT NULL DEFAULT 'the',
  suffix_id VARCHAR(50) NOT NULL DEFAULT 'seeker',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_user_title_parts ON user_title_parts(user_id, part_type);

-- Function to unlock a title part
CREATE OR REPLACE FUNCTION unlock_title_part(
  p_user_id UUID,
  p_part_type VARCHAR(10),
  p_part_id VARCHAR(50),
  p_source VARCHAR(50) DEFAULT 'achievement'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_already_unlocked BOOLEAN;
BEGIN
  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM user_title_parts
    WHERE user_id = p_user_id
      AND part_type = p_part_type
      AND part_id = p_part_id
  ) INTO v_already_unlocked;

  IF v_already_unlocked THEN
    RETURN FALSE;
  END IF;

  -- Insert the unlock
  INSERT INTO user_title_parts (user_id, part_type, part_id, unlock_source)
  VALUES (p_user_id, p_part_type, p_part_id, p_source);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to equip a title
CREATE OR REPLACE FUNCTION equip_title(
  p_user_id UUID,
  p_prefix_id VARCHAR(50),
  p_suffix_id VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_prefix BOOLEAN;
  v_has_suffix BOOLEAN;
BEGIN
  -- Check if user has both parts unlocked
  SELECT EXISTS(
    SELECT 1 FROM user_title_parts
    WHERE user_id = p_user_id AND part_type = 'prefix' AND part_id = p_prefix_id
  ) INTO v_has_prefix;

  SELECT EXISTS(
    SELECT 1 FROM user_title_parts
    WHERE user_id = p_user_id AND part_type = 'suffix' AND part_id = p_suffix_id
  ) INTO v_has_suffix;

  -- Default parts are always available
  IF p_prefix_id IN ('the', 'aspiring') THEN v_has_prefix := TRUE; END IF;
  IF p_suffix_id IN ('seeker', 'wanderer') THEN v_has_suffix := TRUE; END IF;

  IF NOT v_has_prefix OR NOT v_has_suffix THEN
    RETURN FALSE;
  END IF;

  -- Upsert the equipped title
  INSERT INTO user_equipped_title (user_id, prefix_id, suffix_id)
  VALUES (p_user_id, p_prefix_id, p_suffix_id)
  ON CONFLICT (user_id) DO UPDATE SET
    prefix_id = p_prefix_id,
    suffix_id = p_suffix_id,
    updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUBSCRIPTION REWARDS TRACKING
-- ═══════════════════════════════════════════════════════════════════════════════

-- Track subscription bonus claims
CREATE TABLE IF NOT EXISTS subscription_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL, -- 'first_subscription', 'monthly_renewal', 'yearly_bonus', 'lifetime_bonus'
  shards_awarded INT NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  billing_period_start DATE, -- For monthly tracking
  CONSTRAINT unique_monthly_reward UNIQUE(user_id, reward_type, billing_period_start)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ART CONTEST FORUM CHANNEL
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add art contest category to forum
DO $$
BEGIN
  -- Check if forum_categories table exists
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'forum_categories') THEN
    -- Insert the campfire/art contest category if it doesn't exist
    INSERT INTO forum_categories (id, name, description, icon, sort_order, rules, is_active)
    VALUES (
      'campfire',
      'The Campfire',
      'Quarterly community art contest! Submit your VeilPath-inspired art (AI or hand-made). Winners get their work added to the game as official cosmetics.',
      '🔥',
      50, -- Sort after other categories
      E'## The Campfire - Quarterly Art Contest\n\n### Rules:\n1. **AI or hand-made** - All art styles welcome\n2. **Must be VeilPath themed** - Tarot, mystic, cosmic, etc.\n3. **One submission per contest** - Make it count!\n4. **Original work only** - No copying others\'\' art\n5. **Contest runs quarterly** - Mid-season (Feb, May, Aug, Nov)\n\n### Prizes:\n- **Winner:** Your art becomes an official cosmetic + 5000 shards + \"Artist\" title\n- **Top 3:** 2000 shards + exclusive \"Creator\" title\n- **All participants:** 500 shards for submitting\n\n### Judging:\nThe VeilPath team votes on all submissions. We look for:\n- Creativity\n- Theme alignment\n- Visual appeal\n- Technical execution (for your medium)',
      TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      description = EXCLUDED.description,
      rules = EXCLUDED.rules;
  END IF;
END $$;

-- Art contest submissions
CREATE TABLE IF NOT EXISTS art_contest_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forum_post_id UUID, -- Link to their forum post
  contest_quarter VARCHAR(10) NOT NULL, -- '2025-Q1', '2025-Q2', etc.
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  art_type VARCHAR(20) NOT NULL CHECK (art_type IN ('ai_generated', 'hand_made', 'digital', 'mixed')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Team voting
  team_votes INT DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  placement INT, -- 1, 2, 3 for top 3
  rewards_claimed BOOLEAN DEFAULT FALSE,
  CONSTRAINT unique_contest_submission UNIQUE(user_id, contest_quarter)
);

-- Art contest schedule
CREATE TABLE IF NOT EXISTS art_contest_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_quarter VARCHAR(10) NOT NULL UNIQUE, -- '2025-Q1'
  submission_start DATE NOT NULL,
  submission_end DATE NOT NULL,
  voting_end DATE NOT NULL,
  winner_announced DATE NOT NULL,
  theme VARCHAR(200),
  cosmetic_type VARCHAR(50), -- What the winner gets to add (card_back, theme, etc.)
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert contest schedule (spaced away from seasonal events)
INSERT INTO art_contest_schedule (contest_quarter, submission_start, submission_end, voting_end, winner_announced, theme, cosmetic_type)
VALUES
  ('2025-Q1', '2025-02-01', '2025-02-21', '2025-02-25', '2025-02-28', 'Dreams & Visions', 'card_back'),
  ('2025-Q2', '2025-05-01', '2025-05-21', '2025-05-25', '2025-05-28', 'Elements of Nature', 'card_back'),
  ('2025-Q3', '2025-08-01', '2025-08-21', '2025-08-25', '2025-08-28', 'Shadow & Light', 'card_back'),
  ('2025-Q4', '2025-11-01', '2025-11-21', '2025-11-25', '2025-11-28', 'Cosmic Journey', 'card_back')
ON CONFLICT (contest_quarter) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifetime_quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_title_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipped_title ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE art_contest_submissions ENABLE ROW LEVEL SECURITY;

-- User referrals policies
DROP POLICY IF EXISTS "Users can view own referral code" ON user_referrals;
CREATE POLICY "Users can view own referral code" ON user_referrals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own referral code" ON user_referrals;
CREATE POLICY "Users can create own referral code" ON user_referrals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can look up a referral code (for validation)
DROP POLICY IF EXISTS "Anyone can lookup referral codes" ON user_referrals;
CREATE POLICY "Anyone can lookup referral codes" ON user_referrals
  FOR SELECT USING (TRUE);

-- Referral completions policies
DROP POLICY IF EXISTS "Users can view own referrals" ON referral_completions;
CREATE POLICY "Users can view own referrals" ON referral_completions
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Quest progress policies
DROP POLICY IF EXISTS "Users can view own quest progress" ON quest_progress;
CREATE POLICY "Users can view own quest progress" ON quest_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quest progress" ON quest_progress;
CREATE POLICY "Users can update own quest progress" ON quest_progress
  FOR ALL USING (auth.uid() = user_id);

-- Title parts policies
DROP POLICY IF EXISTS "Users can view own title parts" ON user_title_parts;
CREATE POLICY "Users can view own title parts" ON user_title_parts
  FOR SELECT USING (auth.uid() = user_id);

-- Equipped title policies
DROP POLICY IF EXISTS "Users can manage own equipped title" ON user_equipped_title;
CREATE POLICY "Users can manage own equipped title" ON user_equipped_title
  FOR ALL USING (auth.uid() = user_id);

-- Anyone can view equipped titles (for forum display)
DROP POLICY IF EXISTS "Anyone can view equipped titles" ON user_equipped_title;
CREATE POLICY "Anyone can view equipped titles" ON user_equipped_title
  FOR SELECT USING (TRUE);

-- Subscription rewards policies
DROP POLICY IF EXISTS "Users can view own subscription rewards" ON subscription_rewards;
CREATE POLICY "Users can view own subscription rewards" ON subscription_rewards
  FOR SELECT USING (auth.uid() = user_id);

-- Art contest policies
DROP POLICY IF EXISTS "Anyone can view art submissions" ON art_contest_submissions;
CREATE POLICY "Anyone can view art submissions" ON art_contest_submissions
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can submit own art" ON art_contest_submissions;
CREATE POLICY "Users can submit own art" ON art_contest_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- GRANT DEFAULT TITLE PARTS TO EXISTING USERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- This will run on migration, granting default titles to all existing users
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- For each existing user, grant default title parts
  FOR v_user_id IN SELECT id FROM auth.users LOOP
    -- Grant default prefixes
    INSERT INTO user_title_parts (user_id, part_type, part_id, unlock_source)
    VALUES
      (v_user_id, 'prefix', 'the', 'default'),
      (v_user_id, 'prefix', 'aspiring', 'default')
    ON CONFLICT DO NOTHING;

    -- Grant default suffixes
    INSERT INTO user_title_parts (user_id, part_type, part_id, unlock_source)
    VALUES
      (v_user_id, 'suffix', 'seeker', 'default'),
      (v_user_id, 'suffix', 'wanderer', 'default')
    ON CONFLICT DO NOTHING;

    -- Set default equipped title
    INSERT INTO user_equipped_title (user_id, prefix_id, suffix_id)
    VALUES (v_user_id, 'the', 'seeker')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER: Grant default titles to new users
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION grant_default_titles()
RETURNS TRIGGER AS $$
BEGIN
  -- Grant default prefixes
  INSERT INTO user_title_parts (user_id, part_type, part_id, unlock_source)
  VALUES
    (NEW.id, 'prefix', 'the', 'default'),
    (NEW.id, 'prefix', 'aspiring', 'default');

  -- Grant default suffixes
  INSERT INTO user_title_parts (user_id, part_type, part_id, unlock_source)
  VALUES
    (NEW.id, 'suffix', 'seeker', 'default'),
    (NEW.id, 'suffix', 'wanderer', 'default');

  -- Set default equipped title
  INSERT INTO user_equipped_title (user_id, prefix_id, suffix_id)
  VALUES (NEW.id, 'the', 'seeker');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_grant_titles ON auth.users;
CREATE TRIGGER on_user_created_grant_titles
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION grant_default_titles();

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════

-- View for displaying user titles in forum
CREATE OR REPLACE VIEW user_display_titles AS
SELECT
  u.id as user_id,
  u.email,
  p.display_name,
  et.prefix_id,
  et.suffix_id,
  COALESCE(et.prefix_id, 'the') || ' ' || COALESCE(et.suffix_id, 'seeker') as display_title
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN user_equipped_title et ON et.user_id = u.id;

-- View for current art contest
CREATE OR REPLACE VIEW current_art_contest AS
SELECT *
FROM art_contest_schedule
WHERE submission_start <= CURRENT_DATE
  AND winner_announced >= CURRENT_DATE
ORDER BY submission_start DESC
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- GROWING CONSTELLATION SYSTEM
-- Community-grown card back that adds a star for each referral
-- ═══════════════════════════════════════════════════════════════════════════════

-- Track constellation state and history
CREATE TABLE IF NOT EXISTS constellation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_stars INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asset_version INT NOT NULL DEFAULT 1,
  asset_url TEXT, -- URL to current constellation image
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track each star added (for potential rollback/audit)
CREATE TABLE IF NOT EXISTS constellation_stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_completion_id UUID REFERENCES referral_completions(id) ON DELETE CASCADE,
  star_position JSONB, -- {x, y, brightness, size} for rendering
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  batch_id INT -- Which nightly batch added this star
);

-- Track users eligible to use the constellation card back
-- (Must be a referrer OR referee)
CREATE TABLE IF NOT EXISTS constellation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participation_type VARCHAR(20) NOT NULL, -- 'referrer', 'referee', 'both'
  first_participation_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cosmetic_unlocked BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_constellation_participant UNIQUE(user_id)
);

-- Cron job tracking for nightly regeneration
CREATE TABLE IF NOT EXISTS constellation_cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id SERIAL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stars_before INT NOT NULL,
  stars_after INT NOT NULL,
  new_referrals_processed INT NOT NULL DEFAULT 0,
  asset_regenerated BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'processing', 'completed', 'failed'
);

-- Index for efficient participant lookups
CREATE INDEX IF NOT EXISTS idx_constellation_participants_user ON constellation_participants(user_id);

-- Function to count referral stars for constellation
CREATE OR REPLACE FUNCTION get_constellation_star_count()
RETURNS INT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM referral_completions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use constellation card back
CREATE OR REPLACE FUNCTION can_use_constellation(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM constellation_participants
    WHERE user_id = p_user_id AND cosmetic_unlocked = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Add user to constellation participants when they complete a referral
CREATE OR REPLACE FUNCTION add_constellation_participant()
RETURNS TRIGGER AS $$
BEGIN
  -- Add referrer as participant
  INSERT INTO constellation_participants (user_id, participation_type)
  VALUES (NEW.referrer_id, 'referrer')
  ON CONFLICT (user_id) DO UPDATE
  SET participation_type = CASE
    WHEN constellation_participants.participation_type = 'referee' THEN 'both'
    ELSE constellation_participants.participation_type
  END;

  -- Add referee as participant
  INSERT INTO constellation_participants (user_id, participation_type)
  VALUES (NEW.referee_id, 'referee')
  ON CONFLICT (user_id) DO UPDATE
  SET participation_type = CASE
    WHEN constellation_participants.participation_type = 'referrer' THEN 'both'
    ELSE constellation_participants.participation_type
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_referral_add_constellation_participant ON referral_completions;
CREATE TRIGGER on_referral_add_constellation_participant
  AFTER INSERT ON referral_completions
  FOR EACH ROW
  EXECUTE FUNCTION add_constellation_participant();

-- Initialize constellation state
INSERT INTO constellation_state (total_stars, asset_version, asset_url)
VALUES (0, 1, '/assets/cosmetics/cardbacks/growing_constellation_v1.png')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CRON JOB SETUP (Supabase pg_cron or external cron)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- The following needs to be set up via Supabase dashboard or pg_cron:
--
-- Daily at 12:01 AM:
-- 1. Count new referrals since last run
-- 2. Generate star positions for new stars
-- 3. Call external AI/Image service to regenerate constellation image
-- 4. Update asset_url with new version
-- 5. Increment asset_version
--
-- Example pg_cron job (add via Supabase SQL editor with superuser):
-- SELECT cron.schedule(
--   'nightly-constellation-update',
--   '1 0 * * *', -- 12:01 AM daily
--   $$SELECT update_constellation_nightly()$$
-- );
-- ═══════════════════════════════════════════════════════════════════════════════

-- Placeholder function for nightly update (called by cron or external service)
CREATE OR REPLACE FUNCTION update_constellation_nightly()
RETURNS JSONB AS $$
DECLARE
  v_batch_id INT;
  v_stars_before INT;
  v_new_referrals INT;
  v_result JSONB;
BEGIN
  -- Get current star count
  SELECT total_stars INTO v_stars_before FROM constellation_state LIMIT 1;

  -- Count unprocessed referrals (no star entry yet)
  SELECT COUNT(*) INTO v_new_referrals
  FROM referral_completions rc
  WHERE NOT EXISTS (
    SELECT 1 FROM constellation_stars cs
    WHERE cs.referral_completion_id = rc.id
  );

  -- Create cron run record
  INSERT INTO constellation_cron_runs (stars_before, stars_after, new_referrals_processed, status)
  VALUES (v_stars_before, v_stars_before + v_new_referrals, v_new_referrals, 'processing')
  RETURNING batch_id INTO v_batch_id;

  -- Generate star positions for new referrals
  INSERT INTO constellation_stars (referral_completion_id, star_position, batch_id)
  SELECT
    rc.id,
    jsonb_build_object(
      'x', 0.1 + (random() * 0.8), -- Random x between 10% and 90%
      'y', 0.1 + (random() * 0.6), -- Random y between 10% and 70% (above grass)
      'brightness', 0.5 + (random() * 0.5), -- 50-100% brightness
      'size', 1 + (random() * 2) -- Size 1-3
    ),
    v_batch_id
  FROM referral_completions rc
  WHERE NOT EXISTS (
    SELECT 1 FROM constellation_stars cs
    WHERE cs.referral_completion_id = rc.id
  );

  -- Update constellation state
  UPDATE constellation_state
  SET
    total_stars = total_stars + v_new_referrals,
    last_updated = NOW(),
    asset_version = asset_version + 1;

  -- Mark cron run as pending image regeneration
  -- (External service should poll for this and regenerate)
  UPDATE constellation_cron_runs
  SET status = 'completed', asset_regenerated = FALSE
  WHERE batch_id = v_batch_id;

  v_result := jsonb_build_object(
    'batch_id', v_batch_id,
    'stars_before', v_stars_before,
    'new_stars', v_new_referrals,
    'total_stars', v_stars_before + v_new_referrals,
    'status', 'completed'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
