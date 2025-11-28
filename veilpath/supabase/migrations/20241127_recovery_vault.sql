-- ============================================================================
-- RECOVERY VAULT MIGRATION
-- Adds secure storage for the encrypted recovery vault (security questions)
--
-- SECURITY MODEL:
-- - Vault contains encrypted chunks of recovery phrase
-- - Each chunk encrypted with user's security question answer
-- - Server stores ciphertext only - cannot recover phrase
-- - User needs Q3 (keystone) + 2 other correct answers to recover
-- - Even with full DB access, attacker cannot recover without answers
-- ============================================================================

-- Add recovery vault column (stores encrypted chunks)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS recovery_vault JSONB;

-- Add recovery vault version for migrations
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS recovery_vault_version INTEGER;

-- Add timestamp for when recovery was last set up
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS recovery_setup_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN profiles.recovery_vault IS
  'Encrypted recovery vault containing security question chunks. Structure:
   {
     version: 1,
     chunks: { q1: "encrypted", q2: "encrypted", q3: "encrypted", q4: "encrypted" },
     salts: { q1: "...", q2: "...", q3: "...", q4: "..." },
     verificationHashes: { q1: "...", q2: "...", q3: "...", q4: "..." }
   }
   Server cannot decrypt - each chunk requires the correct answer.';

COMMENT ON COLUMN profiles.recovery_vault_version IS
  'Recovery vault format version. Used for future migrations.';

COMMENT ON COLUMN profiles.recovery_setup_at IS
  'When the user last set up or updated their recovery questions.';

-- ============================================================================
-- RLS POLICIES (recovery vault is highly sensitive)
-- ============================================================================

-- Users can only see/update their own recovery vault
-- This is already covered by existing RLS policies on profiles table
-- But let's add an explicit check just to be safe

-- Drop if exists (for idempotency)
DROP POLICY IF EXISTS recovery_vault_owner_only ON profiles;

-- Ensure only the owner can access recovery vault data
CREATE POLICY recovery_vault_owner_only ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'recovery_vault'
  ) THEN
    RAISE EXCEPTION 'Migration failed: profiles.recovery_vault not created';
  END IF;

  RAISE NOTICE '✓ Recovery vault migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'SECURITY ARCHITECTURE:';
  RAISE NOTICE '- Recovery phrase split into 4 overlapping chunks';
  RAISE NOTICE '- Each chunk encrypted with security question answer';
  RAISE NOTICE '- Q3 (keystone) required + any 2 others for recovery';
  RAISE NOTICE '- Server stores only encrypted chunks (cannot recover)';
  RAISE NOTICE '- Wrong answers = cryptographic garbage (no information leak)';
END $$;
