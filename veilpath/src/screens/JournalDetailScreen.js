/**
 * Journal Detail Screen - VeilPath WitchTok x Victorian Gothic
 * View individual journal entry with cosmic design
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useJournalStore } from '../stores/journalStore';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

const MOOD_EMOJIS = {
  calm: '😌',
  energized: '⚡',
  peaceful: '🕊️',
  focused: '🎯',
  anxious: '😰',
  sad: '😢',
  angry: '😤',
  joyful: '😊',
  overwhelmed: '😵',
  grateful: '🙏',
};

export default function JournalDetailScreen({ navigation, route }) {
  const { entryId } = route.params;
  const journalStore = useJournalStore();

  const entry = journalStore.getEntryById(entryId);

  if (!entry) {
    return (
      <VeilPathScreen intensity="light" scrollable={false}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundEmoji}>📖</Text>
          <Text style={styles.notFoundText}>Entry not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </VeilPathScreen>
    );
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = () => {
    navigation.navigate('JournalEditor', {
      mode: 'edit',
      entryId: entry.id,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      '⚠️ Delete Entry?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            journalStore.deleteEntry(entry.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleToggleFavorite = () => {
    journalStore.toggleFavorite(entry.id);
  };

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Text style={styles.favoriteButton}>
            {entry.isFavorite ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date */}
      <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>

      {/* Mood Before/After */}
      {(entry.mood || entry.moodAfter) && (
        <VictorianCard style={styles.moodCard} showCorners={false}>
          <View style={styles.moodRow}>
            {entry.mood && (
              <View style={styles.moodItem}>
                <Text style={styles.moodLabel}>BEFORE</Text>
                <View style={styles.moodValue}>
                  <Text style={styles.moodEmoji}>{MOOD_EMOJIS[entry.mood] || '✨'}</Text>
                  <Text style={styles.moodText}>{entry.mood}</Text>
                </View>
              </View>
            )}
            {entry.mood && entry.moodAfter && (
              <Text style={styles.moodArrow}>→</Text>
            )}
            {entry.moodAfter && (
              <View style={styles.moodItem}>
                <Text style={styles.moodLabel}>AFTER</Text>
                <View style={styles.moodValue}>
                  <Text style={styles.moodEmoji}>{MOOD_EMOJIS[entry.moodAfter] || '✨'}</Text>
                  <Text style={styles.moodText}>{entry.moodAfter}</Text>
                </View>
              </View>
            )}
          </View>
        </VictorianCard>
      )}

      <CosmicDivider />

      {/* Content */}
      <VictorianCard style={styles.contentCard} glowColor={COSMIC.deepAmethyst}>
        <Text style={styles.contentText}>{entry.content}</Text>
      </VictorianCard>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <>
          <SectionHeader icon="🏷️" title="Tags" />
          <VictorianCard style={styles.tagsCard} showCorners={false}>
            <View style={styles.tagsContainer}>
              {entry.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </VictorianCard>
        </>
      )}

      {/* Metadata */}
      <SectionHeader icon="📊" title="Entry Stats" />
      <VictorianCard style={styles.metaCard} showCorners={false}>
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaEmoji}>📝</Text>
            <Text style={styles.metaValue}>{entry.wordCount}</Text>
            <Text style={styles.metaLabel}>Words</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaEmoji}>✨</Text>
            <Text style={styles.metaValue}>{entry.depthScore}/5</Text>
            <Text style={styles.metaLabel}>Depth</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaEmoji}>🌟</Text>
            <Text style={styles.metaValue}>+{entry.xpAwarded}</Text>
            <Text style={styles.metaLabel}>XP</Text>
          </View>
        </View>

        {(entry.cbtDistortions.length > 0 || entry.dbtSkills.length > 0) && (
          <View style={styles.therapyStats}>
            {entry.cbtDistortions.length > 0 && (
              <View style={styles.therapyStat}>
                <Text style={styles.therapyLabel}>🧠 CBT Work</Text>
                <Text style={styles.therapyValue}>{entry.cbtDistortions.length} distortions</Text>
              </View>
            )}
            {entry.dbtSkills.length > 0 && (
              <View style={styles.therapyStat}>
                <Text style={styles.therapyLabel}>🌀 DBT Skills</Text>
                <Text style={styles.therapyValue}>{entry.dbtSkills.length} practiced</Text>
              </View>
            )}
          </View>
        )}
      </VictorianCard>

      <CosmicDivider />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleEdit}>
          <Text style={styles.primaryButtonText}>✏️ Edit Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleDelete}>
          <Text style={styles.dangerButtonText}>Delete Entry</Text>
        </TouchableOpacity>
      </View>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backLink: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },
  favoriteButton: {
    fontSize: 32,
  },

  date: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 1,
    color: COSMIC.moonGlow,
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },

  moodCard: {
    padding: 16,
    marginBottom: 16,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodItem: {
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COSMIC.crystalPink,
    letterSpacing: 2,
    marginBottom: 8,
  },
  moodValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  moodText: {
    fontSize: 16,
    color: COSMIC.moonGlow,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  moodArrow: {
    fontSize: 24,
    color: COSMIC.candleFlame,
    marginHorizontal: 20,
  },

  contentCard: {
    padding: 24,
    marginBottom: 20,
  },
  contentText: {
    fontSize: 16,
    color: COSMIC.moonGlow,
    lineHeight: 28,
    opacity: 0.95,
  },

  tagsCard: {
    padding: 16,
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 167, 38, 0.4)',
  },
  tagText: {
    fontSize: 13,
    color: COSMIC.candleFlame,
    fontWeight: '600',
  },

  metaCard: {
    padding: 20,
    marginBottom: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  metaValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  therapyStats: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.2)',
  },
  therapyStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  therapyLabel: {
    fontSize: 14,
    color: COSMIC.moonGlow,
  },
  therapyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.etherealCyan,
  },

  actions: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primaryButtonText: {
    color: '#1a1f3a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dangerButton: {
    borderWidth: 2,
    borderColor: 'rgba(139, 0, 0, 0.5)',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
  },
  dangerButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },

  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  notFoundEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  notFoundText: {
    fontSize: 20,
    color: COSMIC.moonGlow,
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: COSMIC.etherealCyan,
    fontSize: 16,
    fontWeight: '600',
  },
});
