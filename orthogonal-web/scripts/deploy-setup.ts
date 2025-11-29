#!/usr/bin/env node
/**
 * deploy-setup.ts
 *
 * Automated Vercel + Supabase deployment configuration
 * Run once to set up the infrastructure with minimal user effort
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import * as readline from 'readline';

const ROOT = resolve(__dirname, '..');

// =============================================================================
// INTERACTIVE SETUP
// =============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

// =============================================================================
// SUPABASE SCHEMA
// =============================================================================

const SUPABASE_SCHEMA = `
-- =============================================================================
-- ORTHOGONAL DATABASE SCHEMA
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PLAYERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),

  -- SDPM Profile
  sdpm_profile JSONB DEFAULT '{}',

  -- Peer council status
  is_council_member BOOLEAN DEFAULT FALSE,
  council_rank INTEGER DEFAULT 0,
  peer_vouches UUID[] DEFAULT '{}',
  vouched_by UUID[] DEFAULT '{}',
  council_certificate TEXT,
  council_public_key TEXT,

  -- Stats
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_time_played_ms BIGINT DEFAULT 0
);

-- =============================================================================
-- LEADERBOARDS
-- =============================================================================

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  level_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  time_ms INTEGER NOT NULL,
  dimension_shifts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_hash TEXT,
  peer_attestations UUID[] DEFAULT '{}',

  -- Streaming
  platform TEXT, -- 'tiktok', 'twitch', 'youtube', null for non-streamers
  stream_session_id TEXT,
  vod_url TEXT,

  UNIQUE(player_id, level_id, created_at)
);

CREATE INDEX idx_leaderboard_level ON leaderboard_entries(level_id);
CREATE INDEX idx_leaderboard_score ON leaderboard_entries(score DESC);
CREATE INDEX idx_leaderboard_platform ON leaderboard_entries(platform);

-- =============================================================================
-- BLOCKCHAIN MORGUE (Archived 24hr bodies)
-- =============================================================================

CREATE TABLE IF NOT EXISTS blockchain_morgue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Head info
  head_hash TEXT NOT NULL UNIQUE,
  previous_head_hash TEXT,
  epoch_start TIMESTAMPTZ NOT NULL,
  epoch_end TIMESTAMPTZ NOT NULL,

  -- Body content
  match_count INTEGER NOT NULL,
  match_hashes TEXT[] NOT NULL,
  total_players INTEGER NOT NULL,
  total_time_played_ms BIGINT NOT NULL,

  -- Compressed body data
  body_data BYTEA NOT NULL,
  body_checksum TEXT NOT NULL,

  -- Council authentication
  authenticated_at TIMESTAMPTZ,
  authenticating_council_members UUID[] DEFAULT '{}',
  council_signatures JSONB DEFAULT '{}',
  authentication_quorum INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_morgue_epoch ON blockchain_morgue(epoch_start, epoch_end);
CREATE INDEX idx_morgue_hash ON blockchain_morgue(head_hash);

-- =============================================================================
-- MATCH LOGS (Live body being built)
-- =============================================================================

CREATE TABLE IF NOT EXISTS live_match_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  players UUID[] NOT NULL,
  player_count INTEGER NOT NULL,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Result
  completed BOOLEAN DEFAULT FALSE,
  winner_id UUID,
  final_scores JSONB DEFAULT '{}',

  -- P2P hosting info
  host_peer_id TEXT NOT NULL,
  relay_peers TEXT[] DEFAULT '{}',

  -- Hash for blockchain
  match_hash TEXT,

  -- Epoch tracking
  epoch_id TEXT NOT NULL
);

CREATE INDEX idx_live_match_epoch ON live_match_logs(epoch_id);
CREATE INDEX idx_live_match_started ON live_match_logs(started_at);

-- =============================================================================
-- PEER COUNCIL
-- =============================================================================

CREATE TABLE IF NOT EXISTS peer_council (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE UNIQUE,

  -- Rank and status
  rank INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'candidate', -- 'candidate', 'junior', 'senior', 'elder'
  inducted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Cryptographic identity
  public_key TEXT NOT NULL,
  key_fingerprint TEXT NOT NULL,
  certificate TEXT NOT NULL,
  certificate_expires TIMESTAMPTZ NOT NULL,

  -- Vouching
  vouched_by UUID[] DEFAULT '{}',
  vouches_given UUID[] DEFAULT '{}',
  vouch_count INTEGER DEFAULT 0,

  -- Authentication participation
  authentications_participated INTEGER DEFAULT 0,
  last_authentication TIMESTAMPTZ,

  -- Trust score (0-100)
  trust_score INTEGER DEFAULT 50
);

CREATE INDEX idx_council_status ON peer_council(status);
CREATE INDEX idx_council_trust ON peer_council(trust_score DESC);

-- =============================================================================
-- VOUCH RECORDS
-- =============================================================================

CREATE TABLE IF NOT EXISTS vouch_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID REFERENCES peer_council(id) ON DELETE CASCADE,
  vouchee_id UUID REFERENCES peer_council(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Vouch details
  vouch_type TEXT DEFAULT 'identity', -- 'identity', 'behavior', 'authentication'
  vouch_message TEXT,
  signature TEXT NOT NULL,

  -- Can be revoked
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,

  UNIQUE(voucher_id, vouchee_id, vouch_type)
);

-- =============================================================================
-- P2P SIGNALING (for WebRTC coordination)
-- =============================================================================

CREATE TABLE IF NOT EXISTS signaling_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_peer TEXT NOT NULL,
  to_peer TEXT NOT NULL,
  offer_type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate'
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 seconds'
);

CREATE INDEX idx_signaling_to ON signaling_offers(to_peer);
CREATE INDEX idx_signaling_expires ON signaling_offers(expires_at);

-- Auto-cleanup expired offers
CREATE OR REPLACE FUNCTION cleanup_expired_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM signaling_offers WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Get current epoch ID (changes every 24 hours at midnight UTC)
CREATE OR REPLACE FUNCTION get_current_epoch()
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
END;
$$ LANGUAGE plpgsql;

-- Calculate match hash
CREATE OR REPLACE FUNCTION calculate_match_hash(match_record live_match_logs)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    sha256(
      (match_record.match_id ||
       match_record.level_id ||
       array_to_string(match_record.players::text[], ',') ||
       match_record.started_at::text ||
       COALESCE(match_record.ended_at::text, '') ||
       COALESCE(match_record.final_scores::text, '{}'))::bytea
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_match_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_council ENABLE ROW LEVEL SECURITY;

-- Players can read all, write own
CREATE POLICY players_read ON players FOR SELECT USING (true);
CREATE POLICY players_write ON players FOR ALL USING (auth.uid() = id);

-- Leaderboard is public read
CREATE POLICY leaderboard_read ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY leaderboard_write ON leaderboard_entries FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Match logs readable by participants
CREATE POLICY match_read ON live_match_logs FOR SELECT USING (true);
CREATE POLICY match_write ON live_match_logs FOR INSERT WITH CHECK (true);

-- Council is public read
CREATE POLICY council_read ON peer_council FOR SELECT USING (true);
`;

// =============================================================================
// VERCEL CONFIG
// =============================================================================

const VERCEL_CONFIG = {
  version: 2,
  name: 'orthogonal',
  builds: [
    {
      src: 'package.json',
      use: '@vercel/static-build',
      config: {
        distDir: 'dist'
      }
    }
  ],
  routes: [
    { src: '/api/(.*)', dest: '/api/$1' },
    { src: '/(.*)', dest: '/$1' }
  ],
  env: {
    VITE_SUPABASE_URL: '@supabase_url',
    VITE_SUPABASE_ANON_KEY: '@supabase_anon_key'
  }
};

// =============================================================================
// ENV TEMPLATE
// =============================================================================

const ENV_TEMPLATE = `
# Orthogonal Environment Configuration
# Copy to .env.local and fill in values

# Supabase
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Analytics
VITE_ANALYTICS_ID=

# P2P Config
VITE_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
VITE_TURN_SERVER=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
`;

// =============================================================================
// MAIN SETUP
// =============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log(' Orthogonal Deployment Setup');
  console.log('='.repeat(60));
  console.log();

  const args = process.argv.slice(2);
  const autoMode = args.includes('--auto');

  // 1. Create vercel.json
  console.log('[1/6] Creating Vercel configuration...');
  writeFileSync(
    join(ROOT, 'vercel.json'),
    JSON.stringify(VERCEL_CONFIG, null, 2)
  );
  console.log('  Created vercel.json');

  // 2. Create env template
  console.log('[2/6] Creating environment template...');
  const envPath = join(ROOT, '.env.example');
  writeFileSync(envPath, ENV_TEMPLATE.trim());
  console.log('  Created .env.example');

  // 3. Create Supabase SQL file
  console.log('[3/6] Creating Supabase schema...');
  const sqlDir = join(ROOT, 'supabase');
  if (!existsSync(sqlDir)) {
    mkdirSync(sqlDir, { recursive: true });
  }
  writeFileSync(join(sqlDir, 'schema.sql'), SUPABASE_SCHEMA.trim());
  console.log('  Created supabase/schema.sql');

  // 4. Create API routes directory
  console.log('[4/6] Creating API routes...');
  const apiDir = join(ROOT, 'api');
  if (!existsSync(apiDir)) {
    mkdirSync(apiDir, { recursive: true });
  }

  // Health check endpoint
  writeFileSync(join(apiDir, 'health.ts'), `
export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
}
`.trim());

  // Epoch info endpoint
  writeFileSync(join(apiDir, 'epoch.ts'), `
export default function handler(req: any, res: any) {
  const now = new Date();
  const epochId = now.toISOString().split('T')[0];
  const epochStart = new Date(epochId + 'T00:00:00Z');
  const epochEnd = new Date(epochStart.getTime() + 24 * 60 * 60 * 1000);
  const msRemaining = epochEnd.getTime() - now.getTime();

  res.status(200).json({
    epochId,
    epochStart: epochStart.toISOString(),
    epochEnd: epochEnd.toISOString(),
    msRemaining,
    hoursRemaining: (msRemaining / (1000 * 60 * 60)).toFixed(2)
  });
}
`.trim());

  console.log('  Created api/health.ts');
  console.log('  Created api/epoch.ts');

  // 5. Update .gitignore
  console.log('[5/6] Updating .gitignore...');
  const gitignorePath = join(ROOT, '.gitignore');
  let gitignore = existsSync(gitignorePath)
    ? readFileSync(gitignorePath, 'utf-8')
    : '';

  const additions = [
    '.env',
    '.env.local',
    '.env.*.local',
    '.vercel',
    'node_modules',
    'dist'
  ];

  for (const item of additions) {
    if (!gitignore.includes(item)) {
      gitignore += `\n${item}`;
    }
  }
  writeFileSync(gitignorePath, gitignore.trim() + '\n');
  console.log('  Updated .gitignore');

  // 6. Print instructions
  console.log('[6/6] Setup complete!');
  console.log();
  console.log('='.repeat(60));
  console.log(' NEXT STEPS');
  console.log('='.repeat(60));
  console.log();
  console.log('1. SUPABASE SETUP:');
  console.log('   a. Go to https://supabase.com and create a new project');
  console.log('   b. Go to SQL Editor and run: supabase/schema.sql');
  console.log('   c. Copy your project URL and anon key from Settings > API');
  console.log();
  console.log('2. LOCAL ENV:');
  console.log('   cp .env.example .env.local');
  console.log('   # Edit .env.local with your Supabase credentials');
  console.log();
  console.log('3. VERCEL DEPLOY:');
  console.log('   npx vercel');
  console.log('   # Follow prompts, then:');
  console.log('   npx vercel env add VITE_SUPABASE_URL');
  console.log('   npx vercel env add VITE_SUPABASE_ANON_KEY');
  console.log();
  console.log('4. DEPLOY PRODUCTION:');
  console.log('   npx vercel --prod');
  console.log();

  rl.close();
}

main().catch(console.error);
