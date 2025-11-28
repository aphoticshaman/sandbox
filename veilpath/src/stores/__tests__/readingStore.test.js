/**
 * ReadingStore Test Suite
 * Tests for reading history, favorites, and statistics
 */

import { useReadingStore } from '../readingStore';
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

describe('ReadingStore', () => {
  beforeEach(() => {
    // Reset store
    const store = useReadingStore.getState();
    store.clearHistory && store.clearHistory();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('initializes with empty history', () => {
      const state = useReadingStore.getState();

      expect(Array.isArray(state.history)).toBe(true);
      expect(state.history.length).toBe(0);
    });

    test('initializes with empty favorites', () => {
      const state = useReadingStore.getState();

      expect(Array.isArray(state.favorites)).toBe(true);
      expect(state.favorites.length).toBe(0);
    });

    test('initializes with default stats', () => {
      const state = useReadingStore.getState();

      expect(state.stats).toBeDefined();
      expect(state.stats.totalReadings).toBe(0);
    });
  });

  describe('Add Reading', () => {
    test('addReading adds reading to history', () => {
      const mockReading = {
        id: 'reading-1',
        type: 'single',
        cards: [{ card: { name: 'The Fool' }, position: 'present', reversed: false }],
        question: 'Test question',
        date: new Date().toISOString(),
      };

      useReadingStore.getState().addReading(mockReading);

      const history = useReadingStore.getState().history;
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject(mockReading);
    });

    test('addReading increments totalReadings stat', () => {
      const mockReading = {
        id: 'reading-1',
        type: 'single',
        cards: [],
        date: new Date().toISOString(),
      };

      useReadingStore.getState().addReading(mockReading);

      const stats = useReadingStore.getState().stats;
      expect(stats.totalReadings).toBe(1);
    });

    test('addReading tracks card frequency', () => {
      const mockReading = {
        id: 'reading-1',
        type: 'single',
        cards: [{ card: { name: 'The Fool' }, position: 'present', reversed: false }],
        date: new Date().toISOString(),
      };

      useReadingStore.getState().addReading(mockReading);

      const stats = useReadingStore.getState().stats;
      expect(stats.mostDrawnCards).toBeDefined();
      expect(stats.mostDrawnCards['The Fool']).toBe(1);
    });

    test('multiple readings update card frequency correctly', () => {
      const reading1 = {
        id: 'reading-1',
        type: 'single',
        cards: [{ card: { name: 'The Fool' }, position: 'present', reversed: false }],
        date: new Date().toISOString(),
      };

      const reading2 = {
        id: 'reading-2',
        type: 'single',
        cards: [{ card: { name: 'The Fool' }, position: 'present', reversed: false }],
        date: new Date().toISOString(),
      };

      useReadingStore.getState().addReading(reading1);
      useReadingStore.getState().addReading(reading2);

      const stats = useReadingStore.getState().stats;
      expect(stats.mostDrawnCards['The Fool']).toBe(2);
    });
  });

  describe('Favorites', () => {
    test('toggleFavorite adds reading to favorites', () => {
      const mockReading = {
        id: 'reading-1',
        type: 'single',
        cards: [],
        date: new Date().toISOString(),
      };

      useReadingStore.getState().addReading(mockReading);
      useReadingStore.getState().toggleFavorite('reading-1');

      const favorites = useReadingStore.getState().favorites;
      expect(favorites).toContain('reading-1');
    });

    test('toggleFavorite removes reading from favorites', () => {
      const mockReading = {
        id: 'reading-1',
        type: 'single',
        cards: [],
        date: new Date().toISOString(),
      };

      useReadingStore.getState().addReading(mockReading);
      useReadingStore.getState().toggleFavorite('reading-1');
      useReadingStore.getState().toggleFavorite('reading-1');

      const favorites = useReadingStore.getState().favorites;
      expect(favorites).not.toContain('reading-1');
    });

    test('isFavorite returns correct status', () => {
      const mockReading = {
        id: 'reading-1',
        type: 'single',
        cards: [],
        date: new Date().toISOString(),
      };

      useReadingStore.getState().addReading(mockReading);

      expect(useReadingStore.getState().isFavorite('reading-1')).toBe(false);

      useReadingStore.getState().toggleFavorite('reading-1');

      expect(useReadingStore.getState().isFavorite('reading-1')).toBe(true);
    });
  });

  describe('Delete Reading', () => {
    test('deleteReading removes reading from history', () => {
      const mockReading = {
        id: 'reading-1',
        type: 'single',
        cards: [],
        date: new Date().toISOString(),
      };

      useReadingStore.getState().addReading(mockReading);
      useReadingStore.getState().deleteReading('reading-1');

      const history = useReadingStore.getState().history;
      expect(history).toHaveLength(0);
    });

    test('deleteReading removes from favorites', () => {
      const mockReading = {
        id: 'reading-1',
        type: 'single',
        cards: [],
        date: new Date().toISOString(),
      };

      useReadingStore.getState().addReading(mockReading);
      useReadingStore.getState().toggleFavorite('reading-1');
      useReadingStore.getState().deleteReading('reading-1');

      const favorites = useReadingStore.getState().favorites;
      expect(favorites).not.toContain('reading-1');
    });
  });

  describe('Statistics', () => {
    test('tracks readings by type', () => {
      useReadingStore.getState().addReading({
        id: 'r1',
        type: 'single',
        cards: [],
        date: new Date().toISOString(),
      });

      useReadingStore.getState().addReading({
        id: 'r2',
        type: 'three_card',
        cards: [],
        date: new Date().toISOString(),
      });

      const stats = useReadingStore.getState().stats;
      expect(stats.readingsByType).toBeDefined();
      expect(stats.readingsByType.single).toBe(1);
      expect(stats.readingsByType.three_card).toBe(1);
    });
  });

  describe('Persistence', () => {
    test('saveReadings calls AsyncStorage', async () => {
      await useReadingStore.getState().saveReadings();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('loadReadings restores from AsyncStorage', async () => {
      const mockData = {
        history: [{ id: 'r1', type: 'single' }],
        favorites: ['r1'],
        stats: { totalReadings: 1 },
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockData));

      await useReadingStore.getState().loadReadings();

      expect(useReadingStore.getState().history).toHaveLength(1);
      expect(useReadingStore.getState().favorites).toContain('r1');
    });
  });
});
