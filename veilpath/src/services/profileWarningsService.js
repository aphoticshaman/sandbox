/**
 * Profile Warnings Service
 *
 * Shows users what's incomplete and WHY it matters.
 * Dismissable but persistent - we remind, not nag.
 *
 * NO SUPPORT POLICY:
 * - We don't delete accounts
 * - We don't verify identities
 * - We don't restore data
 * - We don't reset passwords manually
 * - Zero-knowledge = zero ability to help with recovery
 * - You set up recovery or you accept the risk. Period.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  DISMISSED_WARNINGS: 'veilpath_dismissed_warnings',
  LAST_WARNING_SHOWN: 'veilpath_last_warning_shown',
};

// Minimum hours between showing the same warning again after dismissal
const WARNING_COOLDOWN_HOURS = 72; // 3 days

/**
 * Warning definitions with severity, impact, and user-facing explanation
 */
export const PROFILE_WARNINGS = {
  // CRITICAL - Account access at risk
  NO_RECOVERY_SETUP: {
    id: 'no_recovery_setup',
    severity: 'critical',
    icon: '⚠️',
    title: 'Account Recovery Not Set Up',
    shortMessage: 'Forget your password = lose everything',
    fullMessage: `
You haven't set up account recovery (security image + questions).

**What this means:**
If you forget your encryption password, your journals, readings, and all personal data will be **permanently lost**. Not temporarily locked - GONE. Forever.

**Why we can't help:**
- We don't store your password or encryption keys
- We can't verify your identity
- We have no way to recover your data
- This is a one-person operation with zero support capacity

**Your data, your responsibility.**

Set up recovery now, or accept that forgetting your password means losing everything.
    `.trim(),
    actionLabel: 'Set Up Recovery',
    actionRoute: '/settings/security/recovery',
    dismissable: true,
    showOnLogin: true,
  },

  // HIGH - Major feature degradation
  NO_MBTI: {
    id: 'no_mbti',
    severity: 'high',
    icon: '🧠',
    title: 'MBTI Not Set',
    shortMessage: 'Personalization is generic without your type',
    fullMessage: `
You haven't set your MBTI personality type.

**What you're missing:**
- Journal prompts tailored to how you process emotions
- Tarot interpretations that speak to YOUR cognitive style
- Insights that match your decision-making patterns
- Progress tracking calibrated to your personality

**Without MBTI:**
Everything is generic. One-size-fits-all. You'll get the same prompts and insights as everyone else.

It takes 2 minutes. Your experience will be 10x better.
    `.trim(),
    actionLabel: 'Set MBTI Type',
    actionRoute: '/settings/profile/mbti',
    dismissable: true,
    showOnLogin: false, // Show in-app, not blocking login
  },

  // MEDIUM - Feature enhancement
  NO_ZODIAC: {
    id: 'no_zodiac',
    severity: 'medium',
    icon: '♈',
    title: 'Birth Chart Not Set',
    shortMessage: 'Astrological insights unavailable',
    fullMessage: `
You haven't added your birth date/time/location.

**What you're missing:**
- Daily card draws aligned with planetary transits
- Moon phase-aware journaling prompts
- Astrological context in your tarot readings
- Birth chart integration with card meanings

This is totally optional - tarot works without astrology. But if you're into it, the integration is pretty cool.
    `.trim(),
    actionLabel: 'Add Birth Info',
    actionRoute: '/settings/profile/astrology',
    dismissable: true,
    showOnLogin: false,
  },

  // INFO - Nice to have
  PROFILE_INCOMPLETE: {
    id: 'profile_incomplete',
    severity: 'info',
    icon: '📝',
    title: 'Profile Incomplete',
    shortMessage: 'Add details for a more personal experience',
    fullMessage: `
Your profile is missing some optional details.

This doesn't affect security or core features - just personalization touches like using your preferred name in prompts.
    `.trim(),
    actionLabel: 'Complete Profile',
    actionRoute: '/settings/profile',
    dismissable: true,
    showOnLogin: false,
  },
};

/**
 * Check which warnings apply to the current user
 *
 * @param {Object} userState - Current user state from stores
 * @returns {Object[]} Array of applicable warnings
 */
export async function getActiveWarnings(userState) {
  const {
    hasRecoverySetup = false,
    mbtiType = null,
    zodiacSign = null,
    birthdate = null,
    displayName = null,
  } = userState;

  const warnings = [];

  // Critical: No recovery setup
  if (!hasRecoverySetup) {
    warnings.push(PROFILE_WARNINGS.NO_RECOVERY_SETUP);
  }

  // High: No MBTI
  if (!mbtiType) {
    warnings.push(PROFILE_WARNINGS.NO_MBTI);
  }

  // Medium: No zodiac/birth info
  if (!zodiacSign && !birthdate) {
    warnings.push(PROFILE_WARNINGS.NO_ZODIAC);
  }

  // Info: Profile incomplete (if missing display name and other optional stuff)
  if (!displayName) {
    warnings.push(PROFILE_WARNINGS.PROFILE_INCOMPLETE);
  }

  // Filter out recently dismissed warnings
  const dismissedData = await getDismissedWarnings();
  const now = Date.now();

  return warnings.filter(warning => {
    const dismissedAt = dismissedData[warning.id];
    if (!dismissedAt) return true; // Never dismissed

    const hoursSinceDismissal = (now - dismissedAt) / (1000 * 60 * 60);
    return hoursSinceDismissal > WARNING_COOLDOWN_HOURS;
  });
}

/**
 * Get warnings that should show on login (critical ones)
 */
export async function getLoginWarnings(userState) {
  const allWarnings = await getActiveWarnings(userState);
  return allWarnings.filter(w => w.showOnLogin);
}

/**
 * Get warnings for the settings/profile page (all applicable)
 */
export async function getSettingsWarnings(userState) {
  const allWarnings = await getActiveWarnings(userState);
  return allWarnings.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, info: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Dismiss a warning (with cooldown)
 */
export async function dismissWarning(warningId) {
  const dismissed = await getDismissedWarnings();
  dismissed[warningId] = Date.now();
  await AsyncStorage.setItem(STORAGE_KEYS.DISMISSED_WARNINGS, JSON.stringify(dismissed));
}

/**
 * Get dismissed warnings data
 */
async function getDismissedWarnings() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DISMISSED_WARNINGS);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Clear all dismissed warnings (for testing or user request)
 */
export async function clearDismissedWarnings() {
  await AsyncStorage.removeItem(STORAGE_KEYS.DISMISSED_WARNINGS);
}

/**
 * No-support policy explanation (shown when user asks for help)
 */
export const NO_SUPPORT_POLICY = {
  title: "We Can't Help With Account Recovery",
  icon: '🚫',
  message: `
**VeilPath uses true zero-knowledge encryption.**

This means:
- We don't store your password or encryption keys
- We cannot see your data - ever
- We cannot reset your password
- We cannot "verify it's really you" and restore access

**This is by design, not a limitation.**
True privacy means no backdoors - not for hackers, not for governments, not for us.

**If you forgot your password:**
- With recovery set up: Use your security image + questions
- Without recovery: Your data is gone. There's nothing anyone can do.

**Please set up recovery if you haven't.**
It takes 5 minutes and it's the only safety net that exists.
  `.trim(),
};

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity) {
  switch (severity) {
    case 'critical': return '#DC2626'; // Red
    case 'high': return '#F59E0B'; // Amber
    case 'medium': return '#3B82F6'; // Blue
    case 'info': return '#6B7280'; // Gray
    default: return '#6B7280';
  }
}

/**
 * Get severity badge text
 */
export function getSeverityBadge(severity) {
  switch (severity) {
    case 'critical': return 'CRITICAL';
    case 'high': return 'IMPORTANT';
    case 'medium': return 'RECOMMENDED';
    case 'info': return 'OPTIONAL';
    default: return '';
  }
}

export default {
  PROFILE_WARNINGS,
  NO_SUPPORT_POLICY,
  getActiveWarnings,
  getLoginWarnings,
  getSettingsWarnings,
  dismissWarning,
  clearDismissedWarnings,
  getSeverityColor,
  getSeverityBadge,
};
