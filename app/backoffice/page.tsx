import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pageMetadata } from '@/lib/metadata'
import { updateWaitlistStatus, markContactMessageRead } from './actions'
import EventPhotoManager from './EventPhotoManager'
import BlogPostManager from './BlogPostManager'
import EventManager, { type ManagedEventRecord } from './EventManager'
import ReservationInbox, { type ReservationInboxItem } from './ReservationInbox'
import TeamNotifications from './TeamNotifications'
import TeamIcebreaker from './TeamIcebreaker'

export const dynamic = 'force-dynamic'
export const metadata = pageMetadata('Espace équipe', 'Espace privé de gestion des réservations O’BORD.')

type Reservation = ReservationInboxItem

type ContactMessage = { id: string; name: string; email: string; subject: string | null; body: string; created_at: string; read_at: string | null }
type ReservationAudit = { id: number; registration_id: string | null; actor_id: string | null; actor_email: string | null; action: 'created' | 'status_changed' | 'details_changed'; previous_status: string | null; next_status: string | null; previous_group_size: number | null; next_group_size: number | null; created_at: string; event: { title: string } | null }

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

  const { data: contactMessagesData, error: contactMessagesError } = await supabase
    .from('contact_messages')
    .select('id,name,email,subject,body,created_at,read_at')
    .order('created_at', { ascending: false })
    .limit(100)
  const contactMessages = (contactMessagesData ?? []) as ContactMessage[]
  const { data: auditData, error: auditError } = await supabase
    .from('event_registration_audit')
    .select('id,registration_id,actor_id,actor_email,action,previous_status,next_status,previous_group_size,next_group_size,created_at,event:events(title)')
    .order('created_at', { ascending: false })
    .limit(50)
  const auditEntries = (auditData ?? []) as unknown as ReservationAudit[]

  const reservations = (data ?? []) as unknown as Reservation[]
  const activeWaitlist = (waitlistData ?? []) as unknown as WaitlistRequest[]
  const pendingCount = reservations.filter((reservation) => reservation.reservation_status === 'pending').length
  const confirmedCount = reservations.filter((reservation) => reservation.reservation_status === 'confirmed').length
  const unreadMessages = contactMessages.filter((message) => !message.read_at).length
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
    'message-invalid': 'Le message sélectionné est invalide.',
    'message-error': 'Le message n’a pas pu être marqué comme lu. Vérifie le script SQL de la boîte équipe.',
    'message-read': 'Message marqué comme lu.',
  }

  return (
    <div className="trust-page backoffice-page">
      <header className="trust-hero trust-hero-compact">
        <p className="eyebrow eyebrow-dark">ESPACE ÉQUIPE · O’BORD</p>
        <h1>Les réservations<span>.</span></h1>
        <p>Retrouve les demandes et les confirmations de chaque rencontre en un seul endroit.</p>
      </header>

      <div className="trust-content">
        <nav className="backoffice-category-nav" aria-label="Catégories du back-office">
          <a href="#overview">Vue d’ensemble</a>
          <a href="#events">Rencontres</a>
          <a href="#waitlist">Liste d’attente</a>
        <a href="#messages">Messages</a>
          <a href="#reservations">Réservations</a>
        <a href="#history">Historique</a>
          <a href="#photos">Photos</a>
          <a href="#blog">Blog</a>
        </nav>

        <section className="backoffice-category-card" id="overview" aria-labelledby="backoffice-overview-title">
          <header className="backoffice-category-heading"><p className="event-practical-label">VUE D’ENSEMBLE</p><h2 id="backoffice-overview-title">L’activité de l’équipe</h2><p>Les chiffres clés et les demandes à suivre.</p></header>
          <div className="backoffice-summary" aria-label="Résumé des réservations">
          <div className="backoffice-summary-card"><span>Demandes totales</span><strong>{reservations.length}</strong></div>
          <div className="backoffice-summary-card"><span>À traiter</span><strong>{pendingCount}</strong></div>
          <div className="backoffice-summary-card"><span>Confirmées</span><strong>{confirmedCount}</strong></div>
          <div className="backoffice-summary-card"><span>En liste d’attente</span><strong>{activeWaitlist.length}</strong></div>
          </div>
          <TeamNotifications pendingReservations={pendingCount} unreadMessages={unreadMessages} />
          <TeamIcebreaker />
        </section>

        <section className="backoffice-category-card" id="events" aria-labelledby="backoffice-events-title">
          <header className="backoffice-category-heading"><p className="event-practical-label">PROGRAMMATION</p><h2 id="backoffice-events-title">Rencontres & plans</h2><p>Crée les rencontres, suis les inscriptions et prépare les prochaines dates.</p></header>
          {eventStats.size > 0 && <section className="backoffice-event-stats" aria-labelledby="backoffice-event-stats-title">
          <div className="backoffice-section-heading"><p className="event-practical-label">ACTIVITÉ DES RENCONTRES</p><h2 id="backoffice-event-stats-title">Les chiffres, rencontre par rencontre.</h2></div>
          <div className="backoffice-event-grid">{Array.from(eventStats.entries()).map(([eventId, stats]) => <article className="backoffice-event-card" key={eventId}>
            <h3>{stats.title}</h3><p className="backoffice-event-date">{formatDate(stats.startsAt)}</p>
            <div><span>Demandes <strong>{stats.requests}</strong></span><span>À traiter <strong>{stats.pending}</strong></span><span>Confirmées <strong>{stats.confirmed}</strong></span>{stats.capacity !== null && <span>Places prises <strong>{Math.min(stats.capacity, stats.booked + stats.externalReserved)} / {stats.capacity}</strong></span>}</div>
          </article>)}</div>
        </section>}
        <EventManager events={managedEvents} setupMissing={Boolean(managedEventsError)} />
        </section>

        <section className="backoffice-category-card" id="waitlist" aria-labelledby="backoffice-waitlist-title">
          <section className="backoffice-waitlist" aria-labelledby="backoffice-waitlist-title">
          <header><p className="event-practical-label">PLACES LIBÉRÉES</p><h2 id="backoffice-waitlist-title">Liste d’attente</h2><p>Contacte les personnes dans l’ordre d’arrivée quand une place devient disponible.</p></header>
          {waitlistError ? <p className="backoffice-feedback" role="status">La liste d’attente n’est pas encore configurée. Applique <code>supabase/obord_event_management_waitlist.sql</code>.</p> : (waitlistData as unknown as WaitlistRequest[] | null)?.length ? <div className="backoffice-waitlist-list">{(waitlistData as unknown as WaitlistRequest[]).map((request) => {
            const whatsappMessage = `Bonjour ${request.contact_name}, une place vient de se libérer pour ${request.event.title} le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(request.event.starts_at))}. Réponds-nous pour confirmer si tu souhaites toujours venir.`
            const digits = request.contact_phone?.replace(/\D/g, '')
            const international = digits ? digits.startsWith('225') ? digits : digits.startsWith('0') ? `225${digits.slice(1)}` : `225${digits}` : ''
            const contactUrl = request.contact_phone && international ? `https://wa.me/${international}?text=${encodeURIComponent(whatsappMessage)}` : `mailto:${encodeURIComponent(request.contact_email)}?subject=${encodeURIComponent('Une place se libère · O’BORD')}&body=${encodeURIComponent(whatsappMessage)}`
            return <article className="backoffice-waitlist-item" key={request.id}>
              <div><span className="backoffice-status">{request.status === 'waiting' ? 'En attente' : 'Contactée'}</span><h3>{request.contact_name} · {request.group_size} personne{request.group_size > 1 ? 's' : ''}</h3><p>{request.event.title} · {formatDate(request.event.starts_at)}</p><p>{request.contact_email}{request.contact_phone ? ` · ${request.contact_phone}` : ''}</p><small>Demande reçue le {formatDate(request.created_at)}</small></div>
              <div className="backoffice-waitlist-actions"><a href={contactUrl} {...(request.contact_phone ? { target: '_blank', rel: 'noreferrer' } : {})}>Contacter par {request.contact_phone ? 'WhatsApp' : 'e-mail'}</a>{request.status === 'waiting' && <form action={updateWaitlistStatus}><input type="hidden" name="waitlistId" value={request.id} /><button type="submit">Marquer contactée</button></form>}</div>
            </article>
          })}</div> : <p className="backoffice-empty-copy">Aucune demande sur liste d’attente pour l’instant.</p>}
        </section>

        </section>

        <section className="backoffice-category-card" id="messages" aria-labelledby="backoffice-messages-title">
          <header className="backoffice-category-heading"><p className="event-practical-label">BOÎTE DE L’ÉQUIPE</p><h2 id="backoffice-messages-title">Messages reçus <span className="backoffice-category-count">{unreadMessages} non lus</span></h2><p>Les messages envoyés depuis la page Contact arrivent ici.</p></header>
          {contactMessagesError ? <p className="backoffice-feedback" role="status">La boîte de messages n’est pas configurée. Applique <code>supabase/obord_team_inbox_audit.sql</code>.</p> : contactMessages.length ? <div className="team-message-list">{contactMessages.map((message) => <article className={`team-message-card${message.read_at ? '' : ' is-unread'}`} key={message.id}>
            <div className="team-message-heading"><div><span className="team-message-status">{message.read_at ? 'Lu' : 'Nouveau'}</span><h3>{message.subject || 'Message sans sujet'}</h3></div><time dateTime={message.created_at}>{formatDate(message.created_at)}</time></div>
            <p className="team-message-sender">{message.name} · <a href={`mailto:${message.email}`}>{message.email}</a></p><p className="team-message-body">{message.body}</p>
            {!message.read_at && <form action={markContactMessageRead}><input type="hidden" name="messageId" value={message.id} /><button type="submit" className="team-message-read-button">Marquer comme lu</button></form>}
          </article>)}</div> : <p className="backoffice-empty-copy">Aucun message reçu pour le moment.</p>}
        </section>

        <section className="backoffice-category-card" id="reservations" aria-labelledby="backoffice-reservations-title">
        <header className="backoffice-category-heading"><p className="event-practical-label">BOÎTE DE RÉCEPTION</p><h2 id="backoffice-reservations-title">Demandes de réservation <span className="backoffice-category-count">{reservations.length}</span></h2><p>Vérifie les informations, puis confirme ou refuse chaque demande.</p></header>
        {result && resultMessages[result] && <p className="backoffice-feedback" role="status">{resultMessages[result]}</p>}
        {error ? (
          <section className="trust-card"><h2>Les demandes ne sont pas accessibles.</h2><p>Vérifie que le script SQL du back-office a été exécuté dans Supabase et que le rôle organisateur est actif sur ce compte.</p></section>
        ) : reservations.length === 0 ? (
          <section className="trust-card backoffice-empty"><h2>Aucune réservation pour le moment.</h2><p>Les demandes envoyées depuis la page des rencontres apparaîtront ici.</p></section>
        ) : <ReservationInbox reservations={reservations} />}
        </section>

        <section className="backoffice-category-card" id="history" aria-labelledby="backoffice-history-title">
          <header className="backoffice-category-heading"><p className="event-practical-label">TRACE DES ACTIONS</p><h2 id="backoffice-history-title">Historique des réservations</h2><p>Les décisions et changements sont associés au compte qui les a effectués.</p></header>
          {auditError ? <p className="backoffice-feedback" role="status">L’historique n’est pas encore configuré. Applique <code>supabase/obord_team_inbox_audit.sql</code>.</p> : auditEntries.length ? <ol className="team-audit-list">{auditEntries.map((entry) => <li key={entry.id}>
            <span className="team-audit-mark" aria-hidden="true">✳</span><div><strong>{entry.action === 'created' ? 'Demande reçue' : entry.action === 'status_changed' ? `Statut : ${entry.previous_status ?? '—'} → ${entry.next_status ?? '—'}` : 'Inscription modifiée'}</strong><p>{entry.event?.title ?? 'Rencontre'} · {entry.actor_email ?? 'Compte supprimé'} · {formatDate(entry.created_at)}</p></div>
          </li>)}</ol> : <p className="backoffice-empty-copy">Les prochains changements apparaîtront ici après l’installation du journal.</p>}
        </section>

        <section className="backoffice-category-card" id="photos" aria-labelledby="backoffice-photos-title">
          <header className="backoffice-category-heading"><p className="event-practical-label">SOUVENIRS</p><h2 id="backoffice-photos-title">Photos des rencontres</h2><p>Ajoute ou retire les images associées aux plans publiés. Partage uniquement des photos que le collectif est autorisé à diffuser et vérifie l’accord des personnes reconnaissables.</p></header>
          <EventPhotoManager initialEvents={photoEvents} setupMissing={photoManagerSetupMissing} />
        </section>

        <section className="backoffice-category-card" id="blog" aria-labelledby="backoffice-blog-title">
          <header className="backoffice-category-heading"><p className="event-practical-label">LE JOURNAL</p><h2 id="backoffice-blog-title">Articles du collectif</h2><p>Rédige et gère les contenus du blog O’BORD.</p></header>
          <BlogPostManager initialPosts={blogPosts} setupMissing={Boolean(blogPostsError)} />
        </section>
      </div>
    </div>
  )
}
