/**
 * Data Export Screen - VeilPath WitchTok x Victorian Gothic
 * Export user data in JSON and Markdown formats
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  shareJSONExport,
  shareJournalMarkdown,
  shareReadingsMarkdown,
  getExportPreview,
} from '../utils/dataExport';
import { useUserStore } from '../stores/userStore';
import { useJournalStore } from '../stores/journalStore';
import { useReadingStore } from '../stores/readingStore';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

// Cross-platform alert
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
};

export default function DataExportScreen({ navigation }) {
  const [exportingType, setExportingType] = useState(null);
  const [showPreview, setShowPreview] = useState(null);

  const userStats = useUserStore((state) => state.stats);
  const journalStats = useJournalStore((state) => state.stats);
  const readingStats = useReadingStore((state) => state.stats);

  const handleExportJSON = async () => {
    setExportingType('json');
    try {
      const result = await shareJSONExport();
      if (result.success) {
        showAlert('Export Successful', 'Your complete data has been exported as JSON.');
      } else {
        showAlert('Export Failed', result.error || 'An error occurred while exporting.');
      }
    } catch (error) {
      showAlert('Export Failed', error.message);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportJournal = async () => {
    setExportingType('journal');
    try {
      const result = await shareJournalMarkdown();
      if (result.success) {
        showAlert('Journal Exported', 'Your journal entries have been exported as Markdown.');
      } else {
        showAlert('Export Failed', result.error || 'An error occurred.');
      }
    } catch (error) {
      showAlert('Export Failed', error.message);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportReadings = async () => {
    setExportingType('readings');
    try {
      const result = await shareReadingsMarkdown();
      if (result.success) {
        showAlert('Readings Exported', 'Your reading history has been exported as Markdown.');
      } else {
        showAlert('Export Failed', result.error || 'An error occurred.');
      }
    } catch (error) {
      showAlert('Export Failed', error.message);
    } finally {
      setExportingType(null);
    }
  };

  const togglePreview = (type) => {
    setShowPreview(showPreview === type ? null : type);
  };

  const renderStatBadge = (value, label) => (
    <View style={styles.statBadge}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <SectionHeader
        icon="📦"
        title="Export Data"
        subtitle="Download your data in portable formats"
      />

      {/* Privacy Notice */}
      <VictorianCard style={styles.noticeCard} glowColor={COSMIC.etherealCyan}>
        <View style={styles.noticeHeader}>
          <Text style={styles.noticeIcon}>🔒</Text>
          <Text style={styles.noticeTitle}>Privacy First</Text>
        </View>
        <Text style={styles.noticeText}>
          Private journal entries are automatically excluded from exports. Your data stays on
          your device unless you choose to share it.
        </Text>
      </VictorianCard>

      <CosmicDivider />

      {/* Full Data Export (JSON) */}
      <VictorianCard style={styles.exportCard}>
        <View style={styles.exportHeader}>
          <Text style={styles.exportIcon}>📦</Text>
          <View style={styles.exportInfo}>
            <Text style={styles.exportTitle}>Complete Data Export</Text>
            <Text style={styles.exportDescription}>
              All data in JSON format (readings, journal, stats, achievements)
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {renderStatBadge(readingStats.totalReadings, 'Readings')}
          {renderStatBadge(journalStats.totalEntries, 'Entries')}
          {renderStatBadge(`${Math.round(userStats.totalMindfulnessMinutes)}m`, 'Mindfulness')}
        </View>

        <View style={styles.exportActions}>
          <TouchableOpacity onPress={() => togglePreview('json')}>
            <Text style={styles.previewButton}>
              {showPreview === 'json' ? 'Hide Preview' : 'Preview'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, exportingType === 'json' && styles.buttonDisabled]}
            onPress={handleExportJSON}
            disabled={exportingType === 'json'}
          >
            {exportingType === 'json' ? (
              <ActivityIndicator size="small" color="#1a1f3a" />
            ) : (
              <Text style={styles.primaryButtonText}>Export JSON</Text>
            )}
          </TouchableOpacity>
        </View>

        {showPreview === 'json' && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview (first 500 chars):</Text>
            <ScrollView style={styles.previewScroll} nestedScrollEnabled>
              <Text style={styles.previewText}>{getExportPreview('json')}</Text>
            </ScrollView>
          </View>
        )}
      </VictorianCard>

      {/* Journal Export (Markdown) */}
      <VictorianCard style={styles.exportCard}>
        <View style={styles.exportHeader}>
          <Text style={styles.exportIcon}>📖</Text>
          <View style={styles.exportInfo}>
            <Text style={styles.exportTitle}>Journal Entries</Text>
            <Text style={styles.exportDescription}>
              Beautiful Markdown file with all journal entries
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {renderStatBadge(journalStats.totalEntries, 'Entries')}
          {renderStatBadge(journalStats.totalWords.toLocaleString(), 'Words')}
          {renderStatBadge(journalStats.cbtDistortionsIdentified, 'CBT Work')}
        </View>

        <View style={styles.exportActions}>
          <TouchableOpacity onPress={() => togglePreview('journal')}>
            <Text style={styles.previewButton}>
              {showPreview === 'journal' ? 'Hide Preview' : 'Preview'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, (exportingType === 'journal' || journalStats.totalEntries === 0) && styles.buttonDisabled]}
            onPress={handleExportJournal}
            disabled={exportingType === 'journal' || journalStats.totalEntries === 0}
          >
            {exportingType === 'journal' ? (
              <ActivityIndicator size="small" color={COSMIC.candleFlame} />
            ) : (
              <Text style={styles.secondaryButtonText}>Export Markdown</Text>
            )}
          </TouchableOpacity>
        </View>

        {showPreview === 'journal' && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview (first 500 chars):</Text>
            <ScrollView style={styles.previewScroll} nestedScrollEnabled>
              <Text style={styles.previewText}>{getExportPreview('journal')}</Text>
            </ScrollView>
          </View>
        )}
      </VictorianCard>

      {/* Readings Export (Markdown) */}
      <VictorianCard style={styles.exportCard}>
        <View style={styles.exportHeader}>
          <Text style={styles.exportIcon}>🎴</Text>
          <View style={styles.exportInfo}>
            <Text style={styles.exportTitle}>Reading History</Text>
            <Text style={styles.exportDescription}>
              All tarot readings with intentions and reflections
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {renderStatBadge(readingStats.totalReadings, 'Total')}
          {renderStatBadge(readingStats.readingsByType.single, 'Single')}
          {renderStatBadge(readingStats.readingsByType['three-card'], '3-Card')}
          {renderStatBadge(readingStats.readingsByType['celtic-cross'], 'Celtic')}
        </View>

        <View style={styles.exportActions}>
          <TouchableOpacity onPress={() => togglePreview('readings')}>
            <Text style={styles.previewButton}>
              {showPreview === 'readings' ? 'Hide Preview' : 'Preview'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, (exportingType === 'readings' || readingStats.totalReadings === 0) && styles.buttonDisabled]}
            onPress={handleExportReadings}
            disabled={exportingType === 'readings' || readingStats.totalReadings === 0}
          >
            {exportingType === 'readings' ? (
              <ActivityIndicator size="small" color={COSMIC.candleFlame} />
            ) : (
              <Text style={styles.secondaryButtonText}>Export Markdown</Text>
            )}
          </TouchableOpacity>
        </View>

        {showPreview === 'readings' && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview (first 500 chars):</Text>
            <ScrollView style={styles.previewScroll} nestedScrollEnabled>
              <Text style={styles.previewText}>{getExportPreview('readings')}</Text>
            </ScrollView>
          </View>
        )}
      </VictorianCard>

      <CosmicDivider />

      {/* Info Card */}
      <VictorianCard style={styles.infoCard} showCorners={false}>
        <Text style={styles.infoTitle}>💡 Export Tips</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>JSON exports</Text> can be used to restore your data if you reinstall the app
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Markdown exports</Text> are great for reading, printing, or importing into note apps
        </Text>
        <Text style={styles.infoText}>
          • Private entries are automatically excluded from all exports
        </Text>
        <Text style={styles.infoText}>
          • Files are saved to your device and can be shared via any app
        </Text>
      </VictorianCard>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 14,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    marginBottom: 12,
  },

  noticeCard: {
    padding: 12,
    marginBottom: 12,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  noticeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
  },
  noticeText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    lineHeight: 16,
    opacity: 0.9,
  },

  exportCard: {
    marginBottom: 12,
    padding: 14,
  },
  exportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  exportIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 2,
  },
  exportDescription: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    lineHeight: 16,
    opacity: 0.8,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.2)',
  },
  statBadge: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },

  exportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewButton: {
    fontSize: 12,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },

  primaryButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#1a1f3a',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: COSMIC.brassVictorian,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(184, 134, 11, 0.1)',
  },
  secondaryButtonText: {
    color: COSMIC.candleFlame,
    fontSize: 12,
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  previewContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.2)',
  },
  previewLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    marginBottom: 6,
    opacity: 0.7,
  },
  previewScroll: {
    maxHeight: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 6,
    padding: 8,
  },
  previewText: {
    fontSize: 10,
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    lineHeight: 14,
    opacity: 0.9,
  },

  infoCard: {
    padding: 14,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    lineHeight: 18,
    marginBottom: 6,
    opacity: 0.9,
  },
  bold: {
    fontWeight: '700',
    color: COSMIC.moonGlow,
  },
});
