/**
 * Settings Screen - VeilPath WitchTok x Victorian Gothic
 * Premium cosmic design with glassmorphism cards
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useUserStore } from '../stores/userStore';
import { APP_BRANDING } from '../constants/appConstants';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

export default function SettingsScreen({ navigation }) {
  const user = useUserStore();

  const handleResetProgress = () => {
    Alert.alert(
      '⚠️ Reset All Progress?',
      'This will delete all your data including readings, journal entries, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await user.resetUser();
            Alert.alert('✨ Progress Reset', 'All data has been cleared. Your journey begins anew.');
            navigation.navigate('HomeTab');
          },
        },
      ]
    );
  };

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <SectionHeader icon="⚙️" title="Settings" subtitle="Customize your experience" />
      </View>

      {/* Account Section */}
      <Text style={styles.sectionLabel}>ACCOUNT</Text>

      <VictorianCard style={styles.settingCard} showCorners={false}>
        <View style={styles.settingRow}>
          <Text style={styles.settingIcon}>🌙</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>User ID</Text>
            <Text style={styles.settingValue}>{user.profile.userId?.substring(0, 20)}...</Text>
          </View>
        </View>
      </VictorianCard>

      <VictorianCard style={styles.settingCard} showCorners={false}>
        <View style={styles.settingRow}>
          <Text style={styles.settingIcon}>📅</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Member Since</Text>
            <Text style={styles.settingValue}>
              {user.profile.createdAt
                ? new Date(user.profile.createdAt).toLocaleDateString()
                : 'Unknown'}
            </Text>
          </View>
        </View>
      </VictorianCard>

      <CosmicDivider />

      {/* Preferences Section */}
      <Text style={styles.sectionLabel}>PREFERENCES</Text>

      <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')}>
        <VictorianCard style={styles.actionCard} showCorners={false}>
          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>🔔</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Daily Reminders</Text>
              <Text style={styles.actionDescription}>
                Configure practice notifications
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </View>
        </VictorianCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('AccessibilityScreen')}>
        <VictorianCard style={styles.actionCard} showCorners={false}>
          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>🌟</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Accessibility</Text>
              <Text style={styles.actionDescription}>
                Font size, contrast, animations
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </View>
        </VictorianCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('EmailPreferences')}>
        <VictorianCard style={styles.actionCard} showCorners={false}>
          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>📧</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Email Preferences</Text>
              <Text style={styles.actionDescription}>
                Manage newsletter subscriptions
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </View>
        </VictorianCard>
      </TouchableOpacity>

      <CosmicDivider />

      {/* Data Management Section */}
      <Text style={styles.sectionLabel}>DATA MANAGEMENT</Text>

      <TouchableOpacity onPress={() => navigation.navigate('DataExport')}>
        <VictorianCard style={styles.actionCard} showCorners={false}>
          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>📤</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Export Data</Text>
              <Text style={styles.actionDescription}>
                Download all your data as JSON
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </View>
        </VictorianCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResetProgress}>
        <VictorianCard style={styles.dangerCard} showCorners={false}>
          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>⚠️</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.dangerLabel}>Reset All Progress</Text>
              <Text style={styles.actionDescription}>
                Delete all data and start fresh
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </View>
        </VictorianCard>
      </TouchableOpacity>

      <CosmicDivider />

      {/* About Section */}
      <Text style={styles.sectionLabel}>ABOUT</Text>

      <VictorianCard style={styles.aboutCard} glowColor={COSMIC.deepAmethyst}>
        <Text style={styles.appName}>{APP_BRANDING.NAME}</Text>
        <Text style={styles.appTagline}>
          {APP_BRANDING.DESCRIPTION}
        </Text>
        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>Version</Text>
          <Text style={styles.versionValue}>1.0.0 (Early Access)</Text>
        </View>
      </VictorianCard>

      <VictorianCard style={styles.infoCard} showCorners={false}>
        <Text style={styles.infoTitle}>🌙 Evidence-Based Approach</Text>
        <Text style={styles.infoText}>
          {APP_BRANDING.NAME} combines archetypal reflection with proven therapeutic techniques:
        </Text>
        <View style={styles.therapyList}>
          <View style={styles.therapyItem}>
            <Text style={styles.therapyDot}>✧</Text>
            <Text style={styles.therapyText}>CBT (Cognitive Behavioral Therapy)</Text>
          </View>
          <View style={styles.therapyItem}>
            <Text style={styles.therapyDot}>✧</Text>
            <Text style={styles.therapyText}>DBT (Dialectical Behavior Therapy)</Text>
          </View>
          <View style={styles.therapyItem}>
            <Text style={styles.therapyDot}>✧</Text>
            <Text style={styles.therapyText}>MBSR (Mindfulness-Based Stress Reduction)</Text>
          </View>
        </View>
        <Text style={styles.privacyNote}>
          🔒 Your data is private, stored locally, and never shared.
        </Text>
      </VictorianCard>

      {/* Legal */}
      <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
        <VictorianCard style={styles.legalCard} showCorners={false}>
          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>📜</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Privacy Policy & Terms</Text>
              <Text style={styles.actionDescription}>
                Legal information and guidelines
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </View>
        </VictorianCard>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{APP_BRANDING.COPYRIGHT}</Text>
        <Text style={styles.footerTagline}>✨ Made with mystical intention ✨</Text>
      </View>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COSMIC.crystalPink,
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 8,
    opacity: 0.8,
  },

  settingCard: {
    marginBottom: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
  },

  actionCard: {
    marginBottom: 12,
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  chevron: {
    fontSize: 18,
    color: COSMIC.etherealCyan,
    fontWeight: '700',
  },

  dangerCard: {
    marginBottom: 12,
    padding: 16,
    borderColor: COSMIC.bloodMoon,
    backgroundColor: 'rgba(139, 0, 0, 0.15)',
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 4,
  },

  aboutCard: {
    marginBottom: 16,
    padding: 24,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 3,
    color: COSMIC.candleFlame,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    textShadowColor: 'rgba(255, 167, 38, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  appTagline: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
    lineHeight: 20,
  },
  versionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.2)',
  },
  versionLabel: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  versionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COSMIC.moonGlow,
  },

  infoCard: {
    marginBottom: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.9,
  },
  therapyList: {
    marginBottom: 16,
  },
  therapyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  therapyDot: {
    fontSize: 12,
    color: COSMIC.candleFlame,
    marginRight: 8,
  },
  therapyText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    opacity: 0.8,
  },
  privacyNote: {
    fontSize: 13,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.2)',
  },

  legalCard: {
    marginBottom: 24,
    padding: 16,
  },

  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    opacity: 0.5,
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.6,
  },
});
