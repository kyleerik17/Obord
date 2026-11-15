'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { maximumBirthYearForEvent } from '@/lib/age'
import { useLocale } from './LocaleProvider'
import { translate, type Locale } from '@/lib/i18n'

type Reservation = {
  id: string
  event_id: string
  attendance_type: 'solo' | 'group'
  contact_name: string
  contact_email: string
  contact_phone: string | null
  group_size: number
  attendee_birth_years: number[] | null
  reservation_status: 'pending' | 'confirmed' | 'declined' | 'cancelled'
  created_at: string
  event: {
    title: string
    starts_at: string
    venue_area: string
    status: string
    description: string
  } | null
}

type WaitlistEntry = {
  id: string
  event_id: string
  group_size: number
  status: 'waiting' | 'contacted' | 'converted' | 'withdrawn'
  created_at: string
  event: { title: string; starts_at: string; venue_area: string } | null
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Africa/Abidjan',
  }).format(new Date(value))
}

export default function AccountDashboard() {
  const { locale } = useLocale()
  const t = useCallback((key: Parameters<typeof translate>[1]) => translate(locale, key), [locale])
  const statusLabels: Record<Reservation['reservation_status'], string> = {
    pending: t('account.statusPending'), confirmed: t('account.statusConfirmed'),
    declined: t('account.statusDeclined'), cancelled: t('account.statusCancelled'),
  }
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState('')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [waitlistNotice, setWaitlistNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [accountLoadedAt, setAccountLoadedAt] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<'solo' | 'group'>('solo')
  const [editGroupSize, setEditGroupSize] = useState('2')
  const [editBirthYears, setEditBirthYears] = useState<string[]>([''])
  const [savingReservationId, setSavingReservationId] = useState<string | null>(null)
  const [cancelReservationId, setCancelReservationId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadAccount() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!active) return
        if (!authData.user) {
          setLoading(false)
          return
        }

        setUser(authData.user)
        const [profileResult, reservationsResult, waitlistResult] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', authData.user.id).maybeSingle(),
          supabase.from('event_registrations')
            .select('id,event_id,attendance_type,contact_name,contact_email,contact_phone,group_size,attendee_birth_years,reservation_status,created_at,event:events!inner(title,starts_at,venue_area,status,description)')
            .eq('user_id', authData.user.id)
            .order('created_at', { ascending: false }),
          supabase.from('event_waitlist')
            .select('id,event_id,group_size,status,created_at,event:events!inner(title,starts_at,venue_area)')
            .eq('user_id', authData.user.id)
            .order('created_at', { ascending: false }),
        ])
        if (!active) return
        if (profileResult.error) throw profileResult.error
        if (reservationsResult.error) throw reservationsResult.error

        const authName = authData.user.user_metadata?.full_name
        setFullName(profileResult.data?.full_name ?? (typeof authName === 'string' ? authName : ''))
        setReservations((reservationsResult.data ?? []) as unknown as Reservation[])
        if (!waitlistResult.error) {
          setWaitlistEntries((waitlistResult.data ?? []) as unknown as WaitlistEntry[])
        } else if (!['PGRST205', '42P01'].includes(waitlistResult.error.code)) {
          setWaitlistNotice(t('account.waitlistError'))
        }
        setAccountLoadedAt(Date.now())
      } catch {
        if (active) setError(t('account.infoError'))
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadAccount()
    return () => { active = false }
  }, [t])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    const cleanedName = fullName.trim()
    if (cleanedName.length < 1 || cleanedName.length > 80) {
      setError(t('account.nameLengthError'))
      return
    }

    setSaving(true)
    setError('')
    setNotice('')
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: profileError } = await supabase.from('profiles').update({ full_name: cleanedName }).eq('id', user.id)
      if (profileError) throw profileError
      const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name: cleanedName } })
      if (metadataError) throw metadataError
      setNotice(t('account.saveNameSuccess'))
    } catch {
      setError(t('account.saveError'))
    } finally {
      setSaving(false)
    }
  }

  function beginReservationEdit(reservation: Reservation) {
    setError('')
    setNotice('')
    setEditingId(reservation.id)
    setEditName(reservation.contact_name)
    setEditType(reservation.attendance_type)
    setEditGroupSize(String(reservation.group_size))
    setEditBirthYears(reservation.attendee_birth_years?.map(String) ?? Array.from({ length: reservation.group_size }, () => ''))
  }

  async function saveReservation(event: FormEvent<HTMLFormElement>, reservation: Reservation) {
    event.preventDefault()
    if (!user || !reservation.event || reservation.reservation_status !== 'pending') return

    const name = editName.trim()
    const groupSize = editType === 'solo' ? 1 : Number(editGroupSize)
    const birthYears = editBirthYears.slice(0, groupSize).map(Number)
    const eventDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Abidjan', year: 'numeric', month: '2-digit' }).format(new Date(reservation.event.starts_at))
    const [yearText, monthText] = eventDate.split('-')
    const latestEligibleBirthYear = Number(yearText) - 21 - (Number(monthText) < 7 ? 1 : 0)

    if (name.length < 1 || name.length > 80 || !Number.isInteger(groupSize) || groupSize < (editType === 'solo' ? 1 : 2) || groupSize > 30) {
      setError(t('account.fieldsError'))
      return
    }
    if (birthYears.length !== groupSize || birthYears.some((year) => !Number.isInteger(year) || year < 1900 || year > latestEligibleBirthYear)) {
      setError(t('account.ageError'))
      return
    }

    setSavingReservationId(reservation.id)
    setError('')
    setNotice('')
    try {
      const { data, error: updateError } = await getSupabaseBrowserClient()
        .from('event_registrations')
        .update({ attendance_type: editType, contact_name: name, group_size: groupSize, attendee_birth_years: birthYears })
        .eq('id', reservation.id)
        .eq('user_id', user.id)
        .eq('reservation_status', 'pending')
        .select('id')
        .maybeSingle()
      if (updateError) throw updateError
      if (!data) throw new Error('reservation_changed')

      setReservations((current) => current.map((item) => item.id === reservation.id ? {
        ...item,
        attendance_type: editType,
        contact_name: name,
        group_size: groupSize,
        attendee_birth_years: birthYears,
      } : item))
      setEditingId(null)
      setNotice(t('account.requestUpdated'))
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : ''
      setError(message.includes('event_capacity_reached')
        ? t('account.capacityError')
        : t('account.changeError'))
    } finally {
      setSavingReservationId(null)
    }
  }

  async function cancelReservation(reservation: Reservation) {
    if (!user || !reservation.event || !['pending', 'confirmed'].includes(reservation.reservation_status)) return
    if (new Date(reservation.event.starts_at).getTime() <= Date.now()) {
      setError(t('account.startedError'))
      return
    }

    setSavingReservationId(reservation.id)
    setError('')
    setNotice('')
    try {
      const { data, error: updateError } = await getSupabaseBrowserClient()
        .from('event_registrations')
        .update({ reservation_status: 'cancelled' })
        .eq('id', reservation.id)
        .eq('user_id', user.id)
        .eq('reservation_status', reservation.reservation_status)
        .select('id')
        .maybeSingle()
      if (updateError) throw updateError
      if (!data) throw new Error('reservation_changed')

      setReservations((current) => current.map((item) => item.id === reservation.id ? { ...item, reservation_status: 'cancelled' } : item))
      setCancelReservationId(null)
      setNotice(t('account.cancelSuccess'))
    } catch {
      setError(t('account.cancelError'))
    } finally {
      setSavingReservationId(null)
    }
  }

  async function leaveWaitlist(entry: WaitlistEntry) {
    setWaitlistNotice('')
    const supabase = getSupabaseBrowserClient()
    const { data, error: updateError } = await supabase.from('event_waitlist')
      .update({ status: 'withdrawn' }).eq('id', entry.id).in('status', ['waiting', 'contacted']).select('id').maybeSingle()
    if (updateError || !data) {
      setWaitlistNotice(t('account.waitlistRemoveError'))
      return
    }
    setWaitlistEntries((current) => current.map((item) => item.id === entry.id ? { ...item, status: 'withdrawn' } : item))
    setWaitlistNotice(t('account.waitlistRemoved'))
  }

  if (loading) {
    return <div className="member-page"><section className="member-loading" role="status">{t('account.loading')}</section></div>
  }

  if (!user) {
    return (
      <div className="member-page">
        <header className="trust-hero trust-hero-compact"><p className="eyebrow eyebrow-dark">{t('account.eyebrow')}</p><h1>{t('account.guestTitle')}</h1><p>{t('account.guestText')}</p></header>
        <div className="trust-content"><section className="trust-card member-empty"><Link href="/login?next=%2Fmon-espace" className="button-primary">{t('login.submit')}</Link><p>{t('login.createQuestion')} <Link href="/login?mode=signup">{t('login.signup')}</Link></p></section></div>
      </div>
    )
  }

  const pendingCount = reservations.filter((item) => item.reservation_status === 'pending').length
  const confirmedCount = reservations.filter((item) => item.reservation_status === 'confirmed').length
  const activeWaitlistCount = waitlistEntries.filter((item) => ['waiting', 'contacted'].includes(item.status)).length
  const upcomingReservations = reservations.filter((item) => item.event && accountLoadedAt !== null && new Date(item.event.starts_at).getTime() >= accountLoadedAt)
  const pastReservations = reservations.filter((item) => !item.event || (accountLoadedAt !== null && new Date(item.event.starts_at).getTime() < accountLoadedAt))

  return (
    <div className="member-page">
      <header className="trust-hero trust-hero-compact"><p className="eyebrow eyebrow-dark">{t('account.eyebrow')}</p><h1>{t('account.welcome')}{fullName ? `, ${fullName.split(' ')[0]}` : ''}.</h1><p>{t('account.summary')}</p></header>
      <div className="trust-content member-content">
        <section className="member-summary" aria-label="Résumé de tes réservations">
          <article className="member-stat"><span>{t('account.requests')}</span><strong>{reservations.length}</strong></article>
          <article className="member-stat"><span>{t('account.pending')}</span><strong>{pendingCount}</strong></article>
          <article className="member-stat"><span>{t('account.confirmed')}</span><strong>{confirmedCount}</strong></article>
          <article className="member-stat"><span>{t('account.waitlist')}</span><strong>{activeWaitlistCount}</strong></article>
        </section>

        <div className="member-grid">
          <section className="trust-card member-profile">
            <p className="event-practical-label">{t('account.profile')}</p>
            <h2>{t('account.profile')}</h2>
            <form onSubmit={saveProfile}>
              <label htmlFor="member-name">{t('account.fullName')}</label>
              <input id="member-name" autoComplete="name" maxLength={80} required value={fullName} onChange={(event) => setFullName(event.target.value)} />
              <label htmlFor="member-email">{t('login.email')}</label>
              <input id="member-email" type="email" value={user.email ?? ''} readOnly />
              <p className="member-account-date">{t('account.created')} {formatDate(user.created_at, locale)}</p>
              <button className="button-primary" type="submit" disabled={saving}>{saving ? t('account.saving') : t('account.save')}</button>
            </form>
            {error && <p className="member-feedback" role="alert">{error}</p>}
            {notice && <p className="member-feedback member-feedback-success" role="status">{notice}</p>}
          </section>

          <section className="member-reservations" aria-labelledby="member-reservations-title">
            <div className="member-section-heading"><div><p className="event-practical-label">{t('account.events')}</p><h2 id="member-reservations-title">{t('account.reservations')}</h2></div><Link href="/soirees" className="member-browse-link">{t('account.choose')}</Link></div>
            <p className="member-event-description">{t('account.ticketInfo')}</p>
            {reservations.length ? (
              <div className="member-reservation-list">
                {upcomingReservations.length > 0 && <h3 className="member-list-heading">{t('account.upcoming')} <span>{upcomingReservations.length}</span></h3>}
                {upcomingReservations.map((reservation) => (
                  <article className="member-reservation-card" key={reservation.id}>
                    <div className="member-reservation-top"><span className={`backoffice-status status-${reservation.reservation_status}`}>{statusLabels[reservation.reservation_status]}</span><span className="member-reservation-type">{reservation.attendance_type === 'solo' ? t('account.solo') : `${t('account.group')} · ${reservation.group_size}`}</span></div>
                    <h3>{reservation.event?.title ?? 'O’BORD'}</h3>
                    <p className="member-event-date">{reservation.event?.starts_at ? formatDate(reservation.event.starts_at, locale) : t('account.datePending')}</p>
                    {reservation.event && <p className="member-event-location">{reservation.event.venue_area}</p>}
                    {reservation.event?.description && <p className="member-event-description">{reservation.event.description}</p>}
                    {reservation.reservation_status === 'pending' && <div className="member-next-step"><strong>{t('account.nextStep')}</strong><span>{t('account.pendingInfo')}</span></div>}
                    {reservation.reservation_status === 'confirmed' && <div className="member-next-step member-next-step-confirmed"><strong>{t('account.placeConfirmed')}</strong><span>{t('account.confirmedInfo')}</span></div>}
                    {reservation.event?.status === 'cancelled' && <p className="member-cancelled-note">{t('account.cancelledInfo')}</p>}
                    {reservation.event?.status === 'completed' && <p className="member-completed-note">{t('account.completedInfo')}</p>}
                    <details className="member-reservation-details"><summary>{t('account.details')}</summary><dl><div><dt>{t('account.registeredName')}</dt><dd>{reservation.contact_name}</dd></div><div><dt>{t('account.contactEmail')}</dt><dd>{reservation.contact_email}</dd></div>{reservation.contact_phone && <div><dt>{t('account.phone')}</dt><dd>{reservation.contact_phone}</dd></div>}<div><dt>{t('account.participants')}</dt><dd>{reservation.group_size}</dd></div>{reservation.attendee_birth_years?.length ? <div><dt>{t('account.birthYears')}</dt><dd>{reservation.attendee_birth_years.join(', ')}</dd></div> : null}<div><dt>{t('account.sent')}</dt><dd>{formatDate(reservation.created_at, locale)}</dd></div></dl></details>
                    {reservation.reservation_status === 'confirmed' && reservation.event && <div className="member-confirmed-actions"><p className="member-confirmed-note">{t('account.noFurtherAction')}</p><a href={`/api/events/${encodeURIComponent(reservation.event_id)}/calendar`}>{t('account.addCalendar')}</a></div>}
                    {reservation.event && accountLoadedAt !== null && new Date(reservation.event.starts_at).getTime() > accountLoadedAt && ['pending', 'confirmed'].includes(reservation.reservation_status) && <div className="member-request-actions">
                      {reservation.reservation_status === 'pending' && <button type="button" className="member-secondary-action" onClick={() => editingId === reservation.id ? setEditingId(null) : beginReservationEdit(reservation)}>{editingId === reservation.id ? t('account.closeEdit') : t('account.edit')}</button>}
                      {cancelReservationId === reservation.id ? <div className="member-cancel-confirm"><span>{t('account.cancelQuestion')}</span><button type="button" onClick={() => void cancelReservation(reservation)} disabled={savingReservationId === reservation.id}>{savingReservationId === reservation.id ? t('account.canceling') : t('account.confirmCancel')}</button><button type="button" onClick={() => setCancelReservationId(null)}>{t('account.keepPlace')}</button></div> : <button type="button" className="member-cancel-action" onClick={() => setCancelReservationId(reservation.id)}>{t('account.cancel')}</button>}
                    </div>}
                    {editingId === reservation.id && reservation.reservation_status === 'pending' && <form className="member-edit-form" onSubmit={(event) => void saveReservation(event, reservation)}>
                      <h4>{t('account.editTitle')}</h4>
                      <label htmlFor={`edit-name-${reservation.id}`}>{t('account.registeredName')}</label><input id={`edit-name-${reservation.id}`} maxLength={80} required value={editName} onChange={(event) => setEditName(event.target.value)} />
                      <fieldset><legend>{t('account.attending')}</legend><label><input type="radio" name={`edit-type-${reservation.id}`} checked={editType === 'solo'} onChange={() => { setEditType('solo'); setEditGroupSize('1'); setEditBirthYears((years) => [years[0] ?? '']) }} /> {t('account.solo')}</label><label><input type="radio" name={`edit-type-${reservation.id}`} checked={editType === 'group'} onChange={() => { setEditType('group'); setEditGroupSize((size) => Number(size) < 2 ? '2' : size); setEditBirthYears((years) => [years[0] ?? '', years[1] ?? '']) }} /> {t('account.group')}</label></fieldset>
                      {editType === 'group' && <><label htmlFor={`edit-size-${reservation.id}`}>{t('account.groupCount')}</label><input id={`edit-size-${reservation.id}`} type="number" min={2} max={30} required value={editGroupSize} onChange={(event) => { const value = event.target.value; setEditGroupSize(value); const count = Number(value); if (Number.isInteger(count) && count >= 2 && count <= 30) setEditBirthYears((years) => Array.from({ length: count }, (_, index) => years[index] ?? '')) }} /></>}
                      <div className="member-edit-years">{Array.from({ length: editType === 'solo' ? 1 : Math.min(Math.max(Number(editGroupSize), 0), 30) }, (_, index) => <div key={index}><label htmlFor={`edit-year-${reservation.id}-${index}`}>{editType === 'solo' ? t('account.birthYear') : `${t('account.birthYearPerson')} ${index + 1}`}</label><input id={`edit-year-${reservation.id}-${index}`} type="number" min={1900} max={maximumBirthYearForEvent(reservation.event!.starts_at)} required value={editBirthYears[index] ?? ''} onChange={(event) => setEditBirthYears((years) => years.map((year, yearIndex) => yearIndex === index ? event.target.value : year))} /></div>)}</div>
                      <div className="member-edit-buttons"><button type="submit" className="button-primary" disabled={savingReservationId === reservation.id}>{savingReservationId === reservation.id ? t('account.saving') : t('account.corrections')}</button><button type="button" className="member-secondary-action" onClick={() => setEditingId(null)}>{t('account.return')}</button></div>
                    </form>}
                  </article>
                ))}
                {pastReservations.length > 0 && <><h3 className="member-list-heading member-history-heading">{t('account.past')} <span>{pastReservations.length}</span></h3>{pastReservations.map((reservation) => (
                  <article className="member-reservation-card member-reservation-past" key={reservation.id}>
                    <div className="member-reservation-top"><span className={`backoffice-status status-${reservation.reservation_status}`}>{statusLabels[reservation.reservation_status]}</span><span className="member-reservation-type">{reservation.attendance_type === 'solo' ? t('account.solo') : `${t('account.group')} · ${reservation.group_size}`}</span></div>
                    <h3>{reservation.event?.title ?? 'O’BORD'}</h3>
                    <p className="member-event-date">{reservation.event?.starts_at ? formatDate(reservation.event.starts_at, locale) : t('account.datePending')}</p>
                    {reservation.event && <p className="member-event-location">{reservation.event.venue_area}</p>}
                    {reservation.event?.description && <p className="member-event-description">{reservation.event.description}</p>}
                    <details className="member-reservation-details"><summary>{t('account.details')}</summary><dl><div><dt>{t('account.registeredName')}</dt><dd>{reservation.contact_name}</dd></div><div><dt>{t('account.contactEmail')}</dt><dd>{reservation.contact_email}</dd></div>{reservation.contact_phone && <div><dt>{t('account.phone')}</dt><dd>{reservation.contact_phone}</dd></div>}<div><dt>{t('account.participants')}</dt><dd>{reservation.group_size}</dd></div>{reservation.attendee_birth_years?.length ? <div><dt>{t('account.birthYears')}</dt><dd>{reservation.attendee_birth_years.join(', ')}</dd></div> : null}<div><dt>{t('account.sent')}</dt><dd>{formatDate(reservation.created_at, locale)}</dd></div></dl></details>
                  </article>
                ))}</>}
              </div>
            ) : (
              <div className="trust-card member-empty"><h3>{t('account.noReservations')}</h3><p>{t('account.noReservationsText')}</p><Link className="button-primary" href="/soirees">{t('account.findMeetups')}</Link></div>
            )}
          </section>
        </div>
        <section className="member-waitlist" aria-labelledby="member-waitlist-title">
          <div className="member-section-heading"><div><p className="event-practical-label">O’BORD</p><h2 id="member-waitlist-title">{t('account.waitlistTitle')}</h2></div><Link href="/soirees" className="member-browse-link">{t('soirees.dates')}</Link></div>
          {waitlistNotice && <p className="member-feedback" role="status">{waitlistNotice}</p>}
          {waitlistEntries.length ? <div className="member-waitlist-list">{waitlistEntries.map((entry) => <article className="member-waitlist-card" key={entry.id}>
            <div><span className={`backoffice-status ${entry.status === 'contacted' ? 'status-confirmed' : entry.status === 'withdrawn' ? 'status-cancelled' : ''}`}>{entry.status === 'waiting' ? t('account.waitlistPending') : entry.status === 'contacted' ? t('account.waitlistContacted') : entry.status === 'converted' ? t('account.waitlistConverted') : t('account.waitlistWithdrawn')}</span><h3>{entry.event?.title ?? 'O’BORD'}</h3><p>{entry.event?.starts_at ? formatDate(entry.event.starts_at, locale) : t('account.datePending')} · {entry.group_size}</p></div>
            {entry.event && entry.status !== 'withdrawn' && entry.status !== 'converted' && <button type="button" className="member-cancel-action" onClick={() => void leaveWaitlist(entry)}>{t('account.removeWaitlist')}</button>}
          </article>)}</div> : <p className="member-waitlist-empty">{t('account.waitlistEmpty')}</p>}
        </section>
      </div>
      {(error || notice) && <div className="member-global-feedback" role={error ? 'alert' : 'status'}>{error || notice}<button type="button" aria-label="Fermer le message" onClick={() => { setError(''); setNotice('') }}>×</button></div>}
    </div>
  )
}
