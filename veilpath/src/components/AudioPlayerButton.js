/**
 * Audio Player Button Component
 * Opens Spotify playlists externally (commercial-safe approach)
 * Themed for dark fantasy aesthetic
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { THEME } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Playlist configurations
 * Uses Spotify URIs and web URLs
 * Opens externally in Spotify app or browser
 */
const PLAYLISTS = {
  mystic: {
    id: 'mystic',
    name: 'Mystic Vera',
    description: 'Ethereal ambient for vera sessions',
    icon: '🔮',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX6ziVCJnEm59', // Dark & Stormy (ambient)
    color: THEME.colors.primary[500],
  },
  meditation: {
    id: 'meditation',
    name: 'Deep Meditation',
    description: 'Calm ambient for meditation',
    icon: '🧘',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u', // Peaceful Meditation
    color: THEME.colors.therapeutic[500],
  },
  breathing: {
    id: 'breathing',
    name: 'Breath & Flow',
    description: 'Gentle rhythms for breathing exercises',
    icon: '🌬️',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX9uKNf5jGX6m', // Calm Vibes
    color: THEME.colors.secondary[500],
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep Soundscape',
    description: 'Drift off to peaceful slumber',
    icon: '🌙',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp', // Sleep
    color: THEME.colors.primary[700],
  },
  focus: {
    id: 'focus',
    name: 'Deep Focus',
    description: 'Ambient focus music for journaling',
    icon: '📝',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', // Deep Focus
    color: THEME.colors.accent[500],
  },
};

/**
 * Main Audio Button - Compact button that opens playlist selector
 */
export function AudioPlayerButton({
  variant = 'default', // 'default' | 'compact' | 'minimal'
  availablePlaylists = ['mystic', 'meditation', 'breathing', 'sleep', 'focus'],
  defaultPlaylist = null,
  style,
}) {
  const [showModal, setShowModal] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Start pulse animation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleOpenPlaylist = async (playlist) => {
    try {
      const canOpen = await Linking.canOpenURL(playlist.spotifyUrl);
      if (canOpen) {
        await Linking.openURL(playlist.spotifyUrl);
        setShowModal(false);
      } else {
        Alert.alert(
          'Spotify Not Available',
          'Install Spotify to play ambient music, or open the link in your browser.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open in Browser',
              onPress: () => Linking.openURL(playlist.spotifyUrl)
            },
          ]
        );
      }
    } catch (error) {
      console.error('[AudioPlayer] Error opening playlist:', error);
      // Fallback to web URL
      Linking.openURL(playlist.spotifyUrl);
    }
  };

  const filteredPlaylists = availablePlaylists
    .map(id => PLAYLISTS[id])
    .filter(Boolean);

  // If only one playlist, open directly
  const handlePress = () => {
    if (filteredPlaylists.length === 1) {
      handleOpenPlaylist(filteredPlaylists[0]);
    } else if (defaultPlaylist && PLAYLISTS[defaultPlaylist]) {
      handleOpenPlaylist(PLAYLISTS[defaultPlaylist]);
    } else {
      setShowModal(true);
    }
  };

  if (variant === 'minimal') {
    return (
      <>
        <TouchableOpacity
          style={[styles.minimalButton, style]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Text style={styles.minimalIcon}>🎵</Text>
        </TouchableOpacity>
        <PlaylistModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          playlists={filteredPlaylists}
          onSelect={handleOpenPlaylist}
        />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <TouchableOpacity
          style={[styles.compactButton, style]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Text style={styles.compactIcon}>🎵</Text>
          <Text style={styles.compactText}>Music</Text>
        </TouchableOpacity>
        <PlaylistModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          playlists={filteredPlaylists}
          onSelect={handleOpenPlaylist}
        />
      </>
    );
  }

  // Default variant
  return (
    <>
      <Animated.View style={[{ transform: [{ scale: pulseAnim }] }, style]}>
        <TouchableOpacity
          style={styles.defaultButton}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[THEME.colors.primary[600], THEME.colors.primary[800]]}
            style={styles.defaultGradient}
          >
            <Text style={styles.defaultIcon}>🎵</Text>
            <View style={styles.defaultTextContainer}>
              <Text style={styles.defaultTitle}>Play Ambient Music</Text>
              <Text style={styles.defaultSubtitle}>Open in Spotify</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      <PlaylistModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        playlists={filteredPlaylists}
        onSelect={handleOpenPlaylist}
      />
    </>
  );
}

/**
 * Playlist Selection Modal
 */
function PlaylistModal({ visible, onClose, playlists, onSelect }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1}>
            <LinearGradient
              colors={[THEME.colors.neutral[800], THEME.colors.neutral[900]]}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Ambient Music</Text>
                <Text style={styles.modalSubtitle}>Opens in Spotify</Text>
              </View>

              <ScrollView style={styles.playlistList}>
                {playlists.map((playlist) => (
                  <TouchableOpacity
                    key={playlist.id}
                    style={styles.playlistItem}
                    onPress={() => onSelect(playlist)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.playlistIconContainer,
                        { backgroundColor: playlist.color + '30' }
                      ]}
                    >
                      <Text style={styles.playlistIcon}>{playlist.icon}</Text>
                    </View>
                    <View style={styles.playlistInfo}>
                      <Text style={styles.playlistName}>{playlist.name}</Text>
                      <Text style={styles.playlistDescription}>
                        {playlist.description}
                      </Text>
                    </View>
                    <Text style={styles.playlistArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

/**
 * Inline Playlist Card - For embedding in screens
 */
export function PlaylistCard({
  playlistId = 'mystic',
  showDescription = true,
  style,
}) {
  const playlist = PLAYLISTS[playlistId];

  if (!playlist) return null;

  const handlePress = async () => {
    try {
      await Linking.openURL(playlist.spotifyUrl);
    } catch (error) {
      console.error('[AudioPlayer] Error opening playlist:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.playlistCard, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[playlist.color + '40', playlist.color + '20']}
        style={styles.playlistCardGradient}
      >
        <View style={styles.playlistCardLeft}>
          <Text style={styles.playlistCardIcon}>{playlist.icon}</Text>
          <View>
            <Text style={styles.playlistCardName}>{playlist.name}</Text>
            {showDescription && (
              <Text style={styles.playlistCardDesc}>{playlist.description}</Text>
            )}
          </View>
        </View>
        <View style={styles.playlistCardRight}>
          <Text style={styles.spotifyBadge}>Spotify</Text>
          <Text style={styles.playlistCardArrow}>▶</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Minimal variant
  minimalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary[700] + '80',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.primary[500] + '50',
  },
  minimalIcon: {
    fontSize: 18,
  },

  // Compact variant
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.base,
    backgroundColor: THEME.colors.primary[700] + '60',
    borderWidth: 1,
    borderColor: THEME.colors.primary[500] + '40',
    gap: 6,
  },
  compactIcon: {
    fontSize: 16,
  },
  compactText: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.neutral[200],
    fontWeight: '500',
  },

  // Default variant
  defaultButton: {
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.primary[500] + '50',
  },
  defaultGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  defaultIcon: {
    fontSize: 24,
  },
  defaultTextContainer: {
    flex: 1,
  },
  defaultTitle: {
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.neutral[100],
    fontWeight: '600',
  },
  defaultSubtitle: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.neutral[400],
    marginTop: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.primary[600] + '50',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.neutral[700],
  },
  modalTitle: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: '700',
    color: THEME.colors.neutral[100],
  },
  modalSubtitle: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.neutral[400],
    marginTop: 4,
  },
  playlistList: {
    maxHeight: 300,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.neutral[800],
  },
  playlistIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playlistIcon: {
    fontSize: 24,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '600',
    color: THEME.colors.neutral[100],
  },
  playlistDescription: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.neutral[400],
    marginTop: 2,
  },
  playlistArrow: {
    fontSize: 18,
    color: THEME.colors.primary[400],
    marginLeft: 8,
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.neutral[700],
  },
  closeButtonText: {
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.neutral[400],
    fontWeight: '500',
  },

  // Playlist Card
  playlistCard: {
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.neutral[700],
  },
  playlistCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  playlistCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  playlistCardIcon: {
    fontSize: 28,
  },
  playlistCardName: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '600',
    color: THEME.colors.neutral[100],
  },
  playlistCardDesc: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.neutral[400],
    marginTop: 2,
  },
  playlistCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spotifyBadge: {
    fontSize: THEME.typography.sizes.xs,
    color: '#1DB954', // Spotify green
    fontWeight: '600',
  },
  playlistCardArrow: {
    fontSize: 16,
    color: THEME.colors.neutral[300],
  },
});

export default AudioPlayerButton;
