# Video Compression Guide for VeilPath

Your MP4 videos are loading slowly (30-45 seconds) because they're **too large and unoptimized**. This is NOT a server issue - it's file size.

## The Problem

- Uncompressed videos: 5-20 MB each
- Download time on average connection: 30-45 seconds
- Browser can't play until fully downloaded (no `-movflags +faststart`)

## The Solution

Compress videos to **1080p** with **H.264** encoding:
- Target size: 500KB - 2MB per video
- Quality: Excellent for monitors
- Load time: <2 seconds on average connection
- Progressive download: Starts playing immediately

---

## Quick Start

### Windows

```cmd
cd assets/art/video
compress-videos.bat
```

### Linux/Mac

```bash
cd assets/art/video
chmod +x compress-videos.sh
./compress-videos.sh
```

The scripts will:
1. Compress all MP4 files in the current directory
2. Save compressed versions to `./compressed/`
3. Show before/after file sizes
4. Preserve quality for computer monitors

---

## Technical Details

### Compression Settings

```
- Codec: H.264 (libx264) - universal browser support
- Quality: CRF 23 - excellent visual quality, good compression
- Resolution: 1080p max (1920x1080) - maintains aspect ratio
- Audio: AAC 128kbps - high quality, small size
- Preset: medium - balanced speed/compression
- Tune: film - optimized for video content
- Fast start: Yes - enables progressive download
```

### What These Settings Mean

**CRF (Constant Rate Factor)**
- Lower number = better quality, bigger file
- CRF 23 = Sweet spot for web (nearly visually lossless)
- CRF 18 = Visually lossless (larger files)
- CRF 28 = Good quality, smaller files

**-movflags +faststart**
- CRITICAL for web playback
- Moves metadata to file start
- Browser can play before full download
- Without this: 30-45 second wait
- With this: Instant playback

**Resolution Scaling**
- `scale='min(1920,iw)':'min(1080,ih)'`
- Only scales down if video is larger than 1080p
- Maintains aspect ratio
- Preserves quality for monitor viewing

---

## Manual Compression (Advanced)

If you want to compress a single video with custom settings:

### Ultra High Quality (larger files)
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 18 -preset slow -tune film \
  -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
  -c:a aac -b:a 192k -movflags +faststart output.mp4
```

### Balanced (recommended)
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -tune film \
  -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
  -c:a aac -b:a 128k -movflags +faststart output.mp4
```

### Smaller Files (good quality)
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset medium -tune film \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease" \
  -c:a aac -b:a 96k -movflags +faststart output.mp4
```

---

## Testing Results

After compression, compare:

1. **File size**: Should be 50-80% smaller
2. **Quality**: Open both videos side-by-side, check for artifacts
3. **Load speed**: Test on https://www.veilpath.app/

Target metrics:
- ✅ File size: <2 MB
- ✅ Load time: <2 seconds
- ✅ Quality: No visible compression artifacts on 1080p monitor

---

## FAQ

**Q: Will this reduce quality?**
A: Minimal. CRF 23 is nearly visually lossless. Most people can't tell the difference from uncompressed.

**Q: Why not just upgrade Vercel/Supabase?**
A: They're already serving from global CDN. File size is the bottleneck, not server speed.

**Q: Can I use WebM instead?**
A: Yes! WebM is 30-50% smaller. Use this command:
```bash
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus output.webm
```
Then use both formats with `<source>` tags.

**Q: What if videos still load slowly?**
A: Try:
1. CRF 28 (smaller files)
2. 720p instead of 1080p
3. WebM format
4. Cloudflare Stream ($1/1000 minutes delivered)

---

## Next Steps

1. **Compress videos**: Run the script
2. **Test quality**: Open `compressed/` folder, check videos
3. **Replace originals**: Move compressed versions to `assets/art/video/`
4. **Deploy**: Push to GitHub, Vercel will rebuild
5. **Verify**: Test on https://www.veilpath.app/

Expected result: **30-45 seconds → <2 seconds** ⚡

---

## Troubleshooting

**"FFmpeg not found"**
- Windows: Download from https://ffmpeg.org/download.html, add to PATH
- Mac: `brew install ffmpeg`
- Linux: `sudo apt install ffmpeg` or `sudo dnf install ffmpeg`

**"Permission denied" (Linux/Mac)**
- Run: `chmod +x compress-videos.sh`

**Videos still slow**
- Check file sizes: `ls -lh compressed/`
- If still >2MB, use CRF 28 or 720p
- Test network: https://fast.com

**Quality issues**
- Use CRF 18 for higher quality (larger files)
- Try `-tune animation` for animated content
- Compare before/after at 100% zoom

---

## Resources

- FFmpeg Documentation: https://ffmpeg.org/documentation.html
- H.264 Encoding Guide: https://trac.ffmpeg.org/wiki/Encode/H.264
- CRF Guide: https://slhck.info/video/2017/02/24/crf-guide.html
- WebM Encoding: https://trac.ffmpeg.org/wiki/Encode/VP9
