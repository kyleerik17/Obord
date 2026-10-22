import ContactForm from '@/components/ContactForm'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('Contact', 'Contacte O’BORD à Grand-Bassam par téléphone, WhatsApp ou e-mail.')

const whatsappHref = 'https://wa.me/2250768963019?text=Bonjour%20O%27Bord%2C%20je%20souhaite%20plus%20d%27informations'

export default function ContactPage() {
  return (
    <div className="trust-page">
      <header className="trust-hero">
        <p className="eyebrow eyebrow-dark">✳ ON EST À TON ÉCOUTE</p>
        <h1>On se parle ?<br /><span>Avec plaisir.</span></h1>
        <p>Tu hésites à venir, tu veux en savoir plus ou simplement dire bonjour ? Écris-nous, on te répond avec plaisir.</p>
      </header>

      <div className="trust-content">
        <div className="trust-grid trust-grid-two">
          <section className="trust-card contact-details">
            <p className="event-practical-label">LES COORDONNÉES</p>
            <h2>On fait connaissance ?</h2>
            <a href="tel:+2250768963019"><span aria-hidden="true">⌕</span><span><small>Téléphone</small>+225 07 68 96 30 19</span></a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">✳</span><span><small>WhatsApp</small>Écrire au collectif</span></a>
            <a href="mailto:angeerikkyle@gmail.com"><span aria-hidden="true">✉</span><span><small>E-mail</small>angeerikkyle@gmail.com</span></a>
            <div className="contact-detail-static"><span aria-hidden="true">⌖</span><span><small>Ville</small>Grand-Bassam, Côte d’Ivoire</span></div>
            <a href="https://www.tiktok.com/@obord_777" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">♪</span><span><small>TikTok</small>@obord_777</span></a>
          </section>
          <ContactForm />
        </div>

        <section className="trust-card map-card">
          <div><p className="event-practical-label">NOTRE VILLE</p><h2>Grand-Bassam, Côte d’Ivoire</h2><p>Le point précis de rencontre est communiqué après confirmation de la réservation.</p></div>
          <iframe title="Carte Google Maps de Grand-Bassam, Côte d’Ivoire" src="https://www.google.com/maps?q=Grand-Bassam%2C%20C%C3%B4te%20d%27Ivoire&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </section>
      </div>
    </div>
  )
}
