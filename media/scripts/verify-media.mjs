import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const manifest = JSON.parse(readFileSync('public/media/manifest.v1.json', 'utf8'))
const ffmpeg = process.env.FFMPEG || (existsSync('.tools/ffmpeg.exe') ? resolve('.tools/ffmpeg.exe') : 'ffmpeg')
const run = (args) => {
  const result = spawnSync(ffmpeg, ['-hide_banner', ...args], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message)
  return result.stderr
}
const metrics = { checks: [], comparisons: {} }
for (const entry of [...manifest.sources, ...manifest.outputs]) {
  const bytes = readFileSync(entry.path)
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error(`Hash changed: ${entry.path}`)
  metrics.checks.push(`${entry.path}: SHA-256 verified`)
  if (entry.path.endsWith('.mp4') && entry.path.startsWith('public/')) {
    const video = entry.ffprobe.streams[0]
    if (video.codec_name !== 'h264' || video.avg_frame_rate !== '24/1' || video.pix_fmt !== 'yuv420p' || entry.ffprobe.streams.length !== 1) throw new Error(`Encode mismatch: ${entry.path}`)
    const expected = entry.path.includes('master') ? 562 : 125
    if (Number(video.nb_frames) !== expected) throw new Error(`Lost endpoint frame: ${entry.path}`)
    if (bytes.indexOf('moov') > bytes.indexOf('mdat')) throw new Error(`No faststart: ${entry.path}`)
    metrics.checks.push(`${entry.path}: H.264 / 24 fps / yuv420p / ${expected} frames / no audio / faststart`)
  }
}
for (const resolution of [1080, 720]) {
  const forward = `public/media/room-forward-${resolution}.v1.mp4`
  const reverse = `public/media/room-reverse-${resolution}.v1.mp4`
  for (const [name, first, last] of [['reverse-start-vs-B3', 124, 0], ['reverse-end-vs-B0', 0, 124]]) {
    const output = run(['-i', forward, '-i', reverse, '-filter_complex', `[0:v]select=eq(n\\,${first}),setpts=PTS-STARTPTS[a];[1:v]select=eq(n\\,${last}),setpts=PTS-STARTPTS[b];[a][b]ssim`, '-an', '-f', 'null', '-'])
    const score = Number(output.match(/All:([\d.]+)/)?.[1])
    if (!(score > .97)) throw new Error(`Reverse endpoint mismatch: ${name} ${score}`)
    metrics.comparisons[`${resolution}-${name}-ssim`] = score
  }
}
const output = run(['-i', 'media/source/master-original.mp4', '-i', 'public/media/master-1080.v1.mp4', '-filter_complex', '[0:v]setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]ssim', '-an', '-f', 'null', '-'])
metrics.comparisons['1080-master-vs-source-average-ssim'] = Number(output.match(/All:([\d.]+)/)?.[1])
mkdirSync('docs/evidence/package-01', { recursive: true })
writeFileSync('docs/evidence/package-01/media-qa.json', JSON.stringify(metrics, null, 2) + '\n')
console.log(JSON.stringify(metrics, null, 2))
