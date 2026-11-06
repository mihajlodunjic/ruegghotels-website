import { Link } from 'react-router-dom'
import { BrandSeal } from './BrandSeal'
import { hotels } from '../data/hotels'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return <footer className={styles.footer} data-section>
    <div className={styles.top}><div className={styles.invitation}><BrandSeal /><div><p className="eyebrow">THERE’S ALWAYS AN EXTRA CHAIR</p><p className={styles.slogan}>Pull up a chair.<br /><em>Share your story.</em></p><Link className={styles.contact} to="/contact">Let’s plan something together <span aria-hidden="true">↗</span></Link></div></div>
      <div className={styles.homes} aria-label="Our three alpine homes">{hotels.map((hotel) => <Link key={hotel.id} to={`/book?hotel=${hotel.id}`}><span>{hotel.name}</span><small>{hotel.town}, {hotel.country}</small><i aria-hidden="true">↗</i></Link>)}</div></div>
    <div className={styles.bottom}><span>© {new Date().getFullYear()} RÜEGG HOTELS</span><nav aria-label="Footer navigation"><Link to="/">The journey</Link><Link to="/our-story">Our story</Link><Link to="/partners">Our local circle</Link><Link to="/book">Reservations</Link><Link to="/contact">Contact</Link></nav><span>Warmth. Mountains. Belonging.</span></div>
  </footer>
}
