#!/usr/bin/env node

/**
 * Automated Import Updater
 *
 * Bulk updates imports from useSafeDimensions to useSkiaDimensions
 *
 * Usage:
 *   node scripts/update-imports.js                    # Dry run (show changes)
 *   node scripts/update-imports.js --apply            # Apply changes
 *   node scripts/update-imports.js --file path.js     # Update single file
 *   node scripts/update-imports.js --dir screens/     # Update directory
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = !process.argv.includes('--apply');
const SINGLE_FILE = process.argv.includes('--file')
  ? process.argv[process.argv.indexOf('--file') + 1]
  : null;
const DIRECTORY = process.argv.includes('--dir')
  ? process.argv[process.argv.indexOf('--dir') + 1]
  : null;

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(message, color = '') {
  console.log(color + message + COLORS.reset);
}

// Find and replace patterns
const REPLACEMENTS = [
  {
    name: 'useSafeDimensions import',
    find: /import\s*{\s*useSafeDimensions\s*}\s*from\s*['"]\.\.\/src\/utils\/useSafeDimensions['"];?/g,
    replace: `import { useSkiaDimensions } from '../src/contexts/SkiaDimensionsContext';`,
  },
  {
    name: 'useSafeDimensions import (src path)',
    find: /import\s*{\s*useSafeDimensions\s*}\s*from\s*['"]\.\.\/utils\/useSafeDimensions['"];?/g,
    replace: `import { useSkiaDimensions } from '../contexts/SkiaDimensionsContext';`,
  },
  {
    name: 'useSafeDimensions import (alternative path)',
    find: /import\s*{\s*useSafeDimensions\s*}\s*from\s*['"]\.\.\/\.\.\/utils\/useSafeDimensions['"];?/g,
    replace: `import { useSkiaDimensions } from '../../contexts/SkiaDimensionsContext';`,
  },
  {
    name: 'useSafeDimensions usage',
    find: /useSafeDimensions\(\)/g,
    replace: `useSkiaDimensions()`,
  },
  {
    name: 'useSafeDimensions variable',
    find: /const\s+{\s*([^}]+)\s*}\s*=\s*useSafeDimensions\(\)/g,
    replace: (match, vars) => `const { ${vars} } = useSkiaDimensions()`,
  },
];

// Default search paths
const DEFAULT_PATHS = [
  'screens',
  'src/components',
  'src/screens',
  'components',
];

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.expo/,
  /\.git/,
  /build/,
  /dist/,
  /backup/,
  /\.old\./,
  /useSafeDimensions\.js$/, // Don't update the file itself
  /SkiaDimensionsContext\.js$/, // Don't update the context file
];

// Helper functions
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

function updateFile(filePath) {
  const originalContent = fs.readFileSync(filePath, 'utf8');
  let content = originalContent;
  const changes = [];

  // Apply each replacement
  REPLACEMENTS.forEach(replacement => {
    const matches = content.match(replacement.find);
    if (matches) {
      changes.push({
        name: replacement.name,
        count: matches.length,
      });
      content = content.replace(replacement.find, replacement.replace);
    }
  });

  return {
    filePath,
    originalContent,
    newContent: content,
    changed: content !== originalContent,
    changes,
  };
}

function showDiff(result) {
  const lines = result.originalContent.split('\n');
  const newLines = result.newContent.split('\n');

  log(`\n${COLORS.bold}${result.filePath}${COLORS.reset}`, COLORS.cyan);

  result.changes.forEach(change => {
    log(`  ${change.name}: ${change.count} replacement(s)`, COLORS.yellow);
  });

  log('\n  Diff:', COLORS.dim);

  lines.forEach((line, i) => {
    if (line !== newLines[i]) {
      log(`  - ${line}`, COLORS.red);
      log(`  + ${newLines[i]}`, COLORS.green);
    }
  });
}

function applyChanges(result) {
  fs.writeFileSync(result.filePath, result.newContent, 'utf8');
  log(`✅ Updated: ${result.filePath}`, COLORS.green);
}

// Main
log('\n' + COLORS.bold + '🔄 Automated Import Updater' + COLORS.reset + '\n');

if (DRY_RUN) {
  log('🔍 DRY RUN MODE (showing changes, not applying)', COLORS.yellow);
  log('Use --apply flag to apply changes\n');
} else {
  log('✏️  APPLYING CHANGES', COLORS.green);
  log('');
}

// Get files to process
let filesToProcess = [];

if (SINGLE_FILE) {
  // Single file mode
  const filePath = path.join(process.cwd(), SINGLE_FILE);
  if (fs.existsSync(filePath)) {
    filesToProcess.push(filePath);
    log(`Processing single file: ${SINGLE_FILE}\n`);
  } else {
    log(`❌ File not found: ${SINGLE_FILE}`, COLORS.red);
    process.exit(1);
  }
} else if (DIRECTORY) {
  // Directory mode
  const dirPath = path.join(process.cwd(), DIRECTORY);
  if (fs.existsSync(dirPath)) {
    filesToProcess = getAllFiles(dirPath);
    log(`Processing directory: ${DIRECTORY}`);
    log(`Found ${filesToProcess.length} files\n`);
  } else {
    log(`❌ Directory not found: ${DIRECTORY}`, COLORS.red);
    process.exit(1);
  }
} else {
  // Default: scan all paths
  DEFAULT_PATHS.forEach(searchPath => {
    const fullPath = path.join(process.cwd(), searchPath);
    if (fs.existsSync(fullPath)) {
      if (fs.statSync(fullPath).isDirectory()) {
        filesToProcess = filesToProcess.concat(getAllFiles(fullPath));
      } else {
        filesToProcess.push(fullPath);
      }
    }
  });
  log(`Scanning default paths...`);
  log(`Found ${filesToProcess.length} files\n`);
}

// Process files
const results = [];
let filesChanged = 0;

filesToProcess.forEach(file => {
  const result = updateFile(file);
  if (result.changed) {
    results.push(result);
    filesChanged++;

    if (DRY_RUN) {
      showDiff(result);
    } else {
      applyChanges(result);
    }
  }
});

// Summary
log('\n' + COLORS.bold + '='.repeat(60) + COLORS.reset);
log(`\n📊 Summary:`, COLORS.bold);
log(`  Files scanned: ${filesToProcess.length}`);
log(`  Files changed: ${filesChanged}`);
log(`  Files unchanged: ${filesToProcess.length - filesChanged}`);

if (filesChanged > 0) {
  log('');
  results.forEach(result => {
    log(`  ${result.filePath}`, COLORS.cyan);
    result.changes.forEach(change => {
      log(`    - ${change.name}: ${change.count}`, COLORS.dim);
    });
  });
}

log('\n' + COLORS.bold + '='.repeat(60) + COLORS.reset);

if (DRY_RUN && filesChanged > 0) {
  log(`\n💡 Run with --apply flag to apply these changes`, COLORS.yellow);
} else if (!DRY_RUN && filesChanged > 0) {
  log(`\n✅ All changes applied successfully!`, COLORS.green);
  log(`\n⚠️  Don't forget to:`, COLORS.yellow);
  log(`  1. Test the app`);
  log(`  2. Run: node scripts/validate-migration.js`);
  log(`  3. Commit: git add . && git commit -m "REFACTOR: Migrate to useSkiaDimensions"`);
} else {
  log(`\n✨ No files need updating`, COLORS.green);
}

log('');

// Exit
process.exit(filesChanged > 0 && !DRY_RUN ? 0 : 1);
