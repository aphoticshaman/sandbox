/**
 * LightBeams Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Canvas } from '@shopify/react-native-skia';
import { LightBeams } from './LightBeamsSkia';

jest.mock('../../contexts/SkiaDimensionsContext', () => ({
  useSkiaDimensions: () => ({ width: 375, height: 812 }),
}));

describe('LightBeams', () => {
  it('renders animation', () => {
    const { container } = render(
      <Canvas style={{ width: 100, height: 100 }}>
        <LightBeams duration={1000} />
      </Canvas>
    );
    expect(container).toBeTruthy();
  });

  it('calls onComplete callback', (done) => {
    const handleComplete = jest.fn();

    render(
      <Canvas style={{ width: 100, height: 100 }}>
        <LightBeams duration={100} onComplete={handleComplete} />
      </Canvas>
    );

    setTimeout(() => {
      expect(handleComplete).toHaveBeenCalled();
      done();
    }, 150);
  });

  // TODO: Test animation timing
  // TODO: Test with different durations
});
