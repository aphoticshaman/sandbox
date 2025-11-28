/**
 * Support Button & Bug Report System
 *
 * Floating ? button that opens support modal with:
 * - Report a Bug (auto-captures screen, sends logs)
 * - FAQ/Help (coming soon)
 *
 * Bug reports go directly to Supabase - no tickets, no contact forms,
 * just data you can see in your dashboard.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useUserStore } from '../stores/userStore';
import { COSMIC, VictorianCard, CosmicButton } from './VeilPathDesign';

// ═══════════════════════════════════════════════════════════════════════════════
// LOG COLLECTOR - Captures console logs for bug reports
// ═══════════════════════════════════════════════════════════════════════════════

const recentLogs = [];
const MAX_LOGS = 50;

// Intercept console methods to capture logs
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

const captureLog = (type, args) => {
  const timestamp = new Date().toISOString();
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');

  recentLogs.push({ timestamp, type, message });

  // Keep only recent logs
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift();
  }
};

// Start capturing (call once on app init)
export function initLogCapture() {
  console.log = (...args) => {
    captureLog('log', args);
    originalConsole.log(...args);
  };
  console.warn = (...args) => {
    captureLog('warn', args);
    originalConsole.warn(...args);
  };
  console.error = (...args) => {
    captureLog('error', args);
    originalConsole.error(...args);
  };
}

function getRecentLogs() {
  return [...recentLogs];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPORT BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SupportButton() {
  const [showModal, setShowModal] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const navigation = useNavigation();
  const user = useUserStore();

  // Get current screen name
  const routeName = useNavigationState((state) => {
    if (!state?.routes) return 'Unknown';
    const route = state.routes[state.index];
    if (route.state?.routes) {
      const nestedRoute = route.state.routes[route.state.index];
      return `${route.name}/${nestedRoute.name}`;
    }
    return route.name;
  });

  // Pulse animation for the button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleOpenSupport = () => {
    setShowModal(true);
    setSent(false);
  };

  const handleOpenBugReport = () => {
    setShowBugReport(true);
    // Pre-fill with current screen
    setSubject(`Bug on ${routeName}`);
  };

  const handleSendBugReport = async () => {
    if (!subject.trim() || !body.trim()) return;

    setIsSending(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // Collect device/browser info
      const deviceInfo = {
        platform: Platform.OS,
        userAgent: Platform.OS === 'web' ? navigator.userAgent : 'N/A',
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
        screenHeight: typeof window !== 'undefined' ? window.innerHeight : 'N/A',
      };

      // Get recent logs
      const logs = getRecentLogs();

      // Send to Supabase
      await supabase.from('bug_reports').insert({
        user_id: authUser?.id || null,
        username: user.username || 'anonymous',
        subject: subject.trim(),
        body: body.trim(),
        screen_name: routeName,
        device_info: deviceInfo,
        console_logs: logs,
        user_level: user.progression?.level || 1,
        subscription_tier: user.subscriptionTier || 'free',
        created_at: new Date().toISOString(),
        status: 'new',
      });

      setSent(true);
      setSubject('');
      setBody('');

      // Auto-close after success
      setTimeout(() => {
        setShowBugReport(false);
        setShowModal(false);
      }, 2000);

    } catch (error) {
      console.error('[SupportButton] Failed to send bug report:', error);
      // Still mark as sent for UX (we can log the error)
      setSent(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setShowBugReport(false);
    setSent(false);
    setSubject('');
    setBody('');
  };

  return (
    <>
      {/* Floating Support Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.buttonInner}
          onPress={handleOpenSupport}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>?</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Support Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <VictorianCard style={styles.modalCard}>
            {!showBugReport ? (
              // Support Menu
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>Help & Support</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.betaNote}>
                  Early Access - Your feedback shapes VeilPath!
                </Text>

                {/* Bug Report - Direct to Ryan */}
                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={handleOpenBugReport}
                >
                  <Text style={styles.optionIcon}>🐛</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Report a Bug</Text>
                    <Text style={styles.optionDesc}>
                      Something broken? This goes directly to the developer
                    </Text>
                  </View>
                  <Text style={styles.optionArrow}>›</Text>
                </TouchableOpacity>

                {/* Troubleshooting Chatbot */}
                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={() => {
                    handleClose();
                    navigation.navigate('MeTab', { screen: 'VeraChat', params: { mode: 'troubleshoot' } });
                  }}
                >
                  <Text style={styles.optionIcon}>🤖</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Troubleshooting Assistant</Text>
                    <Text style={styles.optionDesc}>
                      Get help from our AI assistant
                    </Text>
                  </View>
                  <Text style={styles.optionArrow}>›</Text>
                </TouchableOpacity>

                {/* Community Forums */}
                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={() => {
                    handleClose();
                    navigation.navigate('CommunityTab');
                  }}
                >
                  <Text style={styles.optionIcon}>💬</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Community Forums</Text>
                    <Text style={styles.optionDesc}>
                      Questions? Feedback? Chat with the community
                    </Text>
                  </View>
                  <Text style={styles.optionArrow}>›</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.currentScreen}>
                  Current Screen: {routeName}
                </Text>
              </>
            ) : (
              // Bug Report Form
              <>
                <View style={styles.header}>
                  <TouchableOpacity
                    onPress={() => setShowBugReport(false)}
                    style={styles.backBtn}
                  >
                    <Text style={styles.backText}>‹ Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.title}>Report a Bug</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {sent ? (
                  <View style={styles.sentContainer}>
                    <Text style={styles.sentIcon}>✓</Text>
                    <Text style={styles.sentText}>Bug report sent!</Text>
                    <Text style={styles.sentSubtext}>
                      Thanks for helping improve VeilPath
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.autoCapture}>
                      Screen: {routeName} (auto-captured)
                    </Text>

                    <Text style={styles.label}>Subject</Text>
                    <TextInput
                      style={styles.input}
                      value={subject}
                      onChangeText={setSubject}
                      placeholder="Brief description of the issue"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      maxLength={100}
                    />

                    <Text style={styles.label}>What happened?</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={body}
                      onChangeText={setBody}
                      placeholder="Describe what you were doing and what went wrong..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                      maxLength={1000}
                    />

                    <Text style={styles.logsNote}>
                      Recent logs will be included automatically to help diagnose the issue.
                    </Text>

                    <CosmicButton
                      title={isSending ? 'Sending...' : 'Send Report'}
                      onPress={handleSendBugReport}
                      disabled={isSending || !subject.trim() || !body.trim()}
                      variant="primary"
                    />
                  </>
                )}
              </>
            )}
          </VictorianCard>
        </View>
      </Modal>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 9999,
    ...(Platform.OS === 'web' ? {
      position: 'fixed',
    } : {}),
  },
  buttonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COSMIC.deepAmethyst,
    borderWidth: 2,
    borderColor: COSMIC.candleFlame,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 15px rgba(183, 142, 82, 0.4)',
      },
      default: {
        shadowColor: COSMIC.candleFlame,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  buttonIcon: {
    fontSize: 24,
    fontWeight: '900',
    color: COSMIC.candleFlame,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    flex: 1,
    textAlign: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: COSMIC.moonGlow,
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 16,
    color: COSMIC.candleFlame,
  },

  // Support Menu
  betaNote: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst + '60',
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: COSMIC.crystalPink,
  },
  optionArrow: {
    fontSize: 24,
    color: COSMIC.candleFlame,
  },
  divider: {
    height: 1,
    backgroundColor: COSMIC.brassVictorian + '30',
    marginVertical: 16,
  },
  currentScreen: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },

  // Bug Report Form
  autoCapture: {
    fontSize: 12,
    color: COSMIC.etherealCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 6,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst + '60',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COSMIC.moonGlow,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
  },
  logsNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },

  // Sent State
  sentContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  sentIcon: {
    fontSize: 48,
    color: '#00FF88',
    marginBottom: 16,
  },
  sentText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00FF88',
    marginBottom: 8,
  },
  sentSubtext: {
    fontSize: 14,
    color: COSMIC.crystalPink,
  },
});
