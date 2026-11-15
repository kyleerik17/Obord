import LegalPage from '@/components/LegalPage'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('Politique de cookies', 'Informations sur les cookies de session utilisés par O’BORD.')

export default async function CookiesPage() {
  const locale = await getLocale()
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  return <LegalPage title={t('legal.cookies')} intro={t('legal.cookiesIntro')}>
    <section><h2>{t('legal.sessionTitle')}</h2><p>{t('legal.sessionText')}</p></section>
    <section><h2>{t('legal.analyticsTitle')}</h2><p>{t('legal.analyticsText')}</p></section>
    <section><h2>{t('legal.manageTitle')}</h2><p>{t('legal.manageText')}</p></section>
  </LegalPage>
}
