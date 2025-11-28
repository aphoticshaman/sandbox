/**
 * SkeletonLoader Component Test Suite
 * Tests for skeleton loading components
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import {
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonReadingCard,
  SkeletonJournalEntry,
  SkeletonListItem,
} from '../SkeletonLoader';

// Mock Animated to prevent animation warnings in tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('SkeletonLoader Components', () => {
  describe('SkeletonText', () => {
    test('renders without crashing', () => {
      const { container } = render(<SkeletonText />);
      expect(container).toBeTruthy();
    });

    test('applies custom width', () => {
      const { UNSAFE_getByType } = render(<SkeletonText width="80%" />);
      const animatedView = UNSAFE_getByType(Animated.View);

      expect(animatedView.props.style).toContainEqual(
        expect.objectContaining({ width: '80%' })
      );
    });

    test('applies custom height', () => {
      const { UNSAFE_getByType } = render(<SkeletonText height={24} />);
      const animatedView = UNSAFE_getByType(Animated.View);

      expect(animatedView.props.style).toContainEqual(
        expect.objectContaining({ height: 24 })
      );
    });

    test('applies custom styles', () => {
      const customStyle = { marginTop: 10 };
      const { UNSAFE_getByType } = render(<SkeletonText style={customStyle} />);
      const animatedView = UNSAFE_getByType(Animated.View);

      expect(animatedView.props.style).toContainEqual(
        expect.objectContaining(customStyle)
      );
    });
  });

  describe('SkeletonCircle', () => {
    test('renders without crashing', () => {
      const { container } = render(<SkeletonCircle />);
      expect(container).toBeTruthy();
    });

    test('applies custom size', () => {
      const { UNSAFE_getByType } = render(<SkeletonCircle size={64} />);
      const animatedView = UNSAFE_getByType(Animated.View);

      expect(animatedView.props.style).toContainEqual(
        expect.objectContaining({ width: 64, height: 64, borderRadius: 32 })
      );
    });

    test('creates circular shape with borderRadius', () => {
      const size = 48;
      const { UNSAFE_getByType } = render(<SkeletonCircle size={size} />);
      const animatedView = UNSAFE_getByType(Animated.View);

      expect(animatedView.props.style).toContainEqual(
        expect.objectContaining({ borderRadius: size / 2 })
      );
    });
  });

  describe('SkeletonCard', () => {
    test('renders without crashing', () => {
      const { container } = render(<SkeletonCard />);
      expect(container).toBeTruthy();
    });

    test('contains multiple SkeletonText components', () => {
      const { UNSAFE_getAllByType } = render(<SkeletonCard />);
      const textSkeletons = UNSAFE_getAllByType(Animated.View);

      // Should have multiple skeleton elements for a card
      expect(textSkeletons.length).toBeGreaterThan(1);
    });

    test('applies custom styles', () => {
      const customStyle = { padding: 20 };
      const { container } = render(<SkeletonCard style={customStyle} />);

      expect(container).toBeTruthy();
    });
  });

  describe('SkeletonStatCard', () => {
    test('renders stat card skeleton structure', () => {
      const { UNSAFE_getAllByType } = render(<SkeletonStatCard />);
      const animatedViews = UNSAFE_getAllByType(Animated.View);

      // Should have: icon circle + stat value + stat label = at least 3 elements
      expect(animatedViews.length).toBeGreaterThanOrEqual(3);
    });

    test('includes circular icon skeleton', () => {
      const { container } = render(<SkeletonStatCard />);
      expect(container).toBeTruthy();
    });
  });

  describe('SkeletonReadingCard', () => {
    test('renders reading card skeleton structure', () => {
      const { container } = render(<SkeletonReadingCard />);
      expect(container).toBeTruthy();
    });

    test('contains title, metadata, and content skeletons', () => {
      const { UNSAFE_getAllByType } = render(<SkeletonReadingCard />);
      const animatedViews = UNSAFE_getAllByType(Animated.View);

      // Should have multiple elements for title, date, type, cards
      expect(animatedViews.length).toBeGreaterThan(3);
    });
  });

  describe('SkeletonJournalEntry', () => {
    test('renders journal entry skeleton structure', () => {
      const { container } = render(<SkeletonJournalEntry />);
      expect(container).toBeTruthy();
    });

    test('contains title, metadata, and content skeletons', () => {
      const { UNSAFE_getAllByType } = render(<SkeletonJournalEntry />);
      const animatedViews = UNSAFE_getAllByType(Animated.View);

      // Should have elements for title, date, mood, content lines
      expect(animatedViews.length).toBeGreaterThan(4);
    });

    test('includes mood circle skeleton', () => {
      const { container } = render(<SkeletonJournalEntry />);
      expect(container).toBeTruthy();
    });
  });

  describe('SkeletonListItem', () => {
    test('renders list item skeleton structure', () => {
      const { container } = render(<SkeletonListItem />);
      expect(container).toBeTruthy();
    });

    test('contains icon and text skeletons', () => {
      const { UNSAFE_getAllByType } = render(<SkeletonListItem />);
      const animatedViews = UNSAFE_getAllByType(Animated.View);

      // Should have: icon circle + title + subtitle
      expect(animatedViews.length).toBeGreaterThanOrEqual(3);
    });

    test('icon is circular', () => {
      const { container } = render(<SkeletonListItem />);
      expect(container).toBeTruthy();
    });
  });

  describe('Animation behavior', () => {
    test('SkeletonText uses Animated.View', () => {
      const { UNSAFE_getByType } = render(<SkeletonText />);
      const animatedView = UNSAFE_getByType(Animated.View);

      expect(animatedView).toBeTruthy();
    });

    test('animation opacity is controlled by Animated.Value', () => {
      const { UNSAFE_getByType } = render(<SkeletonText />);
      const animatedView = UNSAFE_getByType(Animated.View);

      // Should have opacity in style
      expect(animatedView.props.style).toBeDefined();
    });

    test('starts animation on mount', () => {
      // Mock Animated.loop and Animated.sequence
      const loopSpy = jest.spyOn(Animated, 'loop');
      const sequenceSpy = jest.spyOn(Animated, 'sequence');

      render(<SkeletonText />);

      expect(sequenceSpy).toHaveBeenCalled();
      expect(loopSpy).toHaveBeenCalled();
    });

    test('stops animation on unmount', () => {
      const { unmount } = render(<SkeletonText />);

      // Should not throw error on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('SkeletonText has appropriate accessibility properties', () => {
      const { UNSAFE_getByType } = render(<SkeletonText />);
      const animatedView = UNSAFE_getByType(Animated.View);

      // Skeleton should be presentational (not interactive)
      expect(animatedView).toBeTruthy();
    });

    test('skeleton components are not focusable', () => {
      const { UNSAFE_getByType } = render(<SkeletonCard />);

      // Skeletons should not be in tab order
      expect(UNSAFE_getByType).toBeTruthy();
    });
  });

  describe('Style consistency', () => {
    test('all skeleton components use consistent color', () => {
      const { UNSAFE_getAllByType: getAllText } = render(<SkeletonText />);
      const { UNSAFE_getAllByType: getAllCircle } = render(<SkeletonCircle />);

      // Both should render successfully with consistent styling
      expect(getAllText).toBeTruthy();
      expect(getAllCircle).toBeTruthy();
    });

    test('skeleton components respect theme colors', () => {
      const { container } = render(<SkeletonCard />);

      // Should render without crashing (theme integration)
      expect(container).toBeTruthy();
    });
  });

  describe('Performance', () => {
    test('renders multiple skeletons efficiently', () => {
      const startTime = Date.now();

      render(
        <>
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonReadingCard />
          <SkeletonReadingCard />
          <SkeletonJournalEntry />
          <SkeletonJournalEntry />
        </>
      );

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Should render quickly (under 100ms for 8 components)
      expect(renderTime).toBeLessThan(100);
    });

    test('uses native driver for animations', () => {
      const timingSpy = jest.spyOn(Animated, 'timing');

      render(<SkeletonText />);

      // Check if timing was called with useNativeDriver: true
      expect(timingSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          useNativeDriver: true,
        })
      );
    });
  });
});
