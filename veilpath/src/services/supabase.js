/**
 * SUPABASE CLIENT
 * Handles authentication and database operations
 *
 * SECURITY:
 * - Passwords are bcrypt hashed + salted by Supabase Auth
 * - JWTs are signed and encrypted
 * - All API calls over HTTPS/TLS
 * - RLS policies enforce row-level security
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// TODO: Add these to your .env file
// Get these from: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
  console.error('⚠️  SUPABASE_URL not configured! Add to .env file');
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('⚠️  SUPABASE_ANON_KEY not configured! Add to .env file');
}

/**
 * Supabase client instance
 * Works on both web and React Native
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Store session in localStorage (web) or AsyncStorage (mobile)
    storage: Platform.OS === 'web' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

/**
 * Auth helper functions
 */
export const auth = {
  /**
   * Sign up new user
   * @param {string} email - User's email (also their username)
   * @param {string} password - Plain text password (will be hashed by Supabase)
   * @param {string} captchaToken - Optional Turnstile CAPTCHA token
   * @returns {Promise<{user, session, error}>}
   */
  async signUp(email, password, captchaToken = null) {
    // If CAPTCHA token provided, validate via Edge Function (REQUIRED for security)
    if (captchaToken) {
      console.log('[Auth] Validating CAPTCHA with Edge Function...');
      const response = await supabase.functions.invoke('verify-turnstile', {
        body: {
          action: 'signup',
          email,
          password,
          turnstileToken: captchaToken,
        },
      });

      if (response.error) {
        console.error('[Auth] CAPTCHA verification failed:', response.error);
        return {
          user: null,
          session: null,
          error: { message: 'CAPTCHA verification failed. Please try again.' }
        };
      }

      if (!response.data?.user) {
        console.error('[Auth] Edge Function returned no user data');
        return {
          user: null,
          session: null,
          error: { message: 'Authentication failed. Please try again.' }
        };
      }

      console.log('[Auth] Sign up successful with CAPTCHA:', response.data.user?.email);
      return { user: response.data.user, session: response.data.session, error: null };
    }

    // Direct Supabase auth (no CAPTCHA - only when CAPTCHA not configured)
    console.log('[Auth] Signing up without CAPTCHA (direct Supabase auth)...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
      },
    });

    if (error) {
      console.error('[Auth] Sign up failed:', error.message);
      return { user: null, session: null, error };
    }

    console.log('[Auth] Sign up successful:', data.user?.email);
    return { user: data.user, session: data.session, error: null };
  },

  /**
   * Sign in existing user
   * @param {string} email
   * @param {string} password
   * @param {string} captchaToken - Optional Turnstile CAPTCHA token
   * @returns {Promise<{user, session, error}>}
   */
  async signIn(email, password, captchaToken = null) {
    // If CAPTCHA token provided, validate via Edge Function (REQUIRED for security)
    if (captchaToken) {
      console.log('[Auth] Validating CAPTCHA with Edge Function...');
      const response = await supabase.functions.invoke('verify-turnstile', {
        body: {
          action: 'signin',
          email,
          password,
          turnstileToken: captchaToken,
        },
      });

      if (response.error) {
        console.error('[Auth] CAPTCHA verification failed:', response.error);
        return {
          user: null,
          session: null,
          error: { message: 'CAPTCHA verification failed. Please try again.' }
        };
      }

      if (!response.data?.user) {
        console.error('[Auth] Edge Function returned no user data');
        return {
          user: null,
          session: null,
          error: { message: 'Authentication failed. Please try again.' }
        };
      }

      console.log('[Auth] Sign in successful with CAPTCHA:', response.data.user?.email);
      return { user: response.data.user, session: response.data.session, error: null };
    }

    // Direct Supabase auth (no CAPTCHA - only when CAPTCHA not configured)
    console.log('[Auth] Signing in without CAPTCHA (direct Supabase auth)...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Sign in failed:', error.message);
      return { user: null, session: null, error };
    }

    console.log('[Auth] Sign in successful:', data.user?.email);
    return { user: data.user, session: data.session, error: null };
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] Sign out failed:', error.message);
      return { error };
    }

    console.log('[Auth] Sign out successful');
    return { error: null };
  },

  /**
   * Get current session
   * @returns {Promise<{session, error}>}
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Auth] Get session failed:', error.message);
      return { session: null, error };
    }

    return { session: data.session, error: null };
  },

  /**
   * Get current user
   * @returns {Promise<{user, error}>}
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('[Auth] Get user failed:', error.message);
      return { user: null, error };
    }

    return { user: data.user, error: null };
  },

  /**
   * Listen to auth state changes
   * @param {Function} callback - Called when auth state changes
   * @returns {Object} Subscription object with unsubscribe method
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] State changed:', event, session?.user?.email);
      callback(event, session);
    });

    return subscription;
  },

  /**
   * Reset password (send reset email)
   * @param {string} email
   */
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Platform.OS === 'web' ? `${window.location.origin}/reset-password` : undefined,
    });

    if (error) {
      console.error('[Auth] Password reset failed:', error.message);
      return { error };
    }

    console.log('[Auth] Password reset email sent to:', email);
    return { error: null };
  },

  /**
   * Update user password
   * @param {string} newPassword
   */
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('[Auth] Password update failed:', error.message);
      return { error };
    }

    console.log('[Auth] Password updated successfully');
    return { error: null };
  },

  /**
   * Sign in with Google OAuth
   * Redirects to Google for authentication
   * @returns {Promise<{data, error}>}
   */
  async signInWithGoogle() {
    console.log('[Auth] Initiating Google OAuth...');

    const redirectTo = Platform.OS === 'web'
      ? `${window.location.origin}/auth/callback`
      : 'veilpath://auth/callback';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('[Auth] Google OAuth failed:', error.message);
      return { data: null, error };
    }

    console.log('[Auth] Google OAuth initiated, redirecting...');
    return { data, error: null };
  },

  /**
   * Sign in with Apple OAuth (iOS only)
   * @returns {Promise<{data, error}>}
   */
  async signInWithApple() {
    console.log('[Auth] Initiating Apple OAuth...');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: Platform.OS === 'web'
          ? `${window.location.origin}/auth/callback`
          : 'veilpath://auth/callback',
      },
    });

    if (error) {
      console.error('[Auth] Apple OAuth failed:', error.message);
      return { data: null, error };
    }

    return { data, error: null };
  },

  /**
   * Resend verification email
   * @param {string} email
   */
  async resendVerificationEmail(email) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
      },
    });

    if (error) {
      console.error('[Auth] Resend verification failed:', error.message);
      return { error };
    }

    console.log('[Auth] Verification email resent to:', email);
    return { error: null };
  },
};

/**
 * Database helper functions
 */
export const db = {
  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[DB] Get profile failed:', error.message);
      return { profile: null, error };
    }

    return { profile: data, error: null };
  },

  /**
   * Create or update user profile
   */
  async upsertProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[DB] Upsert profile failed:', error.message);
      return { profile: null, error };
    }

    return { profile: data, error: null };
  },

  /**
   * Save journal entry
   */
  async saveJournalEntry(userId, entryData) {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        ...entryData,
      })
      .select()
      .single();

    if (error) {
      console.error('[DB] Save journal failed:', error.message);
      return { entry: null, error };
    }

    return { entry: data, error: null };
  },

  /**
   * Get user's journal entries
   */
  async getJournalEntries(userId, limit = 50) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[DB] Get journals failed:', error.message);
      return { entries: [], error };
    }

    return { entries: data, error: null };
  },

  /**
   * Save tarot reading
   */
  async saveReading(userId, readingData) {
    const { data, error } = await supabase
      .from('readings')
      .insert({
        user_id: userId,
        ...readingData,
      })
      .select()
      .single();

    if (error) {
      console.error('[DB] Save reading failed:', error.message);
      return { reading: null, error };
    }

    return { reading: data, error: null };
  },

  /**
   * Get user's reading history
   */
  async getReadings(userId, limit = 50) {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[DB] Get readings failed:', error.message);
      return { readings: [], error };
    }

    return { readings: data, error: null };
  },
};

export default supabase;
