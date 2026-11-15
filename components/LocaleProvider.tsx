'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { translate, type Locale, type MessageKey } from '@/lib/i18n'

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => Promise<void>; t: (key: MessageKey) => string }
const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter()
  const [locale, updateLocale] = useState(initialLocale)

  const setLocale = useCallback(async (nextLocale: Locale) => {
    const previousLocale = locale
    updateLocale(nextLocale)
    try {
      const response = await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: nextLocale }),
      })
      if (!response.ok) throw new Error('Could not save language preference')
      router.refresh()
    } catch {
      updateLocale(previousLocale)
    }
  }, [locale, router])

  const value = useMemo(() => ({ locale, setLocale, t: (key: MessageKey) => translate(locale, key) }), [locale, setLocale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}
