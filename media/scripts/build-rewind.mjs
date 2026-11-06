import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, renameSync } from 'node:fs'

// Run from the repository root. Uses only the tracked, optimized editions.
const run = (tool, args) => {
  const result = spawnSync(process.env[tool.toUpperCase()] || tool, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(result.error?.message || result.stderr)
  return result.stdout
}
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const sources = ['public/media/master-1080.v1.mp4', 'public/media/room-reverse-1080.v1.mp4'].map((path) => ({ path, sha256: hash(path) }))
const outputs = []
for (const [input, name, filter, frames] of [
  [sources[0].path, 'master-reverse', 'reverse,setpts=PTS-STARTPTS', 562],
  [sources[0].path, 'master-reverse-5x', "reverse,select='not(mod(n,5))*lt(n,560)+eq(n,561)',setpts=N/(24*TB)", 113],
  [sources[1].path, 'room-reverse-5x', "select='not(mod(n,5))*lt(n,120)+eq(n,124)',setpts=N/(24*TB)", 25],
]) {
  const path = `public/media/${name}-1080.v1.mp4`
  const temporary = path.replace('.mp4', '.building.mp4')
  console.log(`Encoding ${path}`)
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-threads', '4', '-i', input, '-an', '-vf', filter, '-c:v', 'libx264', '-threads', '4', '-preset', 'slow', '-crf', name.endsWith('-5x') ? '18' : '22', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level:v', '4.1', '-r', '24', '-fps_mode', 'cfr', '-g', '24', '-movflags', '+faststart', '-map_metadata', '-1', temporary])
  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', temporary]))
  const video = probe.streams[0]
  if (probe.streams.length !== 1 || video.width !== 1920 || video.height !== 1080 || video.avg_frame_rate !== '24/1' || Number(video.nb_frames) !== frames) throw new Error(`Unexpected encode: ${path}`)
  const bytes = readFileSync(temporary)
  if (bytes.indexOf('moov') > bytes.indexOf('mdat')) throw new Error(`Missing faststart: ${path}`)
  renameSync(temporary, path)
  outputs.push({ path, sha256: hash(path), bytes: bytes.length, width: video.width, height: video.height, frames, fps: 24, duration: Number(probe.format.duration) })
}
for (const source of sources) if (hash(source.path) !== source.sha256) throw new Error(`Source changed: ${source.path}`)
writeFileSync('public/media/rewind-manifest.v1.json', JSON.stringify({ recipe: 'media/scripts/build-rewind.mjs', ffmpeg: run('ffmpeg', ['-version']).split('\n')[0], sources, outputs }, null, 2) + '\n')
