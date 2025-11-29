/**
 * StreamerLeaderboards.ts
 *
 * Leaderboard features designed specifically for streamers
 * Live updates, viewer challenges, community competitions
 */

import { viewerInteraction, streamOverlay, specialEffects } from './StreamerMode';

// =============================================================================
// TYPES
// =============================================================================

export interface StreamerScore {
  streamerId: string;
  streamerName: string;
  platform: 'tiktok' | 'twitch' | 'youtube' | 'kick';
  score: number;
  levelId: string;
  levelSeed: number;
  completionTime: number;
  timestamp: Date;
  viewerCount: number;  // Viewers at time of completion
  isLive: boolean;
}

export interface ViewerChallenge {
  id: string;
  type: 'race' | 'high-score' | 'speedrun' | 'no-death' | 'custom';
  description: string;
  targetScore: number;
  currentBest: number;
  bestHolder: string;
  expiresAt: Date;
  prizeDescription?: string;
  contributions: Map<string, number>;  // viewerId -> contribution
}

export interface LiveRace {
  id: string;
  participants: {
    streamerId: string;
    streamerName: string;
    platform: string;
    currentProgress: number;
    startTime: number;
    finished: boolean;
    finishTime?: number;
  }[];
  levelId: string;
  levelSeed: number;
  startedAt: Date;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
}

export interface CommunityRecord {
  levelId: string;
  levelSeed: number;
  bestTime: number;
  holder: string;
  platform: string;
  setAt: Date;
  viewerWitnesses: number;  // How many viewers saw it happen
}

// =============================================================================
// LIVE LEADERBOARD DISPLAY
// =============================================================================

export class LiveLeaderboardDisplay {
  private container: HTMLElement | null = null;
  private currentLeaderboard: StreamerScore[] = [];
  private animationFrame: number = 0;

  constructor() {
    this.createContainer();
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'live-leaderboard';
    this.container.innerHTML = `
      <style>
        #live-leaderboard {
          position: fixed;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 9990;
          font-family: system-ui, sans-serif;
          color: white;
          pointer-events: none;
          max-width: 280px;
        }
        .leaderboard-card {
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .leaderboard-title {
          font-weight: bold;
          font-size: 1.1rem;
        }
        .live-badge {
          background: #ff0000;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: bold;
          animation: pulse-live 1s infinite;
        }
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .leaderboard-entry {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s;
        }
        .leaderboard-entry.highlight {
          background: rgba(255,215,0,0.1);
          margin: 0 -16px;
          padding: 8px 16px;
        }
        .leaderboard-entry.new-entry {
          animation: slide-in-left 0.5s ease-out;
        }
        @keyframes slide-in-left {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .rank {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border-radius: 50%;
        }
        .rank-1 { background: linear-gradient(135deg, #ffd700, #ffb700); color: black; }
        .rank-2 { background: linear-gradient(135deg, #c0c0c0, #a0a0a0); color: black; }
        .rank-3 { background: linear-gradient(135deg, #cd7f32, #a05f22); color: white; }
        .rank-other { background: rgba(255,255,255,0.1); }
        .streamer-info {
          flex: 1;
          min-width: 0;
        }
        .streamer-name {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .streamer-platform {
          font-size: 0.75rem;
          opacity: 0.6;
        }
        .score-info {
          text-align: right;
        }
        .score-value {
          font-weight: bold;
          font-size: 1.1rem;
        }
        .score-time {
          font-size: 0.75rem;
          opacity: 0.6;
        }
        .your-position {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.2);
          text-align: center;
        }
        .platform-icon {
          width: 16px;
          height: 16px;
          display: inline-block;
        }
        .platform-icon.tiktok { color: #00f2ea; }
        .platform-icon.twitch { color: #9146ff; }
        .platform-icon.youtube { color: #ff0000; }
        .platform-icon.kick { color: #53fc18; }
      </style>
      <div class="leaderboard-card">
        <div class="leaderboard-header">
          <span class="leaderboard-title">Live Streamers</span>
          <span class="live-badge">LIVE</span>
        </div>
        <div class="leaderboard-entries"></div>
        <div class="your-position" style="display:none"></div>
      </div>
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Update leaderboard with new data
   */
  update(scores: StreamerScore[], myStreamerId?: string): void {
    const entriesContainer = this.container?.querySelector('.leaderboard-entries');
    const yourPosition = this.container?.querySelector('.your-position') as HTMLElement;
    if (!entriesContainer) return;

    // Sort by score/time
    const sorted = [...scores].sort((a, b) => a.completionTime - b.completionTime);
    const top5 = sorted.slice(0, 5);

    // Check for new entries
    const previousIds = this.currentLeaderboard.map(s => s.streamerId);
    const newEntries = top5.filter(s => !previousIds.includes(s.streamerId));

    // Update entries
    entriesContainer.innerHTML = top5.map((score, index) => {
      const isNew = newEntries.includes(score);
      const isYou = score.streamerId === myStreamerId;
      const rankClass = index < 3 ? `rank-${index + 1}` : 'rank-other';

      return `
        <div class="leaderboard-entry ${isNew ? 'new-entry' : ''} ${isYou ? 'highlight' : ''}">
          <div class="rank ${rankClass}">${index + 1}</div>
          <div class="streamer-info">
            <div class="streamer-name">${score.streamerName}</div>
            <div class="streamer-platform">
              <span class="platform-icon ${score.platform}">${this.getPlatformIcon(score.platform)}</span>
              ${score.viewerCount.toLocaleString()} watching
            </div>
          </div>
          <div class="score-info">
            <div class="score-value">${this.formatTime(score.completionTime)}</div>
            <div class="score-time">${this.timeAgo(score.timestamp)}</div>
          </div>
        </div>
      `;
    }).join('');

    // Show your position if not in top 5
    if (myStreamerId) {
      const myIndex = sorted.findIndex(s => s.streamerId === myStreamerId);
      if (myIndex >= 5) {
        yourPosition.style.display = 'block';
        yourPosition.innerHTML = `You're #${myIndex + 1}`;
      } else {
        yourPosition.style.display = 'none';
      }
    }

    // Trigger effects for new #1
    if (newEntries.length > 0 && sorted[0] && newEntries.includes(sorted[0])) {
      this.celebrateNewRecord(sorted[0]);
    }

    this.currentLeaderboard = top5;
  }

  private getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      tiktok: '♪',
      twitch: '⬤',
      youtube: '▶',
      kick: 'K'
    };
    return icons[platform] || '●';
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${minutes}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  }

  private timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  private celebrateNewRecord(score: StreamerScore): void {
    // Big celebration for new #1
    specialEffects.trigger('confetti');

    // Show announcement
    const announcement = document.createElement('div');
    announcement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ffd700, #ff8c00);
      color: black;
      padding: 24px 48px;
      border-radius: 16px;
      font-family: system-ui;
      font-size: 1.5rem;
      font-weight: bold;
      z-index: 10002;
      animation: record-announce 3s ease-out forwards;
    `;
    announcement.innerHTML = `
      <div style="text-align:center">
        <div style="font-size:3rem">🏆</div>
        <div>NEW RECORD!</div>
        <div style="font-size:1rem;font-weight:normal;margin-top:8px">
          ${score.streamerName} - ${this.formatTime(score.completionTime)}
        </div>
      </div>
    `;

    if (!document.querySelector('#record-announce-styles')) {
      const style = document.createElement('style');
      style.id = 'record-announce-styles';
      style.textContent = `
        @keyframes record-announce {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          30% { transform: translate(-50%, -50%) scale(1); }
          80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 3000);
  }

  /**
   * Show/hide the leaderboard
   */
  setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Set position
   */
  setPosition(position: 'left' | 'right'): void {
    if (!this.container) return;

    if (position === 'right') {
      this.container.style.left = 'auto';
      this.container.style.right = '20px';
    } else {
      this.container.style.left = '20px';
      this.container.style.right = 'auto';
    }
  }
}

// =============================================================================
// VIEWER CHALLENGE SYSTEM
// =============================================================================

export class ViewerChallengeSystem {
  private activeChallenge: ViewerChallenge | null = null;
  private container: HTMLElement | null = null;

  constructor() {
    this.createContainer();
    this.setupViewerListeners();
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'viewer-challenge';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9991;
      font-family: system-ui;
      color: white;
      text-align: center;
      display: none;
    `;
    document.body.appendChild(this.container);
  }

  private setupViewerListeners(): void {
    viewerInteraction.on('gift', (action) => {
      if (this.activeChallenge) {
        // Gifts contribute to challenge progress
        const contribution = action.data.value || 1;
        this.addContribution(action.viewerId, contribution);
      }
    });

    viewerInteraction.on('emoji', (action) => {
      if (this.activeChallenge) {
        // Emojis contribute small amount
        this.addContribution(action.viewerId, 0.1);
      }
    });
  }

  /**
   * Start a viewer challenge
   */
  startChallenge(challenge: Omit<ViewerChallenge, 'id' | 'currentBest' | 'bestHolder' | 'contributions'>): ViewerChallenge {
    this.activeChallenge = {
      ...challenge,
      id: `challenge_${Date.now()}`,
      currentBest: 0,
      bestHolder: '',
      contributions: new Map()
    };

    this.showChallengeUI();
    return this.activeChallenge;
  }

  /**
   * Quick challenge presets
   */
  startSpeedrunChallenge(targetTime: number): ViewerChallenge {
    return this.startChallenge({
      type: 'speedrun',
      description: `Beat this level in under ${Math.floor(targetTime / 1000)}s!`,
      targetScore: targetTime,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)  // 10 min
    });
  }

  startNoDeathChallenge(): ViewerChallenge {
    return this.startChallenge({
      type: 'no-death',
      description: 'Complete without dying!',
      targetScore: 1,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });
  }

  startViewerBoostChallenge(goal: number, prize: string): ViewerChallenge {
    return this.startChallenge({
      type: 'custom',
      description: `Help reach ${goal} points for: ${prize}`,
      targetScore: goal,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      prizeDescription: prize
    });
  }

  private addContribution(viewerId: string, amount: number): void {
    if (!this.activeChallenge) return;

    const current = this.activeChallenge.contributions.get(viewerId) || 0;
    this.activeChallenge.contributions.set(viewerId, current + amount);

    // Calculate total
    let total = 0;
    for (const val of this.activeChallenge.contributions.values()) {
      total += val;
    }
    this.activeChallenge.currentBest = total;

    this.updateChallengeUI();

    // Check if goal reached
    if (total >= this.activeChallenge.targetScore) {
      this.completeChallenge();
    }
  }

  private showChallengeUI(): void {
    if (!this.container || !this.activeChallenge) return;

    this.container.style.display = 'block';
    this.container.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(138,43,226,0.9), rgba(75,0,130,0.9));
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 20px 32px;
        border: 2px solid rgba(255,255,255,0.2);
      ">
        <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 8px;">VIEWER CHALLENGE</div>
        <div style="font-size: 1.3rem; font-weight: bold; margin-bottom: 12px;">
          ${this.activeChallenge.description}
        </div>
        <div class="challenge-progress-bar" style="
          height: 12px;
          background: rgba(0,0,0,0.3);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 8px;
        ">
          <div class="challenge-fill" style="
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #00ff88, #00ffcc);
            border-radius: 6px;
            transition: width 0.3s;
          "></div>
        </div>
        <div class="challenge-stats" style="font-size: 0.9rem;">
          <span class="current">0</span> / <span class="target">${this.activeChallenge.targetScore}</span>
        </div>
      </div>
    `;
  }

  private updateChallengeUI(): void {
    if (!this.container || !this.activeChallenge) return;

    const fill = this.container.querySelector('.challenge-fill') as HTMLElement;
    const current = this.container.querySelector('.current');

    if (fill) {
      const percent = Math.min(100, (this.activeChallenge.currentBest / this.activeChallenge.targetScore) * 100);
      fill.style.width = `${percent}%`;
    }
    if (current) {
      current.textContent = Math.floor(this.activeChallenge.currentBest).toString();
    }
  }

  private completeChallenge(): void {
    if (!this.container || !this.activeChallenge) return;

    specialEffects.trigger('confetti');

    this.container.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(0,255,136,0.9), rgba(0,200,100,0.9));
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 24px 40px;
        border: 2px solid rgba(255,255,255,0.3);
      ">
        <div style="font-size: 3rem;">🎉</div>
        <div style="font-size: 1.5rem; font-weight: bold;">CHALLENGE COMPLETE!</div>
        ${this.activeChallenge.prizeDescription ?
          `<div style="margin-top: 8px; opacity: 0.9;">${this.activeChallenge.prizeDescription}</div>` : ''}
        <div style="margin-top: 12px; font-size: 0.9rem; opacity: 0.7;">
          ${this.activeChallenge.contributions.size} viewers contributed
        </div>
      </div>
    `;

    setTimeout(() => {
      if (this.container) this.container.style.display = 'none';
      this.activeChallenge = null;
    }, 5000);
  }

  /**
   * Get active challenge
   */
  getActiveChallenge(): ViewerChallenge | null {
    return this.activeChallenge;
  }

  /**
   * Cancel current challenge
   */
  cancelChallenge(): void {
    this.activeChallenge = null;
    if (this.container) this.container.style.display = 'none';
  }
}

// =============================================================================
// LIVE RACE SYSTEM
// =============================================================================

export class LiveRaceSystem {
  private currentRace: LiveRace | null = null;
  private container: HTMLElement | null = null;
  private updateInterval: number | null = null;

  constructor() {
    this.createContainer();
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'live-race';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9992;
      font-family: system-ui;
      color: white;
      display: none;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Create a new race
   */
  createRace(levelId: string, levelSeed: number): LiveRace {
    this.currentRace = {
      id: `race_${Date.now()}`,
      participants: [],
      levelId,
      levelSeed,
      startedAt: new Date(),
      status: 'waiting'
    };

    this.showRaceUI();
    return this.currentRace;
  }

  /**
   * Join an existing race
   */
  joinRace(raceId: string, streamerId: string, streamerName: string, platform: string): boolean {
    if (!this.currentRace || this.currentRace.id !== raceId) return false;
    if (this.currentRace.status !== 'waiting') return false;

    this.currentRace.participants.push({
      streamerId,
      streamerName,
      platform,
      currentProgress: 0,
      startTime: 0,
      finished: false
    });

    this.updateRaceUI();
    return true;
  }

  /**
   * Start countdown
   */
  startCountdown(): void {
    if (!this.currentRace || this.currentRace.status !== 'waiting') return;

    this.currentRace.status = 'countdown';
    this.showCountdown();
  }

  private showCountdown(): void {
    let count = 3;

    const countdownEl = document.createElement('div');
    countdownEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 8rem;
      font-weight: bold;
      color: white;
      text-shadow: 0 0 20px rgba(255,255,255,0.5);
      z-index: 10003;
    `;
    document.body.appendChild(countdownEl);

    const tick = () => {
      if (count > 0) {
        countdownEl.textContent = count.toString();
        countdownEl.style.animation = 'none';
        countdownEl.offsetHeight;  // Trigger reflow
        countdownEl.style.animation = 'countdown-pulse 1s ease-out';
        count--;
        setTimeout(tick, 1000);
      } else {
        countdownEl.textContent = 'GO!';
        countdownEl.style.color = '#00ff88';
        setTimeout(() => {
          countdownEl.remove();
          this.startRace();
        }, 500);
      }
    };

    if (!document.querySelector('#countdown-styles')) {
      const style = document.createElement('style');
      style.id = 'countdown-styles';
      style.textContent = `
        @keyframes countdown-pulse {
          0% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    tick();
  }

  private startRace(): void {
    if (!this.currentRace) return;

    this.currentRace.status = 'racing';
    const now = Date.now();

    for (const participant of this.currentRace.participants) {
      participant.startTime = now;
    }

    // Start update loop
    this.updateInterval = window.setInterval(() => this.updateRaceUI(), 100);
  }

  /**
   * Update participant progress
   */
  updateProgress(streamerId: string, progress: number): void {
    if (!this.currentRace || this.currentRace.status !== 'racing') return;

    const participant = this.currentRace.participants.find(p => p.streamerId === streamerId);
    if (participant) {
      participant.currentProgress = progress;
      this.updateRaceUI();
    }
  }

  /**
   * Mark participant as finished
   */
  finishRace(streamerId: string): void {
    if (!this.currentRace) return;

    const participant = this.currentRace.participants.find(p => p.streamerId === streamerId);
    if (participant && !participant.finished) {
      participant.finished = true;
      participant.finishTime = Date.now() - participant.startTime;
      participant.currentProgress = 100;

      this.updateRaceUI();
      this.checkRaceComplete();
    }
  }

  private checkRaceComplete(): void {
    if (!this.currentRace) return;

    const allFinished = this.currentRace.participants.every(p => p.finished);
    if (allFinished) {
      this.currentRace.status = 'finished';
      this.showRaceResults();

      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    }
  }

  private showRaceUI(): void {
    if (!this.container || !this.currentRace) return;

    this.container.style.display = 'block';
    this.updateRaceUI();
  }

  private updateRaceUI(): void {
    if (!this.container || !this.currentRace) return;

    const sorted = [...this.currentRace.participants].sort((a, b) => {
      if (a.finished && b.finished) return (a.finishTime || 0) - (b.finishTime || 0);
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.currentProgress - a.currentProgress;
    });

    this.container.innerHTML = `
      <div style="
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 16px 24px;
        min-width: 400px;
        border: 2px solid ${this.currentRace.status === 'racing' ? '#ff4444' : '#444'};
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-weight: bold; font-size: 1.1rem;">🏁 LIVE RACE</span>
          ${this.currentRace.status === 'racing' ?
            '<span style="background: #ff4444; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">RACING</span>' :
            this.currentRace.status === 'waiting' ?
            '<span style="opacity: 0.6;">Waiting...</span>' : ''}
        </div>
        ${sorted.map((p, i) => `
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            ${i === 0 && p.finished ? 'color: #ffd700;' : ''}
          ">
            <div style="width: 24px; font-weight: bold;">#${i + 1}</div>
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between;">
                <span>${p.streamerName}</span>
                <span>${p.finished ? this.formatTime(p.finishTime || 0) : `${Math.floor(p.currentProgress)}%`}</span>
              </div>
              <div style="
                height: 4px;
                background: rgba(255,255,255,0.1);
                border-radius: 2px;
                margin-top: 4px;
              ">
                <div style="
                  height: 100%;
                  width: ${p.currentProgress}%;
                  background: ${p.finished ? '#00ff88' : '#4488ff'};
                  border-radius: 2px;
                  transition: width 0.1s;
                "></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private showRaceResults(): void {
    if (!this.container || !this.currentRace) return;

    const sorted = [...this.currentRace.participants].sort((a, b) =>
      (a.finishTime || Infinity) - (b.finishTime || Infinity)
    );

    specialEffects.trigger('confetti');

    this.container.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,140,0,0.9));
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 24px 32px;
        min-width: 400px;
        color: black;
        text-align: center;
      ">
        <div style="font-size: 3rem;">🏆</div>
        <div style="font-size: 1.5rem; font-weight: bold; margin: 8px 0;">
          ${sorted[0]?.streamerName} WINS!
        </div>
        <div style="font-size: 1.1rem;">
          ${this.formatTime(sorted[0]?.finishTime || 0)}
        </div>
        <div style="margin-top: 16px; text-align: left; color: rgba(0,0,0,0.7);">
          ${sorted.map((p, i) => `
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>${i + 1}. ${p.streamerName}</span>
              <span>${this.formatTime(p.finishTime || 0)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    setTimeout(() => {
      if (this.container) this.container.style.display = 'none';
      this.currentRace = null;
    }, 10000);
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${minutes}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  }

  /**
   * Get current race
   */
  getCurrentRace(): LiveRace | null {
    return this.currentRace;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const liveLeaderboard = new LiveLeaderboardDisplay();
export const viewerChallenge = new ViewerChallengeSystem();
export const liveRace = new LiveRaceSystem();
