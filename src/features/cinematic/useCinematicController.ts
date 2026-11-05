import { useEffect, useRef, useState, type Dispatch, type RefObject } from 'react'
import { CinematicPlayerController, type MediaPresentation } from './mediaController'
import type { CinematicEvent, View } from './cinematicMachine'

export function useCinematicController(master: RefObject<HTMLVideoElement | null>, branch: RefObject<HTMLVideoElement | null>, view: View, dispatch: Dispatch<CinematicEvent>) {
  const controller = useRef<CinematicPlayerController | null>(null)
  const [presentation, setPresentation] = useState<MediaPresentation>({ video: null, phase: 'idle' })
  useEffect(() => {
    if (!master.current || !branch.current) return
    const instance = new CinematicPlayerController({ master: master.current, branch: branch.current }, matchMedia('(max-width: 767px)').matches, dispatch, setPresentation)
    controller.current = instance
    return () => { instance.dispose(); controller.current = null }
  }, [master, branch, dispatch])
  useEffect(() => { controller.current?.sync(view) }, [view])
  useEffect(() => {
    const onHidden = () => { if (document.hidden) dispatch({ type: 'PAUSE' }) }
    document.addEventListener('visibilitychange', onHidden)
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const onPreference = () => { if (preference.matches) dispatch({ type: 'ENTER_STATIC_MODE' }) }
    preference.addEventListener('change', onPreference)
    return () => { document.removeEventListener('visibilitychange', onHidden); preference.removeEventListener('change', onPreference) }
  }, [dispatch])
  return presentation
}
