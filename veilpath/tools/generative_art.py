#!/usr/bin/env python3
"""
PROCEDURAL ASSET GENERATOR
Fill in missing game assets with generative art matching the existing aesthetic
"""

import os
import sys
import json
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
import numpy as np
from pathlib import Path
import random
import math

def extract_color_palette(image_path, num_colors=16):
    """
    Extract dominant colors from an existing asset
    Returns palette that can be used for generative art
    """
    img = Image.open(image_path).convert('RGB')

    # Resize for faster processing
    img_small = img.resize((150, 150))
    pixels = np.array(img_small).reshape(-1, 3)

    # Simple k-means clustering (find dominant colors)
    from sklearn.cluster import KMeans
    kmeans = KMeans(n_clusters=num_colors, random_state=42, n_init=10)
    kmeans.fit(pixels)

    palette = kmeans.cluster_centers_.astype(int)

    # Sort by brightness for consistency
    brightness = palette.sum(axis=1)
    palette = palette[np.argsort(brightness)]

    return [tuple(color) for color in palette]

def save_palette_json(palette, output_path):
    """Save palette as JSON for reuse"""
    palette_dict = {
        'colors': [{'r': int(c[0]), 'g': int(c[1]), 'b': int(c[2])} for c in palette],
        'hex': ['#%02x%02x%02x' % c for c in palette]
    }
    with open(output_path, 'w') as f:
        json.dump(palette_dict, f, indent=2)
    return palette_dict

def load_palette_json(json_path):
    """Load palette from JSON"""
    with open(json_path) as f:
        data = json.load(f)
    return [tuple(c.values()) for c in data['colors']]

def generate_particle_sprite(size=64, palette=None, particle_type='circle', glow=True, seed=None):
    """
    Generate a single particle sprite (star, circle, diamond, etc.)
    """
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)

    if palette is None:
        # Default cyberpunk mystical palette
        palette = [
            (138, 43, 226),   # Purple
            (0, 255, 255),     # Cyan
            (255, 0, 255),     # Magenta
            (255, 215, 0),     # Gold
        ]

    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size // 2
    core_color = random.choice(palette)

    if particle_type == 'circle':
        # Filled circle with gradient
        radius = size // 3
        for r in range(radius, 0, -1):
            alpha = int(255 * (r / radius))
            draw.ellipse(
                [center - r, center - r, center + r, center + r],
                fill=(*core_color, alpha)
            )

    elif particle_type == 'star':
        # 5-pointed star
        points = []
        for i in range(10):
            angle = (i * 36 - 90) * math.pi / 180
            r = (size // 3) if i % 2 == 0 else (size // 6)
            x = center + int(r * math.cos(angle))
            y = center + int(r * math.sin(angle))
            points.append((x, y))
        draw.polygon(points, fill=(*core_color, 255))

    elif particle_type == 'diamond':
        points = [
            (center, center - size // 3),  # Top
            (center + size // 3, center),  # Right
            (center, center + size // 3),  # Bottom
            (center - size // 3, center),  # Left
        ]
        draw.polygon(points, fill=(*core_color, 255))

    elif particle_type == 'hex':
        # Hexagon
        points = []
        for i in range(6):
            angle = i * 60 * math.pi / 180
            x = center + int((size // 3) * math.cos(angle))
            y = center + int((size // 3) * math.sin(angle))
            points.append((x, y))
        draw.polygon(points, fill=(*core_color, 255))

    # Add glow effect
    if glow:
        # Create glow layer
        glow_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_img)
        glow_radius = size // 2
        for r in range(glow_radius, 0, -2):
            alpha = int(100 * (r / glow_radius) ** 2)
            glow_draw.ellipse(
                [center - r, center - r, center + r, center + r],
                fill=(*core_color, alpha)
            )

        # Blur the glow
        glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=size // 8))

        # Composite: glow behind particle
        result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        result.paste(glow_img, (0, 0), glow_img)
        result.paste(img, (0, 0), img)
        img = result

    return img

def generate_particle_sheet(num_particles=16, size=64, palette=None, output_path=None):
    """
    Generate a sprite sheet of varied particles
    """
    columns = 4
    rows = num_particles // columns

    sheet_width = columns * size
    sheet_height = rows * size

    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))

    particle_types = ['circle', 'star', 'diamond', 'hex']

    for i in range(num_particles):
        particle_type = particle_types[i % len(particle_types)]
        particle = generate_particle_sprite(size, palette, particle_type, glow=True, seed=i)

        x = (i % columns) * size
        y = (i // columns) * size
        sheet.paste(particle, (x, y), particle)

    if output_path:
        sheet.save(output_path, 'PNG', optimize=True)

    return sheet

def generate_animated_particle_gif(frames=8, size=128, palette=None, output_path=None):
    """
    Generate an animated particle GIF (pulsing, rotating, etc.)
    """
    if palette is None:
        palette = [
            (138, 43, 226),   # Purple
            (0, 255, 255),     # Cyan
            (255, 0, 255),     # Magenta
        ]

    images = []

    for frame in range(frames):
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        center = size // 2

        # Pulsing effect
        scale = 0.8 + 0.2 * math.sin(frame / frames * 2 * math.pi)
        radius = int((size // 3) * scale)

        # Rotating colors
        color_idx = frame % len(palette)
        core_color = palette[color_idx]

        # Draw pulsing circle with glow
        for r in range(radius * 2, 0, -2):
            alpha = int(150 * (r / (radius * 2)) ** 2)
            draw.ellipse(
                [center - r, center - r, center + r, center + r],
                fill=(*core_color, alpha)
            )

        # Add sparkle points
        for i in range(5):
            angle = (frame / frames * 360 + i * 72) * math.pi / 180
            dist = radius + 10
            x = center + int(dist * math.cos(angle))
            y = center + int(dist * math.sin(angle))
            sparkle_size = 4
            draw.ellipse(
                [x - sparkle_size, y - sparkle_size, x + sparkle_size, y + sparkle_size],
                fill=(255, 255, 255, 255)
            )

        images.append(img)

    if output_path:
        images[0].save(
            output_path,
            save_all=True,
            append_images=images[1:],
            duration=100,  # 100ms per frame = 10 FPS
            loop=0,
            optimize=True
        )

    return images

def generate_geometric_tile(size=256, palette=None, pattern='sacred_geometry', seed=None):
    """
    Generate procedural geometric tiles (sacred geometry, circuit patterns, etc.)
    """
    if seed is not None:
        random.seed(seed)

    if palette is None:
        palette = [
            (10, 10, 15),      # Dark background
            (26, 26, 46),      # Medium dark
            (138, 43, 226),    # Purple
            (0, 255, 255),     # Cyan
        ]

    img = Image.new('RGBA', (size, size), palette[0] + (255,))
    draw = ImageDraw.Draw(img)

    center = size // 2

    if pattern == 'sacred_geometry':
        # Flower of Life inspired pattern
        num_circles = 6
        radius = size // 4

        for i in range(num_circles):
            angle = i * 60 * math.pi / 180
            x = center + int(radius * math.cos(angle))
            y = center + int(radius * math.sin(angle))

            color = random.choice(palette[2:])
            draw.ellipse(
                [x - radius, y - radius, x + radius, y + radius],
                outline=color + (150,),
                width=2
            )

        # Center circle
        draw.ellipse(
            [center - radius, center - radius, center + radius, center + radius],
            outline=palette[3] + (200,),
            width=3
        )

    elif pattern == 'circuit':
        # Circuit board-like pattern
        num_lines = random.randint(8, 12)

        for _ in range(num_lines):
            x1 = random.randint(0, size)
            y1 = random.randint(0, size)

            # Random walk to create circuit paths
            x2, y2 = x1, y1
            for step in range(random.randint(3, 6)):
                direction = random.choice(['h', 'v'])
                length = random.randint(20, 80)

                if direction == 'h':
                    x2 += random.choice([-length, length])
                else:
                    y2 += random.choice([-length, length])

                x2 = max(0, min(size, x2))
                y2 = max(0, min(size, y2))

                color = random.choice(palette[2:])
                draw.line([x1, y1, x2, y2], fill=color + (180,), width=2)

                # Add nodes at corners
                node_size = 4
                draw.ellipse(
                    [x2 - node_size, y2 - node_size, x2 + node_size, y2 + node_size],
                    fill=color + (255,)
                )

                x1, y1 = x2, y2

    elif pattern == 'mandala':
        # Mandala pattern
        num_petals = 8
        layers = 3

        for layer in range(layers):
            layer_radius = (layer + 1) * size // 8
            color = palette[2 + layer % 2]

            for i in range(num_petals):
                angle = i * (360 / num_petals) * math.pi / 180
                x = center + int(layer_radius * math.cos(angle))
                y = center + int(layer_radius * math.sin(angle))

                petal_size = size // 10
                draw.ellipse(
                    [x - petal_size, y - petal_size, x + petal_size, y + petal_size],
                    fill=color + (120,),
                    outline=color + (255,),
                    width=2
                )

    return img

def generate_ui_button(width=256, height=64, palette=None, text="CONTINUE", style='cyberpunk'):
    """
    Generate procedural UI buttons
    """
    if palette is None:
        palette = [
            (26, 26, 46),      # Dark background
            (138, 43, 226),    # Purple
            (0, 255, 255),     # Cyan
        ]

    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if style == 'cyberpunk':
        # Angled corners
        corner_cut = 10
        points = [
            (corner_cut, 0),
            (width - corner_cut, 0),
            (width, corner_cut),
            (width, height - corner_cut),
            (width - corner_cut, height),
            (corner_cut, height),
            (0, height - corner_cut),
            (0, corner_cut),
        ]

        # Fill
        draw.polygon(points, fill=palette[0] + (200,))

        # Neon outline
        draw.polygon(points, outline=palette[1] + (255,), width=3)

        # Inner glow line
        inner_points = [
            (corner_cut + 3, 3),
            (width - corner_cut - 3, 3),
            (width - 3, corner_cut + 3),
            (width - 3, height - corner_cut - 3),
            (width - corner_cut - 3, height - 3),
            (corner_cut + 3, height - 3),
            (3, height - corner_cut - 3),
            (3, corner_cut + 3),
        ]
        draw.polygon(inner_points, outline=palette[2] + (100,), width=1)

    # Add text (note: requires font, falls back to default)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    except:
        font = ImageFont.load_default()

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    text_x = (width - text_width) // 2
    text_y = (height - text_height) // 2 - 5

    # Text with glow
    for offset in range(3, 0, -1):
        alpha = int(100 / offset)
        draw.text((text_x, text_y), text, font=font, fill=palette[2] + (alpha,))

    draw.text((text_x, text_y), text, font=font, fill=(255, 255, 255, 255))

    return img

def generate_tile_variations(base_tile_path, num_variations=10, output_dir=None):
    """
    Generate variations of an existing tile (color shifts, rotations, flips)
    """
    base = Image.open(base_tile_path).convert('RGBA')

    variations = []
    os.makedirs(output_dir, exist_ok=True) if output_dir else None

    for i in range(num_variations):
        img = base.copy()

        # Random transformations
        if random.random() > 0.5:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)

        if random.random() > 0.7:
            img = img.transpose(Image.FLIP_TOP_BOTTOM)

        rotation = random.choice([0, 90, 180, 270])
        if rotation > 0:
            img = img.rotate(rotation, expand=True)

        # Slight color shift
        hue_shift = random.randint(-20, 20)
        img_hsv = img.convert('HSV')
        hsv_array = np.array(img_hsv)
        hsv_array[:, :, 0] = (hsv_array[:, :, 0] + hue_shift) % 256
        img = Image.fromarray(hsv_array, 'HSV').convert('RGBA')

        # Brightness variation
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(random.uniform(0.9, 1.1))

        variations.append(img)

        if output_dir:
            base_name = Path(base_tile_path).stem
            img.save(f"{output_dir}/{base_name}_var_{i:02d}.png", 'PNG', optimize=True)

    return variations

def batch_generate_assets(output_dir, palette_path=None):
    """
    Generate a complete set of procedural assets
    """
    os.makedirs(output_dir, exist_ok=True)

    # Load or create palette
    if palette_path and os.path.exists(palette_path):
        palette = load_palette_json(palette_path)
    else:
        # Default mystical cyberpunk palette
        palette = [
            (10, 10, 15),      # Deep black-blue
            (26, 26, 46),      # Dark blue
            (42, 42, 78),      # Medium blue
            (138, 43, 226),    # Purple
            (0, 255, 255),     # Cyan
            (255, 0, 255),     # Magenta
            (255, 215, 0),     # Gold
            (255, 255, 255),   # White
        ]

    generated = []

    print("Generating particle sprite sheets...")
    for i in range(3):
        path = f"{output_dir}/particles_sheet_{i:02d}.png"
        generate_particle_sheet(16, 64, palette, path)
        generated.append(path)
        print(f"  ✓ {path}")

    print("\nGenerating animated particle GIFs...")
    for i in range(5):
        path = f"{output_dir}/particle_anim_{i:02d}.gif"
        generate_animated_particle_gif(8, 128, palette, path)
        generated.append(path)
        print(f"  ✓ {path}")

    print("\nGenerating geometric tiles...")
    patterns = ['sacred_geometry', 'circuit', 'mandala']
    for pattern in patterns:
        for i in range(3):
            path = f"{output_dir}/tile_{pattern}_{i:02d}.png"
            tile = generate_geometric_tile(256, palette, pattern, seed=i)
            tile.save(path, 'PNG', optimize=True)
            generated.append(path)
            print(f"  ✓ {path}")

    print("\nGenerating UI buttons...")
    button_texts = ['CONTINUE', 'START', 'DRAW CARD', 'MENU', 'SETTINGS']
    for text in button_texts:
        path = f"{output_dir}/button_{text.lower().replace(' ', '_')}.png"
        btn = generate_ui_button(256, 64, palette, text)
        btn.save(path, 'PNG', optimize=True)
        generated.append(path)
        print(f"  ✓ {path}")

    print(f"\n✓ Generated {len(generated)} assets in {output_dir}")
    return generated

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Procedural game asset generator')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Extract palette
    palette_parser = subparsers.add_parser('extract-palette', help='Extract color palette from image')
    palette_parser.add_argument('input', help='Input image')
    palette_parser.add_argument('output', help='Output JSON file')
    palette_parser.add_argument('--colors', type=int, default=16, help='Number of colors')

    # Generate particles
    particle_parser = subparsers.add_parser('particles', help='Generate particle sprite sheet')
    particle_parser.add_argument('output', help='Output PNG file')
    particle_parser.add_argument('--count', type=int, default=16, help='Number of particles')
    particle_parser.add_argument('--size', type=int, default=64, help='Particle size')
    particle_parser.add_argument('--palette', help='Palette JSON file')

    # Generate animated GIF
    anim_parser = subparsers.add_parser('animate', help='Generate animated particle GIF')
    anim_parser.add_argument('output', help='Output GIF file')
    anim_parser.add_argument('--frames', type=int, default=8, help='Number of frames')
    anim_parser.add_argument('--size', type=int, default=128, help='Frame size')
    anim_parser.add_argument('--palette', help='Palette JSON file')

    # Generate tile
    tile_parser = subparsers.add_parser('tile', help='Generate geometric tile')
    tile_parser.add_argument('output', help='Output PNG file')
    tile_parser.add_argument('--pattern', choices=['sacred_geometry', 'circuit', 'mandala'], default='sacred_geometry')
    tile_parser.add_argument('--size', type=int, default=256, help='Tile size')
    tile_parser.add_argument('--palette', help='Palette JSON file')

    # Generate button
    button_parser = subparsers.add_parser('button', help='Generate UI button')
    button_parser.add_argument('output', help='Output PNG file')
    button_parser.add_argument('--text', default='CONTINUE', help='Button text')
    button_parser.add_argument('--width', type=int, default=256, help='Button width')
    button_parser.add_argument('--height', type=int, default=64, help='Button height')
    button_parser.add_argument('--palette', help='Palette JSON file')

    # Batch generate
    batch_parser = subparsers.add_parser('batch', help='Generate complete asset set')
    batch_parser.add_argument('output_dir', help='Output directory')
    batch_parser.add_argument('--palette', help='Palette JSON file')

    # Tile variations
    var_parser = subparsers.add_parser('variations', help='Generate tile variations')
    var_parser.add_argument('input', help='Input tile image')
    var_parser.add_argument('output_dir', help='Output directory')
    var_parser.add_argument('--count', type=int, default=10, help='Number of variations')

    args = parser.parse_args()

    if args.command == 'extract-palette':
        palette = extract_color_palette(args.input, args.colors)
        save_palette_json(palette, args.output)
        print(f"✓ Extracted {len(palette)} colors to {args.output}")

    elif args.command == 'particles':
        palette = load_palette_json(args.palette) if args.palette else None
        generate_particle_sheet(args.count, args.size, palette, args.output)
        print(f"✓ Generated particle sheet: {args.output}")

    elif args.command == 'animate':
        palette = load_palette_json(args.palette) if args.palette else None
        generate_animated_particle_gif(args.frames, args.size, palette, args.output)
        print(f"✓ Generated animated GIF: {args.output}")

    elif args.command == 'tile':
        palette = load_palette_json(args.palette) if args.palette else None
        tile = generate_geometric_tile(args.size, palette, args.pattern)
        tile.save(args.output, 'PNG', optimize=True)
        print(f"✓ Generated tile: {args.output}")

    elif args.command == 'button':
        palette = load_palette_json(args.palette) if args.palette else None
        btn = generate_ui_button(args.width, args.height, palette, args.text)
        btn.save(args.output, 'PNG', optimize=True)
        print(f"✓ Generated button: {args.output}")

    elif args.command == 'batch':
        batch_generate_assets(args.output_dir, args.palette)

    elif args.command == 'variations':
        generate_tile_variations(args.input, args.count, args.output_dir)
        print(f"✓ Generated {args.count} variations in {args.output_dir}")

    else:
        parser.print_help()
