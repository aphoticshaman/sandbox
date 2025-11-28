-- ═══════════════════════════════════════════════════════════════════════════════
-- Purchase Transactions & Admin Records
--
-- Your own transaction records - NOT encrypted, accessible to admin
-- Required for: refunds, fraud investigation, legal/police requests, audits
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- MAIN TRANSACTIONS TABLE
-- Every purchase goes here, linked to Stripe/RevenueCat but stored locally
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS purchase_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User info (non-encrypted, admin visible)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT,
  email TEXT, -- Captured at time of purchase
  user_ip TEXT, -- For fraud detection

  -- Product info
  product_type TEXT NOT NULL, -- 'subscription', 'shards', 'one_time'
  product_id TEXT NOT NULL, -- e.g., 'shard_1000', 'veilpath_premium_monthly'
  product_name TEXT NOT NULL,
  quantity INT DEFAULT 1,

  -- Money
  amount_cents INT NOT NULL, -- Store in cents to avoid float issues
  currency TEXT DEFAULT 'USD',
  original_amount_cents INT, -- Before discounts
  discount_code TEXT,
  discount_amount_cents INT DEFAULT 0,

  -- Payment provider info
  provider TEXT NOT NULL, -- 'stripe', 'revenuecat', 'apple', 'google'
  provider_transaction_id TEXT, -- Stripe payment_intent, RevenueCat transaction
  provider_customer_id TEXT, -- Stripe customer ID
  provider_subscription_id TEXT, -- For recurring subscriptions
  provider_receipt TEXT, -- Full receipt data (JSON)

  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded', 'disputed', 'chargeback'
  status_reason TEXT, -- Why status changed (e.g., "User requested refund")

  -- Delivery tracking (did they get what they paid for?)
  delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  delivery_details JSONB, -- What was granted: { shards: 1150, items: [...] }

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Admin fields
  admin_notes TEXT,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ
);

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_transactions_user ON purchase_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_email ON purchase_transactions(email);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON purchase_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON purchase_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON purchase_transactions(provider, provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_flagged ON purchase_transactions(flagged_for_review) WHERE flagged_for_review = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUBSCRIPTION RECORDS
-- Active/past subscriptions with billing history
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,

  -- Subscription info
  product_id TEXT NOT NULL, -- 'veilpath_premium_monthly', etc.
  tier TEXT NOT NULL, -- 'premium', 'lifetime'
  status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'past_due'

  -- Provider info
  provider TEXT NOT NULL,
  provider_subscription_id TEXT,
  provider_customer_id TEXT,

  -- Billing
  amount_cents INT,
  currency TEXT DEFAULT 'USD',
  billing_interval TEXT, -- 'month', 'year', 'lifetime'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Lifecycle
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  expires_at TIMESTAMPTZ, -- When access ends (null for lifetime)

  -- Stats
  total_paid_cents INT DEFAULT 0,
  payment_count INT DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,

  CONSTRAINT unique_active_sub UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- REFUND REQUESTS
-- Track all refund requests and their resolution
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES purchase_transactions(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Request details
  reason TEXT NOT NULL, -- User's stated reason
  reason_category TEXT, -- 'not_as_described', 'accidental', 'fraud', 'other'
  amount_cents INT NOT NULL, -- Amount requested

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'processed'
  decision_reason TEXT, -- Why approved/denied
  decided_by TEXT, -- Admin username
  decided_at TIMESTAMPTZ,

  -- Processing
  refund_provider_id TEXT, -- Stripe refund ID
  refund_processed_at TIMESTAMPTZ,
  partial_refund BOOLEAN DEFAULT FALSE,
  refund_amount_cents INT, -- Actual amount refunded (may differ from requested)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refunds_transaction ON refund_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refunds_user ON refund_requests(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FRAUD FLAGS & SUSPICIOUS ACTIVITY
-- Track potential fraud for investigation
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES purchase_transactions(id),

  -- Flag info
  flag_type TEXT NOT NULL, -- 'chargeback', 'velocity', 'stolen_card', 'multiple_accounts', 'refund_abuse', 'suspicious_ip'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,

  -- Evidence
  evidence JSONB, -- { ip_addresses: [...], email_variations: [...], card_fingerprints: [...] }

  -- Resolution
  status TEXT DEFAULT 'open', -- 'open', 'investigating', 'confirmed_fraud', 'false_positive', 'resolved'
  resolution_notes TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,

  -- Actions taken
  user_banned BOOLEAN DEFAULT FALSE,
  refund_reversed BOOLEAN DEFAULT FALSE,
  reported_to_provider BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_status ON fraud_flags(status);
CREATE INDEX IF NOT EXISTS idx_fraud_severity ON fraud_flags(severity);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADMIN AUDIT LOG
-- Track all admin actions on transactions
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  admin_email TEXT,

  -- What was done
  action TEXT NOT NULL, -- 'view_transaction', 'process_refund', 'flag_fraud', 'ban_user', 'export_data'
  target_type TEXT, -- 'transaction', 'user', 'refund', 'subscription'
  target_id UUID,

  -- Context
  details JSONB, -- Action-specific details
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Record a new transaction (called from app after payment)
CREATE OR REPLACE FUNCTION record_transaction(
  p_user_id UUID,
  p_email TEXT,
  p_product_type TEXT,
  p_product_id TEXT,
  p_product_name TEXT,
  p_amount_cents INT,
  p_provider TEXT,
  p_provider_transaction_id TEXT,
  p_user_ip TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_username TEXT;
BEGIN
  -- Get username
  SELECT display_name INTO v_username FROM profiles WHERE id = p_user_id;

  INSERT INTO purchase_transactions (
    user_id, username, email, user_ip,
    product_type, product_id, product_name,
    amount_cents, provider, provider_transaction_id,
    status
  ) VALUES (
    p_user_id, v_username, p_email, p_user_ip,
    p_product_type, p_product_id, p_product_name,
    p_amount_cents, p_provider, p_provider_transaction_id,
    'pending'
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete a transaction (delivery confirmed)
CREATE OR REPLACE FUNCTION complete_transaction(
  p_transaction_id UUID,
  p_delivery_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE purchase_transactions
  SET
    status = 'completed',
    delivered = TRUE,
    delivered_at = NOW(),
    delivery_details = p_delivery_details,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process a refund
CREATE OR REPLACE FUNCTION process_refund(
  p_transaction_id UUID,
  p_reason TEXT,
  p_admin_email TEXT,
  p_refund_provider_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update transaction
  UPDATE purchase_transactions
  SET
    status = 'refunded',
    status_reason = p_reason,
    admin_notes = COALESCE(admin_notes, '') || E'\n[Refunded by ' || p_admin_email || ' at ' || NOW()::TEXT || ']',
    updated_at = NOW()
  WHERE id = p_transaction_id;

  -- Update refund request if exists
  UPDATE refund_requests
  SET
    status = 'processed',
    refund_provider_id = p_refund_provider_id,
    refund_processed_at = NOW(),
    updated_at = NOW()
  WHERE transaction_id = p_transaction_id AND status IN ('pending', 'approved');

  -- Log admin action
  INSERT INTO admin_audit_log (admin_email, action, target_type, target_id, details)
  VALUES (p_admin_email, 'process_refund', 'transaction', p_transaction_id, jsonb_build_object('reason', p_reason));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Flag transaction for fraud review
CREATE OR REPLACE FUNCTION flag_for_fraud(
  p_transaction_id UUID,
  p_flag_type TEXT,
  p_description TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_evidence JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_flag_id UUID;
  v_user_id UUID;
BEGIN
  -- Get user from transaction
  SELECT user_id INTO v_user_id FROM purchase_transactions WHERE id = p_transaction_id;

  -- Create fraud flag
  INSERT INTO fraud_flags (user_id, transaction_id, flag_type, severity, description, evidence)
  VALUES (v_user_id, p_transaction_id, p_flag_type, p_severity, p_description, p_evidence)
  RETURNING id INTO v_flag_id;

  -- Mark transaction
  UPDATE purchase_transactions
  SET flagged_for_review = TRUE, updated_at = NOW()
  WHERE id = p_transaction_id;

  RETURN v_flag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADMIN VIEWS (for dashboard)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Recent transactions with user info
CREATE OR REPLACE VIEW admin_recent_transactions AS
SELECT
  t.id,
  t.created_at,
  t.user_id,
  t.username,
  t.email,
  t.product_type,
  t.product_name,
  t.amount_cents::DECIMAL / 100 as amount,
  t.currency,
  t.provider,
  t.status,
  t.delivered,
  t.flagged_for_review,
  t.admin_notes
FROM purchase_transactions t
ORDER BY t.created_at DESC;

-- Revenue summary
CREATE OR REPLACE VIEW admin_revenue_summary AS
SELECT
  DATE_TRUNC('day', created_at)::DATE as date,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN status = 'completed' THEN amount_cents ELSE 0 END)::DECIMAL / 100 as revenue,
  SUM(CASE WHEN status = 'refunded' THEN amount_cents ELSE 0 END)::DECIMAL / 100 as refunds,
  COUNT(CASE WHEN flagged_for_review THEN 1 END) as flagged_count
FROM purchase_transactions
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)::DATE
ORDER BY date DESC;

-- Active subscribers
CREATE OR REPLACE VIEW admin_active_subscribers AS
SELECT
  s.id,
  s.user_id,
  s.email,
  s.tier,
  s.product_id,
  s.status,
  s.started_at,
  s.current_period_end,
  s.total_paid_cents::DECIMAL / 100 as total_paid,
  s.payment_count
FROM subscriptions s
WHERE s.status = 'active'
ORDER BY s.started_at DESC;

-- Pending refund requests
CREATE OR REPLACE VIEW admin_pending_refunds AS
SELECT
  r.id,
  r.created_at,
  r.user_id,
  t.email,
  t.product_name,
  r.amount_cents::DECIMAL / 100 as amount_requested,
  r.reason,
  r.reason_category,
  r.status
FROM refund_requests r
JOIN purchase_transactions t ON t.id = r.transaction_id
WHERE r.status = 'pending'
ORDER BY r.created_at ASC;

-- Open fraud cases
CREATE OR REPLACE VIEW admin_fraud_cases AS
SELECT
  f.id,
  f.created_at,
  f.user_id,
  t.email,
  f.flag_type,
  f.severity,
  f.description,
  f.status,
  t.amount_cents::DECIMAL / 100 as transaction_amount
FROM fraud_flags f
LEFT JOIN purchase_transactions t ON t.id = f.transaction_id
WHERE f.status IN ('open', 'investigating')
ORDER BY
  CASE f.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  f.created_at ASC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- Admin-only access to these tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- For now, disable RLS on admin tables (access via service role only)
-- In production, you'd set up proper admin role checking

ALTER TABLE purchase_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can see their own transactions
CREATE POLICY "Users can view own transactions"
  ON purchase_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can see their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can see their own refund requests
CREATE POLICY "Users can view own refunds"
  ON refund_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create refund requests for their transactions
CREATE POLICY "Users can request refunds"
  ON refund_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM purchase_transactions
      WHERE id = transaction_id AND user_id = auth.uid()
    )
  );
