-- Email Preferences for Mailing Lists
-- Uses Resend Audiences for: promos, events, contests, updates, community

-- Email preference categories
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  -- Subscription categories (default opt-in for key updates)
  promos BOOLEAN DEFAULT false,           -- Sales, discounts, special offers
  events BOOLEAN DEFAULT false,           -- Live events, streams, gatherings
  contests BOOLEAN DEFAULT false,         -- Giveaways, competitions
  updates BOOLEAN DEFAULT true,           -- Patch notes, new features (important!)
  community BOOLEAN DEFAULT false,        -- Community highlights, user stories

  -- Resend audience tracking
  resend_contact_id TEXT,                 -- Resend contact ID for API sync

  -- Metadata
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_all_at TIMESTAMPTZ,        -- If they unsubscribe from everything

  UNIQUE(user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_email_preferences_user ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON email_preferences(email);

-- RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own preferences
CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences"
  ON email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-create email preferences on user signup
CREATE OR REPLACE FUNCTION create_email_preferences_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created_email_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_email_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_email_preferences_on_signup();

-- Email send log for tracking what we've sent
CREATE TABLE IF NOT EXISTS email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,                 -- promos, events, contests, updates, community
  subject TEXT NOT NULL,
  resend_message_id TEXT,                 -- Resend message ID
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_send_log_user ON email_send_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_send_log_category ON email_send_log(category);

-- RLS for email log (admin only, users can see their own)
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email history"
  ON email_send_log FOR SELECT
  USING (auth.uid() = user_id);
