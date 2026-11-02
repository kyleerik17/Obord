import { saveEvent } from './actions'

export type ManagedEventRecord = {
  id: string
  title: string
  event_type: 'sortie' | 'atelier'
  starts_at: string
  ends_at: string | null
  description: string
  venue_area: string
  venue_name: string | null
  participation_details: string | null
  capacity: number | null
  external_reserved_count: number
  external_registration_url: string | null
  status: 'draft' | 'published' | 'cancelled' | 'completed'
}

function inputDate(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

function inputTime(value: string | null) {
  return value ? value.slice(11, 16) : ''
}

function EventFields({ event }: { event?: ManagedEventRecord }) {
  return <>
    {event && <input type="hidden" name="eventId" value={event.id} />}
    <div className="event-admin-fields">
      <label>Titre de la rencontre<input name="title" required minLength={3} maxLength={120} defaultValue={event?.title} /></label>
      <label>Format<select name="eventType" defaultValue={event?.event_type ?? 'sortie'}><option value="sortie">Sortie</option><option value="atelier">Atelier</option></select></label>
      <label>Date<input name="startDate" type="date" required defaultValue={inputDate(event?.starts_at ?? null)} /></label>
      <label>Heure de début<input name="startTime" type="time" required defaultValue={inputTime(event?.starts_at ?? null)} /></label>
      <label>Date de fin (facultative)<input name="endDate" type="date" defaultValue={inputDate(event?.ends_at ?? null)} /></label>
      <label>Heure de fin (facultative)<input name="endTime" type="time" defaultValue={inputTime(event?.ends_at ?? null)} /></label>
      <label>Quartier / secteur<input name="venueArea" required maxLength={120} defaultValue={event?.venue_area ?? 'Quartier France, Grand-Bassam'} /></label>
      <label>Lieu précis (facultatif)<input name="venueName" maxLength={200} defaultValue={event?.venue_name ?? 'Bamboo Blanc'} /></label>
      <label>Capacité (facultative)<input name="capacity" type="number" min={1} max={10000} defaultValue={event?.capacity ?? ''} /></label>
      <label>Places déjà prises sur Tikko / ailleurs<input name="externalReservedCount" type="number" min={0} max={10000} defaultValue={event?.external_reserved_count ?? 0} /><small>À mettre à jour manuellement tant qu’aucune synchronisation Tikko n’est disponible.</small></label>
      <label>Lien d’inscription Tikko (facultatif)<input name="externalRegistrationUrl" type="url" maxLength={500} defaultValue={event?.external_registration_url ?? ''} placeholder="https://tikko.ci/register/…" /><small>Colle le lien de billetterie correspondant à cette rencontre. Il sera ouvert depuis sa fiche.</small></label>
      <label>Participation (facultatif)<input name="participationDetails" maxLength={500} defaultValue={event?.participation_details ?? ''} placeholder="Ex. 3 000 FCFA par personne" /></label>
      <label>Visibilité<select name="status" defaultValue={event?.status ?? 'draft'}><option value="draft">Brouillon</option><option value="published">Publié</option><option value="cancelled">Annulé</option><option value="completed">Terminé</option></select></label>
      <label className="event-admin-description">Description<textarea name="description" required minLength={1} maxLength={3000} rows={4} defaultValue={event?.description} /></label>
    </div>
    <button className="button-primary" type="submit">{event ? 'Enregistrer les changements' : 'Créer la rencontre'}</button>
  </>
}

export default function EventManager({ events, setupMissing = false }: { events: ManagedEventRecord[]; setupMissing?: boolean }) {
  return <section className="event-admin-manager" aria-labelledby="event-admin-title">
    <header><p className="event-practical-label">AGENDA</p><h2 id="event-admin-title">Gérer les rencontres</h2><p>Crée une date, ajuste ses informations et choisis quand elle apparaît dans l’agenda public.</p></header>
    {setupMissing ? <p className="backoffice-feedback" role="status">La gestion des rencontres n’est pas configurée. Applique <code>supabase/obord_event_management_waitlist.sql</code> dans Supabase.</p> : <>
      <details className="event-admin-create"><summary>Ajouter une rencontre</summary><form action={saveEvent}><EventFields /></form></details>
      <div className="event-admin-list">{events.length ? events.map((event) => <details className="event-admin-item" key={event.id}>
        <summary><span><strong>{event.title}</strong><small>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(event.starts_at))}</small></span><span className={`event-admin-status event-admin-status-${event.status}`}>{event.status === 'published' ? 'Publié' : event.status === 'draft' ? 'Brouillon' : event.status === 'cancelled' ? 'Annulé' : 'Terminé'}</span></summary>
        <form action={saveEvent}><EventFields event={event} /></form>
      </details>) : <p className="backoffice-empty-copy">Aucune rencontre enregistrée. Tu peux créer la première date ci-dessus.</p>}</div>
    </>}
  </section>
}
