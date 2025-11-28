/**
 * Skeleton Loader Components
 * Animated skeleton screens for better perceived performance
 *
 * Usage:
 * <SkeletonCard />
 * <SkeletonText width="60%" />
 * <SkeletonCircle size={48} />
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { THEME } from '../theme/theme';

// Base skeleton component with shimmer animation
function SkeletonBase({ style, children }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeleton, style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

// Skeleton text line
export function SkeletonText({ width = '100%', height = 16, style }) {
  return <SkeletonBase style={[styles.skeletonText, { width, height }, style]} />;
}

// Skeleton circle (for avatars, icons, etc.)
export function SkeletonCircle({ size = 40, style }) {
  return (
    <SkeletonBase
      style={[styles.skeletonCircle, { width: size, height: size, borderRadius: size / 2 }, style]}
    />
  );
}

// Skeleton card
export function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonBase style={styles.cardSkeleton} />
    </View>
  );
}

// Skeleton for stat card (used in profile/statistics)
export function SkeletonStatCard() {
  return (
    <View style={styles.statCard}>
      <SkeletonCircle size={32} style={styles.statIcon} />
      <SkeletonText width="60%" height={24} style={styles.statValue} />
      <SkeletonText width="80%" height={12} style={styles.statLabel} />
    </View>
  );
}

// Skeleton for reading card
export function SkeletonReadingCard() {
  return (
    <View style={styles.readingCard}>
      <View style={styles.readingHeader}>
        <SkeletonText width="40%" height={18} />
        <SkeletonText width="30%" height={14} />
      </View>
      <SkeletonBase style={styles.tarotCard} />
      <SkeletonText width="100%" height={14} style={{ marginTop: THEME.spacing[2] }} />
      <SkeletonText width="90%" height={14} style={{ marginTop: THEME.spacing[1] }} />
      <SkeletonText width="70%" height={14} style={{ marginTop: THEME.spacing[1] }} />
    </View>
  );
}

// Skeleton for journal entry
export function SkeletonJournalEntry() {
  return (
    <View style={styles.journalEntry}>
      <View style={styles.journalHeader}>
        <SkeletonText width="50%" height={18} />
        <SkeletonText width="30%" height={14} />
      </View>
      <View style={styles.journalMood}>
        <SkeletonCircle size={24} />
        <SkeletonText width="40%" height={14} style={{ marginLeft: THEME.spacing[2] }} />
      </View>
      <SkeletonText width="100%" height={14} style={{ marginTop: THEME.spacing[3] }} />
      <SkeletonText width="95%" height={14} style={{ marginTop: THEME.spacing[1] }} />
      <SkeletonText width="85%" height={14} style={{ marginTop: THEME.spacing[1] }} />
      <SkeletonText width="60%" height={14} style={{ marginTop: THEME.spacing[1] }} />
    </View>
  );
}

// Skeleton for list item
export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <SkeletonCircle size={40} />
      <View style={styles.listItemContent}>
        <SkeletonText width="70%" height={16} />
        <SkeletonText width="50%" height={12} style={{ marginTop: THEME.spacing[1] }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: THEME.colors.neutral[800],
  },
  skeletonText: {
    borderRadius: THEME.borderRadius.sm,
    marginVertical: THEME.spacing[1],
  },
  skeletonCircle: {
    backgroundColor: THEME.colors.neutral[800],
  },
  card: {
    backgroundColor: THEME.colors.neutral[900],
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing[4],
    marginBottom: THEME.spacing[3],
    borderWidth: 1,
    borderColor: THEME.colors.neutral[800],
  },
  cardSkeleton: {
    height: 120,
    borderRadius: THEME.borderRadius.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: THEME.colors.neutral[900],
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.neutral[800],
  },
  statIcon: {
    marginBottom: THEME.spacing[2],
  },
  statValue: {
    marginBottom: THEME.spacing[1],
  },
  statLabel: {
    marginBottom: 0,
  },
  readingCard: {
    backgroundColor: THEME.colors.neutral[900],
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing[4],
    marginBottom: THEME.spacing[3],
    borderWidth: 1,
    borderColor: THEME.colors.neutral[800],
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing[3],
  },
  tarotCard: {
    height: 200,
    borderRadius: THEME.borderRadius.md,
  },
  journalEntry: {
    backgroundColor: THEME.colors.neutral[900],
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing[4],
    marginBottom: THEME.spacing[3],
    borderWidth: 1,
    borderColor: THEME.colors.neutral[800],
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing[2],
  },
  journalMood: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing[3],
    backgroundColor: THEME.colors.neutral[900],
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing[2],
    borderWidth: 1,
    borderColor: THEME.colors.neutral[800],
  },
  listItemContent: {
    flex: 1,
    marginLeft: THEME.spacing[3],
  },
});

export default {
  Text: SkeletonText,
  Circle: SkeletonCircle,
  Card: SkeletonCard,
  StatCard: SkeletonStatCard,
  ReadingCard: SkeletonReadingCard,
  JournalEntry: SkeletonJournalEntry,
  ListItem: SkeletonListItem,
};
