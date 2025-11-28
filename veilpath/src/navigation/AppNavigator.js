/**
 * App Navigator
 * Main navigation structure with bottom tabs and stack navigators
 *
 * Architecture:
 * - Bottom Tabs: Home, Journal, Mindfulness, Profile
 * - Each tab has its own stack navigator
 * - Shared modal screens (Settings, Card Detail, etc.)
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, Image, Platform, TouchableOpacity } from 'react-native';
import { THEME } from '../theme/theme';
import { NAV_ICONS } from '../assets/GeneratedAssets';
import { useUserStore } from '../stores/userStore';
import { useCosmeticsStore } from '../stores/cosmeticsStore';

// Coherence engine context (momentum-gated adaptive UX)
import { CoherenceProvider } from '../contexts/CoherenceContext';

// Import actual screens
import AuthScreen from '../screens/AuthScreen';
import AuthGate from '../components/AuthGate';
import HomeScreen from '../screens/HomeScreen';
import SingleCardReadingScreen from '../screens/SingleCardReadingScreen';
import CardInterpretationScreen from '../screens/CardInterpretationScreen';
import ThreeCardSpreadScreen from '../screens/ThreeCardSpreadScreen';
import CelticCrossSpreadScreen from '../screens/CelticCrossSpreadScreen';
import CelticCrossInterpretationScreen from '../screens/CelticCrossInterpretationScreen';
import ReadingTypeSelectionScreen from '../screens/ReadingTypeSelectionScreen';
import ReadingHistoryScreen from '../screens/ReadingHistoryScreen';
import JournalListScreen from '../screens/JournalListScreen';
import JournalEditorScreen from '../screens/JournalEditorScreen';
import JournalDetailScreen from '../screens/JournalDetailScreen';
import MindfulnessHomeScreen from '../screens/MindfulnessHomeScreen';
import MindfulnessPracticeScreen from '../screens/MindfulnessPracticeScreen';
import CBTToolsScreen from '../screens/CBTToolsScreen';
import DBTToolsScreen from '../screens/DBTToolsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import AccessibilityScreen from '../screens/AccessibilityScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import DataExportScreen from '../screens/DataExportScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ShopScreen from '../screens/ShopScreen';
import LockerScreen from '../screens/LockerScreen';
import QuestsScreen from '../screens/QuestsScreen';
import VeraChatScreen from '../screens/VeraChatScreen';
import DeckViewerScreen from '../screens/DeckViewerScreen';
import IntentionScreen from '../screens/IntentionScreen';
import MBTIEncyclopediaScreen from '../screens/MBTIEncyclopediaScreen';
import MBTITypeDetailScreen from '../screens/MBTITypeDetailScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import AgeGateScreen from '../screens/AgeGateScreen';
import VIPPerksScreen from '../screens/VIPPerksScreen';
import EmailPreferencesScreen from '../screens/EmailPreferencesScreen';
import { LegalFooter } from '../components/LegalFooter';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * STACK NAVIGATORS
 */

// Home Tab Stack
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ReadingType" component={ReadingTypeSelectionScreen} />
      <Stack.Screen name="SingleCardReading" component={SingleCardReadingScreen} />
      <Stack.Screen name="ThreeCardSpread" component={ThreeCardSpreadScreen} />
      <Stack.Screen name="CelticCrossSpread" component={CelticCrossSpreadScreen} />
      <Stack.Screen name="CelticCrossInterpretation" component={CelticCrossInterpretationScreen} />
      <Stack.Screen name="CardInterpretation" component={CardInterpretationScreen} />
      <Stack.Screen name="ReadingHistory" component={ReadingHistoryScreen} />
    </Stack.Navigator>
  );
}

// Journal Tab Stack
function JournalStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      <Stack.Screen name="JournalList" component={JournalListScreen} />
      <Stack.Screen name="JournalEditor" component={JournalEditorScreen} />
      <Stack.Screen name="JournalDetail" component={JournalDetailScreen} />
    </Stack.Navigator>
  );
}

// Mindfulness Tab Stack
function MindfulnessStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      <Stack.Screen name="MindfulnessHome" component={MindfulnessHomeScreen} />
      <Stack.Screen name="MindfulnessPractice" component={MindfulnessPracticeScreen} />
      <Stack.Screen name="CBTTools" component={CBTToolsScreen} />
      <Stack.Screen name="DBTTools" component={DBTToolsScreen} />
    </Stack.Navigator>
  );
}

// Profile Tab Stack
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="DataExport" component={DataExportScreen} />
      <Stack.Screen name="MBTIEncyclopedia" component={MBTIEncyclopediaScreen} />
      <Stack.Screen name="MBTITypeDetail" component={MBTITypeDetailScreen} />
    </Stack.Navigator>
  );
}

// Shop Tab Stack
function ShopStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      <Stack.Screen name="ShopMain" component={ShopScreen} />
    </Stack.Navigator>
  );
}

// Locker Tab Stack (Collection)
function LockerStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      <Stack.Screen name="LockerMain" component={LockerScreen} />
      <Stack.Screen name="DeckViewer" component={DeckViewerScreen} />
    </Stack.Navigator>
  );
}

// Quests Tab Stack
function QuestsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      <Stack.Screen name="QuestsMain" component={QuestsScreen} />
    </Stack.Navigator>
  );
}

// Reading Tab Stack (Intention + Spread Selection)
function ReadingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      <Stack.Screen name="ReadingType" component={ReadingTypeSelectionScreen} />
      <Stack.Screen name="Intention" component={IntentionScreen} />
      <Stack.Screen name="SingleCardReading" component={SingleCardReadingScreen} />
      <Stack.Screen name="ThreeCardSpread" component={ThreeCardSpreadScreen} />
      <Stack.Screen name="CelticCrossSpread" component={CelticCrossSpreadScreen} />
      <Stack.Screen name="CelticCrossInterpretation" component={CelticCrossInterpretationScreen} />
      <Stack.Screen name="CardInterpretation" component={CardInterpretationScreen} />
    </Stack.Navigator>
  );
}

// Vera Chat Tab Stack
function VeraStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      <Stack.Screen name="VeraMain" component={VeraChatScreen} />
    </Stack.Navigator>
  );
}

// Practice Tab Stack (Readings + Vera + Mindfulness - Combined Hub)
function PracticeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      {/* Entry point - Reading Type Selection */}
      <Stack.Screen name="ReadingType" component={ReadingTypeSelectionScreen} />
      <Stack.Screen name="Intention" component={IntentionScreen} />
      <Stack.Screen name="SingleCardReading" component={SingleCardReadingScreen} />
      <Stack.Screen name="ThreeCardSpread" component={ThreeCardSpreadScreen} />
      <Stack.Screen name="CelticCrossSpread" component={CelticCrossSpreadScreen} />
      <Stack.Screen name="CelticCrossInterpretation" component={CelticCrossInterpretationScreen} />
      <Stack.Screen name="CardInterpretation" component={CardInterpretationScreen} />
      {/* Vera AI Chat */}
      <Stack.Screen name="VeraChat" component={VeraChatScreen} />
      {/* Mindfulness Tools */}
      <Stack.Screen name="MindfulnessHome" component={MindfulnessHomeScreen} />
      <Stack.Screen name="MindfulnessPractice" component={MindfulnessPracticeScreen} />
      <Stack.Screen name="CBTTools" component={CBTToolsScreen} />
      <Stack.Screen name="DBTTools" component={DBTToolsScreen} />
    </Stack.Navigator>
  );
}

// Me Tab Stack (Profile + Shop + Locker + Quests + Settings)
function MeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: THEME.colors.neutral[900] },
      }}
    >
      {/* Entry point - Profile */}
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="AccessibilityScreen" component={AccessibilityScreen} />
      <Stack.Screen name="EmailPreferences" component={EmailPreferencesScreen} />
      {/* Shop & Collection */}
      <Stack.Screen name="Shop" component={ShopScreen} />
      <Stack.Screen name="VIPPerksScreen" component={VIPPerksScreen} />
      <Stack.Screen name="SubscriptionScreen" component={ShopScreen} initialParams={{ initialCategory: 'subscriptions' }} />
      <Stack.Screen name="Locker" component={LockerScreen} />
      <Stack.Screen name="DeckViewer" component={DeckViewerScreen} />
      {/* Quests */}
      <Stack.Screen name="Quests" component={QuestsScreen} />
      {/* Settings */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="DataExport" component={DataExportScreen} />
      {/* MBTI Encyclopedia */}
      <Stack.Screen name="MBTIEncyclopedia" component={MBTIEncyclopediaScreen} />
      <Stack.Screen name="MBTITypeDetail" component={MBTITypeDetailScreen} />
    </Stack.Navigator>
  );
}

/**
 * TIER BADGE - Persistent indicator showing user's subscription tier
 */
function TierBadge({ navigation }) {
  const user = useUserStore();
  const cosmetics = useCosmeticsStore();

  // Get tier from user or default to free
  const tier = user?.subscription?.tier || 'free';

  const tierConfig = {
    free: { label: 'FREE', color: '#888', bgColor: 'rgba(100,100,100,0.3)' },
    seeker: { label: 'SEEKER', color: '#00F0FF', bgColor: 'rgba(0,240,255,0.2)' },
    adept: { label: 'ADEPT', color: '#9945FF', bgColor: 'rgba(153,69,255,0.2)' },
    mystic: { label: 'MYSTIC', color: '#FFD700', bgColor: 'rgba(255,215,0,0.2)' },
  };

  const config = tierConfig[tier] || tierConfig.free;

  return (
    <TouchableOpacity
      style={[styles.tierBadge, { backgroundColor: config.bgColor, borderColor: config.color }]}
      onPress={() => navigation.navigate('MeTab', { screen: 'Shop' })}
    >
      <Text style={[styles.tierBadgeText, { color: config.color }]}>{config.label}</Text>
      <View style={styles.tierGemsBadge}>
        <Text style={styles.tierGemsIcon}>💎</Text>
        <Text style={styles.tierGemsText}>{cosmetics?.cosmicDust || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * BOTTOM TAB NAVIGATOR
 * Includes LegalFooter below the tab bar for ToS/Privacy links
 */
function BottomTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          // Keep screens mounted when switching tabs to preserve state
          // This prevents reading/interpretation screens from resetting on tab switch
          lazy: false,
          tabBarStyle: {
            backgroundColor: THEME.colors.neutral[900],
            borderTopColor: THEME.colors.primary[700],
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 10,
            paddingTop: 6,
          },
          tabBarActiveTintColor: THEME.colors.primary[400],
          tabBarInactiveTintColor: THEME.colors.neutral[400],
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.3,
          },
        }}
      >
      {/* ═══════════════════════════════════════════════════════════
          4-TAB NAVIGATION (Reduced from 9)
          - Home: Daily Vera, stats, quick actions
          - Practice: Readings, Vera, mindfulness tools
          - Journal: Journal entries, mood tracking
          - Me: Profile, shop, locker, quests, settings
      ═══════════════════════════════════════════════════════════ */}

      {/* TAB 1: HOME */}
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconLarge, {
              borderColor: color,
              backgroundColor: focused ? `${color}22` : 'transparent',
              shadowColor: focused ? color : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
            }]}>
              <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.7 }]}>🏠</Text>
            </View>
          ),
        }}
      />

      {/* TAB 2: PRACTICE (Readings + Vera + Mindfulness) */}
      <Tab.Screen
        name="PracticeTab"
        component={PracticeStack}
        options={{
          tabBarLabel: 'Practice',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconLarge, {
              borderColor: color,
              backgroundColor: focused ? `${color}22` : 'transparent',
              shadowColor: focused ? color : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
            }]}>
              <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.7 }]}>🔮</Text>
            </View>
          ),
        }}
      />

      {/* TAB 3: JOURNAL */}
      <Tab.Screen
        name="JournalTab"
        component={JournalStack}
        options={{
          tabBarLabel: 'Journal',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconLarge, {
              borderColor: color,
              backgroundColor: focused ? `${color}22` : 'transparent',
              shadowColor: focused ? color : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
            }]}>
              <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.7 }]}>📔</Text>
            </View>
          ),
        }}
      />

      {/* TAB 4: ME (Profile + Shop + Locker + Quests) */}
      <Tab.Screen
        name="MeTab"
        component={MeStack}
        options={{
          tabBarLabel: 'Me',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconLarge, {
              borderColor: color,
              backgroundColor: focused ? `${color}22` : 'transparent',
              shadowColor: focused ? color : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
            }]}>
              <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.7 }]}>👤</Text>
            </View>
          ),
        }}
      />
      </Tab.Navigator>
      <LegalFooter />
    </View>
  );
}

/**
 * ROOT NAVIGATOR
 * Includes age gate, auth, onboarding, and main app
 * Wrapped in CoherenceProvider for app-wide coherence state access
 *
 * Flow:
 * 1. AgeGate (first time only - verifies 13+)
 * 2. Auth (sign in/sign up)
 * 3. Onboarding (first time after auth)
 * 4. MainApp (bottom tabs)
 */
export function AppNavigator({ initialRouteName = 'Auth' }) {
  // Check if user has already verified age
  const ageVerifiedAt = useUserStore((state) => state.profile.ageVerifiedAt);
  const hasVerifiedAge = !!ageVerifiedAt;

  // Determine initial route:
  // - No age verification -> AgeGate
  // - Has age verification but provided route -> use provided route
  const resolvedInitialRoute = hasVerifiedAge ? initialRouteName : 'AgeGate';

  return (
    <CoherenceProvider>
      <Stack.Navigator
        initialRouteName={resolvedInitialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: Platform.OS === 'web' ? 'transparent' : THEME.colors.neutral[1000],
          },
        }}
      >
        {/* Age Gate - FIRST screen for new users (COPPA compliance) */}
        <Stack.Screen
          name="AgeGate"
          component={AgeGateScreen}
          options={{
            title: 'VeilPath - Age Verification',
            gestureEnabled: false, // Can't swipe back
          }}
        />

        {/* Authentication (sign in/sign up) */}
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            title: 'VeilPath - Sign In',
          }}
        />

        {/* Onboarding/Welcome (shown once after auth) */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />

        {/* Main app with bottom tabs (protected by AuthGate) */}
        <Stack.Screen name="MainApp">
          {(props) => (
            <AuthGate {...props}>
              <BottomTabs />
            </AuthGate>
          )}
        </Stack.Screen>

        {/* Legal screens (modal presentation) */}
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="Privacy"
          component={PrivacyScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </CoherenceProvider>
  );
}

/**
 * STYLES
 */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.neutral[900],
    padding: 20,
  },
  text: {
    fontSize: THEME.typography.sizes['2xl'],
    fontWeight: '700',
    color: THEME.colors.neutral[0],
    marginBottom: 12,
    textAlign: 'center',
  },
  subtext: {
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.neutral[300],
    textAlign: 'center',
    lineHeight: 24,
  },
  tabIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
  },
  tabIconImage: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconImg: {
    width: '100%',
    height: '100%',
  },
  // 4-tab navigation styles
  tabIconLarge: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
  },
  tabEmoji: {
    fontSize: 22,
  },
  // Tier Badge
  tierBadge: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 50,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 1000,
    gap: 8,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tierGemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tierGemsIcon: {
    fontSize: 12,
  },
  tierGemsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
  },
});

export default AppNavigator;
