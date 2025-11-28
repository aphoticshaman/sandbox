-- ============================================================================
-- SECURITY FIXES: Enable RLS and Fix Function Search Path
-- ============================================================================
-- This migration addresses Supabase security advisor warnings:
-- 1. Enable RLS on users, subscriptions, api_usage, daily_usage tables
-- 2. Fix search_path for update_updated_at_column function
-- ============================================================================

-- ============================================================================
-- FIX 1: Update function with immutable search_path
-- ============================================================================

-- Drop and recreate the update_updated_at_column function with SET search_path
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers only for tables that exist
DO $$
BEGIN
  -- Profiles table
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Readings table
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'readings') THEN
    DROP TRIGGER IF EXISTS update_readings_updated_at ON readings;
    CREATE TRIGGER update_readings_updated_at
      BEFORE UPDATE ON readings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Journal entries table
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'journal_entries') THEN
    DROP TRIGGER IF EXISTS update_journal_updated_at ON journal_entries;
    CREATE TRIGGER update_journal_updated_at
      BEFORE UPDATE ON journal_entries
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Action items table
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'action_items') THEN
    DROP TRIGGER IF EXISTS update_actions_updated_at ON action_items;
    CREATE TRIGGER update_actions_updated_at
      BEFORE UPDATE ON action_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Users table (from backend schema)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Subscriptions table (from backend schema)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
    CREATE TRIGGER update_subscriptions_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- User profiles table (from db schema)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- FIX 2: Enable RLS on users table (if it exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Enable RLS
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own record" ON public.users;
    DROP POLICY IF EXISTS "Users can update own record" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

    -- Users can only see their own record
    CREATE POLICY "Users can view own record"
      ON public.users FOR SELECT
      USING (
        auth.uid()::text = id::text OR
        auth.jwt()->>'email' = email
      );

    -- Users can update their own record
    CREATE POLICY "Users can update own record"
      ON public.users FOR UPDATE
      USING (
        auth.uid()::text = id::text OR
        auth.jwt()->>'email' = email
      );

    -- Users can insert their own record
    CREATE POLICY "Users can insert own record"
      ON public.users FOR INSERT
      WITH CHECK (
        auth.uid()::text = id::text OR
        auth.jwt()->>'email' = email
      );

    RAISE NOTICE 'RLS enabled on users table';
  END IF;
END $$;

-- ============================================================================
-- FIX 3: Enable RLS on subscriptions table (if it exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    -- Enable RLS
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
    DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
    DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;

    -- Users can only see their own subscriptions
    CREATE POLICY "Users can view own subscriptions"
      ON public.subscriptions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = subscriptions.user_id
          AND (auth.uid()::text = users.id::text OR auth.jwt()->>'email' = users.email)
        )
      );

    -- Users can update their own subscriptions
    CREATE POLICY "Users can update own subscriptions"
      ON public.subscriptions FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = subscriptions.user_id
          AND (auth.uid()::text = users.id::text OR auth.jwt()->>'email' = users.email)
        )
      );

    -- Users can insert their own subscriptions
    CREATE POLICY "Users can insert own subscriptions"
      ON public.subscriptions FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = subscriptions.user_id
          AND (auth.uid()::text = users.id::text OR auth.jwt()->>'email' = users.email)
        )
      );

    RAISE NOTICE 'RLS enabled on subscriptions table';
  END IF;
END $$;

-- ============================================================================
-- FIX 4: Enable RLS on api_usage table (if it exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_usage') THEN
    -- Enable RLS
    ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own api usage" ON public.api_usage;
    DROP POLICY IF EXISTS "Users can insert own api usage" ON public.api_usage;

    -- Users can only see their own API usage
    CREATE POLICY "Users can view own api usage"
      ON public.api_usage FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = api_usage.user_id
          AND (auth.uid()::text = users.id::text OR auth.jwt()->>'email' = users.email)
        )
      );

    -- Users can insert their own API usage (typically done by backend)
    CREATE POLICY "Users can insert own api usage"
      ON public.api_usage FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = api_usage.user_id
          AND (auth.uid()::text = users.id::text OR auth.jwt()->>'email' = users.email)
        )
      );

    -- Service role can do anything (for backend operations)
    CREATE POLICY "Service role has full access to api_usage"
      ON public.api_usage FOR ALL
      USING (auth.jwt()->>'role' = 'service_role')
      WITH CHECK (auth.jwt()->>'role' = 'service_role');

    RAISE NOTICE 'RLS enabled on api_usage table';
  END IF;
END $$;

-- ============================================================================
-- FIX 5: Enable RLS on daily_usage table (if it exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_usage') THEN
    -- Enable RLS
    ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own daily usage" ON public.daily_usage;
    DROP POLICY IF EXISTS "Users can insert own daily usage" ON public.daily_usage;
    DROP POLICY IF EXISTS "Users can update own daily usage" ON public.daily_usage;

    -- Users can only see their own daily usage
    CREATE POLICY "Users can view own daily usage"
      ON public.daily_usage FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = daily_usage.user_id
          AND (auth.uid()::text = users.id::text OR auth.jwt()->>'email' = users.email)
        )
      );

    -- Users can insert their own daily usage (typically done by backend)
    CREATE POLICY "Users can insert own daily usage"
      ON public.daily_usage FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = daily_usage.user_id
          AND (auth.uid()::text = users.id::text OR auth.jwt()->>'email' = users.email)
        )
      );

    -- Users can update their own daily usage (for incrementing counters)
    CREATE POLICY "Users can update own daily usage"
      ON public.daily_usage FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = daily_usage.user_id
          AND (auth.uid()::text = users.id::text OR auth.jwt()->>'email' = users.email)
        )
      );

    -- Service role can do anything (for backend operations)
    CREATE POLICY "Service role has full access to daily_usage"
      ON public.daily_usage FOR ALL
      USING (auth.jwt()->>'role' = 'service_role')
      WITH CHECK (auth.jwt()->>'role' = 'service_role');

    RAISE NOTICE 'RLS enabled on daily_usage table';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Security fixes applied successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Function search_path fixed';
  RAISE NOTICE '✓ RLS enabled on all backend tables';
  RAISE NOTICE '✓ Policies created for user data isolation';
  RAISE NOTICE '✓ Service role has administrative access';
  RAISE NOTICE '========================================';
END $$;
