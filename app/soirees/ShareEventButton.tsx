'use client'

import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'

export default function ShareEventButton({ title, description, url }: { title: string; description: string; url: string }) {
  const [feedback, setFeedback] = useState('')
  const { t } = useLocale()

  async function shareEvent() {
    const shareData = { title: `O’BORD · ${title}`, text: description, url: new URL(url, window.location.origin).toString() }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(url)
        setFeedback(t('share.copied'))
        window.setTimeout(() => setFeedback(''), 2200)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      setFeedback(t('share.failed'))
      window.setTimeout(() => setFeedback(''), 2200)
    }
  }

  return <button type="button" className="event-share-button" onClick={() => void shareEvent()} aria-live="polite">{feedback || t('share.button')}</button>
}
