/**
 * ANTICIPATION OVERLAY
 * Full-screen terminal overlay that builds anticipation between cards and before synthesis
 * Cyberpunk-inspired messages from Shadowrun, Aeon Flux, Blade Runner, Tron, Hackers, Matrix
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Modal } from 'react-native';
import { FlickerText, GlitchText, NeonText } from './TerminalEffects';
import { OptimizedMatrixRain } from './OptimizedMatrixRain';
import { NEON_COLORS } from '../styles/cyberpunkColors';
import { qRandom } from '../utils/quantumRNG';

const { width, height } = Dimensions.get('window');

/**
 * Cyberpunk-inspired messages for card transitions
 * Not direct quotes - inspired by the aesthetic
 */
const CARD_TRANSITION_MESSAGES = [
  'Decrypting quantum signature...',
  'Jacking into the collective unconscious...',
  'Parsing symbolic matrices...',
  'Routing through semantic networks...',
  'Compiling archetypal data...',
  'Synchronizing with shadow frequencies...',
  'Threading consciousness pathways...',
  'Accessing liminal bandwidth...',
  'Calibrating intuitive sensors...',
  'Loading dream protocols...',
  'Interfacing with the akashic mainframe...',
  'Translating symbolic entropy...',
  'Channeling archetypal energy...',
  'Decoding karmic fragments...',
  'Syncing to your timeline...',
  'Penetrating probability barriers...',
  'Scanning psychic terrain...',
  'Rendering unconscious data...',
  'Establishing neural handshake...',
  'Diving into the symbolstream...',
];

/**
 * Longer, more detailed messages for synthesis screen
 * Multi-line console output style
 */
const SYNTHESIS_MESSAGES = [
  [
    '>>> Initializing quantum synthesis engine...',
    '>>> Mapping symbolic coordinates...',
    '>>> Cross-referencing archetypal database...',
    '>>> Extracting narrative threads...',
    '>>> Weaving consciousness patterns...',
    '>>> SYNTHESIS COMPLETE',
  ],
  [
    '>>> Scanning probability manifolds...',
    '>>> Detecting synchronicity nodes...',
    '>>> Collapsing wave function...',
    '>>> Rendering shadow integration...',
    '>>> Compiling holistic wisdom...',
    '>>> INTERPRETATION READY',
  ],
  [
    '>>> Jacking into symbolic matrix...',
    '>>> Downloading archetypal firmware...',
    '>>> Parsing multi-dimensional significance...',
    '>>> Threading temporal connections...',
    '>>> Assembling meta-narrative...',
    '>>> INTEGRATION SUCCESSFUL',
  ],
  [
    '>>> Decrypting soul signature...',
    '>>> Triangulating karmic position...',
    '>>> Interfacing with collective memory...',
    '>>> Synthesizing depth layers...',
    '>>> Encoding revelations...',
    '>>> WISDOM UNLOCKED',
  ],
  [
    '>>> Penetrating the veil...',
    '>>> Accessing liminal bandwidth...',
    '>>> Compiling shadow and light...',
    '>>> Rendering symbolic truth...',
    '>>> Finalizing interpretation matrix...',
    '>>> READING SYNTHESIZED',
  ],
  [
    '>>> Initializing dream logic processor...',
    '>>> Scanning psychic topography...',
    '>>> Extracting unconscious fragments...',
    '>>> Weaving symbolic tapestry...',
    '>>> Crystallizing insights...',
    '>>> ANALYSIS COMPLETE',
  ],
  [
    '>>> Establishing neural bridge...',
    '>>> Downloading cosmic metadata...',
    '>>> Parsing semantic resonance...',
    '>>> Threading synchronicity web...',
    '>>> Assembling truth protocols...',
    '>>> SYNTHESIS ACHIEVED',
  ],
];

/**
 * AnticipationOverlay Component
 * @param {boolean} visible - Show/hide overlay
 * @param {string} type - 'card' (3-3.5s randomized) or 'synthesis' (5s)
 * @param {function} onComplete - Callback when timer completes
 */
export default function AnticipationOverlay({ visible, type = 'card', onComplete }) {
  const [messages, setMessages] = useState([]);

  // Use ref to store latest callback without triggering re-renders
  const onCompleteRef = React.useRef(onComplete);

  // Update ref when callback changes
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!visible) {
      setMessages([]);
      return;
    }

    // Calculate duration INSIDE useEffect to avoid re-calculating on every render
    // Randomize card transition duration between 3-3.5 seconds for variety
    // Synthesis stays at 5 seconds
    const duration = type === 'synthesis'
      ? 5000
      : 3000 + qRandom() * 500; // 3000-3500ms

    if (type === 'card') {
      // Single message for card transitions
      const randomMessage = CARD_TRANSITION_MESSAGES[
        Math.floor(qRandom() * CARD_TRANSITION_MESSAGES.length)
      ];
      setMessages([randomMessage]);

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        onCompleteRef.current && onCompleteRef.current();
      }, duration);

      return () => clearTimeout(timer);
    } else if (type === 'synthesis') {
      // Progressive multi-line messages for synthesis
      const messageSet = SYNTHESIS_MESSAGES[
        Math.floor(qRandom() * SYNTHESIS_MESSAGES.length)
      ];

      let currentIndex = 0;
      setMessages([messageSet[0]]);

      // Show messages progressively (every 800ms)
      const interval = setInterval(() => {
        currentIndex++;
        if (currentIndex < messageSet.length) {
          setMessages(prev => [...prev, messageSet[currentIndex]]);
        } else {
          clearInterval(interval);
        }
      }, 800);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        onCompleteRef.current && onCompleteRef.current();
      }, duration);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [visible, type]); // REMOVED duration from dependencies!

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => onCompleteRef.current && onCompleteRef.current()}
    >
      <View style={styles.overlay}>
        {/* Matrix rain background */}
        <OptimizedMatrixRain width={width} height={height} speed={60} />

        {/* Dark tint */}
        <View style={styles.darkTint} />

        {/* Message display */}
        <View style={styles.messageContainer}>
          {type === 'card' ? (
            // Single centered message for card transitions
            <GlitchText
              color={NEON_COLORS.hiCyan}
              style={styles.cardMessage}
              glitchChance={0.2}
              glitchSpeed={100}
            >
              {messages[0]}
            </GlitchText>
          ) : (
            // Progressive console output for synthesis
            <View style={styles.consoleContainer}>
              {messages.map((msg, index) => (
                <FlickerText
                  key={index}
                  color={index === messages.length - 1 ? NEON_COLORS.hiGreen : NEON_COLORS.dimCyan}
                  style={[
                    styles.consoleMessage,
                    index === messages.length - 1 && styles.finalMessage
                  ]}
                  flickerSpeed={index === messages.length - 1 ? 80 : 150}
                >
                  {msg}
                </FlickerText>
              ))}
            </View>
          )}

          {/* Loading indicator */}
          <View style={styles.loadingIndicator}>
            <FlickerText color={NEON_COLORS.dimYellow} style={styles.loadingText} flickerSpeed={120}>
              {'[ '}
              <GlitchText color={NEON_COLORS.hiYellow} glitchChance={0.25}>
                {'█'.repeat(Math.floor((messages.length / (type === 'synthesis' ? 6 : 1)) * 10))}
              </GlitchText>
              {' ]'}
            </FlickerText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    opacity: 0.7,
  },
  messageContainer: {
    zIndex: 10,
    padding: 30,
    width: width * 0.9,
    maxWidth: 500,
  },
  cardMessage: {
    fontSize: 18,
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  consoleContainer: {
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    backgroundColor: '#000000',
    padding: 20,
    marginBottom: 30,
  },
  consoleMessage: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
    lineHeight: 18,
  },
  finalMessage: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  loadingIndicator: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
