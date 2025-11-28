/**
 * LOCAL LLM ENHANCEMENT LAYER
 *
 * Hybrid Architecture:
 * 1. Variety engine generates base synthesis (guaranteed quality)
 * 2. Local LLM enhances for coherence, flow, and personalization
 * 3. Graceful degradation if LLM fails
 *
 * Model: Phi-3 Mini 4K Instruct (Q4 quantized, ~2GB)
 * - Fast inference on mobile
 * - Excellent instruction following
 * - Perfect for enhancement tasks
 */

// LAZY LOAD llama.rn to avoid native module load in Expo Go
// Only load when user explicitly enables and uses the feature
let llamaModule = null;

async function getLlamaModule() {
  if (llamaModule) return llamaModule;

  try {
    // Try to load native module
    llamaModule = require('llama.rn');
    return llamaModule;
  } catch (error) {
    console.error('❌ llama.rn not available (Expo Go or missing native module):', error.message);
    throw new Error('llama.rn requires a development build. Not available in Expo Go.');
  }
}

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

// ═══════════════════════════════════════════════════════════
// HARDWARE REQUIREMENTS
// ═══════════════════════════════════════════════════════════

const MINIMUM_RAM_GB = 4;  // Absolute minimum to attempt loading
const RECOMMENDED_RAM_GB = 6;  // For smooth operation
const MINIMUM_FREE_STORAGE_GB = 4;  // 2.4GB model + buffer

/**
 * Check if device meets hardware requirements for LLM
 * Returns { canRun, warnings, errors, specs }
 */
export async function checkHardwareRequirements() {
  const specs = {
    totalMemory: null,
    freeStorage: null,
    deviceName: Device.deviceName || 'Unknown',
    osVersion: Device.osVersion || 'Unknown',
    isEmulator: !Device.isDevice
  };

  const warnings = [];
  const errors = [];

  // Check total RAM (only available on Android)
  try {
    const totalMemory = await Device.totalMemory;
    if (totalMemory) {
      specs.totalMemory = totalMemory;
      const totalGB = totalMemory / (1024 ** 3);

      if (totalGB < MINIMUM_RAM_GB) {
        errors.push(`Device has ${totalGB.toFixed(1)}GB RAM. Minimum required: ${MINIMUM_RAM_GB}GB.`);
      } else if (totalGB < RECOMMENDED_RAM_GB) {
        warnings.push(`Device has ${totalGB.toFixed(1)}GB RAM. Recommended: ${RECOMMENDED_RAM_GB}GB+ for best performance.`);
      }
    }
  } catch (e) {
    warnings.push('Could not detect device RAM.');
  }

  // Check free storage
  try {
    const freeStorage = await FileSystem.getFreeDiskStorageAsync();
    if (freeStorage) {
      specs.freeStorage = freeStorage;
      const freeGB = freeStorage / (1024 ** 3);

      if (freeGB < MINIMUM_FREE_STORAGE_GB) {
        errors.push(`Only ${freeGB.toFixed(1)}GB storage free. Need ${MINIMUM_FREE_STORAGE_GB}GB for model download.`);
      }
    }
  } catch (e) {
    warnings.push('Could not check free storage.');
  }

  // Emulator warning
  if (specs.isEmulator) {
    warnings.push('Running on emulator. Performance may be limited by host RAM allocation.');
  }

  return {
    canRun: errors.length === 0,
    meetsRecommended: errors.length === 0 && warnings.length === 0,
    warnings,
    errors,
    specs,
    minimumRAM: MINIMUM_RAM_GB,
    recommendedRAM: RECOMMENDED_RAM_GB,
    minimumStorage: MINIMUM_FREE_STORAGE_GB
  };
}

// ═══════════════════════════════════════════════════════════
// CONFIGURATION - Multi-variant support (Q3/Q4 only)
// ═══════════════════════════════════════════════════════════

const MODEL_VARIANTS = {
  q4: {
    name: 'Phi-3-mini-4k-instruct-q4.gguf',
    url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    size: 2.39 * 1024 * 1024 * 1024, // ~2.39 GB (actual file size)
    quality: 'Standard Quality',
    speed: 'moderate',
    recommended: true, // DEFAULT - only option from official repo
    description: 'Recommended - Official Microsoft quantization'
  }
};

// Shared config for all variants
const MODEL_BASE_CONFIG = {
  contextSize: 4096,
  numThreads: 4,
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048
};

const STORAGE_KEYS = {
  LLM_ENABLED: '@llm_enhancement_enabled',
  MODEL_PATH: '@llm_model_path',
  MODEL_VERSION: '@llm_model_version',
  MODEL_VARIANT: '@llm_model_variant' // NEW: q2/q3/q4
};

// Get active model config (user-selected or default to Q4)
async function getActiveModelConfig() {
  const selectedVariant = await AsyncStorage.getItem(STORAGE_KEYS.MODEL_VARIANT) || 'q4';
  const variantConfig = MODEL_VARIANTS[selectedVariant] || MODEL_VARIANTS.q4;

  return {
    ...variantConfig,
    ...MODEL_BASE_CONFIG
  };
}

let llamaContext = null;
let isInitialized = false;

// ═══════════════════════════════════════════════════════════
// METHODOLOGY SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════

const SYNTHESIS_METHODOLOGY_PROMPT = `You are an expert tarot synthesis editor trained in the Massive Variety Engine methodology.

YOUR ROLE: Enhance coherence and flow WITHOUT changing the core methodology or insights.

CORE PRINCIPLES TO PRESERVE:
1. NO TEMPLATES - Every reading must be structurally unique
2. CONTEXT-AWARE BRANCHING - Respect all context (MBTI, history, geometric themes, urgency)
3. SHADOW INTEGRATION - Keep discomfort and growth edges intact
4. ACTION-ORIENTED - Preserve specific steps and timeframes
5. DIRECTNESS - Maintain edge and uncomfortable truths

FORBIDDEN CHANGES:
❌ DO NOT add generic platitudes ("trust yourself", "follow your heart", "you are worthy")
❌ DO NOT use templates ("The [Card] suggests...", "This card represents...")
❌ DO NOT soften shadow work or remove uncomfortable truths
❌ DO NOT change the core insights from the variety engine
❌ DO NOT add spiritual bypassing or toxic positivity

ALLOWED ENHANCEMENTS:
✅ Improve flow between sections with transition phrases
✅ Ensure pronouns are consistent (use provided user pronouns)
✅ Fix grammatical errors
✅ Make synthesis feel cohesive, not assembled
✅ Enhance specificity by weaving in user's stated intention naturally
✅ Deepen personalization using MCQ answers and astrological context

METHODOLOGY STRUCTURE (preserve this):
Opening (150-250 words):
- Narrative hook (NOT "The [Card] suggests...")
- Intention woven naturally
- Barnum statement for personalization
- Meta-skepticism acknowledgment (50% of readings)
- Decision empowerment language (60% of readings)

Card Analysis (300-600 words):
- STRUCTURAL VARIATION - 10+ different intro formats
- MCQ insights prioritized over generic meanings
- 1-2 contextual quotes per card
- Geometric semantic themes

Pattern Synthesis (200-400 words):
- Cognitive dissonance detection (if resonance < 2.5)
- Lilith shadow integration
- Chiron wound activation
- Nodal axis (destiny vs comfort)
- Moon phase timing

Action Steps:
- Urgency-appropriate timeframes
- Specific, actionable steps
- No vague advice

QUALITY MARKERS:
✅ Uses MCQ answers to detect cognitive dissonance
✅ Names specific patterns from user's history
✅ Connects to astrological context (Lilith, Chiron, Nodes)
✅ Shadow work when appropriate
✅ Direct, specific language

Your task: Take the base synthesis and enhance it following these principles.`;

// ═══════════════════════════════════════════════════════════
// FEW-SHOT EXAMPLES
// ═══════════════════════════════════════════════════════════

const FEW_SHOT_EXAMPLES = [
  {
    input: {
      baseSynthesis: "Tower reversed. Chaos avoided, crisis internal. You wanted clarity on career transition...",
      userProfile: { name: "Alex", pronouns: "they/them", mbtiType: "INTJ" },
      intention: "Should I leave my toxic job?"
    },
    output: `Alex, you came here asking "Should I leave my toxic job?" Let me be direct: you already know the answer. Tower reversed isn't about avoiding the crisis—it's about the crisis happening internally while you pretend everything's fine externally.

As an INTJ, you've probably already run the cost-benefit analysis seventeen times. The numbers say leave. Your gut says leave. Your body says leave (notice the Sunday night dread? That's data). But you're still here, asking cards for permission you don't need.

Tower reversed in a career reading means the structure is already crumbling—you're just holding up the facade. Every day you stay is a day spent managing decay instead of building something new. Your resistance to this truth? That's not prudence, that's fear wearing a logic costume.

Within the next two weeks: Update your resume. Not "perfect" it—UPDATE it. Send it to three people in your network. Not to apply anywhere yet, just to make the option real instead of theoretical.

The cost of waiting isn't neutral. It's compounding. Act accordingly.`
  },
  {
    input: {
      baseSynthesis: "Three of Cups. Connection, celebration, community. You asked about friendship...",
      userProfile: { name: "Maria", pronouns: "she/her", mbtiType: "ENFP" },
      intention: "Why do I feel lonely even around people?"
    },
    output: `Maria, Three of Cups appeared for your question "Why do I feel lonely even around people?" and there's uncomfortable precision in that timing.

This card shows celebration, community, connection—all the things you have access to but aren't actually experiencing. As an ENFP, you're probably the life of the party while feeling completely unseen. You give everyone else the gift of your full attention, but who's seeing YOU?

The loneliness isn't about quantity of people. It's about quality of presence. You're surrounded by people who know your performance, not your actual inner world. Three of Cups isn't calling you to more socializing—it's calling bullshit on superficial connection masquerading as intimacy.

Here's the uncomfortable part: the pattern reveals itself in your MCQ answers. You're selecting options that prioritize others' comfort over your authenticity. You've built a relational strategy around being liked rather than being known. Known is scarier. Known requires vulnerability you're not practicing.

This week: Text one person and say something real instead of charming. Not trauma-dumping, just... one honest sentence about how you actually are. "I've been feeling disconnected lately" beats "Great! How are you?" for the hundredth time.

The cure for loneliness isn't more people. It's being more yourself with the ones already there.`
  }
];

// ═══════════════════════════════════════════════════════════
// MODEL MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Download model if not already downloaded
 * Uses cacheDirectory for large files - more space available than documentDirectory
 */
export async function downloadModelIfNeeded(onProgress) {
  try {
    const modelConfig = await getActiveModelConfig();
    // Use cacheDirectory for large model files - has more space on Android
    const modelPath = `${FileSystem.cacheDirectory}${modelConfig.name}`;


    // Check directory permissions
    try {
      const dirInfo = await FileSystem.getInfoAsync(FileSystem.cacheDirectory);
    } catch (e) {
      console.error('[Download] Cannot access cache directory:', e);
    }

    const fileInfo = await FileSystem.getInfoAsync(modelPath);

    // Check if file exists AND has valid size (not corrupted/incomplete)
    if (fileInfo.exists && fileInfo.size > 0) {
      const expectedSize = modelConfig.size;
      const actualSize = fileInfo.size;
      const sizeDiff = Math.abs(expectedSize - actualSize);
      const tolerance = expectedSize * 0.05; // 5% tolerance

      if (sizeDiff <= tolerance) {
        await AsyncStorage.setItem(STORAGE_KEYS.MODEL_PATH, modelPath);
        return modelPath;
      } else {
        console.warn(`⚠️  Model file size mismatch: expected ${(expectedSize / (1024**3)).toFixed(1)}GB, got ${(actualSize / (1024**3)).toFixed(1)}GB`);
        await FileSystem.deleteAsync(modelPath, { idempotent: true });
      }
    }


    const downloadResumable = FileSystem.createDownloadResumable(
      modelConfig.url,
      modelPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        const mbWritten = (downloadProgress.totalBytesWritten / (1024 * 1024)).toFixed(1);
        const mbExpected = (downloadProgress.totalBytesExpectedToWrite / (1024 * 1024)).toFixed(1);

        if (onProgress) {
          onProgress(progress);
        }
      }
    );

    const result = await downloadResumable.downloadAsync();

    // CRITICAL: Validate the downloaded file
    const downloadedFileInfo = await FileSystem.getInfoAsync(result.uri);

    if (!downloadedFileInfo.exists) {
      throw new Error('Download completed but file does not exist');
    }

    if (downloadedFileInfo.size < 1024 * 1024) { // Less than 1MB is definitely wrong
      console.error(`[Download] File too small (${downloadedFileInfo.size} bytes)! Likely an error page.`);

      // Read the file to see what we got
      try {
        const content = await FileSystem.readAsStringAsync(result.uri);
        console.error('[Download] File contents:', content.substring(0, 500));
      } catch (e) {
        console.error('[Download] Could not read file:', e);
      }

      throw new Error(`Download failed: file too small (${downloadedFileInfo.size} bytes). Expected ${(modelConfig.size / (1024**3)).toFixed(1)}GB. This might be a permissions issue or the URL is blocked.`);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.MODEL_PATH, result.uri);
    return result.uri;
  } catch (error) {
    console.error('❌ Model download failed:', error);
    throw error;
  }
}

/**
 * Initialize LLM context with defensive checks and timeout protection
 */
export async function initializeLLM() {
  if (isInitialized && llamaContext) {
    return llamaContext;
  }

  try {
    // Step 1: Check model path exists in storage
    const modelPath = await AsyncStorage.getItem(STORAGE_KEYS.MODEL_PATH);
    if (!modelPath) {
      console.error('[LLM] No model path in storage');
      throw new Error('Model not downloaded. Call downloadModelIfNeeded() first.');
    }

    // Step 2: Verify model file actually exists and has valid size
    const fileInfo = await FileSystem.getInfoAsync(modelPath);
    if (!fileInfo.exists) {
      console.error(`[LLM] Model file not found at: ${modelPath}`);
      // Clear invalid path from storage
      await AsyncStorage.removeItem(STORAGE_KEYS.MODEL_PATH);
      throw new Error('Model file not found. Please re-download.');
    }

    if (fileInfo.size < 100 * 1024 * 1024) { // Less than 100MB is definitely wrong
      console.error(`[LLM] Model file too small: ${(fileInfo.size / (1024 * 1024)).toFixed(1)}MB`);
      throw new Error(`Model file corrupted (${(fileInfo.size / (1024 * 1024)).toFixed(1)}MB). Please re-download.`);
    }

    // Step 3: Get config
    const modelConfig = await getActiveModelConfig();

    // Step 4: Lazy load llama.rn module
    let llamaModule;
    try {
      llamaModule = await getLlamaModule();
    } catch (moduleError) {
      console.error('[LLM] Failed to load native module:', moduleError.message);
      throw new Error(`Native module load failed: ${moduleError.message}`);
    }

    const { initLlama } = llamaModule;
    if (!initLlama || typeof initLlama !== 'function') {
      console.error('[LLM] initLlama not found in module:', Object.keys(llamaModule));
      throw new Error('Invalid llama.rn module - initLlama not found');
    }

    // Step 5: Initialize with timeout protection (60 seconds for large model)

    const initPromise = initLlama({
      model: modelPath,
      n_ctx: modelConfig.contextSize,
      n_threads: modelConfig.numThreads,
      use_mlock: true,
      use_mmap: true
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('LLM initialization timed out after 60 seconds')), 60000);
    });

    llamaContext = await Promise.race([initPromise, timeoutPromise]);

    if (!llamaContext) {
      throw new Error('initLlama returned null/undefined');
    }

    // Verify the context has expected methods
    if (typeof llamaContext.completion !== 'function') {
      console.error('[LLM] Context missing completion method:', Object.keys(llamaContext));
      throw new Error('Invalid LLM context - missing completion method');
    }

    isInitialized = true;
    return llamaContext;

  } catch (error) {
    console.error('❌ LLM initialization failed:', error.message || error);
    console.error('[LLM] Stack trace:', error.stack || 'No stack trace');

    // Reset state on failure
    llamaContext = null;
    isInitialized = false;

    throw error;
  }
}

/**
 * Release LLM resources
 */
export async function releaseLLM() {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
    isInitialized = false;
  }
}

// ═══════════════════════════════════════════════════════════
// ENHANCEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Build enhancement prompt with methodology + few-shot examples
 */
function buildEnhancementPrompt(baseSynthesis, readingData) {
  const { intention, userProfile, mcqAnalysis } = readingData;

  // Extract key context for enhancement
  const context = {
    userName: userProfile?.name || 'Seeker',
    pronouns: userProfile?.pronouns || 'they/them',
    mbtiType: userProfile?.mbtiType || 'INFP',
    intention: intention || 'guidance',
    hasLowResonance: mcqAnalysis?.overallResonance < 2.5,
    hasCrisisSignals: mcqAnalysis?.crisisSignals?.detected
  };

  const prompt = `${SYNTHESIS_METHODOLOGY_PROMPT}

CONTEXT:
- User Name: ${context.userName}
- Pronouns: ${context.pronouns}
- MBTI Type: ${context.mbtiType}
- Intention: "${context.intention}"
- Low MCQ Resonance (cognitive dissonance detected): ${context.hasLowResonance ? 'YES' : 'NO'}
- Crisis Signals: ${context.hasCrisisSignals ? 'YES - maintain supportive resources' : 'NO'}

BASE SYNTHESIS (from variety engine):
${baseSynthesis}

ENHANCEMENT TASK:
Improve flow, coherence, and personalization while preserving all methodology principles above.
Pay special attention to:
1. Use ${context.pronouns} consistently throughout
2. Weave in "${context.intention}" naturally (not just once at the beginning)
3. ${context.hasLowResonance ? 'Emphasize cognitive dissonance patterns (this user is avoiding something)' : 'Maintain current depth'}
4. Ensure the synthesis feels like ONE cohesive reading, not assembled sections

ENHANCED SYNTHESIS:`;

  return prompt;
}

/**
 * Enhance synthesis using local LLM
 */
export async function enhanceSynthesis(baseSynthesis, readingData) {
  try {
    // Check if enhancement is enabled
    const enhancementEnabled = await AsyncStorage.getItem(STORAGE_KEYS.LLM_ENABLED);
    if (enhancementEnabled === 'false') {
      return baseSynthesis;
    }

    // Ensure LLM is initialized
    if (!llamaContext) {
      await initializeLLM();
    }

    // Build prompt
    const prompt = buildEnhancementPrompt(baseSynthesis, readingData);

    const startTime = Date.now();

    const modelConfig = await getActiveModelConfig();

    // Generate enhancement
    const response = await llamaContext.completion({
      prompt,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
      max_tokens: modelConfig.maxTokens,
      stop: ['USER:', 'SYSTEM:', '\n\n---']
    });

    const enhancedSynthesis = response.text.trim();
    const inferenceTime = Date.now() - startTime;


    // Validate enhancement didn't break methodology
    if (isValidEnhancement(enhancedSynthesis, baseSynthesis)) {
      return enhancedSynthesis;
    } else {
      console.warn('⚠️  Enhancement failed validation, using base synthesis');
      return baseSynthesis;
    }

  } catch (error) {
    console.error('❌ LLM enhancement failed:', error);
    return baseSynthesis; // Graceful degradation
  }
}

/**
 * Validate enhancement didn't violate methodology
 */
function isValidEnhancement(enhanced, original) {
  // Check for forbidden patterns
  const forbiddenPatterns = [
    /The \[.*?\] suggests/i,
    /This card represents/i,
    /trust yourself/i,
    /follow your heart/i,
    /you are worthy/i,
    /everything happens for a reason/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(enhanced) && !pattern.test(original)) {
      console.warn(`⚠️  Enhanced text contains forbidden pattern: ${pattern}`);
      return false;
    }
  }

  // Check length is reasonable (should be similar to original)
  const lengthRatio = enhanced.length / original.length;
  if (lengthRatio < 0.8 || lengthRatio > 1.5) {
    console.warn(`⚠️  Enhanced text length ratio suspicious: ${lengthRatio.toFixed(2)}`);
    return false;
  }

  // Check it's not empty
  if (enhanced.length < 100) {
    console.warn('⚠️  Enhanced text too short');
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════
// SETTINGS MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Check if LLM enhancement is enabled
 */
export async function isEnhancementEnabled() {
  const enabled = await AsyncStorage.getItem(STORAGE_KEYS.LLM_ENABLED);
  return enabled !== 'false'; // Default to enabled
}

/**
 * Enable/disable LLM enhancement
 */
export async function setEnhancementEnabled(enabled) {
  await AsyncStorage.setItem(STORAGE_KEYS.LLM_ENABLED, enabled ? 'true' : 'false');
}

/**
 * Get model info - auto-cleans stale state if model file is missing
 */
export async function getModelInfo() {
  const modelConfig = await getActiveModelConfig();
  const modelPath = await AsyncStorage.getItem(STORAGE_KEYS.MODEL_PATH);

  if (!modelPath) {
    return {
      downloaded: false,
      size: 0, // NOT downloaded, size is 0
      name: modelConfig.name,
      variant: await getModelVariant(),
      quality: modelConfig.quality,
      speed: modelConfig.speed,
      description: modelConfig.description,
      expectedSize: modelConfig.size
    };
  }

  const fileInfo = await FileSystem.getInfoAsync(modelPath);
  const actualSize = (fileInfo.exists && fileInfo.size) ? fileInfo.size : 0;

  // CRITICAL: Auto-clean stale state if model path is set but file doesn't exist
  // This can happen when emulator data is wiped or storage is cleared
  if (!fileInfo.exists || actualSize === 0) {
    console.warn('[LLM] Model path set but file missing/empty. Cleaning stale state...');
    await AsyncStorage.removeItem(STORAGE_KEYS.MODEL_PATH);
    await AsyncStorage.setItem(STORAGE_KEYS.LLM_ENABLED, 'false');

    return {
      downloaded: false,
      size: 0,
      name: modelConfig.name,
      variant: await getModelVariant(),
      quality: modelConfig.quality,
      speed: modelConfig.speed,
      description: modelConfig.description,
      expectedSize: modelConfig.size
    };
  }

  return {
    downloaded: true,
    size: actualSize,
    name: modelConfig.name,
    path: modelPath,
    variant: await getModelVariant(),
    quality: modelConfig.quality,
    speed: modelConfig.speed,
    description: modelConfig.description,
    expectedSize: modelConfig.size
  };
}

/**
 * Get current model variant (q2/q3/q4)
 */
export async function getModelVariant() {
  return await AsyncStorage.getItem(STORAGE_KEYS.MODEL_VARIANT) || 'q3';
}

/**
 * Set model variant (q2/q3/q4)
 * NOTE: Requires re-downloading the model
 */
export async function setModelVariant(variant) {
  if (!MODEL_VARIANTS[variant]) {
    throw new Error(`Invalid variant: ${variant}. Must be q2, q3, or q4`);
  }

  await AsyncStorage.setItem(STORAGE_KEYS.MODEL_VARIANT, variant);

  // Clear old model path (requires re-download)
  await AsyncStorage.removeItem(STORAGE_KEYS.MODEL_PATH);
}

/**
 * Get all available model variants
 */
export function getAvailableVariants() {
  return Object.entries(MODEL_VARIANTS).map(([key, config]) => ({
    id: key,
    ...config
  }));
}

/**
 * Delete model to free up space
 */
export async function deleteModel() {
  try {
    const modelPath = await AsyncStorage.getItem(STORAGE_KEYS.MODEL_PATH);
    if (modelPath) {
      await FileSystem.deleteAsync(modelPath, { idempotent: true });
      await AsyncStorage.removeItem(STORAGE_KEYS.MODEL_PATH);
    }

    // Release LLM if initialized
    await releaseLLM();
  } catch (error) {
    console.error('❌ Model deletion failed:', error);
    throw error;
  }
}
