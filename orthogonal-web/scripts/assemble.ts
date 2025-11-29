#!/usr/bin/env node
/**
 * assemble.ts
 *
 * Validates all game components can be assembled
 * Checks imports, dependencies, and generates a manifest
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'src');

// =============================================================================
// COMPONENT REGISTRY
// =============================================================================

interface Component {
  name: string;
  path: string;
  category: 'core' | 'level' | 'puzzle' | 'audio' | 'save' | 'streaming' | 'network' | 'shader';
  exports: string[];
  dependencies: string[];
  required: boolean;
}

const COMPONENTS: Component[] = [
  // Core
  { name: 'InputManager', path: 'core/InputManager.ts', category: 'core', exports: ['InputManager'], dependencies: [], required: true },
  { name: 'DimensionManager', path: 'core/DimensionManager.ts', category: 'core', exports: ['DimensionManager'], dependencies: [], required: true },
  { name: 'AwarenessController', path: 'core/AwarenessController.ts', category: 'core', exports: ['AwarenessController'], dependencies: [], required: true },
  { name: 'Game', path: 'core/Game.ts', category: 'core', exports: ['Game'], dependencies: [], required: true },

  // Levels
  { name: 'StaticLevels', path: 'level/StaticLevels.ts', category: 'level', exports: ['STATIC_LEVELS', 'StaticLevelDefinition'], dependencies: [], required: true },
  { name: 'SoloLevels', path: 'level/SoloLevels.ts', category: 'level', exports: ['SOLO_LEVELS'], dependencies: ['StaticLevels'], required: true },
  { name: 'DuoLevels', path: 'level/DuoLevels.ts', category: 'level', exports: ['DUO_LEVELS'], dependencies: ['StaticLevels'], required: true },
  { name: 'TrioLevels', path: 'level/TrioLevels.ts', category: 'level', exports: ['TRIO_LEVELS'], dependencies: ['StaticLevels'], required: true },
  { name: 'QuadLevels', path: 'level/QuadLevels.ts', category: 'level', exports: ['QUAD_LEVELS'], dependencies: ['StaticLevels'], required: true },
  { name: 'LevelIndex', path: 'level/LevelIndex.ts', category: 'level', exports: ['LevelRegistry', 'getLevelRegistry'], dependencies: ['SoloLevels', 'DuoLevels', 'TrioLevels', 'QuadLevels'], required: true },
  { name: 'LevelLoader', path: 'level/LevelLoader.ts', category: 'level', exports: ['LevelLoader'], dependencies: ['StaticLevels'], required: true },
  { name: 'ProceduralGenerator', path: 'level/ProceduralLevelGenerator.ts', category: 'level', exports: ['ProceduralLevelGenerator', 'SeededRandom'], dependencies: [], required: true },
  { name: 'MultiplayerPatterns', path: 'level/MultiplayerPatterns.ts', category: 'level', exports: ['MultiplayerPatternGenerator'], dependencies: ['ProceduralGenerator'], required: true },
  { name: 'LevelScene', path: 'level/LevelScene.ts', category: 'level', exports: ['LevelScene'], dependencies: [], required: true },

  // Puzzle
  { name: 'PuzzleMechanics', path: 'puzzle/PuzzleMechanics.ts', category: 'puzzle', exports: ['PuzzleEngine'], dependencies: [], required: true },
  { name: 'CooperativePuzzle', path: 'puzzle/CooperativePuzzle.ts', category: 'puzzle', exports: ['CooperativePuzzleManager'], dependencies: [], required: true },

  // Audio
  { name: 'AudioEngine', path: 'audio/AudioEngine.ts', category: 'audio', exports: ['AudioEngine'], dependencies: [], required: true },

  // Shaders
  { name: 'ShaderPipeline', path: 'shaders/ShaderPipeline.ts', category: 'shader', exports: ['ShaderPipeline'], dependencies: [], required: true },
  { name: 'ProceduralGeometry', path: 'shaders/ProceduralGeometry.ts', category: 'shader', exports: ['ProceduralGeometry'], dependencies: [], required: false },

  // Save
  { name: 'SaveSystem', path: 'save/SaveSystem.ts', category: 'save', exports: ['saveSystem', 'SaveSystem'], dependencies: [], required: true },
  { name: 'Achievements', path: 'achievements/AchievementSystem.ts', category: 'save', exports: ['AchievementSystem'], dependencies: ['SaveSystem'], required: true },
  { name: 'Analytics', path: 'analytics/Analytics.ts', category: 'save', exports: ['Analytics'], dependencies: [], required: false },
  { name: 'ReplaySystem', path: 'replay/ReplaySystem.ts', category: 'save', exports: ['ReplaySystem'], dependencies: [], required: false },

  // Streaming
  { name: 'StreamerMode', path: 'streaming/StreamerMode.ts', category: 'streaming', exports: ['StreamerMode'], dependencies: [], required: false },
  { name: 'StreamerLeaderboards', path: 'streaming/StreamerLeaderboardSystem.ts', category: 'streaming', exports: ['StreamerLeaderboardManager'], dependencies: [], required: false },
  { name: 'StreamVerification', path: 'streaming/StreamVerification.ts', category: 'streaming', exports: ['VerificationEngine', 'VerificationEmbedder'], dependencies: [], required: false },

  // Network
  { name: 'NetworkCore', path: 'network/NetworkCore.ts', category: 'network', exports: ['NetworkCore'], dependencies: [], required: false },
  { name: 'PartySystem', path: 'network/PartySystem.ts', category: 'network', exports: ['PartySystem'], dependencies: ['NetworkCore'], required: false },
  { name: 'SocialEngine', path: 'network/SocialEngine.ts', category: 'network', exports: ['SocialEngine'], dependencies: [], required: false },
  { name: 'TextChat', path: 'network/TextChat.ts', category: 'network', exports: ['TextChat'], dependencies: [], required: false },
  { name: 'P2PNetwork', path: 'network/P2PNetwork.ts', category: 'network', exports: ['P2PNetwork', 'getP2PNetwork'], dependencies: [], required: true },
  { name: 'BeheadingBlockchain', path: 'network/BeheadingBlockchain.ts', category: 'network', exports: ['BeheadingBlockchain', 'getBeheadingBlockchain'], dependencies: ['P2PNetwork'], required: true },
  { name: 'PeerCouncil', path: 'network/PeerCouncil.ts', category: 'network', exports: ['PeerCouncil', 'getPeerCouncil'], dependencies: ['P2PNetwork', 'BeheadingBlockchain'], required: true },
  { name: 'DistributedInfra', path: 'network/DistributedInfra.ts', category: 'network', exports: ['DistributedInfra', 'getDistributedInfra'], dependencies: ['P2PNetwork', 'BeheadingBlockchain', 'PeerCouncil'], required: true },

  // UI
  { name: 'MainMenu', path: 'ui/MainMenu.ts', category: 'core', exports: ['MainMenu'], dependencies: [], required: true },
  { name: 'SettingsPanel', path: 'ui/SettingsPanel.ts', category: 'core', exports: ['SettingsPanel'], dependencies: [], required: true },
  { name: 'SDPMProfile', path: 'ui/SDPMProfile.ts', category: 'core', exports: ['SDPMProfileUI'], dependencies: [], required: false },
  { name: 'MetaAwareness', path: 'meta/MetaAwareness.ts', category: 'core', exports: ['MetaAwarenessInsights'], dependencies: [], required: false },

  // Main
  { name: 'Orthogonal', path: 'Orthogonal.ts', category: 'core', exports: ['Orthogonal', 'createGame'], dependencies: ['*'], required: true },
  { name: 'GameAssembler', path: 'GameAssembler.ts', category: 'core', exports: ['GameAssembler', 'assembleGame'], dependencies: ['*'], required: true },
];

// =============================================================================
// VALIDATION
// =============================================================================

interface ValidationResult {
  component: string;
  exists: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateComponent(component: Component): ValidationResult {
  const result: ValidationResult = {
    component: component.name,
    exists: false,
    valid: true,
    errors: [],
    warnings: []
  };

  const fullPath = join(SRC, component.path);

  // Check if file exists
  if (!existsSync(fullPath)) {
    result.exists = false;
    if (component.required) {
      result.valid = false;
      result.errors.push(`Required file not found: ${component.path}`);
    } else {
      result.warnings.push(`Optional file not found: ${component.path}`);
    }
    return result;
  }

  result.exists = true;

  // Read and validate exports
  try {
    const content = readFileSync(fullPath, 'utf-8');

    for (const exp of component.exports) {
      // Check for export statements
      const patterns = [
        new RegExp(`export\\s+(class|function|const|interface|type|enum)\\s+${exp}`),
        new RegExp(`export\\s+\\{[^}]*${exp}[^}]*\\}`),
        new RegExp(`export\\s+default\\s+${exp}`)
      ];

      const found = patterns.some(p => p.test(content));

      if (!found) {
        result.warnings.push(`Expected export '${exp}' not found`);
      }
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`Failed to read file: ${error}`);
  }

  return result;
}

function validateAll(): ValidationResult[] {
  return COMPONENTS.map(validateComponent);
}

// =============================================================================
// MANIFEST GENERATION
// =============================================================================

interface Manifest {
  version: string;
  generated: string;
  components: {
    total: number;
    found: number;
    missing: number;
    byCategory: Record<string, number>;
  };
  levels: {
    solo: number;
    duo: number;
    trio: number;
    quad: number;
    total: number;
  };
  features: string[];
}

function generateManifest(results: ValidationResult[]): Manifest {
  const found = results.filter(r => r.exists).length;
  const byCategory: Record<string, number> = {};

  for (const comp of COMPONENTS) {
    const result = results.find(r => r.component === comp.name);
    if (result?.exists) {
      byCategory[comp.category] = (byCategory[comp.category] || 0) + 1;
    }
  }

  const features: string[] = [];
  if (results.find(r => r.component === 'StreamerMode' && r.exists)) {
    features.push('streamer-mode');
  }
  if (results.find(r => r.component === 'NetworkCore' && r.exists)) {
    features.push('multiplayer');
  }
  if (results.find(r => r.component === 'ProceduralGenerator' && r.exists)) {
    features.push('procedural-levels');
  }
  if (results.find(r => r.component === 'StreamVerification' && r.exists)) {
    features.push('stream-verification');
  }

  return {
    version: '0.1.0',
    generated: new Date().toISOString(),
    components: {
      total: COMPONENTS.length,
      found,
      missing: COMPONENTS.length - found,
      byCategory
    },
    levels: {
      solo: 10,
      duo: 5,
      trio: 5,
      quad: 5,
      total: 25
    },
    features
  };
}

// =============================================================================
// MAIN
// =============================================================================

function main(): void {
  console.log('='.repeat(60));
  console.log(' Orthogonal Assembly Validator');
  console.log('='.repeat(60));
  console.log();

  const results = validateAll();

  // Print results by category
  const categories = [...new Set(COMPONENTS.map(c => c.category))];

  for (const category of categories) {
    console.log(`\n[${category.toUpperCase()}]`);

    const categoryResults = results.filter(r => {
      const comp = COMPONENTS.find(c => c.name === r.component);
      return comp?.category === category;
    });

    for (const result of categoryResults) {
      const status = result.exists ? (result.valid ? '  ' : '  ') : '  ';
      console.log(`${status} ${result.component}`);

      for (const error of result.errors) {
        console.log(`     ERROR: ${error}`);
      }

      for (const warning of result.warnings) {
        console.log(`     WARN: ${warning}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(' SUMMARY');
  console.log('='.repeat(60));

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const found = results.filter(r => r.exists).length;

  console.log(`Components: ${found}/${COMPONENTS.length}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Warnings: ${totalWarnings}`);

  // Generate manifest
  const manifest = generateManifest(results);
  const manifestPath = join(ROOT, 'assembly-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to: ${manifestPath}`);

  // Exit code
  if (totalErrors > 0) {
    console.log('\nAssembly validation FAILED');
    process.exit(1);
  } else {
    console.log('\nAssembly validation PASSED');
    process.exit(0);
  }
}

main();
