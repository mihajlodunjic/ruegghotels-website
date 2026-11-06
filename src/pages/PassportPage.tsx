import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { SupportingPageLayout } from '../components/SupportingPageLayout'
import { BrandSeal } from '../components/BrandSeal'
import { CopyTextAction } from '../components/CopyTextAction'
import { hotels } from '../data/hotels'
import { experiences, experienceProfiles } from '../data/experiences'
import { todayISO } from '../features/booking/bookingModel'
import { seasonFor } from '../features/experiences/experiencePlanner'
import { readPassport, savePassport, browserPassportStorage, passportReducer, remainingHotels, rewardUnlocked } from '../features/passport/passportModel'
import type { HotelId } from '../features/cinematic/cinematicMachine'
import shared from './Pages.module.css'
import styles from './PassportPage.module.css'

const arrow = <span aria-hidden="true">↗</span>
export function PassportPage() {
  const [state, setState] = useState(() => readPassport(browserPassportStorage()))
  const [lastStamp, setLastStamp] = useState<HotelId | null>(null)
  const [rewardOpen, setRewardOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const passport = state.passport
  const remaining = remainingHotels(passport)
  const unlocked = rewardUnlocked(passport)
  const chapters = hotels.map((hotel) => ({ hotel, experience: experiences.find((item) => item.hotelId === hotel.id && experienceProfiles[item.id].seasons.includes(seasonFor(todayISO())) && experienceProfiles[item.id].intensity.includes('relaxed'))! }))
  const collect = (hotelId: HotelId) => {
    const next = passportReducer(passport, { type: 'COLLECT', hotelId })
    if (next === passport) return
    const available = savePassport(next, browserPassportStorage())
    setState({ passport: next, available }); setLastStamp(hotelId)
  }
  const reset = () => { const next = passportReducer(passport, { type: 'RESET' }); setState({ passport: next, available: savePassport(next, browserPassportStorage()) }); setLastStamp(null); setRewardOpen(false) }
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    element.dataset.passportReady = 'true'
    if (!lastStamp || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const stamp = element.querySelector(`[data-stamp="${lastStamp}"]`)
    if (!stamp) return
    element.dataset.passportReady = 'false'
    const context = gsap.context(() => {
      gsap.fromTo(stamp, { scale: 1.1, rotation: -11, opacity: .55 }, { scale: 1, rotation: -4, opacity: 1, duration: .7, ease: 'power3.out', onComplete: () => { element.dataset.passportReady = 'true' } })
      if (unlocked) gsap.fromTo(element.querySelector('[data-unlocked]'), { y: 16, opacity: .4 }, { y: 0, opacity: 1, duration: .8, ease: 'power3.out' })
    }, element)
    return () => context.revert()
  }, [lastStamp, unlocked])
  useLayoutEffect(() => {
    const element = root.current
    if (!element || !rewardOpen || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rows = element.querySelectorAll('[data-reward-chapter]')
    if (!rows.length) return
    element.dataset.passportReady = 'false'
    const context = gsap.context(() => gsap.fromTo(rows, { y: 16, opacity: .4 }, { y: 0, opacity: 1, duration: .65, stagger: .1, ease: 'power3.out', onComplete: () => { element.dataset.passportReady = 'true' } }), element)
    return () => context.revert()
  }, [rewardOpen])
  const collectionText = `RÜEGG PASSPORT — THE THREE ALPINE CHAPTERS\n\n${chapters.map(({ hotel, experience }, index) => `CHAPTER 0${index + 1} — ${hotel.name}, ${hotel.town}\n${experience.title}\n${experience.description}\n${experience.detail}`).join('\n\n')}\n\nA digital demo collection. No stay, activity or commercial reward has been reserved. Check local conditions and arrangements when planning.`
  return <SupportingPageLayout><div ref={root} className={shared.container} data-passport-ready="true" data-passport-count={passport.stamps.length}>
    <header className={`${shared.hero} ${styles.hero}`}><div><p className="eyebrow" data-enter>RÜEGG PASSPORT</p><h1 className={shared.title} data-enter>Three alpine homes.<br /><em>One story.</em></h1></div><div className={styles.heroAside} data-enter><p className={shared.lead}>The places we return to become part of us. Gather a chapter in each of our three mountain homes.</p><a className={shared.link} href="#your-passport">Open your passport {arrow}</a></div></header>
    <section id="your-passport" className={styles.book} aria-label="Your demo RÜEGG Passport">
      <div className={styles.cover}><div className={styles.coverTop}><span>YOUR ALPINE COMPANION</span><BrandSeal /></div><div><p className={styles.coverTitle}>RÜEGG<br /><em>Passport</em></p><p className={styles.coverCopy}>For the places that stay with you.<br />And the ones still waiting.</p></div><div className={styles.journeyStatus}><p className={styles.progressCount} role="status"><strong>{passport.stamps.length} <i>/ 3</i></strong><span>destinations discovered</span></p><div className={styles.progressRule} aria-hidden="true"><span style={{ width: `${passport.stamps.length / 3 * 100}%` }} /></div><p className={styles.demoNote}>Your demo passport. Collect a sample stamp to see your story grow.</p><p className={styles.persistence}>{state.available ? 'Your demo stamps are kept on this device.' : 'Your stamps are available for this visit. Saving on this device isn’t available.'}</p><button type="button" className={shared.link} onClick={reset}>Reset demo passport <span aria-hidden="true">↻</span></button></div></div>
      <div className={styles.ledger}>{hotels.map((hotel, index) => { const collected = passport.stamps.includes(hotel.id); return <article key={hotel.id} className={styles.destination} data-testid={`passport-${hotel.id}`}><div className={styles.stampColumn}><div className={`${styles.stamp} ${collected ? styles.collected : ''}`} data-stamp={hotel.id} role="img" aria-label={`${hotel.name} demo destination stamp, ${collected ? 'collected' : 'waiting to be collected'}`}><span>CHAPTER 0{index + 1}</span><strong>{hotel.town}</strong><em>{hotel.name}</em><small>{hotel.country}</small><span>{collected ? 'DEMO CHAPTER COLLECTED' : 'A CHAPTER STILL TO COME'}</span></div><span className={styles.stampStatus}>{collected ? 'A little closer to belonging.' : 'Your story starts whenever you like.'}</span></div><div className={styles.destinationStory}><p className={shared.sectionLabel}>0{index + 1} / {hotel.country.toUpperCase()}</p><h2>RÜEGG <em>{hotel.name}</em></h2><p>{hotel.note}</p><div className={styles.destinationActions}><button type="button" className={shared.link} disabled={collected} onClick={() => collect(hotel.id)} aria-label={`${collected ? 'Demo stamp collected' : 'Collect demo stamp'} for ${hotel.name}`}>{collected ? 'Demo stamp collected' : 'Collect demo stamp'} <span aria-hidden="true">{collected ? '✓' : '↗'}</span></button><Link className={shared.link} to={`/book?hotel=${hotel.id}`}>Stay with {hotel.name} {arrow}</Link></div></div></article> })}<p className={styles.ledgerFoot}>Sample stamps show the experience. A completed stay has not been verified, and a booking preview does not award a stamp.</p></div>
    </section>
    <section className={`${styles.reward} ${unlocked ? styles.rewardUnlocked : ''}`} aria-labelledby="reward-heading" data-reward-unlocked={unlocked}>
      {unlocked ? <><div data-unlocked className={styles.rewardOpening}><p className={shared.sectionLabel}>THREE CHAPTERS, BEAUTIFULLY GATHERED</p><h2 id="reward-heading">A seat at<br /><em>every table.</em></h2><p>Your three demo stamps have opened a little something for the road ahead: a collection of mountain days, one for every RÜEGG home.</p><button type="button" className={shared.cta} aria-expanded={rewardOpen} aria-controls="alpine-chapters" onClick={() => setRewardOpen(!rewardOpen)}>{rewardOpen ? 'Close your three alpine chapters' : 'Open your three alpine chapters'} {arrow}</button></div>{rewardOpen && <div id="alpine-chapters" className={styles.chapters}><header><p className={shared.sectionLabel}>YOUR DIGITAL ITINERARY COLLECTION</p><h3>The three<br /><em>alpine chapters.</em></h3><p>Three places. Three ways to make a little time your own. Each chapter opens a plan you can shape around your date and rhythm.</p></header>{chapters.map(({ hotel, experience }, index) => <article key={hotel.id} data-reward-chapter><span className={styles.chapterNumber}>0{index + 1}</span><div><p className={shared.sectionLabel}>{hotel.town} / RÜEGG {hotel.name}</p><h4>{experience.title}</h4><p>{experience.description}</p><span className={styles.chapterSeason}>{experience.season}</span></div><Link className={shared.link} to={`/experiences?${new URLSearchParams({ hotel: hotel.id, experience: experience.id, interest: experience.category }).toString()}`}>Plan your {hotel.town} chapter {arrow}</Link></article>)}<div className={styles.collectionAction}><CopyTextAction text={collectionText} label="Copy your chapter collection" /><p>A digital keepsake to explore. It does not include discounts, free stays or reserved activities.</p></div></div>}</> : <div className={styles.rewardLocked}><span className={styles.rewardNumber} aria-hidden="true">03</span><div><p className={shared.sectionLabel}>A LITTLE SOMETHING FOR THE JOURNEY</p><h2 id="reward-heading">A seat at<br /><em>every table.</em></h2><p>Collect all three demo stamps to open <em>The Three Alpine Chapters</em> — a digital collection with a thoughtfully chosen experience in every destination.</p><span>{3 - passport.stamps.length} {3 - passport.stamps.length === 1 ? 'chapter' : 'chapters'} still to come.</span></div></div>}
    </section>
    <section className={styles.nextDestinations} aria-labelledby="next-chapter-heading" data-section><div><p className={shared.sectionLabel}>{unlocked ? 'THERE’S ALWAYS ANOTHER BEGINNING' : 'YOUR NEXT CHAPTER'}</p><h2 id="next-chapter-heading">{unlocked ? <>Keep the story<br /><em>going.</em></> : <>A place still<br /><em>waiting for you.</em></>}</h2></div><div>{remaining.length ? remaining.map((hotel) => <Link key={hotel.id} to={`/book?hotel=${hotel.id}`}><span>{hotel.name}<small>{hotel.town}, {hotel.country}</small></span><span aria-hidden="true">↗</span></Link>) : <><p>Revisit a favourite home, or find a new way to spend a familiar mountain day.</p><Link className={shared.link} to="/experiences">Design your next alpine experience {arrow}</Link><Link className={shared.link} to="/book">Return to our alpine homes {arrow}</Link></>}</div></section>
  </div></SupportingPageLayout>
}
