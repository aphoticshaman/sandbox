/**
 * AUTH GATE
 * Prevents access to app without authentication
 * Like CoD/Fortnite - no connection/auth = no access
 *
 * Also enforces username setup before allowing forum/community access
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { auth } from '../services/supabase';
import { useUserStore } from '../stores/userStore';
import { COSMIC } from './VeilPathDesign';
import UsernameSetupScreen from '../screens/UsernameSetupScreen';

export default function AuthGate({ children, navigation }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);

  // Get username state from store
  const needsUsernameSetup = useUserStore((state) => state.needsUsernameSetup);
  const syncUsernameFromProfile = useUserStore((state) => state.syncUsernameFromProfile);
  const forumUsername = useUserStore((state) => state.forumUsername);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();

    // Listen for auth state changes
    const subscription = auth.onAuthStateChange((event, newSession) => {
      console.log('[AuthGate] Auth state changed:', event);
      setSession(newSession);

      // If user signed out, navigate to auth
      if (event === 'SIGNED_OUT') {
        navigation.replace('Auth', { mode: 'signin' });
      }

      // If user signed in, check username
      if (event === 'SIGNED_IN' && newSession) {
        checkUsernameSetup();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Check username when session is established
  useEffect(() => {
    if (session && !loading && !checkingUsername) {
      checkUsernameSetup();
    }
  }, [session, loading]);

  // Check if user needs to set up username
  async function checkUsernameSetup() {
    if (!session) return;

    setCheckingUsername(true);
    try {
      // Sync username from Supabase profile
      await syncUsernameFromProfile();

      // Check if username setup is still needed
      if (needsUsernameSetup()) {
        console.log('[AuthGate] Username not set, showing setup screen');
        setShowUsernameSetup(true);
      } else {
        console.log('[AuthGate] Username is set:', forumUsername);
        setShowUsernameSetup(false);
      }
    } catch (error) {
      console.error('[AuthGate] Username check failed:', error);
      // On error, don't block access but log it
    } finally {
      setCheckingUsername(false);
    }
  }

  async function checkSession() {
    try {
      const { session: existingSession } = await auth.getSession();
      setSession(existingSession);

      if (!existingSession) {
        // No session - redirect to auth
        console.log('[AuthGate] No session found, redirecting to auth');
        navigation.replace('Auth', { mode: 'signin' });
      } else {
        console.log('[AuthGate] Session found:', existingSession.user.email);
      }
    } catch (error) {
      console.error('[AuthGate] Session check failed:', error);
      // On error, assume not authenticated
      navigation.replace('Auth', { mode: 'signin' });
    } finally {
      setLoading(false);
    }
  }

  // Handle username setup completion
  const handleUsernameComplete = useCallback((username, reward) => {
    console.log('[AuthGate] Username setup complete:', username);
    setShowUsernameSetup(false);
  }, []);

  // Show loading screen while checking auth
  if (loading || checkingUsername) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COSMIC.etherealCyan} />
        <Text style={styles.loadingText}>
          {checkingUsername ? 'Checking profile...' : 'Verifying session...'}
        </Text>
      </View>
    );
  }

  // If no session, don't render children (navigation will redirect)
  if (!session) {
    return null;
  }

  // User is authenticated - render app with potential username modal
  return (
    <>
      {children}

      {/* Username Setup Modal - cannot be dismissed */}
      <Modal
        visible={showUsernameSetup}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          // Prevent closing with back button - user must complete setup
          console.log('[AuthGate] Username setup cannot be dismissed');
        }}
      >
        <UsernameSetupScreen
          onComplete={handleUsernameComplete}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COSMIC.midnightVoid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COSMIC.etherealCyan,
    fontSize: 16,
    marginTop: 20,
    fontFamily: 'monospace',
  },
});
