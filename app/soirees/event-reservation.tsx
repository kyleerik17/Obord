'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type Reservation = {
  id: string
  attendance_type: 'solo' | 'group'
  group_size: number
  attendee_birth_years: number[] | null
  reservation_status: 'pending' | 'confirmed' | 'declined' | 'cancelled'
}

export default function EventReservation({ eventId, eventDate, eventEndsAt, capacity }: { eventId: string; eventDate: string; eventEndsAt: string | null; capacity: number | null }) {
  const [user, setUser] = useState<User | null>(null)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [attendanceType, setAttendanceType] = useState<'solo' | 'group'>('solo')
  const [groupSize, setGroupSize] = useState('2')
  const [attendeeBirthYears, setAttendeeBirthYears] = useState<string[]>(['', ''])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [eventHasEnded, setEventHasEnded] = useState(false)

  useEffect(() => {
    let active = true

    async function loadReservation() {
      try {
        const eventCutoff = eventEndsAt ? new Date(eventEndsAt).getTime() : new Date(`${eventDate}T23:59:59+00:00`).getTime()
        if (active) setEventHasEnded(eventCutoff <= Date.now())
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getUser()
        if (!active) return
        setUser(data.user)
        const metadataName = data.user?.user_metadata?.full_name
        if (typeof metadataName === 'string') setName(metadataName.slice(0, 80))

        if (data.user) {
          const { data: ownReservation } = await supabase
            .from('event_registrations')
            .select('id,attendance_type,group_size,attendee_birth_years,reservation_status')
            .eq('event_id', eventId)
            .eq('user_id', data.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (active && ownReservation) {
            setReservation(ownReservation)
            setAttendanceType(ownReservation.attendance_type)
            setGroupSize(String(ownReservation.group_size))
            if (ownReservation.attendee_birth_years) setAttendeeBirthYears(ownReservation.attendee_birth_years.map(String))
          }
        }
      } catch {
        if (active) setError('Le formulaire est momentanément indisponible.')
      } finally {
        if (active) setReady(true)
      }
    }

    void loadReservation()
    return () => { active = false }
  }, [eventDate, eventEndsAt, eventId])

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user?.email) return

    const requestedGroupSize = attendanceType === 'solo' ? 1 : Number(groupSize)
    if (!Number.isInteger(requestedGroupSize) || requestedGroupSize < (attendanceType === 'solo' ? 1 : 2) || requestedGroupSize > 30) {
      setError('Indique un nombre de personnes compris entre 2 et 30 pour une réservation en groupe.')
      return
    }

    const birthYears = attendeeBirthYears.slice(0, requestedGroupSize).map(Number)
    const [eventYearText, eventMonthText] = eventDate.split('-')
    const eventYear = Number(eventYearText)
    const eventMonth = Number(eventMonthText)
    const latestEligibleBirthYear = eventYear - 21 - (eventMonth < 7 ? 1 : 0)
    if (birthYears.length !== requestedGroupSize || birthYears.some((year) => !Number.isInteger(year) || year < 1900 || year > latestEligibleBirthYear)) {
      setError('Chaque personne doit avoir au moins 21 ans à la date de la rencontre. Vérifie son année de naissance.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error: insertError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          attendance_type: attendanceType,
          contact_name: name.trim(),
          contact_email: user.email,
          group_size: requestedGroupSize,
          attendee_birth_years: birthYears,
        })
        .select('id,attendance_type,group_size,attendee_birth_years,reservation_status')
        .single()

      if (insertError) throw insertError
      setReservation(data)
      setMessage('Ta demande est envoyée. L’équipe O’BORD te confirmera la réservation.')
    } catch (submissionError) {
      const code = typeof submissionError === 'object' && submissionError !== null && 'code' in submissionError
        ? String(submissionError.code)
        : ''
      const details = typeof submissionError === 'object' && submissionError !== null && 'message' in submissionError
        ? String(submissionError.message)
        : ''

      if (code === '42501' || code === 'PGRST204' || code === '42703') {
        setError('La base de données n’est pas encore à jour pour les réservations. L’équipe doit appliquer le script de migration des années de naissance dans Supabase.')
      } else if (details.includes('event_capacity_reached')) {
        setError('Il n’y a plus assez de places disponibles pour cette réservation.')
      } else if (code === '23514' || details.includes('registration_birth_years_meet_minimum')) {
        setError('Vérifie l’année indiquée : chaque personne doit avoir au moins 21 ans à la date de la rencontre.')
      } else {
        setError('La demande n’a pas abouti. Vérifie ta connexion et réessaie dans quelques instants.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="registration-section" id={`reservation-${eventId}`} aria-labelledby={`reservation-title-${eventId}`}>
      <div className="registration-intro">
        <p className="eyebrow eyebrow-dark">✳ TA PLACE DANS LA MAISON</p>
        <h2 id={`reservation-title-${eventId}`}>Tu viens <span>comment ?</span></h2>
        <p>Une première rencontre peut commencer par un simple bonjour. Dis-nous si tu viens en solo ou avec ta bande ; l’équipe te répondra pour confirmer ta réservation et partager les infos pratiques.</p>
      </div>

      {!ready ? <p role="status" className="registration-help">Chargement du formulaire…</p> : !user ? (
        <div className="registration-form text-center">
          <p className="registration-help">Connecte-toi pour envoyer une demande de réservation et suivre sa confirmation.</p>
          <Link href="/login" className="button-primary registration-submit">Me connecter pour réserver ma place <span aria-hidden="true">↗</span></Link>
        </div>
      ) : reservation && !['declined', 'cancelled'].includes(reservation.reservation_status) ? (
        <div className="registration-form">
          <div className="registration-form-heading"><div><span>TA DEMANDE</span><h3>{reservation.attendance_type === 'solo' ? 'Réservation solo' : `Réservation pour ${reservation.group_size} personnes`}</h3></div><span className="registration-form-spark" aria-hidden="true">✳</span></div>
          {reservation.reservation_status === 'pending' && <p role="status" className="registration-help">Demande reçue, en attente de confirmation par l’équipe O’BORD.</p>}
          {reservation.reservation_status === 'confirmed' && <p role="status" className="registration-help">Ta réservation est confirmée. Aucune autre démarche n’est nécessaire.</p>}
        </div>
      ) : eventHasEnded ? (
        <div className="registration-form text-center"><p className="registration-help">Les réservations pour cette rencontre sont closes.</p></div>
      ) : (
        <form className="registration-form" onSubmit={submitReservation}>
          <div className="registration-tabs" role="group" aria-label="Type de réservation">
            <button type="button" onClick={() => setAttendanceType('solo')} className={`registration-tab${attendanceType === 'solo' ? ' active' : ''}`} aria-pressed={attendanceType === 'solo'}><span aria-hidden="true">♙</span><span><strong>Je viens en solo</strong><small>Je viens comme je suis, et je fais connaissance.</small></span></button>
            <button type="button" onClick={() => setAttendanceType('group')} className={`registration-tab${attendanceType === 'group' ? ' active' : ''}`} aria-pressed={attendanceType === 'group'}><span aria-hidden="true">♟</span><span><strong>On vient en groupe</strong><small>On partage ce moment avec ma bande.</small></span></button>
          </div>
          <div className="registration-fields">
            <div><label htmlFor={`contact-name-${eventId}`}>Nom complet</label><input id={`contact-name-${eventId}`} autoComplete="name" maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} /></div>
            <div><label htmlFor={`contact-email-${eventId}`}>E-mail du compte</label><input id={`contact-email-${eventId}`} type="email" value={user.email ?? ''} readOnly /></div>
            {attendanceType === 'group' && <div><label htmlFor={`group-size-${eventId}`}>Nombre de personnes, toi compris·e</label><input id={`group-size-${eventId}`} type="number" min={2} max={30} required value={groupSize} onChange={(event) => {
              const value = event.target.value
              setGroupSize(value)
              const count = Number(value)
              if (Number.isInteger(count) && count >= 2 && count <= 30) {
                setAttendeeBirthYears((current) => Array.from({ length: count }, (_, index) => current[index] ?? ''))
              }
            }} /></div>}
          </div>
          <div className="registration-age-notice"><strong>Rencontres réservées aux personnes de 21 ans et plus à la date de la rencontre.</strong><span>Indique l’année de naissance de chaque personne{attendanceType === 'group' ? ', toi compris·e' : ''}. Comme nous ne demandons pas la date complète, certaines années proches du seuil sont refusées par prudence.</span></div>
          {capacity !== null && <p className="registration-privacy">Capacité maximale : {capacity} personnes. Les demandes en attente comptent dans cette limite.</p>}
          <div className="registration-age-fields">
            {Array.from({ length: attendanceType === 'solo' ? 1 : Math.min(Math.max(Number(groupSize), 0), 30) }, (_, index) => (
              <div key={index}>
                <label htmlFor={`attendee-birth-year-${eventId}-${index}`}>{attendanceType === 'solo' ? 'Ton année de naissance' : `Année de naissance · personne ${index + 1}${index === 0 ? ' (toi)' : ''}`}</label>
                <input id={`attendee-birth-year-${eventId}-${index}`} type="number" inputMode="numeric" min={1900} max={Number(eventDate.slice(0, 4)) - 21 - (Number(eventDate.slice(5, 7)) < 7 ? 1 : 0)} step={1} required value={attendeeBirthYears[index] ?? ''} onChange={(event) => setAttendeeBirthYears((current) => current.map((year, yearIndex) => yearIndex === index ? event.target.value : year))} />
              </div>
            ))}
          </div>
          <p className="registration-privacy">La demande reste privée. L’équipe te communiquera le point de rencontre après confirmation.</p>
          {error && <p role="alert" className="registration-help">{error}</p>}
          {message && <p role="status" className="registration-help">{message}</p>}
          <button type="submit" disabled={busy} className="button-primary registration-submit">{busy ? 'On prépare ta demande…' : 'Oui, je demande ma place'} <span aria-hidden="true">↗</span></button>
        </form>
      )}

      {error && ready && user && reservation && ['declined', 'cancelled'].includes(reservation.reservation_status) && <p role="alert" className="registration-help">{error}</p>}
    </section>
  )
}
