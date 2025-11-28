/**
 * FloatingParticle Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Canvas } from '@shopify/react-native-skia';
import { FloatingParticle } from './FloatingParticleSkia';

jest.mock('../../contexts/SkiaDimensionsContext', () => ({
  useSkiaDimensions: () => ({ width: 375, height: 812 }),
}));

describe('FloatingParticle', () => {
  it('renders particle', () => {
    const { container } = render(
      <Canvas style={{ width: 100, height: 100 }}>
        <FloatingParticle x={50} y={50} />
      </Canvas>
    );
    expect(container).toBeTruthy();
  });

  it('handles animation props', () => {
    const { container } = render(
      <Canvas style={{ width: 100, height: 100 }}>
        <FloatingParticle x={25} y={25} duration={1000} delay={500} />
      </Canvas>
    );
    expect(container).toBeTruthy();
  });

  // TODO: Test animation behavior
  // TODO: Test performance with many particles
});
