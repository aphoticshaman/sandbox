/**
 * USERNAME SETUP SCREEN
 * Forced modal - user cannot proceed without setting a username
 *
 * Features:
 * - Real-time format validation
 * - LLM moderation for inappropriate content
 * - Availability check
 * - Username suggestions
 * - Cannot be dismissed until saved
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../theme/theme';
import { useUserStore } from '../stores/userStore';
import {
  validateUsername,
  validateUsernameFormat,
  generateUsernameSuggestions,
} from '../services/UserProfileService';
import { UserProfileService } from '../services/UserProfileService';

export default function UsernameSetupScreen({ navigation, onComplete }) {
  const setForumUsername = useUserStore((state) => state.setForumUsername);
  const displayName = useUserStore((state) => state.profile.displayName);

  const [username, setUsername] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formatErrors, setFormatErrors] = useState([]);
  const [serverErrors, setServerErrors] = useState([]);
  const [charCount, setCharCount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [isValidFormat, setIsValidFormat] = useState(false);
  const [success, setSuccess] = useState(false);
  const [questReward, setQuestReward] = useState(null);

  // Generate suggestions on mount
  useEffect(() => {
    const baseName = displayName || 'seeker';
    setSuggestions(generateUsernameSuggestions(baseName, 5));
  }, [displayName]);

  // Real-time format validation (no server calls)
  const handleUsernameChange = useCallback((text) => {
    // Prevent any non-ASCII characters from being entered
    const cleanText = text.replace(/[^\x00-\x7F]/g, '');
    setUsername(cleanText);

    const result = validateUsernameFormat(cleanText);
    setFormatErrors(result.errors);
    setCharCount(result.charCount);
    setIsValidFormat(result.valid);
    setServerErrors([]); // Clear server errors on change
  }, []);

  // Full validation (includes LLM + availability)
  const handleValidate = useCallback(async () => {
    if (!isValidFormat) return;

    setIsValidating(true);
    setServerErrors([]);

    try {
      const result = await validateUsername(username);

      if (!result.valid) {
        setServerErrors(result.errors);
      }
    } catch (error) {
      setServerErrors(['Failed to validate username. Please try again.']);
    } finally {
      setIsValidating(false);
    }
  }, [username, isValidFormat]);

  // Save username
  const handleSave = useCallback(async () => {
    if (!isValidFormat || serverErrors.length > 0) return;

    setIsSaving(true);

    try {
      // Full validation first
      const validation = await validateUsername(username);

      if (!validation.valid) {
        setServerErrors(validation.errors);
        setIsSaving(false);
        return;
      }

      // Save to Supabase profile
      const saveResult = await UserProfileService.setUsername(validation.username);

      if (!saveResult.success) {
        setServerErrors(saveResult.errors);
        setIsSaving(false);
        return;
      }

      // Update local store
      const reward = setForumUsername(validation.username);

      setSuccess(true);
      setQuestReward(reward);

      // Wait a moment then proceed
      setTimeout(() => {
        if (onComplete) {
          onComplete(validation.username, reward);
        } else if (navigation?.goBack) {
          navigation.goBack();
        }
      }, 2000);
    } catch (error) {
      setServerErrors(['Failed to save username. Please try again.']);
      setIsSaving(false);
    }
  }, [username, isValidFormat, serverErrors, setForumUsername, onComplete, navigation]);

  // Use suggestion
  const handleUseSuggestion = useCallback((suggestion) => {
    setUsername(suggestion);
    const result = validateUsernameFormat(suggestion);
    setFormatErrors(result.errors);
    setCharCount(result.charCount);
    setIsValidFormat(result.valid);
    setServerErrors([]);
  }, []);

  if (success) {
    return (
      <LinearGradient
        colors={[THEME.colors.neutral[1000], '#1a0a2e', THEME.colors.neutral[900]]}
        style={styles.container}
      >
        <View style={styles.successContent}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Welcome, {username}!</Text>
          <Text style={styles.successText}>
            Your username has been saved.
          </Text>
          {questReward && (
            <View style={styles.rewardBox}>
              <Text style={styles.rewardText}>
                Quest Complete! +{questReward.shardReward} Veil Shards
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[THEME.colors.neutral[1000], '#1a0a2e', THEME.colors.neutral[900]]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Name</Text>
            <Text style={styles.subtitle}>
              This is how you'll appear in the community.{'\n'}
              Choose wisely - this can only be changed once per month.
            </Text>
          </View>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={handleUsernameChange}
                onBlur={handleValidate}
                placeholder="username"
                placeholderTextColor={THEME.colors.neutral[600]}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={11}
                editable={!isSaving}
              />
              <Text style={[
                styles.charCount,
                charCount > 11 && styles.charCountError,
              ]}>
                {charCount}/11
              </Text>
            </View>

            {/* Format errors (real-time) */}
            {formatErrors.length > 0 && (
              <View style={styles.errorList}>
                {formatErrors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>• {error}</Text>
                ))}
              </View>
            )}

            {/* Server errors (after validation) */}
            {serverErrors.length > 0 && (
              <View style={[styles.errorList, styles.serverErrorList]}>
                {serverErrors.map((error, index) => (
                  <Text key={index} style={styles.serverErrorText}>• {error}</Text>
                ))}
              </View>
            )}

            {/* Validating indicator */}
            {isValidating && (
              <View style={styles.validatingRow}>
                <ActivityIndicator size="small" color={THEME.colors.primary[400]} />
                <Text style={styles.validatingText}>Checking availability...</Text>
              </View>
            )}
          </View>

          {/* Rules */}
          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>Username Rules:</Text>
            <Text style={styles.ruleItem}>• 3-11 characters</Text>
            <Text style={styles.ruleItem}>• Start with a letter</Text>
            <Text style={styles.ruleItem}>• Letters, numbers, and underscores only</Text>
            <Text style={styles.ruleItem}>• No accents, symbols, or special characters</Text>
            <Text style={styles.ruleItem}>• Keep it clean and respectful</Text>
          </View>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions:</Text>
              <View style={styles.suggestionsRow}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => handleUseSuggestion(suggestion)}
                    disabled={isSaving}
                  >
                    <Text style={styles.suggestionText}>@{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isValidFormat || isSaving || isValidating) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!isValidFormat || isSaving || isValidating}
          >
            <LinearGradient
              colors={
                isValidFormat && !isSaving && !isValidating
                  ? [THEME.colors.primary[500], THEME.colors.primary[700]]
                  : [THEME.colors.neutral[700], THEME.colors.neutral[800]]
              }
              style={styles.saveButtonGradient}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={THEME.colors.neutral[0]} />
              ) : (
                <Text style={styles.saveButtonText}>Save Username</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Cannot skip notice */}
          <Text style={styles.requiredNotice}>
            A username is required to participate in the community.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 60 : 100,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: THEME.colors.neutral[0],
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.colors.neutral[400],
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.neutral[800],
    borderRadius: 14,
    borderWidth: 2,
    borderColor: THEME.colors.neutral[700],
    paddingHorizontal: 16,
    height: 56,
  },
  inputPrefix: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.colors.primary[400],
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.neutral[100],
    paddingVertical: 0,
  },
  charCount: {
    fontSize: 13,
    color: THEME.colors.neutral[500],
    marginLeft: 8,
  },
  charCountError: {
    color: '#ef4444',
  },
  errorList: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#f97316',
    marginBottom: 4,
  },
  serverErrorList: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
  },
  serverErrorText: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 4,
  },
  validatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  validatingText: {
    fontSize: 13,
    color: THEME.colors.primary[400],
  },
  rulesBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.neutral[200],
    marginBottom: 8,
  },
  ruleItem: {
    fontSize: 13,
    color: THEME.colors.neutral[400],
    marginBottom: 4,
  },
  suggestionsContainer: {
    marginBottom: 32,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.neutral[300],
    marginBottom: 12,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: THEME.colors.neutral[800],
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.colors.neutral[700],
  },
  suggestionText: {
    fontSize: 13,
    color: THEME.colors.primary[300],
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.neutral[0],
  },
  requiredNotice: {
    fontSize: 12,
    color: THEME.colors.neutral[500],
    textAlign: 'center',
  },
  // Success state
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.colors.neutral[0],
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: THEME.colors.neutral[300],
    marginBottom: 24,
  },
  rewardBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.primary[500] + '40',
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.primary[300],
  },
});
