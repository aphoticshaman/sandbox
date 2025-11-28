/**
 * AUTH SCREEN - Sign In / Sign Up
 * Features Google OAuth + Email/Password with ToS acceptance
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Linking,
  Modal,
} from 'react-native';

// Conditional import - only load on web when package is available
let Turnstile = null;
if (Platform.OS === 'web') {
  try {
    Turnstile = require('@marsidev/react-turnstile').default;
  } catch (e) {
    console.warn('[AuthScreen] Turnstile package not available:', e.message);
  }
}
import { auth } from '../services/supabase';
import { CosmicParticles } from '../web';
import { COSMIC } from '../components/VeilPathDesign';

// Cloudflare Turnstile Site Key
const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || '';

// Legal URLs - update these with your actual URLs
const TERMS_URL = 'https://veilpath.app/terms';
const PRIVACY_URL = 'https://veilpath.app/privacy';

export default function AuthScreen({ navigation, route }) {
  const initialMode = route?.params?.mode || 'signin';

  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Email verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Refs for input focus management
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const captchaRef = useRef(null);

  const isSignUp = mode === 'signup';

  // Listen for auth state changes (handles Google OAuth callback)
  useEffect(() => {
    const subscription = auth.onAuthStateChange((event, session) => {
      console.log('[AuthScreen] Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session) {
        // User just signed in (OAuth callback or email/pw)
        console.log('[AuthScreen] User signed in, navigating to MainApp');
        navigation.replace('MainApp');
      }
    });

    // Also check for existing session on mount (in case they're already logged in)
    auth.getSession().then(({ session }) => {
      if (session) {
        console.log('[AuthScreen] Existing session found, navigating to MainApp');
        navigation.replace('MainApp');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigation]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Load remembered email on mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      const rememberedEmail = localStorage.getItem('veilpath_remembered_email');
      if (rememberedEmail) {
        setEmail(rememberedEmail);
      }
    }
  }, []);

  // Update document title on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = isSignUp ? 'VeilPath - Create Account' : 'VeilPath - Sign In';
    }
  }, [isSignUp]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  // Google OAuth handler
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { error: oauthError } = await auth.signInWithGoogle();

      if (oauthError) {
        setError(oauthError.message);
      }
      // If successful, Supabase will redirect to Google
      // The auth state listener in App.js will handle the callback
    } catch (err) {
      console.error('[AuthScreen] Google OAuth error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Email/Password handler
  const handleSubmit = async () => {
    setError('');

    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    console.log('[AuthScreen] Submit pressed - email length:', trimmedEmail.length, 'password length:', trimmedPassword.length);

    // Validation
    if (!trimmedEmail || !trimmedPassword) {
      console.log('[AuthScreen] Validation failed - empty fields');
      setError('Email and password are required');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(trimmedPassword)) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (isSignUp) {
      if (trimmedPassword !== confirmPassword.trim()) {
        setError('Passwords do not match');
        return;
      }

      // Require ToS acceptance for signup
      if (!acceptedTerms) {
        setError('Please accept the Terms of Service and Privacy Policy');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { user, error: signUpError } = await auth.signUp(trimmedEmail, trimmedPassword, captchaToken);

        if (signUpError) {
          setError(signUpError.message);
          captchaRef.current?.reset();
          setCaptchaToken(null);
          setLoading(false);
          return;
        }

        // Show verification modal instead of generic alert
        setVerificationEmail(email);
        setShowVerificationModal(true);
        setResendCooldown(60); // 60 second cooldown before resend

      } else {
        const { user, session, error: signInError } = await auth.signIn(trimmedEmail, trimmedPassword, captchaToken);

        if (signInError) {
          // Check for unverified email error
          if (signInError.message?.includes('Email not confirmed')) {
            setVerificationEmail(email);
            setShowVerificationModal(true);
            setLoading(false);
            return;
          }
          setError(signInError.message);
          captchaRef.current?.reset();
          setCaptchaToken(null);
          setLoading(false);
          return;
        }

        // Check if email is verified
        if (!user.email_confirmed_at) {
          setVerificationEmail(email);
          setShowVerificationModal(true);
          await auth.signOut();
          setLoading(false);
          return;
        }

        // Save email for "Remember Me"
        if (Platform.OS === 'web') {
          localStorage.setItem('veilpath_remembered_email', email);
        }

        navigation.replace('MainApp');
      }
    } catch (err) {
      console.error('[AuthScreen] Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    const { error: resendError } = await auth.resendVerificationEmail(verificationEmail);
    setLoading(false);

    if (resendError) {
      setError(resendError.message);
    } else {
      setResendCooldown(60);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { error: resetError } = await auth.resetPassword(email);
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setError('');
      // Show success in a less intrusive way
      if (Platform.OS === 'web') {
        alert('Check your email for a password reset link.');
      }
    }
  };

  const toggleMode = () => {
    setMode(isSignUp ? 'signin' : 'signup');
    setError('');
    setPassword('');
    setConfirmPassword('');
    setAcceptedTerms(false);
  };

  const openLink = (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  // Email Verification Modal
  const VerificationModal = () => (
    <Modal
      visible={showVerificationModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowVerificationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalIcon}>📧</Text>
          <Text style={styles.modalTitle}>Verify Your Email</Text>

          <Text style={styles.modalText}>
            We sent a verification link to:
          </Text>
          <Text style={styles.modalEmail}>{verificationEmail}</Text>

          <Text style={styles.modalInstructions}>
            Click the link in your email to activate your account.
            Check your spam folder if you don't see it.
          </Text>

          <TouchableOpacity
            style={[
              styles.modalButton,
              resendCooldown > 0 && styles.modalButtonDisabled
            ]}
            onPress={handleResendVerification}
            disabled={resendCooldown > 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.modalButtonText}>
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Verification Email'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalDismiss}
            onPress={() => {
              setShowVerificationModal(false);
              setMode('signin');
              setPassword('');
              setConfirmPassword('');
            }}
          >
            <Text style={styles.modalDismissText}>
              I'll verify later - take me to sign in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ImageBackground
      source={require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__6452324a-78d8-48ee-9228-85601e1010ef_0.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={Platform.OS === 'web' ? styles.backgroundImageWeb : {}}
    >
      {Platform.OS === 'web' && <CosmicParticles count={30} />}

      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>VEILPATH</Text>
              <View style={styles.divider} />
              <Text style={styles.tagline}>
                {isSignUp ? 'Begin Your Journey' : 'Welcome Back, Seeker'}
              </Text>
            </View>

            {/* Auth Form */}
            <View style={styles.formContainer}>
              <View style={styles.form}>

                {/* Google OAuth Button - PRIMARY */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  activeOpacity={0.8}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#333" />
                  ) : (
                    <>
                      <Text style={styles.googleIcon}>G</Text>
                      <Text style={styles.googleButtonText}>
                        Continue with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.orDivider}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete={isSignUp ? 'password-new' : 'password'}
                    editable={!loading}
                    returnKeyType={isSignUp ? 'next' : 'go'}
                    onSubmitEditing={() => {
                      if (isSignUp) {
                        confirmPasswordInputRef.current?.focus();
                      } else {
                        handleSubmit();
                      }
                    }}
                    blurOnSubmit={!isSignUp}
                  />
                </View>

                {/* Confirm Password (Sign Up Only) */}
                {isSignUp && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      ref={confirmPasswordInputRef}
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="password-new"
                      editable={!loading}
                      returnKeyType="go"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>
                )}

                {/* Terms of Service Checkbox (Sign Up Only) */}
                {isSignUp && (
                  <TouchableOpacity
                    onPress={() => setAcceptedTerms(!acceptedTerms)}
                    style={styles.termsContainer}
                    disabled={loading}
                  >
                    <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                      {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.termsText}>
                      I agree to the{' '}
                      <Text
                        style={styles.termsLink}
                        onPress={() => openLink(TERMS_URL)}
                      >
                        Terms of Service
                      </Text>
                      {' '}and{' '}
                      <Text
                        style={styles.termsLink}
                        onPress={() => openLink(PRIVACY_URL)}
                      >
                        Privacy Policy
                      </Text>
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Error Message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Cloudflare Turnstile CAPTCHA (Web only, signup only) */}
                {Platform.OS === 'web' && TURNSTILE_SITE_KEY && Turnstile && isSignUp && (
                  <View style={styles.captchaContainer}>
                    <Turnstile
                      ref={captchaRef}
                      siteKey={TURNSTILE_SITE_KEY}
                      onSuccess={(token) => setCaptchaToken(token)}
                      onError={() => {
                        setCaptchaToken(null);
                        setError('CAPTCHA verification failed. Please try again.');
                      }}
                      onExpire={() => setCaptchaToken(null)}
                      options={{
                        theme: 'dark',
                        size: 'normal',
                      }}
                    />
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading || googleLoading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Forgot Password (Sign In Only) */}
                {!isSignUp && (
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={loading}
                    style={styles.forgotButton}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}

                {/* Toggle Mode */}
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleText}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  </Text>
                  <TouchableOpacity onPress={toggleMode} disabled={loading}>
                    <Text style={styles.toggleLink}>
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Text style={styles.securityText}>
                🔒 Your data is encrypted and secure
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <VerificationModal />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: Platform.OS === 'web' ? {
    height: '100vh',
    width: '100vw',
    position: 'relative',
  } : {
    flex: 1,
  },
  backgroundImageWeb: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.7)',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
    }),
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: COSMIC.candleFlame,
    textShadowColor: COSMIC.brassVictorian,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
    letterSpacing: 8,
  },
  divider: {
    width: 200,
    height: 2,
    backgroundColor: COSMIC.deepAmethyst,
    marginVertical: 12,
    shadowColor: COSMIC.deepAmethyst,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    color: COSMIC.moonGlow,
    fontWeight: '300',
    letterSpacing: 2,
  },
  formContainer: {
    alignItems: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(45, 27, 78, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: 25,
    shadowColor: COSMIC.midnightVoid,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
    }),
  },
  // Google OAuth Button
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  // Or Divider
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  orText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    paddingHorizontal: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(10, 10, 15, 0.6)',
    borderWidth: 2,
    borderColor: COSMIC.deepAmethyst,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COSMIC.moonGlow,
  },
  // Terms Checkbox
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    marginTop: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: COSMIC.deepAmethyst,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 2,
    backgroundColor: 'rgba(10, 10, 15, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COSMIC.deepAmethyst,
    borderColor: COSMIC.etherealCyan,
  },
  checkmark: {
    color: COSMIC.etherealCyan,
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    color: COSMIC.crystalPink,
    fontSize: 13,
    lineHeight: 20,
  },
  termsLink: {
    color: COSMIC.etherealCyan,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: '#8B0000',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  errorText: {
    color: COSMIC.crystalPink,
    fontSize: 14,
    textAlign: 'center',
  },
  captchaContainer: {
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: COSMIC.deepAmethyst,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COSMIC.candleFlame,
    shadowColor: COSMIC.candleFlame,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    letterSpacing: 2,
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotText: {
    color: COSMIC.etherealCyan,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 5,
  },
  toggleText: {
    color: COSMIC.crystalPink,
    fontSize: 14,
  },
  toggleLink: {
    color: COSMIC.etherealCyan,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  securityNotice: {
    marginTop: 25,
    alignItems: 'center',
  },
  securityText: {
    color: COSMIC.etherealCyan,
    fontSize: 12,
    opacity: 0.8,
  },
  // Verification Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COSMIC.midnightVoid,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COSMIC.deepAmethyst,
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    textAlign: 'center',
    marginBottom: 5,
  },
  modalEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.etherealCyan,
    marginBottom: 20,
  },
  modalInstructions: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: COSMIC.deepAmethyst,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: COSMIC.candleFlame,
    marginBottom: 15,
    minWidth: 250,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: COSMIC.moonGlow,
    fontSize: 14,
    fontWeight: '600',
  },
  modalDismiss: {
    paddingVertical: 10,
  },
  modalDismissText: {
    color: COSMIC.etherealCyan,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
