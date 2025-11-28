/**
 * Input Component
 * Reusable text input with label and error states
 */

import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { THEME } from '../theme/theme';

/**
 * Input Component
 *
 * @param {Object} props
 * @param {string} props.value - Input value
 * @param {Function} props.onChangeText - Change handler
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message
 * @param {boolean} props.multiline - Multiline input
 * @param {number} props.numberOfLines - Number of lines (multiline)
 * @param {string} props.keyboardType - Keyboard type
 * @param {boolean} props.secureTextEntry - Secure text (passwords)
 * @param {Object} props.style - Custom styles
 */
export function Input({
  value,
  onChangeText,
  label,
  placeholder,
  error,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  secureTextEntry = false,
  style,
  ...rest
}) {
  const hasError = !!error;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          multiline && { height: numberOfLines * 24 + THEME.spacing[4] * 2 },
          hasError && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={THEME.colors.neutral[500]}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...rest}
      />

      {hasError && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing[4],
  },
  label: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '600',
    color: THEME.colors.neutral[200],
    marginBottom: THEME.spacing[2],
  },
  input: {
    backgroundColor: THEME.colors.neutral[800],
    borderWidth: 1.5,
    borderColor: THEME.colors.primary[700],
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: THEME.spacing[4],
    paddingVertical: THEME.spacing[3],
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.neutral[0],
    minHeight: 44,
  },
  multiline: {
    paddingTop: THEME.spacing[3],
    paddingBottom: THEME.spacing[3],
  },
  inputError: {
    borderColor: THEME.colors.semantic.error.base,
  },
  error: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.semantic.error.light,
    marginTop: THEME.spacing[1],
  },
});

export default Input;
