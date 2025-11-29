/**
 * Orthogonal - Main Entry Point
 *
 * Reality-bending puzzle game where you are the attention, not the avatar.
 * Training meta-awareness through gameplay.
 */

import { createGame, Orthogonal } from './Orthogonal';

// Global game reference
let game: Orthogonal | null = null;

// Wait for DOM
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  // Remove any HTML loading screens (Orthogonal.ts handles loading now)
  document.getElementById('loading')?.remove();

  if (!canvas) {
    console.error('[Orthogonal] Canvas element not found');
    showError('Failed to find game canvas');
    return;
  }

  // Check WebGL support
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    showError('WebGL is not supported in your browser');
    return;
  }

  try {
    // Parse URL parameters for options
    const params = new URLSearchParams(window.location.search);
    const options = {
      debug: params.get('debug') === 'true',
      skipIntro: params.get('skip') === 'true',
      startLevel: params.get('level') || undefined,
      streamerMode: params.get('streamer') === 'true'
    };

    // Create and initialize game (loading screen handled by Orthogonal)
    game = await createGame(canvas, options);

    // Expose to window for debugging
    if (options.debug) {
      (window as any).orthogonal = game;
      console.log('[Orthogonal] Debug mode enabled. Access game via window.orthogonal');
    }

  } catch (error) {
    console.error('[Orthogonal] Failed to initialize:', error);
    showError('Failed to initialize game. Please refresh the page.');
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  // Game handles its own resize internally
});

// Handle visibility change (pause when tab hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game) {
    game.pause();
  }
});

// Prevent accidental navigation
window.addEventListener('beforeunload', (e) => {
  if (game && game.getState() === 'playing') {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
});

// Handle errors
window.addEventListener('error', (e) => {
  console.error('[Orthogonal] Unhandled error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Orthogonal] Unhandled promise rejection:', e.reason);
});

// Prevent context menu (witness mode uses right-click)
document.addEventListener('contextmenu', (e) => {
  if (game && game.getState() === 'playing') {
    e.preventDefault();
  }
});

// Prevent default touch behaviors on mobile
document.addEventListener('touchmove', (e) => {
  if (game && game.getState() === 'playing') {
    e.preventDefault();
  }
}, { passive: false });

// Show error message
function showError(message: string): void {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.innerHTML = `
      <div style="text-align: center; color: white; font-family: system-ui;">
        <div style="font-size: 1.5rem; margin-bottom: 1rem;">Unable to Start</div>
        <div style="opacity: 0.7; max-width: 300px;">${message}</div>
        <button onclick="location.reload()" style="
          margin-top: 2rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.8rem 2rem;
          cursor: pointer;
          border-radius: 4px;
        ">Retry</button>
      </div>
    `;
  }
}

// Service worker registration for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[Orthogonal] Service worker registration failed:', error);
    });
  });
}

// Export for external access
export { game };
