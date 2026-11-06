import { useLayoutEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'
/** A scoped editorial transition; canonical feature state remains in its reducer. */
export function useEditorialStep(ref: RefObject<HTMLElement | null>, key: string | number) {
  const previous = useRef(key)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    element.dataset.stepReady = 'false'
    if (previous.current !== key) { element.scrollIntoView({ block: 'start' }); element.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true }) }
    previous.current = key
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { element.dataset.stepReady = 'true'; return }
    const context = gsap.context(() => gsap.fromTo(element, { opacity: 0, y: 13 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out', onComplete: () => { element.dataset.stepReady = 'true' } }), element)
    return () => context.revert()
  }, [ref, key])
}
