#!/usr/bin/env node

/**
 * Test Data Generator
 *
 * Generates realistic test data for animations and components
 *
 * Usage:
 *   node scripts/generate-test-data.js particles 100
 *   node scripts/generate-test-data.js cards 20
 *   node scripts/generate-test-data.js hotspots 5
 *   node scripts/generate-test-data.js animations 10
 *   node scripts/generate-test-data.js --output test-data.json particles 50
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const outputFlag = args.indexOf('--output');
const outputFile = outputFlag !== -1 ? args[outputFlag + 1] : null;
const dataType = outputFlag !== -1 ? args[outputFlag + 2] : args[0];
const count = parseInt(outputFlag !== -1 ? args[outputFlag + 3] : args[1] || '10');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = '') {
  console.log(color + message + COLORS.reset);
}

// Screen dimensions (can be parameterized)
const SCREEN_WIDTH = 375;
const SCREEN_HEIGHT = 812;

// Generators
const GENERATORS = {
  particles: (count) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `particle_${i}`,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: 2 + Math.random() * 5,
      color: randomColor(),
      duration: 10000 + Math.random() * 15000,
      delay: i * 50,
      opacity: 0.3 + Math.random() * 0.7,
      velocityX: (Math.random() - 0.5) * 2,
      velocityY: -1 - Math.random() * 2, // Mostly upward
    }));
  },

  cards: (count) => {
    const arcana = [
      'The Fool', 'The Magician', 'The High Priestess', 'The Empress',
      'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot',
      'Strength', 'The Hermit', 'Wheel of Fortune', 'Justice',
      'The Hanged Man', 'Death', 'Temperance', 'The Devil',
      'The Tower', 'The Star', 'The Moon', 'The Sun',
      'Judgement', 'The World',
    ];

    const suits = ['Cups', 'Pentacles', 'Swords', 'Wands'];
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

    return Array.from({ length: count }).map((_, i) => {
      const isMajor = i < 22;
      const name = isMajor
        ? arcana[i % arcana.length]
        : `${Math.ceil((i - 21) % 14) || 1} of ${suits[(i - 21) % 4]}`;

      return {
        id: `card_${i}`,
        name,
        arcana: isMajor ? 'Major' : 'Minor',
        suit: isMajor ? null : suits[(i - 21) % 4],
        number: isMajor ? i : ((i - 21) % 14) || 1,
        rarity: rarities[Math.floor(Math.random() * rarities.length)],
        isReversed: Math.random() > 0.5,
        position: {
          x: (i % 5) * (SCREEN_WIDTH / 5),
          y: Math.floor(i / 5) * 150,
        },
        rotation: (Math.random() - 0.5) * 30,
        scale: 0.8 + Math.random() * 0.4,
      };
    });
  },

  hotspots: (count) => {
    const types = ['moon', 'star', 'crystal', 'pentagram', 'eye'];
    const effects = ['glow', 'pulse', 'shimmer', 'sparkle'];

    return Array.from({ length: count }).map((_, i) => ({
      id: `hotspot_${i}`,
      type: types[i % types.length],
      x: 0.1 + (Math.random() * 0.8) * SCREEN_WIDTH,
      y: 0.1 + (Math.random() * 0.8) * SCREEN_HEIGHT,
      size: 40 + Math.random() * 40,
      effect: effects[Math.floor(Math.random() * effects.length)],
      intensity: 0.5 + Math.random() * 0.5,
      pulseDuration: 2000 + Math.random() * 3000,
      hitRadius: 60 + Math.random() * 40,
      active: false,
    }));
  },

  lightbeams: (count) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `beam_${i}`,
      x: (i / count) * SCREEN_WIDTH,
      width: 60 + Math.random() * 80,
      opacity: 0.1 + Math.random() * 0.3,
      color: randomColor({ alpha: true }),
      duration: 3000 + Math.random() * 5000,
      delay: i * 200,
      angle: -10 + Math.random() * 20,
    }));
  },

  animations: (count) => {
    const types = ['fade', 'slide', 'scale', 'rotate', 'bounce'];
    const easings = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'spring'];

    return Array.from({ length: count }).map((_, i) => ({
      id: `animation_${i}`,
      type: types[i % types.length],
      easing: easings[Math.floor(Math.random() * easings.length)],
      duration: 300 + Math.random() * 2000,
      delay: i * 100,
      from: randomAnimationValue(types[i % types.length]),
      to: randomAnimationValue(types[i % types.length]),
      repeat: Math.random() > 0.7 ? -1 : 0, // 30% infinite
      reverse: Math.random() > 0.5,
    }));
  },

  spread: (count) => {
    const spreadTypes = ['single', 'three_card', 'celtic_cross', 'horseshoe'];
    const positions = [
      { name: 'Past', angle: -20 },
      { name: 'Present', angle: 0 },
      { name: 'Future', angle: 20 },
    ];

    // For celtic cross
    if (count === 10) {
      return [
        { position: 0, name: 'Present', x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, rotation: 0 },
        { position: 1, name: 'Challenge', x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 - 20, rotation: 90 },
        { position: 2, name: 'Past', x: SCREEN_WIDTH / 2 - 80, y: SCREEN_HEIGHT / 2, rotation: 0 },
        { position: 3, name: 'Future', x: SCREEN_WIDTH / 2 + 80, y: SCREEN_HEIGHT / 2, rotation: 0 },
        { position: 4, name: 'Above', x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 - 100, rotation: 0 },
        { position: 5, name: 'Below', x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 + 100, rotation: 0 },
        { position: 6, name: 'Advice', x: SCREEN_WIDTH - 60, y: SCREEN_HEIGHT - 180, rotation: 0 },
        { position: 7, name: 'External', x: SCREEN_WIDTH - 60, y: SCREEN_HEIGHT - 260, rotation: 0 },
        { position: 8, name: 'Hopes', x: SCREEN_WIDTH - 60, y: SCREEN_HEIGHT - 340, rotation: 0 },
        { position: 9, name: 'Outcome', x: SCREEN_WIDTH - 60, y: SCREEN_HEIGHT - 420, rotation: 0 },
      ];
    }

    // Simple fan spread
    const angleStep = 40 / count;
    const startAngle = -20;

    return Array.from({ length: count }).map((_, i) => ({
      position: i,
      name: positions[i % positions.length]?.name || `Card ${i + 1}`,
      x: SCREEN_WIDTH / 2 + Math.sin((startAngle + i * angleStep) * Math.PI / 180) * 100,
      y: SCREEN_HEIGHT / 2 + Math.cos((startAngle + i * angleStep) * Math.PI / 180) * 100,
      rotation: startAngle + i * angleStep,
      scale: 1.0 - (Math.abs(i - count / 2) / count) * 0.3,
      zIndex: count - Math.abs(i - count / 2),
    }));
  },
};

// Helper functions
function randomColor({ alpha = false } = {}) {
  const colors = ['#00ffff', '#8a2be2', '#ff00ff', '#00ff00', '#ffff00', '#ff6b6b'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  if (alpha) {
    const opacity = 0.3 + Math.random() * 0.7;
    return color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
  }

  return color;
}

function randomAnimationValue(type) {
  switch (type) {
    case 'fade':
      return Math.random();
    case 'slide':
      return Math.random() * SCREEN_WIDTH;
    case 'scale':
      return 0.5 + Math.random() * 1.5;
    case 'rotate':
      return Math.random() * 360;
    case 'bounce':
      return Math.random() * 100;
    default:
      return 0;
  }
}

// Main
log('\n' + COLORS.bold + '🎲 Test Data Generator' + COLORS.reset + '\n');

if (!dataType || !GENERATORS[dataType]) {
  log('❌ Invalid or missing data type\n', '\x1b[31m');
  log('Available types:');
  Object.keys(GENERATORS).forEach(type => {
    log(`  - ${type}`);
  });
  log('\nUsage:');
  log('  node scripts/generate-test-data.js <type> <count>');
  log('  node scripts/generate-test-data.js particles 100');
  log('  node scripts/generate-test-data.js --output test.json cards 20\n');
  process.exit(1);
}

if (isNaN(count) || count < 1) {
  log('❌ Invalid count (must be positive integer)\n', '\x1b[31m');
  process.exit(1);
}

log(`Generating ${count} ${dataType}...`, COLORS.cyan);

// Generate data
const data = GENERATORS[dataType](count);

// Output
const output = {
  type: dataType,
  count: data.length,
  generated: new Date().toISOString(),
  screenDimensions: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  data,
};

if (outputFile) {
  // Write to file
  const filePath = path.join(process.cwd(), outputFile);
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  log(`✅ Saved to: ${outputFile}`, COLORS.green);
} else {
  // Print to console
  console.log(JSON.stringify(output, null, 2));
}

log(`\n✨ Generated ${data.length} ${dataType}\n`, COLORS.bold);

// Show sample
if (data.length > 0 && !outputFile) {
  log('Sample item:', COLORS.cyan);
  console.log(data[0]);
  log('');
}

log('Usage in code:', COLORS.cyan);
log(`  import testData from './${outputFile || 'test-data.json'}';`);
log(`  const ${dataType} = testData.data;`);
log('');
