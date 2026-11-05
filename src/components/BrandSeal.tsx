import logo from '../assets/ruegg-burgundy.png'

/** The supplied artwork, unmodified. Its original transparent canvas is retained. */
export function BrandSeal({ className = '' }: { className?: string }) {
  return <img className={className} src={logo} width="4000" height="4000" alt="RÜEGG HOTELS" draggable={false} />
}
