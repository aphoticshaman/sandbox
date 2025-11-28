/**
 * ASSET RENDERING & SCALING SYSTEM
 *
 * Handles multi-resolution asset generation and rendering for
 * "SVG-quality vectorized perfection" at any zoom level.
 *
 * Strategy:
 * 1. SVG-first for all UI elements, card frames, icons
 * 2. Multi-resolution rasters for artwork (1x, 2x, 3x, 4x)
 * 3. Dynamic resolution selection based on display/zoom
 * 4. Lazy loading with quality tiers
 * 5. Canvas-based upscaling for legacy raster assets
 */

// =============================================================================
// ASSET TYPES AND FORMATS
// =============================================================================

export type AssetFormat = 'svg' | 'png' | 'webp' | 'avif' | 'jpg' | 'lottie' | 'json';
export type AssetCategory =
  | 'card_front'
  | 'card_back'
  | 'card_frame'
  | 'ui_element'
  | 'background'
  | 'effect'
  | 'scene_element'
  | 'icon'
  | 'avatar';

export type ResolutionTier = '1x' | '2x' | '3x' | '4x';
export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export interface AssetResolution {
  tier: ResolutionTier;
  width: number;
  height: number;
  dpi: number;
  fileSuffix: string; // e.g., "@2x", "@3x"
}

// Standard tarot card dimensions
export const CARD_BASE_DIMENSIONS = {
  width: 375,   // Base width in pixels
  height: 650,  // Base height in pixels
  aspectRatio: 0.577, // ~9:16
};

// Resolution tiers for raster assets
export const RESOLUTION_TIERS: Record<ResolutionTier, AssetResolution> = {
  '1x': {
    tier: '1x',
    width: CARD_BASE_DIMENSIONS.width,
    height: CARD_BASE_DIMENSIONS.height,
    dpi: 72,
    fileSuffix: '',
  },
  '2x': {
    tier: '2x',
    width: CARD_BASE_DIMENSIONS.width * 2,
    height: CARD_BASE_DIMENSIONS.height * 2,
    dpi: 144,
    fileSuffix: '@2x',
  },
  '3x': {
    tier: '3x',
    width: CARD_BASE_DIMENSIONS.width * 3,
    height: CARD_BASE_DIMENSIONS.height * 3,
    dpi: 216,
    fileSuffix: '@3x',
  },
  '4x': {
    tier: '4x',
    width: CARD_BASE_DIMENSIONS.width * 4,
    height: CARD_BASE_DIMENSIONS.height * 4,
    dpi: 288,
    fileSuffix: '@4x',
  },
};

// =============================================================================
// ASSET MANIFEST ENTRY (How we define each asset)
// =============================================================================

export interface AssetEntry {
  id: string;
  name: string;
  category: AssetCategory;

  // Primary format (SVG preferred for scalability)
  primaryFormat: AssetFormat;
  primaryPath: string;

  // Fallback formats (for raster/complex art)
  fallbackFormats?: AssetFallback[];

  // SVG-specific metadata
  svgMetadata?: SVGAssetMetadata;

  // Raster-specific metadata
  rasterMetadata?: RasterAssetMetadata;

  // Animation metadata (for Lottie, sprite sheets)
  animationMetadata?: AnimationMetadata;

  // Generation hints for AI asset pipeline
  generationHints?: AssetGenerationHints;
}

export interface AssetFallback {
  format: AssetFormat;
  path: string;
  resolutions: ResolutionTier[];
}

export interface SVGAssetMetadata {
  viewBox: string;          // e.g., "0 0 375 650"
  intrinsicWidth: number;
  intrinsicHeight: number;
  hasAnimations: boolean;   // SMIL animations
  colorScheme: 'light' | 'dark' | 'adaptive';
  cssCustomProperties: string[]; // CSS vars for theming
}

export interface RasterAssetMetadata {
  baseWidth: number;
  baseHeight: number;
  availableResolutions: ResolutionTier[];
  preferredFormat: 'webp' | 'avif' | 'png';
  hasTransparency: boolean;
  colorDepth: 8 | 16 | 24 | 32;
  compressionQuality: number; // 0-100
}

export interface AnimationMetadata {
  type: 'lottie' | 'spritesheet' | 'css' | 'svg_smil';
  duration: number;         // ms
  frameRate: number;
  looping: boolean;
  autoplay: boolean;
}

export interface AssetGenerationHints {
  // For AI asset generation pipeline
  style: string;
  colorPalette: string[];
  keywords: string[];
  artDirection: string;
  vectorizable: boolean;    // Can be converted to SVG?
  requiresDetail: 'low' | 'medium' | 'high';
}

// =============================================================================
// RENDERING CONFIGURATION
// =============================================================================

export interface RenderConfig {
  // Device capabilities
  devicePixelRatio: number;
  maxTextureSize: number;
  supportsWebP: boolean;
  supportsAVIF: boolean;
  preferReducedMotion: boolean;

  // Quality settings (user-controllable)
  qualityTier: QualityTier;
  enableSVGRendering: boolean;
  enableCanvasUpscaling: boolean;
  enableLazyLoading: boolean;

  // Memory/performance constraints
  maxConcurrentLoads: number;
  maxCacheSize: number; // bytes
  preloadPriority: AssetCategory[];
}

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 2,
  maxTextureSize: 4096,
  supportsWebP: true,
  supportsAVIF: false,
  preferReducedMotion: false,

  qualityTier: 'high',
  enableSVGRendering: true,
  enableCanvasUpscaling: true,
  enableLazyLoading: true,

  maxConcurrentLoads: 4,
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  preloadPriority: ['card_front', 'card_back', 'card_frame', 'ui_element'],
};

// =============================================================================
// RESOLUTION SELECTION ENGINE
// =============================================================================

export function selectOptimalResolution(
  config: RenderConfig,
  targetDisplayWidth: number,
  targetDisplayHeight: number,
  asset: AssetEntry
): ResolutionTier {
  // SVG assets don't need resolution selection
  if (asset.primaryFormat === 'svg' && config.enableSVGRendering) {
    return '1x'; // SVG scales infinitely
  }

  // Calculate required resolution based on display size and DPR
  const requiredWidth = targetDisplayWidth * config.devicePixelRatio;
  const requiredHeight = targetDisplayHeight * config.devicePixelRatio;

  // Find the smallest resolution tier that exceeds requirements
  const availableResolutions = asset.rasterMetadata?.availableResolutions || ['1x'];

  for (const tier of (['1x', '2x', '3x', '4x'] as ResolutionTier[])) {
    if (!availableResolutions.includes(tier)) continue;

    const resolution = RESOLUTION_TIERS[tier];
    if (resolution.width >= requiredWidth && resolution.height >= requiredHeight) {
      return tier;
    }
  }

  // Return highest available if nothing is big enough
  return availableResolutions[availableResolutions.length - 1] as ResolutionTier;
}

export function selectOptimalFormat(
  config: RenderConfig,
  asset: AssetEntry
): AssetFormat {
  // SVG is always preferred if available and rendering is enabled
  if (asset.primaryFormat === 'svg' && config.enableSVGRendering) {
    return 'svg';
  }

  // Check for modern format support
  if (config.supportsAVIF && asset.fallbackFormats?.some(f => f.format === 'avif')) {
    return 'avif';
  }

  if (config.supportsWebP && asset.fallbackFormats?.some(f => f.format === 'webp')) {
    return 'webp';
  }

  // Fallback to PNG for transparency, JPG otherwise
  if (asset.rasterMetadata?.hasTransparency) {
    return 'png';
  }

  return asset.primaryFormat;
}

// =============================================================================
// ASSET PATH GENERATION
// =============================================================================

export function getAssetPath(
  asset: AssetEntry,
  format: AssetFormat,
  resolution: ResolutionTier
): string {
  // SVG uses primary path directly
  if (format === 'svg') {
    return asset.primaryPath;
  }

  // Find fallback with this format
  const fallback = asset.fallbackFormats?.find(f => f.format === format);
  if (!fallback) {
    // Fallback to primary
    return asset.primaryPath;
  }

  // Insert resolution suffix
  const pathParts = fallback.path.split('.');
  const extension = pathParts.pop();
  const basePath = pathParts.join('.');
  const suffix = RESOLUTION_TIERS[resolution].fileSuffix;

  return `${basePath}${suffix}.${extension}`;
}

// =============================================================================
// SVG RENDERING UTILITIES
// =============================================================================

export interface SVGRenderOptions {
  width: number;
  height: number;
  preserveAspectRatio: 'none' | 'xMidYMid' | 'xMidYMid slice';
  cssVariables?: Record<string, string>;
  className?: string;
}

export function createSVGElement(
  svgContent: string,
  options: SVGRenderOptions
): string {
  // Parse and modify SVG for rendering
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svg = doc.documentElement;

  // Set dimensions
  svg.setAttribute('width', `${options.width}px`);
  svg.setAttribute('height', `${options.height}px`);
  svg.setAttribute('preserveAspectRatio', options.preserveAspectRatio);

  // Apply CSS custom properties
  if (options.cssVariables) {
    let styleContent = ':root {';
    for (const [key, value] of Object.entries(options.cssVariables)) {
      styleContent += `${key}: ${value};`;
    }
    styleContent += '}';

    const styleElement = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleElement.textContent = styleContent;
    svg.insertBefore(styleElement, svg.firstChild);
  }

  if (options.className) {
    svg.setAttribute('class', options.className);
  }

  return new XMLSerializer().serializeToString(svg);
}

// =============================================================================
// CANVAS UPSCALING (for legacy raster assets)
// =============================================================================

export interface UpscaleOptions {
  targetWidth: number;
  targetHeight: number;
  algorithm: 'bilinear' | 'bicubic' | 'lanczos' | 'nearest';
  sharpening: number; // 0-1
}

export async function upscaleWithCanvas(
  imageSrc: string,
  options: UpscaleOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = options.targetWidth;
      canvas.height = options.targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Enable image smoothing based on algorithm
      ctx.imageSmoothingEnabled = options.algorithm !== 'nearest';
      ctx.imageSmoothingQuality = options.algorithm === 'lanczos' ? 'high' : 'medium';

      // Draw scaled image
      ctx.drawImage(img, 0, 0, options.targetWidth, options.targetHeight);

      // Apply sharpening if requested
      if (options.sharpening > 0) {
        applySharpeningFilter(ctx, options.targetWidth, options.targetHeight, options.sharpening);
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error(`Failed to load image: ${imageSrc}`));
    img.src = imageSrc;
  });
}

function applySharpeningFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Unsharp mask kernel
  const kernel = [
    0, -amount, 0,
    -amount, 1 + 4 * amount, -amount,
    0, -amount, 0,
  ];

  const output = new Uint8ClampedArray(data.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        output[(y * width + x) * 4 + c] = Math.min(255, Math.max(0, sum));
      }
      output[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3]; // Preserve alpha
    }
  }

  imageData.data.set(output);
  ctx.putImageData(imageData, 0, 0);
}

// =============================================================================
// ASSET LOADING AND CACHING
// =============================================================================

export interface AssetCache {
  entries: Map<string, CachedAsset>;
  totalSize: number;
  maxSize: number;
}

export interface CachedAsset {
  id: string;
  format: AssetFormat;
  resolution: ResolutionTier;
  data: string | HTMLImageElement | SVGElement;
  size: number;
  lastAccessed: number;
  loadTime: number;
}

export function createAssetCache(maxSize: number): AssetCache {
  return {
    entries: new Map(),
    totalSize: 0,
    maxSize,
  };
}

export function getCacheKey(
  assetId: string,
  format: AssetFormat,
  resolution: ResolutionTier
): string {
  return `${assetId}__${format}__${resolution}`;
}

export function addToCache(
  cache: AssetCache,
  asset: CachedAsset
): void {
  const key = getCacheKey(asset.id, asset.format, asset.resolution);

  // Evict if over capacity
  while (cache.totalSize + asset.size > cache.maxSize && cache.entries.size > 0) {
    evictLRU(cache);
  }

  cache.entries.set(key, asset);
  cache.totalSize += asset.size;
}

function evictLRU(cache: AssetCache): void {
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of cache.entries) {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    const entry = cache.entries.get(oldestKey);
    if (entry) {
      cache.totalSize -= entry.size;
    }
    cache.entries.delete(oldestKey);
  }
}

// =============================================================================
// ASSET GENERATION PIPELINE SPEC
// =============================================================================

/**
 * Specification for generating multi-resolution assets from source files.
 * This would be run during build/deploy, not at runtime.
 */
export interface AssetGenerationSpec {
  sourceFile: string;
  outputDir: string;
  assetId: string;
  category: AssetCategory;

  // What to generate
  generateSVG: boolean;
  generateRaster: boolean;
  rasterResolutions: ResolutionTier[];
  rasterFormats: ('png' | 'webp' | 'avif')[];

  // Processing options
  svgOptimization: boolean;
  svgCleanIds: boolean;
  rasterCompression: number;
  preserveMetadata: boolean;
}

export function createGenerationSpec(
  sourceFile: string,
  assetId: string,
  category: AssetCategory
): AssetGenerationSpec {
  // Smart defaults based on category
  const isUIElement = ['ui_element', 'icon', 'card_frame'].includes(category);
  const isArtwork = ['card_front', 'card_back', 'background'].includes(category);

  return {
    sourceFile,
    outputDir: `/assets/${category}/${assetId}`,
    assetId,
    category,

    // UI elements -> SVG priority; artwork -> high-res raster
    generateSVG: isUIElement,
    generateRaster: !isUIElement || isArtwork,
    rasterResolutions: isArtwork ? ['1x', '2x', '3x', '4x'] : ['1x', '2x'],
    rasterFormats: ['webp', 'png'],

    svgOptimization: true,
    svgCleanIds: true,
    rasterCompression: isArtwork ? 90 : 85,
    preserveMetadata: false,
  };
}

// =============================================================================
// ZOOMED CARD RENDERING
// =============================================================================

/**
 * Get the optimal render configuration for a zoomed card display
 */
export interface ZoomedCardRenderSpec {
  asset: AssetEntry;
  format: AssetFormat;
  resolution: ResolutionTier;
  path: string;
  renderWidth: number;
  renderHeight: number;
  needsUpscaling: boolean;
  upscaleOptions?: UpscaleOptions;
}

export function getZoomedCardRenderSpec(
  asset: AssetEntry,
  config: RenderConfig,
  targetWidth: number,
  targetHeight: number
): ZoomedCardRenderSpec {
  const format = selectOptimalFormat(config, asset);
  const resolution = selectOptimalResolution(config, targetWidth, targetHeight, asset);
  const path = getAssetPath(asset, format, resolution);

  const resolutionData = RESOLUTION_TIERS[resolution];
  const needsUpscaling = (
    config.enableCanvasUpscaling &&
    format !== 'svg' &&
    (resolutionData.width < targetWidth || resolutionData.height < targetHeight)
  );

  return {
    asset,
    format,
    resolution,
    path,
    renderWidth: targetWidth,
    renderHeight: targetHeight,
    needsUpscaling,
    upscaleOptions: needsUpscaling ? {
      targetWidth,
      targetHeight,
      algorithm: 'lanczos',
      sharpening: 0.3,
    } : undefined,
  };
}

// =============================================================================
// PRELOAD STRATEGY
// =============================================================================

export type PreloadPriority = 'critical' | 'high' | 'medium' | 'low';

export interface PreloadManifest {
  critical: string[];  // Load immediately (current card, UI)
  high: string[];      // Load next (adjacent cards, scene elements)
  medium: string[];    // Load when idle (other spreads)
  low: string[];       // Load on demand (cosmetics shop)
}

export function generatePreloadManifest(
  currentSpreadCardIds: string[],
  currentCardIndex: number,
  allAssets: AssetEntry[]
): PreloadManifest {
  const manifest: PreloadManifest = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  // Critical: Current card and its immediate needs
  const currentCardId = currentSpreadCardIds[currentCardIndex];
  if (currentCardId) {
    const cardAsset = allAssets.find(a => a.id === currentCardId);
    if (cardAsset) {
      manifest.critical.push(cardAsset.primaryPath);
    }
  }

  // High: Adjacent cards
  const adjacentIndices = [currentCardIndex - 1, currentCardIndex + 1]
    .filter(i => i >= 0 && i < currentSpreadCardIds.length);

  for (const idx of adjacentIndices) {
    const cardId = currentSpreadCardIds[idx];
    const asset = allAssets.find(a => a.id === cardId);
    if (asset) {
      manifest.high.push(asset.primaryPath);
    }
  }

  // Medium: Rest of spread
  for (let i = 0; i < currentSpreadCardIds.length; i++) {
    if (i !== currentCardIndex && !adjacentIndices.includes(i)) {
      const cardId = currentSpreadCardIds[i];
      const asset = allAssets.find(a => a.id === cardId);
      if (asset) {
        manifest.medium.push(asset.primaryPath);
      }
    }
  }

  // Low: Everything else (handled elsewhere)

  return manifest;
}

// =============================================================================
// REACT/RN INTEGRATION HELPERS
// =============================================================================

export interface ImageSourceSet {
  uri: string;
  scale: number;
}

export function createImageSourceSet(
  asset: AssetEntry,
  config: RenderConfig
): ImageSourceSet[] {
  if (asset.primaryFormat === 'svg') {
    return [{ uri: asset.primaryPath, scale: 1 }];
  }

  const format = selectOptimalFormat(config, asset);
  const availableResolutions = asset.rasterMetadata?.availableResolutions || ['1x'];

  return availableResolutions.map(res => ({
    uri: getAssetPath(asset, format, res),
    scale: parseInt(res.replace('x', '')),
  }));
}

export function createPictureSources(
  asset: AssetEntry,
  config: RenderConfig
): string {
  // For web <picture> element with multiple sources
  let html = '<picture>';

  // AVIF source
  if (config.supportsAVIF && asset.fallbackFormats?.some(f => f.format === 'avif')) {
    html += `<source type="image/avif" srcset="${getAssetPath(asset, 'avif', '1x')} 1x, ${getAssetPath(asset, 'avif', '2x')} 2x">`;
  }

  // WebP source
  if (config.supportsWebP && asset.fallbackFormats?.some(f => f.format === 'webp')) {
    html += `<source type="image/webp" srcset="${getAssetPath(asset, 'webp', '1x')} 1x, ${getAssetPath(asset, 'webp', '2x')} 2x">`;
  }

  // Fallback img
  html += `<img src="${asset.primaryPath}" alt="">`;
  html += '</picture>';

  return html;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  CARD_BASE_DIMENSIONS,
  RESOLUTION_TIERS,
  DEFAULT_RENDER_CONFIG,
  selectOptimalResolution,
  selectOptimalFormat,
  getAssetPath,
  createSVGElement,
  upscaleWithCanvas,
  createAssetCache,
  getCacheKey,
  addToCache,
  createGenerationSpec,
  getZoomedCardRenderSpec,
  generatePreloadManifest,
  createImageSourceSet,
  createPictureSources,
};
