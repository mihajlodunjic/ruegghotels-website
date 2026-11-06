import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import styles from './SupportingPageLayout.module.css'

export function SupportingPageLayout({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [menu, setMenu] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    element.setAttribute('data-page-ready', 'false')
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { element.setAttribute('data-page-ready', 'true'); return }
    const animations: gsap.core.Animation[] = []
    const context = gsap.context(() => {
      const targets = element.querySelectorAll('[data-enter]')
      if (targets.length) gsap.fromTo(targets, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .85, stagger: .08, ease: 'power3.out', onComplete: () => element.setAttribute('data-page-ready', 'true') })
      else element.setAttribute('data-page-ready', 'true')
    }, element)
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      animations.push(gsap.fromTo(entry.target, { y: 14 }, { y: 0, duration: .8, ease: 'power3.out' }))
      observer.unobserve(entry.target)
    }), { threshold: .1 })
    element.querySelectorAll('[data-section]').forEach((section) => observer.observe(section))
    return () => { context.revert(); observer.disconnect(); animations.forEach((animation) => animation.kill()) }
  }, [])
  return <div ref={root} className={styles.shell} data-page-ready="true"><SiteHeader variant="page" open={menu} onOpen={() => setMenu(true)} onClose={() => setMenu(false)} /><main id="main-content" className={`${styles.main} ${className}`} tabIndex={-1}>{children}</main><SiteFooter /></div>
}
