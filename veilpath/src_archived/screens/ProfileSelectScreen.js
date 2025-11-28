/**
 * PROFILE SELECT SCREEN - Choose from saved profiles
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NeonText, LPMUDText, ScanLines } from '../components/TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';

const PROFILES_KEY = '@lunatiq_profiles';
const ACTIVE_PROFILE_KEY = '@lunatiq_active_profile';

export default function ProfileSelectScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const profilesData = await AsyncStorage.getItem(PROFILES_KEY);
      const activeId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);

      if (profilesData) {
        setProfiles(JSON.parse(profilesData));
      }

      if (activeId) {
        setActiveProfileId(activeId);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  }

  const handleSelectProfile = async (profile) => {
    try {
      await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
      // Navigate back to welcome
      navigation.navigate('Welcome');
    } catch (error) {
      console.error('Error selecting profile:', error);
    }
  };

  const handleViewProfile = (profile) => {
    // Navigate to detail view
    navigation.navigate('ProfileDetail', { profile });
  };

  const handleDeleteProfile = (profile) => {
    Alert.alert(
      'Delete Profile',
      `Delete ${profile.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedProfiles = profiles.filter(p => p.id !== profile.id);
              await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));

              // If deleted active profile, clear it
              if (activeProfileId === profile.id) {
                await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
              }

              setProfiles(updatedProfiles);
            } catch (error) {
              console.error('Error deleting profile:', error);
            }
          }
        }
      ]
    );
  };

  const handleImportProfile = () => {
    Alert.alert(
      'Import Profile',
      'Profile import feature coming soon! You will be able to restore encrypted profile backups.',
      [{ text: 'OK' }]
    );
  };

  const handleBackupProfiles = () => {
    Alert.alert(
      'Backup Profiles',
      'Profile backup feature coming soon! Your profiles will be encrypted, salted, hashed, and PIN/password protected.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScanLines />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <LPMUDText style={styles.headerTitle}>
            $HIY${'>'} PROFILES$NOR$
          </LPMUDText>
          <NeonText color={NEON_COLORS.dimCyan} style={styles.subtitle}>
            {profiles.length} profile(s) available
          </NeonText>
        </View>

        {/* Profile Management Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileSetup', { isNewProfile: true })}
            style={styles.actionButton}
          >
            <LPMUDText style={styles.actionButtonText}>
              $HIG$[ + NEW ]$NOR$
            </LPMUDText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleImportProfile}
            style={styles.actionButton}
          >
            <LPMUDText style={styles.actionButtonText}>
              $HIC$[ ⬇ IMPORT ]$NOR$
            </LPMUDText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBackupProfiles}
            style={styles.actionButton}
          >
            <LPMUDText style={styles.actionButtonText}>
              $HIY$[ ⬆ BACKUP ]$NOR$
            </LPMUDText>
          </TouchableOpacity>
        </View>

        {profiles.length === 0 ? (
          <View style={styles.emptyBox}>
            <NeonText color={NEON_COLORS.hiRed} style={styles.emptyText}>
              No profiles yet - create your first one above
            </NeonText>
          </View>
        ) : (
          profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;

            return (
              <View key={profile.id} style={styles.profileCard}>
                <TouchableOpacity
                  onPress={() => handleViewProfile(profile)}
                  style={[
                    styles.profileButton,
                    isActive && styles.profileButtonActive
                  ]}
                >
                  <View style={styles.profileHeader}>
                    <LPMUDText style={styles.profileName}>
                      {isActive ? '$HIC$' : '$HIW$'}{profile.name}$NOR$
                    </LPMUDText>
                    {isActive && (
                      <NeonText color={NEON_COLORS.hiGreen} style={styles.activeBadge}>
                        ACTIVE
                      </NeonText>
                    )}
                  </View>

                  <View style={styles.profileDetails}>
                    <LPMUDText style={styles.profileDetail}>
                      $HIM${'>'} Western: {profile.zodiacSign}$NOR$
                    </LPMUDText>
                    {profile.chineseZodiac && (
                      <LPMUDText style={styles.profileDetail}>
                        $HIM${'>'} Eastern: {profile.chineseZodiac}$NOR$
                      </LPMUDText>
                    )}
                    {profile.mbtiType && (
                      <LPMUDText style={styles.profileDetail}>
                        $HIC${'>'} MBTI: {profile.mbtiType}$NOR$
                      </LPMUDText>
                    )}
                    <LPMUDText style={styles.profileDetail}>
                      $HIY${'>'} Born: {profile.birthdate}$NOR$
                    </LPMUDText>
                  </View>
                </TouchableOpacity>

                <View style={styles.actionButtonsRow}>
                  {!isActive && (
                    <TouchableOpacity
                      onPress={() => handleSelectProfile(profile)}
                      style={styles.selectButton}
                    >
                      <NeonText color={NEON_COLORS.hiGreen} style={styles.selectText}>
                        SELECT
                      </NeonText>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => handleDeleteProfile(profile)}
                    style={[styles.deleteButton, !isActive && styles.deleteButtonWithSelect]}
                  >
                    <NeonText color={NEON_COLORS.hiRed} style={styles.deleteText}>
                      DELETE
                    </NeonText>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <NeonText color={NEON_COLORS.dimCyan} style={styles.backButtonText}>
            {'[ ← BACK ]'}
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
    borderBottomColor: NEON_COLORS.dimCyan,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  emptyBox: {
    padding: 30,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiRed,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  profileCard: {
    marginBottom: 15,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
  },
  profileButton: {
    padding: 15,
    backgroundColor: '#000000',
  },
  profileButtonActive: {
    borderLeftWidth: 4,
    borderLeftColor: NEON_COLORS.hiGreen,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  activeBadge: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  profileDetails: {
    gap: 5,
  },
  profileDetail: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: NEON_COLORS.dimCyan,
  },
  selectButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRightWidth: 1,
    borderRightColor: NEON_COLORS.dimCyan,
  },
  selectText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
  },
  deleteButtonWithSelect: {
    flex: 1,
  },
  deleteText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  backButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
