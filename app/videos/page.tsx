import Link from 'next/link'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('Vidéos', 'Les vidéos des rencontres O’BORD à Grand-Bassam.')

export default function Videos() {
  return (
    <div className="soirees-page video-page">
      <header className="soirees-hero">
        <div className="soirees-hero-copy">
          <h1>Les souvenirs<br /><span>O’BORD.</span></h1>
          <p>Les images gardent une trace des moments partagés. En attendant les prochaines vidéos, viens créer un souvenir avec nous.</p>
          <Link href="/soirees" className="soirees-hero-cta">Je découvre les prochaines rencontres <span aria-hidden="true">↗</span></Link>
        </div>
      </header>
      <section className="soirees-content">
        <div className="video-empty-state">
          <p className="event-practical-label">PAS ENCORE DE VIDÉO PUBLIÉE</p>
          <h2>Pas encore de vidéo à partager.</h2>
          <p>On espère bientôt pouvoir partager ces moments avec toi. D’ici là, regarde les rencontres à venir.</p>
          <Link href="/soirees" className="soirees-booking-link">Trouver ma prochaine rencontre <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="soirees-back"><Link href="/">← Un petit retour à l’accueil</Link></div>
      </section>
    </div>
  )
}
