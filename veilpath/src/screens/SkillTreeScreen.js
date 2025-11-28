/**
 * Skill Tree Screen - VeilPath WitchTok x Victorian Gothic
 * Branch selector for 3 therapeutic skill trees with cosmic design
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

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

const BRANCHES = [
  {
    id: 'cbt',
    name: 'Cognitive Clarity',
    icon: '🧠',
    color: COSMIC.candleFlame,
    description: 'Master cognitive distortions and thought challenging',
    tiers: 3,
    totalNodes: 6,
  },
  {
    id: 'dbt',
    name: 'Wise Mind Path',
    icon: '🧘',
    color: COSMIC.etherealCyan,
    description: 'Master DBT skills for emotional regulation',
    tiers: 4,
    totalNodes: 11,
  },
  {
    id: 'mindfulness',
    name: 'Present Moment',
    icon: '🌸',
    color: COSMIC.crystalPink,
    description: 'Deepen mindfulness and meditation practice',
    tiers: 4,
    totalNodes: 10,
  },
];

export default function SkillTreeScreen({ navigation }) {
  const user = useUserStore();

  const getUnlockedCountForBranch = (branchId) => {
    return user.skillTree.unlockedNodes.filter((nodeId) =>
      nodeId.startsWith(branchId === 'mindfulness' ? 'mind_' : `${branchId}_`)
    ).length;
  };

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <SectionHeader icon="🌳" title="Skill Tree" subtitle="Unlock therapeutic abilities" />

      {/* Skill Points Card */}
      <VictorianCard style={styles.pointsCard} glowColor={COSMIC.candleFlame}>
        <Text style={styles.pointsEmoji}>⭐</Text>
        <Text style={styles.pointsValue}>{user.skillTree.skillPoints}</Text>
        <Text style={styles.pointsLabel}>Skill Points Available</Text>
        <Text style={styles.pointsSubtext}>Earn 1 skill point per level-up</Text>
      </VictorianCard>

      {/* Info Card */}
      <VictorianCard style={styles.infoCard} showCorners={false}>
        <Text style={styles.infoTitle}>✨ Three Paths to Mastery</Text>
        <Text style={styles.infoText}>
          Unlock powerful therapeutic skills by spending skill points. Each branch offers unique abilities and tools for mental wellness.
        </Text>
      </VictorianCard>

      <CosmicDivider />

      {/* Branches */}
      <SectionHeader icon="🔮" title="Choose a Branch" />

      {BRANCHES.map((branch) => {
        const unlockedCount = getUnlockedCountForBranch(branch.id);
        const progress = Math.round((unlockedCount / branch.totalNodes) * 100);

        return (
          <TouchableOpacity
            key={branch.id}
            onPress={() => navigation.navigate('SkillTreeDetail', { branchId: branch.id })}
          >
            <VictorianCard style={styles.branchCard} showCorners={false}>
              <View style={styles.branchHeader}>
                <View style={[styles.branchIcon, { backgroundColor: `${branch.color}20`, borderColor: branch.color }]}>
                  <Text style={styles.branchEmoji}>{branch.icon}</Text>
                </View>
                <View style={styles.branchInfo}>
                  <Text style={styles.branchName}>{branch.name}</Text>
                  <Text style={styles.branchDescription}>{branch.description}</Text>
                </View>
                <Text style={styles.chevron}>→</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: branch.color }]} />
                </View>
                <Text style={styles.progressText}>
                  {unlockedCount}/{branch.totalNodes} unlocked ({progress}%)
                </Text>
              </View>

              <View style={styles.branchFooter}>
                <Text style={styles.branchTiers}>{branch.tiers} tiers</Text>
                <Text style={styles.branchNodes}>{branch.totalNodes} nodes</Text>
              </View>
            </VictorianCard>
          </TouchableOpacity>
        );
      })}

      <CosmicDivider />

      {/* Overall Progress */}
      <SectionHeader icon="📊" title="Your Progress" />
      <VictorianCard style={styles.statsCard} showCorners={false}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.skillTree.unlockedNodes.length}</Text>
            <Text style={styles.statLabel}>Nodes Unlocked</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.progression.level}</Text>
            <Text style={styles.statLabel}>Current Level</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user.skillTree.skillPoints}</Text>
            <Text style={styles.statLabel}>Points to Spend</Text>
          </View>
        </View>
      </VictorianCard>
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

  pointsCard: {
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
  },
  pointsEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  pointsLabel: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    marginBottom: 8,
    opacity: 0.9,
  },
  pointsSubtext: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },

  infoCard: {
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    lineHeight: 20,
    opacity: 0.9,
  },

  branchCard: {
    marginBottom: 14,
    padding: 18,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  branchIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  branchEmoji: {
    fontSize: 26,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  branchDescription: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  chevron: {
    fontSize: 20,
    color: COSMIC.candleFlame,
    marginLeft: 8,
  },

  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },

  branchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.2)',
  },
  branchTiers: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  branchNodes: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },

  statsCard: {
    padding: 20,
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    opacity: 0.7,
  },
});
