/**
 * INTERPRETATION SCREEN CONFIGURATION
 *
 * Three-panel layout for card interpretation:
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  LEFT (~1/3)      │     CENTER (dominant)      │  RIGHT (panel)    │
 * │                   │                            │                   │
 * │  VERA'S           │     SELECTED CARD          │  STATIC CARD      │
 * │  INTERPRETATION   │     (large display)        │  INFO             │
 * │                   │                            │                   │
 * │  • Streaming text │     • Card image           │  • Suit           │
 * │  • Personalized   │     • Animation effects    │  • Number         │
 * │  • No input box   │     • Flip state           │  • Element        │
 * │  • Scrollable     │     • User's cosmetics     │  • CBT equiv      │
 * │                   │                            │  • DBT equiv      │
 * │                   │                            │  • Life areas     │
 * │                   │                            │  • Keywords       │
 * └─────────────────────────────────────────────────────────────────────┘
 */

// =============================================================================
// CARD DATA TYPES
// =============================================================================

export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles' | 'major';
export type Element = 'fire' | 'water' | 'air' | 'earth' | 'spirit';

export type LifeArea =
  | 'romance'
  | 'finance'
  | 'career'
  | 'creativity'
  | 'spirituality'
  | 'health'
  | 'family'
  | 'friendships'
  | 'personal_growth'
  | 'education'
  | 'travel'
  | 'home'
  | 'legal'
  | 'communication';

export interface CardStaticInfo {
  id: string;
  name: string;
  number: number | string; // 0-21 for major, Ace-King for minor
  suit: Suit;
  element: Element;
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  lifeAreas: LifeArea[];

  // Therapeutic frameworks
  cbtInsight: CBTInsight;
  dbtInsight: DBTInsight;
  practicalInsight: PracticalInsight;

  // Symbolism
  symbols: string[];
  colors: string[];
  astrologicalCorrespondence?: string;
  numerologicalMeaning?: string;
}

export interface CBTInsight {
  cognitiveDistortion?: string; // What thinking pattern this card might represent
  healthyThought: string; // The balanced perspective
  behavioralSuggestion: string; // Concrete action
  thoughtChallenge: string; // Question to ask yourself
}

export interface DBTInsight {
  mindfulnessAspect: string; // Present-moment awareness
  distressToleranceSkill?: string; // Crisis survival
  emotionRegulationTip: string; // Managing feelings
  interpersonalEffectiveness?: string; // Relationship skills
  radicalAcceptance?: string; // Accepting reality
}

export interface PracticalInsight {
  actionStep: string; // What to do today
  avoidance: string; // What to avoid
  reflection: string; // Journal prompt
  affirmation: string; // Positive statement
}

// =============================================================================
// LAYOUT CONFIGURATION
// =============================================================================

export interface InterpretationLayout {
  id: string;
  name: string;
  breakpoints: {
    mobile: LayoutConfig;
    tablet: LayoutConfig;
    desktop: LayoutConfig;
  };
}

export interface LayoutConfig {
  columns: number;
  leftPanelWidth: string; // CSS value
  centerPanelWidth: string;
  rightPanelWidth: string;
  cardSize: 'small' | 'medium' | 'large' | 'dominant';
  veraPosition: 'top' | 'left' | 'bottom' | 'overlay';
  infoPosition: 'right' | 'bottom' | 'drawer' | 'tabs';
}

export const INTERPRETATION_LAYOUTS: InterpretationLayout = {
  id: 'default',
  name: 'Default Interpretation Layout',
  breakpoints: {
    mobile: {
      columns: 1,
      leftPanelWidth: '100%',
      centerPanelWidth: '100%',
      rightPanelWidth: '100%',
      cardSize: 'large',
      veraPosition: 'bottom',
      infoPosition: 'drawer', // Slide-up drawer
    },
    tablet: {
      columns: 2,
      leftPanelWidth: '40%',
      centerPanelWidth: '60%',
      rightPanelWidth: '0%', // Info in tabs below card
      cardSize: 'large',
      veraPosition: 'left',
      infoPosition: 'tabs',
    },
    desktop: {
      columns: 3,
      leftPanelWidth: '30%',
      centerPanelWidth: '40%',
      rightPanelWidth: '30%',
      cardSize: 'dominant',
      veraPosition: 'left',
      infoPosition: 'right',
    },
  },
};

// =============================================================================
// VERA INTERPRETATION PANEL
// =============================================================================

export interface VeraInterpretationConfig {
  streamingEnabled: boolean;
  typingSpeed: number; // Characters per second
  showTypingIndicator: boolean;
  maxHistoryLength: number; // Previous card interpretations to keep in view
  scrollBehavior: 'smooth' | 'auto';

  // Personalization inputs
  useUserIntention: boolean;
  useUserProfile: boolean;
  useReadingHistory: boolean;
  usePreviousCardsInSpread: boolean;
}

export const VERA_PANEL_CONFIG: VeraInterpretationConfig = {
  streamingEnabled: true,
  typingSpeed: 50, // 50 chars/sec for readable streaming
  showTypingIndicator: true,
  maxHistoryLength: 10, // Keep last 10 card interpretations visible
  scrollBehavior: 'smooth',
  useUserIntention: true,
  useUserProfile: true,
  useReadingHistory: true,
  usePreviousCardsInSpread: true,
};

export interface VeraMessage {
  id: string;
  cardId: string;
  cardPosition: number; // Position in spread (0-indexed)
  positionMeaning: string; // "Past", "Present", etc.
  content: string;
  isStreaming: boolean;
  timestamp: number;
}

export interface VeraInterpretationState {
  messages: VeraMessage[];
  currentMessage: VeraMessage | null;
  isGenerating: boolean;
  readingIntention: string;
  overallNarrative: string; // Running synthesis of the reading
}

// =============================================================================
// RIGHT PANEL - STATIC CARD INFO SECTIONS
// =============================================================================

export interface InfoPanelSection {
  id: string;
  title: string;
  icon: string;
  defaultExpanded: boolean;
  order: number;
}

export const INFO_PANEL_SECTIONS: InfoPanelSection[] = [
  {
    id: 'basics',
    title: 'Card Basics',
    icon: '🃏',
    defaultExpanded: true,
    order: 1,
  },
  {
    id: 'meaning',
    title: 'Traditional Meaning',
    icon: '📖',
    defaultExpanded: true,
    order: 2,
  },
  {
    id: 'cbt',
    title: 'CBT Perspective',
    icon: '🧠',
    defaultExpanded: false,
    order: 3,
  },
  {
    id: 'dbt',
    title: 'DBT Skills',
    icon: '🌊',
    defaultExpanded: false,
    order: 4,
  },
  {
    id: 'practical',
    title: 'Practical Guidance',
    icon: '✨',
    defaultExpanded: true,
    order: 5,
  },
  {
    id: 'life_areas',
    title: 'Life Areas',
    icon: '🎯',
    defaultExpanded: false,
    order: 6,
  },
  {
    id: 'symbolism',
    title: 'Symbolism',
    icon: '🔮',
    defaultExpanded: false,
    order: 7,
  },
];

// =============================================================================
// LIFE AREA DISPLAY CONFIG
// =============================================================================

export const LIFE_AREA_CONFIG: Record<LifeArea, { name: string; icon: string; color: string }> = {
  romance: { name: 'Romance & Love', icon: '💕', color: '#FF69B4' },
  finance: { name: 'Finance & Money', icon: '💰', color: '#FFD700' },
  career: { name: 'Career & Work', icon: '💼', color: '#4169E1' },
  creativity: { name: 'Creativity & Art', icon: '🎨', color: '#9370DB' },
  spirituality: { name: 'Spirituality', icon: '🙏', color: '#E6E6FA' },
  health: { name: 'Health & Wellness', icon: '💚', color: '#32CD32' },
  family: { name: 'Family', icon: '👨‍👩‍👧‍👦', color: '#FF8C00' },
  friendships: { name: 'Friendships', icon: '👯', color: '#00CED1' },
  personal_growth: { name: 'Personal Growth', icon: '🌱', color: '#228B22' },
  education: { name: 'Education & Learning', icon: '📚', color: '#8B4513' },
  travel: { name: 'Travel & Adventure', icon: '✈️', color: '#87CEEB' },
  home: { name: 'Home & Living', icon: '🏠', color: '#DEB887' },
  legal: { name: 'Legal Matters', icon: '⚖️', color: '#708090' },
  communication: { name: 'Communication', icon: '💬', color: '#20B2AA' },
};

// =============================================================================
// ELEMENT DISPLAY CONFIG
// =============================================================================

export const ELEMENT_CONFIG: Record<Element, { name: string; icon: string; color: string; description: string }> = {
  fire: {
    name: 'Fire',
    icon: '🔥',
    color: '#FF4500',
    description: 'Passion, energy, creativity, willpower',
  },
  water: {
    name: 'Water',
    icon: '💧',
    color: '#4169E1',
    description: 'Emotions, intuition, relationships, flow',
  },
  air: {
    name: 'Air',
    icon: '💨',
    color: '#87CEEB',
    description: 'Intellect, communication, truth, clarity',
  },
  earth: {
    name: 'Earth',
    icon: '🌍',
    color: '#228B22',
    description: 'Material world, stability, practicality, body',
  },
  spirit: {
    name: 'Spirit',
    icon: '✨',
    color: '#9400D3',
    description: 'Divine connection, major life lessons, fate',
  },
};

// =============================================================================
// SUIT DISPLAY CONFIG
// =============================================================================

export const SUIT_CONFIG: Record<Suit, { name: string; icon: string; element: Element; theme: string }> = {
  wands: {
    name: 'Wands',
    icon: '🪄',
    element: 'fire',
    theme: 'Action, inspiration, determination',
  },
  cups: {
    name: 'Cups',
    icon: '🏆',
    element: 'water',
    theme: 'Emotions, relationships, intuition',
  },
  swords: {
    name: 'Swords',
    icon: '⚔️',
    element: 'air',
    theme: 'Thoughts, decisions, conflict',
  },
  pentacles: {
    name: 'Pentacles',
    icon: '⭐',
    element: 'earth',
    theme: 'Material, career, finances',
  },
  major: {
    name: 'Major Arcana',
    icon: '🌟',
    element: 'spirit',
    theme: 'Life lessons, karma, destiny',
  },
};

// =============================================================================
// VERA PROMPT TEMPLATES
// =============================================================================

export interface VeraPromptContext {
  card: CardStaticInfo;
  isReversed: boolean;
  positionInSpread: number;
  positionMeaning: string;
  spreadType: string;
  userIntention: string;
  previousCardsInReading: Array<{ card: CardStaticInfo; interpretation: string }>;
  userProfile: {
    preferredLifeAreas: LifeArea[];
    therapeuticPreference: 'cbt' | 'dbt' | 'practical' | 'traditional' | 'balanced';
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

export function buildVeraPrompt(context: VeraPromptContext): string {
  const { card, isReversed, positionMeaning, spreadType, userIntention, previousCardsInReading, userProfile } = context;

  const orientation = isReversed ? 'reversed' : 'upright';
  const previousSummary = previousCardsInReading
    .map((prev, i) => `Card ${i + 1}: ${prev.card.name} - ${prev.interpretation.substring(0, 100)}...`)
    .join('\n');

  return `You are Vera, a wise and compassionate tarot guide. Interpret this card for the seeker.

CARD DRAWN: ${card.name} (${orientation})
POSITION: ${positionMeaning} (in a ${spreadType} spread)
SEEKER'S INTENTION: "${userIntention}"

CARD DETAILS:
- Suit: ${SUIT_CONFIG[card.suit].name}
- Element: ${ELEMENT_CONFIG[card.element].name}
- Keywords: ${card.keywords.join(', ')}
- ${orientation === 'upright' ? 'Upright' : 'Reversed'} Meaning: ${orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning}

${previousCardsInReading.length > 0 ? `
PREVIOUS CARDS IN THIS READING:
${previousSummary}
` : ''}

SEEKER PREFERENCES:
- Experience Level: ${userProfile.experienceLevel}
- Focus Areas: ${userProfile.preferredLifeAreas.map(a => LIFE_AREA_CONFIG[a].name).join(', ')}
- Therapeutic Approach: ${userProfile.therapeuticPreference}

INTERPRETATION GUIDELINES:
1. Address the seeker directly and warmly
2. Connect the card's meaning to their stated intention
3. If there are previous cards, weave this interpretation into the larger narrative
4. Include practical, actionable guidance
${userProfile.therapeuticPreference === 'cbt' ? '5. Incorporate CBT perspective: ' + card.cbtInsight.healthyThought : ''}
${userProfile.therapeuticPreference === 'dbt' ? '5. Incorporate DBT wisdom: ' + card.dbtInsight.mindfulnessAspect : ''}
6. Keep the tone warm but grounded - no toxic positivity
7. Acknowledge difficult cards honestly while offering hope

Provide a personalized, flowing interpretation (2-3 paragraphs). Do not use headers or bullet points.`;
}

// =============================================================================
// SAMPLE CARD DATA (The Fool as example)
// =============================================================================

export const SAMPLE_CARD_DATA: CardStaticInfo = {
  id: 'major_00_fool',
  name: 'The Fool',
  number: 0,
  suit: 'major',
  element: 'spirit',
  keywords: ['new beginnings', 'innocence', 'spontaneity', 'leap of faith', 'freedom'],
  uprightMeaning: 'A fresh start, taking a leap of faith, embracing the unknown with optimism and trust.',
  reversedMeaning: 'Recklessness, fear of change, holding back, poor judgment, naivety.',
  lifeAreas: ['personal_growth', 'spirituality', 'travel', 'creativity'],

  cbtInsight: {
    cognitiveDistortion: 'Catastrophizing - assuming the worst will happen',
    healthyThought: 'I can take calculated risks while accepting uncertainty. Not knowing the outcome doesn\'t mean it will be bad.',
    behavioralSuggestion: 'Take one small step toward something you\'ve been avoiding due to fear of the unknown.',
    thoughtChallenge: 'What evidence do I have that this new beginning will fail? What might I gain by trying?',
  },

  dbtInsight: {
    mindfulnessAspect: 'Be present in this moment of possibility without judgment. Notice excitement or fear without labeling them good or bad.',
    distressToleranceSkill: 'Radical acceptance that uncertainty is part of all new beginnings.',
    emotionRegulationTip: 'Allow yourself to feel both excited and nervous - these emotions can coexist.',
    interpersonalEffectiveness: 'Ask for support from others when taking new steps, while maintaining your own direction.',
    radicalAcceptance: 'This is where I am now. The path forward is unclear, and that is okay.',
  },

  practicalInsight: {
    actionStep: 'Write down one thing you\'ve wanted to try but have been putting off. Take the smallest possible first step today.',
    avoidance: 'Don\'t let perfect be the enemy of good. Avoid waiting until you feel "ready" - begin now.',
    reflection: 'Journal prompt: What would you do if you knew you couldn\'t fail?',
    affirmation: 'I trust myself to navigate whatever comes. Every expert was once a beginner.',
  },

  symbols: ['cliff edge', 'white rose', 'small dog', 'mountains', 'sun', 'bindle'],
  colors: ['yellow (optimism)', 'white (purity)', 'red (passion)'],
  astrologicalCorrespondence: 'Uranus - innovation, sudden change, freedom',
  numerologicalMeaning: '0 - infinite potential, the void before creation, unlimited possibility',
};

// =============================================================================
// INTERPRETATION SCREEN STATE
// =============================================================================

export interface InterpretationScreenState {
  // Current card being interpreted
  currentCard: CardStaticInfo | null;
  isReversed: boolean;
  positionInSpread: number;
  positionMeaning: string;

  // Vera panel state
  veraState: VeraInterpretationState;

  // Info panel state
  expandedSections: string[]; // IDs of expanded sections

  // Navigation
  canGoNext: boolean;
  canGoPrevious: boolean;
  totalCardsInSpread: number;

  // User interaction
  isSaved: boolean; // Has user saved this interpretation?
  userNotes: string;
}

export function createInitialInterpretationState(): InterpretationScreenState {
  return {
    currentCard: null,
    isReversed: false,
    positionInSpread: 0,
    positionMeaning: '',
    veraState: {
      messages: [],
      currentMessage: null,
      isGenerating: false,
      readingIntention: '',
      overallNarrative: '',
    },
    expandedSections: INFO_PANEL_SECTIONS
      .filter(s => s.defaultExpanded)
      .map(s => s.id),
    canGoNext: false,
    canGoPrevious: false,
    totalCardsInSpread: 0,
    isSaved: false,
    userNotes: '',
  };
}

// =============================================================================
// NAVIGATION ACTIONS
// =============================================================================

export type InterpretationAction =
  | { type: 'SET_CARD'; card: CardStaticInfo; isReversed: boolean; position: number; meaning: string }
  | { type: 'START_VERA_INTERPRETATION' }
  | { type: 'APPEND_VERA_TEXT'; text: string }
  | { type: 'COMPLETE_VERA_INTERPRETATION' }
  | { type: 'TOGGLE_SECTION'; sectionId: string }
  | { type: 'NEXT_CARD' }
  | { type: 'PREVIOUS_CARD' }
  | { type: 'SAVE_INTERPRETATION' }
  | { type: 'UPDATE_NOTES'; notes: string }
  | { type: 'SET_NAVIGATION'; canNext: boolean; canPrev: boolean; total: number };

export function interpretationReducer(
  state: InterpretationScreenState,
  action: InterpretationAction
): InterpretationScreenState {
  switch (action.type) {
    case 'SET_CARD':
      return {
        ...state,
        currentCard: action.card,
        isReversed: action.isReversed,
        positionInSpread: action.position,
        positionMeaning: action.meaning,
        isSaved: false,
        userNotes: '',
      };

    case 'START_VERA_INTERPRETATION':
      const newMessage: VeraMessage = {
        id: `vera_${Date.now()}`,
        cardId: state.currentCard?.id || '',
        cardPosition: state.positionInSpread,
        positionMeaning: state.positionMeaning,
        content: '',
        isStreaming: true,
        timestamp: Date.now(),
      };
      return {
        ...state,
        veraState: {
          ...state.veraState,
          currentMessage: newMessage,
          isGenerating: true,
        },
      };

    case 'APPEND_VERA_TEXT':
      if (!state.veraState.currentMessage) return state;
      return {
        ...state,
        veraState: {
          ...state.veraState,
          currentMessage: {
            ...state.veraState.currentMessage,
            content: state.veraState.currentMessage.content + action.text,
          },
        },
      };

    case 'COMPLETE_VERA_INTERPRETATION':
      if (!state.veraState.currentMessage) return state;
      const completedMessage = {
        ...state.veraState.currentMessage,
        isStreaming: false,
      };
      return {
        ...state,
        veraState: {
          ...state.veraState,
          messages: [...state.veraState.messages, completedMessage],
          currentMessage: null,
          isGenerating: false,
        },
      };

    case 'TOGGLE_SECTION':
      const isExpanded = state.expandedSections.includes(action.sectionId);
      return {
        ...state,
        expandedSections: isExpanded
          ? state.expandedSections.filter(id => id !== action.sectionId)
          : [...state.expandedSections, action.sectionId],
      };

    case 'SET_NAVIGATION':
      return {
        ...state,
        canGoNext: action.canNext,
        canGoPrevious: action.canPrev,
        totalCardsInSpread: action.total,
      };

    case 'SAVE_INTERPRETATION':
      return { ...state, isSaved: true };

    case 'UPDATE_NOTES':
      return { ...state, userNotes: action.notes };

    default:
      return state;
  }
}

// =============================================================================
// CSS STYLES (for reference)
// =============================================================================

export const INTERPRETATION_STYLES = {
  // Left panel - Vera interpretation
  veraPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRight: '1px solid rgba(255, 215, 0, 0.2)',
    padding: '24px',
    overflowY: 'auto',
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '18px',
    lineHeight: '1.8',
    color: '#E6E6FA',
  },

  // Center panel - Card display
  cardPanel: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: '32px',
  },

  // Right panel - Static info
  infoPanel: {
    backgroundColor: 'rgba(26, 10, 46, 0.9)',
    borderLeft: '1px solid rgba(255, 215, 0, 0.2)',
    padding: '20px',
    overflowY: 'auto',
    fontSize: '14px',
  },

  // Section header
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#FFD700',
  },

  // Streaming text cursor
  streamingCursor: {
    display: 'inline-block',
    width: '2px',
    height: '1em',
    backgroundColor: '#FFD700',
    marginLeft: '2px',
    animation: 'blink 1s infinite',
  },
};

export default {
  INTERPRETATION_LAYOUTS,
  VERA_PANEL_CONFIG,
  INFO_PANEL_SECTIONS,
  LIFE_AREA_CONFIG,
  ELEMENT_CONFIG,
  SUIT_CONFIG,
  SAMPLE_CARD_DATA,
  buildVeraPrompt,
  createInitialInterpretationState,
  interpretationReducer,
  INTERPRETATION_STYLES,
};
