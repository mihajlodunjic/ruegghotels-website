import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
const run = (tool, args) => {
  const result = spawnSync(process.env[tool.toUpperCase()] || tool, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(result.error?.message || result.stderr)
  return tool === 'ffmpeg' ? result.stderr : result.stdout
}
const manifest = JSON.parse(readFileSync('public/media/rewind-manifest.v1.json', 'utf8'))
const checks = []
for (const entry of [...manifest.sources, ...manifest.outputs]) {
  const bytes = readFileSync(entry.path)
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error(`Changed asset: ${entry.path}`)
  if (entry.frames) {
    const { streams } = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', entry.path]))
    const stream = streams[0]
    if (streams.length !== 1 || stream.width !== 1920 || stream.height !== 1080 || stream.codec_name !== 'h264' || stream.pix_fmt !== 'yuv420p' || stream.avg_frame_rate !== '24/1' || Number(stream.nb_frames) !== entry.frames || bytes.indexOf('moov') > bytes.indexOf('mdat')) throw new Error(`Invalid encode: ${entry.path}`)
  }
  checks.push(`${entry.path}: verified`)
}
function ssim(a, b, filter) {
  const output = run('ffmpeg', ['-hide_banner', '-threads', '4', '-i', a, '-threads', '4', '-i', b, '-filter_complex_threads', '4', '-filter_complex', filter, '-an', '-f', 'null', '-'])
  const score = Number(output.match(/All:([\d.]+)/)?.[1])
  if (!(score > .97)) throw new Error(`Image comparison failed: ${score}`)
  return score
}
const quality = { masterReverse: ssim(manifest.sources[0].path, manifest.outputs[0].path, '[0:v]reverse,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]ssim') }
for (const [normal, fast, last, fastLast] of [
  [manifest.outputs[0].path, manifest.outputs[1].path, 561, 112],
  [manifest.sources[1].path, manifest.outputs[2].path, 124, 24],
]) for (const [name, from, to] of [['start', 0, 0], ['end', last, fastLast]]) {
  quality[`${fast}-${name}`] = ssim(normal, fast, `[0:v]select=eq(n\\,${from}),setpts=PTS-STARTPTS[a];[1:v]select=eq(n\\,${to}),setpts=PTS-STARTPTS[b];[a][b]ssim`)
}
console.log(JSON.stringify({ checks, quality }, null, 2))
