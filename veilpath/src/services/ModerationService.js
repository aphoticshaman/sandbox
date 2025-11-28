/**
 * AI-Powered Community Moderation Service
 *
 * Uses Claude to:
 * - Pre-screen posts/messages before publishing
 * - Flag potentially harmful content
 * - Auto-hide spam
 * - Detect mental health concerns (trigger supportive resources)
 * - Summarize long threads
 * - Generate content warnings
 *
 * Philosophy: Err on the side of caution but be helpful, not punitive
 */

import { supabase } from './supabase';

// ═══════════════════════════════════════════════════════════════════════════════
// MODERATION CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const MODERATION_CATEGORIES = {
  safe: {
    action: 'allow',
    description: 'Content is appropriate',
  },
  sensitive: {
    action: 'allow_with_warning',
    description: 'Content may be emotionally sensitive - add content warning',
  },
  mental_health: {
    action: 'allow_with_resources',
    description: 'User may be struggling - show supportive resources',
  },
  spam: {
    action: 'hide',
    description: 'Promotional or repetitive content',
  },
  harassment: {
    action: 'hide_and_flag',
    description: 'Targeted negative behavior toward others',
  },
  harmful: {
    action: 'block',
    description: 'Content that could cause harm',
  },
  off_topic: {
    action: 'allow_with_note',
    description: 'Not related to tarot/wellness - gentle redirect',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODERATION PROMPTS
// ═══════════════════════════════════════════════════════════════════════════════

const MODERATION_PROMPT = `You are a community moderator for VeilPath, a tarot and wellness app.
Your job is to review user-generated content and classify it to keep the community safe and supportive.

VeilPath is a space for:
- Tarot readings and interpretations
- Personal growth and reflection
- Mental wellness and mindfulness
- Supportive community discussions

Review the following content and respond with a JSON object:

{
  "category": "safe|sensitive|mental_health|spam|harassment|harmful|off_topic",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation",
  "contentWarning": "If sensitive, what warning should be shown (or null)",
  "suggestedResources": ["If mental_health, list helpful resources"],
  "summary": "If content is long, a 1-sentence summary"
}

Guidelines:
- Be compassionate - users share vulnerable things about their lives
- "mental_health" is NOT negative - it means the user might benefit from resources
- Tarot discussion about death, challenges, or difficult cards is NORMAL and safe
- Questions about future, relationships, career are normal tarot topics
- Only flag "harmful" for genuinely dangerous content
- "off_topic" is for spam, unrelated promotion, etc.

Content to review:
`;

const MENTAL_HEALTH_RESOURCES = [
  {
    name: 'Crisis Text Line',
    action: 'Text HOME to 741741',
    type: 'crisis',
  },
  {
    name: 'National Suicide Prevention Lifeline',
    action: 'Call or text 988',
    type: 'crisis',
  },
  {
    name: 'SAMHSA National Helpline',
    action: '1-800-662-4357',
    type: 'general',
  },
  {
    name: 'VeilPath Mindfulness Tools',
    action: 'In-app breathing and grounding exercises',
    type: 'self_help',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class ModerationServiceClass {
  constructor() {
    this.cache = new Map(); // Simple cache for repeated content
    this.pendingReviews = new Map();
  }

  /**
   * Pre-screen content before publishing
   * Returns moderation result with recommended action
   */
  async reviewContent(content, { userId, contentType = 'post' } = {}) {
    // Skip very short content
    if (!content || content.length < 10) {
      return {
        category: 'safe',
        action: 'allow',
        confidence: 1.0,
      };
    }

    // Check cache for repeated content (spam detection)
    const contentHash = this.hashContent(content);
    if (this.cache.has(contentHash)) {
      const cached = this.cache.get(contentHash);
      if (Date.now() - cached.timestamp < 60000) { // Within 1 minute
        return {
          category: 'spam',
          action: 'hide',
          confidence: 0.95,
          reasoning: 'Duplicate content detected',
        };
      }
    }

    try {
      const response = await fetch('/api/moderate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          contentType,
          userId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // Fail open - allow content if moderation fails
        console.warn('[Moderation] API error, failing open:', result.error);
        return {
          category: 'safe',
          action: 'allow',
          confidence: 0.5,
          fallback: true,
        };
      }

      const moderation = result.data;

      // Cache this content
      this.cache.set(contentHash, {
        result: moderation,
        timestamp: Date.now(),
      });

      // Map category to action
      const categoryConfig = MODERATION_CATEGORIES[moderation.category] || MODERATION_CATEGORIES.safe;

      return {
        ...moderation,
        action: categoryConfig.action,
        resources: moderation.category === 'mental_health' ? MENTAL_HEALTH_RESOURCES : null,
      };
    } catch (error) {
      console.error('[Moderation] Error:', error);
      // Fail open
      return {
        category: 'safe',
        action: 'allow',
        confidence: 0.5,
        error: error.message,
      };
    }
  }

  /**
   * Quick content check (uses keyword matching, no API call)
   * For real-time typing feedback
   */
  quickCheck(content) {
    const lowered = content.toLowerCase();

    // Crisis keywords - show resources immediately
    const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'want to die', 'self harm'];
    for (const keyword of crisisKeywords) {
      if (lowered.includes(keyword)) {
        return {
          category: 'mental_health',
          action: 'show_resources_immediately',
          resources: MENTAL_HEALTH_RESOURCES.filter(r => r.type === 'crisis'),
          urgent: true,
        };
      }
    }

    // Spam patterns
    const spamPatterns = [
      /buy now/i,
      /click here/i,
      /free money/i,
      /\$\d+.*day/i,
      /www\.[a-z]+\.(com|net|org)/i,
      /bit\.ly/i,
    ];
    for (const pattern of spamPatterns) {
      if (pattern.test(content)) {
        return {
          category: 'spam',
          action: 'warn',
          message: 'This looks like it might be promotional content',
        };
      }
    }

    // All clear
    return {
      category: 'safe',
      action: 'allow',
    };
  }

  /**
   * Log moderation action for analytics/review
   */
  async logModerationAction({ contentId, contentType, userId, result, action }) {
    try {
      await supabase.from('moderation_log').insert({
        content_id: contentId,
        content_type: contentType,
        user_id: userId,
        category: result.category,
        action_taken: action,
        confidence: result.confidence,
        reasoning: result.reasoning,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Moderation] Failed to log:', error);
    }
  }

  /**
   * Get moderation stats for admin dashboard
   */
  async getStats(timeRange = '7d') {
    const daysAgo = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const { data, error } = await supabase
      .from('moderation_log')
      .select('category, action_taken')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Aggregate stats
    const stats = {
      total: data.length,
      byCategory: {},
      byAction: {},
    };

    data.forEach(log => {
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      stats.byAction[log.action_taken] = (stats.byAction[log.action_taken] || 0) + 1;
    });

    return stats;
  }

  /**
   * Report content for manual review
   */
  async reportContent({ contentId, contentType, reporterId, reason, details }) {
    const { data, error } = await supabase
      .from('content_reports')
      .insert({
        content_id: contentId,
        content_type: contentType,
        reporter_id: reporterId,
        reason,
        details,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get pending reports for admin
   */
  async getPendingReports(limit = 50) {
    const { data, error } = await supabase
      .from('content_reports')
      .select(`
        *,
        reporter:reporter_id (display_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Resolve a report
   */
  async resolveReport(reportId, { resolution, moderatorId, action }) {
    const { error } = await supabase
      .from('content_reports')
      .update({
        status: resolution, // 'resolved', 'dismissed', 'escalated'
        resolved_by: moderatorId,
        action_taken: action,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Simple hash for caching
   */
  hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Clean old cache entries
   */
  cleanCache() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

export const ModerationService = new ModerationServiceClass();
export default ModerationService;

// Clean cache periodically
setInterval(() => ModerationService.cleanCache(), 60000);

// ═══════════════════════════════════════════════════════════════════════════════
// STRIKE/BAN SYSTEM
// Integrates with forum_moderation SQL migration
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if user can access forums (read/write)
 * Call this when loading CommunityScreen
 * @returns {Promise<{canRead: boolean, canWrite: boolean, strikeCount: number, restrictions: string[], ...}>}
 */
export async function checkForumAccess(userId) {
  if (!userId) {
    return {
      canRead: false,
      canWrite: false,
      strikeCount: 0,
      restrictions: ['not_authenticated'],
      error: 'User not authenticated',
    };
  }

  try {
    const { data, error } = await supabase.rpc('check_forum_access', {
      p_user_id: userId,
    });

    if (error) throw error;

    return {
      canRead: data.can_read,
      canWrite: data.can_write,
      strikeCount: data.strike_count || 0,
      isBanned: data.is_banned || false,
      bannedAt: data.banned_at,
      banReason: data.ban_reason,
      isSuspended: data.is_suspended || false,
      suspensionEndsAt: data.suspension_ends_at,
      suspensionReason: data.suspension_reason,
      restrictions: data.restrictions || [],
    };
  } catch (error) {
    console.error('[Moderation] Forum access check failed:', error);
    // Fail closed for security - deny access on error
    return {
      canRead: false,
      canWrite: false,
      strikeCount: 0,
      restrictions: ['error'],
      error: error.message,
    };
  }
}

/**
 * Get user's moderation history for profile/settings
 * @returns {Promise<{strikeCount: number, isBanned: boolean, isSuspended: boolean, warnings: Array}>}
 */
export async function getModerationHistory(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase.rpc('get_moderation_history', {
      p_user_id: userId,
    });

    if (error) throw error;

    return {
      strikeCount: data.strike_count || 0,
      isBanned: data.is_banned || false,
      isSuspended: data.is_suspended || false,
      suspensionEndsAt: data.suspension_ends_at,
      warnings: data.warnings || [],
    };
  } catch (error) {
    console.error('[Moderation] Failed to get history:', error);
    return null;
  }
}

/**
 * Submit a report for content (post, comment, or profile)
 * Uses the reported_content table from forum_moderation migration
 */
export async function submitReport({
  reportedUserId,
  contentType, // 'post', 'comment', 'profile'
  contentId,
  contentPreview,
  reason, // 'harassment', 'hate_speech', 'spam', 'inappropriate', 'impersonation', 'other'
  additionalContext,
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Must be logged in to report content' };
  }

  try {
    const { data, error } = await supabase
      .from('reported_content')
      .insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        content_type: contentType,
        content_id: contentId,
        content_preview: contentPreview?.substring(0, 500), // Limit preview length
        reason,
        additional_context: additionalContext,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate report
      if (error.code === '23505') {
        return { success: false, error: 'You have already reported this content' };
      }
      throw error;
    }

    return { success: true, reportId: data.id };
  } catch (error) {
    console.error('[Moderation] Report submission failed:', error);
    return { success: false, error: 'Failed to submit report. Please try again.' };
  }
}

/**
 * Get user's own submitted reports (for transparency)
 */
export async function getMyReports() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('reported_content')
      .select('id, content_type, reason, status, created_at, reviewed_at')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Moderation] Failed to get reports:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRIKE REASON CATEGORIES (for UI display)
// ═══════════════════════════════════════════════════════════════════════════════

export const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or bullying', icon: '😠' },
  { id: 'hate_speech', label: 'Hate speech or discrimination', icon: '🚫' },
  { id: 'spam', label: 'Spam or self-promotion', icon: '📢' },
  { id: 'inappropriate', label: 'Inappropriate content', icon: '⚠️' },
  { id: 'impersonation', label: 'Impersonation', icon: '🎭' },
  { id: 'other', label: 'Other (please explain)', icon: '📝' },
];

export const STRIKE_INFO = {
  1: {
    title: 'First Warning',
    description: 'Your post was removed for violating community guidelines.',
    consequence: 'This is a warning. Please review our community guidelines.',
    icon: '⚠️',
  },
  2: {
    title: 'Second Warning',
    description: 'You have received a second strike on your account.',
    consequence: 'You are suspended from posting for 48 hours.',
    icon: '🚨',
  },
  3: {
    title: 'Account Banned',
    description: 'You have received a third strike.',
    consequence: 'Your forum access has been permanently revoked. No appeals available.',
    icon: '🚫',
  },
};
