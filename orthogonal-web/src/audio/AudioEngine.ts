/**
 * Procedural Audio Engine
 * Pure synthesis - no samples, everything generated mathematically
 *
 * Philosophy: Sound emerges from the same mathematics as the visuals.
 * - Each dimension has its own harmonic character
 * - Player actions generate musical events
 * - Ambient soundscapes breathe with the level
 * - Audio responds to awareness and witness states
 */

// ========================================
// Core Types
// ========================================

export type DimensionAudioProfile = 'LATTICE' | 'MARROW' | 'VOID';

export interface AudioState {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  currentDimension: DimensionAudioProfile;
  witnessLevel: number;
  intensity: number;  // 0-1, based on gameplay
}

// ========================================
// Musical Constants
// ========================================

// Frequencies for notes (A4 = 440Hz standard)
const NOTE_FREQUENCIES: Record<string, number> = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
  'C6': 1046.50,
};

// Dimension-specific scales
const DIMENSION_SCALES: Record<DimensionAudioProfile, string[]> = {
  LATTICE: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'],  // Pentatonic major
  MARROW: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'Eb5'],      // Minor pentatonic
  VOID: ['C4', 'Db4', 'E4', 'F4', 'G4', 'Ab4', 'B4'],          // Phrygian dominant
};

// Add flat/sharp frequencies
NOTE_FREQUENCIES['Db4'] = 277.18;
NOTE_FREQUENCIES['Eb4'] = 311.13;
NOTE_FREQUENCIES['Gb4'] = 369.99;
NOTE_FREQUENCIES['Ab4'] = 415.30;
NOTE_FREQUENCIES['Bb4'] = 466.16;
NOTE_FREQUENCIES['Db5'] = 554.37;
NOTE_FREQUENCIES['Eb5'] = 622.25;

// ========================================
// Audio Engine
// ========================================

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;

  private state: AudioState = {
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    ambienceVolume: 0.6,
    currentDimension: 'LATTICE',
    witnessLevel: 0,
    intensity: 0.3,
  };

  // Active sound sources
  private ambience: AmbienceGenerator | null = null;
  private music: MusicGenerator | null = null;
  private activeSounds: Map<string, AudioScheduledSourceNode> = new Map();

  // Reverb
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  // Alias for initialize
  async init(): Promise<void> {
    return this.initialize();
  }

  async initialize(): Promise<void> {
    // Create context on user interaction
    this.ctx = new AudioContext();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.state.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    // Sub-gains
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.state.musicVolume;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.state.sfxVolume;

    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = this.state.ambienceVolume;

    // Create reverb
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = await this.createReverbImpulse(2, 2);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.3;

    // Routing
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.ambienceGain.connect(this.masterGain);

    this.sfxGain.connect(this.reverb);
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    // Start generators
    this.ambience = new AmbienceGenerator(this.ctx, this.ambienceGain);
    this.music = new MusicGenerator(this.ctx, this.musicGain);

    this.ambience.start(this.state.currentDimension);
    this.music.start(this.state.currentDimension);

    console.log('[Audio] Initialized');
  }

  private async createReverbImpulse(duration: number, decay: number): Promise<AudioBuffer> {
    const sampleRate = this.ctx!.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx!.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    return buffer;
  }

  // ========================================
  // State Updates
  // ========================================

  update(delta: number): void {
    if (!this.ctx) return;

    this.ambience?.update(delta, this.state);
    this.music?.update(delta, this.state);
  }

  setDimension(dimension: DimensionAudioProfile): void {
    if (this.state.currentDimension === dimension) return;

    this.state.currentDimension = dimension;
    this.ambience?.transitionTo(dimension);
    this.music?.transitionTo(dimension);
  }

  setWitnessLevel(level: number): void {
    this.state.witnessLevel = level;
  }

  setIntensity(intensity: number): void {
    this.state.intensity = Math.max(0, Math.min(1, intensity));
  }

  startDimensionTransition(from: DimensionAudioProfile, to: DimensionAudioProfile): void {
    // Crossfade audio during dimension transition
    this.setDimension(to);
  }

  // ========================================
  // Sound Effects
  // ========================================

  playFocusStart(): void {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playFocusComplete(): void {
    if (!this.ctx || !this.sfxGain) return;

    // Triumphant chord
    const notes = ['C5', 'E5', 'G5'];
    notes.forEach((note, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.value = NOTE_FREQUENCIES[note];

      gain.gain.setValueAtTime(0, this.ctx!.currentTime + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx!.currentTime + i * 0.05 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(this.ctx!.currentTime + i * 0.05);
      osc.stop(this.ctx!.currentTime + 0.6);
    });
  }

  playWitnessEnter(): void {
    if (!this.ctx || !this.sfxGain) return;

    // Ethereal whoosh
    const noise = this.createNoiseSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.3);
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.5);
  }

  playWitnessExit(): void {
    if (!this.ctx || !this.sfxGain) return;

    // Reverse whoosh
    const noise = this.createNoiseSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.4);
  }

  playNodeActivate(): void {
    if (!this.ctx || !this.sfxGain) return;

    // Crystalline ping
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1200;
    osc2.type = 'sine';
    osc2.frequency.value = 1800;

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + 0.8);
    osc2.stop(this.ctx.currentTime + 0.8);
  }

  playPortalEnter(): void {
    if (!this.ctx || !this.sfxGain) return;

    // Dimensional shift sound
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200 + i * 100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);

      const startTime = this.ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    }
  }

  playUIClick(): void {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 600;

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playUIHover(): void {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 800;

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  playError(): void {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.setValueAtTime(150, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playSuccess(): void {
    if (!this.ctx || !this.sfxGain) return;

    // Ascending arpeggio
    const notes = ['C5', 'E5', 'G5', 'C6'];
    notes.forEach((note, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.value = NOTE_FREQUENCIES[note];

      const startTime = this.ctx!.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  // ========================================
  // Helpers
  // ========================================

  private createNoiseSource(): AudioBufferSourceNode {
    const bufferSize = this.ctx!.sampleRate * 2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  // ========================================
  // Volume Controls
  // ========================================

  setMasterVolume(volume: number): void {
    this.state.masterVolume = volume;
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }

  setMusicVolume(volume: number): void {
    this.state.musicVolume = volume;
    if (this.musicGain) {
      this.musicGain.gain.value = volume;
    }
  }

  setSfxVolume(volume: number): void {
    this.state.sfxVolume = volume;
    if (this.sfxGain) {
      this.sfxGain.gain.value = volume;
    }
  }

  setAmbienceVolume(volume: number): void {
    this.state.ambienceVolume = volume;
    if (this.ambienceGain) {
      this.ambienceGain.gain.value = volume;
    }
  }

  // Resume after user interaction
  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  pause(): void {
    this.ctx?.suspend();
  }

  // Generic sound player
  playSound(soundName: string): void {
    switch (soundName) {
      case 'focus_start': this.playFocusStart(); break;
      case 'focus_complete': this.playFocusComplete(); break;
      case 'witness_enter': this.playWitnessEnter(); break;
      case 'witness_exit': this.playWitnessExit(); break;
      case 'node_activate': this.playNodeActivate(); break;
      case 'portal_enter': this.playPortalEnter(); break;
      case 'ui_click': this.playUIClick(); break;
      case 'ui_hover': this.playUIHover(); break;
      case 'error': this.playError(); break;
      case 'success': this.playSuccess(); break;
      default: this.playUIClick(); break;
    }
  }

  // Generic volume setter
  setVolume(volume: number): void {
    this.setMasterVolume(volume);
  }

  // Cleanup
  dispose(): void {
    this.ambience = null;
    this.music = null;
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// ========================================
// Ambience Generator
// ========================================

class AmbienceGenerator {
  private ctx: AudioContext;
  private output: GainNode;
  private currentDimension: DimensionAudioProfile = 'LATTICE';

  // Drone oscillators
  private drones: OscillatorNode[] = [];
  private droneGains: GainNode[] = [];

  // Texture layers
  private textureSource: AudioBufferSourceNode | null = null;
  private textureFilter: BiquadFilterNode | null = null;

  constructor(ctx: AudioContext, output: GainNode) {
    this.ctx = ctx;
    this.output = output;
  }

  start(dimension: DimensionAudioProfile): void {
    this.currentDimension = dimension;
    this.createDrones();
    this.createTexture();
  }

  private createDrones(): void {
    // Stop existing drones
    this.drones.forEach(d => d.stop());
    this.drones = [];
    this.droneGains = [];

    const config = this.getDimensionConfig();

    // Create layered drones
    config.droneFrequencies.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = config.waveform;
      osc.frequency.value = freq;

      // Slow LFO modulation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.1 + i * 0.05;
      lfoGain.gain.value = freq * 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      gain.gain.value = config.droneVolumes[i] || 0.1;

      osc.connect(gain);
      gain.connect(this.output);

      osc.start();
      this.drones.push(osc);
      this.droneGains.push(gain);
    });
  }

  private createTexture(): void {
    // Filtered noise texture
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    this.textureSource = this.ctx.createBufferSource();
    this.textureSource.buffer = buffer;
    this.textureSource.loop = true;

    this.textureFilter = this.ctx.createBiquadFilter();
    this.textureFilter.type = 'lowpass';
    this.textureFilter.frequency.value = this.getDimensionConfig().textureFilterFreq;
    this.textureFilter.Q.value = 1;

    const textureGain = this.ctx.createGain();
    textureGain.gain.value = 0.03;

    this.textureSource.connect(this.textureFilter);
    this.textureFilter.connect(textureGain);
    textureGain.connect(this.output);

    this.textureSource.start();
  }

  transitionTo(dimension: DimensionAudioProfile): void {
    this.currentDimension = dimension;

    // Crossfade to new drones
    const config = this.getDimensionConfig();

    // Fade out current drones
    this.droneGains.forEach(gain => {
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
    });

    // Create new drones after fade
    setTimeout(() => {
      this.createDrones();
    }, 2000);

    // Update texture filter
    if (this.textureFilter) {
      this.textureFilter.frequency.exponentialRampToValueAtTime(
        config.textureFilterFreq,
        this.ctx.currentTime + 2
      );
    }
  }

  update(delta: number, state: AudioState): void {
    // Modulate ambience based on witness level
    const witnessBoost = 1 + state.witnessLevel * 0.5;

    this.droneGains.forEach(gain => {
      gain.gain.value *= witnessBoost;
    });
  }

  private getDimensionConfig() {
    const configs: Record<DimensionAudioProfile, {
      droneFrequencies: number[];
      droneVolumes: number[];
      waveform: OscillatorType;
      textureFilterFreq: number;
    }> = {
      LATTICE: {
        droneFrequencies: [55, 82.5, 110, 165],  // A1, E2, A2, E3
        droneVolumes: [0.1, 0.08, 0.06, 0.04],
        waveform: 'sine',
        textureFilterFreq: 800,
      },
      MARROW: {
        droneFrequencies: [65.41, 98, 130.81],  // C2, G2, C3
        droneVolumes: [0.12, 0.08, 0.05],
        waveform: 'triangle',
        textureFilterFreq: 400,
      },
      VOID: {
        droneFrequencies: [32.7, 49, 65.41],  // C1, G1, C2
        droneVolumes: [0.15, 0.1, 0.05],
        waveform: 'sawtooth',
        textureFilterFreq: 200,
      },
    };

    return configs[this.currentDimension];
  }
}

// ========================================
// Music Generator
// ========================================

class MusicGenerator {
  private ctx: AudioContext;
  private output: GainNode;
  private currentDimension: DimensionAudioProfile = 'LATTICE';

  private isPlaying: boolean = false;
  private nextNoteTime: number = 0;
  private noteIndex: number = 0;

  // Synthesizer components
  private compressor: DynamicsCompressorNode;

  constructor(ctx: AudioContext, output: GainNode) {
    this.ctx = ctx;
    this.output = output;

    // Master compressor for music
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.compressor.connect(output);
  }

  start(dimension: DimensionAudioProfile): void {
    this.currentDimension = dimension;
    this.isPlaying = true;
    this.nextNoteTime = this.ctx.currentTime;
    this.scheduleNotes();
  }

  stop(): void {
    this.isPlaying = false;
  }

  transitionTo(dimension: DimensionAudioProfile): void {
    this.currentDimension = dimension;
    this.noteIndex = 0;
  }

  update(delta: number, state: AudioState): void {
    if (!this.isPlaying) return;

    // Schedule notes ahead
    while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
      this.playNote();
      this.scheduleNextNote(state);
    }
  }

  private scheduleNotes(): void {
    // Initial scheduling handled by update
  }

  private playNote(): void {
    const scale = DIMENSION_SCALES[this.currentDimension];
    const note = scale[this.noteIndex % scale.length];
    const freq = NOTE_FREQUENCIES[note];

    if (!freq) return;

    // Create note
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Dimension-specific synthesis
    switch (this.currentDimension) {
      case 'LATTICE':
        osc.type = 'triangle';
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        break;
      case 'MARROW':
        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 2;
        break;
      case 'VOID':
        osc.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        break;
    }

    osc.frequency.value = freq;

    // Envelope
    const attackTime = 0.01;
    const decayTime = 0.1;
    const sustainLevel = 0.3;
    const releaseTime = 0.3;

    gain.gain.setValueAtTime(0, this.nextNoteTime);
    gain.gain.linearRampToValueAtTime(0.15, this.nextNoteTime + attackTime);
    gain.gain.linearRampToValueAtTime(0.15 * sustainLevel, this.nextNoteTime + attackTime + decayTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + attackTime + decayTime + releaseTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);

    osc.start(this.nextNoteTime);
    osc.stop(this.nextNoteTime + attackTime + decayTime + releaseTime + 0.1);
  }

  private scheduleNextNote(state: AudioState): void {
    // Note timing based on intensity
    const baseInterval = 0.5;
    const intensityFactor = 1 - state.intensity * 0.5;
    const interval = baseInterval * intensityFactor;

    // Add some variation
    const variation = (Math.random() - 0.5) * 0.1;

    this.nextNoteTime += interval + variation;
    this.noteIndex++;

    // Occasionally skip notes for rhythm variation
    if (Math.random() < 0.2) {
      this.nextNoteTime += interval;
    }
  }
}
