/**
 * DistributedInfra.ts
 *
 * Unified distributed infrastructure manager
 * Orchestrates P2P networking, beheading blockchain, and peer council
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                     VERCEL (Static Host)                    │
 * │  - Game client (HTML/JS/CSS)                                │
 * │  - API routes (health, epoch info)                          │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                  SUPABASE (Backend Services)                │
 * │  - PostgreSQL: players, leaderboards, morgue                │
 * │  - Realtime: P2P signaling, notifications                   │
 * │  - Auth: player authentication                              │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    P2P NETWORK (WebRTC)                     │
 * │  - Match hosting (no central server)                        │
 * │  - State sync between players                               │
 * │  - Relay peers for NAT traversal                            │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                BEHEADING BLOCKCHAIN                         │
 * │  - 24-hour epochs (midnight UTC beheading)                  │
 * │  - Match hashes accumulated in "body"                       │
 * │  - Bodies archived to morgue after beheading                │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                     PEER COUNCIL                            │
 * │  - Authenticates beheadings (quorum of 3+)                  │
 * │  - Vouching system for trust                                │
 * │  - Bad actor detection                                      │
 * └─────────────────────────────────────────────────────────────┘
 */

import { getP2PNetwork, P2PNetwork, MatchSession } from './P2PNetwork';
import { getBeheadingBlockchain, BeheadingBlockchain, BlockchainHead, MatchRecord } from './BeheadingBlockchain';
import { getPeerCouncil, PeerCouncil, CouncilMember, AuthenticationRequest } from './PeerCouncil';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface InfraConfig {
  supabaseUrl: string;
  supabaseKey: string;
  playerId: string;
  username: string;
}

export interface InfraStatus {
  initialized: boolean;
  p2p: {
    connected: boolean;
    peerId: string;
    connectedPeers: number;
  };
  blockchain: {
    epochId: string;
    headHash: string;
    matchCount: number;
    msUntilBeheading: number;
  };
  council: {
    isMember: boolean;
    rank: string | null;
    trustScore: number | null;
  };
}

export interface MatchResult {
  matchId: string;
  matchHash: string;
  winnerId?: string;
  scores: Record<string, number>;
  duration: number;
  blockchainRecorded: boolean;
}

// =============================================================================
// DISTRIBUTED INFRASTRUCTURE
// =============================================================================

export class DistributedInfra {
  private config: InfraConfig | null = null;
  private supabase: SupabaseClient | null = null;
  private p2p: P2PNetwork;
  private blockchain: BeheadingBlockchain;
  private council: PeerCouncil;
  private initialized: boolean = false;

  // Current match state
  private currentMatch: MatchSession | null = null;

  // Callbacks
  public onStatusChange?: (status: InfraStatus) => void;
  public onMatchFound?: (match: MatchSession) => void;
  public onMatchComplete?: (result: MatchResult) => void;
  public onBeheadingAlert?: (msRemaining: number) => void;

  constructor() {
    this.p2p = getP2PNetwork();
    this.blockchain = getBeheadingBlockchain();
    this.council = getPeerCouncil();
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(config: InfraConfig): Promise<void> {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);

    console.log('[Infra] Initializing distributed infrastructure...');

    // Initialize P2P network
    await this.p2p.initialize(config.supabaseUrl, config.supabaseKey);
    this.setupP2PCallbacks();

    // Initialize blockchain
    await this.blockchain.initialize(config.supabaseUrl, config.supabaseKey);
    this.setupBlockchainCallbacks();

    // Initialize council
    await this.council.initialize(config.supabaseUrl, config.supabaseKey, config.playerId);
    this.setupCouncilCallbacks();

    // Start monitoring
    this.startMonitoring();

    this.initialized = true;
    console.log('[Infra] Distributed infrastructure ready');

    this.emitStatusChange();
  }

  private setupP2PCallbacks(): void {
    this.p2p.onPeerConnected = (peerId) => {
      console.log(`[Infra] Peer connected: ${peerId.slice(0, 8)}...`);
      this.emitStatusChange();
    };

    this.p2p.onPeerDisconnected = (peerId) => {
      console.log(`[Infra] Peer disconnected: ${peerId.slice(0, 8)}...`);
      this.emitStatusChange();
    };

    this.p2p.onSessionUpdate = (session) => {
      this.currentMatch = session;
      this.onMatchFound?.(session);
    };
  }

  private setupBlockchainCallbacks(): void {
    this.blockchain.onHeadUpdated = (head) => {
      console.log(`[Infra] Blockchain head updated: ${head.matchCount} matches`);
      this.emitStatusChange();
    };

    this.blockchain.onBeheadingStarted = (epochId) => {
      console.log(`[Infra] Beheading started for epoch: ${epochId}`);

      // If we're a council member, participate in authentication
      if (this.council.canAuthenticate()) {
        this.participateInAuthentication(epochId);
      }
    };

    this.blockchain.onBeheadingComplete = (result) => {
      console.log(`[Infra] Beheading complete: ${result.epochId}`);
      this.emitStatusChange();
    };
  }

  private setupCouncilCallbacks(): void {
    this.council.onAuthenticationRequest = async (request) => {
      console.log(`[Infra] Authentication request for epoch: ${request.epochId}`);

      // Auto-sign if we can
      const signature = await this.council.signAuthentication(request);
      if (signature) {
        // Broadcast signature back
        this.p2p.broadcast('council-auth-signature', signature);
      }
    };
  }

  private startMonitoring(): void {
    // Monitor for beheading alerts
    setInterval(() => {
      const stats = this.blockchain.getStats();
      if (stats) {
        // Alert when 5 minutes remaining
        if (stats.msUntilBeheading <= 5 * 60 * 1000 && stats.msUntilBeheading > 4 * 60 * 1000) {
          this.onBeheadingAlert?.(stats.msUntilBeheading);
        }

        // Alert when 1 minute remaining
        if (stats.msUntilBeheading <= 60 * 1000 && stats.msUntilBeheading > 50 * 1000) {
          this.onBeheadingAlert?.(stats.msUntilBeheading);
        }
      }
    }, 10000);
  }

  private async participateInAuthentication(epochId: string): Promise<void> {
    const stats = this.blockchain.getStats();
    if (!stats) return;

    // Request authentication from other council members
    await this.council.requestAuthentication(
      epochId,
      stats.headHash,
      'checksum-placeholder', // Would calculate actual checksum
      stats.matchCount
    );
  }

  // ---------------------------------------------------------------------------
  // MATCH OPERATIONS
  // ---------------------------------------------------------------------------

  async hostMatch(levelId: string, maxPlayers: number): Promise<MatchSession> {
    if (!this.initialized) {
      throw new Error('Infrastructure not initialized');
    }

    this.currentMatch = await this.p2p.hostMatch(levelId, maxPlayers);
    return this.currentMatch;
  }

  async joinMatch(hostPeerId: string): Promise<MatchSession | null> {
    if (!this.initialized) {
      throw new Error('Infrastructure not initialized');
    }

    this.currentMatch = await this.p2p.joinMatch(hostPeerId);
    return this.currentMatch;
  }

  async findMatches(levelId?: string): Promise<MatchSession[]> {
    if (!this.initialized) {
      return [];
    }

    return await this.p2p.findMatches(levelId);
  }

  async completeMatch(result: {
    winnerId?: string;
    scores: Record<string, number>;
    duration: number;
  }): Promise<MatchResult> {
    if (!this.currentMatch) {
      throw new Error('No active match');
    }

    // Complete P2P match
    const matchHash = await this.p2p.completeMatch(result);

    // Record in blockchain
    const matchRecord: MatchRecord = {
      matchId: this.currentMatch.matchId,
      matchHash,
      levelId: this.currentMatch.levelId,
      players: this.currentMatch.players,
      startedAt: this.currentMatch.startedAt,
      endedAt: Date.now(),
      duration: result.duration,
      scores: result.scores,
      winnerId: result.winnerId,
      hostPeerId: this.currentMatch.hostPeerId
    };

    await this.blockchain.recordMatch(matchRecord);

    const matchResult: MatchResult = {
      matchId: this.currentMatch.matchId,
      matchHash,
      winnerId: result.winnerId,
      scores: result.scores,
      duration: result.duration,
      blockchainRecorded: true
    };

    this.currentMatch = null;
    this.onMatchComplete?.(matchResult);

    return matchResult;
  }

  // ---------------------------------------------------------------------------
  // COUNCIL OPERATIONS
  // ---------------------------------------------------------------------------

  async joinCouncil(): Promise<CouncilMember | null> {
    if (!this.config || this.council.isCouncilMember()) {
      return this.council.getMembership();
    }

    return await this.council.applyForMembership(
      this.config.playerId,
      this.config.username
    );
  }

  async vouchForPlayer(memberId: string, message?: string): Promise<void> {
    await this.council.vouchFor(memberId, 'identity', message || '');
  }

  getCouncilMembership(): CouncilMember | null {
    return this.council.getMembership();
  }

  // ---------------------------------------------------------------------------
  // STATUS
  // ---------------------------------------------------------------------------

  getStatus(): InfraStatus {
    const p2pStats = this.p2p.getStats();
    const blockchainStats = this.blockchain.getStats();
    const membership = this.council.getMembership();

    return {
      initialized: this.initialized,
      p2p: {
        connected: p2pStats.connectedPeers > 0,
        peerId: p2pStats.peerId,
        connectedPeers: p2pStats.connectedPeers
      },
      blockchain: {
        epochId: blockchainStats?.epochId || '',
        headHash: blockchainStats?.headHash || '',
        matchCount: blockchainStats?.matchCount || 0,
        msUntilBeheading: blockchainStats?.msUntilBeheading || 0
      },
      council: {
        isMember: this.council.isCouncilMember(),
        rank: membership?.rank || null,
        trustScore: membership?.trustScore || null
      }
    };
  }

  private emitStatusChange(): void {
    this.onStatusChange?.(this.getStatus());
  }

  // ---------------------------------------------------------------------------
  // QUICK STATUS DISPLAY
  // ---------------------------------------------------------------------------

  getQuickStatus(): string {
    const status = this.getStatus();

    const epochInfo = this.blockchain.getEpochInfo();
    const hoursRemaining = Math.floor(epochInfo.msRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((epochInfo.msRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return [
      `P2P: ${status.p2p.connectedPeers} peers`,
      `Epoch: ${status.blockchain.epochId}`,
      `Matches: ${status.blockchain.matchCount}`,
      `Beheading: ${hoursRemaining}h ${minutesRemaining}m`,
      `Council: ${status.council.rank || 'Not a member'}`
    ].join(' | ');
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  async disconnect(): Promise<void> {
    await this.p2p.disconnect();
    this.initialized = false;
    console.log('[Infra] Disconnected');
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let infraInstance: DistributedInfra | null = null;

export function getDistributedInfra(): DistributedInfra {
  if (!infraInstance) {
    infraInstance = new DistributedInfra();
  }
  return infraInstance;
}

// =============================================================================
// QUICK INITIALIZATION HELPER
// =============================================================================

export async function initializeInfrastructure(
  supabaseUrl: string,
  supabaseKey: string,
  playerId: string,
  username: string
): Promise<DistributedInfra> {
  const infra = getDistributedInfra();
  await infra.initialize({
    supabaseUrl,
    supabaseKey,
    playerId,
    username
  });
  return infra;
}
