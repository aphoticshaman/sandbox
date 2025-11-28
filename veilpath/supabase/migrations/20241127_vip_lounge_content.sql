-- ═══════════════════════════════════════════════════════════════════════════════
-- VIP Lounge Content & Features
-- Make subscribers feel special with exclusive perks they didn't expect
--
-- Philosophy: Free users mingle with subscribers in main forums
-- VIP Lounge = exclusive club with real value, not just a chat room
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- VIP LOUNGE SUB-CHANNELS
-- Multiple areas within the VIP Lounge for different purposes
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO forum_channels (id, name, description, icon, access_tier, sort_order) VALUES
  -- Main VIP channels (the "wow" factor)
  ('vip_welcome', 'Welcome Lounge', 'Start here! Meet your fellow subscribers', '🏛️', 'premium', 200),
  ('dev_corner', 'Dev Corner', 'Direct access to the developer - Q&A, feedback, sneak peeks', '👨‍💻', 'premium', 201),
  ('monthly_rewards', 'Monthly Rewards', 'Exclusive giveaways, shards, and cosmetics', '🎁', 'premium', 203)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  access_tier = EXCLUDED.access_tier,
  sort_order = EXCLUDED.sort_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- VIP PERKS TABLE
-- Track exclusive subscriber benefits and rewards
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vip_perks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Perk details
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  perk_type TEXT NOT NULL, -- 'monthly_reward', 'exclusive_feature', 'one_time', 'recurring'

  -- Requirements
  min_subscription_months INT DEFAULT 0, -- 0 = available immediately
  required_tier TEXT DEFAULT 'premium', -- 'premium', 'lifetime'

  -- Value
  shard_value INT DEFAULT 0,
  cosmetic_ids JSONB DEFAULT '[]'::JSONB,

  -- Status
  is_active BOOLEAN DEFAULT true,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some juicy perks
INSERT INTO vip_perks (name, description, icon, perk_type, min_subscription_months, shard_value, cosmetic_ids) VALUES
  -- Immediate perks
  ('Welcome Package', 'Thank you for subscribing! Here''s 500 shards and an exclusive card back', '🎁', 'one_time', 0, 500, '["subscriber_exclusive_back"]'),
  ('VIP Badge', 'Show off your subscriber status with an exclusive profile badge', '✨', 'one_time', 0, 0, '["vip_badge"]'),
  ('Priority Support', 'Your bug reports and questions jump to the front of the queue', '🎯', 'exclusive_feature', 0, 0, '[]'),

  -- Monthly perks
  ('Monthly Shards', '200 bonus shards every month just for being a subscriber', '💎', 'monthly_reward', 0, 200, '[]'),
  ('Monthly Cosmetic', 'Exclusive rotating cosmetic item each month', '🎨', 'monthly_reward', 0, 0, '[]'),

  -- Loyalty perks
  ('Loyal Subscriber (3mo)', '3 months strong! Extra 300 shards and exclusive title', '🌟', 'one_time', 3, 300, '["loyal_title_3mo"]'),
  ('Veteran Subscriber (6mo)', '6 months! Exclusive card back and 500 bonus shards', '⭐', 'one_time', 6, 500, '["veteran_back"]'),
  ('Founding Patron (12mo)', '1 year! Legendary status, exclusive everything', '👑', 'one_time', 12, 1000, '["founder_pack"]'),

  -- Special features
  ('Dev Corner Access', 'Direct line to the developer - your voice matters', '👨‍💻', 'exclusive_feature', 0, 0, '[]'),

  -- ANNUAL PASS EXCLUSIVES (only available if you buy annual)
  ('Annual Pass Bundle', 'Exclusive cosmetics only for annual subscribers!', '📜', 'one_time', 0, 1000, '["annual_card_back", "annual_spread_mat", "annual_badge", "annual_title"]'),

  -- LIFETIME EXCLUSIVES (the big flex)
  ('Lifetime Founder Bundle', 'The ultimate collection - exclusive forever', '👑', 'one_time', 0, 5000, '["lifetime_card_back", "lifetime_spread_mat", "lifetime_badge", "lifetime_title", "lifetime_aura", "founder_profile_frame"]');

-- ─────────────────────────────────────────────────────────────────────────────
-- VIP PERK CLAIMS
-- Track which perks users have claimed
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vip_perk_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perk_id UUID NOT NULL REFERENCES vip_perks(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For monthly perks

  -- What was actually given
  shards_granted INT DEFAULT 0,
  cosmetics_granted JSONB DEFAULT '[]'::JSONB,

  UNIQUE(user_id, perk_id, claimed_at) -- Can claim monthly perks multiple times
);

CREATE INDEX IF NOT EXISTS idx_perk_claims_user ON vip_perk_claims(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- READING EXCHANGE SYSTEM
-- Subscribers can request/offer readings to each other
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reading_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who accepted

  -- Request details
  question TEXT NOT NULL,
  spread_preference TEXT, -- 'any', 'celtic_cross', 'three_card', etc.
  urgency TEXT DEFAULT 'whenever', -- 'whenever', 'today', 'this_week'
  additional_context TEXT,

  -- Status
  status TEXT DEFAULT 'open', -- 'open', 'claimed', 'in_progress', 'completed', 'expired'

  -- The reading
  reading_content TEXT,
  card_ids JSONB,
  reader_notes TEXT,

  -- Feedback
  requester_rating INT CHECK (requester_rating >= 1 AND requester_rating <= 5),
  requester_feedback TEXT,
  reader_thanked BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_reading_requests_status ON reading_requests(status);
CREATE INDEX IF NOT EXISTS idx_reading_requests_reader ON reading_requests(reader_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- DEFAULT STICKIED POSTS FOR VIP LOUNGE
-- These create the "wow" moment when subscribers first enter
-- ─────────────────────────────────────────────────────────────────────────────

-- Note: These would be inserted by the app with the admin user ID
-- Here's the structure for reference:

/*
STICKIED POSTS TO CREATE (via admin):

1. vip_welcome channel:
   - "🏛️ Welcome to the VIP Lounge!"
   - Content: What makes this space special, list of perks, how to claim rewards
   - Pin: true

2. dev_corner channel:
   - "👋 Hey! Ask Me Anything"
   - Content: Introduction, what I'm working on, how to give feedback
   - Pin: true

   - "🗳️ Vote: What Feature Should I Build Next?"
   - Content: Poll with current feature ideas, updated monthly
   - Pin: true

   - "🔧 Current Bugs I'm Working On"
   - Content: Transparency on known issues and status
   - Pin: true

3. monthly_rewards channel:
   - "🎁 This Month's Rewards"
   - Content: What's available this month, how to claim
   - Pin: true, updated monthly

   - "🎰 Monthly Giveaway"
   - Content: Entry thread for exclusive cosmetic giveaway
   - Pin: true
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Claim a perk
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION claim_vip_perk(
  p_user_id UUID,
  p_perk_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_perk RECORD;
  v_user_tier TEXT;
  v_sub_months INT;
  v_already_claimed BOOLEAN;
BEGIN
  -- Get perk details
  SELECT * INTO v_perk FROM vip_perks WHERE id = p_perk_id AND is_active = true;

  IF v_perk IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perk not found or inactive');
  END IF;

  -- Get user subscription info
  SELECT subscription_tier INTO v_user_tier FROM profiles WHERE id = p_user_id;

  IF v_user_tier NOT IN ('premium', 'lifetime') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Premium subscription required');
  END IF;

  -- Check subscription duration requirement
  SELECT EXTRACT(MONTH FROM AGE(NOW(), started_at))::INT INTO v_sub_months
  FROM subscriptions WHERE user_id = p_user_id AND status = 'active'
  ORDER BY started_at ASC LIMIT 1;

  IF COALESCE(v_sub_months, 0) < v_perk.min_subscription_months THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Need ' || v_perk.min_subscription_months || ' months subscribed',
      'current_months', COALESCE(v_sub_months, 0)
    );
  END IF;

  -- Check if already claimed (for one-time perks)
  IF v_perk.perk_type = 'one_time' THEN
    SELECT EXISTS(
      SELECT 1 FROM vip_perk_claims
      WHERE user_id = p_user_id AND perk_id = p_perk_id
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
      RETURN jsonb_build_object('success', false, 'error', 'Already claimed');
    END IF;
  END IF;

  -- Check if monthly perk already claimed this month
  IF v_perk.perk_type = 'monthly_reward' THEN
    SELECT EXISTS(
      SELECT 1 FROM vip_perk_claims
      WHERE user_id = p_user_id
        AND perk_id = p_perk_id
        AND DATE_TRUNC('month', claimed_at) = DATE_TRUNC('month', NOW())
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
      RETURN jsonb_build_object('success', false, 'error', 'Already claimed this month');
    END IF;
  END IF;

  -- Claim the perk!
  INSERT INTO vip_perk_claims (user_id, perk_id, shards_granted, cosmetics_granted)
  VALUES (p_user_id, p_perk_id, v_perk.shard_value, v_perk.cosmetic_ids);

  -- Grant shards if any
  IF v_perk.shard_value > 0 THEN
    UPDATE profiles
    SET shards = COALESCE(shards, 0) + v_perk.shard_value
    WHERE id = p_user_id;
  END IF;

  -- Grant cosmetics would be handled by app logic

  RETURN jsonb_build_object(
    'success', true,
    'perk_name', v_perk.name,
    'shards_granted', v_perk.shard_value,
    'cosmetics_granted', v_perk.cosmetic_ids
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Get user's available perks
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_vip_perks(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_tier TEXT;
  v_sub_months INT;
  v_perks JSONB;
BEGIN
  -- Get user subscription info
  SELECT subscription_tier INTO v_user_tier FROM profiles WHERE id = p_user_id;

  IF v_user_tier NOT IN ('premium', 'lifetime') THEN
    RETURN jsonb_build_object('is_subscriber', false, 'perks', '[]'::JSONB);
  END IF;

  -- Get subscription duration
  SELECT EXTRACT(MONTH FROM AGE(NOW(), started_at))::INT INTO v_sub_months
  FROM subscriptions WHERE user_id = p_user_id AND status = 'active'
  ORDER BY started_at ASC LIMIT 1;

  -- Get all perks with claim status
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'description', p.description,
      'icon', p.icon,
      'perk_type', p.perk_type,
      'shard_value', p.shard_value,
      'min_months', p.min_subscription_months,
      'can_claim', CASE
        WHEN p.min_subscription_months > COALESCE(v_sub_months, 0) THEN false
        WHEN p.perk_type = 'one_time' AND EXISTS(
          SELECT 1 FROM vip_perk_claims WHERE user_id = p_user_id AND perk_id = p.id
        ) THEN false
        WHEN p.perk_type = 'monthly_reward' AND EXISTS(
          SELECT 1 FROM vip_perk_claims
          WHERE user_id = p_user_id AND perk_id = p.id
          AND DATE_TRUNC('month', claimed_at) = DATE_TRUNC('month', NOW())
        ) THEN false
        ELSE true
      END,
      'claimed', CASE
        WHEN p.perk_type = 'one_time' THEN EXISTS(
          SELECT 1 FROM vip_perk_claims WHERE user_id = p_user_id AND perk_id = p.id
        )
        ELSE false
      END,
      'last_claimed', (
        SELECT MAX(claimed_at) FROM vip_perk_claims WHERE user_id = p_user_id AND perk_id = p.id
      )
    )
  ) INTO v_perks
  FROM vip_perks p
  WHERE p.is_active = true;

  RETURN jsonb_build_object(
    'is_subscriber', true,
    'subscription_months', COALESCE(v_sub_months, 0),
    'tier', v_user_tier,
    'perks', COALESCE(v_perks, '[]'::JSONB)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE vip_perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_perk_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_requests ENABLE ROW LEVEL SECURITY;

-- Perks visible to subscribers
CREATE POLICY "Perks visible to subscribers"
  ON vip_perks FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND subscription_tier IN ('premium', 'lifetime')
    )
  );

-- Claims viewable by owner
CREATE POLICY "Users can view own claims"
  ON vip_perk_claims FOR SELECT
  USING (auth.uid() = user_id);

-- Reading requests viewable by subscribers
CREATE POLICY "Reading requests visible to subscribers"
  ON reading_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND subscription_tier IN ('premium', 'lifetime')
    )
  );

-- Users can create reading requests
CREATE POLICY "Subscribers can create reading requests"
  ON reading_requests FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND subscription_tier IN ('premium', 'lifetime')
    )
  );

-- Users can update their own requests or claimed readings
CREATE POLICY "Users can update own requests or claimed readings"
  ON reading_requests FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = reader_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'VIP Lounge content created!';
  RAISE NOTICE '';
  RAISE NOTICE 'VIP Sub-Channels:';
  RAISE NOTICE '  - vip_welcome: Welcome Lounge';
  RAISE NOTICE '  - dev_corner: Direct dev access';
  RAISE NOTICE '  - monthly_rewards: Exclusive giveaways';
  RAISE NOTICE '';
  RAISE NOTICE 'Perks System:';
  RAISE NOTICE '  - Welcome package, monthly shards, loyalty rewards';
  RAISE NOTICE '  - Annual Pass: 1000 shards + exclusive card back, mat, badge, title';
  RAISE NOTICE '  - Lifetime: 5000 shards + full exclusive collection + founder frame';
END $$;
