/**
 * OrnateFrame - Beautiful ornate frames for content containers
 * Uses the stunning cosmic/glowing frames from curated assets
 */

import React from 'react';
import { View, Image, StyleSheet, ImageBackground } from 'react-native';
import { ASSETS } from '../assets/CuratedAssets';
import { COSMIC } from './VeilPathDesign';

/**
 * Ornate frame container with content inside
 */
export default function OrnateFrame({
  children,
  frameType = 'cosmic', // 'cosmic', 'glowing', 'dialogBox'
  width,
  height,
  style,
  contentStyle,
  padding = 30,
}) {
  const frameAsset = ASSETS.frames[frameType];

  if (!frameAsset) {
    console.error(`[OrnateFrame] Frame type "${frameType}" not found`);
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, style, { width, height }]}>
      {/* Frame background */}
      <ImageBackground
        source={frameAsset.path}
        style={styles.frame}
        resizeMode={frameAsset.resizeMode || 'contain'}
        imageStyle={styles.frameImage}
      >
        {/* Content area */}
        <View style={[styles.content, contentStyle, { padding }]}>
          {children}
        </View>
      </ImageBackground>
    </View>
  );
}

/**
 * Pre-configured frame components for common use cases
 */

// ⭐⭐⭐ COSMIC FRAME - For rewards, level-ups, premium content
export function CosmicFrame({ children, width = 300, height = 400, style, contentStyle }) {
  return (
    <OrnateFrame
      frameType="cosmic"
      width={width}
      height={height}
      style={style}
      contentStyle={contentStyle}
      padding={40}
    >
      {children}
    </OrnateFrame>
  );
}

// ⭐⭐ GLOWING FRAME - For stats, info boxes, narration
export function GlowingFrame({ children, width = 280, height = 380, style, contentStyle }) {
  return (
    <OrnateFrame
      frameType="glowing"
      width={width}
      height={height}
      style={style}
      contentStyle={contentStyle}
      padding={35}
    >
      {children}
    </OrnateFrame>
  );
}

// ⭐ DIALOG BOX - For Luna/Sol speech bubbles
export function DialogBox({ children, width = 320, style, contentStyle }) {
  return (
    <OrnateFrame
      frameType="dialogBox"
      width={width}
      style={style}
      contentStyle={contentStyle}
      padding={25}
    >
      {children}
    </OrnateFrame>
  );
}

/**
 * Reward display with cosmic frame
 */
export function RewardDisplay({ title, amount, currency, icon, style }) {
  return (
    <CosmicFrame width={260} height={320} style={style}>
      <View style={styles.rewardContainer}>
        {/* Icon/image */}
        {icon && (
          <View style={styles.rewardIcon}>
            {icon}
          </View>
        )}

        {/* Title */}
        {title && (
          <Text style={styles.rewardTitle}>{title}</Text>
        )}

        {/* Amount */}
        <View style={styles.rewardAmount}>
          <Text style={styles.amountText}>{amount}</Text>
          {currency && <Text style={styles.currencyText}>{currency}</Text>}
        </View>
      </View>
    </CosmicFrame>
  );
}

/**
 * Stats panel with glowing frame
 */
export function StatsPanel({ stats, style }) {
  return (
    <GlowingFrame width={280} height="auto" style={style}>
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </GlowingFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameImage: {
    // Image will stretch/contain based on frameAsset.resizeMode
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  rewardIcon: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rewardAmount: {
    alignItems: 'center',
    marginTop: 10,
  },
  amountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: '#9945FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  currencyText: {
    fontSize: 16,
    color: '#00F0FF',
    marginTop: 5,
  },
  statsContainer: {
    width: '100%',
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(153, 69, 255, 0.3)',
  },
  statLabel: {
    fontSize: 14,
    color: '#C0C0C0',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
