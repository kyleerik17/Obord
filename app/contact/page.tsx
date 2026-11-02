import ContactForm from '@/components/ContactForm'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('Contact', 'Contacte O’BORD à Grand-Bassam par téléphone, WhatsApp ou e-mail.')

const whatsappHref = 'https://wa.me/2250768963019?text=Bonjour%20O%27Bord%2C%20je%20souhaite%20plus%20d%27informations'

export default function ContactPage() {
  return (
    <div className="trust-page">
      <header className="trust-hero">
        <p className="eyebrow eyebrow-dark">ON EST À TON ÉCOUTE</p>
        <h1>On se parle ?<br /><span>Avec plaisir.</span></h1>
        <p>Tu hésites à venir, tu veux en savoir plus ou simplement dire bonjour ? Écris-nous, on te répond avec plaisir.</p>
      </header>

      <div className="trust-content">
        <div className="trust-grid trust-grid-two">
          <section className="trust-card contact-details">
            <p className="event-practical-label">LES COORDONNÉES</p>
            <h2>On fait connaissance ?</h2>
            <a href="tel:+2250768963019"><small>Téléphone</small>+225 07 68 96 30 19</a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer"><small>WhatsApp</small>Écrire au collectif</a>
            <a href="mailto:angeerikkyle@gmail.com"><small>E-mail</small>angeerikkyle@gmail.com</a>
            <div className="contact-detail-static"><small>Ville</small>Grand-Bassam, Côte d’Ivoire</div>
            <a href="https://www.tiktok.com/@obord_777" target="_blank" rel="noopener noreferrer"><small>TikTok</small>@obord_777</a>
          </section>
          <ContactForm />
        </div>

        <section className="trust-card map-card">
          <div><p className="event-practical-label">POINT DE RENDEZ-VOUS</p><h2>Bamboo Blanc, quartier France</h2><p>Grand-Bassam, Côte d’Ivoire. Les informations propres à chaque rencontre restent précisées sur sa fiche.</p><a className="button-primary" href="https://www.google.com/maps/search/?api=1&query=Bamboo+Blanc%2C+Quartier+France%2C+Grand-Bassam" target="_blank" rel="noopener noreferrer">Ouvrir dans Google Maps <span aria-hidden="true">↗</span></a></div>
          <iframe title="Carte Google Maps de Bamboo Blanc, quartier France, Grand-Bassam" src="https://www.google.com/maps?q=Bamboo+Blanc%2C+Quartier+France%2C+Grand-Bassam&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </section>
      </div>
    </div>
  )
}
