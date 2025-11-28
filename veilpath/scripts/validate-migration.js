#!/usr/bin/env node

/**
 * Migration Validator
 *
 * Verifies that migration is complete and no old patterns remain
 *
 * Usage:
 *   node scripts/validate-migration.js
 *   node scripts/validate-migration.js --strict    (fail on warnings)
 *   node scripts/validate-migration.js --verbose   (show all details)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STRICT_MODE = process.argv.includes('--strict');
const VERBOSE = process.argv.includes('--verbose');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Validation rules
const RULES = {
  // Old patterns that should not exist
  forbidden: [
    {
      pattern: /from ['"]react-native['"].*useSafeDimensions/,
      message: 'useSafeDimensions imported from react-native (should be removed)',
      severity: 'error',
    },
    {
      pattern: /import.*useSafeDimensions.*from.*['"]\.\.[\/\\].*useSafeDimensions/,
      message: 'useSafeDimensions still imported (should use useSkiaDimensions)',
      severity: 'warning',
    },
    {
      pattern: /Animated\.Value\(/,
      message: 'Animated.Value found (should use useSharedValue)',
      severity: 'warning',
      exclude: ['test', 'backup', 'old'],
    },
    {
      pattern: /Animated\.timing\(/,
      message: 'Animated.timing found (should use withTiming)',
      severity: 'warning',
      exclude: ['test', 'backup', 'old'],
    },
    {
      pattern: /Animated\.spring\(/,
      message: 'Animated.spring found (should use withSpring)',
      severity: 'warning',
      exclude: ['test', 'backup', 'old'],
    },
    {
      pattern: /Animated\.loop\(/,
      message: 'Animated.loop found (should use withRepeat)',
      severity: 'warning',
      exclude: ['test', 'backup', 'old'],
    },
    {
      pattern: /Dimensions\.get\(['"]window['"]\)/,
      message: 'Dimensions.get() at module level (causes Hermes errors)',
      severity: 'error',
    },
  ],

  // Required patterns that should exist
  required: [
    {
      pattern: /SkiaDimensionsProvider/,
      file: 'App.js',
      message: 'App.js must wrap with SkiaDimensionsProvider',
      severity: 'error',
    },
    {
      pattern: /import.*SkiaDimensionsContext/,
      files: ['src/contexts/SkiaDimensionsContext.js'],
      message: 'SkiaDimensionsContext must exist',
      severity: 'error',
    },
  ],

  // Skia components should have tests
  testRequired: {
    pattern: /\/skia\//,
    testPattern: /\.test\.(js|jsx|ts|tsx)$/,
    message: 'Skia components should have tests',
    severity: 'warning',
  },
};

// Files to check
const SEARCH_PATHS = [
  'screens',
  'src/components',
  'src/screens',
  'components',
  'App.js',
];

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.expo/,
  /\.git/,
  /build/,
  /dist/,
  /backup/,
  /\.old\./,
];

// Results
const results = {
  errors: [],
  warnings: [],
  filesChecked: 0,
  passed: true,
};

// Helper functions
function log(message, color = '') {
  console.log(color + message + COLORS.reset);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.green);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, COLORS.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, COLORS.cyan);
}

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) {
    return arrayOfFiles;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);

    if (shouldExclude(filePath)) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function checkForbiddenPatterns(filePath, content) {
  RULES.forbidden.forEach(rule => {
    // Check if this file should be excluded from this rule
    if (rule.exclude && rule.exclude.some(exc => filePath.includes(exc))) {
      return;
    }

    const matches = content.match(rule.pattern);
    if (matches) {
      const issue = {
        file: filePath,
        message: rule.message,
        severity: rule.severity,
        match: matches[0],
      };

      if (rule.severity === 'error') {
        results.errors.push(issue);
        results.passed = false;
      } else {
        results.warnings.push(issue);
        if (STRICT_MODE) {
          results.passed = false;
        }
      }
    }
  });
}

function checkRequiredPatterns() {
  RULES.required.forEach(rule => {
    const fileToCheck = rule.file || rule.files;
    const files = Array.isArray(fileToCheck) ? fileToCheck : [fileToCheck];

    files.forEach(file => {
      const filePath = path.join(process.cwd(), file);

      if (!fs.existsSync(filePath)) {
        const issue = {
          file: filePath,
          message: `${rule.message} (file not found)`,
          severity: rule.severity,
        };

        if (rule.severity === 'error') {
          results.errors.push(issue);
          results.passed = false;
        } else {
          results.warnings.push(issue);
        }
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      if (!rule.pattern.test(content)) {
        const issue = {
          file: filePath,
          message: rule.message,
          severity: rule.severity,
        };

        if (rule.severity === 'error') {
          results.errors.push(issue);
          results.passed = false;
        } else {
          results.warnings.push(issue);
        }
      }
    });
  });
}

function checkSkiaComponentTests(filePath) {
  if (RULES.testRequired.pattern.test(filePath)) {
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const testFile = path.join(dir, `${baseName}.test.js`);

    if (!fs.existsSync(testFile)) {
      results.warnings.push({
        file: filePath,
        message: `${RULES.testRequired.message}: ${testFile}`,
        severity: RULES.testRequired.severity,
      });
    }
  }
}

// Main validation
function validate() {
  log('\n' + COLORS.bold + '🔍 Migration Validator' + COLORS.reset + '\n');
  log('Checking for migration issues...\n');

  // Get all files to check
  let allFiles = [];
  SEARCH_PATHS.forEach(searchPath => {
    const fullPath = path.join(process.cwd(), searchPath);
    if (fs.existsSync(fullPath)) {
      if (fs.statSync(fullPath).isDirectory()) {
        allFiles = allFiles.concat(getAllFiles(fullPath));
      } else {
        allFiles.push(fullPath);
      }
    }
  });

  results.filesChecked = allFiles.length;

  if (VERBOSE) {
    logInfo(`Checking ${allFiles.length} files...`);
    allFiles.forEach(f => logInfo(`  - ${f}`));
    log('');
  }

  // Check each file for forbidden patterns
  allFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    checkForbiddenPatterns(filePath, content);
    checkSkiaComponentTests(filePath);
  });

  // Check required patterns
  checkRequiredPatterns();

  // Print results
  log(COLORS.bold + '\n📊 Validation Results\n' + COLORS.reset);
  log(`Files checked: ${results.filesChecked}`);
  log(`Errors: ${results.errors.length}`);
  log(`Warnings: ${results.warnings.length}`);
  log('');

  // Print errors
  if (results.errors.length > 0) {
    log(COLORS.bold + COLORS.red + '\n❌ ERRORS:\n' + COLORS.reset);
    results.errors.forEach(error => {
      logError(`${error.file}`);
      log(`   ${error.message}`, COLORS.red);
      if (error.match) {
        log(`   Found: ${error.match}`, COLORS.yellow);
      }
      log('');
    });
  }

  // Print warnings
  if (results.warnings.length > 0) {
    log(COLORS.bold + COLORS.yellow + '\n⚠️  WARNINGS:\n' + COLORS.reset);
    results.warnings.forEach(warning => {
      logWarning(`${warning.file}`);
      log(`   ${warning.message}`, COLORS.yellow);
      if (warning.match) {
        log(`   Found: ${warning.match}`, COLORS.yellow);
      }
      log('');
    });
  }

  // Summary
  log(COLORS.bold + '\n' + '='.repeat(60) + COLORS.reset);
  if (results.passed) {
    logSuccess('✨ VALIDATION PASSED ✨');
    log('');
    logSuccess('Migration appears complete!');
    if (results.warnings.length > 0 && !STRICT_MODE) {
      logInfo(`${results.warnings.length} warnings found (not blocking)`);
    }
  } else {
    logError('❌ VALIDATION FAILED ❌');
    log('');
    if (results.errors.length > 0) {
      logError(`${results.errors.length} errors must be fixed`);
    }
    if (STRICT_MODE && results.warnings.length > 0) {
      logError(`${results.warnings.length} warnings in strict mode`);
    }
  }
  log(COLORS.bold + '='.repeat(60) + COLORS.reset + '\n');

  // Exit code
  process.exit(results.passed ? 0 : 1);
}

// Run validation
validate();
