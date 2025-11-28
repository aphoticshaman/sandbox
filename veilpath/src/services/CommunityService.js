/**
 * VeilPath Community Service
 *
 * Community features designed to maximize MAUs:
 * - Daily Card Sharing (ritual engagement)
 * - Reading Requests (content generation)
 * - Interpretation Discussions (peer learning)
 * - Mystical Chat Rooms (real-time connection)
 * - User Profiles with Titles/Badges (status)
 *
 * Premium features:
 * - Create custom chat rooms
 * - Priority reading requests
 * - Exclusive Mystic Lounge
 * - Custom community badges
 */

import { supabase } from './supabase';

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNITY CHANNELS (Forum + Chat Hybrid)
// ═══════════════════════════════════════════════════════════════════════════════

export const COMMUNITY_CHANNELS = {
  // ─────────────────────────────────────────────────────────────────────────────
  // DAILY RITUALS (High engagement, daily touchpoints)
  // ─────────────────────────────────────────────────────────────────────────────
  daily_card: {
    id: 'daily_card',
    name: 'Daily Card Circle',
    description: 'Share your daily card and see what the community drew',
    icon: '🌅',
    type: 'daily_ritual',
    sortOrder: 1,
    features: {
      allowImages: true,
      allowReplies: true,
      dailyPrompt: true,
      autoExpire: false,
    },
    premium: false,
  },

  intentions: {
    id: 'intentions',
    name: 'Morning Intentions',
    description: 'Set your daily intention with the community',
    icon: '✨',
    type: 'daily_ritual',
    sortOrder: 2,
    features: {
      allowImages: false,
      allowReplies: true,
      dailyPrompt: true,
    },
    premium: false,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FORUM + CHAT HYBRIDS (Forum threads + live chat room)
  // ─────────────────────────────────────────────────────────────────────────────
  general: {
    id: 'general',
    name: 'General',
    description: 'General discussions about VeilPath and life',
    icon: '💬',
    type: 'forum_chat', // Has both forum AND chat
    sortOrder: 3,
    features: {
      forum: {
        allowImages: true,
        allowReplies: true,
        allowVotes: true,
      },
      chat: {
        realtime: true,
        maxMessages: 100,
        typingIndicators: true,
      },
    },
    premium: false,
  },

  tarot: {
    id: 'tarot',
    name: 'Tarot Discussion',
    description: 'Readings, interpretations, card meanings, and spreads',
    icon: '🔮',
    type: 'forum_chat',
    sortOrder: 4,
    features: {
      forum: {
        allowImages: true,
        allowReplies: true,
        allowVotes: true,
        pinnable: true,
      },
      chat: {
        realtime: true,
        maxMessages: 100,
        typingIndicators: true,
      },
    },
    premium: false,
  },

  troubleshooting: {
    id: 'troubleshooting',
    name: 'Help & Support',
    description: 'Get help from the community and Vera (AI assistant)',
    icon: '🛠️',
    type: 'forum_chat',
    sortOrder: 5,
    features: {
      forum: {
        allowImages: true,
        allowReplies: true,
        allowVotes: true,
        pinnable: true,
      },
      chat: {
        realtime: true,
        llmAssisted: true, // Vera (Claude) responds to questions!
        maxMessages: 100,
      },
    },
    premium: false,
    llmConfig: {
      persona: 'vera_support',
      autoRespond: true,
      escalateToHuman: true,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ADDITIONAL FORUMS (Topic-specific)
  // ─────────────────────────────────────────────────────────────────────────────
  spreads: {
    id: 'spreads',
    name: 'Spread Showcase',
    description: 'Share custom spreads and reading layouts',
    icon: '🎴',
    type: 'forum',
    sortOrder: 6,
    features: {
      allowImages: true,
      allowReplies: true,
      allowVotes: true,
    },
    premium: false,
  },

  journal_prompts: {
    id: 'journal_prompts',
    name: 'Journal Prompts',
    description: 'Share and discover reflection prompts',
    icon: '📝',
    type: 'forum',
    sortOrder: 7,
    premium: false,
  },

  feature_requests: {
    id: 'feature_requests',
    name: 'Feature Requests',
    description: 'Suggest new features and vote on ideas',
    icon: '💡',
    type: 'forum',
    sortOrder: 8,
    features: {
      allowImages: false,
      allowReplies: true,
      allowVotes: true,
      voteSorting: true, // Sort by votes
    },
    premium: false,
    devInsight: true, // Flag for dev analytics
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PREMIUM CHANNELS
  // ─────────────────────────────────────────────────────────────────────────────
  mystic_lounge: {
    id: 'mystic_lounge',
    name: 'Mystic Sanctum',
    description: 'Exclusive space for Mystic tier members',
    icon: '👑',
    type: 'forum_chat',
    sortOrder: 9,
    features: {
      forum: { allowImages: true, allowReplies: true, allowVotes: true },
      chat: { realtime: true, typingIndicators: true },
      requiredTier: 'mystic',
    },
    premium: true,
  },

  adept_circle: {
    id: 'adept_circle',
    name: 'Adept Circle',
    description: 'For Adept and above members',
    icon: '🌟',
    type: 'forum_chat',
    sortOrder: 10,
    features: {
      forum: { allowImages: true, allowReplies: true, allowVotes: true },
      chat: { realtime: true, typingIndicators: true },
      requiredTier: 'adept',
    },
    premium: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNITY BADGES & TITLES (Social status = engagement)
// ═══════════════════════════════════════════════════════════════════════════════

export const COMMUNITY_BADGES = {
  // Activity badges
  first_post: { id: 'first_post', name: 'First Words', icon: '🌱', description: 'Made your first post' },
  helpful: { id: 'helpful', name: 'Helpful Soul', icon: '💝', description: 'Received 10 helpful votes' },
  popular: { id: 'popular', name: 'Community Star', icon: '⭐', description: 'Received 50 likes' },
  daily_regular: { id: 'daily_regular', name: 'Daily Devotee', icon: '🌅', description: '30 daily card shares' },

  // Contribution badges
  interpreter: { id: 'interpreter', name: 'Skilled Interpreter', icon: '🔮', description: 'Helped 25 people with readings' },
  teacher: { id: 'teacher', name: 'Wisdom Keeper', icon: '📚', description: 'Top contributor in Study Group' },
  creator: { id: 'creator', name: 'Spread Creator', icon: '🎨', description: 'Created a popular spread' },

  // Engagement badges
  chatterbox: { id: 'chatterbox', name: 'Social Butterfly', icon: '🦋', description: '500 chat messages' },
  night_owl: { id: 'night_owl', name: 'Night Owl', icon: '🦉', description: 'Active after midnight' },
  early_bird: { id: 'early_bird', name: 'Early Riser', icon: '🌄', description: 'Active before 6am' },

  // Premium badges
  supporter: { id: 'supporter', name: 'Veil Supporter', icon: '💎', description: 'Premium subscriber' },
  founder: { id: 'founder', name: 'Founding Member', icon: '🏆', description: 'Joined in beta' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class CommunityServiceClass {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Set();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POSTS (Forum-style)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create a new community post
   */
  async createPost({ channelId, userId, title, content, cardIds = [], imageUrl = null }) {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        channel_id: channelId,
        user_id: userId,
        title,
        content,
        card_ids: cardIds,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get posts for a channel
   */
  async getPosts(channelId, { limit = 20, offset = 0, sortBy = 'created_at' } = {}) {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        user:user_id (
          id,
          display_name,
          avatar_url,
          badges,
          subscription_tier
        ),
        replies:community_replies (count),
        votes:community_votes (count)
      `)
      .eq('channel_id', channelId)
      .order(sortBy, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  /**
   * Get today's daily card posts
   */
  async getDailyCards(limit = 50) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        user:user_id (
          id,
          display_name,
          avatar_url,
          subscription_tier
        )
      `)
      .eq('channel_id', 'daily_card')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REPLIES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Add a reply to a post
   */
  async addReply({ postId, userId, content }) {
    const { data, error } = await supabase
      .from('community_replies')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get replies for a post
   */
  async getReplies(postId, { limit = 50 } = {}) {
    const { data, error } = await supabase
      .from('community_replies')
      .select(`
        *,
        user:user_id (
          id,
          display_name,
          avatar_url,
          badges
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHAT (Real-time)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Send a chat message
   */
  async sendMessage({ channelId, userId, content }) {
    const { data, error } = await supabase
      .from('community_messages')
      .insert({
        channel_id: channelId,
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Subscribe to real-time chat messages
   */
  subscribeToChannel(channelId, callback) {
    const subscription = supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();

    this.subscriptions.set(channelId, subscription);
    return () => this.unsubscribeFromChannel(channelId);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribeFromChannel(channelId) {
    const subscription = this.subscriptions.get(channelId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(channelId);
    }
  }

  /**
   * Get recent messages for a channel
   */
  async getMessages(channelId, { limit = 50 } = {}) {
    const { data, error } = await supabase
      .from('community_messages')
      .select(`
        *,
        user:user_id (
          id,
          display_name,
          avatar_url,
          badges,
          subscription_tier
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data?.reverse() || [];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VOTING & ENGAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Vote on a post
   */
  async votePost(postId, userId, voteType = 'like') {
    // Remove existing vote first
    await supabase
      .from('community_votes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    // Add new vote
    const { data, error } = await supabase
      .from('community_votes')
      .insert({
        post_id: postId,
        user_id: userId,
        vote_type: voteType,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // USER PRESENCE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Track user presence in a channel
   */
  async setPresence(channelId, userId, status = 'online') {
    const presenceChannel = supabase.channel(`presence:${channelId}`);

    await presenceChannel.track({
      user_id: userId,
      status,
      online_at: new Date().toISOString(),
    });

    return presenceChannel;
  }

  /**
   * Get online users in a channel
   */
  async getOnlineUsers(channelId) {
    const presenceChannel = supabase.channel(`presence:${channelId}`);
    const state = presenceChannel.presenceState();
    return Object.values(state).flat();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DAILY CARD SHARING (High-engagement feature)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Share daily card with community
   */
  async shareDailyCard({ userId, cardId, isReversed, interpretation, intention }) {
    return this.createPost({
      channelId: 'daily_card',
      userId,
      title: null, // Daily cards don't need titles
      content: interpretation || '',
      cardIds: [{ cardId, isReversed }],
      metadata: {
        intention,
        sharedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Check if user shared today's daily card
   */
  async hasSharedDailyCard(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('community_posts')
      .select('id')
      .eq('channel_id', 'daily_card')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .limit(1);

    if (error) return false;
    return data && data.length > 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BADGES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Award a badge to a user
   */
  async awardBadge(userId, badgeId) {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('badges')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentBadges = user.badges || [];
    if (currentBadges.includes(badgeId)) {
      return { alreadyHas: true };
    }

    const { error } = await supabase
      .from('users')
      .update({
        badges: [...currentBadges, badgeId],
      })
      .eq('id', userId);

    if (error) throw error;
    return { awarded: true, badge: COMMUNITY_BADGES[badgeId] };
  }

  /**
   * Check and award badges based on activity
   */
  async checkBadgeEligibility(userId, stats) {
    const badgesToAward = [];

    // First post badge
    if (stats.totalPosts >= 1 && !stats.badges?.includes('first_post')) {
      badgesToAward.push('first_post');
    }

    // Daily regular badge
    if (stats.dailyCardShares >= 30 && !stats.badges?.includes('daily_regular')) {
      badgesToAward.push('daily_regular');
    }

    // Helpful soul badge
    if (stats.helpfulVotes >= 10 && !stats.badges?.includes('helpful')) {
      badgesToAward.push('helpful');
    }

    // Popular badge
    if (stats.totalLikes >= 50 && !stats.badges?.includes('popular')) {
      badgesToAward.push('popular');
    }

    // Award all eligible badges
    for (const badgeId of badgesToAward) {
      await this.awardBadge(userId, badgeId);
    }

    return badgesToAward;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHANNEL ACCESS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get channels with access info from database
   */
  async getAccessibleChannels(userId) {
    try {
      const { data, error } = await supabase.rpc('get_accessible_channels', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[CommunityService] Failed to get channels:', error);
      // Fallback to local config
      return this.getChannelsFromConfig(userId);
    }
  }

  /**
   * Fallback: Get channels from local config
   */
  getChannelsFromConfig(userTier = 'free') {
    const isPremium = ['premium', 'lifetime', 'admin'].includes(userTier);

    return {
      user_tier: userTier,
      channels: Object.values(COMMUNITY_CHANNELS).map(ch => ({
        id: ch.id,
        name: ch.name,
        description: ch.description,
        icon: ch.icon,
        access_tier: ch.premium ? 'premium' : 'free',
        can_access: ch.premium ? isPremium : true,
        locked: ch.premium && !isPremium,
        sort_order: ch.sortOrder,
      })).sort((a, b) => a.sort_order - b.sort_order)
    };
  }

  /**
   * Check if user can access a specific channel
   */
  async canAccessChannel(userId, channelId) {
    try {
      const { data, error } = await supabase.rpc('can_access_channel', {
        p_user_id: userId,
        p_channel_id: channelId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      // Fallback to local check
      const channel = COMMUNITY_CHANNELS[channelId];
      if (!channel) return false;
      if (!channel.premium) return true;
      // Would need user tier info to check premium access
      return false;
    }
  }
}

export const CommunityService = new CommunityServiceClass();
export default CommunityService;
