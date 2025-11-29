/**
 * P2PNetwork.ts
 *
 * WebRTC-based P2P networking for free distributed match hosting
 * No central game servers - peers host and relay for each other
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface PeerInfo {
  id: string;
  publicKey: string;
  capabilities: PeerCapabilities;
  latency: number;
  lastSeen: number;
  reputation: number;
}

export interface PeerCapabilities {
  canHost: boolean;
  canRelay: boolean;
  bandwidth: 'low' | 'medium' | 'high';
  uptime: number; // Average session length in ms
}

export interface P2PMessage {
  type: string;
  from: string;
  to: string;
  payload: any;
  timestamp: number;
  signature?: string;
}

export interface MatchSession {
  matchId: string;
  levelId: string;
  hostPeerId: string;
  players: string[];
  relayPeers: string[];
  state: 'forming' | 'playing' | 'completed';
  startedAt: number;
}

// =============================================================================
// STUN/TURN SERVERS (Free public servers)
// =============================================================================

const FREE_STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.voip.blackberry.com:3478' }
];

// =============================================================================
// P2P NETWORK MANAGER
// =============================================================================

export class P2PNetwork {
  private peerId: string;
  private connections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private knownPeers: Map<string, PeerInfo> = new Map();
  private supabase: SupabaseClient | null = null;
  private signalSubscription: any = null;

  private messageHandlers: Map<string, (msg: P2PMessage) => void> = new Map();

  // Current session
  private currentSession: MatchSession | null = null;
  private isHost: boolean = false;

  // Callbacks
  public onPeerConnected?: (peerId: string) => void;
  public onPeerDisconnected?: (peerId: string) => void;
  public onMessage?: (msg: P2PMessage) => void;
  public onSessionUpdate?: (session: MatchSession) => void;

  constructor() {
    this.peerId = this.generatePeerId();
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(supabaseUrl: string, supabaseKey: string): Promise<void> {
    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Subscribe to signaling channel for this peer
    await this.subscribeToSignaling();

    console.log(`[P2P] Initialized with peer ID: ${this.peerId}`);
  }

  private generatePeerId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  getPeerId(): string {
    return this.peerId;
  }

  // ---------------------------------------------------------------------------
  // SIGNALING (via Supabase Realtime)
  // ---------------------------------------------------------------------------

  private async subscribeToSignaling(): Promise<void> {
    if (!this.supabase) return;

    // Subscribe to offers directed at this peer
    this.signalSubscription = this.supabase
      .channel(`signaling:${this.peerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'signaling_offers',
        filter: `to_peer=eq.${this.peerId}`
      }, async (payload) => {
        await this.handleSignalingMessage(payload.new as any);
      })
      .subscribe();

    console.log('[P2P] Subscribed to signaling channel');
  }

  private async sendSignal(toPeer: string, type: string, payload: any): Promise<void> {
    if (!this.supabase) return;

    await this.supabase.from('signaling_offers').insert({
      from_peer: this.peerId,
      to_peer: toPeer,
      offer_type: type,
      payload
    });
  }

  private async handleSignalingMessage(signal: {
    from_peer: string;
    offer_type: string;
    payload: any;
  }): Promise<void> {
    const { from_peer, offer_type, payload } = signal;

    switch (offer_type) {
      case 'offer':
        await this.handleOffer(from_peer, payload);
        break;
      case 'answer':
        await this.handleAnswer(from_peer, payload);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(from_peer, payload);
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // CONNECTION MANAGEMENT
  // ---------------------------------------------------------------------------

  async connectToPeer(remotePeerId: string): Promise<RTCDataChannel> {
    if (this.dataChannels.has(remotePeerId)) {
      return this.dataChannels.get(remotePeerId)!;
    }

    const pc = this.createPeerConnection(remotePeerId);
    this.connections.set(remotePeerId, pc);

    // Create data channel
    const channel = pc.createDataChannel('game', {
      ordered: false, // UDP-like for game state
      maxRetransmits: 3
    });

    this.setupDataChannel(remotePeerId, channel);

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await this.sendSignal(remotePeerId, 'offer', offer);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 30000);

      channel.onopen = () => {
        clearTimeout(timeout);
        resolve(channel);
      };
    });
  }

  private createPeerConnection(remotePeerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: FREE_STUN_SERVERS
    });

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.sendSignal(remotePeerId, 'ice-candidate', event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.handlePeerDisconnect(remotePeerId);
      }
    };

    pc.ondatachannel = (event) => {
      this.setupDataChannel(remotePeerId, event.channel);
    };

    return pc;
  }

  private setupDataChannel(remotePeerId: string, channel: RTCDataChannel): void {
    channel.onopen = () => {
      this.dataChannels.set(remotePeerId, channel);
      console.log(`[P2P] Connected to peer: ${remotePeerId}`);
      this.onPeerConnected?.(remotePeerId);
    };

    channel.onclose = () => {
      this.handlePeerDisconnect(remotePeerId);
    };

    channel.onmessage = (event) => {
      try {
        const msg: P2PMessage = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.warn('[P2P] Failed to parse message:', e);
      }
    };
  }

  private async handleOffer(fromPeer: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.createPeerConnection(fromPeer);
    this.connections.set(fromPeer, pc);

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await this.sendSignal(fromPeer, 'answer', answer);
  }

  private async handleAnswer(fromPeer: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.connections.get(fromPeer);
    if (pc) {
      await pc.setRemoteDescription(answer);
    }
  }

  private async handleIceCandidate(fromPeer: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.connections.get(fromPeer);
    if (pc) {
      await pc.addIceCandidate(candidate);
    }
  }

  private handlePeerDisconnect(peerId: string): void {
    this.connections.get(peerId)?.close();
    this.connections.delete(peerId);
    this.dataChannels.delete(peerId);
    console.log(`[P2P] Disconnected from peer: ${peerId}`);
    this.onPeerDisconnected?.(peerId);
  }

  // ---------------------------------------------------------------------------
  // MESSAGE HANDLING
  // ---------------------------------------------------------------------------

  private handleMessage(msg: P2PMessage): void {
    // Handle specific message types
    const handler = this.messageHandlers.get(msg.type);
    if (handler) {
      handler(msg);
    }

    // Generic callback
    this.onMessage?.(msg);
  }

  registerHandler(type: string, handler: (msg: P2PMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  send(toPeerId: string, type: string, payload: any): void {
    const channel = this.dataChannels.get(toPeerId);
    if (!channel || channel.readyState !== 'open') {
      console.warn(`[P2P] Cannot send to ${toPeerId}: not connected`);
      return;
    }

    const msg: P2PMessage = {
      type,
      from: this.peerId,
      to: toPeerId,
      payload,
      timestamp: Date.now()
    };

    channel.send(JSON.stringify(msg));
  }

  broadcast(type: string, payload: any): void {
    for (const peerId of this.dataChannels.keys()) {
      this.send(peerId, type, payload);
    }
  }

  // ---------------------------------------------------------------------------
  // MATCH HOSTING
  // ---------------------------------------------------------------------------

  async hostMatch(levelId: string, maxPlayers: number): Promise<MatchSession> {
    const matchId = `match-${Date.now()}-${this.peerId.slice(0, 8)}`;

    this.currentSession = {
      matchId,
      levelId,
      hostPeerId: this.peerId,
      players: [this.peerId],
      relayPeers: [],
      state: 'forming',
      startedAt: Date.now()
    };

    this.isHost = true;

    // Register match in Supabase for discovery
    if (this.supabase) {
      const epochId = new Date().toISOString().split('T')[0];
      await this.supabase.from('live_match_logs').insert({
        match_id: matchId,
        level_id: levelId,
        players: [this.peerId],
        player_count: 1,
        host_peer_id: this.peerId,
        epoch_id: epochId
      });
    }

    // Start listening for join requests
    this.registerHandler('join-request', async (msg) => {
      if (this.currentSession && this.currentSession.players.length < maxPlayers) {
        this.currentSession.players.push(msg.from);
        this.send(msg.from, 'join-accepted', {
          matchId,
          levelId,
          players: this.currentSession.players
        });

        // Notify all players of update
        this.broadcast('player-joined', {
          playerId: msg.from,
          players: this.currentSession.players
        });

        this.onSessionUpdate?.(this.currentSession);
      } else {
        this.send(msg.from, 'join-rejected', { reason: 'full' });
      }
    });

    return this.currentSession;
  }

  async joinMatch(hostPeerId: string): Promise<MatchSession | null> {
    await this.connectToPeer(hostPeerId);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join timeout'));
      }, 10000);

      this.registerHandler('join-accepted', (msg) => {
        clearTimeout(timeout);
        this.currentSession = {
          matchId: msg.payload.matchId,
          levelId: msg.payload.levelId,
          hostPeerId,
          players: msg.payload.players,
          relayPeers: [],
          state: 'forming',
          startedAt: Date.now()
        };
        this.isHost = false;
        resolve(this.currentSession);
      });

      this.registerHandler('join-rejected', (msg) => {
        clearTimeout(timeout);
        reject(new Error(msg.payload.reason));
      });

      this.send(hostPeerId, 'join-request', {});
    });
  }

  async findMatches(levelId?: string): Promise<MatchSession[]> {
    if (!this.supabase) return [];

    let query = this.supabase
      .from('live_match_logs')
      .select('*')
      .eq('completed', false)
      .gt('started_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());

    if (levelId) {
      query = query.eq('level_id', levelId);
    }

    const { data } = await query.limit(20);

    return (data || []).map(m => ({
      matchId: m.match_id,
      levelId: m.level_id,
      hostPeerId: m.host_peer_id,
      players: m.players || [],
      relayPeers: m.relay_peers || [],
      state: m.completed ? 'completed' : 'forming',
      startedAt: new Date(m.started_at).getTime()
    }));
  }

  // ---------------------------------------------------------------------------
  // GAME STATE SYNC
  // ---------------------------------------------------------------------------

  sendGameState(state: any): void {
    if (this.isHost) {
      this.broadcast('game-state', state);
    }
  }

  sendInput(input: any): void {
    if (this.currentSession) {
      if (this.isHost) {
        // Host processes locally
        this.handleMessage({
          type: 'player-input',
          from: this.peerId,
          to: this.peerId,
          payload: input,
          timestamp: Date.now()
        });
      } else {
        // Send to host
        this.send(this.currentSession.hostPeerId, 'player-input', input);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // MATCH COMPLETION
  // ---------------------------------------------------------------------------

  async completeMatch(results: {
    winnerId?: string;
    scores: Record<string, number>;
    duration: number;
  }): Promise<string> {
    if (!this.currentSession || !this.isHost) {
      throw new Error('Only host can complete match');
    }

    this.currentSession.state = 'completed';

    // Create match hash for blockchain
    const matchData = {
      matchId: this.currentSession.matchId,
      levelId: this.currentSession.levelId,
      players: this.currentSession.players,
      startedAt: this.currentSession.startedAt,
      endedAt: Date.now(),
      results
    };

    const matchHash = await this.hashMatchData(matchData);

    // Update in Supabase
    if (this.supabase) {
      await this.supabase.from('live_match_logs').update({
        completed: true,
        ended_at: new Date().toISOString(),
        duration_ms: results.duration,
        winner_id: results.winnerId,
        final_scores: results.scores,
        match_hash: matchHash
      }).eq('match_id', this.currentSession.matchId);
    }

    // Notify players
    this.broadcast('match-complete', { matchHash, results });

    return matchHash;
  }

  private async hashMatchData(data: any): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  async disconnect(): Promise<void> {
    // Close all connections
    for (const pc of this.connections.values()) {
      pc.close();
    }
    this.connections.clear();
    this.dataChannels.clear();

    // Unsubscribe from signaling
    if (this.signalSubscription) {
      await this.signalSubscription.unsubscribe();
    }

    console.log('[P2P] Disconnected');
  }

  // ---------------------------------------------------------------------------
  // STATS
  // ---------------------------------------------------------------------------

  getStats(): {
    peerId: string;
    connectedPeers: number;
    isHost: boolean;
    currentMatch: MatchSession | null;
  } {
    return {
      peerId: this.peerId,
      connectedPeers: this.dataChannels.size,
      isHost: this.isHost,
      currentMatch: this.currentSession
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let networkInstance: P2PNetwork | null = null;

export function getP2PNetwork(): P2PNetwork {
  if (!networkInstance) {
    networkInstance = new P2PNetwork();
  }
  return networkInstance;
}
