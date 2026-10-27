import Link from 'next/link'
import { getUpcomingEvents } from '@/lib/data/events'
import { pageMetadata } from '@/lib/metadata'
import EventReservation from './event-reservation'

export const metadata = pageMetadata('Soirées et rencontres', 'Découvre les prochaines rencontres et réserve ta place en solo ou en groupe avec O’BORD.')

export default async function Soirees() {
  const { events: upcomingEvents, error: eventsError } = await getUpcomingEvents()

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
          <span className="soirees-art-sun">☼</span><span className="soirees-art-spark spark-one">✳</span><span className="soirees-art-spark spark-two">✦</span>
          <div className="soirees-fire"><span /><span /><span /></div>
          <p>ON SE RETROUVE<br />POUR DE VRAI</p>
        </div>
        <span className="soirees-hero-foot">JEUX · RENCONTRES · BONS SOUVENIRS</span>
      </header>
      <div className="soirees-content" id="rendez-vous">
        <div className="soirees-section-heading"><div><p className="event-practical-label">CHOISIS TON PROCHAIN MOMENT</p><h2>Les prochains rendez-vous<span>.</span></h2><p className="soirees-heading-help">Regarde les infos, choisis solo ou en groupe, puis envoie ta demande. L’équipe te recontactera pour confirmer.</p></div><span className="soirees-count">{String(upcomingEvents.length).padStart(2, '0')} DATES</span></div>

        {upcomingEvents.length ? (
          <div className="soirees-event-list">
            {upcomingEvents.map((event, index) => (
              <article key={event.id} data-reveal data-reveal-delay={index * 120} className={`soirees-event-card event-card-${index + 1}`} style={{ animationDelay: `${index * 150}ms` }}>
                <div className="soirees-event-head">
                  <div className="soirees-event-number">0{index + 1}<span> / O’BORD</span></div>
                  <h2>{event.title}</h2>
                  <div className="soirees-event-meta">
                    <span className="rounded-full bg-gray-100 px-3 py-1">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(event.date))}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">{event.time}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">{event.eventType === 'sortie' ? 'Sortie O’BORD' : 'Atelier'}</span>
                  </div>
                </div>

                <div className="soirees-event-body">
                  <p className="soirees-event-description">{event.description}</p>
                  <div className="event-practical-grid">
                    <section className="event-practical-card">
                      <span className="event-practical-icon" aria-hidden="true">⌖</span>
                      <div><p className="event-practical-label">LE LIEU DU RENDEZ-VOUS</p><h3>{event.venueArea}</h3><p>{event.venueName || 'Le point de rencontre exact sera communiqué après confirmation.'}</p></div>
                    </section>
                    {event.foodAndDrinks && <section className="event-practical-card food-card">
                      <span className="event-practical-icon" aria-hidden="true">☕</span>
                      <div><p className="event-practical-label">PETITE PAUSE CONVIVIALE</p><h3>Un moment à partager</h3><p>{event.foodAndDrinks}</p></div>
                    </section>}
                    {event.participationDetails && (
                      <section className="event-practical-card food-card">
                        <span className="event-practical-icon" aria-hidden="true">✳</span>
                      <div><p className="event-practical-label">INFOS PRATIQUES</p><h3>Participation</h3><p>{event.participationDetails}</p></div>
                      </section>
                    )}
                  </div>

                  {event.activities.length > 0 ? <>
                    <h3 className="soirees-program-title">Le fil de la soirée<span> ✳</span></h3>
                    <div className="soirees-program">
                    {event.activities.map((activity, activityIndex) => (
                      <div key={activity.id} className="soirees-program-item" style={{ animationDelay: `${activityIndex * 110}ms` }}>
                        <span className="soirees-program-pin" aria-hidden="true">{String(activityIndex + 1).padStart(2, '0')}</span>
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
                  </> : <div className="soirees-program-pending"><span aria-hidden="true">✳</span><p><strong>Programme en préparation.</strong> Les détails seront partagés par l’équipe avant la rencontre.</p></div>}
                  <Link href={`#reservation-${event.id}`} className="soirees-booking-link">Réserver ma place <span aria-hidden="true">↘</span></Link>
                </div>
                <EventReservation eventId={event.id} eventDate={event.date} eventEndsAt={event.endsAt} capacity={event.capacity} />
              </article>
            ))}
          </div>
        ) : (
          <section className="next-meetup-note">
            <span className="meetup-note-mark" aria-hidden="true">✳</span>
            <div>
              <p className="event-practical-label">ON PRÉPARE LA SUITE</p>
              <h2>{eventsError ? 'Les rencontres ne sont pas disponibles pour le moment.' : 'Aucune prochaine date annoncée.'}</h2>
              <p>{eventsError ? 'Le chargement de l’agenda a rencontré un souci. Réessaie dans un moment ou contacte l’équipe.' : 'Les informations d’une rencontre seront ajoutées ici lorsqu’elles seront confirmées.'}</p>
              <div className="meetup-note-actions"><Link href="/videos" className="meetup-video-link">Accéder à la page vidéos <span aria-hidden="true">↗</span></Link><Link href="/organisateurs" className="meetup-contact-link">Découvrir le collectif</Link></div>
            </div>
          </section>
        )}

        <section className="video-memory">
          <div className="video-memory-stamp" aria-hidden="true">✳<br />05.08.26</div>
          <div><p className="event-practical-label">RENCONTRE PASSÉE</p><h2>Le feu de camp du 5 août 2026</h2><p>Cette rencontre a eu lieu le 5 août 2026.</p></div>
          <Link href="/videos" className="button-primary group">Revivre ce moment en vidéo <span aria-hidden="true">↗</span></Link>
        </section>

        <div className="soirees-back"><Link href="/">← Un petit retour à l’accueil</Link></div>
      </div>
    </div>
  )
}
