/**
 * Orthogonal - Main Entry Point
 * Reality-bending puzzle game training meta-awareness
 */

import { Game } from './core/Game';

// Wait for DOM
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const loading = document.getElementById('loading') as HTMLDivElement;

  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // Initialize game
  const game = new Game(canvas);

  try {
    await game.initialize();

    // Hide loading screen
    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 1000);

    // Start game loop
    game.start();

  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});

// Handle resize
window.addEventListener('resize', () => {
  const event = new CustomEvent('orthogonal:resize');
  window.dispatchEvent(event);
});

// Prevent context menu on right-click (witness mode uses right-click)
document.addEventListener('contextmenu', (e) => e.preventDefault());
