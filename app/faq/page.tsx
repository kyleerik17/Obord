import Link from 'next/link'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('FAQ', 'Réponses aux questions sur les rencontres et les réservations O’BORD.')

export default async function FAQPage() {
  const locale = await getLocale()
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const questions = Array.from({ length: 7 }, (_, index) => ({ q: t(`faq.q${index + 1}` as Parameters<typeof translate>[1]), a: t(`faq.a${index + 1}` as Parameters<typeof translate>[1]) }))
  return (
    <div className="trust-page">
      <header className="trust-hero">
        <p className="eyebrow eyebrow-dark">O’BORD · GRAND-BASSAM</p>
        <h1>{t('faq.title')}</h1>
        <p>{t('faq.intro')}</p>
      </header>
      <div className="trust-content faq-list">
        {questions.map(({ q, a }) => <details className="trust-card faq-item" key={q}><summary>{q}<span aria-hidden="true">＋</span></summary><div className="faq-answer"><p>{a}</p></div></details>)}
        <p className="trust-note">{t('faq.more')} <Link href="/contact">{t('home.contactCta')}</Link>.</p>
      </div>
    </div>
  )
}
