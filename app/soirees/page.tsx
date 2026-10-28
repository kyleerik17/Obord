import Link from 'next/link'
import { getUpcomingEvents } from '@/lib/data/events'
import { pageMetadata } from '@/lib/metadata'
import EventReservation from './event-reservation'

export const metadata = pageMetadata('Soirées et rencontres', 'Découvre les prochaines rencontres et réserve ta place en solo ou en groupe avec O’BORD.')

export default async function Soirees({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: selectedPlanId } = await searchParams
  const { events: upcomingEvents, error: eventsError } = await getUpcomingEvents()
  const selectedPlan = upcomingEvents.find((event) => event.id === selectedPlanId)
  const displayedEvents = selectedPlan ? [selectedPlan] : upcomingEvents

  return (
    <div className="soirees-page">
      <header className="soirees-hero" data-reveal>
        <div className="soirees-hero-glow" aria-hidden="true" />
        <div className="soirees-hero-copy">
          <h1>Les soirées<br /><span>O’BORD.</span></h1>
          <p>Choisis une rencontre, réserve ta place et viens comme tu es. En solo ou avec ta bande, l’équipe t’accueille pour jouer, discuter et faire connaissance à ton rythme.</p>
          <a href="#rendez-vous" className="soirees-hero-cta">Voir les prochaines dates <span aria-hidden="true">↓</span></a>
        </div>
        <div className="soirees-hero-art" aria-hidden="true">
          <span className="soirees-orbit soirees-orbit-one" /><span className="soirees-orbit soirees-orbit-two" />
          <div className="soirees-fire"><span /><span /><span /></div>
          <p>ON SE RETROUVE<br />POUR DE VRAI</p>
        </div>
        <span className="soirees-hero-foot">JEUX · RENCONTRES · BONS SOUVENIRS</span>
      </header>
      <div className="soirees-content" id="rendez-vous">
        {selectedPlan ? <div className="soirees-selected-heading"><Link href="/soirees#rendez-vous" className="soirees-back-to-plans">← Toutes les rencontres</Link><p className="event-practical-label">LE PLAN QUE TU AS CHOISI</p></div> : null}
        <div className="soirees-section-heading"><div><p className="event-practical-label">{selectedPlan ? 'TON PROCHAIN MOMENT' : 'CHOISIS TON PROCHAIN MOMENT'}</p><h2>{selectedPlan ? selectedPlan.title : <>Les prochains rendez-vous<span>.</span></>}</h2><p className="soirees-heading-help">{selectedPlan ? 'Voici les détails de cette rencontre et les options pour réserver ta place.' : 'Regarde les infos, choisis un plan pour en voir le détail, puis réserve en solo ou en groupe.'}</p></div><span className="soirees-count">{selectedPlan ? '01 PLAN' : `${String(upcomingEvents.length).padStart(2, '0')} DATES`}</span></div>

        {displayedEvents.length ? (
          <div className="soirees-event-list">
            {displayedEvents.map((event, index) => (
              <article key={event.id} data-reveal data-reveal-delay={index * 120} className={`soirees-event-card event-card-${index + 1}`} style={{ animationDelay: `${index * 150}ms` }}>
                <div className="soirees-event-head">
                  <div className="soirees-event-number">0{index + 1}<span> / O’BORD</span></div>
                  <h2>{selectedPlan ? event.title : <Link href={`/soirees?plan=${encodeURIComponent(event.id)}`} aria-label={`Afficher uniquement le plan ${event.title}`}>{event.title}</Link>}</h2>
                  <div className="soirees-event-meta">
                    <span className="rounded-full bg-gray-100 px-3 py-1">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(event.date))}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">{event.time}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">{event.eventType === 'sortie' ? 'Sortie O’BORD' : 'Atelier'}</span>
                  </div>
                </div>

                <div className="soirees-event-body">
                  {event.imageUrls.length > 0 && <div className="event-photo-gallery" aria-label={`Photos de ${event.title}`}>{event.imageUrls.map((url, imageIndex) => <figure key={url}><img src={url} alt={`${event.title} — photo ${imageIndex + 1}`} loading="lazy" /></figure>)}</div>}
                  <p className="soirees-event-description">{event.description}</p>
                  {event.capacity !== null && <div className="event-availability" aria-live="polite"><div><p className="event-practical-label">LES PLACES</p>{event.remainingSeats === null ? <strong>Jusqu’à {event.capacity} personnes</strong> : event.remainingSeats === 0 ? <strong>Rencontre complète</strong> : <strong>{event.remainingSeats} place{event.remainingSeats > 1 ? 's' : ''} restante{event.remainingSeats > 1 ? 's' : ''}</strong>}{event.reservedCount !== null && <p>{event.reservedCount} / {event.capacity} places prises</p>}</div></div>}
                  <div className="event-practical-grid">
                    <section className="event-practical-card">
                      <div><p className="event-practical-label">LE LIEU DU RENDEZ-VOUS</p><h3>{event.venueArea}</h3><p>{event.venueName || 'Le point de rencontre exact sera communiqué après confirmation.'}</p></div>
                    </section>
                    {event.foodAndDrinks && <section className="event-practical-card food-card">
                      <div><p className="event-practical-label">PETITE PAUSE CONVIVIALE</p><h3>Un moment à partager</h3><p>{event.foodAndDrinks}</p></div>
                    </section>}
                    {(event.participationDetails || event.title.toLocaleLowerCase('fr').startsWith('plan chill')) && (
                      <section className="event-practical-card food-card">
                      <div><p className="event-practical-label">PARTICIPATION</p><h3>{event.title.toLocaleLowerCase('fr').startsWith('plan chill') ? '3 000 FCFA par personne' : 'Participation'}</h3><p>{event.title.toLocaleLowerCase('fr').startsWith('plan chill') ? 'À régler pour prendre part au plan.' : event.participationDetails}</p></div>
                      </section>
                    )}
                  </div>

                  {event.activities.length > 0 ? <>
                    <h3 className="soirees-program-title">Le fil de la soirée</h3>
                    <div className="soirees-program">
                    {event.activities.map((activity, activityIndex) => (
                      <div key={activity.id} className="soirees-program-item" style={{ animationDelay: `${activityIndex * 110}ms` }}>
                        <div className="soirees-program-copy">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <h4>{activity.title}</h4>
                          <span>{activity.time}</span>
                        </div>
                        <p>{activity.description}</p>
                        </div>
                      </div>
                    ))}
                    </div>
                  </> : <div className="soirees-program-pending"><p><strong>Programme en préparation.</strong> Les détails seront partagés par l’équipe avant la rencontre.</p></div>}
                  <Link href={selectedPlan ? `#reservation-${event.id}` : `/soirees?plan=${encodeURIComponent(event.id)}#reservation-${event.id}`} className="soirees-booking-link">Réserver ma place <span aria-hidden="true">↘</span></Link>
                </div>
                <EventReservation eventId={event.id} />
              </article>
            ))}
          </div>
        ) : selectedPlanId ? (
          <section className="next-meetup-note"><div><p className="event-practical-label">PLAN INDISPONIBLE</p><h2>Cette rencontre n’est plus proposée.</h2><p>Elle a peut-être déjà eu lieu ou les réservations sont closes. Consulte les prochaines dates.</p><Link className="meetup-contact-link" href="/soirees#rendez-vous">Voir les prochaines rencontres</Link></div></section>
        ) : upcomingEvents.length ? null : (
          <section className="next-meetup-note">
            <div>
              <p className="event-practical-label">ON PRÉPARE LA SUITE</p>
              <h2>{eventsError ? 'Les rencontres ne sont pas disponibles pour le moment.' : 'Aucune prochaine date annoncée.'}</h2>
              <p>{eventsError ? 'Le chargement de l’agenda a rencontré un souci. Réessaie dans un moment ou contacte l’équipe.' : 'Les informations d’une rencontre seront ajoutées ici lorsqu’elles seront confirmées.'}</p>
              <div className="meetup-note-actions"><Link href="/videos" className="meetup-video-link">Accéder à la page vidéos <span aria-hidden="true">↗</span></Link><Link href="/organisateurs" className="meetup-contact-link">Découvrir le collectif</Link></div>
            </div>
          </section>
        )}

        <section className="video-memory">
          <div><p className="event-practical-label">RENCONTRE PASSÉE</p><h2>Le feu de camp du 5 août 2026</h2><p>Cette rencontre a eu lieu le 5 août 2026.</p></div>
          <Link href="/videos" className="button-primary group">Revivre ce moment en vidéo <span aria-hidden="true">↗</span></Link>
        </section>

        <div className="soirees-back"><Link href="/">← Un petit retour à l’accueil</Link></div>
      </div>
    </div>
  )
}
