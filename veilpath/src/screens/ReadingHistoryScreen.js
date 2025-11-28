/**
 * Reading History Screen - VeilPath WitchTok x Victorian Gothic
 * View all past readings with cosmic design
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { TarotCard } from '../components';
import { useReadingStore } from '../stores/readingStore';
import { getCardById } from '../data/tarotDeckAdapter';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
} from '../components/VeilPathDesign';

export default function ReadingHistoryScreen({ navigation }) {
  const readingStore = useReadingStore();
  const readings = readingStore.history;

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getReadingTypeLabel = (type) => {
    switch (type) {
      case 'single': return '🎴 Single Card';
      case 'three-card': return '🔮 Three-Card Spread';
      case 'celtic-cross': return '✨ Celtic Cross';
      default: return type;
    }
  };

  const handleReadingPress = (reading) => {
    const firstCard = reading.cards[0];
    const card = getCardById(parseInt(firstCard.cardId, 10));
    if (card) {
      navigation.navigate('CardInterpretation', {
        card,
        isReversed: firstCard.isReversed,
        readingType: reading.type,
      });
    }
  };

  const renderReading = ({ item: reading }) => {
    const firstCard = reading.cards[0];
    const card = getCardById(parseInt(firstCard.cardId, 10));

    if (!card) return null;

    return (
      <TouchableOpacity onPress={() => handleReadingPress(reading)}>
        <VictorianCard style={styles.readingCard} showCorners={false}>
          <View style={styles.readingContent}>
            {/* Card Preview */}
            <View style={styles.cardPreview}>
              <TarotCard
                card={card}
                isReversed={firstCard.isReversed}
                size="sm"
                showName={false}
                interactive={false}
              />
            </View>

            {/* Reading Info */}
            <View style={styles.readingInfo}>
              <View style={styles.readingHeader}>
                <Text style={styles.readingType}>
                  {getReadingTypeLabel(reading.type)}
                </Text>
                {reading.isFavorite && (
                  <Text style={styles.favoriteIcon}>⭐</Text>
                )}
              </View>

              {reading.intention && (
                <Text style={styles.intention} numberOfLines={2}>
                  "{reading.intention}"
                </Text>
              )}

              <Text style={styles.cardCount}>
                {reading.cards.length} {reading.cards.length === 1 ? 'card' : 'cards'}
              </Text>

              <Text style={styles.timestamp}>
                {formatDate(reading.completedAt)}
              </Text>
            </View>

            {/* Arrow */}
            <Text style={styles.arrow}>→</Text>
          </View>
        </VictorianCard>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <VictorianCard style={styles.emptyCard} glowColor={COSMIC.deepAmethyst}>
      <Text style={styles.emptyIcon}>🔮</Text>
      <Text style={styles.emptyTitle}>No Readings Yet</Text>
      <Text style={styles.emptyText}>
        Your reading history will appear here once you complete your first reading.
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('ReadingTypeSelection')}
      >
        <Text style={styles.startButtonText}>✨ Start a Reading</Text>
      </TouchableOpacity>
    </VictorianCard>
  );

  return (
    <VeilPathScreen intensity="light" scrollable={false}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <SectionHeader
        icon="📖"
        title="Reading History"
        subtitle={`${readings.length} ${readings.length === 1 ? 'reading' : 'readings'}`}
      />

      <FlatList
        data={readings}
        renderItem={renderReading}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
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

  listContent: {
    paddingBottom: 40,
  },

  readingCard: {
    marginBottom: 12,
    padding: 16,
  },
  readingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPreview: {
    marginRight: 16,
  },
  readingInfo: {
    flex: 1,
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  readingType: {
    fontSize: 15,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    flex: 1,
  },
  favoriteIcon: {
    fontSize: 16,
  },
  intention: {
    fontSize: 13,
    color: COSMIC.candleFlame,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardCount: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timestamp: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.5,
  },
  arrow: {
    fontSize: 20,
    color: COSMIC.candleFlame,
    marginLeft: 12,
  },

  emptyCard: {
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  emptyText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 14,
    paddingHorizontal: 28,
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
  startButtonText: {
    color: '#1a1f3a',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
