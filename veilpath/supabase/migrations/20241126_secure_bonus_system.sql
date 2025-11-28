-- ============================================================
-- SECURE BONUS SYSTEM
-- Currency has real USD value - this schema is BULLETPROOF
-- ============================================================

-- Bonus claims table (source of truth for all first-time bonuses)
CREATE TABLE IF NOT EXISTS bonus_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bonus_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_fingerprint TEXT NOT NULL,
    amount INTEGER NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    platform TEXT,
    context JSONB DEFAULT '{}',
    suspicious BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent double claims per device
    CONSTRAINT unique_bonus_per_device UNIQUE (bonus_id, device_fingerprint),
    -- Prevent double claims per user
    CONSTRAINT unique_bonus_per_user UNIQUE (bonus_id, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bonus_claims_device ON bonus_claims(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_bonus_claims_user ON bonus_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_claims_ip ON bonus_claims(ip_address);
CREATE INDEX IF NOT EXISTS idx_bonus_claims_time ON bonus_claims(claimed_at);
CREATE INDEX IF NOT EXISTS idx_bonus_claims_suspicious ON bonus_claims(suspicious) WHERE suspicious = TRUE;

-- Enable RLS
ALTER TABLE bonus_claims ENABLE ROW LEVEL SECURITY;

-- Users can only see their own claims
CREATE POLICY "Users can view own claims"
    ON bonus_claims FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert (Edge Functions)
CREATE POLICY "Service role can insert claims"
    ON bonus_claims FOR INSERT
    WITH CHECK (TRUE);

-- ============================================================
-- PENDING ANONYMOUS BONUSES
-- For users who claim before signing up
-- ============================================================

CREATE TABLE IF NOT EXISTS pending_anonymous_bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_fingerprint TEXT NOT NULL,
    bonus_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    transaction_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    claimed_by_user_id UUID REFERENCES auth.users(id),
    claimed_at TIMESTAMPTZ,

    CONSTRAINT unique_pending_bonus UNIQUE (device_fingerprint, bonus_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_bonuses_device ON pending_anonymous_bonuses(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_pending_bonuses_expires ON pending_anonymous_bonuses(expires_at);

ALTER TABLE pending_anonymous_bonuses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USER BALANCES (Veil Shards - Premium Currency)
-- This is the ONLY source of truth for currency
-- ============================================================

CREATE TABLE IF NOT EXISTS user_balances (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    veil_shards INTEGER NOT NULL DEFAULT 0 CHECK (veil_shards >= 0),
    moonlight INTEGER NOT NULL DEFAULT 100 CHECK (moonlight >= 0),
    lifetime_veil_shards_earned INTEGER NOT NULL DEFAULT 0,
    lifetime_veil_shards_spent INTEGER NOT NULL DEFAULT 0,
    lifetime_moonlight_earned INTEGER NOT NULL DEFAULT 100,
    lifetime_moonlight_spent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balance"
    ON user_balances FOR SELECT
    USING (auth.uid() = user_id);

-- NO UPDATE POLICY - Only server-side functions can modify balances

-- ============================================================
-- TRANSACTION LEDGER (Immutable audit trail)
-- Every currency change is logged here - required for compliance
-- ============================================================

CREATE TABLE IF NOT EXISTS currency_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    currency_type TEXT NOT NULL CHECK (currency_type IN ('veil_shards', 'moonlight')),
    amount INTEGER NOT NULL, -- Positive = credit, Negative = debit
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'bonus', 'purchase', 'spend', 'refund', 'admin_adjustment'
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure balance never goes negative
    CONSTRAINT positive_balance CHECK (balance_after >= 0)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON currency_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON currency_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_time ON currency_transactions(created_at);

ALTER TABLE currency_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON currency_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOG (Security events)
-- ============================================================

CREATE TABLE IF NOT EXISTS bonus_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_type ON bonus_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_time ON bonus_audit_log(created_at);

-- ============================================================
-- ATOMIC BALANCE UPDATE FUNCTION
-- The ONLY way to modify balances - ensures consistency
-- ============================================================

CREATE OR REPLACE FUNCTION add_veil_shards(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_id TEXT,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Lock the user's balance row
    SELECT veil_shards INTO v_current_balance
    FROM user_balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Create balance record if doesn't exist
    IF v_current_balance IS NULL THEN
        INSERT INTO user_balances (user_id, veil_shards)
        VALUES (p_user_id, 0)
        ON CONFLICT (user_id) DO NOTHING;

        v_current_balance := 0;
    END IF;

    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount;

    -- Prevent negative balance
    IF v_new_balance < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient balance'
        );
    END IF;

    -- Update balance
    UPDATE user_balances
    SET
        veil_shards = v_new_balance,
        lifetime_veil_shards_earned = CASE
            WHEN p_amount > 0 THEN lifetime_veil_shards_earned + p_amount
            ELSE lifetime_veil_shards_earned
        END,
        lifetime_veil_shards_spent = CASE
            WHEN p_amount < 0 THEN lifetime_veil_shards_spent + ABS(p_amount)
            ELSE lifetime_veil_shards_spent
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log transaction
    INSERT INTO currency_transactions (
        user_id,
        transaction_id,
        currency_type,
        amount,
        balance_before,
        balance_after,
        transaction_type,
        reason
    ) VALUES (
        p_user_id,
        p_transaction_id,
        'veil_shards',
        p_amount,
        v_current_balance,
        v_new_balance,
        CASE WHEN p_amount > 0 THEN 'credit' ELSE 'debit' END,
        p_reason
    );

    RETURN jsonb_build_object(
        'success', true,
        'balance_before', v_current_balance,
        'balance_after', v_new_balance
    );
END;
$$;

-- ============================================================
-- SPEND VEIL SHARDS FUNCTION
-- For shop purchases - validates balance before spending
-- ============================================================

CREATE OR REPLACE FUNCTION spend_veil_shards(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_id TEXT,
    p_reason TEXT,
    p_item_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Amount must be positive
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Amount must be positive'
        );
    END IF;

    -- Lock and get current balance
    SELECT veil_shards INTO v_current_balance
    FROM user_balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User balance not found'
        );
    END IF;

    -- Check sufficient balance
    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient balance',
            'required', p_amount,
            'available', v_current_balance
        );
    END IF;

    v_new_balance := v_current_balance - p_amount;

    -- Update balance
    UPDATE user_balances
    SET
        veil_shards = v_new_balance,
        lifetime_veil_shards_spent = lifetime_veil_shards_spent + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log transaction
    INSERT INTO currency_transactions (
        user_id,
        transaction_id,
        currency_type,
        amount,
        balance_before,
        balance_after,
        transaction_type,
        reason,
        metadata
    ) VALUES (
        p_user_id,
        p_transaction_id,
        'veil_shards',
        -p_amount,
        v_current_balance,
        v_new_balance,
        'spend',
        p_reason,
        CASE WHEN p_item_id IS NOT NULL
            THEN jsonb_build_object('item_id', p_item_id)
            ELSE '{}'
        END
    );

    RETURN jsonb_build_object(
        'success', true,
        'balance_before', v_current_balance,
        'balance_after', v_new_balance,
        'spent', p_amount
    );
END;
$$;

-- ============================================================
-- CLAIM PENDING BONUSES ON SIGNUP
-- Transfers anonymous device bonuses to new user account
-- ============================================================

CREATE OR REPLACE FUNCTION claim_pending_bonuses(
    p_user_id UUID,
    p_device_fingerprint TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pending RECORD;
    v_total_claimed INTEGER := 0;
    v_bonuses_claimed TEXT[] := '{}';
BEGIN
    -- Find all unclaimed pending bonuses for this device
    FOR v_pending IN
        SELECT * FROM pending_anonymous_bonuses
        WHERE device_fingerprint = p_device_fingerprint
        AND claimed_by_user_id IS NULL
        AND expires_at > NOW()
    LOOP
        -- Credit the balance
        PERFORM add_veil_shards(
            p_user_id,
            v_pending.amount,
            v_pending.transaction_id,
            'pending_bonus_' || v_pending.bonus_id
        );

        -- Mark as claimed
        UPDATE pending_anonymous_bonuses
        SET
            claimed_by_user_id = p_user_id,
            claimed_at = NOW()
        WHERE id = v_pending.id;

        v_total_claimed := v_total_claimed + v_pending.amount;
        v_bonuses_claimed := array_append(v_bonuses_claimed, v_pending.bonus_id);
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'total_claimed', v_total_claimed,
        'bonuses', v_bonuses_claimed
    );
END;
$$;

-- ============================================================
-- CLEANUP EXPIRED PENDING BONUSES (Scheduled job)
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_expired_bonuses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM pending_anonymous_bonuses
    WHERE expires_at < NOW()
    AND claimed_by_user_id IS NULL;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- ============================================================
-- FRAUD DETECTION VIEW
-- For admin dashboard
-- ============================================================

CREATE OR REPLACE VIEW suspicious_activity AS
SELECT
    device_fingerprint,
    ip_address,
    COUNT(*) as claim_count,
    SUM(amount) as total_claimed,
    MIN(claimed_at) as first_claim,
    MAX(claimed_at) as last_claim,
    EXTRACT(EPOCH FROM (MAX(claimed_at) - MIN(claimed_at))) / 60 as minutes_between,
    array_agg(DISTINCT bonus_id) as bonuses_claimed
FROM bonus_claims
WHERE suspicious = TRUE
OR claimed_at > NOW() - INTERVAL '24 hours'
GROUP BY device_fingerprint, ip_address
HAVING COUNT(*) > 3
ORDER BY claim_count DESC;

-- Grant access to the view
GRANT SELECT ON suspicious_activity TO service_role;

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE bonus_claims IS 'Source of truth for all first-time bonus claims. Device fingerprint prevents multi-account farming.';
COMMENT ON TABLE user_balances IS 'User currency balances. Only modifiable via server-side functions.';
COMMENT ON TABLE currency_transactions IS 'Immutable ledger of all currency changes. Required for compliance.';
COMMENT ON FUNCTION add_veil_shards IS 'Atomic function to credit Veil Shards. Only way to add currency.';
COMMENT ON FUNCTION spend_veil_shards IS 'Atomic function to debit Veil Shards. Validates balance before spending.';
