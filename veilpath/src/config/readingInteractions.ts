/**
 * READING INTERACTION SYSTEM
 *
 * Hearthstone-quality card interactions for tarot readings.
 *
 * Features:
 * - Next/Previous card navigation
 * - Smooth card flip animations
 * - Cards dealing from deck into spread positions
 * - Card hover/focus effects
 * - Satisfying sound design integration
 * - Scene state machine for reading flow
 */

import {
  SpreadLayout,
  CardPosition,
  ReadingState,
  ReadingCard,
  TableSceneConfig,
  ComposedScene,
  composeTableScene,
  assignCardBacks,
} from './tableSpreadScene';
import { CardConfig } from './visualCustomization';

// =============================================================================
// ANIMATION CONFIGURATIONS
// =============================================================================

export type EasingFunction =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring'
  | 'bounce'
  | 'elastic';

export interface AnimationConfig {
  duration: number; // milliseconds
  easing: EasingFunction;
  delay: number; // milliseconds
}

export interface CardAnimation {
  type: 'deal' | 'flip' | 'hover' | 'select' | 'dismiss' | 'shuffle' | 'float';
  cardIndex: number;
  config: AnimationConfig;
  startState: CardTransform;
  endState: CardTransform;
  soundEffect?: string;
}

export interface CardTransform {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  rotateY: number; // For flip animation (0 = back, 180 = front)
  opacity: number;
  zIndex: number;
  blur: number;
  glow: number;
  glowColor?: string;
}

// =============================================================================
// ANIMATION PRESETS (Hearthstone-quality)
// =============================================================================

export const ANIMATION_PRESETS = {
  // Card dealing from box to position
  deal: {
    duration: 600,
    easing: 'ease-out' as EasingFunction,
    delay: 0,
    soundEffect: 'card_deal',
  },

  // Card flip reveal
  flip: {
    duration: 450,
    easing: 'ease-in-out' as EasingFunction,
    delay: 0,
    soundEffect: 'card_flip',
  },

  // Card hover (subtle lift)
  hover: {
    duration: 200,
    easing: 'ease-out' as EasingFunction,
    delay: 0,
    soundEffect: 'card_hover',
  },

  // Card selection (glow + lift)
  select: {
    duration: 300,
    easing: 'spring' as EasingFunction,
    delay: 0,
    soundEffect: 'card_select',
  },

  // Floating idle animation
  float: {
    duration: 3000,
    easing: 'ease-in-out' as EasingFunction,
    delay: 0,
  },

  // Shuffle animation
  shuffle: {
    duration: 150,
    easing: 'linear' as EasingFunction,
    delay: 0,
    soundEffect: 'card_shuffle',
  },
};

// =============================================================================
// READING STATE MACHINE
// =============================================================================

export type ReadingPhase =
  | 'idle' // No reading active
  | 'preparing' // Setting up spread
  | 'shuffling' // Cards shuffling animation
  | 'dealing' // Cards dealing to positions
  | 'reading' // User navigating cards
  | 'interpreting' // Showing interpretation for selected card
  | 'complete' // All cards revealed, reading done
  | 'journaling'; // User journaling about reading

export interface ReadingInteractionState {
  phase: ReadingPhase;
  spreadId: string;
  cards: InteractiveCard[];
  currentCardIndex: number; // -1 = none selected
  revealedIndices: number[];
  hoveredCardIndex: number;
  animations: CardAnimation[];
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  isAnimating: boolean;
  timestamp: number;
}

export interface InteractiveCard extends ReadingCard {
  transform: CardTransform;
  isHovered: boolean;
  isSelected: boolean;
  meaningText: string;
  interpretationShown: boolean;
}

// =============================================================================
// STATE MACHINE ACTIONS
// =============================================================================

export type ReadingAction =
  | { type: 'START_READING'; spreadId: string; cards: Omit<ReadingCard, 'cardBackAssetId'>[]; cardConfig: CardConfig; ownedCardBacks: string[] }
  | { type: 'SHUFFLE_COMPLETE' }
  | { type: 'DEAL_CARD'; cardIndex: number }
  | { type: 'DEAL_COMPLETE' }
  | { type: 'NEXT_CARD' }
  | { type: 'PREVIOUS_CARD' }
  | { type: 'SELECT_CARD'; cardIndex: number }
  | { type: 'REVEAL_CARD'; cardIndex: number }
  | { type: 'HOVER_CARD'; cardIndex: number }
  | { type: 'UNHOVER_CARD' }
  | { type: 'SHOW_INTERPRETATION'; cardIndex: number }
  | { type: 'HIDE_INTERPRETATION' }
  | { type: 'COMPLETE_READING' }
  | { type: 'START_JOURNALING' }
  | { type: 'ANIMATION_COMPLETE'; animationId: string }
  | { type: 'RESET' };

// =============================================================================
// STATE MACHINE REDUCER
// =============================================================================

export function readingReducer(
  state: ReadingInteractionState,
  action: ReadingAction,
  spreadLayouts: SpreadLayout[]
): ReadingInteractionState {
  switch (action.type) {
    case 'START_READING': {
      const spread = spreadLayouts.find(s => s.id === action.spreadId);
      if (!spread) return state;

      // Assign card backs based on user config
      const cardsWithBacks = assignCardBacks(action.cards, action.cardConfig, action.ownedCardBacks);

      // Create interactive cards at starting position (in deck)
      const interactiveCards: InteractiveCard[] = cardsWithBacks.map((card, index) => ({
        ...card,
        transform: {
          x: 10, // Start at card box position
          y: 40,
          rotation: Math.random() * 4 - 2, // Slight random rotation
          scale: 0.8,
          rotateY: 0, // Back facing
          opacity: 1,
          zIndex: index,
          blur: 0,
          glow: 0,
        },
        isHovered: false,
        isSelected: false,
        meaningText: spread.positions[index]?.meaning || '',
        interpretationShown: false,
      }));

      return {
        ...state,
        phase: 'shuffling',
        spreadId: action.spreadId,
        cards: interactiveCards,
        currentCardIndex: -1,
        revealedIndices: [],
        hoveredCardIndex: -1,
        animations: [],
        canNavigateNext: false,
        canNavigatePrevious: false,
        isAnimating: true,
        timestamp: Date.now(),
      };
    }

    case 'SHUFFLE_COMPLETE':
      return {
        ...state,
        phase: 'dealing',
        isAnimating: true,
      };

    case 'DEAL_CARD': {
      const spread = spreadLayouts.find(s => s.id === state.spreadId);
      if (!spread) return state;

      const position = spread.positions[action.cardIndex];
      if (!position) return state;

      const cards = [...state.cards];
      cards[action.cardIndex] = {
        ...cards[action.cardIndex],
        transform: {
          ...cards[action.cardIndex].transform,
          x: position.x,
          y: position.y,
          rotation: position.rotation,
          scale: position.scale,
          zIndex: 10 + action.cardIndex,
        },
      };

      const dealAnimation: CardAnimation = {
        type: 'deal',
        cardIndex: action.cardIndex,
        config: {
          ...ANIMATION_PRESETS.deal,
          delay: action.cardIndex * 200, // Stagger deals
        },
        startState: state.cards[action.cardIndex].transform,
        endState: cards[action.cardIndex].transform,
        soundEffect: 'card_deal',
      };

      return {
        ...state,
        cards,
        animations: [...state.animations, dealAnimation],
        isAnimating: true,
      };
    }

    case 'DEAL_COMPLETE':
      return {
        ...state,
        phase: 'reading',
        currentCardIndex: 0,
        canNavigateNext: state.cards.length > 1,
        canNavigatePrevious: false,
        isAnimating: false,
      };

    case 'NEXT_CARD': {
      if (state.isAnimating) return state;

      const nextIndex = state.currentCardIndex + 1;
      if (nextIndex >= state.cards.length) {
        // All cards viewed, complete reading
        return {
          ...state,
          phase: 'complete',
          canNavigateNext: false,
        };
      }

      // Auto-reveal if not already revealed
      const shouldReveal = !state.revealedIndices.includes(state.currentCardIndex);
      const newRevealed = shouldReveal
        ? [...state.revealedIndices, state.currentCardIndex]
        : state.revealedIndices;

      const cards = [...state.cards];
      if (shouldReveal) {
        cards[state.currentCardIndex] = {
          ...cards[state.currentCardIndex],
          isRevealed: true,
          transform: {
            ...cards[state.currentCardIndex].transform,
            rotateY: 180, // Flip to front
          },
        };
      }

      // Deselect current, select next
      cards[state.currentCardIndex] = {
        ...cards[state.currentCardIndex],
        isSelected: false,
      };
      cards[nextIndex] = {
        ...cards[nextIndex],
        isSelected: true,
      };

      const flipAnimation: CardAnimation | null = shouldReveal
        ? {
            type: 'flip',
            cardIndex: state.currentCardIndex,
            config: ANIMATION_PRESETS.flip,
            startState: state.cards[state.currentCardIndex].transform,
            endState: cards[state.currentCardIndex].transform,
            soundEffect: 'card_flip',
          }
        : null;

      return {
        ...state,
        cards,
        currentCardIndex: nextIndex,
        revealedIndices: newRevealed,
        canNavigateNext: nextIndex < state.cards.length - 1,
        canNavigatePrevious: true,
        animations: flipAnimation ? [...state.animations, flipAnimation] : state.animations,
        isAnimating: !!flipAnimation,
      };
    }

    case 'PREVIOUS_CARD': {
      if (state.isAnimating) return state;
      if (state.currentCardIndex <= 0) return state;

      const prevIndex = state.currentCardIndex - 1;
      const cards = [...state.cards];

      // Deselect current, select previous
      cards[state.currentCardIndex] = {
        ...cards[state.currentCardIndex],
        isSelected: false,
      };
      cards[prevIndex] = {
        ...cards[prevIndex],
        isSelected: true,
      };

      return {
        ...state,
        cards,
        currentCardIndex: prevIndex,
        canNavigateNext: true,
        canNavigatePrevious: prevIndex > 0,
        phase: 'reading', // Go back to reading if we were complete
      };
    }

    case 'SELECT_CARD': {
      if (state.isAnimating) return state;

      const cards = state.cards.map((card, index) => ({
        ...card,
        isSelected: index === action.cardIndex,
      }));

      return {
        ...state,
        cards,
        currentCardIndex: action.cardIndex,
        canNavigateNext: action.cardIndex < state.cards.length - 1,
        canNavigatePrevious: action.cardIndex > 0,
      };
    }

    case 'REVEAL_CARD': {
      if (state.revealedIndices.includes(action.cardIndex)) return state;

      const cards = [...state.cards];
      cards[action.cardIndex] = {
        ...cards[action.cardIndex],
        isRevealed: true,
        transform: {
          ...cards[action.cardIndex].transform,
          rotateY: 180,
        },
      };

      const flipAnimation: CardAnimation = {
        type: 'flip',
        cardIndex: action.cardIndex,
        config: ANIMATION_PRESETS.flip,
        startState: state.cards[action.cardIndex].transform,
        endState: cards[action.cardIndex].transform,
        soundEffect: 'card_flip',
      };

      return {
        ...state,
        cards,
        revealedIndices: [...state.revealedIndices, action.cardIndex],
        animations: [...state.animations, flipAnimation],
        isAnimating: true,
      };
    }

    case 'HOVER_CARD': {
      if (state.isAnimating) return state;

      const cards = [...state.cards];
      cards[action.cardIndex] = {
        ...cards[action.cardIndex],
        isHovered: true,
        transform: {
          ...cards[action.cardIndex].transform,
          scale: cards[action.cardIndex].transform.scale * 1.05,
          glow: 0.3,
          zIndex: 100, // Bring to front
        },
      };

      return {
        ...state,
        cards,
        hoveredCardIndex: action.cardIndex,
      };
    }

    case 'UNHOVER_CARD': {
      if (state.hoveredCardIndex === -1) return state;

      const spread = spreadLayouts.find(s => s.id === state.spreadId);
      const position = spread?.positions[state.hoveredCardIndex];

      const cards = [...state.cards];
      cards[state.hoveredCardIndex] = {
        ...cards[state.hoveredCardIndex],
        isHovered: false,
        transform: {
          ...cards[state.hoveredCardIndex].transform,
          scale: position?.scale || 1,
          glow: 0,
          zIndex: 10 + state.hoveredCardIndex,
        },
      };

      return {
        ...state,
        cards,
        hoveredCardIndex: -1,
      };
    }

    case 'SHOW_INTERPRETATION': {
      const cards = [...state.cards];
      cards[action.cardIndex] = {
        ...cards[action.cardIndex],
        interpretationShown: true,
      };

      return {
        ...state,
        cards,
        phase: 'interpreting',
      };
    }

    case 'HIDE_INTERPRETATION': {
      const cards = state.cards.map(card => ({
        ...card,
        interpretationShown: false,
      }));

      return {
        ...state,
        cards,
        phase: 'reading',
      };
    }

    case 'COMPLETE_READING': {
      // Reveal all remaining cards
      const cards = state.cards.map(card => ({
        ...card,
        isRevealed: true,
        transform: {
          ...card.transform,
          rotateY: 180,
        },
      }));

      const allIndices = state.cards.map((_, i) => i);

      return {
        ...state,
        cards,
        revealedIndices: allIndices,
        phase: 'complete',
        canNavigateNext: false,
      };
    }

    case 'START_JOURNALING':
      return {
        ...state,
        phase: 'journaling',
      };

    case 'ANIMATION_COMPLETE':
      return {
        ...state,
        animations: state.animations.filter(a => `${a.type}_${a.cardIndex}` !== action.animationId),
        isAnimating: state.animations.length > 1,
      };

    case 'RESET':
      return createInitialReadingState();

    default:
      return state;
  }
}

// =============================================================================
// INITIAL STATE
// =============================================================================

export function createInitialReadingState(): ReadingInteractionState {
  return {
    phase: 'idle',
    spreadId: '',
    cards: [],
    currentCardIndex: -1,
    revealedIndices: [],
    hoveredCardIndex: -1,
    animations: [],
    canNavigateNext: false,
    canNavigatePrevious: false,
    isAnimating: false,
    timestamp: 0,
  };
}

// =============================================================================
// UI COMPONENT HELPERS
// =============================================================================

export interface NavigationState {
  canNext: boolean;
  canPrevious: boolean;
  currentIndex: number;
  totalCards: number;
  revealedCount: number;
  currentCardMeaning: string;
  currentCardName: string;
  isCurrentRevealed: boolean;
}

export function getNavigationState(state: ReadingInteractionState): NavigationState {
  const currentCard = state.cards[state.currentCardIndex];

  return {
    canNext: state.canNavigateNext && !state.isAnimating,
    canPrevious: state.canNavigatePrevious && !state.isAnimating,
    currentIndex: state.currentCardIndex,
    totalCards: state.cards.length,
    revealedCount: state.revealedIndices.length,
    currentCardMeaning: currentCard?.meaningText || '',
    currentCardName: currentCard?.cardId || '',
    isCurrentRevealed: currentCard?.isRevealed || false,
  };
}

// =============================================================================
// ANIMATION HELPERS
// =============================================================================

export function getCardStyle(card: InteractiveCard): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${card.transform.x}%`,
    top: `${card.transform.y}%`,
    transform: `
      translate(-50%, -50%)
      rotate(${card.transform.rotation}deg)
      rotateY(${card.transform.rotateY}deg)
      scale(${card.transform.scale})
    `,
    opacity: card.transform.opacity,
    zIndex: card.transform.zIndex,
    filter: `
      blur(${card.transform.blur}px)
      drop-shadow(0 0 ${card.transform.glow * 20}px ${card.transform.glowColor || '#FFD700'})
    `,
    transformStyle: 'preserve-3d',
    transition: 'transform 0.2s ease-out, filter 0.2s ease-out',
  };
}

export function getAnimationKeyframes(animation: CardAnimation): string {
  const { startState, endState, config } = animation;

  return `
    @keyframes card_${animation.type}_${animation.cardIndex} {
      from {
        left: ${startState.x}%;
        top: ${startState.y}%;
        transform: translate(-50%, -50%) rotate(${startState.rotation}deg) rotateY(${startState.rotateY}deg) scale(${startState.scale});
        opacity: ${startState.opacity};
      }
      to {
        left: ${endState.x}%;
        top: ${endState.y}%;
        transform: translate(-50%, -50%) rotate(${endState.rotation}deg) rotateY(${endState.rotateY}deg) scale(${endState.scale});
        opacity: ${endState.opacity};
      }
    }
  `;
}

// =============================================================================
// SOUND EFFECTS MAP
// =============================================================================

export const SOUND_EFFECTS: Record<string, { path: string; volume: number }> = {
  card_deal: { path: '/assets/sounds/card_deal.mp3', volume: 0.6 },
  card_flip: { path: '/assets/sounds/card_flip.mp3', volume: 0.7 },
  card_hover: { path: '/assets/sounds/card_hover.mp3', volume: 0.3 },
  card_select: { path: '/assets/sounds/card_select.mp3', volume: 0.5 },
  card_shuffle: { path: '/assets/sounds/card_shuffle.mp3', volume: 0.5 },
  reading_complete: { path: '/assets/sounds/reading_complete.mp3', volume: 0.6 },
  ambient_candles: { path: '/assets/sounds/ambient_candles.mp3', volume: 0.2 },
};

// =============================================================================
// READING FLOW CONTROLLER
// =============================================================================

export interface ReadingFlowController {
  state: ReadingInteractionState;
  dispatch: (action: ReadingAction) => void;
  startReading: (spreadId: string, cards: Omit<ReadingCard, 'cardBackAssetId'>[], cardConfig: CardConfig, ownedCardBacks: string[]) => void;
  nextCard: () => void;
  previousCard: () => void;
  selectCard: (index: number) => void;
  revealCard: (index: number) => void;
  completeReading: () => void;
  getScene: (sceneConfig: TableSceneConfig, sceneWidth?: number, sceneHeight?: number) => ComposedScene;
}

export function createReadingFlowController(
  spreadLayouts: SpreadLayout[]
): ReadingFlowController {
  let state = createInitialReadingState();

  const dispatch = (action: ReadingAction) => {
    state = readingReducer(state, action, spreadLayouts);
  };

  return {
    get state() {
      return state;
    },
    dispatch,
    startReading: (spreadId, cards, cardConfig, ownedCardBacks) => {
      dispatch({ type: 'START_READING', spreadId, cards, cardConfig, ownedCardBacks });
      // Simulate shuffle and deal sequence
      setTimeout(() => dispatch({ type: 'SHUFFLE_COMPLETE' }), 1500);
      setTimeout(() => {
        cards.forEach((_, index) => {
          setTimeout(() => dispatch({ type: 'DEAL_CARD', cardIndex: index }), index * 300);
        });
        setTimeout(() => dispatch({ type: 'DEAL_COMPLETE' }), cards.length * 300 + 600);
      }, 1700);
    },
    nextCard: () => dispatch({ type: 'NEXT_CARD' }),
    previousCard: () => dispatch({ type: 'PREVIOUS_CARD' }),
    selectCard: (index) => dispatch({ type: 'SELECT_CARD', cardIndex: index }),
    revealCard: (index) => dispatch({ type: 'REVEAL_CARD', cardIndex: index }),
    completeReading: () => dispatch({ type: 'COMPLETE_READING' }),
    getScene: (sceneConfig, sceneWidth = 1920, sceneHeight = 1080) => {
      const readingState: ReadingState = {
        spreadId: state.spreadId,
        cards: state.cards,
        currentPhase: state.phase === 'dealing' ? 'dealing' : state.phase === 'complete' ? 'complete' : 'revealing',
        revealedCount: state.revealedIndices.length,
      };
      return composeTableScene(sceneConfig, readingState, [], sceneWidth, sceneHeight);
    },
  };
}

export default {
  ANIMATION_PRESETS,
  SOUND_EFFECTS,
  readingReducer,
  createInitialReadingState,
  getNavigationState,
  getCardStyle,
  getAnimationKeyframes,
  createReadingFlowController,
};
