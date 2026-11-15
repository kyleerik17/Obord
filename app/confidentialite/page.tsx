import LegalPage from '@/components/LegalPage'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('Politique de confidentialité', 'Comment O’BORD traite les informations liées aux comptes et réservations.')

export default async function PrivacyPage() {
  const locale = await getLocale()
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  return <LegalPage title={t('legal.privacy')} intro={locale === 'fr' ? 'Une explication claire des données utilisées pour le compte et les réservations O’BORD.' : locale === 'en' ? 'A clear explanation of the data used for O’BORD accounts and reservations.' : 'Una explicación clara de los datos utilizados para las cuentas y reservas de O’BORD.'}>
    <section><h2>{t('legal.dataTitle')}</h2><p>{t('legal.dataText')}</p></section>
    <section><h2>{t('legal.dataUseTitle')}</h2><p>{t('legal.dataUseText')}</p></section>
    <section><h2>{t('legal.retentionTitle')}</h2><p>{t('legal.retentionText')}</p></section>
    <section><h2>{t('legal.rightsTitle')}</h2><p>{t('legal.rightsText')}</p></section>
    <section><h2>{t('legal.contactTitle')}</h2><p>O’BORD — Grand-Bassam, Côte d’Ivoire · <a href="tel:+2250768963019">+225 07 68 96 30 19</a> · <a href="mailto:collectifchill@gmail.com">collectifchill@gmail.com</a></p></section>
  </LegalPage>
}
