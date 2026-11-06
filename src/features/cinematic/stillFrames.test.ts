import { afterEach, describe, expect, it, vi } from 'vitest'
import { StillFrameBuffer } from './stillFrames'
class ImageBuffer {
  src = ''; alt = ''; decoding = ''; fetchPriority = ''
  dataset: Record<string, string> = {}; style = { opacity: '' }
  decode = vi.fn(async (): Promise<void> => undefined)
  attrs: Record<string, string> = {}
  getAttribute(name: string) { return name === 'src' ? this.src : this.attrs[name] }
  setAttribute(name: string, value: string) { this.attrs[name] = value }
}
const settle = async () => { for (let i = 0; i < 15; i++) await Promise.resolve() }
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
describe('decoded still handoff', () => {
  it('retains the current layer until the actual incoming DOM image is decoded and painted', async () => {
    vi.useFakeTimers(); vi.stubGlobal('Image', ImageBuffer)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 16))
    vi.stubGlobal('cancelAnimationFrame', clearTimeout)
    const layers = [new ImageBuffer(), new ImageBuffer()] as const
    layers[0].dataset.active = 'true'
    let decoded!: () => void
    layers[1].decode.mockImplementationOnce(() => new Promise<void>((resolve) => { decoded = resolve }))
    const commit = vi.fn(); const buffer = new StillFrameBuffer([...layers] as unknown as [HTMLImageElement, HTMLImageElement], commit)
    let painted = false
    const work = buffer.show('hallway', new AbortController().signal).then(() => { painted = true })
    await settle()
    expect(layers[0].dataset.active).toBe('true'); expect(commit).not.toHaveBeenCalled()
    decoded(); await settle()
    expect(layers[1].dataset.active).toBe('true'); expect(layers[1].dataset.decoded).toBe('true')
    expect(painted).toBe(false)
    await vi.advanceTimersByTimeAsync(32); await work
    expect(painted).toBe(true); expect(commit).toHaveBeenCalledWith('hallway')
    buffer.dispose()
  })
  it('ignores a stale DOM decode after reset without changing the visible layer', async () => {
    vi.stubGlobal('Image', ImageBuffer)
    const layers = [new ImageBuffer(), new ImageBuffer()] as const
    layers[0].dataset.active = 'true'
    let decoded!: () => void
    layers[1].decode.mockImplementationOnce(() => new Promise<void>((resolve) => { decoded = resolve }))
    const commit = vi.fn(); const buffer = new StillFrameBuffer([...layers] as unknown as [HTMLImageElement, HTMLImageElement], commit)
    const task = new AbortController(); const work = buffer.show('room', task.signal)
    const rejected = expect(work).rejects.toMatchObject({ name: 'AbortError' })
    await settle(); task.abort(); await rejected; decoded(); await settle()
    expect(layers[0].dataset.active).toBe('true'); expect(commit).not.toHaveBeenCalled()
    buffer.dispose()
  })
})
