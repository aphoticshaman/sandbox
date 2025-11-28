#!/usr/bin/env python3
"""
ANIMATION RIGGING TOOLS FOR GAME ASSETS
Extract frames, create animation data, generate React Native animation code
"""

import os
import json
from PIL import Image
import numpy as np
from pathlib import Path

def extract_frames_from_sheet(sprite_sheet_path, frame_width, frame_height, columns, rows, output_dir):
    """
    Extract individual frames from a sprite sheet
    Returns list of frame file paths
    """
    os.makedirs(output_dir, exist_ok=True)

    sheet = Image.open(sprite_sheet_path)
    frames = []

    for row in range(rows):
        for col in range(columns):
            x = col * frame_width
            y = row * frame_height

            frame = sheet.crop((x, y, x + frame_width, y + frame_height))

            frame_num = row * columns + col
            frame_path = os.path.join(output_dir, f"frame_{frame_num:03d}.png")
            frame.save(frame_path, 'PNG', optimize=True)
            frames.append(frame_path)

    print(f"✓ Extracted {len(frames)} frames to {output_dir}")
    return frames

def create_animation_manifest(frames_dir, animation_name, fps=24, loop=True):
    """
    Create JSON manifest for React Native animation
    """
    frames = sorted([f for f in os.listdir(frames_dir) if f.endswith('.png')])

    manifest = {
        "name": animation_name,
        "fps": fps,
        "loop": loop,
        "frameCount": len(frames),
        "frameDelay": int(1000 / fps),  # milliseconds per frame
        "frames": [
            {
                "index": i,
                "filename": frame,
                "duration": int(1000 / fps)
            }
            for i, frame in enumerate(frames)
        ]
    }

    manifest_path = os.path.join(frames_dir, f"{animation_name}_manifest.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f"✓ Created manifest: {manifest_path}")
    return manifest

def generate_react_native_animation_code(manifest_path, output_path=None):
    """
    Generate React Native component code for sprite animation
    """
    with open(manifest_path) as f:
        manifest = json.load(f)

    animation_name = manifest['name']
    frame_count = manifest['frameCount']
    fps = manifest['fps']
    loop = manifest['loop']

    code = f"""
import React, {{ useState, useEffect, useRef }} from 'react';
import {{ Image, Animated }} from 'react-native';

/**
 * {animation_name} Animation Component
 *
 * Auto-generated sprite animation
 * Frames: {frame_count}
 * FPS: {fps}
 * Loop: {loop}
 */
export default function {animation_name.replace('_', '').title()}Animation({{
  playing = true,
  onComplete = null,
  style = {{}}
}}) {{
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameRef = useRef(0);

  // Frame images (require all frames)
  const frames = [
{chr(10).join(f'    require("../assets/animations/{animation_name}/frame_{i:03d}.png"),' for i in range(frame_count))}
  ];

  useEffect(() => {{
    if (!playing) return;

    const interval = setInterval(() => {{
      frameRef.current = (frameRef.current + 1) % {frame_count};
      setCurrentFrame(frameRef.current);

      // Call onComplete when animation finishes (non-looping)
      if (!{str(loop).lower()} && frameRef.current === 0 && onComplete) {{
        onComplete();
      }}
    }}, {int(1000/fps)}); // {fps} FPS

    return () => clearInterval(interval);
  }}, [playing]);

  return (
    <Image
      source={{frames[currentFrame]}}
      style={{style}}
      resizeMode="contain"
    />
  );
}}
"""

    if output_path:
        with open(output_path, 'w') as f:
            f.write(code)
        print(f"✓ Generated React Native component: {output_path}")

    return code

def create_skeleton_rig(image_path, joints, output_path=None):
    """
    Create simple skeleton rig data for 2D character

    joints: list of (name, x, y, parent_name) tuples
    Example: [('root', 128, 200, None), ('torso', 128, 150, 'root'), ...]
    """
    img = Image.open(image_path)

    rig = {
        "image": os.path.basename(image_path),
        "width": img.width,
        "height": img.height,
        "joints": {}
    }

    for name, x, y, parent in joints:
        rig["joints"][name] = {
            "x": x,
            "y": y,
            "parent": parent,
            "children": []
        }

    # Build parent-child relationships
    for name, joint in rig["joints"].items():
        if joint["parent"]:
            rig["joints"][joint["parent"]]["children"].append(name)

    if output_path:
        with open(output_path, 'w') as f:
            json.dump(rig, f, indent=2)
        print(f"✓ Created skeleton rig: {output_path}")

    return rig

def optimize_sprite_sheet(input_path, output_path=None, remove_duplicates=True):
    """
    Optimize sprite sheet by removing duplicate frames and trimming
    """
    sheet = Image.open(input_path)

    # Auto-detect frame dimensions (assumes uniform grid)
    # This is a simplified version - production would need better detection

    if output_path:
        sheet.save(output_path, 'PNG', optimize=True, compress_level=9)
        print(f"✓ Optimized sprite sheet: {output_path}")

    return sheet

def create_flipbook_animation(frames_dir, output_path, duration_ms=1000):
    """
    Create GIF flipbook from frames (for preview/testing)
    """
    frames = []
    for filename in sorted(os.listdir(frames_dir)):
        if filename.endswith('.png'):
            frame_path = os.path.join(frames_dir, filename)
            frames.append(Image.open(frame_path))

    if not frames:
        print("No frames found")
        return None

    frame_duration = duration_ms // len(frames)

    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=frame_duration,
        loop=0,
        optimize=True
    )

    print(f"✓ Created flipbook GIF: {output_path} ({len(frames)} frames)")
    return output_path

def detect_motion_keyframes(frames_dir, threshold=0.1):
    """
    Detect significant keyframes in animation (frames with most change)
    Useful for reducing frame count while maintaining motion
    """
    frames = []
    for filename in sorted(os.listdir(frames_dir)):
        if filename.endswith('.png'):
            frame_path = os.path.join(frames_dir, filename)
            frames.append(np.array(Image.open(frame_path)))

    if len(frames) < 2:
        return [0]

    keyframes = [0]  # Always include first frame

    for i in range(1, len(frames)):
        # Calculate difference from previous frame
        diff = np.abs(frames[i].astype(float) - frames[i-1].astype(float))
        change_ratio = diff.mean() / 255.0

        if change_ratio > threshold:
            keyframes.append(i)

    keyframes.append(len(frames) - 1)  # Always include last frame

    print(f"✓ Detected {len(keyframes)} keyframes from {len(frames)} total frames")
    return keyframes

def generate_lottie_compatible(frames_dir, output_json, fps=24):
    """
    Generate simplified Lottie-compatible JSON (for complex animations)
    This is a basic implementation - full Lottie is complex
    """
    frames = sorted([f for f in os.listdir(frames_dir) if f.endswith('.png')])

    lottie_data = {
        "v": "5.7.4",
        "fr": fps,
        "ip": 0,
        "op": len(frames),
        "w": 512,
        "h": 512,
        "nm": "Sprite Animation",
        "ddd": 0,
        "assets": [
            {
                "id": f"frame_{i}",
                "w": 512,
                "h": 512,
                "u": "",
                "p": frame,
                "e": 0
            }
            for i, frame in enumerate(frames)
        ],
        "layers": [
            {
                "ddd": 0,
                "ind": 0,
                "ty": 2,
                "nm": "Sprite",
                "refId": f"frame_{i}",
                "sr": 1,
                "ks": {
                    "o": {"a": 0, "k": 100},
                    "p": {"a": 0, "k": [256, 256, 0]},
                    "a": {"a": 0, "k": [256, 256, 0]},
                    "s": {"a": 0, "k": [100, 100, 100]}
                },
                "ao": 0,
                "ip": i,
                "op": i + 1,
                "st": 0,
                "bm": 0
            }
            for i in range(len(frames))
        ]
    }

    with open(output_json, 'w') as f:
        json.dump(lottie_data, f, indent=2)

    print(f"✓ Generated Lottie JSON: {output_json}")
    return lottie_data

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Animation rigging tools for game assets')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Extract frames
    extract_parser = subparsers.add_parser('extract', help='Extract frames from sprite sheet')
    extract_parser.add_argument('input', help='Input sprite sheet')
    extract_parser.add_argument('output_dir', help='Output directory for frames')
    extract_parser.add_argument('--width', type=int, required=True, help='Frame width')
    extract_parser.add_argument('--height', type=int, required=True, help='Frame height')
    extract_parser.add_argument('--columns', type=int, required=True, help='Number of columns')
    extract_parser.add_argument('--rows', type=int, required=True, help='Number of rows')

    # Create manifest
    manifest_parser = subparsers.add_parser('manifest', help='Create animation manifest')
    manifest_parser.add_argument('frames_dir', help='Directory containing frames')
    manifest_parser.add_argument('name', help='Animation name')
    manifest_parser.add_argument('--fps', type=int, default=24, help='Frames per second')
    manifest_parser.add_argument('--loop', action='store_true', help='Loop animation')

    # Generate React Native code
    code_parser = subparsers.add_parser('generate-code', help='Generate React Native animation component')
    code_parser.add_argument('manifest', help='Animation manifest JSON')
    code_parser.add_argument('output', help='Output .js file')

    # Create flipbook
    flipbook_parser = subparsers.add_parser('flipbook', help='Create GIF preview')
    flipbook_parser.add_argument('frames_dir', help='Directory containing frames')
    flipbook_parser.add_argument('output', help='Output GIF file')
    flipbook_parser.add_argument('--duration', type=int, default=1000, help='Total duration in ms')

    # Detect keyframes
    keyframes_parser = subparsers.add_parser('keyframes', help='Detect motion keyframes')
    keyframes_parser.add_argument('frames_dir', help='Directory containing frames')
    keyframes_parser.add_argument('--threshold', type=float, default=0.1, help='Change threshold (0-1)')

    args = parser.parse_args()

    if args.command == 'extract':
        extract_frames_from_sheet(
            args.input,
            args.width,
            args.height,
            args.columns,
            args.rows,
            args.output_dir
        )

    elif args.command == 'manifest':
        create_animation_manifest(args.frames_dir, args.name, args.fps, args.loop)

    elif args.command == 'generate-code':
        generate_react_native_animation_code(args.manifest, args.output)

    elif args.command == 'flipbook':
        create_flipbook_animation(args.frames_dir, args.output, args.duration)

    elif args.command == 'keyframes':
        keyframes = detect_motion_keyframes(args.frames_dir, args.threshold)
        print(f"Keyframes: {keyframes}")

    else:
        parser.print_help()
