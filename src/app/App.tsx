import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { CinematicHomePage } from '../features/cinematic/CinematicHomePage'
import { PartnersPage } from '../pages/PartnersPage'
import { ReservationsPage } from '../pages/ReservationsPage'
import { OurStoryPage } from '../pages/OurStoryPage'
import { ContactPage } from '../pages/ContactPage'
import { NotFoundPage } from '../pages/NotFoundPage'

const metadata: Record<string, { title: string; description: string }> = {
  '/': { title: 'An invitation to belong', description: 'We show you the warmth of the mountains. Discover the RÜEGG HOTELS cinematic journey.' },
  '/partners': { title: 'Our Local Circle', description: 'Find your own alpine rhythm with walks, cycling, winter days and local discoveries in Kandersteg, Splügen and Oberstdorf.' },
  '/book': { title: 'Your Next Mountain Chapter', description: 'Choose your RÜEGG alpine home, explore room options and plan your stay in Kandersteg, Splügen or Oberstdorf.' },
  '/our-story': { title: 'Our Story', description: 'Three alpine homes, one spirit of family hospitality. Pull up a chair and discover the RÜEGG story.' },
  '/contact': { title: 'A Conversation with RÜEGG', description: 'Every stay begins with a conversation. Prepare your questions about an alpine escape, a group stay or a new adventure.' },
}
export function App() {
  const location = useLocation()
  useEffect(() => {
    const page = metadata[location.pathname] || { title: 'Page Not Found', description: 'A path still to discover. Return to the RÜEGG HOTELS journey.' }
    document.title = `${page.title} — RÜEGG HOTELS`
    document.querySelector('meta[name="description"]')?.setAttribute('content', page.description)
    window.scrollTo(0, 0)
  }, [location.pathname])
  return <Routes><Route path="/" element={<CinematicHomePage />} /><Route path="/partners" element={<PartnersPage />} /><Route path="/book" element={<ReservationsPage />} /><Route path="/our-story" element={<OurStoryPage />} /><Route path="/contact" element={<ContactPage key={location.search} />} /><Route path="*" element={<NotFoundPage />} /></Routes>
}
