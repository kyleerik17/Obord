import { cookies } from 'next/headers'
import { isLocale, type Locale } from './i18n'

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get('obord_locale')?.value
  return isLocale(value) ? value : 'fr'
}
