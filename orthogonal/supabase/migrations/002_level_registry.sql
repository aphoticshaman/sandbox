-- Level Registry Schema
-- Each procedurally generated level gets its own fingerprint and leaderboard

-- ========================================
-- Levels Table
-- ========================================

CREATE TABLE levels (
  id TEXT PRIMARY KEY,                    -- Hash of level parameters
  short_code TEXT UNIQUE NOT NULL,        -- Human-readable share code
  parameters JSONB NOT NULL,              -- Full generation parameters

  -- Difficulty
  difficulty_rating FLOAT NOT NULL,       -- 0-100 computed rating
  difficulty_tier TEXT NOT NULL,          -- beginner, intermediate, advanced, expert, transcendent

  -- Stats (updated on each play)
  play_count INT DEFAULT 0,
  completion_rate FLOAT DEFAULT 0,        -- 0-1
  average_time FLOAT DEFAULT 0,           -- Average completion time in ms

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_cleared_at TIMESTAMPTZ,
  first_cleared_by UUID REFERENCES players(id)
);

CREATE INDEX idx_levels_short_code ON levels(short_code);
CREATE INDEX idx_levels_difficulty ON levels(difficulty_rating, play_count DESC);
CREATE INDEX idx_levels_tier ON levels(difficulty_tier, play_count DESC);
CREATE INDEX idx_levels_popular ON levels(play_count DESC);
CREATE INDEX idx_levels_new ON levels(created_at DESC);

-- ========================================
-- Level Scores Table
-- ========================================

CREATE TABLE level_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id TEXT REFERENCES levels(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,

  score INT NOT NULL,
  completion_time FLOAT NOT NULL,         -- Time in ms

  completed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(level_id, player_id, score)      -- One entry per unique score
);

CREATE INDEX idx_level_scores_level ON level_scores(level_id, score DESC);
CREATE INDEX idx_level_scores_player ON level_scores(player_id, level_id);
CREATE INDEX idx_level_scores_time ON level_scores(level_id, completion_time ASC);

-- ========================================
-- Level Attempts (for completion rate tracking)
-- ========================================

CREATE TABLE level_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id TEXT REFERENCES levels(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  attempt_time FLOAT,                     -- How long they played before giving up/winning
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_level_attempts_level ON level_attempts(level_id, attempted_at DESC);

-- ========================================
-- Level Tags (for discovery)
-- ========================================

CREATE TABLE level_tags (
  level_id TEXT REFERENCES levels(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (level_id, tag)
);

CREATE INDEX idx_level_tags_tag ON level_tags(tag);

-- ========================================
-- Player Level History
-- ========================================

CREATE TABLE player_level_history (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  level_id TEXT REFERENCES levels(id) ON DELETE CASCADE,
  first_played_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  play_count INT DEFAULT 1,
  best_score INT,
  best_time FLOAT,
  PRIMARY KEY (player_id, level_id)
);

CREATE INDEX idx_player_levels_player ON player_level_history(player_id, last_played_at DESC);

-- ========================================
-- Functions
-- ========================================

-- Get level rank for a specific score
CREATE OR REPLACE FUNCTION get_level_rank(p_level_id TEXT, p_score INT)
RETURNS INT AS $$
  SELECT COUNT(*)::INT + 1
  FROM level_scores
  WHERE level_id = p_level_id AND score > p_score
$$ LANGUAGE SQL STABLE;

-- Auto-update level stats on new score
CREATE OR REPLACE FUNCTION update_level_stats_on_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update play count and average time
  UPDATE levels SET
    play_count = play_count + 1,
    average_time = CASE
      WHEN average_time = 0 THEN NEW.completion_time
      ELSE (average_time * (play_count - 1) + NEW.completion_time) / play_count
    END,
    first_cleared_at = COALESCE(first_cleared_at, NOW()),
    first_cleared_by = COALESCE(first_cleared_by, NEW.player_id)
  WHERE id = NEW.level_id;

  -- Update player level history
  INSERT INTO player_level_history (player_id, level_id, best_score, best_time)
  VALUES (NEW.player_id, NEW.level_id, NEW.score, NEW.completion_time)
  ON CONFLICT (player_id, level_id) DO UPDATE SET
    last_played_at = NOW(),
    play_count = player_level_history.play_count + 1,
    best_score = GREATEST(player_level_history.best_score, EXCLUDED.best_score),
    best_time = LEAST(COALESCE(player_level_history.best_time, EXCLUDED.best_time), EXCLUDED.best_time);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_level_score_stats
AFTER INSERT ON level_scores
FOR EACH ROW EXECUTE FUNCTION update_level_stats_on_score();

-- Update completion rate from attempts
CREATE OR REPLACE FUNCTION update_completion_rate()
RETURNS TRIGGER AS $$
DECLARE
  total_attempts INT;
  completed_attempts INT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
  INTO total_attempts, completed_attempts
  FROM level_attempts
  WHERE level_id = NEW.level_id;

  UPDATE levels SET
    completion_rate = CASE
      WHEN total_attempts > 0 THEN completed_attempts::FLOAT / total_attempts
      ELSE 0
    END
  WHERE id = NEW.level_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_completion_rate
AFTER INSERT ON level_attempts
FOR EACH ROW EXECUTE FUNCTION update_completion_rate();

-- ========================================
-- Views
-- ========================================

-- Popular levels by tier
CREATE VIEW popular_levels_by_tier AS
SELECT
  l.*,
  RANK() OVER (PARTITION BY l.difficulty_tier ORDER BY l.play_count DESC) as tier_rank
FROM levels l
WHERE l.play_count > 0;

-- Today's most played
CREATE VIEW todays_popular_levels AS
SELECT
  l.*,
  COUNT(ls.id) as today_plays
FROM levels l
LEFT JOIN level_scores ls ON l.id = ls.level_id
  AND ls.completed_at > NOW() - INTERVAL '24 hours'
GROUP BY l.id
ORDER BY today_plays DESC
LIMIT 50;

-- ========================================
-- RLS
-- ========================================

ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_level_history ENABLE ROW LEVEL SECURITY;

-- Levels are public read
CREATE POLICY "Levels are viewable by everyone" ON levels
  FOR SELECT USING (true);

-- Scores are public read
CREATE POLICY "Level scores are viewable by everyone" ON level_scores
  FOR SELECT USING (true);

-- Players can insert their own scores
CREATE POLICY "Players can submit scores" ON level_scores
  FOR INSERT WITH CHECK (true);

-- Attempts - players can insert their own
CREATE POLICY "Players can record attempts" ON level_attempts
  FOR INSERT WITH CHECK (true);

-- Level history - players see their own
CREATE POLICY "Players see own level history" ON player_level_history
  FOR SELECT USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

-- ========================================
-- Realtime
-- ========================================

ALTER PUBLICATION supabase_realtime ADD TABLE level_scores;
