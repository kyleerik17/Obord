import LegalPage from '@/components/LegalPage'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('Conditions d’utilisation et de réservation', 'Conditions d’utilisation du site et fonctionnement des réservations aux rencontres O’BORD.')

export default async function ConditionsPage() {
  const locale = await getLocale()
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  return <LegalPage title={t('legal.terms')} intro={t('legal.termsIntro')}>
    <section><h2>{t('legal.useTitle')}</h2><p>{t('legal.useText')}</p></section>
    <section><h2>{t('legal.registrationTitle')}</h2><p>{t('legal.registrationText')} <a href="https://tikko.ci/register">Tikko</a>.</p></section>
    <section><h2>{t('legal.ageTitle')}</h2><p>{t('legal.ageText')}</p></section>
    <section><h2>{t('legal.practicalTitle')}</h2><p>{t('legal.practicalText')}</p></section>
    <section><h2>{t('legal.contactTitle')}</h2><p>{t('legal.contactText')}</p></section>
  </LegalPage>
}
