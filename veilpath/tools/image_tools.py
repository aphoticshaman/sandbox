#!/usr/bin/env python3
"""
IMAGE MANIPULATION TOOLS FOR GAME ASSETS
Claude Code can run these to fix Midjourney inconsistencies
"""

import os
import sys
from PIL import Image, ImageEnhance, ImageFilter, ImageChops
import numpy as np
from pathlib import Path

def normalize_colors(image_path, reference_path=None, output_path=None):
    """
    Match colors of image to a reference image
    If no reference, auto-normalize to consistent palette
    """
    img = Image.open(image_path).convert('RGB')

    if reference_path:
        # Match to reference image
        ref = Image.open(reference_path).convert('RGB')
        img_array = np.array(img, dtype=np.float32)
        ref_array = np.array(ref, dtype=np.float32)

        # Calculate mean and std for each channel
        img_mean = img_array.mean(axis=(0, 1))
        img_std = img_array.std(axis=(0, 1))
        ref_mean = ref_array.mean(axis=(0, 1))
        ref_std = ref_array.std(axis=(0, 1))

        # Normalize
        normalized = (img_array - img_mean) / (img_std + 1e-6) * ref_std + ref_mean
        normalized = np.clip(normalized, 0, 255).astype(np.uint8)

        result = Image.fromarray(normalized)
    else:
        # Auto-normalize (enhance contrast, fix colors)
        # Adjust brightness to consistent level
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(1.1)

        # Boost contrast slightly
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.2)

        # Adjust color saturation
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.15)

        result = img

    if output_path:
        result.save(output_path, 'PNG', optimize=True)

    return result

def remove_background(image_path, output_path=None, threshold=240):
    """
    Remove white/light backgrounds, make transparent
    """
    img = Image.open(image_path).convert('RGBA')
    data = np.array(img)

    # Create mask for pixels that are close to white
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    white_mask = (r > threshold) & (g > threshold) & (b > threshold)

    # Set alpha to 0 for white pixels
    data[:,:,3] = np.where(white_mask, 0, a)

    result = Image.fromarray(data, 'RGBA')

    if output_path:
        result.save(output_path, 'PNG', optimize=True)

    return result

def auto_crop(image_path, output_path=None, border=10):
    """
    Auto-crop to content (remove empty borders)
    """
    img = Image.open(image_path)

    if img.mode == 'RGBA':
        # Crop based on alpha channel
        bbox = img.split()[-1].getbbox()
    else:
        # Crop based on content vs background
        bg = Image.new(img.mode, img.size, img.getpixel((0,0)))
        diff = ImageChops.difference(img, bg)
        diff = ImageChops.add(diff, diff, 2.0, -100)
        bbox = diff.getbbox()

    if bbox:
        # Add border
        bbox = (
            max(0, bbox[0] - border),
            max(0, bbox[1] - border),
            min(img.width, bbox[2] + border),
            min(img.height, bbox[3] + border)
        )
        result = img.crop(bbox)
    else:
        result = img

    if output_path:
        result.save(output_path, 'PNG', optimize=True)

    return result

def resize_asset(image_path, width, height, output_path=None):
    """
    Resize with high-quality resampling
    """
    img = Image.open(image_path)
    result = img.resize((width, height), Image.Resampling.LANCZOS)

    if output_path:
        result.save(output_path, 'PNG', optimize=True)

    return result

def create_sprite_sheet(image_paths, columns, output_path, frame_width=256, frame_height=256):
    """
    Combine multiple images into a sprite sheet
    """
    images = [Image.open(p).convert('RGBA') for p in image_paths]

    # Resize all to same size
    images = [img.resize((frame_width, frame_height), Image.Resampling.LANCZOS) for img in images]

    rows = (len(images) + columns - 1) // columns
    sheet_width = columns * frame_width
    sheet_height = rows * frame_height

    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))

    for i, img in enumerate(images):
        x = (i % columns) * frame_width
        y = (i // columns) * frame_height
        sheet.paste(img, (x, y))

    sheet.save(output_path, 'PNG', optimize=True)
    return sheet

def optimize_file_size(image_path, output_path=None, quality=85):
    """
    Reduce file size while maintaining quality
    """
    img = Image.open(image_path)

    # Convert to RGB if saving as JPEG
    if output_path and output_path.lower().endswith('.jpg'):
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        img.save(output_path, 'JPEG', quality=quality, optimize=True)
    else:
        # PNG optimization
        if not output_path:
            output_path = image_path
        img.save(output_path, 'PNG', optimize=True, compress_level=9)

    return img

def add_outline(image_path, outline_color=(0, 0, 0), outline_width=2, output_path=None):
    """
    Add outline to sprite (useful for game assets)
    """
    img = Image.open(image_path).convert('RGBA')

    # Create outline by dilating alpha channel
    alpha = img.split()[-1]
    outline_mask = alpha.filter(ImageFilter.MaxFilter(outline_width * 2 + 1))

    # Create outline image
    outline = Image.new('RGBA', img.size, outline_color + (255,))
    outline.putalpha(outline_mask)

    # Composite: outline behind original
    result = Image.alpha_composite(outline, img)

    if output_path:
        result.save(output_path, 'PNG', optimize=True)

    return result

def batch_process(input_dir, output_dir, operation, **kwargs):
    """
    Apply operation to all images in directory
    """
    os.makedirs(output_dir, exist_ok=True)

    operations = {
        'normalize': normalize_colors,
        'remove_bg': remove_background,
        'crop': auto_crop,
        'outline': add_outline,
        'optimize': optimize_file_size
    }

    if operation not in operations:
        print(f"Unknown operation: {operation}")
        return

    func = operations[operation]
    processed = 0

    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)

            try:
                func(input_path, output_path=output_path, **kwargs)
                processed += 1
                print(f"✓ {filename}")
            except Exception as e:
                print(f"✗ {filename}: {e}")

    print(f"\nProcessed {processed} images")

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Image manipulation tools for game assets')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Normalize colors
    normalize_parser = subparsers.add_parser('normalize', help='Normalize colors')
    normalize_parser.add_argument('input', help='Input image')
    normalize_parser.add_argument('output', help='Output image')
    normalize_parser.add_argument('--reference', help='Reference image for color matching')

    # Remove background
    bg_parser = subparsers.add_parser('remove-bg', help='Remove background')
    bg_parser.add_argument('input', help='Input image')
    bg_parser.add_argument('output', help='Output image')
    bg_parser.add_argument('--threshold', type=int, default=240, help='White threshold (0-255)')

    # Auto crop
    crop_parser = subparsers.add_parser('crop', help='Auto-crop to content')
    crop_parser.add_argument('input', help='Input image')
    crop_parser.add_argument('output', help='Output image')
    crop_parser.add_argument('--border', type=int, default=10, help='Border pixels to keep')

    # Resize
    resize_parser = subparsers.add_parser('resize', help='Resize image')
    resize_parser.add_argument('input', help='Input image')
    resize_parser.add_argument('output', help='Output image')
    resize_parser.add_argument('width', type=int, help='Width')
    resize_parser.add_argument('height', type=int, help='Height')

    # Sprite sheet
    sheet_parser = subparsers.add_parser('sprite-sheet', help='Create sprite sheet')
    sheet_parser.add_argument('inputs', nargs='+', help='Input images')
    sheet_parser.add_argument('--output', required=True, help='Output sprite sheet')
    sheet_parser.add_argument('--columns', type=int, default=8, help='Columns')
    sheet_parser.add_argument('--width', type=int, default=256, help='Frame width')
    sheet_parser.add_argument('--height', type=int, default=256, help='Frame height')

    # Optimize
    opt_parser = subparsers.add_parser('optimize', help='Optimize file size')
    opt_parser.add_argument('input', help='Input image')
    opt_parser.add_argument('output', help='Output image')
    opt_parser.add_argument('--quality', type=int, default=85, help='JPEG quality (1-100)')

    # Add outline
    outline_parser = subparsers.add_parser('outline', help='Add outline')
    outline_parser.add_argument('input', help='Input image')
    outline_parser.add_argument('output', help='Output image')
    outline_parser.add_argument('--width', type=int, default=2, help='Outline width')
    outline_parser.add_argument('--color', default='0,0,0', help='Outline color (R,G,B)')

    # Batch process
    batch_parser = subparsers.add_parser('batch', help='Batch process directory')
    batch_parser.add_argument('input_dir', help='Input directory')
    batch_parser.add_argument('output_dir', help='Output directory')
    batch_parser.add_argument('operation', choices=['normalize', 'remove_bg', 'crop', 'outline', 'optimize'])

    args = parser.parse_args()

    if args.command == 'normalize':
        normalize_colors(args.input, args.reference, args.output)
        print(f"✓ Normalized: {args.output}")

    elif args.command == 'remove-bg':
        remove_background(args.input, args.output, args.threshold)
        print(f"✓ Background removed: {args.output}")

    elif args.command == 'crop':
        auto_crop(args.input, args.output, args.border)
        print(f"✓ Cropped: {args.output}")

    elif args.command == 'resize':
        resize_asset(args.input, args.width, args.height, args.output)
        print(f"✓ Resized: {args.output}")

    elif args.command == 'sprite-sheet':
        create_sprite_sheet(args.inputs, args.columns, args.output, args.width, args.height)
        print(f"✓ Sprite sheet created: {args.output}")

    elif args.command == 'optimize':
        optimize_file_size(args.input, args.output, args.quality)
        print(f"✓ Optimized: {args.output}")

    elif args.command == 'outline':
        color = tuple(map(int, args.color.split(',')))
        add_outline(args.input, color, args.width, args.output)
        print(f"✓ Outline added: {args.output}")

    elif args.command == 'batch':
        batch_process(args.input_dir, args.output_dir, args.operation)

    else:
        parser.print_help()
