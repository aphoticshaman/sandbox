#!/usr/bin/env python3
"""
Extract individual buttons from sprite sheets
"""

from PIL import Image
import os

# Configuration
CURATED_DIR = '/home/user/HungryOrca/assets/art/curated'
OUTPUT_DIR = '/home/user/HungryOrca/assets/art/curated/buttons'

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ═══════════════════════════════════════════════════════════
# MAIN BUTTON SET (2176 x 544) - 8x2 grid of 272x272 buttons
# ═══════════════════════════════════════════════════════════

main_buttons = [
    # Row 0
    {'name': 'gold_sun', 'row': 0, 'col': 0},
    {'name': 'purple_crystal', 'row': 0, 'col': 1},
    {'name': 'cyan_tech', 'row': 0, 'col': 2},
    {'name': 'purple_moon', 'row': 0, 'col': 3},
    {'name': 'purple_skull', 'row': 0, 'col': 4},
    {'name': 'gold_goddess', 'row': 0, 'col': 5},
    {'name': 'gold_wolf', 'row': 0, 'col': 6},
    {'name': 'cyan_diamond', 'row': 0, 'col': 7},
    # Row 1
    {'name': 'cyan_portal', 'row': 1, 'col': 0},
    {'name': 'gold_blank', 'row': 1, 'col': 1},
    {'name': 'cyan_crystal', 'row': 1, 'col': 2},
    {'name': 'purple_flame', 'row': 1, 'col': 3},
    {'name': 'purple_circuit', 'row': 1, 'col': 4},
    {'name': 'gold_triangle', 'row': 1, 'col': 5},
    {'name': 'blue_star', 'row': 1, 'col': 6},
    {'name': 'purple_eye', 'row': 1, 'col': 7},
]

print("Extracting main buttons...")
img = Image.open(f'{CURATED_DIR}/buttons_main_set.png')
cell_size = 272

for btn in main_buttons:
    x = btn['col'] * cell_size
    y = btn['row'] * cell_size

    # Crop button
    button_img = img.crop((x, y, x + cell_size, y + cell_size))

    # Save
    output_path = f"{OUTPUT_DIR}/btn_{btn['name']}.png"
    button_img.save(output_path, 'PNG')
    print(f"  ✓ {btn['name']}: {output_path}")

print(f"\n✅ Extracted {len(main_buttons)} main buttons")

# ═══════════════════════════════════════════════════════════
# ICON SET (1024 x 1024) - 4x4 grid of 256x256 icons
# ═══════════════════════════════════════════════════════════

icons = [
    # Row 0
    {'name': 'hex_star', 'row': 0, 'col': 0},
    {'name': 'diamond_star', 'row': 0, 'col': 1},
    {'name': 'circle_target', 'row': 0, 'col': 2},
    {'name': 'wind', 'row': 0, 'col': 3},
    # Row 1
    {'name': 'gear_hex', 'row': 1, 'col': 0},
    {'name': 'compass', 'row': 1, 'col': 1},
    {'name': 'target', 'row': 1, 'col': 2},
    {'name': 'close_x', 'row': 1, 'col': 3},
    # Row 2
    {'name': 'infinity', 'row': 2, 'col': 0},
    {'name': 'heart', 'row': 2, 'col': 1},
    {'name': 'hourglass', 'row': 2, 'col': 2},
    {'name': 'crystal', 'row': 2, 'col': 3},
    # Row 3
    {'name': 'crosshair', 'row': 3, 'col': 0},
    {'name': 'star_burst', 'row': 3, 'col': 1},
    {'name': 'clover', 'row': 3, 'col': 2},
    {'name': 'scroll', 'row': 3, 'col': 3},
]

print("\nExtracting icons...")
img = Image.open(f'{CURATED_DIR}/buttons_icon_set.png')
cell_size = 256

for icon in icons:
    x = icon['col'] * cell_size
    y = icon['row'] * cell_size

    # Crop icon
    icon_img = img.crop((x, y, x + cell_size, y + cell_size))

    # Save
    output_path = f"{OUTPUT_DIR}/icon_{icon['name']}.png"
    icon_img.save(output_path, 'PNG')
    print(f"  ✓ {icon['name']}: {output_path}")

print(f"\n✅ Extracted {len(icons)} icons")
print(f"\n🎉 All done! Buttons saved to: {OUTPUT_DIR}")
