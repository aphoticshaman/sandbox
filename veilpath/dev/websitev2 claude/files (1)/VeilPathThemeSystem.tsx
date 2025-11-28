import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// VEILPATH UI/UX THEME SYSTEM
// Complete theme transformations as rewards/monetization

export interface VeilPathTheme {
  id: string;
  name: string;
  description: string;
  unlockRequirement: string;
  source: 'default' | 'achievement' | 'purchase' | 'event';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  
  // Core theme properties
  colors: ThemeColors;
  typography: ThemeTypography;
  animations: ThemeAnimations;
  effects: ThemeEffects;
  layout: ThemeLayout;
  sounds: ThemeSounds;
  
  // Special features for premium themes
  particles?: ParticleSystem;
  shaders?: ShaderEffects;
  transforms3D?: Transform3D;
}

interface ThemeColors {
  // Primary palette
  background: string;
  backgroundGradient: string;
  surface: string;
  surfaceGradient: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  
  // UI colors
  primary: string;
  secondary: string;
  accent: string;
  warning: string;
  success: string;
  
  // Special effects colors
  glow: string;
  shadow: string;
  particle: string;
  
  // Frame tier colors (override defaults)
  frameCopper?: string;
  frameSilver?: string;
  frameGold?: string;
  framePlatinum?: string;
  frameDiamond?: string;
}

interface ThemeEffects {
  blur: number;
  glow: number;
  shadows: 'soft' | 'hard' | 'dramatic' | 'none';
  glassmorphism: boolean;
  noise: number;
  vignette: number;
}

// ============= THE 5 INITIAL THEMES =============

export const VEILPATH_THEMES: Record<string, VeilPathTheme> = {
  // ========== DEFAULT DARK THEME ==========
  defaultDark: {
    id: 'default-dark',
    name: 'Midnight Veil',
    description: 'The classic VeilPath experience',
    unlockRequirement: 'Default',
    source: 'default',
    rarity: 'common',
    
    colors: {
      background: '#0a0514',
      backgroundGradient: 'linear-gradient(135deg, #1a0033 0%, #0a0514 100%)',
      surface: 'rgba(26, 0, 51, 0.6)',
      surfaceGradient: 'linear-gradient(135deg, rgba(74, 20, 140, 0.3) 0%, rgba(10, 5, 20, 0.9) 100%)',
      
      textPrimary: '#e1bee7',
      textSecondary: '#b39ddb',
      textAccent: '#f8bbd0',
      
      primary: '#4a148c',
      secondary: '#6a1b9a',
      accent: '#ffa726',
      warning: '#ff6b6b',
      success: '#7fb069',
      
      glow: 'rgba(155, 114, 207, 0.5)',
      shadow: 'rgba(0, 0, 0, 0.8)',
      particle: '#e1bee7',
    },
    
    typography: {
      fontDisplay: 'Cinzel, serif',
      fontBody: 'Spectral, serif',
      fontUI: 'Inter, sans-serif',
      scaleFactor: 1,
      letterSpacing: 'normal',
    },
    
    animations: {
      speed: 1,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      entranceStyle: 'fade',
      hoverScale: 1.05,
      clickScale: 0.95,
    },
    
    effects: {
      blur: 10,
      glow: 0.5,
      shadows: 'soft',
      glassmorphism: true,
      noise: 0.02,
      vignette: 0.4,
    },
    
    layout: {
      borderRadius: 12,
      spacing: 1,
      density: 'comfortable',
    },
    
    sounds: {
      enabled: true,
      volume: 0.3,
      style: 'mystical',
    },
  },
  
  // ========== DEFAULT LIGHT THEME ==========
  defaultLight: {
    id: 'default-light',
    name: 'Moonlit Dawn',
    description: 'A softer, brighter experience',
    unlockRequirement: 'Default',
    source: 'default',
    rarity: 'common',
    
    colors: {
      background: '#fdf4ff',
      backgroundGradient: 'linear-gradient(135deg, #ffffff 0%, #f3e5f5 100%)',
      surface: 'rgba(255, 255, 255, 0.8)',
      surfaceGradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(243, 229, 245, 0.9) 100%)',
      
      textPrimary: '#4a148c',
      textSecondary: '#6a1b9a',
      textAccent: '#e91e63',
      
      primary: '#9c27b0',
      secondary: '#ba68c8',
      accent: '#ff9800',
      warning: '#f44336',
      success: '#4caf50',
      
      glow: 'rgba(156, 39, 176, 0.3)',
      shadow: 'rgba(0, 0, 0, 0.2)',
      particle: '#ba68c8',
    },
    
    typography: {
      fontDisplay: 'Playfair Display, serif',
      fontBody: 'Merriweather, serif',
      fontUI: 'Roboto, sans-serif',
      scaleFactor: 0.95,
      letterSpacing: 'normal',
    },
    
    animations: {
      speed: 0.8,
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
      entranceStyle: 'slide',
      hoverScale: 1.02,
      clickScale: 0.98,
    },
    
    effects: {
      blur: 5,
      glow: 0.3,
      shadows: 'soft',
      glassmorphism: false,
      noise: 0,
      vignette: 0,
    },
    
    layout: {
      borderRadius: 8,
      spacing: 1.1,
      density: 'comfortable',
    },
    
    sounds: {
      enabled: true,
      volume: 0.2,
      style: 'gentle',
    },
  },
  
  // ========== BADASS DARK THEME (3-day reading streak) ==========
  shadowMaster: {
    id: 'shadow-master',
    name: 'Shadow Master',
    description: 'Embrace the darkness within',
    unlockRequirement: '3-day reading streak',
    source: 'achievement',
    rarity: 'rare',
    
    colors: {
      background: '#000000',
      backgroundGradient: 'radial-gradient(circle at 25% 25%, #1a0033 0%, #000000 50%, #0d0015 100%)',
      surface: 'rgba(0, 0, 0, 0.9)',
      surfaceGradient: 'linear-gradient(135deg, rgba(25, 0, 50, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)',
      
      textPrimary: '#ff6b6b',
      textSecondary: '#b4a7d6',
      textAccent: '#ffd700',
      
      primary: '#8b0000',
      secondary: '#4b0082',
      accent: '#ff4444',
      warning: '#ff0000',
      success: '#00ff00',
      
      glow: 'rgba(255, 68, 68, 0.8)',
      shadow: 'rgba(0, 0, 0, 1)',
      particle: '#ff0000',
      
      frameCopper: '#ff6b35',
      frameSilver: '#e8e8e8',
      frameGold: '#ffaa00',
      framePlatinum: '#ffffff',
      frameDiamond: '#ff00ff',
    },
    
    typography: {
      fontDisplay: 'Creepster, cursive',
      fontBody: 'Griffy, serif',
      fontUI: 'Barlow, sans-serif',
      scaleFactor: 1.1,
      letterSpacing: 'wide',
    },
    
    animations: {
      speed: 0.6,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      entranceStyle: 'slam',
      hoverScale: 1.08,
      clickScale: 0.92,
    },
    
    effects: {
      blur: 0,
      glow: 0.9,
      shadows: 'hard',
      glassmorphism: false,
      noise: 0.05,
      vignette: 0.8,
    },
    
    layout: {
      borderRadius: 0,
      spacing: 0.9,
      density: 'compact',
    },
    
    sounds: {
      enabled: true,
      volume: 0.5,
      style: 'dark',
    },
    
    particles: {
      enabled: true,
      type: 'embers',
      count: 30,
      color: '#ff4444',
      speed: 0.5,
    },
  },
  
  // ========== FEMININE DARK FAE THEME (7-day journal streak) ==========
  darkFae: {
    id: 'dark-fae',
    name: 'Court of Thorns',
    description: 'Feminine power meets dark enchantment',
    unlockRequirement: '7-day journaling streak',
    source: 'achievement',
    rarity: 'epic',
    
    colors: {
      background: '#0a0514',
      backgroundGradient: `
        radial-gradient(circle at 20% 80%, rgba(139, 69, 139, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(75, 0, 130, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(186, 85, 211, 0.1) 0%, transparent 70%),
        linear-gradient(180deg, #0a0514 0%, #1a0033 100%)
      `,
      surface: 'rgba(139, 69, 139, 0.1)',
      surfaceGradient: `
        linear-gradient(135deg, 
          rgba(186, 85, 211, 0.2) 0%, 
          rgba(139, 69, 139, 0.1) 50%,
          rgba(75, 0, 130, 0.2) 100%)
      `,
      
      textPrimary: '#dda0dd',
      textSecondary: '#da70d6',
      textAccent: '#ff69b4',
      
      primary: '#8b008b',
      secondary: '#9932cc',
      accent: '#ff1493',
      warning: '#ff69b4',
      success: '#98fb98',
      
      glow: 'rgba(218, 112, 214, 0.6)',
      shadow: 'rgba(139, 0, 139, 0.5)',
      particle: '#ff69b4',
    },
    
    typography: {
      fontDisplay: 'Dancing Script, cursive',
      fontBody: 'Crimson Text, serif',
      fontUI: 'Quicksand, sans-serif',
      scaleFactor: 1,
      letterSpacing: 'elegant',
    },
    
    animations: {
      speed: 1.2,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      entranceStyle: 'flutter',
      hoverScale: 1.03,
      clickScale: 0.97,
    },
    
    effects: {
      blur: 15,
      glow: 0.7,
      shadows: 'soft',
      glassmorphism: true,
      noise: 0.01,
      vignette: 0.3,
    },
    
    layout: {
      borderRadius: 20,
      spacing: 1.2,
      density: 'spacious',
    },
    
    sounds: {
      enabled: true,
      volume: 0.4,
      style: 'ethereal',
    },
    
    particles: {
      enabled: true,
      type: 'petals',
      count: 15,
      color: '#ff69b4',
      speed: 0.3,
      custom: {
        shape: '🌸',
        rotation: true,
        fadeIn: true,
      },
    },
    
    shaders: {
      enabled: true,
      type: 'iridescent',
      intensity: 0.3,
    },
  },
  
  // ========== 3D ARTIFACT THEME (First artifact major arcana) ==========
  artifactRealm: {
    id: 'artifact-realm',
    name: 'Artifact Realm',
    description: 'Reality bends around legendary power',
    unlockRequirement: 'Unlock first artifact-grade Major Arcana',
    source: 'achievement',
    rarity: 'legendary',
    
    colors: {
      background: '#000428',
      backgroundGradient: `
        conic-gradient(from 180deg at 50% 50%, 
          #000428 0deg, 
          #004e92 60deg, 
          #009ffd 120deg, 
          #ffa400 180deg, 
          #ffaa00 240deg, 
          #ff0000 300deg, 
          #000428 360deg)
      `,
      surface: 'rgba(0, 4, 40, 0.6)',
      surfaceGradient: `
        linear-gradient(135deg, 
          rgba(0, 159, 253, 0.2) 0%, 
          rgba(0, 4, 40, 0.8) 50%,
          rgba(255, 164, 0, 0.2) 100%)
      `,
      
      textPrimary: '#ffffff',
      textSecondary: '#ffd700',
      textAccent: '#00ffff',
      
      primary: '#009ffd',
      secondary: '#ffa400',
      accent: '#ff00ff',
      warning: '#ff0000',
      success: '#00ff00',
      
      glow: 'rgba(0, 159, 253, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.9)',
      particle: '#ffd700',
      
      frameCopper: '#ff8c00',
      frameSilver: '#ffffff',
      frameGold: '#ffd700',
      framePlatinum: '#e5e4e2',
      frameDiamond: 'linear-gradient(45deg, #ff00ff, #00ffff, #ffff00)',
    },
    
    typography: {
      fontDisplay: 'Orbitron, sans-serif',
      fontBody: 'Exo 2, sans-serif',
      fontUI: 'Rajdhani, sans-serif',
      scaleFactor: 1.15,
      letterSpacing: 'futuristic',
    },
    
    animations: {
      speed: 0.4,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      entranceStyle: 'warp',
      hoverScale: 1.1,
      clickScale: 0.9,
    },
    
    effects: {
      blur: 20,
      glow: 1,
      shadows: 'dramatic',
      glassmorphism: true,
      noise: 0.03,
      vignette: 0.6,
    },
    
    layout: {
      borderRadius: 4,
      spacing: 1,
      density: 'comfortable',
      perspective: 1000,
    },
    
    sounds: {
      enabled: true,
      volume: 0.6,
      style: 'epic',
    },
    
    particles: {
      enabled: true,
      type: 'constellation',
      count: 50,
      color: '#ffd700',
      speed: 0.8,
      connections: true,
      custom: {
        lineColor: 'rgba(255, 215, 0, 0.2)',
        pulseOnInteraction: true,
        3d: true,
      },
    },
    
    shaders: {
      enabled: true,
      type: 'chromatic-aberration',
      intensity: 0.5,
      animatedWarp: true,
    },
    
    transforms3D: {
      enabled: true,
      cardTilt: 15,
      cardFloat: true,
      parallaxLayers: 5,
      depthBlur: true,
      interactions: {
        mouseTilt: true,
        gyroscope: true,
        scrollParallax: true,
      },
    },
  },
};

// ============= THEME CONTEXT & PROVIDER =============
interface ThemeContextType {
  currentTheme: VeilPathTheme;
  setTheme: (themeId: string) => void;
  unlockedThemes: string[];
  purchasedThemes: string[];
  previewTheme: (themeId: string) => void;
  stopPreview: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const VeilPathThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState('default-dark');
  const [unlockedThemes, setUnlockedThemes] = useState(['default-dark', 'default-light']);
  const [purchasedThemes, setPurchasedThemes] = useState<string[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previousThemeId, setPreviousThemeId] = useState<string | null>(null);
  
  const currentTheme = VEILPATH_THEMES[currentThemeId];
  
  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Colors
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Typography
    root.style.setProperty('--font-display', currentTheme.typography.fontDisplay);
    root.style.setProperty('--font-body', currentTheme.typography.fontBody);
    root.style.setProperty('--font-ui', currentTheme.typography.fontUI);
    
    // Effects
    root.style.setProperty('--blur-amount', `${currentTheme.effects.blur}px`);
    root.style.setProperty('--glow-intensity', currentTheme.effects.glow.toString());
    root.style.setProperty('--vignette-opacity', currentTheme.effects.vignette.toString());
    
    // Layout
    root.style.setProperty('--border-radius', `${currentTheme.layout.borderRadius}px`);
    root.style.setProperty('--spacing-multiplier', currentTheme.layout.spacing.toString());
    
    // Add theme class to body
    document.body.className = `theme-${currentThemeId}`;
    
    // Initialize particles if enabled
    if (currentTheme.particles?.enabled) {
      initializeParticles(currentTheme.particles);
    }
    
    // Initialize 3D transforms if enabled
    if (currentTheme.transforms3D?.enabled) {
      initialize3DEffects(currentTheme.transforms3D);
    }
    
  }, [currentTheme]);
  
  const setTheme = (themeId: string) => {
    if (unlockedThemes.includes(themeId) || purchasedThemes.includes(themeId)) {
      setCurrentThemeId(themeId);
      localStorage.setItem('veilpath-theme', themeId);
    }
  };
  
  const previewTheme = (themeId: string) => {
    if (!isPreviewing) {
      setPreviousThemeId(currentThemeId);
      setIsPreviewing(true);
      setCurrentThemeId(themeId);
      
      // Auto-stop preview after 30 seconds
      setTimeout(() => {
        stopPreview();
      }, 30000);
    }
  };
  
  const stopPreview = () => {
    if (isPreviewing && previousThemeId) {
      setCurrentThemeId(previousThemeId);
      setIsPreviewing(false);
      setPreviousThemeId(null);
    }
  };
  
  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme,
      unlockedThemes,
      purchasedThemes,
      previewTheme,
      stopPreview,
    }}>
      {children}
      {currentTheme.particles?.enabled && <ParticleLayer config={currentTheme.particles} />}
      {currentTheme.shaders?.enabled && <ShaderLayer config={currentTheme.shaders} />}
    </ThemeContext.Provider>
  );
};

// ============= THEME SELECTOR COMPONENT =============
export const ThemeSelector: React.FC = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeSelector must be used within VeilPathThemeProvider');
  
  const { currentTheme, setTheme, unlockedThemes, purchasedThemes, previewTheme } = context;
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="theme-selector">
      <button 
        className="theme-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: currentTheme.colors.surfaceGradient,
          color: currentTheme.colors.textPrimary,
          borderRadius: currentTheme.layout.borderRadius,
        }}
      >
        <span className="theme-icon">🎨</span>
        <span className="theme-name">{currentTheme.name}</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="theme-dropdown"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: currentTheme.colors.surface,
              borderRadius: currentTheme.layout.borderRadius,
            }}
          >
            {Object.values(VEILPATH_THEMES).map(theme => {
              const isUnlocked = unlockedThemes.includes(theme.id);
              const isPurchased = purchasedThemes.includes(theme.id);
              const canUse = isUnlocked || isPurchased;
              
              return (
                <div 
                  key={theme.id}
                  className={`theme-option ${!canUse ? 'locked' : ''} ${currentTheme.id === theme.id ? 'active' : ''}`}
                  onClick={() => canUse ? setTheme(theme.id) : previewTheme(theme.id)}
                >
                  <div className="theme-preview" style={{
                    background: theme.colors.backgroundGradient,
                    borderRadius: theme.layout.borderRadius / 2,
                  }} />
                  <div className="theme-info">
                    <h4>{theme.name}</h4>
                    <p>{theme.description}</p>
                    {!canUse && (
                      <span className="unlock-hint">
                        {theme.source === 'achievement' 
                          ? `🔒 ${theme.unlockRequirement}`
                          : `💎 Purchase for $4.99`
                        }
                      </span>
                    )}
                  </div>
                  {theme.rarity !== 'common' && (
                    <span className={`rarity-badge ${theme.rarity}`}>
                      {theme.rarity.toUpperCase()}
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============= PARTICLE SYSTEM COMPONENT =============
const ParticleLayer: React.FC<{ config: any }> = ({ config }) => {
  useEffect(() => {
    // Initialize particle system based on config
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    document.body.appendChild(canvas);
    
    // Particle animation logic here...
    
    return () => {
      canvas.remove();
    };
  }, [config]);
  
  return null;
};

// ============= SHADER EFFECTS COMPONENT =============
const ShaderLayer: React.FC<{ config: any }> = ({ config }) => {
  return (
    <div 
      className="shader-layer"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: config.type === 'iridescent' ? 'overlay' : 'normal',
        opacity: config.intensity,
      }}
    />
  );
};

// ============= HELPER FUNCTIONS =============
const initializeParticles = (particleConfig: any) => {
  console.log('Initializing particles:', particleConfig);
  // Actual particle system implementation
};

const initialize3DEffects = (transforms3D: any) => {
  console.log('Initializing 3D effects:', transforms3D);
  // 3D transform implementation
};

// ============= CSS FOR THEMES =============
export const themeStyles = `
/* Base theme transitions */
* {
  transition: 
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

/* Shadow Master theme specific */
.theme-shadow-master {
  font-weight: bold;
}

.theme-shadow-master .card {
  border: 2px solid var(--theme-accent);
}

.theme-shadow-master .button:hover {
  box-shadow: 0 0 30px var(--theme-glow);
  transform: scale(1.1);
}

/* Dark Fae theme specific */
.theme-dark-fae {
  position: relative;
}

.theme-dark-fae::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg>...</svg>');
  opacity: 0.05;
  pointer-events: none;
}

.theme-dark-fae .card {
  backdrop-filter: blur(10px);
  background: linear-gradient(135deg, 
    rgba(186, 85, 211, 0.1) 0%, 
    rgba(139, 69, 139, 0.05) 100%);
}

/* Artifact Realm theme specific */
.theme-artifact-realm {
  perspective: 1000px;
}

.theme-artifact-realm .card {
  transform-style: preserve-3d;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotateX(0) rotateY(0); }
  25% { transform: translateY(-10px) rotateX(2deg) rotateY(2deg); }
  50% { transform: translateY(0) rotateX(0) rotateY(0); }
  75% { transform: translateY(-5px) rotateX(-2deg) rotateY(-2deg); }
}

.theme-artifact-realm .major-arcana {
  box-shadow: 
    0 0 50px var(--theme-glow),
    0 0 100px var(--theme-particle),
    inset 0 0 50px rgba(0, 159, 253, 0.2);
}

/* Theme selector styles */
.theme-selector {
  position: relative;
}

.theme-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.theme-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 300px;
  margin-top: 10px;
  padding: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  margin: 5px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-option:hover {
  transform: translateX(5px);
}

.theme-option.locked {
  opacity: 0.6;
}

.theme-option.active {
  border: 2px solid var(--theme-accent);
}

.theme-preview {
  width: 50px;
  height: 50px;
  border-radius: 8px;
}

.rarity-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.rarity-badge.rare { background: #0070dd; }
.rarity-badge.epic { background: #a335ee; }
.rarity-badge.legendary { background: #ff8000; }
.rarity-badge.mythic { background: #ff00ff; }
`;

export default {
  VEILPATH_THEMES,
  VeilPathThemeProvider,
  ThemeSelector,
  themeStyles
};