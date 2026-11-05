import { useEffect, useLayoutEffect, useReducer, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { SiteHeader } from '../../components/SiteHeader'
import { hotels } from '../../data/hotels'
import { chapterOf, cinematicReducer, initialState, isPlaying, underlyingView, type CinematicEvent, type StaticChapter } from './cinematicMachine'
import { poster } from './chapterConfig'
import { useCinematicController } from './useCinematicController'
import styles from './CinematicHomePage.module.css'

const descriptions: Record<StaticChapter, string> = {
  invitation: 'An alpine timber house at dusk, with mountains to the left and a warmly lit entrance.',
  welcome: 'A timber reception with a central portrait and open book, green armchair and carved counter.',
  hallway: 'A warm walnut hallway. The near door on the right opens into the optional room journey.',
  room: 'An imagined alpine bedroom, with a timber bed and a window looking towards the mountains.',
  finale: 'A communal table on the left, with candlelight, flowers and an alpine lounge beyond.',
}
const labels: Record<StaticChapter, string> = { invitation: 'The invitation', welcome: 'The welcome', hallway: 'The choice', room: 'The room', finale: 'The table' }
const staticPreference = () => matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)

export function CinematicHomePage() {
  const [state, dispatch] = useReducer(cinematicReducer, undefined, () => initialState(staticPreference()))
  const master = useRef<HTMLVideoElement>(null)
  const branch = useRef<HTMLVideoElement>(null)
  const panel = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)
  const presentation = useCinematicController(master, branch, state.view, dispatch)
  const view = underlyingView(state.view)
  const chapter = chapterOf(state.view)
  const staticMode = view.mode === 'STATIC_FALLBACK'
  const playing = isPlaying(view.mode)
  const interrupted = view.mode === 'USER_PAUSED' || view.mode === 'MEDIA_ERROR'
  const showVideo = (playing || view.mode === 'USER_PAUSED') && presentation.phase === 'ready'
  const info = view.mode === 'ROOM_INFO_OPEN' || (staticMode && chapter === 'room')
  const showEditorial = staticMode || ['INVITATION', 'WELCOME_PAUSED', 'HALLWAY_PAUSED', 'ROOM_AT_B3', 'ROOM_INFO_OPEN', 'FINALE'].includes(view.mode)
  const send = (type: Extract<CinematicEvent, { type: string }>['type']) => dispatch({ type } as CinematicEvent)

  useEffect(() => {
    for (const name of ['welcome', 'hallway', 'room', 'finale'] as const) { const image = new Image(); image.src = poster(name) }
  }, [])
  useLayoutEffect(() => {
    if (!showEditorial || !panel.current || state.reducedMotion) return
    const context = gsap.context(() => { gsap.fromTo(panel.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .45, ease: 'power2.out' }) })
    return () => context.revert()
  }, [view.mode, chapter, showEditorial, state.reducedMotion])
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    if (showEditorial && state.userHasInteracted) heading.current?.focus({ preventScroll: true })
  }, [view.mode, chapter, showEditorial, state.userHasInteracted])

  const action = (text: string, type: Parameters<typeof send>[0], outline = false) => <button className={`button ${outline ? 'button-outline' : ''}`} onClick={() => send(type)}>{text}<span aria-hidden="true">{text.startsWith('Back') ? '←' : '→'}</span></button>
  return <div className={styles.home}>
    <SiteHeader open={state.view.mode === 'MENU_OPEN'} onOpen={() => send('OPEN_MENU')} onClose={() => send('CLOSE_MENU')} />
    <main id="main-content" className={`${styles.stage} ${info ? styles.infoOpen : ''} ${chapter === 'finale' ? styles.atFinale : ''}`} data-state={state.view.mode} data-chapter={chapter} tabIndex={-1}>
      <h1 className="sr-only">RÜEGG HOTELS — An invitation to belong</h1>
      <div className={styles.mediaFrame} data-testid="media-frame">
        <img className={styles.still} src={poster(chapter)} alt={descriptions[chapter]} fetchPriority="high" width="1920" height="1080" />
        <video ref={master} className={`${styles.video} ${showVideo && presentation.video === 'master' ? styles.visibleVideo : ''}`} data-testid="master-video" playsInline muted preload="none" aria-hidden="true" tabIndex={-1} />
        <video ref={branch} className={`${styles.video} ${showVideo && presentation.video === 'branch' ? styles.visibleVideo : ''}`} data-testid="branch-video" playsInline muted preload="none" aria-hidden="true" tabIndex={-1} />
        {showEditorial && chapter === 'hallway' && <button className={styles.hotspot} onClick={() => send('ENTER_ROOM')} aria-label="Explore room through the right door"><span aria-hidden="true">+</span></button>}
      </div>
      {showEditorial && <section ref={panel} aria-label={labels[chapter]} className={`${styles.editorial} ${styles[chapter]}`}>
        <p className="eyebrow">{chapter === 'invitation' ? 'RÜEGG HOTELS / The invitation' : chapter === 'finale' ? 'RÜEGG HOTELS / The table' : `${chapter === 'welcome' ? '01' : chapter === 'hallway' ? '02' : '03'} / ${labels[chapter]}`}</p>
        <h2 ref={heading} tabIndex={-1}>{chapter === 'invitation' ? <>We show you{' '}<br />the warmth{' '}<br />of the mountains.</> : chapter === 'welcome' ? <>A welcome that<br />feels like home.</> : chapter === 'hallway' ? <>Where would you<br />like to go?</> : chapter === 'room' ? <>Make yourself<br />at home.</> : <>Pull up a chair.<br />Share your story.</>}</h2>
        {chapter === 'invitation' && <><p className={styles.introCopy}>Three alpine homes.<br />One invitation to belong.</p><div className={styles.actions}>{action('Step inside', 'START')}<Link className="text-link" to="/book">Book a stay ↗</Link></div></>}
        {chapter === 'welcome' && <div className={styles.actions}>{action('Continue the journey', 'CONTINUE')}<Link className="text-link" to="/our-story">Our story ↗</Link></div>}
        {chapter === 'hallway' && <div className={styles.actions}>{action('Explore room', 'ENTER_ROOM')}{action('Continue to the table', 'CONTINUE', true)}</div>}
        {chapter === 'room' && <>
          {info && <><p className={styles.introCopy}>A quieter moment<br />in the mountains.</p><p className={styles.disclosure}>An imagined brand space, not bookable room inventory.</p></>}
          <div className={styles.actions}>{info ? <Link className="button" to="/book">Explore our stays <span aria-hidden="true">↗</span></Link> : action('About this room', 'OPEN_ROOM_INFO')}{action('Back to hallway', 'BACK_TO_HALLWAY', true)}{info && !staticMode && <button className="text-link" onClick={() => send('CLOSE_ROOM_INFO')}>Close room information</button>}</div>
        </>}
        {chapter === 'finale' && <><p className={styles.selectorLabel}>Choose your home</p><div className={styles.hotelList}>{hotels.map((hotel) => <Link onClick={() => dispatch({ type: 'SELECT_HOTEL', hotel: hotel.id })} key={hotel.id} to={`/book?hotel=${hotel.id}`}><span>{hotel.name}<small>{hotel.destination}</small></span><span aria-hidden="true">↗</span></Link>)}</div><div className={styles.finaleLinks}><Link className="text-link" to="/partners">Our local circle ↗</Link><button className="text-link" onClick={() => send('REPLAY')}>Replay journey ↻</button></div></>}
      </section>}
      {playing && presentation.phase !== 'ready' && <div className={styles.loading} role="status">Preparing the next moment… <button className="text-link" onClick={() => send('ENTER_STATIC_MODE')}>Use still images</button></div>}
      {interrupted && <section className={styles.recovery} aria-label="Playback controls"><h2>{view.mode === 'USER_PAUSED' ? 'Take your time.' : 'The journey is still here.'}</h2><p>{view.mode === 'MEDIA_ERROR' ? view.errorCode : 'The film is paused. Resume whenever you are ready.'}</p><div className={styles.actions}>{action(view.mode === 'USER_PAUSED' ? 'Resume journey' : 'Retry film', view.mode === 'USER_PAUSED' ? 'RESUME' : 'RETRY')}{action('Use still images', 'ENTER_STATIC_MODE', true)}</div></section>}
      <footer className={styles.toolbar}>
        <span className={styles.chapterLabel}>{labels[chapter]}{staticMode ? ' · Still-image journey' : chapter === 'hallway' ? ' · 17.125 s' : ''}</span>
        <div className={styles.transport}>{playing && <button onClick={() => send('PAUSE')}>Pause film Ⅱ</button>}{chapter !== 'finale' && <><button onClick={() => send('SKIP')}>Skip to overview</button><Link to="/book">Go to booking ↗</Link></>}{!staticMode && <button onClick={() => send('ENTER_STATIC_MODE')}>Still images</button>}</div>
      </footer>
      <p className="sr-only" role="status" aria-live="polite">{interrupted ? view.mode === 'MEDIA_ERROR' ? 'Playback unavailable. Retry and still-image controls are available.' : 'Journey paused.' : playing ? 'Film playing.' : `${labels[chapter]}. ${descriptions[chapter]}`}</p>
    </main>
  </div>
}
