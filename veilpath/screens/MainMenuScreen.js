import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeDimensions } from '../src/utils/useSafeDimensions';
// import { LinearGradient } from 'expo-linear-gradient'; // TEMPORARILY DISABLED TO DEBUG
import { ASSETS } from '../src/assets/CuratedAssets';
// import { StartReadingButton, SettingsButton, JournalButton, AchievementsButton, AssetButton } from '../src/components/AssetButton'; // TEMPORARILY DISABLED TO DEBUG
// import AmbientEffects from '../src/components/AmbientEffects'; // TEMPORARILY DISABLED TO DEBUG
// import InteractiveBackground from '../src/components/InteractiveBackground'; // TEMPORARILY DISABLED TO DEBUG

export default function MainMenuScreen({ navigation }) {
  const { width, height } = useSafeDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // Pulse animation for Start button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStartGame = () => {
    navigation.navigate('ReadingTypeSelection');
  };

  const handleEasterEgg = (type) => {
    console.log(`[MainMenu] Easter egg triggered: ${type}`);
    // Could award bonus Moonlight, unlock cosmetic, etc.
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={ASSETS.backgrounds.cosmic_nebula.path}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Ambient effects - floating particles and light beams */}
        {/* <AmbientEffects intensity="high" /> */}

        {/* <LinearGradient
          colors={['rgba(10,10,15,0.6)', 'rgba(26,26,46,0.8)', 'rgba(10,10,15,0.9)']}
          style={StyleSheet.absoluteFill}
        /> */}

        {/* Interactive background (Hearthstone-style tap hotspots) */}
        {/* <InteractiveBackground onEasterEgg={handleEasterEgg}> */}
          {/* Top action buttons */}
        <View style={styles.topBar}>
          {/* <SettingsButton
            onPress={() => navigation.navigate('Settings')}
            size={50}
          /> */}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>LUNATIQ</Text>
            <Text style={styles.subtitle}>Journey into the Mystic</Text>
            <View style={styles.titleDivider} />
            <Text style={styles.tagline}>
              Seek wisdom. Discover truth. Transform yourself.
            </Text>
          </View>

          {/* Menu Options */}
          <View style={styles.menuContainer}>
            {/* TEMPORARILY DISABLED ALL BUTTONS TO DEBUG */}
            <Text style={{ color: '#FFF', fontSize: 20 }}>MENU OPTIONS DISABLED</Text>
            {/* <Animated.View style={[styles.primaryButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
              <StartReadingButton
                onPress={handleStartGame}
                size={100}
              />
              <Text style={styles.primaryButtonLabel}>Begin Journey</Text>
            </Animated.View>

            <View style={styles.quickActions}>
              <View style={styles.quickActionItem}>
                <AssetButton
                  buttonId="crystal"
                  onPress={() => navigation.navigate('OracleChat')}
                  size={60}
                />
                <Text style={styles.quickActionLabel}>Oracle</Text>
              </View>

              <View style={styles.quickActionItem}>
                <JournalButton
                  onPress={() => navigation.navigate('Journal')}
                  size={60}
                />
                <Text style={styles.quickActionLabel}>Journal</Text>
              </View>

              <View style={styles.quickActionItem}>
                <AssetButton
                  buttonId="diamond_star"
                  onPress={() => navigation.navigate('DeckViewer')}
                  size={60}
                />
                <Text style={styles.quickActionLabel}>Collection</Text>
              </View>

              <View style={styles.quickActionItem}>
                <AchievementsButton
                  onPress={() => navigation.navigate('Achievements')}
                  size={60}
                />
                <Text style={styles.quickActionLabel}>Achievements</Text>
              </View>
            </View> */}

            {/* Secondary action */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>View Your Path</Text>
            </TouchableOpacity>
          </View>

          {/* Version */}
          <Text style={styles.version}>v0.1.0 - Mystic Alpha</Text>
        </Animated.View>
        {/* </InteractiveBackground> */}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  title: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: '#8a2be2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#ffffff',
    marginTop: 10,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  titleDivider: {
    width: 200,
    height: 2,
    backgroundColor: '#8a2be2',
    marginVertical: 20,
  },
  tagline: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  menuContainer: {
    alignItems: 'center',
    gap: 15,
  },
  menuButton: {
    width: width * 0.8,
    maxWidth: 400,
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8a2be2',
  },
  menuButtonPrimary: {
    borderColor: '#00ffff',
    borderWidth: 3,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  menuButtonTextSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00ffff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    textAlign: 'center',
    backgroundColor: 'rgba(42, 42, 78, 0.6)',
  },
  version: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.4,
    textAlign: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    gap: 15,
  },
  primaryButtonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  primaryButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 15,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginVertical: 20,
  },
  quickActionItem: {
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#00F0FF',
    marginTop: 8,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9945FF',
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    marginTop: 15,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
