# 02 — Media and asset pipeline

## Verified input metadata

| Source | Duration | Geometry | FPS | File bytes | Notes |
| --- | ---: | --- | --- | ---: | --- |
| Cinematic Master | 23.416667s | 1920×1080 | 24 constant | 50,570,857 | H.264 High level 4.1, yuv420p, no audio |
| Room Branch V3 | 5.183333s | 1920×1088 | average 7500/311 (~24.1158), nominal r=60 | 36,168,419 | H.264 High level 5.0, 125 frames, yuv420p, no audio |
| B0 Reconstructed | image | 1665×944 | n/a | ~3.2MB | Key still, slight aspect mismatch to master 16:9 |

Names in original conversation are `RUEGG_Cinematic_Master_1080p(1).mp4`, `hallway to room.mp4`, `B0 Reconstructed(1).png`. These files are not guaranteed present in any user's local repo automatically.

## FFmpeg pipeline principles

1. Verify binaries with `ffprobe` and hashes before processing; preserve originals unchanged and outside git.
2. Produce 1080p desktop and 720p mobile variants, H.264/yuv420p, MP4 `+faststart`, reasonable bitrate/quality tradeoff, with documented deterministic commands. Optional WebM/AV1 only after real support/benefit check. Never rely on video `preload=auto` alone.
3. Master timebase fixed at 24 fps; include frame-accurate checkpoints. Reception proposed 10.000s; hallway **17.125s (exact frame 411 at 24fps)**; final freeze comes from actual last decodable frame (562 total frame slots; frame index 561 around 23.375s), not from seeking exactly to `duration`.
4. Branch V3 needs clean 16:9: crop 4 pixels top and bottom (`crop=1920:1080:0:4`) when acceptable in visual QA rather than nonuniform stretching. Normalize using `fps=24`. Preserve first B0 and final B3 visual alignment. Validate frame count and avoid duplicate / discontinuous beginning or ending.
5. Create reverse **from optimized forward frames** via FFmpeg `reverse` filter. Runtime reverse playbackRate is not a reliable cross-browser fallback. Check: reverse first equals forward B3, reverse last equals B0 within encoding tolerance.
6. Export stills: hero start, reception exact stop, B0 poster (letterbox/crop calibrated without stretching), B3 final from processed branch, finale last frame. Optimize to WebP/AVIF + fallback where appropriate. Include source files in provenance manifest.
7. Reproduce with a small `media/scripts/build-media.sh` (POSIX or documented Windows PowerShell alternative), with `ffmpeg` version and actual source paths. Treat scripts as tools, not deployment-time build dependencies when media have been pre-generated.
8. Use content hashes or versioned filenames in deployed URL. Set `media.sourceBaseUrl` environment/config once; do not hardcode 50MB originals.

## FFmpeg reference (Codex must verify each command rather than blindly execute)

```bash
# Master: keep 24 fps and original geometry; CRF chosen as quality starting point.
ffmpeg -i media/source/master-original.mp4 -an \
  -vf 'fps=24,format=yuv420p' -c:v libx264 -preset slow -crf 22 \
  -profile:v high -level:v 4.1 -g 48 -movflags +faststart \
  public/media/master-1080.mp4

# Branch: center-crop 8 vertical pixels and normalize source VFR to 24 fps.
ffmpeg -i media/source/room-v3-original.mp4 -an \
  -vf 'crop=1920:1080:0:4,fps=24,format=yuv420p' \
  -c:v libx264 -preset slow -crf 22 -profile:v high -level:v 4.1 \
  -g 48 -movflags +faststart public/media/room-forward-1080.mp4

# Reverse is a separate MP4 (branch is only ~5 seconds).
ffmpeg -i public/media/room-forward-1080.mp4 -an -vf reverse \
  -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
  -movflags +faststart public/media/room-reverse-1080.mp4
```

For 720p outputs apply `scale=1280:720` after crop/fps. FFmpeg `reverse` buffer is acceptable on this very short clip but not on 23s master unless justified. Set optional keyframe forcing at 10.000s and 17.125s if measured seeking benefits from it. `-crf 22` is an initial proposal, not magic: inspect bitrate, target size and perceived quality. Verify constant fps/no unexpected audio and `moov` at start.

## Media runtime

- `masterVideo` and one `branchVideo`, plus static still overlay: never keep master, forward, reverse all decoding simultaneously.
- On entry to room, master paused at 17.125 and B0 remains visible until branch decoded first frame. On B3 show still; on reverse display B3 until reverse first frame decoded. Return to B0 and reveal master paused on same frame before Continue.
- On interruption use `AbortController`/version token for stale async events. Handle `playing`, `waiting`, `stalled`, `seeked`, `error`.
- Test on Safari iOS and Chrome Android; signed encode parameters and 1920×1088 original require careful mobile QA.
- Source audio streams absent. Do not suggest a mute/unmute feature as functional until actual sound design is provided; accessible dormant control acceptable only if explicitly labelled unavailable.

## Risks

- Original B0 still aspect ratio 1665/944 = ~1.76377, slightly different from 16/9. Choose intentional contain/crop with measured alignment instead of stretching.
- Master pause 17.125 is an *approved* timecode; exact displayed frame can differ slightly by browser/timing. Use frame timestamps plus still overlay to eliminate visible drift; no timeupdate-only guarantee.
- Browser may delay `play()` despite user gesture if asynchronous work breaks the gesture chain; keep initiation close to direct click and present transparent loading/error fallback.
