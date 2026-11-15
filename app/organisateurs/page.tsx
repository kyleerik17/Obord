import Link from 'next/link'
import Image from 'next/image'
import { organizers } from '@/lib/data/site'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('Les organisateurs', 'Rencontre les organisateurs O’BORD à Grand-Bassam.')

export default async function Organisateurs() {
  const locale = await getLocale()
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  return (
    <div className="organizers-page">
      <header className="editorial-page-heading">
        <p className="editorial-eyebrow">O’BORD · GRAND-BASSAM</p>
        <h1>{t('about.teamTitle')}</h1>
        <p>{t('about.teamIntro')}</p>
      </header>
      <div className="organizers-grid">
        {organizers.map((organizer) => (
          <article key={organizer.name} className="organizer-card">
            <div className="organizer-card-image">
              {organizer.photo && <Image src={organizer.photo} alt={`Portrait de ${organizer.name}`} fill sizes="(max-width: 640px) 90vw, 30vw" className={organizer.name === 'Aurore' ? 'object-cover object-[center_45%]' : 'object-cover object-[center_25%]'} />}
            </div>
            <div className="organizer-card-copy"><h2>{organizer.name}</h2><p>{t('about.organizer')}</p></div>
          </article>
        ))}
      </div>
      <div className="trust-page-actions"><Link href="/contact" className="editorial-button editorial-button-primary">{t('home.contactCta')}</Link><Link href="/" className="editorial-button editorial-button-secondary">{t('common.home')}</Link></div>
    </div>
  )
}
