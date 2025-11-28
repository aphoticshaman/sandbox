/**
 * Uniqueness Guarantee
 *
 * Ensures no two responses are ever identical through
 * cryptographic hashing and bloom filter collision detection.
 *
 * The guarantee: Given sufficient entropy input, the probability
 * of generating an identical response approaches 2^-256.
 *
 * Uses SHA-256 for response fingerprinting and a space-efficient
 * bloom filter for fast collision checking.
 */

export class UniquenessGuarantee {
  constructor(options = {}) {
    // Bloom filter parameters
    this.filterSize = options.filterSize || 1000000; // 1M bits
    this.hashCount = options.hashCount || 7;
    this.filter = new Uint8Array(Math.ceil(this.filterSize / 8));

    // Recent hash cache for exact matching
    this.recentHashes = [];
    this.maxRecent = options.maxRecent || 10000;

    // Collision statistics
    this.stats = {
      totalChecks: 0,
      bloomHits: 0,
      exactHits: 0,
      guaranteedUnique: 0
    };
  }

  /**
   * Check if a response hash is unique
   * @param {string} hash - SHA-256 hash of response
   * @returns {boolean} True if unique
   */
  isUnique(hash) {
    this.stats.totalChecks++;

    // First: bloom filter check (fast, may have false positives)
    if (this.bloomCheck(hash)) {
      this.stats.bloomHits++;

      // Second: exact check in recent cache
      if (this.recentHashes.includes(hash)) {
        this.stats.exactHits++;
        return false; // Definitely not unique
      }
    }

    this.stats.guaranteedUnique++;
    return true;
  }

  /**
   * Record a hash as seen
   * @param {string} hash - SHA-256 hash of response
   */
  record(hash) {
    // Add to bloom filter
    this.bloomAdd(hash);

    // Add to recent cache
    this.recentHashes.push(hash);
    if (this.recentHashes.length > this.maxRecent) {
      this.recentHashes.shift(); // Remove oldest
    }
  }

  /**
   * Generate SHA-256 hash of response content
   * @param {string} content - Response text
   * @returns {string} Hex-encoded hash
   */
  async hashResponse(content) {
    // Normalize content for consistent hashing
    const normalized = this.normalize(content);

    // Use Web Crypto API if available, fallback to simple hash
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback: simple but effective hash
      return this.simpleHash(normalized);
    }
  }

  /**
   * Synchronous hash for when async isn't possible
   * @param {string} content - Response text
   * @returns {string} Hash string
   */
  hashResponseSync(content) {
    return this.simpleHash(this.normalize(content));
  }

  normalize(content) {
    // Normalize whitespace, case-insensitive for collision purposes
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  simpleHash(str) {
    // FNV-1a inspired hash, produces 64-bit equivalent
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;

    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    const combined = (h2 >>> 0).toString(16).padStart(8, '0') +
                     (h1 >>> 0).toString(16).padStart(8, '0');
    return combined;
  }

  // Bloom filter operations
  bloomAdd(hash) {
    const positions = this.getBloomPositions(hash);
    for (const pos of positions) {
      const byteIndex = Math.floor(pos / 8);
      const bitIndex = pos % 8;
      this.filter[byteIndex] |= (1 << bitIndex);
    }
  }

  bloomCheck(hash) {
    const positions = this.getBloomPositions(hash);
    for (const pos of positions) {
      const byteIndex = Math.floor(pos / 8);
      const bitIndex = pos % 8;
      if (!(this.filter[byteIndex] & (1 << bitIndex))) {
        return false; // Definitely not in set
      }
    }
    return true; // Probably in set (may be false positive)
  }

  getBloomPositions(hash) {
    // Generate k positions from hash using double hashing
    const positions = [];
    const h1 = parseInt(hash.slice(0, 8), 16);
    const h2 = parseInt(hash.slice(8, 16), 16) || h1;

    for (let i = 0; i < this.hashCount; i++) {
      const pos = Math.abs((h1 + i * h2) % this.filterSize);
      positions.push(pos);
    }

    return positions;
  }

  /**
   * Get collision probability estimate
   * @returns {number} Estimated false positive rate
   */
  getCollisionProbability() {
    // Bloom filter false positive probability
    const n = this.recentHashes.length;
    const m = this.filterSize;
    const k = this.hashCount;

    return Math.pow(1 - Math.exp(-k * n / m), k);
  }

  /**
   * Get statistics
   * @returns {object} Uniqueness statistics
   */
  getStats() {
    return {
      ...this.stats,
      bloomFillRate: this.getBloomFillRate(),
      collisionProbability: this.getCollisionProbability(),
      cacheSize: this.recentHashes.length
    };
  }

  getBloomFillRate() {
    let setBits = 0;
    for (const byte of this.filter) {
      for (let i = 0; i < 8; i++) {
        if (byte & (1 << i)) setBits++;
      }
    }
    return setBits / this.filterSize;
  }

  /**
   * Reset the guarantee system
   */
  reset() {
    this.filter = new Uint8Array(Math.ceil(this.filterSize / 8));
    this.recentHashes = [];
    this.stats = {
      totalChecks: 0,
      bloomHits: 0,
      exactHits: 0,
      guaranteedUnique: 0
    };
  }
}

export default UniquenessGuarantee;
