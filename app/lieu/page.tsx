import Link from 'next/link'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('Lieux de rencontre', 'Informations sur les lieux de rencontre O’BORD à Grand-Bassam.')

export default async function Lieu() {
  const locale = await getLocale()
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  return (
    <div className="place-page organizers-page">
      <header className="editorial-page-heading"><p className="editorial-eyebrow">O’BORD · GRAND-BASSAM</p><h1>{t('place.title')}</h1><p>{t('place.intro')}</p></header>
      <div className="place-grid">
        <section className="trust-card"><p className="event-practical-label">O’BORD</p><h2>{t('place.outing')}</h2><p>{t('place.locationText')}</p><dl><dt>{t('place.location')}</dt><dd>Bamboo Blanc, quartier France</dd><dt>{t('place.around')}</dt><dd>{t('place.activity')}</dd></dl></section>
        <section className="trust-card place-map-card"><p className="event-practical-label">GRAND-BASSAM</p><h2>Bamboo Blanc</h2><p>Quartier France · Grand-Bassam</p><a className="editorial-button editorial-button-primary" href="https://www.google.com/maps/search/?api=1&query=Bamboo+Blanc%2C+Quartier+France%2C+Grand-Bassam" target="_blank" rel="noopener noreferrer">{t('place.maps')}</a></section>
      </div>
      <section className="trust-card place-note"><h2>{t('place.moment')}</h2><p>{t('place.momentText')}</p></section>
      <div className="trust-page-actions"><Link className="editorial-button editorial-button-primary" href="/soirees">{t('nav.agenda')}</Link><Link className="editorial-button editorial-button-secondary" href="/">{t('common.home')}</Link></div>
    </div>
  )
}
