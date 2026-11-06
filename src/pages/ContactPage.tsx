import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { SupportingPageLayout } from '../components/SupportingPageLayout'
import { hotels } from '../data/hotels'
import { enquiryCategories, blankEnquiry, validateEnquiry, formatEnquiry, type EnquiryDraft, type EnquiryErrors } from '../lib/enquiry'
import { poster } from '../features/cinematic/chapterConfig'
import shared from './Pages.module.css'
import styles from './ContactPage.module.css'

export function ContactPage() {
  const [params] = useSearchParams()
  const [draft, setDraft] = useState(() => blankEnquiry(params.get('hotel'), params.get('category')))
  const [errors, setErrors] = useState<EnquiryErrors>({})
  const [phase, setPhase] = useState<'write' | 'review'>('write')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const form = useRef<HTMLFormElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const message = useRef<HTMLTextAreaElement>(null)
  const formatted = formatEnquiry(draft)
  useLayoutEffect(() => {
    const element = panel.current
    if (!element || phase !== 'review') return
    element.scrollIntoView({ block: 'start' })
    element.querySelector('h2')?.focus({ preventScroll: true })
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = gsap.context(() => gsap.fromTo(element, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .55, ease: 'power3.out' }), element)
    return () => context.revert()
  }, [phase])
  function update<K extends keyof EnquiryDraft>(key: K, value: EnquiryDraft[K]) { setDraft((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })) }
  const prepare = (event: FormEvent) => {
    event.preventDefault()
    const next = validateEnquiry(draft)
    setErrors(next)
    if (Object.keys(next).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return }
    setCopyState('idle'); setPhase('review')
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(formatted); setCopyState('copied') }
    catch { setCopyState('manual'); message.current?.focus(); message.current?.select() }
  }
  const fieldError = (key: keyof EnquiryErrors) => errors[key] ? <p className={shared.error} id={`${key}-error`} role="alert">{errors[key]}</p> : null
  return <SupportingPageLayout><div className={shared.container}>
    <header className={`${shared.hero} ${styles.hero}`}><div><p className="eyebrow" data-enter>LET’S BEGIN A CONVERSATION</p><h1 className={shared.title} data-enter>Every stay begins<br /><em>with a conversation.</em></h1></div><p className={shared.lead} data-enter>A question, a plan, a little possibility.<br />We’re always happy to make room for it.</p></header>
    <div className={styles.contactGrid}>
      <aside className={styles.aside}><p className={shared.sectionLabel}>A LITTLE PERSONAL ATTENTION</p><h2>You bring the question.<br /><em>We’ll make room.</em></h2><p>Whether you’re planning your first mountain escape, bringing a group together or thinking about your next adventure, start here.</p><Link className={shared.link} to="/book">Ready to choose your stay? <span aria-hidden="true">↗</span></Link><figure><img src={poster('welcome')} width="1920" height="1080" alt="Warm timber, soft light and an inviting alpine reception" /><figcaption>A warm welcome starts before you arrive.</figcaption></figure><details><summary>Planning a stay with a group? <span aria-hidden="true">+</span></summary><p>Tell us about your dates, your group and the kind of time you would like to share. We’ll take it from there, one conversation at a time.</p></details><details><summary>Not sure which home to choose? <span aria-hidden="true">+</span></summary><p>Agnes in Kandersteg. Spalloni in Splügen. Schiebel in Oberstdorf. Let us know what matters most to you, or <Link to="/book">explore all three</Link>.</p></details></aside>
      <div ref={panel} className={styles.panel} data-enquiry-step={phase}>
        {phase === 'write' ? <form ref={form} onSubmit={prepare} noValidate><p className={shared.sectionLabel}>A NOTE TO RÜEGG</p><h2 className={shared.subheading}>What’s on your mind?</h2><div className={shared.formGrid}>
          <div className={shared.field}><label htmlFor="enquiry-category">How can we help?</label><select id="enquiry-category" className={shared.input} value={draft.category} onChange={(event) => update('category', event.target.value as EnquiryDraft['category'])} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? 'category-error' : undefined}>{enquiryCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select>{fieldError('category')}</div>
          <div className={shared.field}><label htmlFor="enquiry-hotel">Your alpine home (optional)</label><select id="enquiry-hotel" className={shared.input} value={draft.hotelId} onChange={(event) => update('hotelId', event.target.value as EnquiryDraft['hotelId'])} aria-invalid={Boolean(errors.hotelId)}><option value="">I’m open to all three</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name} — {hotel.town}</option>)}</select>{fieldError('hotelId')}</div>
          <div className={shared.field}><label htmlFor="enquiry-name">Your name</label><input id="enquiry-name" className={shared.input} value={draft.name} maxLength={80} autoComplete="off" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} onChange={(event) => update('name', event.target.value)} />{fieldError('name')}</div>
          <div className={shared.field}><label htmlFor="enquiry-email">Email</label><input id="enquiry-email" type="email" className={shared.input} value={draft.email} maxLength={254} autoComplete="off" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} onChange={(event) => update('email', event.target.value)} />{fieldError('email')}</div>
          <div className={`${shared.field} ${shared.full}`}><label htmlFor="enquiry-message">Your message</label><textarea id="enquiry-message" className={shared.input} value={draft.message} maxLength={2000} rows={6} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : 'message-hint'} onChange={(event) => update('message', event.target.value)} /><div className={styles.messageFoot}><span id="message-hint">Tell us a little about your plans.</span><span>{draft.message.length} / 2000</span></div>{fieldError('message')}</div>
        </div><div className={shared.formActions}><button className={shared.cta} type="submit">Prepare your enquiry <span aria-hidden="true">↗</span></button><span className={styles.nextNote}>A moment to review before your next step.</span></div></form>
        : <section aria-labelledby="enquiry-ready"><p className={shared.sectionLabel}>ALL YOUR THOUGHTS, IN ONE PLACE</p><h2 className={shared.subheading} id="enquiry-ready" tabIndex={-1}>Your enquiry<br /><em>is ready to keep.</em></h2><p className={styles.localNotice}>Prepared locally on this device. Your enquiry has not been delivered.</p><label className={styles.previewLabel} htmlFor="enquiry-preview">Your prepared enquiry</label><textarea id="enquiry-preview" ref={message} className={styles.preview} readOnly rows={12} value={formatted} /><div className={shared.formActions}><button type="button" className={shared.cta} onClick={() => void copy()}>{copyState === 'copied' ? 'Enquiry copied' : 'Copy enquiry'} <span aria-hidden="true">{copyState === 'copied' ? '✓' : '↗'}</span></button><button type="button" className={shared.link} onClick={() => setPhase('write')}>← Edit your enquiry</button></div><p className={styles.copyStatus} role="status">{copyState === 'copied' ? 'Copied to your clipboard. Your enquiry has not been sent.' : copyState === 'manual' ? 'Copying isn’t available here. Select and copy the prepared message above.' : 'Copy your enquiry to keep it for your next conversation.'}</p><button type="button" className={shared.link} onClick={() => { setDraft(blankEnquiry(params.get('hotel'), params.get('category'))); setErrors({}); setCopyState('idle'); setPhase('write') }}>Start a new enquiry <span aria-hidden="true">↗</span></button></section>}
      </div>
    </div>
    <section className={styles.closing} data-section><p className={shared.sectionLabel}>A PLACE TO BELONG</p><h2>However you find us,<br /><em>you’re welcome here.</em></h2><Link className={shared.link} to="/our-story">Get to know our story <span aria-hidden="true">↗</span></Link></section>
  </div></SupportingPageLayout>
}
