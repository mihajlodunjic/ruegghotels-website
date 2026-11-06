import { mediaUrl, playback } from './chapterConfig'
import { chapterOf, isPlaying, type CinematicEvent, type PlayingScene, type StaticChapter, type View } from './cinematicMachine'
import type { FilmSource } from './mobileFraming'
import type { StillFrames } from './stillFrames'

export interface MediaPresentation { video: 'master' | 'branch' | null; phase: 'idle' | 'loading' | 'ready' | 'waiting' | 'holding' | 'error'; still: StaticChapter; error?: string }
type Videos = Record<'master' | 'branch', HTMLVideoElement>
const ending: Record<PlayingScene, StaticChapter> = { MASTER_TO_WELCOME: 'welcome', MASTER_TO_HALLWAY: 'hallway', MASTER_TO_FINALE: 'finale', ROOM_ENTERING: 'room', ROOM_EXITING: 'hallway' }
export function waitForMedia(video: HTMLVideoElement, ready: () => boolean, events: string[], signal: AbortSignal, timeout = 12000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return }
    if (ready()) { resolve(); return }
    const cleanup = () => { clearTimeout(timer); events.forEach((name) => video.removeEventListener(name, check)); video.removeEventListener('error', fail); signal.removeEventListener('abort', cancel) }
    const check = () => { if (ready()) { cleanup(); resolve() } }
    const fail = () => { cleanup(); reject(new Error('The film could not be loaded.')) }
    const cancel = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')) }
    const timer = setTimeout(() => { cleanup(); reject(new Error('The film took too long to respond.')) }, timeout)
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
  private warm(source: 'room-forward' | 'room-reverse') {
    const video = this.videos.branch
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
      stallTimer = setTimeout(() => { if (!signal.aborted) this.dispatch({ type: 'MEDIA_STALLED', errorCode: 'The film paused while loading. Retry or continue with still images.' }) }, 10000)
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
      if (!sameSource || video.error || video.readyState < 2) { video.src = mediaUrl(config.source, this.mobile); this.decoded.delete(video); video.load() }
      await waitForMedia(video, () => video.readyState >= 2, ['loadeddata', 'canplay'], signal)
      signal.throwIfAborted()
      const start = sameScene && sameSource && video.currentTime >= config.start ? video.currentTime : config.start
      const matchingFrame = sameSource && Math.abs((this.decoded.get(video) ?? -1) - start) < .002 && Math.abs(video.currentTime - start) < 2 / 24
      if (!matchingFrame) await seekTo(video, start, signal)
      signal.throwIfAborted()
      listeners.forEach(([event, handler]) => video.addEventListener(event, handler))
      if (config.stop !== undefined && video.currentTime >= config.stop - .0001) { await finish(); return }
      if (callbacks) frameRequest = video.requestVideoFrameCallback(tick)
      await video.play()
      if (signal.aborted && this.activeVideo !== video) video.pause()
    } catch (error) {
      cleanup()
      if (!signal.aborted) { video.pause(); this.dispatch({ type: 'PLAY_FAILED', errorCode: error instanceof Error ? error.message : 'Playback could not start.' }) }
    }
  }
  dispose() { this.pause(); Object.values(this.videos).forEach((video) => { video.removeAttribute('src'); video.load() }) }
}
