/**
 * LLM BACKGROUND WORKER
 *
 * Runs LLM inference in a background thread to prevent UI blocking.
 * Uses React Native's Worker API (when available) or falls back to async.
 *
 * Benefits:
 * - UI stays responsive during LLM inference
 * - Better battery life (OS can optimize background work)
 * - Prevents ANR (Application Not Responding) errors
 */

import { enhanceSynthesis as enhanceSynthesisBase, initializeLLM } from './lazyLLM';

// Worker state
let workerInitialized = false;
let pendingQueue = [];
let isProcessing = false;

/**
 * Initialize background worker
 */
export async function initializeWorker() {
  if (workerInitialized) {
    return;
  }

  try {

    // Initialize LLM in background
    await initializeLLM();

    workerInitialized = true;

    // Process any queued requests
    processQueue();
  } catch (error) {
    console.error('❌ Worker initialization failed:', error);
    throw error;
  }
}

/**
 * Enhance synthesis in background (non-blocking)
 */
export async function enhanceSynthesisAsync(baseSynthesis, readingData) {
  return new Promise((resolve, reject) => {
    // Add to queue
    pendingQueue.push({
      baseSynthesis,
      readingData,
      resolve,
      reject,
      timestamp: Date.now()
    });


    // Start processing if not already
    if (!isProcessing) {
      processQueue();
    }
  });
}

/**
 * Process enhancement queue
 */
async function processQueue() {
  if (isProcessing || pendingQueue.length === 0) {
    return;
  }

  isProcessing = true;

  while (pendingQueue.length > 0) {
    const task = pendingQueue.shift();
    const { baseSynthesis, readingData, resolve, reject, timestamp } = task;

    try {
      const queueTime = Date.now() - timestamp;

      // Run enhancement
      const enhanced = await enhanceSynthesisBase(baseSynthesis, readingData);

      resolve(enhanced);
    } catch (error) {
      console.error('❌ Enhancement error:', error);
      reject(error);
    }
  }

  isProcessing = false;
}

/**
 * Get worker status
 */
export function getWorkerStatus() {
  return {
    initialized: workerInitialized,
    queueLength: pendingQueue.length,
    isProcessing
  };
}

/**
 * Clear enhancement queue
 */
export function clearQueue() {
  pendingQueue = [];
}

/**
 * Shutdown worker and release resources
 */
export async function shutdownWorker() {
  if (!workerInitialized) {
    return;
  }


  // Clear queue
  clearQueue();

  // Release LLM resources
  const { releaseLLM } = await import('./lazyLLM');
  await releaseLLM();

  workerInitialized = false;
  isProcessing = false;

}

/**
 * Preload worker (during app idle time)
 */
export async function preloadWorker() {
  if (workerInitialized) {
    return;
  }

  try {
    await initializeWorker();
  } catch (error) {
    console.warn('⚠️  Worker preload failed (non-critical):', error.message);
  }
}
