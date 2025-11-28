/**
 * Data Export Utility
 * Export user data in JSON and Markdown formats
 *
 * Features:
 * - Full data export (JSON): All user data, readings, journal entries, stats
 * - Journal export (Markdown): Beautiful markdown files for journaling
 * - Privacy-first: Respects user privacy flags
 * - Share API: Native share dialog for saving/sharing
 */

import { Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useUserStore } from '../stores/userStore';
import { useReadingStore } from '../stores/readingStore';
import { useJournalStore } from '../stores/journalStore';
import { APP_BRANDING } from '../constants/appConstants';

/**
 * Get all user data as a complete export object
 */
export function getAllUserData() {
  const userState = useUserStore.getState();
  const readingState = useReadingStore.getState();
  const journalState = useJournalStore.getState();

  return {
    exportInfo: {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      platform: Platform.OS,
      exportType: 'full',
    },
    user: {
      profile: userState.profile,
      progression: userState.progression,
      achievements: userState.achievements,
      skillTree: userState.skillTree,
      metaProgression: userState.metaProgression,
      stats: userState.stats,
      onboarding: userState.onboarding,
    },
    readings: {
      history: readingState.history,
      favorites: readingState.favorites,
      stats: readingState.stats,
    },
    journal: {
      entries: journalState.entries.filter(entry => !entry.isPrivate), // Respect privacy
      stats: journalState.stats,
    },
  };
}

/**
 * Export all data as JSON string
 */
export function exportDataAsJSON() {
  const data = getAllUserData();
  return JSON.stringify(data, null, 2); // Pretty-printed JSON
}

/**
 * Export journal entries as Markdown
 * Returns a single markdown string with all entries
 */
export function exportJournalAsMarkdown() {
  const journalState = useJournalStore.getState();
  const userState = useUserStore.getState();

  const entries = journalState.entries.filter(entry => !entry.isPrivate);

  if (entries.length === 0) {
    return `# ${APP_BRANDING.NAME} Journal\n\nNo journal entries yet. Start your therapeutic journey!`;
  }

  // Build markdown document
  let markdown = `# ${APP_BRANDING.NAME} Journal Export\n\n`;
  markdown += `**Exported**: ${new Date().toLocaleDateString()}\n`;
  markdown += `**Total Entries**: ${entries.length}\n`;
  markdown += `**User**: ${userState.profile.displayName} (Level ${userState.progression.level})\n\n`;
  markdown += `---\n\n`;

  // Add each entry
  entries.forEach((entry, index) => {
    const date = new Date(entry.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    markdown += `## Entry ${entries.length - index}: ${formattedDate}\n\n`;
    markdown += `**Time**: ${formattedTime}\n`;

    if (entry.mood) {
      markdown += `**Mood (Before)**: ${entry.mood}\n`;
    }
    if (entry.moodAfter) {
      markdown += `**Mood (After)**: ${entry.moodAfter}\n`;
    }
    if (entry.tags && entry.tags.length > 0) {
      markdown += `**Tags**: ${entry.tags.join(', ')}\n`;
    }
    if (entry.cbtDistortions && entry.cbtDistortions.length > 0) {
      markdown += `**CBT Work**: ${entry.cbtDistortions.join(', ')}\n`;
    }
    if (entry.dbtSkills && entry.dbtSkills.length > 0) {
      markdown += `**DBT Skills**: ${entry.dbtSkills.join(', ')}\n`;
    }

    markdown += `\n`;
    markdown += entry.content;
    markdown += `\n\n`;

    // Metadata footer
    markdown += `<details>\n<summary>Metadata</summary>\n\n`;
    markdown += `- **Word Count**: ${entry.wordCount}\n`;
    markdown += `- **XP Earned**: ${entry.xpAwarded}\n`;
    if (entry.linkedReadingId) {
      markdown += `- **Linked Reading**: Yes\n`;
    }
    markdown += `</details>\n\n`;
    markdown += `---\n\n`;
  });

  // Add statistics
  markdown += `\n## Journal Statistics\n\n`;
  markdown += `- **Total Entries**: ${journalState.stats.totalEntries}\n`;
  markdown += `- **Total Words**: ${journalState.stats.totalWords.toLocaleString()}\n`;
  markdown += `- **Average Words/Entry**: ${Math.round(journalState.stats.averageWordsPerEntry)}\n`;
  markdown += `- **Longest Entry**: ${journalState.stats.longestEntry} words\n`;
  markdown += `- **CBT Distortions Identified**: ${journalState.stats.cbtDistortionsIdentified}\n`;
  markdown += `- **DBT Skills Practiced**: ${journalState.stats.dbtSkillsPracticed}\n`;

  return markdown;
}

/**
 * Export readings as Markdown
 */
export function exportReadingsAsMarkdown() {
  const readingState = useReadingStore.getState();
  const userState = useUserStore.getState();

  const readings = readingState.history;

  if (readings.length === 0) {
    return `# ${APP_BRANDING.NAME} Reading History\n\nNo readings yet. Draw your first card!`;
  }

  let markdown = `# ${APP_BRANDING.NAME} Reading History\n\n`;
  markdown += `**Exported**: ${new Date().toLocaleDateString()}\n`;
  markdown += `**Total Readings**: ${readings.length}\n`;
  markdown += `**User**: ${userState.profile.displayName} (Level ${userState.progression.level})\n\n`;
  markdown += `---\n\n`;

  readings.forEach((reading, index) => {
    const date = new Date(reading.startedAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    markdown += `## Reading ${readings.length - index}: ${reading.type.toUpperCase()}\n\n`;
    markdown += `**Date**: ${formattedDate}\n`;
    markdown += `**Intention**: ${reading.intention || 'No intention set'}\n`;
    markdown += `**Type**: ${reading.type}\n`;
    if (reading.isFavorite) {
      markdown += `**Favorite**: ⭐\n`;
    }
    markdown += `\n### Cards Drawn\n\n`;

    reading.cards.forEach((card) => {
      markdown += `- **${card.positionName}**: Card ${card.cardId}${card.isReversed ? ' (Reversed)' : ''}\n`;
    });

    if (reading.reflection) {
      markdown += `\n### Reflection\n\n${reading.reflection}\n`;
    }

    if (reading.tags && reading.tags.length > 0) {
      markdown += `\n**Tags**: ${reading.tags.join(', ')}\n`;
    }

    markdown += `\n---\n\n`;
  });

  // Add statistics
  markdown += `\n## Reading Statistics\n\n`;
  markdown += `- **Total Readings**: ${readingState.stats.totalReadings}\n`;
  markdown += `- **Single Card**: ${readingState.stats.readingsByType.single}\n`;
  markdown += `- **Three-Card Spread**: ${readingState.stats.readingsByType['three-card']}\n`;
  markdown += `- **Celtic Cross**: ${readingState.stats.readingsByType['celtic-cross']}\n`;

  return markdown;
}

/**
 * Export complete data package (JSON + Markdown files)
 * Returns object with all export content
 */
export function exportCompleteDataPackage() {
  return {
    'veilpath_data_export.json': exportDataAsJSON(),
    'veilpath_journal_export.md': exportJournalAsMarkdown(),
    'veilpath_readings_export.md': exportReadingsAsMarkdown(),
  };
}

/**
 * Share JSON export using native share dialog
 */
export async function shareJSONExport() {
  try {
    const jsonData = exportDataAsJSON();
    const filename = `veilpath_export_${new Date().toISOString().split('T')[0]}.json`;

    if (Platform.OS === 'web') {
      // Web: Download file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } else {
      // Mobile: Use file system + sharing
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: `Export ${APP_BRANDING.NAME} Data`,
          UTI: 'public.json',
        });
      } else {
        // Fallback to basic Share API
        await Share.share({
          message: `${APP_BRANDING.NAME} Data Export\n\nFile saved to: ${fileUri}`,
          title: `Export ${APP_BRANDING.NAME} Data`,
        });
      }

      return { success: true, uri: fileUri };
    }
  } catch (error) {
    console.error('[DataExport] Failed to share JSON:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Share Markdown journal export
 */
export async function shareJournalMarkdown() {
  try {
    const markdown = exportJournalAsMarkdown();
    const filename = `veilpath_journal_${new Date().toISOString().split('T')[0]}.md`;

    if (Platform.OS === 'web') {
      // Web: Download file
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } else {
      // Mobile: Use file system + sharing
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, markdown, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/markdown',
          dialogTitle: 'Export Journal',
        });
      } else {
        await Share.share({
          message: markdown,
          title: `${APP_BRANDING.NAME} Journal Export`,
        });
      }

      return { success: true, uri: fileUri };
    }
  } catch (error) {
    console.error('[DataExport] Failed to share journal:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Share Markdown readings export
 */
export async function shareReadingsMarkdown() {
  try {
    const markdown = exportReadingsAsMarkdown();
    const filename = `veilpath_readings_${new Date().toISOString().split('T')[0]}.md`;

    if (Platform.OS === 'web') {
      // Web: Download file
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } else {
      // Mobile: Use file system + sharing
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, markdown, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/markdown',
          dialogTitle: 'Export Readings',
        });
      } else {
        await Share.share({
          message: markdown,
          title: `${APP_BRANDING.NAME} Readings Export`,
        });
      }

      return { success: true, uri: fileUri };
    }
  } catch (error) {
    console.error('[DataExport] Failed to share readings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get export preview (first 500 chars) for UI preview
 */
export function getExportPreview(type = 'json') {
  let content;
  switch (type) {
    case 'json':
      content = exportDataAsJSON();
      break;
    case 'journal':
      content = exportJournalAsMarkdown();
      break;
    case 'readings':
      content = exportReadingsAsMarkdown();
      break;
    default:
      content = '';
  }

  if (content.length > 500) {
    return content.substring(0, 500) + '\n\n... (truncated)';
  }
  return content;
}
