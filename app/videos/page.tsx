import Link from 'next/link'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('Vidéos', 'Les vidéos des rencontres O’BORD à Grand-Bassam.')

export default async function Videos() {
  const locale = await getLocale()
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  return (
    <div className="soirees-page video-page">
      <header className="soirees-hero">
        <div className="soirees-hero-copy">
          <h1>{t('video.title')}</h1>
          <p>{t('video.invite')}</p>
          <Link href="/soirees" className="soirees-hero-cta">{t('soirees.dates')}</Link>
        </div>
      </header>
      <section className="soirees-content">
        <div className="video-empty-state">
          <p className="event-practical-label">O’BORD</p>
          <h2>{t('video.empty')}</h2>
          <p>{t('video.emptyText')}</p>
          <Link href="/soirees" className="soirees-booking-link">{t('video.cta')}</Link>
        </div>
        <div className="soirees-back"><Link href="/">{t('common.home')}</Link></div>
      </section>
    </div>
  )
}
