/**
 * READING LAYOUT SYSTEM
 *
 * Configurable, responsive, no-scroll layout for card readings.
 *
 * Design Philosophy:
 * - No scrolling - everything fits on screen
 * - Table spread is the STAR (central focus, ~4/7ths or configurable)
 * - Click any card to zoom to fullscreen SVG-quality close-up
 * - Side panels compress/hide gracefully on smaller screens
 * - All proportions are configurable (not locked in)
 *
 * Layout Modes:
 * 1. Desktop Wide: Left Panel | Table Spread | Right Panel
 * 2. Desktop Narrow: Collapsible panels with table focus
 * 3. Tablet: Bottom drawer for panels, full table spread
 * 4. Mobile: Swipe between table and panels
 */

// =============================================================================
// LAYOUT CONFIGURATION TYPES
// =============================================================================

export type LayoutMode = 'desktop_wide' | 'desktop_narrow' | 'tablet' | 'mobile';
export type PanelPosition = 'left' | 'right' | 'bottom' | 'overlay';
export type ZoomState = 'none' | 'zooming' | 'zoomed' | 'unzooming';

export interface LayoutBreakpoints {
  desktop_wide: number;  // >= 1400px
  desktop_narrow: number; // >= 1024px
  tablet: number;         // >= 768px
  // Below tablet = mobile
}

export const DEFAULT_BREAKPOINTS: LayoutBreakpoints = {
  desktop_wide: 1400,
  desktop_narrow: 1024,
  tablet: 768,
};

// =============================================================================
// PANEL PROPORTIONS (the user's "not locked in" dimensions)
// =============================================================================

export interface PanelProportions {
  id: string;
  name: string;
  description: string;

  // Fractions must sum to 1.0
  leftPanel: number;   // Vera streaming text
  centerPanel: number; // Table spread (the star!)
  rightPanel: number;  // Static card info

  // Minimum widths (pixels) before panel collapses
  leftMinWidth: number;
  rightMinWidth: number;

  // Collapse behavior when screen shrinks
  collapseOrder: ('left' | 'right')[]; // Which collapses first
}

export const PROPORTION_PRESETS: PanelProportions[] = [
  {
    id: 'table_focus',
    name: 'Table Focus (4/7)',
    description: 'Table spread dominates, panels are minimal',
    leftPanel: 1/7,    // ~14%
    centerPanel: 4/7,  // ~57%
    rightPanel: 2/7,   // ~29%
    leftMinWidth: 250,
    rightMinWidth: 280,
    collapseOrder: ['left', 'right'],
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Equal focus on content and interpretation',
    leftPanel: 2/9,    // ~22%
    centerPanel: 4/9,  // ~44%
    rightPanel: 3/9,   // ~33%
    leftMinWidth: 280,
    rightMinWidth: 320,
    collapseOrder: ['left', 'right'],
  },
  {
    id: 'interpretation_heavy',
    name: 'Interpretation Heavy',
    description: 'More space for Vera\'s interpretation',
    leftPanel: 3/10,   // 30%
    centerPanel: 4/10, // 40%
    rightPanel: 3/10,  // 30%
    leftMinWidth: 300,
    rightMinWidth: 300,
    collapseOrder: ['right', 'left'],
  },
  {
    id: 'widescreen_cinematic',
    name: 'Cinematic (4/9)',
    description: 'For ultra-wide displays, table takes center stage',
    leftPanel: 2/9,    // ~22%
    centerPanel: 4/9,  // ~44%
    rightPanel: 3/9,   // ~33%
    leftMinWidth: 300,
    rightMinWidth: 350,
    collapseOrder: ['left', 'right'],
  },
  {
    id: 'minimal_panels',
    name: 'Minimal (4/10)',
    description: 'Maximum table space with thin side panels',
    leftPanel: 2/10,   // 20%
    centerPanel: 5/10, // 50%
    rightPanel: 3/10,  // 30%
    leftMinWidth: 220,
    rightMinWidth: 260,
    collapseOrder: ['left', 'right'],
  },
];

// =============================================================================
// CARD ZOOM CONFIGURATION
// =============================================================================

export interface CardZoomConfig {
  // Zoom animation
  zoomDuration: number;      // ms
  unzoomDuration: number;    // ms
  easing: 'ease-in-out' | 'spring' | 'bounce' | 'cubic-bezier';

  // Zoomed card display
  maxWidth: number;          // % of viewport width
  maxHeight: number;         // % of viewport height
  maintainAspectRatio: boolean;
  targetAspectRatio: number; // Tarot card ratio (~0.58)

  // Background during zoom
  backdropColor: string;
  backdropOpacity: number;
  backdropBlur: number;      // px

  // Side panels during zoom
  panelBehavior: 'fade' | 'slide' | 'compress' | 'stay';
  panelOpacityWhenZoomed: number;

  // Interaction
  clickOutsideToClose: boolean;
  swipeToNavigate: boolean;
  keyboardNavigation: boolean; // Arrow keys
  pinchToZoom: boolean;        // Further zoom within zoomed view

  // SVG quality rendering
  renderMode: 'svg' | 'canvas' | 'auto';
  svgScaleFactor: number;    // For crisp rendering at any zoom
}

export const DEFAULT_ZOOM_CONFIG: CardZoomConfig = {
  zoomDuration: 400,
  unzoomDuration: 300,
  easing: 'spring',

  maxWidth: 85,
  maxHeight: 90,
  maintainAspectRatio: true,
  targetAspectRatio: 0.58,

  backdropColor: '#000000',
  backdropOpacity: 0.85,
  backdropBlur: 8,

  panelBehavior: 'fade',
  panelOpacityWhenZoomed: 0.15,

  clickOutsideToClose: true,
  swipeToNavigate: true,
  keyboardNavigation: true,
  pinchToZoom: true,

  renderMode: 'auto',
  svgScaleFactor: 2,
};

// =============================================================================
// ZOOMED CARD STATE
// =============================================================================

export interface ZoomedCardState {
  isZoomed: boolean;
  zoomState: ZoomState;
  cardIndex: number | null;

  // Calculated positions for animation
  sourceRect: DOMRect | null;  // Where the card started (in spread)
  targetRect: DOMRect | null;  // Where the card ends up (fullscreen)

  // For swipe navigation while zoomed
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;

  // Additional zoom level within the zoomed view
  innerZoomLevel: number; // 1.0 = normal, 2.0 = 2x zoom
  innerPanX: number;
  innerPanY: number;
}

export function createInitialZoomState(): ZoomedCardState {
  return {
    isZoomed: false,
    zoomState: 'none',
    cardIndex: null,
    sourceRect: null,
    targetRect: null,
    canNavigateNext: false,
    canNavigatePrevious: false,
    innerZoomLevel: 1.0,
    innerPanX: 0,
    innerPanY: 0,
  };
}

// =============================================================================
// COMPLETE LAYOUT STATE
// =============================================================================

export interface ReadingLayoutState {
  // Current layout mode (responsive)
  layoutMode: LayoutMode;
  viewportWidth: number;
  viewportHeight: number;

  // Panel configuration
  proportions: PanelProportions;

  // Panel collapse state
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;

  // Calculated dimensions (pixels)
  leftPanelWidth: number;
  centerPanelWidth: number;
  rightPanelWidth: number;
  contentHeight: number;

  // Card zoom state
  zoom: ZoomedCardState;
  zoomConfig: CardZoomConfig;

  // Mobile-specific
  activePanel: 'spread' | 'vera' | 'info';
  drawerHeight: number; // For tablet bottom drawer
}

// =============================================================================
// LAYOUT CALCULATION ENGINE
// =============================================================================

export function calculateLayoutMode(
  viewportWidth: number,
  breakpoints: LayoutBreakpoints = DEFAULT_BREAKPOINTS
): LayoutMode {
  if (viewportWidth >= breakpoints.desktop_wide) return 'desktop_wide';
  if (viewportWidth >= breakpoints.desktop_narrow) return 'desktop_narrow';
  if (viewportWidth >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

export function calculatePanelDimensions(
  viewportWidth: number,
  viewportHeight: number,
  proportions: PanelProportions,
  layoutMode: LayoutMode
): {
  leftWidth: number;
  centerWidth: number;
  rightWidth: number;
  leftVisible: boolean;
  rightVisible: boolean;
  contentHeight: number;
} {
  // No-scroll: full viewport height minus any fixed header/footer
  const headerHeight = 64; // App header
  const footerHeight = 0;  // No footer during reading
  const contentHeight = viewportHeight - headerHeight - footerHeight;

  switch (layoutMode) {
    case 'desktop_wide':
    case 'desktop_narrow': {
      // Calculate ideal widths from proportions
      let leftWidth = Math.floor(viewportWidth * proportions.leftPanel);
      let rightWidth = Math.floor(viewportWidth * proportions.rightPanel);
      let centerWidth = viewportWidth - leftWidth - rightWidth;

      // Check if panels need to collapse
      let leftVisible = true;
      let rightVisible = true;

      // Collapse based on minimum widths
      if (leftWidth < proportions.leftMinWidth) {
        if (proportions.collapseOrder[0] === 'left') {
          leftVisible = false;
          leftWidth = 0;
          centerWidth = viewportWidth - rightWidth;
        }
      }

      if (rightWidth < proportions.rightMinWidth) {
        if (proportions.collapseOrder[0] === 'right' || !leftVisible) {
          rightVisible = false;
          rightWidth = 0;
          centerWidth = viewportWidth - leftWidth;
        }
      }

      return { leftWidth, centerWidth, rightWidth, leftVisible, rightVisible, contentHeight };
    }

    case 'tablet': {
      // Table spread takes full width, panels in bottom drawer
      return {
        leftWidth: 0,
        centerWidth: viewportWidth,
        rightWidth: 0,
        leftVisible: false,
        rightVisible: false,
        contentHeight: contentHeight * 0.65, // Reserve space for drawer
      };
    }

    case 'mobile': {
      // Only one panel visible at a time (swipe between)
      return {
        leftWidth: viewportWidth,
        centerWidth: viewportWidth,
        rightWidth: viewportWidth,
        leftVisible: true,
        rightVisible: true,
        contentHeight,
      };
    }
  }
}

// =============================================================================
// ZOOM ANIMATION CALCULATIONS
// =============================================================================

export interface ZoomAnimationFrame {
  progress: number; // 0 to 1

  // Card transform
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;

  // Backdrop
  backdropOpacity: number;

  // Panels
  panelOpacity: number;
}

export function calculateZoomAnimation(
  progress: number,
  sourceRect: DOMRect,
  targetRect: DOMRect,
  config: CardZoomConfig,
  easing: (t: number) => number
): ZoomAnimationFrame {
  const t = easing(progress);

  return {
    progress,

    // Interpolate card position/size
    x: lerp(sourceRect.x, targetRect.x, t),
    y: lerp(sourceRect.y, targetRect.y, t),
    width: lerp(sourceRect.width, targetRect.width, t),
    height: lerp(sourceRect.height, targetRect.height, t),
    rotation: lerp(0, 0, t), // Cards unrotate when zooming
    scale: lerp(1, 1, t),

    // Backdrop fades in
    backdropOpacity: lerp(0, config.backdropOpacity, t),

    // Panels fade out based on config
    panelOpacity: lerp(1, config.panelOpacityWhenZoomed, t),
  };
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

export const EASING_FUNCTIONS = {
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  'spring': (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  'bounce': (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },

  'cubic-bezier': (t: number) => t * t * (3 - 2 * t), // Default cubic
};

// =============================================================================
// ZOOMED CARD RENDERING HELPERS
// =============================================================================

export interface ZoomedCardRenderConfig {
  // Card content
  cardId: string;
  cardName: string;
  isReversed: boolean;
  frontAssetPath: string;
  backAssetPath: string;
  isRevealed: boolean;

  // Position meaning (for display)
  positionMeaning: string;
  positionIndex: number;
  totalCards: number;

  // Render options
  showPositionLabel: boolean;
  showNavigation: boolean;
  showCardName: boolean;
}

export function calculateZoomedCardRect(
  viewportWidth: number,
  viewportHeight: number,
  config: CardZoomConfig
): DOMRect {
  const maxW = (config.maxWidth / 100) * viewportWidth;
  const maxH = (config.maxHeight / 100) * viewportHeight;

  let width: number;
  let height: number;

  if (config.maintainAspectRatio) {
    // Calculate size that fits within bounds while maintaining aspect ratio
    const targetRatio = config.targetAspectRatio;

    if (maxW / maxH > targetRatio) {
      // Height-constrained
      height = maxH;
      width = height * targetRatio;
    } else {
      // Width-constrained
      width = maxW;
      height = width / targetRatio;
    }
  } else {
    width = maxW;
    height = maxH;
  }

  // Center in viewport
  const x = (viewportWidth - width) / 2;
  const y = (viewportHeight - height) / 2;

  return new DOMRect(x, y, width, height);
}

// =============================================================================
// RESPONSIVE LAYOUT HOOK HELPERS
// =============================================================================

export function createInitialLayoutState(
  viewportWidth: number,
  viewportHeight: number,
  proportionPresetId: string = 'table_focus'
): ReadingLayoutState {
  const proportions = PROPORTION_PRESETS.find(p => p.id === proportionPresetId) || PROPORTION_PRESETS[0];
  const layoutMode = calculateLayoutMode(viewportWidth);
  const dims = calculatePanelDimensions(viewportWidth, viewportHeight, proportions, layoutMode);

  return {
    layoutMode,
    viewportWidth,
    viewportHeight,
    proportions,

    leftPanelCollapsed: false,
    rightPanelCollapsed: false,
    leftPanelVisible: dims.leftVisible,
    rightPanelVisible: dims.rightVisible,

    leftPanelWidth: dims.leftWidth,
    centerPanelWidth: dims.centerWidth,
    rightPanelWidth: dims.rightWidth,
    contentHeight: dims.contentHeight,

    zoom: createInitialZoomState(),
    zoomConfig: DEFAULT_ZOOM_CONFIG,

    activePanel: 'spread',
    drawerHeight: 300,
  };
}

// =============================================================================
// LAYOUT ACTIONS AND REDUCER
// =============================================================================

export type LayoutAction =
  | { type: 'RESIZE'; width: number; height: number }
  | { type: 'SET_PROPORTIONS'; proportionId: string }
  | { type: 'TOGGLE_LEFT_PANEL' }
  | { type: 'TOGGLE_RIGHT_PANEL' }
  | { type: 'ZOOM_CARD'; cardIndex: number; sourceRect: DOMRect }
  | { type: 'UNZOOM_CARD' }
  | { type: 'ZOOM_COMPLETE' }
  | { type: 'UNZOOM_COMPLETE' }
  | { type: 'NAVIGATE_ZOOMED'; direction: 'next' | 'previous' }
  | { type: 'INNER_ZOOM'; level: number; panX: number; panY: number }
  | { type: 'SET_ACTIVE_PANEL'; panel: 'spread' | 'vera' | 'info' }
  | { type: 'SET_DRAWER_HEIGHT'; height: number };

export function layoutReducer(
  state: ReadingLayoutState,
  action: LayoutAction
): ReadingLayoutState {
  switch (action.type) {
    case 'RESIZE': {
      const layoutMode = calculateLayoutMode(action.width);
      const dims = calculatePanelDimensions(
        action.width,
        action.height,
        state.proportions,
        layoutMode
      );

      return {
        ...state,
        layoutMode,
        viewportWidth: action.width,
        viewportHeight: action.height,
        leftPanelWidth: dims.leftWidth,
        centerPanelWidth: dims.centerWidth,
        rightPanelWidth: dims.rightWidth,
        leftPanelVisible: dims.leftVisible,
        rightPanelVisible: dims.rightVisible,
        contentHeight: dims.contentHeight,
      };
    }

    case 'SET_PROPORTIONS': {
      const proportions = PROPORTION_PRESETS.find(p => p.id === action.proportionId) || state.proportions;
      const dims = calculatePanelDimensions(
        state.viewportWidth,
        state.viewportHeight,
        proportions,
        state.layoutMode
      );

      return {
        ...state,
        proportions,
        leftPanelWidth: dims.leftWidth,
        centerPanelWidth: dims.centerWidth,
        rightPanelWidth: dims.rightWidth,
        leftPanelVisible: dims.leftVisible,
        rightPanelVisible: dims.rightVisible,
      };
    }

    case 'TOGGLE_LEFT_PANEL':
      return {
        ...state,
        leftPanelCollapsed: !state.leftPanelCollapsed,
      };

    case 'TOGGLE_RIGHT_PANEL':
      return {
        ...state,
        rightPanelCollapsed: !state.rightPanelCollapsed,
      };

    case 'ZOOM_CARD': {
      const targetRect = calculateZoomedCardRect(
        state.viewportWidth,
        state.viewportHeight,
        state.zoomConfig
      );

      return {
        ...state,
        zoom: {
          ...state.zoom,
          isZoomed: false, // Not yet, still animating
          zoomState: 'zooming',
          cardIndex: action.cardIndex,
          sourceRect: action.sourceRect,
          targetRect,
          innerZoomLevel: 1.0,
          innerPanX: 0,
          innerPanY: 0,
        },
      };
    }

    case 'ZOOM_COMPLETE':
      return {
        ...state,
        zoom: {
          ...state.zoom,
          isZoomed: true,
          zoomState: 'zoomed',
        },
      };

    case 'UNZOOM_CARD':
      return {
        ...state,
        zoom: {
          ...state.zoom,
          zoomState: 'unzooming',
        },
      };

    case 'UNZOOM_COMPLETE':
      return {
        ...state,
        zoom: createInitialZoomState(),
      };

    case 'NAVIGATE_ZOOMED':
      // Navigation handled by parent, we just track state
      return state;

    case 'INNER_ZOOM':
      return {
        ...state,
        zoom: {
          ...state.zoom,
          innerZoomLevel: action.level,
          innerPanX: action.panX,
          innerPanY: action.panY,
        },
      };

    case 'SET_ACTIVE_PANEL':
      return {
        ...state,
        activePanel: action.panel,
      };

    case 'SET_DRAWER_HEIGHT':
      return {
        ...state,
        drawerHeight: action.height,
      };

    default:
      return state;
  }
}

// =============================================================================
// CSS GENERATION HELPERS
// =============================================================================

export function generateLayoutStyles(state: ReadingLayoutState): Record<string, React.CSSProperties> {
  const { layoutMode, leftPanelWidth, centerPanelWidth, rightPanelWidth, contentHeight, zoom } = state;

  const baseTransition = 'all 0.3s ease-out';

  // Panel opacity during zoom
  const panelOpacity = zoom.zoomState === 'zoomed' || zoom.zoomState === 'zooming'
    ? state.zoomConfig.panelOpacityWhenZoomed
    : 1;

  switch (layoutMode) {
    case 'desktop_wide':
    case 'desktop_narrow':
      return {
        container: {
          display: 'flex',
          width: '100%',
          height: contentHeight,
          overflow: 'hidden',
        },
        leftPanel: {
          width: leftPanelWidth,
          height: '100%',
          opacity: panelOpacity,
          transition: baseTransition,
          display: state.leftPanelVisible ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        centerPanel: {
          width: centerPanelWidth,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        },
        rightPanel: {
          width: rightPanelWidth,
          height: '100%',
          opacity: panelOpacity,
          transition: baseTransition,
          display: state.rightPanelVisible ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        zoomBackdrop: {
          position: 'fixed',
          inset: 0,
          backgroundColor: state.zoomConfig.backdropColor,
          opacity: zoom.zoomState === 'zoomed' ? state.zoomConfig.backdropOpacity : 0,
          backdropFilter: `blur(${state.zoomConfig.backdropBlur}px)`,
          transition: `opacity ${state.zoomConfig.zoomDuration}ms`,
          pointerEvents: zoom.isZoomed ? 'auto' : 'none',
          zIndex: 100,
        },
      };

    case 'tablet':
      return {
        container: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        },
        leftPanel: {
          display: 'none', // In drawer
        },
        centerPanel: {
          width: '100%',
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        },
        rightPanel: {
          display: 'none', // In drawer
        },
        drawer: {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: state.drawerHeight,
          backgroundColor: '#1a1a2e',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'hidden',
        },
        zoomBackdrop: {
          position: 'fixed',
          inset: 0,
          backgroundColor: state.zoomConfig.backdropColor,
          opacity: zoom.zoomState === 'zoomed' ? state.zoomConfig.backdropOpacity : 0,
          transition: `opacity ${state.zoomConfig.zoomDuration}ms`,
          pointerEvents: zoom.isZoomed ? 'auto' : 'none',
          zIndex: 100,
        },
      };

    case 'mobile':
      return {
        container: {
          display: 'flex',
          width: '300%', // 3 panels side by side
          height: contentHeight,
          transform: `translateX(-${state.activePanel === 'vera' ? 0 : state.activePanel === 'spread' ? 100 : 200}%)`,
          transition: 'transform 0.3s ease-out',
        },
        leftPanel: {
          width: '100vw',
          height: '100%',
          flexShrink: 0,
        },
        centerPanel: {
          width: '100vw',
          height: '100%',
          flexShrink: 0,
          position: 'relative',
        },
        rightPanel: {
          width: '100vw',
          height: '100%',
          flexShrink: 0,
        },
        zoomBackdrop: {
          position: 'fixed',
          inset: 0,
          backgroundColor: state.zoomConfig.backdropColor,
          opacity: zoom.zoomState === 'zoomed' ? state.zoomConfig.backdropOpacity : 0,
          transition: `opacity ${state.zoomConfig.zoomDuration}ms`,
          pointerEvents: zoom.isZoomed ? 'auto' : 'none',
          zIndex: 100,
        },
      };
  }
}

// =============================================================================
// ZOOMED CARD NAVIGATION UI
// =============================================================================

export interface ZoomNavigationUI {
  showPrevButton: boolean;
  showNextButton: boolean;
  showPositionIndicator: boolean;
  showCardName: boolean;
  closeButtonPosition: 'top-right' | 'top-left' | 'bottom-center';
}

export function getZoomNavigationUI(
  state: ReadingLayoutState,
  totalCards: number
): ZoomNavigationUI {
  const cardIndex = state.zoom.cardIndex;

  return {
    showPrevButton: cardIndex !== null && cardIndex > 0,
    showNextButton: cardIndex !== null && cardIndex < totalCards - 1,
    showPositionIndicator: true,
    showCardName: true,
    closeButtonPosition: 'top-right',
  };
}

// =============================================================================
// ACCESSIBILITY HELPERS
// =============================================================================

export function getZoomA11yProps(
  state: ReadingLayoutState,
  cardName: string,
  positionMeaning: string
): Record<string, string> {
  return {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': `${cardName} in ${positionMeaning} position`,
    'aria-describedby': 'zoomed-card-description',
  };
}

export function getZoomKeyboardHandler(
  dispatch: (action: LayoutAction) => void,
  onNavigate: (direction: 'next' | 'previous') => void
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        dispatch({ type: 'UNZOOM_CARD' });
        break;
      case 'ArrowLeft':
        onNavigate('previous');
        break;
      case 'ArrowRight':
        onNavigate('next');
        break;
      case '+':
      case '=':
        // Zoom in within zoomed view
        break;
      case '-':
        // Zoom out within zoomed view
        break;
    }
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  DEFAULT_BREAKPOINTS,
  PROPORTION_PRESETS,
  DEFAULT_ZOOM_CONFIG,
  EASING_FUNCTIONS,
  calculateLayoutMode,
  calculatePanelDimensions,
  calculateZoomAnimation,
  calculateZoomedCardRect,
  createInitialLayoutState,
  createInitialZoomState,
  layoutReducer,
  generateLayoutStyles,
  getZoomNavigationUI,
  getZoomA11yProps,
  getZoomKeyboardHandler,
};
