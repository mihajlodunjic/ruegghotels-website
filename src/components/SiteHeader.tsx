import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './SiteHeader.module.css'

const links = [['/', 'The journey'], ['/our-story', 'Our story'], ['/partners', 'Our local circle'], ['/book', 'Explore our stays'], ['/contact', 'Contact']] as const
export function SiteHeader({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const menu = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (open) dialog.current?.showModal()
    else if (dialog.current?.open) { dialog.current.close(); menu.current?.focus() }
  }, [open])
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className={styles.header}>
      <Link className={styles.brand} to="/" aria-label="RÜEGG HOTELS home">RÜEGG<span> HOTELS</span></Link>
      <div className={styles.actions}>
        <button ref={menu} className={styles.menu} onClick={onOpen} aria-haspopup="dialog" aria-expanded={open}>Menu <span aria-hidden="true">☰</span></button>
        <Link className={styles.book} to="/book">Book</Link>
      </div>
    </header>
    <dialog className={styles.dialog} ref={dialog} aria-labelledby="menu-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClose={onClose}>
      <div className={styles.menuTop}><p id="menu-title" className="eyebrow">RÜEGG HOTELS</p><button onClick={onClose} autoFocus>Close <span aria-hidden="true">×</span></button></div>
      <nav aria-label="Main navigation">{links.map(([to, label], index) => <Link onClick={onClose} key={to} to={to}><span className="eyebrow">0{index + 1}</span>{label}<span aria-hidden="true">↗</span></Link>)}</nav>
      <p className={styles.note}>Three alpine homes. One invitation to belong.</p>
    </dialog>
  </>
}
