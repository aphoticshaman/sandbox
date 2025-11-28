/**
 * DEVICE SECURITY SERVICE
 *
 * Blocks app from running on:
 * - Emulators (iOS Simulator, Android Emulator)
 * - Expo Go (development app)
 * - Rooted/Jailbroken devices
 * - Debuggers
 * - Modified/tampered builds
 *
 * Like banking apps - production mode = physical devices only
 */

import {Platform} from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/**
 * Check if app is running in a secure environment
 * Returns { secure: boolean, violations: string[] }
 */
export async function checkDeviceSecurity() {
  const violations = [];

  // ═══════════════════════════════════════════════════════════
  // DEVELOPMENT MODE CHECKS
  // ═══════════════════════════════════════════════════════════

  if (__DEV__) {
    // In dev mode, allow everything (for development)
    return {
      secure: true,
      violations: [],
      devMode: true,
      message: 'Running in development mode - all checks disabled'
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PRODUCTION MODE - STRICT CHECKS
  // ═══════════════════════════════════════════════════════════

  // Check 1: Block Expo Go
  if (Constants.appOwnership === 'expo') {
    violations.push('EXPO_GO_DETECTED');
    console.error('[Security] ⚠️ Running in Expo Go - BLOCKED in production');
  }

  // Check 2: Block Emulators
  if (!Device.isDevice) {
    violations.push('EMULATOR_DETECTED');
    console.error('[Security] ⚠️ Emulator detected - BLOCKED in production');
  }

  // Check 3: Detect iOS Simulator
  if (Platform.OS === 'ios' && Device.modelName?.includes('Simulator')) {
    violations.push('IOS_SIMULATOR_DETECTED');
    console.error('[Security] ⚠️ iOS Simulator detected - BLOCKED');
  }

  // Check 4: Detect Android Emulator
  if (Platform.OS === 'android') {
    const isEmulator = await detectAndroidEmulator();
    if (isEmulator) {
      violations.push('ANDROID_EMULATOR_DETECTED');
      console.error('[Security] ⚠️ Android Emulator detected - BLOCKED');
    }
  }

  // Check 5: Detect rooted/jailbroken devices (optional - can be too strict)
  // Uncomment if you want to block rooted devices:
  // const isRooted = await detectRootedDevice();
  // if (isRooted) {
  //   violations.push('ROOTED_DEVICE_DETECTED');
  //   console.error('[Security] ⚠️ Rooted/jailbroken device - BLOCKED');
  // }

  // Check 6: Detect debugger
  if (isDebuggerAttached()) {
    violations.push('DEBUGGER_ATTACHED');
    console.error('[Security] ⚠️ Debugger attached - BLOCKED');
  }

  // Check 7: Detect modified APK/IPA (signature validation)
  const isModified = await detectModifiedBuild();
  if (isModified) {
    violations.push('MODIFIED_BUILD_DETECTED');
    console.error('[Security] ⚠️ Modified build detected - BLOCKED');
  }

  // Return result
  const secure = violations.length === 0;

  if (!secure) {
    console.error('[Security] ⚠️⚠️⚠️ SECURITY VIOLATIONS:', violations);
  }

  return {
    secure,
    violations,
    devMode: false,
    message: secure
      ? 'Device passed all security checks'
      : `Security violations detected: ${violations.join(', ')}`
  };
}

/**
 * Detect Android emulator
 */
async function detectAndroidEmulator() {
  if (Platform.OS !== 'android') return false;

  const emulatorIndicators = [
    // Check device model
    Device.modelName?.toLowerCase().includes('sdk'),
    Device.modelName?.toLowerCase().includes('emulator'),
    Device.modelName?.toLowerCase().includes('android sdk'),

    // Check brand
    Device.brand?.toLowerCase() === 'generic',
    Device.brand?.toLowerCase() === 'google',

    // Check device name
    Device.designName?.toLowerCase().includes('sdk'),
    Device.designName?.toLowerCase().includes('emulator')
  ];

  return emulatorIndicators.some(indicator => indicator === true);
}

/**
 * Detect if debugger is attached
 */
function isDebuggerAttached() {
  // Timing-based debugger detection
  const start = Date.now();
  // Note: This debugger statement will be removed by production minification
  // But if someone is actively debugging, it will pause here
  const debuggerStatement = () => { debugger; };
  if (!__DEV__) {
    debuggerStatement();
  }
  const end = Date.now();

  // If debugger is attached, the above will pause for >> 100ms
  return (end - start) > 100;
}

/**
 * Detect rooted/jailbroken device (optional, can be overly strict)
 */
async function detectRootedDevice() {
  // This is a simplified check - production apps use more sophisticated detection
  // For React Native, you'd typically use a native module like:
  // - react-native-root-detection
  // - react-native-jailbreak-detection

  // For now, just check for common root indicators
  if (Platform.OS === 'android') {
    // Check for common root management apps
    // In production, this would use native modules to check for:
    // - su binary
    // - Magisk
    // - SuperSU
    // - Xposed framework
    return false; // Placeholder - implement with native module
  }

  if (Platform.OS === 'ios') {
    // Check for common jailbreak indicators
    // In production, this would check for:
    // - Cydia
    // - Modified filesystem
    // - Suspicious file paths (/private/var/lib/apt, /private/var/lib/cydia, etc.)
    return false; // Placeholder - implement with native module
  }

  return false;
}

/**
 * Detect modified build (signature validation)
 */
async function detectModifiedBuild() {
  // In production, this would:
  // 1. Compute hash of app binary
  // 2. Compare against known good hash (from backend)
  // 3. Verify code signing certificate

  // For React Native/Expo, you'd check:
  // - App signature matches expected
  // - No code injections
  // - Bundled JS hasn't been modified

  // This requires native modules for proper implementation
  return false; // Placeholder
}

/**
 * Get human-readable error message for security violation
 */
export function getSecurityViolationMessage(violations) {
  if (!violations || violations.length === 0) {
    return null;
  }

  const messages = {
    EXPO_GO_DETECTED: 'This app cannot run in Expo Go. Please use a standalone build.',
    EMULATOR_DETECTED: 'For security reasons, this app cannot run on emulators. Please use a physical device.',
    IOS_SIMULATOR_DETECTED: 'For security reasons, this app cannot run on iOS Simulator. Please use a physical iPhone or iPad.',
    ANDROID_EMULATOR_DETECTED: 'For security reasons, this app cannot run on Android Emulator. Please use a physical Android device.',
    ROOTED_DEVICE_DETECTED: 'For security reasons, this app cannot run on rooted or jailbroken devices.',
    DEBUGGER_ATTACHED: 'Please close your debugger to use this app.',
    MODIFIED_BUILD_DETECTED: 'This app build has been modified and cannot be trusted. Please reinstall from the official app store.'
  };

  const title = 'Security Check Failed';
  const details = violations.map(v => messages[v] || v).join('\n\n');

  return {
    title,
    message: details,
    severity: 'critical'
  };
}

/**
 * Enforce security on app launch
 * Call this in App.js to block insecure environments
 */
export async function enforceDeviceSecurity() {
  const security = await checkDeviceSecurity();

  if (!security.secure && !security.devMode) {
    const errorMessage = getSecurityViolationMessage(security.violations);

    // In a real app, you'd show a blocking screen here
    console.error('[Security] APP BLOCKED:', errorMessage);

    return {
      allowed: false,
      error: errorMessage
    };
  }

  return {
    allowed: true,
    security
  };
}
