/**
 * Mindfulness Home Screen - VeilPath WitchTok x Victorian Gothic
 * Browse 28 evidence-based mindfulness practices with cosmic design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { PlaylistCard } from '../components';
import { getContent } from '../data/contentLoader';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
  FeaturePill,
} from '../components/VeilPathDesign';

const CATEGORIES = [
  { id: 'breathing_techniques', name: 'Breathing', icon: '🌬️', description: 'Nervous system regulation' },
  { id: 'body_scan', name: 'Body Scan', icon: '🧘', description: 'Somatic awareness' },
  { id: 'sensory_grounding', name: 'Grounding', icon: '🌿', description: 'Present moment anchoring' },
  { id: 'meditation', name: 'Meditation', icon: '🕉️', description: 'Contemplative practice' },
  { id: 'movement', name: 'Movement', icon: '💃', description: 'Embodied awareness' },
  { id: 'daily_activities', name: 'Daily Life', icon: '🍵', description: 'Mindfulness in action' },
];

const DIFFICULTY_COLORS = {
  beginner: COSMIC.etherealCyan,
  intermediate: COSMIC.candleFlame,
  advanced: COSMIC.crystalPink,
};

export default function MindfulnessHomeScreen({ navigation }) {
  const [exercises, setExercises] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredExercises, setFilteredExercises] = useState([]);

  useEffect(() => {
    const contentLib = getContent();
    const allExercises = contentLib.getAllMindfulnessExercises();
    setExercises(allExercises);
    setFilteredExercises(allExercises);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setFilteredExercises(exercises.filter((ex) => ex.category === selectedCategory));
    } else {
      setFilteredExercises(exercises);
    }
  }, [selectedCategory, exercises]);

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleExercisePress = (exercise) => {
    navigation.navigate('MindfulnessPractice', { exercise });
  };

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find((cat) => cat.id === categoryId);
  };

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      <SectionHeader
        icon="🧘"
        title="Mindfulness"
        subtitle={`${exercises.length} evidence-based practices`}
      />

      {/* Info Card */}
      <VictorianCard style={styles.infoCard} glowColor={COSMIC.deepAmethyst}>
        <Text style={styles.infoTitle}>🌙 MBSR • DBT • Contemplative Traditions</Text>
        <Text style={styles.infoText}>
          From Jon Kabat-Zinn's Mindfulness-Based Stress Reduction, Marsha Linehan's DBT, and ancient wisdom traditions.
        </Text>
        <View style={styles.pillsRow}>
          <FeaturePill icon="✨" text="Evidence-Based" />
          <FeaturePill icon="🎴" text="Tarot-Aligned" />
        </View>
      </VictorianCard>

      {/* Ambient Music Section */}
      <SectionHeader icon="🎵" title="Ambient Music" subtitle="Enhance your practice" />
      <View style={styles.musicSection}>
        <PlaylistCard playlistId="meditation" style={styles.playlistCard} />
        <PlaylistCard playlistId="breathing" style={styles.playlistCard} />
        <PlaylistCard playlistId="sleep" style={styles.playlistCard} />
      </View>

      <CosmicDivider />

      {/* Category Filters */}
      <SectionHeader icon="📂" title="Categories" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <CosmicDivider />

      {/* Exercises List */}
      <SectionHeader
        icon="✨"
        title={selectedCategory ? getCategoryInfo(selectedCategory)?.name + ' Practices' : 'All Practices'}
      />

      {filteredExercises.length > 0 ? (
        filteredExercises.map((exercise) => {
          const categoryInfo = getCategoryInfo(exercise.category);
          return (
            <TouchableOpacity
              key={exercise.id}
              onPress={() => handleExercisePress(exercise)}
            >
              <VictorianCard style={styles.exerciseCard} showCorners={false}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseTitle}>
                    <Text style={styles.exerciseEmoji}>{categoryInfo?.icon || '✨'}</Text>
                    <View style={styles.exerciseTitleText}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseCategory}>
                        {categoryInfo?.name || exercise.category}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.duration}>{exercise.duration_minutes}m</Text>
                  </View>
                </View>

                <Text style={styles.description}>{exercise.description}</Text>

                <View style={styles.exerciseFooter}>
                  <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: `${DIFFICULTY_COLORS[exercise.difficulty]}20` },
                  ]}>
                    <Text style={[
                      styles.difficultyText,
                      { color: DIFFICULTY_COLORS[exercise.difficulty] },
                    ]}>
                      {exercise.difficulty}
                    </Text>
                  </View>
                  <Text style={styles.xpBadge}>+{exercise.xp_reward} XP</Text>
                </View>
              </VictorianCard>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🧘</Text>
          <Text style={styles.emptyText}>No practices found in this category</Text>
        </View>
      )}
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    opacity: 0.9,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  // Music section (WitchTok styled)
  musicSection: {
    marginBottom: 16,
    gap: 8,
  },
  playlistCard: {
    marginBottom: 0,
  },

  categoryScroll: {
    marginBottom: 16,
  },
  categoryContent: {
    paddingBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.4)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  categoryChipSelected: {
    borderColor: COSMIC.candleFlame,
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.crystalPink,
  },
  categoryNameSelected: {
    color: COSMIC.candleFlame,
  },

  exerciseCard: {
    marginBottom: 12,
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  exerciseTitleText: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  exerciseMeta: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  description: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.9,
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.2)',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  xpBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
  },

  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    opacity: 0.7,
  },
});
