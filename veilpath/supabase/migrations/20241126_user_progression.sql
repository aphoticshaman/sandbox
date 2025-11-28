-- User Progression Table
-- Stores user XP, level, streaks, achievements, and currency
-- Synced with client every 2 seconds during active sessions

CREATE TABLE IF NOT EXISTS user_progression (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Level & XP
  level INTEGER DEFAULT 1 NOT NULL,
  xp INTEGER DEFAULT 0 NOT NULL,
  xp_to_next_level INTEGER DEFAULT 100 NOT NULL,
  current_title TEXT DEFAULT 'Seeker' NOT NULL,
  unlocked_titles TEXT[] DEFAULT ARRAY['Seeker'] NOT NULL,

  -- Streaks
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_active_date TIMESTAMPTZ,

  -- Stats
  total_readings INTEGER DEFAULT 0 NOT NULL,
  total_journal_entries INTEGER DEFAULT 0 NOT NULL,
  mindfulness_minutes INTEGER DEFAULT 0 NOT NULL,

  -- Achievements (stored as JSON arrays)
  unlocked_achievements TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  achievement_progress JSONB DEFAULT '{}'::JSONB NOT NULL,

  -- Currency (Veil Shards)
  veil_shards INTEGER DEFAULT 0 NOT NULL,

  -- Quests (daily/weekly progress)
  daily_quests_completed INTEGER DEFAULT 0 NOT NULL,
  weekly_quests_completed INTEGER DEFAULT 0 NOT NULL,
  quest_progress JSONB DEFAULT '{}'::JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_progression_user_id ON user_progression(user_id);

-- RLS Policies
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own progression
CREATE POLICY "Users can read own progression"
  ON user_progression
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progression"
  ON user_progression
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progression"
  ON user_progression
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at on changes
CREATE OR REPLACE FUNCTION update_progression_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS user_progression_updated_at ON user_progression;
CREATE TRIGGER user_progression_updated_at
  BEFORE UPDATE ON user_progression
  FOR EACH ROW
  EXECUTE FUNCTION update_progression_timestamp();

-- Reading History Table (for reading persistence/recovery)
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Session state
  reading_type TEXT NOT NULL, -- 'single', 'three_card', 'celtic_cross'
  spread_state JSONB NOT NULL, -- Full state of the spread
  intention TEXT,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,

  -- Recovery info
  last_position INTEGER DEFAULT 0 NOT NULL, -- Which card they were on
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for finding active sessions
CREATE INDEX IF NOT EXISTS idx_reading_sessions_active
  ON reading_sessions(user_id, is_completed)
  WHERE is_completed = FALSE;

-- RLS for reading sessions
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reading sessions"
  ON reading_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- Journal Draft Recovery Table
CREATE TABLE IF NOT EXISTS journal_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  title TEXT,
  content TEXT,
  mood TEXT,
  tags TEXT[],
  linked_reading_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Only one draft per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_drafts_user
  ON journal_drafts(user_id);

ALTER TABLE journal_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own drafts"
  ON journal_drafts
  FOR ALL
  USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON user_progression TO authenticated;
GRANT ALL ON reading_sessions TO authenticated;
GRANT ALL ON journal_drafts TO authenticated;
