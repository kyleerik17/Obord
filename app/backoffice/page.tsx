import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pageMetadata } from '@/lib/metadata'
import { saveReservationBirthYears, updateReservationDecision } from './actions'
import EventPhotoManager from './EventPhotoManager'
import BlogPostManager from './BlogPostManager'

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
  event: { title: string; starts_at: string }
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
    .select('id,event_id,attendance_type,contact_name,contact_email,contact_phone,group_size,attendee_birth_years,reservation_status,message,created_at,event:events!inner(title,starts_at)')
    .order('created_at', { ascending: false })

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
  const pendingCount = reservations.filter((reservation) => reservation.reservation_status === 'pending').length
  const confirmedCount = reservations.filter((reservation) => reservation.reservation_status === 'confirmed').length
  const eventStats = new Map<string, { title: string; startsAt: string; requests: number; pending: number; confirmed: number }>()
  for (const reservation of reservations) {
    const stats = eventStats.get(reservation.event_id) ?? {
      title: reservation.event.title,
      startsAt: reservation.event.starts_at,
      requests: 0,
      pending: 0,
      confirmed: 0,
    }
    stats.requests += 1
    if (reservation.reservation_status === 'pending') stats.pending += 1
    if (reservation.reservation_status === 'confirmed') stats.confirmed += 1
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
        </div>

        {eventStats.size > 0 && <section className="backoffice-event-stats" aria-labelledby="backoffice-event-stats-title">
          <div className="backoffice-section-heading"><p className="event-practical-label">ACTIVITÉ DES RENCONTRES</p><h2 id="backoffice-event-stats-title">Les chiffres, rencontre par rencontre.</h2></div>
          <div className="backoffice-event-grid">{Array.from(eventStats.entries()).map(([eventId, stats]) => <article className="backoffice-event-card" key={eventId}>
            <h3>{stats.title}</h3><p className="backoffice-event-date">{formatDate(stats.startsAt)}</p>
            <div><span>Demandes <strong>{stats.requests}</strong></span><span>À traiter <strong>{stats.pending}</strong></span><span>Confirmées <strong>{stats.confirmed}</strong></span></div>
          </article>)}</div>
        </section>}

        <EventPhotoManager initialEvents={photoEvents} setupMissing={photoManagerSetupMissing} />
        <BlogPostManager initialPosts={blogPosts} setupMissing={Boolean(blogPostsError)} />

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
                <div className="backoffice-ages"><strong>Années de naissance</strong>{reservation.attendee_birth_years?.length === reservation.group_size ? <ol>{reservation.attendee_birth_years.map((year, index) => <li key={`${reservation.id}-birth-year-${index}`}>Personne {index + 1} · {year}</li>)}</ol> : reservation.reservation_status === 'pending' ? <><p>Années manquantes pour cette ancienne demande. Contacte la personne, puis enregistre l’année de naissance de chaque participant.</p><form action={saveReservationBirthYears} className="backoffice-age-form"><input type="hidden" name="registrationId" value={reservation.id} />{Array.from({ length: reservation.group_size }, (_, index) => <label key={index}>Personne {index + 1}<input aria-label={`Année de naissance de la personne ${index + 1}`} name="attendeeBirthYear" type="number" min={1900} max={new Date().getFullYear() - 21} step={1} required /></label>)}<button className="button-primary" type="submit">Enregistrer les années</button></form></> : <p>Années de naissance non collectées sur cette ancienne demande.</p>}</div>
                {reservation.message && <div className="backoffice-message"><strong>Mot laissé à l’équipe</strong><p>{reservation.message}</p></div>}
                <div className="backoffice-actions">
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
