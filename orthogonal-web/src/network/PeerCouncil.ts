/**
 * PeerCouncil.ts
 *
 * Decentralized authentication system with mutual vouching
 *
 * The council:
 * - Senior peers are vetted, certificated, and keyed
 * - They vouch for each other (mutual trust)
 * - They authenticate blockchain beheadings
 * - Impostors detected by lack of vouches
 *
 * Ranks:
 * - Candidate: New, needs 3 vouches to become Junior
 * - Junior: Can vouch for Candidates, needs 5 Senior vouches for promotion
 * - Senior: Can vouch for anyone, participates in authentication
 * - Elder: Auto-promoted after 30 authentications, higher trust weight
 *
 * Authentication:
 * - Beheading requires quorum (3+ Senior/Elder signatures)
 * - Each signature is cryptographically verified
 * - Bad actors lose trust score and can be kicked
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getBeheadingBlockchain, BeheadingResult } from './BeheadingBlockchain';
import { getP2PNetwork, P2PMessage } from './P2PNetwork';

// =============================================================================
// TYPES
// =============================================================================

export type CouncilRank = 'candidate' | 'junior' | 'senior' | 'elder';

export interface CouncilMember {
  id: string;
  playerId: string;
  username: string;
  rank: CouncilRank;
  publicKey: string;
  keyFingerprint: string;
  certificate: string;
  certificateExpires: Date;
  trustScore: number;
  vouchCount: number;
  vouchedBy: string[];
  vouchesGiven: string[];
  authenticationsParticipated: number;
  inductedAt: Date;
}

export interface VouchRecord {
  id: string;
  voucherId: string;
  voucheeId: string;
  vouchType: 'identity' | 'behavior' | 'authentication';
  message: string;
  signature: string;
  createdAt: Date;
  revoked: boolean;
}

export interface AuthenticationRequest {
  epochId: string;
  headHash: string;
  bodyChecksum: string;
  matchCount: number;
  requestedBy: string;
  requestedAt: number;
}

export interface AuthenticationSignature {
  memberId: string;
  signature: string;
  timestamp: number;
}

// =============================================================================
// CRYPTO UTILITIES
// =============================================================================

async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );
}

async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

async function importPublicKey(keyData: string): Promise<CryptoKey> {
  const binaryString = atob(keyData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await crypto.subtle.importKey(
    'spki',
    bytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify']
  );
}

async function signData(privateKey: CryptoKey, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(data)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifySignature(
  publicKey: CryptoKey,
  signature: string,
  data: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const sigBytes = new Uint8Array(
    atob(signature).split('').map(c => c.charCodeAt(0))
  );
  return await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    sigBytes,
    encoder.encode(data)
  );
}

function generateFingerprint(publicKey: string): string {
  // Simple fingerprint: first 16 chars of base64
  return publicKey.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toUpperCase();
}

// =============================================================================
// PEER COUNCIL
// =============================================================================

export class PeerCouncil {
  private supabase: SupabaseClient | null = null;
  private keyPair: CryptoKeyPair | null = null;
  private myMembership: CouncilMember | null = null;
  private knownMembers: Map<string, CouncilMember> = new Map();

  // Authentication quorum
  private readonly AUTHENTICATION_QUORUM = 3;

  // Vouch requirements
  private readonly VOUCHES_FOR_JUNIOR = 3;
  private readonly VOUCHES_FOR_SENIOR = 5;
  private readonly AUTHS_FOR_ELDER = 30;

  // Callbacks
  public onMembershipChanged?: (member: CouncilMember) => void;
  public onVouchReceived?: (vouch: VouchRecord) => void;
  public onAuthenticationRequest?: (request: AuthenticationRequest) => void;

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(
    supabaseUrl: string,
    supabaseKey: string,
    playerId: string
  ): Promise<void> {
    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Generate or load keys
    await this.initializeKeys(playerId);

    // Load membership status
    await this.loadMembership(playerId);

    // Load known council members
    await this.loadKnownMembers();

    // Register P2P handlers
    this.registerP2PHandlers();

    console.log(`[Council] Initialized. Rank: ${this.myMembership?.rank || 'none'}`);
  }

  private async initializeKeys(playerId: string): Promise<void> {
    // Check for stored keys
    const storedPrivate = localStorage.getItem(`orthogonal-council-key-${playerId}`);

    if (storedPrivate) {
      // Would import stored key in production
      // For now, regenerate each session
    }

    // Generate new key pair
    this.keyPair = await generateKeyPair();

    // Store private key (in production, use secure storage)
    // For demo, we regenerate each session
  }

  private async loadMembership(playerId: string): Promise<void> {
    if (!this.supabase) return;

    const { data } = await this.supabase
      .from('peer_council')
      .select('*, players(username)')
      .eq('player_id', playerId)
      .single();

    if (data) {
      this.myMembership = this.toCouncilMember(data);
    }
  }

  private async loadKnownMembers(): Promise<void> {
    if (!this.supabase) return;

    // Load active senior and elder members
    const { data } = await this.supabase
      .from('peer_council')
      .select('*, players(username)')
      .in('status', ['senior', 'elder'])
      .gte('trust_score', 50)
      .order('trust_score', { ascending: false })
      .limit(100);

    for (const member of data || []) {
      const cm = this.toCouncilMember(member);
      this.knownMembers.set(cm.id, cm);
    }

    console.log(`[Council] Loaded ${this.knownMembers.size} senior/elder members`);
  }

  private toCouncilMember(data: any): CouncilMember {
    return {
      id: data.id,
      playerId: data.player_id,
      username: data.players?.username || 'Unknown',
      rank: data.status as CouncilRank,
      publicKey: data.public_key,
      keyFingerprint: data.key_fingerprint,
      certificate: data.certificate,
      certificateExpires: new Date(data.certificate_expires),
      trustScore: data.trust_score,
      vouchCount: data.vouch_count,
      vouchedBy: data.vouched_by || [],
      vouchesGiven: data.vouches_given || [],
      authenticationsParticipated: data.authentications_participated,
      inductedAt: new Date(data.inducted_at)
    };
  }

  // ---------------------------------------------------------------------------
  // MEMBERSHIP
  // ---------------------------------------------------------------------------

  async applyForMembership(playerId: string, username: string): Promise<CouncilMember> {
    if (!this.supabase || !this.keyPair) {
      throw new Error('Council not initialized');
    }

    const publicKey = await exportPublicKey(this.keyPair.publicKey);
    const fingerprint = generateFingerprint(publicKey);

    // Create certificate (self-signed for candidates)
    const certData = JSON.stringify({
      playerId,
      username,
      publicKey: fingerprint,
      issuedAt: Date.now(),
      type: 'candidate'
    });
    const certificate = await signData(this.keyPair.privateKey, certData);

    // Certificate valid for 90 days
    const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('peer_council')
      .insert({
        player_id: playerId,
        rank: 1,
        status: 'candidate',
        public_key: publicKey,
        key_fingerprint: fingerprint,
        certificate,
        certificate_expires: expires.toISOString(),
        trust_score: 50
      })
      .select('*, players(username)')
      .single();

    if (error) {
      throw error;
    }

    this.myMembership = this.toCouncilMember(data);
    return this.myMembership;
  }

  getMembership(): CouncilMember | null {
    return this.myMembership;
  }

  isCouncilMember(): boolean {
    return this.myMembership !== null;
  }

  canVouch(): boolean {
    if (!this.myMembership) return false;
    return ['junior', 'senior', 'elder'].includes(this.myMembership.rank);
  }

  canAuthenticate(): boolean {
    if (!this.myMembership) return false;
    return ['senior', 'elder'].includes(this.myMembership.rank);
  }

  // ---------------------------------------------------------------------------
  // VOUCHING
  // ---------------------------------------------------------------------------

  async vouchFor(
    targetMemberId: string,
    vouchType: VouchRecord['vouchType'] = 'identity',
    message: string = ''
  ): Promise<VouchRecord> {
    if (!this.supabase || !this.keyPair || !this.myMembership) {
      throw new Error('Cannot vouch: not a council member');
    }

    if (!this.canVouch()) {
      throw new Error('Your rank does not allow vouching');
    }

    // Get target member
    const { data: target } = await this.supabase
      .from('peer_council')
      .select('*')
      .eq('id', targetMemberId)
      .single();

    if (!target) {
      throw new Error('Target member not found');
    }

    // Check vouch rules
    if (this.myMembership.rank === 'junior' && target.status !== 'candidate') {
      throw new Error('Junior members can only vouch for candidates');
    }

    // Create vouch signature
    const vouchData = JSON.stringify({
      voucherId: this.myMembership.id,
      voucheeId: targetMemberId,
      vouchType,
      message,
      timestamp: Date.now()
    });
    const signature = await signData(this.keyPair.privateKey, vouchData);

    // Store vouch
    const { data: vouch, error } = await this.supabase
      .from('vouch_records')
      .insert({
        voucher_id: this.myMembership.id,
        vouchee_id: targetMemberId,
        vouch_type: vouchType,
        vouch_message: message,
        signature
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update target's vouch count
    await this.supabase
      .from('peer_council')
      .update({
        vouch_count: target.vouch_count + 1,
        vouched_by: [...(target.vouched_by || []), this.myMembership.id]
      })
      .eq('id', targetMemberId);

    // Check for promotion
    await this.checkPromotion(targetMemberId);

    return {
      id: vouch.id,
      voucherId: this.myMembership.id,
      voucheeId: targetMemberId,
      vouchType,
      message,
      signature,
      createdAt: new Date(vouch.created_at),
      revoked: false
    };
  }

  async revokeVouch(vouchId: string, reason: string): Promise<void> {
    if (!this.supabase || !this.myMembership) {
      throw new Error('Cannot revoke: not initialized');
    }

    await this.supabase
      .from('vouch_records')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        revoke_reason: reason
      })
      .eq('id', vouchId)
      .eq('voucher_id', this.myMembership.id);
  }

  private async checkPromotion(memberId: string): Promise<void> {
    if (!this.supabase) return;

    const { data: member } = await this.supabase
      .from('peer_council')
      .select('*')
      .eq('id', memberId)
      .single();

    if (!member) return;

    let newStatus: CouncilRank | null = null;

    // Candidate -> Junior: needs 3 vouches
    if (member.status === 'candidate' && member.vouch_count >= this.VOUCHES_FOR_JUNIOR) {
      newStatus = 'junior';
    }

    // Junior -> Senior: needs 5 vouches from senior/elder
    if (member.status === 'junior') {
      const { count } = await this.supabase
        .from('vouch_records')
        .select('*', { count: 'exact' })
        .eq('vouchee_id', memberId)
        .eq('revoked', false)
        .in('voucher_id', Array.from(this.knownMembers.keys()));

      if ((count || 0) >= this.VOUCHES_FOR_SENIOR) {
        newStatus = 'senior';
      }
    }

    // Senior -> Elder: needs 30 authentications
    if (member.status === 'senior' &&
        member.authentications_participated >= this.AUTHS_FOR_ELDER) {
      newStatus = 'elder';
    }

    if (newStatus) {
      await this.supabase
        .from('peer_council')
        .update({ status: newStatus })
        .eq('id', memberId);

      console.log(`[Council] Member ${memberId} promoted to ${newStatus}`);
    }
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATION (Beheading Verification)
  // ---------------------------------------------------------------------------

  async requestAuthentication(
    epochId: string,
    headHash: string,
    bodyChecksum: string,
    matchCount: number
  ): Promise<void> {
    if (!this.myMembership || !this.canAuthenticate()) {
      throw new Error('Not authorized to request authentication');
    }

    const request: AuthenticationRequest = {
      epochId,
      headHash,
      bodyChecksum,
      matchCount,
      requestedBy: this.myMembership.id,
      requestedAt: Date.now()
    };

    // Broadcast to council members
    const network = getP2PNetwork();
    network.broadcast('council-auth-request', request);

    // Also store in Supabase for offline council members
    if (this.supabase) {
      await this.supabase.from('signaling_offers').insert({
        from_peer: this.myMembership.id,
        to_peer: 'council-broadcast',
        offer_type: 'auth-request',
        payload: request
      });
    }

    this.onAuthenticationRequest?.(request);
  }

  async signAuthentication(request: AuthenticationRequest): Promise<AuthenticationSignature | null> {
    if (!this.keyPair || !this.myMembership || !this.canAuthenticate()) {
      return null;
    }

    // Verify we agree with the request
    const blockchain = getBeheadingBlockchain();
    const stats = blockchain.getStats();

    if (!stats || stats.epochId !== request.epochId) {
      console.warn('[Council] Epoch mismatch, refusing to sign');
      return null;
    }

    if (stats.headHash !== request.headHash) {
      console.warn('[Council] Head hash mismatch, refusing to sign');
      return null;
    }

    // Sign the authentication
    const authData = JSON.stringify({
      epochId: request.epochId,
      headHash: request.headHash,
      bodyChecksum: request.bodyChecksum,
      matchCount: request.matchCount,
      signerId: this.myMembership.id,
      timestamp: Date.now()
    });

    const signature = await signData(this.keyPair.privateKey, authData);

    return {
      memberId: this.myMembership.id,
      signature,
      timestamp: Date.now()
    };
  }

  async verifyAuthentication(
    request: AuthenticationRequest,
    signatures: AuthenticationSignature[]
  ): Promise<{
    valid: boolean;
    verifiedSignatures: number;
    quorumMet: boolean;
  }> {
    let verifiedCount = 0;

    for (const sig of signatures) {
      const member = this.knownMembers.get(sig.memberId);
      if (!member || !['senior', 'elder'].includes(member.rank)) {
        continue;
      }

      try {
        const publicKey = await importPublicKey(member.publicKey);
        const authData = JSON.stringify({
          epochId: request.epochId,
          headHash: request.headHash,
          bodyChecksum: request.bodyChecksum,
          matchCount: request.matchCount,
          signerId: sig.memberId,
          timestamp: sig.timestamp
        });

        const valid = await verifySignature(publicKey, sig.signature, authData);
        if (valid) {
          verifiedCount++;
        }
      } catch (e) {
        console.warn(`[Council] Failed to verify signature from ${sig.memberId}:`, e);
      }
    }

    return {
      valid: verifiedCount >= this.AUTHENTICATION_QUORUM,
      verifiedSignatures: verifiedCount,
      quorumMet: verifiedCount >= this.AUTHENTICATION_QUORUM
    };
  }

  async submitAuthenticationToMorgue(
    epochId: string,
    signatures: AuthenticationSignature[]
  ): Promise<void> {
    if (!this.supabase) return;

    const memberIds = signatures.map(s => s.memberId);
    const sigMap: Record<string, string> = {};
    for (const sig of signatures) {
      sigMap[sig.memberId] = sig.signature;
    }

    await this.supabase
      .from('blockchain_morgue')
      .update({
        authenticated_at: new Date().toISOString(),
        authenticating_council_members: memberIds,
        council_signatures: sigMap,
        authentication_quorum: signatures.length
      })
      .gte('epoch_start', epochId + 'T00:00:00Z')
      .lt('epoch_start', epochId + 'T23:59:59Z');

    // Update authentication counts for signers
    for (const memberId of memberIds) {
      await this.supabase
        .from('peer_council')
        .update({
          authentications_participated: this.knownMembers.get(memberId)?.authenticationsParticipated ?? 0 + 1,
          last_authentication: new Date().toISOString()
        })
        .eq('id', memberId);
    }
  }

  // ---------------------------------------------------------------------------
  // P2P HANDLERS
  // ---------------------------------------------------------------------------

  private registerP2PHandlers(): void {
    const network = getP2PNetwork();

    // Handle authentication requests
    network.registerHandler('council-auth-request', async (msg: P2PMessage) => {
      const request = msg.payload as AuthenticationRequest;
      this.onAuthenticationRequest?.(request);

      // Auto-sign if we're authorized and agree
      if (this.canAuthenticate()) {
        const signature = await this.signAuthentication(request);
        if (signature) {
          network.send(msg.from, 'council-auth-signature', signature);
        }
      }
    });

    // Handle vouch announcements
    network.registerHandler('council-vouch', (msg: P2PMessage) => {
      const vouch = msg.payload as VouchRecord;
      this.onVouchReceived?.(vouch);
    });
  }

  // ---------------------------------------------------------------------------
  // TRUST MANAGEMENT
  // ---------------------------------------------------------------------------

  async reportBadActor(
    targetMemberId: string,
    reason: string,
    evidence?: string
  ): Promise<void> {
    if (!this.supabase || !this.myMembership) return;

    // Decrease trust score
    const member = this.knownMembers.get(targetMemberId);
    if (!member) return;

    const newTrustScore = Math.max(0, member.trustScore - 10);

    await this.supabase
      .from('peer_council')
      .update({ trust_score: newTrustScore })
      .eq('id', targetMemberId);

    // If trust drops below 30, demote
    if (newTrustScore < 30 && member.rank !== 'candidate') {
      await this.supabase
        .from('peer_council')
        .update({ status: 'candidate' })
        .eq('id', targetMemberId);

      console.log(`[Council] Member ${targetMemberId} demoted due to low trust`);
    }
  }

  async rewardGoodActor(targetMemberId: string): Promise<void> {
    if (!this.supabase) return;

    const member = this.knownMembers.get(targetMemberId);
    if (!member) return;

    const newTrustScore = Math.min(100, member.trustScore + 1);

    await this.supabase
      .from('peer_council')
      .update({ trust_score: newTrustScore })
      .eq('id', targetMemberId);
  }

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  async getCouncilStats(): Promise<{
    totalMembers: number;
    byRank: Record<CouncilRank, number>;
    recentAuthentications: number;
    trustDistribution: { low: number; medium: number; high: number };
  }> {
    if (!this.supabase) {
      return {
        totalMembers: 0,
        byRank: { candidate: 0, junior: 0, senior: 0, elder: 0 },
        recentAuthentications: 0,
        trustDistribution: { low: 0, medium: 0, high: 0 }
      };
    }

    const { data } = await this.supabase
      .from('peer_council')
      .select('status, trust_score');

    const byRank: Record<CouncilRank, number> = {
      candidate: 0,
      junior: 0,
      senior: 0,
      elder: 0
    };

    const trustDistribution = { low: 0, medium: 0, high: 0 };

    for (const member of data || []) {
      byRank[member.status as CouncilRank]++;

      if (member.trust_score < 40) trustDistribution.low++;
      else if (member.trust_score < 70) trustDistribution.medium++;
      else trustDistribution.high++;
    }

    // Count recent authentications (last 7 days)
    const { count } = await this.supabase
      .from('blockchain_morgue')
      .select('*', { count: 'exact' })
      .not('authenticated_at', 'is', null)
      .gte('authenticated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return {
      totalMembers: data?.length || 0,
      byRank,
      recentAuthentications: count || 0,
      trustDistribution
    };
  }

  getKnownMembers(): CouncilMember[] {
    return Array.from(this.knownMembers.values());
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let councilInstance: PeerCouncil | null = null;

export function getPeerCouncil(): PeerCouncil {
  if (!councilInstance) {
    councilInstance = new PeerCouncil();
  }
  return councilInstance;
}
