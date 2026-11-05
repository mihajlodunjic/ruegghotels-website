import { mediaUrl, playback } from './chapterConfig'
import { isPlaying, type CinematicEvent, type PlayingScene, type View } from './cinematicMachine'

export interface MediaPresentation { video: 'master' | 'branch' | null; phase: 'idle' | 'loading' | 'ready' | 'waiting' }
type Videos = Record<'master' | 'branch', HTMLVideoElement>
export function waitForMedia(video: HTMLVideoElement, ready: () => boolean, events: string[], signal: AbortSignal, timeout = 12000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return }
    if (ready()) { resolve(); return }
    const cleanup = () => { clearTimeout(timer); events.forEach((name) => video.removeEventListener(name, check)); video.removeEventListener('error', fail); signal.removeEventListener('abort', cancel) }
    const check = () => { if (ready()) { cleanup(); resolve() } }
    const fail = () => { cleanup(); reject(new Error('The film could not be loaded.')) }
    const cancel = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')) }
    const timer = setTimeout(() => { cleanup(); reject(new Error('The film took too long to respond.')) }, timeout)
    events.forEach((name) => video.addEventListener(name, check))
    video.addEventListener('error', fail)
    signal.addEventListener('abort', cancel, { once: true })
  })
}
export async function seekTo(video: HTMLVideoElement, time: number, signal: AbortSignal): Promise<void> {
  if (Math.abs(video.currentTime - time) < 0.001 && !video.seeking) return
  video.currentTime = Math.min(time, Math.max(0, video.duration - 1 / 24))
  await waitForMedia(video, () => !video.seeking && Math.abs(video.currentTime - time) < 0.025, ['seeked', 'timeupdate', 'loadeddata'], signal)
}

/** Owns all native video effects. UI transitions never control the media timeline. */
export class CinematicPlayerController {
  private task: AbortController | null = null
  private lastScene: PlayingScene | null = null
  private activeVideo: HTMLVideoElement | null = null
  private presentation: MediaPresentation = { video: null, phase: 'idle' }
  constructor(private videos: Videos, private mobile: boolean, private dispatch: (event: CinematicEvent) => void, private present: (status: MediaPresentation) => void) {}
  private show(status: MediaPresentation) { this.presentation = status; this.present(status) }
  pause() {
    this.task?.abort()
    this.task = null
    this.activeVideo = null
    Object.values(this.videos).forEach((video) => video.pause())
  }
  sync(view: View) {
    this.pause()
    if (!isPlaying(view.mode)) {
      if (view.mode === 'INVITATION') { this.lastScene = null; this.show({ video: null, phase: 'idle' }) }
      return
    }
    const task = new AbortController()
    this.task = task
    void this.playScene(view.mode, task.signal)
  }
  private async playScene(scene: PlayingScene, signal: AbortSignal) {
    const config = playback[scene]
    const video = this.videos[config.video]
    this.activeVideo = video
    const sameScene = this.lastScene === scene
    this.lastScene = scene
    const url = mediaUrl(config.source, this.mobile)
    const sameSource = video.getAttribute('src') === url
    const keepFrame = sameScene && sameSource && this.presentation.phase === 'ready'
    this.show({ video: config.video, phase: keepFrame ? 'ready' : 'loading' })
    let frameRequest = 0
    let stallTimer: ReturnType<typeof setTimeout> | undefined
    let completed = false
    let hasFrame = keepFrame
    const clearStall = () => { clearTimeout(stallTimer) }
    const stalled = () => {
      if (signal.aborted || completed) return
      this.show({ video: config.video, phase: hasFrame ? 'ready' : 'waiting' })
      clearStall()
      stallTimer = setTimeout(() => {
        if (!signal.aborted) this.dispatch({ type: 'MEDIA_STALLED', errorCode: 'The film paused while loading. Retry or continue with still images.' })
      }, 10000)
    }
    const complete = () => {
      if (completed || signal.aborted) return
      completed = true
      video.pause()
      clearStall()
      if (config.stop !== undefined) video.currentTime = config.stop
      this.dispatch({ type: config.event })
    }
    const frame = (time: number) => {
      if (signal.aborted || completed || video.seeking) return
      if (!hasFrame) { hasFrame = true; this.show({ video: config.video, phase: 'ready' }); this.dispatch({ type: 'FRAME_READY' }) }
      clearStall()
      if (config.stop !== undefined && time >= config.stop - 0.0001) complete()
    }
    const tick: VideoFrameRequestCallback = (_now, metadata) => {
      frame(metadata.mediaTime)
      if (!signal.aborted && !completed) frameRequest = video.requestVideoFrameCallback(tick)
    }
    const timeupdate = () => {
      // Always guard checkpoints, including when frame callbacks are throttled.
      if (video.readyState >= 2 && !video.seeking) frame(video.currentTime)
    }
    const playing = () => { clearStall(); if (!('requestVideoFrameCallback' in video)) timeupdate() }
    const failure = () => { if (!signal.aborted) this.dispatch({ type: 'PLAY_FAILED', errorCode: 'This film is unavailable. Retry or explore the still-image journey.' }) }
    const listeners: [string, EventListener][] = [['timeupdate', timeupdate], ['seeked', timeupdate], ['ended', complete], ['waiting', stalled], ['stalled', stalled], ['playing', playing], ['error', failure]]
    const cleanup = () => {
      clearStall()
      if (frameRequest) video.cancelVideoFrameCallback?.(frameRequest)
      listeners.forEach(([event, handler]) => video.removeEventListener(event, handler))
    }
    signal.addEventListener('abort', cleanup, { once: true })
    try {
      if (!sameSource || video.error) { video.src = url; video.load() }
      await waitForMedia(video, () => video.readyState >= 2, ['loadeddata', 'canplay'], signal)
      const start = sameScene && sameSource && video.currentTime >= config.start ? video.currentTime : config.start
      await seekTo(video, start, signal)
      if (signal.aborted) return
      listeners.forEach(([event, handler]) => video.addEventListener(event, handler))
      if (config.stop !== undefined && video.currentTime >= config.stop - 0.0001) { complete(); return }
      if ('requestVideoFrameCallback' in video) frameRequest = video.requestVideoFrameCallback(tick)
      // One muted, inline video plays at a time; rejected promises remain recoverable.
      await video.play()
      if (signal.aborted && this.activeVideo !== video) video.pause()
    } catch (error) {
      cleanup()
      if (!signal.aborted) {
        video.pause()
        this.dispatch({ type: 'PLAY_FAILED', errorCode: error instanceof Error ? error.message : 'Playback could not start.' })
      }
    }
  }
  dispose() {
    this.pause()
    Object.values(this.videos).forEach((video) => { video.removeAttribute('src'); video.load() })
  }
}
