/**
 * Voice-to-Text Button Component
 * Uses Web Speech API for on-device transcription
 * Falls back to LLM for transcription cleanup when needed
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { THEME } from '../theme/theme';

// Check if Web Speech API is available
const getSpeechRecognition = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

/**
 * Clean up transcription using LLM
 * Fixes common speech recognition errors
 */
async function cleanupTranscription(rawText, context = {}) {
  // Only clean up if text seems garbled or has issues
  if (!rawText || rawText.length < 10) return rawText;

  try {
    // Import dynamically to avoid circular deps
    const { makeCleanupRequest } = await import('../services/cloudAPIService');

    if (typeof makeCleanupRequest === 'function') {
      const cleaned = await makeCleanupRequest(rawText, context);
      return cleaned || rawText;
    }
    return rawText;
  } catch (error) {
    console.warn('[VoiceToText] LLM cleanup failed, using raw text:', error);
    return rawText;
  }
}

/**
 * Voice-to-Text Button
 * @param {function} onTranscript - Called with transcribed text
 * @param {function} onPartialTranscript - Called with interim results (optional)
 * @param {string} language - Language code (default: 'en-US')
 * @param {boolean} continuous - Keep listening after pause (default: false)
 * @param {boolean} useLLMCleanup - Clean up transcription with LLM (default: true)
 * @param {object} style - Custom styles
 */
export function VoiceToTextButton({
  onTranscript,
  onPartialTranscript,
  language = 'en-US',
  continuous = false,
  useLLMCleanup = false, // Disabled by default to save API calls
  style,
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check support on mount
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    setIsSupported(!!SpeechRecognition);

    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const startListening = () => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      Alert.alert(
        'Not Supported',
        'Voice input is not supported in this browser. Try Chrome or Safari.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = language;
      recognition.interimResults = true;
      recognition.continuous = continuous;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimText('');
      };

      recognition.onresult = async (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Show interim results
        if (interimTranscript) {
          setInterimText(interimTranscript);
          if (onPartialTranscript) {
            onPartialTranscript(interimTranscript);
          }
        }

        // Process final results
        if (finalTranscript) {
          setInterimText('');

          let processedText = finalTranscript;

          // Optionally clean up with LLM
          if (useLLMCleanup) {
            processedText = await cleanupTranscription(finalTranscript);
          }

          if (onTranscript) {
            onTranscript(processedText);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('[VoiceToText] Error:', event.error);
        setIsListening(false);
        setInterimText('');

        if (event.error === 'not-allowed') {
          Alert.alert(
            'Microphone Access Denied',
            'Please allow microphone access to use voice input.',
            [{ text: 'OK' }]
          );
        } else if (event.error === 'no-speech') {
          // Silent timeout - not an error
        } else if (event.error !== 'aborted') {
          Alert.alert(
            'Voice Error',
            `Speech recognition error: ${event.error}`,
            [{ text: 'OK' }]
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognition.start();
    } catch (error) {
      console.error('[VoiceToText] Start error:', error);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
    setInterimText('');
  };

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Don't render on native (would need dev build)
  if (Platform.OS !== 'web') {
    return null;
  }

  // Show disabled state if not supported
  if (!isSupported) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.buttonDisabled, style]}
        onPress={() => {
          Alert.alert(
            'Not Supported',
            'Voice input requires Chrome or Safari browser.',
            [{ text: 'OK' }]
          );
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonIcon}>🎤</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={style}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.button,
            isListening && styles.buttonListening,
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonIcon}>
            {isListening ? '⏹️' : '🎤'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Listening indicator */}
      {isListening && (
        <View style={styles.listeningBadge}>
          <Text style={styles.listeningText}>
            {interimText || 'Listening...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primary[700] + '80',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.primary[500] + '50',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonListening: {
    backgroundColor: THEME.colors.semantic.error.base + '40',
    borderColor: THEME.colors.semantic.error.base,
  },
  buttonIcon: {
    fontSize: 20,
  },
  listeningBadge: {
    position: 'absolute',
    top: -30,
    left: -50,
    right: -50,
    backgroundColor: THEME.colors.neutral[800] + 'F0',
    borderRadius: THEME.borderRadius.base,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: THEME.colors.primary[500] + '50',
  },
  listeningText: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.neutral[200],
    textAlign: 'center',
  },
});

export default VoiceToTextButton;
