#!/usr/bin/env python3
"""
VeilPath Asset Generator
Generates UI assets using PIL/Pillow
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math
import os

# Output directory
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'generated')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Color palette (matching COSMIC theme)
COLORS = {
    'deep_amethyst': (75, 0, 130),
    'ethereal_cyan': (0, 255, 255),
    'crystal_pink': (255, 182, 193),
    'candle_flame': (255, 167, 38),
    'moon_glow': (245, 245, 220),
    'void_black': (10, 5, 20),
    'brass_victorian': (181, 166, 66),
}

def create_gradient(size, color1, color2, direction='vertical'):
    """Create a gradient image"""
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    for i in range(size[1] if direction == 'vertical' else size[0]):
        ratio = i / (size[1] if direction == 'vertical' else size[0])
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)

        if direction == 'vertical':
            draw.line([(0, i), (size[0], i)], fill=(r, g, b, 255))
        else:
            draw.line([(i, 0), (i, size[1])], fill=(r, g, b, 255))

    return img

def create_radial_gradient(size, inner_color, outer_color):
    """Create a radial gradient"""
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    center = (size[0] // 2, size[1] // 2)
    max_radius = math.sqrt(center[0]**2 + center[1]**2)

    for y in range(size[1]):
        for x in range(size[0]):
            dist = math.sqrt((x - center[0])**2 + (y - center[1])**2)
            ratio = min(dist / max_radius, 1.0)
            r = int(inner_color[0] * (1 - ratio) + outer_color[0] * ratio)
            g = int(inner_color[1] * (1 - ratio) + outer_color[1] * ratio)
            b = int(inner_color[2] * (1 - ratio) + outer_color[2] * ratio)
            a = int(255 * (1 - ratio * 0.3))
            img.putpixel((x, y), (r, g, b, a))

    return img

# ============================================================
# 1. NAV BAR ICONS
# ============================================================
def generate_nav_icons():
    """Generate symbolic nav bar icons"""
    icon_size = (64, 64)
    icons = {
        'home': draw_home_icon,
        'reading': draw_cards_icon,
        'journal': draw_book_icon,
        'mindfulness': draw_lotus_icon,
        'oracle': draw_crystal_ball_icon,
        'quests': draw_scroll_icon,
        'shop': draw_gem_icon,
        'locker': draw_chest_icon,
        'profile': draw_user_icon,
    }

    for name, draw_func in icons.items():
        # Create icon with glow
        img = Image.new('RGBA', icon_size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw_func(draw, icon_size, COLORS['ethereal_cyan'])

        # Add glow effect
        glow = img.filter(ImageFilter.GaussianBlur(3))
        final = Image.alpha_composite(glow, img)

        final.save(os.path.join(OUTPUT_DIR, f'icon_{name}.png'))
        print(f"  Created icon_{name}.png")

def draw_home_icon(draw, size, color):
    """Draw a house icon"""
    w, h = size
    cx, cy = w // 2, h // 2
    # Roof (triangle)
    draw.polygon([(cx, 10), (10, cy), (w-10, cy)], outline=color, width=3)
    # Base (rectangle)
    draw.rectangle([(15, cy), (w-15, h-10)], outline=color, width=3)
    # Door
    draw.rectangle([(cx-6, h-25), (cx+6, h-10)], outline=color, width=2)

def draw_cards_icon(draw, size, color):
    """Draw stacked cards icon"""
    w, h = size
    # Back card
    draw.rectangle([(8, 12), (w-18, h-8)], outline=color, width=2)
    # Front card
    draw.rectangle([(18, 8), (w-8, h-12)], outline=color, width=3)
    # Star on front card
    draw_star(draw, (w//2 + 5, h//2 - 2), 8, color)

def draw_book_icon(draw, size, color):
    """Draw an open book icon"""
    w, h = size
    cx = w // 2
    # Left page
    draw.arc([(5, 12), (cx+5, h-8)], 90, 270, fill=color, width=3)
    # Right page
    draw.arc([(cx-5, 12), (w-5, h-8)], 270, 90, fill=color, width=3)
    # Spine
    draw.line([(cx, 12), (cx, h-8)], fill=color, width=2)
    # Lines on pages
    for i in range(3):
        y = 22 + i * 10
        draw.line([(12, y), (cx-5, y)], fill=color, width=1)
        draw.line([(cx+5, y), (w-12, y)], fill=color, width=1)

def draw_lotus_icon(draw, size, color):
    """Draw a lotus flower icon"""
    w, h = size
    cx, cy = w // 2, h // 2 + 5
    # Center petal
    draw.ellipse([(cx-8, cy-20), (cx+8, cy+5)], outline=color, width=2)
    # Left petals
    draw.arc([(5, cy-15), (cx, cy+10)], 30, 150, fill=color, width=2)
    draw.arc([(10, cy-10), (cx-5, cy+5)], 30, 150, fill=color, width=2)
    # Right petals
    draw.arc([(cx, cy-15), (w-5, cy+10)], 30, 150, fill=color, width=2)
    draw.arc([(cx+5, cy-10), (w-10, cy+5)], 30, 150, fill=color, width=2)

def draw_crystal_ball_icon(draw, size, color):
    """Draw a crystal ball icon"""
    w, h = size
    cx, cy = w // 2, h // 2
    # Ball
    draw.ellipse([(10, 8), (w-10, h-16)], outline=color, width=3)
    # Base
    draw.arc([(15, h-20), (w-15, h-5)], 0, 180, fill=color, width=3)
    # Sparkle
    draw_star(draw, (cx-8, cy-8), 5, color)

def draw_scroll_icon(draw, size, color):
    """Draw a scroll icon"""
    w, h = size
    # Main scroll body
    draw.rectangle([(15, 15), (w-15, h-15)], outline=color, width=2)
    # Top roll
    draw.ellipse([(10, 10), (w-10, 25)], outline=color, width=2)
    # Bottom roll
    draw.ellipse([(10, h-25), (w-10, h-10)], outline=color, width=2)
    # Text lines
    for i in range(2):
        y = 30 + i * 10
        draw.line([(20, y), (w-20, y)], fill=color, width=1)

def draw_gem_icon(draw, size, color):
    """Draw a gem/diamond icon"""
    w, h = size
    cx = w // 2
    # Top facet
    draw.polygon([(cx, 8), (10, 25), (w-10, 25)], outline=color, width=2)
    # Bottom point
    draw.polygon([(10, 25), (w-10, 25), (cx, h-8)], outline=color, width=2)
    # Inner facets
    draw.line([(cx, 8), (cx, h-8)], fill=color, width=1)
    draw.line([(10, 25), (cx, h-8)], fill=color, width=1)
    draw.line([(w-10, 25), (cx, h-8)], fill=color, width=1)

def draw_chest_icon(draw, size, color):
    """Draw a treasure chest icon"""
    w, h = size
    # Chest body
    draw.rectangle([(8, 25), (w-8, h-10)], outline=color, width=3)
    # Lid
    draw.arc([(8, 10), (w-8, 35)], 180, 0, fill=color, width=3)
    # Lock
    draw.ellipse([(w//2-5, 30), (w//2+5, 40)], outline=color, width=2)

def draw_user_icon(draw, size, color):
    """Draw a user/profile icon"""
    w, h = size
    cx = w // 2
    # Head
    draw.ellipse([(cx-12, 8), (cx+12, 32)], outline=color, width=3)
    # Body/shoulders
    draw.arc([(8, 28), (w-8, h-5)], 0, 180, fill=color, width=3)

def draw_star(draw, center, size, color):
    """Draw a 4-point star"""
    cx, cy = center
    points = [
        (cx, cy - size),
        (cx + size//3, cy - size//3),
        (cx + size, cy),
        (cx + size//3, cy + size//3),
        (cx, cy + size),
        (cx - size//3, cy + size//3),
        (cx - size, cy),
        (cx - size//3, cy - size//3),
    ]
    draw.polygon(points, fill=color)

# ============================================================
# 2. VICTORIAN FRAME BORDERS
# ============================================================
def generate_frame_borders():
    """Generate ornate Victorian-style frame borders"""

    # Corner piece (will be rotated for all 4 corners)
    corner_size = (80, 80)
    corner = Image.new('RGBA', corner_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(corner)

    color = COLORS['brass_victorian']

    # Ornate corner flourish
    draw.arc([(5, 5), (75, 75)], 180, 270, fill=color, width=3)
    draw.arc([(15, 15), (65, 65)], 180, 270, fill=color, width=2)
    # Decorative dots
    for i in range(3):
        x = 20 + i * 15
        draw.ellipse([(x, 10), (x+6, 16)], fill=color)
        draw.ellipse([(10, x), (16, x+6)], fill=color)

    corner.save(os.path.join(OUTPUT_DIR, 'frame_corner_tl.png'))
    corner.rotate(270).save(os.path.join(OUTPUT_DIR, 'frame_corner_tr.png'))
    corner.rotate(180).save(os.path.join(OUTPUT_DIR, 'frame_corner_br.png'))
    corner.rotate(90).save(os.path.join(OUTPUT_DIR, 'frame_corner_bl.png'))
    print("  Created frame corners (4 variants)")

    # Horizontal border segment (tileable)
    h_border = Image.new('RGBA', (100, 20), (0, 0, 0, 0))
    draw = ImageDraw.Draw(h_border)
    draw.line([(0, 10), (100, 10)], fill=color, width=2)
    # Decorative pattern
    for i in range(5):
        x = 10 + i * 20
        draw.ellipse([(x-3, 7), (x+3, 13)], fill=color)
    h_border.save(os.path.join(OUTPUT_DIR, 'frame_border_h.png'))
    print("  Created frame_border_h.png")

    # Vertical border segment (tileable)
    v_border = Image.new('RGBA', (20, 100), (0, 0, 0, 0))
    draw = ImageDraw.Draw(v_border)
    draw.line([(10, 0), (10, 100)], fill=color, width=2)
    for i in range(5):
        y = 10 + i * 20
        draw.ellipse([(7, y-3), (13, y+3)], fill=color)
    v_border.save(os.path.join(OUTPUT_DIR, 'frame_border_v.png'))
    print("  Created frame_border_v.png")

# ============================================================
# 3. COSMIC GRADIENT BACKGROUNDS
# ============================================================
def generate_backgrounds():
    """Generate cosmic gradient backgrounds"""

    # Main cosmic background (purple to black)
    bg1 = create_gradient(
        (800, 1200),
        COLORS['deep_amethyst'],
        COLORS['void_black'],
        'vertical'
    )
    bg1.save(os.path.join(OUTPUT_DIR, 'bg_cosmic_purple.png'))
    print("  Created bg_cosmic_purple.png")

    # Ethereal background (cyan accent)
    bg2 = create_radial_gradient(
        (800, 800),
        (20, 60, 80),  # Dark teal center
        COLORS['void_black']
    )
    bg2.save(os.path.join(OUTPUT_DIR, 'bg_ethereal.png'))
    print("  Created bg_ethereal.png")

    # Card panel background (subtle)
    bg3 = create_gradient(
        (400, 600),
        (30, 20, 50),  # Dark purple
        (15, 10, 30),  # Darker
        'vertical'
    )
    # Add subtle border glow
    draw = ImageDraw.Draw(bg3)
    for i in range(5):
        opacity = 100 - i * 20
        draw.rectangle(
            [(i, i), (399-i, 599-i)],
            outline=(*COLORS['deep_amethyst'], opacity),
            width=1
        )
    bg3.save(os.path.join(OUTPUT_DIR, 'bg_card_panel.png'))
    print("  Created bg_card_panel.png")

# ============================================================
# 4. BUTTON ASSETS
# ============================================================
def generate_buttons():
    """Generate glowing mystical buttons"""

    button_sizes = [
        ('sm', (120, 40)),
        ('md', (180, 50)),
        ('lg', (240, 60)),
    ]

    button_styles = [
        ('primary', COLORS['deep_amethyst'], COLORS['ethereal_cyan']),
        ('secondary', (40, 30, 60), COLORS['crystal_pink']),
        ('gold', (60, 40, 20), COLORS['candle_flame']),
    ]

    for size_name, size in button_sizes:
        for style_name, bg_color, glow_color in button_styles:
            btn = create_button(size, bg_color, glow_color)
            btn.save(os.path.join(OUTPUT_DIR, f'btn_{style_name}_{size_name}.png'))
            print(f"  Created btn_{style_name}_{size_name}.png")

def create_button(size, bg_color, glow_color):
    """Create a single button with glow effect"""
    # Create larger canvas for glow
    padding = 10
    full_size = (size[0] + padding * 2, size[1] + padding * 2)

    img = Image.new('RGBA', full_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Button shape with rounded corners
    radius = size[1] // 4
    x1, y1 = padding, padding
    x2, y2 = size[0] + padding, size[1] + padding

    # Draw rounded rectangle
    draw.rounded_rectangle(
        [(x1, y1), (x2, y2)],
        radius=radius,
        fill=(*bg_color, 230),
        outline=(*glow_color, 200),
        width=2
    )

    # Add inner highlight
    draw.rounded_rectangle(
        [(x1+2, y1+2), (x2-2, y1 + size[1]//3)],
        radius=radius-2,
        fill=(*glow_color, 30)
    )

    # Apply glow
    glow_layer = img.copy()
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(5))

    result = Image.alpha_composite(glow_layer, img)
    return result

# ============================================================
# 5. DECORATIVE DIVIDERS
# ============================================================
def generate_dividers():
    """Generate ornate line dividers"""

    # Standard divider
    div1 = Image.new('RGBA', (300, 30), (0, 0, 0, 0))
    draw = ImageDraw.Draw(div1)
    color = COLORS['brass_victorian']

    # Center ornament
    cx = 150
    draw.ellipse([(cx-8, 11), (cx+8, 19)], fill=color)
    draw.ellipse([(cx-4, 13), (cx+4, 17)], fill=COLORS['void_black'])

    # Lines extending outward
    draw.line([(20, 15), (cx-15, 15)], fill=color, width=2)
    draw.line([(cx+15, 15), (280, 15)], fill=color, width=2)

    # End flourishes
    draw.ellipse([(15, 12), (25, 18)], fill=color)
    draw.ellipse([(275, 12), (285, 18)], fill=color)

    div1.save(os.path.join(OUTPUT_DIR, 'divider_ornate.png'))
    print("  Created divider_ornate.png")

    # Star divider
    div2 = Image.new('RGBA', (300, 30), (0, 0, 0, 0))
    draw = ImageDraw.Draw(div2)

    # Stars
    draw_star(draw, (150, 15), 10, COLORS['candle_flame'])
    draw_star(draw, (100, 15), 6, color)
    draw_star(draw, (200, 15), 6, color)
    draw_star(draw, (60, 15), 4, color)
    draw_star(draw, (240, 15), 4, color)

    # Connecting lines
    draw.line([(20, 15), (55, 15)], fill=color, width=1)
    draw.line([(65, 15), (94, 15)], fill=color, width=1)
    draw.line([(106, 15), (140, 15)], fill=color, width=1)
    draw.line([(160, 15), (194, 15)], fill=color, width=1)
    draw.line([(206, 15), (235, 15)], fill=color, width=1)
    draw.line([(245, 15), (280, 15)], fill=color, width=1)

    div2.save(os.path.join(OUTPUT_DIR, 'divider_stars.png'))
    print("  Created divider_stars.png")

    # Simple elegant divider
    div3 = Image.new('RGBA', (300, 20), (0, 0, 0, 0))
    draw = ImageDraw.Draw(div3)

    # Gradient line effect (thicker in middle)
    for i in range(150):
        thickness = max(1, 3 - abs(i - 75) // 25)
        alpha = 255 - abs(i - 75) * 2
        draw.line([(i, 10), (i+1, 10)], fill=(*color, alpha), width=thickness)
        draw.line([(299-i, 10), (300-i, 10)], fill=(*color, alpha), width=thickness)

    div3.save(os.path.join(OUTPUT_DIR, 'divider_fade.png'))
    print("  Created divider_fade.png")

# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 50)
    print("VeilPath Asset Generator")
    print("=" * 50)

    print("\n1. Generating Nav Icons...")
    generate_nav_icons()

    print("\n2. Generating Frame Borders...")
    generate_frame_borders()

    print("\n3. Generating Backgrounds...")
    generate_backgrounds()

    print("\n4. Generating Buttons...")
    generate_buttons()

    print("\n5. Generating Dividers...")
    generate_dividers()

    print("\n" + "=" * 50)
    print(f"All assets saved to: {OUTPUT_DIR}")
    print("=" * 50)

if __name__ == '__main__':
    main()
