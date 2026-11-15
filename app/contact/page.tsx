import ContactForm from '@/components/ContactForm'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'
import { socialLinks } from '@/lib/data/site'

export const metadata = pageMetadata('Contact', 'Contacte O’BORD à Grand-Bassam par téléphone, WhatsApp ou e-mail.')

export default async function ContactPage() {
  const locale = await getLocale()
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  return (
    <div className="trust-page">
      <header className="trust-hero">
        <p className="eyebrow eyebrow-dark">{t('contact.eyebrow')}</p>
        <h1>{t('contact.title')}</h1>
        <p>{t('contact.intro')}</p>
      </header>

      <div className="trust-content">
        <div className="trust-grid trust-grid-two">
          <section className="trust-card contact-details">
            <p className="event-practical-label">{t('contact.details')}</p>
            <h2>{t('contact.message')}</h2>
            <a href="tel:+2250768963019"><small>Téléphone</small>+225 07 68 96 30 19</a>
            <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer"><small>WhatsApp</small>Écrire au collectif</a>
            <a href="mailto:collectifchill@gmail.com"><small>{t('contact.email')}</small>collectifchill@gmail.com</a>
            <div className="contact-detail-static"><small>{t('contact.city')}</small>Grand-Bassam, Côte d’Ivoire</div>
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"><small>Instagram</small>@obord_777</a>
          </section>
          <ContactForm />
        </div>

        <section className="trust-card map-card">
          <div><p className="event-practical-label">{t('contact.meeting')}</p><h2>Bamboo Blanc, quartier France</h2><p>{t('footer.city')}. {t('contact.mapIntro')}</p><a className="button-primary" href="https://www.google.com/maps/search/?api=1&query=Bamboo+Blanc%2C+Quartier+France%2C+Grand-Bassam" target="_blank" rel="noopener noreferrer">{t('contact.map')}</a></div>
          <iframe title="Carte Google Maps de Bamboo Blanc, quartier France, Grand-Bassam" src="https://www.google.com/maps?q=Bamboo+Blanc%2C+Quartier+France%2C+Grand-Bassam&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </section>
      </div>
    </div>
  )
}
