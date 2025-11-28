/**
 * CAREER COUNSELOR SCREEN
 *
 * LLM persona specialized in career guidance:
 * - Mock interviews
 * - Resume bullet improvement
 * - Career planning and strategy
 * - Job search support
 *
 * Uses cloud API with career-focused prompts
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Clipboard,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NeonText from '../components/NeonText';
import { NEON_COLORS } from '../constants/colors';
import { generateCareerGuidance } from '../services/cloudAPIService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CAREER_HISTORY_KEY = '@lunatiq_career_history';

export default function CareerCounselorScreen({ navigation, route }) {
  const { userProfile } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat'); // chat, interview, resume

  const scrollViewRef = useRef();

  // Load conversation history
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  async function loadHistory() {
    try {
      const data = await AsyncStorage.getItem(CAREER_HISTORY_KEY);
      if (data) {
        const history = JSON.parse(data);
        setMessages(history);
      } else {
        // Welcome message
        const welcome = {
          id: '0',
          role: 'counselor',
          content: `👔 **Welcome to Career Counseling** 👔\n\nI'm your career counselor. I can help you with:\n\n**🎤 Mock Interviews** - Practice answering tough interview questions\n**📄 Resume Work** - Improve bullet points and showcase achievements\n**📈 Career Strategy** - Plan your next moves and set goals\n**🔍 Job Search** - Optimize applications and outreach\n\nWhat would you like to work on today?`,
          timestamp: Date.now()
        };
        setMessages([welcome]);
      }
    } catch (error) {
      console.error('[CareerCounselor] Error loading history:', error);
    }
  }

  async function saveHistory(msgs) {
    try {
      await AsyncStorage.setItem(CAREER_HISTORY_KEY, JSON.stringify(msgs));
    } catch (error) {
      console.error('[CareerCounselor] Error saving history:', error);
    }
  }

  async function sendMessage() {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      // Build context from recent messages
      const contextMessages = updatedMessages.slice(-10).map(msg => ({
        role: msg.role === 'counselor' ? 'assistant' : 'user',
        content: msg.content
      }));

      // Get career guidance from cloud API
      const response = await generateCareerGuidance(contextMessages, {
        userProfile,
        mode,
        maxTokens: 600
      });

      const counselorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'counselor',
        content: response.text.trim(),
        timestamp: Date.now(),
        tokens: response.tokens
      };

      const finalMessages = [...updatedMessages, counselorMessage];
      setMessages(finalMessages);
      await saveHistory(finalMessages);
    } catch (error) {
      console.error('[CareerCounselor] Error:', error);
      Alert.alert('Error', error.message || 'Failed to get career guidance');
    } finally {
      setLoading(false);
    }
  }

  function handleClearHistory() {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all career counseling history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setMessages([]);
            await AsyncStorage.removeItem(CAREER_HISTORY_KEY);
            await loadHistory(); // Reload welcome message
          }
        }
      ]
    );
  }

  function handleCopyMessage(content) {
    Clipboard.setString(content);
    Alert.alert('Copied!', 'Message copied to clipboard');
  }

  function switchMode(newMode) {
    setMode(newMode);

    let modeMessage = '';
    switch (newMode) {
      case 'interview':
        modeMessage = "**Mock Interview Mode** 🎤\n\nI'll ask you common interview questions. Answer as you would in a real interview, and I'll provide feedback.\n\nReady? Here's your first question:\n\n*Tell me about yourself and why you're interested in this role.*";
        break;
      case 'resume':
        modeMessage = "**Resume Review Mode** 📄\n\nPaste a bullet point from your resume, and I'll help you make it more impactful using the STAR method (Situation, Task, Action, Result).\n\nExample:\n*Before: Managed social media accounts*\n*After: Grew Instagram following by 300% (2K to 8K) in 6 months through daily engagement and strategic content calendar*";
        break;
      default:
        modeMessage = "**Career Strategy Mode** 📈\n\nLet's talk about your career goals, job search strategy, or any career challenges you're facing.";
    }

    const systemMessage = {
      id: Date.now().toString(),
      role: 'counselor',
      content: modeMessage,
      timestamp: Date.now()
    };

    const updated = [...messages, systemMessage];
    setMessages(updated);
    saveHistory(updated);
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
          <NeonText color={NEON_COLORS.dimCyan}>[ ← BACK ]</NeonText>
        </TouchableOpacity>
        <NeonText color={NEON_COLORS.hiGreen} style={styles.title}>
          💼 CAREER COUNSELOR
        </NeonText>
        <TouchableOpacity onPress={handleClearHistory}>
          <NeonText color={NEON_COLORS.dimRed}>[ CLEAR ]</NeonText>
        </TouchableOpacity>
      </View>

      {/* Mode selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'chat' && styles.modeButtonActive]}
          onPress={() => switchMode('chat')}
        >
          <NeonText color={mode === 'chat' ? NEON_COLORS.hiCyan : NEON_COLORS.dimCyan}>
            💬 CHAT
          </NeonText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, mode === 'interview' && styles.modeButtonActive]}
          onPress={() => switchMode('interview')}
        >
          <NeonText color={mode === 'interview' ? NEON_COLORS.hiCyan : NEON_COLORS.dimCyan}>
            🎤 INTERVIEW
          </NeonText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, mode === 'resume' && styles.modeButtonActive]}
          onPress={() => switchMode('resume')}
        >
          <NeonText color={mode === 'resume' ? NEON_COLORS.hiCyan : NEON_COLORS.dimCyan}>
            📄 RESUME
          </NeonText>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.counselorBubble
              ]}
            >
              <NeonText
                color={message.role === 'user' ? NEON_COLORS.hiCyan : NEON_COLORS.hiGreen}
                style={styles.messageText}
              >
                {message.content}
              </NeonText>

              {message.role === 'counselor' && (
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopyMessage(message.content)}
                >
                  <NeonText color={NEON_COLORS.dimGreen}>[ COPY ]</NeonText>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={NEON_COLORS.hiGreen} />
              <NeonText color={NEON_COLORS.dimGreen} style={styles.loadingText}>
                Counselor is thinking...
              </NeonText>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              mode === 'interview' ? "Type your answer..." :
              mode === 'resume' ? "Paste your resume bullet..." :
              "Ask about your career..."
            }
            placeholderTextColor={NEON_COLORS.dimWhite}
            multiline
            maxLength={2000}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <NeonText
              color={inputText.trim() && !loading ? NEON_COLORS.hiGreen : NEON_COLORS.dimGreen}
            >
              [ SEND ]
            </NeonText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 15
  },
  modeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 15
  },
  modeButtonActive: {
    borderColor: NEON_COLORS.hiCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.1)'
  },
  content: {
    flex: 1
  },
  messagesContainer: {
    flex: 1
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10
  },
  messageBubble: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    borderColor: NEON_COLORS.dimCyan,
    maxWidth: '80%'
  },
  counselorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderColor: NEON_COLORS.dimGreen,
    maxWidth: '90%'
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  copyButton: {
    marginTop: 10,
    alignSelf: 'flex-end'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15
  },
  loadingText: {
    fontSize: 14
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: NEON_COLORS.dimCyan,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 10,
    padding: 12,
    color: NEON_COLORS.hiWhite,
    fontSize: 14,
    maxHeight: 100,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  sendButton: {
    paddingVertical: 12
  }
});
