'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type Reservation = {
  id: string
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

const statusLabels: Record<Reservation['reservation_status'], string> = {
  pending: 'En attente de réponse',
  confirmed: 'Confirmée',
  declined: 'Refusée',
  cancelled: 'Annulée',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Africa/Abidjan',
  }).format(new Date(value))
}

export default function AccountDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState('')
  const [reservations, setReservations] = useState<Reservation[]>([])
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
        const [profileResult, reservationsResult] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', authData.user.id).maybeSingle(),
          supabase.from('event_registrations')
            .select('id,attendance_type,contact_name,contact_email,contact_phone,group_size,attendee_birth_years,reservation_status,created_at,event:events!inner(title,starts_at,venue_area,status,description)')
            .eq('user_id', authData.user.id)
            .order('created_at', { ascending: false }),
        ])
        if (!active) return
        if (profileResult.error) throw profileResult.error
        if (reservationsResult.error) throw reservationsResult.error

        const authName = authData.user.user_metadata?.full_name
        setFullName(profileResult.data?.full_name ?? (typeof authName === 'string' ? authName : ''))
        setReservations((reservationsResult.data ?? []) as unknown as Reservation[])
        setAccountLoadedAt(Date.now())
      } catch {
        if (active) setError('Tes informations n’ont pas pu être chargées. Réessaie dans un instant.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadAccount()
    return () => { active = false }
  }, [])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    const cleanedName = fullName.trim()
    if (cleanedName.length < 1 || cleanedName.length > 80) {
      setError('Le nom doit contenir entre 1 et 80 caractères.')
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
      setNotice('Ton nom a bien été mis à jour.')
    } catch {
      setError('La mise à jour n’a pas abouti. Réessaie dans un instant.')
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
      setError('Vérifie le nom et le nombre de personnes indiqué.')
      return
    }
    if (birthYears.length !== groupSize || birthYears.some((year) => !Number.isInteger(year) || year < 1900 || year > latestEligibleBirthYear)) {
      setError('Chaque participant doit avoir au moins 21 ans à la date de la rencontre. Vérifie les années de naissance.')
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
      setNotice('Ta demande a été mise à jour.')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : ''
      setError(message.includes('event_capacity_reached')
        ? 'Ce changement dépasse le nombre de places encore disponibles.'
        : 'La demande a changé ou ne peut plus être modifiée. Actualise la page et réessaie.')
    } finally {
      setSavingReservationId(null)
    }
  }

  async function cancelReservation(reservation: Reservation) {
    if (!user || !reservation.event || !['pending', 'confirmed'].includes(reservation.reservation_status)) return
    if (new Date(reservation.event.starts_at).getTime() <= Date.now()) {
      setError('La rencontre a commencé. Écris au collectif pour signaler un changement.')
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
      setNotice('La réservation est annulée et la place a été libérée.')
    } catch {
      setError('Cette réservation a changé ou ne peut plus être annulée depuis ton espace. Actualise la page ou contacte le collectif.')
    } finally {
      setSavingReservationId(null)
    }
  }

  if (loading) {
    return <main className="member-page"><section className="member-loading" role="status">Chargement de ton espace…</section></main>
  }

  if (!user) {
    return (
      <main className="member-page">
        <header className="trust-hero trust-hero-compact"><p className="eyebrow eyebrow-dark">TON ESPACE O’BORD</p><h1>Retrouve ta place.</h1><p>Connecte-toi pour consulter tes informations et suivre tes demandes de réservation.</p></header>
        <div className="trust-content"><section className="trust-card member-empty"><Link href="/login?next=%2Fmon-espace" className="button-primary">Me connecter <span aria-hidden="true">↗</span></Link><p>Pas encore de compte ? <Link href="/login?mode=signup">Créer mon compte</Link></p></section></div>
      </main>
    )
  }

  const pendingCount = reservations.filter((item) => item.reservation_status === 'pending').length
  const confirmedCount = reservations.filter((item) => item.reservation_status === 'confirmed').length
  const upcomingReservations = reservations.filter((item) => item.event && accountLoadedAt !== null && new Date(item.event.starts_at).getTime() >= accountLoadedAt)
  const pastReservations = reservations.filter((item) => !item.event || (accountLoadedAt !== null && new Date(item.event.starts_at).getTime() < accountLoadedAt))

  return (
    <main className="member-page">
      <header className="trust-hero trust-hero-compact"><p className="eyebrow eyebrow-dark">TON ESPACE O’BORD</p><h1>Bienvenue{fullName ? `, ${fullName.split(' ')[0]}` : ''}.</h1><p>Retrouve ici tes informations et le suivi de toutes tes demandes de rencontre.</p></header>
      <div className="trust-content member-content">
        <section className="member-summary" aria-label="Résumé de tes réservations">
          <article className="member-stat"><span>MES DEMANDES</span><strong>{reservations.length}</strong></article>
          <article className="member-stat"><span>EN ATTENTE</span><strong>{pendingCount}</strong></article>
          <article className="member-stat"><span>CONFIRMÉES</span><strong>{confirmedCount}</strong></article>
        </section>

        <div className="member-grid">
          <section className="trust-card member-profile">
            <p className="event-practical-label">MES INFORMATIONS</p>
            <h2>Mon profil</h2>
            <form onSubmit={saveProfile}>
              <label htmlFor="member-name">Nom complet</label>
              <input id="member-name" autoComplete="name" maxLength={80} required value={fullName} onChange={(event) => setFullName(event.target.value)} />
              <label htmlFor="member-email">Adresse e-mail</label>
              <input id="member-email" type="email" value={user.email ?? ''} readOnly />
              <p className="member-account-date">Compte créé le {formatDate(user.created_at)}</p>
              <button className="button-primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer mon nom'}</button>
            </form>
            {error && <p className="member-feedback" role="alert">{error}</p>}
            {notice && <p className="member-feedback member-feedback-success" role="status">{notice}</p>}
          </section>

          <section className="member-reservations" aria-labelledby="member-reservations-title">
            <div className="member-section-heading"><div><p className="event-practical-label">MES RENCONTRES</p><h2 id="member-reservations-title">Mes réservations</h2></div><Link href="/soirees" className="member-browse-link">Choisir une rencontre <span aria-hidden="true">↗</span></Link></div>
            {reservations.length ? (
              <div className="member-reservation-list">
                {upcomingReservations.length > 0 && <h3 className="member-list-heading">À venir <span>{upcomingReservations.length}</span></h3>}
                {upcomingReservations.map((reservation) => (
                  <article className="member-reservation-card" key={reservation.id}>
                    <div className="member-reservation-top"><span className={`backoffice-status status-${reservation.reservation_status}`}>{statusLabels[reservation.reservation_status]}</span><span className="member-reservation-type">{reservation.attendance_type === 'solo' ? 'En solo' : `En groupe · ${reservation.group_size} personnes`}</span></div>
                    <h3>{reservation.event?.title ?? 'Rencontre O’BORD'}</h3>
                    <p className="member-event-date">{reservation.event?.starts_at ? formatDate(reservation.event.starts_at) : 'Date à confirmer'}</p>
                    {reservation.event && <p className="member-event-location">{reservation.event.venue_area}</p>}
                    {reservation.event?.description && <p className="member-event-description">{reservation.event.description}</p>}
                    {reservation.reservation_status === 'pending' && <div className="member-next-step"><strong>La suite</strong><span>L’équipe O’BORD te contactera pour confirmer ta place et partager le point de rendez-vous. Tu peux modifier ou annuler ta demande jusqu’au début de la rencontre.</span></div>}
                    {reservation.reservation_status === 'confirmed' && <div className="member-next-step member-next-step-confirmed"><strong>Ta place est confirmée</strong><span>Retrouve les informations pratiques ci-dessus. Tu peux annuler jusqu’au début ; pour toute modification, écris au <Link href="/contact">collectif</Link>.</span></div>}
                    {reservation.event?.status === 'cancelled' && <p className="member-cancelled-note">Cette rencontre a été annulée. Contacte l’équipe si tu as besoin d’informations.</p>}
                    {reservation.event?.status === 'completed' && <p className="member-completed-note">Cette rencontre est terminée. Merci d’avoir partagé ce moment avec O’BORD.</p>}
                    <details className="member-reservation-details"><summary>Voir les informations de ma demande</summary><dl><div><dt>Nom inscrit</dt><dd>{reservation.contact_name}</dd></div><div><dt>E-mail de contact</dt><dd>{reservation.contact_email}</dd></div>{reservation.contact_phone && <div><dt>Téléphone</dt><dd>{reservation.contact_phone}</dd></div>}<div><dt>Participants</dt><dd>{reservation.group_size}</dd></div>{reservation.attendee_birth_years?.length ? <div><dt>Années de naissance enregistrées</dt><dd>{reservation.attendee_birth_years.join(', ')}</dd></div> : null}<div><dt>Demande envoyée</dt><dd>{formatDate(reservation.created_at)}</dd></div></dl></details>
                    {reservation.reservation_status === 'confirmed' && reservation.event && <p className="member-confirmed-note">Ta réservation est confirmée. Aucune autre démarche n’est nécessaire.</p>}
                    {reservation.event && accountLoadedAt !== null && new Date(reservation.event.starts_at).getTime() > accountLoadedAt && ['pending', 'confirmed'].includes(reservation.reservation_status) && <div className="member-request-actions">
                      {reservation.reservation_status === 'pending' && <button type="button" className="member-secondary-action" onClick={() => editingId === reservation.id ? setEditingId(null) : beginReservationEdit(reservation)}>{editingId === reservation.id ? 'Fermer la modification' : 'Modifier ma demande'}</button>}
                      {cancelReservationId === reservation.id ? <div className="member-cancel-confirm"><span>Tu confirmes l’annulation ? La place sera libérée.</span><button type="button" onClick={() => void cancelReservation(reservation)} disabled={savingReservationId === reservation.id}>{savingReservationId === reservation.id ? 'Annulation…' : 'Oui, annuler'}</button><button type="button" onClick={() => setCancelReservationId(null)}>Garder ma place</button></div> : <button type="button" className="member-cancel-action" onClick={() => setCancelReservationId(reservation.id)}>Annuler ma réservation</button>}
                    </div>}
                    {editingId === reservation.id && reservation.reservation_status === 'pending' && <form className="member-edit-form" onSubmit={(event) => void saveReservation(event, reservation)}>
                      <h4>Corriger ma demande</h4>
                      <label htmlFor={`edit-name-${reservation.id}`}>Nom inscrit</label><input id={`edit-name-${reservation.id}`} maxLength={80} required value={editName} onChange={(event) => setEditName(event.target.value)} />
                      <fieldset><legend>Tu viens comment ?</legend><label><input type="radio" name={`edit-type-${reservation.id}`} checked={editType === 'solo'} onChange={() => { setEditType('solo'); setEditGroupSize('1'); setEditBirthYears((years) => [years[0] ?? '']) }} /> En solo</label><label><input type="radio" name={`edit-type-${reservation.id}`} checked={editType === 'group'} onChange={() => { setEditType('group'); setEditGroupSize((size) => Number(size) < 2 ? '2' : size); setEditBirthYears((years) => [years[0] ?? '', years[1] ?? '']) }} /> En groupe</label></fieldset>
                      {editType === 'group' && <><label htmlFor={`edit-size-${reservation.id}`}>Nombre de personnes, toi compris·e</label><input id={`edit-size-${reservation.id}`} type="number" min={2} max={30} required value={editGroupSize} onChange={(event) => { const value = event.target.value; setEditGroupSize(value); const count = Number(value); if (Number.isInteger(count) && count >= 2 && count <= 30) setEditBirthYears((years) => Array.from({ length: count }, (_, index) => years[index] ?? '')) }} /></>}
                      <div className="member-edit-years">{Array.from({ length: editType === 'solo' ? 1 : Math.min(Math.max(Number(editGroupSize), 0), 30) }, (_, index) => <div key={index}><label htmlFor={`edit-year-${reservation.id}-${index}`}>{editType === 'solo' ? 'Ton année de naissance' : `Année de naissance · personne ${index + 1}`}</label><input id={`edit-year-${reservation.id}-${index}`} type="number" min={1900} max={Number(reservation.event!.starts_at.slice(0, 4)) - 21} required value={editBirthYears[index] ?? ''} onChange={(event) => setEditBirthYears((years) => years.map((year, yearIndex) => yearIndex === index ? event.target.value : year))} /></div>)}</div>
                      <div className="member-edit-buttons"><button type="submit" className="button-primary" disabled={savingReservationId === reservation.id}>{savingReservationId === reservation.id ? 'Enregistrement…' : 'Enregistrer les corrections'}</button><button type="button" className="member-secondary-action" onClick={() => setEditingId(null)}>Retour</button></div>
                    </form>}
                  </article>
                ))}
                {pastReservations.length > 0 && <><h3 className="member-list-heading member-history-heading">Rencontres passées <span>{pastReservations.length}</span></h3>{pastReservations.map((reservation) => (
                  <article className="member-reservation-card member-reservation-past" key={reservation.id}>
                    <div className="member-reservation-top"><span className={`backoffice-status status-${reservation.reservation_status}`}>{statusLabels[reservation.reservation_status]}</span><span className="member-reservation-type">{reservation.attendance_type === 'solo' ? 'En solo' : `En groupe · ${reservation.group_size} personnes`}</span></div>
                    <h3>{reservation.event?.title ?? 'Rencontre O’BORD'}</h3>
                    <p className="member-event-date">{reservation.event?.starts_at ? formatDate(reservation.event.starts_at) : 'Date à confirmer'}</p>
                    {reservation.event && <p className="member-event-location">{reservation.event.venue_area}</p>}
                    {reservation.event?.description && <p className="member-event-description">{reservation.event.description}</p>}
                    <details className="member-reservation-details"><summary>Voir les informations de ma demande</summary><dl><div><dt>Nom inscrit</dt><dd>{reservation.contact_name}</dd></div><div><dt>E-mail de contact</dt><dd>{reservation.contact_email}</dd></div>{reservation.contact_phone && <div><dt>Téléphone</dt><dd>{reservation.contact_phone}</dd></div>}<div><dt>Participants</dt><dd>{reservation.group_size}</dd></div>{reservation.attendee_birth_years?.length ? <div><dt>Années de naissance enregistrées</dt><dd>{reservation.attendee_birth_years.join(', ')}</dd></div> : null}<div><dt>Demande envoyée</dt><dd>{formatDate(reservation.created_at)}</dd></div></dl></details>
                  </article>
                ))}</>}
              </div>
            ) : (
              <div className="trust-card member-empty"><h3>Pas encore de rencontre réservée.</h3><p>Choisis une date dans l’agenda et retrouve ici le suivi de ta demande.</p><Link className="button-primary" href="/soirees">Découvrir les rencontres <span aria-hidden="true">↗</span></Link></div>
            )}
          </section>
        </div>
      </div>
      {(error || notice) && <div className="member-global-feedback" role={error ? 'alert' : 'status'}>{error || notice}<button type="button" aria-label="Fermer le message" onClick={() => { setError(''); setNotice('') }}>×</button></div>}
    </main>
  )
}
