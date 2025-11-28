-- ============================================================================
-- VISUAL CUSTOMIZATION SYSTEM
-- Migration: 20251127_visual_customization.sql
--
-- Stores user visual presets, layer configurations, and card back pools
-- Supports multi-layer visual system with full granular control
-- ============================================================================

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- User visual presets (up to 10 per user)
CREATE TABLE IF NOT EXISTS user_visual_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  preset_order INT DEFAULT 0,

  -- Foundation layer (required, non-transparent)
  foundation_color_id TEXT NOT NULL DEFAULT 'void_black',
  foundation_custom_hex TEXT, -- For custom colors

  -- Background art layer (optional)
  background_art_id TEXT,
  background_transparency INT DEFAULT 80,
  background_position_x INT DEFAULT 0,
  background_position_y INT DEFAULT 0,
  background_scale DECIMAL(3,2) DEFAULT 1.0,
  background_blur INT DEFAULT 0,

  -- Effect overlay layer (optional)
  effect_overlay_id TEXT,
  effect_transparency INT DEFAULT 70,
  effect_intensity DECIMAL(3,2) DEFAULT 1.0,
  effect_speed DECIMAL(3,2) DEFAULT 1.0,
  effect_tint_color TEXT,

  -- UI theme layer
  ui_theme_id TEXT NOT NULL DEFAULT 'theme_default_dark',
  ui_primary_color TEXT,
  ui_secondary_color TEXT,
  ui_accent_color TEXT,
  ui_button_style TEXT DEFAULT 'gradient',
  ui_border_style TEXT DEFAULT 'subtle',
  ui_transparency INT DEFAULT 90,

  -- Card configuration
  card_primary_deck_id TEXT NOT NULL DEFAULT 'deck_rider_waite',
  card_mixed_decks BOOLEAN DEFAULT false,
  card_deck_pool TEXT[] DEFAULT '{}',
  card_back_mode TEXT NOT NULL DEFAULT 'single', -- single, random, per_suit, per_card
  card_primary_back_id TEXT NOT NULL DEFAULT 'back_default',
  card_back_pool TEXT[] DEFAULT '{}',
  card_back_by_suit JSONB DEFAULT '{}', -- { wands: [], cups: [], etc }
  card_flip_animation_id TEXT DEFAULT 'flip_default',
  card_reveal_effect_id TEXT DEFAULT 'reveal_default',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT check_transparency_bg CHECK (background_transparency >= 0 AND background_transparency <= 100),
  CONSTRAINT check_transparency_effect CHECK (effect_transparency >= 0 AND effect_transparency <= 100),
  CONSTRAINT check_transparency_ui CHECK (ui_transparency >= 0 AND ui_transparency <= 100),
  CONSTRAINT check_scale CHECK (background_scale >= 0.5 AND background_scale <= 2.0),
  CONSTRAINT check_blur CHECK (background_blur >= 0 AND background_blur <= 20),
  CONSTRAINT check_intensity CHECK (effect_intensity >= 0.1 AND effect_intensity <= 2.0),
  CONSTRAINT check_speed CHECK (effect_speed >= 0.5 AND effect_speed <= 2.0)
);

-- Limit to 10 presets per user
CREATE OR REPLACE FUNCTION check_preset_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM user_visual_presets WHERE user_id = NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum of 10 presets allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_preset_limit
  BEFORE INSERT ON user_visual_presets
  FOR EACH ROW
  EXECUTE FUNCTION check_preset_limit();

-- ============================================================================
-- BACKGROUND ART CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS background_art (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  art_type TEXT NOT NULL, -- 'static', 'animated', 'parallax'
  asset_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  aspect_ratio TEXT DEFAULT '16:9',
  rarity TEXT DEFAULT 'common',
  collection_id TEXT,
  event_id TEXT,
  unlock_method TEXT NOT NULL DEFAULT 'free',
  default_transparency INT DEFAULT 80,
  lore TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- ============================================================================
-- EFFECT OVERLAYS CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS effect_overlays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  effect_type TEXT NOT NULL, -- 'particle', 'shader', '3d', 'lottie'
  asset_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  rarity TEXT DEFAULT 'common',
  collection_id TEXT,
  event_id TEXT,
  unlock_method TEXT NOT NULL DEFAULT 'free',
  default_transparency INT DEFAULT 70,
  performance_impact TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- ============================================================================
-- CARD DECKS CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS card_decks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  art_style TEXT NOT NULL, -- 'rider_waite', 'smith_waite', 'midjourney', 'custom'
  card_front_path TEXT NOT NULL,
  format TEXT DEFAULT 'png',
  animated BOOLEAN DEFAULT false,
  rarity TEXT DEFAULT 'common',
  unlock_method TEXT NOT NULL DEFAULT 'free',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- ============================================================================
-- USER UNLOCKED ASSETS
-- ============================================================================

-- Track which background arts user has unlocked
CREATE TABLE IF NOT EXISTS user_background_art (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  background_art_id TEXT NOT NULL REFERENCES background_art(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_method TEXT, -- How they got it
  UNIQUE(user_id, background_art_id)
);

-- Track which effects user has unlocked
CREATE TABLE IF NOT EXISTS user_effect_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  effect_overlay_id TEXT NOT NULL REFERENCES effect_overlays(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_method TEXT,
  UNIQUE(user_id, effect_overlay_id)
);

-- Track which decks user has unlocked
CREATE TABLE IF NOT EXISTS user_card_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  deck_id TEXT NOT NULL REFERENCES card_decks(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_method TEXT,
  UNIQUE(user_id, deck_id)
);

-- ============================================================================
-- FOUNDATION COLORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS foundation_colors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  category TEXT NOT NULL, -- 'dark', 'light', 'vibrant', 'custom'
  unlock_method TEXT, -- NULL = free
  unlock_requirement TEXT, -- Achievement/collection id if applicable
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_presets_user ON user_visual_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presets_active ON user_visual_presets(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_bg_art_user ON user_background_art(user_id);
CREATE INDEX IF NOT EXISTS idx_user_effects_user ON user_effect_overlays(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_user ON user_card_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_bg_art_unlock ON background_art(unlock_method);
CREATE INDEX IF NOT EXISTS idx_effects_unlock ON effect_overlays(unlock_method);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_visual_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_background_art ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_effect_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_card_decks ENABLE ROW LEVEL SECURITY;

-- Users can manage their own presets
CREATE POLICY "Users can manage own presets"
  ON user_visual_presets FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own background unlocks"
  ON user_background_art FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own effect unlocks"
  ON user_effect_overlays FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own deck unlocks"
  ON user_card_decks FOR SELECT
  USING (auth.uid() = user_id);

-- Public catalogs readable by all authenticated users
ALTER TABLE background_art ENABLE ROW LEVEL SECURITY;
ALTER TABLE effect_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view background catalog"
  ON background_art FOR SELECT USING (true);

CREATE POLICY "Anyone can view effects catalog"
  ON effect_overlays FOR SELECT USING (true);

CREATE POLICY "Anyone can view decks catalog"
  ON card_decks FOR SELECT USING (true);

CREATE POLICY "Anyone can view colors catalog"
  ON foundation_colors FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Set active preset (deactivates others)
CREATE OR REPLACE FUNCTION set_active_preset(
  p_user_id UUID,
  p_preset_id UUID
)
RETURNS void AS $$
BEGIN
  -- Deactivate all presets for user
  UPDATE user_visual_presets
  SET is_active = false
  WHERE user_id = p_user_id;

  -- Activate the specified preset
  UPDATE user_visual_presets
  SET is_active = true, updated_at = NOW()
  WHERE id = p_preset_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Get user's complete visual config (active preset with all unlocked items)
CREATE OR REPLACE FUNCTION get_user_visual_config(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'activePreset', (
      SELECT row_to_json(p.*)
      FROM user_visual_presets p
      WHERE p.user_id = p_user_id AND p.is_active = true
      LIMIT 1
    ),
    'allPresets', (
      SELECT json_agg(row_to_json(p.*))
      FROM user_visual_presets p
      WHERE p.user_id = p_user_id
      ORDER BY p.preset_order
    ),
    'unlockedBackgrounds', (
      SELECT json_agg(bg.background_art_id)
      FROM user_background_art bg
      WHERE bg.user_id = p_user_id
    ),
    'unlockedEffects', (
      SELECT json_agg(e.effect_overlay_id)
      FROM user_effect_overlays e
      WHERE e.user_id = p_user_id
    ),
    'unlockedDecks', (
      SELECT json_agg(d.deck_id)
      FROM user_card_decks d
      WHERE d.user_id = p_user_id
    ),
    'ownedCardBacks', (
      SELECT json_agg(c.cosmetic_id)
      FROM user_purchases up
      JOIN cosmetics c ON up.cosmetic_id = c.id
      WHERE up.user_id = p_user_id AND c.type = 'card_back'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA: Foundation Colors
-- ============================================================================

INSERT INTO foundation_colors (id, name, hex, category, unlock_method) VALUES
-- Dark (Free)
('void_black', 'Void Black', '#000000', 'dark', NULL),
('midnight_blue', 'Midnight Blue', '#0d1b2a', 'dark', NULL),
('deep_purple', 'Deep Purple', '#1a0a2e', 'dark', NULL),
('charcoal', 'Charcoal', '#1a1a1a', 'dark', NULL),
('forest_night', 'Forest Night', '#0a1f0a', 'dark', NULL),
-- Light (Purchase)
('parchment', 'Ancient Parchment', '#f5f0e1', 'light', 'purchase'),
('cream', 'Cream', '#fffdd0', 'light', 'purchase'),
('soft_lavender', 'Soft Lavender', '#e6e6fa', 'light', 'purchase'),
-- Vibrant (Premium/Collection)
('blood_red', 'Blood Moon', '#4a0000', 'vibrant', 'purchase'),
('ocean_depth', 'Ocean Depth', '#001133', 'vibrant', 'purchase'),
('cosmic_purple', 'Cosmic Purple', '#2a0a4a', 'vibrant', 'purchase'),
('ember_glow', 'Ember Glow', '#1a0500', 'vibrant', 'collection')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DATA: Background Art
-- ============================================================================

INSERT INTO background_art (id, name, art_type, asset_path, thumbnail_path, rarity, unlock_method, default_transparency, lore) VALUES
-- Free defaults
('bg_cosmic_swirl', 'Cosmic Swirl', 'animated', '/assets/backgrounds/cosmic_swirl.mp4', '/assets/backgrounds/thumbs/cosmic_swirl.jpg', 'common', 'free', 80, 'A gift to all who walk the Veil Path.'),
('bg_starfield', 'Starfield', 'animated', '/assets/backgrounds/starfield.mp4', '/assets/backgrounds/thumbs/starfield.jpg', 'common', 'free', 85, NULL),
('bg_mystical_fog', 'Mystical Fog', 'animated', '/assets/backgrounds/mystical_fog.mp4', '/assets/backgrounds/thumbs/mystical_fog.jpg', 'uncommon', 'free', 70, NULL),
-- Beta exclusive
('bg_beta_nebula', 'Beta Nebula', 'animated', '/assets/backgrounds/beta_nebula.mp4', '/assets/backgrounds/thumbs/beta_nebula.jpg', 'epic', 'achievement', 75, 'Awarded to beta testers. There will never be more.'),
-- Collection themed
('bg_celestial_fire', 'Celestial Fire Sky', 'animated', '/assets/backgrounds/celestial_fire_sky.mp4', '/assets/backgrounds/thumbs/celestial_fire_sky.jpg', 'rare', 'purchase', 75, NULL),
('bg_abyssal_depths', 'Abyssal Depths', 'animated', '/assets/backgrounds/abyssal_depths.mp4', '/assets/backgrounds/thumbs/abyssal_depths.jpg', 'rare', 'purchase', 80, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DATA: Effect Overlays
-- ============================================================================

INSERT INTO effect_overlays (id, name, effect_type, asset_path, thumbnail_path, rarity, unlock_method, default_transparency, performance_impact, description) VALUES
-- Free
('effect_gentle_stars', 'Gentle Stars', 'particle', '/assets/effects/gentle_stars.json', '/assets/effects/thumbs/gentle_stars.jpg', 'common', 'free', 60, 'low', 'Subtle twinkling stars'),
('effect_dust_motes', 'Dust Motes', 'particle', '/assets/effects/dust_motes.json', '/assets/effects/thumbs/dust_motes.jpg', 'common', 'free', 50, 'low', 'Floating particles catching light'),
-- Seasonal
('effect_fireworks_usa', 'Independence Day Fireworks', '3d', '/assets/effects/fireworks_usa.json', '/assets/effects/thumbs/fireworks_usa.jpg', 'epic', 'event', 70, 'high', 'Spectacular 3D fireworks in red, white, and blue'),
('effect_snowfall', 'Gentle Snowfall', 'particle', '/assets/effects/snowfall.json', '/assets/effects/thumbs/snowfall.jpg', 'rare', 'event', 60, 'low', 'Soft snow falling gently'),
('effect_aurora', 'Aurora Borealis', 'shader', '/assets/effects/aurora.glsl', '/assets/effects/thumbs/aurora.jpg', 'epic', 'event', 75, 'medium', 'Northern lights dancing across the sky'),
-- Collection
('effect_ember_rain', 'Ember Rain', 'particle', '/assets/effects/ember_rain.json', '/assets/effects/thumbs/ember_rain.jpg', 'rare', 'purchase', 65, 'medium', 'Gentle embers falling like rain'),
('effect_rising_bubbles', 'Rising Bubbles', 'particle', '/assets/effects/rising_bubbles.json', '/assets/effects/thumbs/rising_bubbles.jpg', 'rare', 'purchase', 55, 'low', 'Bioluminescent bubbles rising slowly'),
('effect_void_particles', 'Void Particles', 'shader', '/assets/effects/void_particles.glsl', '/assets/effects/thumbs/void_particles.jpg', 'legendary', 'purchase', 70, 'high', 'Reality-distorting void energy')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DATA: Card Decks
-- ============================================================================

INSERT INTO card_decks (id, name, art_style, card_front_path, format, animated, rarity, unlock_method, description) VALUES
('deck_rider_waite', 'Rider-Waite Classic', 'rider_waite', '/assets/cards/rider_waite/', 'png', false, 'common', 'free', 'The timeless classic Rider-Waite-Smith deck'),
('deck_smith_waite', 'Smith-Waite Centennial', 'smith_waite', '/assets/cards/smith_waite/', 'png', false, 'uncommon', 'free', 'Pamela Colman Smith''s original artwork restored'),
('deck_veilpath_static', 'VeilPath Mystical', 'midjourney', '/assets/cards/veilpath_static/', 'png', false, 'rare', 'purchase', 'AI-generated mystical artwork exclusive to VeilPath'),
('deck_veilpath_animated', 'VeilPath Living Cards', 'midjourney', '/assets/cards/veilpath_animated/', 'mp4', true, 'epic', 'purchase', 'Animated cards that breathe with mystical energy'),
('deck_celestial_fire', 'Celestial Fire Deck', 'midjourney', '/assets/cards/celestial_fire/', 'mp4', true, 'legendary', 'purchase', 'Each card burns with cosmic flames')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TRIGGER: Auto-unlock free items for new users
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_unlock_free_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Unlock free backgrounds
  INSERT INTO user_background_art (user_id, background_art_id, unlock_method)
  SELECT NEW.id, id, 'free'
  FROM background_art
  WHERE unlock_method = 'free'
  ON CONFLICT DO NOTHING;

  -- Unlock free effects
  INSERT INTO user_effect_overlays (user_id, effect_overlay_id, unlock_method)
  SELECT NEW.id, id, 'free'
  FROM effect_overlays
  WHERE unlock_method = 'free'
  ON CONFLICT DO NOTHING;

  -- Unlock free decks
  INSERT INTO user_card_decks (user_id, deck_id, unlock_method)
  SELECT NEW.id, id, 'free'
  FROM card_decks
  WHERE unlock_method = 'free'
  ON CONFLICT DO NOTHING;

  -- Create default preset
  INSERT INTO user_visual_presets (
    user_id, name, is_active, preset_order,
    foundation_color_id, background_art_id, background_transparency,
    ui_theme_id, card_primary_deck_id, card_back_mode, card_primary_back_id
  ) VALUES (
    NEW.id, 'Default', true, 0,
    'void_black', 'bg_starfield', 85,
    'theme_default_dark', 'deck_rider_waite', 'single', 'back_default'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Attach this trigger to your user creation process
-- CREATE TRIGGER auto_unlock_on_signup
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_unlock_free_items();
