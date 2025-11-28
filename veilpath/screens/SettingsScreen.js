/**
 * SETTINGS SCREEN - Dark Fantasy Tarot
 * Simple, atmospheric settings for the app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@lunatiq_settings';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    narratorPreference: 'auto', // 'luna', 'sol', 'auto'
    hapticFeedback: true,
    autoSaveReadings: true,
    soundEffects: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        setSettings(JSON.parse(data));
      }
    } catch (error) {
      console.error('[Settings] Error loading:', error);
    }
  }

  async function saveSettings(newSettings) {
    try {
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('[Settings] Error saving:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  }

  function toggleSetting(key) {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  }

  function setNarrator(narrator) {
    const newSettings = { ...settings, narratorPreference: narrator };
    saveSettings(newSettings);
  }

  async function handleExportData() {
    Alert.alert(
      'Export Data',
      'Export all your readings, journal entries, and settings to a backup file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            // TODO: Implement export functionality
            Alert.alert('Coming Soon', 'Data export feature will be available in the next update.');
          }
        }
      ]
    );
  }

  async function handleClearData() {
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete ALL your readings, journal entries, and settings. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Data Cleared', 'All data has been deleted.', [
                { text: 'OK', onPress: () => navigation.navigate('MainMenu') }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error.message);
            }
          }
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a1a2e', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Configuration</Text>
          <View style={styles.divider} />
        </View>

        {/* Narrator Preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guide Voice</Text>
          <Text style={styles.sectionDescription}>
            Choose which guide narrates your readings
          </Text>

          <View style={styles.optionGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                settings.narratorPreference === 'luna' && styles.radioButtonActive
              ]}
              onPress={() => setNarrator('luna')}
            >
              <Text style={styles.radioText}>🌙 Luna (Feminine, Poetic)</Text>
              {settings.narratorPreference === 'luna' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButton,
                settings.narratorPreference === 'sol' && styles.radioButtonActive
              ]}
              onPress={() => setNarrator('sol')}
            >
              <Text style={styles.radioText}>☀️ Sol (Masculine, Direct)</Text>
              {settings.narratorPreference === 'sol' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButton,
                settings.narratorPreference === 'auto' && styles.radioButtonActive
              ]}
              onPress={() => setNarrator('auto')}
            >
              <Text style={styles.radioText}>⚖️ Auto (Alternating)</Text>
              {settings.narratorPreference === 'auto' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Experience Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={styles.toggleText}>Haptic Feedback</Text>
              <Text style={styles.toggleDescription}>Vibrations when drawing cards</Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={() => toggleSetting('hapticFeedback')}
              trackColor={{ false: '#444', true: '#8a2be2' }}
              thumbColor={settings.hapticFeedback ? '#00ffff' : '#888'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={styles.toggleText}>Sound Effects</Text>
              <Text style={styles.toggleDescription}>Card shuffle and ambient sounds</Text>
            </View>
            <Switch
              value={settings.soundEffects}
              onValueChange={() => toggleSetting('soundEffects')}
              trackColor={{ false: '#444', true: '#8a2be2' }}
              thumbColor={settings.soundEffects ? '#00ffff' : '#888'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={styles.toggleText}>Auto-Save Readings</Text>
              <Text style={styles.toggleDescription}>Save all readings to history</Text>
            </View>
            <Switch
              value={settings.autoSaveReadings}
              onValueChange={() => toggleSetting('autoSaveReadings')}
              trackColor={{ false: '#444', true: '#8a2be2' }}
              thumbColor={settings.autoSaveReadings ? '#00ffff' : '#888'}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
            <LinearGradient
              colors={['rgba(0, 255, 255, 0.2)', 'rgba(0, 200, 200, 0.1)']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>📤 Export All Data</Text>
              <Text style={styles.actionHint}>Backup readings and journal</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
            <LinearGradient
              colors={['rgba(255, 0, 0, 0.2)', 'rgba(200, 0, 0, 0.1)']}
              style={styles.actionGradient}
            >
              <Text style={styles.dangerText}>⚠️ Clear All Data</Text>
              <Text style={styles.dangerHint}>Cannot be undone!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>LunatIQ Tarot</Text>
            <Text style={styles.infoVersion}>Version 0.1.0 - Mystic Alpha</Text>
            <Text style={styles.infoDescription}>
              Journey into the Shadowlands. Seek wisdom from Luna and Sol.
              {'\n\n'}
              Built with Claude Sonnet 4.5
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    fontSize: 16,
    color: '#00ffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8a2be2',
  },
  divider: {
    width: 100,
    height: 2,
    backgroundColor: '#8a2be2',
    marginTop: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.6,
    marginBottom: 15,
  },
  optionGroup: {
    gap: 10,
  },
  radioButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    borderRadius: 10,
    padding: 16,
  },
  radioButtonActive: {
    borderColor: '#8a2be2',
    borderWidth: 2,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
  },
  radioText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#00ffff',
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 43, 226, 0.2)',
  },
  toggleLabel: {
    flex: 1,
    marginRight: 15,
  },
  toggleText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.5,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.5)',
  },
  dangerButton: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
  actionGradient: {
    padding: 16,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ffff',
    marginBottom: 4,
  },
  actionHint: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.6,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4444',
    marginBottom: 4,
  },
  dangerHint: {
    fontSize: 12,
    color: '#ff4444',
    opacity: 0.7,
  },
  infoBox: {
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8a2be2',
    marginBottom: 5,
  },
  infoVersion: {
    fontSize: 13,
    color: '#00ffff',
    marginBottom: 15,
  },
  infoDescription: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  spacer: {
    height: 40,
  },
});
