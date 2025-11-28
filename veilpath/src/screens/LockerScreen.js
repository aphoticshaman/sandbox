/**
 * LOCKER SCREEN - VeilPath Collection Viewer
 * View and equip owned cosmetics, see locked items and unlock requirements
 *
 * CATEGORIES:
 * - Card Backs (including animated mp4s)
 * - Flip Animations
 * - Transitions
 * - Deck Versions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  useCosmeticsStore,
  CARD_BACKS,
  TRANSITION_EFFECTS,
  DECK_VERSIONS,
  getCardBackAsset,
  SHOP_FLIP_ANIMATIONS,
  LOCKER_FLIP_ANIMATIONS,
} from '../stores/cosmeticsStore';

import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

// Animated card back assets (mp4)
const ANIMATED_CARD_BACKS = {
  card_back_animated: {
    id: 'card_back_animated',
    name: 'Living Mystic',
    description: 'Animated cosmic energy',
    rarity: 'legendary',
    isAnimated: true,
    source: require('../../assets/art/cardback/card_back_animated.mp4'),
    unlocked: false,
    unlockRequirement: { type: 'purchase', price: 2000 },
  },
  download_42_animated: {
    id: 'download_42_animated',
    name: 'Blood Moon Rising',
    description: 'The moon awakens',
    rarity: 'epic',
    isAnimated: true,
    source: require('../../assets/art/cardback/download (42)_animated.mp4'),
    unlocked: false,
    unlockRequirement: { type: 'streak', value: 30 },
  },
  download_45_animated: {
    id: 'download_45_animated',
    name: 'Shadow Dance',
    description: 'Shadows in motion',
    rarity: 'epic',
    isAnimated: true,
    source: require('../../assets/art/cardback/download (45)_animated.mp4'),
    unlocked: false,
    unlockRequirement: { type: 'level', value: 25 },
  },
};

// All card backs combined
const ALL_CARD_BACKS = { ...CARD_BACKS, ...ANIMATED_CARD_BACKS };

// Rarity colors
const RARITY_COLORS = {
  common: COSMIC.moonGlow,
  rare: COSMIC.crystalPink,
  epic: COSMIC.etherealCyan,
  legendary: COSMIC.candleFlame,
};

// Tab definitions
const TABS = [
  { id: 'cardBacks', label: 'Card Backs', icon: '🎴' },
  { id: 'animations', label: 'Flip FX', icon: '✨' },
  { id: 'transitions', label: 'Transitions', icon: '🌀' },
  { id: 'decks', label: 'Deck Art', icon: '🃏' },
];

export default function LockerScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('cardBacks');
  const cosmetics = useCosmeticsStore();

  const unlockedCardBacks = cosmetics.unlockedCardBacks || [];
  const equippedCardBack = cosmetics.equipped?.cardBack || 'celestial_default';
  const equippedFlipAnimation = cosmetics.equipped?.flipAnimation || 'classic';
  const equippedTransition = cosmetics.equipped?.transitionIn || 'fade';
  const cosmicDust = cosmetics.cosmicDust || 0;

  // Stats
  const totalCardBacks = Object.keys(ALL_CARD_BACKS).length;
  const ownedCardBacks = unlockedCardBacks.length;
  const totalAnimations = Object.keys({ ...SHOP_FLIP_ANIMATIONS, ...LOCKER_FLIP_ANIMATIONS }).length;
  const ownedAnimations = cosmetics.unlockedFlipAnimations?.length || 2;

  const handleEquipCardBack = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cosmetics.equipCardBack(id);
  };

  const handleEquipAnimation = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cosmetics.equipFlipAnimation(id);
  };

  const handleEquipTransition = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cosmetics.equipTransition(id);
  };

  const handlePurchase = (type, id, price) => {
    if (cosmicDust < price) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Could show a modal here
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (type === 'cardBack') {
      cosmetics.purchaseCosmetic('cardBack', id);
    } else if (type === 'animation') {
      cosmetics.purchaseFlipAnimation(id);
    } else if (type === 'transition') {
      cosmetics.purchaseCosmetic('transition', id);
    }
  };

  const renderCardBacksTab = () => {
    const items = Object.values(ALL_CARD_BACKS);

    return (
      <View style={styles.gridContainer}>
        {items.map((item) => {
          const isOwned = unlockedCardBacks.includes(item.id);
          const isEquipped = equippedCardBack === item.id;
          const canPurchase = item.unlockRequirement?.type === 'purchase';
          const price = item.unlockRequirement?.price;

          return (
            <CardBackItem
              key={item.id}
              item={item}
              isOwned={isOwned}
              isEquipped={isEquipped}
              canPurchase={canPurchase}
              price={price}
              cosmicDust={cosmicDust}
              onEquip={() => handleEquipCardBack(item.id)}
              onPurchase={() => handlePurchase('cardBack', item.id, price)}
            />
          );
        })}
      </View>
    );
  };

  const renderAnimationsTab = () => {
    const shopAnims = Object.values(SHOP_FLIP_ANIMATIONS);
    const lockerAnims = Object.values(LOCKER_FLIP_ANIMATIONS);
    const allAnims = [...lockerAnims, ...shopAnims];

    return (
      <View style={styles.gridContainer}>
        {allAnims.map((item) => {
          const isOwned = cosmetics.unlockedFlipAnimations?.includes(item.id);
          const isEquipped = equippedFlipAnimation === item.id;
          const canPurchase = item.unlockRequirement?.type === 'purchase';
          const price = item.unlockRequirement?.price;

          return (
            <CosmeticItem
              key={item.id}
              item={item}
              isOwned={isOwned}
              isEquipped={isEquipped}
              canPurchase={canPurchase}
              price={price}
              cosmicDust={cosmicDust}
              onEquip={() => handleEquipAnimation(item.id)}
              onPurchase={() => handlePurchase('animation', item.id, price)}
            />
          );
        })}
      </View>
    );
  };

  const renderTransitionsTab = () => {
    const items = Object.values(TRANSITION_EFFECTS);

    return (
      <View style={styles.gridContainer}>
        {items.map((item) => {
          const isOwned = cosmetics.unlockedTransitions?.includes(item.id);
          const isEquipped = equippedTransition === item.id;
          const canPurchase = item.unlockRequirement?.type === 'purchase';
          const price = item.unlockRequirement?.price;

          return (
            <CosmeticItem
              key={item.id}
              item={item}
              isOwned={isOwned}
              isEquipped={isEquipped}
              canPurchase={canPurchase}
              price={price}
              cosmicDust={cosmicDust}
              onEquip={() => handleEquipTransition(item.id)}
              onPurchase={() => handlePurchase('transition', item.id, price)}
            />
          );
        })}
      </View>
    );
  };

  const renderDecksTab = () => {
    const items = Object.values(DECK_VERSIONS);

    return (
      <View style={styles.gridContainer}>
        {items.map((item) => {
          const isEnabled = cosmetics.deckVersions?.enabled?.includes(item.id);

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.itemWrapper}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                cosmetics.toggleDeckVersion(item.id);
              }}
            >
              <VictorianCard
                style={[
                  styles.itemCard,
                  { borderColor: isEnabled ? COSMIC.candleFlame : 'rgba(255,255,255,0.2)' },
                  isEnabled && styles.itemCardEquipped,
                ]}
              >
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                {item.majorArcanaOnly && (
                  <Text style={styles.majorOnlyBadge}>Major Arcana Only</Text>
                )}
                <View style={[styles.statusBadge, isEnabled ? styles.enabledBadge : styles.disabledBadge]}>
                  <Text style={styles.statusText}>{isEnabled ? 'ENABLED' : 'DISABLED'}</Text>
                </View>
              </VictorianCard>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <VeilPathScreen intensity="medium" scrollable={false}>
      {/* Header with currency */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Collection</Text>
          <Text style={styles.headerSubtitle}>
            {ownedCardBacks}/{totalCardBacks} card backs • {ownedAnimations}/{totalAnimations} animations
          </Text>
        </View>
        <View style={styles.currencyBadge}>
          <Text style={styles.currencyIcon}>💎</Text>
          <Text style={styles.currencyAmount}>{cosmicDust}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'cardBacks' && renderCardBacksTab()}
        {activeTab === 'animations' && renderAnimationsTab()}
        {activeTab === 'transitions' && renderTransitionsTab()}
        {activeTab === 'decks' && renderDecksTab()}

        {/* Shop link */}
        <TouchableOpacity
          style={styles.shopLink}
          onPress={() => navigation.navigate('Shop')}
        >
          <LinearGradient
            colors={['rgba(153,69,255,0.3)', 'rgba(153,69,255,0.1)']}
            style={styles.shopLinkGradient}
          >
            <Text style={styles.shopLinkIcon}>🛒</Text>
            <Text style={styles.shopLinkText}>Get more gems in Shop</Text>
            <Text style={styles.shopLinkArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </VeilPathScreen>
  );
}

/**
 * Card Back Item - supports static images and animated mp4
 */
function CardBackItem({ item, isOwned, isEquipped, canPurchase, price, cosmicDust, onEquip, onPurchase }) {
  const rarityColor = RARITY_COLORS[item.rarity] || COSMIC.moonGlow;

  const getUnlockText = () => {
    if (isOwned) return null;
    const req = item.unlockRequirement;
    if (!req) return 'Locked';
    switch (req.type) {
      case 'purchase': return `${req.price} 💎`;
      case 'level': return `Level ${req.value}`;
      case 'streak': return `${req.value} day streak`;
      case 'achievement': return 'Achievement';
      default: return 'Locked';
    }
  };

  return (
    <TouchableOpacity
      style={styles.itemWrapper}
      onPress={isOwned ? onEquip : (canPurchase ? onPurchase : null)}
      disabled={!isOwned && !canPurchase}
    >
      <VictorianCard
        style={[
          styles.cardBackCard,
          { borderColor: isEquipped ? COSMIC.candleFlame : rarityColor },
          isEquipped && styles.itemCardEquipped,
          !isOwned && styles.itemCardLocked,
        ]}
      >
        {/* Preview */}
        <View style={styles.cardBackPreview}>
          {item.isAnimated ? (
            <Video
              source={item.source}
              style={styles.cardBackVideo}
              resizeMode="cover"
              shouldPlay={isOwned}
              isLooping
              isMuted
            />
          ) : (
            <Image
              source={getCardBackAsset(item.id)}
              style={styles.cardBackImage}
              resizeMode="cover"
            />
          )}
          {!isOwned && (
            <View style={styles.lockedOverlay}>
              <Text style={styles.lockedIcon}>🔒</Text>
            </View>
          )}
          {item.isAnimated && (
            <View style={styles.animatedBadge}>
              <Text style={styles.animatedText}>✨</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={[styles.itemRarity, { color: rarityColor }]}>
          {item.rarity?.toUpperCase()}
        </Text>

        {/* Status */}
        {isEquipped ? (
          <View style={styles.equippedBadge}>
            <Text style={styles.equippedText}>EQUIPPED</Text>
          </View>
        ) : isOwned ? (
          <Text style={styles.tapToEquip}>Tap to equip</Text>
        ) : canPurchase ? (
          <TouchableOpacity
            style={[styles.purchaseButton, cosmicDust < price && styles.purchaseButtonDisabled]}
            onPress={onPurchase}
          >
            <Text style={styles.purchaseText}>{getUnlockText()}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.unlockRequirement}>{getUnlockText()}</Text>
        )}
      </VictorianCard>
    </TouchableOpacity>
  );
}

/**
 * Generic Cosmetic Item (animations, transitions)
 */
function CosmeticItem({ item, isOwned, isEquipped, canPurchase, price, cosmicDust, onEquip, onPurchase }) {
  const rarityColor = RARITY_COLORS[item.rarity] || COSMIC.moonGlow;

  const getUnlockText = () => {
    if (isOwned) return null;
    const req = item.unlockRequirement;
    if (!req) return 'Locked';
    switch (req.type) {
      case 'purchase': return `${req.price} 💎`;
      case 'level': return `Level ${req.value}`;
      case 'achievement': return 'Achievement';
      default: return 'Locked';
    }
  };

  return (
    <TouchableOpacity
      style={styles.itemWrapper}
      onPress={isOwned ? onEquip : (canPurchase ? onPurchase : null)}
      disabled={!isOwned && !canPurchase}
    >
      <VictorianCard
        style={[
          styles.itemCard,
          { borderColor: isEquipped ? COSMIC.candleFlame : rarityColor },
          isEquipped && styles.itemCardEquipped,
          !isOwned && styles.itemCardLocked,
        ]}
      >
        <Text style={styles.itemEmoji}>{item.emoji || '✨'}</Text>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={[styles.itemRarity, { color: rarityColor }]}>
          {item.rarity?.toUpperCase()}
        </Text>

        {isEquipped ? (
          <View style={styles.equippedBadge}>
            <Text style={styles.equippedText}>EQUIPPED</Text>
          </View>
        ) : isOwned ? (
          <Text style={styles.tapToEquip}>Tap to equip</Text>
        ) : canPurchase ? (
          <TouchableOpacity
            style={[styles.purchaseButton, cosmicDust < price && styles.purchaseButtonDisabled]}
            onPress={onPurchase}
          >
            <Text style={styles.purchaseText}>{getUnlockText()}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.unlockRequirement}>{getUnlockText()}</Text>
        )}
      </VictorianCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.moonGlow,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    marginTop: 4,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(153,69,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst,
  },
  currencyIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  currencyAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(153,69,255,0.2)',
    borderColor: COSMIC.deepAmethyst,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COSMIC.moonGlow,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemWrapper: {
    width: CARD_WIDTH,
  },
  itemCard: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 160,
  },
  cardBackCard: {
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 220,
  },
  itemCardEquipped: {
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
  },
  itemCardLocked: {
    opacity: 0.7,
  },
  cardBackPreview: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  cardBackImage: {
    width: '100%',
    height: '100%',
  },
  cardBackVideo: {
    width: '100%',
    height: '100%',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 24,
  },
  animatedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 4,
  },
  animatedText: {
    fontSize: 12,
  },
  itemEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    textAlign: 'center',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 8,
  },
  itemRarity: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  equippedBadge: {
    backgroundColor: COSMIC.candleFlame,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  equippedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
  },
  tapToEquip: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  purchaseButton: {
    backgroundColor: COSMIC.deepAmethyst,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseText: {
    fontSize: 11,
    fontWeight: '600',
    color: COSMIC.moonGlow,
  },
  unlockRequirement: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  majorOnlyBadge: {
    fontSize: 9,
    color: COSMIC.etherealCyan,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  enabledBadge: {
    backgroundColor: 'rgba(0,255,100,0.2)',
  },
  disabledBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    letterSpacing: 1,
  },
  shopLink: {
    marginTop: 24,
    marginBottom: 16,
  },
  shopLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  shopLinkIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  shopLinkText: {
    flex: 1,
    fontSize: 14,
    color: COSMIC.moonGlow,
    fontWeight: '500',
  },
  shopLinkArrow: {
    fontSize: 18,
    color: COSMIC.etherealCyan,
  },
});
