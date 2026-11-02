'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase'

function playChime() {
  try {
    const AudioContextConstructor = window.AudioContext
    if (!AudioContextConstructor) return
    const context = new AudioContextConstructor()
    const now = context.currentTime
    for (const [frequency, start, duration] of [[660, 0, 0.16], [880, 0.12, 0.22]] as const) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + start)
      gain.gain.exponentialRampToValueAtTime(0.12, now + start + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now + start)
      oscillator.stop(now + start + duration)
    }
    window.setTimeout(() => void context.close(), 500)
  } catch {
    // Audio is optional; a browser setting must never block team notifications.
  }
}

export default function TeamNotifications({ pendingReservations, unreadMessages }: { pendingReservations: number; unreadMessages: number }) {
  const router = useRouter()
  const [sound, setSound] = useState(false)
  const [notice, setNotice] = useState('')
  const soundRef = useRef(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel('obord-team-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_registrations' }, () => {
        setNotice('Une nouvelle demande de réservation vient d’arriver.')
        if (soundRef.current) playChime()
        router.refresh()
        window.setTimeout(() => setNotice(''), 7000)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, () => {
        setNotice('Un nouveau message est arrivé dans la boîte de l’équipe.')
        if (soundRef.current) playChime()
        router.refresh()
        window.setTimeout(() => setNotice(''), 7000)
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [router])

  function toggleSound() {
    const next = !sound
    setSound(next)
    soundRef.current = next
    if (next) playChime()
  }

  return <div className="team-notifications" aria-label="Notifications du collectif">
    <div className="team-notification-summary" aria-live="polite">
      <span className="team-notification-icon" aria-hidden="true">✳</span>
      <div><strong>Le radar O’BORD</strong><p>{pendingReservations ? `${pendingReservations} demande${pendingReservations > 1 ? 's' : ''} à traiter` : 'Aucune demande en attente'} · {unreadMessages ? `${unreadMessages} message${unreadMessages > 1 ? 's' : ''} à lire` : 'boîte de messages à jour'}</p></div>
    </div>
    <button className="team-sound-toggle" type="button" onClick={toggleSound} aria-pressed={sound}>{sound ? '♫ Son activé' : '♫ Activer le son'}</button>
    {notice && <p className="team-live-toast" role="status">✦ {notice}</p>}
  </div>
}
