-- VEILPATH PRODUCTION DATABASE SCHEMA
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,

  -- Progression data
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 100,
  current_title TEXT DEFAULT 'Seeker',

  -- User preferences
  zodiac_sign TEXT,
  birthdate DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Users can only see/edit their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- READINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS readings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Reading metadata
  spread_type TEXT NOT NULL,
  intention TEXT NOT NULL,
  reading_type TEXT,
  quantum_seed TEXT NOT NULL,

  -- Cards drawn (JSON array)
  cards JSONB NOT NULL,

  -- Full interpretation from Claude (JSON)
  interpretation JSONB NOT NULL,

  -- Astrological context
  zodiac_sign TEXT,
  birthdate DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_readings_user_id ON readings(user_id);
CREATE INDEX idx_readings_created_at ON readings(created_at DESC);
CREATE INDEX idx_readings_quantum_seed ON readings(quantum_seed);

-- RLS: Users can only access their own readings
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own readings"
  ON readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own readings"
  ON readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own readings"
  ON readings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own readings"
  ON readings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- JOURNAL ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reading_id UUID REFERENCES readings(id) ON DELETE SET NULL,

  -- Journal content
  title TEXT,
  content TEXT NOT NULL,

  -- Mood tracking
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),

  -- Tags
  tags TEXT[],

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_journal_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_reading_id ON journal_entries(reading_id);

-- RLS: Users can only access their own journal entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journals"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journals"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journals"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_achievements_user_id ON user_achievements(user_id);

-- RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ACTION TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS action_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reading_id UUID REFERENCES readings(id) ON DELETE CASCADE NOT NULL,

  action_text TEXT NOT NULL,
  card_index INTEGER NOT NULL,

  -- Status: null = skipped, true = done, false = not done
  completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_actions_user_id ON action_items(user_id);
CREATE INDEX idx_actions_reading_id ON action_items(reading_id);

-- RLS
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions"
  ON action_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own actions"
  ON action_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actions"
  ON action_items FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STATISTICS TABLE (for deck viewer, card frequencies, etc)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Card draw statistics (JSONB for flexibility)
  card_frequencies JSONB DEFAULT '{}'::jsonb,

  -- Total readings
  total_readings INTEGER DEFAULT 0,

  -- Streak data
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_reading_date DATE,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_readings_updated_at BEFORE UPDATE ON readings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_journal_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Seeker')
  );

  -- Initialize stats
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- COMPLETE
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant access to tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence access
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'VeilPath database schema created successfully!';
  RAISE NOTICE 'All tables have RLS enabled for security.';
  RAISE NOTICE 'Users can only access their own data.';
END $$;
