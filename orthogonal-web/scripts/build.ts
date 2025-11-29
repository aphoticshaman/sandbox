#!/usr/bin/env node
/**
 * build.ts
 *
 * Build orchestrator for Orthogonal
 * Handles web, desktop, and production builds
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

// =============================================================================
// CONFIG
// =============================================================================

const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SRC = join(ROOT, 'src');

interface BuildConfig {
  target: 'web' | 'electron' | 'all';
  mode: 'development' | 'production';
  analyze?: boolean;
  sourcemaps?: boolean;
}

// =============================================================================
// UTILITIES
// =============================================================================

function log(msg: string): void {
  console.log(`[build] ${msg}`);
}

function run(cmd: string, cwd = ROOT): void {
  log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function writeJson(path: string, data: any): void {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

// =============================================================================
// BUILD STEPS
// =============================================================================

async function typecheck(): Promise<void> {
  log('Running TypeScript type check...');
  run('npx tsc --noEmit');
}

async function buildWeb(mode: BuildConfig['mode']): Promise<void> {
  log(`Building web (${mode})...`);

  const modeFlag = mode === 'production' ? '' : '--mode development';
  run(`npx vite build ${modeFlag}`);

  // Generate service worker for PWA
  if (mode === 'production') {
    generateServiceWorker();
  }
}

async function buildElectron(): Promise<void> {
  log('Building Electron app...');

  // First build web
  await buildWeb('production');

  // Then package with electron-builder
  run('npx electron-builder --config electron-builder.json');
}

function generateServiceWorker(): void {
  log('Generating service worker...');

  const swContent = `
// Orthogonal Service Worker
const CACHE_NAME = 'orthogonal-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
`;

  writeFileSync(join(DIST, 'sw.js'), swContent.trim());
}

function generateManifest(): void {
  log('Generating PWA manifest...');

  const manifest = {
    name: 'Orthogonal',
    short_name: 'Orthogonal',
    description: 'Reality-bending puzzle game training meta-awareness',
    start_url: '/',
    display: 'fullscreen',
    background_color: '#000000',
    theme_color: '#00ffff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  };

  ensureDir(join(DIST, 'icons'));
  writeJson(join(DIST, 'manifest.json'), manifest);
}

// =============================================================================
// ANALYSIS
// =============================================================================

function analyzeBundle(): void {
  log('Analyzing bundle...');
  run('npx vite-bundle-visualizer');
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const config: BuildConfig = {
    target: (args.find(a => ['web', 'electron', 'all'].includes(a)) as any) || 'web',
    mode: args.includes('--prod') ? 'production' : 'development',
    analyze: args.includes('--analyze'),
    sourcemaps: args.includes('--sourcemaps')
  };

  log(`Build config: ${JSON.stringify(config)}`);

  const startTime = Date.now();

  try {
    // Always typecheck first
    await typecheck();

    // Build based on target
    switch (config.target) {
      case 'web':
        await buildWeb(config.mode);
        if (config.mode === 'production') {
          generateManifest();
        }
        break;

      case 'electron':
        await buildElectron();
        break;

      case 'all':
        await buildWeb('production');
        generateManifest();
        await buildElectron();
        break;
    }

    // Optional analysis
    if (config.analyze) {
      analyzeBundle();
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`Build complete in ${elapsed}s`);

  } catch (error) {
    console.error('[build] Build failed:', error);
    process.exit(1);
  }
}

main();
