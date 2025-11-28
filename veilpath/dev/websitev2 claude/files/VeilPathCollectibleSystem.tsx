import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// VEILPATH COMPLETE COLLECTIBLE SYSTEM
// Card Backs + Front Frames + Achievement System

interface CollectibleCard {
  // The base tarot card (always 78 total)
  cardId: string; // 'the-fool', 'three-of-cups', etc
  
  // FRONT: The artwork variant currently equipped
  artworkVariant: {
    id: string;
    source: 'base' | 'pack' | 'achievement' | 'event' | 'crafted';
    file: string; // .png for minor, .mp4 for major arcana
    artist: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  };
  
  // FRONT: The frame overlay (minimalist to show art)
  frontFrame: {
    tier: 'none' | 'copper' | 'silver' | 'gold' | 'platinum' | 'diamond';
    effects: FrameEffects;
    source: 'achievement' | 'purchase' | 'event' | 'crafted';
  };
  
  // BACK: The card back design
  cardBack: {
    id: string;
    name: string;
    source: 'default' | 'achievement' | 'season' | 'purchase' | 'event';
    animated: boolean;
    file: string;
  };
}

interface FrameEffects {
  baseStyle: 'minimal' | 'ornate' | 'mystical' | 'seasonal';
  material: {
    copper: { color: '#b87333', shine: 'matte' };
    silver: { color: '#c0c0c0', shine: 'metallic' };
    gold: { color: '#ffd700', shine: 'lustrous', leafPattern: true };
    platinum: { color: '#e5e4e2', shine: 'mirror', filigree: true };
    diamond: { color: '#b9f2ff', shine: 'prismatic', gems: GemInlay[] };
  };
}

interface GemInlay {
  position: 'top' | 'bottom' | 'corners' | 'cardinal';
  gem: 'amethyst' | 'moonstone' | 'obsidian' | 'rose_quartz' | 'citrine';
  glow: boolean;
}

// ============= CARD DISPLAY COMPONENT =============
const VeilPathCard: React.FC<{ card: CollectibleCard; showBack?: boolean }> = ({ card, showBack = false }) => {
  const [isFlipped, setIsFlipped] = useState(showBack);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  
  const isMajorArcana = !card.cardId.includes('-of-');
  
  return (
    <motion.div
      className="veilpath-card"
      style={{ 
        width: '250px', 
        height: '400px',
        transformStyle: 'preserve-3d',
        position: 'relative'
      }}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      onClick={() => setIsFlipped(!isFlipped)}
      whileHover={{ scale: 1.05, y: -10 }}
    >
      {/* CARD FRONT */}
      <div 
        className="card-face card-front"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {/* The Artwork (png or mp4) */}
        <div className="artwork-container" style={{ position: 'absolute', inset: 0 }}>
          {isMajorArcana && card.artworkVariant.file.endsWith('.mp4') ? (
            <video
              src={card.artworkVariant.file}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onLoadedData={() => setIsVideoLoaded(true)}
            />
          ) : (
            <img
              src={card.artworkVariant.file}
              alt={card.cardId}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
        
        {/* The Front Frame Overlay (Minimalist) */}
        <CardFrame frame={card.frontFrame} />
        
        {/* Rarity Gem (subtle, in corner) */}
        <div className="rarity-indicator" style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          width: '20px',
          height: '20px'
        }}>
          <RarityGem rarity={card.artworkVariant.rarity} />
        </div>
      </div>
      
      {/* CARD BACK */}
      <div 
        className="card-face card-back"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <CardBackDesign design={card.cardBack} />
      </div>
    </motion.div>
  );
};

// ============= FRONT FRAME COMPONENT (Minimalist) =============
const CardFrame: React.FC<{ frame: any }> = ({ frame }) => {
  if (frame.tier === 'none') return null;
  
  const getFrameStyle = () => {
    const materials = {
      copper: {
        border: '2px solid #b87333',
        boxShadow: 'inset 0 0 10px rgba(184, 115, 51, 0.3)',
        background: 'linear-gradient(90deg, transparent 2px, rgba(184, 115, 51, 0.05) 2px, rgba(184, 115, 51, 0.05) 4px, transparent 4px)'
      },
      silver: {
        border: '2px solid #c0c0c0',
        boxShadow: 'inset 0 0 15px rgba(192, 192, 192, 0.4)',
        background: 'linear-gradient(90deg, transparent 2px, rgba(192, 192, 192, 0.08) 2px, rgba(192, 192, 192, 0.08) 4px, transparent 4px)'
      },
      gold: {
        border: '2px solid #ffd700',
        boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.4), 0 0 30px rgba(255, 215, 0, 0.2)',
        background: `
          linear-gradient(90deg, transparent 2px, rgba(255, 215, 0, 0.1) 2px, rgba(255, 215, 0, 0.1) 4px, transparent 4px),
          repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 215, 0, 0.05) 10px, rgba(255, 215, 0, 0.05) 20px)
        `,
        animation: 'gold-shimmer 3s ease-in-out infinite'
      },
      platinum: {
        border: '2px solid #e5e4e2',
        boxShadow: 'inset 0 0 25px rgba(229, 228, 226, 0.5), 0 0 40px rgba(229, 228, 226, 0.3)',
        background: `
          linear-gradient(90deg, transparent 2px, rgba(229, 228, 226, 0.15) 2px, rgba(229, 228, 226, 0.15) 4px, transparent 4px),
          repeating-conic-gradient(from 45deg at 10% 10%, transparent 0deg, rgba(229, 228, 226, 0.1) 90deg, transparent 180deg)
        `,
        animation: 'platinum-shine 4s linear infinite'
      },
      diamond: {
        border: '2px solid transparent',
        borderImage: 'linear-gradient(45deg, #b9f2ff, #ffffff, #b9f2ff) 1',
        boxShadow: `
          inset 0 0 30px rgba(185, 242, 255, 0.6),
          0 0 50px rgba(185, 242, 255, 0.4),
          0 0 100px rgba(185, 242, 255, 0.2)
        `,
        animation: 'diamond-prismatic 2s linear infinite',
        position: 'relative'
      }
    };
    
    return materials[frame.tier] || {};
  };
  
  const frameStyle = getFrameStyle();
  
  return (
    <>
      {/* Main frame border - MINIMALIST */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        borderRadius: '12px',
        ...frameStyle
      }}>
        {/* Corner accents only for gold+ */}
        {['gold', 'platinum', 'diamond'].includes(frame.tier) && (
          <>
            <div className="frame-corner top-left" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '20px',
              height: '20px',
              borderTop: `2px solid ${getFrameColor(frame.tier)}`,
              borderLeft: `2px solid ${getFrameColor(frame.tier)}`,
              borderTopLeftRadius: '12px'
            }} />
            <div className="frame-corner top-right" style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '20px',
              height: '20px',
              borderTop: `2px solid ${getFrameColor(frame.tier)}`,
              borderRight: `2px solid ${getFrameColor(frame.tier)}`,
              borderTopRightRadius: '12px'
            }} />
            <div className="frame-corner bottom-left" style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '20px',
              height: '20px',
              borderBottom: `2px solid ${getFrameColor(frame.tier)}`,
              borderLeft: `2px solid ${getFrameColor(frame.tier)}`,
              borderBottomLeftRadius: '12px'
            }} />
            <div className="frame-corner bottom-right" style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              borderBottom: `2px solid ${getFrameColor(frame.tier)}`,
              borderRight: `2px solid ${getFrameColor(frame.tier)}`,
              borderBottomRightRadius: '12px'
            }} />
          </>
        )}
        
        {/* Gem inlays for diamond tier */}
        {frame.tier === 'diamond' && frame.effects?.material?.diamond?.gems && (
          <GemInlays gems={frame.effects.material.diamond.gems} />
        )}
      </div>
    </>
  );
};

// ============= CARD BACK DESIGNS =============
const CardBackDesign: React.FC<{ design: any }> = ({ design }) => {
  // Different mystical patterns for card backs
  const backDesigns = {
    default: {
      background: 'radial-gradient(circle at center, #4a148c 0%, #0a0514 100%)',
      pattern: 'pentagram'
    },
    moonPhases: {
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      pattern: 'moon-cycle',
      animated: true
    },
    crystalGrid: {
      background: 'conic-gradient(from 45deg, #f8bbd0, #e1bee7, #ce93d8, #ba68c8, #f8bbd0)',
      pattern: 'sacred-geometry',
      animated: true
    },
    witchingHour: {
      background: 'radial-gradient(circle at 30% 30%, #ffa726 0%, #ff6b6b 25%, #4a148c 50%, #0a0514 100%)',
      pattern: 'clock-stars',
      animated: true
    },
    seasonalSamhain: {
      background: 'linear-gradient(135deg, #ff6b35 0%, #8b0000 50%, #1a0000 100%)',
      pattern: 'autumn-leaves',
      animated: true,
      particles: true
    }
  };
  
  const currentDesign = backDesigns[design.id] || backDesigns.default;
  
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: currentDesign.background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Center logo/pattern */}
      <div style={{
        width: '60%',
        height: '60%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CardBackPattern pattern={currentDesign.pattern} animated={currentDesign.animated} />
      </div>
      
      {/* Ornate border */}
      <div style={{
        position: 'absolute',
        inset: '10px',
        border: '2px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '10px',
        pointerEvents: 'none'
      }} />
      
      {/* Inner border */}
      <div style={{
        position: 'absolute',
        inset: '20px',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '8px',
        pointerEvents: 'none'
      }} />
    </div>
  );
};

// ============= ACHIEVEMENT UNLOCK SYSTEM =============
interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'wellness' | 'collection' | 'social' | 'seasonal' | 'mastery';
  reward: {
    type: 'frame' | 'cardback' | 'artwork' | 'title' | 'effect';
    item: any;
  };
  progress: {
    current: number;
    required: number;
    unit: string;
  };
  unlocked: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

const ACHIEVEMENTS: Achievement[] = [
  // WELLNESS ACHIEVEMENTS (Unlock Frames)
  {
    id: 'seven-day-streak',
    name: 'Week Seeker',
    description: 'Journal for 7 consecutive days',
    category: 'wellness',
    reward: { type: 'frame', item: { tier: 'copper' } },
    progress: { current: 5, required: 7, unit: 'days' },
    unlocked: false,
    tier: 'bronze'
  },
  {
    id: 'lunar-month',
    name: 'Moon Dancer',
    description: 'Track a complete lunar cycle (28 days)',
    category: 'wellness',
    reward: { type: 'frame', item: { tier: 'silver' } },
    progress: { current: 15, required: 28, unit: 'days' },
    unlocked: false,
    tier: 'silver'
  },
  {
    id: 'hundred-day-streak',
    name: 'Century Oracle',
    description: 'Maintain a 100-day journaling streak',
    category: 'wellness',
    reward: { type: 'frame', item: { tier: 'gold' } },
    progress: { current: 47, required: 100, unit: 'days' },
    unlocked: false,
    tier: 'gold'
  },
  {
    id: 'full-year',
    name: 'Wheel of the Year',
    description: 'Use VeilPath for all 8 sabbats',
    category: 'seasonal',
    reward: { type: 'frame', item: { tier: 'platinum' } },
    progress: { current: 3, required: 8, unit: 'sabbats' },
    unlocked: false,
    tier: 'platinum'
  },
  {
    id: 'thousand-readings',
    name: 'Mystic Master',
    description: 'Complete 1,000 card readings',
    category: 'mastery',
    reward: { type: 'frame', item: { tier: 'diamond', effects: { gems: true } } },
    progress: { current: 247, required: 1000, unit: 'readings' },
    unlocked: false,
    tier: 'diamond'
  },
  
  // COLLECTION ACHIEVEMENTS (Unlock Card Backs)
  {
    id: 'first-pack',
    name: 'Baby Witch',
    description: 'Open your first card pack',
    category: 'collection',
    reward: { type: 'cardback', item: { id: 'starryNight', name: 'Starry Veil' } },
    progress: { current: 0, required: 1, unit: 'packs' },
    unlocked: false,
    tier: 'bronze'
  },
  {
    id: 'complete-suit',
    name: 'Suit Master',
    description: 'Collect all artwork variants for one suit',
    category: 'collection',
    reward: { type: 'cardback', item: { id: 'elementalBalance', name: 'Four Elements' } },
    progress: { current: 8, required: 14, unit: 'cards' },
    unlocked: false,
    tier: 'silver'
  },
  {
    id: 'major-arcana-collector',
    name: 'Keeper of Secrets',
    description: 'Collect all Major Arcana in any art style',
    category: 'collection',
    reward: { type: 'cardback', item: { id: 'cosmicGate', name: 'Portal to Mystery', animated: true } },
    progress: { current: 18, required: 22, unit: 'cards' },
    unlocked: false,
    tier: 'gold'
  },
  
  // SOCIAL ACHIEVEMENTS (Unlock Special Variants)
  {
    id: 'helpful-oracle',
    name: 'Beloved Oracle',
    description: 'Give 50 readings rated helpful by friends',
    category: 'social',
    reward: { type: 'artwork', item: { variant: 'community-oracle', rarity: 'epic' } },
    progress: { current: 23, required: 50, unit: 'readings' },
    unlocked: false,
    tier: 'silver'
  },
  {
    id: 'coven-champion',
    name: 'Coven Champion',
    description: 'Win 10 weekly coven challenges',
    category: 'social',
    reward: { type: 'effect', item: { aura: 'champion-glow', color: 'gold' } },
    progress: { current: 3, required: 10, unit: 'wins' },
    unlocked: false,
    tier: 'gold'
  }
];

// ============= ACHIEVEMENT TRACKER COMPONENT =============
const AchievementTracker: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  
  const categories = ['all', 'wellness', 'collection', 'social', 'seasonal', 'mastery'];
  
  const filteredAchievements = ACHIEVEMENTS.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) return false;
    if (showUnlockedOnly && !achievement.unlocked) return false;
    return true;
  });
  
  return (
    <div className="achievement-tracker" style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #1a0033 0%, #0a0514 100%)',
      borderRadius: '20px',
      color: '#e1bee7'
    }}>
      <h2 style={{
        fontSize: '28px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #ffd700 0%, #ffa726 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Path of Achievements
      </h2>
      
      {/* Category filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 16px',
              background: selectedCategory === cat 
                ? 'linear-gradient(135deg, #ffa726 0%, #ff6b6b 100%)' 
                : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '20px',
              color: 'white',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.3s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      
      {/* Achievement grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {filteredAchievements.map(achievement => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
};

// ============= INDIVIDUAL ACHIEVEMENT CARD =============
const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const progressPercentage = (achievement.progress.current / achievement.progress.required) * 100;
  
  const tierColors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2',
    diamond: '#b9f2ff'
  };
  
  return (
    <motion.div
      className="achievement-card"
      style={{
        background: achievement.unlocked 
          ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 167, 38, 0.2) 100%)'
          : 'rgba(0, 0, 0, 0.3)',
        border: `2px solid ${achievement.unlocked ? tierColors[achievement.tier] : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '15px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Tier badge */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: tierColors[achievement.tier],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        boxShadow: `0 0 20px ${tierColors[achievement.tier]}50`
      }}>
        {getTierIcon(achievement.tier)}
      </div>
      
      {/* Achievement info */}
      <h3 style={{ 
        fontSize: '18px', 
        marginBottom: '5px',
        color: achievement.unlocked ? '#ffd700' : '#e1bee7'
      }}>
        {achievement.name}
      </h3>
      <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '15px' }}>
        {achievement.description}
      </p>
      
      {/* Progress bar */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '10px',
        height: '8px',
        overflow: 'hidden',
        marginBottom: '5px'
      }}>
        <motion.div
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${tierColors[achievement.tier]} 0%, ${tierColors[achievement.tier]}cc 100%)`,
            borderRadius: '10px'
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      
      {/* Progress text */}
      <p style={{ fontSize: '11px', opacity: 0.7 }}>
        {achievement.progress.current}/{achievement.progress.required} {achievement.progress.unit}
      </p>
      
      {/* Reward preview */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        fontSize: '12px'
      }}>
        <span style={{ opacity: 0.7 }}>Reward: </span>
        <span style={{ color: '#ffa726', fontWeight: 'bold' }}>
          {getRewardDescription(achievement.reward)}
        </span>
      </div>
      
      {/* Unlocked overlay */}
      {achievement.unlocked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 0%, rgba(255, 215, 0, 0.1) 100%)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: '48px',
            opacity: 0.3,
            transform: 'rotate(-15deg)'
          }}>
            ✨
          </span>
        </div>
      )}
    </motion.div>
  );
};

// ============= HELPER FUNCTIONS =============
const getFrameColor = (tier: string): string => {
  const colors = {
    copper: '#b87333',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2',
    diamond: '#b9f2ff'
  };
  return colors[tier] || '#ffffff';
};

const getTierIcon = (tier: string): string => {
  const icons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
    diamond: '💠'
  };
  return icons[tier] || '⭐';
};

const getRewardDescription = (reward: any): string => {
  switch (reward.type) {
    case 'frame':
      return `${reward.item.tier.charAt(0).toUpperCase() + reward.item.tier.slice(1)} Card Frame`;
    case 'cardback':
      return `"${reward.item.name}" Card Back`;
    case 'artwork':
      return `${reward.item.rarity.charAt(0).toUpperCase() + reward.item.rarity.slice(1)} Artwork Variant`;
    case 'title':
      return `"${reward.item.title}" Title`;
    case 'effect':
      return `${reward.item.aura} Aura Effect`;
    default:
      return 'Mystery Reward';
  }
};

// ============= RARITY GEM COMPONENT =============
const RarityGem: React.FC<{ rarity: string }> = ({ rarity }) => {
  const gemStyles = {
    common: { color: '#9d9d9d', symbol: '◇' },
    rare: { color: '#0070dd', symbol: '◈' },
    epic: { color: '#a335ee', symbol: '◆' },
    legendary: { color: '#ff8000', symbol: '⬟' },
    mythic: { color: '#ffd700', symbol: '⬢' }
  };
  
  const style = gemStyles[rarity] || gemStyles.common;
  
  return (
    <div style={{
      color: style.color,
      fontSize: '20px',
      filter: `drop-shadow(0 0 5px ${style.color})`,
      animation: rarity === 'mythic' || rarity === 'legendary' ? 'gem-glow 2s ease-in-out infinite' : 'none'
    }}>
      {style.symbol}
    </div>
  );
};

// ============= GEM INLAY COMPONENT (For Diamond Frames) =============
const GemInlays: React.FC<{ gems: GemInlay[] }> = ({ gems }) => {
  const gemColors = {
    amethyst: '#9b59b6',
    moonstone: '#b4c7dc',
    obsidian: '#1a1a1a',
    rose_quartz: '#ffb3ba',
    citrine: '#f1c40f'
  };
  
  return (
    <>
      {gems.map((gem, index) => {
        const positions = {
          top: { top: '-5px', left: '50%', transform: 'translateX(-50%)' },
          bottom: { bottom: '-5px', left: '50%', transform: 'translateX(-50%)' },
          corners: [
            { top: '-5px', left: '-5px' },
            { top: '-5px', right: '-5px' },
            { bottom: '-5px', left: '-5px' },
            { bottom: '-5px', right: '-5px' }
          ]
        };
        
        const position = gem.position === 'corners' 
          ? positions.corners[index % 4] 
          : positions[gem.position];
        
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              ...position,
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${gemColors[gem.gem]} 0%, ${gemColors[gem.gem]}aa 50%, transparent 100%)`,
              boxShadow: gem.glow ? `0 0 15px ${gemColors[gem.gem]}` : 'none',
              animation: gem.glow ? 'gem-pulse 3s ease-in-out infinite' : 'none'
            }}
          />
        );
      })}
    </>
  );
};

// ============= CSS ANIMATIONS (Add to stylesheet) =============
const animations = `
@keyframes gold-shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; filter: brightness(1.2); }
}

@keyframes platinum-shine {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes diamond-prismatic {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

@keyframes gem-glow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

@keyframes gem-pulse {
  0%, 100% { box-shadow: 0 0 15px currentColor; }
  50% { box-shadow: 0 0 30px currentColor; }
}
`;

// Export everything
export {
  VeilPathCard,
  AchievementTracker,
  ACHIEVEMENTS,
  type CollectibleCard,
  type Achievement
};