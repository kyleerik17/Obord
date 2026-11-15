'use client'

import { useLocale } from './LocaleProvider'
import type { Locale } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale()
  return (
    <label className="language-switcher">
      <span className="sr-only">Language / Langue / Idioma</span>
      <select value={locale} onChange={(event) => void setLocale(event.target.value as Locale)} aria-label="Language / Langue / Idioma">
        <option value="fr">FR</option>
        <option value="en">EN</option>
        <option value="es">ES</option>
        <option value="ba" disabled>{t('common.baouleSoon')}</option>
      </select>
    </label>
  )
}
