import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'

// Portable Node entry point: PowerShell, Git Bash, WSL, macOS and Linux.
const bin = (name) => process.env[name.toUpperCase()] || (existsSync(`.tools/${name}.exe`) ? resolve(`.tools/${name}.exe`) : name)
function run(tool, args) {
  const result = spawnSync(bin(tool), args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(`${tool}: ${result.error?.message || result.stderr}`)
  return result.stdout
}
const probe = (file) => JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]))
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const sources = ['master-original.mp4', 'room-v3-original.mp4', 'b0-reconstructed-original.png'].map((name) => {
  const path = `media/source/${name}`
  if (!existsSync(path)) throw new Error(`Missing original: ${path}. Supply the approved asset; no replacement footage is used.`)
  return { path, sha256: hash(path), bytes: statSync(path).size, ffprobe: probe(path) }
})
for (const dir of ['public/media', 'public/posters']) mkdirSync(dir, { recursive: true })
const encode = ['-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level:v', '4.1', '-g', '48', '-movflags', '+faststart', '-map_metadata', '-1']
const outputs = []
for (const height of [1080, 720]) {
  const width = height === 1080 ? 1920 : 1280
  const master = `public/media/master-${height}.v1.mp4`
  const forward = `public/media/room-forward-${height}.v1.mp4`
  const reverse = `public/media/room-reverse-${height}.v1.mp4`
  for (const [input, filter, output, extra] of [
    ['media/source/master-original.mp4', `fps=24,scale=${width}:${height},setsar=1`, master, ['-force_key_frames', '10,17.125']],
    ['media/source/room-v3-original.mp4', `crop=1920:1080:0:4,fps=24:eof_action=pass,scale=${width}:${height},setsar=1`, forward, []],
    [forward, 'reverse', reverse, ['-force_key_frames', '0,5.166667']],
  ]) {
    console.log(`Processing ${output}`)
    if (!(process.argv.includes('--branches-only') && input.includes('master-original')) && !(process.argv.includes('--reverse-only') && !output.includes('reverse'))) {
      const temporary = output.replace('.mp4', '.building.mp4')
      run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-an', '-vf', filter, ...encode, '-crf', input.includes('master-original') ? '28' : output.includes('reverse') ? '22' : '26', ...extra, temporary])
      renameSync(temporary, output)
    }
    const metadata = probe(output)
    const video = metadata.streams.find((stream) => stream.codec_type === 'video')
    if (video.avg_frame_rate !== '24/1' || video.width !== width || video.height !== height || metadata.streams.length !== 1) throw new Error(`Invalid output: ${output}`)
    const bytes = readFileSync(output)
    if (bytes.indexOf(Buffer.from('moov')) > bytes.indexOf(Buffer.from('mdat'))) throw new Error(`faststart missing: ${output}`)
    outputs.push({ path: output, sha256: hash(output), bytes: bytes.length, ffprobe: metadata })
  }
}
const branchFrames = Number(probe('public/media/room-forward-1080.v1.mp4').streams[0].nb_frames)
const posters = [
  ['hero', 'public/media/master-1080.v1.mp4', 'select=eq(n\\,0)'],
  ['reception', 'public/media/master-1080.v1.mp4', 'select=eq(n\\,240)'],
  ['hallway', 'media/source/b0-reconstructed-original.png', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1'],
  ['room', 'public/media/room-forward-1080.v1.mp4', `select=eq(n\\,${branchFrames - 1})`],
  ['finale', 'public/media/master-1080.v1.mp4', 'select=eq(n\\,561)'],
]
for (const [name, input, filter] of posters) {
  const path = `public/posters/${name}.v1.webp`
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-vf', filter, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '86', path])
  outputs.push({ path, sha256: hash(path), bytes: statSync(path).size })
}
for (const source of sources) if (hash(source.path) !== source.sha256) throw new Error(`Original modified: ${source.path}`)
writeFileSync('public/media/manifest.v1.json', JSON.stringify({
  ffmpeg: run('ffmpeg', ['-version']).split('\n')[0],
  recipe: 'media/scripts/build-media.mjs',
  checkpoints: { reception: 10, hallway: 17.125, finale: 561 / 24, roomLast: (branchFrames - 1) / 24 },
  notes: ['Source files unchanged and excluded from Git.', 'B0 center-cropped to 16:9 without stretching.', 'Reverse encoded from each normalized forward variant.', 'Branch eof_action=pass preserves the genuine final source frame; normalized duration is 125/24 = 5.208333s.'],
  sources, outputs,
}, null, 2) + '\n')
console.table(outputs.map(({ path, bytes }) => ({ path, bytes })))
