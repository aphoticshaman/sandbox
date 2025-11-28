# Skia Utilities

This directory contains utility functions and helper components for React Native Skia integration.

## Purpose

Centralized helpers for:
- Animation patterns with Reanimated
- Common Skia shapes and effects
- Performance optimization utilities
- Migration helpers from React Native Animated to Skia

## Files

### SkiaParticle.js
Base component for particle effects. Used by FloatingParticle and other particle-based animations.

### SkiaAnimationHelpers.js
Helper functions for common animation patterns (fade, slide, rotate, scale) using Reanimated worklets.

### SkiaMigrationHelpers.js
Utilities to help migrate existing React Native Animated code to Skia + Reanimated.

## Usage Example

```javascript
import { SkiaParticle } from '../utils/skia/SkiaParticle';
import { fadeIn, floatUp } from '../utils/skia/SkiaAnimationHelpers';
import { useSkiaDimensions } from '../contexts/SkiaDimensionsContext';

function MySkiaComponent() {
  const { width, height } = useSkiaDimensions();

  return (
    <Canvas style={{ flex: 1 }}>
      <SkiaParticle x={width / 2} y={height / 2} size={5} color="#00ffff" />
    </Canvas>
  );
}
```

## Dependencies

- `@shopify/react-native-skia` - Core Skia rendering
- `react-native-reanimated@3` - Animation worklets
- `SkiaDimensionsContext` - Responsive dimensions

## Status

**PENDING:** Stub files created, waiting for Skia dependencies to be installed.
