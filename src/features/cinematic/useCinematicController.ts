import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type RefObject } from 'react'
import { CinematicPlayerController, type MediaPresentation } from './mediaController'
import { StillFrameBuffer } from './stillFrames'
import { filmFocus, stillFocus, type FilmSource } from './mobileFraming'
import type { CinematicEvent, StaticChapter, View } from './cinematicMachine'

export function useCinematicController(master: RefObject<HTMLVideoElement | null>, branch: RefObject<HTMLVideoElement | null>, images: RefObject<[HTMLImageElement | null, HTMLImageElement | null]>, plane: RefObject<HTMLDivElement | null>, view: View, dispatch: Dispatch<CinematicEvent>) {
  const controller = useRef<CinematicPlayerController | null>(null)
  const [presentation, setPresentation] = useState<MediaPresentation>({ video: null, phase: 'loading', still: 'invitation' })
  useLayoutEffect(() => {
    if (!master.current || !branch.current || !images.current[0] || !images.current[1]) return
    const focus = (source: FilmSource | StaticChapter, time?: number) => {
      plane.current?.style.setProperty('--portrait-focal', String(time === undefined ? stillFocus[source as StaticChapter] : filmFocus(source as FilmSource, time)))
      if (plane.current) { plane.current.dataset.visualSource = source; if (time !== undefined) plane.current.dataset.frameTime = time.toFixed(4) }
    }
    const stills = new StillFrameBuffer([images.current[0], images.current[1]], (chapter) => focus(chapter))
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const warm = !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType || '')
    const instance = new CinematicPlayerController({ master: master.current, branch: branch.current }, matchMedia('(max-width: 767px), (max-width: 950px) and (max-height: 500px)').matches, dispatch, setPresentation, stills, focus, warm)
    controller.current = instance
    return () => { instance.dispose(); stills.dispose(); controller.current = null }
  }, [master, branch, images, plane, dispatch])
  useEffect(() => {
    controller.current?.sync(view)
    if (view.mode === 'REWINDING') plane.current?.closest('main')?.querySelector<HTMLButtonElement>('footer button')?.focus({ preventScroll: true })
  }, [view, plane])
  useEffect(() => {
    const onHidden = () => { if (document.hidden) dispatch({ type: 'PAUSE' }) }
    document.addEventListener('visibilitychange', onHidden)
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const onPreference = () => { if (preference.matches) dispatch({ type: 'ENTER_STATIC_MODE' }) }
    preference.addEventListener('change', onPreference)
    return () => { document.removeEventListener('visibilitychange', onHidden); preference.removeEventListener('change', onPreference) }
  }, [dispatch])
  const cancel = useCallback(() => controller.current?.pause(), [])
  const retry = useCallback(() => controller.current?.sync(view), [view])
  return { presentation, cancel, retry }
}
