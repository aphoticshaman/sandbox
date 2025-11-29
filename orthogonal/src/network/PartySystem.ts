/**
 * Party System
 * Up to 4-player puzzle parties with voice chat
 * Designed for streamers: one-click invite, easy join
 */

import { NetworkCore, PeerInfo, NetworkMessage } from './NetworkCore';

export type PartyRole = 'leader' | 'member';
export type PartyState = 'lobby' | 'matchmaking' | 'in-puzzle' | 'transitioning';

export interface PartyMember {
  id: string;
  displayName: string;
  avatar?: string;
  role: PartyRole;
  ready: boolean;
  voiceEnabled: boolean;
  voiceMuted: boolean;
  platform: 'web' | 'steam' | 'tiktok' | 'twitch';
  isSpeaking: boolean;
  latency: number;
}

export interface PartyInvite {
  partyId: string;
  inviterId: string;
  inviterName: string;
  createdAt: number;
  expiresAt: number;
}

export interface PartySettings {
  maxSize: number;
  voiceEnabled: boolean;
  friendsOnly: boolean;
  allowSpectators: boolean;
  puzzleDifficulty: 'adaptive' | 'easy' | 'medium' | 'hard' | 'extreme';
}

const DEFAULT_SETTINGS: PartySettings = {
  maxSize: 4,
  voiceEnabled: true,
  friendsOnly: false,
  allowSpectators: true,
  puzzleDifficulty: 'adaptive',
};

export class PartySystem {
  private network: NetworkCore;
  private partyId: string = '';
  private members: Map<string, PartyMember> = new Map();
  private localMember: PartyMember | null = null;
  private settings: PartySettings = { ...DEFAULT_SETTINGS };
  private state: PartyState = 'lobby';

  // Voice chat
  private voiceEnabled: boolean = false;
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private audioContext: AudioContext | null = null;
  private audioAnalysers: Map<string, AnalyserNode> = new Map();

  // Invite system
  private pendingInvites: PartyInvite[] = [];
  private inviteCode: string = '';

  // Events
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(network: NetworkCore) {
    this.network = network;
    this.setupNetworkHandlers();
  }

  private setupNetworkHandlers(): void {
    this.network.on('party-update', this.handlePartyUpdate.bind(this));
    this.network.on('party-invite', this.handleInvite.bind(this));
    this.network.on('member-joined', this.handleMemberJoined.bind(this));
    this.network.on('member-left', this.handleMemberLeft.bind(this));
    this.network.on('member-update', this.handleMemberUpdate.bind(this));
    this.network.on('voice-offer', this.handleVoiceOffer.bind(this));
    this.network.on('voice-answer', this.handleVoiceAnswer.bind(this));
    this.network.on('ready-check', this.handleReadyCheck.bind(this));
    this.network.on('puzzle-start', this.handlePuzzleStart.bind(this));
  }

  // ========================================
  // Party Management
  // ========================================

  async createParty(displayName: string, settings: Partial<PartySettings> = {}): Promise<string> {
    this.partyId = this.generatePartyId();
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.inviteCode = this.generateInviteCode();

    // Connect to room
    await this.network.connect(`party-${this.partyId}`);

    // Create local member as leader
    this.localMember = {
      id: this.network.getLocalId(),
      displayName,
      role: 'leader',
      ready: false,
      voiceEnabled: false,
      voiceMuted: false,
      platform: this.detectPlatform(),
      isSpeaking: false,
      latency: 0,
    };

    this.members.set(this.localMember.id, this.localMember);
    this.state = 'lobby';

    console.log('[Party] Created:', this.partyId);
    console.log('[Party] Invite code:', this.inviteCode);

    this.emit('partyCreated', { partyId: this.partyId, inviteCode: this.inviteCode });

    return this.inviteCode;
  }

  async joinParty(inviteCode: string, displayName: string): Promise<void> {
    // Decode invite code to get party ID
    this.partyId = this.decodeInviteCode(inviteCode);

    if (!this.partyId) {
      throw new Error('Invalid invite code');
    }

    // Connect to room
    await this.network.connect(`party-${this.partyId}`);

    // Create local member
    this.localMember = {
      id: this.network.getLocalId(),
      displayName,
      role: 'member',
      ready: false,
      voiceEnabled: false,
      voiceMuted: false,
      platform: this.detectPlatform(),
      isSpeaking: false,
      latency: 0,
    };

    this.members.set(this.localMember.id, this.localMember);

    // Announce join
    this.network.send('member-joined', {
      member: this.localMember,
    });

    this.emit('partyJoined', { partyId: this.partyId });
  }

  async leaveParty(): Promise<void> {
    if (!this.partyId) return;

    // Announce leave
    this.network.send('member-left', { memberId: this.localMember?.id });

    // Disable voice
    await this.disableVoice();

    // Disconnect
    await this.network.disconnect();

    // Reset state
    this.partyId = '';
    this.members.clear();
    this.localMember = null;
    this.state = 'lobby';

    this.emit('partyLeft', {});
  }

  // ========================================
  // Invites
  // ========================================

  getInviteCode(): string {
    return this.inviteCode;
  }

  getInviteLink(): string {
    return `https://orthogonal.game/join/${this.inviteCode}`;
  }

  async inviteFriend(friendId: string): Promise<void> {
    const invite: PartyInvite = {
      partyId: this.partyId,
      inviterId: this.localMember?.id || '',
      inviterName: this.localMember?.displayName || '',
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,  // 5 minutes
    };

    // Send via signaling server to specific user
    this.network.send('party-invite', { invite, targetId: friendId });
  }

  getPendingInvites(): PartyInvite[] {
    // Filter expired
    const now = Date.now();
    this.pendingInvites = this.pendingInvites.filter(i => i.expiresAt > now);
    return this.pendingInvites;
  }

  private handleInvite(msg: NetworkMessage): void {
    const invite = msg.payload.invite as PartyInvite;
    this.pendingInvites.push(invite);
    this.emit('inviteReceived', { invite });
  }

  // ========================================
  // Voice Chat
  // ========================================

  async enableVoice(): Promise<void> {
    if (this.voiceEnabled) return;

    try {
      // Get microphone
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio context for speaking detection
      this.audioContext = new AudioContext();

      // Create analyser for local voice activity
      const localAnalyser = this.audioContext.createAnalyser();
      localAnalyser.fftSize = 256;
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      source.connect(localAnalyser);
      this.audioAnalysers.set(this.localMember!.id, localAnalyser);

      // Start speaking detection
      this.startSpeakingDetection();

      this.voiceEnabled = true;
      if (this.localMember) {
        this.localMember.voiceEnabled = true;
        this.broadcastMemberUpdate();
      }

      // Initiate voice connections with all peers
      for (const [memberId] of this.members) {
        if (memberId !== this.localMember?.id) {
          this.initiateVoiceConnection(memberId);
        }
      }

      console.log('[Voice] Enabled');
      this.emit('voiceEnabled', {});

    } catch (error) {
      console.error('[Voice] Failed to enable:', error);
      throw error;
    }
  }

  async disableVoice(): Promise<void> {
    if (!this.voiceEnabled) return;

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Clear remote streams
    this.remoteStreams.clear();
    this.audioAnalysers.clear();

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.voiceEnabled = false;
    if (this.localMember) {
      this.localMember.voiceEnabled = false;
      this.broadcastMemberUpdate();
    }

    console.log('[Voice] Disabled');
    this.emit('voiceDisabled', {});
  }

  toggleMute(): boolean {
    if (!this.localMember || !this.localStream) return false;

    this.localMember.voiceMuted = !this.localMember.voiceMuted;

    // Mute/unmute track
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !this.localMember.voiceMuted;
    }

    this.broadcastMemberUpdate();
    return this.localMember.voiceMuted;
  }

  private async initiateVoiceConnection(peerId: string): Promise<void> {
    // This would use WebRTC audio channels
    // The NetworkCore already has peer connections, we'd add audio tracks
    console.log(`[Voice] Initiating connection with ${peerId}`);
    // Implementation would add audio tracks to existing peer connections
  }

  private handleVoiceOffer(msg: NetworkMessage): void {
    // Handle incoming voice connection offer
  }

  private handleVoiceAnswer(msg: NetworkMessage): void {
    // Handle voice connection answer
  }

  private startSpeakingDetection(): void {
    const detectSpeaking = () => {
      if (!this.voiceEnabled) return;

      for (const [memberId, analyser] of this.audioAnalysers) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const isSpeaking = average > 30;  // Threshold

        const member = this.members.get(memberId);
        if (member && member.isSpeaking !== isSpeaking) {
          member.isSpeaking = isSpeaking;
          this.emit('speakingChanged', { memberId, isSpeaking });
        }
      }

      requestAnimationFrame(detectSpeaking);
    };

    detectSpeaking();
  }

  // ========================================
  // Ready System
  // ========================================

  setReady(ready: boolean): void {
    if (!this.localMember) return;

    this.localMember.ready = ready;
    this.broadcastMemberUpdate();

    // Check if all ready
    this.checkAllReady();
  }

  private checkAllReady(): void {
    const allReady = Array.from(this.members.values()).every(m => m.ready);

    if (allReady && this.members.size >= 2 && this.isLeader()) {
      this.emit('allReady', {});
    }
  }

  private handleReadyCheck(msg: NetworkMessage): void {
    // Leader initiated ready check
    this.emit('readyCheck', {});
  }

  // ========================================
  // Puzzle Flow
  // ========================================

  async startPuzzle(): Promise<void> {
    if (!this.isLeader()) {
      throw new Error('Only party leader can start puzzle');
    }

    const allReady = Array.from(this.members.values()).every(m => m.ready);
    if (!allReady) {
      throw new Error('Not all members are ready');
    }

    this.state = 'matchmaking';
    this.network.send('puzzle-start', {
      settings: this.settings,
      memberCount: this.members.size,
    });

    this.emit('puzzleStarting', {});
  }

  private handlePuzzleStart(msg: NetworkMessage): void {
    this.state = 'in-puzzle';
    this.emit('puzzleStarted', { settings: msg.payload.settings });
  }

  // ========================================
  // Member Updates
  // ========================================

  private handleMemberJoined(msg: NetworkMessage): void {
    const member = msg.payload.member as PartyMember;

    if (this.members.size >= this.settings.maxSize) {
      // Party full
      console.log('[Party] Full, rejecting member');
      return;
    }

    this.members.set(member.id, member);

    // If voice enabled, initiate connection
    if (this.voiceEnabled) {
      this.initiateVoiceConnection(member.id);
    }

    this.emit('memberJoined', { member });
  }

  private handleMemberLeft(msg: NetworkMessage): void {
    const memberId = msg.payload.memberId;
    const member = this.members.get(memberId);

    if (member) {
      this.members.delete(memberId);
      this.remoteStreams.delete(memberId);
      this.audioAnalysers.delete(memberId);

      // If leader left, promote next member
      if (member.role === 'leader' && this.members.size > 0) {
        const nextLeader = Array.from(this.members.values())[0];
        nextLeader.role = 'leader';
        this.emit('leaderChanged', { newLeader: nextLeader });
      }

      this.emit('memberLeft', { member });
    }
  }

  private handleMemberUpdate(msg: NetworkMessage): void {
    const update = msg.payload;
    const member = this.members.get(msg.senderId);

    if (member) {
      Object.assign(member, update);
      this.emit('memberUpdated', { member });
      this.checkAllReady();
    }
  }

  private handlePartyUpdate(msg: NetworkMessage): void {
    // Sync party state from leader
    if (msg.payload.settings) {
      this.settings = msg.payload.settings;
    }
    if (msg.payload.state) {
      this.state = msg.payload.state;
    }
    this.emit('partyUpdated', msg.payload);
  }

  private broadcastMemberUpdate(): void {
    if (!this.localMember) return;

    this.network.send('member-update', {
      ready: this.localMember.ready,
      voiceEnabled: this.localMember.voiceEnabled,
      voiceMuted: this.localMember.voiceMuted,
    });
  }

  // ========================================
  // Settings (Leader only)
  // ========================================

  updateSettings(settings: Partial<PartySettings>): void {
    if (!this.isLeader()) return;

    this.settings = { ...this.settings, ...settings };
    this.network.send('party-update', { settings: this.settings });
    this.emit('settingsUpdated', { settings: this.settings });
  }

  kickMember(memberId: string): void {
    if (!this.isLeader()) return;
    if (memberId === this.localMember?.id) return;

    this.network.send('member-kicked', { memberId });
    this.handleMemberLeft({ payload: { memberId } } as any);
  }

  transferLeadership(memberId: string): void {
    if (!this.isLeader()) return;

    const newLeader = this.members.get(memberId);
    if (!newLeader) return;

    if (this.localMember) {
      this.localMember.role = 'member';
    }
    newLeader.role = 'leader';

    this.network.send('party-update', {
      leaderChanged: true,
      newLeaderId: memberId,
    });

    this.emit('leaderChanged', { newLeader });
  }

  // ========================================
  // Utilities
  // ========================================

  private generatePartyId(): string {
    return 'party-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private generateInviteCode(): string {
    // Short, memorable code: XXXX-XXXX
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // No confusing chars
    let code = '';
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private decodeInviteCode(code: string): string {
    // In reality, this would validate with server
    // For now, we trust the code maps to a party ID
    return `party-${code.replace('-', '').toLowerCase()}`;
  }

  private detectPlatform(): 'web' | 'steam' | 'tiktok' | 'twitch' {
    // Detect based on environment
    if ((window as any).SteamClient) return 'steam';
    if ((window as any).TikTokLive) return 'tiktok';
    if ((window as any).Twitch) return 'twitch';
    return 'web';
  }

  isLeader(): boolean {
    return this.localMember?.role === 'leader';
  }

  getMembers(): PartyMember[] {
    return Array.from(this.members.values());
  }

  getMember(id: string): PartyMember | undefined {
    return this.members.get(id);
  }

  getLocalMember(): PartyMember | null {
    return this.localMember;
  }

  getSettings(): PartySettings {
    return { ...this.settings };
  }

  getState(): PartyState {
    return this.state;
  }

  getPartyId(): string {
    return this.partyId;
  }

  isFull(): boolean {
    return this.members.size >= this.settings.maxSize;
  }

  // ========================================
  // Events
  // ========================================

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.eventListeners.get(event)?.delete(listener);
  }
}

// ========================================
// Party UI Components
// ========================================

export class PartyOverlay {
  private container: HTMLDivElement;
  private party: PartySystem;
  private memberSlots: HTMLDivElement[] = [];

  constructor(party: PartySystem) {
    this.party = party;
    this.container = this.createOverlay();
    this.setupEventListeners();
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'party-overlay';
    overlay.innerHTML = `
      <div class="party-header">
        <span class="party-title">PARTY</span>
        <button class="party-invite-btn" title="Copy invite link">
          <span class="invite-icon">📋</span>
          <span class="invite-code"></span>
        </button>
      </div>
      <div class="party-members">
        ${[0, 1, 2, 3].map(i => `
          <div class="party-slot" data-slot="${i}">
            <div class="slot-empty">
              <span class="plus-icon">+</span>
            </div>
            <div class="slot-filled" style="display: none;">
              <div class="member-avatar"></div>
              <div class="member-info">
                <span class="member-name"></span>
                <span class="member-platform"></span>
              </div>
              <div class="member-status">
                <span class="voice-indicator">🎤</span>
                <span class="ready-indicator">✓</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="party-controls">
        <button class="voice-toggle">🎤 Voice</button>
        <button class="ready-toggle">Ready</button>
        <button class="start-btn" style="display: none;">Start Puzzle</button>
      </div>
    `;

    this.applyStyles(overlay);
    return overlay;
  }

  private applyStyles(overlay: HTMLDivElement): void {
    overlay.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 280px;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      color: white;
      z-index: 1000;
      backdrop-filter: blur(10px);
    `;

    const style = document.createElement('style');
    style.textContent = `
      .party-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .party-title {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 2px;
        opacity: 0.7;
      }

      .party-invite-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
      }

      .party-invite-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .party-members {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .party-slot {
        height: 56px;
        border-radius: 8px;
        overflow: hidden;
      }

      .slot-empty {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.05);
        border: 2px dashed rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .slot-empty:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.4);
      }

      .plus-icon {
        font-size: 24px;
        opacity: 0.5;
      }

      .slot-filled {
        height: 100%;
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        gap: 12px;
      }

      .member-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .member-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .member-name {
        font-weight: 500;
        font-size: 14px;
      }

      .member-platform {
        font-size: 10px;
        opacity: 0.5;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .member-status {
        display: flex;
        gap: 8px;
        font-size: 16px;
      }

      .voice-indicator {
        opacity: 0.3;
        transition: opacity 0.2s;
      }

      .voice-indicator.active {
        opacity: 1;
      }

      .voice-indicator.speaking {
        animation: pulse 0.5s ease infinite;
      }

      .ready-indicator {
        opacity: 0.3;
        transition: opacity 0.2s;
      }

      .ready-indicator.ready {
        opacity: 1;
        color: #4ade80;
      }

      .party-controls {
        display: flex;
        gap: 8px;
        padding: 12px 16px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .party-controls button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .voice-toggle {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .voice-toggle:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .voice-toggle.active {
        background: #10b981;
      }

      .ready-toggle {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .ready-toggle:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .ready-toggle.ready {
        background: #4ade80;
        color: black;
      }

      .start-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .start-btn:hover {
        transform: scale(1.02);
      }

      .start-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    // Invite button
    const inviteBtn = this.container.querySelector('.party-invite-btn');
    inviteBtn?.addEventListener('click', () => {
      const link = this.party.getInviteLink();
      navigator.clipboard.writeText(link);
      this.showCopiedFeedback();
    });

    // Voice toggle
    const voiceBtn = this.container.querySelector('.voice-toggle');
    voiceBtn?.addEventListener('click', async () => {
      const local = this.party.getLocalMember();
      if (local?.voiceEnabled) {
        await this.party.disableVoice();
        voiceBtn.classList.remove('active');
      } else {
        await this.party.enableVoice();
        voiceBtn.classList.add('active');
      }
    });

    // Ready toggle
    const readyBtn = this.container.querySelector('.ready-toggle');
    readyBtn?.addEventListener('click', () => {
      const local = this.party.getLocalMember();
      if (local) {
        this.party.setReady(!local.ready);
        readyBtn.classList.toggle('ready', !local.ready);
      }
    });

    // Start button
    const startBtn = this.container.querySelector('.start-btn') as HTMLButtonElement;
    startBtn?.addEventListener('click', () => {
      this.party.startPuzzle();
    });

    // Party events
    this.party.on('memberJoined', () => this.updateMembers());
    this.party.on('memberLeft', () => this.updateMembers());
    this.party.on('memberUpdated', () => this.updateMembers());
    this.party.on('speakingChanged', ({ memberId, isSpeaking }: any) => {
      this.updateSpeakingIndicator(memberId, isSpeaking);
    });
    this.party.on('allReady', () => {
      if (this.party.isLeader()) {
        startBtn.style.display = 'block';
      }
    });
  }

  private showCopiedFeedback(): void {
    const btn = this.container.querySelector('.party-invite-btn');
    if (btn) {
      const icon = btn.querySelector('.invite-icon');
      if (icon) {
        icon.textContent = '✓';
        setTimeout(() => { icon.textContent = '📋'; }, 1500);
      }
    }
  }

  private updateMembers(): void {
    const members = this.party.getMembers();
    const slots = this.container.querySelectorAll('.party-slot');

    slots.forEach((slot, i) => {
      const member = members[i];
      const empty = slot.querySelector('.slot-empty') as HTMLElement;
      const filled = slot.querySelector('.slot-filled') as HTMLElement;

      if (member) {
        empty.style.display = 'none';
        filled.style.display = 'flex';

        const name = filled.querySelector('.member-name');
        const platform = filled.querySelector('.member-platform');
        const voice = filled.querySelector('.voice-indicator');
        const ready = filled.querySelector('.ready-indicator');

        if (name) name.textContent = member.displayName;
        if (platform) platform.textContent = member.platform;
        if (voice) {
          voice.classList.toggle('active', member.voiceEnabled);
          voice.classList.toggle('speaking', member.isSpeaking);
        }
        if (ready) {
          ready.classList.toggle('ready', member.ready);
        }
      } else {
        empty.style.display = 'flex';
        filled.style.display = 'none';
      }
    });

    // Update invite code display
    const codeDisplay = this.container.querySelector('.invite-code');
    if (codeDisplay) {
      codeDisplay.textContent = this.party.getInviteCode();
    }
  }

  private updateSpeakingIndicator(memberId: string, isSpeaking: boolean): void {
    const members = this.party.getMembers();
    const index = members.findIndex(m => m.id === memberId);

    if (index >= 0) {
      const slot = this.container.querySelectorAll('.party-slot')[index];
      const voice = slot?.querySelector('.voice-indicator');
      voice?.classList.toggle('speaking', isSpeaking);
    }
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
    this.updateMembers();
  }

  unmount(): void {
    this.container.remove();
  }

  show(): void {
    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}
