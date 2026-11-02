'use client'

import { useMemo, useState } from 'react'
import { maximumBirthYearForEvent } from '@/lib/age'
import { saveReservationBirthYears, updateReservationDecision } from './actions'

export type ReservationInboxItem = {
  id: string
  event_id: string
  attendance_type: 'solo' | 'group'
  contact_name: string
  contact_email: string
  contact_phone: string | null
  group_size: number
  attendee_birth_years: number[] | null
  reservation_status: 'pending' | 'confirmed' | 'declined' | 'cancelled'
  message: string | null
  created_at: string
  event: { title: string; starts_at: string; venue_area: string }
}

const statusLabels: Record<ReservationInboxItem['reservation_status'], string> = {
  pending: 'En attente', confirmed: 'Confirmée', declined: 'Refusée', cancelled: 'Annulée',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Abidjan' }).format(new Date(value))
}

function whatsappLink(phone: string | null, message: string) {
  const digits = phone?.replace(/\D/g, '')
  const international = digits ? digits.startsWith('225') ? digits : digits.startsWith('0') ? `225${digits.slice(1)}` : `225${digits}` : '2250768963019'
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`
}

export default function ReservationInbox({ reservations }: { reservations: ReservationInboxItem[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [eventId, setEventId] = useState('all')
  const [eventDate, setEventDate] = useState('')
  const events = useMemo(() => [...new Map(reservations.map((item) => [item.event_id, item.event.title])).entries()], [reservations])
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('fr')
    return reservations.filter((reservation) => {
      const matchesSearch = !term || [reservation.contact_name, reservation.contact_email, reservation.contact_phone ?? '', reservation.event.title].some((value) => value.toLocaleLowerCase('fr').includes(term))
      return matchesSearch
        && (status === 'all' || reservation.reservation_status === status)
        && (eventId === 'all' || reservation.event_id === eventId)
        && (!eventDate || reservation.event.starts_at.slice(0, 10) === eventDate)
    })
  }, [reservations, search, status, eventId, eventDate])

  return <>
    <form className="reservation-filter-bar" onSubmit={(event) => event.preventDefault()} aria-label="Filtres des réservations">
      <label className="reservation-filter-search">Rechercher<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, e-mail, téléphone…" /></label>
      <label>Statut<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous les statuts</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Rencontre<select value={eventId} onChange={(event) => setEventId(event.target.value)}><option value="all">Toutes</option>{events.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
      <label>Date de la rencontre<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label>
      <button className="reservation-filter-reset" type="button" onClick={() => { setSearch(''); setStatus('all'); setEventId('all'); setEventDate('') }}>Effacer</button>
    </form>
    <p className="reservation-filter-count" aria-live="polite">{filtered.length} demande{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}</p>
    {filtered.length === 0 ? <section className="trust-card backoffice-empty"><h2>Aucun résultat.</h2><p>Essaie d’autres filtres ou efface la recherche.</p></section> : <div className="backoffice-list">
      {filtered.map((reservation) => (
        <article className="trust-card backoffice-reservation" key={reservation.id}>
          <div className="backoffice-reservation-heading">
            <div><p className="event-practical-label">{reservation.event.title}</p><h2>{reservation.contact_name}</h2></div>
            <span className={`backoffice-status status-${reservation.reservation_status}`}>{statusLabels[reservation.reservation_status]}</span>
          </div>
          <div className="backoffice-details">
            <p><strong>Rencontre</strong><span>{formatDate(reservation.event.starts_at)}</span></p>
            <p><strong>Inscription</strong><span>{reservation.attendance_type === 'solo' ? 'Solo' : `Groupe · ${reservation.group_size} personnes`}</span></p>
            <p><strong>Demande reçue</strong><span>{formatDate(reservation.created_at)}</span></p>
            <p><strong>Contact</strong><span><a href={`mailto:${reservation.contact_email}`}>{reservation.contact_email}</a>{reservation.contact_phone && <> · <a href={`tel:${reservation.contact_phone.replace(/[^+\d]/g, '')}`}>{reservation.contact_phone}</a></>}</span></p>
          </div>
          <div className="backoffice-ages"><strong>Années de naissance</strong>{reservation.attendee_birth_years?.length === reservation.group_size ? <ol>{reservation.attendee_birth_years.map((year, index) => <li key={`${reservation.id}-birth-year-${index}`}>Personne {index + 1} · {year}</li>)}</ol> : reservation.reservation_status === 'pending' ? <><p>Années manquantes pour cette ancienne demande. Contacte la personne, puis enregistre l’année de naissance de chaque participant.</p><form action={saveReservationBirthYears} className="backoffice-age-form"><input type="hidden" name="registrationId" value={reservation.id} />{Array.from({ length: reservation.group_size }, (_, index) => <label key={index}>Personne {index + 1}<input aria-label={`Année de naissance de la personne ${index + 1}`} name="attendeeBirthYear" type="number" min={1900} max={maximumBirthYearForEvent(reservation.event.starts_at)} step={1} required /></label>)}<button className="button-primary" type="submit">Enregistrer les années</button></form></> : <p>Années de naissance non collectées sur cette ancienne demande.</p>}</div>
          {reservation.message && <div className="backoffice-message"><strong>Mot laissé à l’équipe</strong><p>{reservation.message}</p></div>}
          <div className="backoffice-actions">
            {reservation.reservation_status === 'confirmed' && (() => {
              const message = `Bonjour ${reservation.contact_name}, ta réservation pour ${reservation.event.title} le ${formatDate(reservation.event.starts_at)} est confirmée. Le rendez-vous est à ${reservation.event.venue_area}. À très bientôt avec O’BORD !`
              const href = reservation.contact_phone ? whatsappLink(reservation.contact_phone, message) : `mailto:${encodeURIComponent(reservation.contact_email)}?subject=${encodeURIComponent('Réservation confirmée · O’BORD')}&body=${encodeURIComponent(message)}`
              return <a className="backoffice-confirmation-link" {...(reservation.contact_phone ? { target: '_blank', rel: 'noreferrer' } : {})} href={href}>Envoyer la confirmation par {reservation.contact_phone ? 'WhatsApp' : 'e-mail'}</a>
            })()}
            {reservation.reservation_status === 'pending' && reservation.attendee_birth_years?.length === reservation.group_size && <div className="backoffice-decision-actions">
              <form action={updateReservationDecision}><input type="hidden" name="registrationId" value={reservation.id} /><input type="hidden" name="decision" value="confirmed" /><button className="button-primary" type="submit">Confirmer la réservation <span aria-hidden="true">↗</span></button></form>
              <form action={updateReservationDecision}><input type="hidden" name="registrationId" value={reservation.id} /><input type="hidden" name="decision" value="declined" /><button className="backoffice-decline" type="submit">Refuser la demande</button></form>
            </div>}
          </div>
        </article>
      ))}
    </div>}
  </>
}
