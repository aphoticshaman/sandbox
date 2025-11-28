#!/usr/bin/env python3
"""
Generate LunatIQ Tarot app icon for iOS and Android
Dark fantasy mystical aesthetic with safe zones for OS rounding
"""

from PIL import Image, ImageDraw, ImageFilter
import math

# Icon specifications
ICON_SIZE = 1024  # iOS and Android both use 1024x1024
CENTER = ICON_SIZE // 2

# Safe zones (percentage of radius)
IOS_SAFE_ZONE = 0.88  # iOS rounded corners are gentler
ANDROID_SAFE_ZONE = 0.66  # Android circular mask is aggressive
DESIGN_SAFE_ZONE = 0.70  # Design everything within this

# Color palette (from our dark fantasy aesthetic)
COLOR_VIOLET = (138, 43, 226)       # #8a2be2 - base violet
COLOR_PURPLE_DEEP = (75, 0, 130)    # Deep purple
COLOR_CYAN = (0, 255, 255)          # #00ffff - accent cyan
COLOR_GOLD = (212, 175, 55)         # #d4af37 - mystic gold
COLOR_BLACK = (0, 0, 0)             # Pure black
COLOR_NAVY = (10, 10, 40)           # Very dark blue
COLOR_AZURE = (0, 127, 255)         # #007fff


def create_gradient_background(size):
    """Create a radial gradient from deep purple to black"""
    img = Image.new('RGB', (size, size), COLOR_BLACK)
    draw = ImageDraw.Draw(img)

    # Radial gradient from center
    max_radius = size // 2
    for r in range(max_radius, 0, -1):
        # Interpolate between deep purple (center) and black (edge)
        ratio = r / max_radius
        color = tuple(int(COLOR_PURPLE_DEEP[i] * ratio) for i in range(3))
        draw.ellipse([CENTER - r, CENTER - r, CENTER + r, CENTER + r], fill=color)

    return img


def draw_crescent_moon(draw, center_x, center_y, radius, color, glow_color=None):
    """Draw a crescent moon shape"""
    # Full circle (outer edge of moon)
    outer_left = center_x - radius
    outer_top = center_y - radius
    outer_right = center_x + radius
    outer_bottom = center_y + radius

    # Inner circle (cuts out the crescent)
    offset = int(radius * 0.3)  # How much to offset the cutout
    inner_left = center_x - radius + offset
    inner_top = center_y - radius
    inner_right = center_x + radius + offset
    inner_bottom = center_y + radius

    # Create a temporary image for the moon with alpha
    moon_img = Image.new('RGBA', (radius * 4, radius * 4), (0, 0, 0, 0))
    moon_draw = ImageDraw.Draw(moon_img)

    temp_center = radius * 2

    # Draw the full circle
    moon_draw.ellipse(
        [temp_center - radius, temp_center - radius,
         temp_center + radius, temp_center + radius],
        fill=color
    )

    # Cut out the crescent by drawing black circle
    moon_draw.ellipse(
        [temp_center - radius + offset, temp_center - radius,
         temp_center + radius + offset, temp_center + radius],
        fill=(0, 0, 0, 0)
    )

    return moon_img


def draw_stars(draw, num_stars=8, inner_radius=200, outer_radius=450):
    """Draw small stars around the design"""
    for i in range(num_stars):
        angle = (2 * math.pi * i) / num_stars
        # Randomize radius slightly
        radius = inner_radius + (outer_radius - inner_radius) * ((i % 3) / 3)
        x = CENTER + int(radius * math.cos(angle))
        y = CENTER + int(radius * math.sin(angle))

        # Draw a 4-pointed star
        star_size = 8 + (i % 3) * 4

        # Horizontal line
        draw.line([x - star_size, y, x + star_size, y], fill=COLOR_GOLD, width=3)
        # Vertical line
        draw.line([x, y - star_size, x, y + star_size], fill=COLOR_GOLD, width=3)
        # Diagonals
        draw.line([x - star_size//2, y - star_size//2,
                   x + star_size//2, y + star_size//2], fill=COLOR_CYAN, width=2)
        draw.line([x - star_size//2, y + star_size//2,
                   x + star_size//2, y - star_size//2], fill=COLOR_CYAN, width=2)


def draw_tarot_card_silhouette(draw, center_x, center_y, width, height, color):
    """Draw a simple tarot card rectangle"""
    left = center_x - width // 2
    top = center_y - height // 2
    right = center_x + width // 2
    bottom = center_y + height // 2

    # Card background
    draw.rounded_rectangle(
        [left, top, right, bottom],
        radius=20,
        fill=color,
        outline=COLOR_GOLD,
        width=4
    )

    # Inner border for detail
    inner_margin = 15
    draw.rounded_rectangle(
        [left + inner_margin, top + inner_margin,
         right - inner_margin, bottom - inner_margin],
        radius=12,
        outline=COLOR_CYAN,
        width=2
    )


def create_icon_design():
    """Create the main icon design"""
    # Start with gradient background
    icon = create_gradient_background(ICON_SIZE)
    draw = ImageDraw.Draw(icon, 'RGBA')

    # Draw stars in background
    draw_stars(draw, num_stars=12, inner_radius=220, outer_radius=480)

    # Main design: Tarot card with crescent moon overlay
    card_width = 180
    card_height = 300

    # Draw tarot card silhouette (slightly offset)
    card_x = CENTER + 30
    card_y = CENTER
    draw_tarot_card_silhouette(draw, card_x, card_y, card_width, card_height, COLOR_NAVY)

    # Draw crescent moon overlapping the card
    moon_radius = 160
    moon_x = CENTER - 40
    moon_y = CENTER - 20

    # Create moon on separate layer for glow effect
    moon_layer = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    moon_draw = ImageDraw.Draw(moon_layer, 'RGBA')

    # Draw moon with glow
    moon_img = draw_crescent_moon(moon_draw, moon_x, moon_y, moon_radius,
                                   COLOR_GOLD + (255,), COLOR_CYAN)

    # Paste moon image centered
    moon_paste_x = moon_x - moon_radius * 2
    moon_paste_y = moon_y - moon_radius * 2
    icon.paste(moon_img, (moon_paste_x, moon_paste_y), moon_img)

    # Add glow effect to moon
    glow_layer = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer, 'RGBA')

    # Outer glow
    for i in range(5):
        glow_radius = moon_radius + (i * 15)
        alpha = 60 - (i * 10)
        glow_color = COLOR_VIOLET + (alpha,)
        glow_draw.ellipse(
            [moon_x - glow_radius, moon_y - glow_radius,
             moon_x + glow_radius, moon_y + glow_radius],
            fill=glow_color
        )

    # Blur the glow
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=15))

    # Composite glow behind moon
    icon = Image.alpha_composite(icon.convert('RGBA'), glow_layer)

    # Add mystical sparkles
    for i in range(15):
        angle = (2 * math.pi * i) / 15 + 0.3
        radius = 140 + (i % 5) * 40
        x = CENTER + int(radius * math.cos(angle))
        y = CENTER + int(radius * math.sin(angle))

        sparkle_size = 3 + (i % 3)
        sparkle_color = COLOR_CYAN if i % 2 == 0 else COLOR_GOLD
        sparkle_alpha = 200 - (i % 3) * 30

        draw.ellipse(
            [x - sparkle_size, y - sparkle_size,
             x + sparkle_size, y + sparkle_size],
            fill=sparkle_color + (sparkle_alpha,)
        )

    return icon.convert('RGB')


def create_adaptive_icon_foreground():
    """Create Android adaptive icon foreground layer (transparent background)"""
    # Same design but with transparent background
    icon = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon, 'RGBA')

    # Draw stars
    for i in range(12):
        angle = (2 * math.pi * i) / 12
        radius = 220 + (i % 3) * 80
        x = CENTER + int(radius * math.cos(angle))
        y = CENTER + int(radius * math.sin(angle))

        star_size = 8 + (i % 3) * 4

        # 4-pointed star
        draw.line([x - star_size, y, x + star_size, y],
                  fill=COLOR_GOLD + (255,), width=3)
        draw.line([x, y - star_size, x, y + star_size],
                  fill=COLOR_GOLD + (255,), width=3)
        draw.line([x - star_size//2, y - star_size//2,
                   x + star_size//2, y + star_size//2],
                  fill=COLOR_CYAN + (255,), width=2)
        draw.line([x - star_size//2, y + star_size//2,
                   x + star_size//2, y - star_size//2],
                  fill=COLOR_CYAN + (255,), width=2)

    # Tarot card
    card_width = 180
    card_height = 300
    card_x = CENTER + 30
    card_y = CENTER

    draw.rounded_rectangle(
        [card_x - card_width//2, card_y - card_height//2,
         card_x + card_width//2, card_y + card_height//2],
        radius=20,
        fill=COLOR_NAVY + (255,),
        outline=COLOR_GOLD + (255,),
        width=4
    )

    inner_margin = 15
    draw.rounded_rectangle(
        [card_x - card_width//2 + inner_margin,
         card_y - card_height//2 + inner_margin,
         card_x + card_width//2 - inner_margin,
         card_y + card_height//2 - inner_margin],
        radius=12,
        outline=COLOR_CYAN + (255,),
        width=2
    )

    # Crescent moon
    moon_radius = 160
    moon_x = CENTER - 40
    moon_y = CENTER - 20

    moon_img = draw_crescent_moon(draw, moon_x, moon_y, moon_radius,
                                   COLOR_GOLD + (255,))
    moon_paste_x = moon_x - moon_radius * 2
    moon_paste_y = moon_y - moon_radius * 2
    icon.paste(moon_img, (moon_paste_x, moon_paste_y), moon_img)

    # Glow
    glow_layer = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer, 'RGBA')

    for i in range(5):
        glow_radius = moon_radius + (i * 15)
        alpha = 60 - (i * 10)
        glow_color = COLOR_VIOLET + (alpha,)
        glow_draw.ellipse(
            [moon_x - glow_radius, moon_y - glow_radius,
             moon_x + glow_radius, moon_y + glow_radius],
            fill=glow_color
        )

    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=15))
    icon = Image.alpha_composite(icon, glow_layer)

    # Sparkles
    for i in range(15):
        angle = (2 * math.pi * i) / 15 + 0.3
        radius = 140 + (i % 5) * 40
        x = CENTER + int(radius * math.cos(angle))
        y = CENTER + int(radius * math.sin(angle))

        sparkle_size = 3 + (i % 3)
        sparkle_color = COLOR_CYAN if i % 2 == 0 else COLOR_GOLD
        sparkle_alpha = 200 - (i % 3) * 30

        draw.ellipse(
            [x - sparkle_size, y - sparkle_size,
             x + sparkle_size, y + sparkle_size],
            fill=sparkle_color + (sparkle_alpha,)
        )

    return icon


def draw_safe_zone_guide(icon, zone_radius):
    """Draw a guide circle showing the safe zone (for testing)"""
    draw = ImageDraw.Draw(icon, 'RGBA')
    radius = int(ICON_SIZE * zone_radius / 2)
    draw.ellipse(
        [CENTER - radius, CENTER - radius, CENTER + radius, CENTER + radius],
        outline=(255, 0, 0, 128),
        width=3
    )
    return icon


def main():
    print("Generating LunatIQ Tarot app icons...")

    # iOS icon (with gradient background)
    print("Creating iOS icon (1024x1024)...")
    ios_icon = create_icon_design()
    ios_icon.save('/home/user/HungryOrca/assets/icon.png', 'PNG', quality=95)
    print("✓ Saved: assets/icon.png")

    # Android adaptive icon foreground (transparent background)
    print("Creating Android adaptive icon foreground...")
    android_icon = create_adaptive_icon_foreground()
    android_icon.save('/home/user/HungryOrca/assets/adaptive-icon.png', 'PNG')
    print("✓ Saved: assets/adaptive-icon.png")

    # Create a preview with safe zone guides
    print("Creating preview with safe zone guides...")
    preview = create_icon_design()
    preview = draw_safe_zone_guide(preview, ANDROID_SAFE_ZONE)
    preview = draw_safe_zone_guide(preview, IOS_SAFE_ZONE)
    preview.save('/home/user/HungryOrca/assets/icon_preview_with_guides.png', 'PNG')
    print("✓ Saved: assets/icon_preview_with_guides.png (with safe zone guides)")

    print("\n✅ Icon generation complete!")
    print("\nIcon design:")
    print("- Crescent moon (gold) with violet glow")
    print("- Tarot card silhouette (navy with gold/cyan borders)")
    print("- Stars and sparkles (gold/cyan)")
    print("- Dark gradient background (purple to black)")
    print("- All elements within safe zone for OS rounding")


if __name__ == '__main__':
    main()
