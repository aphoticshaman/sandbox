/**
 * Community Screen - The Gathering
 *
 * Sanctuary, not social media. Calming, thoughtful, intimate.
 *
 * UX Principles:
 * - Quality over quantity (depth, not spam)
 * - Minimal cognitive load (clean, calm)
 * - Reactions show value type, not social approval
 * - Titles are earned, never purchased
 *
 * Layout:
 * - Mobile: Channel tabs + feed + floating compose
 * - Tablet: Channel sidebar + content area
 * - Desktop: Channels + feed + trending sidebar
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  TextInput,
  FlatList,
  RefreshControl,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';

import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  CosmicButton,
} from '../components/VeilPathDesign';

import { useSubscription } from '../contexts/SubscriptionContext';
import { getCardBackAsset } from '../stores/cosmeticsStore';
import CommunityService from '../services/CommunityService';
import { getTitleById } from '../config/titlesConfig';
import { TierSymbol, getTierConfig } from '../config/subscriptionTiers';

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
// REACTIONS (Not likes - contextual value indicators)
// ═══════════════════════════════════════════════════════════════════════════════

const REACTIONS = {
  resonate: { emoji: '✨', label: 'Resonate', description: 'I feel this' },
  helpful: { emoji: '🙏', label: 'Helpful', description: 'This helped me' },
  insightful: { emoji: '💡', label: 'Insightful', description: 'I learned something' },
  support: { emoji: '💜', label: 'Support', description: 'Sending love' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNEL CONFIG (Per UX spec)
// ═══════════════════════════════════════════════════════════════════════════════

const CHANNELS = {
  daily: [
    { id: 'daily_card', name: 'Daily Card', icon: '🌅', description: 'Share your daily draw', charLimit: 280 },
    { id: 'intentions', name: 'Intentions', icon: '🌙', description: 'Morning intention setting' },
  ],
  forums: [
    { id: 'tarot_talk', name: 'Tarot Talk', icon: '🔮', description: 'Card discussions & interpretations' },
    { id: 'general', name: 'General', icon: '💬', description: 'Off-topic but on-vibe' },
    { id: 'ideas', name: 'Feature Ideas', icon: '💭', description: 'Suggest improvements', devVisibility: true },
  ],
  support: [
    { id: 'help', name: 'Help', icon: '🆘', description: 'Get help from Vera', llmAssisted: true },
  ],
  premium: [
    { id: 'spreads', name: 'Spreads & Rituals', icon: '✨', description: 'Advanced spread discussions', premium: true },
  ],
  vipLounge: [
    { id: 'vip_welcome', name: 'Welcome Lounge', icon: '🏛️', description: 'Meet your fellow subscribers', premium: true },
    { id: 'dev_corner', name: 'Dev Corner', icon: '👨‍💻', description: 'Direct access to the developer', premium: true },
    { id: 'monthly_rewards', name: 'Monthly Rewards', icon: '🎁', description: 'Exclusive giveaways & shards', premium: true },
  ],
};

const ALL_CHANNELS = [
  ...CHANNELS.daily,
  ...CHANNELS.forums,
  ...CHANNELS.support,
  ...CHANNELS.premium,
  ...CHANNELS.vipLounge,
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function CommunityScreen({ navigation }) {
  const { isMobile, isTablet, isDesktop, width } = useResponsiveLayout();
  const { isPro } = useSubscription();

  const [activeChannel, setActiveChannel] = useState('daily_card');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [activeReactionPicker, setActiveReactionPicker] = useState(null);

  const currentChannel = ALL_CHANNELS.find(c => c.id === activeChannel) || ALL_CHANNELS[0];

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────────────────────

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CommunityService.getPosts(activeChannel, 20);
      setPosts(data || []);
    } catch (error) {
      console.error('[Community] Failed to load posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleChannelSelect = (channelId) => {
    const channel = ALL_CHANNELS.find(c => c.id === channelId);
    if (channel?.premium && !isPro) {
      navigation.navigate('MeTab', { screen: 'SubscriptionScreen' });
      return;
    }
    setActiveChannel(channelId);
  };

  const handlePost = async () => {
    if (!composeText.trim()) return;

    const charLimit = currentChannel.charLimit || 2000;
    if (composeText.length > charLimit) {
      return;
    }

    try {
      await CommunityService.createPost(activeChannel, {
        content: composeText.trim(),
      });
      setComposeText('');
      setShowCompose(false);
      loadPosts();
    } catch (error) {
      console.error('[Community] Failed to post:', error);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      await CommunityService.toggleVote(postId, 'post', reactionType);
      // Optimistic update
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const reactions = { ...p.reactions };
        reactions[reactionType] = (reactions[reactionType] || 0) + 1;
        return { ...p, reactions, user_reaction: reactionType };
      }));
      setActiveReactionPicker(null);
    } catch (error) {
      console.error('[Community] Failed to react:', error);
    }
  };

  const handleViewPost = (post) => {
    navigation.navigate('CommunityPost', { postId: post.id });
  };

  const handleViewProfile = (username) => {
    if (username) {
      navigation.navigate('PublicProfile', { username });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: TOP BAR
  // ─────────────────────────────────────────────────────────────────────────────

  // Simulated online count - in production, use Supabase presence
  const [onlineCount, setOnlineCount] = useState(23);

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft} />
      <Text style={styles.topBarTitle}>THE GATHERING</Text>
      <View style={styles.onlineIndicator}>
        <View style={styles.onlineDot} />
        <Text style={styles.onlineText}>{onlineCount} online</Text>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: CHANNEL NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────────

  const renderChannelTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.channelTabsContainer}
      contentContainerStyle={styles.channelTabsContent}
    >
      {ALL_CHANNELS.map((channel) => {
        const isLocked = channel.premium && !isPro;
        const isActive = activeChannel === channel.id;

        return (
          <TouchableOpacity
            key={channel.id}
            style={[
              styles.channelTab,
              isActive && styles.channelTabActive,
              isLocked && styles.channelTabLocked,
            ]}
            onPress={() => handleChannelSelect(channel.id)}
          >
            <Text style={styles.channelTabIcon}>{channel.icon}</Text>
            <Text style={[
              styles.channelTabText,
              isActive && styles.channelTabTextActive,
            ]}>
              {channel.name}
            </Text>
            {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderChannelSidebar = () => (
    <View style={styles.channelSidebar}>
      {/* Daily Rituals */}
      <Text style={styles.sidebarSection}>DAILY RITUALS</Text>
      {CHANNELS.daily.map(renderSidebarChannel)}

      <View style={styles.sidebarDivider} />

      {/* Forums */}
      <Text style={styles.sidebarSection}>FORUMS</Text>
      {CHANNELS.forums.map(renderSidebarChannel)}

      <View style={styles.sidebarDivider} />

      {/* Support */}
      <Text style={styles.sidebarSection}>SUPPORT</Text>
      {CHANNELS.support.map(renderSidebarChannel)}

      {/* Premium */}
      {isPro && (
        <>
          <View style={styles.sidebarDivider} />
          <Text style={[styles.sidebarSection, styles.sidebarSectionPremium]}>PREMIUM</Text>
          {CHANNELS.premium.map(renderSidebarChannel)}
        </>
      )}

      {/* VIP Lounge - Always visible, locked for free users */}
      <View style={styles.sidebarDivider} />
      <Text style={[styles.sidebarSection, isPro && styles.sidebarSectionPremium]}>
        ✨ VIP LOUNGE
      </Text>

      {isPro ? (
        // Show VIP sub-channels for subscribers
        <>
          {CHANNELS.vipLounge.map(renderSidebarChannel)}
        </>
      ) : (
        // Show locked teaser for free users
        <>
          <TouchableOpacity
            style={[styles.sidebarItem, styles.sidebarItemLocked]}
            onPress={() => navigation.navigate('MeTab', { screen: 'SubscriptionScreen' })}
          >
            <Text style={styles.sidebarIcon}>🏛️</Text>
            <View style={styles.sidebarItemText}>
              <Text style={styles.sidebarItemName}>Welcome Lounge</Text>
              <Text style={styles.sidebarItemDesc}>Meet fellow subscribers</Text>
            </View>
            <Text style={styles.lockIcon}>🔒</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sidebarItem, styles.sidebarItemLocked]}
            onPress={() => navigation.navigate('MeTab', { screen: 'SubscriptionScreen' })}
          >
            <Text style={styles.sidebarIcon}>👨‍💻</Text>
            <View style={styles.sidebarItemText}>
              <Text style={styles.sidebarItemName}>Dev Corner</Text>
              <Text style={styles.sidebarItemDesc}>Direct dev access</Text>
            </View>
            <Text style={styles.lockIcon}>🔒</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sidebarItem, styles.sidebarItemLocked]}
            onPress={() => navigation.navigate('MeTab', { screen: 'SubscriptionScreen' })}
          >
            <Text style={styles.sidebarIcon}>🎁</Text>
            <View style={styles.sidebarItemText}>
              <Text style={styles.sidebarItemName}>Monthly Rewards</Text>
              <Text style={styles.sidebarItemDesc}>Exclusive giveaways</Text>
            </View>
            <Text style={styles.lockIcon}>🔒</Text>
          </TouchableOpacity>

          <View style={styles.vipTeaser}>
            <Text style={styles.vipTeaserText}>
              Join {Math.floor(Math.random() * 30) + 45} subscribers in exclusive discussions
            </Text>
            <TouchableOpacity
              style={styles.vipTeaserBtn}
              onPress={() => navigation.navigate('MeTab', { screen: 'SubscriptionScreen' })}
            >
              <Text style={styles.vipTeaserBtnText}>See Benefits</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const renderSidebarChannel = (channel) => {
    const isLocked = channel.premium && !isPro;
    const isActive = activeChannel === channel.id;

    return (
      <TouchableOpacity
        key={channel.id}
        style={[
          styles.sidebarItem,
          isActive && styles.sidebarItemActive,
          isLocked && styles.sidebarItemLocked,
        ]}
        onPress={() => handleChannelSelect(channel.id)}
      >
        <Text style={styles.sidebarIcon}>{channel.icon}</Text>
        <View style={styles.sidebarItemText}>
          <Text style={[
            styles.sidebarItemName,
            isActive && styles.sidebarItemNameActive,
          ]}>
            {channel.name}
          </Text>
          <Text style={styles.sidebarItemDesc} numberOfLines={1}>
            {channel.description}
          </Text>
        </View>
        {channel.llmAssisted && <Text style={styles.aiIndicator}>AI</Text>}
        {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
      </TouchableOpacity>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: POST CARD
  // ─────────────────────────────────────────────────────────────────────────────

  const renderPost = ({ item: post }) => {
    const avatarAsset = getCardBackAsset(post.author?.avatar_card_back_id || 'celestial_default');
    const title = getTitleById(post.author?.primary_title_id);
    const secondaryTitle = post.author?.secondary_title_id ? getTitleById(post.author.secondary_title_id) : null;
    const titleDisplay = title
      ? (secondaryTitle ? `${title.name} \u00B7 ${secondaryTitle.name}` : title.name)
      : null;
    const level = post.author?.level || 1;
    const authorTier = post.author?.subscription_tier || 'free';
    const tierConfig = getTierConfig(authorTier);

    const reactions = post.reactions || {};
    const totalReactions = Object.values(reactions).reduce((sum, n) => sum + n, 0);

    return (
      <VictorianCard style={styles.postCard} showCorners={false}>
        {/* Author Header */}
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => handleViewProfile(post.author?.username)}
          activeOpacity={0.7}
        >
          <Image
            source={avatarAsset}
            style={styles.authorAvatar}
            resizeMode="cover"
          />
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              {/* Tier Symbol */}
              {tierConfig.symbol && (
                <TierSymbol tier={authorTier} size="small" style={styles.tierSymbol} />
              )}
              <Text style={styles.authorName}>
                {post.author?.display_name || post.author?.username || 'Anonymous'}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{level}</Text>
              </View>
            </View>
            {titleDisplay && (
              <Text style={styles.authorTitle}>{titleDisplay}</Text>
            )}
          </View>
          <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
        </TouchableOpacity>

        {/* Content */}
        <TouchableOpacity onPress={() => handleViewPost(post)} activeOpacity={0.8}>
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Embedded Card (for daily card shares) */}
          {post.card_ids?.length > 0 && (
            <View style={styles.embeddedCard}>
              <View style={styles.cardPreview}>
                <Text style={styles.cardPreviewIcon}>🎴</Text>
                <Text style={styles.cardPreviewName}>{post.card_ids[0]}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Reactions Bar */}
        <View style={styles.reactionsBar}>
          <View style={styles.reactionCounts}>
            {Object.entries(REACTIONS).map(([key, { emoji }]) => {
              const count = reactions[key] || 0;
              if (count === 0) return null;
              return (
                <View key={key} style={styles.reactionCount}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionNumber}>{count}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.reactionActions}>
            {/* Reaction Picker Toggle */}
            <TouchableOpacity
              style={styles.reactionBtn}
              onPress={() => setActiveReactionPicker(
                activeReactionPicker === post.id ? null : post.id
              )}
            >
              <Text style={styles.reactionBtnText}>
                {post.user_reaction
                  ? REACTIONS[post.user_reaction].emoji
                  : '✨'}
              </Text>
            </TouchableOpacity>

            {/* Reply Button */}
            <TouchableOpacity
              style={styles.reactionBtn}
              onPress={() => handleViewPost(post)}
            >
              <Text style={styles.reactionBtnText}>💬</Text>
              {post.replies_count > 0 && (
                <Text style={styles.replyCount}>{post.replies_count}</Text>
              )}
            </TouchableOpacity>

            {/* Bookmark */}
            <TouchableOpacity style={styles.reactionBtn}>
              <Text style={styles.reactionBtnText}>🔖</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reaction Picker (expandable) */}
        {activeReactionPicker === post.id && (
          <View style={styles.reactionPicker}>
            {Object.entries(REACTIONS).map(([key, { emoji, label }]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.reactionOption,
                  post.user_reaction === key && styles.reactionOptionActive,
                ]}
                onPress={() => handleReaction(post.id, key)}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
                <Text style={styles.reactionOptionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </VictorianCard>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: EMPTY STATE
  // ─────────────────────────────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <VictorianCard style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>{currentChannel.icon}</Text>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptyText}>
        Be the first to share in {currentChannel.name}
      </Text>
      <CosmicButton
        title="Share Something"
        variant="primary"
        size="md"
        onPress={() => setShowCompose(true)}
        style={{ marginTop: 24 }}
      />
    </VictorianCard>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: TRENDING SIDEBAR (Desktop)
  // ─────────────────────────────────────────────────────────────────────────────

  const renderTrendingSidebar = () => (
    <View style={styles.trendingSidebar}>
      <Text style={styles.sidebarSection}>TRENDING TODAY</Text>

      <VictorianCard style={styles.trendingCard} showCorners={false}>
        <Text style={styles.trendingLabel}>Most Shared</Text>
        {['The Tower', 'The Moon', 'The Star'].map((card, i) => (
          <View key={i} style={styles.trendingItem}>
            <Text style={styles.trendingRank}>#{i + 1}</Text>
            <Text style={styles.trendingName}>{card}</Text>
          </View>
        ))}
      </VictorianCard>

      <Text style={[styles.sidebarSection, { marginTop: 24 }]}>COMMUNITY GUIDES</Text>
      <VictorianCard style={styles.trendingCard} showCorners={false}>
        {[
          { name: 'MoonlitSoul', title: 'Sage', level: 52 },
          { name: 'TarotGuru', title: 'Vera', level: 47 },
          { name: 'MysticMel', title: 'Mystic', level: 38 },
        ].map((user, i) => (
          <View key={i} style={styles.topUserRow}>
            <View style={styles.topUserInfo}>
              <Text style={styles.topUserName}>{user.name}</Text>
              <Text style={styles.topUserTitle}>{user.title}</Text>
            </View>
            <View style={styles.topUserLevel}>
              <Text style={styles.topUserLevelText}>{user.level}</Text>
            </View>
          </View>
        ))}
      </VictorianCard>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: COMPOSE
  // ─────────────────────────────────────────────────────────────────────────────

  const charLimit = currentChannel.charLimit || 2000;
  const charsRemaining = charLimit - composeText.length;
  const isOverLimit = charsRemaining < 0;

  const renderComposeArea = () => (
    <View style={styles.composeArea}>
      <TextInput
        style={styles.composeInput}
        placeholder={`Share in ${currentChannel.name}...`}
        placeholderTextColor="rgba(225, 190, 231, 0.4)"
        value={composeText}
        onChangeText={setComposeText}
        multiline
        maxLength={charLimit + 50} // Allow slight overflow for UX
      />
      <View style={styles.composeActions}>
        {currentChannel.charLimit && (
          <Text style={[
            styles.charCount,
            charsRemaining < 50 && styles.charCountWarning,
            isOverLimit && styles.charCountError,
          ]}>
            {charsRemaining}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.postBtn, (!composeText.trim() || isOverLimit) && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!composeText.trim() || isOverLimit}
        >
          <Text style={styles.postBtnText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFloatingCompose = () => (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => setShowCompose(true)}
    >
      <Text style={styles.fabIcon}>✏️</Text>
    </TouchableOpacity>
  );

  const renderMobileCompose = () => (
    <View style={styles.composeModal}>
      <View style={styles.composeModalHeader}>
        <TouchableOpacity onPress={() => setShowCompose(false)}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.composeModalTitle}>{currentChannel.name}</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!composeText.trim() || isOverLimit}
        >
          <Text style={[
            styles.postBtnText,
            (!composeText.trim() || isOverLimit) && { opacity: 0.5 },
          ]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.composeModalInput}
        placeholder={`What's on your mind?`}
        placeholderTextColor="rgba(225, 190, 231, 0.4)"
        value={composeText}
        onChangeText={setComposeText}
        multiline
        maxLength={charLimit + 50}
        autoFocus
      />
      {currentChannel.charLimit && (
        <View style={styles.composeModalFooter}>
          <Text style={[
            styles.charCount,
            charsRemaining < 50 && styles.charCountWarning,
            isOverLimit && styles.charCountError,
          ]}>
            {charsRemaining} characters remaining
          </Text>
        </View>
      )}
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: CHANNEL HEADER
  // ─────────────────────────────────────────────────────────────────────────────

  const renderChannelHeader = () => (
    <View style={styles.channelHeader}>
      <Text style={styles.channelHeaderIcon}>{currentChannel.icon}</Text>
      <View style={styles.channelHeaderInfo}>
        <Text style={styles.channelHeaderName}>{currentChannel.name}</Text>
        <Text style={styles.channelHeaderDesc}>{currentChannel.description}</Text>
      </View>
      {currentChannel.llmAssisted && (
        <View style={styles.aiAssistBadge}>
          <Text style={styles.aiAssistText}>Vera Assists</Text>
        </View>
      )}
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <VeilPathScreen intensity="light" scrollable={false} showMoonPhases={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderTopBar()}
        {!isDesktop && renderChannelTabs()}

        <View style={[
          styles.mainContainer,
          isDesktop && styles.mainContainerDesktop,
        ]}>
          {isDesktop && renderChannelSidebar()}

          <View style={styles.contentArea}>
            {renderChannelHeader()}

            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={renderPost}
              contentContainerStyle={styles.feedContent}
              ListEmptyComponent={loading ? null : renderEmptyState()}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={COSMIC.candleFlame}
                />
              }
            />

            {!isMobile && renderComposeArea()}
          </View>

          {isDesktop && renderTrendingSidebar()}
        </View>

        {isMobile && !showCompose && renderFloatingCompose()}
        {isMobile && showCompose && renderMobileCompose()}
      </KeyboardAvoidingView>
    </VeilPathScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

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
    borderBottomColor: COSMIC.brassVictorian + '30',
  },
  topBarLeft: { width: 80 },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
  },
  onlineText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CHANNEL TABS (Mobile/Tablet)
  // ─────────────────────────────────────────────────────────────────────────────
  channelTabsContainer: {
    maxHeight: 56,
    backgroundColor: 'rgba(10, 10, 20, 0.6)',
  },
  channelTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  channelTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 20, 140, 0.15)',
    gap: 6,
  },
  channelTabActive: {
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
    borderWidth: 1,
    borderColor: COSMIC.candleFlame + '40',
  },
  channelTabLocked: {
    opacity: 0.5,
  },
  channelTabIcon: {
    fontSize: 14,
  },
  channelTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COSMIC.crystalPink,
  },
  channelTabTextActive: {
    color: COSMIC.candleFlame,
  },
  lockIcon: {
    fontSize: 10,
    marginLeft: 2,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CHANNEL SIDEBAR (Desktop)
  // ─────────────────────────────────────────────────────────────────────────────
  channelSidebar: {
    width: 220,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderRightWidth: 1,
    borderRightColor: COSMIC.brassVictorian + '20',
  },
  sidebarSection: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: COSMIC.crystalPink,
    marginBottom: 10,
    marginTop: 4,
    opacity: 0.7,
  },
  sidebarSectionPremium: {
    color: COSMIC.candleFlame,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 2,
    gap: 10,
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
  },
  sidebarItemLocked: {
    opacity: 0.4,
  },
  sidebarIcon: {
    fontSize: 16,
  },
  sidebarItemText: {
    flex: 1,
  },
  sidebarItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.moonGlow,
  },
  sidebarItemNameActive: {
    color: COSMIC.candleFlame,
  },
  sidebarItemDesc: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    opacity: 0.6,
    marginTop: 1,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: COSMIC.brassVictorian + '20',
    marginVertical: 12,
  },
  aiIndicator: {
    fontSize: 9,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
    backgroundColor: COSMIC.etherealCyan + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COSMIC.candleFlame + '15',
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  upgradeBannerIcon: {
    fontSize: 16,
  },
  upgradeBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: COSMIC.candleFlame,
  },
  vipTeaser: {
    backgroundColor: 'rgba(183, 142, 82, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COSMIC.candleFlame + '20',
  },
  vipTeaserText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 16,
  },
  vipTeaserBtn: {
    backgroundColor: COSMIC.candleFlame + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'center',
  },
  vipTeaserBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN CONTAINER
  // ─────────────────────────────────────────────────────────────────────────────
  mainContainer: {
    flex: 1,
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

  // ─────────────────────────────────────────────────────────────────────────────
  // CHANNEL HEADER
  // ─────────────────────────────────────────────────────────────────────────────
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COSMIC.brassVictorian + '15',
    gap: 12,
  },
  channelHeaderIcon: {
    fontSize: 24,
  },
  channelHeaderInfo: {
    flex: 1,
  },
  channelHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.moonGlow,
  },
  channelHeaderDesc: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.6,
  },
  aiAssistBadge: {
    backgroundColor: COSMIC.etherealCyan + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiAssistText: {
    fontSize: 10,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FEED
  // ─────────────────────────────────────────────────────────────────────────────
  feedContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST CARD
  // ─────────────────────────────────────────────────────────────────────────────
  postCard: {
    marginBottom: 12,
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  authorAvatar: {
    width: 36,
    height: 50,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COSMIC.brassVictorian + '30',
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierSymbol: {
    marginRight: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.moonGlow,
  },
  levelBadge: {
    backgroundColor: COSMIC.brassVictorian + '30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  authorTitle: {
    fontSize: 11,
    color: COSMIC.candleFlame,
    opacity: 0.8,
    marginTop: 1,
  },
  postTime: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.5,
  },
  postContent: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    marginBottom: 12,
  },
  embeddedCard: {
    marginBottom: 12,
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 20, 140, 0.15)',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  cardPreviewIcon: {
    fontSize: 24,
  },
  cardPreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.etherealCyan,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // REACTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COSMIC.brassVictorian + '15',
  },
  reactionCounts: {
    flexDirection: 'row',
    gap: 12,
  },
  reactionCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionNumber: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  reactionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  reactionBtnText: {
    fontSize: 18,
  },
  replyCount: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  reactionPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COSMIC.brassVictorian + '15',
  },
  reactionOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  reactionOptionActive: {
    backgroundColor: COSMIC.candleFlame + '20',
  },
  reactionOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  reactionOptionLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EMPTY STATE
  // ─────────────────────────────────────────────────────────────────────────────
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    opacity: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TRENDING SIDEBAR (Desktop)
  // ─────────────────────────────────────────────────────────────────────────────
  trendingSidebar: {
    width: 220,
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: COSMIC.brassVictorian + '20',
  },
  trendingCard: {
    padding: 12,
  },
  trendingLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: COSMIC.crystalPink,
    marginBottom: 8,
    opacity: 0.6,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  trendingRank: {
    fontSize: 11,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    width: 20,
  },
  trendingName: {
    fontSize: 13,
    color: COSMIC.moonGlow,
  },
  topUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  topUserInfo: {
    flex: 1,
  },
  topUserName: {
    fontSize: 13,
    color: COSMIC.moonGlow,
  },
  topUserTitle: {
    fontSize: 10,
    color: COSMIC.candleFlame,
    opacity: 0.7,
  },
  topUserLevel: {
    backgroundColor: COSMIC.brassVictorian + '30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  topUserLevelText: {
    fontSize: 11,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPOSE
  // ─────────────────────────────────────────────────────────────────────────────
  composeArea: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COSMIC.brassVictorian + '20',
    backgroundColor: 'rgba(10, 10, 20, 0.6)',
  },
  composeInput: {
    backgroundColor: 'rgba(74, 20, 140, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COSMIC.moonGlow,
    fontSize: 14,
    minHeight: 50,
    maxHeight: 120,
    marginBottom: 8,
  },
  composeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  charCount: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.6,
  },
  charCountWarning: {
    color: COSMIC.candleFlame,
    opacity: 1,
  },
  charCountError: {
    color: '#FF6B6B',
  },
  postBtn: {
    backgroundColor: COSMIC.candleFlame,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  postBtnDisabled: {
    opacity: 0.4,
  },
  postBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FLOATING COMPOSE (Mobile)
  // ─────────────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COSMIC.candleFlame,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(255, 167, 38, 0.4)',
      },
      default: {
        shadowColor: COSMIC.candleFlame,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  fabIcon: {
    fontSize: 24,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE COMPOSE MODAL
  // ─────────────────────────────────────────────────────────────────────────────
  composeModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 5, 20, 0.98)',
    zIndex: 100,
  },
  composeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COSMIC.brassVictorian + '20',
  },
  cancelBtn: {
    fontSize: 14,
    color: COSMIC.crystalPink,
  },
  composeModalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.moonGlow,
  },
  composeModalInput: {
    flex: 1,
    padding: 16,
    color: COSMIC.moonGlow,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  composeModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COSMIC.brassVictorian + '20',
  },
});
