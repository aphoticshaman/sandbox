/**
 * PROFILE DETAIL SCREEN - View full profile info
 * Shows Western zodiac, Chinese zodiac, MBTI type with descriptions
 * Birthday and MBTI are READ-ONLY (locked after initial setup)
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NeonText, LPMUDText, ScanLines } from '../components/TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';
import { getMBTIDescription } from '../utils/mbtiTest';
import { WESTERN_ZODIAC_DESC, CHINESE_ZODIAC_DESC } from '../data/zodiacDescriptions';

const PROFILES_KEY = '@lunatiq_profiles';
const ACTIVE_PROFILE_KEY = '@lunatiq_active_profile';

export default function ProfileDetailScreen({ navigation, route }) {
  const [profile, setProfile] = useState(route.params.profile);

  const mbtiDescription = profile.mbtiType ? getMBTIDescription(profile.mbtiType) : null;

  // Handle MBTI test completion
  const handleMBTIComplete = async (updatedProfile) => {
    try {
      // Load all profiles
      const profilesData = await AsyncStorage.getItem(PROFILES_KEY);
      const profiles = profilesData ? JSON.parse(profilesData) : [];

      // Find and update this profile
      const updatedProfiles = profiles.map(p =>
        p.id === profile.id ? { ...p, ...updatedProfile } : p
      );

      // Save updated profiles
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));

      // Update local state
      setProfile({ ...profile, ...updatedProfile });

      console.log('[ProfileDetail] Profile updated with MBTI:', updatedProfile.mbtiType);
    } catch (error) {
      console.error('[ProfileDetail] Error updating profile:', error);
    }
  };

  // Handle selecting this profile as active
  const handleSelectProfile = async () => {
    try {
      await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
      console.log('[ProfileDetail] Set active profile:', profile.id);
      // Navigate back to welcome
      navigation.navigate('Welcome');
    } catch (error) {
      console.error('[ProfileDetail] Error selecting profile:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScanLines />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <LPMUDText style={styles.headerTitle}>
            $HIC${'>'} PROFILE DETAILS$NOR$
          </LPMUDText>
          <NeonText color={NEON_COLORS.hiWhite} style={styles.profileName}>
            {profile.name}
          </NeonText>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <LPMUDText style={styles.sectionTitle}>
            $HIY${'>'} BASIC INFO$NOR$
          </LPMUDText>
          <View style={styles.infoBox}>
            <LPMUDText style={styles.infoLine}>
              $HIM$Birthdate:$NOR$ {profile.birthdate}
            </LPMUDText>
            {profile.gender && (
              <LPMUDText style={styles.infoLine}>
                $HIM$Gender:$NOR$ {profile.gender}
              </LPMUDText>
            )}
          </View>
        </View>

        {/* Western Zodiac */}
        <View style={styles.section}>
          <LPMUDText style={styles.sectionTitle}>
            $HIM${'>'} WESTERN ZODIAC$NOR$
          </LPMUDText>
          <View style={styles.zodiacBox}>
            <LPMUDText style={styles.zodiacSign}>
              $HIC${profile.zodiacSign.toUpperCase()}$NOR$
            </LPMUDText>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.zodiacNote}>
              Calculated from birth date
            </NeonText>
            {WESTERN_ZODIAC_DESC[profile.zodiacSign] && (
              <NeonText color={NEON_COLORS.dimWhite} style={styles.zodiacDescription}>
                {WESTERN_ZODIAC_DESC[profile.zodiacSign]}
              </NeonText>
            )}
          </View>
        </View>

        {/* Chinese Zodiac */}
        {profile.chineseZodiac && (
          <View style={styles.section}>
            <LPMUDText style={styles.sectionTitle}>
              $HIM${'>'} CHINESE ZODIAC$NOR$
            </LPMUDText>
            <View style={styles.zodiacBox}>
              <LPMUDText style={styles.zodiacSign}>
                $HIC${profile.chineseZodiac.toUpperCase()}$NOR$
              </LPMUDText>
              <NeonText color={NEON_COLORS.dimCyan} style={styles.zodiacNote}>
                Calculated from birth year
              </NeonText>
              {CHINESE_ZODIAC_DESC[profile.chineseZodiac] && (
                <NeonText color={NEON_COLORS.dimWhite} style={styles.zodiacDescription}>
                  {CHINESE_ZODIAC_DESC[profile.chineseZodiac]}
                </NeonText>
              )}
            </View>
          </View>
        )}

        {/* MBTI Type */}
        {profile.mbtiType && mbtiDescription ? (
          <View style={styles.section}>
            <LPMUDText style={styles.sectionTitle}>
              $HIC${'>'} PERSONALITY TYPE$NOR$
            </LPMUDText>
            <View style={styles.mbtiBox}>
              <LPMUDText style={styles.mbtiType}>
                $HIC${profile.mbtiType}$NOR$
              </LPMUDText>
              <NeonText color={NEON_COLORS.hiMagenta} style={styles.mbtiNickname}>
                {mbtiDescription.nickname}
              </NeonText>
              <NeonText color={NEON_COLORS.dimCyan} style={styles.mbtiCore}>
                {mbtiDescription.core}
              </NeonText>
            </View>

            {/* How it affects readings */}
            <View style={styles.tarotStyleBox}>
              <LPMUDText style={styles.subSectionTitle}>
                $HIY$HOW THIS AFFECTS YOUR READINGS:$NOR$
              </LPMUDText>
              <NeonText color={NEON_COLORS.dimWhite} style={styles.tarotStyleText}>
                {mbtiDescription.tarotStyle}
              </NeonText>
            </View>

            {/* Communication style */}
            <View style={styles.communicationBox}>
              <LPMUDText style={styles.subSectionTitle}>
                $HIM$COMMUNICATION PREFERENCE:$NOR$
              </LPMUDText>
              <NeonText color={NEON_COLORS.dimWhite} style={styles.communicationText}>
                {mbtiDescription.communicationPreference}
              </NeonText>
            </View>

            <NeonText color={NEON_COLORS.hiRed} style={styles.lockedNote}>
              Personality type cannot be changed. Create a new profile to retake the assessment.
            </NeonText>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.vibeModeBox}>
              <LPMUDText style={styles.vibeModeText}>
                $HIM$VIBE MODE ENABLED$NOR$
              </LPMUDText>
              <NeonText color={NEON_COLORS.dimCyan} style={styles.vibeModeNote}>
                This profile skipped personality assessment
              </NeonText>

              <TouchableOpacity
                onPress={() => navigation.navigate('MBTITest', {
                  userProfile: profile,
                  onComplete: handleMBTIComplete
                })}
                style={styles.takeMBTIButton}
              >
                <LPMUDText style={styles.takeMBTIButtonText}>
                  $HIC$[ TAKE MBTI TEST ]$NOR$
                </LPMUDText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Select Profile Button */}
        <TouchableOpacity
          onPress={handleSelectProfile}
          style={styles.selectButton}
        >
          <LPMUDText style={styles.selectButtonText}>
            $HIG$[ ✓ USE THIS PROFILE ]$NOR$
          </LPMUDText>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <NeonText color={NEON_COLORS.dimCyan} style={styles.backButtonText}>
            {'[ ← BACK TO PROFILES ]'}
          </NeonText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: NEON_COLORS.hiCyan,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 18,
  },
  subSectionTitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 16,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: NEON_COLORS.dimYellow,
    borderRadius: 8,
    padding: 16,
  },
  infoLine: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 8,
    lineHeight: 18,
  },
  zodiacBox: {
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    borderWidth: 2,
    borderColor: NEON_COLORS.dimMagenta,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  zodiacSign: {
    fontSize: 28,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 4,
    lineHeight: 36,
  },
  zodiacNote: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
  zodiacDescription: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
    marginTop: 12,
    textAlign: 'left',
  },
  mbtiBox: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  mbtiType: {
    fontSize: 36,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 6,
    lineHeight: 48,
  },
  mbtiNickname: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  mbtiCore: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 20,
  },
  tarotStyleBox: {
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: NEON_COLORS.dimYellow,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  tarotStyleText: {
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  communicationBox: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  communicationText: {
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  lockedNote: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  vibeModeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  vibeModeText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 20,
  },
  vibeModeNote: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  takeMBTIButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
  takeMBTIButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectButton: {
    borderWidth: 2,
    borderColor: NEON_COLORS.hiGreen,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  selectButtonText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  backButton: {
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
