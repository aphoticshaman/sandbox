-- ═══════════════════════════════════════════════════════════════════════════════
-- Bug Reports Table
-- Direct bug reports from users - goes straight to Ryan's dashboard
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  screen_name TEXT,
  device_info JSONB,
  console_logs JSONB,
  user_level INT,
  subscription_tier TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'seen', 'investigating', 'fixed', 'wontfix'
  notes TEXT, -- Admin notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Index for quick filtering
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id);

-- RLS Policies
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own bug reports
CREATE POLICY "Users can insert bug reports"
  ON bug_reports FOR INSERT
  WITH CHECK (true);

-- Users can view their own bug reports
CREATE POLICY "Users can view own bug reports"
  ON bug_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Admin view for Ryan (you'll need to set up admin role)
-- For now, we'll use a service role key to access all reports

-- Helpful view for the admin dashboard
CREATE OR REPLACE VIEW bug_reports_summary AS
SELECT
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM bug_reports
GROUP BY status;

-- Function to mark a bug as seen
CREATE OR REPLACE FUNCTION mark_bug_seen(bug_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE bug_reports
  SET status = 'seen', updated_at = NOW()
  WHERE id = bug_id AND status = 'new';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update bug status
CREATE OR REPLACE FUNCTION update_bug_status(bug_id UUID, new_status TEXT, admin_notes TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  UPDATE bug_reports
  SET
    status = new_status,
    notes = COALESCE(admin_notes, notes),
    updated_at = NOW()
  WHERE id = bug_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
