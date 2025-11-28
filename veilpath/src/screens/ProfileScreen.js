/**
 * PROFILE SCREEN (Me Page)
 * Compact design with gems, shop, locker, stats.
 * No skill tree - that's dead.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useUserStore } from '../stores/userStore';
import { useCosmeticsStore } from '../stores/cosmeticsStore';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

export default function ProfileScreen({ navigation }) {
  const user = useUserStore();
  const cosmetics = useCosmeticsStore();

  const getProgressPercentage = () => {
    return (user.progression.xp / user.progression.xpToNextLevel) * 100;
  };

  const getDaysActive = () => {
    if (!user.profile.createdAt) return 0;
    const created = new Date(user.profile.createdAt);
    const now = new Date();
    return Math.ceil(Math.abs(now - created) / (1000 * 60 * 60 * 24));
  };

  return (
    <VeilPathScreen intensity="medium" scrollable={true}>
      {/* ═══════════════════════════════════════════════════════════
          COMPACT HEADER: Level + XP + Gems + Title
      ═══════════════════════════════════════════════════════════ */}
      <VictorianCard style={styles.headerCard} glowColor={COSMIC.deepAmethyst}>
        <View style={styles.headerRow}>
          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{user.progression.level}</Text>
            <Text style={styles.levelLabel}>LEVEL</Text>
          </View>

          {/* XP + Title */}
          <View style={styles.progressSection}>
            <Text style={styles.titleText}>{user.progression.currentTitle}</Text>
            <View style={styles.xpBarContainer}>
              <View style={[styles.xpBar, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.xpText}>
              {user.progression.xp} / {user.progression.xpToNextLevel} XP
            </Text>
          </View>

          {/* Gems (tap → Shop) */}
          <TouchableOpacity
            style={styles.gemsButton}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.gemsIcon}>💎</Text>
            <Text style={styles.gemsValue}>{cosmetics.cosmicDust || 0}</Text>
          </TouchableOpacity>
        </View>
      </VictorianCard>

      {/* ═══════════════════════════════════════════════════════════
          QUICK ACTIONS: Locker, Achievements, Quests
      ═══════════════════════════════════════════════════════════ */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Locker')}
        >
          <Text style={styles.actionIcon}>🎭</Text>
          <Text style={styles.actionLabel}>Collection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Achievements')}
        >
          <Text style={styles.actionIcon}>🏆</Text>
          <Text style={styles.actionLabel}>Awards</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Quests')}
        >
          <Text style={styles.actionIcon}>📜</Text>
          <Text style={styles.actionLabel}>Quests</Text>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════
          STATS COMPACT GRID
      ═══════════════════════════════════════════════════════════ */}
      <View style={styles.statsSection}>
        <View style={styles.statsSectionHeader}>
          <Text style={styles.statsSectionTitle}>📊 Stats</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Statistics')}>
            <Text style={styles.viewAllLink}>More →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.currentStreak}</Text>
            <Text style={styles.statLabel}>🔥 Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getDaysActive()}</Text>
            <Text style={styles.statLabel}>📅 Days</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.totalReadings}</Text>
            <Text style={styles.statLabel}>🎴 Reads</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.totalJournalEntries}</Text>
            <Text style={styles.statLabel}>📖 Journal</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.totalMindfulnessPractices || 0}</Text>
            <Text style={styles.statLabel}>🧘 Practice</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.totalMindfulnessMinutes || 0}m</Text>
            <Text style={styles.statLabel}>⏱️ Mindful</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.totalCBTExercises || 0}</Text>
            <Text style={styles.statLabel}>🧠 CBT</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.totalDBTSkills || 0}</Text>
            <Text style={styles.statLabel}>💭 DBT</Text>
          </View>
        </View>
      </View>

      <CosmicDivider />

      {/* ═══════════════════════════════════════════════════════════
          MBTI COMPACT ROW
      ═══════════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={styles.mbtiRow}
        onPress={() => navigation.navigate('MBTIEncyclopedia', { setMBTI: !user.profile?.mbtiType })}
      >
        <Text style={styles.mbtiIcon}>🔮</Text>
        <View style={styles.mbtiInfo}>
          <Text style={styles.mbtiLabel}>Personality</Text>
          <Text style={styles.mbtiValue}>
            {user.profile?.mbtiType || 'Not set'}
          </Text>
        </View>
        <Text style={styles.chevron}>→</Text>
      </TouchableOpacity>

      {/* ═══════════════════════════════════════════════════════════
          UNLOCKED TITLES (compact chips)
      ═══════════════════════════════════════════════════════════ */}
      {user.progression.unlockedTitles.length > 1 && (
        <View style={styles.titlesSection}>
          <Text style={styles.titlesSectionLabel}>👑 Titles</Text>
          <View style={styles.titlesRow}>
            {user.progression.unlockedTitles.slice(0, 5).map((title, i) => (
              <View
                key={i}
                style={[
                  styles.titleChip,
                  title === user.progression.currentTitle && styles.titleChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.titleChipText,
                    title === user.progression.currentTitle && styles.titleChipTextActive,
                  ]}
                >
                  {title}
                </Text>
              </View>
            ))}
            {user.progression.unlockedTitles.length > 5 && (
              <Text style={styles.moreText}>+{user.progression.unlockedTitles.length - 5}</Text>
            )}
          </View>
        </View>
      )}

      <CosmicDivider />

      {/* ═══════════════════════════════════════════════════════════
          SETTINGS ROW
      ═══════════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={styles.settingsRow}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
        <Text style={styles.settingsLabel}>Settings</Text>
        <Text style={styles.chevron}>→</Text>
      </TouchableOpacity>

      {/* Footer Padding */}
      <View style={{ height: 40 }} />
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  // Header Card
  headerCard: {
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(74, 20, 140, 0.5)',
    borderWidth: 2,
    borderColor: COSMIC.candleFlame,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  levelLabel: {
    fontSize: 8,
    color: COSMIC.crystalPink,
    letterSpacing: 1,
    marginTop: -2,
  },
  progressSection: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  xpBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpBar: {
    height: '100%',
    backgroundColor: COSMIC.candleFlame,
    borderRadius: 3,
  },
  xpText: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  gemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.5)',
    gap: 4,
  },
  gemsIcon: {
    fontSize: 16,
  },
  gemsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(74, 20, 140, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    color: COSMIC.moonGlow,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Stats Section
  statsSection: {
    backgroundColor: 'rgba(74, 20, 140, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.2)',
  },
  statsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    letterSpacing: 1,
  },
  viewAllLink: {
    fontSize: 12,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
  },
  statLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
  },

  // MBTI Row
  mbtiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  mbtiIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  mbtiInfo: {
    flex: 1,
  },
  mbtiLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  mbtiValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  chevron: {
    fontSize: 18,
    color: COSMIC.etherealCyan,
    fontWeight: '700',
  },

  // Titles Section
  titlesSection: {
    marginBottom: 16,
  },
  titlesSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COSMIC.crystalPink,
    marginBottom: 8,
    letterSpacing: 1,
  },
  titlesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  titleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  titleChipActive: {
    backgroundColor: 'rgba(184, 134, 11, 0.3)',
    borderColor: COSMIC.candleFlame,
  },
  titleChipText: {
    fontSize: 11,
    color: COSMIC.moonGlow,
    opacity: 0.7,
  },
  titleChipTextActive: {
    color: COSMIC.candleFlame,
    opacity: 1,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 11,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },

  // Settings Row
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 20, 140, 0.15)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.2)',
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    color: COSMIC.moonGlow,
    fontWeight: '600',
  },
});
