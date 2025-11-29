/**
 * SaveSystem.ts
 *
 * Unified save/load system with local storage and cloud sync
 * Handles game progress, settings, SDPM profiles, and level states
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface PlayerProgress {
  playerId: string;
  currentChapter: number;
  completedLevels: string[];
  levelMastery: Record<string, number>;  // levelId -> mastery score (0-100)
  totalPlayTime: number;
  firstPlayDate: string;
  lastPlayDate: string;
  achievements: string[];
  unlockedCosmetics: string[];
}

export interface SDPMSaveData {
  vectors: Record<string, number>;  // 33 phonetic dimensions
  archetype: string;
  archetypeStrength: number;
  inputHistory: {
    totalSamples: number;
    recentPatterns: string[];
  };
  difficultyModifiers: {
    reactionTimeScale: number;
    complexityPreference: number;
    explorationTendency: number;
    patternRecognition: number;
  };
}

export interface LevelSaveState {
  levelId: string;
  seed: number;
  checkpoint?: {
    nodeId: string;
    elapsedTime: number;
    nodesVisited: string[];
  };
  bestTime?: number;
  bestMastery?: number;
  attempts: number;
}

export interface SettingsSaveData {
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    ambienceVolume: number;
    voiceChatVolume: number;
    muteMusicInBackground: boolean;
  };
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    bloom: boolean;
    postProcessing: boolean;
    targetFPS: 30 | 60 | 120 | 'unlimited';
    vSync: boolean;
  };
  accessibility: {
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    subtitles: boolean;
    focusIndicatorSize: number;
  };
  controls: {
    mouseSensitivity: number;
    invertY: boolean;
    focusHoldTime: number;
    witnessToggle: boolean;
  };
  social: {
    allowSpectators: boolean;
    showOnLeaderboards: boolean;
    shareProgress: boolean;
    friendsOnly: boolean;
  };
}

export interface FullSaveData {
  version: number;
  progress: PlayerProgress;
  sdpm: SDPMSaveData;
  settings: SettingsSaveData;
  levels: Record<string, LevelSaveState>;
  customData: Record<string, any>;
  syncTimestamp: number;
}

// =============================================================================
// LOCAL STORAGE ADAPTER
// =============================================================================

class LocalStorageAdapter {
  private readonly PREFIX = 'orthogonal_';

  save(key: string, data: any): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.PREFIX + key, serialized);
    } catch (error) {
      console.error('LocalStorage save failed:', error);
      // Fall back to in-memory
    }
  }

  load<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('LocalStorage load failed:', error);
      return null;
    }
  }

  delete(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  exists(key: string): boolean {
    return localStorage.getItem(this.PREFIX + key) !== null;
  }

  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.PREFIX)) {
        keys.push(key.slice(this.PREFIX.length));
      }
    }
    return keys;
  }

  getStorageUsed(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.PREFIX)) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total;
  }
}

// =============================================================================
// INDEXED DB ADAPTER (for larger data)
// =============================================================================

class IndexedDBAdapter {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'orthogonal_saves';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores
        if (!db.objectStoreNames.contains('saves')) {
          db.createObjectStore('saves', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('replays')) {
          db.createObjectStore('replays', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('levelCache')) {
          const store = db.createObjectStore('levelCache', { keyPath: 'levelId' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async save(store: string, id: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.put({ id, ...data, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async load<T>(store: string, id: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T | null);
    });
  }

  async delete(store: string, id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllFromStore<T>(store: string): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T[]);
    });
  }
}

// =============================================================================
// CLOUD SYNC ADAPTER
// =============================================================================

class CloudSyncAdapter {
  private supabase: SupabaseClient | null = null;
  private userId: string | null = null;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async setUser(userId: string): Promise<void> {
    this.userId = userId;
  }

  isConnected(): boolean {
    return this.supabase !== null && this.userId !== null;
  }

  async uploadSave(saveData: FullSaveData): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      const { error } = await this.supabase!
        .from('player_saves')
        .upsert({
          player_id: this.userId,
          save_data: saveData,
          version: saveData.version,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'player_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Cloud save failed:', error);
      return false;
    }
  }

  async downloadSave(): Promise<FullSaveData | null> {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase!
        .from('player_saves')
        .select('save_data')
        .eq('player_id', this.userId)
        .single();

      if (error) throw error;
      return data?.save_data as FullSaveData;
    } catch (error) {
      console.error('Cloud load failed:', error);
      return null;
    }
  }

  async getCloudTimestamp(): Promise<number | null> {
    if (!this.isConnected()) return null;

    try {
      const { data, error } = await this.supabase!
        .from('player_saves')
        .select('updated_at')
        .eq('player_id', this.userId)
        .single();

      if (error) throw error;
      return data ? new Date(data.updated_at).getTime() : null;
    } catch (error) {
      return null;
    }
  }

  async deleteSave(): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      const { error } = await this.supabase!
        .from('player_saves')
        .delete()
        .eq('player_id', this.userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Cloud delete failed:', error);
      return false;
    }
  }
}

// =============================================================================
// SAVE SYSTEM
// =============================================================================

export class SaveSystem {
  private local: LocalStorageAdapter;
  private indexed: IndexedDBAdapter;
  private cloud: CloudSyncAdapter;

  private currentSave: FullSaveData | null = null;
  private autoSaveInterval: number | null = null;
  private syncPending: boolean = false;

  private readonly SAVE_VERSION = 1;
  private readonly AUTO_SAVE_INTERVAL = 30000;  // 30 seconds
  private readonly SAVE_KEY = 'main_save';

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.local = new LocalStorageAdapter();
    this.indexed = new IndexedDBAdapter();
    this.cloud = new CloudSyncAdapter(supabaseUrl, supabaseKey);
  }

  /**
   * Initialize the save system
   */
  async init(): Promise<void> {
    await this.indexed.init();

    // Load existing save
    this.currentSave = await this.loadLocal();

    if (!this.currentSave) {
      this.currentSave = this.createNewSave();
    }

    // Start auto-save
    this.startAutoSave();
  }

  /**
   * Set current user for cloud sync
   */
  async setUser(userId: string): Promise<void> {
    await this.cloud.setUser(userId);
    this.currentSave!.progress.playerId = userId;

    // Check for cloud save
    await this.syncWithCloud();
  }

  /**
   * Create a new empty save
   */
  private createNewSave(): FullSaveData {
    return {
      version: this.SAVE_VERSION,
      progress: {
        playerId: '',
        currentChapter: 0,
        completedLevels: [],
        levelMastery: {},
        totalPlayTime: 0,
        firstPlayDate: new Date().toISOString(),
        lastPlayDate: new Date().toISOString(),
        achievements: [],
        unlockedCosmetics: []
      },
      sdpm: {
        vectors: {},
        archetype: 'unknown',
        archetypeStrength: 0,
        inputHistory: {
          totalSamples: 0,
          recentPatterns: []
        },
        difficultyModifiers: {
          reactionTimeScale: 1.0,
          complexityPreference: 0.5,
          explorationTendency: 0.5,
          patternRecognition: 0.5
        }
      },
      settings: this.getDefaultSettings(),
      levels: {},
      customData: {},
      syncTimestamp: Date.now()
    };
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): SettingsSaveData {
    return {
      audio: {
        masterVolume: 0.8,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        ambienceVolume: 0.6,
        voiceChatVolume: 0.8,
        muteMusicInBackground: true
      },
      graphics: {
        quality: 'high',
        bloom: true,
        postProcessing: true,
        targetFPS: 60,
        vSync: true
      },
      accessibility: {
        colorBlindMode: 'none',
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
        subtitles: false,
        focusIndicatorSize: 1.0
      },
      controls: {
        mouseSensitivity: 1.0,
        invertY: false,
        focusHoldTime: 500,
        witnessToggle: false
      },
      social: {
        allowSpectators: true,
        showOnLeaderboards: true,
        shareProgress: true,
        friendsOnly: false
      }
    };
  }

  // ===========================================================================
  // SAVE OPERATIONS
  // ===========================================================================

  /**
   * Save current state locally
   */
  async saveLocal(): Promise<void> {
    if (!this.currentSave) return;

    this.currentSave.progress.lastPlayDate = new Date().toISOString();
    this.currentSave.syncTimestamp = Date.now();

    // Save to localStorage for quick access
    this.local.save(this.SAVE_KEY, this.currentSave);

    // Save to IndexedDB for reliability
    await this.indexed.save('saves', this.SAVE_KEY, this.currentSave);

    this.syncPending = true;
  }

  /**
   * Load from local storage
   */
  private async loadLocal(): Promise<FullSaveData | null> {
    // Try localStorage first (faster)
    let save = this.local.load<FullSaveData>(this.SAVE_KEY);

    // Fall back to IndexedDB
    if (!save) {
      const indexed = await this.indexed.load<{ id: string } & FullSaveData>('saves', this.SAVE_KEY);
      if (indexed) {
        const { id, timestamp, ...saveData } = indexed;
        save = saveData as FullSaveData;
      }
    }

    // Migrate if needed
    if (save && save.version < this.SAVE_VERSION) {
      save = this.migrateSave(save);
    }

    return save;
  }

  /**
   * Sync with cloud storage
   */
  async syncWithCloud(): Promise<'local' | 'cloud' | 'conflict' | 'none'> {
    if (!this.cloud.isConnected()) return 'none';
    if (!this.currentSave) return 'none';

    const cloudTimestamp = await this.cloud.getCloudTimestamp();
    const localTimestamp = this.currentSave.syncTimestamp;

    if (!cloudTimestamp) {
      // No cloud save, upload local
      await this.cloud.uploadSave(this.currentSave);
      return 'local';
    }

    if (cloudTimestamp > localTimestamp) {
      // Cloud is newer, download
      const cloudSave = await this.cloud.downloadSave();
      if (cloudSave) {
        this.currentSave = cloudSave;
        await this.saveLocal();
        return 'cloud';
      }
    } else if (localTimestamp > cloudTimestamp) {
      // Local is newer, upload
      await this.cloud.uploadSave(this.currentSave);
      return 'local';
    }

    // Same timestamp or conflict
    return 'none';
  }

  /**
   * Force upload to cloud
   */
  async forceCloudUpload(): Promise<boolean> {
    if (!this.currentSave) return false;
    return this.cloud.uploadSave(this.currentSave);
  }

  /**
   * Force download from cloud
   */
  async forceCloudDownload(): Promise<boolean> {
    const cloudSave = await this.cloud.downloadSave();
    if (cloudSave) {
      this.currentSave = cloudSave;
      await this.saveLocal();
      return true;
    }
    return false;
  }

  /**
   * Migrate old save format to new
   */
  private migrateSave(save: FullSaveData): FullSaveData {
    // Add migration logic here as versions change
    save.version = this.SAVE_VERSION;
    return save;
  }

  // ===========================================================================
  // AUTO-SAVE
  // ===========================================================================

  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = window.setInterval(async () => {
      await this.saveLocal();

      // Sync to cloud if pending
      if (this.syncPending && this.cloud.isConnected()) {
        await this.cloud.uploadSave(this.currentSave!);
        this.syncPending = false;
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // ===========================================================================
  // PROGRESS ACCESSORS
  // ===========================================================================

  getProgress(): PlayerProgress {
    return this.currentSave!.progress;
  }

  updateProgress(updates: Partial<PlayerProgress>): void {
    Object.assign(this.currentSave!.progress, updates);
  }

  completeLevel(levelId: string, mastery: number): void {
    const progress = this.currentSave!.progress;

    if (!progress.completedLevels.includes(levelId)) {
      progress.completedLevels.push(levelId);
    }

    // Update mastery (keep best)
    const currentMastery = progress.levelMastery[levelId] || 0;
    progress.levelMastery[levelId] = Math.max(currentMastery, mastery);
  }

  addPlayTime(milliseconds: number): void {
    this.currentSave!.progress.totalPlayTime += milliseconds;
  }

  unlockAchievement(achievementId: string): boolean {
    const achievements = this.currentSave!.progress.achievements;
    if (achievements.includes(achievementId)) return false;

    achievements.push(achievementId);
    return true;
  }

  // ===========================================================================
  // SDPM ACCESSORS
  // ===========================================================================

  getSDPM(): SDPMSaveData {
    return this.currentSave!.sdpm;
  }

  updateSDPM(updates: Partial<SDPMSaveData>): void {
    Object.assign(this.currentSave!.sdpm, updates);
  }

  resetSDPM(): void {
    this.currentSave!.sdpm = {
      vectors: {},
      archetype: 'unknown',
      archetypeStrength: 0,
      inputHistory: {
        totalSamples: 0,
        recentPatterns: []
      },
      difficultyModifiers: {
        reactionTimeScale: 1.0,
        complexityPreference: 0.5,
        explorationTendency: 0.5,
        patternRecognition: 0.5
      }
    };
  }

  // ===========================================================================
  // SETTINGS ACCESSORS
  // ===========================================================================

  getSettings(): SettingsSaveData {
    return this.currentSave!.settings;
  }

  updateSettings(updates: Partial<SettingsSaveData>): void {
    // Deep merge settings
    const merge = (target: any, source: any) => {
      for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          merge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };

    merge(this.currentSave!.settings, updates);
  }

  resetSettings(): void {
    this.currentSave!.settings = this.getDefaultSettings();
  }

  // ===========================================================================
  // LEVEL STATE ACCESSORS
  // ===========================================================================

  getLevelState(levelId: string): LevelSaveState | null {
    return this.currentSave!.levels[levelId] || null;
  }

  saveLevelState(state: LevelSaveState): void {
    const existing = this.currentSave!.levels[state.levelId];

    if (existing) {
      // Merge, keeping best times
      existing.attempts++;
      if (state.bestTime && (!existing.bestTime || state.bestTime < existing.bestTime)) {
        existing.bestTime = state.bestTime;
      }
      if (state.bestMastery && (!existing.bestMastery || state.bestMastery > existing.bestMastery)) {
        existing.bestMastery = state.bestMastery;
      }
      existing.checkpoint = state.checkpoint;
    } else {
      this.currentSave!.levels[state.levelId] = {
        ...state,
        attempts: 1
      };
    }
  }

  setCheckpoint(levelId: string, checkpoint: LevelSaveState['checkpoint']): void {
    const level = this.currentSave!.levels[levelId];
    if (level) {
      level.checkpoint = checkpoint;
    }
  }

  clearCheckpoint(levelId: string): void {
    const level = this.currentSave!.levels[levelId];
    if (level) {
      delete level.checkpoint;
    }
  }

  // ===========================================================================
  // CUSTOM DATA
  // ===========================================================================

  getCustomData<T>(key: string): T | null {
    return this.currentSave!.customData[key] as T || null;
  }

  setCustomData(key: string, value: any): void {
    this.currentSave!.customData[key] = value;
  }

  // ===========================================================================
  // SAVE MANAGEMENT
  // ===========================================================================

  /**
   * Export save as JSON string
   */
  exportSave(): string {
    return JSON.stringify(this.currentSave, null, 2);
  }

  /**
   * Import save from JSON string
   */
  async importSave(jsonString: string): Promise<boolean> {
    try {
      const imported = JSON.parse(jsonString) as FullSaveData;

      // Validate structure
      if (!imported.version || !imported.progress || !imported.settings) {
        throw new Error('Invalid save format');
      }

      this.currentSave = imported;
      await this.saveLocal();
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  /**
   * Delete all save data
   */
  async deleteSave(): Promise<void> {
    this.local.delete(this.SAVE_KEY);
    await this.indexed.delete('saves', this.SAVE_KEY);
    await this.cloud.deleteSave();
    this.currentSave = this.createNewSave();
  }

  /**
   * Get save statistics
   */
  getStats(): object {
    return {
      localStorageUsed: this.local.getStorageUsed(),
      saveVersion: this.currentSave?.version,
      lastSaved: this.currentSave?.syncTimestamp,
      cloudConnected: this.cloud.isConnected(),
      syncPending: this.syncPending
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

export const saveSystem = new SaveSystem(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
