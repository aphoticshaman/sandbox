/**
 * StreamerMode.ts
 *
 * Zero-friction streaming experience
 * Auto-detects platform, configures everything, just works
 */

// =============================================================================
// TYPES
// =============================================================================

export type StreamPlatform = 'tiktok' | 'twitch' | 'youtube' | 'kick' | 'unknown';

export interface StreamerProfile {
  platform: StreamPlatform;
  username: string;
  isLive: boolean;
  viewerCount: number;
  chatEnabled: boolean;
  giftsEnabled: boolean;
  overlayEnabled: boolean;
  autoConnected: boolean;
}

export interface ViewerAction {
  type: 'emoji' | 'gift' | 'chat' | 'vote' | 'challenge';
  viewerId: string;
  viewerName: string;
  data: any;
  timestamp: number;
}

export interface StreamOverlayConfig {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showViewerCount: boolean;
  showRecentGifts: boolean;
  showVotingResults: boolean;
  showChallengeProgress: boolean;
  opacity: number;
  scale: number;
}

// =============================================================================
// AUTO-DETECT
// =============================================================================

class PlatformDetector {
  /**
   * Auto-detect streaming platform from environment
   */
  static detect(): StreamPlatform {
    // Check URL parameters (common for embeds)
    const params = new URLSearchParams(window.location.search);
    if (params.get('platform')) {
      return params.get('platform') as StreamPlatform;
    }

    // Check referrer
    const referrer = document.referrer.toLowerCase();
    if (referrer.includes('tiktok')) return 'tiktok';
    if (referrer.includes('twitch')) return 'twitch';
    if (referrer.includes('youtube')) return 'youtube';
    if (referrer.includes('kick')) return 'kick';

    // Check if TikTok WebView
    if (navigator.userAgent.includes('TikTok')) return 'tiktok';

    // Check localStorage for previous session
    const saved = localStorage.getItem('orthogonal_stream_platform');
    if (saved) return saved as StreamPlatform;

    return 'unknown';
  }

  /**
   * Check if user is likely a streamer
   */
  static isLikelyStreamer(): boolean {
    // Check for OBS browser source indicators
    if (navigator.userAgent.includes('OBS')) return true;

    // Check for common streaming software user agents
    if (navigator.userAgent.includes('Streamlabs')) return true;

    // Check for specific URL patterns
    if (window.location.search.includes('layer-type')) return true;
    if (window.location.search.includes('obs')) return true;

    // Check localStorage
    if (localStorage.getItem('orthogonal_streamer_mode')) return true;

    return false;
  }
}

// =============================================================================
// ONE-CLICK SETUP
// =============================================================================

export class StreamerSetup {
  private platform: StreamPlatform;
  private profile: StreamerProfile | null = null;
  private setupComplete: boolean = false;

  constructor() {
    this.platform = PlatformDetector.detect();
  }

  /**
   * The magic button - does everything
   */
  async oneClickSetup(): Promise<StreamerProfile> {
    // Step 1: Detect platform
    this.platform = PlatformDetector.detect();

    // Step 2: If unknown, show quick picker (not a form, just 4 buttons)
    if (this.platform === 'unknown') {
      this.platform = await this.showQuickPlatformPicker();
    }

    // Step 3: Auto-connect to platform
    const connected = await this.autoConnect();

    // Step 4: Apply optimal settings for platform
    this.applyOptimalSettings();

    // Step 5: Enable viewer interactions
    this.enableViewerInteractions();

    // Step 6: Create profile
    this.profile = {
      platform: this.platform,
      username: connected.username || 'Streamer',
      isLive: connected.isLive || false,
      viewerCount: 0,
      chatEnabled: true,
      giftsEnabled: this.platform === 'tiktok',
      overlayEnabled: true,
      autoConnected: connected.success
    };

    this.setupComplete = true;
    localStorage.setItem('orthogonal_streamer_mode', 'true');
    localStorage.setItem('orthogonal_stream_platform', this.platform);

    return this.profile;
  }

  /**
   * Show simple platform picker - just icons, no text
   */
  private showQuickPlatformPicker(): Promise<StreamPlatform> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = 'platform-picker';
      overlay.innerHTML = `
        <style>
          #platform-picker {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: system-ui, sans-serif;
          }
          #platform-picker h2 {
            color: white;
            font-size: 1.5rem;
            margin-bottom: 2rem;
            font-weight: 300;
          }
          .platform-buttons {
            display: flex;
            gap: 1.5rem;
          }
          .platform-btn {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            border: 2px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.05);
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
          }
          .platform-btn:hover {
            border-color: white;
            background: rgba(255,255,255,0.1);
            transform: scale(1.1);
          }
          .platform-btn.tiktok { border-color: #00f2ea; }
          .platform-btn.twitch { border-color: #9146ff; }
          .platform-btn.youtube { border-color: #ff0000; }
          .platform-btn.kick { border-color: #53fc18; }
          .skip-btn {
            margin-top: 2rem;
            color: rgba(255,255,255,0.5);
            background: none;
            border: none;
            cursor: pointer;
            font-size: 0.9rem;
          }
          .skip-btn:hover { color: white; }
        </style>
        <h2>Where are you streaming?</h2>
        <div class="platform-buttons">
          <button class="platform-btn tiktok" data-platform="tiktok">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
            </svg>
          </button>
          <button class="platform-btn twitch" data-platform="twitch">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
          </button>
          <button class="platform-btn youtube" data-platform="youtube">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </button>
          <button class="platform-btn kick" data-platform="kick">
            <span style="font-weight:bold;font-size:1.2rem;color:#53fc18">K</span>
          </button>
        </div>
        <button class="skip-btn">Skip - I'm not streaming</button>
      `;

      document.body.appendChild(overlay);

      // Handle clicks
      overlay.querySelectorAll('.platform-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const platform = (btn as HTMLElement).dataset.platform as StreamPlatform;
          overlay.remove();
          resolve(platform);
        });
      });

      overlay.querySelector('.skip-btn')?.addEventListener('click', () => {
        overlay.remove();
        resolve('unknown');
      });
    });
  }

  /**
   * Auto-connect to platform API
   */
  private async autoConnect(): Promise<{ success: boolean; username?: string; isLive?: boolean }> {
    switch (this.platform) {
      case 'tiktok':
        return this.connectTikTok();
      case 'twitch':
        return this.connectTwitch();
      case 'youtube':
        return this.connectYouTube();
      case 'kick':
        return this.connectKick();
      default:
        return { success: false };
    }
  }

  private async connectTikTok(): Promise<{ success: boolean; username?: string; isLive?: boolean }> {
    // TikTok Live API connection
    // In production, this would use TikTok's WebSocket API
    try {
      // Check if in TikTok WebView
      if (navigator.userAgent.includes('TikTok')) {
        return { success: true, username: 'TikTok User', isLive: true };
      }

      // Otherwise need manual room ID
      const roomId = localStorage.getItem('tiktok_room_id');
      if (roomId) {
        return { success: true, username: 'TikTok Streamer', isLive: true };
      }

      return { success: false };
    } catch {
      return { success: false };
    }
  }

  private async connectTwitch(): Promise<{ success: boolean; username?: string; isLive?: boolean }> {
    // Twitch API connection
    try {
      // Check for Twitch embed
      const params = new URLSearchParams(window.location.search);
      const channel = params.get('channel');

      if (channel) {
        return { success: true, username: channel, isLive: true };
      }

      // Check localStorage for saved channel
      const saved = localStorage.getItem('twitch_channel');
      if (saved) {
        return { success: true, username: saved, isLive: true };
      }

      return { success: false };
    } catch {
      return { success: false };
    }
  }

  private async connectYouTube(): Promise<{ success: boolean; username?: string; isLive?: boolean }> {
    return { success: false };
  }

  private async connectKick(): Promise<{ success: boolean; username?: string; isLive?: boolean }> {
    return { success: false };
  }

  /**
   * Apply optimal settings for platform
   */
  private applyOptimalSettings(): void {
    const settings = this.getOptimalSettings();

    // Apply to game settings
    localStorage.setItem('orthogonal_settings', JSON.stringify(settings));
  }

  private getOptimalSettings(): object {
    // Base settings optimized for streaming
    const base = {
      graphics: {
        quality: 'high',
        postProcessing: true,
        targetFPS: 60,
        vSync: true
      },
      audio: {
        masterVolume: 0.7,  // Lower for stream mixing
        musicVolume: 0.5,
        sfxVolume: 0.8
      },
      social: {
        allowSpectators: true,
        showOnLeaderboards: true
      }
    };

    // Platform-specific adjustments
    switch (this.platform) {
      case 'tiktok':
        return {
          ...base,
          ui: {
            scale: 1.2,  // Larger for mobile viewers
            highContrast: true
          },
          viewerInteraction: {
            giftsEnabled: true,
            emojiRain: true,
            voteEnabled: true
          }
        };

      case 'twitch':
        return {
          ...base,
          ui: {
            scale: 1.0,
            channelPoints: true
          },
          viewerInteraction: {
            chatCommands: true,
            predictions: true,
            polls: true
          }
        };

      default:
        return base;
    }
  }

  /**
   * Enable viewer interactions
   */
  private enableViewerInteractions(): void {
    // This activates the viewer interaction system
    viewerInteraction.enable(this.platform);
  }

  /**
   * Check if setup is complete
   */
  isSetupComplete(): boolean {
    return this.setupComplete;
  }

  /**
   * Get current profile
   */
  getProfile(): StreamerProfile | null {
    return this.profile;
  }
}

// =============================================================================
// VIEWER INTERACTION (Zero Config)
// =============================================================================

class ViewerInteractionSystem {
  private enabled: boolean = false;
  private platform: StreamPlatform = 'unknown';
  private actionQueue: ViewerAction[] = [];
  private listeners: Map<string, Set<(action: ViewerAction) => void>> = new Map();

  // Active features
  private emojiRainActive: boolean = false;
  private currentVote: { options: string[]; votes: Map<string, number> } | null = null;
  private currentChallenge: { description: string; progress: number; goal: number } | null = null;

  /**
   * Enable viewer interactions for platform
   */
  enable(platform: StreamPlatform): void {
    this.platform = platform;
    this.enabled = true;

    // Start listening based on platform
    switch (platform) {
      case 'tiktok':
        this.setupTikTokListeners();
        break;
      case 'twitch':
        this.setupTwitchListeners();
        break;
    }
  }

  private setupTikTokListeners(): void {
    // TikTok Live events would come through WebSocket
    // For now, simulate with polling
    console.log('[Orthogonal] TikTok Live integration ready');
  }

  private setupTwitchListeners(): void {
    // Twitch events through EventSub or IRC
    console.log('[Orthogonal] Twitch integration ready');
  }

  /**
   * Process incoming viewer action
   */
  processAction(action: ViewerAction): void {
    if (!this.enabled) return;

    this.actionQueue.push(action);

    // Emit to listeners
    this.listeners.get(action.type)?.forEach(cb => cb(action));
    this.listeners.get('*')?.forEach(cb => cb(action));

    // Handle built-in reactions
    switch (action.type) {
      case 'emoji':
        this.handleEmoji(action);
        break;
      case 'gift':
        this.handleGift(action);
        break;
      case 'vote':
        this.handleVote(action);
        break;
      case 'challenge':
        this.handleChallenge(action);
        break;
    }
  }

  private handleEmoji(action: ViewerAction): void {
    // Trigger emoji rain effect
    emojiRain.spawn(action.data.emoji, action.viewerName);
  }

  private handleGift(action: ViewerAction): void {
    // Gift effects based on value
    const giftValue = action.data.value || 1;

    if (giftValue >= 100) {
      // Big gift = big effect
      specialEffects.trigger('gift_explosion', action.data);
    } else if (giftValue >= 10) {
      specialEffects.trigger('gift_burst', action.data);
    } else {
      specialEffects.trigger('gift_sparkle', action.data);
    }

    // Thank the gifter
    streamOverlay.showGiftThank(action.viewerName, action.data.giftName);
  }

  private handleVote(action: ViewerAction): void {
    if (!this.currentVote) return;

    const option = action.data.option;
    if (this.currentVote.options.includes(option)) {
      const current = this.currentVote.votes.get(option) || 0;
      this.currentVote.votes.set(option, current + 1);
    }
  }

  private handleChallenge(action: ViewerAction): void {
    if (!this.currentChallenge) return;

    this.currentChallenge.progress += action.data.contribution || 1;
  }

  /**
   * Start a viewer vote
   */
  startVote(question: string, options: string[], durationSeconds: number = 30): void {
    this.currentVote = {
      options,
      votes: new Map(options.map(o => [o, 0]))
    };

    streamOverlay.showVote(question, options, durationSeconds);

    setTimeout(() => {
      this.endVote();
    }, durationSeconds * 1000);
  }

  private endVote(): void {
    if (!this.currentVote) return;

    // Find winner
    let winner = '';
    let maxVotes = 0;
    for (const [option, votes] of this.currentVote.votes) {
      if (votes > maxVotes) {
        winner = option;
        maxVotes = votes;
      }
    }

    streamOverlay.showVoteResult(winner, maxVotes);
    this.listeners.get('vote_complete')?.forEach(cb => cb({
      type: 'vote',
      viewerId: 'system',
      viewerName: 'System',
      data: { winner, votes: Object.fromEntries(this.currentVote.votes) },
      timestamp: Date.now()
    }));

    this.currentVote = null;
  }

  /**
   * Start a viewer challenge
   */
  startChallenge(description: string, goal: number): void {
    this.currentChallenge = { description, progress: 0, goal };
    streamOverlay.showChallenge(description, 0, goal);
  }

  /**
   * Listen for viewer actions
   */
  on(type: string, callback: (action: ViewerAction) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  /**
   * Get recent actions
   */
  getRecentActions(count: number = 10): ViewerAction[] {
    return this.actionQueue.slice(-count);
  }
}

// =============================================================================
// EMOJI RAIN
// =============================================================================

class EmojiRainSystem {
  private container: HTMLElement | null = null;
  private activeEmojis: HTMLElement[] = [];
  private maxEmojis: number = 50;

  constructor() {
    this.createContainer();
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'emoji-rain';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Spawn an emoji
   */
  spawn(emoji: string, fromUser?: string): void {
    if (!this.container) return;
    if (this.activeEmojis.length >= this.maxEmojis) {
      // Remove oldest
      const oldest = this.activeEmojis.shift();
      oldest?.remove();
    }

    const el = document.createElement('div');
    el.textContent = emoji;
    el.style.cssText = `
      position: absolute;
      font-size: ${24 + Math.random() * 24}px;
      left: ${Math.random() * 100}%;
      top: -50px;
      animation: emoji-fall ${2 + Math.random() * 2}s linear forwards;
      opacity: 0.9;
    `;

    // Add animation keyframes if not exists
    if (!document.querySelector('#emoji-rain-styles')) {
      const style = document.createElement('style');
      style.id = 'emoji-rain-styles';
      style.textContent = `
        @keyframes emoji-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    this.container.appendChild(el);
    this.activeEmojis.push(el);

    // Remove after animation
    setTimeout(() => {
      el.remove();
      const idx = this.activeEmojis.indexOf(el);
      if (idx > -1) this.activeEmojis.splice(idx, 1);
    }, 4000);
  }

  /**
   * Burst of emojis
   */
  burst(emoji: string, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.spawn(emoji), i * 50);
    }
  }
}

// =============================================================================
// STREAM OVERLAY
// =============================================================================

class StreamOverlaySystem {
  private container: HTMLElement | null = null;
  private config: StreamOverlayConfig;

  constructor() {
    this.config = {
      position: 'top-right',
      showViewerCount: true,
      showRecentGifts: true,
      showVotingResults: true,
      showChallengeProgress: true,
      opacity: 0.9,
      scale: 1
    };

    this.createOverlay();
  }

  private createOverlay(): void {
    this.container = document.createElement('div');
    this.container.id = 'stream-overlay';
    this.container.innerHTML = `
      <style>
        #stream-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9998;
          font-family: system-ui, sans-serif;
          color: white;
          pointer-events: none;
        }
        .overlay-card {
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 10px;
          min-width: 200px;
        }
        .viewer-count {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.1rem;
        }
        .viewer-count .dot {
          width: 8px;
          height: 8px;
          background: #ff0000;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .gift-notification {
          animation: slide-in 0.3s ease-out;
        }
        @keyframes slide-in {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .vote-container {
          min-width: 250px;
        }
        .vote-option {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          padding: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 6px;
        }
        .vote-bar {
          height: 4px;
          background: #4488ff;
          border-radius: 2px;
          transition: width 0.3s;
        }
        .challenge-progress {
          height: 8px;
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }
        .challenge-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ff88, #00ffcc);
          transition: width 0.3s;
        }
      </style>
      <div class="overlay-content">
        <div class="overlay-card viewer-section" style="display:none">
          <div class="viewer-count">
            <span class="dot"></span>
            <span class="count">0</span> watching
          </div>
        </div>
        <div class="overlay-card gift-section" style="display:none"></div>
        <div class="overlay-card vote-section" style="display:none"></div>
        <div class="overlay-card challenge-section" style="display:none"></div>
      </div>
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Update viewer count
   */
  updateViewerCount(count: number): void {
    const section = this.container?.querySelector('.viewer-section') as HTMLElement;
    const countEl = section?.querySelector('.count');
    if (section && countEl) {
      section.style.display = 'block';
      countEl.textContent = count.toLocaleString();
    }
  }

  /**
   * Show gift thank you
   */
  showGiftThank(username: string, giftName: string): void {
    const section = this.container?.querySelector('.gift-section') as HTMLElement;
    if (!section) return;

    section.style.display = 'block';
    section.innerHTML = `
      <div class="gift-notification">
        <strong>${username}</strong> sent ${giftName}!
      </div>
    `;

    // Auto-hide after 5s
    setTimeout(() => {
      section.style.display = 'none';
    }, 5000);
  }

  /**
   * Show vote
   */
  showVote(question: string, options: string[], duration: number): void {
    const section = this.container?.querySelector('.vote-section') as HTMLElement;
    if (!section) return;

    section.style.display = 'block';
    section.classList.add('vote-container');
    section.innerHTML = `
      <div style="font-weight:bold;margin-bottom:8px">${question}</div>
      ${options.map((opt, i) => `
        <div class="vote-option" data-option="${opt}">
          <span>${i + 1}. ${opt}</span>
          <span class="vote-count">0</span>
        </div>
        <div class="vote-bar" style="width:0%"></div>
      `).join('')}
      <div style="font-size:0.8rem;opacity:0.7;margin-top:8px">${duration}s remaining</div>
    `;
  }

  /**
   * Update vote counts
   */
  updateVote(votes: Record<string, number>): void {
    const section = this.container?.querySelector('.vote-section') as HTMLElement;
    if (!section) return;

    const total = Object.values(votes).reduce((a, b) => a + b, 0) || 1;

    for (const [option, count] of Object.entries(votes)) {
      const optEl = section.querySelector(`[data-option="${option}"]`);
      const countEl = optEl?.querySelector('.vote-count');
      const barEl = optEl?.nextElementSibling as HTMLElement;

      if (countEl) countEl.textContent = count.toString();
      if (barEl) barEl.style.width = `${(count / total) * 100}%`;
    }
  }

  /**
   * Show vote result
   */
  showVoteResult(winner: string, votes: number): void {
    const section = this.container?.querySelector('.vote-section') as HTMLElement;
    if (!section) return;

    section.innerHTML = `
      <div style="text-align:center">
        <div style="font-size:2rem">🎉</div>
        <div style="font-weight:bold">${winner} wins!</div>
        <div style="opacity:0.7">${votes} votes</div>
      </div>
    `;

    setTimeout(() => {
      section.style.display = 'none';
    }, 5000);
  }

  /**
   * Show challenge
   */
  showChallenge(description: string, progress: number, goal: number): void {
    const section = this.container?.querySelector('.challenge-section') as HTMLElement;
    if (!section) return;

    section.style.display = 'block';
    section.innerHTML = `
      <div style="font-weight:bold">${description}</div>
      <div class="challenge-progress">
        <div class="challenge-fill" style="width:${(progress / goal) * 100}%"></div>
      </div>
      <div style="font-size:0.9rem;opacity:0.7">${progress} / ${goal}</div>
    `;
  }

  /**
   * Update challenge progress
   */
  updateChallenge(progress: number, goal: number): void {
    const fill = this.container?.querySelector('.challenge-fill') as HTMLElement;
    const text = this.container?.querySelector('.challenge-section > div:last-child');

    if (fill) fill.style.width = `${(progress / goal) * 100}%`;
    if (text) text.textContent = `${progress} / ${goal}`;

    if (progress >= goal) {
      this.showChallengeComplete();
    }
  }

  private showChallengeComplete(): void {
    const section = this.container?.querySelector('.challenge-section') as HTMLElement;
    if (!section) return;

    section.innerHTML = `
      <div style="text-align:center">
        <div style="font-size:2rem">🎊</div>
        <div style="font-weight:bold">Challenge Complete!</div>
      </div>
    `;

    setTimeout(() => {
      section.style.display = 'none';
    }, 5000);
  }

  /**
   * Configure overlay
   */
  configure(config: Partial<StreamOverlayConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyConfig();
  }

  private applyConfig(): void {
    if (!this.container) return;

    // Position
    const positions: Record<string, string> = {
      'top-left': 'top:20px;left:20px;right:auto',
      'top-right': 'top:20px;right:20px;left:auto',
      'bottom-left': 'bottom:20px;left:20px;right:auto;top:auto',
      'bottom-right': 'bottom:20px;right:20px;left:auto;top:auto'
    };

    this.container.style.cssText += positions[this.config.position];
    this.container.style.opacity = this.config.opacity.toString();
    this.container.style.transform = `scale(${this.config.scale})`;
  }
}

// =============================================================================
// SPECIAL EFFECTS
// =============================================================================

class SpecialEffectsSystem {
  private container: HTMLElement | null = null;

  constructor() {
    this.createContainer();
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'special-effects';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9997;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Trigger a special effect
   */
  trigger(effect: string, data?: any): void {
    switch (effect) {
      case 'gift_explosion':
        this.giftExplosion(data);
        break;
      case 'gift_burst':
        this.giftBurst(data);
        break;
      case 'gift_sparkle':
        this.giftSparkle(data);
        break;
      case 'screen_shake':
        this.screenShake();
        break;
      case 'confetti':
        this.confetti();
        break;
    }
  }

  private giftExplosion(data: any): void {
    // Full screen celebration
    emojiRain.burst('🎁', 30);
    emojiRain.burst('✨', 20);
    emojiRain.burst('🎉', 10);
    this.screenShake();
  }

  private giftBurst(data: any): void {
    emojiRain.burst('🎁', 10);
    emojiRain.burst('✨', 5);
  }

  private giftSparkle(data: any): void {
    emojiRain.spawn('✨');
    emojiRain.spawn('🎁');
  }

  private screenShake(): void {
    const game = document.querySelector('#game-container') as HTMLElement;
    if (!game) return;

    game.style.animation = 'screen-shake 0.3s ease-out';

    if (!document.querySelector('#shake-styles')) {
      const style = document.createElement('style');
      style.id = 'shake-styles';
      style.textContent = `
        @keyframes screen-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      game.style.animation = '';
    }, 300);
  }

  private confetti(): void {
    const emojis = ['🎊', '🎉', '✨', '🌟', '💫'];
    for (const emoji of emojis) {
      emojiRain.burst(emoji, 5);
    }
  }
}

// =============================================================================
// QUICK COMMANDS (Hotkeys)
// =============================================================================

class QuickCommands {
  private commands: Map<string, () => void> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.setupDefaults();
    this.listen();
  }

  private setupDefaults(): void {
    // Streamer-friendly defaults
    this.commands.set('F1', () => this.toggleOverlay());
    this.commands.set('F2', () => this.startQuickVote());
    this.commands.set('F3', () => this.toggleEmojiRain());
    this.commands.set('F4', () => this.restartLevel());
    this.commands.set('F5', () => this.togglePause());
    this.commands.set('F8', () => this.hideUI());
    this.commands.set('F9', () => this.screenshotMode());
  }

  private listen(): void {
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      const key = e.key;
      const handler = this.commands.get(key);
      if (handler) {
        e.preventDefault();
        handler();
      }
    });
  }

  private toggleOverlay(): void {
    const overlay = document.getElementById('stream-overlay');
    if (overlay) {
      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    }
  }

  private startQuickVote(): void {
    // Start a quick vote with predefined options
    viewerInteraction.startVote('What should I do?', ['Go left', 'Go right', 'Explore'], 20);
  }

  private toggleEmojiRain(): void {
    // Toggle emoji rain feature
    console.log('[Orthogonal] Emoji rain toggled');
  }

  private restartLevel(): void {
    // Quick restart
    window.dispatchEvent(new CustomEvent('orthogonal:restart'));
  }

  private togglePause(): void {
    window.dispatchEvent(new CustomEvent('orthogonal:toggle-pause'));
  }

  private hideUI(): void {
    document.querySelectorAll('.game-ui').forEach(el => {
      (el as HTMLElement).style.display =
        (el as HTMLElement).style.display === 'none' ? 'block' : 'none';
    });
  }

  private screenshotMode(): void {
    // Hide all UI for clean screenshot
    document.querySelectorAll('.game-ui, #stream-overlay').forEach(el => {
      (el as HTMLElement).style.opacity = '0';
    });

    setTimeout(() => {
      document.querySelectorAll('.game-ui, #stream-overlay').forEach(el => {
        (el as HTMLElement).style.opacity = '1';
      });
    }, 3000);
  }

  /**
   * Add custom command
   */
  addCommand(key: string, handler: () => void): void {
    this.commands.set(key, handler);
  }

  /**
   * Enable/disable commands
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// =============================================================================
// SINGLETONS
// =============================================================================

export const streamerSetup = new StreamerSetup();
export const viewerInteraction = new ViewerInteractionSystem();
export const emojiRain = new EmojiRainSystem();
export const streamOverlay = new StreamOverlaySystem();
export const specialEffects = new SpecialEffectsSystem();
export const quickCommands = new QuickCommands();

// Alias for backward compatibility
export { StreamerSetup as StreamerMode };

// =============================================================================
// AUTO-INIT
// =============================================================================

// Check if likely streamer on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    if (PlatformDetector.isLikelyStreamer()) {
      // Auto-show streamer setup prompt
      const prompt = document.createElement('div');
      prompt.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-family: system-ui;
        z-index: 10001;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      prompt.innerHTML = `
        <div style="font-weight:bold">Streaming?</div>
        <div style="opacity:0.7;font-size:0.9rem">Click to enable viewer interactions</div>
      `;
      prompt.addEventListener('mouseenter', () => prompt.style.transform = 'scale(1.05)');
      prompt.addEventListener('mouseleave', () => prompt.style.transform = 'scale(1)');
      prompt.addEventListener('click', async () => {
        prompt.remove();
        await streamerSetup.oneClickSetup();
      });

      document.body.appendChild(prompt);

      // Auto-dismiss after 10s
      setTimeout(() => prompt.remove(), 10000);
    }
  });
}
