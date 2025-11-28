/**
 * Particle Effects Service
 *
 * Manages two types of particle effects:
 * 1. CELEBRATION - Intense, short-lived bursts triggered by achievements
 * 2. AMBIENT - Purchasable background effects from the shop
 *
 * Default: NO ambient particles. Users must purchase and equip them.
 * Celebrations are always available and free.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CELEBRATION EFFECTS - Free, triggered by achievements
// ═══════════════════════════════════════════════════════════════════════════════

export const CELEBRATION_EFFECTS = {
  // After completing a reading
  reading_complete: {
    id: 'reading_complete',
    name: 'Mystical Revelation',
    particles: ['✨', '🔮', '⭐', '💫'],
    count: 40,
    duration: 3000, // 3 seconds
    intensity: 'high',
    pattern: 'burst', // explodes from center
    colors: ['#ffa726', '#e1bee7', '#00FFFF'],
  },

  // After writing a journal entry
  journal_entry: {
    id: 'journal_entry',
    name: 'Reflection Complete',
    particles: ['📝', '✨', '🌙', '💭'],
    count: 30,
    duration: 2500,
    intensity: 'medium',
    pattern: 'rain', // falls from top
    colors: ['#e1bee7', '#f8bbd0', '#b8860b'],
  },

  // After completing a quest
  quest_complete: {
    id: 'quest_complete',
    name: 'Quest Victory',
    particles: ['🏆', '⚔️', '✨', '🎖️', '💎'],
    count: 50,
    duration: 4000,
    intensity: 'very_high',
    pattern: 'explosion', // dramatic outward burst
    colors: ['#FFD700', '#ffa726', '#00FFFF'],
  },

  // After subscribing
  subscription: {
    id: 'subscription',
    name: 'Welcome to Premium',
    particles: ['👑', '💎', '✨', '🌟', '💫'],
    count: 60,
    duration: 5000,
    intensity: 'very_high',
    pattern: 'fireworks',
    colors: ['#FFD700', '#9370DB', '#00FFFF', '#ffa726'],
  },

  // After buying something in the shop
  purchase: {
    id: 'purchase',
    name: 'New Treasure',
    particles: ['💎', '✨', '🎁', '⭐'],
    count: 35,
    duration: 2500,
    intensity: 'high',
    pattern: 'shower', // cascades down
    colors: ['#00FFFF', '#ffa726', '#e1bee7'],
  },

  // After getting an achievement
  achievement: {
    id: 'achievement',
    name: 'Achievement Unlocked',
    particles: ['🏅', '⭐', '✨', '🎉', '💫'],
    count: 45,
    duration: 3500,
    intensity: 'very_high',
    pattern: 'burst',
    colors: ['#FFD700', '#ffa726', '#9370DB'],
  },

  // After leveling up
  level_up: {
    id: 'level_up',
    name: 'Level Up!',
    particles: ['⬆️', '✨', '🌟', '💫', '🔥'],
    count: 55,
    duration: 4000,
    intensity: 'very_high',
    pattern: 'spiral', // spirals upward
    colors: ['#ffa726', '#00FFFF', '#FFD700'],
  },

  // After completing a streak milestone
  streak_milestone: {
    id: 'streak_milestone',
    name: 'Streak Fire!',
    particles: ['🔥', '✨', '💪', '⭐'],
    count: 40,
    duration: 3000,
    intensity: 'high',
    pattern: 'burst',
    colors: ['#FF4500', '#ffa726', '#FFD700'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT PARTICLE PACKS - Purchasable in shop
// ═══════════════════════════════════════════════════════════════════════════════

export const AMBIENT_PARTICLE_PACKS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // SEASONAL (Rotate in shop based on date)
  // ═══════════════════════════════════════════════════════════════════════════

  fall_leaves: {
    id: 'fall_leaves',
    name: 'Autumn Drift',
    description: 'Golden and crimson leaves drift gently through the veil',
    particles: ['🍂', '🍁', '🍃'],
    category: 'seasonal',
    season: 'november',
    rarity: 'rare',
    price: 400,
    count: 12, // sparse for ambient
    speed: 'slow',
    opacity: 0.6,
    pattern: 'drift', // slow side-to-side descent
    available: { month: 11 }, // November
  },

  winter_snow: {
    id: 'winter_snow',
    name: 'Winter Veil',
    description: 'Soft snowflakes blanket your readings in quiet magic',
    particles: ['❄️', '✨', '🌨️'],
    category: 'seasonal',
    season: 'december',
    rarity: 'rare',
    price: 400,
    count: 15,
    speed: 'slow',
    opacity: 0.5,
    pattern: 'snow', // gentle float with slight drift
    available: { month: 12 }, // December
  },

  valentines_hearts: {
    id: 'valentines_hearts',
    name: 'Cupid\'s Blessing',
    description: 'Hearts flutter and arrows of fate streak across the screen',
    particles: ['💕', '💖', '💘', '💗'],
    category: 'seasonal',
    season: 'february',
    rarity: 'epic',
    price: 600,
    count: 10,
    speed: 'medium',
    opacity: 0.7,
    pattern: 'flutter', // hearts float up, occasional arrow streaks
    specialEffects: ['cupid_arrow'], // horizontal streak every 5-10 seconds
    available: { month: 2 }, // February
  },

  lucky_clovers: {
    id: 'lucky_clovers',
    name: 'Fortune\'s Favor',
    description: 'Four-leaf clovers bring luck to your readings',
    particles: ['🍀', '☘️', '✨'],
    category: 'seasonal',
    season: 'march',
    rarity: 'rare',
    price: 400,
    count: 8,
    speed: 'slow',
    opacity: 0.6,
    pattern: 'drift',
    available: { month: 3 }, // March
  },

  spring_bloom: {
    id: 'spring_bloom',
    name: 'April Showers',
    description: 'Gentle rain gives way to blooming flowers',
    particles: ['🌸', '🌷', '🌺', '💐', '🌧️'],
    category: 'seasonal',
    season: 'april',
    rarity: 'epic',
    price: 600,
    count: 12,
    speed: 'medium',
    opacity: 0.55,
    pattern: 'rain_to_bloom', // rain transitions to flower petals
    available: { month: 4 }, // April
  },

  summer_fireflies: {
    id: 'summer_fireflies',
    name: 'Midsummer Night',
    description: 'Fireflies dance in the warm summer darkness',
    particles: ['✨', '💫', '⭐'],
    category: 'seasonal',
    season: 'june',
    rarity: 'epic',
    price: 600,
    count: 20,
    speed: 'slow',
    opacity: 0.4,
    pattern: 'firefly', // random glow on/off, meandering paths
    colors: ['#FFD700', '#FFFF00', '#98FB98'],
    available: { month: 6 }, // June
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STANDARD (Always available in shop)
  // ═══════════════════════════════════════════════════════════════════════════

  cosmic_dust: {
    id: 'cosmic_dust',
    name: 'Cosmic Dust',
    description: 'Shimmering stardust floats through the cosmic void',
    particles: ['✨', '💫', '⭐'],
    category: 'standard',
    rarity: 'common',
    price: 200,
    count: 10,
    speed: 'very_slow',
    opacity: 0.4,
    pattern: 'float',
    colors: ['#e1bee7', '#f8bbd0', '#00FFFF'],
  },

  mystic_smoke: {
    id: 'mystic_smoke',
    name: 'Mystic Smoke',
    description: 'Ethereal wisps curl through the darkness',
    particles: ['🌫️', '💨'],
    category: 'standard',
    rarity: 'common',
    price: 200,
    count: 6,
    speed: 'very_slow',
    opacity: 0.3,
    pattern: 'curl', // slow swirling ascent
  },

  crystal_rain: {
    id: 'crystal_rain',
    name: 'Crystal Rain',
    description: 'Crystalline droplets shimmer as they fall',
    particles: ['💎', '💠', '✧'],
    category: 'standard',
    rarity: 'rare',
    price: 350,
    count: 8,
    speed: 'slow',
    opacity: 0.5,
    pattern: 'rain',
    colors: ['#00FFFF', '#87CEEB', '#E0FFFF'],
  },

  sacred_geometry: {
    id: 'sacred_geometry',
    name: 'Sacred Geometry',
    description: 'Ancient symbols of power drift through the veil',
    particles: ['✡️', '☯️', '🔯', '⚛️', '✴️'],
    category: 'standard',
    rarity: 'epic',
    price: 750,
    count: 5,
    speed: 'very_slow',
    opacity: 0.4,
    pattern: 'orbit', // slow circular rotation
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGENDARY (Rare rotation, high price)
  // ═══════════════════════════════════════════════════════════════════════════

  phoenix_embers: {
    id: 'phoenix_embers',
    name: 'Phoenix Embers',
    description: 'Burning embers rise from the ashes of transformation',
    particles: ['🔥', '✨', '💫'],
    category: 'legendary',
    rarity: 'legendary',
    price: 1500,
    count: 15,
    speed: 'slow',
    opacity: 0.6,
    pattern: 'rise', // floats upward
    colors: ['#FF4500', '#FF6347', '#FFD700'],
    rotationCycle: 'rare', // Only appears occasionally in shop
  },

  void_rift: {
    id: 'void_rift',
    name: 'Void Rift',
    description: 'Reality tears open to reveal the darkness beyond',
    particles: ['🌀', '✨', '💀'],
    category: 'legendary',
    rarity: 'legendary',
    price: 2000,
    count: 8,
    speed: 'medium',
    opacity: 0.7,
    pattern: 'vortex', // spirals toward center
    colors: ['#4B0082', '#8B008B', '#000000'],
    rotationCycle: 'ultra_rare',
  },

  aurora_borealis: {
    id: 'aurora_borealis',
    name: 'Aurora Borealis',
    description: 'Northern lights dance across your screen',
    particles: ['✨', '💫'],
    category: 'legendary',
    rarity: 'legendary',
    price: 2500,
    count: 25,
    speed: 'slow',
    opacity: 0.35,
    pattern: 'wave', // horizontal waves of color
    colors: ['#00FF7F', '#00FFFF', '#9370DB', '#FF69B4'],
    rotationCycle: 'rare',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHOP ROTATION LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get currently available particles in the shop
 * Seasonal items only appear during their month
 * Legendary items rotate on a cycle
 */
export function getAvailableParticles() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

  const available = [];

  Object.values(AMBIENT_PARTICLE_PACKS).forEach(pack => {
    // Standard packs always available
    if (pack.category === 'standard') {
      available.push(pack);
      return;
    }

    // Seasonal packs only during their month
    if (pack.category === 'seasonal' && pack.available?.month === currentMonth) {
      available.push(pack);
      return;
    }

    // Legendary packs rotate
    if (pack.category === 'legendary') {
      if (pack.rotationCycle === 'rare') {
        // Available every 3rd week
        if (Math.floor(dayOfYear / 7) % 3 === 0) {
          available.push(pack);
        }
      } else if (pack.rotationCycle === 'ultra_rare') {
        // Available first week of every other month
        const weekOfMonth = Math.floor((now.getDate() - 1) / 7);
        if (currentMonth % 2 === 0 && weekOfMonth === 0) {
          available.push(pack);
        }
      }
    }
  });

  return available;
}

/**
 * Get the current seasonal pack (for featured placement)
 */
export function getCurrentSeasonalPack() {
  const currentMonth = new Date().getMonth() + 1;

  return Object.values(AMBIENT_PARTICLE_PACKS).find(
    pack => pack.category === 'seasonal' && pack.available?.month === currentMonth
  ) || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLE RENDERING CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export const INTENSITY_CONFIG = {
  low: { particleMultiplier: 0.5, speed: 0.5, opacity: 0.4 },
  medium: { particleMultiplier: 1.0, speed: 1.0, opacity: 0.6 },
  high: { particleMultiplier: 1.5, speed: 1.5, opacity: 0.8 },
  very_high: { particleMultiplier: 2.0, speed: 2.0, opacity: 1.0 },
};

export const PATTERN_CONFIG = {
  burst: { startX: 'center', startY: 'center', directionRange: 360, gravity: 0.02 },
  explosion: { startX: 'center', startY: 'center', directionRange: 360, gravity: 0.01, force: 2.0 },
  rain: { startX: 'random', startY: 'top', direction: 180, gravity: 0.05 },
  shower: { startX: 'random', startY: 'top', direction: 180, gravity: 0.08, spread: 30 },
  snow: { startX: 'random', startY: 'top', direction: 180, gravity: 0.02, wobble: true },
  drift: { startX: 'random', startY: 'top', direction: 180, gravity: 0.015, sway: true },
  float: { startX: 'random', startY: 'random', direction: 'random', gravity: -0.005 },
  rise: { startX: 'random', startY: 'bottom', direction: 0, gravity: -0.02 },
  spiral: { startX: 'center', startY: 'bottom', direction: 0, gravity: -0.03, rotate: true },
  fireworks: { startX: 'random', startY: 'bottom', direction: 0, gravity: 0.03, explode: true },
  curl: { startX: 'random', startY: 'bottom', direction: 0, gravity: -0.01, curl: true },
  flutter: { startX: 'random', startY: 'random', direction: 0, gravity: -0.01, flutter: true },
  orbit: { startX: 'center', startY: 'center', orbit: true, orbitRadius: 150 },
  vortex: { startX: 'edge', startY: 'random', spiral: true, toCenter: true },
  wave: { startX: 'left', startY: 'center', wave: true, amplitude: 50 },
  firefly: { startX: 'random', startY: 'random', wander: true, glow: true },
  rain_to_bloom: { phase1: 'rain', phase2: 'float', transitionAt: 0.5 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class ParticleEffectsServiceClass {
  constructor() {
    this.activeEffects = new Set();
    this.listeners = new Set();
  }

  /**
   * Subscribe to particle events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of a particle event
   */
  notify(event) {
    this.listeners.forEach(callback => callback(event));
  }

  /**
   * Trigger a celebration effect
   * @param {string} type - One of CELEBRATION_EFFECTS keys
   */
  triggerCelebration(type) {
    const effect = CELEBRATION_EFFECTS[type];
    if (!effect) {
      console.warn(`[ParticleEffects] Unknown celebration type: ${type}`);
      return;
    }

    const effectId = `${type}_${Date.now()}`;
    this.activeEffects.add(effectId);

    this.notify({
      type: 'celebration',
      effect,
      effectId,
    });

    // Auto-cleanup after duration
    setTimeout(() => {
      this.activeEffects.delete(effectId);
      this.notify({
        type: 'celebration_end',
        effectId,
      });
    }, effect.duration);

    return effectId;
  }

  /**
   * Start ambient particles
   * @param {string} packId - One of AMBIENT_PARTICLE_PACKS keys
   */
  startAmbient(packId) {
    const pack = AMBIENT_PARTICLE_PACKS[packId];
    if (!pack) {
      console.warn(`[ParticleEffects] Unknown particle pack: ${packId}`);
      return;
    }

    this.notify({
      type: 'ambient_start',
      pack,
    });
  }

  /**
   * Stop ambient particles
   */
  stopAmbient() {
    this.notify({
      type: 'ambient_stop',
    });
  }

  /**
   * Check if a particle pack is owned by user
   * (Delegate to cosmetics store)
   */
  isPackOwned(packId, ownedPacks) {
    return ownedPacks?.includes(packId) || false;
  }

  /**
   * Get the user's equipped ambient particle pack
   * (Delegate to cosmetics store)
   */
  getEquippedPack(equipped) {
    return AMBIENT_PARTICLE_PACKS[equipped] || null;
  }
}

export const ParticleEffectsService = new ParticleEffectsServiceClass();
export default ParticleEffectsService;
