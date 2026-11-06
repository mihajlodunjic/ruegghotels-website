import { mediaUrl, playback } from './chapterConfig'
import { chapterOf, isPlaying, type CinematicEvent, type PlayingScene, type StaticChapter, type View } from './cinematicMachine'
import { REWIND_RATE, rewindPlan, type RewindLeg } from './rewind'
import type { JourneyView } from './cinematicMachine'
import type { FilmSource } from './mobileFraming'
import type { StillFrames } from './stillFrames'

export interface MediaPresentation { video: 'master' | 'branch' | null; phase: 'idle' | 'loading' | 'ready' | 'waiting' | 'holding' | 'error'; still: StaticChapter; error?: string }
// Network buffering is not a fatal error. Allow longer preparation for presentation use.
export const MEDIA_READY_TIMEOUT_MS = 90000
export const MEDIA_STALL_GRACE_MS = 60000
export class MediaTimeoutError extends Error { constructor() { super('The film took too long to respond.') } }
type Videos = Record<'master' | 'branch', HTMLVideoElement>
const ending: Record<PlayingScene, StaticChapter> = { MASTER_TO_WELCOME: 'welcome', MASTER_TO_HALLWAY: 'hallway', MASTER_TO_FINALE: 'finale', ROOM_ENTERING: 'room', ROOM_EXITING: 'hallway' }
export function waitForMedia(video: HTMLVideoElement, ready: () => boolean, events: string[], signal: AbortSignal, timeout = MEDIA_READY_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return }
    if (ready()) { resolve(); return }
    const cleanup = () => { clearTimeout(timer); events.forEach((name) => video.removeEventListener(name, check)); video.removeEventListener('error', fail); signal.removeEventListener('abort', cancel) }
    const check = () => { if (ready()) { cleanup(); resolve() } }
    const fail = () => { cleanup(); reject(new Error('The film could not be loaded.')) }
    const cancel = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')) }
    const timer = setTimeout(() => { cleanup(); reject(new MediaTimeoutError()) }, timeout)
    events.forEach((name) => video.addEventListener(name, check)); video.addEventListener('error', fail); signal.addEventListener('abort', cancel, { once: true })
  })
}
export async function seekTo(video: HTMLVideoElement, time: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted()
  const target = Math.min(time, Math.max(0, video.duration - 1 / 24))
  if (Math.abs(video.currentTime - target) >= .001) video.currentTime = target
  await waitForMedia(video, () => !video.seeking && Math.abs(video.currentTime - target) < .025, ['seeked', 'timeupdate', 'loadeddata'], signal)
}

/** Native media ownership stays here. A decoded still replaces each checkpoint frame;
 * the outgoing video is paused and retained until that image has actually painted. */
export class CinematicPlayerController {
  private task: AbortController | null = null
  private lastScene: PlayingScene | null = null
  private activeVideo: HTMLVideoElement | null = null
  private decoded = new WeakMap<HTMLVideoElement, number>()
  private presentation: MediaPresentation = { video: null, phase: 'loading', still: 'invitation' }
  constructor(private videos: Videos, private mobile: boolean, private dispatch: (event: CinematicEvent) => void, private present: (status: MediaPresentation) => void, private stills?: StillFrames, private onFrame?: (source: FilmSource | StaticChapter, time?: number) => void, private allowWarm = true) {}
  private show(status: Partial<MediaPresentation>) { this.presentation = { ...this.presentation, ...status }; this.present(this.presentation) }
  pause() {
    this.task?.abort(); this.task = null; this.activeVideo = null
    Object.values(this.videos).forEach((video) => video.pause())
  }
  sync(view: View) {
    this.pause()
    if (view.mode === 'MENU_OPEN' || view.mode === 'USER_PAUSED' || view.mode === 'MEDIA_ERROR') return
    const task = new AbortController(); this.task = task
    // Prewarm the 1080p Master while the invitation still is visible. Browser
    // preload=auto is a hint, not a mandatory full download; never block the UI.
    if (view.mode === 'INVITATION' && this.allowWarm) this.warm('master')
    // Load the optional room footage while the visitor reads the reception.
    if (view.mode === 'WELCOME_PAUSED' && this.allowWarm) this.warm('room-forward')
    if (view.mode === 'REWINDING') { void this.rewind(view.origin, task.signal); return }
    if (isPlaying(view.mode)) { void this.playScene(view.mode, task.signal); return }
    const target = chapterOf(view)
    if (target === 'invitation') this.lastScene = null
    if (this.presentation.still === target && this.presentation.phase === 'idle' && this.presentation.video === null) {
      if ((view.mode === 'ROOM_AT_B3' || view.mode === 'ROOM_INFO_OPEN') && this.allowWarm) this.warm('room-reverse')
      return
    }
    void this.showStill(target, task.signal)
  }
  private async showStill(chapter: StaticChapter, signal: AbortSignal) {
    this.show({ phase: this.presentation.video ? 'holding' : 'loading', error: undefined })
    try {
      await this.stills?.show(chapter, signal)
      if (signal.aborted) return
      this.onFrame?.(chapter)
      this.show({ video: null, phase: 'idle', still: chapter, error: undefined })
    } catch (error) {
      if (!signal.aborted) this.show({ phase: 'error', error: error instanceof Error ? error.message : 'The scene image could not be loaded.' })
    }
  }
  private warm(source: 'master' | 'room-forward' | 'room-reverse') {
    const video = source === 'master' ? this.videos.master : this.videos.branch
    if (this.activeVideo === video) return
    const url = mediaUrl(source, this.mobile)
    if (video.getAttribute('src') === url && !video.error) return
    video.pause(); video.preload = 'auto'; video.src = url; this.decoded.delete(video); video.load()
  }
  private async playScene(scene: PlayingScene, signal: AbortSignal) {
    const config = playback[scene]; const video = this.videos[config.video]
    this.activeVideo = video
    const sameScene = this.lastScene === scene; this.lastScene = scene
    const sameSource = video.getAttribute('src') === mediaUrl(config.source, this.mobile)
    const keepFrame = sameScene && sameSource && this.presentation.video === config.video && ['ready', 'holding'].includes(this.presentation.phase)
    this.show({ video: config.video, phase: keepFrame ? 'ready' : 'loading', error: undefined })
    void this.stills?.prepare(ending[scene]).catch(() => undefined)
    let frameRequest = 0; let stallTimer: ReturnType<typeof setTimeout> | undefined
    let completed = false; let hasFrame = keepFrame; let frameAt = performance.now()
    const callbacks = typeof video.requestVideoFrameCallback === 'function'
    const clearStall = () => clearTimeout(stallTimer)
    const cleanup = () => { clearStall(); if (frameRequest) video.cancelVideoFrameCallback?.(frameRequest); listeners.forEach(([event, handler]) => video.removeEventListener(event, handler)) }
    const finish = async () => {
      if (completed || signal.aborted) return
      completed = true; video.pause(); cleanup()
      this.show({ video: config.video, phase: 'holding' })
      try {
        await this.stills?.show(ending[scene], signal)
        if (signal.aborted) return
        this.onFrame?.(ending[scene])
        this.show({ video: null, phase: 'idle', still: ending[scene] })
        this.dispatch({ type: config.event })
      } catch (error) { if (!signal.aborted) this.dispatch({ type: 'PLAY_FAILED', errorCode: error instanceof Error ? error.message : 'The next scene could not be prepared.' }) }
    }
    const stalled = () => {
      if (signal.aborted || completed) return
      this.show({ video: config.video, phase: hasFrame ? 'ready' : 'waiting' }); clearStall()
      // A slow connection should not produce an error panel. After a prolonged
      // total stall, preserve a usable still-image journey instead.
      stallTimer = setTimeout(() => { if (!signal.aborted && !completed) this.dispatch({ type: 'ENTER_STATIC_MODE' }) }, MEDIA_STALL_GRACE_MS)
    }
    const frame = (time: number, decoded: boolean) => {
      if (signal.aborted || completed || video.seeking) return
      if (decoded) { this.decoded.set(video, time); frameAt = performance.now() }
      this.onFrame?.(config.source, time)
      if (!hasFrame) { hasFrame = true; this.show({ video: config.video, phase: 'ready' }); this.dispatch({ type: 'FRAME_READY' }) }
      clearStall()
      if (this.allowWarm && scene === 'MASTER_TO_HALLWAY' && time >= 15) this.warm('room-forward')
      const stop = config.stop ?? (Number.isFinite(video.duration) ? Math.max(0, video.duration - 1 / 24) : Infinity)
      if (time >= stop - .0001) void finish()
    }
    const tick: VideoFrameRequestCallback = (_now, metadata) => { frame(metadata.mediaTime, true); if (!signal.aborted && !completed) frameRequest = video.requestVideoFrameCallback(tick) }
    const timeupdate = () => {
      if (video.readyState < 2 || video.seeking || video.paused) return
      // rVFC owns frame-sensitive stops. Native events cover unavailable/throttled callbacks.
      if (!callbacks || performance.now() - frameAt > 300) frame(video.currentTime, false)
    }
    const playing = () => { clearStall(); if (!callbacks) timeupdate() }
    const failure = () => { if (!signal.aborted) this.dispatch({ type: 'PLAY_FAILED', errorCode: 'This film is unavailable. Retry or explore the still-image journey.' }) }
    const ended = () => { void finish() }
    const listeners: [string, EventListener][] = [['timeupdate', timeupdate], ['seeked', timeupdate], ['ended', ended], ['waiting', stalled], ['stalled', stalled], ['playing', playing], ['error', failure]]
    signal.addEventListener('abort', cleanup, { once: true })
    try {
      video.preload = 'auto'
      // A matching prewarm may still be downloading: don't restart it on click.
      if (!sameSource || video.error) { video.src = mediaUrl(config.source, this.mobile); this.decoded.delete(video); video.load() }
      await waitForMedia(video, () => video.readyState >= 2, ['loadeddata', 'canplay'], signal)
      signal.throwIfAborted()
      const start = sameScene && sameSource && video.currentTime >= config.start ? video.currentTime : config.start
      const matchingFrame = sameSource && Math.abs((this.decoded.get(video) ?? -1) - start) < .002 && Math.abs(video.currentTime - start) < 2 / 24
      if (!matchingFrame) await seekTo(video, start, signal)
      signal.throwIfAborted()
      listeners.forEach(([event, handler]) => video.addEventListener(event, handler))
      if (config.stop !== undefined && video.currentTime >= config.stop - .0001) { await finish(); return }
      // Compress only the opening entrance journey; normal speed resumes after the reception pause.
      video.playbackRate = config.playbackRate ?? 1
      if (callbacks) frameRequest = video.requestVideoFrameCallback(tick)
      await video.play()
      if (signal.aborted && this.activeVideo !== video) video.pause()
    } catch (error) {
      cleanup()
      if (!signal.aborted) {
        video.pause()
        // A readiness timeout only means slow delivery; don't interrupt the
        // presentation with a media-error overlay.
        if (error instanceof MediaTimeoutError) this.dispatch({ type: 'ENTER_STATIC_MODE' })
        else this.dispatch({ type: 'PLAY_FAILED', errorCode: error instanceof Error ? error.message : 'Playback could not start.' })
      }
    }
  }
  private async rewind(origin: JourneyView, signal: AbortSignal) {
    // Snapshot the actual media clock before any source changes. Checkpoints use exact anchors.
    const plan = rewindPlan(origin, this.videos.master.currentTime, this.videos.branch.currentTime)
    this.lastScene = null
    void this.stills?.prepare('invitation').catch(() => undefined)
    try {
      for (const leg of plan) {
        if (leg.last - leg.start < 1 / 24) continue
        // Mobile uses the encoded 5x timeline proactively: no dependency on high-rate hardware decoding.
        try { await this.rewindLeg(leg, this.mobile, signal) }
        catch (error) {
          signal.throwIfAborted()
          if (!(error instanceof RewindRateError)) throw error
          // The browser can reject, clamp, or silently under-deliver a high playbackRate.
          // A 24fps edition with 5x encoded into its timeline plays at ordinary 1x.
          await this.rewindLeg({ ...leg, start: error.time }, true, signal)
        }
      }
      signal.throwIfAborted()
      await this.showStill('invitation', signal)
      signal.throwIfAborted()
      this.dispatch({ type: 'REPLAY' })
    } catch {
      // Failure is a safe reset, never a forward play or an editorial checkpoint.
      if (!signal.aborted) this.dispatch({ type: 'REPLAY' })
    }
  }
  private async rewindLeg(leg: RewindLeg, encoded: boolean, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted()
    const scale = encoded ? REWIND_RATE : 1
    const source = encoded ? `${leg.source}-5x` as 'master-reverse-5x' | 'room-reverse-5x' : leg.source
    // Always prepare on the inactive element. The outgoing decoded frame stays visible.
    const slot = this.presentation.video === 'master' ? 'branch' : this.presentation.video === 'branch' ? 'master' : leg.source === 'master-reverse' ? 'master' : 'branch'
    const video = this.videos[slot]
    Object.values(this.videos).forEach((element) => element.pause())
    this.activeVideo = video
    this.show({ phase: this.presentation.video ? 'holding' : 'loading', error: undefined })
    const url = mediaUrl(source, this.mobile)
    if (video.getAttribute('src') !== url || video.error) { video.preload = 'auto'; video.src = url; this.decoded.delete(video); video.load() }
    await waitForMedia(video, () => video.readyState >= 2, ['loadeddata', 'canplay'], signal)
    await seekTo(video, leg.start / scale, signal)
    signal.throwIfAborted()
    try { video.playbackRate = encoded ? 1 : REWIND_RATE }
    catch { throw new RewindRateError(leg.start) }
    if (!encoded && Math.abs(video.playbackRate - REWIND_RATE) > .01) throw new RewindRateError(leg.start)
    await new Promise<void>((resolve, reject) => {
      let finished = false; let revealed = false; let frameRequest = 0; let firstAt: number | null = null; let firstTime = 0
      let lastTime = leg.start / scale; let lastProgress = performance.now()
      const callbacks = typeof video.requestVideoFrameCallback === 'function'
      const cleanup = () => {
        clearInterval(watchdog)
        if (frameRequest) video.cancelVideoFrameCallback?.(frameRequest)
        listeners.forEach(([event, handler]) => video.removeEventListener(event, handler))
        signal.removeEventListener('abort', cancel)
      }
      const done = (error?: Error) => {
        if (finished) return
        finished = true; cleanup(); video.pause()
        if (error) reject(error); else resolve()
      }
      const cancel = () => done(new DOMException('Cancelled', 'AbortError'))
      const frame = (time: number) => {
        if (signal.aborted || finished || video.seeking || video.readyState < 2 || time < leg.start / scale - 1 / 24) return
        const now = performance.now()
        if (firstAt === null) { firstAt = now; firstTime = time }
        if (time > lastTime + .001) { lastProgress = now; lastTime = time }
        this.decoded.set(video, time)
        this.onFrame?.(leg.source === 'master-reverse' ? 'master' : 'room-reverse', leg.source === 'master-reverse' ? Math.max(0, leg.last - time * scale) : time * scale)
        if (!revealed) { revealed = true; this.show({ video: slot, phase: 'ready' }) }
        if (time >= Math.min(leg.last / scale, video.duration - 1 / 24) - .001) done()
      }
      const tick: VideoFrameRequestCallback = (_now, metadata) => { frame(metadata.mediaTime); if (!finished) frameRequest = video.requestVideoFrameCallback(tick) }
      const native = () => { if (!callbacks && !video.paused) frame(video.currentTime) }
      const ended = () => { if (!signal.aborted && video.currentTime >= Math.min(leg.last / scale, video.duration - 1 / 24) - .001) { frame(video.currentTime); done() } }
      const failure = () => done(new Error('Reverse film unavailable'))
      const listeners: [string, EventListener][] = [['timeupdate', native], ['seeked', native], ['playing', native], ['ended', ended], ['error', failure]]
      const watchdog = setInterval(() => {
        const now = performance.now()
        if (signal.aborted) { cancel(); return }
        // Check actual media progress as some mobile engines accept 5 while playing slowly.
        if (!encoded && firstAt !== null && now - firstAt >= 600 && (video.currentTime - firstTime) / ((now - firstAt) / 1000) < 3.5) { done(new RewindRateError(lastTime)); return }
        if (now - lastProgress > 4000) done(new Error('Reverse film stalled'))
        // Native events cover throttled or missing frame callbacks, as in forward playback.
        if (callbacks && now - lastProgress > 300 && !video.paused && !video.seeking && video.currentTime > lastTime) frame(video.currentTime)
      }, 100)
      signal.addEventListener('abort', cancel, { once: true })
      listeners.forEach(([event, handler]) => video.addEventListener(event, handler))
      if (callbacks) frameRequest = video.requestVideoFrameCallback(tick)
      void video.play().then(() => {
        if ((signal.aborted || finished) && this.activeVideo !== video) video.pause()
      }).catch((error: unknown) => done(!encoded && error instanceof Error && error.name === 'NotSupportedError' ? new RewindRateError(lastTime) : error instanceof Error ? error : new Error('Reverse playback rejected')))
    })
  }
  dispose() { this.pause(); Object.values(this.videos).forEach((video) => { video.removeAttribute('src'); video.load() }) }
}

class RewindRateError extends Error { constructor(readonly time: number) { super('High speed playback unavailable') } }
