/**
 * Shop Screen - VeilPath Mystical Emporium
 * Magazine-style layout with carousel hero and responsive design
 *
 * Layout:
 * - Sticky shards banner at top
 * - Auto-scrolling hero carousel (Fortnite-style daily deals)
 * - Category tabs with horizontal scrollable sections
 * - Mobile: Stacked vertical layout
 * - Desktop: Side category nav + grid
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Modal,
  Animated,
  useWindowDimensions,
  FlatList,
} from 'react-native';

import {
  useCosmeticsStore,
  CARD_BACKS,
  getCardBackAsset,
  SHOP_FLIP_ANIMATIONS,
} from '../stores/cosmeticsStore';

import {
  RARITY_TIERS,
  CARD_BACKS as CARD_BACKS_CATALOG,
  FLIP_ANIMATIONS_CATALOG,
  getRarityColor,
  sortByRarity,
  getPurchasableItems,
} from '../config/cosmeticsConfig';

import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  CosmicButton,
} from '../components/VeilPathDesign';

import { useSubscription } from '../contexts/SubscriptionContext';

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSIVE BREAKPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  return {
    isMobile: width < 600,
    isTablet: width >= 600 && width < 1024,
    isDesktop: width >= 1024,
    width,
    height,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHOP CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'featured', name: 'Featured', icon: '✨', description: 'Limited time deals' },
  { id: 'subscriptions', name: 'VIP Pass', icon: '👑', description: 'Premium membership' },
  { id: 'cardBacks', name: 'Card Backs', icon: '🎴', description: 'Customize your deck' },
  { id: 'flipAnimations', name: 'Flip Effects', icon: '🔄', description: 'Card reveal styles' },
  { id: 'particles', name: 'Ambient FX', icon: '🌟', description: 'Screen effects' },
  { id: 'themes', name: 'Themes', icon: '🎨', description: 'Coming soon' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION BUNDLES
// ═══════════════════════════════════════════════════════════════════════════════

const SUBSCRIPTION_BUNDLES = [
  {
    id: 'monthly',
    name: 'VIP Monthly',
    price: 4.99,
    interval: 'month',
    tier: 'vip',
    symbol: '✦',
    color: '#A78BFA',
    features: [
      '200 Shards/month',
      'VIP Lounge Access',
      'Dev Corner Access',
      'Monthly Rewards',
      'Priority Support',
    ],
    cosmetics: [],
  },
  {
    id: 'annual',
    name: 'VIP+ Annual',
    price: 39.99,
    interval: 'year',
    tier: 'vip_plus',
    symbol: '✧',
    color: '#F59E0B',
    popular: true,
    savings: 'Save $20!',
    features: [
      'Everything in Monthly',
      '1,000 Bonus Shards',
      'Exclusive Card Back',
      'Exclusive Spread Mat',
      'VIP+ Badge & Title',
    ],
    cosmetics: ['annual_card_back', 'annual_spread_mat', 'annual_badge', 'annual_title'],
  },
  {
    id: 'lifetime',
    name: 'Lifetime Founder',
    price: 99.99,
    interval: 'lifetime',
    tier: 'lifetime',
    symbol: '♔',
    color: '#FFD700',
    legendary: true,
    features: [
      'All VIP+ Perks Forever',
      '5,000 Bonus Shards',
      'Exclusive Card Back',
      'Exclusive Spread Mat',
      'Founder Badge & Title',
      'Founder Profile Frame',
      'Lifetime Aura Effect',
    ],
    cosmetics: ['lifetime_card_back', 'lifetime_spread_mat', 'lifetime_badge', 'lifetime_title', 'lifetime_aura', 'founder_profile_frame'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURED ROTATION (Fortnite-style daily/weekly deals)
// ═══════════════════════════════════════════════════════════════════════════════

function getFeaturedItems() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);

  // Rotate through purchasable items based on day
  const allCardBacks = Object.values(CARD_BACKS_CATALOG).filter(
    item => item.unlockMethod === 'purchase' && item.price > 0
  );
  const allFlipAnims = Object.values(FLIP_ANIMATIONS_CATALOG).filter(
    item => item.unlockMethod === 'purchase' && item.price > 0
  );

  // Pick featured items (rotate daily) - now returns array for carousel
  const featuredCardBacks = [
    allCardBacks[dayOfYear % allCardBacks.length],
    allCardBacks[(dayOfYear + 1) % allCardBacks.length],
    allCardBacks[(dayOfYear + 2) % allCardBacks.length],
  ].filter(Boolean);

  const featuredFlipAnim = allFlipAnims[(dayOfYear + 3) % allFlipAnims.length];

  return {
    carousel: featuredCardBacks,
    hero: featuredCardBacks[0],
    secondary: featuredFlipAnim,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARD PURCHASE OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Pricing: Base rate ~400 shards/$1, better deals at higher tiers
const SHARD_BUNDLES = [
  { id: 'shard_500', shards: 500, price: 1.99, bonus: 0, popular: false },        // ~250/$ (starter)
  { id: 'shard_2000', shards: 2000, price: 4.99, bonus: 0, popular: false },      // ~400/$
  { id: 'shard_5000', shards: 5000, price: 9.99, bonus: 0, popular: true },       // ~500/$ (best value)
  { id: 'shard_12000', shards: 12000, price: 19.99, bonus: 500, popular: false }, // ~625/$ + bonus
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ShopScreen({ navigation, route }) {
  const cosmetics = useCosmeticsStore();
  const { isMobile, isTablet, isDesktop, width } = useResponsiveLayout();
  const { tier, isPro } = useSubscription();
  const tierDisplay = tier === 'lifetime' ? 'Lifetime' : isPro ? 'Premium' : 'Free';

  // Support initialCategory from navigation params (for SubscriptionScreen)
  const initialCategory = route?.params?.initialCategory || 'featured';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showShardPurchase, setShowShardPurchase] = useState(false);

  // Carousel state
  const carouselRef = useRef(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const carouselInterval = useRef(null);

  const featured = useMemo(() => getFeaturedItems(), []);

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (featured.carousel.length > 1 && activeCategory === 'featured') {
      carouselInterval.current = setInterval(() => {
        setActiveCarouselIndex(prev => {
          const next = (prev + 1) % featured.carousel.length;
          carouselRef.current?.scrollToIndex({ index: next, animated: true });
          return next;
        });
      }, 5000);
    }
    return () => {
      if (carouselInterval.current) clearInterval(carouselInterval.current);
    };
  }, [featured.carousel.length, activeCategory]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA PREPARATION
  // ─────────────────────────────────────────────────────────────────────────────

  // Get purchasable card backs (filter out owned)
  const purchasableCardBacks = useMemo(() => {
    return Object.values(CARD_BACKS).filter(cardBack => {
      if (cosmetics.unlockedCardBacks.includes(cardBack.id)) return false;
      if (cardBack.unlockRequirement) return true;
      if (cardBack.isDefault) return false;
      return false;
    });
  }, [cosmetics.unlockedCardBacks]);

  // Get purchasable flip animations
  const purchasableFlipAnims = useMemo(() => {
    return Object.values(SHOP_FLIP_ANIMATIONS).filter(anim => {
      if (cosmetics.unlockedFlipAnimations?.includes(anim.id)) return false;
      return anim.unlockRequirement?.type === 'purchase';
    });
  }, [cosmetics.unlockedFlipAnimations]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const showToast = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    fadeAnim.setValue(0);

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowConfirmation(false));
  };

  const handlePurchaseCardBack = (cardBack) => {
    if (cosmetics.equipped.cardBack === cardBack.id) {
      showToast(`${cardBack.name} is already equipped!`);
      return;
    }

    if (cosmetics.unlockedCardBacks.includes(cardBack.id)) {
      cosmetics.equipCardBack(cardBack.id);
      showToast(`${cardBack.name} equipped!`);
      return;
    }

    if (cardBack.unlockRequirement?.type === 'purchase') {
      const price = cardBack.unlockRequirement.price;
      if (cosmetics.cosmicDust >= price) {
        const result = cosmetics.purchaseCosmetic('cardBack', cardBack.id);
        if (result.success) {
          cosmetics.equipCardBack(cardBack.id);
          showToast(`Purchased & equipped ${cardBack.name}!`);
        } else {
          showToast(result.error);
        }
      } else {
        showToast(`Need ${price} shards (you have ${cosmetics.cosmicDust})`);
      }
    } else if (cardBack.unlockRequirement?.type === 'level') {
      showToast(`Unlock at level ${cardBack.unlockRequirement.value}`);
    }
  };

  const handlePurchaseFlipAnim = (anim) => {
    if (cosmetics.equipped.flipAnimation === anim.id) {
      showToast(`${anim.name} is already equipped!`);
      return;
    }

    if (cosmetics.unlockedFlipAnimations?.includes(anim.id)) {
      cosmetics.equipFlipAnimation(anim.id);
      showToast(`${anim.name} equipped!`);
      return;
    }

    if (anim.unlockRequirement?.type === 'purchase') {
      const price = anim.unlockRequirement.price;
      if (cosmetics.cosmicDust >= price) {
        const result = cosmetics.purchaseFlipAnimation(anim.id);
        if (result.success) {
          cosmetics.equipFlipAnimation(anim.id);
          showToast(`Purchased & equipped ${anim.name}!`);
        } else {
          showToast(result.error);
        }
      } else {
        showToast(`Need ${price} shards (you have ${cosmetics.cosmicDust})`);
      }
    }
  };

  const getRarityGlow = (rarity) => {
    const tier = RARITY_TIERS[rarity];
    return tier?.glowColor || null;
  };

  const getRarityEmoji = (rarity) => {
    switch (rarity) {
      case 'mythic': return '💫';
      case 'legendary': return '✦';
      case 'epic': return '◆';
      case 'rare': return '★';
      default: return '•';
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────────
  // EARLY ACCESS BANNER
  // ─────────────────────────────────────────────────────────────────────────────

  const renderEarlyAccessBanner = () => (
    <View style={styles.earlyAccessBanner}>
      <Text style={styles.earlyAccessIcon}>✨</Text>
      <View style={styles.earlyAccessTextContainer}>
        <Text style={styles.earlyAccessTitle}>EARLY ACCESS</Text>
        <Text style={styles.earlyAccessMessage}>
          All purchases and progress transfer to official release (Dec 21)
        </Text>
        <Text style={styles.earlyAccessThanks}>
          Thank you for supporting VeilPath!
        </Text>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // STICKY SHARDS BANNER (Clickable to purchase)
  // ─────────────────────────────────────────────────────────────────────────────

  const renderShardsBanner = () => (
    <TouchableOpacity
      style={styles.shardsBanner}
      onPress={() => setShowShardPurchase(true)}
      activeOpacity={0.8}
    >
      <View style={styles.shardsLeft}>
        <Text style={styles.shardsIcon}>💎</Text>
        <View>
          <Text style={styles.shardsValue}>{cosmetics.cosmicDust || 0}</Text>
          <Text style={styles.shardsLabel}>Cosmic Shards</Text>
        </View>
      </View>
      <View style={styles.shardsRight}>
        <Text style={styles.getMoreText}>GET MORE</Text>
        <Text style={styles.plusIcon}>+</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTopBar = () => (
    <View style={styles.topBar}>
      {/* Left: Shards Banner */}
      {renderShardsBanner()}

      {/* Right: Tier + Title */}
      <View style={styles.topBarRight}>
        <Text style={styles.topBarTitle}>EMPORIUM</Text>
        <View style={[styles.tierChip, isPro && styles.tierChipPremium]}>
          <Text style={[styles.tierText, isPro && styles.tierTextPremium]}>
            {tierDisplay}
          </Text>
        </View>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // SHARD PURCHASE MODAL
  // ─────────────────────────────────────────────────────────────────────────────

  const renderShardPurchaseModal = () => (
    <Modal
      visible={showShardPurchase}
      transparent
      animationType="slide"
      onRequestClose={() => setShowShardPurchase(false)}
    >
      <View style={styles.modalOverlay}>
        <VictorianCard style={styles.shardModal}>
          <View style={styles.shardModalHeader}>
            <Text style={styles.shardModalTitle}>💎 Get Cosmic Shards</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowShardPurchase(false)}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.shardModalSubtitle}>
            Unlock cosmetics, themes, and more
          </Text>

          <View style={styles.bundleGrid}>
            {SHARD_BUNDLES.map((bundle) => (
              <TouchableOpacity
                key={bundle.id}
                style={[styles.bundleCard, bundle.popular && styles.bundleCardPopular]}
                onPress={() => {
                  showToast('Payment coming soon!');
                }}
              >
                {bundle.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>BEST VALUE</Text>
                  </View>
                )}
                <Text style={styles.bundleShards}>💎 {bundle.shards}</Text>
                {bundle.bonus > 0 && (
                  <Text style={styles.bundleBonus}>+{bundle.bonus} bonus!</Text>
                )}
                <Text style={styles.bundlePrice}>${bundle.price.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.paymentNote}>
            Payments processed securely via Stripe & App Store
          </Text>
        </VictorianCard>
      </View>
    </Modal>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // HERO CAROUSEL
  // ─────────────────────────────────────────────────────────────────────────────

  const renderCarouselItem = ({ item, index }) => {
    if (!item) return null;
    const rarityColor = getRarityColor(item.rarity);
    const isOwned = cosmetics.unlockedCardBacks?.includes(item.id);

    return (
      <View style={[styles.carouselItem, { width: width - (isDesktop ? 280 : 32) }]}>
        <VictorianCard
          style={[styles.carouselCard, { borderColor: rarityColor }]}
          glowColor={getRarityGlow(item.rarity)}
        >
          <View style={styles.carouselBadge}>
            <Text style={styles.carouselBadgeText}>
              {index === 0 ? "TODAY'S FEATURED" : 'DAILY ROTATION'}
            </Text>
          </View>

          <View style={styles.carouselContent}>
            <View style={styles.carouselPreview}>
              <Image
                source={getCardBackAsset(item.id) || require('../../assets/art/cardback/card_back.png')}
                style={styles.carouselImage}
                resizeMode="cover"
              />
              {item.animated && (
                <View style={styles.animatedBadge}>
                  <Text style={styles.animatedBadgeText}>ANIMATED</Text>
                </View>
              )}
            </View>

            <View style={styles.carouselInfo}>
              <Text style={[styles.carouselRarity, { color: rarityColor }]}>
                {getRarityEmoji(item.rarity)} {item.rarity?.toUpperCase()}
              </Text>
              <Text style={styles.carouselName}>{item.name}</Text>
              <Text style={styles.carouselDesc} numberOfLines={2}>{item.description}</Text>

              {!isOwned ? (
                <TouchableOpacity
                  style={[styles.carouselBuyBtn, { backgroundColor: rarityColor }]}
                  onPress={() => handlePurchaseCardBack(item)}
                >
                  <Text style={styles.carouselBuyIcon}>💎</Text>
                  <Text style={styles.carouselBuyPrice}>{item.price}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedBadgeText}>OWNED</Text>
                </View>
              )}
            </View>
          </View>
        </VictorianCard>
      </View>
    );
  };

  const renderCarouselDots = () => (
    <View style={styles.carouselDots}>
      {featured.carousel.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.carouselDot,
            activeCarouselIndex === index && styles.carouselDotActive,
          ]}
          onPress={() => {
            setActiveCarouselIndex(index);
            carouselRef.current?.scrollToIndex({ index, animated: true });
          }}
        />
      ))}
    </View>
  );

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryTabsContainer}
      contentContainerStyle={styles.categoryTabsContent}
    >
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.categoryTab,
            activeCategory === cat.id && styles.categoryTabActive,
          ]}
          onPress={() => setActiveCategory(cat.id)}
        >
          <Text style={styles.categoryTabIcon}>{cat.icon}</Text>
          <Text style={[
            styles.categoryTabText,
            activeCategory === cat.id && styles.categoryTabTextActive,
          ]}>
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCategorySidebar = () => (
    <View style={styles.categorySidebar}>
      <Text style={styles.sidebarTitle}>CATEGORIES</Text>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.sidebarItem,
            activeCategory === cat.id && styles.sidebarItemActive,
          ]}
          onPress={() => setActiveCategory(cat.id)}
        >
          <Text style={styles.sidebarIcon}>{cat.icon}</Text>
          <View style={styles.sidebarItemText}>
            <Text style={[
              styles.sidebarItemName,
              activeCategory === cat.id && styles.sidebarItemNameActive,
            ]}>
              {cat.name}
            </Text>
            <Text style={styles.sidebarItemDesc}>{cat.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.sidebarDivider} />

      <View style={styles.sidebarBalance}>
        <Text style={styles.sidebarBalanceLabel}>YOUR BALANCE</Text>
        <View style={styles.sidebarBalanceRow}>
          <Text style={styles.sidebarBalanceIcon}>💎</Text>
          <Text style={styles.sidebarBalanceValue}>{cosmetics.cosmicDust || 0}</Text>
        </View>
        <CosmicButton
          title="Get More"
          variant="ghost"
          size="sm"
          onPress={() => showToast('Coming soon!')}
        />
      </View>
    </View>
  );

  const renderFeaturedHero = () => {
    if (!featured.hero) return null;
    const item = featured.hero;
    const rarityColor = getRarityColor(item.rarity);
    const isOwned = cosmetics.unlockedCardBacks?.includes(item.id);

    return (
      <VictorianCard
        style={[styles.featuredHero, { borderColor: rarityColor }]}
        glowColor={getRarityGlow(item.rarity)}
      >
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>TODAY'S FEATURED</Text>
        </View>

        <View style={styles.featuredContent}>
          <View style={styles.featuredPreview}>
            <Image
              source={getCardBackAsset(item.id) || require('../../assets/art/cardback/card_back.png')}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            {item.animated && (
              <View style={styles.animatedBadge}>
                <Text style={styles.animatedBadgeText}>ANIMATED</Text>
              </View>
            )}
          </View>

          <View style={styles.featuredInfo}>
            <Text style={[styles.featuredRarity, { color: rarityColor }]}>
              {getRarityEmoji(item.rarity)} {item.rarity?.toUpperCase()}
            </Text>
            <Text style={styles.featuredName}>{item.name}</Text>
            <Text style={styles.featuredDesc}>{item.description}</Text>

            {!isOwned ? (
              <TouchableOpacity
                style={[styles.featuredBuyBtn, { backgroundColor: rarityColor }]}
                onPress={() => handlePurchaseCardBack(item)}
              >
                <Text style={styles.featuredBuyIcon}>💎</Text>
                <Text style={styles.featuredBuyPrice}>{item.price}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.ownedBadge}>
                <Text style={styles.ownedBadgeText}>OWNED</Text>
              </View>
            )}
          </View>
        </View>
      </VictorianCard>
    );
  };

  const renderSecondaryFeatured = () => {
    if (!featured.secondary) return null;
    const item = featured.secondary;
    const rarityColor = getRarityColor(item.rarity);
    const isOwned = cosmetics.unlockedFlipAnimations?.includes(item.id);

    return (
      <VictorianCard
        style={[styles.secondaryFeatured, { borderColor: rarityColor }]}
        showCorners={false}
      >
        <View style={styles.weeklyBadge}>
          <Text style={styles.weeklyBadgeText}>DEAL OF THE DAY</Text>
        </View>

        <Text style={styles.secondaryEmoji}>{item.emoji || '🔄'}</Text>
        <Text style={[styles.secondaryRarity, { color: rarityColor }]}>
          {item.rarity?.toUpperCase()}
        </Text>
        <Text style={styles.secondaryName}>{item.name}</Text>

        {!isOwned ? (
          <TouchableOpacity
            style={styles.secondaryBuyBtn}
            onPress={() => handlePurchaseFlipAnim(item)}
          >
            <Text style={styles.secondaryBuyText}>💎 {item.price}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.ownedText}>OWNED</Text>
        )}
      </VictorianCard>
    );
  };

  const renderCardBackItem = (cardBack) => {
    const unlocked = cosmetics.unlockedCardBacks.includes(cardBack.id);
    const equipped = cosmetics.equipped.cardBack === cardBack.id;
    const rarityColor = getRarityColor(cardBack.rarity);
    const asset = getCardBackAsset(cardBack.id);

    return (
      <TouchableOpacity
        key={cardBack.id}
        style={[styles.itemCard, isMobile && styles.itemCardMobile]}
        onPress={() => handlePurchaseCardBack(cardBack)}
        activeOpacity={0.7}
      >
        <VictorianCard
          style={[
            styles.itemCardInner,
            { borderColor: equipped ? '#00FF88' : rarityColor },
            equipped && styles.equippedCard,
          ]}
          showCorners={false}
        >
          <View style={styles.itemPreview}>
            <Image
              source={asset}
              style={[styles.itemImage, !unlocked && styles.lockedImage]}
              resizeMode="cover"
            />
            {!unlocked && (
              <View style={styles.lockedOverlay}>
                <Text style={styles.lockedIcon}>🔒</Text>
              </View>
            )}
            {equipped && (
              <View style={styles.equippedBadge}>
                <Text style={styles.equippedText}>EQUIPPED</Text>
              </View>
            )}
          </View>

          <Text style={styles.itemName} numberOfLines={1}>{cardBack.name}</Text>
          <Text style={[styles.itemRarity, { color: rarityColor }]}>
            {getRarityEmoji(cardBack.rarity)} {cardBack.rarity?.toUpperCase()}
          </Text>

          {!unlocked && cardBack.unlockRequirement?.type === 'purchase' && (
            <View style={styles.priceRow}>
              <Text style={styles.priceIcon}>💎</Text>
              <Text style={styles.priceValue}>{cardBack.unlockRequirement.price}</Text>
            </View>
          )}
          {!unlocked && cardBack.unlockRequirement?.type === 'level' && (
            <Text style={styles.unlockText}>Lv.{cardBack.unlockRequirement.value}</Text>
          )}
          {unlocked && !equipped && (
            <Text style={styles.tapToEquip}>TAP TO EQUIP</Text>
          )}
        </VictorianCard>
      </TouchableOpacity>
    );
  };

  const renderFlipAnimItem = (anim) => {
    const unlocked = cosmetics.unlockedFlipAnimations?.includes(anim.id);
    const equipped = cosmetics.equipped.flipAnimation === anim.id;
    const rarityColor = getRarityColor(anim.rarity);

    return (
      <TouchableOpacity
        key={anim.id}
        style={[styles.itemCard, isMobile && styles.itemCardMobile]}
        onPress={() => handlePurchaseFlipAnim(anim)}
        activeOpacity={0.7}
      >
        <VictorianCard
          style={[
            styles.itemCardInner,
            { borderColor: equipped ? '#00FF88' : rarityColor },
            equipped && styles.equippedCard,
          ]}
          showCorners={false}
        >
          <View style={styles.animPreview}>
            <Text style={styles.animEmoji}>{anim.emoji || '🔄'}</Text>
            {!unlocked && (
              <View style={styles.lockedOverlaySmall}>
                <Text style={styles.lockedIconSmall}>🔒</Text>
              </View>
            )}
          </View>

          <Text style={styles.itemName} numberOfLines={1}>{anim.name}</Text>
          <Text style={[styles.itemRarity, { color: rarityColor }]}>
            {getRarityEmoji(anim.rarity)} {anim.rarity?.toUpperCase()}
          </Text>

          {!unlocked && anim.unlockRequirement?.type === 'purchase' && (
            <View style={styles.priceRow}>
              <Text style={styles.priceIcon}>💎</Text>
              <Text style={styles.priceValue}>{anim.unlockRequirement.price}</Text>
            </View>
          )}
          {unlocked && !equipped && (
            <Text style={styles.tapToEquip}>TAP TO EQUIP</Text>
          )}
          {equipped && (
            <Text style={styles.equippedLabel}>EQUIPPED</Text>
          )}
        </VictorianCard>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'featured':
        return (
          <View style={styles.featuredSection}>
            {/* Hero Carousel */}
            <FlatList
              ref={carouselRef}
              data={featured.carousel}
              renderItem={renderCarouselItem}
              keyExtractor={(item, index) => item?.id || `carousel-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (width - (isDesktop ? 280 : 32)));
                setActiveCarouselIndex(index);
              }}
              getItemLayout={(_, index) => ({
                length: width - (isDesktop ? 280 : 32),
                offset: (width - (isDesktop ? 280 : 32)) * index,
                index,
              })}
              style={styles.carousel}
            />
            {renderCarouselDots()}

            {/* Secondary Featured */}
            <View style={styles.secondaryRow}>
              {renderSecondaryFeatured()}

              {/* Quick Categories */}
              <View style={styles.quickCategories}>
                <Text style={styles.quickCategoriesTitle}>BROWSE</Text>
                {CATEGORIES.slice(1, 4).map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.quickCategoryBtn}
                    onPress={() => setActiveCategory(cat.id)}
                  >
                    <Text style={styles.quickCategoryIcon}>{cat.icon}</Text>
                    <Text style={styles.quickCategoryName}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 'cardBacks':
        return (
          <View style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎴 CARD BACKS</Text>
              <Text style={styles.sectionSubtitle}>
                {purchasableCardBacks.length > 0
                  ? `${purchasableCardBacks.length} available`
                  : 'You own all available card backs!'}
              </Text>
            </View>
            <View style={[
              styles.itemGrid,
              isMobile && styles.itemGridMobile,
            ]}>
              {purchasableCardBacks.map(renderCardBackItem)}
            </View>
            {purchasableCardBacks.length === 0 && (
              <VictorianCard style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyText}>You've collected all card backs!</Text>
              </VictorianCard>
            )}
          </View>
        );

      case 'flipAnimations':
        return (
          <View style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔄 FLIP ANIMATIONS</Text>
              <Text style={styles.sectionSubtitle}>
                {purchasableFlipAnims.length > 0
                  ? `${purchasableFlipAnims.length} available`
                  : 'You own all flip animations!'}
              </Text>
            </View>
            <View style={[
              styles.itemGrid,
              isMobile && styles.itemGridMobile,
            ]}>
              {purchasableFlipAnims.map(renderFlipAnimItem)}
            </View>
            {purchasableFlipAnims.length === 0 && (
              <VictorianCard style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyText}>You've collected all flip animations!</Text>
              </VictorianCard>
            )}
          </View>
        );

      case 'subscriptions':
        return (
          <View style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👑 VIP MEMBERSHIP</Text>
              <Text style={styles.sectionSubtitle}>
                Unlock exclusive perks, cosmetics, and more
              </Text>
            </View>

            <View style={styles.subscriptionGrid}>
              {SUBSCRIPTION_BUNDLES.map((bundle) => (
                <VictorianCard
                  key={bundle.id}
                  style={[
                    styles.subscriptionCard,
                    bundle.popular && styles.subscriptionCardPopular,
                    bundle.legendary && styles.subscriptionCardLegendary,
                    { borderColor: bundle.color },
                  ]}
                  glowColor={bundle.legendary ? 'rgba(255, 215, 0, 0.3)' : null}
                >
                  {bundle.popular && (
                    <View style={styles.popularRibbon}>
                      <Text style={styles.popularRibbonText}>BEST VALUE</Text>
                    </View>
                  )}
                  {bundle.legendary && (
                    <View style={[styles.popularRibbon, styles.legendaryRibbon]}>
                      <Text style={styles.popularRibbonText}>LIMITED</Text>
                    </View>
                  )}

                  {/* Tier Symbol */}
                  <View style={[styles.tierSymbolLarge, { backgroundColor: bundle.color + '30' }]}>
                    <Text style={[styles.tierSymbolText, { color: bundle.color }]}>
                      {bundle.symbol}
                    </Text>
                  </View>

                  <Text style={styles.subscriptionName}>{bundle.name}</Text>

                  <View style={styles.priceContainer}>
                    <Text style={[styles.subscriptionPrice, { color: bundle.color }]}>
                      ${bundle.price.toFixed(2)}
                    </Text>
                    <Text style={styles.subscriptionInterval}>
                      {bundle.interval === 'lifetime' ? 'one time' : `/${bundle.interval}`}
                    </Text>
                  </View>

                  {bundle.savings && (
                    <Text style={styles.savingsBadge}>{bundle.savings}</Text>
                  )}

                  <View style={styles.featuresList}>
                    {bundle.features.map((feature, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Text style={styles.featureCheck}>✓</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.subscribeBtn, { backgroundColor: bundle.color }]}
                    onPress={() => showToast('Payment coming soon!')}
                  >
                    <Text style={styles.subscribeBtnText}>
                      {bundle.interval === 'lifetime' ? 'GET LIFETIME' : 'SUBSCRIBE'}
                    </Text>
                  </TouchableOpacity>
                </VictorianCard>
              ))}
            </View>

            {/* Already subscribed? */}
            {isPro && (
              <VictorianCard style={styles.alreadySubCard}>
                <Text style={styles.alreadySubIcon}>✨</Text>
                <Text style={styles.alreadySubText}>
                  You're already a {tierDisplay} member!
                </Text>
                <TouchableOpacity
                  style={styles.viewPerksBtn}
                  onPress={() => navigation.navigate('VIPPerksScreen')}
                >
                  <Text style={styles.viewPerksBtnText}>View Your Perks</Text>
                </TouchableOpacity>
              </VictorianCard>
            )}
          </View>
        );

      case 'particles':
      case 'themes':
        return (
          <View style={styles.sectionContent}>
            <VictorianCard style={styles.comingSoonCard}>
              <Text style={styles.comingSoonIcon}>🔮</Text>
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              <Text style={styles.comingSoonText}>
                {activeCategory === 'particles'
                  ? 'Ambient particle effects are being conjured...'
                  : 'New themes are being forged in the cosmic workshop...'}
              </Text>
            </VictorianCard>
          </View>
        );

      default:
        return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <VeilPathScreen intensity="medium" scrollable={true} showMoonPhases={false}>
      {/* Early Access Banner */}
      {renderEarlyAccessBanner()}

      {/* Top Bar */}
      {renderTopBar()}

      {/* Category Navigation - Tabs on mobile/tablet, Sidebar on desktop */}
      {!isDesktop && renderCategoryTabs()}

      {/* Main Content Area */}
      <View style={[
        styles.mainContainer,
        isDesktop && styles.mainContainerDesktop,
      ]}>
        {/* Sidebar (Desktop only) */}
        {isDesktop && renderCategorySidebar()}

        {/* Content Area */}
        <View style={[
          styles.contentArea,
          isDesktop && styles.contentAreaDesktop,
        ]}>
          {renderContent()}
        </View>
      </View>

      {/* Toast Notification */}
      {showConfirmation && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>{confirmationMessage}</Text>
        </Animated.View>
      )}

      {/* Shard Purchase Modal */}
      {renderShardPurchaseModal()}
    </VeilPathScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ─────────────────────────────────────────────────────────────────────────────
  // TOP BAR
  // ─────────────────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COSMIC.brassVictorian + '40',
    marginBottom: 16,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(183, 142, 82, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COSMIC.candleFlame + '60',
    gap: 6,
  },
  currencyIcon: {
    fontSize: 18,
  },
  currencyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  currencyLabel: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  tierChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.4)',
  },
  tierChipPremium: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: COSMIC.candleFlame + '60',
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(200, 200, 200, 0.8)',
    textTransform: 'uppercase',
  },
  tierTextPremium: {
    color: COSMIC.candleFlame,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY TABS (Mobile/Tablet)
  // ─────────────────────────────────────────────────────────────────────────────
  categoryTabsContainer: {
    maxHeight: 60,
    marginBottom: 16,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
    borderColor: COSMIC.candleFlame + '60',
  },
  categoryTabIcon: {
    fontSize: 16,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    opacity: 0.7,
  },
  categoryTabTextActive: {
    color: COSMIC.candleFlame,
    opacity: 1,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY SIDEBAR (Desktop)
  // ─────────────────────────────────────────────────────────────────────────────
  categorySidebar: {
    width: 220,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: COSMIC.brassVictorian + '30',
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: COSMIC.candleFlame,
    marginBottom: 16,
    opacity: 0.8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
  },
  sidebarIcon: {
    fontSize: 20,
  },
  sidebarItemText: {
    flex: 1,
  },
  sidebarItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.moonGlow,
  },
  sidebarItemNameActive: {
    color: COSMIC.candleFlame,
  },
  sidebarItemDesc: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    opacity: 0.7,
    marginTop: 2,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: COSMIC.brassVictorian + '30',
    marginVertical: 20,
  },
  sidebarBalance: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
    borderRadius: 12,
  },
  sidebarBalanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: COSMIC.crystalPink,
    marginBottom: 8,
  },
  sidebarBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sidebarBalanceIcon: {
    fontSize: 24,
  },
  sidebarBalanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN CONTAINER
  // ─────────────────────────────────────────────────────────────────────────────
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainContainerDesktop: {
    flexDirection: 'row',
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  contentArea: {
    flex: 1,
  },
  contentAreaDesktop: {
    paddingLeft: 32,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FEATURED SECTION
  // ─────────────────────────────────────────────────────────────────────────────
  featuredSection: {
    marginBottom: 24,
  },
  featuredGrid: {
    gap: 16,
  },
  featuredGridWide: {
    flexDirection: 'row',
  },
  featuredHero: {
    flex: 2,
    padding: 0,
    overflow: 'hidden',
  },
  featuredBadge: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#000',
  },
  featuredContent: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  featuredPreview: {
    width: 160,
    height: 240,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  animatedBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: COSMIC.etherealCyan,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  animatedBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
  },
  featuredInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  featuredRarity: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  featuredName: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    marginBottom: 8,
  },
  featuredDesc: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    marginBottom: 20,
  },
  featuredBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  featuredBuyIcon: {
    fontSize: 18,
  },
  featuredBuyPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
  },
  ownedBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderWidth: 1,
    borderColor: '#00FF88',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ownedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00FF88',
    letterSpacing: 1,
  },

  secondaryFeatured: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    marginTop: 16,
  },
  weeklyBadge: {
    backgroundColor: COSMIC.etherealCyan,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  weeklyBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#000',
  },
  secondaryEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  secondaryRarity: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  secondaryName: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 16,
    textAlign: 'center',
  },
  secondaryBuyBtn: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  secondaryBuyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  ownedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00FF88',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION CONTENT
  // ─────────────────────────────────────────────────────────────────────────────
  sectionContent: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: COSMIC.candleFlame,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ITEM GRID
  // ─────────────────────────────────────────────────────────────────────────────
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  itemGridMobile: {
    gap: 12,
  },
  itemCard: {
    width: '23%',
    minWidth: 140,
    maxWidth: 180,
  },
  itemCardMobile: {
    width: '30%',
    minWidth: 100,
    maxWidth: 130,
  },
  itemCardInner: {
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  equippedCard: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  itemPreview: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  lockedImage: {
    opacity: 0.4,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  lockedIcon: {
    fontSize: 28,
  },
  equippedBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 255, 136, 0.9)',
    paddingVertical: 3,
    borderRadius: 4,
    alignItems: 'center',
  },
  equippedText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    textAlign: 'center',
    marginBottom: 4,
  },
  itemRarity: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceIcon: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  unlockText: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    fontWeight: '600',
  },
  tapToEquip: {
    fontSize: 9,
    color: COSMIC.etherealCyan,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FLIP ANIMATION ITEMS
  // ─────────────────────────────────────────────────────────────────────────────
  animPreview: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  animEmoji: {
    fontSize: 32,
  },
  lockedOverlaySmall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 35,
  },
  lockedIconSmall: {
    fontSize: 20,
  },
  equippedLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00FF88',
    letterSpacing: 0.5,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EMPTY / COMING SOON
  // ─────────────────────────────────────────────────────────────────────────────
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COSMIC.moonGlow,
    textAlign: 'center',
  },
  comingSoonCard: {
    alignItems: 'center',
    padding: 60,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  comingSoonText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    maxWidth: 300,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TOAST
  // ─────────────────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 255, 136, 0.95)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)',
      },
      default: {
        shadowColor: '#00FF88',
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
      },
    }),
  },
  toastText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EARLY ACCESS BANNER
  // ─────────────────────────────────────────────────────────────────────────────
  earlyAccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 0,
    gap: 12,
  },
  earlyAccessIcon: {
    fontSize: 24,
  },
  earlyAccessTextContainer: {
    flex: 1,
  },
  earlyAccessTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#00FFFF',
    marginBottom: 4,
  },
  earlyAccessMessage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E1BEE7',
    marginBottom: 2,
  },
  earlyAccessThanks: {
    fontSize: 11,
    color: 'rgba(225, 190, 231, 0.7)',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // STICKY SHARDS BANNER
  // ─────────────────────────────────────────────────────────────────────────────
  shardsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'linear-gradient(135deg, rgba(183, 142, 82, 0.3), rgba(255, 215, 0, 0.15))',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COSMIC.candleFlame + '60',
    flex: 1,
    maxWidth: 220,
  },
  shardsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shardsIcon: {
    fontSize: 28,
  },
  shardsValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COSMIC.candleFlame,
  },
  shardsLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  shardsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COSMIC.candleFlame,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  getMoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  plusIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CAROUSEL
  // ─────────────────────────────────────────────────────────────────────────────
  carousel: {
    marginBottom: 12,
  },
  carouselItem: {
    paddingHorizontal: 16,
  },
  carouselCard: {
    padding: 0,
    overflow: 'hidden',
    borderWidth: 2,
  },
  carouselBadge: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 8,
  },
  carouselBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#000',
  },
  carouselContent: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  carouselPreview: {
    width: 140,
    height: 210,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselRarity: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  carouselName: {
    fontSize: 22,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    marginBottom: 6,
  },
  carouselDesc: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 18,
    marginBottom: 16,
  },
  carouselBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  carouselBuyIcon: {
    fontSize: 16,
  },
  carouselBuyPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  carouselDotActive: {
    backgroundColor: COSMIC.candleFlame,
    width: 24,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SECONDARY ROW
  // ─────────────────────────────────────────────────────────────────────────────
  secondaryRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  quickCategories: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst + '40',
  },
  quickCategoriesTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: COSMIC.candleFlame,
    marginBottom: 12,
  },
  quickCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickCategoryIcon: {
    fontSize: 18,
  },
  quickCategoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.moonGlow,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SUBSCRIPTION BUNDLES
  // ─────────────────────────────────────────────────────────────────────────────
  subscriptionGrid: {
    gap: 16,
  },
  subscriptionCard: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  subscriptionCardPopular: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  subscriptionCardLegendary: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  popularRibbon: {
    position: 'absolute',
    top: 12,
    right: -30,
    backgroundColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 30,
    transform: [{ rotate: '45deg' }],
  },
  legendaryRibbon: {
    backgroundColor: '#FFD700',
  },
  popularRibbonText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  tierSymbolLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierSymbolText: {
    fontSize: 28,
    fontWeight: '700',
  },
  subscriptionName: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  subscriptionPrice: {
    fontSize: 32,
    fontWeight: '800',
  },
  subscriptionInterval: {
    fontSize: 14,
    color: COSMIC.crystalPink,
  },
  savingsBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  featuresList: {
    width: '100%',
    marginBottom: 20,
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheck: {
    fontSize: 14,
    color: '#00FF88',
    fontWeight: '700',
  },
  featureText: {
    fontSize: 13,
    color: COSMIC.moonGlow,
  },
  subscribeBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  subscribeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  alreadySubCard: {
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  alreadySubIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  alreadySubText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    marginBottom: 12,
  },
  viewPerksBtn: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00FF88',
  },
  viewPerksBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00FF88',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SHARD PURCHASE MODAL
  // ─────────────────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  shardModal: {
    width: '100%',
    maxWidth: 500,
    padding: 24,
  },
  shardModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shardModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: COSMIC.moonGlow,
  },
  shardModalSubtitle: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    marginBottom: 24,
  },
  bundleGrid: {
    gap: 12,
  },
  bundleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst + '40',
  },
  bundleCardPopular: {
    borderColor: COSMIC.candleFlame,
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: COSMIC.candleFlame,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  bundleShards: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
  },
  bundleBonus: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '600',
  },
  bundlePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COSMIC.candleFlame,
  },
  paymentNote: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
});
