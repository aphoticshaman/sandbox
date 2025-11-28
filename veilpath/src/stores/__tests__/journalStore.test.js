/**
 * JournalStore Test Suite
 * Tests for journal entries, moods, CBT/DBT work, and statistics
 */

import { useJournalStore } from '../journalStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock console
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('JournalStore', () => {
  beforeEach(() => {
    // Reset store
    const store = useJournalStore.getState();
    store.clearEntries && store.clearEntries();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('initializes with empty entries', () => {
      const state = useJournalStore.getState();

      expect(Array.isArray(state.entries)).toBe(true);
      expect(state.entries.length).toBe(0);
    });

    test('initializes with default stats', () => {
      const state = useJournalStore.getState();

      expect(state.stats).toBeDefined();
      expect(state.stats.totalEntries).toBe(0);
      expect(state.stats.totalWords).toBe(0);
    });
  });

  describe('Add Entry', () => {
    test('addEntry adds entry to entries array', () => {
      const mockEntry = {
        id: 'entry-1',
        title: 'Test Entry',
        content: 'Test content here',
        mood: 'calm',
        tags: ['test'],
        date: new Date().toISOString(),
        isPrivate: false,
      };

      useJournalStore.getState().addEntry(mockEntry);

      const entries = useJournalStore.getState().entries;
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject(mockEntry);
    });

    test('addEntry calculates word count', () => {
      const mockEntry = {
        id: 'entry-1',
        title: 'Test',
        content: 'One two three four five',
        mood: 'calm',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);

      const entries = useJournalStore.getState().entries;
      expect(entries[0].wordCount).toBe(5);
    });

    test('addEntry increments totalEntries stat', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Test',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);

      const stats = useJournalStore.getState().stats;
      expect(stats.totalEntries).toBe(1);
    });

    test('addEntry updates totalWords stat', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'One two three',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);

      const stats = useJournalStore.getState().stats;
      expect(stats.totalWords).toBe(3);
    });

    test('addEntry tracks mood distribution', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Test',
        mood: 'joyful',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);

      const stats = useJournalStore.getState().stats;
      expect(stats.entriesByMood).toBeDefined();
      expect(stats.entriesByMood.joyful).toBe(1);
    });
  });

  describe('Update Entry', () => {
    test('updateEntry modifies existing entry', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Original content',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);
      useJournalStore.getState().updateEntry('entry-1', { content: 'Updated content' });

      const entries = useJournalStore.getState().entries;
      expect(entries[0].content).toBe('Updated content');
    });

    test('updateEntry recalculates word count', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'One two',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);
      useJournalStore.getState().updateEntry('entry-1', { content: 'One two three four' });

      const entries = useJournalStore.getState().entries;
      expect(entries[0].wordCount).toBe(4);
    });

    test('updateEntry preserves unchanged fields', () => {
      const mockEntry = {
        id: 'entry-1',
        title: 'Original Title',
        content: 'Original content',
        mood: 'calm',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);
      useJournalStore.getState().updateEntry('entry-1', { content: 'New content' });

      const entries = useJournalStore.getState().entries;
      expect(entries[0].title).toBe('Original Title');
      expect(entries[0].mood).toBe('calm');
    });
  });

  describe('Delete Entry', () => {
    test('deleteEntry removes entry from array', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Test',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);
      useJournalStore.getState().deleteEntry('entry-1');

      const entries = useJournalStore.getState().entries;
      expect(entries).toHaveLength(0);
    });

    test('deleteEntry updates statistics', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'One two three',
        mood: 'joyful',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);
      const statsAfterAdd = useJournalStore.getState().stats;
      expect(statsAfterAdd.totalEntries).toBe(1);

      useJournalStore.getState().deleteEntry('entry-1');
      const statsAfterDelete = useJournalStore.getState().stats;
      expect(statsAfterDelete.totalEntries).toBe(0);
    });
  });

  describe('CBT Work', () => {
    test('entry can include CBT distortions', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Test',
        cbtWork: {
          hasDistortions: true,
          distortions: ['all-or-nothing', 'catastrophizing'],
          reframe: 'More balanced view',
        },
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);

      const entries = useJournalStore.getState().entries;
      expect(entries[0].cbtWork.hasDistortions).toBe(true);
      expect(entries[0].cbtWork.distortions).toHaveLength(2);
    });

    test('CBT work is optional', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Test',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);

      const entries = useJournalStore.getState().entries;
      expect(entries[0].cbtWork).toBeUndefined();
    });
  });

  describe('DBT Work', () => {
    test('entry can include DBT skills', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Test',
        dbtWork: {
          skill: 'mindfulness',
          notes: 'Practiced breathing',
        },
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);

      const entries = useJournalStore.getState().entries;
      expect(entries[0].dbtWork.skill).toBe('mindfulness');
    });
  });

  describe('Privacy', () => {
    test('entry can be marked as private', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Private thoughts',
        isPrivate: true,
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);

      const entries = useJournalStore.getState().entries;
      expect(entries[0].isPrivate).toBe(true);
    });

    test('entries are public by default', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Public thoughts',
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);

      const entries = useJournalStore.getState().entries;
      expect(entries[0].isPrivate).toBe(false);
    });

    test('getPublicEntries filters out private entries', () => {
      useJournalStore.getState().addEntry({
        id: 'entry-1',
        content: 'Public',
        isPrivate: false,
        date: new Date().toISOString(),
      });

      useJournalStore.getState().addEntry({
        id: 'entry-2',
        content: 'Private',
        isPrivate: true,
        date: new Date().toISOString(),
      });

      const publicEntries = useJournalStore.getState().getPublicEntries();

      expect(publicEntries).toHaveLength(1);
      expect(publicEntries[0].id).toBe('entry-1');
    });
  });

  describe('Tags', () => {
    test('entry can have multiple tags', () => {
      const mockEntry = {
        id: 'entry-1',
        content: 'Test',
        tags: ['gratitude', 'reflection', 'morning'],
        date: new Date().toISOString(),
      };

      useJournalStore.getState().addEntry(mockEntry);

      const entries = useJournalStore.getState().entries;
      expect(entries[0].tags).toHaveLength(3);
    });

    test('getEntriesByTag filters correctly', () => {
      useJournalStore.getState().addEntry({
        id: 'entry-1',
        content: 'Test 1',
        tags: ['gratitude'],
        date: new Date().toISOString(),
      });

      useJournalStore.getState().addEntry({
        id: 'entry-2',
        content: 'Test 2',
        tags: ['reflection'],
        date: new Date().toISOString(),
      });

      const gratitudeEntries = useJournalStore.getState().getEntriesByTag('gratitude');

      expect(gratitudeEntries).toHaveLength(1);
      expect(gratitudeEntries[0].id).toBe('entry-1');
    });
  });

  describe('Statistics', () => {
    test('tracks mood distribution across entries', () => {
      useJournalStore.getState().addEntry({
        id: 'e1',
        content: 'Test 1',
        mood: 'joyful',
        date: new Date().toISOString(),
      });

      useJournalStore.getState().addEntry({
        id: 'e2',
        content: 'Test 2',
        mood: 'joyful',
        date: new Date().toISOString(),
      });

      useJournalStore.getState().addEntry({
        id: 'e3',
        content: 'Test 3',
        mood: 'calm',
        date: new Date().toISOString(),
      });

      const stats = useJournalStore.getState().stats;
      expect(stats.entriesByMood.joyful).toBe(2);
      expect(stats.entriesByMood.calm).toBe(1);
    });

    test('tracks total word count across all entries', () => {
      useJournalStore.getState().addEntry({
        id: 'e1',
        content: 'One two three',
        date: new Date().toISOString(),
      });

      useJournalStore.getState().addEntry({
        id: 'e2',
        content: 'Four five',
        date: new Date().toISOString(),
      });

      const stats = useJournalStore.getState().stats;
      expect(stats.totalWords).toBe(5);
    });
  });

  describe('Persistence', () => {
    test('saveEntries calls AsyncStorage', async () => {
      await useJournalStore.getState().saveEntries();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('loadEntries restores from AsyncStorage', async () => {
      const mockData = {
        entries: [{ id: 'e1', content: 'Test' }],
        stats: { totalEntries: 1, totalWords: 1 },
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockData));

      await useJournalStore.getState().loadEntries();

      expect(useJournalStore.getState().entries).toHaveLength(1);
      expect(useJournalStore.getState().stats.totalEntries).toBe(1);
    });
  });
});
