/**
 * Input Manager
 * Unified input handling for mouse, touch, and gamepad
 * All inputs map to the same abstract actions: attention, focus, witness
 */

export interface PointerState {
  x: number;  // -1 to 1 (normalized device coordinates)
  y: number;  // -1 to 1
  active: boolean;
}

export interface InputState {
  pointer: PointerState;
  focusing: boolean;       // Left click / touch / A button
  witnessing: boolean;     // Right click / two-finger / RT/RB
  pause: boolean;          // Escape / Start
  quickNav: boolean;       // Space / X button (after unlock)
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private state: InputState;
  private gamepad: Gamepad | null = null;
  private gamepadIndex: number = -1;

  // For behavior tracking (SDPM input)
  private inputHistory: InputEvent[] = [];
  private readonly HISTORY_LIMIT = 1000;

  // Key and mouse state tracking
  private keysDown: Set<string> = new Set();
  private mouseButtonsDown: Set<number> = new Set();
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private lastMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private mouseVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private lastMouseTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.state = {
      pointer: { x: 0, y: 0, active: false },
      focusing: false,
      witnessing: false,
      pause: false,
      quickNav: false,
    };
  }

  initialize(): void {
    // Mouse events
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));

    // Touch events
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    // Keyboard events
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    // Gamepad events
    window.addEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));

    console.log('[Input] Initialized');
  }

  update(): void {
    // Poll gamepad if connected
    if (this.gamepadIndex >= 0) {
      this.pollGamepad();
    }
  }

  // Mouse handlers
  private onMouseMove(e: MouseEvent): void {
    this.updatePointerFromEvent(e.clientX, e.clientY);

    // Track velocity
    const now = performance.now();
    const dt = now - this.lastMouseTime;
    if (dt > 0) {
      this.mouseVelocity.x = (e.clientX - this.lastMousePosition.x) / dt;
      this.mouseVelocity.y = (e.clientY - this.lastMousePosition.y) / dt;
    }
    this.lastMousePosition = { x: e.clientX, y: e.clientY };
    this.mousePosition = { x: e.clientX, y: e.clientY };
    this.lastMouseTime = now;

    this.recordInput('mouse_move', { x: e.clientX, y: e.clientY });
  }

  private onMouseDown(e: MouseEvent): void {
    this.mouseButtonsDown.add(e.button);
    if (e.button === 0) {
      this.state.focusing = true;
      this.recordInput('focus_start', {});
    } else if (e.button === 2) {
      this.state.witnessing = true;
      this.recordInput('witness_start', {});
    }
  }

  private onMouseUp(e: MouseEvent): void {
    this.mouseButtonsDown.delete(e.button);
    if (e.button === 0) {
      this.state.focusing = false;
      this.recordInput('focus_end', {});
    } else if (e.button === 2) {
      this.state.witnessing = false;
      this.recordInput('witness_end', {});
    }
  }

  // Touch handlers
  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.updatePointerFromEvent(touch.clientX, touch.clientY);
    this.state.pointer.active = true;

    // Two fingers = witness mode
    if (e.touches.length >= 2) {
      this.state.witnessing = true;
      this.recordInput('witness_start', { touchCount: e.touches.length });
    } else {
      this.state.focusing = true;
      this.recordInput('focus_start', { touch: true });
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.updatePointerFromEvent(touch.clientX, touch.clientY);
  }

  private onTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      this.state.pointer.active = false;
      this.state.focusing = false;
      this.state.witnessing = false;
      this.recordInput('touch_end', {});
    } else if (e.touches.length < 2) {
      this.state.witnessing = false;
    }
  }

  // Keyboard handlers
  private onKeyDown(e: KeyboardEvent): void {
    this.keysDown.add(e.code);
    switch (e.code) {
      case 'Tab':
        e.preventDefault();
        this.state.witnessing = true;
        this.recordInput('witness_start', { key: 'tab' });
        break;
      case 'Space':
        e.preventDefault();
        this.state.quickNav = true;
        this.recordInput('quick_nav', {});
        break;
      case 'Escape':
        this.state.pause = true;
        this.recordInput('pause', {});
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
    switch (e.code) {
      case 'Tab':
        this.state.witnessing = false;
        this.recordInput('witness_end', { key: 'tab' });
        break;
      case 'Space':
        this.state.quickNav = false;
        break;
      case 'Escape':
        this.state.pause = false;
        break;
    }
  }

  // Gamepad handlers
  private onGamepadConnected(e: GamepadEvent): void {
    console.log('[Input] Gamepad connected:', e.gamepad.id);
    this.gamepadIndex = e.gamepad.index;
    this.recordInput('gamepad_connected', { id: e.gamepad.id });
  }

  private onGamepadDisconnected(e: GamepadEvent): void {
    console.log('[Input] Gamepad disconnected');
    if (e.gamepad.index === this.gamepadIndex) {
      this.gamepadIndex = -1;
      this.gamepad = null;
    }
  }

  private pollGamepad(): void {
    const gamepads = navigator.getGamepads();
    this.gamepad = gamepads[this.gamepadIndex];

    if (!this.gamepad) return;

    // Right stick for attention
    const rx = this.gamepad.axes[2] || 0;
    const ry = this.gamepad.axes[3] || 0;
    const deadzone = 0.15;

    if (Math.abs(rx) > deadzone || Math.abs(ry) > deadzone) {
      this.state.pointer.x = rx;
      this.state.pointer.y = -ry;  // Invert Y
      this.state.pointer.active = true;
    }

    // A button (0) = focus
    this.state.focusing = this.gamepad.buttons[0]?.pressed || false;

    // RT (7) or RB (5) = witness
    this.state.witnessing =
      this.gamepad.buttons[7]?.pressed ||
      this.gamepad.buttons[5]?.pressed ||
      false;

    // X button (2) = quick nav
    this.state.quickNav = this.gamepad.buttons[2]?.pressed || false;

    // Start button (9) = pause
    this.state.pause = this.gamepad.buttons[9]?.pressed || false;
  }

  // Helpers
  private updatePointerFromEvent(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.state.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.state.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.state.pointer.active = true;
  }

  // Behavior tracking for SDPM
  private recordInput(type: string, data: any): void {
    const event: InputEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.inputHistory.push(event);

    // Trim history
    if (this.inputHistory.length > this.HISTORY_LIMIT) {
      this.inputHistory.shift();
    }
  }

  // Public API
  getPointer(): PointerState {
    return { ...this.state.pointer };
  }

  isFocusing(): boolean {
    return this.state.focusing;
  }

  isWitnessing(): boolean {
    return this.state.witnessing;
  }

  isPaused(): boolean {
    return this.state.pause;
  }

  isQuickNav(): boolean {
    return this.state.quickNav;
  }

  hasGamepad(): boolean {
    return this.gamepadIndex >= 0;
  }

  // Get input history for SDPM analysis
  getInputHistory(): InputEvent[] {
    return [...this.inputHistory];
  }

  // Get input patterns for SDPM profiling
  getInputPatterns(): InputPatterns {
    return analyzeInputPatterns(this.inputHistory);
  }

  // Additional public API methods
  getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }

  getMouseVelocity(): { x: number; y: number } {
    return { ...this.mouseVelocity };
  }

  isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  isMouseButtonDown(button: number): boolean {
    return this.mouseButtonsDown.has(button);
  }

  // Export InputPatterns for external use
}

export type { InputPatterns };

// Types for behavior analysis
interface InputEvent {
  type: string;
  data: any;
  timestamp: number;
}

interface InputPatterns {
  // Timing patterns
  averageWitnessDuration: number;
  averageFocusDuration: number;
  inputCadence: number;  // Actions per minute

  // Movement patterns
  mouseVelocityAvg: number;
  mouseVelocityVariance: number;
  pathSmoothness: number;  // 0 = jerky, 1 = smooth

  // Decision patterns
  hesitationScore: number;  // How often they pause before acting
  explorationScore: number;  // How much they look around vs beeline
  witnessUtilization: number;  // How often they use witness mode

  // Personality indicators (maps to SDPM dimensions)
  impulsivity: number;      // Quick decisions vs deliberate
  curiosity: number;        // Exploration vs efficiency
  patience: number;         // Willingness to wait/observe
  confidence: number;       // Direct paths vs cautious
}

function analyzeInputPatterns(history: InputEvent[]): InputPatterns {
  if (history.length < 10) {
    return getDefaultPatterns();
  }

  // Calculate timing patterns
  const witnessDurations = calculateDurations(history, 'witness_start', 'witness_end');
  const focusDurations = calculateDurations(history, 'focus_start', 'focus_end');

  const totalTime = history[history.length - 1].timestamp - history[0].timestamp;
  const inputCadence = (history.length / totalTime) * 60000;  // Per minute

  // Calculate movement patterns
  const mouseMoves = history.filter(e => e.type === 'mouse_move');
  const velocities = calculateVelocities(mouseMoves);

  // Calculate decision patterns
  const hesitations = countHesitations(history);
  const explorationScore = calculateExploration(history);
  const witnessRatio = witnessDurations.length / Math.max(1, focusDurations.length);

  return {
    averageWitnessDuration: average(witnessDurations),
    averageFocusDuration: average(focusDurations),
    inputCadence,

    mouseVelocityAvg: average(velocities),
    mouseVelocityVariance: variance(velocities),
    pathSmoothness: calculateSmoothness(mouseMoves),

    hesitationScore: hesitations,
    explorationScore,
    witnessUtilization: Math.min(1, witnessRatio),

    // Derived personality indicators
    impulsivity: 1 - Math.min(1, average(focusDurations) / 1000),
    curiosity: explorationScore,
    patience: Math.min(1, average(witnessDurations) / 2000),
    confidence: 1 - hesitations,
  };
}

function getDefaultPatterns(): InputPatterns {
  return {
    averageWitnessDuration: 500,
    averageFocusDuration: 300,
    inputCadence: 30,
    mouseVelocityAvg: 0.5,
    mouseVelocityVariance: 0.1,
    pathSmoothness: 0.5,
    hesitationScore: 0.5,
    explorationScore: 0.5,
    witnessUtilization: 0.5,
    impulsivity: 0.5,
    curiosity: 0.5,
    patience: 0.5,
    confidence: 0.5,
  };
}

function calculateDurations(
  history: InputEvent[],
  startType: string,
  endType: string
): number[] {
  const durations: number[] = [];
  let startTime: number | null = null;

  for (const event of history) {
    if (event.type === startType) {
      startTime = event.timestamp;
    } else if (event.type === endType && startTime !== null) {
      durations.push(event.timestamp - startTime);
      startTime = null;
    }
  }

  return durations;
}

function calculateVelocities(moves: InputEvent[]): number[] {
  if (moves.length < 2) return [0];

  const velocities: number[] = [];
  for (let i = 1; i < moves.length; i++) {
    const prev = moves[i - 1];
    const curr = moves[i];
    const dt = curr.timestamp - prev.timestamp;
    if (dt > 0) {
      const dx = (curr.data.x - prev.data.x) || 0;
      const dy = (curr.data.y - prev.data.y) || 0;
      const dist = Math.sqrt(dx * dx + dy * dy);
      velocities.push(dist / dt);
    }
  }

  return velocities;
}

function calculateSmoothness(moves: InputEvent[]): number {
  if (moves.length < 3) return 0.5;

  let angleChanges = 0;
  for (let i = 2; i < moves.length; i++) {
    const a = moves[i - 2].data;
    const b = moves[i - 1].data;
    const c = moves[i].data;

    const angle1 = Math.atan2(b.y - a.y, b.x - a.x);
    const angle2 = Math.atan2(c.y - b.y, c.x - b.x);
    const change = Math.abs(angle2 - angle1);
    angleChanges += Math.min(change, Math.PI * 2 - change);
  }

  const avgChange = angleChanges / (moves.length - 2);
  return Math.max(0, 1 - avgChange / Math.PI);
}

function countHesitations(history: InputEvent[]): number {
  // Count long pauses before focus actions
  let hesitations = 0;
  let total = 0;

  for (let i = 1; i < history.length; i++) {
    if (history[i].type === 'focus_start') {
      const gap = history[i].timestamp - history[i - 1].timestamp;
      if (gap > 500) hesitations++;  // >500ms = hesitation
      total++;
    }
  }

  return total > 0 ? hesitations / total : 0.5;
}

function calculateExploration(history: InputEvent[]): number {
  const moves = history.filter(e => e.type === 'mouse_move');
  const focuses = history.filter(e => e.type === 'focus_start');

  if (focuses.length === 0) return 0.5;

  // Ratio of looking around to acting
  return Math.min(1, moves.length / (focuses.length * 20));
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const avg = average(arr);
  return arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
}
