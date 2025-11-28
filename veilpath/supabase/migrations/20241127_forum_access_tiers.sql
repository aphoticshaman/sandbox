-- ═══════════════════════════════════════════════════════════════════════════════
-- Forum Access Tiers
-- Free users get certain sections, premium members get VIP lounge + all areas
--
-- FREE SECTIONS: support, faq, troubleshooting, daily_card, general
-- PREMIUM SECTIONS: vip_lounge, guides, deck_building, spreads, interpretations
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- FORUM CHANNELS TABLE
-- Defines available forum sections and their access requirements
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_channels (
  id TEXT PRIMARY KEY, -- e.g., 'vip_lounge', 'general', 'support'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji or icon name

  -- Access control
  access_tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'premium', 'admin'

  -- Display order
  sort_order INTEGER DEFAULT 0,

  -- Visibility
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INSERT DEFAULT CHANNELS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO forum_channels (id, name, description, icon, access_tier, sort_order) VALUES
  -- FREE SECTIONS (everyone gets these)
  ('general', 'General Discussion', 'Chat about anything VeilPath-related', '💬', 'free', 10),
  ('daily_card', 'Card of the Day', 'Share your daily pull and discuss interpretations', '🌅', 'free', 20),
  ('support', 'Help & Support', 'Questions, troubleshooting, and assistance', '🆘', 'free', 30),
  ('faq', 'FAQ & Guides', 'Frequently asked questions and beginner guides', '📖', 'free', 40),
  ('troubleshooting', 'Troubleshooting', 'Technical issues and bug workarounds', '🔧', 'free', 50),
  ('introductions', 'Introductions', 'Say hello to the community!', '👋', 'free', 60),

  -- PREMIUM SECTIONS (subscribers only)
  ('vip_lounge', 'VIP Lounge', 'Exclusive discussions for premium members', '✨', 'premium', 100),
  ('advanced_spreads', 'Advanced Spreads', 'Complex spread techniques and custom layouts', '🎴', 'premium', 110),
  ('deck_building', 'Deck Building', 'Custom deck creation and card discussions', '🃏', 'premium', 120),
  ('interpretations', 'Deep Interpretations', 'Advanced card meanings and symbolism', '🔮', 'premium', 130),
  ('premium_guides', 'Premium Guides', 'In-depth tutorials and exclusive content', '📚', 'premium', 140),
  ('beta_feedback', 'Beta Feedback', 'Early feature testing and direct dev discussion', '🧪', 'premium', 150)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  access_tier = EXCLUDED.access_tier,
  sort_order = EXCLUDED.sort_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- ACCESS CHECK FUNCTION
-- Returns whether user can access a specific channel
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION can_access_channel(
  p_user_id UUID,
  p_channel_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_channel_tier TEXT;
  v_user_tier TEXT;
BEGIN
  -- Get channel tier requirement
  SELECT access_tier INTO v_channel_tier
  FROM forum_channels
  WHERE id = p_channel_id AND is_active = true;

  -- Channel doesn't exist or inactive
  IF v_channel_tier IS NULL THEN
    RETURN false;
  END IF;

  -- Free channels = everyone can access
  IF v_channel_tier = 'free' THEN
    RETURN true;
  END IF;

  -- Get user's subscription tier
  SELECT COALESCE(subscription_tier, 'free') INTO v_user_tier
  FROM profiles
  WHERE id = p_user_id;

  -- Premium channels require premium or lifetime
  IF v_channel_tier = 'premium' THEN
    RETURN v_user_tier IN ('premium', 'lifetime', 'admin');
  END IF;

  -- Admin channels require admin
  IF v_channel_tier = 'admin' THEN
    RETURN v_user_tier = 'admin';
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- GET ACCESSIBLE CHANNELS
-- Returns all channels a user can access based on their tier
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_accessible_channels(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_tier TEXT;
  v_channels JSONB;
BEGIN
  -- Get user's subscription tier
  SELECT COALESCE(subscription_tier, 'free') INTO v_user_tier
  FROM profiles
  WHERE id = p_user_id;

  -- Build channel list based on tier
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', fc.id,
      'name', fc.name,
      'description', fc.description,
      'icon', fc.icon,
      'access_tier', fc.access_tier,
      'can_access', CASE
        WHEN fc.access_tier = 'free' THEN true
        WHEN fc.access_tier = 'premium' AND v_user_tier IN ('premium', 'lifetime', 'admin') THEN true
        WHEN fc.access_tier = 'admin' AND v_user_tier = 'admin' THEN true
        ELSE false
      END,
      'locked', CASE
        WHEN fc.access_tier = 'free' THEN false
        WHEN fc.access_tier = 'premium' AND v_user_tier IN ('premium', 'lifetime', 'admin') THEN false
        WHEN fc.access_tier = 'admin' AND v_user_tier = 'admin' THEN false
        ELSE true
      END
    )
    ORDER BY fc.sort_order
  ) INTO v_channels
  FROM forum_channels fc
  WHERE fc.is_active = true;

  RETURN jsonb_build_object(
    'user_tier', v_user_tier,
    'channels', COALESCE(v_channels, '[]'::JSONB)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATE RLS POLICIES
-- Restrict post/reply access based on channel tier
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop existing policies (recreate with tier checks)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;

-- Posts: Can only view if you can access the channel
CREATE POLICY "Posts viewable by tier"
  ON community_posts FOR SELECT
  USING (
    is_hidden = false
    AND moderation_status = 'approved'
    AND can_access_channel(auth.uid(), channel_id)
  );

-- Posts: Can only create in channels you have access to
CREATE POLICY "Users can create posts in accessible channels"
  ON community_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND can_access_channel(auth.uid(), channel_id)
  );

-- Replies: Only viewable if you can access the parent post's channel
DROP POLICY IF EXISTS "Replies are viewable by everyone" ON community_replies;
DROP POLICY IF EXISTS "Users can create replies" ON community_replies;

CREATE POLICY "Replies viewable by tier"
  ON community_replies FOR SELECT
  USING (
    is_hidden = false
    AND EXISTS (
      SELECT 1 FROM community_posts cp
      WHERE cp.id = community_replies.post_id
      AND can_access_channel(auth.uid(), cp.channel_id)
    )
  );

CREATE POLICY "Users can reply in accessible channels"
  ON community_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM community_posts cp
      WHERE cp.id = post_id
      AND can_access_channel(auth.uid(), cp.channel_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- CHANNEL STATS VIEW
-- For admin dashboard
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW forum_channel_stats AS
SELECT
  fc.id,
  fc.name,
  fc.access_tier,
  fc.icon,
  fc.sort_order,
  COUNT(DISTINCT cp.id) as post_count,
  COUNT(DISTINCT cr.id) as reply_count,
  MAX(cp.created_at) as last_post_at,
  COUNT(DISTINCT cp.user_id) as unique_posters
FROM forum_channels fc
LEFT JOIN community_posts cp ON cp.channel_id = fc.id AND cp.is_hidden = false
LEFT JOIN community_replies cr ON cr.post_id = cp.id AND cr.is_hidden = false
WHERE fc.is_active = true
GROUP BY fc.id, fc.name, fc.access_tier, fc.icon, fc.sort_order
ORDER BY fc.sort_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS FOR FORUM CHANNELS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE forum_channels ENABLE ROW LEVEL SECURITY;

-- Everyone can see active channels (but access is checked separately)
CREATE POLICY "Channels are viewable by everyone"
  ON forum_channels FOR SELECT
  USING (is_active = true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'Forum access tiers created!';
  RAISE NOTICE 'FREE: general, daily_card, support, faq, troubleshooting, introductions';
  RAISE NOTICE 'PREMIUM: vip_lounge, advanced_spreads, deck_building, interpretations, premium_guides, beta_feedback';
  RAISE NOTICE 'Functions: can_access_channel, get_accessible_channels';
  RAISE NOTICE 'RLS policies updated to enforce tier-based access';
END $$;
