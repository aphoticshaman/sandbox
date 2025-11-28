/**
 * Skill Tree Detail Screen - VeilPath WitchTok x Victorian Gothic
 * Interactive skill tree with 3 therapeutic branches
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
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

// Skill Tree Data
const SKILL_TREES = {
  cbt: {
    id: 'cbt_branch',
    name: 'Cognitive Clarity',
    icon: '🧠',
    color: COSMIC.candleFlame,
    description: 'Master cognitive distortions and thought challenging',
    tiers: [
      {
        tier: 1,
        name: 'Awareness',
        nodes: [
          {
            id: 'cbt_t1_n1',
            name: 'Distortion Spotter',
            description: 'Unlock distortion identification hints',
            cost: 1,
            effect: 'Journal shows possible distortions',
            requires: null,
          },
          {
            id: 'cbt_t1_n2',
            name: 'Thought Logger',
            description: 'Structured thought record templates',
            cost: 1,
            effect: 'ABC thought record tool',
            requires: null,
          },
        ],
      },
      {
        tier: 2,
        name: 'Challenge',
        nodes: [
          {
            id: 'cbt_t2_n1',
            name: 'Evidence Examiner',
            description: 'Guided evidence gathering',
            cost: 2,
            effect: "'Evidence For/Against' prompts",
            requires: ['cbt_t1_n1'],
          },
          {
            id: 'cbt_t2_n2',
            name: 'Alternative Thinker',
            description: 'Generate alternative thoughts',
            cost: 2,
            effect: 'Balanced alternative suggestions',
            requires: ['cbt_t1_n2'],
          },
        ],
      },
      {
        tier: 3,
        name: 'Mastery',
        nodes: [
          {
            id: 'cbt_t3_n1',
            name: 'Automatic Thought Tracker',
            description: 'Catch distortions in real-time',
            cost: 3,
            effect: 'Quick-log distortions throughout day',
            requires: ['cbt_t2_n1', 'cbt_t2_n2'],
          },
          {
            id: 'cbt_t3_n2',
            name: 'Core Belief Explorer',
            description: 'Uncover deep belief patterns',
            cost: 3,
            effect: 'Downward arrow technique tool',
            requires: ['cbt_t2_n1', 'cbt_t2_n2'],
          },
        ],
      },
    ],
  },
  dbt: {
    id: 'dbt_branch',
    name: 'Wise Mind Path',
    icon: '🧘',
    color: COSMIC.etherealCyan,
    description: 'Master DBT skills for emotional regulation',
    tiers: [
      {
        tier: 1,
        name: 'Mindfulness',
        nodes: [
          {
            id: 'dbt_t1_n1',
            name: 'Observe Practice',
            description: 'Guided observe skill practice',
            cost: 1,
            effect: 'Observe prompts in journal',
            requires: null,
          },
          {
            id: 'dbt_t1_n2',
            name: 'Describe Practice',
            description: 'Put words to experience',
            cost: 1,
            effect: 'Describe prompts (facts, no judgments)',
            requires: null,
          },
        ],
      },
      {
        tier: 2,
        name: 'Distress Tolerance',
        nodes: [
          {
            id: 'dbt_t2_n1',
            name: 'TIPP Toolkit',
            description: 'Crisis skills at your fingertips',
            cost: 2,
            effect: 'Quick-access TIPP instructions + timer',
            requires: ['dbt_t1_n1'],
          },
          {
            id: 'dbt_t2_n2',
            name: 'Radical Acceptance Guide',
            description: 'Learn to accept reality',
            cost: 2,
            effect: 'Step-by-step acceptance practice',
            requires: ['dbt_t1_n2'],
          },
          {
            id: 'dbt_t2_n3',
            name: 'Self-Soothe Kit',
            description: '5 senses self-soothing',
            cost: 2,
            effect: 'Sensory self-soothe suggestions',
            requires: ['dbt_t1_n1'],
          },
        ],
      },
      {
        tier: 3,
        name: 'Emotion Regulation',
        nodes: [
          {
            id: 'dbt_t3_n1',
            name: 'Opposite Action Master',
            description: 'The MOST powerful skill',
            cost: 3,
            effect: 'Emotion → Opposite Action guide',
            requires: ['dbt_t2_n1', 'dbt_t2_n2'],
          },
          {
            id: 'dbt_t3_n2',
            name: 'ABC PLEASE',
            description: 'Build emotional resilience',
            cost: 3,
            effect: 'Daily vulnerability tracking',
            requires: ['dbt_t2_n2', 'dbt_t2_n3'],
          },
        ],
      },
      {
        tier: 4,
        name: 'Interpersonal Effectiveness',
        nodes: [
          {
            id: 'dbt_t4_n1',
            name: 'DEAR MAN Tool',
            description: 'Ask for what you need',
            cost: 4,
            effect: 'Script generator for requests',
            requires: ['dbt_t3_n1'],
          },
          {
            id: 'dbt_t4_n2',
            name: 'GIVE & FAST',
            description: 'Relationships + self-respect',
            cost: 4,
            effect: 'Relationship skill prompts',
            requires: ['dbt_t3_n2'],
          },
        ],
      },
    ],
  },
  mindfulness: {
    id: 'mindfulness_branch',
    name: 'Present Moment',
    icon: '🌸',
    color: COSMIC.crystalPink,
    description: 'Deepen mindfulness and meditation practice',
    tiers: [
      {
        tier: 1,
        name: 'Foundation',
        nodes: [
          {
            id: 'mind_t1_n1',
            name: 'Breath Anchor',
            description: 'Master breath awareness',
            cost: 1,
            effect: 'Guided breath meditation',
            requires: null,
          },
          {
            id: 'mind_t1_n2',
            name: 'Body Check-In',
            description: '60-second body scan',
            cost: 1,
            effect: 'Quick body awareness tool',
            requires: null,
          },
        ],
      },
      {
        tier: 2,
        name: 'Practice',
        nodes: [
          {
            id: 'mind_t2_n1',
            name: 'Breathing Techniques',
            description: 'All 5 breathing methods',
            cost: 2,
            effect: 'Box, 4-7-8, coherent, sighing',
            requires: ['mind_t1_n1'],
          },
          {
            id: 'mind_t2_n2',
            name: 'Body Scan Mastery',
            description: 'Full PMR + body scan',
            cost: 2,
            effect: '20-minute guided practices',
            requires: ['mind_t1_n2'],
          },
          {
            id: 'mind_t2_n3',
            name: '5-4-3-2-1 Grounding',
            description: 'Anxiety interrupt tool',
            cost: 2,
            effect: 'Grounding exercise guide',
            requires: ['mind_t1_n2'],
          },
        ],
      },
      {
        tier: 3,
        name: 'Depth',
        nodes: [
          {
            id: 'mind_t3_n1',
            name: 'Loving-Kindness',
            description: 'Metta meditation',
            cost: 3,
            effect: 'Guided metta practice',
            requires: ['mind_t2_n1'],
          },
          {
            id: 'mind_t3_n2',
            name: 'Open Awareness',
            description: 'Choiceless awareness',
            cost: 3,
            effect: 'Advanced meditation',
            requires: ['mind_t2_n1', 'mind_t2_n2'],
          },
        ],
      },
      {
        tier: 4,
        name: 'Integration',
        nodes: [
          {
            id: 'mind_t4_n1',
            name: 'Daily Mindfulness',
            description: 'Mindful eating, walking, etc.',
            cost: 4,
            effect: 'All 28 practices unlocked',
            requires: ['mind_t3_n1', 'mind_t3_n2'],
          },
          {
            id: 'mind_t4_n2',
            name: 'Meditation Mastery',
            description: 'Custom practice builder',
            cost: 4,
            effect: 'Create custom meditation sequences',
            requires: ['mind_t3_n2'],
          },
        ],
      },
    ],
  },
};

export default function SkillTreeDetailScreen({ navigation, route }) {
  const { branchId } = route.params || { branchId: 'cbt' };
  const [selectedNode, setSelectedNode] = useState(null);

  const userStore = useUserStore();
  const skillPoints = userStore.skillTree.skillPoints;
  const unlockedNodes = userStore.skillTree.unlockedNodes;

  const tree = SKILL_TREES[branchId];

  const isNodeUnlocked = (nodeId) => {
    return unlockedNodes.includes(nodeId);
  };

  const canUnlockNode = (node) => {
    if (isNodeUnlocked(node.id)) return false;
    if (skillPoints < node.cost) return false;
    if (node.requires) {
      return node.requires.every((reqId) => isNodeUnlocked(reqId));
    }
    return true;
  };

  const handleUnlockNode = (node) => {
    if (!canUnlockNode(node)) {
      if (isNodeUnlocked(node.id)) {
        Alert.alert('Already Unlocked', 'This skill is already unlocked.', [{ text: 'OK' }]);
      } else if (skillPoints < node.cost) {
        Alert.alert(
          'Not Enough Skill Points',
          `You need ${node.cost} skill points to unlock this skill. You have ${skillPoints}.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Dependencies Not Met',
          'You must unlock the required skills first.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    Alert.alert(
      'Unlock Skill?',
      `Unlock "${node.name}" for ${node.cost} skill point${node.cost > 1 ? 's' : ''}?\n\nEffect: ${node.effect}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: () => {
            userStore.unlockSkillNode(node.id, node.cost);
            Alert.alert('Skill Unlocked!', `${node.name} is now active.`, [{ text: 'OK' }]);
          },
        },
      ]
    );
  };

  const findNodeById = (nodeId) => {
    for (const tier of tree.tiers) {
      const node = tier.nodes.find((n) => n.id === nodeId);
      if (node) return node;
    }
    return null;
  };

  const renderNode = (node) => {
    const unlocked = isNodeUnlocked(node.id);
    const canUnlock = canUnlockNode(node);
    const isSelected = selectedNode?.id === node.id;

    return (
      <TouchableOpacity
        key={node.id}
        onPress={() => setSelectedNode(isSelected ? null : node)}
      >
        <VictorianCard
          style={[
            styles.nodeCard,
            unlocked && styles.nodeCardUnlocked,
            canUnlock && !unlocked && styles.nodeCardAvailable,
            isSelected && styles.nodeCardSelected,
          ]}
          showCorners={false}
        >
          <View style={styles.nodeHeader}>
            <Text style={[styles.nodeName, unlocked && styles.nodeNameUnlocked]}>
              {node.name}
            </Text>
            {unlocked && <Text style={styles.nodeUnlockedBadge}>✓</Text>}
          </View>

          <Text style={styles.nodeDescription}>{node.description}</Text>

          <View style={[styles.nodeCostBadge, { backgroundColor: `${tree.color}30` }]}>
            <Text style={[styles.nodeCostText, { color: tree.color }]}>
              {unlocked ? '✨ Unlocked' : `${node.cost} SP`}
            </Text>
          </View>

          {isSelected && (
            <View style={styles.nodeDetail}>
              <Text style={styles.nodeDetailLabel}>Effect:</Text>
              <Text style={styles.nodeDetailText}>{node.effect}</Text>

              {node.requires && node.requires.length > 0 && (
                <>
                  <Text style={styles.nodeDetailLabel}>Requires:</Text>
                  {node.requires.map((reqId) => {
                    const reqNode = findNodeById(reqId);
                    const reqUnlocked = isNodeUnlocked(reqId);
                    return (
                      <Text
                        key={reqId}
                        style={[
                          styles.nodeRequirement,
                          reqUnlocked && styles.nodeRequirementMet,
                        ]}
                      >
                        {reqUnlocked ? '✓' : '○'} {reqNode?.name || reqId}
                      </Text>
                    );
                  })}
                </>
              )}

              {!unlocked && (
                <TouchableOpacity
                  style={[
                    styles.unlockButton,
                    canUnlock ? styles.unlockButtonActive : styles.unlockButtonLocked,
                  ]}
                  onPress={() => handleUnlockNode(node)}
                  disabled={!canUnlock}
                >
                  <Text style={[
                    styles.unlockButtonText,
                    canUnlock ? styles.unlockButtonTextActive : styles.unlockButtonTextLocked,
                  ]}>
                    {canUnlock ? '✨ Unlock Skill' : '🔒 Locked'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </VictorianCard>
      </TouchableOpacity>
    );
  };

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      {/* Branch Title */}
      <View style={styles.titleRow}>
        <View style={[styles.iconContainer, { borderColor: tree.color, backgroundColor: `${tree.color}20` }]}>
          <Text style={styles.icon}>{tree.icon}</Text>
        </View>
        <View style={styles.titleInfo}>
          <Text style={[styles.title, { color: tree.color }]}>{tree.name}</Text>
          <Text style={styles.subtitle}>{tree.description}</Text>
        </View>
      </View>

      {/* Skill Points Card */}
      <VictorianCard style={styles.pointsCard} glowColor={COSMIC.candleFlame}>
        <View style={styles.pointsRow}>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>Available Skill Points</Text>
            <Text style={styles.pointsHint}>Earn by leveling up and completing achievements</Text>
          </View>
          <Text style={styles.pointsValue}>{skillPoints}</Text>
        </View>
      </VictorianCard>

      <CosmicDivider />

      {/* Skill Tree Tiers */}
      {tree.tiers.map((tier, index) => (
        <View key={tier.tier} style={styles.tierContainer}>
          <View style={styles.tierHeader}>
            <View style={[styles.tierBadge, { backgroundColor: tree.color }]}>
              <Text style={styles.tierNumber}>{tier.tier}</Text>
            </View>
            <Text style={styles.tierName}>{tier.name}</Text>
          </View>

          <View style={styles.nodesGrid}>
            {tier.nodes.map((node) => renderNode(node))}
          </View>

          {index < tree.tiers.length - 1 && (
            <View style={[styles.tierConnector, { backgroundColor: `${tree.color}40` }]} />
          )}
        </View>
      ))}

      <CosmicDivider />

      {/* Legend */}
      <SectionHeader icon="📖" title="Legend" />
      <VictorianCard style={styles.legendCard} showCorners={false}>
        <View style={styles.legendRow}>
          <View style={[styles.legendBox, styles.nodeCardUnlocked]} />
          <Text style={styles.legendText}>Unlocked</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendBox, styles.nodeCardAvailable]} />
          <Text style={styles.legendText}>Available to unlock</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendBox, styles.nodeCard]} />
          <Text style={styles.legendText}>Locked (dependencies not met)</Text>
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

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 32,
  },
  titleInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  subtitle: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },

  pointsCard: {
    padding: 20,
    marginBottom: 20,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  pointsHint: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  pointsValue: {
    fontSize: 40,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },

  tierContainer: {
    marginBottom: 24,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tierBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  tierNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1f3a',
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },

  nodesGrid: {
    gap: 12,
  },
  nodeCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  nodeCardUnlocked: {
    borderColor: COSMIC.deepAmethyst,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
  },
  nodeCardAvailable: {
    borderColor: COSMIC.candleFlame,
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
  },
  nodeCardSelected: {
    borderColor: COSMIC.etherealCyan,
    borderWidth: 3,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeName: {
    fontSize: 15,
    fontWeight: '600',
    color: COSMIC.crystalPink,
    flex: 1,
  },
  nodeNameUnlocked: {
    color: COSMIC.moonGlow,
  },
  nodeUnlockedBadge: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
  },
  nodeDescription: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 18,
  },
  nodeCostBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nodeCostText: {
    fontSize: 11,
    fontWeight: '600',
  },

  nodeDetail: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.3)',
  },
  nodeDetailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nodeDetailText: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    opacity: 0.9,
    lineHeight: 20,
  },
  nodeRequirement: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
    marginBottom: 4,
    marginLeft: 4,
  },
  nodeRequirementMet: {
    color: COSMIC.etherealCyan,
    opacity: 1,
  },
  unlockButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  unlockButtonActive: {
    backgroundColor: COSMIC.candleFlame,
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
  unlockButtonLocked: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  unlockButtonTextActive: {
    color: '#1a1f3a',
  },
  unlockButtonTextLocked: {
    color: COSMIC.crystalPink,
    opacity: 0.5,
  },

  tierConnector: {
    height: 2,
    width: 40,
    marginLeft: 14,
    marginTop: 16,
    borderRadius: 1,
  },

  legendCard: {
    padding: 16,
    marginBottom: 40,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  legendText: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
});
