import Link from 'next/link'
import Image from 'next/image'
import { organizers } from '@/lib/data/site'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('À propos', 'Découvre l’esprit, la mission et le collectif O’BORD à Grand-Bassam.')

export default async function AboutPage() {
  const locale = await getLocale()
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const values = [1, 2, 3].map((number) => ({ title: t(`about.value${number}` as Parameters<typeof translate>[1]), text: t(`about.value${number}text` as Parameters<typeof translate>[1]) }))
  return (
    <div className="trust-page editorial-about">
      <header className="trust-hero">
        <p className="eyebrow eyebrow-dark">O’BORD · GRAND-BASSAM</p>
        <h1>{t('about.title')}</h1>
        <p>{t('about.intro')}</p>
      </header>

      <div className="trust-content">
        <section className="trust-card trust-story">
          <p className="event-practical-label">O’BORD</p>
          <h2>{t('about.storyTitle')}</h2>
          <p>{t('about.story')}</p>
          <p>{t('home.reassurance3text')}</p>
        </section>

        <section className="trust-values" aria-labelledby="values-title">
          <div className="trust-section-heading"><p className="eyebrow eyebrow-dark">O’BORD</p><h2 id="values-title">{t('about.valuesTitle')}</h2></div>
          <div className="trust-grid trust-grid-three">
            {values.map((value) => <article className="trust-card" key={value.title}><h3>{value.title}</h3><p>{value.text}</p></article>)}
          </div>
        </section>

        <section className="trust-team" aria-labelledby="team-title">
          <div className="trust-section-heading"><p className="eyebrow eyebrow-dark">O’BORD</p><h2 id="team-title">{t('about.teamTitle')}</h2><p>{t('about.teamIntro')}</p></div>
          <div className="trust-grid trust-grid-three">
            {organizers.map((person) => (
              <article className="trust-card trust-person" key={person.name}>
                <div className="trust-photo-placeholder">{person.photo ? <Image src={person.photo} alt={`Portrait de ${person.name}`} fill sizes="(max-width: 760px) 100vw, 30vw" className={`trust-person-photo${person.name === 'Aurore' ? ' trust-person-photo-aurore' : ''}`} /> : <span>Photo réelle<br />[À COMPLÉTER]</span>}</div>
                <h3>{person.name}</h3><p>{t('about.organizer')}</p>
              </article>
            ))}
          </div>
        </section>
        <div className="trust-page-actions"><Link href="/soirees" className="button-primary">{t('about.cta')}</Link><Link href="/contact" className="button-quiet trust-quiet-link">{t('home.contactCta')}</Link></div>
      </div>
    </div>
  )
}
