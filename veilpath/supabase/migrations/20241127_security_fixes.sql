-- ═══════════════════════════════════════════════════════════════════════════════
-- Security Fixes for Supabase Linter Warnings
-- SIMPLIFIED: Just drop problematic views and enable RLS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DROP VIEWS THAT EXPOSE AUTH.USERS OR HAVE SECURITY DEFINER
-- We'll recreate them properly later if needed
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS user_display_titles CASCADE;
DROP VIEW IF EXISTS forum_channel_stats CASCADE;
DROP VIEW IF EXISTS beta_code_stats CASCADE;
DROP VIEW IF EXISTS current_art_contest CASCADE;
DROP VIEW IF EXISTS bug_reports_summary CASCADE;
DROP VIEW IF EXISTS admin_active_subscribers CASCADE;
DROP VIEW IF EXISTS admin_fraud_cases CASCADE;
DROP VIEW IF EXISTS admin_pending_refunds CASCADE;
DROP VIEW IF EXISTS suspicious_activity CASCADE;
DROP VIEW IF EXISTS admin_revenue_summary CASCADE;
DROP VIEW IF EXISTS admin_recent_transactions CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ENABLE RLS ON TABLES THAT NEED IT
-- ─────────────────────────────────────────────────────────────────────────────

-- bonus_audit_log
ALTER TABLE IF EXISTS bonus_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access to bonus_audit_log" ON bonus_audit_log;
CREATE POLICY "Service role full access to bonus_audit_log"
  ON bonus_audit_log FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- constellation_participants
ALTER TABLE IF EXISTS constellation_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own constellation participation" ON constellation_participants;
CREATE POLICY "Users can view own constellation participation"
  ON constellation_participants FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access to constellation_participants" ON constellation_participants;
CREATE POLICY "Service role full access to constellation_participants"
  ON constellation_participants FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- constellation_cron_runs
ALTER TABLE IF EXISTS constellation_cron_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access to constellation_cron_runs" ON constellation_cron_runs;
CREATE POLICY "Service role full access to constellation_cron_runs"
  ON constellation_cron_runs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- art_contest_schedule
ALTER TABLE IF EXISTS art_contest_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view art contest schedule" ON art_contest_schedule;
CREATE POLICY "Anyone can view art contest schedule"
  ON art_contest_schedule FOR SELECT
  USING (true);
DROP POLICY IF EXISTS "Service role can manage art contests" ON art_contest_schedule;
CREATE POLICY "Service role can manage art contests"
  ON art_contest_schedule FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- constellation_state
ALTER TABLE IF EXISTS constellation_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view constellation state" ON constellation_state;
CREATE POLICY "Anyone can view constellation state"
  ON constellation_state FOR SELECT
  USING (true);
DROP POLICY IF EXISTS "Service role can manage constellation state" ON constellation_state;
CREATE POLICY "Service role can manage constellation state"
  ON constellation_state FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- constellation_stars
ALTER TABLE IF EXISTS constellation_stars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view constellation stars" ON constellation_stars;
CREATE POLICY "Anyone can view constellation stars"
  ON constellation_stars FOR SELECT
  USING (true);
DROP POLICY IF EXISTS "Service role can manage constellation stars" ON constellation_stars;
CREATE POLICY "Service role can manage constellation stars"
  ON constellation_stars FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- content_reports
ALTER TABLE IF EXISTS content_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
CREATE POLICY "Users can view own reports"
  ON content_reports FOR SELECT
  USING (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Service role full access to content_reports" ON content_reports;
CREATE POLICY "Service role full access to content_reports"
  ON content_reports FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- user_community_stats
ALTER TABLE IF EXISTS user_community_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view community stats" ON user_community_stats;
CREATE POLICY "Anyone can view community stats"
  ON user_community_stats FOR SELECT
  USING (true);
DROP POLICY IF EXISTS "Users can update own stats" ON user_community_stats;
CREATE POLICY "Users can update own stats"
  ON user_community_stats FOR UPDATE
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access to user_community_stats" ON user_community_stats;
CREATE POLICY "Service role full access to user_community_stats"
  ON user_community_stats FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'Security fixes applied!';
  RAISE NOTICE '  - Dropped 11 problematic views';
  RAISE NOTICE '  - Enabled RLS on 8 tables';
END $$;
