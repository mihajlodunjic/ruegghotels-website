import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { CinematicHomePage } from '../features/cinematic/CinematicHomePage'
import { SiteHeader } from '../components/SiteHeader'
import { hotels } from '../data/hotels'

const pages: Record<string, { title: string; text: string }> = {
  '/partners': { title: 'Our local circle.', text: 'A place for the people, craft and landscapes around our homes. Local stories and partnerships will appear here once verified.' },
  '/our-story': { title: 'An invitation to belong.', text: 'We show you the warmth of the mountains. This is the beginning of the RÜEGG story; our full story is being prepared.' },
  '/contact': { title: 'Let’s begin a conversation.', text: 'Our contact channels are being prepared. No enquiry is sent or collected from this preview.' },
}
function PreviewPage() {
  const location = useLocation()
  const [params] = useSearchParams()
  const [menu, setMenu] = useState(false)
  const booking = location.pathname === '/book'
  const page = pages[location.pathname]
  const hotel = hotels.find((item) => item.id === params.get('hotel'))
  return <div className="preview-shell"><SiteHeader open={menu} onOpen={() => setMenu(true)} onClose={() => setMenu(false)} />
    <main id="main-content" className="preview-page" tabIndex={-1}>
      <p className="eyebrow">RÜEGG HOTELS / {booking ? 'Our stays' : 'Discover'}</p>
      <h1>{booking ? 'Find your alpine home.' : page?.title || 'A path still to discover.'}</h1>
      <p>{booking ? 'Preview only — no request is sent. Booking and live availability are not connected.' : page?.text || 'This page could not be found. Your invitation is still waiting.'}</p>
      {booking && <><label htmlFor="hotel">Your home</label><select id="hotel" key={hotel?.id} defaultValue={hotel?.id || ''}><option value="" disabled>Choose a home</option>{hotels.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.destination}</option>)}</select><p className="preview-note">The cinematic spaces are an imaginary brand setting and do not represent bookable room inventory.</p></>}
      <Link className="button" to="/">Return to the journey <span aria-hidden="true">↗</span></Link>
    </main>
  </div>
}
export function App() {
  const location = useLocation()
  useEffect(() => {
    document.title = `${location.pathname === '/' ? 'An invitation to belong' : location.pathname === '/book' ? 'Our stays' : pages[location.pathname]?.title || 'Page not found'} — RÜEGG HOTELS`
    window.scrollTo(0, 0)
  }, [location.pathname])
  return <Routes><Route path="/" element={<CinematicHomePage />} />{['/partners', '/book', '/our-story', '/contact'].map((path) => <Route key={path} path={path} element={<PreviewPage />} />)}<Route path="*" element={<PreviewPage />} /></Routes>
}
