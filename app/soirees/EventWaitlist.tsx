'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { maximumBirthYearForEvent } from '@/lib/age'

export default function EventWaitlist({ eventId, eventTitle, startsAt }: { eventId: string; eventTitle: string; startsAt: string }) {
  const [email, setEmail] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [groupSize, setGroupSize] = useState('1')
  const [birthYears, setBirthYears] = useState<string[]>([''])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const maximumBirthYear = maximumBirthYearForEvent(startsAt)

  useEffect(() => {
    let active = true
    async function loadUser() {
      try {
        const result = await getSupabaseBrowserClient().auth.getUser()
        if (!active) return
        setSignedIn(Boolean(result.data.user && !result.error))
        setEmail(result.data.user?.email ?? '')
        setName(String(result.data.user?.user_metadata?.full_name ?? ''))
      } catch {
        if (active) setSignedIn(false)
      }
    }
    void loadUser()
    return () => { active = false }
  }, [])

  async function joinWaitlist(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user?.email) throw new Error('login_required')
      const count = Number(groupSize)
      const years = birthYears.slice(0, count).map(Number)
      if (!Number.isInteger(count) || count < 1 || count > 30 || years.length !== count
        || years.some((year) => !Number.isInteger(year) || year < 1900 || year > maximumBirthYear)) {
        throw new Error('invalid_fields')
      }
      const { error: insertError } = await supabase.from('event_waitlist').insert({
        event_id: eventId,
        contact_name: name.trim(),
        contact_email: authData.user.email,
        contact_phone: phone.trim() || null,
        group_size: count,
        attendee_birth_years: years,
      })
      if (insertError) {
        if (insertError.code === '23505') throw new Error('already_waitlisted')
        if (insertError.code === '42P01' || insertError.code === 'PGRST205') throw new Error('not_configured')
        throw new Error('save_failed')
      }
      setNotice('Tu es sur la liste d’attente. Si une place se libère, l’équipe te contactera.')
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : ''
      setError(code === 'login_required' ? 'Connecte-toi pour rejoindre la liste d’attente.'
        : code === 'invalid_fields' ? 'Vérifie le nombre de personnes et les années de naissance : chaque personne doit avoir au moins 21 ans le jour de la rencontre.'
          : code === 'already_waitlisted' ? 'Ta demande est déjà sur la liste d’attente pour cette rencontre.'
            : code === 'not_configured' ? 'La liste d’attente n’est pas encore configurée dans Supabase.'
              : 'La demande n’a pas pu être enregistrée. Réessaie dans un instant.')
    } finally {
      setSaving(false)
    }
  }

  const loginNext = `/soirees?plan=${encodeURIComponent(eventId)}#reservation-${eventId}`
  return <div className="waitlist-panel" aria-labelledby={`waitlist-title-${eventId}`}>
    <div className="waitlist-intro"><p className="event-practical-label">LA RENCONTRE EST COMPLÈTE</p><h3 id={`waitlist-title-${eventId}`}>Tu veux être prévenu·e si une place se libère ?</h3><p>Inscris-toi sur la liste d’attente. Ta place n’est pas confirmée tant que l’équipe ne t’a pas recontacté·e.</p></div>
    {notice ? <p className="member-feedback member-feedback-success" role="status">{notice}</p> : signedIn ? <form className="waitlist-form" onSubmit={joinWaitlist}>
      <label>Nom et prénom<input autoComplete="name" required minLength={1} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>E-mail du compte<input type="email" value={email} readOnly /></label>
      <label>Téléphone (facultatif)<input type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
      <label>Nombre de personnes<input type="number" min={1} max={30} value={groupSize} onChange={(event) => { const value = event.target.value; setGroupSize(value); const number = Number(value); setBirthYears(Array.from({ length: Number.isInteger(number) && number >= 1 && number <= 30 ? number : 1 }, (_, index) => birthYears[index] ?? '')) }} /></label>
      <div className="waitlist-years">{Array.from({ length: Math.min(Math.max(Number(groupSize) || 1, 1), 30) }, (_, index) => <label key={index}>{Number(groupSize) === 1 ? 'Ton année de naissance' : `Année de naissance · personne ${index + 1}`}<input type="number" min={1900} max={maximumBirthYear} required value={birthYears[index] ?? ''} onChange={(event) => setBirthYears((values) => values.map((year, yearIndex) => yearIndex === index ? event.target.value : year))} /></label>)}</div>
      <button className="button-primary" type="submit" disabled={saving}>{saving ? 'Inscription…' : 'Rejoindre la liste d’attente'}</button>
      {error && <p className="member-feedback" role="alert">{error}</p>}
    </form> : <div className="waitlist-login"><p>Connecte-toi pour enregistrer ta demande en ton nom.</p><Link className="button-primary" href={`/login?next=${encodeURIComponent(loginNext)}`}>Me connecter</Link>{error && <p className="member-feedback" role="alert">{error}</p>}</div>}
    <p className="waitlist-event-context">Rencontre concernée : <strong>{eventTitle}</strong></p>
  </div>
}
