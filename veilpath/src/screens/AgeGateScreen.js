/**
 * AGE GATE SCREEN
 * FIRST screen users see - blocks entire app until age verified
 *
 * Legal Compliance:
 * - COPPA: Must be 13+ to use app
 * - 18+ required for forums and LLM features
 * - Honor system with birthday for celebration rewards
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../theme/theme';
import { useUserStore } from '../stores/userStore';

// Generate year options (current year - 100 to current year - 5)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 96 }, (_, i) => currentYear - 5 - i);
const months = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function AgeGateScreen({ navigation }) {
  const verifyAge = useUserStore((state) => state.verifyAge);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState(null);
  const [showPicker, setShowPicker] = useState(null); // 'year' | 'month' | 'day'
  const [isMinorWarning, setIsMinorWarning] = useState(false);
  const [showTooYoung, setShowTooYoung] = useState(false); // Under 13 - blocked

  const days = selectedYear && selectedMonth !== null
    ? Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1);

  const handleContinue = useCallback(() => {
    if (!selectedYear || selectedMonth === null || !selectedDay) {
      setError('Please enter your complete birthdate');
      return;
    }

    // Format as YYYY-MM-DD
    const birthDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const result = verifyAge(birthDate);

    if (!result.allowed) {
      // Under 13 - show "too young" screen
      setShowTooYoung(true);
      return;
    }

    if (result.isMinor) {
      // 13-17: Show warning that some features are restricted
      setIsMinorWarning(true);
    } else {
      // Adult - proceed to auth
      navigation.replace('Auth');
    }
  }, [selectedYear, selectedMonth, selectedDay, verifyAge, navigation]);

  const handleMinorContinue = useCallback(() => {
    setIsMinorWarning(false);
    navigation.replace('Auth');
  }, [navigation]);

  const renderPicker = (type, items, selected, onSelect) => (
    <Modal
      visible={showPicker === type}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPicker(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <Text style={styles.pickerTitle}>
            Select {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
          <ScrollView style={styles.pickerScroll}>
            {items.map((item) => {
              const value = typeof item === 'object' ? item.value : item;
              const label = typeof item === 'object' ? item.label : item;
              const isSelected = selected === value;

              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                  onPress={() => {
                    onSelect(value);
                    setShowPicker(null);
                    setError(null);
                  }}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={styles.pickerCancel}
            onPress={() => setShowPicker(null)}
          >
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient
      colors={[THEME.colors.neutral[1000], THEME.colors.neutral[900], '#1a0a2e']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo/Branding */}
        <View style={styles.header}>
          <Text style={styles.logo}>VeilPath</Text>
          <Text style={styles.tagline}>Lift the veil on your inner journey</Text>
        </View>

        {/* Age Gate Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome, Seeker</Text>
          <Text style={styles.subtitle}>
            Before we begin, please enter your birthdate.{'\n'}
            This helps us provide an appropriate experience.
          </Text>

          {/* Birthdate Selector */}
          <View style={styles.dateRow}>
            {/* Month */}
            <TouchableOpacity
              style={[styles.dateButton, styles.dateButtonMonth]}
              onPress={() => setShowPicker('month')}
            >
              <Text style={styles.dateButtonLabel}>Month</Text>
              <Text style={styles.dateButtonValue}>
                {selectedMonth !== null ? months[selectedMonth].label : 'Select'}
              </Text>
            </TouchableOpacity>

            {/* Day */}
            <TouchableOpacity
              style={[styles.dateButton, styles.dateButtonDay]}
              onPress={() => setShowPicker('day')}
            >
              <Text style={styles.dateButtonLabel}>Day</Text>
              <Text style={styles.dateButtonValue}>
                {selectedDay || 'Select'}
              </Text>
            </TouchableOpacity>

            {/* Year */}
            <TouchableOpacity
              style={[styles.dateButton, styles.dateButtonYear]}
              onPress={() => setShowPicker('year')}
            >
              <Text style={styles.dateButtonLabel}>Year</Text>
              <Text style={styles.dateButtonValue}>
                {selectedYear || 'Select'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Create Account Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedYear || selectedMonth === null || !selectedDay) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedYear || selectedMonth === null || !selectedDay}
          >
            <LinearGradient
              colors={
                selectedYear && selectedMonth !== null && selectedDay
                  ? [THEME.colors.primary[500], THEME.colors.primary[700]]
                  : [THEME.colors.neutral[700], THEME.colors.neutral[800]]
              }
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Create Account</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Legal Notice */}
          <Text style={styles.legalText}>
            By continuing, you confirm that you are at least 13 years old
            and agree to our Terms of Service and Privacy Policy.
          </Text>

          {/* Login Divider */}
          <View style={styles.loginDivider}>
            <View style={styles.loginDividerLine} />
            <Text style={styles.loginDividerText}>or</Text>
            <View style={styles.loginDividerLine} />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.replace('Auth', { mode: 'signin' })}
          >
            <Text style={styles.loginButtonText}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Birthday Bonus Teaser */}
        <View style={styles.bonusTeaser}>
          <Text style={styles.bonusTeaserText}>
            We'll remember your birthday and celebrate with you each year!
          </Text>
        </View>
      </ScrollView>

      {/* Pickers */}
      {renderPicker('month', months, selectedMonth, setSelectedMonth)}
      {renderPicker('day', days, selectedDay, setSelectedDay)}
      {renderPicker('year', years, selectedYear, setSelectedYear)}

      {/* Minor Warning Modal (13-17) */}
      <Modal
        visible={isMinorWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMinorWarning(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningModal}>
            <Text style={styles.warningTitle}>Welcome to VeilPath!</Text>
            <Text style={styles.warningText}>
              We're glad you're here! Since you're under 18, some features are limited:
            </Text>
            <View style={styles.restrictionsList}>
              <Text style={styles.restrictionItem}>Community forums (18+ only)</Text>
              <Text style={styles.restrictionItem}>AI chat with Vera (18+ only)</Text>
            </View>
            <Text style={styles.warningSubtext}>
              You can still enjoy tarot readings, journaling, mindfulness tools, and more!
            </Text>
            <TouchableOpacity
              style={styles.warningButton}
              onPress={handleMinorContinue}
            >
              <LinearGradient
                colors={[THEME.colors.primary[500], THEME.colors.primary[700]]}
                style={styles.warningButtonGradient}
              >
                <Text style={styles.warningButtonText}>Got it!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Too Young Modal (Under 13) - Full screen, no escape */}
      <Modal
        visible={showTooYoung}
        animationType="fade"
        onRequestClose={() => {}} // Can't close
      >
        <LinearGradient
          colors={[THEME.colors.neutral[1000], '#1a0a2e', THEME.colors.neutral[900]]}
          style={styles.tooYoungContainer}
        >
          <View style={styles.tooYoungContent}>
            <Text style={styles.tooYoungEmoji}>💫</Text>
            <Text style={styles.tooYoungTitle}>Not Quite Yet, Seeker</Text>
            <Text style={styles.tooYoungText}>
              VeilPath is designed for users 13 and older.{'\n\n'}
              Your inner journey is just beginning - there's so much ahead of you!
              Come back when you're a bit older, and we'll be here to guide you through
              the mysteries of self-discovery.
            </Text>
            <Text style={styles.tooYoungSubtext}>
              Until then, take care of yourself. The stars will wait.
            </Text>
            <View style={styles.tooYoungDivider} />
            <Text style={styles.tooYoungLegal}>
              COPPA Compliance: VeilPath requires users to be at least 13 years of age.
            </Text>
          </View>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 60 : 100,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: THEME.colors.primary[400],
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: THEME.colors.neutral[300],
    fontStyle: 'italic',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(30, 20, 50, 0.8)',
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: THEME.colors.primary[700] + '40',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.colors.neutral[0],
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.colors.neutral[300],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  dateButton: {
    backgroundColor: THEME.colors.neutral[800],
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.neutral[700],
  },
  dateButtonMonth: {
    flex: 2,
  },
  dateButtonDay: {
    flex: 1,
  },
  dateButtonYear: {
    flex: 1.2,
  },
  dateButtonLabel: {
    fontSize: 11,
    color: THEME.colors.neutral[400],
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateButtonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.neutral[100],
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  continueButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.neutral[0],
  },
  legalText: {
    fontSize: 12,
    color: THEME.colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  loginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  loginDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.neutral[700],
  },
  loginDividerText: {
    color: THEME.colors.neutral[500],
    fontSize: 14,
    paddingHorizontal: 15,
  },
  loginButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.primary[500],
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.primary[400],
  },
  bonusTeaser: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
    maxWidth: 400,
  },
  bonusTeaserText: {
    fontSize: 13,
    color: THEME.colors.primary[300],
    textAlign: 'center',
  },
  // Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: THEME.colors.neutral[900],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.neutral[100],
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerItemSelected: {
    backgroundColor: THEME.colors.primary[700] + '40',
  },
  pickerItemText: {
    fontSize: 16,
    color: THEME.colors.neutral[200],
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: THEME.colors.primary[300],
    fontWeight: '600',
  },
  pickerCancel: {
    marginTop: 16,
    padding: 14,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 16,
    color: THEME.colors.neutral[400],
  },
  // Minor Warning Modal
  warningModal: {
    backgroundColor: THEME.colors.neutral[900],
    borderRadius: 24,
    padding: 32,
    margin: 24,
    marginTop: 'auto',
    marginBottom: 'auto',
    maxWidth: 400,
    alignSelf: 'center',
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.neutral[0],
    textAlign: 'center',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 15,
    color: THEME.colors.neutral[300],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  restrictionsList: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  restrictionItem: {
    fontSize: 14,
    color: '#f87171',
    marginBottom: 6,
    textAlign: 'center',
  },
  warningSubtext: {
    fontSize: 14,
    color: THEME.colors.primary[300],
    textAlign: 'center',
    marginBottom: 24,
  },
  warningButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  warningButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  warningButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.neutral[0],
  },
  // Too Young Screen (Under 13)
  tooYoungContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  tooYoungContent: {
    maxWidth: 420,
    alignItems: 'center',
  },
  tooYoungEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  tooYoungTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: THEME.colors.neutral[0],
    textAlign: 'center',
    marginBottom: 24,
  },
  tooYoungText: {
    fontSize: 16,
    color: THEME.colors.neutral[300],
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  tooYoungSubtext: {
    fontSize: 15,
    color: THEME.colors.primary[400],
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 32,
  },
  tooYoungDivider: {
    width: 60,
    height: 2,
    backgroundColor: THEME.colors.neutral[700],
    marginBottom: 20,
  },
  tooYoungLegal: {
    fontSize: 11,
    color: THEME.colors.neutral[500],
    textAlign: 'center',
  },
});
