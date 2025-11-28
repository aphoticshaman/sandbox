/**
 * HOME SCREEN NAVIGATION & INTERACTIONS
 *
 * Everything is clickable. Everything takes you where you need to go.
 * Don't make users think - just let them click the content itself.
 *
 * Principles:
 * - No "click here" links - the content IS the link
 * - Every card, box, and section is tappable
 * - Clear visual affordances (underlines, hover states, cursor changes)
 * - Consistent interaction patterns throughout
 */

// =============================================================================
// NAVIGATION DESTINATIONS
// =============================================================================

export type NavigationDestination =
  // Main screens
  | { type: 'screen'; screen: AppScreen }
  // Modals/overlays
  | { type: 'modal'; modal: ModalType; params?: Record<string, any> }
  // External
  | { type: 'external'; url: string }
  // In-page
  | { type: 'section'; sectionId: string }
  // Actions
  | { type: 'action'; action: string; params?: Record<string, any> };

export type AppScreen =
  | 'home'
  | 'reading'
  | 'reading_new'
  | 'journal'
  | 'journal_entry'
  | 'collection'
  | 'shop'
  | 'settings'
  | 'profile'
  | 'quests'
  | 'quest_detail'
  | 'achievements'
  | 'achievement_detail'
  | 'events'
  | 'event_detail'
  | 'contest'
  | 'contest_leaderboard'
  | 'seasonal'
  | 'seasonal_rewards'
  | 'card_library'
  | 'card_detail'
  | 'cosmetics'
  | 'cosmetic_preview'
  | 'animation_preview';

export type ModalType =
  | 'quest_detail'
  | 'reward_claim'
  | 'event_info'
  | 'contest_rules'
  | 'achievement_unlock'
  | 'item_preview'
  | 'confirm_action'
  | 'share'
  | 'filter';

// =============================================================================
// INTERACTIVE ELEMENT CONFIG
// =============================================================================

export interface InteractiveElement {
  id: string;
  elementType: ElementType;
  destination: NavigationDestination;

  // Visual affordance
  affordance: VisualAffordance;

  // Accessibility
  ariaLabel: string;
  role: 'button' | 'link' | 'menuitem';

  // Interaction feedback
  hapticFeedback?: 'light' | 'medium' | 'heavy';
  soundEffect?: string;
}

export type ElementType =
  | 'card'        // Tappable card/box
  | 'row'         // List row
  | 'text'        // Inline text link
  | 'image'       // Tappable image
  | 'badge'       // Tappable badge/chip
  | 'progress'    // Progress bar (tap for details)
  | 'banner'      // Full-width banner
  | 'button'      // Explicit button
  | 'icon';       // Icon button

export interface VisualAffordance {
  // Cursor
  cursor: 'pointer' | 'default';

  // Hover state
  hoverEffect: 'lift' | 'glow' | 'darken' | 'underline' | 'scale' | 'none';
  hoverScale?: number;
  hoverOpacity?: number;

  // Active/pressed state
  activeScale?: number;
  activeOpacity?: number;

  // For text links
  textDecoration?: 'underline' | 'none';
  textDecorationOnHover?: 'underline' | 'none';
  linkColor?: string;

  // For cards
  elevation?: number;
  elevationOnHover?: number;

  // Transition
  transitionDuration: number; // ms
}

// =============================================================================
// DEFAULT AFFORDANCES BY ELEMENT TYPE
// =============================================================================

export const DEFAULT_AFFORDANCES: Record<ElementType, VisualAffordance> = {
  card: {
    cursor: 'pointer',
    hoverEffect: 'lift',
    hoverScale: 1.02,
    activeScale: 0.98,
    elevation: 2,
    elevationOnHover: 8,
    transitionDuration: 150,
  },
  row: {
    cursor: 'pointer',
    hoverEffect: 'darken',
    hoverOpacity: 0.9,
    activeOpacity: 0.7,
    transitionDuration: 100,
  },
  text: {
    cursor: 'pointer',
    hoverEffect: 'underline',
    textDecoration: 'underline',
    textDecorationOnHover: 'underline',
    linkColor: '#7B68EE',
    transitionDuration: 100,
  },
  image: {
    cursor: 'pointer',
    hoverEffect: 'scale',
    hoverScale: 1.05,
    activeScale: 0.95,
    transitionDuration: 200,
  },
  badge: {
    cursor: 'pointer',
    hoverEffect: 'glow',
    hoverScale: 1.1,
    activeScale: 0.9,
    transitionDuration: 150,
  },
  progress: {
    cursor: 'pointer',
    hoverEffect: 'glow',
    transitionDuration: 150,
  },
  banner: {
    cursor: 'pointer',
    hoverEffect: 'darken',
    hoverOpacity: 0.95,
    activeOpacity: 0.85,
    transitionDuration: 150,
  },
  button: {
    cursor: 'pointer',
    hoverEffect: 'lift',
    hoverScale: 1.02,
    activeScale: 0.96,
    elevation: 4,
    elevationOnHover: 8,
    transitionDuration: 100,
  },
  icon: {
    cursor: 'pointer',
    hoverEffect: 'scale',
    hoverScale: 1.15,
    activeScale: 0.85,
    transitionDuration: 100,
  },
};

// =============================================================================
// HOME SCREEN INTERACTIVE ELEMENTS
// =============================================================================

export const HOME_INTERACTIONS: InteractiveElement[] = [
  // Daily Message
  {
    id: 'daily_message_card',
    elementType: 'card',
    destination: { type: 'action', action: 'expand_message' },
    affordance: DEFAULT_AFFORDANCES.card,
    ariaLabel: 'View full daily message',
    role: 'button',
    hapticFeedback: 'light',
  },
  {
    id: 'daily_message_action',
    elementType: 'text',
    destination: { type: 'screen', screen: 'reading_new' },
    affordance: {
      ...DEFAULT_AFFORDANCES.text,
      linkColor: '#FFD700',
    },
    ariaLabel: 'Start a new reading',
    role: 'link',
  },

  // Streak
  {
    id: 'streak_card',
    elementType: 'card',
    destination: { type: 'screen', screen: 'profile' },
    affordance: DEFAULT_AFFORDANCES.card,
    ariaLabel: 'View your streak details and history',
    role: 'link',
    hapticFeedback: 'light',
  },

  // Weekly Quest Card
  {
    id: 'quest_card',
    elementType: 'card',
    destination: { type: 'modal', modal: 'quest_detail', params: { questId: '' } }, // questId filled at runtime
    affordance: DEFAULT_AFFORDANCES.card,
    ariaLabel: 'View quest details and progress',
    role: 'button',
    hapticFeedback: 'medium',
  },
  {
    id: 'quest_progress_bar',
    elementType: 'progress',
    destination: { type: 'modal', modal: 'quest_detail', params: { questId: '' } },
    affordance: DEFAULT_AFFORDANCES.progress,
    ariaLabel: 'View quest objectives',
    role: 'button',
  },
  {
    id: 'quest_reward_preview',
    elementType: 'badge',
    destination: { type: 'modal', modal: 'item_preview' },
    affordance: DEFAULT_AFFORDANCES.badge,
    ariaLabel: 'Preview quest reward',
    role: 'button',
  },
  {
    id: 'view_all_quests',
    elementType: 'text',
    destination: { type: 'screen', screen: 'quests' },
    affordance: DEFAULT_AFFORDANCES.text,
    ariaLabel: 'View all available quests',
    role: 'link',
  },

  // Events
  {
    id: 'event_banner',
    elementType: 'banner',
    destination: { type: 'screen', screen: 'event_detail' },
    affordance: DEFAULT_AFFORDANCES.banner,
    ariaLabel: 'View event details',
    role: 'link',
    hapticFeedback: 'light',
  },
  {
    id: 'event_reward_item',
    elementType: 'image',
    destination: { type: 'modal', modal: 'item_preview' },
    affordance: DEFAULT_AFFORDANCES.image,
    ariaLabel: 'Preview event reward',
    role: 'button',
  },
  {
    id: 'event_featured_item',
    elementType: 'card',
    destination: { type: 'screen', screen: 'shop' },
    affordance: DEFAULT_AFFORDANCES.card,
    ariaLabel: 'View in shop',
    role: 'link',
  },

  // Contest
  {
    id: 'contest_banner',
    elementType: 'banner',
    destination: { type: 'screen', screen: 'contest' },
    affordance: DEFAULT_AFFORDANCES.banner,
    ariaLabel: 'View contest details and rules',
    role: 'link',
    hapticFeedback: 'medium',
  },
  {
    id: 'contest_leaderboard_row',
    elementType: 'row',
    destination: { type: 'screen', screen: 'contest_leaderboard' },
    affordance: DEFAULT_AFFORDANCES.row,
    ariaLabel: 'View full leaderboard',
    role: 'link',
  },
  {
    id: 'contest_your_rank',
    elementType: 'card',
    destination: { type: 'screen', screen: 'contest' },
    affordance: {
      ...DEFAULT_AFFORDANCES.card,
      hoverEffect: 'glow',
    },
    ariaLabel: 'View your contest progress and rank',
    role: 'link',
  },
  {
    id: 'contest_tier_rewards',
    elementType: 'badge',
    destination: { type: 'modal', modal: 'item_preview' },
    affordance: DEFAULT_AFFORDANCES.badge,
    ariaLabel: 'Preview tier rewards',
    role: 'button',
  },

  // Seasonal
  {
    id: 'seasonal_banner',
    elementType: 'banner',
    destination: { type: 'screen', screen: 'seasonal' },
    affordance: DEFAULT_AFFORDANCES.banner,
    ariaLabel: 'View seasonal event details',
    role: 'link',
    hapticFeedback: 'light',
  },
  {
    id: 'seasonal_quest',
    elementType: 'row',
    destination: { type: 'modal', modal: 'quest_detail' },
    affordance: DEFAULT_AFFORDANCES.row,
    ariaLabel: 'View seasonal quest',
    role: 'button',
  },
  {
    id: 'seasonal_reward',
    elementType: 'card',
    destination: { type: 'screen', screen: 'seasonal_rewards' },
    affordance: DEFAULT_AFFORDANCES.card,
    ariaLabel: 'View how to earn this reward',
    role: 'link',
  },
  {
    id: 'seasonal_lore',
    elementType: 'text',
    destination: { type: 'action', action: 'open_lore', params: { chapterId: '' } },
    affordance: DEFAULT_AFFORDANCES.text,
    ariaLabel: 'Read seasonal lore',
    role: 'link',
  },
  {
    id: 'seasonal_countdown',
    elementType: 'badge',
    destination: { type: 'section', sectionId: 'seasonal_info' },
    affordance: DEFAULT_AFFORDANCES.badge,
    ariaLabel: 'View season dates',
    role: 'button',
  },

  // Rewards/Achievements
  {
    id: 'reward_card',
    elementType: 'card',
    destination: { type: 'modal', modal: 'reward_claim' },
    affordance: {
      ...DEFAULT_AFFORDANCES.card,
      hoverEffect: 'glow',
      elevation: 4,
      elevationOnHover: 12,
    },
    ariaLabel: 'Claim this reward',
    role: 'button',
    hapticFeedback: 'heavy',
    soundEffect: 'reward_hover',
  },
  {
    id: 'achievement_card',
    elementType: 'card',
    destination: { type: 'screen', screen: 'achievement_detail' },
    affordance: DEFAULT_AFFORDANCES.card,
    ariaLabel: 'View achievement details',
    role: 'link',
  },
  {
    id: 'view_all_achievements',
    elementType: 'text',
    destination: { type: 'screen', screen: 'achievements' },
    affordance: DEFAULT_AFFORDANCES.text,
    ariaLabel: 'View all achievements',
    role: 'link',
  },
];

// =============================================================================
// NAVIGATION HELPERS
// =============================================================================

export function getInteractionForElement(elementId: string): InteractiveElement | undefined {
  return HOME_INTERACTIONS.find(i => i.id === elementId);
}

export function createNavigation(
  element: InteractiveElement,
  params?: Record<string, any>
): NavigationDestination {
  const dest = { ...element.destination };

  // Merge runtime params
  if (params && (dest.type === 'modal' || dest.type === 'action')) {
    dest.params = { ...dest.params, ...params };
  }

  return dest;
}

// =============================================================================
// CSS GENERATION FOR AFFORDANCES
// =============================================================================

export function generateAffordanceStyles(affordance: VisualAffordance): React.CSSProperties {
  return {
    cursor: affordance.cursor,
    transition: `all ${affordance.transitionDuration}ms ease-out`,
    textDecoration: affordance.textDecoration,
    color: affordance.linkColor,
  };
}

export function generateHoverStyles(affordance: VisualAffordance): React.CSSProperties {
  const styles: React.CSSProperties = {};

  switch (affordance.hoverEffect) {
    case 'lift':
      styles.transform = `translateY(-2px) scale(${affordance.hoverScale || 1})`;
      styles.boxShadow = `0 ${(affordance.elevationOnHover || 8)}px ${(affordance.elevationOnHover || 8) * 2}px rgba(0,0,0,0.2)`;
      break;
    case 'glow':
      styles.boxShadow = '0 0 20px rgba(123, 104, 238, 0.5)';
      styles.transform = `scale(${affordance.hoverScale || 1})`;
      break;
    case 'darken':
      styles.opacity = affordance.hoverOpacity;
      break;
    case 'underline':
      styles.textDecoration = affordance.textDecorationOnHover;
      break;
    case 'scale':
      styles.transform = `scale(${affordance.hoverScale || 1.05})`;
      break;
  }

  return styles;
}

export function generateActiveStyles(affordance: VisualAffordance): React.CSSProperties {
  return {
    transform: `scale(${affordance.activeScale || 0.98})`,
    opacity: affordance.activeOpacity,
  };
}

// =============================================================================
// INTERACTION HANDLER
// =============================================================================

export interface NavigationHandler {
  navigate: (destination: NavigationDestination) => void;
  openModal: (modal: ModalType, params?: Record<string, any>) => void;
  executeAction: (action: string, params?: Record<string, any>) => void;
  playHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  playSound: (soundId: string) => void;
}

export function handleInteraction(
  element: InteractiveElement,
  handler: NavigationHandler,
  runtimeParams?: Record<string, any>
): void {
  // Play haptic feedback
  if (element.hapticFeedback) {
    handler.playHaptic(element.hapticFeedback);
  }

  // Play sound effect
  if (element.soundEffect) {
    handler.playSound(element.soundEffect);
  }

  // Navigate
  const destination = createNavigation(element, runtimeParams);

  switch (destination.type) {
    case 'screen':
      handler.navigate(destination);
      break;
    case 'modal':
      handler.openModal(destination.modal, destination.params);
      break;
    case 'action':
      handler.executeAction(destination.action, destination.params);
      break;
    case 'external':
      // Open in browser
      if (typeof window !== 'undefined') {
        window.open(destination.url, '_blank', 'noopener,noreferrer');
      }
      break;
    case 'section':
      // Scroll to section
      if (typeof document !== 'undefined') {
        document.getElementById(destination.sectionId)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
      break;
  }
}

// =============================================================================
// CLICKABLE TEXT PATTERNS
// =============================================================================

/**
 * Patterns for auto-linking text content
 * These turn specific text patterns into clickable links
 */
export const CLICKABLE_PATTERNS: Array<{
  pattern: RegExp;
  destination: (match: string) => NavigationDestination;
  ariaLabel: (match: string) => string;
}> = [
  // Quest names
  {
    pattern: /(?:quest|complete|finish)\s+"([^"]+)"/gi,
    destination: (match) => ({
      type: 'modal',
      modal: 'quest_detail',
      params: { questName: match },
    }),
    ariaLabel: (match) => `View quest: ${match}`,
  },
  // Achievement names
  {
    pattern: /(?:achievement|earn|unlock)\s+"([^"]+)"/gi,
    destination: (match) => ({
      type: 'screen',
      screen: 'achievement_detail',
    }),
    ariaLabel: (match) => `View achievement: ${match}`,
  },
  // Card names
  {
    pattern: /(?:The\s+)?(Fool|Magician|High Priestess|Empress|Emperor|Hierophant|Lovers|Chariot|Strength|Hermit|Wheel of Fortune|Justice|Hanged Man|Death|Temperance|Devil|Tower|Star|Moon|Sun|Judgement|World)/gi,
    destination: (match) => ({
      type: 'screen',
      screen: 'card_detail',
    }),
    ariaLabel: (match) => `View ${match} card details`,
  },
  // Dates/times (for events)
  {
    pattern: /(?:until|ends?|by)\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/gi,
    destination: () => ({
      type: 'action',
      action: 'add_to_calendar',
    }),
    ariaLabel: () => 'Add to calendar',
  },
];

/**
 * Process text and return segments with clickable portions marked
 */
export interface TextSegment {
  text: string;
  isClickable: boolean;
  destination?: NavigationDestination;
  ariaLabel?: string;
}

export function processClickableText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const { pattern, destination, ariaLabel } of CLICKABLE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        segments.push({
          text: text.slice(lastIndex, match.index),
          isClickable: false,
        });
      }

      // Add clickable match
      const matchedText = match[1] || match[0];
      segments.push({
        text: matchedText,
        isClickable: true,
        destination: destination(matchedText),
        ariaLabel: ariaLabel(matchedText),
      });

      lastIndex = match.index + match[0].length;
    }
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isClickable: false,
    });
  }

  return segments.length > 0 ? segments : [{ text, isClickable: false }];
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  DEFAULT_AFFORDANCES,
  HOME_INTERACTIONS,
  getInteractionForElement,
  createNavigation,
  generateAffordanceStyles,
  generateHoverStyles,
  generateActiveStyles,
  handleInteraction,
  CLICKABLE_PATTERNS,
  processClickableText,
};
