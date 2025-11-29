/**
 * BeheadingBlockchain.ts
 *
 * Novel 24-hour rolling blockchain for match authentication
 *
 * The concept:
 * - Peers run with only the "head" (current epoch state)
 * - Over 24 hours, they build the "body" (match logs, hashes)
 * - At midnight UTC, the body gets "beheaded":
 *   - Senior peer council authenticates the body
 *   - Body is compressed and archived to the "morgue" (Supabase)
 *   - New head starts fresh for next epoch
 *
 * Benefits:
 * - Minimal storage on peers (just current head)
 * - Historical data preserved in morgue
 * - Council vouching prevents fraud
 * - No expensive consensus - council quorum is enough
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getP2PNetwork, P2PMessage } from './P2PNetwork';

// =============================================================================
// TYPES
// =============================================================================

export interface BlockchainHead {
  epochId: string;
  headHash: string;
  previousHeadHash: string | null;
  matchCount: number;
  matchHashes: string[];
  totalPlayers: number;
  totalTimePlayed: number;
  createdAt: number;
  lastUpdated: number;
}

export interface BlockchainBody {
  epochId: string;
  matches: MatchRecord[];
  totalSize: number;
}

export interface MatchRecord {
  matchId: string;
  matchHash: string;
  levelId: string;
  players: string[];
  startedAt: number;
  endedAt: number;
  duration: number;
  scores: Record<string, number>;
  winnerId?: string;
  hostPeerId: string;
}

export interface BeheadingResult {
  epochId: string;
  headHash: string;
  bodyChecksum: string;
  matchCount: number;
  authenticatedBy: string[];
  signatures: Record<string, string>;
  morgueId: string;
}

export interface EpochInfo {
  epochId: string;
  epochStart: Date;
  epochEnd: Date;
  msRemaining: number;
  isBeheadingTime: boolean;
}

// =============================================================================
// BEHEADING BLOCKCHAIN
// =============================================================================

export class BeheadingBlockchain {
  private supabase: SupabaseClient | null = null;
  private currentHead: BlockchainHead | null = null;
  private currentBody: BlockchainBody | null = null;

  // Beheading window: 5 minutes around midnight UTC
  private readonly BEHEADING_WINDOW_MS = 5 * 60 * 1000;

  // Callbacks
  public onHeadUpdated?: (head: BlockchainHead) => void;
  public onBeheadingStarted?: (epochId: string) => void;
  public onBeheadingComplete?: (result: BeheadingResult) => void;

  constructor() {
    // Initialize with current epoch
    this.initializeEpoch();
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(supabaseUrl: string, supabaseKey: string): Promise<void> {
    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Load or create head for current epoch
    await this.loadOrCreateHead();

    // Start epoch monitor
    this.startEpochMonitor();

    // Register P2P handlers
    this.registerP2PHandlers();

    console.log(`[Blockchain] Initialized for epoch: ${this.currentHead?.epochId}`);
  }

  private initializeEpoch(): void {
    const epochInfo = this.getEpochInfo();

    this.currentHead = {
      epochId: epochInfo.epochId,
      headHash: this.generateGenesisHash(epochInfo.epochId),
      previousHeadHash: null,
      matchCount: 0,
      matchHashes: [],
      totalPlayers: 0,
      totalTimePlayed: 0,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.currentBody = {
      epochId: epochInfo.epochId,
      matches: [],
      totalSize: 0
    };
  }

  private generateGenesisHash(epochId: string): string {
    // Deterministic genesis hash based on epoch
    const data = `ORTHOGONAL-GENESIS-${epochId}`;
    return this.simpleHash(data);
  }

  private simpleHash(data: string): string {
    // Simple hash for synchronous operations (not cryptographic)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  // ---------------------------------------------------------------------------
  // EPOCH MANAGEMENT
  // ---------------------------------------------------------------------------

  getEpochInfo(): EpochInfo {
    const now = new Date();
    const epochId = now.toISOString().split('T')[0];
    const epochStart = new Date(epochId + 'T00:00:00Z');
    const epochEnd = new Date(epochStart.getTime() + 24 * 60 * 60 * 1000);
    const msRemaining = epochEnd.getTime() - now.getTime();

    // Beheading time is around midnight UTC (last 5 minutes of epoch)
    const isBeheadingTime = msRemaining <= this.BEHEADING_WINDOW_MS;

    return {
      epochId,
      epochStart,
      epochEnd,
      msRemaining,
      isBeheadingTime
    };
  }

  private startEpochMonitor(): void {
    // Check every minute for epoch transitions
    setInterval(() => {
      const epochInfo = this.getEpochInfo();

      // Check for epoch change
      if (this.currentHead && epochInfo.epochId !== this.currentHead.epochId) {
        console.log('[Blockchain] Epoch changed, initiating beheading...');
        this.initiateBeheading();
      }

      // Warn when beheading is approaching
      if (epochInfo.isBeheadingTime && epochInfo.msRemaining > this.BEHEADING_WINDOW_MS - 60000) {
        console.log(`[Blockchain] Beheading in ${Math.round(epochInfo.msRemaining / 1000)}s`);
      }
    }, 60000);
  }

  // ---------------------------------------------------------------------------
  // HEAD OPERATIONS
  // ---------------------------------------------------------------------------

  private async loadOrCreateHead(): Promise<void> {
    if (!this.supabase) return;

    const epochInfo = this.getEpochInfo();

    // Check if we have this epoch's head locally synced with other peers
    // For now, start fresh each epoch (peers sync during the epoch)

    // Try to load previous epoch's head hash for chain linking
    const { data: prevMorgue } = await this.supabase
      .from('blockchain_morgue')
      .select('head_hash')
      .order('epoch_end', { ascending: false })
      .limit(1)
      .single();

    if (prevMorgue && this.currentHead) {
      this.currentHead.previousHeadHash = prevMorgue.head_hash;
    }
  }

  getHead(): BlockchainHead | null {
    return this.currentHead;
  }

  // ---------------------------------------------------------------------------
  // MATCH RECORDING
  // ---------------------------------------------------------------------------

  async recordMatch(record: MatchRecord): Promise<string> {
    if (!this.currentHead || !this.currentBody) {
      throw new Error('Blockchain not initialized');
    }

    // Add to body
    this.currentBody.matches.push(record);
    this.currentBody.totalSize += JSON.stringify(record).length;

    // Update head
    this.currentHead.matchCount++;
    this.currentHead.matchHashes.push(record.matchHash);
    this.currentHead.totalPlayers += record.players.length;
    this.currentHead.totalTimePlayed += record.duration;
    this.currentHead.lastUpdated = Date.now();

    // Recalculate head hash
    this.currentHead.headHash = await this.calculateHeadHash(this.currentHead);

    // Persist to Supabase
    if (this.supabase) {
      await this.supabase.from('live_match_logs').upsert({
        match_id: record.matchId,
        level_id: record.levelId,
        players: record.players,
        player_count: record.players.length,
        started_at: new Date(record.startedAt).toISOString(),
        ended_at: new Date(record.endedAt).toISOString(),
        duration_ms: record.duration,
        winner_id: record.winnerId,
        final_scores: record.scores,
        host_peer_id: record.hostPeerId,
        match_hash: record.matchHash,
        epoch_id: this.currentHead.epochId
      });
    }

    // Broadcast head update to peers
    this.broadcastHeadUpdate();

    this.onHeadUpdated?.(this.currentHead);

    return record.matchHash;
  }

  private async calculateHeadHash(head: BlockchainHead): Promise<string> {
    const data = JSON.stringify({
      epochId: head.epochId,
      previousHeadHash: head.previousHeadHash,
      matchCount: head.matchCount,
      matchHashes: head.matchHashes,
      totalPlayers: head.totalPlayers,
      totalTimePlayed: head.totalTimePlayed
    });

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ---------------------------------------------------------------------------
  // P2P SYNC
  // ---------------------------------------------------------------------------

  private registerP2PHandlers(): void {
    const network = getP2PNetwork();

    // Handle head updates from other peers
    network.registerHandler('blockchain-head', (msg: P2PMessage) => {
      this.handlePeerHeadUpdate(msg.payload);
    });

    // Handle head sync requests
    network.registerHandler('blockchain-sync-request', (msg: P2PMessage) => {
      network.send(msg.from, 'blockchain-head', this.currentHead);
    });
  }

  private broadcastHeadUpdate(): void {
    const network = getP2PNetwork();
    network.broadcast('blockchain-head', this.currentHead);
  }

  private handlePeerHeadUpdate(peerHead: BlockchainHead): void {
    if (!this.currentHead) return;

    // Same epoch?
    if (peerHead.epochId !== this.currentHead.epochId) {
      console.warn('[Blockchain] Peer has different epoch, ignoring');
      return;
    }

    // Peer has more matches? Might need to sync
    if (peerHead.matchCount > this.currentHead.matchCount) {
      console.log('[Blockchain] Peer has more matches, may need sync');
      // In production, would request missing matches
      // For now, trust peer if they have more data
    }
  }

  requestSync(): void {
    const network = getP2PNetwork();
    network.broadcast('blockchain-sync-request', {});
  }

  // ---------------------------------------------------------------------------
  // BEHEADING PROCESS
  // ---------------------------------------------------------------------------

  private async initiateBeheading(): Promise<void> {
    if (!this.currentHead || !this.currentBody) return;

    const epochId = this.currentHead.epochId;
    console.log(`[Blockchain] Beginning beheading of epoch: ${epochId}`);

    this.onBeheadingStarted?.(epochId);

    try {
      // 1. Finalize head hash
      const finalHeadHash = await this.calculateHeadHash(this.currentHead);

      // 2. Compress body
      const compressedBody = this.compressBody(this.currentBody);
      const bodyChecksum = this.simpleHash(JSON.stringify(this.currentBody.matches));

      // 3. Archive to morgue
      const morgueId = await this.archiveToMorgue(
        this.currentHead,
        compressedBody,
        bodyChecksum
      );

      // 4. Create result
      const result: BeheadingResult = {
        epochId,
        headHash: finalHeadHash,
        bodyChecksum,
        matchCount: this.currentHead.matchCount,
        authenticatedBy: [], // Will be filled by council
        signatures: {},
        morgueId
      };

      // 5. Start fresh epoch
      const newEpochInfo = this.getEpochInfo();
      this.currentHead = {
        epochId: newEpochInfo.epochId,
        headHash: this.generateGenesisHash(newEpochInfo.epochId),
        previousHeadHash: finalHeadHash,
        matchCount: 0,
        matchHashes: [],
        totalPlayers: 0,
        totalTimePlayed: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };

      this.currentBody = {
        epochId: newEpochInfo.epochId,
        matches: [],
        totalSize: 0
      };

      console.log(`[Blockchain] Beheading complete. New epoch: ${newEpochInfo.epochId}`);

      this.onBeheadingComplete?.(result);
      this.onHeadUpdated?.(this.currentHead);

    } catch (error) {
      console.error('[Blockchain] Beheading failed:', error);
    }
  }

  private compressBody(body: BlockchainBody): Uint8Array {
    // Simple compression: JSON stringify then encode
    // In production, would use proper compression like gzip
    const jsonString = JSON.stringify(body.matches);
    const encoder = new TextEncoder();
    return encoder.encode(jsonString);
  }

  private async archiveToMorgue(
    head: BlockchainHead,
    compressedBody: Uint8Array,
    bodyChecksum: string
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const epochStart = new Date(head.epochId + 'T00:00:00Z');
    const epochEnd = new Date(epochStart.getTime() + 24 * 60 * 60 * 1000);

    // Convert Uint8Array to base64 for storage
    const bodyBase64 = btoa(String.fromCharCode(...compressedBody));

    const { data, error } = await this.supabase
      .from('blockchain_morgue')
      .insert({
        head_hash: head.headHash,
        previous_head_hash: head.previousHeadHash,
        epoch_start: epochStart.toISOString(),
        epoch_end: epochEnd.toISOString(),
        match_count: head.matchCount,
        match_hashes: head.matchHashes,
        total_players: head.totalPlayers,
        total_time_played_ms: head.totalTimePlayed,
        body_data: bodyBase64,
        body_checksum: bodyChecksum
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  // ---------------------------------------------------------------------------
  // MORGUE QUERIES
  // ---------------------------------------------------------------------------

  async getMorgueHistory(limit: number = 30): Promise<{
    epochId: string;
    headHash: string;
    matchCount: number;
    totalPlayers: number;
    authenticatedAt?: string;
  }[]> {
    if (!this.supabase) return [];

    const { data } = await this.supabase
      .from('blockchain_morgue')
      .select('head_hash, epoch_start, match_count, total_players, authenticated_at')
      .order('epoch_end', { ascending: false })
      .limit(limit);

    return (data || []).map(m => ({
      epochId: m.epoch_start.split('T')[0],
      headHash: m.head_hash,
      matchCount: m.match_count,
      totalPlayers: m.total_players,
      authenticatedAt: m.authenticated_at
    }));
  }

  async getMorgueBody(epochId: string): Promise<MatchRecord[] | null> {
    if (!this.supabase) return null;

    const { data } = await this.supabase
      .from('blockchain_morgue')
      .select('body_data')
      .gte('epoch_start', epochId + 'T00:00:00Z')
      .lt('epoch_start', epochId + 'T23:59:59Z')
      .single();

    if (!data) return null;

    try {
      const jsonString = atob(data.body_data);
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // STATS
  // ---------------------------------------------------------------------------

  getStats(): {
    epochId: string;
    headHash: string;
    matchCount: number;
    totalPlayers: number;
    totalTimePlayed: number;
    bodySize: number;
    msUntilBeheading: number;
  } | null {
    if (!this.currentHead || !this.currentBody) return null;

    const epochInfo = this.getEpochInfo();

    return {
      epochId: this.currentHead.epochId,
      headHash: this.currentHead.headHash,
      matchCount: this.currentHead.matchCount,
      totalPlayers: this.currentHead.totalPlayers,
      totalTimePlayed: this.currentHead.totalTimePlayed,
      bodySize: this.currentBody.totalSize,
      msUntilBeheading: epochInfo.msRemaining
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let blockchainInstance: BeheadingBlockchain | null = null;

export function getBeheadingBlockchain(): BeheadingBlockchain {
  if (!blockchainInstance) {
    blockchainInstance = new BeheadingBlockchain();
  }
  return blockchainInstance;
}
