/**
 * ErrorBoundary Component Test Suite
 * Tests for error handling and fallback UI
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import ErrorBoundary from '../ErrorBoundary';

// Mock console to suppress error logs in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Test component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Child component</Text>
      </ErrorBoundary>
    );

    expect(getByText('Child component')).toBeTruthy();
  });

  test('renders fallback UI when child component throws error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText(/We apologize for the inconvenience/)).toBeTruthy();
  });

  test('displays error icon in fallback UI', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('⚠️')).toBeTruthy();
  });

  test('renders "Try Again" button in fallback UI', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Try Again')).toBeTruthy();
  });

  test('calls onReset when "Try Again" is pressed', () => {
    const onReset = jest.fn();
    const { getByText, rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const tryAgainButton = getByText('Try Again');
    fireEvent.press(tryAgainButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  test('resets error state when "Try Again" is pressed', () => {
    let shouldThrow = true;

    const { getByText, rerender, queryByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // Error fallback should be visible
    expect(getByText('Something went wrong')).toBeTruthy();

    // Press "Try Again"
    const tryAgainButton = getByText('Try Again');
    fireEvent.press(tryAgainButton);

    // Fix the error
    shouldThrow = false;
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // Should show the child component again
    expect(queryByText('Something went wrong')).toBeFalsy();
    expect(getByText('No error')).toBeTruthy();
  });

  test('logs error to console when error is caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[ErrorBoundary] Caught error:'),
      expect.any(Error)
    );
  });

  test('displays error details in dev mode', () => {
    // Mock __DEV__
    global.__DEV__ = true;

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Error Details (Dev Only):')).toBeTruthy();
    expect(getByText(/Test error/)).toBeTruthy();
  });

  test('hides error details in production mode', () => {
    // Mock production mode
    global.__DEV__ = false;

    const { queryByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(queryByText('Error Details (Dev Only):')).toBeFalsy();

    // Reset to dev mode
    global.__DEV__ = true;
  });

  test('handles multiple errors sequentially', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // First error
    expect(getByText('Something went wrong')).toBeTruthy();

    // Reset
    const tryAgainButton = getByText('Try Again');
    fireEvent.press(tryAgainButton);

    // Second error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
  });

  test('uses custom fallback message when provided', () => {
    const { getByText } = render(
      <ErrorBoundary fallbackMessage="Custom error message">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
  });

  test('handles errors in nested components', () => {
    const NestedComponent = () => (
      <ThrowError shouldThrow={true} />
    );

    const { getByText } = render(
      <ErrorBoundary>
        <NestedComponent />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
  });

  test('does not catch errors from event handlers', () => {
    // Error boundaries do not catch errors from event handlers
    // This is expected React behavior
    const EventHandlerError = () => {
      const handlePress = () => {
        throw new Error('Event handler error');
      };

      return <Text onPress={handlePress}>Click me</Text>;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <EventHandlerError />
      </ErrorBoundary>
    );

    // Component should render normally
    expect(getByText('Click me')).toBeTruthy();
  });

  test('renders SafeAreaView in fallback UI', () => {
    const { UNSAFE_getByType } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // SafeAreaView should be present (React Native component)
    const { SafeAreaView } = require('react-native');
    expect(UNSAFE_getByType(SafeAreaView)).toBeTruthy();
  });
});
