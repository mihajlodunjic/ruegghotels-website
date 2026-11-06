import { useReducer, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../../components/SiteHeader'
import { BrandSeal } from '../../components/BrandSeal'
import { hotels } from '../../data/hotels'
import { chapterOf, cinematicReducer, initialState, isPlaying, underlyingView, type HotelId, type StaticChapter } from './cinematicMachine'
import { poster, chapterDescriptions as descriptions } from './chapterConfig'
import { useCinematicController } from './useCinematicController'
import { useEditorialMotion } from './useEditorialMotion'
import styles from './CinematicHomePage.module.css'

const labels: Record<StaticChapter, string> = { invitation: 'The invitation', welcome: 'The welcome', hallway: 'The choice', room: 'The room', finale: 'The table' }
const numbers: Record<StaticChapter, string> = { invitation: '00', welcome: '01', hallway: '02', room: '02', finale: '03' }
const destinations: Record<HotelId, string> = { agnes: 'Kandersteg, Switzerland', spalloni: 'Splügen, Switzerland', schiebel: 'Oberstdorf, Germany' }
const staticPreference = () => matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)

export function CinematicHomePage() {
  const [state, dispatch] = useReducer(cinematicReducer, undefined, () => initialState(staticPreference()))
  const master = useRef<HTMLVideoElement>(null)
  const branch = useRef<HTMLVideoElement>(null)
  const stage = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const plane = useRef<HTMLDivElement>(null)
  const images = useRef<[HTMLImageElement | null, HTMLImageElement | null]>([null, null])
  const panel = useRef<HTMLElement>(null)
  const exits = useRef<HTMLDivElement>(null)
  const { presentation, cancel, retry } = useCinematicController(master, branch, images, plane, state.view, dispatch)
  const view = underlyingView(state.view)
  const chapter = chapterOf(state.view)
  const staticMode = view.mode === 'STATIC_FALLBACK'
  const playing = isPlaying(view.mode)
  const rewinding = view.mode === 'REWINDING'
  const interrupted = view.mode === 'USER_PAUSED' || view.mode === 'MEDIA_ERROR' || presentation.phase === 'error'
  const beginning = view.mode === 'INVITATION' || (staticMode && chapter === 'invitation')
  const showVideo = presentation.video !== null && ['ready', 'holding', 'error'].includes(presentation.phase)
  const info = view.mode === 'ROOM_INFO_OPEN' || (staticMode && chapter === 'room')
  const wantsEditorial = staticMode || ['INVITATION', 'WELCOME_PAUSED', 'HALLWAY_PAUSED', 'ROOM_AT_B3', 'ROOM_INFO_OPEN', 'FINALE'].includes(view.mode)
  // Rewind retains the outgoing painted still/frame while the inactive video prepares.
  const visualReady = rewinding || (wantsEditorial ? presentation.still === chapter && presentation.phase === 'idle' : ['ready', 'holding'].includes(presentation.phase))
  const showEditorial = wantsEditorial && visualReady
  const send = useEditorialMotion({ stage, frame, panel, exits, mode: view.mode, chapter, info, showEditorial, visualReady, reducedMotion: state.reducedMotion, dispatch })
  const restart = () => { if (!rewinding) { cancel(); send('REWIND') } }
  const finishRewind = () => { cancel(); send('REPLAY') }
  const action = (text: string, type: Parameters<typeof send>[0], secondary = false) => <button data-motion-link className={`${styles.action} ${secondary ? styles.secondary : ''}`} onClick={() => send(type)}><span>{text}</span><span data-motion-arrow className={styles.actionArrow} aria-hidden="true">{text.startsWith('Back') ? '←' : '↗'}</span></button>
  return <div className={styles.home}>
    <SiteHeader open={state.view.mode === 'MENU_OPEN'} onOpen={() => dispatch({ type: 'OPEN_MENU' })} onClose={() => dispatch({ type: 'CLOSE_MENU' })} onBeginning={!beginning ? restart : undefined} />
    <main ref={stage} id="main-content" className={`${styles.stage} ${info ? styles.infoOpen : ''} ${chapter === 'finale' ? styles.atFinale : ''}`} data-state={state.view.mode} data-chapter={chapter} data-playing={playing} data-rewinding={rewinding} data-ui-ready="true" data-visual-ready={visualReady} data-media-phase={presentation.phase} data-still={presentation.still} tabIndex={-1} onKeyDown={(event) => { if (rewinding && event.key === 'Escape') { event.preventDefault(); finishRewind() } }}>
      <h1 className="sr-only">RÜEGG HOTELS — An invitation to belong</h1>
      <div ref={frame} className={styles.mediaFrame} data-testid="media-frame">
        <div ref={plane} className={styles.sourcePlane} data-testid="source-plane">
        {/* The controller owns image sources and active attributes after mount, like native video.src. */}
        <img ref={(element) => { images.current[0] = element }} className={styles.still} src={poster('invitation')} alt={descriptions.invitation} fetchPriority="high" width="1920" height="1080" data-active="true" />
        <img ref={(element) => { images.current[1] = element }} className={styles.still} alt="" aria-hidden="true" width="1920" height="1080" data-active="false" />
        <video ref={master} className={`${styles.video} ${showVideo && presentation.video === 'master' ? styles.visibleVideo : ''}`} data-testid="master-video" playsInline muted preload="none" aria-hidden="true" tabIndex={-1} />
        <video ref={branch} className={`${styles.video} ${showVideo && presentation.video === 'branch' ? styles.visibleVideo : ''}`} data-testid="branch-video" playsInline muted preload="none" aria-hidden="true" tabIndex={-1} />
        {showEditorial && chapter === 'hallway' && <button className={styles.hotspot} onClick={() => send('ENTER_ROOM')} aria-label="Explore room through the right door"><span className={styles.doorMark} aria-hidden="true">↗</span><span className={styles.doorLabel} aria-hidden="true">Come in</span></button>}
        </div>
      </div>
      {showEditorial && <section ref={panel} aria-label={labels[chapter]} className={`${styles.editorial} ${styles[chapter]} ${chapter === 'room' ? info ? styles.roomInfo : styles.roomDock : ''}`}>
        <div className={styles.panelMasthead} data-reveal><p className="eyebrow">{chapter === 'invitation' ? 'AN INVITATION TO BELONG' : chapter === 'finale' ? 'RÜEGG HOTELS / OUR ALPINE HOMES' : `${chapter === 'welcome' ? '01 / A WARM WELCOME' : chapter === 'hallway' ? '02 / A MOMENT OF DISCOVERY' : 'YOUR OWN QUIET CORNER'}`}</p>{chapter === 'invitation' && <BrandSeal className={styles.invitationSeal} />}</div>
        <h2 tabIndex={-1}>{chapter === 'invitation' ? <><span data-line>We show you</span>{' '}<em data-line>the warmth of</em>{' '}<em data-line>the mountains.</em></> : chapter === 'welcome' ? <><span data-line>A welcome that</span>{' '}<em data-line>feels like home.</em></> : chapter === 'hallway' ? <><span data-line>Where would you</span>{' '}<em data-line>like to go?</em></> : chapter === 'room' ? info ? <><span data-line>Make yourself</span>{' '}<em data-line>at home.</em></> : <span data-line>Stay a little longer.</span> : <><span data-line>Pull up a chair.</span>{' '}<em data-line>Share your story.</em></>}</h2>
        {chapter === 'invitation' && <><p className={styles.introCopy} data-reveal>Three alpine homes.<br />One invitation to belong.</p><div className={styles.actions} data-reveal>{action('Step Inside', 'START')}<Link className={styles.quietLink} to="/book">Book a Stay <span aria-hidden="true">↗</span></Link></div><p className={styles.invitationNote} data-reveal>A little closer to the mountains.<br />A little closer to home.</p></>}
        {chapter === 'welcome' && <div className={styles.actions} data-reveal>{action('Continue the Journey', 'CONTINUE')}<Link className={styles.quietLink} to="/our-story">Our Story <span aria-hidden="true">↗</span></Link></div>}
        {chapter === 'hallway' && <div className={styles.actions} data-reveal>{action('Explore Room', 'ENTER_ROOM')}{action('Continue to the Table', 'CONTINUE', true)}</div>}
        {chapter === 'room' && <>
          {info && <><p className={styles.introCopy} data-reveal>A quieter moment in the mountains.<br />Let the outside world wait a while.</p><p className={styles.disclosure} data-reveal>Make space for quieter mornings.<br />And a little time for yourself.</p></>}
          {info && !staticMode && <button className={styles.closeInfo} onClick={() => send('CLOSE_ROOM_INFO')} aria-label="Close room information"><span aria-hidden="true">×</span></button>}
          <div className={styles.actions} data-reveal>{info ? <Link data-motion-link className={styles.action} to="/book"><span>Explore Our Stays</span><span data-motion-arrow className={styles.actionArrow} aria-hidden="true">↗</span></Link> : action('About this Room', 'OPEN_ROOM_INFO')}{action('Back to Hallway', 'BACK_TO_HALLWAY', true)}</div>
        </>}
        {chapter === 'finale' && <><p className={styles.selectorLabel} data-reveal>Find your home in the mountains</p><div className={styles.hotelList}>{hotels.map((hotel, index) => <Link data-reveal data-motion-link onClick={() => dispatch({ type: 'SELECT_HOTEL', hotel: hotel.id })} key={hotel.id} to={`/book?hotel=${hotel.id}`}><span className={styles.hotelNumber}>0{index + 1}</span><span className={styles.hotelName}>{hotel.name}<small>{destinations[hotel.id]}</small></span><span data-motion-arrow className={styles.hotelArrow} aria-hidden="true">↗</span></Link>)}</div><div className={styles.finaleDiscovery} data-reveal><Link className={styles.quietLink} to="/experiences">Design Your Alpine Experience <span aria-hidden="true">↗</span></Link><Link className={styles.quietLink} to="/passport">Discover RÜEGG Passport <span aria-hidden="true">↗</span></Link><div className={styles.finaleLinks}><Link className={styles.quietLink} to="/partners">Our Local Circle <span aria-hidden="true">↗</span></Link><button className={styles.quietLink} onClick={restart}>Replay Journey <span aria-hidden="true">↻</span></button></div></div></>}
      </section>}
      <div ref={exits} className={styles.exitLayer} aria-hidden="true" />
      {playing && <div className={styles.playingCaption} aria-hidden="true"><span className="eyebrow">THE JOURNEY / RÜEGG HOTELS</span><p>{view.mode === 'ROOM_ENTERING' ? 'A quiet corner awaits.' : view.mode === 'ROOM_EXITING' ? 'The journey continues.' : 'A little closer to home.'}</p></div>}
      {!interrupted && ['loading', 'waiting', 'holding'].includes(presentation.phase) && <div className={styles.loading} role="status"><span className={styles.loadingDot} />Preparing the next moment… <button className={styles.quietLink} onClick={() => send('ENTER_STATIC_MODE')}>Use still images</button></div>}
      {interrupted && <section className={styles.recovery} aria-label="Playback controls"><p className="eyebrow">AT YOUR OWN PACE</p><h2>{view.mode === 'USER_PAUSED' ? 'Take your time.' : 'The journey is still here.'}</h2><p>{presentation.error || (view.mode === 'MEDIA_ERROR' ? view.errorCode : 'The film is paused. Resume whenever you are ready.')}</p><div className={styles.actions}>{presentation.phase === 'error' ? <button className={styles.action} onClick={retry}>Retry scene</button> : action(view.mode === 'USER_PAUSED' ? 'Resume Journey' : 'Retry Film', view.mode === 'USER_PAUSED' ? 'RESUME' : 'RETRY')}{action('Use still images', 'ENTER_STATIC_MODE', true)}</div></section>}
      <footer className={styles.toolbar}>
        <div className={styles.chapterLabel}><span>{numbers[chapter]} <i>/ 03</i></span><span className={styles.chapterLine} /><span>{labels[chapter]}{staticMode ? ' · Stills' : ''}</span></div>
        {!beginning && <button className={styles.beginning} onClick={rewinding ? finishRewind : restart}>{rewinding ? 'Finish rewind' : 'Back to Beginning'} <span aria-hidden="true">↶</span></button>}
        {!rewinding && <div className={styles.transport}>{playing && <button onClick={() => send('PAUSE')}>Pause film <span aria-hidden="true">Ⅱ</span></button>}{chapter !== 'finale' && <button onClick={() => send('SKIP')}>Skip to overview <span aria-hidden="true">↗</span></button>}{!staticMode && <button onClick={() => send('ENTER_STATIC_MODE')}>Still images</button>}</div>}
      </footer>
      <p className="sr-only" role="status" aria-live="polite">{rewinding ? 'Returning to the beginning. Press Escape or Finish rewind to return immediately.' : interrupted ? view.mode === 'MEDIA_ERROR' ? 'Playback unavailable. Retry and still-image controls are available.' : 'Journey paused.' : playing ? 'Film playing.' : `${labels[chapter]}. ${descriptions[chapter]}`}</p>
    </main>
  </div>
}
