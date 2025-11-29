/**
 * Main Menu UI
 * Slick, elegant, clean, minimal - but deep
 * Represents Orthogonal: attention reveals hidden structure
 *
 * Philosophy: The menu IS the first puzzle.
 * - Initially shows almost nothing
 * - Attention (mouse hover / focus) reveals more
 * - The longer you observe, the more appears
 * - Hidden depth emerges organically
 */

export type MenuState = 'initial' | 'awakening' | 'present' | 'deep';

export interface MenuConfig {
  onPlay: () => void;
  onContinue: () => void;
  onMultiplayer: () => void;
  onSpectate: () => void;
  onLeaderboards: () => void;
  onSettings: () => void;
  onStream: () => void;
}

export class MainMenu {
  private container: HTMLDivElement;
  private config: MenuConfig;
  private state: MenuState = 'initial';
  private awarenessLevel: number = 0;
  private attentionTime: number = 0;
  private hoveredElement: HTMLElement | null = null;

  // Animation
  private animationFrame: number | null = null;
  private lastTime: number = 0;

  constructor(config: MenuConfig) {
    this.config = config;
    this.container = this.createMenu();
    this.startAwarenessLoop();
  }

  private createMenu(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'orthogonal-menu';
    container.innerHTML = `
      <div class="menu-background">
        <div class="void-gradient"></div>
        <canvas class="attention-field"></canvas>
      </div>

      <div class="menu-content">
        <!-- Logo / Title - minimal at first -->
        <div class="menu-logo" data-depth="0">
          <div class="logo-symbol">⬡</div>
          <div class="logo-text">
            <span class="logo-main">ORTHOGONAL</span>
            <span class="logo-sub" data-reveal="1">REALITY IS ATTENTION</span>
          </div>
        </div>

        <!-- Primary actions - emerge with attention -->
        <nav class="menu-nav">
          <button class="menu-btn primary" data-action="play" data-depth="0">
            <span class="btn-icon">▶</span>
            <span class="btn-text">PLAY</span>
          </button>

          <button class="menu-btn" data-action="continue" data-depth="1" data-reveal="1">
            <span class="btn-icon">↻</span>
            <span class="btn-text">CONTINUE</span>
          </button>

          <button class="menu-btn" data-action="multiplayer" data-depth="1" data-reveal="1">
            <span class="btn-icon">◈</span>
            <span class="btn-text">TOGETHER</span>
            <span class="btn-badge online-count">--</span>
          </button>

          <button class="menu-btn" data-action="spectate" data-depth="2" data-reveal="2">
            <span class="btn-icon">👁</span>
            <span class="btn-text">WITNESS</span>
            <span class="btn-badge live-count">--</span>
          </button>
        </nav>

        <!-- Secondary - hidden deeper -->
        <div class="menu-secondary" data-reveal="2">
          <button class="menu-btn-small" data-action="leaderboards">
            <span>LEADERBOARDS</span>
          </button>
          <button class="menu-btn-small" data-action="stream">
            <span>STREAM SETUP</span>
          </button>
          <button class="menu-btn-small" data-action="settings">
            <span>SETTINGS</span>
          </button>
        </div>

        <!-- Player info - appears with awareness -->
        <div class="menu-player" data-reveal="1">
          <div class="player-avatar"></div>
          <div class="player-info">
            <span class="player-name">Observer</span>
            <span class="player-rank" data-reveal="2">#---</span>
          </div>
        </div>

        <!-- Awareness indicator - the longer you stay, the more it fills -->
        <div class="awareness-meter" data-reveal="1">
          <div class="meter-fill"></div>
          <span class="meter-label">AWARENESS</span>
        </div>
      </div>

      <!-- Hidden quote - only appears at deep awareness -->
      <div class="menu-quote" data-reveal="3">
        <p>"The observer changes the observed."</p>
      </div>

      <!-- Version / minimal footer -->
      <div class="menu-footer">
        <span class="version">v0.1.0</span>
        <span class="divider" data-reveal="2">·</span>
        <a href="#" class="footer-link" data-reveal="2">Discord</a>
        <span class="divider" data-reveal="2">·</span>
        <a href="#" class="footer-link" data-reveal="2">Support</a>
      </div>
    `;

    this.applyStyles();
    this.setupInteractions();
    return container;
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

      .orthogonal-menu {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: #0a0a0f;
        color: white;
        overflow: hidden;
        user-select: none;
      }

      /* ========================================
         Background - subtle, living void
         ======================================== */

      .menu-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
      }

      .void-gradient {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(ellipse at 50% 50%, rgba(102, 126, 234, 0.05) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 2s ease;
      }

      .orthogonal-menu.awakening .void-gradient,
      .orthogonal-menu.present .void-gradient,
      .orthogonal-menu.deep .void-gradient {
        opacity: 1;
      }

      .attention-field {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 1s ease;
      }

      .orthogonal-menu.present .attention-field,
      .orthogonal-menu.deep .attention-field {
        opacity: 0.3;
      }

      /* ========================================
         Content - centered, breathing
         ======================================== */

      .menu-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 40px;
      }

      /* ========================================
         Logo - minimal, expanding
         ======================================== */

      .menu-logo {
        text-align: center;
        margin-bottom: 60px;
      }

      .logo-symbol {
        font-size: 64px;
        line-height: 1;
        margin-bottom: 16px;
        opacity: 0.8;
        animation: pulse-slow 4s ease-in-out infinite;
      }

      @keyframes pulse-slow {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.02); }
      }

      .logo-main {
        display: block;
        font-size: 32px;
        font-weight: 300;
        letter-spacing: 12px;
        margin-left: 12px; /* Offset for letter-spacing */
      }

      .logo-sub {
        display: block;
        font-size: 11px;
        font-weight: 400;
        letter-spacing: 4px;
        color: rgba(255, 255, 255, 0.3);
        margin-top: 12px;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.8s ease;
      }

      /* ========================================
         Navigation - stacked, clean
         ======================================== */

      .menu-nav {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 40px;
      }

      .menu-btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 16px 48px;
        min-width: 240px;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 2px;
        cursor: pointer;
        transition: all 0.3s ease;
        overflow: hidden;
      }

      .menu-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .menu-btn:hover::before {
        opacity: 1;
      }

      .menu-btn:hover {
        border-color: rgba(102, 126, 234, 0.4);
        transform: translateY(-2px);
      }

      .menu-btn.primary {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
        border-color: rgba(102, 126, 234, 0.3);
      }

      .menu-btn.primary:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
        border-color: rgba(102, 126, 234, 0.5);
      }

      .btn-icon {
        font-size: 16px;
        opacity: 0.7;
      }

      .btn-text {
        position: relative;
        z-index: 1;
      }

      .btn-badge {
        position: absolute;
        right: 16px;
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        font-size: 10px;
        font-weight: 400;
        letter-spacing: 0;
        opacity: 0.6;
      }

      /* Hidden buttons - fade in with awareness */
      .menu-btn[data-reveal] {
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none;
        transition: all 0.5s ease;
      }

      /* ========================================
         Secondary nav - smaller, subtle
         ======================================== */

      .menu-secondary {
        display: flex;
        gap: 24px;
        margin-bottom: 40px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.5s ease;
      }

      .menu-btn-small {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 1px;
        cursor: pointer;
        padding: 8px 0;
        transition: color 0.3s ease;
      }

      .menu-btn-small:hover {
        color: white;
      }

      /* ========================================
         Player info - corner
         ======================================== */

      .menu-player {
        position: fixed;
        top: 24px;
        right: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        opacity: 0;
        transform: translateX(20px);
        transition: all 0.5s ease;
      }

      .player-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .player-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .player-name {
        font-size: 13px;
        font-weight: 500;
      }

      .player-rank {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        opacity: 0;
        transition: opacity 0.5s ease;
      }

      /* ========================================
         Awareness meter - bottom
         ======================================== */

      .awareness-meter {
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        opacity: 0;
        transition: opacity 0.5s ease;
      }

      .meter-fill {
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent);
        width: 0%;
        transition: width 0.3s ease;
        border-radius: 1px;
      }

      .meter-label {
        display: block;
        text-align: center;
        font-size: 9px;
        letter-spacing: 3px;
        color: rgba(255, 255, 255, 0.2);
        margin-top: 8px;
      }

      /* ========================================
         Quote - deep awareness
         ======================================== */

      .menu-quote {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        opacity: 0;
        transition: opacity 1s ease;
      }

      .menu-quote p {
        font-size: 13px;
        font-style: italic;
        color: rgba(255, 255, 255, 0.3);
        letter-spacing: 1px;
      }

      /* ========================================
         Footer - minimal
         ======================================== */

      .menu-footer {
        position: fixed;
        bottom: 20px;
        right: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.2);
      }

      .footer-link {
        color: rgba(255, 255, 255, 0.3);
        text-decoration: none;
        transition: color 0.3s ease;
      }

      .footer-link:hover {
        color: white;
      }

      .divider {
        opacity: 0;
        transition: opacity 0.5s ease;
      }

      /* ========================================
         Reveal states - awareness-based
         ======================================== */

      [data-reveal] {
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none;
        transition: all 0.5s ease;
      }

      /* Awareness level 1 */
      .orthogonal-menu.awakening [data-reveal="1"],
      .orthogonal-menu.present [data-reveal="1"],
      .orthogonal-menu.deep [data-reveal="1"] {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      /* Awareness level 2 */
      .orthogonal-menu.present [data-reveal="2"],
      .orthogonal-menu.deep [data-reveal="2"] {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      /* Awareness level 3 - deep */
      .orthogonal-menu.deep [data-reveal="3"] {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      /* ========================================
         Hover effects - attention tracking
         ======================================== */

      .menu-btn.hovered {
        border-color: rgba(102, 126, 234, 0.6);
        box-shadow: 0 0 30px rgba(102, 126, 234, 0.1);
      }

      /* ========================================
         Transitions
         ======================================== */

      .orthogonal-menu * {
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;

    document.head.appendChild(style);
  }

  private setupInteractions(): void {
    // Button clicks
    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = (btn as HTMLElement).dataset.action;
        this.handleAction(action!);
      });
    });

    // Attention tracking - hover reveals
    this.container.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        this.hoveredElement = btn as HTMLElement;
        btn.classList.add('hovered');
      });

      btn.addEventListener('mouseleave', () => {
        this.hoveredElement = null;
        btn.classList.remove('hovered');
      });
    });

    // Mouse movement affects attention field
    this.container.addEventListener('mousemove', (e) => {
      this.updateAttentionField(e.clientX, e.clientY);
    });

    // Any interaction increases awareness
    this.container.addEventListener('mousedown', () => {
      this.boostAwareness(0.1);
    });
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'play':
        this.config.onPlay();
        break;
      case 'continue':
        this.config.onContinue();
        break;
      case 'multiplayer':
        this.config.onMultiplayer();
        break;
      case 'spectate':
        this.config.onSpectate();
        break;
      case 'leaderboards':
        this.config.onLeaderboards();
        break;
      case 'settings':
        this.config.onSettings();
        break;
      case 'stream':
        this.config.onStream();
        break;
    }
  }

  // ========================================
  // Awareness System
  // ========================================

  private startAwarenessLoop(): void {
    this.lastTime = performance.now();
    this.awarenessLoop();
  }

  private awarenessLoop = (): void => {
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Awareness increases over time just from presence
    this.attentionTime += delta;

    // Faster increase while hovering
    if (this.hoveredElement) {
      this.awarenessLevel += delta * 0.3;
    } else {
      // Slower passive increase
      this.awarenessLevel += delta * 0.05;
    }

    // Cap at 1
    this.awarenessLevel = Math.min(1, this.awarenessLevel);

    // Update state based on awareness level
    this.updateState();

    // Update meter
    this.updateAwarenessMeter();

    this.animationFrame = requestAnimationFrame(this.awarenessLoop);
  };

  private updateState(): void {
    const oldState = this.state;

    if (this.awarenessLevel < 0.15) {
      this.state = 'initial';
    } else if (this.awarenessLevel < 0.4) {
      this.state = 'awakening';
    } else if (this.awarenessLevel < 0.75) {
      this.state = 'present';
    } else {
      this.state = 'deep';
    }

    if (oldState !== this.state) {
      this.container.className = `orthogonal-menu ${this.state}`;
    }
  }

  private updateAwarenessMeter(): void {
    const fill = this.container.querySelector('.meter-fill') as HTMLElement;
    if (fill) {
      fill.style.width = `${this.awarenessLevel * 100}%`;
    }
  }

  private boostAwareness(amount: number): void {
    this.awarenessLevel = Math.min(1, this.awarenessLevel + amount);
  }

  private updateAttentionField(x: number, y: number): void {
    const canvas = this.container.querySelector('.attention-field') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas if needed
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Draw subtle attention gradient at mouse position
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 200);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ========================================
  // Public API
  // ========================================

  updateOnlineCount(count: number): void {
    const badge = this.container.querySelector('.online-count');
    if (badge) {
      badge.textContent = count > 0 ? count.toString() : '--';
    }
  }

  updateLiveCount(count: number): void {
    const badge = this.container.querySelector('.live-count');
    if (badge) {
      badge.textContent = count > 0 ? count.toString() : '--';
    }
  }

  updatePlayerInfo(name: string, rank?: number): void {
    const nameEl = this.container.querySelector('.player-name');
    const rankEl = this.container.querySelector('.player-rank');

    if (nameEl) nameEl.textContent = name;
    if (rankEl && rank) rankEl.textContent = `#${rank.toLocaleString()}`;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.container.remove();
  }

  show(): void {
    this.container.style.display = 'block';
    this.startAwarenessLoop();
  }

  hide(): void {
    this.container.style.display = 'none';
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  // Skip to full awareness (for returning players)
  skipToFull(): void {
    this.awarenessLevel = 1;
    this.state = 'deep';
    this.container.className = `orthogonal-menu ${this.state}`;
  }

  // Update method for game loop integration
  update(_delta: number, _mousePosition?: { x: number; y: number }): void {
    // Menu updates are handled by internal awareness loop
    // This method exists for compatibility with game loop
  }

  // Get current awareness level
  getAwarenessLevel(): number {
    return this.awarenessLevel;
  }

  // Get current menu state
  getState(): MenuState {
    return this.state;
  }
}
