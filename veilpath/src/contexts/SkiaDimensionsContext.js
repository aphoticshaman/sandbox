/**
 * SkiaDimensionsContext - Provides responsive dimensions to all components
 *
 * This context wraps useWindowDimensions() and provides safe access to screen dimensions
 * for both React components and Skia canvas components.
 *
 * WHY THIS WORKS (when direct useWindowDimensions doesn't):
 * - Context Provider is a React component (not module-level code)
 * - useWindowDimensions() called AFTER React runtime is ready
 * - No destructuring at module level - all property access happens in render phase
 * - Children receive dimensions via context, not by calling hook directly
 *
 * USAGE:
 *
 * In App.js:
 * ```
 * import { SkiaDimensionsProvider } from './src/contexts/SkiaDimensionsContext';
 *
 * export default function App() {
 *   return (
 *     <SkiaDimensionsProvider>
 *       <NavigationContainer>
 *         ...
 *       </NavigationContainer>
 *     </SkiaDimensionsProvider>
 *   );
 * }
 * ```
 *
 * In components:
 * ```
 * import { useSkiaDimensions } from '../contexts/SkiaDimensionsContext';
 *
 * function MyComponent() {
 *   const { width, height } = useSkiaDimensions();
 *   // Use width and height safely
 * }
 * ```
 */

import React, { createContext, useContext } from 'react';

const SkiaDimensionsContext = createContext(null);

/**
 * Provider component that wraps the app and provides dimensions
 *
 * TEMPORARY: Returns static dimensions to work around Hermes engine issues
 * with useWindowDimensions() and property access timing
 */
export function SkiaDimensionsProvider({ children }) {
  // TEMPORARY: Static dimensions until Hermes property access issues are resolved
  // useWindowDimensions() causes "Property 'width' doesn't exist" errors in Hermes
  const safeDimensions = {
    width: 375,    // iPhone standard width
    height: 812,   // iPhone standard height
    scale: 2,
    fontScale: 1,
  };

  return (
    <SkiaDimensionsContext.Provider value={safeDimensions}>
      {children}
    </SkiaDimensionsContext.Provider>
  );
}

/**
 * Hook to access screen dimensions from anywhere in the component tree
 *
 * @returns {{ width: number, height: number, scale: number, fontScale: number }}
 * @throws {Error} If used outside SkiaDimensionsProvider
 */
export function useSkiaDimensions() {
  const context = useContext(SkiaDimensionsContext);

  if (!context) {
    throw new Error(
      'useSkiaDimensions must be used within SkiaDimensionsProvider. ' +
      'Make sure your App.js wraps components with <SkiaDimensionsProvider>.'
    );
  }

  return context;
}

/**
 * Higher-order component that injects dimensions as props
 *
 * Useful for class components or when you want dimensions as props
 *
 * @example
 * ```
 * const MyComponent = withSkiaDimensions(({ width, height, children }) => (
 *   <View style={{ width, height }}>{children}</View>
 * ));
 * ```
 */
export function withSkiaDimensions(Component) {
  return function WithSkiaDimensionsWrapper(props) {
    const dimensions = useSkiaDimensions();
    return <Component {...props} {...dimensions} />;
  };
}
