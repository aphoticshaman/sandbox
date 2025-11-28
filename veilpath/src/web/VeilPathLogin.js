/**
 * VEILPATH LOGIN - WitchTok x Victorian Gothic
 * AAA-Quality Premium Login Experience
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform, ActivityIndicator, ImageBackground } from 'react-native';

const { width, height } = Dimensions.get('window');

// VeilPath Theme Colors
const THEME = {
  midnightVoid: '#0a0514',
  deepAmethyst: '#4a148c',
  moonGlow: '#e1bee7',
  crystalPink: '#f8bbd0',
  sageGreen: '#87a96b',
  candleFlame: '#ffa726',
  bloodMoon: '#8b0000',
  starlight: '#fff9c4',
  shadowPurple: '#311b92',
  brassVictorian: '#b8860b',
};

export function VeilPathLogin({ onLogin, onSignUp, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [fadeAnim] = useState(new Animated.Value(0));
  const [symbolRotation] = useState(new Animated.Value(0));
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Symbol rotation
    Animated.loop(
      Animated.timing(symbolRotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleMouseMove = (e) => {
    if (Platform.OS === 'web') {
      const x = (e.nativeEvent.clientX / width - 0.5) * 20;
      const y = (e.nativeEvent.clientY / height - 0.5) * 20;
      setMousePosition({ x, y });
    }
  };

  const spin = symbolRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (onLogin) {
        await onLogin({ email, password, rememberMe });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__6452324a-78d8-48ee-9228-85601e1010ef_2.png')}
      style={styles.container}
      resizeMode="cover"
      onMouseMove={handleMouseMove}
    >
      {/* Overlay for better text readability */}
      <View style={styles.backgroundOverlay}>
        {/* Floating Crystals */}
        {[...Array(6)].map((_, i) => (
          <Crystal key={i} delay={i * 3} left={`${10 + i * 15}%`} />
        ))}

        {/* Candle Glow Effects */}
        <View style={[styles.candleGlow, { top: '10%', left: '5%' }]} />
        <View style={[styles.candleGlow, { bottom: '20%', right: '10%' }]} />

        {/* Floating Herbs */}
        <FloatingHerb emoji="🌿" delay={0} left="15%" />
        <FloatingHerb emoji="🌾" delay={4} left="45%" />
        <FloatingHerb emoji="🌱" delay={8} left="75%" />
        <FloatingHerb emoji="🍃" delay={12} left="30%" />
      </View>

      {/* Moon Phases Header */}
      <View style={styles.moonPhases}>
        {['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'].map((moon, i) => (
          <Text key={i} style={styles.moonEmoji}>{moon}</Text>
        ))}
      </View>

      {/* Main Content with Parallax */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: Platform.OS === 'web' ? [
              { translateX: mousePosition.x },
              { translateY: mousePosition.y },
            ] : [],
          }
        ]}
      >
        {/* Victorian Gothic Card Frame */}
        <View style={styles.loginCard}>
          {/* Ornate Corners */}
          <View style={[styles.cornerOrnament, styles.topLeft]} />
          <View style={[styles.cornerOrnament, styles.topRight]} />
          <View style={[styles.cornerOrnament, styles.bottomLeft]} />
          <View style={[styles.cornerOrnament, styles.bottomRight]} />

          {/* Streak Badge */}
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 2,847 ON STREAKS</Text>
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            {/* Rotating Mystical Symbol */}
            <Animated.View style={[styles.mysticalSymbol, { transform: [{ rotate: spin }] }]}>
              <MysticalSymbolSVG />
            </Animated.View>

            <Text style={styles.logo}>VEILPATH</Text>
            <Text style={styles.tagline}>Your Mystical Wellness Grimoire</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputIcon, emailFocused && styles.inputIconFocused]}>✉️</Text>
              <TextInput
                style={[styles.mysticalInput, emailFocused && styles.mysticalInputFocused]}
                placeholder="Coven Email Address"
                placeholderTextColor="rgba(225, 190, 231, 0.4)"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputIcon, passwordFocused && styles.inputIconFocused]}>🔮</Text>
              <TextInput
                style={[styles.mysticalInput, passwordFocused && styles.mysticalInputFocused]}
                placeholder="Sacred Password"
                placeholderTextColor="rgba(225, 190, 231, 0.4)"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
                autoComplete="current-password"
              />
            </View>

            {/* Remember Me / Forgot Password */}
            <View style={styles.rememberSection}>
              <TouchableOpacity
                style={styles.mysticalCheckbox}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkboxInput, rememberMe && styles.checkboxInputChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✨</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Keep me in the circle</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onForgotPassword}>
                <Text style={styles.forgotLink}>Forgot spell?</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.9}
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              disabled={isLoading}
            >
              <View style={styles.buttonShine} />
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginBtnText}>ENTER THE VEIL</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpSection}>
              <Text style={styles.signUpText}>New to the coven? </Text>
              <TouchableOpacity onPress={onSignUp}>
                <Text style={styles.signUpLink}>Join us</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <FeaturePill icon="📜" text="78 Tarot Cards" />
            <FeaturePill icon="🌙" text="Moon Tracking" />
            <FeaturePill icon="📝" text="Journal Streaks" />
            <FeaturePill icon="🏆" text="Coven Battles" />
          </View>

          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingSpinner} />
            </View>
          )}
        </View>
      </Animated.View>
    </ImageBackground>
  );
}

// Floating Crystal Component
function Crystal({ delay, left }) {
  const [animValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const startAnimation = () => {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }).start(() => startAnimation());
    };

    const timeout = setTimeout(startAnimation, delay * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height + 50, -100],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.8, 0.8, 0],
  });

  const rotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.crystal,
        {
          left,
          opacity,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    />
  );
}

// Floating Herb Component
function FloatingHerb({ emoji, delay, left }) {
  const [animValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const startAnimation = () => {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      }).start(() => startAnimation());
    };

    const timeout = setTimeout(startAnimation, delay * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height + 50, -100],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.6, 0.6, 0],
  });

  const rotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.herb,
        {
          left,
          opacity,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

// Feature Pill Component
function FeaturePill({ icon, text }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

// Mystical Symbol SVG Component
function MysticalSymbolSVG() {
  if (Platform.OS === 'web') {
    return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="symbolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={THEME.moonGlow} stopOpacity="1" />
            <stop offset="50%" stopColor={THEME.candleFlame} stopOpacity="1" />
            <stop offset="100%" stopColor={THEME.moonGlow} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" stroke="url(#symbolGrad)" strokeWidth="1" fill="none"/>
        <path d="M50,10 L61,40 L90,40 L65,60 L76,90 L50,70 L24,90 L35,60 L10,40 L39,40 Z"
              stroke="url(#symbolGrad)" strokeWidth="2" fill="none"/>
        <circle cx="50" cy="50" r="15" stroke="url(#symbolGrad)" strokeWidth="1" fill="none"/>
      </svg>
    );
  }
  // Fallback for non-web platforms
  return (
    <View style={styles.symbolFallback}>
      <Text style={styles.symbolText}>⭐</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 5, 20, 0.6)',
    zIndex: 0,
  },
  crystal: {
    position: 'absolute',
    width: 4,
    height: 8,
    backgroundColor: THEME.crystalPink,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  herb: {
    position: 'absolute',
    fontSize: 20,
  },
  candleGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
  },
  moonPhases: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    zIndex: 5,
    opacity: 0.6,
  },
  moonEmoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 10,
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px) saturate(1.5)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
    } : {}),
    borderWidth: 2,
    borderColor: THEME.brassVictorian,
    borderRadius: 20,
    padding: 40,
    position: 'relative',
    shadowColor: THEME.deepAmethyst,
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 20,
  },
  cornerOrnament: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: THEME.brassVictorian,
    opacity: 0.6,
  },
  topLeft: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  streakBadge: {
    position: 'absolute',
    top: -15,
    right: -15,
    backgroundColor: THEME.candleFlame,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: THEME.bloodMoon,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  streakText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mysticalSymbol: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  symbolFallback: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 50,
    color: THEME.candleFlame,
  },
  logo: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 4,
    color: THEME.moonGlow,
    marginBottom: 5,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    textShadowColor: 'rgba(225, 190, 231, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  tagline: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 3,
    opacity: 0.7,
    color: THEME.crystalPink,
  },
  form: {
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    top: '50%',
    transform: [{ translateY: -9 }],
    fontSize: 18,
    opacity: 0.6,
    zIndex: 1,
  },
  inputIconFocused: {
    opacity: 1,
  },
  mysticalInput: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingLeft: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(225, 190, 231, 0.2)',
    borderRadius: 10,
    color: THEME.moonGlow,
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'Montserrat, sans-serif' : 'System',
  },
  mysticalInputFocused: {
    borderColor: THEME.candleFlame,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    shadowColor: THEME.candleFlame,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  rememberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  mysticalCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxInput: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: 'rgba(225, 190, 231, 0.3)',
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInputChecked: {
    backgroundColor: THEME.deepAmethyst,
    borderColor: THEME.candleFlame,
  },
  checkmark: {
    fontSize: 10,
  },
  checkboxLabel: {
    fontSize: 13,
    color: THEME.moonGlow,
    opacity: 0.8,
  },
  forgotLink: {
    fontSize: 13,
    color: THEME.crystalPink,
    opacity: 0.8,
  },
  errorContainer: {
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: THEME.bloodMoon,
  },
  errorText: {
    color: THEME.crystalPink,
    fontSize: 13,
    textAlign: 'center',
  },
  loginBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginTop: 10,
    ...(Platform.OS === 'web' ? {
      background: `linear-gradient(135deg, ${THEME.candleFlame} 0%, ${THEME.deepAmethyst} 100%)`,
      boxShadow: `0 10px 30px rgba(255, 167, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
    } : {
      backgroundColor: THEME.candleFlame,
      shadowColor: THEME.candleFlame,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 30,
    }),
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  loginBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signUpText: {
    fontSize: 13,
    color: THEME.moonGlow,
    opacity: 0.7,
  },
  signUpLink: {
    fontSize: 13,
    color: THEME.candleFlame,
    fontWeight: '600',
  },
  socialProof: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(225, 190, 231, 0.1)',
    paddingTop: 25,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 15,
    borderRadius: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillIcon: {
    fontSize: 16,
  },
  pillText: {
    fontSize: 11,
    color: THEME.moonGlow,
    opacity: 0.7,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
    } : {}),
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderWidth: 3,
    borderColor: 'rgba(225, 190, 231, 0.2)',
    borderTopColor: THEME.candleFlame,
    borderRadius: 30,
  },
});

export default VeilPathLogin;
