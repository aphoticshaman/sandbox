import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@dimensions': resolve(__dirname, './src/dimensions'),
      '@audio': resolve(__dirname, './src/audio'),
      '@stores': resolve(__dirname, './src/stores'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    // Code splitting for faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          // Core Three.js in separate chunk (cached across sessions)
          'three': ['three'],
          // Supabase for cloud saves
          'supabase': ['@supabase/supabase-js'],
          // Game engine core
          'engine': [
            './src/core/DimensionManager.ts',
            './src/core/InputManager.ts',
            './src/shaders/ShaderPipeline.ts',
          ],
          // Audio system (can load after visuals)
          'audio': ['./src/audio/AudioEngine.ts'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 600,
    // Fast minification with esbuild
    minify: 'esbuild',
    // Generate source maps for debugging
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true,
    // Enable CORS for cloud gaming
    cors: true,
  },
  // Optimize deps for faster dev
  optimizeDeps: {
    include: ['three', '@supabase/supabase-js', 'zustand'],
  },
});
