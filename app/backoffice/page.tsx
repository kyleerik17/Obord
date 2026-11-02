import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pageMetadata } from '@/lib/metadata'
import { saveReservationBirthYears, updateReservationDecision, updateWaitlistStatus } from './actions'
import EventPhotoManager from './EventPhotoManager'
import BlogPostManager from './BlogPostManager'
import EventManager, { type ManagedEventRecord } from './EventManager'
import { maximumBirthYearForEvent } from '@/lib/age'

export const dynamic = 'force-dynamic'
export const metadata = pageMetadata('Espace équipe', 'Espace privé de gestion des réservations O’BORD.')

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
  message: string | null
  created_at: string
  event: { title: string; starts_at: string; venue_area: string }
}

type WaitlistRequest = {
  id: string
  event_id: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  group_size: number
  status: 'waiting' | 'contacted'
  created_at: string
  event: { title: string; starts_at: string; venue_area: string }
}

const reservationStatusLabels: Record<Reservation['reservation_status'], string> = {
  pending: 'En attente',
  confirmed: 'Réservation confirmée',
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

function whatsappLink(phone: string | null, message: string) {
  const digits = phone?.replace(/\D/g, '')
  const international = digits ? digits.startsWith('225') ? digits : digits.startsWith('0') ? `225${digits.slice(1)}` : `225${digits}` : '2250768963019'
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`
}

export default async function BackofficePage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { result } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=%2Fbackoffice')

  if (user.app_metadata?.role !== 'organizer') {
    return (
      <div className="trust-page">
        <header className="trust-hero trust-hero-compact"><p className="eyebrow eyebrow-dark">ESPACE ÉQUIPE</p><h1>Accès réservé.</h1><p>Connecte-toi avec un compte organisateur O’BORD pour consulter les réservations.</p></header>
        <div className="trust-content"><section className="trust-card"><p>Ce compte n’a pas le rôle organisateur. Si tu fais partie de l’équipe, demande à l’administrateur du projet Supabase de l’activer dans les App Metadata.</p><Link className="button-primary" href="/">Retour à l’accueil <span aria-hidden="true">↗</span></Link></section></div>
      </div>
    )
  }

  const { data, error } = await supabase
    .from('event_registrations')
    .select('id,event_id,attendance_type,contact_name,contact_email,contact_phone,group_size,attendee_birth_years,reservation_status,message,created_at,event:events!inner(title,starts_at,venue_area)')
    .order('created_at', { ascending: false })

  const { data: managedEventsData, error: managedEventsError } = await supabase
    .from('events')
    .select('id,title,event_type,starts_at,ends_at,description,venue_area,venue_name,participation_details,capacity,external_reserved_count,external_registration_url,status')
    .order('starts_at', { ascending: true })
  const managedEvents = (managedEventsData ?? []) as ManagedEventRecord[]

  const { data: waitlistData, error: waitlistError } = await supabase
    .from('event_waitlist')
    .select('id,event_id,contact_name,contact_email,contact_phone,group_size,status,created_at,event:events!inner(title,starts_at,venue_area)')
    .in('status', ['waiting', 'contacted'])
    .order('created_at', { ascending: true })

  const { data: photoEventsData, error: photoEventsError } = await supabase
    .from('events')
    .select('id,title,starts_at,image_paths')
    .eq('status', 'published')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  const photoEvents = (photoEventsData ?? []) as unknown as Array<{ id: string; title: string; starts_at: string; image_paths: string[] }>
  const photoManagerSetupMissing = Boolean(photoEventsError)

  const { data: blogPostsData, error: blogPostsError } = await supabase
    .from('blog_posts')
    .select('id,slug,title,status,cover_image_path,published_at')
    .order('created_at', { ascending: false })
  const blogPosts = (blogPostsData ?? []) as Array<{ id: string; slug: string; title: string; status: 'draft' | 'published'; cover_image_path: string | null; published_at: string | null }>

  const reservations = (data ?? []) as unknown as Reservation[]
  const activeWaitlist = (waitlistData ?? []) as unknown as WaitlistRequest[]
  const pendingCount = reservations.filter((reservation) => reservation.reservation_status === 'pending').length
  const confirmedCount = reservations.filter((reservation) => reservation.reservation_status === 'confirmed').length
  const eventStats = new Map<string, { title: string; startsAt: string; requests: number; pending: number; confirmed: number; booked: number; capacity: number | null; externalReserved: number }>()
  for (const event of managedEvents) {
    eventStats.set(event.id, {
      title: event.title, startsAt: event.starts_at, requests: 0, pending: 0, confirmed: 0,
      booked: 0, capacity: event.capacity, externalReserved: event.external_reserved_count,
    })
  }
  for (const reservation of reservations) {
    const stats = eventStats.get(reservation.event_id) ?? {
      title: reservation.event.title,
      startsAt: reservation.event.starts_at,
      requests: 0,
      pending: 0,
      confirmed: 0,
      booked: 0,
      capacity: null,
      externalReserved: 0,
    }
    stats.requests += 1
    if (reservation.reservation_status === 'pending') stats.pending += 1
    if (reservation.reservation_status === 'confirmed') stats.confirmed += 1
    if (reservation.reservation_status === 'pending' || reservation.reservation_status === 'confirmed') stats.booked += reservation.group_size
    eventStats.set(reservation.event_id, stats)
  }

  const resultMessages: Record<string, string> = {
    confirmed: 'Réservation confirmée. La personne peut maintenant consulter les informations pratiques de la rencontre.',
    declined: 'Demande refusée.',
    stale: 'Cette demande a déjà été traitée ou n’existe plus. La liste a été actualisée.',
    invalid: 'La demande envoyée est invalide. Réessaie depuis sa fiche.',
    error: 'La mise à jour a échoué. Vérifie que le script SQL du back-office a été appliqué, puis réessaie.',
    forbidden: 'Cette action nécessite un compte organisateur.',
    'birth-years-saved': 'Les années de naissance ont été enregistrées. Tu peux maintenant traiter la demande.',
    'invalid-birth-years': 'Indique une année valide pour chaque personne, correspondant à 21 ans minimum à la date de la rencontre.',
    'birth-year-save-error': 'Les années de naissance n’ont pas pu être enregistrées. Vérifie que les scripts SQL ont été appliqués.',
    'age-stale': 'Cette demande a changé depuis son affichage. Actualise la page et réessaie.',
    'event-invalid': 'Vérifie les champs, les dates et la capacité de la rencontre.',
    'event-save-error': 'La rencontre n’a pas été enregistrée. Applique le script SQL de gestion des plans, puis réessaie.',
    'event-stale': 'Cette rencontre n’existe plus ou a été modifiée. Actualise la page.',
    'event-created': 'La rencontre a été créée.',
    'event-saved': 'Les informations de la rencontre ont été mises à jour.',
    'waitlist-invalid': 'La demande de liste d’attente est invalide.',
    'waitlist-error': 'Le statut de la demande n’a pas pu être enregistré. Vérifie la configuration Supabase.',
    'waitlist-stale': 'Cette demande a déjà été traitée ou retirée.',
    'waitlist-contacted': 'La demande est marquée comme contactée.',
  }

  return (
    <div className="trust-page backoffice-page">
      <header className="trust-hero trust-hero-compact">
        <p className="eyebrow eyebrow-dark">ESPACE ÉQUIPE · O’BORD</p>
        <h1>Les réservations<span>.</span></h1>
        <p>Retrouve les demandes et les confirmations de chaque rencontre en un seul endroit.</p>
      </header>

      <div className="trust-content">
        <div className="backoffice-summary" aria-label="Résumé des réservations">
          <div className="backoffice-summary-card"><span>Demandes totales</span><strong>{reservations.length}</strong></div>
          <div className="backoffice-summary-card"><span>À traiter</span><strong>{pendingCount}</strong></div>
          <div className="backoffice-summary-card"><span>Confirmées</span><strong>{confirmedCount}</strong></div>
          <div className="backoffice-summary-card"><span>En liste d’attente</span><strong>{activeWaitlist.length}</strong></div>
        </div>

        {eventStats.size > 0 && <section className="backoffice-event-stats" aria-labelledby="backoffice-event-stats-title">
          <div className="backoffice-section-heading"><p className="event-practical-label">ACTIVITÉ DES RENCONTRES</p><h2 id="backoffice-event-stats-title">Les chiffres, rencontre par rencontre.</h2></div>
          <div className="backoffice-event-grid">{Array.from(eventStats.entries()).map(([eventId, stats]) => <article className="backoffice-event-card" key={eventId}>
            <h3>{stats.title}</h3><p className="backoffice-event-date">{formatDate(stats.startsAt)}</p>
            <div><span>Demandes <strong>{stats.requests}</strong></span><span>À traiter <strong>{stats.pending}</strong></span><span>Confirmées <strong>{stats.confirmed}</strong></span>{stats.capacity !== null && <span>Places prises <strong>{Math.min(stats.capacity, stats.booked + stats.externalReserved)} / {stats.capacity}</strong></span>}</div>
          </article>)}</div>
        </section>}

        <EventManager events={managedEvents} setupMissing={Boolean(managedEventsError)} />
        <EventPhotoManager initialEvents={photoEvents} setupMissing={photoManagerSetupMissing} />
        <BlogPostManager initialPosts={blogPosts} setupMissing={Boolean(blogPostsError)} />

        <section className="backoffice-waitlist" aria-labelledby="backoffice-waitlist-title">
          <header><p className="event-practical-label">PLACES LIBÉRÉES</p><h2 id="backoffice-waitlist-title">Liste d’attente</h2><p>Contacte les personnes dans l’ordre d’arrivée quand une place devient disponible.</p></header>
          {waitlistError ? <p className="backoffice-feedback" role="status">La liste d’attente n’est pas encore configurée. Applique <code>supabase/obord_event_management_waitlist.sql</code>.</p> : (waitlistData as unknown as WaitlistRequest[] | null)?.length ? <div className="backoffice-waitlist-list">{(waitlistData as unknown as WaitlistRequest[]).map((request) => {
            const whatsappMessage = `Bonjour ${request.contact_name}, une place vient de se libérer pour ${request.event.title} le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(request.event.starts_at))}. Réponds-nous pour confirmer si tu souhaites toujours venir.`
            const contactUrl = request.contact_phone ? whatsappLink(request.contact_phone, whatsappMessage) : `mailto:${encodeURIComponent(request.contact_email)}?subject=${encodeURIComponent('Une place se libère · O’BORD')}&body=${encodeURIComponent(whatsappMessage)}`
            return <article className="backoffice-waitlist-item" key={request.id}>
              <div><span className="backoffice-status">{request.status === 'waiting' ? 'En attente' : 'Contactée'}</span><h3>{request.contact_name} · {request.group_size} personne{request.group_size > 1 ? 's' : ''}</h3><p>{request.event.title} · {formatDate(request.event.starts_at)}</p><p>{request.contact_email}{request.contact_phone ? ` · ${request.contact_phone}` : ''}</p><small>Demande reçue le {formatDate(request.created_at)}</small></div>
              <div className="backoffice-waitlist-actions"><a href={contactUrl} {...(request.contact_phone ? { target: '_blank', rel: 'noreferrer' } : {})}>Contacter par {request.contact_phone ? 'WhatsApp' : 'e-mail'}</a>{request.status === 'waiting' && <form action={updateWaitlistStatus}><input type="hidden" name="waitlistId" value={request.id} /><button type="submit">Marquer contactée</button></form>}</div>
            </article>
          })}</div> : <p className="backoffice-empty-copy">Aucune demande sur liste d’attente pour l’instant.</p>}
        </section>

        {result && resultMessages[result] && <p className="backoffice-feedback" role="status">{resultMessages[result]}</p>}
        {error ? (
          <section className="trust-card"><h2>Les demandes ne sont pas accessibles.</h2><p>Vérifie que le script SQL du back-office a été exécuté dans Supabase et que le rôle organisateur est actif sur ce compte.</p></section>
        ) : reservations.length === 0 ? (
          <section className="trust-card backoffice-empty"><h2>Aucune réservation pour le moment.</h2><p>Les demandes envoyées depuis la page des rencontres apparaîtront ici.</p></section>
        ) : (
          <div className="backoffice-list">
            {reservations.map((reservation) => (
              <article className="trust-card backoffice-reservation" key={reservation.id}>
                <div className="backoffice-reservation-heading">
                  <div><p className="event-practical-label">{reservation.event.title}</p><h2>{reservation.contact_name}</h2></div>
                  <span className={`backoffice-status status-${reservation.reservation_status}`}>{reservationStatusLabels[reservation.reservation_status]}</span>
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
                  {reservation.reservation_status === 'pending' && reservation.attendee_birth_years?.length === reservation.group_size && (
                    <div className="backoffice-decision-actions">
                      <form action={updateReservationDecision}><input type="hidden" name="registrationId" value={reservation.id} /><input type="hidden" name="decision" value="confirmed" /><button className="button-primary" type="submit">Confirmer la réservation <span aria-hidden="true">↗</span></button></form>
                      <form action={updateReservationDecision}><input type="hidden" name="registrationId" value={reservation.id} /><input type="hidden" name="decision" value="declined" /><button className="backoffice-decline" type="submit">Refuser la demande</button></form>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
