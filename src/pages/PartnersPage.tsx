import { useLayoutEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { SupportingPageLayout } from '../components/SupportingPageLayout'
import { hotels, isHotelId, getHotel } from '../data/hotels'
import { experienceCategories, filterExperiences, type ExperienceCategory } from '../data/experiences'
import { poster } from '../features/cinematic/chapterConfig'
import shared from './Pages.module.css'
import styles from './PartnersPage.module.css'

export function PartnersPage() {
  const [params, setParams] = useSearchParams()
  const rawDestination = params.get('destination')
  const destination = isHotelId(rawDestination) ? rawDestination : 'all'
  const rawCategory = params.get('category')
  const category: ExperienceCategory | 'all' = experienceCategories.some((item) => item.id === rawCategory) ? rawCategory as ExperienceCategory : 'all'
  const visible = filterExperiences(destination, category)
  const list = useRef<HTMLDivElement>(null)
  const update = (key: 'destination' | 'category', value: string) => { const next = new URLSearchParams(params); if (value === 'all') next.delete(key); else next.set(key, value); setParams(next, { preventScrollReset: true }) }
  useLayoutEffect(() => {
    const root = list.current
    if (!root) return
    root.setAttribute('data-filter-ready', 'false')
    const rows = root.querySelectorAll('article')
    if (!rows.length || matchMedia('(prefers-reduced-motion: reduce)').matches) { root.setAttribute('data-filter-ready', 'true'); return }
    const context = gsap.context(() => gsap.fromTo(rows, { y: 12, opacity: .4 }, { y: 0, opacity: 1, duration: .5, stagger: .04, ease: 'power3.out', onComplete: () => root.setAttribute('data-filter-ready', 'true') }), root)
    return () => context.revert()
  }, [destination, category])
  return <SupportingPageLayout><div className={shared.container}>
    <header className={`${shared.hero} ${styles.hero}`}><div><p className="eyebrow" data-enter>OUR LOCAL CIRCLE</p><h1 className={shared.title} data-enter>Beyond our doors,<br /><em>the mountains are yours.</em></h1></div><p className={shared.lead} data-enter>The best discoveries begin with a little curiosity. Find a slower path, a shared adventure or a new favourite way to spend the day.</p></header>
    <figure className={styles.landscape} data-enter><img src={poster('invitation')} width="1920" height="1080" alt="Warm alpine light across a mountain house and the landscape beyond" /><figcaption>A LITTLE FURTHER. A LITTLE FREER.</figcaption></figure>
    <section className={styles.guide} aria-labelledby="guide-heading"><div className={styles.guideHeading}><div><p className={shared.sectionLabel}>THREE PLACES. COUNTLESS POSSIBILITIES.</p><h2 id="guide-heading" className={shared.subheading}>Follow your curiosity.</h2></div><Link className={shared.link} to="/experiences">Design your alpine experience <span aria-hidden="true">↗</span></Link></div>
      <div className={styles.filters}><div className={styles.destinations} aria-label="Filter by destination"><button aria-pressed={destination === 'all'} onClick={() => update('destination', 'all')}>All places</button>{hotels.map((hotel) => <button key={hotel.id} aria-pressed={destination === hotel.id} onClick={() => update('destination', hotel.id)}>{hotel.town}</button>)}</div><div className={styles.category}><label htmlFor="experience-category">Your kind of day</label><select id="experience-category" value={category} onChange={(event) => update('category', event.target.value)}><option value="all">All experiences</option>{experienceCategories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div></div>
      <p className={styles.resultCount} role="status">{String(visible.length).padStart(2, '0')} {visible.length === 1 ? 'idea' : 'ideas'} for your time here</p>
      <div ref={list} className={styles.list} data-filter-ready="true">{visible.map((experience, i) => { const hotel = getHotel(experience.hotelId)!; return <article key={experience.id} className={styles.experience} data-testid="experience-row"><span className={styles.number}>{String(i + 1).padStart(2, '0')}</span><div className={styles.experienceBody}><p className={shared.sectionLabel}>{hotel.town} / {experienceCategories.find((item) => item.id === experience.category)?.label}</p><h3>{experience.title}</h3><p>{experience.description}</p><details><summary>Discover more <span aria-hidden="true">+</span></summary><p>{experience.detail}</p><Link className={shared.link} to={`/contact?hotel=${hotel.id}&category=activities`}>Let’s shape your day <span aria-hidden="true">↗</span></Link><Link className={shared.link} to={`/experiences?${new URLSearchParams({ hotel: hotel.id, interest: experience.category, experience: experience.id }).toString()}`}>Personalize this experience <span aria-hidden="true">↗</span></Link></details></div><div className={styles.experienceAside}><span>{experience.season}</span><p>{experience.rhythm}</p><Link className={shared.link} to={`/book?hotel=${hotel.id}`}>Plan your stay <span aria-hidden="true">↗</span></Link></div></article> })}
        {!visible.length && <div className={styles.empty}><p className={shared.sectionLabel}>TAKE ANOTHER PATH</p><h3>There’s more<br /><em>to discover.</em></h3><p>Try a different place or kind of day. We can also help you find something that suits your plans.</p><div className={shared.formActions}><button className={shared.cta} onClick={() => setParams({})}>See all experiences <span aria-hidden="true">↗</span></button><Link className={shared.link} to="/contact?category=activities">Ask us about your plans <span aria-hidden="true">↗</span></Link></div></div>}
      </div>
    </section>
    <section className={styles.invitation} data-section><p className={shared.sectionLabel}>START WITH A CONVERSATION</p><h2>Not every good day<br /><em>needs an itinerary.</em></h2><p>Tell us what brings you to the mountains.<br />We’ll help you find your own rhythm.</p><Link className={shared.cta} to="/contact?category=activities">Plan a little adventure <span aria-hidden="true">↗</span></Link></section>
  </div></SupportingPageLayout>
}
