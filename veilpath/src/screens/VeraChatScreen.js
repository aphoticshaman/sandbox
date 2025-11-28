/**
 * VERA CHAT SCREEN
 * Chat interface with Vera - your AI life coach
 * Human-first: warm, genuine, empathetic, down-to-earth
 *
 * Features:
 * - Token economics (free tier: 125 words, 1 chat/day)
 * - Vera personality adapts to user over time
 * - Active listening approach
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Image,
  Animated,
} from 'react-native';
import { useSafeDimensions } from '../utils/useSafeDimensions';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Clipboard from '@react-native-clipboard/clipboard';
import { generateVeraResponse } from '../services/cloudAPIService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASSETS } from '../assets/CuratedAssets';
import { MainMenuAmbience } from '../components/AmbientEffects';
import { AudioPlayerButton } from '../components';
import { COSMIC } from '../components/VeilPathDesign';
import { canUserChat, recordChat, getMaxResponseWords, getUsageSummary, getUsageState } from '../services/TokenEconomics';
import PaywallModal from '../components/PaywallModal';

// Voice features
import { VoiceToTextButton } from '../components/VoiceToTextButton';
import { useVoiceStore } from '../stores/voiceStore';
import webSpeechTTS from '../services/WebSpeechTTS';

const CHAT_HISTORY_KEY = '@veilpath_vera_chat_history';
const MAX_CONTEXT_MESSAGES = 10;

// Vera's personality greetings
const VERA_GREETINGS = [
  "Hey, what's on your mind?",
  "Hi! I'm glad you're here. What's going on?",
  "Hey there. Ready to talk through something?",
  "Hi! What would you like to explore today?",
];

export default function VeraChatScreen({ navigation, route }) {
  const { width, height } = useSafeDimensions();
  const { userProfile } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallResetTime, setPaywallResetTime] = useState(null);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Voice state
  const voiceStore = useVoiceStore();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  useEffect(() => {
    initializeChat();
    voiceStore.initialize();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Set up TTS callbacks
    webSpeechTTS.onEnd = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    return () => {
      webSpeechTTS.stop();
    };
  }, []);

  // Speak a message using TTS
  const speakMessage = useCallback((text, messageId) => {
    if (!voiceStore.voiceOutputEnabled) return;

    // Stop any current speech
    webSpeechTTS.stop();

    const voice = voiceStore.voiceOutputVoiceURI
      ? webSpeechTTS.findVoice(voiceStore.voiceOutputVoiceURI)
      : voiceStore.getRecommendedVoice();

    setIsSpeaking(true);
    setSpeakingMessageId(messageId);

    webSpeechTTS.speak(text, {
      voice,
      rate: voiceStore.voiceOutputSpeed,
      pitch: voiceStore.voiceOutputPitch,
      volume: voiceStore.voiceOutputVolume,
      onEnd: () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      },
    });
  }, [voiceStore]);

  // Stop TTS
  const stopSpeaking = useCallback(() => {
    webSpeechTTS.stop();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  // Handle voice input transcript
  const handleVoiceTranscript = useCallback((text) => {
    if (text && text.trim()) {
      setInputText(prev => prev ? `${prev} ${text}` : text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  async function initializeChat() {
    try {
      // Get actual user tier
      const usageState = await getUsageState();
      const tier = usageState?.tier || 'free';
      setUserTier(tier);

      // Check usage limits
      const usage = await getUsageSummary(tier);
      setUsageInfo(usage);

      const historyJson = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      if (historyJson) {
        const history = JSON.parse(historyJson);
        setMessages(history);
        return;
      }

      // Generate welcome message from Vera
      const greeting = VERA_GREETINGS[Math.floor(Math.random() * VERA_GREETINGS.length)];

      const welcomeMessage = {
        id: Date.now().toString(),
        role: 'vera',
        content: userProfile
          ? `${greeting}\n\nI'm Vera—think of me as a friend who's a good listener and sometimes has useful thoughts. What's on your mind, ${userProfile.name}?`
          : `${greeting}\n\nI'm Vera—part life coach, part tarot guide, all here for you. I help people find clarity, work through decisions, and discover insights. What would you like to explore?`,
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);

    } catch (error) {
      console.error('[Vera Chat] Initialization error:', error);
      Alert.alert(
        'Connection Issue',
        'Having trouble connecting. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }

  async function saveChatHistory(newMessages) {
    try {
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(newMessages));
    } catch (error) {
      console.error('[VeraChat] Error saving history:', error);
    }
  }

  async function sendMessage() {
    if (!inputText.trim() || isLoading) return;

    // CHECK USAGE LIMIT BEFORE SENDING
    const chatCheck = await canUserChat(userTier);
    if (!chatCheck.canChat) {
      // Show paywall - user has hit their daily limit
      setPaywallResetTime(chatCheck.resetTime);
      setShowPaywall(true);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now()
    };

    let updatedMessages = [...messages, userMessage];
    const contextMessages = updatedMessages.slice(-MAX_CONTEXT_MESSAGES);

    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Get max words for this tier
      const maxWords = getMaxResponseWords(userTier);

      const response = await generateVeraResponse(
        contextMessages,
        {
          userProfile,
          veraPersonality: 'vera',
          maxTokens: Math.ceil(maxWords * 1.5) // Words to tokens (rough)
        }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // RECORD THE CHAT - this counts against daily limit
      const wordCount = response.text.trim().split(/\s+/).length;
      const usageResult = await recordChat(userTier, wordCount);

      // Update usage info for UI
      const updatedUsage = await getUsageSummary(userTier);
      setUsageInfo(updatedUsage);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const messageId = (Date.now() + 1).toString();
      const veraMessage = {
        id: messageId,
        role: 'vera',
        content: response.text.trim(),
        timestamp: Date.now()
      };

      const finalMessages = [...updatedMessages, veraMessage];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);

      // Auto-speak Vera's response if voice output is enabled
      if (voiceStore.voiceOutputEnabled && voiceStore.voiceOutputAutoPlay) {
        setTimeout(() => {
          speakMessage(response.text.trim(), messageId);
        }, 500);
      }

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('[VeraChat] Error:', error);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'vera',
        content: `The connection to the cosmic web falters... ${error.message || 'Please try again, seeker.'}`,
        timestamp: Date.now()
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);
    }

    setIsLoading(false);
  }

  async function clearHistory() {
    Alert.alert(
      'Clear Chat History',
      'This will erase all messages with Vera. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
            setMessages([{
              id: Date.now().toString(),
              role: 'vera',
              content: 'The slate is cleared. Ask, and the universe shall answer anew.',
              timestamp: Date.now()
            }]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ImageBackground
        source={ASSETS.backgrounds.dialog_luna.path}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(10,10,15,0.8)', 'rgba(26,26,46,0.9)', 'rgba(10,10,15,0.95)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient particles */}
        <MainMenuAmbience />

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header with Luna portrait */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              {ASSETS.decorative.hoodedMage?.path ? (
                <Image
                  source={ASSETS.decorative.hoodedMage.path}
                  style={styles.lunaPortrait}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.lunaPortrait, styles.lunaPortraitFallback]}>
                  <Text style={styles.lunaPortraitEmoji}>🔮</Text>
                </View>
              )}
              <View style={styles.titleTextContainer}>
                <Text style={styles.headerTitle}>Vera</Text>
                <Text style={styles.headerSubtitle}>Your Personal Guide</Text>
              </View>
            </View>

            <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Chat messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLatest={index === messages.length - 1}
                onSpeak={speakMessage}
                isSpeaking={isSpeaking}
                speakingMessageId={speakingMessageId}
                voiceEnabled={voiceStore.voiceOutputEnabled}
              />
            ))}

            {isLoading && (
              <View style={styles.loadingContainer}>
                {ASSETS.decorative.hoodedMage?.path ? (
                  <Image
                    source={ASSETS.decorative.hoodedMage.path}
                    style={styles.loadingAvatar}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.loadingAvatar, styles.avatarFallback]}>
                    <Text style={styles.avatarEmoji}>🔮</Text>
                  </View>
                )}
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color="#9945FF" />
                  <Text style={styles.loadingText}>Vera is thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input area */}
          <View style={styles.inputArea}>
            {/* Voice controls bar */}
            <View style={styles.voiceControlsBar}>
              {/* Voice output toggle */}
              <TouchableOpacity
                style={[
                  styles.voiceToggleButton,
                  voiceStore.voiceOutputEnabled && styles.voiceToggleActive
                ]}
                onPress={() => voiceStore.setVoiceOutputEnabled(!voiceStore.voiceOutputEnabled)}
              >
                <Text style={styles.voiceToggleText}>
                  {voiceStore.voiceOutputEnabled ? '🔊' : '🔇'}
                </Text>
                <Text style={[
                  styles.voiceToggleLabel,
                  voiceStore.voiceOutputEnabled && styles.voiceToggleLabelActive
                ]}>
                  {voiceStore.voiceOutputEnabled ? 'Voice On' : 'Voice Off'}
                </Text>
              </TouchableOpacity>

              {/* Speaking indicator */}
              {isSpeaking && (
                <TouchableOpacity
                  style={styles.speakingIndicator}
                  onPress={stopSpeaking}
                >
                  <Text style={styles.speakingText}>⏹️ Stop</Text>
                </TouchableOpacity>
              )}

              {/* Voice settings button */}
              <TouchableOpacity
                style={styles.voiceSettingsButton}
                onPress={() => navigation.navigate('AccessibilityScreen')}
              >
                <Text style={styles.voiceSettingsText}>⚙️</Text>
              </TouchableOpacity>
            </View>

            {/* Usage indicator */}
            {usageInfo && (
              <View style={styles.usageIndicator}>
                <Text style={styles.usageText}>
                  {usageInfo.daily.remaining > 0
                    ? `${usageInfo.daily.remaining}/${usageInfo.daily.limit} chats remaining today`
                    : "Daily limit reached"}
                </Text>
                {usageInfo.daily.remaining === 0 && (
                  <TouchableOpacity onPress={() => setShowPaywall(true)}>
                    <Text style={styles.upgradeLink}>Upgrade for more →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.inputContainer}>
              {/* Voice input button */}
              {voiceStore.voiceInputEnabled && (
                <VoiceToTextButton
                  onTranscript={handleVoiceTranscript}
                  language={voiceStore.voiceInputLanguage}
                  continuous={voiceStore.voiceInputContinuous}
                  style={styles.micButton}
                />
              )}

              <TextInput
                style={[styles.input, voiceStore.voiceInputEnabled && styles.inputWithMic]}
                placeholder={usageInfo?.daily.remaining === 0 ? "Upgrade for more chats..." : "Ask Vera anything..."}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={inputText}
                onChangeText={setInputText}
                multiline
                blurOnSubmit={false}
                maxLength={500}
                editable={!isLoading && usageInfo?.daily.remaining > 0}
              />

              {/* Mic toggle (when voice input disabled) */}
              {!voiceStore.voiceInputEnabled && (
                <TouchableOpacity
                  style={styles.micToggleButton}
                  onPress={() => voiceStore.setVoiceInputEnabled(true)}
                >
                  <Text style={styles.micToggleText}>🎤</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={inputText.trim() && !isLoading ? ['#9945FF', '#7B3FD4'] : ['#444', '#333']}
                  style={styles.sendGradient}
                >
                  <Text style={styles.sendButtonText}>{isLoading ? '...' : 'Send'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Paywall Modal */}
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onUpgrade={(tier) => {
            setShowPaywall(false);
            // Navigate to upgrade/purchase screen
            navigation.navigate('Shop', { selectedTier: tier });
          }}
          type="vera_limit"
          currentTier={userTier}
          resetTime={paywallResetTime}
        />
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

/**
 * Message bubble component with DialogBox styling
 */
function MessageBubble({ message, isLatest, onSpeak, isSpeaking, speakingMessageId, voiceEnabled }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isThisMessageSpeaking = speakingMessageId === message.id;

  useEffect(() => {
    if (isLatest) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(1);
    }
  }, []);

  if (message.role === 'vera') {
    return (
      <Animated.View style={[styles.veraMessageContainer, { opacity: fadeAnim }]}>
        {ASSETS.decorative.hoodedMage?.path ? (
          <Image
            source={ASSETS.decorative.hoodedMage.path}
            style={styles.messageAvatar}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.messageAvatar, styles.avatarFallback]}>
            <Text style={styles.avatarEmoji}>🔮</Text>
          </View>
        )}
        <View style={styles.veraBubble}>
          <View style={styles.dialogBoxBackground}>
            <LinearGradient
              colors={['rgba(153, 69, 255, 0.15)', 'rgba(138, 43, 226, 0.1)']}
              style={styles.veraBubbleGradient}
            >
              <Text style={styles.veraNameLabel}>Vera</Text>
              <Text style={styles.veraText}>{message.content}</Text>

              {/* Action buttons */}
              <View style={styles.messageActions}>
                {/* Speak button */}
                {voiceEnabled && (
                  <TouchableOpacity
                    style={[styles.speakButton, isThisMessageSpeaking && styles.speakButtonActive]}
                    onPress={() => onSpeak?.(message.content, message.id)}
                  >
                    <Text style={styles.speakButtonText}>
                      {isThisMessageSpeaking ? '⏸️' : '🔊'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Copy button */}
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    Clipboard.setString(message.content);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Copied', 'Message copied to clipboard');
                  }}
                >
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Animated.View>
    );
  }

  // User message
  return (
    <Animated.View style={[styles.userMessageContainer, { opacity: fadeAnim }]}>
      <View style={styles.userBubble}>
        <LinearGradient
          colors={['rgba(0, 240, 255, 0.2)', 'rgba(0, 240, 255, 0.1)']}
          style={styles.userBubbleGradient}
        >
          <Text style={styles.userNameLabel}>You</Text>
          <Text style={styles.userText}>{message.content}</Text>

          {/* Copy button for user messages */}
          <TouchableOpacity
            style={styles.userCopyButton}
            onPress={() => {
              Clipboard.setString(message.content);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Copied', 'Message copied to clipboard');
            }}
          >
            <Text style={styles.userCopyButtonText}>Copy</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(153, 69, 255, 0.3)',
    backgroundColor: 'rgba(10, 10, 15, 0.9)',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.5)',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  backButtonText: {
    fontSize: 14,
    color: '#00F0FF',
    fontWeight: '600',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lunaPortrait: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#9945FF',
  },
  titleTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: COSMIC.candleFlame,
    fontWeight: 'bold',
    textShadowColor: COSMIC.deepAmethyst,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#00F0FF',
    marginTop: 2,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(220, 20, 60, 0.5)',
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 15,
    paddingBottom: 20,
  },
  veraMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#9945FF',
  },
  veraBubble: {
    flex: 1,
  },
  dialogBoxBackground: {
    padding: 5,
  },
  dialogBoxImage: {
    opacity: 0.9,
  },
  veraBubbleGradient: {
    padding: 20,
    paddingTop: 15,
    borderRadius: 12,
  },
  veraNameLabel: {
    fontSize: 11,
    color: COSMIC.candleFlame,
    fontWeight: 'bold',
    marginBottom: 6,
    textShadowColor: COSMIC.deepAmethyst,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  veraText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  copyButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    borderWidth: 1,
    borderColor: '#9945FF',
  },
  copyButtonText: {
    fontSize: 11,
    color: '#00F0FF',
    fontWeight: '600',
  },
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  userBubble: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.5)',
    overflow: 'hidden',
  },
  userBubbleGradient: {
    padding: 15,
  },
  userNameLabel: {
    fontSize: 11,
    color: '#00F0FF',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  userText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  userCopyButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  userCopyButtonText: {
    fontSize: 11,
    color: '#00F0FF',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    maxWidth: '85%',
  },
  loadingAvatar: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#9945FF',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(153, 69, 255, 0.5)',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#9945FF',
    fontStyle: 'italic',
  },
  inputArea: {
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    borderTopWidth: 2,
    borderTopColor: 'rgba(153, 69, 255, 0.3)',
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
  },
  usageIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  usageText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  upgradeLink: {
    fontSize: 12,
    color: '#9945FF',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(153, 69, 255, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  sendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  sendButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Fallback styles for missing assets
  lunaPortraitFallback: {
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lunaPortraitEmoji: {
    fontSize: 24,
  },
  avatarFallback: {
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  dialogBoxFallback: {
    borderWidth: 2,
    borderColor: 'rgba(153, 69, 255, 0.5)',
    borderRadius: 12,
  },

  // Voice control styles
  voiceControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  voiceToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  voiceToggleActive: {
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    borderColor: '#9945FF',
  },
  voiceToggleText: {
    fontSize: 16,
    marginRight: 6,
  },
  voiceToggleLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  voiceToggleLabelActive: {
    color: '#9945FF',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  speakingText: {
    fontSize: 12,
    color: '#FF4444',
    fontWeight: '600',
  },
  voiceSettingsButton: {
    padding: 8,
  },
  voiceSettingsText: {
    fontSize: 18,
  },
  inputWithMic: {
    marginLeft: 0,
  },
  micButton: {
    marginRight: 8,
  },
  micToggleButton: {
    padding: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.5)',
  },
  micToggleText: {
    fontSize: 18,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  speakButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.5)',
  },
  speakButtonActive: {
    backgroundColor: 'rgba(153, 69, 255, 0.4)',
    borderColor: '#9945FF',
  },
  speakButtonText: {
    fontSize: 14,
  },
});
