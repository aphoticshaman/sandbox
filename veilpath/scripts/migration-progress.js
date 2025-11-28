#!/usr/bin/env node

/**
 * Migration Progress Tracker
 *
 * Generates a detailed progress report for the Skia migration
 *
 * Usage:
 *   node scripts/migration-progress.js
 *   node scripts/migration-progress.js --format markdown > PROGRESS.md
 *   node scripts/migration-progress.js --format json > progress.json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FORMAT = process.argv.includes('--format')
  ? process.argv[process.argv.indexOf('--format') + 1]
  : 'console';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Migration phases from BUILD_ROADMAP.md
const PHASES = [
  {
    id: 0,
    name: 'Tools & Infrastructure',
    tasks: [
      { name: 'Migration Validator', file: 'scripts/validate-migration.js' },
      { name: 'Component Generator', file: 'scripts/generate-skia-component.js' },
      { name: 'Performance Monitor', file: 'src/utils/PerformanceMonitor.js' },
      { name: 'Migration Progress Tracker', file: 'scripts/migration-progress.js' },
      { name: 'Automated Import Updater', file: 'scripts/update-imports.js' },
      { name: 'Test Data Generator', file: 'scripts/generate-test-data.js' },
    ],
  },
  {
    id: 1,
    name: 'Dependency Setup',
    tasks: [
      { name: 'Install @shopify/react-native-skia', check: () => checkPackageInstalled('@shopify/react-native-skia') },
      { name: 'Install react-native-reanimated@3', check: () => checkPackageInstalled('react-native-reanimated') },
      { name: 'Configure babel.config.js', check: () => checkBabelConfig() },
      { name: 'Wrap App.js with SkiaDimensionsProvider', check: () => checkAppJsWrapper() },
    ],
  },
  {
    id: 2,
    name: 'Foundation Components',
    tasks: [
      { name: 'SkiaParticle implemented', file: 'src/utils/skia/SkiaParticle.js', check: () => checkImplemented('src/utils/skia/SkiaParticle.js') },
      { name: 'SkiaAnimationHelpers implemented', file: 'src/utils/skia/SkiaAnimationHelpers.js', check: () => checkImplemented('src/utils/skia/SkiaAnimationHelpers.js') },
    ],
  },
  {
    id: 3,
    name: 'AmbientEffects Migration',
    tasks: [
      { name: 'FloatingParticleSkia', file: 'src/components/skia/FloatingParticleSkia.js' },
      { name: 'LightBeamsSkia', file: 'src/components/skia/LightBeamsSkia.js' },
      { name: 'MainMenuAmbience updated', check: () => checkMainMenuAmbienceSkia() },
    ],
  },
  {
    id: 4,
    name: 'InteractiveBackground Migration',
    tasks: [
      { name: 'InteractiveBackgroundSkia', file: 'src/components/skia/InteractiveBackgroundSkia.js' },
    ],
  },
  {
    id: 5,
    name: 'Screen Dimensions Migration',
    tasks: [
      { name: 'LoadingScreenNew.js', check: () => checkUsesSkiaDimensions('screens/LoadingScreenNew.js') },
      { name: 'MainMenuScreen.js', check: () => checkUsesSkiaDimensions('screens/MainMenuScreen.js') },
      { name: 'ProfileScreen.js', check: () => checkUsesSkiaDimensions('screens/ProfileScreen.js') },
      { name: 'CardReadingScreen.js', check: () => checkUsesSkiaDimensions('screens/CardReadingScreen.js') },
      { name: 'ReadingSummaryScreen.js', check: () => checkUsesSkiaDimensions('screens/ReadingSummaryScreen.js') },
      { name: 'CardDrawingScreen.js', check: () => checkUsesSkiaDimensions('src/screens/CardDrawingScreen.js') },
      { name: 'DeckViewerScreen.js', check: () => checkUsesSkiaDimensions('src/screens/DeckViewerScreen.js') },
      { name: 'OracleChatScreen.js', check: () => checkUsesSkiaDimensions('src/screens/OracleChatScreen.js') },
    ],
  },
  {
    id: 6,
    name: 'Card Animations Migration',
    tasks: [
      { name: 'TarotCardFlipSkia', file: 'src/components/skia/TarotCardFlipSkia.js' },
      { name: 'CardShuffleAnimationSkia', file: 'src/components/skia/CardShuffleAnimationSkia.js' },
      { name: 'CardSelectionSpreadSkia', file: 'src/components/skia/CardSelectionSpreadSkia.js' },
    ],
  },
  {
    id: 7,
    name: 'TarotCard Component Migration',
    tasks: [
      { name: 'TarotCard.js updated', check: () => checkUsesSkiaDimensions('src/components/TarotCard.js') },
    ],
  },
  {
    id: 8,
    name: 'Cleanup & Optimization',
    tasks: [
      { name: 'Old Animated components removed', check: () => checkNoOldComponents() },
      { name: 'useSafeDimensions.js removed', check: () => !checkFileExists('src/utils/useSafeDimensions.js') },
      { name: 'Performance optimized', check: () => false }, // Manual validation
    ],
  },
  {
    id: 9,
    name: 'Integration Testing',
    tasks: [
      { name: 'iPhone SE tested', check: () => false }, // Manual validation
      { name: 'iPhone 14 tested', check: () => false },
      { name: 'iPad tested', check: () => false },
      { name: 'Android tested', check: () => false },
    ],
  },
  {
    id: 10,
    name: 'Documentation',
    tasks: [
      { name: 'SKIA_ARCHITECTURE.md', file: 'docs/SKIA_ARCHITECTURE.md' },
      { name: 'COMPONENT_LIBRARY.md', file: 'docs/COMPONENT_LIBRARY.md' },
      { name: 'PERFORMANCE_GUIDE.md', file: 'docs/PERFORMANCE_GUIDE.md' },
    ],
  },
];

// Helper functions
function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function checkPackageInstalled(packageName) {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
    );
    return !!(packageJson.dependencies[packageName] || packageJson.devDependencies[packageName]);
  } catch {
    return false;
  }
}

function checkBabelConfig() {
  try {
    // Read as text instead of requiring (babel.config.js exports a function)
    const content = fs.readFileSync(path.join(process.cwd(), 'babel.config.js'), 'utf8');
    return content.includes('react-native-reanimated/plugin');
  } catch {
    return false;
  }
}

function checkAppJsWrapper() {
  try {
    const appJs = fs.readFileSync(path.join(process.cwd(), 'App.js'), 'utf8');
    return appJs.includes('SkiaDimensionsProvider') && appJs.includes('<SkiaDimensionsProvider>');
  } catch {
    return false;
  }
}

function checkImplemented(filePath) {
  if (!checkFileExists(filePath)) return false;

  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    // Check if file has been uncommented (not a stub)
    return !content.includes('STUB') && !content.includes('TODO: Uncomment');
  } catch {
    return false;
  }
}

function checkUsesSkiaDimensions(filePath) {
  if (!checkFileExists(filePath)) return false;

  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    return content.includes('useSkiaDimensions') && !content.includes('useSafeDimensions');
  } catch {
    return false;
  }
}

function checkMainMenuAmbienceSkia() {
  try {
    // Check if MainMenuScreen uses AmbientEffectsSkia
    const mainMenu = fs.readFileSync(path.join(process.cwd(), 'screens/MainMenuScreen.js'), 'utf8');
    return mainMenu.includes('AmbientEffectsSkia');
  } catch {
    return false;
  }
}

function checkNoOldComponents() {
  // Check that old Animated patterns are gone
  const checkFiles = [
    'src/components/AmbientEffects.js',
    'src/components/InteractiveBackground.js',
  ];

  return checkFiles.every(file => {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
      return !content.includes('Animated.Value(') && !content.includes('Animated.timing(');
    } catch {
      return false;
    }
  });
}

// Calculate progress
function calculateProgress() {
  const results = {
    phases: [],
    totalTasks: 0,
    completedTasks: 0,
    overallPercent: 0,
  };

  PHASES.forEach(phase => {
    const phaseResult = {
      id: phase.id,
      name: phase.name,
      tasks: [],
      total: phase.tasks.length,
      completed: 0,
      percent: 0,
    };

    phase.tasks.forEach(task => {
      let completed = false;

      if (task.check) {
        // Custom check function
        completed = task.check();
      } else if (task.file) {
        // File exists check
        completed = checkFileExists(task.file);
      }

      phaseResult.tasks.push({
        name: task.name,
        completed,
      });

      if (completed) {
        phaseResult.completed++;
      }
    });

    phaseResult.percent = Math.round((phaseResult.completed / phaseResult.total) * 100);
    results.phases.push(phaseResult);
    results.totalTasks += phaseResult.total;
    results.completedTasks += phaseResult.completed;
  });

  results.overallPercent = Math.round((results.completedTasks / results.totalTasks) * 100);

  return results;
}

// Output formatters
function formatConsole(results) {
  const log = (msg, color = '') => console.log(color + msg + COLORS.reset);

  log('\n' + COLORS.bold + '📊 MIGRATION PROGRESS REPORT' + COLORS.reset + '\n');
  log(`Overall: ${results.completedTasks}/${results.totalTasks} tasks (${results.overallPercent}%)\n`);

  // Progress bar
  const barWidth = 50;
  const filled = Math.round((results.overallPercent / 100) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
  log(`[${bar}] ${results.overallPercent}%\n`, results.overallPercent >= 80 ? COLORS.green : results.overallPercent >= 50 ? COLORS.yellow : COLORS.red);

  // Phases
  results.phases.forEach(phase => {
    const phaseColor = phase.percent === 100 ? COLORS.green : phase.percent > 0 ? COLORS.yellow : '';
    const icon = phase.percent === 100 ? '✅' : phase.percent > 0 ? '⏳' : '⏸️';

    log(`${icon} PHASE ${phase.id}: ${phase.name}`, phaseColor);
    log(`   ${phase.completed}/${phase.total} tasks (${phase.percent}%)`);

    // Show incomplete tasks
    const incompleteTasks = phase.tasks.filter(t => !t.completed);
    if (incompleteTasks.length > 0 && incompleteTasks.length < phase.total) {
      log(`   Remaining:`);
      incompleteTasks.forEach(task => {
        log(`   - ${task.name}`, COLORS.yellow);
      });
    }

    log('');
  });

  // Summary
  log(COLORS.bold + '='.repeat(60) + COLORS.reset);
  if (results.overallPercent === 100) {
    log('🎉 MIGRATION COMPLETE! 🎉', COLORS.green + COLORS.bold);
  } else if (results.overallPercent >= 80) {
    log(`🚀 Almost there! ${100 - results.overallPercent}% remaining`, COLORS.green);
  } else if (results.overallPercent >= 50) {
    log(`⚡ Halfway there! Keep going!`, COLORS.yellow);
  } else {
    log(`📝 ${results.overallPercent}% complete`, COLORS.cyan);
  }
  log(COLORS.bold + '='.repeat(60) + COLORS.reset + '\n');
}

function formatMarkdown(results) {
  let md = `# Skia Migration Progress Report\n\n`;
  md += `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n`;
  md += `## Overall Progress\n\n`;
  md += `**${results.completedTasks}/${results.totalTasks} tasks completed (${results.overallPercent}%)**\n\n`;

  // Progress bar
  const barWidth = 50;
  const filled = Math.round((results.overallPercent / 100) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
  md += `\`\`\`\n[${bar}] ${results.overallPercent}%\n\`\`\`\n\n`;

  md += `## Phases\n\n`;

  results.phases.forEach(phase => {
    const icon = phase.percent === 100 ? '✅' : phase.percent > 0 ? '⏳' : '⏸️';
    md += `### ${icon} PHASE ${phase.id}: ${phase.name}\n\n`;
    md += `**Progress:** ${phase.completed}/${phase.total} tasks (${phase.percent}%)\n\n`;

    md += `| Task | Status |\n`;
    md += `|------|--------|\n`;
    phase.tasks.forEach(task => {
      const status = task.completed ? '✅ Complete' : '⏸️ Pending';
      md += `| ${task.name} | ${status} |\n`;
    });

    md += `\n`;
  });

  return md;
}

function formatJSON(results) {
  return JSON.stringify(results, null, 2);
}

// Main
const results = calculateProgress();

switch (FORMAT) {
  case 'markdown':
  case 'md':
    console.log(formatMarkdown(results));
    break;
  case 'json':
    console.log(formatJSON(results));
    break;
  default:
    formatConsole(results);
}

// Exit with appropriate code
process.exit(results.overallPercent === 100 ? 0 : 1);
