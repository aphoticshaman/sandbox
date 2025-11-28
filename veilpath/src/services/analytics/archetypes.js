/**
 * UX-SDPM ARCHETYPES (Simplified)
 *
 * 7-dimensional user behavior vectors mapped to 4 actionable segments.
 * Derived from SDPM Patent #467, adapted for user classification.
 *
 * No ML. No evolutionary optimizers. Just math on user metrics.
 */

// Total features in VeilPath (for mastery calculation)
const TOTAL_FEATURES = 15;

/**
 * Compute 7D archetype vector from user metrics
 * Each dimension is 0-1
 */
export function computeArchetypeVector(userMetrics) {
  const {
    totalSessions = 0,
    sessionConsistency = 0, // 0-1, how regular is their schedule
    journalEntriesCreated = 0,
    readingsStarted = 0,
    readingsCompleted = 0,
    shareCount = 0,
    referralsSent = 0,
    feedbackGiven = 0,
    analyticsViews = 0,
    featuresUsed = 0,
  } = userMetrics;

  // Avoid division by zero
  const sessions = Math.max(totalSessions, 1);
  const readings = Math.max(readingsStarted, 1);

  return {
    // D1: Stability - Are they consistent users?
    stability: sessionConsistency,

    // D2: Creativity - Do they create content?
    creativity: Math.min(1, journalEntriesCreated / sessions),

    // D3: Agency - Do they complete what they start?
    agency: readingsCompleted / readings,

    // D4: Connection - Are they social?
    connection: Math.min(1, (shareCount + referralsSent) / 10),

    // D5: Expression - Do they give feedback?
    expression: feedbackGiven > 0 ? 0.8 : 0.2,

    // D6: Insight - Do they check their stats?
    insight: Math.min(1, analyticsViews / sessions),

    // D7: Mastery - How many features have they used?
    mastery: featuresUsed / TOTAL_FEATURES,
  };
}

/**
 * Classify user into one of 4 actionable segments
 *
 * power_user: High agency, high mastery - your best users
 * social_butterfly: High connection - your growth engine
 * at_risk: Low stability, low agency - need intervention
 * casual_user: Everyone else - need activation
 */
export function classifyArchetype(vector) {
  const { stability, agency, connection, mastery } = vector;

  // Power users: they complete things and use advanced features
  if (agency > 0.7 && mastery > 0.6) {
    return 'power_user';
  }

  // Social butterflies: they share and connect
  if (connection > 0.6) {
    return 'social_butterfly';
  }

  // At risk: inconsistent and don't complete things
  if (stability < 0.3 && agency < 0.4) {
    return 'at_risk';
  }

  // Everyone else is casual
  return 'casual_user';
}

/**
 * Get archetype details for display
 */
export function getArchetypeDetails(archetype) {
  const ARCHETYPES = {
    power_user: {
      name: 'Power User',
      description: 'You use VeilPath to its fullest potential',
      color: '#FFD700', // Gold
      icon: '⚡',
      retention_risk: 'low',
      recommended_action: 'Offer beta features, ask for testimonials',
    },
    social_butterfly: {
      name: 'Social Butterfly',
      description: 'You love sharing insights with others',
      color: '#FF69B4', // Pink
      icon: '🦋',
      retention_risk: 'low',
      recommended_action: 'Referral incentives, community features',
    },
    at_risk: {
      name: 'Explorer',
      description: 'Still finding your path with VeilPath',
      color: '#FFA500', // Orange
      icon: '🔍',
      retention_risk: 'high',
      recommended_action: 'Onboarding nudges, streak reminders',
    },
    casual_user: {
      name: 'Casual Reader',
      description: 'You check in when the mood strikes',
      color: '#87CEEB', // Sky blue
      icon: '🌙',
      retention_risk: 'medium',
      recommended_action: 'Feature discovery, engagement hooks',
    },
  };

  return ARCHETYPES[archetype] || ARCHETYPES.casual_user;
}

/**
 * Compute archetype from user store (convenience function)
 */
export function computeUserArchetype(userStore) {
  const stats = userStore.stats || {};
  const metrics = {
    totalSessions: stats.totalSessions || 0,
    sessionConsistency: calculateSessionConsistency(userStore),
    journalEntriesCreated: stats.journalEntriesCreated || 0,
    readingsStarted: stats.totalReadings || 0,
    readingsCompleted: stats.readingsCompleted || stats.totalReadings || 0,
    shareCount: stats.shareCount || 0,
    referralsSent: stats.referralsSent || 0,
    feedbackGiven: stats.feedbackGiven || 0,
    analyticsViews: stats.analyticsViews || 0,
    featuresUsed: countFeaturesUsed(stats),
  };

  const vector = computeArchetypeVector(metrics);
  const archetype = classifyArchetype(vector);

  return {
    vector,
    archetype,
    details: getArchetypeDetails(archetype),
  };
}

/**
 * Calculate session consistency (0-1)
 * Higher = more regular usage pattern
 */
function calculateSessionConsistency(userStore) {
  const streak = userStore.streak || {};
  const currentStreak = streak.current || 0;
  const longestStreak = streak.longest || 0;

  // Simple heuristic: current streak / longest streak
  // If they're maintaining their best streak, they're consistent
  if (longestStreak === 0) return 0;

  return Math.min(1, currentStreak / Math.max(longestStreak, 7));
}

/**
 * Count distinct features used
 */
function countFeaturesUsed(stats) {
  let count = 0;

  if (stats.totalReadings > 0) count++;
  if (stats.journalEntriesCreated > 0) count++;
  if (stats.veraMessagesCount > 0) count++;
  if (stats.mindfulnessMinutes > 0) count++;
  if (stats.cbtSessionsCompleted > 0) count++;
  if (stats.dbtSessionsCompleted > 0) count++;
  if (stats.achievementsUnlocked > 0) count++;
  if (stats.skillPointsSpent > 0) count++;
  if (stats.shareCount > 0) count++;
  if (stats.exportCount > 0) count++;
  if (stats.notificationsEnabled) count++;
  if (stats.profileCompleted) count++;

  return count;
}

export default {
  computeArchetypeVector,
  classifyArchetype,
  getArchetypeDetails,
  computeUserArchetype,
};
