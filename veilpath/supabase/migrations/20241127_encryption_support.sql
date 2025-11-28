-- ============================================================================
-- ENCRYPTION SUPPORT MIGRATION
-- Run this in Supabase SQL Editor to enable zero-knowledge encryption
-- ============================================================================

-- ============================================================================
-- JOURNAL ENTRIES - Add encryption columns
-- ============================================================================

-- Add encrypted content column (stores the AES-256-GCM encrypted blob)
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS encrypted_content TEXT;

-- Add encryption version (for future-proofing if we change encryption format)
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS encryption_version INTEGER;

-- Make plaintext columns nullable (encrypted entries won't have these)
ALTER TABLE journal_entries
ALTER COLUMN content DROP NOT NULL;

ALTER TABLE journal_entries
ALTER COLUMN title DROP NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN journal_entries.encrypted_content IS
  'Base64-encoded AES-256-GCM encrypted blob. When present, content/title are NULL. Only user can decrypt with their password.';

COMMENT ON COLUMN journal_entries.encryption_version IS
  'Encryption format version (1 = AES-256-GCM with PBKDF2). NULL = plaintext.';

-- ============================================================================
-- READINGS - Add encryption columns
-- ============================================================================

-- Add encrypted content column
ALTER TABLE readings
ADD COLUMN IF NOT EXISTS encrypted_content TEXT;

-- Add encryption version
ALTER TABLE readings
ADD COLUMN IF NOT EXISTS encryption_version INTEGER;

-- Make plaintext columns nullable
ALTER TABLE readings
ALTER COLUMN intention DROP NOT NULL;

ALTER TABLE readings
ALTER COLUMN cards DROP NOT NULL;

ALTER TABLE readings
ALTER COLUMN interpretation DROP NOT NULL;

-- Add comments
COMMENT ON COLUMN readings.encrypted_content IS
  'Base64-encoded AES-256-GCM encrypted blob containing intention, cards, and interpretation. Only user can decrypt.';

COMMENT ON COLUMN readings.encryption_version IS
  'Encryption format version. NULL = plaintext data.';

-- ============================================================================
-- PROFILES - Add encryption preference
-- ============================================================================

-- Track if user has encryption enabled (not the key - we never store that!)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT FALSE;

-- Store key verification hash (to verify password is correct, NOT the key itself)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS key_verification_hash TEXT;

COMMENT ON COLUMN profiles.encryption_enabled IS
  'Whether user has enabled end-to-end encryption. Key is derived from password and never stored.';

COMMENT ON COLUMN profiles.key_verification_hash IS
  'PBKDF2-derived hash to verify password is correct. NOT the encryption key itself.';

-- ============================================================================
-- CREATE INDEX for encrypted content queries
-- ============================================================================

-- Index to quickly find encrypted vs plaintext entries
CREATE INDEX IF NOT EXISTS idx_journal_encrypted
ON journal_entries(encryption_version)
WHERE encryption_version IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_readings_encrypted
ON readings(encryption_version)
WHERE encryption_version IS NOT NULL;

-- ============================================================================
-- RLS POLICIES (already exist, no changes needed)
-- ============================================================================
-- The existing RLS policies already ensure users can only access their own data.
-- Encryption adds an additional layer - even if RLS fails, data is unreadable.

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify columns were added
DO $$
BEGIN
  -- Check journal_entries
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journal_entries' AND column_name = 'encrypted_content'
  ) THEN
    RAISE EXCEPTION 'Migration failed: journal_entries.encrypted_content not created';
  END IF;

  -- Check readings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'readings' AND column_name = 'encrypted_content'
  ) THEN
    RAISE EXCEPTION 'Migration failed: readings.encrypted_content not created';
  END IF;

  -- Check profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'encryption_enabled'
  ) THEN
    RAISE EXCEPTION 'Migration failed: profiles.encryption_enabled not created';
  END IF;

  RAISE NOTICE '✓ Encryption support migration completed successfully!';
  RAISE NOTICE '✓ journal_entries: encrypted_content, encryption_version added';
  RAISE NOTICE '✓ readings: encrypted_content, encryption_version added';
  RAISE NOTICE '✓ profiles: encryption_enabled, key_verification_hash added';
  RAISE NOTICE '';
  RAISE NOTICE 'SECURITY NOTES:';
  RAISE NOTICE '- Encryption keys are NEVER stored in the database';
  RAISE NOTICE '- Keys are derived from user password client-side only';
  RAISE NOTICE '- Even database admins cannot read encrypted content';
  RAISE NOTICE '- If user forgets password, data is PERMANENTLY LOST (by design)';
END $$;
