import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { BrandSeal } from './BrandSeal'
import styles from './SiteHeader.module.css'

const links = [['/', 'The journey'], ['/our-story', 'Our story'], ['/partners', 'Our local circle'], ['/book', 'Our alpine homes'], ['/contact', 'Get in touch']] as const
export function SiteHeader({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const menu = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  useLayoutEffect(() => {
    const element = dialog.current
    if (!element) return
    closing.current = false
    const context = gsap.context(() => {
      if (open) {
        element.showModal()
        element.dataset.menuReady = 'false'
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) { element.dataset.menuReady = 'true'; return }
        gsap.timeline({ onComplete: () => { element.dataset.menuReady = 'true' } })
          .fromTo(element, { xPercent: 100 }, { xPercent: 0, duration: .8, ease: 'power3.inOut' })
          .fromTo(element.querySelectorAll('[data-menu-item]'), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .65, stagger: .07, ease: 'power3.out' }, .3)
      } else if (element.open) { element.close(); menu.current?.focus() }
    }, element)
    return () => { context.revert(); gsap.killTweensOf(element) }
  }, [open])
  const close = () => {
    if (closing.current) return
    closing.current = true
    if (!dialog.current || matchMedia('(prefers-reduced-motion: reduce)').matches) { onClose(); return }
    gsap.to(dialog.current, { xPercent: 100, duration: .5, ease: 'power3.inOut', overwrite: true, onComplete: onClose })
  }
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className={styles.header}>
      <Link className={styles.brand} to="/" aria-label="RÜEGG HOTELS home"><BrandSeal /></Link>
      <div className={styles.actions}>
        <button ref={menu} className={styles.menu} onClick={onOpen} aria-haspopup="dialog" aria-expanded={open}>Menu <span className={styles.menuLines} aria-hidden="true"><i /><i /></span></button>
        <span className={styles.divider} aria-hidden="true" />
        <Link className={styles.book} to="/book">Book a stay <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
    <dialog className={styles.dialog} ref={dialog} aria-labelledby="menu-title" onCancel={(event) => { event.preventDefault(); close() }}>
      <div className={styles.menuTop}><BrandSeal /><button onClick={close} autoFocus aria-label="Close menu"><span aria-hidden="true">×</span></button></div>
      <p id="menu-title" className="eyebrow" data-menu-item>AN INVITATION TO BELONG</p>
      <p className={styles.menuHeading} data-menu-item>Make yourself<br /><em>at home.</em></p>
      <nav aria-label="Main navigation">{links.map(([to, label], index) => <Link onClick={onClose} data-menu-item key={to} to={to}><span className={styles.menuNumber}>0{index + 1}</span><span>{label}</span><span className={styles.menuArrow} aria-hidden="true">↗</span></Link>)}</nav>
      <div className={styles.menuFoot} data-menu-item><span>Agnes · Spalloni · Schiebel</span><p>Three alpine homes.<br />One invitation to belong.</p></div>
    </dialog>
  </>
}
