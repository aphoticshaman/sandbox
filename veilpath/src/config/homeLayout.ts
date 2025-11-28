/**
 * HOME SCREEN LAYOUT SYSTEM
 *
 * Consistent, predictable layout that NEVER shifts around.
 * Every section has a fixed position. When content isn't available,
 * sections collapse to minimal state - they don't disappear.
 *
 * For the most OCD user ever:
 * - Daily is ALWAYS at the top
 * - Weekly quests are ALWAYS in the same spot
 * - Seasonal is ALWAYS in the same spot
 * - Contest is ALWAYS in the same spot
 * - Holiday is ALWAYS in the same spot (collapsed to "upcoming" bar when inactive)
 */

// =============================================================================
// LAYOUT SLOT DEFINITIONS
// =============================================================================

/**
 * Fixed layout slots - these NEVER change position
 */
export type LayoutSlot =
  | 'daily'           // Always first
  | 'streak'          // Always second
  | 'weekly_quests'   // Always third
  | 'holiday'         // Always fourth (collapses to bar when no active holiday)
  | 'seasonal'        // Always fifth
  | 'contest'         // Always sixth
  | 'rewards';        // Always last

/**
 * The order is FIXED. Period. No exceptions.
 */
export const SLOT_ORDER: readonly LayoutSlot[] = [
  'daily',
  'streak',
  'weekly_quests',
  'holiday',
  'seasonal',
  'contest',
  'rewards',
] as const;

// =============================================================================
// SECTION STATES
// =============================================================================

/**
 * Every section can be in one of these states
 */
export type SectionState =
  | 'expanded'     // Full content visible
  | 'collapsed'    // Minimal bar/strip showing "upcoming" or summary
  | 'minimal'      // Just a thin divider with label (for truly empty)
  | 'loading';     // Skeleton state while fetching

/**
 * What determines section state
 */
export interface SectionStateRules {
  slot: LayoutSlot;
  expandedWhen: StateCondition;
  collapsedWhen: StateCondition;
  minimalWhen: StateCondition;
  neverHide: boolean; // If true, always show at least minimal state
}

export type StateCondition =
  | { type: 'has_active_content' }
  | { type: 'has_upcoming_content'; withinDays: number }
  | { type: 'always' }
  | { type: 'never' }
  | { type: 'user_preference'; preferenceKey: string };

export const SECTION_STATE_RULES: Record<LayoutSlot, SectionStateRules> = {
  daily: {
    slot: 'daily',
    expandedWhen: { type: 'always' },
    collapsedWhen: { type: 'never' },
    minimalWhen: { type: 'never' },
    neverHide: true,
  },
  streak: {
    slot: 'streak',
    expandedWhen: { type: 'always' },
    collapsedWhen: { type: 'user_preference', preferenceKey: 'collapse_streak' },
    minimalWhen: { type: 'never' },
    neverHide: true,
  },
  weekly_quests: {
    slot: 'weekly_quests',
    expandedWhen: { type: 'has_active_content' },
    collapsedWhen: { type: 'never' }, // Always show quests expanded
    minimalWhen: { type: 'never' },
    neverHide: true,
  },
  holiday: {
    slot: 'holiday',
    expandedWhen: { type: 'has_active_content' },
    collapsedWhen: { type: 'has_upcoming_content', withinDays: 30 },
    minimalWhen: { type: 'always' }, // Even if nothing, show "No upcoming holidays"
    neverHide: true,
  },
  seasonal: {
    slot: 'seasonal',
    expandedWhen: { type: 'has_active_content' },
    collapsedWhen: { type: 'has_upcoming_content', withinDays: 14 },
    minimalWhen: { type: 'never' },
    neverHide: true,
  },
  contest: {
    slot: 'contest',
    expandedWhen: { type: 'has_active_content' },
    collapsedWhen: { type: 'has_upcoming_content', withinDays: 7 },
    minimalWhen: { type: 'always' }, // Show "Next contest starts..."
    neverHide: true,
  },
  rewards: {
    slot: 'rewards',
    expandedWhen: { type: 'has_active_content' },
    collapsedWhen: { type: 'never' },
    minimalWhen: { type: 'always' }, // "No rewards to claim"
    neverHide: true,
  },
};

// =============================================================================
// SECTION DIMENSIONS
// =============================================================================

export interface SectionDimensions {
  expandedHeight: number | 'auto';  // px or auto
  collapsedHeight: number;          // px - the thin bar
  minimalHeight: number;            // px - the minimal divider
  marginBottom: number;             // px - consistent spacing
}

export const SECTION_DIMENSIONS: Record<LayoutSlot, SectionDimensions> = {
  daily: {
    expandedHeight: 'auto',
    collapsedHeight: 60,
    minimalHeight: 40,
    marginBottom: 16,
  },
  streak: {
    expandedHeight: 80,
    collapsedHeight: 48,
    minimalHeight: 32,
    marginBottom: 16,
  },
  weekly_quests: {
    expandedHeight: 'auto', // Depends on quest count
    collapsedHeight: 56,
    minimalHeight: 40,
    marginBottom: 16,
  },
  holiday: {
    expandedHeight: 200,    // Full holiday banner with image
    collapsedHeight: 44,    // Thin bar: "🎄 Winter Solstice in 12 days"
    minimalHeight: 36,      // "No upcoming holidays"
    marginBottom: 16,
  },
  seasonal: {
    expandedHeight: 180,
    collapsedHeight: 52,
    minimalHeight: 40,
    marginBottom: 16,
  },
  contest: {
    expandedHeight: 160,
    collapsedHeight: 48,
    minimalHeight: 36,
    marginBottom: 16,
  },
  rewards: {
    expandedHeight: 'auto',
    collapsedHeight: 48,
    minimalHeight: 36,
    marginBottom: 0, // Last section, no bottom margin
  },
};

// =============================================================================
// COLLAPSED STATE CONTENT
// =============================================================================

/**
 * What to show when a section is collapsed to a bar
 */
export interface CollapsedContent {
  icon: string;
  text: string;
  subtext?: string;
  accentColor?: string;
  countdownTo?: Date;
  isClickable: boolean;
}

export interface MinimalContent {
  text: string;
  icon?: string;
}

/**
 * Format date as readable string
 */
function formatEventDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Generate collapsed content for holiday section
 * Shows: "14 days to go until Winter Solstice on Dec 21, 2025"
 */
export function getHolidayCollapsedContent(
  nextHoliday: { name: string; startsAt: Date; icon: string; color: string } | null
): CollapsedContent | MinimalContent {
  if (!nextHoliday) {
    return {
      text: 'No upcoming holidays',
      icon: '📅',
    };
  }

  const daysUntil = Math.ceil(
    (nextHoliday.startsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const dateStr = formatEventDate(nextHoliday.startsAt);

  let text: string;
  if (daysUntil === 0) {
    text = `${nextHoliday.name} starts today!`;
  } else if (daysUntil === 1) {
    text = `1 day to go until ${nextHoliday.name} on ${dateStr}`;
  } else {
    text = `${daysUntil} days to go until ${nextHoliday.name} on ${dateStr}`;
  }

  return {
    icon: nextHoliday.icon,
    text,
    accentColor: nextHoliday.color,
    countdownTo: nextHoliday.startsAt,
    isClickable: true,
  };
}

/**
 * Generate collapsed content for seasonal section
 * Shows: "23 days left in Winter Solstice, ends Feb 28, 2026"
 */
export function getSeasonalCollapsedContent(
  currentSeason: { name: string; endsAt: Date; icon: string } | null,
  nextSeason: { name: string; startsAt: Date; icon: string } | null
): CollapsedContent | MinimalContent {
  if (currentSeason) {
    const daysRemaining = Math.ceil(
      (currentSeason.endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const dateStr = formatEventDate(currentSeason.endsAt);

    let text: string;
    if (daysRemaining === 0) {
      text = `${currentSeason.name} ends today!`;
    } else if (daysRemaining === 1) {
      text = `1 day left in ${currentSeason.name}, ends ${dateStr}`;
    } else {
      text = `${daysRemaining} days left in ${currentSeason.name}, ends ${dateStr}`;
    }

    return {
      icon: currentSeason.icon,
      text,
      isClickable: true,
    };
  }

  if (nextSeason) {
    const daysUntil = Math.ceil(
      (nextSeason.startsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const dateStr = formatEventDate(nextSeason.startsAt);

    let text: string;
    if (daysUntil === 0) {
      text = `${nextSeason.name} starts today!`;
    } else if (daysUntil === 1) {
      text = `1 day until ${nextSeason.name} begins on ${dateStr}`;
    } else {
      text = `${daysUntil} days until ${nextSeason.name} begins on ${dateStr}`;
    }

    return {
      icon: nextSeason.icon,
      text,
      isClickable: true,
    };
  }

  return {
    text: 'Season info unavailable',
    icon: '🌙',
  };
}

/**
 * Generate collapsed content for contest section
 * Shows: "34 days left in Winter Wisdom Championship, ends Dec 31, 2025 (You: #47)"
 */
export function getContestCollapsedContent(
  activeContest: { name: string; endsAt: Date; userRank?: number } | null,
  nextContest: { name: string; startsAt: Date } | null
): CollapsedContent | MinimalContent {
  if (activeContest) {
    const daysRemaining = Math.ceil(
      (activeContest.endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const dateStr = formatEventDate(activeContest.endsAt);

    let text: string;
    const rankText = activeContest.userRank ? ` (You: #${activeContest.userRank})` : '';

    if (daysRemaining === 0) {
      text = `${activeContest.name} ends today!${rankText}`;
    } else if (daysRemaining === 1) {
      text = `1 day left in ${activeContest.name}, ends ${dateStr}${rankText}`;
    } else {
      text = `${daysRemaining} days left in ${activeContest.name}, ends ${dateStr}${rankText}`;
    }

    return {
      icon: '🏆',
      text,
      isClickable: true,
    };
  }

  if (nextContest) {
    const daysUntil = Math.ceil(
      (nextContest.startsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const dateStr = formatEventDate(nextContest.startsAt);

    let text: string;
    if (daysUntil === 0) {
      text = `${nextContest.name} starts today!`;
    } else if (daysUntil === 1) {
      text = `1 day until ${nextContest.name} begins on ${dateStr}`;
    } else {
      text = `${daysUntil} days until ${nextContest.name} begins on ${dateStr}`;
    }

    return {
      icon: '🏆',
      text,
      isClickable: true,
    };
  }

  return {
    text: 'No active contest',
    icon: '🏆',
  };
}

/**
 * Generate collapsed content for rewards section
 */
export function getRewardsCollapsedContent(
  claimableCount: number
): CollapsedContent | MinimalContent {
  if (claimableCount > 0) {
    return {
      icon: '🎁',
      text: `${claimableCount} reward${claimableCount > 1 ? 's' : ''} to claim!`,
      accentColor: '#FFD700',
      isClickable: true,
    };
  }

  return {
    text: 'No rewards to claim',
    icon: '🎁',
  };
}

// =============================================================================
// LAYOUT STATE
// =============================================================================

export interface HomeLayoutState {
  sections: Record<LayoutSlot, SectionLayoutState>;
  isInitialized: boolean;
}

export interface SectionLayoutState {
  slot: LayoutSlot;
  state: SectionState;
  height: number | 'auto';
  isAnimating: boolean;
  content: ExpandedContent | CollapsedContent | MinimalContent | null;
}

export interface ExpandedContent {
  type: 'expanded';
  data: any; // Section-specific data
}

// =============================================================================
// LAYOUT CALCULATION
// =============================================================================

export interface ContentAvailability {
  daily: { hasContent: boolean };
  streak: { hasContent: boolean; days: number };
  weekly_quests: { hasContent: boolean; activeCount: number };
  holiday: {
    hasActive: boolean;
    nextHoliday: { name: string; startsAt: Date; icon: string; color: string } | null;
  };
  seasonal: {
    hasActive: boolean;
    current: { name: string; endsAt: Date; icon: string } | null;
    next: { name: string; startsAt: Date; icon: string } | null;
  };
  contest: {
    hasActive: boolean;
    active: { name: string; endsAt: Date; userRank?: number } | null;
    next: { name: string; startsAt: Date } | null;
  };
  rewards: { hasContent: boolean; claimableCount: number };
}

export function calculateLayoutState(
  availability: ContentAvailability,
  userPreferences: Record<string, boolean> = {}
): HomeLayoutState {
  const sections: Record<LayoutSlot, SectionLayoutState> = {} as any;

  for (const slot of SLOT_ORDER) {
    const rules = SECTION_STATE_RULES[slot];
    const dimensions = SECTION_DIMENSIONS[slot];

    let state: SectionState = 'minimal';
    let content: SectionLayoutState['content'] = null;

    // Determine state based on rules and availability
    switch (slot) {
      case 'daily':
        state = 'expanded';
        break;

      case 'streak':
        state = userPreferences['collapse_streak'] ? 'collapsed' : 'expanded';
        break;

      case 'weekly_quests':
        state = availability.weekly_quests.hasContent ? 'expanded' : 'minimal';
        content = availability.weekly_quests.hasContent
          ? null // Expanded content handled separately
          : { text: 'New quests coming soon', icon: '📜' };
        break;

      case 'holiday':
        if (availability.holiday.hasActive) {
          state = 'expanded';
        } else if (availability.holiday.nextHoliday) {
          state = 'collapsed';
          content = getHolidayCollapsedContent(availability.holiday.nextHoliday);
        } else {
          state = 'minimal';
          content = { text: 'No upcoming holidays', icon: '📅' };
        }
        break;

      case 'seasonal':
        if (availability.seasonal.hasActive) {
          state = 'expanded';
        } else if (availability.seasonal.next) {
          state = 'collapsed';
          content = getSeasonalCollapsedContent(
            availability.seasonal.current,
            availability.seasonal.next
          );
        } else {
          state = 'minimal';
          content = { text: 'Between seasons', icon: '🌙' };
        }
        break;

      case 'contest':
        if (availability.contest.hasActive) {
          state = 'expanded';
        } else if (availability.contest.next) {
          state = 'collapsed';
          content = getContestCollapsedContent(
            availability.contest.active,
            availability.contest.next
          );
        } else {
          state = 'minimal';
          content = { text: 'No active contest', icon: '🏆' };
        }
        break;

      case 'rewards':
        if (availability.rewards.hasContent) {
          state = 'expanded';
        } else {
          state = 'minimal';
          content = getRewardsCollapsedContent(0);
        }
        break;
    }

    // Calculate height based on state
    let height: number | 'auto';
    switch (state) {
      case 'expanded':
        height = dimensions.expandedHeight;
        break;
      case 'collapsed':
        height = dimensions.collapsedHeight;
        break;
      case 'minimal':
        height = dimensions.minimalHeight;
        break;
      case 'loading':
        height = dimensions.collapsedHeight;
        break;
    }

    sections[slot] = {
      slot,
      state,
      height,
      isAnimating: false,
      content,
    };
  }

  return {
    sections,
    isInitialized: true,
  };
}

// =============================================================================
// COLLAPSED BAR COMPONENT CONFIG
// =============================================================================

export interface CollapsedBarStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  iconSize: number;
  padding: [number, number]; // [vertical, horizontal]
  borderRadius: number;
  fontSize: number;
  fontWeight: number;
}

export const COLLAPSED_BAR_STYLES: Record<'default' | 'highlighted' | 'countdown', CollapsedBarStyle> = {
  default: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textColor: 'rgba(255, 255, 255, 0.7)',
    iconSize: 18,
    padding: [10, 16],
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  highlighted: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    borderColor: 'rgba(123, 104, 238, 0.3)',
    textColor: 'rgba(255, 255, 255, 0.9)',
    iconSize: 20,
    padding: [12, 16],
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
  },
  countdown: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    textColor: '#FFD700',
    iconSize: 20,
    padding: [12, 16],
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
  },
};

// =============================================================================
// MINIMAL DIVIDER COMPONENT CONFIG
// =============================================================================

export interface MinimalDividerStyle {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  padding: [number, number];
  opacity: number;
}

export const MINIMAL_DIVIDER_STYLE: MinimalDividerStyle = {
  backgroundColor: 'transparent',
  textColor: 'rgba(255, 255, 255, 0.4)',
  fontSize: 12,
  padding: [8, 16],
  opacity: 0.6,
};

// =============================================================================
// TRANSITION ANIMATIONS
// =============================================================================

export interface LayoutTransition {
  duration: number; // ms
  easing: string;
  properties: string[];
}

export const LAYOUT_TRANSITIONS: Record<string, LayoutTransition> = {
  expand: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    properties: ['height', 'opacity', 'transform'],
  },
  collapse: {
    duration: 250,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    properties: ['height', 'opacity', 'transform'],
  },
  stateChange: {
    duration: 200,
    easing: 'ease-out',
    properties: ['background-color', 'border-color', 'color'],
  },
};

// =============================================================================
// UPCOMING HOLIDAYS CALENDAR
// =============================================================================

export interface UpcomingHoliday {
  id: string;
  name: string;
  date: Date;
  icon: string;
  color: string;
  description: string;
}

/**
 * Get upcoming holidays for the next N days
 */
export function getUpcomingHolidays(withinDays: number = 90): UpcomingHoliday[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;

  // Define all holidays (these would come from config/database in production)
  const allHolidays: UpcomingHoliday[] = [
    // Q4 2025
    { id: 'thanksgiving_2025', name: 'Gratitude Week', date: new Date(2025, 10, 27), icon: '🦃', color: '#D2691E', description: 'A time for gratitude and reflection' },
    { id: 'winter_solstice_2025', name: 'Winter Solstice', date: new Date(2025, 11, 21), icon: '❄️', color: '#4169E1', description: 'The return of the light' },
    { id: 'new_year_2026', name: 'New Year', date: new Date(2025, 11, 31), icon: '🎆', color: '#FFD700', description: 'New beginnings await' },
    // Q1 2026
    { id: 'imbolc_2026', name: 'Imbolc', date: new Date(2026, 1, 1), icon: '🕯️', color: '#FFFACD', description: 'First stirrings of spring' },
    { id: 'valentines_2026', name: 'Valentine\'s Week', date: new Date(2026, 1, 14), icon: '💕', color: '#FF69B4', description: 'Love and connection' },
    { id: 'spring_equinox_2026', name: 'Spring Equinox', date: new Date(2026, 2, 20), icon: '🌸', color: '#98FB98', description: 'Balance and renewal' },
  ];

  // Filter to upcoming within the window
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return allHolidays
    .filter(h => h.date > now && h.date <= cutoff)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get the next upcoming holiday
 */
export function getNextHoliday(): UpcomingHoliday | null {
  const upcoming = getUpcomingHolidays(365);
  return upcoming[0] || null;
}

// =============================================================================
// CSS GENERATION
// =============================================================================

export function generateSectionStyles(
  section: SectionLayoutState
): React.CSSProperties {
  const dimensions = SECTION_DIMENSIONS[section.slot];

  return {
    height: section.height === 'auto' ? 'auto' : section.height,
    marginBottom: dimensions.marginBottom,
    overflow: 'hidden',
    transition: `height ${LAYOUT_TRANSITIONS.expand.duration}ms ${LAYOUT_TRANSITIONS.expand.easing}`,
  };
}

export function generateCollapsedBarStyles(
  content: CollapsedContent,
  variant: 'default' | 'highlighted' | 'countdown' = 'default'
): React.CSSProperties {
  const style = COLLAPSED_BAR_STYLES[content.countdownTo ? 'countdown' : variant];

  return {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: content.accentColor
      ? `${content.accentColor}15`
      : style.backgroundColor,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: content.accentColor
      ? `${content.accentColor}30`
      : style.borderColor,
    borderRadius: style.borderRadius,
    padding: `${style.padding[0]}px ${style.padding[1]}px`,
    color: content.accentColor || style.textColor,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    cursor: content.isClickable ? 'pointer' : 'default',
    transition: `all ${LAYOUT_TRANSITIONS.stateChange.duration}ms ${LAYOUT_TRANSITIONS.stateChange.easing}`,
  };
}

export function generateMinimalDividerStyles(): React.CSSProperties {
  const style = MINIMAL_DIVIDER_STYLE;

  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: `${style.padding[0]}px ${style.padding[1]}px`,
    color: style.textColor,
    fontSize: style.fontSize,
    opacity: style.opacity,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  SLOT_ORDER,
  SECTION_STATE_RULES,
  SECTION_DIMENSIONS,
  COLLAPSED_BAR_STYLES,
  MINIMAL_DIVIDER_STYLE,
  LAYOUT_TRANSITIONS,
  calculateLayoutState,
  getHolidayCollapsedContent,
  getSeasonalCollapsedContent,
  getContestCollapsedContent,
  getRewardsCollapsedContent,
  getUpcomingHolidays,
  getNextHoliday,
  generateSectionStyles,
  generateCollapsedBarStyles,
  generateMinimalDividerStyles,
};
