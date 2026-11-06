import { useEffect, useLayoutEffect, useReducer, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { SupportingPageLayout } from '../components/SupportingPageLayout'
import { BrandSeal } from '../components/BrandSeal'
import { hotels, getHotel, isHotelId } from '../data/hotels'
import { bookingReducer, initialBookingState, todayISO, addDays, validateStay, demoBookingProvider, nightsBetween, formatDate, formatMoney, demoReference, type StayErrors } from '../features/booking/bookingModel'
import { bookingExperienceLink } from '../features/experiences/experiencePlanner'
import type { HotelId } from '../features/cinematic/cinematicMachine'
import shared from './Pages.module.css'
import styles from './ReservationsPage.module.css'

const steps = ['Your stay', 'Your room', 'Review & finish', 'Your preview']
const stepIndex = { STAY: 0, ROOMS: 1, CHECKOUT: 2, COMPLETE: 3 }
export function ReservationsPage() {
  const [params, setParams] = useSearchParams()
  const queryHotel = params.get('hotel')
  const urlHotel = isHotelId(queryHotel) ? queryHotel : null
  const [today] = useState(todayISO)
  const [state, dispatch] = useReducer(bookingReducer, { hotelId: urlHotel, today }, ({ hotelId, today: initialToday }) => initialBookingState(hotelId, initialToday))
  const [errors, setErrors] = useState<StayErrors>({})
  const [guest, setGuest] = useState({ firstName: '', email: '' })
  const [acknowledged, setAcknowledged] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const panel = useRef<HTMLDivElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const hotel = getHotel(state.hotelId)
  const result = demoBookingProvider.search(state, today)
  const selected = result.offers.find((offer) => offer.room.id === state.selectedRoomId)
  const nights = Math.max(0, nightsBetween(state.arrival, state.departure))
  const index = stepIndex[state.step]
  useEffect(() => { dispatch({ type: 'HOTEL', hotelId: urlHotel }) }, [urlHotel])
  useLayoutEffect(() => {
    const element = panel.current
    if (!element) return
    element.setAttribute('data-step-ready', 'false')
    if (state.step !== 'STAY') { element.scrollIntoView({ block: 'start' }); element.querySelector('h2')?.focus({ preventScroll: true }) }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { element.setAttribute('data-step-ready', 'true'); return }
    const context = gsap.context(() => { gsap.fromTo(element, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .55, ease: 'power3.out', onComplete: () => element.setAttribute('data-step-ready', 'true') }) }, element)
    return () => context.revert()
  }, [state.step])
  const chooseHotel = (id: HotelId) => { dispatch({ type: 'HOTEL', hotelId: id }); setParams({ hotel: id }); setErrors({}); setGuest({ firstName: '', email: '' }); setAcknowledged(false) }
  const search = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validateStay(state, today)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return }
    dispatch({ type: 'SEARCH', today })
  }
  const finish = (event: FormEvent) => {
    event.preventDefault()
    if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) { setCheckoutError('Use a valid example email, or leave the email field blank.'); return }
    if (!acknowledged) { setCheckoutError('Please acknowledge that this is a reservation preview.'); return }
    setCheckoutError('')
    dispatch({ type: 'FINISH', today })
    setGuest({ firstName: '', email: '' })
  }
  const restart = () => { dispatch({ type: 'RESTART', today }); setAcknowledged(false); setCheckoutError(''); setGuest({ firstName: '', email: '' }); setErrors({}); panel.current?.scrollIntoView({ block: 'start' }) }
  const arrow = <span aria-hidden="true">↗</span>
  const counter = (label: 'Adults' | 'Children', count: number, min: number, max: number) => <div className={styles.counter}><div><span>{label}</span><small>{label === 'Adults' ? 'A little time away' : 'Small explorers welcome'}</small></div><div className={styles.counterControls}><button type="button" disabled={count <= min} aria-label={`Decrease ${label.toLowerCase()}`} onClick={() => { setErrors({}); dispatch({ type: 'GUESTS', adults: label === 'Adults' ? count - 1 : state.adults, children: label === 'Children' ? count - 1 : state.children }) }}>−</button><output aria-live="polite" aria-label={`${label} count`}>{count}</output><button type="button" disabled={count >= max || state.adults + state.children >= 4} aria-label={`Increase ${label.toLowerCase()}`} onClick={() => { setErrors({}); dispatch({ type: 'GUESTS', adults: label === 'Adults' ? count + 1 : state.adults, children: label === 'Children' ? count + 1 : state.children }) }}>+</button></div></div>
  return <SupportingPageLayout><div className={shared.container}>
    <header className={`${shared.hero} ${styles.hero}`}><div><p className="eyebrow" data-enter>RÜEGG HOTELS / RESERVATIONS</p><h1 className={shared.title} data-enter>Your next<br /><em>mountain chapter.</em></h1></div><div className={styles.heroAside} data-enter><p className={shared.lead}>Three alpine homes.<br />A stay at your own pace.</p><span>Good mornings. Fresh air. A place to belong.</span></div></header>
    <ol className={styles.progress} aria-label="Reservation progress">{steps.map((step, i) => <li key={step} className={i === index ? styles.currentStep : i < index ? styles.pastStep : ''} aria-current={i === index ? 'step' : undefined}><span>0{i + 1}</span>{step}</li>)}</ol>
    <div className={styles.bookingGrid} data-booking-step={state.step} data-selected-hotel={state.hotelId || ''}>
      <div ref={panel} className={styles.bookingPanel} data-step-ready="true">
        {state.step === 'STAY' && <form ref={form} onSubmit={search} noValidate>
          <p className={shared.sectionLabel}>01 / MAKE YOURSELF AT HOME</p><h2 className={shared.subheading} tabIndex={-1}>Where shall we welcome you?</h2>
          <fieldset className={styles.hotelChoices} aria-describedby={errors.hotelId ? 'hotel-error' : undefined}><legend className="sr-only">Your home</legend>{hotels.map((item, i) => <label key={item.id} className={`${styles.hotelChoice} ${state.hotelId === item.id ? styles.chosenHotel : ''}`}><input type="radio" name="hotel" value={item.id} checked={state.hotelId === item.id} aria-invalid={Boolean(errors.hotelId)} onChange={() => chooseHotel(item.id)} /><span className={styles.hotelNumber}>0{i + 1}</span><span className={styles.choiceName}>{item.name}<small>{item.town}, {item.country}</small></span><span className={styles.radioMark} aria-hidden="true" /></label>)}</fieldset>
          {errors.hotelId && <p id="hotel-error" className={shared.error} role="alert">{errors.hotelId}</p>}
          <div className={styles.formSection}><div className={styles.sectionHeading}><h3>Choose your days.</h3><div className={styles.dateActions}><span>{nights > 0 ? `${nights} ${nights === 1 ? 'night' : 'nights'}` : 'A little time away'}</span><button type="button" className={shared.link} onClick={() => { setErrors({}); dispatch({ type: 'DATES', arrival: '', departure: '' }) }}>Clear dates</button></div></div><div className={shared.formGrid}>
            <div className={shared.field}><label htmlFor="arrival">Arrival</label><input className={shared.input} id="arrival" type="date" min={today} max={addDays(today, 365)} value={state.arrival} aria-invalid={Boolean(errors.arrival)} aria-describedby={errors.arrival ? 'arrival-error' : undefined} onChange={(event) => { setErrors({}); dispatch({ type: 'DATES', arrival: event.target.value, departure: state.departure }) }} />{errors.arrival && <p className={shared.error} id="arrival-error" role="alert">{errors.arrival}</p>}</div>
            <div className={shared.field}><label htmlFor="departure">Departure</label><input className={shared.input} id="departure" type="date" min={state.arrival ? addDays(state.arrival, 1) : today} max={addDays(today, 365)} value={state.departure} aria-invalid={Boolean(errors.departure)} aria-describedby={errors.departure ? 'departure-error' : undefined} onChange={(event) => { setErrors({}); dispatch({ type: 'DATES', arrival: state.arrival, departure: event.target.value }) }} />{errors.departure && <p className={shared.error} id="departure-error" role="alert">{errors.departure}</p>}</div>
          </div></div>
          <div className={styles.formSection}><div className={styles.sectionHeading}><h3>Who’s coming along?</h3><span>One room, shared moments</span></div>{counter('Adults', state.adults, 1, 4)}{counter('Children', state.children, 0, 2)}{errors.adults && <p className={shared.error} role="alert">{errors.adults}</p>}{errors.children && <p className={shared.error} role="alert">{errors.children}</p>}</div>
          <div className={shared.formActions}><button className={shared.cta} type="submit">Find your room {arrow}</button><Link className={shared.link} to="/contact?category=group">Travelling as a group? {arrow}</Link></div>
        </form>}
        {state.step === 'ROOMS' && <section aria-labelledby="rooms-heading"><p className={shared.sectionLabel}>02 / A ROOM TO CALL YOUR OWN</p><h2 id="rooms-heading" className={shared.subheading} tabIndex={-1}>A quieter kind of comfort.</h2><p className={styles.availabilityNote}>Demonstration availability and pricing. Room categories and amounts are illustrative.</p>
          {result.offers.length ? <><div className={styles.roomList}>{result.offers.map((offer, i) => <article key={offer.room.id} className={`${styles.room} ${selected?.room.id === offer.room.id ? styles.selectedRoom : ''}`}><div className={styles.roomStory}><span className={shared.sectionLabel}>0{i + 1} / {offer.room.eyebrow}</span><h3>{offer.room.name}</h3><p>{offer.room.description}</p><span className={styles.occupancy}>Up to {offer.room.occupancy} guests</span><ul>{offer.room.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul></div><div className={styles.roomRate}><strong>{formatMoney(offer.nightlyCents, offer.currency)}</strong><span>per night</span><p>{offer.nights} nights · {formatMoney(offer.totalCents, offer.currency)}</p><button type="button" className={styles.chooseRoom} aria-pressed={selected?.room.id === offer.room.id} aria-label={`${selected?.room.id === offer.room.id ? 'Selected room' : 'Select room'}: ${offer.room.name}`} onClick={() => dispatch({ type: 'SELECT', roomId: offer.room.id, today })}>{selected?.room.id === offer.room.id ? 'Selected' : 'Select room'} <span aria-hidden="true">{selected?.room.id === offer.room.id ? '✓' : '↗'}</span></button></div></article>)}</div><div className={shared.formActions}><button className={shared.cta} disabled={!selected} onClick={() => dispatch({ type: 'CHECKOUT', today })}>Review your stay {arrow}</button><button className={shared.link} onClick={() => dispatch({ type: 'BACK' })}>← Change dates & guests</button></div></> : <div className={styles.empty}><h3>A different date,<br /><em>a different adventure.</em></h3><p>There’s nothing matching this combination. Try another date or let us help you shape a stay.</p><div className={shared.formActions}><button className={shared.cta} onClick={() => dispatch({ type: 'BACK' })}>Choose other dates {arrow}</button><Link className={shared.link} to={`/contact?hotel=${state.hotelId}`}>Plan with us {arrow}</Link></div></div>}
        </section>}
        {state.step === 'CHECKOUT' && selected && <form onSubmit={finish} noValidate><p className={shared.sectionLabel}>03 / THE FINISHING TOUCH</p><h2 className={shared.subheading} tabIndex={-1}>Make a little room<br /><em>for what comes next.</em></h2><div className={styles.checkoutNotice}><strong>Demonstration checkout</strong><p>Use example details or leave these fields blank. Nothing is sent or saved, and no payment details are needed.</p></div><button type="button" className={shared.link} onClick={() => setGuest({ firstName: 'Alex', email: 'alex@example.com' })}>Use example guest details {arrow}</button><div className={shared.formGrid}><div className={shared.field}><label htmlFor="guest-name">First name (optional)</label><input className={shared.input} id="guest-name" value={guest.firstName} maxLength={60} autoComplete="off" onChange={(event) => setGuest({ ...guest, firstName: event.target.value })} /></div><div className={shared.field}><label htmlFor="guest-email">Email (optional)</label><input className={shared.input} id="guest-email" type="email" value={guest.email} autoComplete="off" onChange={(event) => { setCheckoutError(''); setGuest({ ...guest, email: event.target.value }) }} /></div></div><label className={styles.acknowledgement}><input type="checkbox" checked={acknowledged} onChange={(event) => { setCheckoutError(''); setAcknowledged(event.target.checked) }} /><span>I understand this creates a reservation preview, not a real booking.</span></label>{checkoutError && <p className={shared.error} role="alert">{checkoutError}</p>}<div className={shared.formActions}><button className={shared.cta} type="submit">Complete reservation preview {arrow}</button><button type="button" className={shared.link} onClick={() => dispatch({ type: 'BACK' })}>← Back to rooms</button></div></form>}
        {state.step === 'COMPLETE' && selected && hotel && <section className={styles.confirmation} aria-labelledby="confirmation-heading"><BrandSeal /><p className={shared.sectionLabel}>A LITTLE SOMETHING TO LOOK FORWARD TO</p><h2 id="confirmation-heading" tabIndex={-1}>Your reservation<br /><em>preview is ready.</em></h2><p className={styles.transactionMessage}>No booking has been placed.<br />No payment has been taken.</p><span className={styles.reference}>{demoReference(state.completionCount)}</span><div className={styles.confirmationDetails}><h3>RÜEGG {hotel.name}</h3><p>{hotel.town}, {hotel.country}</p><p>{formatDate(state.arrival)} — {formatDate(state.departure)}<br />{selected.room.name} · {nights} nights · {state.adults + state.children} guests</p><strong>{formatMoney(selected.totalCents, selected.currency)} <small>sample total</small></strong></div><div className={shared.formActions}><button className={shared.cta} onClick={restart}>Plan another stay {arrow}</button><Link className={shared.link} to={`/partners?destination=${hotel.id}`}>Discover the local circle {arrow}</Link></div><div className={styles.nextChapter}><p className={shared.sectionLabel}>MAKE A LITTLE MORE OF YOUR STAY</p><Link className={shared.link} to={bookingExperienceLink(state)}>Personalize your stay {arrow}</Link><Link className={shared.link} to="/passport">Discover RÜEGG Passport {arrow}</Link></div></section>}
      </div>
      {state.step !== 'COMPLETE' && <aside className={styles.summary} aria-label="Your stay summary"><p className={shared.sectionLabel}>YOUR ALPINE CHAPTER</p><h2>{hotel ? <>RÜEGG <em>{hotel.name}</em></> : <>A place<br /><em>to belong.</em></>}</h2><p className={styles.summaryDestination}>{hotel ? `${hotel.town}, ${hotel.country}` : 'Choose your alpine home'}</p><div className={styles.summaryDates}><div><span>ARRIVAL</span><strong>{formatDate(state.arrival)}</strong></div><span aria-hidden="true">→</span><div><span>DEPARTURE</span><strong>{formatDate(state.departure)}</strong></div></div><dl><div><dt>Your time away</dt><dd>{nights} {nights === 1 ? 'night' : 'nights'}</dd></div><div><dt>Coming along</dt><dd>{state.adults} adults{state.children ? `, ${state.children} ${state.children === 1 ? 'child' : 'children'}` : ''}</dd></div><div><dt>Your room</dt><dd>{selected?.room.name || 'Make it your own'}</dd></div>{selected && <><div><dt>Per night</dt><dd>{formatMoney(selected.nightlyCents, selected.currency)}</dd></div><div className={styles.summaryTotal}><dt>Sample total</dt><dd>{formatMoney(selected.totalCents, selected.currency)}</dd></div></>}</dl>{selected ? <p className={shared.note}>Nightly rate × {nights} nights. No payment is collected.</p> : <p className={styles.summaryQuote}>The best part of a mountain day?<br /><em>Coming home.</em></p>}<Link className={shared.link} to={`/contact${hotel ? `?hotel=${hotel.id}` : ''}`}>A question before you arrive? {arrow}</Link></aside>}
    </div>
    <section className={styles.closing} data-section><span className={shared.sectionLabel}>THE SIMPLE THINGS, DONE WITH CARE</span><p>A good night’s sleep.<br /><em>A warm welcome back.</em></p><Link className={shared.link} to="/our-story">Get to know RÜEGG {arrow}</Link></section>
  </div></SupportingPageLayout>
}
