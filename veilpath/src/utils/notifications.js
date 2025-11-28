/**
 * Notifications Utility
 * Handle local notifications for daily practice reminders
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@veilpath_notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-practice', {
      name: 'Daily Practice Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8a2be2',
    });
  }

  return true;
}

/**
 * Schedule daily practice reminder
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @param {string} type - 'reading' | 'journal' | 'mindfulness'
 */
export async function scheduleDailyReminder(hour, minute, type = 'reading') {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const notifications = getNotificationContent(type);
    const content = notifications[Math.floor(Math.random() * notifications.length)];

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: { type },
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    // Save notification config
    await saveNotificationConfig(type, { hour, minute, notificationId });

    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error scheduling reminder:', error);
    return null;
  }
}

/**
 * Cancel daily reminder
 * @param {string} type - 'reading' | 'journal' | 'mindfulness'
 */
export async function cancelDailyReminder(type) {
  try {
    const config = await getNotificationConfig(type);
    if (config && config.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(config.notificationId);
      await removeNotificationConfig(type);
    }
  } catch (error) {
    console.error('[Notifications] Error cancelling reminder:', error);
  }
}

/**
 * Cancel all reminders
 */
export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[Notifications] Error cancelling all reminders:', error);
  }
}

/**
 * Get all scheduled reminders
 */
export async function getScheduledReminders() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('[Notifications] Error getting scheduled reminders:', error);
    return [];
  }
}

/**
 * Save notification config to storage
 */
async function saveNotificationConfig(type, config) {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const configs = stored ? JSON.parse(stored) : {};
    configs[type] = config;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch (error) {
    console.error('[Notifications] Error saving config:', error);
  }
}

/**
 * Get notification config from storage
 */
async function getNotificationConfig(type) {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const configs = stored ? JSON.parse(stored) : {};
    return configs[type] || null;
  } catch (error) {
    console.error('[Notifications] Error getting config:', error);
    return null;
  }
}

/**
 * Remove notification config
 */
async function removeNotificationConfig(type) {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const configs = stored ? JSON.parse(stored) : {};
    delete configs[type];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch (error) {
    console.error('[Notifications] Error removing config:', error);
  }
}

/**
 * Get notification content variations
 */
function getNotificationContent(type) {
  const content = {
    reading: [
      {
        title: '🌙 Daily Card Awaits',
        body: 'What wisdom does today hold? Draw your card.',
      },
      {
        title: '🎴 Time for Reflection',
        body: 'Your daily tarot reading is ready.',
      },
      {
        title: '✨ Pause & Reflect',
        body: 'Take a moment for your daily card pull.',
      },
      {
        title: '🔮 Your Daily Insight',
        body: "Let the cards speak. What's your message today?",
      },
    ],
    journal: [
      {
        title: '📖 Journal Check-In',
        body: 'How are you feeling today? Write it down.',
      },
      {
        title: '✍️ Time to Write',
        body: 'Reflection leads to growth. Journal now.',
      },
      {
        title: '💭 Capture Your Thoughts',
        body: "What's on your mind? Your journal is waiting.",
      },
      {
        title: '🌟 Daily Reflection',
        body: 'Take 5 minutes to journal about your day.',
      },
    ],
    mindfulness: [
      {
        title: '🧘 Mindfulness Moment',
        body: 'Take a breath. Be present. Practice now.',
      },
      {
        title: '🌿 Time to Center',
        body: 'Your daily mindfulness practice is calling.',
      },
      {
        title: '✨ Breathe & Be',
        body: 'Pause. Breathe. Return to this moment.',
      },
      {
        title: '🕉️ Daily Practice',
        body: 'A few minutes of mindfulness can shift your day.',
      },
    ],
  };

  return content[type] || content.reading;
}

/**
 * Get notification settings from storage
 */
export async function getNotificationSettings() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('[Notifications] Error getting settings:', error);
    return {};
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
