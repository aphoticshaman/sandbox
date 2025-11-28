/**
 * DeckViewerScreen - VeilPath WitchTok x Victorian Gothic
 * Collection viewer for three-tier tarot cards
 * Three tiers: Common (RWS), Rare (Midjourney static), Artifact (animated videos)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeDimensions } from '../utils/useSafeDimensions';
import TarotCardTiered from '../components/TarotCardTiered';
import cardManifest from '../../assets/art/card-manifest-full.json';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
} from '../components/VeilPathDesign';

export default function DeckViewerScreen({ navigation }) {
  const { width } = useSafeDimensions();
  const CARD_WIDTH = (width - 60) / 3; // 3 cards per row with padding
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, common, rare, artifact, locked
  const [selectedArcana, setSelectedArcana] = useState('all'); // all, major, minor

  // Mock user collection - replace with real state management (AsyncStorage/Redux)
  const [userCollection] = useState(() => {
    // Initialize all cards as locked with common tier only
    const initial = {};
    cardManifest.cards.forEach(card => {
      initial[card.id] = {
        unlockedTiers: ['common'], // All users start with common tier
        lastUnlockAt: null,
        viewCount: 0
      };
    });
    return initial;
  });

  // Filter logic
  const filteredCards = useMemo(() => {
    return cardManifest.cards.filter(card => {
      // Filter by arcana
      if (selectedArcana === 'major' && card.arcana !== 'major') return false;
      if (selectedArcana === 'minor' && card.arcana !== 'minor') return false;

      // Filter by tier
      if (selectedFilter === 'locked') {
        const unlocked = userCollection[card.id]?.unlockedTiers || [];
        return unlocked.length < (card.arcana === 'major' ? 3 : 2); // Major has 3 tiers, minor has 2
      }
      if (selectedFilter !== 'all') {
        const unlocked = userCollection[card.id]?.unlockedTiers || [];
        return unlocked.includes(selectedFilter);
      }

      return true;
    });
  }, [selectedFilter, selectedArcana, userCollection]);

  // Stats
  const stats = useMemo(() => {
    const total = cardManifest.cards.length;
    let commonUnlocked = 0;
    let rareUnlocked = 0;
    let artifactUnlocked = 0;

    cardManifest.cards.forEach(card => {
      const unlocked = userCollection[card.id]?.unlockedTiers || [];
      if (unlocked.includes('common')) commonUnlocked++;
      if (unlocked.includes('rare')) rareUnlocked++;
      if (unlocked.includes('artifact')) artifactUnlocked++;
    });

    return {
      total,
      commonUnlocked,
      rareUnlocked,
      artifactUnlocked,
      commonPercent: Math.round((commonUnlocked / total) * 100),
      rarePercent: Math.round((rareUnlocked / total) * 100),
      artifactPercent: Math.round((artifactUnlocked / 22) * 100) // Only 22 artifacts exist
    };
  }, [userCollection]);

  const renderCard = ({ item: card }) => {
    const unlocked = userCollection[card.id]?.unlockedTiers || ['common'];
    const highestTier = unlocked.includes('artifact') ? 'artifact' :
                        unlocked.includes('rare') ? 'rare' : 'common';

    return (
      <TouchableOpacity
        style={[styles.cardContainer, { width: CARD_WIDTH }]}
        onPress={() => navigation.navigate('CardDetail', { cardId: card.id, userCollection })}
        activeOpacity={0.8}
      >
        <TarotCardTiered
          cardId={card.id}
          tier={highestTier}
          width={CARD_WIDTH}
          showGlow={highestTier !== 'common'}
          autoPlayVideo={false} // Don't autoplay in grid view
        />

        {/* Tier badges - using text/emoji instead of image assets */}
        <View style={styles.tierBadges}>
          {['common', 'rare', 'artifact'].map(tier => {
            if (card.arcana === 'minor' && tier === 'artifact') return null; // Minor arcana don't have artifacts

            const isUnlocked = unlocked.includes(tier);
            const tierSymbol = tier === 'common' ? 'C' : tier === 'rare' ? 'R' : 'A';
            return (
              <View
                key={tier}
                style={[
                  styles.tierBadge,
                  isUnlocked ? styles.tierBadgeUnlocked : styles.tierBadgeLocked
                ]}
              >
                <Text style={[
                  styles.tierBadgeText,
                  !isUnlocked && styles.tierBadgeTextLocked
                ]}>
                  {tierSymbol}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Card name */}
        <Text style={[styles.cardName, { width: CARD_WIDTH - 10 }]} numberOfLines={1}>
          {card.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.filterBtn, selectedFilter === value && styles.filterBtnActive]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[styles.filterBtnText, selectedFilter === value && styles.filterBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ArcanaButton = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.arcanaBtn, selectedArcana === value && styles.arcanaBtnActive]}
      onPress={() => setSelectedArcana(value)}
    >
      <Text style={[styles.arcanaBtnText, selectedArcana === value && styles.arcanaBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <VeilPathScreen intensity="light" scrollable={false}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <SectionHeader
        icon="🎴"
        title="Card Collection"
        subtitle="Your mystical deck awaits"
      />

      {/* Stats Card */}
      <VictorianCard style={styles.statsCard} glowColor={COSMIC.deepAmethyst}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.commonPercent}%</Text>
            <Text style={styles.statLabel}>Common</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.rarePercent}%</Text>
            <Text style={styles.statLabel}>Rare</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statValueArtifact]}>{stats.artifactPercent}%</Text>
            <Text style={styles.statLabel}>Artifact</Text>
          </View>
        </View>
      </VictorianCard>

      {/* Arcana filter */}
      <View style={styles.arcanaFilter}>
        <ArcanaButton value="all" label="All Cards" />
        <ArcanaButton value="major" label="Major Arcana" />
        <ArcanaButton value="minor" label="Minor Arcana" />
      </View>

      {/* Tier filter */}
      <View style={styles.tierFilter}>
        <FilterButton value="all" label="All" />
        <FilterButton value="common" label="Common" />
        <FilterButton value="rare" label="Rare" />
        <FilterButton value="artifact" label="Artifact" />
        <FilterButton value="locked" label="Locked" />
      </View>

      {/* Card grid */}
      <FlatList
        data={filteredCards}
        renderItem={renderCard}
        keyExtractor={item => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={5}
        removeClippedSubviews={true}
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

  statsCard: {
    marginBottom: 16,
    padding: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  statValueArtifact: {
    color: COSMIC.deepAmethyst,
  },
  statLabel: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },

  arcanaFilter: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  arcanaBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    alignItems: 'center',
  },
  arcanaBtnActive: {
    backgroundColor: COSMIC.deepAmethyst,
    borderColor: COSMIC.candleFlame,
  },
  arcanaBtnText: {
    color: COSMIC.crystalPink,
    fontSize: 12,
    fontWeight: '600',
  },
  arcanaBtnTextActive: {
    color: COSMIC.moonGlow,
  },

  tierFilter: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.2)',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
    borderColor: COSMIC.candleFlame,
  },
  filterBtnText: {
    color: COSMIC.crystalPink,
    fontSize: 11,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: COSMIC.candleFlame,
  },

  grid: {
    paddingBottom: 100,
  },
  cardContainer: {
    marginHorizontal: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  tierBadges: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  tierBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierBadgeUnlocked: {
    backgroundColor: 'rgba(74, 20, 140, 0.4)',
  },
  tierBadgeLocked: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  tierBadgeTextLocked: {
    opacity: 0.3,
    color: COSMIC.crystalPink,
  },
  cardName: {
    fontSize: 10,
    color: COSMIC.moonGlow,
    marginTop: 6,
    textAlign: 'center',
  },
});
