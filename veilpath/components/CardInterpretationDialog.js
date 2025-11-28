import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Card Interpretation Dialog Component
 *
 * Fancy dialog box that appears below tarot card with:
 * - Card name
 * - Meaning
 * - Interpretation message
 * - "Ask Questions" button
 */
export default function CardInterpretationDialog({ card, onAskQuestions }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <ImageBackground
      source={require('../assets/art/ui/aphoticshaman_dark_fantasy_game_dialog_box_ornate_frame_with__4ef0f04f-5c9b-4527-b014-4aab749f7566_0.png')}
      style={styles.container}
      resizeMode="stretch"
    >
      <LinearGradient
        colors={['rgba(26, 26, 46, 0.95)', 'rgba(42, 42, 78, 0.95)']}
        style={styles.gradient}
      >
        {/* Card name header */}
        <View style={styles.header}>
          <View style={styles.headerDivider} />
          <Text style={styles.cardName}>
            {card.isReversed && '⤾ '}
            {card.name}
            {card.isReversed && ' ⤿'}
          </Text>
          <View style={styles.headerDivider} />
        </View>

        {/* Meaning (keywords) */}
        <Text style={styles.meaning}>{card.meaning}</Text>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerSymbol}>✦</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Interpretation message */}
        <View style={[styles.messageContainer, expanded && styles.messageExpanded]}>
          <Text style={styles.message} numberOfLines={expanded ? 0 : 3}>
            {card.message}
          </Text>
        </View>

        {/* Expand/collapse toggle */}
        {card.message.length > 100 && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={styles.expandText}>
              {expanded ? '▲ Show Less' : '▼ Read More'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.askButton}
            onPress={onAskQuestions}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8a2be2', '#6a1bb2']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.askButtonText}>💬 Ask the Oracle</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconButtonText}>📖 Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconButtonText}>🔄 Draw Again</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ornamental corners */}
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 250,
    marginTop: 20,
  },
  gradient: {
    flex: 1,
    padding: 25,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8a2be2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#8a2be2',
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ffff',
    marginHorizontal: 15,
    textAlign: 'center',
    textShadowColor: '#8a2be2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  meaning: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#8a2be2',
    opacity: 0.5,
  },
  dividerSymbol: {
    color: '#00ffff',
    fontSize: 18,
    marginHorizontal: 15,
  },
  messageContainer: {
    marginBottom: 10,
  },
  messageExpanded: {
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    textAlign: 'center',
  },
  expandButton: {
    alignSelf: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  expandText: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    marginTop: 10,
  },
  askButton: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  askButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  iconButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  iconButtonText: {
    color: '#00ffff',
    fontSize: 14,
    fontWeight: '600',
  },
  corner: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderColor: '#00ffff',
    borderWidth: 2,
  },
  cornerTopLeft: {
    top: 10,
    left: 10,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 10,
    right: 10,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 10,
    left: 10,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 10,
    right: 10,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});
