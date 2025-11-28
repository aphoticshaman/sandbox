-- ═══════════════════════════════════════════════════════════════════════════════
-- VeilPath Community Tables
-- Forums, posts, replies, votes, moderation
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMUNITY POSTS (Forum threads, daily card shares, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  card_ids JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Engagement
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  -- Moderation
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved', -- pending, approved, hidden, removed
  content_warning TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_community_posts_channel ON community_posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_activity ON community_posts(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_channel_created ON community_posts(channel_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMUNITY REPLIES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES community_replies(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,

  -- Engagement
  likes_count INTEGER DEFAULT 0,

  -- Moderation
  is_hidden BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_replies_post ON community_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_community_replies_user ON community_replies(user_id);

-- Trigger to update post reply count and last_activity
CREATE OR REPLACE FUNCTION update_post_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts
    SET replies_count = replies_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts
    SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_reply_stats ON community_replies;
CREATE TRIGGER trigger_update_post_reply_stats
AFTER INSERT OR DELETE ON community_replies
FOR EACH ROW EXECUTE FUNCTION update_post_reply_stats();

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMUNITY VOTES (Likes, helpful votes, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES community_replies(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL DEFAULT 'like', -- like, helpful, insightful
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure user can only vote once per content
  CONSTRAINT unique_user_post_vote UNIQUE (user_id, post_id),
  CONSTRAINT unique_user_reply_vote UNIQUE (user_id, reply_id),
  -- Must vote on either post or reply
  CONSTRAINT vote_target_check CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR
    (post_id IS NULL AND reply_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_community_votes_post ON community_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_reply ON community_votes(reply_id);

-- Trigger to update likes count
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.reply_id IS NOT NULL THEN
      UPDATE community_replies SET likes_count = likes_count + 1 WHERE id = NEW.reply_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF OLD.reply_id IS NOT NULL THEN
      UPDATE community_replies SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.reply_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_likes_count ON community_votes;
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON community_votes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMUNITY MESSAGES (Real-time chat)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,

  -- Moderation
  is_hidden BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_channel ON community_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created ON community_messages(channel_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- MODERATION LOG
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID,
  content_type TEXT NOT NULL, -- post, reply, message
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- safe, sensitive, mental_health, spam, harassment, harmful
  action_taken TEXT NOT NULL, -- allow, warn, hide, block
  confidence FLOAT,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_created ON moderation_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_log_category ON moderation_log(category);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTENT REPORTS (User-submitted reports)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- spam, harassment, harmful, other
  details TEXT,
  status TEXT DEFAULT 'pending', -- pending, resolved, dismissed, escalated
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- USER COMMUNITY STATS (For badges, leaderboards)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_community_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_posts INTEGER DEFAULT 0,
  total_replies INTEGER DEFAULT 0,
  total_likes_given INTEGER DEFAULT 0,
  total_likes_received INTEGER DEFAULT 0,
  helpful_votes_received INTEGER DEFAULT 0,
  daily_card_shares INTEGER DEFAULT 0,
  last_post_at TIMESTAMPTZ,
  last_daily_share_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update user stats on post
CREATE OR REPLACE FUNCTION update_user_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_community_stats (user_id, total_posts, last_post_at)
    VALUES (NEW.user_id, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      total_posts = user_community_stats.total_posts + 1,
      last_post_at = NOW(),
      daily_card_shares = CASE
        WHEN NEW.channel_id = 'daily_card'
        THEN user_community_stats.daily_card_shares + 1
        ELSE user_community_stats.daily_card_shares
      END,
      last_daily_share_at = CASE
        WHEN NEW.channel_id = 'daily_card'
        THEN NOW()
        ELSE user_community_stats.last_daily_share_at
      END,
      updated_at = NOW();
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_post_stats ON community_posts;
CREATE TRIGGER trigger_update_user_post_stats
AFTER INSERT ON community_posts
FOR EACH ROW EXECUTE FUNCTION update_user_post_stats();

-- ─────────────────────────────────────────────────────────────────────────────
-- ADD BADGES COLUMN TO USERS (if not exists)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'badges'
  ) THEN
    ALTER TABLE users ADD COLUMN badges TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Posts: Anyone can read non-hidden, users can create, only owner can update
CREATE POLICY "Posts are viewable by everyone" ON community_posts
  FOR SELECT USING (is_hidden = false AND moderation_status = 'approved');

CREATE POLICY "Users can create posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Replies: Similar to posts
CREATE POLICY "Replies are viewable by everyone" ON community_replies
  FOR SELECT USING (is_hidden = false);

CREATE POLICY "Users can create replies" ON community_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies" ON community_replies
  FOR UPDATE USING (auth.uid() = user_id);

-- Votes: Users can manage their own votes
CREATE POLICY "Users can manage own votes" ON community_votes
  FOR ALL USING (auth.uid() = user_id);

-- Messages: Similar to posts
CREATE POLICY "Messages are viewable by everyone" ON community_messages
  FOR SELECT USING (is_hidden = false);

CREATE POLICY "Users can send messages" ON community_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ENABLE REALTIME FOR CHAT
-- ─────────────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'Community tables created successfully!';
  RAISE NOTICE 'Tables: community_posts, community_replies, community_votes, community_messages';
  RAISE NOTICE 'Moderation: moderation_log, content_reports';
  RAISE NOTICE 'Stats: user_community_stats';
  RAISE NOTICE 'RLS policies enabled. Realtime enabled for messages.';
END $$;
