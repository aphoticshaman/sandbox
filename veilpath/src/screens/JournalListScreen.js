/**
 * Journal List Screen - VeilPath WitchTok x Victorian Gothic
 * View all journal entries with cosmic design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
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

export default function JournalListScreen({ navigation }) {
  const journalStore = useJournalStore();
  const [searchQuery, setSearchQuery] = useState('');

  const entries = searchQuery
    ? journalStore.searchEntries(searchQuery)
    : journalStore.entries;

  const handleNewEntry = () => {
    navigation.navigate('JournalEditor', { mode: 'new' });
  };

  const handleEntryPress = (entry) => {
    navigation.navigate('JournalDetail', { entryId: entry.id });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getMoodEmoji = (mood) => {
    const moodEmojis = {
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
    return moodEmojis[mood] || '✨';
  };

  const renderEntry = ({ item: entry }) => {
    const preview = entry.content.substring(0, 120);
    const hasMore = entry.content.length > 120;

    return (
      <TouchableOpacity onPress={() => handleEntryPress(entry)}>
        <VictorianCard style={styles.entryCard} showCorners={false}>
          <View style={styles.entryHeader}>
            <View style={styles.entryMeta}>
              {entry.mood && (
                <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
              )}
              <Text style={styles.timestamp}>{formatDate(entry.createdAt)}</Text>
            </View>
            {entry.isFavorite && <Text style={styles.favorite}>⭐</Text>}
          </View>

          <Text style={styles.entryPreview}>
            {preview}{hasMore ? '...' : ''}
          </Text>

          {entry.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {entry.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {entry.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{entry.tags.length - 3}</Text>
              )}
            </View>
          )}

          <View style={styles.entryFooter}>
            <Text style={styles.wordCount}>{entry.wordCount} words</Text>
            {entry.xpAwarded > 0 && (
              <Text style={styles.xpBadge}>+{entry.xpAwarded} XP</Text>
            )}
          </View>
        </VictorianCard>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📖</Text>
      <Text style={styles.emptyTitle}>Start Your Journey</Text>
      <Text style={styles.emptyText}>
        Begin journaling to track your thoughts, feelings, and insights from your readings.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleNewEntry}>
        <Text style={styles.emptyButtonText}>✍️ Write First Entry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <>
      {/* Stats Card */}
      {entries.length > 0 && (
        <VictorianCard style={styles.statsCard} glowColor={COSMIC.deepAmethyst}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statEmoji}>📝</Text>
              <Text style={styles.statValue}>{journalStore.stats.totalWords}</Text>
              <Text style={styles.statLabel}>Total Words</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statEmoji}>📜</Text>
              <Text style={styles.statValue}>{journalStore.stats.longestEntry}</Text>
              <Text style={styles.statLabel}>Longest</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statEmoji}>✨</Text>
              <Text style={styles.statValue}>{journalStore.stats.averageWordsPerEntry}</Text>
              <Text style={styles.statLabel}>Avg Words</Text>
            </View>
          </View>
        </VictorianCard>
      )}

      {/* Search Bar */}
      {entries.length > 0 && (
        <VictorianCard style={styles.searchCard} showCorners={false}>
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search entries..."
              placeholderTextColor={COSMIC.crystalPink}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </VictorianCard>
      )}

      {/* New Entry Button */}
      {entries.length > 0 && (
        <TouchableOpacity style={styles.newButton} onPress={handleNewEntry}>
          <Text style={styles.newButtonText}>✍️ New Entry</Text>
        </TouchableOpacity>
      )}

      <CosmicDivider />
    </>
  );

  return (
    <VeilPathScreen intensity="light" scrollable={false}>
      {/* Header */}
      <SectionHeader
        icon="📖"
        title="Journal"
        subtitle={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
      />

      {/* Entries List */}
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 40,
  },

  statsCard: {
    padding: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: COSMIC.brassVictorian,
    opacity: 0.3,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  searchCard: {
    padding: 12,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COSMIC.moonGlow,
    padding: 0,
  },

  newButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
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
  newButtonText: {
    color: '#1a1f3a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },

  entryCard: {
    marginBottom: 12,
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  favorite: {
    fontSize: 18,
  },
  entryPreview: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.9,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 167, 38, 0.3)',
  },
  tagText: {
    fontSize: 11,
    color: COSMIC.candleFlame,
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.2)',
  },
  wordCount: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  xpBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 2,
    color: COSMIC.moonGlow,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  emptyText: {
    fontSize: 15,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    opacity: 0.8,
  },
  emptyButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
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
  emptyButtonText: {
    color: '#1a1f3a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
