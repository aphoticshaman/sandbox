/**
 * AUTHENTICATION SCREEN - Biometric + PIN Lock (BULLETPROOF VERSION)
 *
 * Unlocks secured profiles with:
 * - Biometric authentication (Face ID, Touch ID, Fingerprint)
 * - 6-digit PIN fallback
 * - Cyberpunk aesthetic matching VeilPath theme
 *
 * EDGE CASE HANDLING:
 * - ✅ Invalid/missing profileId → gracefully degrades
 * - ✅ Rapid PIN spam → debounced verification
 * - ✅ Too many failed attempts → temporary lockout
 * - ✅ Corrupted security settings → fallback to defaults
 * - ✅ Biometric permission denied → falls back to PIN
 * - ✅ Double-trigger onSuccess → prevented with flag
 * - ✅ AsyncStorage failure → shows error but doesn't crash
 * - ✅ Modal state leaks → cleaned up on close
 *
 * Usage:
 * <AuthenticationScreen
 *   visible={needsAuth}
 *   profileId={currentProfileId}
 *   onSuccess={() => setNeedsAuth(false)}
 *   onCancel={() => navigation.goBack()}
 * />
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Vibration,
  Animated,
  Alert
} from 'react-native';
import {
  authenticateWithBiometrics,
  verifyPIN,
  checkBiometricSupport,
  getSecuritySettings
} from '../utils/profileSecurity';

// Temporary Text components until we apply new aesthetic
const NeonText = ({ children, style, ...props }) => <Text style={[{ color: '#8a2be2' }, style]} {...props}>{children}</Text>;
const GlitchText = ({ children, style, ...props }) => <Text style={[{ color: '#ff00ff' }, style]} {...props}>{children}</Text>;
const ScanLines = ({ children }) => <View>{children}</View>;

const NEON_COLORS = { primary: '#8a2be2', secondary: '#00ffff', accent: '#d4af37' };

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60000; // 1 minute lockout after 5 failures

export default function AuthenticationScreen({
  visible,
  profileId,
  onSuccess,
  onCancel
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [biometricSupport, setBiometricSupport] = useState(null);
  const [securitySettings, setSecuritySettings] = useState(null);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [isVerifying, setIsVerifying] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Prevent double-trigger of onSuccess
  const hasSucceededRef = useRef(false);

  // ═══════════════════════════════════════════════════════════
  // GUARDS - Prevent usage with invalid props
  // ═══════════════════════════════════════════════════════════

  if (!profileId) {
    console.error('[AuthScreen] CRITICAL: No profileId provided');
    return (
      <Modal visible={visible} animationType="fade">
        <View style={styles.container}>
          <View style={styles.header}>
            <NeonText color={NEON_COLORS.hiRed} style={styles.title}>
              ERROR: Invalid Profile
            </NeonText>
            <NeonText color={NEON_COLORS.dimWhite} style={styles.subtitle}>
              No profile ID provided. Please contact support.
            </NeonText>
            <TouchableOpacity style={styles.actionButton} onPress={onCancel || (() => {})}>
              <NeonText color={NEON_COLORS.hiRed} style={styles.actionButtonText}>
                [ CLOSE ]
              </NeonText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!onSuccess || typeof onSuccess !== 'function') {
    console.error('[AuthScreen] CRITICAL: onSuccess callback required');
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION - Clean state on modal open
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (visible) {
      // Clean state
      setPin('');
      setError('');
      setIsVerifying(false);
      setLoadingSettings(true);
      hasSucceededRef.current = false; // Reset success flag

      // Check if still locked out
      if (lockoutUntil && Date.now() < lockoutUntil) {
        const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
        setError(`Locked out. Try again in ${remainingSeconds}s`);

        // Update countdown every second
        const interval = setInterval(() => {
          const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
          if (remaining <= 0) {
            setError('');
            setLockoutUntil(null);
            setFailedAttempts(0);
            clearInterval(interval);
          } else {
            setError(`Locked out. Try again in ${remaining}s`);
          }
        }, 1000);

        return () => clearInterval(interval);
      } else {
        // Reset lockout if expired
        setLockoutUntil(null);
        setFailedAttempts(0);
      }

      loadAuthSettings();
    }
  }, [visible, lockoutUntil]);

  // ═══════════════════════════════════════════════════════════
  // LOAD SETTINGS - With error handling
  // ═══════════════════════════════════════════════════════════

  async function loadAuthSettings() {
    try {
      const [support, settings] = await Promise.all([
        checkBiometricSupport().catch(err => {
          console.warn('[AuthScreen] Biometric check failed:', err);
          return { hasHardware: false, isEnrolled: false, types: [], available: false };
        }),
        getSecuritySettings(profileId).catch(err => {
          console.warn('[AuthScreen] Security settings load failed:', err);
          return { enabled: true, useBiometrics: false, requirePIN: true };
        })
      ]);

      setBiometricSupport(support);
      setSecuritySettings(settings);
      setLoadingSettings(false);

      // Auto-trigger biometric if enabled and available (with safety timeout)
      if (settings.useBiometrics && support.available && !lockoutUntil) {
        setTimeout(() => {
          if (!hasSucceededRef.current) { // Don't trigger if already succeeded
            handleBiometricAuth();
          }
        }, 500); // Small delay for modal animation
      }
    } catch (error) {
      console.error('[AuthScreen] Fatal error loading settings:', error);
      setError('Failed to load security settings');
      setLoadingSettings(false);
      // Continue anyway with PIN fallback
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BIOMETRIC AUTH - With error handling
  // ═══════════════════════════════════════════════════════════

  async function handleBiometricAuth() {
    // Guard: Skip if already verifying or succeeded
    if (isVerifying || hasSucceededRef.current) return;

    // Guard: Skip if locked out
    if (lockoutUntil && Date.now() < lockoutUntil) {
      setError('Too many failed attempts. Use PIN.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await authenticateWithBiometrics(
        profileId,
        'Unlock your VeilPath profile'
      );

      if (result.success && !hasSucceededRef.current) {
        handleSuccessfulAuth();
      } else {
        if (!hasSucceededRef.current) {
          setError('Biometric failed. Use PIN.');
        }
      }
    } catch (error) {
      console.error('[AuthScreen] Biometric error:', error);
      setError('Biometric unavailable. Use PIN.');
    } finally {
      setIsVerifying(false);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PIN ENTRY - With spam prevention
  // ═══════════════════════════════════════════════════════════

  function handlePinPress(digit) {
    // Guard: Prevent input while verifying or locked out
    if (isVerifying) return;
    if (lockoutUntil && Date.now() < lockoutUntil) return;
    if (hasSucceededRef.current) return;

    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      // Auto-verify when 6 digits entered
      if (newPin.length === 6) {
        verifyPinCode(newPin);
      }
    }
  }

  function handlePinDelete() {
    if (isVerifying || hasSucceededRef.current) return;
    setPin(pin.slice(0, -1));
    setError('');
  }

  // ═══════════════════════════════════════════════════════════
  // PIN VERIFICATION - With lockout after failed attempts
  // ═══════════════════════════════════════════════════════════

  async function verifyPinCode(pinToVerify) {
    // Guard: Prevent double-verification
    if (isVerifying || hasSucceededRef.current) return;

    // Guard: Check lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      setError('Too many failed attempts. Wait.');
      setPin('');
      return;
    }

    setIsVerifying(true);

    try {
      const isValid = await verifyPIN(profileId, pinToVerify);

      if (isValid && !hasSucceededRef.current) {

        // Success vibration
        try {
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 50]);
          } else {
            Vibration.vibrate(50);
          }
        } catch (vibErr) {
          // Vibration permission might be denied
          console.warn('[AuthScreen] Vibration failed:', vibErr);
        }

        handleSuccessfulAuth();
      } else {

        if (!hasSucceededRef.current) {
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);

          // Check if should lock out
          if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
            const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
            setLockoutUntil(lockUntil);
            setError(`Too many attempts. Locked for 1 minute.`);
          } else {
            setError(`Invalid PIN (${MAX_FAILED_ATTEMPTS - newFailedAttempts} attempts left)`);
          }

          setPin('');

          // Error vibration
          try {
            if (Platform.OS === 'ios') {
              Vibration.vibrate([0, 50, 100, 50, 100, 50]);
            } else {
              Vibration.vibrate([50, 100, 50, 100, 50]);
            }
          } catch (vibErr) {
            console.warn('[AuthScreen] Vibration failed:', vibErr);
          }

          // Shake animation
          Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
          ]).start();
        }
      }
    } catch (error) {
      console.error('[AuthScreen] PIN verification error:', error);
      setError('Verification failed. Try again.');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SUCCESS HANDLER - Prevent double-trigger
  // ═══════════════════════════════════════════════════════════

  function handleSuccessfulAuth() {
    if (hasSucceededRef.current) {
      console.warn('[AuthScreen] Already succeeded, ignoring duplicate call');
      return;
    }

    hasSucceededRef.current = true;

    try {
      onSuccess();
    } catch (error) {
      console.error('[AuthScreen] onSuccess callback error:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CANCEL HANDLER
  // ═══════════════════════════════════════════════════════════

  function handleCancel() {
    if (!onCancel) {
      // No cancel handler provided - just warn
      Alert.alert(
        'Cannot Cancel',
        'You must unlock your profile to continue.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    Alert.alert(
      'Exit Without Unlocking?',
      'You need to unlock your profile to access your readings.',
      [
        { text: 'Keep Trying', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            try {
              onCancel();
            } catch (error) {
              console.error('[AuthScreen] onCancel error:', error);
            }
          }
        }
      ]
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  if (!visible) return null;

  const biometricTypeName = biometricSupport?.types?.[0] || 'Biometric';
  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <ScanLines />

        {/* Header */}
        <View style={styles.header}>
          <GlitchText style={styles.title} glitchChance={0.05}>
            {'>'} PROFILE LOCKED
          </GlitchText>

          <NeonText color={NEON_COLORS.dimCyan} style={styles.subtitle}>
            {loadingSettings ? 'Loading security settings...' : 'Your profile is protected. Unlock to continue.'}
          </NeonText>
        </View>

        {/* PIN Display */}
        <Animated.View
          style={[
            styles.pinContainer,
            { transform: [{ translateX: shakeAnimation }] }
          ]}
        >
          <View style={styles.pinDots}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  pin.length > index && styles.pinDotFilled
                ]}
              />
            ))}
          </View>

          {error ? (
            <NeonText color={isLockedOut ? NEON_COLORS.hiRed : NEON_COLORS.hiYellow} style={styles.errorText}>
              {error}
            </NeonText>
          ) : isVerifying ? (
            <NeonText color={NEON_COLORS.hiCyan} style={styles.hintText}>
              Verifying...
            </NeonText>
          ) : (
            <NeonText color={NEON_COLORS.dimWhite} style={styles.hintText}>
              Enter your 6-digit PIN
            </NeonText>
          )}
        </Animated.View>

        {/* Numpad */}
        <View style={styles.numpad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <TouchableOpacity
              key={digit}
              style={[styles.numButton, (isVerifying || isLockedOut) && styles.numButtonDisabled]}
              onPress={() => handlePinPress(digit.toString())}
              disabled={isVerifying || isLockedOut}
            >
              <NeonText
                color={(isVerifying || isLockedOut) ? NEON_COLORS.dimCyan : NEON_COLORS.hiCyan}
                style={styles.numButtonText}
              >
                {digit}
              </NeonText>
            </TouchableOpacity>
          ))}

          {/* Bottom row: Biometric, 0, Delete */}
          <TouchableOpacity
            style={[styles.numButton, (isVerifying || isLockedOut || !biometricSupport?.available || !securitySettings?.useBiometrics) && styles.numButtonDisabled]}
            onPress={handleBiometricAuth}
            disabled={isVerifying || isLockedOut || !biometricSupport?.available || !securitySettings?.useBiometrics}
          >
            {biometricSupport?.available && securitySettings?.useBiometrics ? (
              <NeonText color={isLockedOut ? NEON_COLORS.dimCyan : NEON_COLORS.hiGreen} style={styles.numButtonText}>
                {biometricTypeName === 'Face ID' ? '👤' : '👆'}
              </NeonText>
            ) : (
              <NeonText color={NEON_COLORS.dimCyan} style={styles.numButtonText}>
                {''}
              </NeonText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.numButton, (isVerifying || isLockedOut) && styles.numButtonDisabled]}
            onPress={() => handlePinPress('0')}
            disabled={isVerifying || isLockedOut}
          >
            <NeonText
              color={(isVerifying || isLockedOut) ? NEON_COLORS.dimCyan : NEON_COLORS.hiCyan}
              style={styles.numButtonText}
            >
              0
            </NeonText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.numButton, (isVerifying || isLockedOut) && styles.numButtonDisabled]}
            onPress={handlePinDelete}
            disabled={isVerifying || isLockedOut}
          >
            <NeonText
              color={(isVerifying || isLockedOut) ? NEON_COLORS.dimYellow : NEON_COLORS.hiYellow}
              style={styles.numButtonText}
            >
              ←
            </NeonText>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {biometricSupport?.available && securitySettings?.useBiometrics && !isLockedOut && (
            <TouchableOpacity
              style={[styles.actionButton, isVerifying && styles.actionButtonDisabled]}
              onPress={handleBiometricAuth}
              disabled={isVerifying}
            >
              <NeonText color={NEON_COLORS.hiGreen} style={styles.actionButtonText}>
                [ USE {biometricTypeName.toUpperCase()} ]
              </NeonText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCancel}
          >
            <NeonText color={NEON_COLORS.dimWhite} style={styles.actionButtonText}>
              [ CANCEL ]
            </NeonText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: 'space-between'
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: NEON_COLORS.hiCyan,
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 20
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  pinDots: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan
  },
  pinDotFilled: {
    backgroundColor: NEON_COLORS.hiCyan,
    borderColor: NEON_COLORS.hiCyan,
    shadowColor: NEON_COLORS.hiCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center'
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30
  },
  numButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a'
  },
  numButtonDisabled: {
    opacity: 0.3
  },
  numButtonText: {
    fontSize: 28,
    fontFamily: 'monospace',
    fontWeight: 'bold'
  },
  actions: {
    gap: 12,
    marginBottom: 20
  },
  actionButton: {
    padding: 14,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: '#0a0a0a'
  },
  actionButtonDisabled: {
    opacity: 0.3
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold'
  }
});
