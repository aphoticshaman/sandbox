#!/usr/bin/env python3
"""
Generate Placeholder Card Art for LunatIQ Tarot
Creates 78 beautiful placeholder cards with dark fantasy aesthetic
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import sys
import json

# Card dimensions (standard tarot ratio)
CARD_WIDTH = 1080
CARD_HEIGHT = 1920

# Dark fantasy color palettes (suit-specific)
COLORS = {
    'Major': {
        'bg_start': (75, 0, 130),     # Deep violet
        'bg_end': (25, 0, 50),        # Dark purple
        'accent': (212, 175, 55),     # Gold
        'text': (255, 255, 255),      # White
        'border': (138, 43, 226)      # Violet
    },
    'Wands': {
        'bg_start': (139, 0, 0),      # Dark red
        'bg_end': (50, 0, 0),         # Very dark red
        'accent': (255, 140, 0),      # Dark orange
        'text': (255, 215, 0),        # Gold text
        'border': (220, 20, 60)       # Crimson
    },
    'Cups': {
        'bg_start': (0, 0, 139),      # Dark blue
        'bg_end': (0, 0, 50),         # Midnight blue
        'accent': (0, 191, 255),      # Deep sky blue
        'text': (173, 216, 230),      # Light blue
        'border': (65, 105, 225)      # Royal blue
    },
    'Swords': {
        'bg_start': (0, 100, 100),    # Dark cyan
        'bg_end': (0, 50, 50),        # Very dark cyan
        'accent': (224, 255, 255),    # Light cyan
        'text': (240, 255, 255),      # Azure
        'border': (0, 206, 209)       # Dark turquoise
    },
    'Pentacles': {
        'bg_start': (34, 139, 34),    # Forest green
        'bg_end': (0, 50, 0),         # Very dark green
        'accent': (154, 205, 50),     # Yellow green
        'text': (144, 238, 144),      # Light green
        'border': (46, 125, 50)       # Sea green
    }
}

# Moon phases for Major Arcana
MOON_PHASES = [
    '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'
]

def create_gradient_background(width, height, color_start, color_end):
    """Create vertical gradient background"""
    base = Image.new('RGB', (width, height), color_start)
    top = Image.new('RGB', (width, height), color_end)
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        mask_data.extend([int(255 * (y / height))] * width)
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def draw_ornate_border(draw, width, height, color, thickness=20):
    """Draw ornate border with corner decorations"""
    # Main border
    draw.rectangle(
        [thickness, thickness, width - thickness, height - thickness],
        outline=color,
        width=thickness
    )

    # Corner decorations (simple diamonds)
    corner_size = 80
    corners = [
        (thickness, thickness),  # Top-left
        (width - thickness, thickness),  # Top-right
        (thickness, height - thickness),  # Bottom-left
        (width - thickness, height - thickness)  # Bottom-right
    ]

    for x, y in corners:
        points = [
            (x, y - corner_size // 2),
            (x + corner_size // 2, y),
            (x, y + corner_size // 2),
            (x - corner_size // 2, y)
        ]
        draw.polygon(points, fill=color, outline=color)

def draw_centered_text(draw, text, y, font, color, width):
    """Draw text centered horizontally"""
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    draw.text((x, y), text, font=font, fill=color)

def draw_suit_symbol(draw, suit, x, y, size, color):
    """Draw suit symbol"""
    symbols = {
        'Wands': '🔥',
        'Cups': '💧',
        'Swords': '⚔️',
        'Pentacles': '⬟'
    }

    if suit in symbols:
        # For now, draw simple geometric shapes
        if suit == 'Wands':
            # Wand (vertical line with flame)
            draw.line([(x, y + size), (x, y)], fill=color, width=8)
            draw.ellipse([x - 15, y - 20, x + 15, y + 10], fill=color)
        elif suit == 'Cups':
            # Chalice
            draw.ellipse([x - size // 2, y - size // 3, x + size // 2, y + size // 3], outline=color, width=6)
            draw.line([(x, y + size // 3), (x, y + size // 2)], fill=color, width=6)
        elif suit == 'Swords':
            # Sword
            draw.line([(x, y - size // 2), (x, y + size // 2)], fill=color, width=8)
            draw.line([(x - 20, y - size // 3), (x + 20, y - size // 3)], fill=color, width=6)
        elif suit == 'Pentacles':
            # Pentacle (circle with star)
            draw.ellipse([x - size // 2, y - size // 2, x + size // 2, y + size // 2], outline=color, width=6)
            # Draw star inside
            draw.polygon([
                (x, y - size // 3),
                (x + size // 4, y + size // 4),
                (x - size // 3, y - size // 6),
                (x + size // 3, y - size // 6),
                (x - size // 4, y + size // 4)
            ], fill=color)

def generate_card(card_data, output_path):
    """Generate a single card image"""
    name = card_data['name']
    arcana = card_data['arcana'].capitalize()
    suit = card_data.get('suit', 'Major')
    if suit:
        suit = suit.capitalize()
    else:
        suit = 'Major'

    # Get color palette
    palette = COLORS.get(suit, COLORS['Major'])

    # Create base gradient
    card = create_gradient_background(
        CARD_WIDTH, CARD_HEIGHT,
        palette['bg_start'], palette['bg_end']
    )

    draw = ImageDraw.Draw(card)

    # Draw ornate border
    draw_ornate_border(draw, CARD_WIDTH, CARD_HEIGHT, palette['border'], 25)

    # Try to load fonts (fall back to default if not available)
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 100)
        subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 60)
        number_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        number_font = ImageFont.load_default()

    # Draw card number (top center)
    if 'number' in card_data:
        number_text = str(card_data['number'])
        draw_centered_text(draw, number_text, 150, number_font, palette['accent'], CARD_WIDTH)

    # Draw card name (upper third)
    y_name = 350
    words = name.upper().split()
    if len(words) > 2:
        # Multi-line for long names
        line1 = ' '.join(words[:len(words)//2])
        line2 = ' '.join(words[len(words)//2:])
        draw_centered_text(draw, line1, y_name, title_font, palette['text'], CARD_WIDTH)
        draw_centered_text(draw, line2, y_name + 110, title_font, palette['text'], CARD_WIDTH)
    else:
        draw_centered_text(draw, name.upper(), y_name, title_font, palette['text'], CARD_WIDTH)

    # Draw suit symbol or moon phase (center)
    center_y = CARD_HEIGHT // 2
    if suit != 'Major':
        draw_suit_symbol(draw, suit, CARD_WIDTH // 2, center_y, 150, palette['accent'])
    else:
        # Moon phase for Major Arcana
        card_num = card_data.get('number', 0)
        moon_emoji = MOON_PHASES[card_num % 8]
        # Draw large moon circle
        moon_size = 200
        draw.ellipse(
            [CARD_WIDTH // 2 - moon_size // 2, center_y - moon_size // 2,
             CARD_WIDTH // 2 + moon_size // 2, center_y + moon_size // 2],
            fill=palette['accent'],
            outline=palette['border'],
            width=8
        )

    # Draw arcana type (bottom)
    arcana_text = f"{arcana} ARCANA"
    if suit != 'Major':
        arcana_text = f"{suit}"

    draw_centered_text(draw, arcana_text, CARD_HEIGHT - 250, subtitle_font, palette['accent'], CARD_WIDTH)

    # Add dark fantasy subtitle
    if 'darkFantasy' in card_data and 'title' in card_data['darkFantasy']:
        fantasy_title = card_data['darkFantasy']['title']
        # Split long titles
        if len(fantasy_title) > 30:
            words = fantasy_title.split()
            mid = len(words) // 2
            line1 = ' '.join(words[:mid])
            line2 = ' '.join(words[mid:])
            draw_centered_text(draw, line1, CARD_HEIGHT - 180, subtitle_font, palette['text'], CARD_WIDTH)
            draw_centered_text(draw, line2, CARD_HEIGHT - 120, subtitle_font, palette['text'], CARD_WIDTH)
        else:
            draw_centered_text(draw, fantasy_title, CARD_HEIGHT - 150, subtitle_font, palette['text'], CARD_WIDTH)

    # Apply subtle texture/noise
    card = card.filter(ImageFilter.SMOOTH)

    # Save
    card.save(output_path, 'PNG', quality=95)
    print(f"✓ Generated: {name}")

def load_card_database():
    """Load card database from JavaScript file"""
    # For now, return a simplified version
    # In production, would parse the actual cardDatabase.js
    import subprocess
    try:
        # Try to parse with node
        result = subprocess.run(
            ['node', '-e', 'const db = require("./src/data/cardDatabase.js"); console.log(JSON.stringify(db.CARD_DATABASE));'],
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except:
        print("⚠️  Could not load database from JS file. Using manual generation.")
        return None

def main():
    print("🎨 LunatIQ Tarot Card Art Generator")
    print("=" * 50)

    # Create output directory
    output_dir = 'assets/cards'
    os.makedirs(output_dir, exist_ok=True)

    # Load card database
    cards = load_card_database()

    if cards:
        print(f"📊 Loaded {len(cards)} cards from database")
        for card in cards:
            filename = f"card_{card['id']:02d}_{card['name'].lower().replace(' ', '_')}.png"
            output_path = os.path.join(output_dir, filename)
            generate_card(card, output_path)
    else:
        print("⚠️  Generating cards manually...")
        # Generate cards manually (fallback)
        for i in range(78):
            card_data = {
                'id': i,
                'name': f'Card {i}',
                'arcana': 'major' if i < 22 else 'minor',
                'number': i
            }
            filename = f"card_{i:02d}_placeholder.png"
            output_path = os.path.join(output_dir, filename)
            generate_card(card_data, output_path)

    print("\n✅ Card art generation complete!")
    print(f"📁 Images saved to: {output_dir}/")

if __name__ == '__main__':
    main()
