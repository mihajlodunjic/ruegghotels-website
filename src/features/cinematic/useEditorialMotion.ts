import { useLayoutEffect, useRef, type Dispatch, type RefObject } from 'react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import type { CinematicEvent, StaticChapter } from './cinematicMachine'

gsap.registerPlugin(Flip)
type Command = Exclude<CinematicEvent['type'], 'SELECT_HOTEL' | 'PLAY_FAILED' | 'MEDIA_STALLED'>
type ElementRef<T extends HTMLElement> = RefObject<T | null>
interface MotionOptions {
  stage: ElementRef<HTMLElement>; frame: ElementRef<HTMLDivElement>; panel: ElementRef<HTMLElement>; exits: ElementRef<HTMLDivElement>
  mode: string; chapter: StaticChapter; info: boolean; showEditorial: boolean; visualReady: boolean; reducedMotion: boolean; dispatch: Dispatch<CinematicEvent>
}
/** Presentation only: media checkpoints and playback remain owned by the accepted engine. */
export function useEditorialMotion({ stage, frame, panel, exits, mode, chapter, info, showEditorial, visualReady, reducedMotion, dispatch }: MotionOptions) {
  const layout = useRef<ReturnType<typeof Flip.getState> | null>(null)
  const focusInvitation = useRef(false)
  const reverseAfterClose = useRef(false)
  const exitAnimations = useRef<gsap.core.Tween[]>([])
  useLayoutEffect(() => () => {
    exitAnimations.current.forEach((animation) => animation.kill())
    exits.current?.replaceChildren()
  }, [exits])
  useLayoutEffect(() => {
    const root = stage.current
    const element = panel.current
    if (!root) return
    root.setAttribute('data-ui-ready', 'false')
    const previousLayout = layout.current
    layout.current = null
    const complete = () => {
      root.setAttribute('data-ui-ready', 'true')
      if (reverseAfterClose.current && mode === 'ROOM_AT_B3') {
        reverseAfterClose.current = false
        dispatch({ type: 'BACK_TO_HALLWAY' })
      } else if (focusInvitation.current && chapter === 'invitation' && element) {
        focusInvitation.current = false; element.querySelector('button')?.focus({ preventScroll: true })
      } else if (showEditorial && chapter !== 'invitation') element?.querySelector('h2')?.focus({ preventScroll: true })
    }
    if (!visualReady) return
    if (reducedMotion || !showEditorial || !element) {
      complete()
      if (previousLayout && !reducedMotion) {
        const context = gsap.context(() => { Flip.from(previousLayout, { duration: .4, ease: 'power3.inOut', scale: true }) }, root)
        return () => context.revert()
      }
      return
    }
    const context = gsap.context(() => {
      if (previousLayout) Flip.from(previousLayout, { duration: matchMedia('(max-width: 767px) and (orientation: portrait)').matches ? .5 : .95, ease: 'power3.inOut', scale: true, onComplete: reverseAfterClose.current ? complete : undefined })
      if (reverseAfterClose.current && mode === 'ROOM_AT_B3') { gsap.set(element, { autoAlpha: 0 }); return }
      const isFinale = chapter === 'finale'
      const delay = isFinale ? .95 : chapter === 'room' && !info ? previousLayout ? .75 : .55 : .08
      const timeline = gsap.timeline({ delay, onComplete: complete })
      timeline.fromTo(element, { autoAlpha: 0, x: isFinale ? 36 : info ? 28 : 0, y: chapter === 'invitation' ? 18 : 0 }, { autoAlpha: 1, x: 0, y: 0, duration: isFinale || info ? .95 : .65, ease: 'power3.out' })
      timeline.fromTo(element.querySelectorAll('[data-line]'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .11, ease: 'power3.out' }, .16)
      timeline.fromTo(element.querySelectorAll('[data-reveal]'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .07, ease: 'power2.out' }, .35)
    }, root)
    return () => context.revert()
  }, [stage, frame, panel, mode, chapter, info, showEditorial, visualReady, reducedMotion, dispatch])

  useLayoutEffect(() => {
    if (reducedMotion || !stage.current) return
    const controls = [...stage.current.querySelectorAll<HTMLElement>('[data-motion-link]')]
    const arrows = controls.map((control) => control.querySelector('[data-motion-arrow]')).filter((arrow): arrow is Element => Boolean(arrow))
    const handlers = controls.map((control) => {
      const arrow = control.querySelector('[data-motion-arrow]')
      const enter = () => { if (arrow) gsap.to(arrow, { x: 3, y: -3, duration: .3, ease: 'power2.out', overwrite: 'auto' }) }
      const leave = () => { if (arrow) gsap.to(arrow, { x: 0, y: 0, duration: .4, ease: 'power3.out', overwrite: 'auto' }) }
      control.addEventListener('pointerenter', enter); control.addEventListener('pointerleave', leave)
      control.addEventListener('focus', enter); control.addEventListener('blur', leave)
      return () => {
        control.removeEventListener('pointerenter', enter); control.removeEventListener('pointerleave', leave)
        control.removeEventListener('focus', enter); control.removeEventListener('blur', leave)
      }
    })
    return () => {
      handlers.forEach((cleanup) => cleanup())
      if (arrows.length) { gsap.killTweensOf(arrows); gsap.set(arrows, { clearProps: 'transform' }) }
    }
  }, [stage, mode, chapter, showEditorial, reducedMotion])
  const withdraw = () => {
    if (reducedMotion || !panel.current || !stage.current || !exits.current) return
    const rect = panel.current.getBoundingClientRect()
    const root = stage.current.getBoundingClientRect()
    const copy = panel.current.cloneNode(true) as HTMLElement
    copy.setAttribute('aria-hidden', 'true')
    copy.inert = true
    copy.removeAttribute('id')
    copy.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'))
    exits.current.appendChild(copy)
    gsap.set(copy, { position: 'absolute', left: rect.left - root.left, top: rect.top - root.top, width: rect.width, height: rect.height, right: 'auto', bottom: 'auto', margin: 0, x: 0, y: 0, autoAlpha: 1, pointerEvents: 'none' })
    const animation: gsap.core.Tween = gsap.to(copy, { opacity: 0, x: matchMedia('(min-width: 768px)').matches ? chapter === 'room' ? 75 : 36 : 0, y: matchMedia('(max-width: 767px)').matches ? 18 : 0, duration: .6, ease: 'power3.inOut', onComplete: () => { copy.remove(); exitAnimations.current = exitAnimations.current.filter((entry) => entry !== animation) } })
    exitAnimations.current.push(animation)
  }
  const command = (type: Command) => {
    if (type === 'REPLAY' || type === 'REWIND') {
      focusInvitation.current = true
      reverseAfterClose.current = false; layout.current = type === 'REWIND' && info && frame.current && !reducedMotion ? Flip.getState(frame.current) : null
      exitAnimations.current.forEach((animation) => animation.kill()); exitAnimations.current = []
      exits.current?.replaceChildren(); dispatch({ type }); return
    }
    if (reverseAfterClose.current) return
    if (type === 'OPEN_ROOM_INFO' || type === 'CLOSE_ROOM_INFO' || (type === 'BACK_TO_HALLWAY' && info)) {
      if (!reducedMotion && frame.current) layout.current = Flip.getState(frame.current)
    }
    if (type === 'START' || type === 'CLOSE_ROOM_INFO' || (type === 'BACK_TO_HALLWAY' && info)) withdraw()
    if (type === 'BACK_TO_HALLWAY' && info && !reducedMotion) {
      // Close the editorial layout before executing this explicit return command.
      reverseAfterClose.current = true
      dispatch({ type: 'CLOSE_ROOM_INFO' })
    } else dispatch({ type })
  }
  return command
}
