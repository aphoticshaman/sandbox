/**
 * Notification Settings Screen - VeilPath WitchTok x Victorian Gothic
 * Configure daily practice reminders
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
  getNotificationSettings,
  areNotificationsEnabled,
} from '../utils/notifications';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

// Cross-platform alert
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
};

export default function NotificationSettingsScreen({ navigation }) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [readingEnabled, setReadingEnabled] = useState(false);
  const [journalEnabled, setJournalEnabled] = useState(false);
  const [mindfulnessEnabled, setMindfulnessEnabled] = useState(false);

  const [readingTime, setReadingTime] = useState({ hour: 9, minute: 0 });
  const [journalTime, setJournalTime] = useState({ hour: 20, minute: 0 });
  const [mindfulnessTime, setMindfulnessTime] = useState({ hour: 12, minute: 0 });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const enabled = await areNotificationsEnabled();
    setPermissionGranted(enabled);

    const settings = await getNotificationSettings();
    if (settings.reading) {
      setReadingEnabled(true);
      setReadingTime({ hour: settings.reading.hour, minute: settings.reading.minute });
    }
    if (settings.journal) {
      setJournalEnabled(true);
      setJournalTime({ hour: settings.journal.hour, minute: settings.journal.minute });
    }
    if (settings.mindfulness) {
      setMindfulnessEnabled(true);
      setMindfulnessTime({ hour: settings.mindfulness.hour, minute: settings.mindfulness.minute });
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermissions();
    setPermissionGranted(granted);

    if (!granted) {
      showAlert('Permission Required', 'Please enable notifications in your device settings to receive daily reminders.');
    }
  };

  const handleToggleReading = async (value) => {
    if (!permissionGranted) {
      await handleRequestPermission();
      return;
    }
    setReadingEnabled(value);
    if (value) {
      await scheduleDailyReminder(readingTime.hour, readingTime.minute, 'reading');
    } else {
      await cancelDailyReminder('reading');
    }
  };

  const handleToggleJournal = async (value) => {
    if (!permissionGranted) {
      await handleRequestPermission();
      return;
    }
    setJournalEnabled(value);
    if (value) {
      await scheduleDailyReminder(journalTime.hour, journalTime.minute, 'journal');
    } else {
      await cancelDailyReminder('journal');
    }
  };

  const handleToggleMindfulness = async (value) => {
    if (!permissionGranted) {
      await handleRequestPermission();
      return;
    }
    setMindfulnessEnabled(value);
    if (value) {
      await scheduleDailyReminder(mindfulnessTime.hour, mindfulnessTime.minute, 'mindfulness');
    } else {
      await cancelDailyReminder('mindfulness');
    }
  };

  const formatTime = (hour, minute) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${ampm}`;
  };

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <SectionHeader
        icon="🔔"
        title="Daily Reminders"
        subtitle="Gentle nudges for your practice"
      />

      {/* Permission Status */}
      {!permissionGranted && (
        <VictorianCard style={styles.permissionCard} glowColor={COSMIC.candleFlame}>
          <Text style={styles.permissionIcon}>🔔</Text>
          <Text style={styles.permissionTitle}>Enable Notifications</Text>
          <Text style={styles.permissionText}>
            Allow notifications to receive gentle daily reminders for your practice.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
            <Text style={styles.permissionButtonText}>Enable Notifications</Text>
          </TouchableOpacity>
        </VictorianCard>
      )}

      {/* Info Card */}
      <VictorianCard style={styles.infoCard} showCorners={false}>
        <Text style={styles.infoTitle}>💡 About Reminders</Text>
        <Text style={styles.infoText}>
          Gentle daily notifications help build consistent habits. Set reminders for the practices that matter most to you.
        </Text>
        <Text style={styles.infoText}>
          You can always change these settings or turn them off.
        </Text>
      </VictorianCard>

      <CosmicDivider />

      {/* Practice Reminders */}
      <Text style={styles.sectionTitle}>Practice Reminders</Text>

      {/* Daily Card Reading */}
      <VictorianCard style={styles.reminderCard}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderIcon}>🎴</Text>
            <View>
              <Text style={styles.reminderTitle}>Daily Card Reading</Text>
              <Text style={styles.reminderSubtitle}>
                {formatTime(readingTime.hour, readingTime.minute)}
              </Text>
            </View>
          </View>
          <Switch
            value={readingEnabled}
            onValueChange={handleToggleReading}
            trackColor={{ false: 'rgba(184, 134, 11, 0.3)', true: COSMIC.deepAmethyst }}
            thumbColor={readingEnabled ? COSMIC.candleFlame : COSMIC.crystalPink}
          />
        </View>
        <Text style={styles.reminderDescription}>
          Daily reminder to draw your card and reflect.
        </Text>
      </VictorianCard>

      {/* Evening Journal */}
      <VictorianCard style={styles.reminderCard}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderIcon}>📖</Text>
            <View>
              <Text style={styles.reminderTitle}>Evening Journal</Text>
              <Text style={styles.reminderSubtitle}>
                {formatTime(journalTime.hour, journalTime.minute)}
              </Text>
            </View>
          </View>
          <Switch
            value={journalEnabled}
            onValueChange={handleToggleJournal}
            trackColor={{ false: 'rgba(184, 134, 11, 0.3)', true: COSMIC.deepAmethyst }}
            thumbColor={journalEnabled ? COSMIC.candleFlame : COSMIC.crystalPink}
          />
        </View>
        <Text style={styles.reminderDescription}>
          End-of-day reminder to reflect and journal.
        </Text>
      </VictorianCard>

      {/* Mindfulness Practice */}
      <VictorianCard style={styles.reminderCard}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderIcon}>🧘</Text>
            <View>
              <Text style={styles.reminderTitle}>Mindfulness Practice</Text>
              <Text style={styles.reminderSubtitle}>
                {formatTime(mindfulnessTime.hour, mindfulnessTime.minute)}
              </Text>
            </View>
          </View>
          <Switch
            value={mindfulnessEnabled}
            onValueChange={handleToggleMindfulness}
            trackColor={{ false: 'rgba(184, 134, 11, 0.3)', true: COSMIC.deepAmethyst }}
            thumbColor={mindfulnessEnabled ? COSMIC.candleFlame : COSMIC.crystalPink}
          />
        </View>
        <Text style={styles.reminderDescription}>
          Midday reminder for a mindfulness break.
        </Text>
      </VictorianCard>

      {/* Note */}
      <VictorianCard style={styles.noteCard} showCorners={false}>
        <Text style={styles.noteText}>
          📱 Times are currently preset. Custom time selection coming in a future update.
        </Text>
      </VictorianCard>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    marginBottom: 16,
  },

  permissionCard: {
    marginBottom: 16,
    padding: 28,
    alignItems: 'center',
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  permissionText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    opacity: 0.9,
  },
  permissionButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },

  infoCard: {
    marginBottom: 16,
    padding: 18,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    marginBottom: 6,
    opacity: 0.9,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 14,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  reminderCard: {
    marginBottom: 12,
    padding: 18,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  reminderSubtitle: {
    fontSize: 13,
    color: COSMIC.candleFlame,
    fontWeight: '600',
  },
  reminderDescription: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    paddingLeft: 46,
    opacity: 0.8,
  },

  noteCard: {
    marginTop: 16,
    marginBottom: 40,
    padding: 16,
  },
  noteText: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
