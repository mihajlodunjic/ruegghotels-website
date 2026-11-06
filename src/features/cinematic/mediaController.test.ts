import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StillFrames } from './stillFrames'
import { CinematicPlayerController, seekTo, waitForMedia } from './mediaController'

class FakeVideo extends EventTarget {
  paused = true
  readyState = 2
  duration = 23.416667
  seeking = false
  error: unknown = null
  src = ''
  seeks: number[] = []
  private time = 0
  private callbacks = new Map<number, VideoFrameRequestCallback>()
  private frameId = 0
  play = vi.fn(async () => { this.paused = false; this.dispatchEvent(new Event('playing')) })
  pause = vi.fn(() => { this.paused = true })
  load = vi.fn(() => { this.readyState = 2; this.dispatchEvent(new Event('loadeddata')) })
  constructor(frames = true) {
    super()
    if (frames) Object.assign(this, {
      requestVideoFrameCallback: (callback: VideoFrameRequestCallback) => { this.callbacks.set(++this.frameId, callback); return this.frameId },
      cancelVideoFrameCallback: (id: number) => this.callbacks.delete(id),
    })
  }
  get currentTime() { return this.time }
  set currentTime(value: number) { this.seeks.push(value); this.time = value; this.seeking = true; queueMicrotask(() => { this.seeking = false; this.dispatchEvent(new Event('seeked')) }) }
  getAttribute(name: string) { return name === 'src' ? this.src : null }
  removeAttribute() { this.src = '' }
  frame(time: number) {
    this.time = time
    const pending = [...this.callbacks.values()]
    this.callbacks.clear()
    pending.forEach((callback) => callback(0, { mediaTime: time } as VideoFrameCallbackMetadata))
    this.dispatchEvent(new Event('timeupdate'))
  }
}
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }
function setup(frames = true, stills?: StillFrames) {
  const master = new FakeVideo(frames)
  const branch = new FakeVideo(frames)
  const dispatch = vi.fn()
  const present = vi.fn()
  const controller = new CinematicPlayerController({ master: master as unknown as HTMLVideoElement, branch: branch as unknown as HTMLVideoElement }, false, dispatch, present, stills)
  return { master, branch, dispatch, present, controller }
}
afterEach(() => vi.useRealTimers())
describe('native media controller', () => {
  it('does not load either video for the invitation', () => {
    const { controller, master, branch } = setup()
    controller.sync({ mode: 'INVITATION' })
    expect(master.load).not.toHaveBeenCalled()
    expect(branch.load).not.toHaveBeenCalled()
    controller.dispose()
  })
  it.each([true, false])('hands off at the checkpoint without a new seek, frame callbacks=%s', async (frames) => {
    const { controller, master, dispatch } = setup(frames)
    controller.sync({ mode: 'MASTER_TO_HALLWAY' })
    await settle()
    expect(master.currentTime).toBe(10)
    const seeks = master.seeks.length
    master.frame(frames ? 17.125 : 17.2)
    expect(master.paused).toBe(true)
    expect(master.seeks).toHaveLength(seeks)
    await settle()
    expect(dispatch).toHaveBeenCalledWith({ type: 'HALLWAY_REACHED' })
    controller.dispose()
  })
  it('reuses the branch element for reverse and keeps the master paused', async () => {
    const { controller, master, branch, present, dispatch } = setup()
    controller.sync({ mode: 'ROOM_ENTERING' }); await settle()
    expect(master.paused).toBe(true)
    expect(branch.src).toContain('room-forward-1080')
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ video: 'branch', phase: 'loading' }))
    branch.frame(.05)
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ video: 'branch', phase: 'ready' }))
    branch.dispatchEvent(new Event('ended')); await settle()
    expect(dispatch).toHaveBeenCalledWith({ type: 'ROOM_FINISHED' })
    controller.sync({ mode: 'ROOM_AT_B3' })
    controller.sync({ mode: 'ROOM_EXITING' }); await settle()
    expect(branch.src).toContain('room-reverse-1080')
    expect(master.paused).toBe(true)
    branch.dispatchEvent(new Event('ended')); await settle()
    expect(dispatch).toHaveBeenCalledWith({ type: 'REVERSE_FINISHED' })
    controller.dispose()
  })
  it('recovers rejected play promises without exposing an unready video', async () => {
    const { controller, master, dispatch, present } = setup()
    master.play.mockRejectedValueOnce(new Error('Autoplay denied'))
    controller.sync({ mode: 'MASTER_TO_WELCOME' }); await settle()
    expect(dispatch).toHaveBeenCalledWith({ type: 'PLAY_FAILED', errorCode: 'Autoplay denied' })
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ video: 'master', phase: 'loading' }))
    expect(master.paused).toBe(true)
    controller.dispose()
  })
  it('cancels stale metadata and seek work on skip/menu/route changes', async () => {
    const { controller, master, dispatch } = setup()
    master.readyState = 0
    master.load.mockImplementation(() => undefined)
    controller.sync({ mode: 'MASTER_TO_WELCOME' })
    controller.sync({ mode: 'FINALE' })
    master.readyState = 2
    master.dispatchEvent(new Event('loadeddata'))
    await settle()
    expect(master.play).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    controller.dispose()
  })
  it('aborts a pending native seek on reset before it can play or dispatch', async () => {
    const { controller, master, dispatch } = setup()
    controller.sync({ mode: 'MASTER_TO_HALLWAY' }); await Promise.resolve()
    expect(master.seeks).toEqual([10])
    controller.sync({ mode: 'INVITATION' }); await settle(); master.frame(17.125)
    expect(master.play).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    controller.dispose()
  })
  it('resumes from the interrupted media position', async () => {
    const { controller, master } = setup()
    controller.sync({ mode: 'MASTER_TO_WELCOME' }); await settle()
    master.frame(4)
    controller.sync({ mode: 'USER_PAUSED', resumeState: 'MASTER_TO_WELCOME' })
    expect(master.paused).toBe(true)
    controller.sync({ mode: 'MASTER_TO_WELCOME' }); await settle()
    expect(master.currentTime).toBe(4)
    expect(master.paused).toBe(false)
    controller.dispose()
  })
  it('does not let a stale play promise pause a newer play on the same element', async () => {
    const { controller, master } = setup()
    let resolveOld!: () => void
    master.play.mockImplementationOnce(() => new Promise<void>((resolve) => { resolveOld = () => { master.paused = false; resolve() } }))
    controller.sync({ mode: 'MASTER_TO_WELCOME' }); await settle()
    controller.sync({ mode: 'USER_PAUSED', resumeState: 'MASTER_TO_WELCOME' })
    controller.sync({ mode: 'MASTER_TO_WELCOME' }); await settle()
    resolveOld(); await settle()
    expect(master.paused).toBe(false)
    controller.dispose()
  })
  it('pauses a stale play promise when a different video has taken over', async () => {
    const { controller, master, branch } = setup()
    let resolveOld!: () => void
    master.play.mockImplementationOnce(() => new Promise<void>((resolve) => { resolveOld = () => { master.paused = false; resolve() } }))
    controller.sync({ mode: 'MASTER_TO_WELCOME' }); await settle()
    controller.sync({ mode: 'ROOM_ENTERING' }); await settle()
    resolveOld(); await settle()
    expect(master.paused).toBe(true)
    expect(branch.paused).toBe(false)
    controller.dispose()
  })
  it('holds the valid paused frame until the destination still has painted', async () => {
    let painted!: () => void
    const stills = { prepare: vi.fn(async () => undefined), show: vi.fn(() => new Promise<void>((resolve) => { painted = resolve })) }
    const { controller, master, present, dispatch } = setup(true, stills)
    controller.sync({ mode: 'MASTER_TO_WELCOME' }); await settle()
    master.frame(10)
    expect(master.paused).toBe(true)
    expect(master.seeks).toEqual([])
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ video: 'master', phase: 'holding' }))
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'WELCOME_REACHED' })
    painted(); await settle()
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ video: null, phase: 'idle', still: 'welcome' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'WELCOME_REACHED' })
    controller.dispose()
  })
  it('discards a late checkpoint image after restart, including repeated resets', async () => {
    let obsolete!: () => void
    const stills: StillFrames = { prepare: async () => undefined, show: (chapter) => chapter === 'welcome' ? new Promise((resolve) => { obsolete = resolve }) : Promise.resolve() }
    const { controller, master, present, dispatch } = setup(true, stills)
    controller.sync({ mode: 'MASTER_TO_WELCOME' }); await settle(); master.frame(10)
    controller.sync({ mode: 'INVITATION' }); controller.sync({ mode: 'INVITATION' }); await settle()
    obsolete(); await settle(); master.dispatchEvent(new Event('ended'))
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'WELCOME_REACHED' })
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ video: null, phase: 'idle', still: 'invitation' }))
    expect(master.paused).toBe(true)
    controller.dispose()
  })
  it('finishes a branch on its last decoded frame without an ended event', async () => {
    const { controller, branch, dispatch } = setup()
    branch.duration = 5.208333
    controller.sync({ mode: 'ROOM_ENTERING' }); await settle()
    branch.frame(5.166667); await settle()
    expect(dispatch).toHaveBeenCalledWith({ type: 'ROOM_FINISHED' })
    expect(branch.paused).toBe(true)
    controller.dispose()
  })
  it('never mutates media time for an already aborted seek', async () => {
    const video = new FakeVideo(); const task = new AbortController(); task.abort()
    await expect(seekTo(video as unknown as HTMLVideoElement, 17.125, task.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(video.seeks).toEqual([])
  })
  it('stops a pending play promise that resolves after restart', async () => {
    const { controller, master } = setup()
    let late!: () => void
    master.play.mockImplementationOnce(() => new Promise<void>((resolve) => { late = () => { master.paused = false; resolve() } }))
    controller.sync({ mode: 'MASTER_TO_WELCOME' }); await settle()
    controller.sync({ mode: 'INVITATION' }); await settle(); late(); await settle()
    expect(master.paused).toBe(true)
    controller.dispose()
  })
  it('bounds stalls and cancels their timeout after dispose', async () => {
    vi.useFakeTimers()
    const { controller, master, dispatch } = setup()
    controller.sync({ mode: 'MASTER_TO_WELCOME' }); await settle()
    master.dispatchEvent(new Event('waiting'))
    await vi.advanceTimersByTimeAsync(10001)
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'MEDIA_STALLED' }))
    controller.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('bounds readiness waits and aborts a pending seek', async () => {
    vi.useFakeTimers()
    const video = new FakeVideo() as unknown as HTMLVideoElement
    const task = new AbortController()
    const waiting = waitForMedia(video, () => false, ['loadeddata'], task.signal, 100)
    const failure = expect(waiting).rejects.toThrow('too long')
    await vi.advanceTimersByTimeAsync(101); await failure
    const seeking = seekTo(video, 17.125, task.signal)
    task.abort()
    await expect(seeking).rejects.toMatchObject({ name: 'AbortError' })
    expect(vi.getTimerCount()).toBe(0)
  })
})
