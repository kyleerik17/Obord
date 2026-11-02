'use client'

import { useState } from 'react'

export default function ShareEventButton({ title, description, url }: { title: string; description: string; url: string }) {
  const [feedback, setFeedback] = useState('')

  async function shareEvent() {
    const shareData = { title: `O’BORD · ${title}`, text: description, url: new URL(url, window.location.origin).toString() }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(url)
        setFeedback('Lien copié')
        window.setTimeout(() => setFeedback(''), 2200)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      setFeedback('Copie indisponible')
      window.setTimeout(() => setFeedback(''), 2200)
    }
  }

  return <button type="button" className="event-share-button" onClick={() => void shareEvent()} aria-live="polite">{feedback || 'Partager la rencontre'}</button>
}
