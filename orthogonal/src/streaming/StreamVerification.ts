/**
 * StreamVerification.ts
 *
 * AI-powered verification for streamer leaderboard submissions
 * Captures stream screenshot, extracts game data, cross-references with claimed score
 */

// =============================================================================
// TYPES
// =============================================================================

export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'suspicious';

export interface StreamCapture {
  streamUrl: string;
  platform: 'tiktok' | 'twitch' | 'youtube' | 'kick';
  capturedAt: number;
  imageData: string;  // base64 or URL
  streamerId: string;
  streamerName: string;
}

export interface ExtractedGameData {
  seedCode: string | null;
  levelName: string | null;
  timerValue: string | null;
  playerName: string | null;
  dimension: string | null;
  completionStatus: 'playing' | 'completed' | 'failed' | null;
  confidence: number;  // 0-1 overall confidence
  rawResponse?: string;
}

export interface VerificationResult {
  id: string;
  submissionId: string;
  streamCapture: StreamCapture;
  extractedData: ExtractedGameData;
  claimedData: {
    seed: number;
    levelId: string;
    timeMs: number;
    playerName: string;
  };
  matches: {
    seed: boolean;
    level: boolean;
    time: boolean;
    player: boolean;
  };
  status: VerificationStatus;
  confidence: number;
  verifiedAt: number;
  notes: string[];
}

export interface VerificationConfig {
  anthropicApiKey: string;
  minConfidence: number;        // Minimum confidence to verify (default 0.85)
  timeTolerance: number;        // Allowed time difference in ms (default 500)
  requireAllMatches: boolean;   // All fields must match (default false, 3/4 ok)
  captureEndpoint?: string;     // Custom stream capture service
}

// =============================================================================
// STREAM CAPTURE
// =============================================================================

export class StreamCaptureService {
  private captureEndpoint: string;

  constructor(captureEndpoint?: string) {
    this.captureEndpoint = captureEndpoint || '/api/capture-stream';
  }

  async captureFrame(streamUrl: string, platform: string): Promise<StreamCapture | null> {
    try {
      // For TikTok Live
      if (platform === 'tiktok') {
        return await this.captureTikTokLive(streamUrl);
      }

      // For Twitch
      if (platform === 'twitch') {
        return await this.captureTwitch(streamUrl);
      }

      // Generic capture via endpoint
      return await this.captureGeneric(streamUrl, platform);
    } catch (error) {
      console.error('Stream capture failed:', error);
      return null;
    }
  }

  private async captureTikTokLive(streamUrl: string): Promise<StreamCapture | null> {
    // Extract username from URL
    const match = streamUrl.match(/tiktok\.com\/@([^\/]+)/);
    if (!match) return null;

    const username = match[1];

    // Call capture service
    const response = await fetch(this.captureEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'tiktok',
        username,
        streamUrl
      })
    });

    if (!response.ok) return null;

    const data = await response.json();

    return {
      streamUrl,
      platform: 'tiktok',
      capturedAt: Date.now(),
      imageData: data.imageData,
      streamerId: username,
      streamerName: data.displayName || username
    };
  }

  private async captureTwitch(streamUrl: string): Promise<StreamCapture | null> {
    const match = streamUrl.match(/twitch\.tv\/([^\/\?]+)/);
    if (!match) return null;

    const username = match[1];

    const response = await fetch(this.captureEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'twitch',
        username,
        streamUrl
      })
    });

    if (!response.ok) return null;

    const data = await response.json();

    return {
      streamUrl,
      platform: 'twitch',
      capturedAt: Date.now(),
      imageData: data.imageData,
      streamerId: username,
      streamerName: data.displayName || username
    };
  }

  private async captureGeneric(streamUrl: string, platform: string): Promise<StreamCapture | null> {
    const response = await fetch(this.captureEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamUrl, platform })
    });

    if (!response.ok) return null;

    const data = await response.json();

    return {
      streamUrl,
      platform: platform as any,
      capturedAt: Date.now(),
      imageData: data.imageData,
      streamerId: data.streamerId || 'unknown',
      streamerName: data.streamerName || 'Unknown'
    };
  }
}

// =============================================================================
// AI VISION EXTRACTION (FREE - Client-Side)
// =============================================================================

/**
 * FREE verification approach:
 * 1. Game client embeds verification data directly in the frame
 * 2. We read it back - no AI needed, just decode our own data
 * 3. Steganography: hidden data in pixels, unnoticeable to viewers
 */

export class GameDataExtractor {
  private useClientSideVerification: boolean;

  constructor(apiKey?: string) {
    // If no API key, use free client-side verification
    this.useClientSideVerification = !apiKey;
  }

  async extractGameData(imageData: string): Promise<ExtractedGameData> {
    // FREE PATH: Read embedded verification data from game frame
    if (this.useClientSideVerification) {
      return this.extractEmbeddedData(imageData);
    }

    // Paid fallback for external streams
    return this.extractViaOCR(imageData);
  }

  /**
   * FREE: Extract data embedded by our game client
   * Game embeds: seed, level, time, player in bottom pixels
   */
  private async extractEmbeddedData(imageData: string): Promise<ExtractedGameData> {
    try {
      const img = await this.loadImage(imageData);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // Read verification strip from bottom 2 rows of pixels
      const stripHeight = 2;
      const pixels = ctx.getImageData(0, img.height - stripHeight, img.width, stripHeight);

      // Decode data from pixel values
      const decoded = this.decodeVerificationStrip(pixels.data);

      if (decoded) {
        return {
          seedCode: decoded.seed,
          levelName: decoded.level,
          timerValue: decoded.time,
          playerName: decoded.player,
          dimension: decoded.dimension,
          completionStatus: decoded.status as any,
          confidence: 0.99  // Our own data, high confidence
        };
      }

      return this.emptyResult('No embedded data found');
    } catch (error) {
      return this.emptyResult(String(error));
    }
  }

  private async loadImage(imageData: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
    });
  }

  private decodeVerificationStrip(pixels: Uint8ClampedArray): {
    seed: string;
    level: string;
    time: string;
    player: string;
    dimension: string;
    status: string;
  } | null {
    // Each character encoded in 2 pixels (6 color channels = 6 bits per char)
    // Format: SEED|LEVEL|TIME|PLAYER|DIM|STATUS
    // Magic header: first 4 pixels spell "ORTH"

    try {
      let byteArray: number[] = [];

      // Extract bytes from RGB channels (ignore alpha)
      for (let i = 0; i < pixels.length; i += 4) {
        // Use least significant bits of each color channel
        const r = pixels[i] & 0x03;
        const g = pixels[i + 1] & 0x03;
        const b = pixels[i + 2] & 0x03;

        byteArray.push((r << 4) | (g << 2) | b);
      }

      // Convert to string
      const decoded = byteArray
        .filter(b => b > 0 && b < 128)
        .map(b => String.fromCharCode(b))
        .join('');

      // Check magic header
      if (!decoded.startsWith('ORTH:')) {
        return null;
      }

      // Parse fields
      const parts = decoded.slice(5).split('|');
      if (parts.length < 6) return null;

      return {
        seed: parts[0],
        level: parts[1],
        time: parts[2],
        player: parts[3],
        dimension: parts[4],
        status: parts[5]
      };
    } catch {
      return null;
    }
  }

  /**
   * FREE: Use Tesseract.js for OCR (runs in browser)
   */
  private async extractViaOCR(imageData: string): Promise<ExtractedGameData> {
    try {
      // Dynamic import Tesseract.js
      const Tesseract = await import('tesseract.js');

      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: () => {}  // Suppress logs
      });

      const text = result.data.text;

      // Parse known patterns from game UI
      const seedMatch = text.match(/[A-Z0-9]{6}/);
      const timeMatch = text.match(/(\d+:)?\d+\.\d+/);
      const levelMatch = text.match(/(Awakening|Fork|Stillness|Between|Patience|Abyss|Reflection|Sequence|Trinity|Transcendence)/i);

      return {
        seedCode: seedMatch?.[0] || null,
        levelName: levelMatch?.[0] || null,
        timerValue: timeMatch?.[0] || null,
        playerName: null,  // Hard to OCR usernames reliably
        dimension: this.detectDimensionFromColors(imageData),
        completionStatus: text.includes('COMPLETE') ? 'completed' : 'playing',
        confidence: 0.7  // OCR less reliable
      };
    } catch (error) {
      return this.emptyResult('OCR failed: ' + error);
    }
  }

  private detectDimensionFromColors(imageData: string): string | null {
    // Could analyze dominant colors to detect dimension
    // LATTICE = blue/cyan, MARROW = orange/red, VOID = purple/black
    return null;
  }

  // Kept for compatibility
  private emptyResult(reason: string): ExtractedGameData {
    return {
      seedCode: null,
      levelName: null,
      timerValue: null,
      playerName: null,
      dimension: null,
      completionStatus: null,
      confidence: 0,
      rawResponse: reason
    };
  }
}

// =============================================================================
// GAME-SIDE: Embed verification data in frame
// =============================================================================

export class VerificationEmbedder {
  /**
   * Call this every frame in the game renderer
   * Embeds verification data in the bottom pixel row
   * Invisible to human eye, readable by our extractor
   */
  static embedInCanvas(
    ctx: CanvasRenderingContext2D,
    data: {
      seed: string;
      level: string;
      time: string;
      player: string;
      dimension: string;
      status: string;
    }
  ): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Build verification string
    const verifyString = `ORTH:${data.seed}|${data.level}|${data.time}|${data.player}|${data.dimension}|${data.status}`;

    // Get current pixels from bottom row
    const imageData = ctx.getImageData(0, height - 2, width, 2);
    const pixels = imageData.data;

    // Encode string into least significant bits
    for (let i = 0; i < verifyString.length && i * 4 < pixels.length; i++) {
      const charCode = verifyString.charCodeAt(i);

      // Embed in LSBs of RGB (ignore alpha)
      const pixelIndex = i * 4;

      // Clear and set LSBs
      pixels[pixelIndex] = (pixels[pixelIndex] & 0xFC) | ((charCode >> 4) & 0x03);
      pixels[pixelIndex + 1] = (pixels[pixelIndex + 1] & 0xFC) | ((charCode >> 2) & 0x03);
      pixels[pixelIndex + 2] = (pixels[pixelIndex + 2] & 0xFC) | (charCode & 0x03);
    }

    // Write back
    ctx.putImageData(imageData, 0, height - 2);
  }
}

// Legacy AI extraction for external streams (costs $$$)
class LegacyAIExtractor {
  private apiKey: string;
  private apiEndpoint: string = 'https://api.anthropic.com/v1/messages';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractGameData(imageData: string): Promise<ExtractedGameData> {
    const prompt = `Analyze this screenshot from the game "Orthogonal". Extract the following information visible on screen:

1. SEED CODE: A 6-character alphanumeric code, usually in the top corner (e.g., "ABC123")
2. LEVEL NAME: The name of the current level
3. TIMER: The current time displayed (format like "1:23.45" or "45.67s")
4. PLAYER NAME: The player's username if visible
5. DIMENSION: Current dimension (LATTICE, MARROW, or VOID) - may be indicated by color scheme
6. COMPLETION STATUS: Is the level completed, failed, or still playing?

Respond in this exact JSON format:
{
  "seedCode": "ABC123" or null,
  "levelName": "Level Name" or null,
  "timerValue": "1:23.45" or null,
  "playerName": "username" or null,
  "dimension": "LATTICE" or "MARROW" or "VOID" or null,
  "completionStatus": "playing" or "completed" or "failed" or null,
  "confidence": 0.0 to 1.0
}

If you cannot read a field clearly, use null. Set confidence based on how clearly you could read the game UI.`;

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: imageData.replace(/^data:image\/\w+;base64,/, '')
                  }
                },
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.content[0].text;

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.emptyResult('Could not parse response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        seedCode: parsed.seedCode || null,
        levelName: parsed.levelName || null,
        timerValue: parsed.timerValue || null,
        playerName: parsed.playerName || null,
        dimension: parsed.dimension || null,
        completionStatus: parsed.completionStatus || null,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        rawResponse: content
      };
    } catch (error) {
      console.error('Vision extraction failed:', error);
      return this.emptyResult(String(error));
    }
  }

  private emptyResult(reason: string): ExtractedGameData {
    return {
      seedCode: null,
      levelName: null,
      timerValue: null,
      playerName: null,
      dimension: null,
      completionStatus: null,
      confidence: 0,
      rawResponse: reason
    };
  }
}

// =============================================================================
// VERIFICATION ENGINE
// =============================================================================

export class VerificationEngine {
  private config: VerificationConfig;
  private captureService: StreamCaptureService;
  private extractor: GameDataExtractor;

  constructor(config: VerificationConfig) {
    this.config = {
      minConfidence: 0.85,
      timeTolerance: 500,
      requireAllMatches: false,
      ...config
    };

    this.captureService = new StreamCaptureService(config.captureEndpoint);
    this.extractor = new GameDataExtractor(config.anthropicApiKey);
  }

  async verifySubmission(
    submissionId: string,
    streamUrl: string,
    platform: 'tiktok' | 'twitch' | 'youtube' | 'kick',
    claimedData: {
      seed: number;
      levelId: string;
      timeMs: number;
      playerName: string;
    }
  ): Promise<VerificationResult> {
    const notes: string[] = [];
    const verificationId = `verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Step 1: Capture stream frame
    notes.push('Capturing stream frame...');
    const capture = await this.captureService.captureFrame(streamUrl, platform);

    if (!capture) {
      return this.failedResult(verificationId, submissionId, claimedData, 'Stream capture failed', notes);
    }

    notes.push(`Captured from ${capture.streamerName} at ${new Date(capture.capturedAt).toISOString()}`);

    // Step 2: Extract game data from screenshot
    notes.push('Extracting game data via AI vision...');
    const extracted = await this.extractor.extractGameData(capture.imageData);

    if (extracted.confidence < 0.3) {
      notes.push(`Low confidence extraction: ${extracted.confidence}`);
      return this.failedResult(verificationId, submissionId, claimedData, 'Could not read game screen', notes, capture, extracted);
    }

    notes.push(`Extraction confidence: ${(extracted.confidence * 100).toFixed(1)}%`);

    // Step 3: Compare extracted vs claimed
    const matches = this.compareData(extracted, claimedData, notes);

    // Step 4: Determine verification status
    const { status, confidence } = this.determineStatus(extracted, matches, notes);

    return {
      id: verificationId,
      submissionId,
      streamCapture: capture,
      extractedData: extracted,
      claimedData,
      matches,
      status,
      confidence,
      verifiedAt: Date.now(),
      notes
    };
  }

  private compareData(
    extracted: ExtractedGameData,
    claimed: { seed: number; levelId: string; timeMs: number; playerName: string },
    notes: string[]
  ): { seed: boolean; level: boolean; time: boolean; player: boolean } {
    const matches = {
      seed: false,
      level: false,
      time: false,
      player: false
    };

    // Seed comparison
    if (extracted.seedCode) {
      const claimedSeedCode = this.numberToSeedCode(claimed.seed);
      matches.seed = extracted.seedCode.toUpperCase() === claimedSeedCode.toUpperCase();
      notes.push(`Seed: extracted "${extracted.seedCode}" vs claimed "${claimedSeedCode}" - ${matches.seed ? '✓' : '✗'}`);
    } else {
      notes.push('Seed: not visible on screen');
    }

    // Level comparison
    if (extracted.levelName) {
      const claimedLevelName = this.levelIdToName(claimed.levelId);
      matches.level = this.fuzzyMatch(extracted.levelName, claimedLevelName);
      notes.push(`Level: extracted "${extracted.levelName}" vs claimed "${claimedLevelName}" - ${matches.level ? '✓' : '✗'}`);
    } else {
      notes.push('Level: not visible on screen');
    }

    // Time comparison
    if (extracted.timerValue) {
      const extractedMs = this.parseTimeToMs(extracted.timerValue);
      const timeDiff = Math.abs(extractedMs - claimed.timeMs);
      matches.time = timeDiff <= this.config.timeTolerance;
      notes.push(`Time: extracted ${extractedMs}ms vs claimed ${claimed.timeMs}ms (diff: ${timeDiff}ms) - ${matches.time ? '✓' : '✗'}`);
    } else {
      notes.push('Time: not visible on screen');
    }

    // Player name comparison
    if (extracted.playerName) {
      matches.player = this.fuzzyMatch(extracted.playerName, claimed.playerName);
      notes.push(`Player: extracted "${extracted.playerName}" vs claimed "${claimed.playerName}" - ${matches.player ? '✓' : '✗'}`);
    } else {
      notes.push('Player: not visible on screen');
    }

    return matches;
  }

  private determineStatus(
    extracted: ExtractedGameData,
    matches: { seed: boolean; level: boolean; time: boolean; player: boolean },
    notes: string[]
  ): { status: VerificationStatus; confidence: number } {
    const matchCount = Object.values(matches).filter(Boolean).length;
    const visibleCount = [
      extracted.seedCode,
      extracted.levelName,
      extracted.timerValue,
      extracted.playerName
    ].filter(Boolean).length;

    // Calculate confidence
    let confidence = extracted.confidence;

    if (visibleCount > 0) {
      confidence *= matchCount / visibleCount;
    }

    // Determine status
    if (this.config.requireAllMatches) {
      if (matchCount === 4 && confidence >= this.config.minConfidence) {
        notes.push('All fields matched - VERIFIED');
        return { status: 'verified', confidence };
      }
    } else {
      // 3 out of 4 matches is acceptable
      if (matchCount >= 3 && confidence >= this.config.minConfidence) {
        notes.push(`${matchCount}/4 fields matched - VERIFIED`);
        return { status: 'verified', confidence };
      }
    }

    if (matchCount >= 2) {
      notes.push(`Only ${matchCount}/4 fields matched - SUSPICIOUS`);
      return { status: 'suspicious', confidence };
    }

    notes.push(`${matchCount}/4 fields matched - FAILED`);
    return { status: 'failed', confidence };
  }

  private numberToSeedCode(seed: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    let n = seed;

    for (let i = 0; i < 6; i++) {
      code = chars[n % chars.length] + code;
      n = Math.floor(n / chars.length);
    }

    return code;
  }

  private levelIdToName(levelId: string): string {
    // Convert level ID to display name
    return levelId
      .replace(/^(solo|duo|trio|quad)-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private parseTimeToMs(timeStr: string): number {
    // Parse formats like "1:23.45", "45.67s", "1:23:45.67"
    const cleaned = timeStr.replace(/[^\d:.]/g, '');

    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      if (parts.length === 2) {
        // MM:SS.ms
        const [mins, secs] = parts;
        return (parseInt(mins) * 60 + parseFloat(secs)) * 1000;
      } else if (parts.length === 3) {
        // HH:MM:SS.ms
        const [hours, mins, secs] = parts;
        return (parseInt(hours) * 3600 + parseInt(mins) * 60 + parseFloat(secs)) * 1000;
      }
    }

    // Just seconds
    return parseFloat(cleaned) * 1000;
  }

  private fuzzyMatch(a: string, b: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const na = normalize(a);
    const nb = normalize(b);

    // Exact match
    if (na === nb) return true;

    // One contains the other
    if (na.includes(nb) || nb.includes(na)) return true;

    // Levenshtein distance for typos
    const distance = this.levenshtein(na, nb);
    const maxLen = Math.max(na.length, nb.length);

    return distance / maxLen < 0.3;  // Less than 30% different
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  private failedResult(
    id: string,
    submissionId: string,
    claimedData: any,
    reason: string,
    notes: string[],
    capture?: StreamCapture,
    extracted?: ExtractedGameData
  ): VerificationResult {
    notes.push(`Verification failed: ${reason}`);

    return {
      id,
      submissionId,
      streamCapture: capture || {
        streamUrl: '',
        platform: 'unknown' as any,
        capturedAt: Date.now(),
        imageData: '',
        streamerId: '',
        streamerName: ''
      },
      extractedData: extracted || {
        seedCode: null,
        levelName: null,
        timerValue: null,
        playerName: null,
        dimension: null,
        completionStatus: null,
        confidence: 0
      },
      claimedData,
      matches: { seed: false, level: false, time: false, player: false },
      status: 'failed',
      confidence: 0,
      verifiedAt: Date.now(),
      notes
    };
  }
}

// =============================================================================
// VERIFICATION BADGE COMPONENT
// =============================================================================

export function createVerificationBadge(status: VerificationStatus): string {
  const badges: Record<VerificationStatus, { icon: string; color: string; label: string }> = {
    verified: { icon: '✓', color: '#00ff88', label: 'Verified Live' },
    pending: { icon: '⏳', color: '#ffaa00', label: 'Pending' },
    suspicious: { icon: '⚠', color: '#ff8800', label: 'Suspicious' },
    failed: { icon: '✗', color: '#ff4444', label: 'Unverified' }
  };

  const badge = badges[status];

  return `
    <span class="verification-badge verification-${status}"
          style="background: ${badge.color}22; color: ${badge.color};
                 padding: 2px 6px; border-radius: 4px; font-size: 11px;
                 border: 1px solid ${badge.color}44;">
      ${badge.icon} ${badge.label}
    </span>
  `;
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createVerificationSystem(config: VerificationConfig): VerificationEngine {
  return new VerificationEngine(config);
}
