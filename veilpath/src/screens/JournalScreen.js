/**
 * Journal Screen - VeilPath WitchTok x Victorian Gothic
 * Personal reflection and journaling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

// Cross-platform alert
const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && buttons[1]?.onPress) buttons[1].onPress();
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message, buttons);
  }
};

const JOURNAL_KEY = '@veilpath_journal_entries';

export default function JournalScreen({ navigation, route }) {
  const { userProfile } = route.params || {};

  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [mode, setMode] = useState('write'); // write, read

  // Load journal entries
  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const data = await AsyncStorage.getItem(JOURNAL_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setEntries(parsed);
      }
    } catch (error) {
      console.error('[Journal] Error loading entries:', error);
    }
  }

  async function saveEntry() {
    if (!currentEntry.trim()) {
      showAlert('Empty Entry', 'Please write something before saving.');
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      text: currentEntry.trim(),
      timestamp: Date.now(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    setCurrentEntry('');

    try {
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(updated));
      showAlert('Saved', 'Journal entry saved successfully.');
    } catch (error) {
      console.error('[Journal] Error saving entry:', error);
      showAlert('Error', 'Failed to save entry.');
    }
  }

  async function deleteEntry(id) {
    showAlert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = entries.filter(e => e.id !== id);
            setEntries(updated);
            try {
              await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(updated));
            } catch (error) {
              console.error('[Journal] Error deleting entry:', error);
            }
          }
        }
      ]
    );
  }

  function renderEntry({ item }) {
    return (
      <VictorianCard style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>
            {item.date} {item.time}
          </Text>
          <TouchableOpacity onPress={() => deleteEntry(item.id)}>
            <Text style={styles.deleteButton}>Delete</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.entryText}>
          {item.text}
        </Text>
      </VictorianCard>
    );
  }

  return (
    <VeilPathScreen intensity="light" scrollable={false}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <SectionHeader
        icon="📖"
        title="Journal"
        subtitle="Capture your reflections"
      />

      {/* Mode selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'write' && styles.modeButtonActive]}
          onPress={() => setMode('write')}
        >
          <Text style={[styles.modeButtonText, mode === 'write' && styles.modeButtonTextActive]}>
            Write
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, mode === 'read' && styles.modeButtonActive]}
          onPress={() => setMode('read')}
        >
          <Text style={[styles.modeButtonText, mode === 'read' && styles.modeButtonTextActive]}>
            Read ({entries.length})
          </Text>
        </TouchableOpacity>
      </View>

      <CosmicDivider />

      {/* Write mode */}
      {mode === 'write' && (
        <View style={styles.writeMode}>
          <ScrollView style={styles.writeContainer}>
            <VictorianCard style={styles.promptCard} glowColor={COSMIC.deepAmethyst}>
              <Text style={styles.promptLabel}>What's on your mind today?</Text>
              <Text style={styles.promptHint}>
                Let your thoughts flow freely. This is your sacred space for reflection.
              </Text>
            </VictorianCard>

            <TextInput
              style={styles.textInput}
              value={currentEntry}
              onChangeText={setCurrentEntry}
              placeholder="Write your thoughts here..."
              placeholderTextColor={`${COSMIC.crystalPink}80`}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
            <Text style={styles.saveButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Read mode */}
      {mode === 'read' && (
        <View style={styles.readMode}>
          {entries.length === 0 ? (
            <VictorianCard style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyText}>
                Switch to Write mode to begin your journaling journey.
              </Text>
            </VictorianCard>
          ) : (
            <FlatList
              data={entries}
              renderItem={renderEntry}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.entriesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    marginBottom: 16,
  },

  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: COSMIC.deepAmethyst,
    borderColor: COSMIC.candleFlame,
    borderWidth: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.crystalPink,
  },
  modeButtonTextActive: {
    color: COSMIC.moonGlow,
  },

  writeMode: {
    flex: 1,
  },
  writeContainer: {
    flex: 1,
  },
  promptCard: {
    marginBottom: 16,
    padding: 18,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  promptHint: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COSMIC.moonGlow,
    minHeight: 250,
    lineHeight: 24,
  },
  saveButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1f3a',
    letterSpacing: 1,
  },

  readMode: {
    flex: 1,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  emptyText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },

  entriesList: {
    paddingBottom: 40,
  },
  entryCard: {
    marginBottom: 14,
    padding: 18,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.2)',
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '600',
    color: COSMIC.candleFlame,
  },
  deleteButton: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  entryText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
  },
});
