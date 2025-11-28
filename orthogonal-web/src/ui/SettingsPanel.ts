/**
 * Settings Panel
 * Clean, minimal, organized
 * Follows the same attention-based reveal philosophy
 */

export interface GameSettings {
  // Audio
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;

  // Graphics
  quality: 'low' | 'medium' | 'high' | 'ultra';
  particleDensity: number;
  bloomIntensity: number;
  motionBlur: boolean;
  vSync: boolean;

  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  subtitles: boolean;
  screenShake: number;

  // Controls
  mouseSensitivity: number;
  invertY: boolean;
  holdToWitness: boolean;
  gamepadVibration: boolean;

  // Social
  allowSpectators: boolean;
  showViewerEmojis: boolean;
  anonymousMode: boolean;
  friendsOnly: boolean;

  // Profile
  displayName: string;
  showRank: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
}

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  ambienceVolume: 0.6,

  quality: 'high',
  particleDensity: 1.0,
  bloomIntensity: 0.5,
  motionBlur: true,
  vSync: true,

  highContrast: false,
  reducedMotion: false,
  colorBlindMode: 'none',
  subtitles: false,
  screenShake: 1.0,

  mouseSensitivity: 1.0,
  invertY: false,
  holdToWitness: true,
  gamepadVibration: true,

  allowSpectators: true,
  showViewerEmojis: true,
  anonymousMode: false,
  friendsOnly: false,

  displayName: 'Observer',
  showRank: true,
  profileVisibility: 'public',
};

export class SettingsPanel {
  private container: HTMLDivElement;
  private settings: GameSettings;
  private currentTab: string = 'audio';
  private onSettingsChange: ((settings: GameSettings) => void) | null = null;

  constructor() {
    this.settings = this.loadSettings();
    this.container = this.createPanel();
  }

  private loadSettings(): GameSettings {
    try {
      const saved = localStorage.getItem('orthogonal-settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('orthogonal-settings', JSON.stringify(this.settings));
    } catch {}
  }

  private createPanel(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'settings-panel';
    container.innerHTML = `
      <div class="settings-backdrop"></div>
      <div class="settings-window">
        <div class="settings-header">
          <h2>SETTINGS</h2>
          <button class="settings-close">×</button>
        </div>

        <div class="settings-body">
          <nav class="settings-tabs">
            <button class="tab active" data-tab="audio">Audio</button>
            <button class="tab" data-tab="graphics">Graphics</button>
            <button class="tab" data-tab="accessibility">Accessibility</button>
            <button class="tab" data-tab="controls">Controls</button>
            <button class="tab" data-tab="social">Social</button>
            <button class="tab" data-tab="profile">Profile</button>
          </nav>

          <div class="settings-content">
            <!-- Audio Tab -->
            <div class="tab-content active" data-tab="audio">
              <div class="setting-group">
                <label class="setting-label">Master Volume</label>
                <div class="setting-control">
                  <input type="range" min="0" max="1" step="0.01" data-setting="masterVolume">
                  <span class="setting-value">80%</span>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Music</label>
                <div class="setting-control">
                  <input type="range" min="0" max="1" step="0.01" data-setting="musicVolume">
                  <span class="setting-value">70%</span>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Sound Effects</label>
                <div class="setting-control">
                  <input type="range" min="0" max="1" step="0.01" data-setting="sfxVolume">
                  <span class="setting-value">80%</span>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Ambience</label>
                <div class="setting-control">
                  <input type="range" min="0" max="1" step="0.01" data-setting="ambienceVolume">
                  <span class="setting-value">60%</span>
                </div>
              </div>
            </div>

            <!-- Graphics Tab -->
            <div class="tab-content" data-tab="graphics">
              <div class="setting-group">
                <label class="setting-label">Quality Preset</label>
                <div class="setting-control">
                  <select data-setting="quality">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Particle Density</label>
                <div class="setting-control">
                  <input type="range" min="0" max="1" step="0.1" data-setting="particleDensity">
                  <span class="setting-value">100%</span>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Bloom Intensity</label>
                <div class="setting-control">
                  <input type="range" min="0" max="1" step="0.1" data-setting="bloomIntensity">
                  <span class="setting-value">50%</span>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Motion Blur</label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="motionBlur">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">V-Sync</label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="vSync">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Accessibility Tab -->
            <div class="tab-content" data-tab="accessibility">
              <div class="setting-group">
                <label class="setting-label">High Contrast</label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="highContrast">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Reduce Motion</label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="reducedMotion">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Color Blind Mode</label>
                <div class="setting-control">
                  <select data-setting="colorBlindMode">
                    <option value="none">None</option>
                    <option value="protanopia">Protanopia</option>
                    <option value="deuteranopia">Deuteranopia</option>
                    <option value="tritanopia">Tritanopia</option>
                  </select>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Subtitles</label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="subtitles">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Screen Shake</label>
                <div class="setting-control">
                  <input type="range" min="0" max="1" step="0.1" data-setting="screenShake">
                  <span class="setting-value">100%</span>
                </div>
              </div>
            </div>

            <!-- Controls Tab -->
            <div class="tab-content" data-tab="controls">
              <div class="setting-group">
                <label class="setting-label">Mouse Sensitivity</label>
                <div class="setting-control">
                  <input type="range" min="0.1" max="2" step="0.1" data-setting="mouseSensitivity">
                  <span class="setting-value">1.0</span>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Invert Y-Axis</label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="invertY">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Hold to Witness</label>
                <div class="setting-hint">Hold Tab/RT to enter witness mode, or toggle</div>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="holdToWitness">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Gamepad Vibration</label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="gamepadVibration">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Social Tab -->
            <div class="tab-content" data-tab="social">
              <div class="setting-group">
                <label class="setting-label">Allow Spectators</label>
                <div class="setting-hint">Others can watch your gameplay</div>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="allowSpectators">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Show Viewer Emojis</label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="showViewerEmojis">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Anonymous Mode</label>
                <div class="setting-hint">Hide your name from other players</div>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="anonymousMode">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Friends Only Invites</label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="friendsOnly">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Profile Tab -->
            <div class="tab-content" data-tab="profile">
              <div class="setting-group">
                <label class="setting-label">Display Name</label>
                <div class="setting-control">
                  <input type="text" class="text-input" data-setting="displayName" maxlength="24">
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Show Rank</label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-setting="showRank">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-group">
                <label class="setting-label">Profile Visibility</label>
                <div class="setting-control">
                  <select data-setting="profileVisibility">
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div class="setting-divider"></div>

              <div class="setting-group">
                <button class="btn-secondary" id="reset-sdpm">Reset SDPM Profile</button>
                <div class="setting-hint">Clears your learned preferences and restarts difficulty calibration</div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-footer">
          <button class="btn-secondary" id="reset-defaults">Reset to Defaults</button>
          <button class="btn-primary" id="save-settings">Save & Close</button>
        </div>
      </div>
    `;

    this.applyStyles();
    this.setupEventListeners();
    this.populateSettings();
    return container;
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .settings-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .settings-panel.visible {
        opacity: 1;
        visibility: visible;
      }

      .settings-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
      }

      .settings-window {
        position: relative;
        width: 600px;
        max-height: 80vh;
        background: rgba(20, 20, 30, 0.98);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .settings-header h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 3px;
      }

      .settings-close {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 20px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .settings-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .settings-body {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .settings-tabs {
        width: 140px;
        padding: 16px 8px;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .settings-tabs .tab {
        padding: 10px 16px;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 13px;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
      }

      .settings-tabs .tab:hover {
        background: rgba(255, 255, 255, 0.05);
        color: white;
      }

      .settings-tabs .tab.active {
        background: rgba(102, 126, 234, 0.2);
        color: white;
      }

      .settings-content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
      }

      .tab-content {
        display: none;
      }

      .tab-content.active {
        display: block;
      }

      .setting-group {
        margin-bottom: 20px;
      }

      .setting-label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: white;
        margin-bottom: 8px;
      }

      .setting-hint {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 8px;
      }

      .setting-control {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .setting-value {
        min-width: 50px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
        text-align: right;
      }

      /* Range input */
      input[type="range"] {
        flex: 1;
        height: 4px;
        -webkit-appearance: none;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        outline: none;
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #667eea;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s;
      }

      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }

      /* Select */
      select {
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 13px;
        outline: none;
        cursor: pointer;
      }

      select:focus {
        border-color: #667eea;
      }

      /* Text input */
      .text-input {
        width: 100%;
        padding: 10px 16px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 14px;
        outline: none;
      }

      .text-input:focus {
        border-color: #667eea;
      }

      /* Toggle */
      .toggle {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 24px;
      }

      .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        transition: all 0.3s;
      }

      .toggle-slider::before {
        position: absolute;
        content: '';
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background: white;
        border-radius: 50%;
        transition: all 0.3s;
      }

      .toggle input:checked + .toggle-slider {
        background: #667eea;
      }

      .toggle input:checked + .toggle-slider::before {
        transform: translateX(24px);
      }

      .setting-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 24px 0;
      }

      .settings-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .btn-primary, .btn-secondary {
        padding: 12px 24px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-1px);
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    // Close button
    const closeBtn = this.container.querySelector('.settings-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Backdrop click
    const backdrop = this.container.querySelector('.settings-backdrop');
    backdrop?.addEventListener('click', () => this.hide());

    // Tab switching
    const tabs = this.container.querySelectorAll('.settings-tabs .tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).dataset.tab;
        this.switchTab(tabName!);
      });
    });

    // Setting changes
    this.container.querySelectorAll('[data-setting]').forEach(input => {
      const setting = (input as HTMLElement).dataset.setting as keyof GameSettings;

      input.addEventListener('input', () => {
        this.updateSetting(setting, input as HTMLInputElement);
      });

      input.addEventListener('change', () => {
        this.updateSetting(setting, input as HTMLInputElement);
      });
    });

    // Reset defaults
    const resetBtn = this.container.querySelector('#reset-defaults');
    resetBtn?.addEventListener('click', () => {
      this.settings = { ...DEFAULT_SETTINGS };
      this.populateSettings();
      this.saveSettings();
    });

    // Save & close
    const saveBtn = this.container.querySelector('#save-settings');
    saveBtn?.addEventListener('click', () => {
      this.saveSettings();
      this.hide();
    });

    // Reset SDPM
    const resetSdpmBtn = this.container.querySelector('#reset-sdpm');
    resetSdpmBtn?.addEventListener('click', () => {
      if (confirm('This will reset your learned play style and difficulty preferences. Continue?')) {
        localStorage.removeItem('orthogonal-sdpm-profile');
        // Emit event for game to handle
        window.dispatchEvent(new CustomEvent('orthogonal:resetSDPM'));
      }
    });
  }

  private switchTab(tabName: string): void {
    this.currentTab = tabName;

    // Update tab buttons
    this.container.querySelectorAll('.settings-tabs .tab').forEach(tab => {
      tab.classList.toggle('active', (tab as HTMLElement).dataset.tab === tabName);
    });

    // Update content
    this.container.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', (content as HTMLElement).dataset.tab === tabName);
    });
  }

  private populateSettings(): void {
    for (const [key, value] of Object.entries(this.settings)) {
      const input = this.container.querySelector(`[data-setting="${key}"]`) as HTMLInputElement | HTMLSelectElement;
      if (!input) continue;

      if (input.type === 'checkbox') {
        (input as HTMLInputElement).checked = value as boolean;
      } else if (input.type === 'range') {
        input.value = String(value);
        this.updateValueDisplay(key, value as number);
      } else {
        input.value = String(value);
      }
    }
  }

  private updateSetting(key: keyof GameSettings, input: HTMLInputElement | HTMLSelectElement): void {
    let value: any;

    if (input.type === 'checkbox') {
      value = (input as HTMLInputElement).checked;
    } else if (input.type === 'range') {
      value = parseFloat(input.value);
      this.updateValueDisplay(key, value);
    } else if (input.type === 'number') {
      value = parseFloat(input.value);
    } else {
      value = input.value;
    }

    (this.settings as any)[key] = value;

    if (this.onSettingsChange) {
      this.onSettingsChange(this.settings);
    }
  }

  private updateValueDisplay(key: string, value: number): void {
    const input = this.container.querySelector(`[data-setting="${key}"]`);
    const display = input?.parentElement?.querySelector('.setting-value');
    if (display) {
      if (key === 'mouseSensitivity') {
        display.textContent = value.toFixed(1);
      } else {
        display.textContent = `${Math.round(value * 100)}%`;
      }
    }
  }

  // Public API

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  setOnSettingsChange(handler: (settings: GameSettings) => void): void {
    this.onSettingsChange = handler;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  show(): void {
    this.container.classList.add('visible');
  }

  hide(): void {
    this.container.classList.remove('visible');
    this.saveSettings();
  }

  toggle(): void {
    if (this.container.classList.contains('visible')) {
      this.hide();
    } else {
      this.show();
    }
  }
}
