-- Orthogonal Database Schema
-- Run this in Supabase SQL Editor or via migrations

-- ========================================
-- Players
-- ========================================

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  platform TEXT NOT NULL DEFAULT 'web', -- web, steam, tiktok, twitch

  -- Stats
  total_score BIGINT DEFAULT 0,
  puzzles_solved INT DEFAULT 0,
  average_time FLOAT DEFAULT 0,
  best_time FLOAT,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,

  -- SDPM Profile (Sanskrit-derived personality vectors)
  sdpm_profile JSONB DEFAULT '{}',
  difficulty_tier TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced, expert, transcendent

  -- Streamer info
  is_streamer BOOLEAN DEFAULT false,
  stream_platform TEXT,
  viewer_peak INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_auth ON players(auth_id);
CREATE INDEX idx_players_score ON players(total_score DESC);
CREATE INDEX idx_players_difficulty ON players(difficulty_tier, total_score DESC);
CREATE INDEX idx_players_streamer ON players(is_streamer, viewer_peak DESC);

-- ========================================
-- Leaderboards (materialized view for fast queries)
-- ========================================

CREATE TABLE leaderboards (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  score BIGINT DEFAULT 0,
  puzzles_solved INT DEFAULT 0,
  average_time FLOAT DEFAULT 0,
  streak_days INT DEFAULT 0,
  difficulty TEXT DEFAULT 'beginner',
  platform TEXT DEFAULT 'web',
  is_streamer BOOLEAN DEFAULT false,
  viewer_peak INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leaderboards_score ON leaderboards(score DESC);
CREATE INDEX idx_leaderboards_difficulty ON leaderboards(difficulty, score DESC);
CREATE INDEX idx_leaderboards_streamers ON leaderboards(is_streamer, viewer_peak DESC) WHERE is_streamer = true;
CREATE INDEX idx_leaderboards_weekly ON leaderboards(updated_at DESC, score DESC);

-- ========================================
-- Puzzle Completions
-- ========================================

CREATE TABLE puzzle_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL,
  score INT NOT NULL,
  completion_time FLOAT NOT NULL,
  difficulty_at_completion TEXT NOT NULL,
  party_id UUID, -- NULL if solo
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_completions_player ON puzzle_completions(player_id, completed_at DESC);
CREATE INDEX idx_completions_puzzle ON puzzle_completions(puzzle_id, score DESC);
CREATE INDEX idx_completions_party ON puzzle_completions(party_id) WHERE party_id IS NOT NULL;

-- ========================================
-- Friends
-- ========================================

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES players(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, friend_id)
);

CREATE INDEX idx_friendships_player ON friendships(player_id, status);
CREATE INDEX idx_friendships_friend ON friendships(friend_id, status);

-- ========================================
-- Parties
-- ========================================

CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,
  leader_id UUID REFERENCES players(id),
  settings JSONB DEFAULT '{}',
  state TEXT DEFAULT 'lobby', -- lobby, matchmaking, in-puzzle, transitioning
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE party_members (
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- leader, member
  ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (party_id, player_id)
);

CREATE INDEX idx_parties_code ON parties(invite_code);
CREATE INDEX idx_party_members_player ON party_members(player_id);

-- ========================================
-- Spectator Sessions
-- ========================================

CREATE TABLE spectator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES players(id) ON DELETE CASCADE,
  puzzle_id TEXT,
  viewer_count INT DEFAULT 0,
  peak_viewers INT DEFAULT 0,
  engagement_score FLOAT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_live BOOLEAN DEFAULT true
);

CREATE INDEX idx_spectator_live ON spectator_sessions(is_live, engagement_score DESC) WHERE is_live = true;
CREATE INDEX idx_spectator_streamer ON spectator_sessions(streamer_id, started_at DESC);

-- ========================================
-- Chat Messages (for party persistence)
-- ========================================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES players(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, system, quickcomm, emote
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_party ON chat_messages(party_id, created_at DESC);

-- ========================================
-- Achievements
-- ========================================

CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
  unlock_condition JSONB DEFAULT '{}'
);

CREATE TABLE player_achievements (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (player_id, achievement_id)
);

-- ========================================
-- Analytics (for SDPM profiling)
-- ========================================

CREATE TABLE input_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  input_patterns JSONB DEFAULT '{}',
  personality_vectors JSONB DEFAULT '{}'
);

CREATE INDEX idx_input_sessions_player ON input_sessions(player_id, session_start DESC);

-- ========================================
-- Functions
-- ========================================

-- Get player's global rank
CREATE OR REPLACE FUNCTION get_player_rank(p_player_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT + 1
  FROM leaderboards
  WHERE score > (SELECT score FROM leaderboards WHERE player_id = p_player_id)
$$ LANGUAGE SQL STABLE;

-- Get player's rank within difficulty tier
CREATE OR REPLACE FUNCTION get_player_rank_by_difficulty(p_player_id UUID, p_difficulty TEXT)
RETURNS INT AS $$
  SELECT COUNT(*)::INT + 1
  FROM leaderboards
  WHERE difficulty = p_difficulty
    AND score > (SELECT score FROM leaderboards WHERE player_id = p_player_id)
$$ LANGUAGE SQL STABLE;

-- Update leaderboard entry when player stats change
CREATE OR REPLACE FUNCTION sync_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO leaderboards (
    player_id, display_name, avatar_url, score, puzzles_solved,
    average_time, streak_days, difficulty, platform, is_streamer, viewer_peak, updated_at
  )
  VALUES (
    NEW.id, NEW.display_name, NEW.avatar_url, NEW.total_score, NEW.puzzles_solved,
    NEW.average_time, NEW.current_streak, NEW.difficulty_tier, NEW.platform,
    NEW.is_streamer, NEW.viewer_peak, NOW()
  )
  ON CONFLICT (player_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    score = EXCLUDED.score,
    puzzles_solved = EXCLUDED.puzzles_solved,
    average_time = EXCLUDED.average_time,
    streak_days = EXCLUDED.streak_days,
    difficulty = EXCLUDED.difficulty,
    platform = EXCLUDED.platform,
    is_streamer = EXCLUDED.is_streamer,
    viewer_peak = EXCLUDED.viewer_peak,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_leaderboard
AFTER INSERT OR UPDATE ON players
FOR EACH ROW EXECUTE FUNCTION sync_leaderboard();

-- Update player stats after puzzle completion
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE players SET
    total_score = total_score + NEW.score,
    puzzles_solved = puzzles_solved + 1,
    average_time = (average_time * (puzzles_solved) + NEW.completion_time) / (puzzles_solved + 1),
    best_time = LEAST(COALESCE(best_time, NEW.completion_time), NEW.completion_time),
    updated_at = NOW()
  WHERE id = NEW.player_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_stats
AFTER INSERT ON puzzle_completions
FOR EACH ROW EXECUTE FUNCTION update_player_stats();

-- ========================================
-- Row Level Security
-- ========================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE input_sessions ENABLE ROW LEVEL SECURITY;

-- Players can read all players (for leaderboards) but only update themselves
CREATE POLICY "Players are viewable by everyone" ON players
  FOR SELECT USING (true);

CREATE POLICY "Players can update own record" ON players
  FOR UPDATE USING (auth.uid() = auth_id);

-- Leaderboards are public read
CREATE POLICY "Leaderboards are viewable by everyone" ON leaderboards
  FOR SELECT USING (true);

-- Friends policies
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (auth.uid() IN (
    SELECT auth_id FROM players WHERE id = player_id OR id = friend_id
  ));

CREATE POLICY "Users can manage own friendships" ON friendships
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

-- Party policies
CREATE POLICY "Parties are viewable by members" ON parties
  FOR SELECT USING (true);

CREATE POLICY "Party members are viewable by party members" ON party_members
  FOR SELECT USING (true);

-- ========================================
-- Realtime
-- ========================================

-- Enable realtime for leaderboards
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboards;

-- Enable realtime for parties
ALTER PUBLICATION supabase_realtime ADD TABLE parties;
ALTER PUBLICATION supabase_realtime ADD TABLE party_members;

-- Enable realtime for spectator sessions
ALTER PUBLICATION supabase_realtime ADD TABLE spectator_sessions;

-- ========================================
-- Initial Data
-- ========================================

-- Insert base achievements
INSERT INTO achievements (id, name, description, icon, rarity) VALUES
  ('first_solve', 'First Steps', 'Solve your first puzzle', '🎯', 'common'),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', '🔥', 'common'),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day streak', '💎', 'rare'),
  ('speed_demon', 'Speed Demon', 'Complete a puzzle in under 10 seconds', '⚡', 'rare'),
  ('witness_master', 'Witness Master', 'Spend 10 minutes in witness mode', '👁', 'common'),
  ('party_animal', 'Party Animal', 'Complete 10 puzzles with friends', '🎉', 'common'),
  ('transcendent', 'Transcendent', 'Reach Transcendent difficulty tier', '✨', 'legendary'),
  ('streamer', 'Going Live', 'Stream with 10+ concurrent viewers', '📺', 'rare'),
  ('viral', 'Viral', 'Have 100+ viewers on a single stream', '🌟', 'epic'),
  ('helper', 'Helping Hand', 'Help solve 50 puzzles as a party member', '🤝', 'common');
