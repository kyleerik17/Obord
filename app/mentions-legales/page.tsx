import LegalPage from '@/components/LegalPage'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('Mentions légales', 'Éditeur et informations de contact du site O’BORD.')

export default async function LegalNoticesPage() {
  const locale = await getLocale()
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  return <LegalPage title={t('legal.notice')} intro={t('legal.aboutTitle')}>
    <section><h2>{t('legal.publisherTitle')}</h2><dl><dt>O’BORD</dt><dd>O’BORD</dd><dt>{t('legal.seat')}</dt><dd>Grand-Bassam, Côte d’Ivoire</dd><dt>Téléphone / WhatsApp</dt><dd><a href="tel:+2250768963019">+225 07 68 96 30 19</a></dd><dt>{t('contact.email')}</dt><dd><a href="mailto:collectifchill@gmail.com">collectifchill@gmail.com</a></dd></dl></section>
    <section><h2>{t('legal.publication')}</h2><p><strong>[À COMPLÉTER]</strong></p></section>
    <section><h2>{t('legal.hosting')}</h2><p>{t('legal.host')} <strong>[À COMPLÉTER]</strong></p><p>{t('legal.hostAddress')} <strong>[À COMPLÉTER]</strong></p></section>
  </LegalPage>
}
