/**
 * Achievements Screen - VeilPath WitchTok x Victorian Gothic
 * Display unlocked and locked achievements with cosmic design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useUserStore } from '../stores/userStore';
import { getContent } from '../data/contentLoader';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

const RARITY_COLORS = {
  common: COSMIC.crystalPink,
  uncommon: COSMIC.candleFlame,
  rare: COSMIC.deepAmethyst,
  epic: COSMIC.etherealCyan,
  legendary: COSMIC.starlight,
};

const CATEGORY_ICONS = {
  foundations: '🌱',
  mastery: '🎯',
  dedication: '🔥',
  discovery: '🔮',
  helping: '💝',
  challenges: '⚔️',
};

export default function AchievementsScreen({ navigation }) {
  const user = useUserStore();
  const [achievements, setAchievements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const userAchievements = user?.achievements || { unlocked: [], progress: {} };
  const unlockedList = userAchievements.unlocked || [];
  const progressMap = userAchievements.progress || {};

  useEffect(() => {
    try {
      const contentLib = getContent();
      if (contentLib && typeof contentLib.getAllAchievements === 'function') {
        const allAchievements = contentLib.getAllAchievements() || [];
        setAchievements(allAchievements);
        setFilteredAchievements(allAchievements);
      }
    } catch (error) {
      console.error('[AchievementsScreen] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setFilteredAchievements(achievements.filter((ach) => ach.category === selectedCategory));
    } else {
      setFilteredAchievements(achievements);
    }
  }, [selectedCategory, achievements]);

  const isUnlocked = (achievementId) => unlockedList.includes(achievementId);
  const getProgress = (achievement) => progressMap[achievement?.id] || 0;
  const getCategories = () => [...new Set(achievements.map((a) => a?.category).filter(Boolean))];
  const getUnlockedCount = () => unlockedList.length;
  const getTotalXPFromAchievements = () =>
    achievements.filter((a) => a?.id && isUnlocked(a.id)).reduce((sum, a) => sum + (a.xp || 0), 0);

  if (isLoading) {
    return (
      <VeilPathScreen intensity="light" scrollable={false}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>🏆</Text>
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </VeilPathScreen>
    );
  }

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation?.goBack?.()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <SectionHeader icon="🏆" title="Achievements" />

      {/* Stats Card */}
      <VictorianCard style={styles.statsCard} glowColor={COSMIC.candleFlame}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{getUnlockedCount()}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statValue}>
              {achievements.length > 0 ? Math.round((getUnlockedCount() / achievements.length) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{getTotalXPFromAchievements()}</Text>
            <Text style={styles.statLabel}>Bonus XP</Text>
          </View>
        </View>
      </VictorianCard>

      {/* Category Filters */}
      <SectionHeader icon="📂" title="Categories" />
      <View style={styles.categoriesGrid}>
        {getCategories().map((category) => {
          const isSelected = selectedCategory === category;
          const categoryAchievements = achievements.filter((a) => a?.category === category);
          const unlockedInCategory = categoryAchievements.filter((a) => isUnlocked(a.id)).length;

          return (
            <TouchableOpacity
              key={category}
              style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              onPress={() => setSelectedCategory(selectedCategory === category ? null : category)}
            >
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[category] || '🏆'}</Text>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <Text style={styles.categoryCount}>{unlockedInCategory}/{categoryAchievements.length}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <CosmicDivider />

      {/* Achievements List */}
      <SectionHeader
        icon="✨"
        title={selectedCategory ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : 'All Achievements'}
      />

      {filteredAchievements.length > 0 ? (
        filteredAchievements.map((achievement) => {
          const unlocked = isUnlocked(achievement.id);
          const progress = getProgress(achievement);

          return (
            <VictorianCard
              key={achievement.id}
              style={[styles.achievementCard, !unlocked && styles.achievementCardLocked]}
              showCorners={false}
            >
              <View style={styles.achievementHeader}>
                <View style={[
                  styles.achievementIconContainer,
                  !unlocked && styles.achievementIconLocked,
                  { borderColor: RARITY_COLORS[achievement.rarity] },
                ]}>
                  <Text style={[styles.achievementEmoji, !unlocked && styles.achievementEmojiLocked]}>
                    {unlocked ? '🏆' : '🔒'}
                  </Text>
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementName, !unlocked && styles.achievementNameLocked]}>
                    {achievement.name}
                  </Text>
                  <Text style={[styles.achievementDescription, !unlocked && styles.achievementDescriptionLocked]}>
                    {unlocked ? achievement.description : '???'}
                  </Text>
                </View>
              </View>

              <View style={styles.achievementFooter}>
                <View style={[styles.rarityBadge, { backgroundColor: `${RARITY_COLORS[achievement.rarity]}30` }]}>
                  <Text style={[styles.rarityText, { color: RARITY_COLORS[achievement.rarity] }]}>
                    {achievement.rarity}
                  </Text>
                </View>
                {unlocked && <Text style={styles.xpReward}>+{achievement.xp} XP</Text>}
              </View>

              {!unlocked && progress > 0 && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
              )}
            </VictorianCard>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyText}>No achievements in this category</Text>
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 18,
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },

  statsCard: {
    padding: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  categoryChipSelected: {
    borderColor: COSMIC.candleFlame,
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  categoryInfo: {},
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: COSMIC.crystalPink,
  },
  categoryNameSelected: {
    color: COSMIC.candleFlame,
  },
  categoryCount: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    opacity: 0.6,
  },

  achievementCard: {
    marginBottom: 12,
    padding: 16,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  achievementIconLocked: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementEmojiLocked: {
    opacity: 0.4,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  achievementNameLocked: {
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  achievementDescription: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    opacity: 0.9,
  },
  achievementDescriptionLocked: {
    fontStyle: 'italic',
    opacity: 0.5,
  },

  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  xpReward: {
    fontSize: 13,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
  },

  progressSection: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COSMIC.candleFlame,
  },
  progressText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    minWidth: 36,
    textAlign: 'right',
    opacity: 0.8,
  },

  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    opacity: 0.7,
  },
});
