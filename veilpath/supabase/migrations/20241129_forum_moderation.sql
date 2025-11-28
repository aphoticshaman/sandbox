-- ═══════════════════════════════════════════════════════════════════════════════
-- VeilPath Forum Moderation System
-- Incremental warning/strike system with automatic escalation
--
-- STRIKE SYSTEM:
-- 1st Strike: Warning + post deleted + recorded
-- 2nd Strike: Warning + post deleted + 48hr suspension
-- 3rd Strike: Permanent forum ban (no appeals - solo dev, sorry)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- USER MODERATION STATUS
-- Tracks warnings, bans, and suspension status
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_moderation_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Strike count (0-3)
  strike_count INTEGER DEFAULT 0 NOT NULL CHECK (strike_count >= 0 AND strike_count <= 3),

  -- Ban status
  is_permanently_banned BOOLEAN DEFAULT false NOT NULL,
  permanently_banned_at TIMESTAMPTZ,
  permanent_ban_reason TEXT,

  -- Temporary suspension
  is_suspended BOOLEAN DEFAULT false NOT NULL,
  suspension_ends_at TIMESTAMPTZ,
  suspension_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_warning_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_banned ON user_moderation_status(is_permanently_banned) WHERE is_permanently_banned = true;
CREATE INDEX IF NOT EXISTS idx_moderation_suspended ON user_moderation_status(is_suspended, suspension_ends_at) WHERE is_suspended = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- MODERATION LOG
-- Records all moderation actions for audit trail
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who received the action
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What happened
  action_type TEXT NOT NULL, -- 'warning', 'suspension', 'permanent_ban', 'post_deleted'
  strike_number INTEGER, -- Which strike this was (1, 2, or 3)

  -- Context
  reason TEXT NOT NULL, -- Why action was taken
  reason_category TEXT, -- 'harassment', 'hate_speech', 'spam', 'inappropriate', 'other'

  -- Related content (if applicable)
  related_post_id UUID,
  related_comment_id UUID,
  deleted_content_preview TEXT, -- First 200 chars of deleted content (for records)

  -- Who took action (null = system/automated)
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderator_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_modlog_user ON moderation_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modlog_action ON moderation_log(action_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- REPORTED CONTENT
-- Community reports queue for review
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reported_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who reported
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What was reported
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'post', 'comment', 'profile'
  content_id UUID NOT NULL,
  content_preview TEXT, -- Snapshot of reported content

  -- Report details
  reason TEXT NOT NULL, -- 'harassment', 'hate_speech', 'spam', 'inappropriate', 'impersonation', 'other'
  additional_context TEXT,

  -- Status
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'reviewed', 'actioned', 'dismissed'
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  action_taken TEXT, -- What was done

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Prevent duplicate reports
  UNIQUE(reporter_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_pending ON reported_content(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reports_user ON reported_content(reported_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

/**
 * Issue a warning/strike to a user
 * Automatically escalates based on strike count:
 * - Strike 1: Warning only
 * - Strike 2: Warning + 48hr suspension
 * - Strike 3: Permanent ban
 */
CREATE OR REPLACE FUNCTION issue_strike(
  p_user_id UUID,
  p_reason TEXT,
  p_reason_category TEXT DEFAULT 'other',
  p_related_post_id UUID DEFAULT NULL,
  p_related_comment_id UUID DEFAULT NULL,
  p_deleted_content_preview TEXT DEFAULT NULL,
  p_moderator_id UUID DEFAULT NULL,
  p_moderator_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_strikes INTEGER;
  v_new_strikes INTEGER;
  v_result JSONB;
  v_action_type TEXT;
BEGIN
  -- Get or create moderation status
  INSERT INTO user_moderation_status (user_id, strike_count)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current strike count
  SELECT strike_count INTO v_current_strikes
  FROM user_moderation_status
  WHERE user_id = p_user_id;

  -- Check if already permanently banned
  IF EXISTS (SELECT 1 FROM user_moderation_status WHERE user_id = p_user_id AND is_permanently_banned = true) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is already permanently banned'
    );
  END IF;

  -- Calculate new strike count
  v_new_strikes := v_current_strikes + 1;

  -- Apply appropriate action based on strike count
  CASE v_new_strikes
    WHEN 1 THEN
      -- First strike: Warning only
      v_action_type := 'warning';
      UPDATE user_moderation_status
      SET strike_count = v_new_strikes,
          last_warning_at = NOW(),
          updated_at = NOW()
      WHERE user_id = p_user_id;

      v_result := jsonb_build_object(
        'success', true,
        'strike_number', 1,
        'action', 'warning',
        'message', 'First warning issued. Post deleted. User notified.'
      );

    WHEN 2 THEN
      -- Second strike: Warning + 48hr suspension
      v_action_type := 'suspension';
      UPDATE user_moderation_status
      SET strike_count = v_new_strikes,
          is_suspended = true,
          suspension_ends_at = NOW() + INTERVAL '48 hours',
          suspension_reason = p_reason,
          last_warning_at = NOW(),
          updated_at = NOW()
      WHERE user_id = p_user_id;

      v_result := jsonb_build_object(
        'success', true,
        'strike_number', 2,
        'action', 'suspension',
        'suspension_hours', 48,
        'suspension_ends_at', (NOW() + INTERVAL '48 hours')::TEXT,
        'message', 'Second warning issued. Post deleted. User suspended for 48 hours.'
      );

    ELSE
      -- Third strike (or more): Permanent ban
      v_action_type := 'permanent_ban';
      UPDATE user_moderation_status
      SET strike_count = 3,
          is_permanently_banned = true,
          permanently_banned_at = NOW(),
          permanent_ban_reason = p_reason,
          is_suspended = false,
          suspension_ends_at = NULL,
          updated_at = NOW()
      WHERE user_id = p_user_id;

      v_result := jsonb_build_object(
        'success', true,
        'strike_number', 3,
        'action', 'permanent_ban',
        'message', 'Third strike. User permanently banned from forums. No appeals.'
      );
  END CASE;

  -- Log the moderation action
  INSERT INTO moderation_log (
    user_id,
    action_type,
    strike_number,
    reason,
    reason_category,
    related_post_id,
    related_comment_id,
    deleted_content_preview,
    moderator_id,
    moderator_notes
  ) VALUES (
    p_user_id,
    v_action_type,
    v_new_strikes,
    p_reason,
    p_reason_category,
    p_related_post_id,
    p_related_comment_id,
    p_deleted_content_preview,
    p_moderator_id,
    p_moderator_notes
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Check if user can access forums
 * Returns access status and any restrictions
 */
CREATE OR REPLACE FUNCTION check_forum_access(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_status RECORD;
BEGIN
  -- Get user's moderation status
  SELECT * INTO v_status
  FROM user_moderation_status
  WHERE user_id = p_user_id;

  -- No record = no restrictions
  IF v_status IS NULL THEN
    RETURN jsonb_build_object(
      'can_read', true,
      'can_write', true,
      'strike_count', 0,
      'restrictions', ARRAY[]::TEXT[]
    );
  END IF;

  -- Permanently banned = no access at all
  IF v_status.is_permanently_banned THEN
    RETURN jsonb_build_object(
      'can_read', false,
      'can_write', false,
      'strike_count', v_status.strike_count,
      'is_banned', true,
      'banned_at', v_status.permanently_banned_at,
      'ban_reason', v_status.permanent_ban_reason,
      'restrictions', ARRAY['read', 'write']
    );
  END IF;

  -- Check active suspension
  IF v_status.is_suspended AND v_status.suspension_ends_at > NOW() THEN
    RETURN jsonb_build_object(
      'can_read', true,
      'can_write', false,
      'strike_count', v_status.strike_count,
      'is_suspended', true,
      'suspension_ends_at', v_status.suspension_ends_at,
      'suspension_reason', v_status.suspension_reason,
      'restrictions', ARRAY['write']
    );
  END IF;

  -- Clear expired suspension if needed
  IF v_status.is_suspended AND v_status.suspension_ends_at <= NOW() THEN
    UPDATE user_moderation_status
    SET is_suspended = false,
        suspension_ends_at = NULL,
        suspension_reason = NULL,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- No active restrictions
  RETURN jsonb_build_object(
    'can_read', true,
    'can_write', true,
    'strike_count', v_status.strike_count,
    'restrictions', ARRAY[]::TEXT[]
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get user's moderation history (for profile/settings)
 */
CREATE OR REPLACE FUNCTION get_moderation_history(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_status RECORD;
  v_warnings JSONB;
BEGIN
  -- Get current status
  SELECT * INTO v_status
  FROM user_moderation_status
  WHERE user_id = p_user_id;

  -- Get warning history
  SELECT jsonb_agg(
    jsonb_build_object(
      'strike_number', strike_number,
      'reason', reason,
      'reason_category', reason_category,
      'action_type', action_type,
      'created_at', created_at
    )
    ORDER BY created_at DESC
  ) INTO v_warnings
  FROM moderation_log
  WHERE user_id = p_user_id
    AND action_type IN ('warning', 'suspension', 'permanent_ban');

  RETURN jsonb_build_object(
    'strike_count', COALESCE(v_status.strike_count, 0),
    'is_banned', COALESCE(v_status.is_permanently_banned, false),
    'is_suspended', COALESCE(v_status.is_suspended, false),
    'suspension_ends_at', v_status.suspension_ends_at,
    'warnings', COALESCE(v_warnings, '[]'::JSONB)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE user_moderation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_content ENABLE ROW LEVEL SECURITY;

-- Users can view their own moderation status
CREATE POLICY "Users can view own moderation status"
  ON user_moderation_status FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own moderation history
CREATE POLICY "Users can view own moderation log"
  ON moderation_log FOR SELECT
  USING (auth.uid() = user_id);

-- Users can submit reports
CREATE POLICY "Users can submit reports"
  ON reported_content FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own submitted reports
CREATE POLICY "Users can view own reports"
  ON reported_content FOR SELECT
  USING (auth.uid() = reporter_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- GRANTS
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT ON user_moderation_status TO authenticated;
GRANT SELECT ON moderation_log TO authenticated;
GRANT SELECT, INSERT ON reported_content TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- STRIKE DECAY SYSTEM
-- Users with 1-2 strikes get 1 strike reduced every 60 days of clean behavior
-- Strike 3 (permanent ban) never decays
-- ─────────────────────────────────────────────────────────────────────────────

/**
 * Decay strikes for users who've been clean for 60+ days
 * Run this daily via cron job or scheduled function
 * Only reduces strikes for users NOT permanently banned
 */
CREATE OR REPLACE FUNCTION decay_strikes()
RETURNS TABLE(user_id UUID, old_strikes INTEGER, new_strikes INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH decayed AS (
    UPDATE user_moderation_status
    SET
      strike_count = strike_count - 1,
      updated_at = NOW()
    WHERE
      -- Only decay if user has 1-2 strikes (not banned)
      strike_count > 0
      AND strike_count < 3
      AND is_permanently_banned = false
      -- Last warning was 60+ days ago
      AND last_warning_at IS NOT NULL
      AND last_warning_at < NOW() - INTERVAL '60 days'
      -- Hasn't had a strike decayed recently (prevent double decay)
      AND (updated_at IS NULL OR updated_at < NOW() - INTERVAL '60 days')
    RETURNING
      user_moderation_status.user_id,
      strike_count + 1 AS old_strikes, -- +1 because we just decremented
      strike_count AS new_strikes
  )
  SELECT * FROM decayed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Log strike decay events (for audit trail)
 * Call this after decay_strikes()
 */
CREATE OR REPLACE FUNCTION log_strike_decay(p_user_id UUID, p_old_strikes INTEGER, p_new_strikes INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO moderation_log (
    user_id,
    action_type,
    strike_number,
    reason,
    reason_category,
    moderator_notes
  ) VALUES (
    p_user_id,
    'strike_decay',
    p_new_strikes,
    'Strike automatically reduced due to 60 days of clean behavior',
    'system',
    'Previous strike count: ' || p_old_strikes || ', New strike count: ' || p_new_strikes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- IMMUTABLE AUDIT TRAIL
-- Moderation logs cannot be modified or deleted (except by direct DB admin)
-- ─────────────────────────────────────────────────────────────────────────────

-- Prevent updates to moderation_log (immutable audit trail)
CREATE OR REPLACE FUNCTION prevent_modlog_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Moderation log entries are immutable and cannot be modified';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_modlog_update ON moderation_log;
CREATE TRIGGER trigger_prevent_modlog_update
BEFORE UPDATE ON moderation_log
FOR EACH ROW EXECUTE FUNCTION prevent_modlog_update();

-- Prevent deletes to moderation_log (immutable audit trail)
CREATE OR REPLACE FUNCTION prevent_modlog_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Moderation log entries are immutable and cannot be deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_modlog_delete ON moderation_log;
CREATE TRIGGER trigger_prevent_modlog_delete
BEFORE DELETE ON moderation_log
FOR EACH ROW EXECUTE FUNCTION prevent_modlog_delete();

-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN DETAIL VIEW
-- Full 5Ws+H for admin review (who, what, when, where, why, how)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_moderation_details_admin(p_log_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_log RECORD;
  v_user RECORD;
BEGIN
  -- Get the log entry
  SELECT * INTO v_log FROM moderation_log WHERE id = p_log_id;

  IF v_log IS NULL THEN
    RETURN jsonb_build_object('error', 'Log entry not found');
  END IF;

  -- Get user details
  SELECT
    up.username,
    up.display_name,
    au.email,
    au.created_at as account_created
  INTO v_user
  FROM user_profiles up
  JOIN auth.users au ON up.user_id = au.id
  WHERE up.user_id = v_log.user_id;

  RETURN jsonb_build_object(
    -- WHO
    'who', jsonb_build_object(
      'user_id', v_log.user_id,
      'username', v_user.username,
      'display_name', v_user.display_name,
      'email', v_user.email,
      'account_age_days', EXTRACT(DAY FROM NOW() - v_user.account_created)::INTEGER
    ),
    -- WHAT
    'what', jsonb_build_object(
      'action_type', v_log.action_type,
      'strike_number', v_log.strike_number,
      'deleted_content', v_log.deleted_content_preview,
      'related_post_id', v_log.related_post_id,
      'related_comment_id', v_log.related_comment_id
    ),
    -- WHEN
    'when', jsonb_build_object(
      'timestamp', v_log.created_at,
      'timestamp_readable', to_char(v_log.created_at, 'YYYY-MM-DD HH24:MI:SS TZ')
    ),
    -- WHERE (context)
    'where', jsonb_build_object(
      'content_type', CASE
        WHEN v_log.related_comment_id IS NOT NULL THEN 'comment'
        WHEN v_log.related_post_id IS NOT NULL THEN 'post'
        ELSE 'unknown'
      END
    ),
    -- WHY
    'why', jsonb_build_object(
      'reason', v_log.reason,
      'reason_category', v_log.reason_category
    ),
    -- HOW
    'how', jsonb_build_object(
      'moderator_id', v_log.moderator_id,
      'moderator_notes', v_log.moderator_notes,
      'automated', v_log.moderator_id IS NULL
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get all moderation history for a user (admin view)
 */
CREATE OR REPLACE FUNCTION get_user_full_moderation_history_admin(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_status RECORD;
  v_logs JSONB;
BEGIN
  -- Get current status
  SELECT * INTO v_status FROM user_moderation_status WHERE user_id = p_user_id;

  -- Get full log history (never expires, immutable)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'action_type', action_type,
      'strike_number', strike_number,
      'reason', reason,
      'reason_category', reason_category,
      'deleted_content_preview', deleted_content_preview,
      'moderator_id', moderator_id,
      'moderator_notes', moderator_notes,
      'created_at', created_at
    )
    ORDER BY created_at DESC
  ) INTO v_logs
  FROM moderation_log
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'current_status', jsonb_build_object(
      'strike_count', COALESCE(v_status.strike_count, 0),
      'is_banned', COALESCE(v_status.is_permanently_banned, false),
      'banned_at', v_status.permanently_banned_at,
      'ban_reason', v_status.permanent_ban_reason,
      'is_suspended', COALESCE(v_status.is_suspended, false),
      'suspension_ends_at', v_status.suspension_ends_at,
      'last_warning_at', v_status.last_warning_at
    ),
    'full_history', COALESCE(v_logs, '[]'::JSONB),
    'total_actions', (SELECT COUNT(*) FROM moderation_log WHERE user_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'Forum moderation system created!';
  RAISE NOTICE 'Strike system: 1=warning, 2=48hr suspension, 3=permanent ban';
  RAISE NOTICE 'Strike decay: -1 strike every 60 days of clean behavior (excludes bans)';
  RAISE NOTICE 'Audit trail: Immutable - no updates or deletes allowed';
  RAISE NOTICE 'Tables: user_moderation_status, moderation_log, reported_content';
  RAISE NOTICE 'Functions: issue_strike, check_forum_access, get_moderation_history';
  RAISE NOTICE 'Admin functions: get_moderation_details_admin, get_user_full_moderation_history_admin';
  RAISE NOTICE 'Scheduled: decay_strikes (run daily via cron)';
END $$;
