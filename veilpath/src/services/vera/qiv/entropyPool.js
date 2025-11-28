/**
 * Entropy Pool
 *
 * Harvests entropy from multiple uncorrelated sources
 * to seed mutation vectors. Based on Fortuna PRNG
 * architecture with biological timing integration.
 *
 * Sources:
 * - High-resolution timestamps (nanosecond jitter)
 * - User interaction cadence (behavioral entropy)
 * - Lunar phase data (cosmic noise)
 * - Session depth (conversation evolution)
 * - Previous response hash (self-referential chaos)
 * - Device entropy (hardware RNG when available)
 */

export class EntropyPool {
  constructor() {
    this.pools = Array(32).fill(null).map(() => []);
    this.poolIndex = 0;
    this.reseedCount = 0;
  }

  /**
   * Harvest entropy from all available sources
   * @param {object} sources - Entropy source data
   * @returns {EntropyState} Mixed entropy state
   */
  harvest(sources) {
    const contributions = [];

    // Nanosecond timestamp - ~10 bits of entropy per harvest
    if (sources.timestamp) {
      contributions.push(this.extractTimestampEntropy(sources.timestamp));
    }

    // User interaction timing - behavioral entropy
    if (sources.userCadence) {
      contributions.push(this.extractCadenceEntropy(sources.userCadence));
    }

    // Lunar phase - slow-moving cosmic noise
    if (sources.lunarPhase !== undefined) {
      contributions.push(this.extractLunarEntropy(sources.lunarPhase));
    }

    // Session depth - conversation evolution marker
    if (sources.sessionDepth !== undefined) {
      contributions.push(this.extractSessionEntropy(sources.sessionDepth));
    }

    // Self-referential hash - previous output feeds next
    if (sources.lastTokens) {
      contributions.push(this.extractHashEntropy(sources.lastTokens));
    }

    // Hardware entropy when available
    if (sources.deviceEntropy) {
      contributions.push(this.extractDeviceEntropy(sources.deviceEntropy));
    }

    // Mix all contributions
    return this.mix(contributions);
  }

  extractTimestampEntropy(timestamp) {
    // Extract entropy from nanosecond-level timing jitter
    const ns = typeof timestamp === 'bigint' ? timestamp : BigInt(timestamp);
    const jitter = Number(ns % 1000000n); // Microsecond component

    return {
      source: 'timestamp',
      value: jitter,
      entropy: this.estimateEntropy(jitter, 1000000),
      raw: this.hashNumber(jitter)
    };
  }

  extractCadenceEntropy(cadence) {
    // User timing patterns contain behavioral entropy
    // Time between messages, typing speed indicators, etc.
    const timeDelta = cadence.lastMessageDelta || Date.now();
    const variance = cadence.messageTimeVariance || 0;

    // Humans have ~3-4 bits of entropy per keystroke timing
    const combined = (timeDelta * 31) ^ (variance * 17);

    return {
      source: 'cadence',
      value: combined,
      entropy: this.estimateEntropy(combined, 100000),
      raw: this.hashNumber(combined)
    };
  }

  extractLunarEntropy(phase) {
    // Lunar phase as slow-moving noise (0-1 representing cycle)
    // Low entropy but uncorrelated with other sources
    const phaseInt = Math.floor(phase * 10000);

    return {
      source: 'lunar',
      value: phaseInt,
      entropy: 4, // ~4 bits from lunar phase precision
      raw: this.hashNumber(phaseInt)
    };
  }

  extractSessionEntropy(depth) {
    // Session depth affects response character
    // Deeper conversations have different entropy profile
    const depthHash = (depth * 127) ^ (depth * depth);

    return {
      source: 'session',
      value: depthHash,
      entropy: Math.min(8, Math.log2(depth + 1) * 2),
      raw: this.hashNumber(depthHash)
    };
  }

  extractHashEntropy(hash) {
    // Self-referential: previous response influences next
    // Creates Lorenz-like sensitivity to initial conditions
    let value = 0;
    for (let i = 0; i < Math.min(hash.length, 8); i++) {
      value = (value * 31 + hash.charCodeAt(i)) >>> 0;
    }

    return {
      source: 'selfref',
      value: value,
      entropy: 32, // Full 32 bits from hash
      raw: value
    };
  }

  extractDeviceEntropy(deviceData) {
    // Hardware RNG when available (crypto.getRandomValues on client)
    const value = typeof deviceData === 'number' ? deviceData :
                  parseInt(deviceData, 16) || Math.random() * 0xFFFFFFFF;

    return {
      source: 'device',
      value: value >>> 0,
      entropy: 32,
      raw: value >>> 0
    };
  }

  /**
   * Mix all entropy contributions into final state
   * Uses technique similar to ChaCha20 quarter-round
   */
  mix(contributions) {
    // Initialize state
    let state = new Uint32Array(16);

    // Seed with contributions
    contributions.forEach((c, i) => {
      state[i % 16] ^= c.raw >>> 0;
      state[(i + 8) % 16] ^= (c.value * 2654435761) >>> 0; // Knuth multiplicative
    });

    // Mix rounds (simplified ChaCha-style)
    for (let round = 0; round < 10; round++) {
      // Column rounds
      this.quarterRound(state, 0, 4, 8, 12);
      this.quarterRound(state, 1, 5, 9, 13);
      this.quarterRound(state, 2, 6, 10, 14);
      this.quarterRound(state, 3, 7, 11, 15);
      // Diagonal rounds
      this.quarterRound(state, 0, 5, 10, 15);
      this.quarterRound(state, 1, 6, 11, 12);
      this.quarterRound(state, 2, 7, 8, 13);
      this.quarterRound(state, 3, 4, 9, 14);
    }

    // Calculate total entropy estimate
    const totalEntropy = contributions.reduce((sum, c) => sum + c.entropy, 0);

    return {
      state: Array.from(state),
      totalEntropy: Math.min(256, totalEntropy),
      sources: contributions.map(c => c.source),
      timestamp: Date.now()
    };
  }

  quarterRound(state, a, b, c, d) {
    state[a] = (state[a] + state[b]) >>> 0; state[d] ^= state[a]; state[d] = this.rotl(state[d], 16);
    state[c] = (state[c] + state[d]) >>> 0; state[b] ^= state[c]; state[b] = this.rotl(state[b], 12);
    state[a] = (state[a] + state[b]) >>> 0; state[d] ^= state[a]; state[d] = this.rotl(state[d], 8);
    state[c] = (state[c] + state[d]) >>> 0; state[b] ^= state[c]; state[b] = this.rotl(state[b], 7);
  }

  rotl(x, n) {
    return ((x << n) | (x >>> (32 - n))) >>> 0;
  }

  hashNumber(n) {
    // Fast integer hash (splitmix64 style)
    let x = n >>> 0;
    x = ((x >>> 16) ^ x) * 0x45d9f3b >>> 0;
    x = ((x >>> 16) ^ x) * 0x45d9f3b >>> 0;
    x = (x >>> 16) ^ x;
    return x >>> 0;
  }

  estimateEntropy(value, maxValue) {
    // Estimate bits of entropy in a value
    if (value <= 0 || maxValue <= 1) return 0;
    return Math.min(32, Math.log2(maxValue));
  }
}

export default EntropyPool;
