/**
 * VeilPath Tarot - Curated Asset Manifest
 * Provides paths to existing assets with fallbacks
 */

// Card back - exists in cardback/
const CARD_BACK = require('../../assets/art/cardback/card_back.png');

// Background - use existing cosmic background
const COSMIC_BG = require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__6452324a-78d8-48ee-9228-85601e1010ef_0.png');

export const ASSETS = {
  backgrounds: {
    dialog_luna: { path: COSMIC_BG },
    cosmic_0: { path: COSMIC_BG },
    cosmic_1: { path: require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__6452324a-78d8-48ee-9228-85601e1010ef_2.png') },
    cosmic_2: { path: require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__6452324a-78d8-48ee-9228-85601e1010ef_3.png') },
    auth_cosmic: { path: require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__786aa9ce-8a40-4bc2-9cdd-38d228b0c091_0.png') },
  },
  frames: {
    dialogBox: { path: null }, // No frame asset - components should handle null
    card: { path: null },
    ornate: { path: null },
  },
  buttons: {
    // Using null - AssetButton.js handles this with CSS fallbacks
  },
  cards: {
    back: { path: CARD_BACK },
  },
  icons: {
    // Using null - icons handled with emoji fallbacks
  },
  effects: {
    particles: { path: null }, // Components should handle null gracefully
    holoAura: { path: null },
    sparkles: { path: null },
  },
  decorative: {
    hoodedMage: { path: null }, // Components should handle null gracefully
    mysticOrb: { path: null },
    cosmicSwirl: { path: null },
  },
  animated: {
    // Video assets not currently available
  },
};

export const SCREEN_ASSETS = {
  MainMenu: {
    background: ASSETS.backgrounds.cosmic_0,
  },
  CardReading: {
    background: ASSETS.backgrounds.cosmic_1,
    cardBack: ASSETS.cards.back,
  },
  Profile: {
    background: ASSETS.backgrounds.cosmic_2,
  },
  WeeklyChallenge: {
    background: ASSETS.backgrounds.cosmic_0,
  },
  LevelUp: {
    background: ASSETS.backgrounds.cosmic_1,
  },
  AchievementUnlock: {
    background: ASSETS.backgrounds.auth_cosmic,
  },
};

export default ASSETS;
