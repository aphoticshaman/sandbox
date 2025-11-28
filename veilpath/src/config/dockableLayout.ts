/**
 * DOCKABLE PANEL LAYOUT SYSTEM
 *
 * Flexible window management for reading interface panels.
 *
 * Features:
 * - Drag-and-drop panel repositioning
 * - Horizontal, vertical, and diagonal resize handles
 * - Docking to edges and corners
 * - Solid background "desktop" behind panels
 * - Snap-to-grid with configurable grid size
 * - Save/restore user layouts as presets
 * - Floating and minimized panel modes
 */

// =============================================================================
// PANEL TYPES AND DOCKING
// =============================================================================

export type PanelId = 'vera' | 'spread' | 'info' | 'journal' | 'settings';
export type DockPosition =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'floating';

export type DockEdge = 'left' | 'right' | 'top' | 'bottom';
export type ResizeHandle =
  | 'n' | 's' | 'e' | 'w'           // Cardinal edges
  | 'ne' | 'nw' | 'se' | 'sw';     // Diagonal corners

export interface DockZone {
  id: DockPosition;
  x: number;          // % of viewport
  y: number;
  width: number;      // % of viewport
  height: number;
  accepts: PanelId[]; // Which panels can dock here
  priority: number;   // Higher = preferred when overlapping
}

// =============================================================================
// PANEL DEFINITION
// =============================================================================

export interface DockablePanel {
  id: PanelId;
  title: string;

  // Current state
  position: DockPosition;
  isFloating: boolean;
  isMinimized: boolean;
  isLocked: boolean;

  // Geometry (in pixels or % depending on mode)
  x: number;
  y: number;
  width: number;
  height: number;

  // Constraints
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;

  // Docking preferences
  preferredDock: DockPosition;
  allowedDocks: DockPosition[];
  canFloat: boolean;
  canMinimize: boolean;
  canClose: boolean;

  // Z-ordering
  zIndex: number;

  // Resize handles
  resizableEdges: ResizeHandle[];
}

// =============================================================================
// DEFAULT PANEL CONFIGURATIONS
// =============================================================================

export const DEFAULT_PANELS: Record<PanelId, Omit<DockablePanel, 'x' | 'y' | 'width' | 'height' | 'zIndex'>> = {
  vera: {
    id: 'vera',
    title: 'Vera\'s Interpretation',
    position: 'left',
    isFloating: false,
    isMinimized: false,
    isLocked: false,
    minWidth: 280,
    minHeight: 200,
    maxWidth: 600,
    preferredDock: 'left',
    allowedDocks: ['left', 'right', 'bottom', 'floating'],
    canFloat: true,
    canMinimize: true,
    canClose: false,
    resizableEdges: ['e', 'se', 's'],
  },

  spread: {
    id: 'spread',
    title: 'Card Spread',
    position: 'center',
    isFloating: false,
    isMinimized: false,
    isLocked: true, // Center panel always locked
    minWidth: 400,
    minHeight: 300,
    preferredDock: 'center',
    allowedDocks: ['center'], // Can't be moved
    canFloat: false,
    canMinimize: false,
    canClose: false,
    resizableEdges: [], // Resizes automatically
  },

  info: {
    id: 'info',
    title: 'Card Information',
    position: 'right',
    isFloating: false,
    isMinimized: false,
    isLocked: false,
    minWidth: 260,
    minHeight: 200,
    maxWidth: 500,
    preferredDock: 'right',
    allowedDocks: ['left', 'right', 'bottom', 'floating'],
    canFloat: true,
    canMinimize: true,
    canClose: false,
    resizableEdges: ['w', 'sw', 's'],
  },

  journal: {
    id: 'journal',
    title: 'Reading Journal',
    position: 'floating',
    isFloating: true,
    isMinimized: true,
    isLocked: false,
    minWidth: 300,
    minHeight: 250,
    maxWidth: 600,
    maxHeight: 800,
    preferredDock: 'floating',
    allowedDocks: ['left', 'right', 'bottom', 'floating'],
    canFloat: true,
    canMinimize: true,
    canClose: true,
    resizableEdges: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
  },

  settings: {
    id: 'settings',
    title: 'Visual Settings',
    position: 'floating',
    isFloating: true,
    isMinimized: true,
    isLocked: false,
    minWidth: 280,
    minHeight: 320,
    maxWidth: 400,
    maxHeight: 600,
    preferredDock: 'floating',
    allowedDocks: ['floating'],
    canFloat: true,
    canMinimize: true,
    canClose: true,
    resizableEdges: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
  },
};

// =============================================================================
// DESKTOP BACKGROUND
// =============================================================================

export interface DesktopBackground {
  type: 'solid' | 'gradient' | 'image' | 'pattern';
  primaryColor: string;
  secondaryColor?: string;
  gradientDirection?: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
  imagePath?: string;
  patternId?: string;
  opacity: number;
  blur: number;
}

export const DEFAULT_DESKTOP_BACKGROUNDS: DesktopBackground[] = [
  {
    type: 'solid',
    primaryColor: '#0a0a12',
    opacity: 1,
    blur: 0,
  },
  {
    type: 'gradient',
    primaryColor: '#0a0a12',
    secondaryColor: '#1a1a2e',
    gradientDirection: 'vertical',
    opacity: 1,
    blur: 0,
  },
  {
    type: 'gradient',
    primaryColor: '#1a0a2e',
    secondaryColor: '#0a1a2e',
    gradientDirection: 'diagonal',
    opacity: 1,
    blur: 0,
  },
  {
    type: 'pattern',
    primaryColor: '#0a0a12',
    patternId: 'stars',
    opacity: 0.8,
    blur: 0,
  },
];

// =============================================================================
// COMPLETE LAYOUT STATE
// =============================================================================

export interface DockableLayoutState {
  // Viewport dimensions
  viewportWidth: number;
  viewportHeight: number;

  // Desktop background
  background: DesktopBackground;

  // All panels
  panels: Map<PanelId, DockablePanel>;

  // Dock zones
  dockZones: DockZone[];

  // Interaction state
  draggingPanel: PanelId | null;
  resizingPanel: PanelId | null;
  activeResizeHandle: ResizeHandle | null;
  dragOffset: { x: number; y: number };
  highlightedDockZone: DockPosition | null;

  // Grid snapping
  snapToGrid: boolean;
  gridSize: number; // pixels

  // Floating panel stack order
  floatingZOrder: PanelId[];
}

// =============================================================================
// LAYOUT PRESETS
// =============================================================================

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  panels: Partial<Record<PanelId, Partial<DockablePanel>>>;
  background?: Partial<DesktopBackground>;
  isDefault?: boolean;
  isUserCreated?: boolean;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'classic_three_column',
    name: 'Classic Three Column',
    description: 'Traditional layout with Vera left, spread center, info right',
    isDefault: true,
    panels: {
      vera: { position: 'left', width: 300, isFloating: false },
      spread: { position: 'center' },
      info: { position: 'right', width: 320, isFloating: false },
    },
  },
  {
    id: 'spread_focus',
    name: 'Spread Focus',
    description: 'Maximized spread with minimized side panels',
    panels: {
      vera: { position: 'left', width: 250, isMinimized: false },
      spread: { position: 'center' },
      info: { position: 'right', width: 280, isMinimized: false },
    },
  },
  {
    id: 'interpretation_mode',
    name: 'Interpretation Mode',
    description: 'Larger Vera panel for in-depth readings',
    panels: {
      vera: { position: 'left', width: 400, isFloating: false },
      spread: { position: 'center' },
      info: { position: 'floating', isMinimized: true },
    },
  },
  {
    id: 'bottom_drawer',
    name: 'Bottom Drawer',
    description: 'Spread on top, panels docked to bottom',
    panels: {
      vera: { position: 'bottom-left', width: 350 },
      spread: { position: 'center' },
      info: { position: 'bottom-right', width: 350 },
    },
  },
  {
    id: 'floating_all',
    name: 'Floating Everything',
    description: 'All panels float over a full-screen spread',
    panels: {
      vera: { position: 'floating', isFloating: true, x: 20, y: 100, width: 320 },
      spread: { position: 'center' },
      info: { position: 'floating', isFloating: true, x: -340, y: 100, width: 320 },
    },
  },
];

// =============================================================================
// DOCK ZONE CALCULATION
// =============================================================================

export function calculateDockZones(
  viewportWidth: number,
  viewportHeight: number,
  edgeThreshold: number = 80 // pixels from edge to trigger dock
): DockZone[] {
  const w = viewportWidth;
  const h = viewportHeight;
  const t = (edgeThreshold / w) * 100; // As percentage

  return [
    // Edge zones
    {
      id: 'left',
      x: 0,
      y: 0,
      width: 30,
      height: 100,
      accepts: ['vera', 'info', 'journal'],
      priority: 1,
    },
    {
      id: 'right',
      x: 70,
      y: 0,
      width: 30,
      height: 100,
      accepts: ['vera', 'info', 'journal'],
      priority: 1,
    },
    {
      id: 'bottom',
      x: 0,
      y: 70,
      width: 100,
      height: 30,
      accepts: ['vera', 'info', 'journal'],
      priority: 2,
    },

    // Corner zones (higher priority)
    {
      id: 'bottom-left',
      x: 0,
      y: 70,
      width: 40,
      height: 30,
      accepts: ['vera', 'info', 'journal'],
      priority: 3,
    },
    {
      id: 'bottom-right',
      x: 60,
      y: 70,
      width: 40,
      height: 30,
      accepts: ['vera', 'info', 'journal'],
      priority: 3,
    },

    // Center zone (for spread - highest priority)
    {
      id: 'center',
      x: 20,
      y: 10,
      width: 60,
      height: 60,
      accepts: ['spread'],
      priority: 10,
    },
  ];
}

// =============================================================================
// DRAG AND RESIZE LOGIC
// =============================================================================

export interface DragState {
  panelId: PanelId;
  startX: number;
  startY: number;
  startPanelX: number;
  startPanelY: number;
}

export interface ResizeState {
  panelId: PanelId;
  handle: ResizeHandle;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startPanelX: number;
  startPanelY: number;
}

export function handlePanelDrag(
  state: DockableLayoutState,
  mouseX: number,
  mouseY: number,
  dragState: DragState
): Partial<DockableLayoutState> {
  const panel = state.panels.get(dragState.panelId);
  if (!panel) return {};

  // Calculate new position
  let newX = dragState.startPanelX + (mouseX - dragState.startX);
  let newY = dragState.startPanelY + (mouseY - dragState.startY);

  // Snap to grid if enabled
  if (state.snapToGrid) {
    newX = Math.round(newX / state.gridSize) * state.gridSize;
    newY = Math.round(newY / state.gridSize) * state.gridSize;
  }

  // Check for dock zone collision
  const highlightedDockZone = findDockZone(
    state.dockZones,
    mouseX,
    mouseY,
    state.viewportWidth,
    state.viewportHeight,
    panel.id
  );

  // Update panel
  const updatedPanel: DockablePanel = {
    ...panel,
    x: newX,
    y: newY,
    isFloating: true,
  };

  const updatedPanels = new Map(state.panels);
  updatedPanels.set(dragState.panelId, updatedPanel);

  return {
    panels: updatedPanels,
    highlightedDockZone,
  };
}

export function handlePanelResize(
  state: DockableLayoutState,
  mouseX: number,
  mouseY: number,
  resizeState: ResizeState
): Partial<DockableLayoutState> {
  const panel = state.panels.get(resizeState.panelId);
  if (!panel) return {};

  const deltaX = mouseX - resizeState.startX;
  const deltaY = mouseY - resizeState.startY;

  let newX = resizeState.startPanelX;
  let newY = resizeState.startPanelY;
  let newWidth = resizeState.startWidth;
  let newHeight = resizeState.startHeight;

  // Apply resize based on handle direction
  const handle = resizeState.handle;

  if (handle.includes('e')) {
    newWidth = resizeState.startWidth + deltaX;
  }
  if (handle.includes('w')) {
    newWidth = resizeState.startWidth - deltaX;
    newX = resizeState.startPanelX + deltaX;
  }
  if (handle.includes('s')) {
    newHeight = resizeState.startHeight + deltaY;
  }
  if (handle.includes('n')) {
    newHeight = resizeState.startHeight - deltaY;
    newY = resizeState.startPanelY + deltaY;
  }

  // Apply constraints
  newWidth = Math.max(panel.minWidth, Math.min(panel.maxWidth || Infinity, newWidth));
  newHeight = Math.max(panel.minHeight, Math.min(panel.maxHeight || Infinity, newHeight));

  // Snap to grid
  if (state.snapToGrid) {
    newWidth = Math.round(newWidth / state.gridSize) * state.gridSize;
    newHeight = Math.round(newHeight / state.gridSize) * state.gridSize;
    newX = Math.round(newX / state.gridSize) * state.gridSize;
    newY = Math.round(newY / state.gridSize) * state.gridSize;
  }

  const updatedPanel: DockablePanel = {
    ...panel,
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  };

  const updatedPanels = new Map(state.panels);
  updatedPanels.set(resizeState.panelId, updatedPanel);

  return { panels: updatedPanels };
}

export function handleDragEnd(
  state: DockableLayoutState,
  dragState: DragState
): Partial<DockableLayoutState> {
  if (!state.highlightedDockZone) {
    // Stay floating
    return {
      draggingPanel: null,
      highlightedDockZone: null,
    };
  }

  // Dock to the zone
  const panel = state.panels.get(dragState.panelId);
  if (!panel) return { draggingPanel: null };

  const dockZone = state.dockZones.find(z => z.id === state.highlightedDockZone);
  if (!dockZone) return { draggingPanel: null };

  // Calculate docked position
  const dockedPanel = dockPanelToZone(panel, dockZone, state.viewportWidth, state.viewportHeight);

  const updatedPanels = new Map(state.panels);
  updatedPanels.set(dragState.panelId, dockedPanel);

  return {
    panels: updatedPanels,
    draggingPanel: null,
    highlightedDockZone: null,
  };
}

function findDockZone(
  zones: DockZone[],
  mouseX: number,
  mouseY: number,
  viewportWidth: number,
  viewportHeight: number,
  panelId: PanelId
): DockPosition | null {
  const mouseXPercent = (mouseX / viewportWidth) * 100;
  const mouseYPercent = (mouseY / viewportHeight) * 100;

  // Find all zones the mouse is in
  const matchingZones = zones
    .filter(zone =>
      mouseXPercent >= zone.x &&
      mouseXPercent <= zone.x + zone.width &&
      mouseYPercent >= zone.y &&
      mouseYPercent <= zone.y + zone.height &&
      zone.accepts.includes(panelId)
    )
    .sort((a, b) => b.priority - a.priority);

  return matchingZones[0]?.id || null;
}

function dockPanelToZone(
  panel: DockablePanel,
  zone: DockZone,
  viewportWidth: number,
  viewportHeight: number
): DockablePanel {
  const zoneX = (zone.x / 100) * viewportWidth;
  const zoneY = (zone.y / 100) * viewportHeight;
  const zoneWidth = (zone.width / 100) * viewportWidth;
  const zoneHeight = (zone.height / 100) * viewportHeight;

  // Calculate panel dimensions based on dock position
  let x = zoneX;
  let y = zoneY;
  let width = panel.width;
  let height = panel.height;

  switch (zone.id) {
    case 'left':
      x = 0;
      y = 0;
      height = viewportHeight;
      break;
    case 'right':
      x = viewportWidth - panel.width;
      y = 0;
      height = viewportHeight;
      break;
    case 'bottom':
      x = 0;
      y = viewportHeight - panel.height;
      width = viewportWidth;
      break;
    case 'bottom-left':
      x = 0;
      y = viewportHeight - panel.height;
      width = viewportWidth * 0.4;
      break;
    case 'bottom-right':
      x = viewportWidth * 0.6;
      y = viewportHeight - panel.height;
      width = viewportWidth * 0.4;
      break;
  }

  return {
    ...panel,
    position: zone.id,
    isFloating: zone.id === 'floating',
    x,
    y,
    width,
    height,
  };
}

// =============================================================================
// LAYOUT ACTIONS AND REDUCER
// =============================================================================

export type DockableLayoutAction =
  | { type: 'INIT'; viewportWidth: number; viewportHeight: number }
  | { type: 'RESIZE_VIEWPORT'; width: number; height: number }
  | { type: 'START_DRAG'; panelId: PanelId; x: number; y: number }
  | { type: 'DRAG_MOVE'; x: number; y: number }
  | { type: 'END_DRAG' }
  | { type: 'START_RESIZE'; panelId: PanelId; handle: ResizeHandle; x: number; y: number }
  | { type: 'RESIZE_MOVE'; x: number; y: number }
  | { type: 'END_RESIZE' }
  | { type: 'MINIMIZE_PANEL'; panelId: PanelId }
  | { type: 'RESTORE_PANEL'; panelId: PanelId }
  | { type: 'CLOSE_PANEL'; panelId: PanelId }
  | { type: 'BRING_TO_FRONT'; panelId: PanelId }
  | { type: 'TOGGLE_GRID_SNAP' }
  | { type: 'SET_GRID_SIZE'; size: number }
  | { type: 'SET_BACKGROUND'; background: Partial<DesktopBackground> }
  | { type: 'APPLY_PRESET'; presetId: string }
  | { type: 'SAVE_AS_PRESET'; name: string };

// Internal drag/resize state (not in main state)
let currentDragState: DragState | null = null;
let currentResizeState: ResizeState | null = null;

export function dockableLayoutReducer(
  state: DockableLayoutState,
  action: DockableLayoutAction
): DockableLayoutState {
  switch (action.type) {
    case 'INIT':
      return createInitialDockableLayoutState(action.viewportWidth, action.viewportHeight);

    case 'RESIZE_VIEWPORT': {
      const dockZones = calculateDockZones(action.width, action.height);
      return {
        ...state,
        viewportWidth: action.width,
        viewportHeight: action.height,
        dockZones,
      };
    }

    case 'START_DRAG': {
      const panel = state.panels.get(action.panelId);
      if (!panel || panel.isLocked) return state;

      currentDragState = {
        panelId: action.panelId,
        startX: action.x,
        startY: action.y,
        startPanelX: panel.x,
        startPanelY: panel.y,
      };

      return {
        ...state,
        draggingPanel: action.panelId,
      };
    }

    case 'DRAG_MOVE': {
      if (!currentDragState) return state;
      const updates = handlePanelDrag(state, action.x, action.y, currentDragState);
      return { ...state, ...updates };
    }

    case 'END_DRAG': {
      if (!currentDragState) return state;
      const updates = handleDragEnd(state, currentDragState);
      currentDragState = null;
      return { ...state, ...updates };
    }

    case 'START_RESIZE': {
      const panel = state.panels.get(action.panelId);
      if (!panel) return state;

      currentResizeState = {
        panelId: action.panelId,
        handle: action.handle,
        startX: action.x,
        startY: action.y,
        startWidth: panel.width,
        startHeight: panel.height,
        startPanelX: panel.x,
        startPanelY: panel.y,
      };

      return {
        ...state,
        resizingPanel: action.panelId,
        activeResizeHandle: action.handle,
      };
    }

    case 'RESIZE_MOVE': {
      if (!currentResizeState) return state;
      const updates = handlePanelResize(state, action.x, action.y, currentResizeState);
      return { ...state, ...updates };
    }

    case 'END_RESIZE': {
      currentResizeState = null;
      return {
        ...state,
        resizingPanel: null,
        activeResizeHandle: null,
      };
    }

    case 'MINIMIZE_PANEL': {
      const panel = state.panels.get(action.panelId);
      if (!panel || !panel.canMinimize) return state;

      const updatedPanels = new Map(state.panels);
      updatedPanels.set(action.panelId, { ...panel, isMinimized: true });

      return { ...state, panels: updatedPanels };
    }

    case 'RESTORE_PANEL': {
      const panel = state.panels.get(action.panelId);
      if (!panel) return state;

      const updatedPanels = new Map(state.panels);
      updatedPanels.set(action.panelId, { ...panel, isMinimized: false });

      return { ...state, panels: updatedPanels };
    }

    case 'CLOSE_PANEL': {
      const panel = state.panels.get(action.panelId);
      if (!panel || !panel.canClose) return state;

      const updatedPanels = new Map(state.panels);
      updatedPanels.delete(action.panelId);

      return {
        ...state,
        panels: updatedPanels,
        floatingZOrder: state.floatingZOrder.filter(id => id !== action.panelId),
      };
    }

    case 'BRING_TO_FRONT': {
      const panel = state.panels.get(action.panelId);
      if (!panel || !panel.isFloating) return state;

      // Move to top of z-order
      const newOrder = state.floatingZOrder.filter(id => id !== action.panelId);
      newOrder.push(action.panelId);

      // Update z-indices
      const updatedPanels = new Map(state.panels);
      newOrder.forEach((id, index) => {
        const p = updatedPanels.get(id);
        if (p) {
          updatedPanels.set(id, { ...p, zIndex: 100 + index });
        }
      });

      return { ...state, panels: updatedPanels, floatingZOrder: newOrder };
    }

    case 'TOGGLE_GRID_SNAP':
      return { ...state, snapToGrid: !state.snapToGrid };

    case 'SET_GRID_SIZE':
      return { ...state, gridSize: Math.max(8, Math.min(64, action.size)) };

    case 'SET_BACKGROUND':
      return {
        ...state,
        background: { ...state.background, ...action.background },
      };

    case 'APPLY_PRESET': {
      const preset = LAYOUT_PRESETS.find(p => p.id === action.presetId);
      if (!preset) return state;

      const updatedPanels = new Map(state.panels);

      for (const [panelId, panelConfig] of Object.entries(preset.panels)) {
        const existing = updatedPanels.get(panelId as PanelId);
        if (existing) {
          updatedPanels.set(panelId as PanelId, { ...existing, ...panelConfig });
        }
      }

      return {
        ...state,
        panels: updatedPanels,
        background: preset.background
          ? { ...state.background, ...preset.background }
          : state.background,
      };
    }

    default:
      return state;
  }
}

// =============================================================================
// INITIAL STATE CREATION
// =============================================================================

export function createInitialDockableLayoutState(
  viewportWidth: number,
  viewportHeight: number
): DockableLayoutState {
  const panels = new Map<PanelId, DockablePanel>();

  // Initialize panels with default positions
  const leftPanelWidth = Math.min(320, viewportWidth * 0.25);
  const rightPanelWidth = Math.min(300, viewportWidth * 0.23);

  panels.set('vera', {
    ...DEFAULT_PANELS.vera,
    x: 0,
    y: 0,
    width: leftPanelWidth,
    height: viewportHeight,
    zIndex: 10,
  });

  panels.set('spread', {
    ...DEFAULT_PANELS.spread,
    x: leftPanelWidth,
    y: 0,
    width: viewportWidth - leftPanelWidth - rightPanelWidth,
    height: viewportHeight,
    zIndex: 1,
  });

  panels.set('info', {
    ...DEFAULT_PANELS.info,
    x: viewportWidth - rightPanelWidth,
    y: 0,
    width: rightPanelWidth,
    height: viewportHeight,
    zIndex: 10,
  });

  panels.set('journal', {
    ...DEFAULT_PANELS.journal,
    x: viewportWidth - 400,
    y: 100,
    width: 350,
    height: 400,
    zIndex: 50,
  });

  panels.set('settings', {
    ...DEFAULT_PANELS.settings,
    x: 50,
    y: 100,
    width: 300,
    height: 400,
    zIndex: 51,
  });

  return {
    viewportWidth,
    viewportHeight,
    background: DEFAULT_DESKTOP_BACKGROUNDS[1],
    panels,
    dockZones: calculateDockZones(viewportWidth, viewportHeight),
    draggingPanel: null,
    resizingPanel: null,
    activeResizeHandle: null,
    dragOffset: { x: 0, y: 0 },
    highlightedDockZone: null,
    snapToGrid: true,
    gridSize: 16,
    floatingZOrder: ['journal', 'settings'],
  };
}

// =============================================================================
// CSS GENERATION
// =============================================================================

export function generateDesktopCSS(background: DesktopBackground): React.CSSProperties {
  let backgroundStyle: string;

  switch (background.type) {
    case 'solid':
      backgroundStyle = background.primaryColor;
      break;
    case 'gradient':
      const direction = background.gradientDirection === 'horizontal' ? 'to right'
        : background.gradientDirection === 'vertical' ? 'to bottom'
        : background.gradientDirection === 'radial' ? '' // handled separately
        : '135deg';

      if (background.gradientDirection === 'radial') {
        backgroundStyle = `radial-gradient(circle, ${background.primaryColor}, ${background.secondaryColor})`;
      } else {
        backgroundStyle = `linear-gradient(${direction}, ${background.primaryColor}, ${background.secondaryColor})`;
      }
      break;
    case 'image':
      backgroundStyle = `url(${background.imagePath})`;
      break;
    case 'pattern':
      backgroundStyle = background.primaryColor; // Pattern overlaid separately
      break;
    default:
      backgroundStyle = background.primaryColor;
  }

  return {
    position: 'fixed',
    inset: 0,
    background: backgroundStyle,
    opacity: background.opacity,
    filter: background.blur > 0 ? `blur(${background.blur}px)` : undefined,
    zIndex: 0,
  };
}

export function generatePanelCSS(panel: DockablePanel, isBeingDragged: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    left: panel.x,
    top: panel.y,
    width: panel.width,
    height: panel.isMinimized ? 40 : panel.height,
    zIndex: panel.zIndex,
    overflow: 'hidden',
    borderRadius: panel.isFloating ? 8 : 0,
    boxShadow: panel.isFloating ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
    opacity: isBeingDragged ? 0.8 : 1,
    transition: isBeingDragged ? 'none' : 'all 0.2s ease-out',
    cursor: isBeingDragged ? 'grabbing' : 'default',
  };
}

export function getResizeHandleCursor(handle: ResizeHandle): string {
  switch (handle) {
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'nw':
    case 'se':
      return 'nwse-resize';
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  DEFAULT_PANELS,
  DEFAULT_DESKTOP_BACKGROUNDS,
  LAYOUT_PRESETS,
  calculateDockZones,
  handlePanelDrag,
  handlePanelResize,
  handleDragEnd,
  dockableLayoutReducer,
  createInitialDockableLayoutState,
  generateDesktopCSS,
  generatePanelCSS,
  getResizeHandleCursor,
};
