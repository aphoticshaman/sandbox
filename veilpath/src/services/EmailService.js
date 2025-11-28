/**
 * Email Service
 *
 * Manages email preferences and syncs with Resend Audiences.
 * Categories: promos, events, contests, updates, community
 */

import { supabase } from './supabase';

// Email categories with descriptions
export const EMAIL_CATEGORIES = {
  promos: {
    id: 'promos',
    name: 'Promotions & Offers',
    description: 'Sales, discounts, and special offers on shards and subscriptions',
    icon: '🎁',
    defaultOn: false,
  },
  events: {
    id: 'events',
    name: 'Events & Livestreams',
    description: 'Live readings, community events, and special gatherings',
    icon: '📅',
    defaultOn: false,
  },
  contests: {
    id: 'contests',
    name: 'Contests & Giveaways',
    description: 'Competitions, giveaways, and prize drawings',
    icon: '🏆',
    defaultOn: false,
  },
  updates: {
    id: 'updates',
    name: 'App Updates',
    description: 'New features, patch notes, and important changes',
    icon: '✨',
    defaultOn: true,
  },
  community: {
    id: 'community',
    name: 'Community News',
    description: 'Community highlights, user stories, and forum updates',
    icon: '👥',
    defaultOn: false,
  },
};

export const EmailService = {
  /**
   * Get user's email preferences
   */
  async getPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (new user)
        console.error('[EmailService] Get preferences failed:', error);
        return { preferences: null, error };
      }

      return { preferences: data, error: null };
    } catch (err) {
      console.error('[EmailService] Get preferences error:', err);
      return { preferences: null, error: err };
    }
  },

  /**
   * Create default preferences for new user
   */
  async createDefaultPreferences(userId, email) {
    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .insert({
          user_id: userId,
          email: email,
          promos: EMAIL_CATEGORIES.promos.defaultOn,
          events: EMAIL_CATEGORIES.events.defaultOn,
          contests: EMAIL_CATEGORIES.contests.defaultOn,
          updates: EMAIL_CATEGORIES.updates.defaultOn,
          community: EMAIL_CATEGORIES.community.defaultOn,
        })
        .select()
        .single();

      if (error) {
        console.error('[EmailService] Create preferences failed:', error);
        return { preferences: null, error };
      }

      return { preferences: data, error: null };
    } catch (err) {
      console.error('[EmailService] Create preferences error:', err);
      return { preferences: null, error: err };
    }
  },

  /**
   * Update email preferences
   */
  async updatePreferences(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[EmailService] Update preferences failed:', error);
        return { preferences: null, error };
      }

      console.log('[EmailService] Preferences updated:', data);
      return { preferences: data, error: null };
    } catch (err) {
      console.error('[EmailService] Update preferences error:', err);
      return { preferences: null, error: err };
    }
  },

  /**
   * Toggle a single category
   */
  async toggleCategory(userId, category, enabled) {
    if (!EMAIL_CATEGORIES[category]) {
      return { error: new Error(`Invalid category: ${category}`) };
    }

    return this.updatePreferences(userId, { [category]: enabled });
  },

  /**
   * Unsubscribe from all emails
   */
  async unsubscribeAll(userId) {
    return this.updatePreferences(userId, {
      promos: false,
      events: false,
      contests: false,
      updates: false,
      community: false,
      unsubscribed_all_at: new Date().toISOString(),
    });
  },

  /**
   * Get or create preferences (for settings screen)
   */
  async getOrCreatePreferences(userId, email) {
    let { preferences, error } = await this.getPreferences(userId);

    if (!preferences && !error) {
      // No preferences yet, create defaults
      const result = await this.createDefaultPreferences(userId, email);
      preferences = result.preferences;
      error = result.error;
    }

    return { preferences, error };
  },

  /**
   * Check if user is subscribed to a category
   */
  async isSubscribed(userId, category) {
    const { preferences } = await this.getPreferences(userId);
    return preferences?.[category] || false;
  },

  /**
   * Get all subscribed users for a category (admin use)
   * Note: This would typically be done server-side
   */
  async getSubscribersForCategory(category) {
    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .select('email, user_id')
        .eq(category, true)
        .is('unsubscribed_all_at', null);

      if (error) {
        console.error('[EmailService] Get subscribers failed:', error);
        return { subscribers: [], error };
      }

      return { subscribers: data, error: null };
    } catch (err) {
      console.error('[EmailService] Get subscribers error:', err);
      return { subscribers: [], error: err };
    }
  },
};

export default EmailService;
