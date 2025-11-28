/**
 * Email Preferences Screen
 *
 * Manage email subscription preferences for:
 * promos, events, contests, updates, community
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useUserStore } from '../stores/userStore';
import { EmailService, EMAIL_CATEGORIES } from '../services/EmailService';

import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

export default function EmailPreferencesScreen({ navigation }) {
  const user = useUserStore();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    if (!user.id) {
      setLoading(false);
      return;
    }

    const { preferences: prefs } = await EmailService.getOrCreatePreferences(
      user.id,
      user.email
    );
    setPreferences(prefs);
    setLoading(false);
  };

  const handleToggle = async (category, value) => {
    setSaving(true);

    // Optimistic update
    setPreferences(prev => ({ ...prev, [category]: value }));

    const { error } = await EmailService.toggleCategory(user.id, category, value);

    if (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [category]: !value }));
      console.error('[EmailPrefs] Toggle failed:', error);
    }

    setSaving(false);
  };

  const handleUnsubscribeAll = async () => {
    setSaving(true);

    const { error } = await EmailService.unsubscribeAll(user.id);

    if (!error) {
      setPreferences(prev => ({
        ...prev,
        promos: false,
        events: false,
        contests: false,
        updates: false,
        community: false,
      }));
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <VeilPathScreen intensity="light" scrollable={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COSMIC.etherealCyan} />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </VeilPathScreen>
    );
  }

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
        <SectionHeader
          icon="📧"
          title="Email Preferences"
          subtitle="Manage your subscriptions"
        />
      </View>

      {/* Intro Text */}
      <VictorianCard style={styles.introCard} showCorners={false}>
        <Text style={styles.introText}>
          Choose what emails you'd like to receive. We respect your inbox and
          only send relevant content.
        </Text>
      </VictorianCard>

      <CosmicDivider />

      {/* Email Categories */}
      <Text style={styles.sectionLabel}>SUBSCRIPTIONS</Text>

      {Object.values(EMAIL_CATEGORIES).map((category) => (
        <VictorianCard key={category.id} style={styles.categoryCard} showCorners={false}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </View>
            <Switch
              value={preferences?.[category.id] || false}
              onValueChange={(value) => handleToggle(category.id, value)}
              trackColor={{ false: COSMIC.midnightVoid, true: COSMIC.deepAmethyst }}
              thumbColor={preferences?.[category.id] ? COSMIC.etherealCyan : COSMIC.crystalPink}
              ios_backgroundColor={COSMIC.midnightVoid}
              disabled={saving}
            />
          </View>
        </VictorianCard>
      ))}

      <CosmicDivider />

      {/* Unsubscribe All */}
      <TouchableOpacity
        style={styles.unsubscribeButton}
        onPress={handleUnsubscribeAll}
        disabled={saving}
      >
        <Text style={styles.unsubscribeText}>Unsubscribe from all emails</Text>
      </TouchableOpacity>

      {/* Footer Note */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          You can always change these settings later.{'\n'}
          Transactional emails (password resets, receipts) are not affected.
        </Text>
      </View>

      {/* Saving Indicator */}
      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color={COSMIC.etherealCyan} />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '500',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
  },

  introCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  introText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    textAlign: 'center',
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: COSMIC.brassVictorian,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },

  categoryCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    lineHeight: 16,
  },

  unsubscribeButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  unsubscribeText: {
    fontSize: 14,
    color: '#FF6B6B',
    textDecorationLine: 'underline',
  },

  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 18,
  },

  savingOverlay: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COSMIC.midnightVoid,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst,
  },
  savingText: {
    fontSize: 12,
    color: COSMIC.moonGlow,
  },
});
