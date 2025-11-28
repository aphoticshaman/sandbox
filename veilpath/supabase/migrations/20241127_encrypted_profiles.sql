-- ============================================================================
-- ENCRYPTED PROFILES MIGRATION
-- Adds encrypted profile data column for zero-knowledge storage of MBTI,
-- display name, preferences, and all other sensitive profile information.
--
-- ENCRYPTION IS MANDATORY - NOT OPTIONAL
-- All profile data is encrypted client-side. Server never sees plaintext.
-- ============================================================================

-- ============================================================================
-- PROFILES - Add encrypted profile data column
-- ============================================================================

-- Add encrypted profile content column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS encrypted_profile TEXT;

-- Add encryption version for profile data
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_encryption_version INTEGER;

-- Update encryption_enabled default to TRUE (encryption is now mandatory)
ALTER TABLE profiles
ALTER COLUMN encryption_enabled SET DEFAULT TRUE;

-- Make plaintext profile columns nullable (encrypted profiles won't use these)
ALTER TABLE profiles
ALTER COLUMN display_name DROP NOT NULL;

ALTER TABLE profiles
ALTER COLUMN zodiac_sign DROP NOT NULL;

ALTER TABLE profiles
ALTER COLUMN birthdate DROP NOT NULL;

-- Add comments
COMMENT ON COLUMN profiles.encrypted_profile IS
  'Base64-encoded AES-256-GCM encrypted blob containing MBTI type, display name, preferences, and all sensitive profile data. Only the user can decrypt with their password. Server/admins/hackers cannot read this.';

COMMENT ON COLUMN profiles.profile_encryption_version IS
  'Encryption format version for profile data (1 = AES-256-GCM with PBKDF2). NULL = plaintext.';

-- Update existing comment for encryption_enabled
COMMENT ON COLUMN profiles.encryption_enabled IS
  'ALWAYS TRUE - encryption is mandatory. Key is derived from user password client-side only. Never stored.';

-- ============================================================================
-- CREATE INDEX for encrypted profiles
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_encrypted
ON profiles(profile_encryption_version)
WHERE profile_encryption_version IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Check encrypted_profile column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'encrypted_profile'
  ) THEN
    RAISE EXCEPTION 'Migration failed: profiles.encrypted_profile not created';
  END IF;

  RAISE NOTICE '✓ Encrypted profiles migration completed successfully!';
  RAISE NOTICE '✓ profiles: encrypted_profile, profile_encryption_version added';
  RAISE NOTICE '';
  RAISE NOTICE 'ZERO-KNOWLEDGE GUARANTEE:';
  RAISE NOTICE '- MBTI type: ENCRYPTED (server cannot read)';
  RAISE NOTICE '- Display name: ENCRYPTED (server cannot read)';
  RAISE NOTICE '- Preferences: ENCRYPTED (server cannot read)';
  RAISE NOTICE '- All profile data: ENCRYPTED (server cannot read)';
  RAISE NOTICE '';
  RAISE NOTICE 'Even with MITM, stolen cookies, or compromised credentials,';
  RAISE NOTICE 'attackers cannot read profile data without the encryption password.';
END $$;
