/**
 * REWARDED VIDEO PLAYER
 * Full-screen video player for earning gems.
 * User must watch minimum duration to earn reward.
 *
 * Usage:
 * <RewardedVideoPlayer
 *   visible={showVideo}
 *   onClose={() => setShowVideo(false)}
 *   onRewardEarned={(gems) => handleGemsEarned(gems)}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  getNextVideo,
  startWatching,
  completeWatching,
  canWatchForReward,
} from '../services/RewardedAdsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Use actual Grok-generated videos from ad_assets
const VIDEO_SOURCES = {
  'grok-video-1': require('../../assets/art/ad_assets/grok-video-32f79437-6fec-4cf8-9382-20ee05b80df8.mp4'),
  'grok-video-2': require('../../assets/art/ad_assets/grok-video-7351e105-0faf-40fa-aa44-82a28c52dd45.mp4'),
  'grok-video-3': require('../../assets/art/ad_assets/grok-video-c6d5b995-08c5-4ac1-a26b-e38b17b02053.mp4'),
  'grok-video-4': require('../../assets/art/ad_assets/grok-video-f235b5ae-7a85-4e3e-bd4c-b1ffff6aebb0.mp4'),
  'grok-video-5': require('../../assets/art/ad_assets/grok-video-fee58432-3aaf-4729-b51d-8e54602b4ad5.mp4'),
  'grok-video-6': require('../../assets/art/ad_assets/grok-video-0b413bf1-a9d7-4c4f-913f-93d55ef5942d (1).mp4'),
};

// Map promo video IDs to actual sources (or use random Grok video)
const getVideoSource = (videoId) => {
  const keys = Object.keys(VIDEO_SOURCES);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return VIDEO_SOURCES[randomKey];
};

const MIN_WATCH_SECONDS = 15;

export default function RewardedVideoPlayer({ visible, onClose, onRewardEarned }) {
  const [videoData, setVideoData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [earnedGems, setEarnedGems] = useState(0);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rewardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      initializeVideo();
    } else {
      // Reset state when closed
      setVideoData(null);
      setSessionId(null);
      setWatchedSeconds(0);
      setIsPlaying(false);
      setCanClaim(false);
      setShowReward(false);
      setError(null);
      progressAnim.setValue(0);
      rewardAnim.setValue(0);
    }
  }, [visible]);

  const initializeVideo = async () => {
    try {
      // Check if can watch
      const canWatch = await canWatchForReward();
      if (!canWatch.canWatch) {
        setError(canWatch.message);
        return;
      }

      // Get next video
      const video = await getNextVideo();
      setVideoData(video);

      // Start watching session
      const session = await startWatching(video.id);
      if (!session.success) {
        setError(session.error);
        return;
      }

      setSessionId(session.sessionId);
      setIsPlaying(true);

    } catch (err) {
      console.error('[RewardedVideo] Init error:', err);
      setError('Failed to load video');
    }
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded && status.isPlaying) {
      const seconds = Math.floor(status.positionMillis / 1000);
      setWatchedSeconds(seconds);

      // Update progress bar
      const progress = Math.min(seconds / MIN_WATCH_SECONDS, 1);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();

      // Check if can claim
      if (seconds >= MIN_WATCH_SECONDS && !canClaim) {
        setCanClaim(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    // Video finished
    if (status.didJustFinish) {
      setIsPlaying(false);
      if (watchedSeconds >= MIN_WATCH_SECONDS) {
        handleClaimReward();
      }
    }
  };

  const handleClaimReward = async () => {
    if (watchedSeconds < MIN_WATCH_SECONDS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      const result = await completeWatching(videoData.id, watchedSeconds);

      if (result.success) {
        setEarnedGems(result.currencyEarned);
        setShowReward(true);

        // Animate reward
        Animated.sequence([
          Animated.spring(rewardAnim, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
        ]).start(() => {
          onRewardEarned?.(result.currencyEarned);
          onClose?.();
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(result.error || 'Failed to claim reward');
      }
    } catch (err) {
      console.error('[RewardedVideo] Claim error:', err);
      setError('Failed to claim reward');
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const rewardScale = rewardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleSkip}
    >
      <View style={styles.container}>
        {/* Video Player */}
        {videoData && !showReward && (
          <Video
            ref={videoRef}
            source={getVideoSource(videoData.id)}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isPlaying}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            isMuted={false}
          />
        )}

        {/* Overlay UI */}
        {!showReward && (
          <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.watchText}>
                  {canClaim ? '✓ Ready to claim!' : `Watch ${MIN_WATCH_SECONDS - watchedSeconds}s more`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.progressText}>
                {watchedSeconds}s / {MIN_WATCH_SECONDS}s
              </Text>
            </View>

            {/* Reward Preview */}
            <View style={styles.rewardPreview}>
              <Text style={styles.rewardPreviewIcon}>💎</Text>
              <Text style={styles.rewardPreviewText}>
                +{videoData?.reward || 15} gems
              </Text>
            </View>

            {/* Claim Button */}
            {canClaim && (
              <TouchableOpacity
                style={styles.claimButton}
                onPress={handleClaimReward}
              >
                <LinearGradient
                  colors={['#9945FF', '#7B3FD4']}
                  style={styles.claimGradient}
                >
                  <Text style={styles.claimText}>Claim Reward</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Reward Animation */}
        {showReward && (
          <View style={styles.rewardContainer}>
            <Animated.View
              style={[
                styles.rewardCard,
                { transform: [{ scale: rewardScale }] },
              ]}
            >
              <Text style={styles.rewardEmoji}>🎉</Text>
              <Text style={styles.rewardTitle}>Gems Earned!</Text>
              <View style={styles.rewardAmount}>
                <Text style={styles.rewardIcon}>💎</Text>
                <Text style={styles.rewardValue}>+{earnedGems}</Text>
              </View>
              <Text style={styles.rewardSubtext}>Added to your wallet</Text>
            </Animated.View>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.errorButton} onPress={onClose}>
              <Text style={styles.errorButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  watchText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  skipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 18,
    color: '#fff',
  },
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 20,
    right: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9945FF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  rewardPreview: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 140 : 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(153,69,255,0.5)',
  },
  rewardPreviewIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  rewardPreviewText: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: '700',
  },
  claimButton: {
    alignSelf: 'center',
    borderRadius: 30,
    overflow: 'hidden',
  },
  claimGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  claimText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  rewardContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardCard: {
    backgroundColor: 'rgba(153,69,255,0.2)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9945FF',
  },
  rewardEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 20,
  },
  rewardAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  rewardValue: {
    fontSize: 48,
    color: '#FFD700',
    fontWeight: '700',
  },
  rewardSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#9945FF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  errorButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
