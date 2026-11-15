'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { maximumBirthYearForEvent } from '@/lib/age'
import { useLocale } from '@/components/LocaleProvider'

export default function EventWaitlist({ eventId, eventTitle, startsAt }: { eventId: string; eventTitle: string; startsAt: string }) {
  const { t } = useLocale()
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
      setNotice(t('waitlist.success'))
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : ''
      setError(code === 'login_required' ? t('waitlist.loginError')
        : code === 'invalid_fields' ? t('waitlist.fieldsError')
          : code === 'already_waitlisted' ? t('waitlist.duplicateError')
            : code === 'not_configured' ? t('waitlist.setupError')
              : t('waitlist.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const loginNext = `/soirees?plan=${encodeURIComponent(eventId)}#reservation-${eventId}`
  return <div className="waitlist-panel" aria-labelledby={`waitlist-title-${eventId}`}>
    <div className="waitlist-intro"><p className="event-practical-label">{t('reservation.fullTitle')}</p><h3 id={`waitlist-title-${eventId}`}>{t('waitlist.title')}</h3><p>{t('waitlist.intro')}</p></div>
    {notice ? <p className="member-feedback member-feedback-success" role="status">{notice}</p> : signedIn ? <form className="waitlist-form" onSubmit={joinWaitlist}>
      <label>{t('waitlist.name')}<input autoComplete="name" required minLength={1} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>{t('waitlist.accountEmail')}<input type="email" value={email} readOnly /></label>
      <label>{t('waitlist.phone')}<input type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
      <label>{t('waitlist.groupSize')}<input type="number" min={1} max={30} value={groupSize} onChange={(event) => { const value = event.target.value; setGroupSize(value); const number = Number(value); setBirthYears(Array.from({ length: Number.isInteger(number) && number >= 1 && number <= 30 ? number : 1 }, (_, index) => birthYears[index] ?? '')) }} /></label>
      <div className="waitlist-years">{Array.from({ length: Math.min(Math.max(Number(groupSize) || 1, 1), 30) }, (_, index) => <label key={index}>{Number(groupSize) === 1 ? t('waitlist.birthYear') : `${t('waitlist.personBirthYear')} ${index + 1}`}<input type="number" min={1900} max={maximumBirthYear} required value={birthYears[index] ?? ''} onChange={(event) => setBirthYears((values) => values.map((year, yearIndex) => yearIndex === index ? event.target.value : year))} /></label>)}</div>
      <button className="button-primary" type="submit" disabled={saving}>{saving ? t('waitlist.saving') : t('waitlist.submit')}</button>
      {error && <p className="member-feedback" role="alert">{error}</p>}
    </form> : <div className="waitlist-login"><p>{t('waitlist.login')}</p><Link className="button-primary" href={`/login?next=${encodeURIComponent(loginNext)}`}>{t('login.submit')}</Link>{error && <p className="member-feedback" role="alert">{error}</p>}</div>}
    <p className="waitlist-event-context">{t('waitlist.meetup')} <strong>{eventTitle}</strong></p>
  </div>
}
