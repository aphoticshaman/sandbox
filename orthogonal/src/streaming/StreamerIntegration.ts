/**
 * Streamer Integration
 * TikTok Live + Twitch native integration
 * One-click setup, zero friction for streamers
 */

export type StreamPlatform = 'tiktok' | 'twitch' | 'none';

export interface StreamConfig {
  platform: StreamPlatform;
  connected: boolean;
  channelName?: string;
  viewerCount: number;
  isLive: boolean;
  features: StreamerFeatures;
}

export interface StreamerFeatures {
  viewerEmojis: boolean;
  viewerChallenges: boolean;  // Viewers can vote on difficulty
  viewerGifts: boolean;       // TikTok gifts trigger effects
  chatOverlay: boolean;
  leaderboardWidget: boolean;
}

export interface StreamEvent {
  type: 'viewer_join' | 'viewer_leave' | 'emoji' | 'gift' | 'chat' | 'follow' | 'subscribe';
  data: any;
  timestamp: number;
}

// ========================================
// TikTok Live Integration
// ========================================

export class TikTokLiveIntegration {
  private connected: boolean = false;
  private roomId: string = '';
  private viewerCount: number = 0;
  private onEvent: ((event: StreamEvent) => void) | null = null;

  // TikTok Live connector (uses their web SDK or WebSocket proxy)
  private socket: WebSocket | null = null;

  async connect(username: string): Promise<boolean> {
    // In production, this would use TikTok's Live API or a proxy service
    // For now, we simulate the connection structure
    console.log(`[TikTok] Connecting to @${username}...`);

    try {
      // Would connect to: wss://tiktok-live-proxy.yourserver.com
      // The proxy handles TikTok's protobuf protocol
      this.socket = new WebSocket(`wss://api.orthogonal.game/tiktok/live/${username}`);

      return new Promise((resolve, reject) => {
        this.socket!.onopen = () => {
          this.connected = true;
          console.log('[TikTok] Connected');
          resolve(true);
        };

        this.socket!.onerror = (error) => {
          console.error('[TikTok] Connection error:', error);
          reject(false);
        };

        this.socket!.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.socket!.onclose = () => {
          this.connected = false;
          console.log('[TikTok] Disconnected');
        };
      });
    } catch (error) {
      console.error('[TikTok] Failed to connect:', error);
      return false;
    }
  }

  private handleMessage(msg: any): void {
    switch (msg.type) {
      case 'roomUser':
        this.viewerCount = msg.viewerCount || 0;
        this.emitEvent('viewer_join', { count: this.viewerCount });
        break;

      case 'like':
        // Hearts/likes
        this.emitEvent('emoji', {
          userId: msg.userId,
          username: msg.nickname,
          emoji: '❤️',
          count: msg.likeCount,
        });
        break;

      case 'gift':
        // TikTok gifts (coins, roses, etc.)
        this.emitEvent('gift', {
          userId: msg.userId,
          username: msg.nickname,
          giftName: msg.giftName,
          giftId: msg.giftId,
          diamondCount: msg.diamondCount,
          repeatCount: msg.repeatCount,
        });
        break;

      case 'chat':
        this.emitEvent('chat', {
          userId: msg.userId,
          username: msg.nickname,
          message: msg.comment,
        });
        break;

      case 'follow':
        this.emitEvent('follow', {
          userId: msg.userId,
          username: msg.nickname,
        });
        break;

      case 'share':
        // User shared the stream
        this.emitEvent('emoji', {
          userId: msg.userId,
          username: msg.nickname,
          emoji: '🔗',
        });
        break;
    }
  }

  private emitEvent(type: StreamEvent['type'], data: any): void {
    if (this.onEvent) {
      this.onEvent({
        type,
        data,
        timestamp: Date.now(),
      });
    }
  }

  setEventHandler(handler: (event: StreamEvent) => void): void {
    this.onEvent = handler;
  }

  getViewerCount(): number {
    return this.viewerCount;
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
  }
}

// ========================================
// Twitch Integration
// ========================================

export class TwitchIntegration {
  private connected: boolean = false;
  private channelName: string = '';
  private viewerCount: number = 0;
  private onEvent: ((event: StreamEvent) => void) | null = null;

  // Twitch IRC for chat
  private ircSocket: WebSocket | null = null;

  // OAuth token (user provides via settings)
  private accessToken: string = '';

  async connect(channelName: string, accessToken: string): Promise<boolean> {
    this.channelName = channelName.toLowerCase();
    this.accessToken = accessToken;

    console.log(`[Twitch] Connecting to #${channelName}...`);

    try {
      // Connect to Twitch IRC
      this.ircSocket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

      return new Promise((resolve, reject) => {
        this.ircSocket!.onopen = () => {
          // Authenticate
          this.ircSocket!.send(`PASS oauth:${accessToken}`);
          this.ircSocket!.send(`NICK justinfan${Math.floor(Math.random() * 100000)}`);
          this.ircSocket!.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
          this.ircSocket!.send(`JOIN #${this.channelName}`);

          this.connected = true;
          console.log('[Twitch] Connected');
          resolve(true);
        };

        this.ircSocket!.onerror = (error) => {
          console.error('[Twitch] Connection error:', error);
          reject(false);
        };

        this.ircSocket!.onmessage = (event) => {
          this.handleIRCMessage(event.data);
        };

        this.ircSocket!.onclose = () => {
          this.connected = false;
          console.log('[Twitch] Disconnected');
        };
      });
    } catch (error) {
      console.error('[Twitch] Failed to connect:', error);
      return false;
    }
  }

  private handleIRCMessage(raw: string): void {
    const lines = raw.split('\r\n');

    for (const line of lines) {
      if (!line) continue;

      // Handle PING
      if (line.startsWith('PING')) {
        this.ircSocket?.send('PONG :tmi.twitch.tv');
        continue;
      }

      // Parse chat messages
      if (line.includes('PRIVMSG')) {
        const match = line.match(/:(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #\w+ :(.+)/);
        if (match) {
          const [, username, message] = match;
          this.emitEvent('chat', { username, message });

          // Check for emote-only messages
          if (this.isEmoteOnly(message)) {
            this.emitEvent('emoji', {
              username,
              emoji: this.mapTwitchEmote(message),
            });
          }
        }
      }

      // Handle subscriptions
      if (line.includes('USERNOTICE') && line.includes('msg-id=sub')) {
        const match = line.match(/display-name=([^;]+)/);
        if (match) {
          this.emitEvent('subscribe', { username: match[1] });
        }
      }

      // Handle follows (via EventSub webhook, not IRC - would need server)
    }
  }

  private isEmoteOnly(message: string): boolean {
    // Check if message is just Twitch emotes
    const emotePatterns = ['Kappa', 'PogChamp', 'LUL', 'Kreygasm', 'ResidentSleeper', 'BibleThump'];
    return emotePatterns.some(e => message.trim() === e);
  }

  private mapTwitchEmote(emote: string): string {
    const emojiMap: Record<string, string> = {
      'PogChamp': '😮',
      'Kappa': '😏',
      'LUL': '😂',
      'Kreygasm': '😩',
      'ResidentSleeper': '😴',
      'BibleThump': '😢',
    };
    return emojiMap[emote.trim()] || '✨';
  }

  private emitEvent(type: StreamEvent['type'], data: any): void {
    if (this.onEvent) {
      this.onEvent({
        type,
        data,
        timestamp: Date.now(),
      });
    }
  }

  setEventHandler(handler: (event: StreamEvent) => void): void {
    this.onEvent = handler;
  }

  async getViewerCount(): Promise<number> {
    // Would use Twitch API to get stream info
    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/streams?user_login=${this.channelName}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Client-Id': 'your-twitch-client-id',
          },
        }
      );
      const data = await response.json();
      this.viewerCount = data.data?.[0]?.viewer_count || 0;
      return this.viewerCount;
    } catch {
      return this.viewerCount;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.ircSocket) {
      this.ircSocket.close();
      this.ircSocket = null;
    }
    this.connected = false;
  }
}

// ========================================
// Unified Streamer Manager
// ========================================

export class StreamerManager {
  private tiktok: TikTokLiveIntegration | null = null;
  private twitch: TwitchIntegration | null = null;
  private currentPlatform: StreamPlatform = 'none';
  private config: StreamConfig;

  // Event handlers
  private onViewerJoin: ((count: number) => void) | null = null;
  private onEmoji: ((emoji: string, username: string) => void) | null = null;
  private onGift: ((gift: any) => void) | null = null;
  private onChat: ((username: string, message: string) => void) | null = null;

  constructor() {
    this.config = {
      platform: 'none',
      connected: false,
      viewerCount: 0,
      isLive: false,
      features: {
        viewerEmojis: true,
        viewerChallenges: false,
        viewerGifts: true,
        chatOverlay: false,
        leaderboardWidget: true,
      },
    };
  }

  async connectTikTok(username: string): Promise<boolean> {
    this.tiktok = new TikTokLiveIntegration();
    this.tiktok.setEventHandler(this.handleStreamEvent.bind(this));

    const success = await this.tiktok.connect(username);
    if (success) {
      this.currentPlatform = 'tiktok';
      this.config.platform = 'tiktok';
      this.config.connected = true;
      this.config.channelName = username;
      this.config.isLive = true;
    }
    return success;
  }

  async connectTwitch(channelName: string, accessToken: string): Promise<boolean> {
    this.twitch = new TwitchIntegration();
    this.twitch.setEventHandler(this.handleStreamEvent.bind(this));

    const success = await this.twitch.connect(channelName, accessToken);
    if (success) {
      this.currentPlatform = 'twitch';
      this.config.platform = 'twitch';
      this.config.connected = true;
      this.config.channelName = channelName;
      this.config.isLive = true;
    }
    return success;
  }

  private handleStreamEvent(event: StreamEvent): void {
    switch (event.type) {
      case 'viewer_join':
        this.config.viewerCount = event.data.count;
        this.onViewerJoin?.(event.data.count);
        break;

      case 'emoji':
        if (this.config.features.viewerEmojis) {
          this.onEmoji?.(event.data.emoji, event.data.username);
        }
        break;

      case 'gift':
        if (this.config.features.viewerGifts) {
          this.onGift?.(event.data);
        }
        break;

      case 'chat':
        this.onChat?.(event.data.username, event.data.message);
        break;
    }
  }

  disconnect(): void {
    this.tiktok?.disconnect();
    this.twitch?.disconnect();
    this.currentPlatform = 'none';
    this.config.connected = false;
    this.config.isLive = false;
  }

  getConfig(): StreamConfig {
    return { ...this.config };
  }

  updateFeatures(features: Partial<StreamerFeatures>): void {
    this.config.features = { ...this.config.features, ...features };
  }

  setOnViewerJoin(handler: (count: number) => void): void {
    this.onViewerJoin = handler;
  }

  setOnEmoji(handler: (emoji: string, username: string) => void): void {
    this.onEmoji = handler;
  }

  setOnGift(handler: (gift: any) => void): void {
    this.onGift = handler;
  }

  setOnChat(handler: (username: string, message: string) => void): void {
    this.onChat = handler;
  }
}

// ========================================
// Streamer Setup Wizard UI
// ========================================

export class StreamerSetupUI {
  private container: HTMLDivElement;
  private manager: StreamerManager;
  private onComplete: (() => void) | null = null;

  constructor(manager: StreamerManager) {
    this.manager = manager;
    this.container = this.createUI();
  }

  private createUI(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'streamer-setup';
    container.innerHTML = `
      <div class="setup-panel">
        <div class="setup-header">
          <h2>Stream Setup</h2>
          <p>Connect your stream in one click</p>
        </div>

        <div class="platform-select">
          <button class="platform-btn" data-platform="tiktok">
            <span class="platform-icon">📱</span>
            <span class="platform-name">TikTok Live</span>
          </button>
          <button class="platform-btn" data-platform="twitch">
            <span class="platform-icon">🎮</span>
            <span class="platform-name">Twitch</span>
          </button>
        </div>

        <div class="connect-form" style="display: none;">
          <div class="form-tiktok" style="display: none;">
            <label>TikTok Username</label>
            <input type="text" class="tiktok-username" placeholder="@username">
            <button class="connect-btn">Connect</button>
          </div>

          <div class="form-twitch" style="display: none;">
            <label>Twitch Channel</label>
            <input type="text" class="twitch-channel" placeholder="channel_name">
            <button class="twitch-auth-btn">Connect with Twitch</button>
          </div>
        </div>

        <div class="features-config" style="display: none;">
          <h3>Stream Features</h3>
          <label class="feature-toggle">
            <input type="checkbox" checked data-feature="viewerEmojis">
            <span>Viewer Emojis</span>
          </label>
          <label class="feature-toggle">
            <input type="checkbox" data-feature="viewerChallenges">
            <span>Viewer Challenges</span>
          </label>
          <label class="feature-toggle">
            <input type="checkbox" checked data-feature="viewerGifts">
            <span>Gift Effects</span>
          </label>
          <label class="feature-toggle">
            <input type="checkbox" data-feature="chatOverlay">
            <span>Chat Overlay</span>
          </label>
          <label class="feature-toggle">
            <input type="checkbox" checked data-feature="leaderboardWidget">
            <span>Leaderboard Widget</span>
          </label>
        </div>

        <div class="setup-footer">
          <button class="skip-btn">Skip for now</button>
          <button class="done-btn" style="display: none;">Start Playing</button>
        </div>
      </div>
    `;

    this.applyStyles();
    this.setupEventListeners();
    return container;
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .streamer-setup {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
      }

      .setup-panel {
        width: 400px;
        background: rgba(20, 20, 30, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 32px;
      }

      .setup-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .setup-header h2 {
        font-size: 24px;
        font-weight: 500;
        color: white;
        margin: 0 0 8px;
      }

      .setup-header p {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
      }

      .platform-select {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
      }

      .platform-btn {
        flex: 1;
        padding: 24px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .platform-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }

      .platform-btn.selected {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }

      .platform-icon {
        font-size: 32px;
      }

      .platform-name {
        font-size: 14px;
        font-weight: 500;
        color: white;
      }

      .connect-form {
        margin-bottom: 24px;
      }

      .connect-form label {
        display: block;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .connect-form input {
        width: 100%;
        padding: 14px 16px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: white;
        font-size: 16px;
        margin-bottom: 16px;
        outline: none;
        box-sizing: border-box;
      }

      .connect-form input:focus {
        border-color: #667eea;
      }

      .connect-btn, .twitch-auth-btn {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .connect-btn:hover, .twitch-auth-btn:hover {
        transform: scale(1.02);
      }

      .twitch-auth-btn {
        background: #9146ff;
      }

      .features-config {
        margin-bottom: 24px;
      }

      .features-config h3 {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.6);
        margin: 0 0 16px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .feature-toggle {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        cursor: pointer;
      }

      .feature-toggle input {
        width: 20px;
        height: 20px;
        accent-color: #667eea;
      }

      .feature-toggle span {
        font-size: 14px;
        color: white;
      }

      .setup-footer {
        display: flex;
        gap: 12px;
      }

      .skip-btn {
        flex: 1;
        padding: 14px;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .skip-btn:hover {
        border-color: rgba(255, 255, 255, 0.4);
        color: white;
      }

      .done-btn {
        flex: 1;
        padding: 14px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    const platformBtns = this.container.querySelectorAll('.platform-btn');
    const connectForm = this.container.querySelector('.connect-form') as HTMLElement;
    const formTiktok = this.container.querySelector('.form-tiktok') as HTMLElement;
    const formTwitch = this.container.querySelector('.form-twitch') as HTMLElement;
    const featuresConfig = this.container.querySelector('.features-config') as HTMLElement;
    const skipBtn = this.container.querySelector('.skip-btn');
    const doneBtn = this.container.querySelector('.done-btn') as HTMLElement;

    // Platform selection
    platformBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        platformBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const platform = (btn as HTMLElement).dataset.platform;
        connectForm.style.display = 'block';
        formTiktok.style.display = platform === 'tiktok' ? 'block' : 'none';
        formTwitch.style.display = platform === 'twitch' ? 'block' : 'none';
      });
    });

    // TikTok connect
    const tiktokConnectBtn = this.container.querySelector('.form-tiktok .connect-btn');
    tiktokConnectBtn?.addEventListener('click', async () => {
      const input = this.container.querySelector('.tiktok-username') as HTMLInputElement;
      const username = input.value.replace('@', '').trim();

      if (username) {
        const success = await this.manager.connectTikTok(username);
        if (success) {
          featuresConfig.style.display = 'block';
          doneBtn.style.display = 'block';
        }
      }
    });

    // Twitch auth
    const twitchAuthBtn = this.container.querySelector('.twitch-auth-btn');
    twitchAuthBtn?.addEventListener('click', () => {
      // Would open OAuth popup
      const channel = (this.container.querySelector('.twitch-channel') as HTMLInputElement).value.trim();
      if (channel) {
        // Open Twitch OAuth in popup
        const clientId = 'your-twitch-client-id';
        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/twitch/callback`);
        const scope = encodeURIComponent('chat:read user:read:email');

        window.open(
          `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`,
          'twitch-auth',
          'width=500,height=600'
        );
      }
    });

    // Feature toggles
    const featureToggles = this.container.querySelectorAll('.feature-toggle input');
    featureToggles.forEach(toggle => {
      toggle.addEventListener('change', () => {
        const feature = (toggle as HTMLInputElement).dataset.feature;
        const enabled = (toggle as HTMLInputElement).checked;
        if (feature) {
          this.manager.updateFeatures({ [feature]: enabled } as any);
        }
      });
    });

    // Skip
    skipBtn?.addEventListener('click', () => {
      this.hide();
      this.onComplete?.();
    });

    // Done
    doneBtn?.addEventListener('click', () => {
      this.hide();
      this.onComplete?.();
    });
  }

  setOnComplete(handler: () => void): void {
    this.onComplete = handler;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  show(): void {
    this.container.style.display = 'flex';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  unmount(): void {
    this.container.remove();
  }
}
