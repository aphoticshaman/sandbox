/**
 * Permission Explanation Modal - VeilPath WitchTok x Victorian Gothic
 * Beautiful modal explaining why permissions are needed
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';

// Import VeilPath Design System
import {
  COSMIC,
  VictorianCard,
} from './VeilPathDesign';

export default function PermissionExplanationModal({
  visible,
  title,
  description,
  onGrant,
  onDeny,
  onCancel
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <VictorianCard style={styles.modalContainer} glowColor={COSMIC.deepAmethyst}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Permission Request</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Scrollable Description */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.description}>
              {description}
            </Text>

            <View style={styles.privacyNote}>
              <Text style={styles.privacyNoteTitle}>Privacy Note</Text>
              <Text style={styles.privacyNoteText}>
                All data stays on your device. We never collect or upload your readings, profile, or personal information to any server.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.grantButton}
              onPress={onGrant}
            >
              <Text style={styles.grantButtonText}>Grant Access</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.denyButton}
              onPress={onDeny}
            >
              <Text style={styles.denyButtonText}>No Thanks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={onCancel}
            >
              <Text style={styles.laterButtonText}>Ask Me Later</Text>
            </TouchableOpacity>
          </View>
        </VictorianCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 5, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.3)',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: 18,
    color: COSMIC.crystalPink,
    fontWeight: '600',
  },
  titleContainer: {
    padding: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.2)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  scrollView: {
    flex: 1,
    maxHeight: 260,
  },
  scrollContent: {
    padding: 18,
  },
  description: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    lineHeight: 22,
    marginBottom: 18,
  },
  privacyNote: {
    padding: 16,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    borderRadius: 10,
  },
  privacyNoteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  privacyNoteText: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    lineHeight: 18,
    opacity: 0.9,
  },
  buttonContainer: {
    padding: 18,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.3)',
  },
  grantButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  grantButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },
  denyButton: {
    backgroundColor: 'rgba(248, 187, 208, 0.1)',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COSMIC.crystalPink,
    alignItems: 'center',
  },
  denyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.crystalPink,
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
});
