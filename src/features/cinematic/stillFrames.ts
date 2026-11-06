import { poster, chapterDescriptions } from './chapterConfig'
import type { StaticChapter } from './cinematicMachine'

export interface StillFrames {
  prepare(chapter: StaticChapter): Promise<void>
  show(chapter: StaticChapter, signal: AbortSignal): Promise<void>
}
export function abortable<T>(work: Promise<T>, signal?: AbortSignal, timeout = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel) }
    const cancel = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')) }
    const timer = setTimeout(() => { cleanup(); reject(new Error('The scene image took too long to load.')) }, timeout)
    if (signal?.aborted) { cancel(); return }
    signal?.addEventListener('abort', cancel, { once: true })
    work.then((value) => { cleanup(); resolve(value) }, (error) => { cleanup(); reject(error) })
  })
}
function decode(image: HTMLImageElement): Promise<void> {
  if (image.decode) return image.decode()
  if (image.complete && image.naturalWidth > 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const cleanup = () => { image.removeEventListener('load', loaded); image.removeEventListener('error', failed) }
    const loaded = () => { cleanup(); resolve() }
    const failed = () => { cleanup(); reject(new Error('The scene image could not be loaded.')) }
    image.addEventListener('load', loaded, { once: true }); image.addEventListener('error', failed, { once: true })
  })
}
export function afterPaint(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let request = 0
    const cancel = () => { cancelAnimationFrame(request); reject(new DOMException('Cancelled', 'AbortError')) }
    if (signal.aborted) { cancel(); return }
    signal.addEventListener('abort', cancel, { once: true })
    request = requestAnimationFrame(() => { request = requestAnimationFrame(() => { signal.removeEventListener('abort', cancel); resolve() }) })
  })
}
/** Two native image buffers preserve the visible image while the next one decodes.
 * Only the current/likely next assets are retained; no canvas or scene renderer. */
export class StillFrameBuffer implements StillFrames {
  private active = 0
  private chapter: StaticChapter = 'invitation'
  private version = 0
  private cache = new Map<StaticChapter, Promise<HTMLImageElement>>()
  constructor(private layers: [HTMLImageElement, HTMLImageElement], private commit: (chapter: StaticChapter) => void) {}
  private resource(chapter: StaticChapter): Promise<HTMLImageElement> {
    const cached = this.cache.get(chapter)
    if (cached) return cached
    const image = new Image()
    image.decoding = 'async'; image.fetchPriority = chapter === 'invitation' ? 'high' : 'low'; image.src = poster(chapter)
    const work = abortable(decode(image)).then(() => image).catch((error) => { this.cache.delete(chapter); throw error })
    this.cache.set(chapter, work)
    if (this.cache.size > 2) this.cache.delete(this.cache.keys().next().value!)
    return work
  }
  prepare(chapter: StaticChapter): Promise<void> { return this.resource(chapter).then(() => undefined) }
  async show(chapter: StaticChapter, signal: AbortSignal): Promise<void> {
    const version = ++this.version
    if (chapter === this.chapter && this.layers[this.active].dataset.decoded === 'true') return
    const resource = await abortable(this.resource(chapter), signal)
    if (signal.aborted || version !== this.version) throw new DOMException('Cancelled', 'AbortError')
    const index = chapter === this.chapter && this.layers[this.active].getAttribute('src') === poster(chapter) ? this.active : 1 - this.active
    const incoming = this.layers[index]
    incoming.src = resource.src
    await abortable(decode(incoming), signal)
    if (signal.aborted || version !== this.version) throw new DOMException('Cancelled', 'AbortError')
    this.layers.forEach((image, i) => {
      image.style.opacity = i === index ? '1' : '0'
      image.setAttribute('aria-hidden', String(i !== index))
      image.dataset.active = String(i === index)
    })
    incoming.alt = chapterDescriptions[chapter]; incoming.dataset.decoded = 'true'; incoming.dataset.poster = chapter
    this.active = index; this.chapter = chapter; this.commit(chapter)
    // Keep the valid paused video above this buffer until the decoded image has painted.
    await afterPaint(signal)
  }
  dispose() { this.version++; this.cache.clear() }
}
