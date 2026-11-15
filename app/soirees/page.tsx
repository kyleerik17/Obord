import Link from 'next/link'
import Image from 'next/image'
import { getUpcomingEvents } from '@/lib/data/events'
import { pageMetadata } from '@/lib/metadata'
import EventReservation from './event-reservation'
import ShareEventButton from './ShareEventButton'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export const metadata = pageMetadata('Soirées et rencontres', 'Découvre les prochaines rencontres et réserve ta place en solo ou en groupe avec O’BORD.')

export default async function Soirees({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const [{ plan: selectedPlanId }, locale, { events: upcomingEvents, error: eventsError }] = await Promise.all([searchParams, getLocale(), getUpcomingEvents()])
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const dateLocale = locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR'
  const selectedPlan = upcomingEvents.find((event) => event.id === selectedPlanId)
  const displayedEvents = selectedPlan ? [selectedPlan] : upcomingEvents

  return (
    <div className="soirees-page">
      <header className="soirees-hero" data-reveal>
        <div className="soirees-hero-glow" aria-hidden="true" />
        <div className="soirees-hero-copy">
          <p className="soirees-kicker">O’BORD · GRAND-BASSAM</p>
          <h1>{t('soirees.hero')}</h1>
          <p>{t('soirees.intro')}</p>
          <a href="#rendez-vous" className="soirees-hero-cta">{t('soirees.dates')}</a>
        </div>
        <div className="soirees-hero-art" aria-hidden="true">
          <span className="soirees-orbit soirees-orbit-one" /><span className="soirees-orbit soirees-orbit-two" />
          <div className="soirees-fire"><span /><span /><span /></div>
          <p>O’BORD<br />GRAND-BASSAM</p>
        </div>
        <span className="soirees-hero-foot">O’BORD · GRAND-BASSAM</span>
      </header>
      <div className="soirees-content" id="rendez-vous">
        {selectedPlan ? <div className="soirees-selected-heading"><Link href="/soirees#rendez-vous" className="soirees-back-to-plans">{t('soirees.all')}</Link><p className="event-practical-label">{t('soirees.selected')}</p></div> : null}
        <div className="soirees-section-heading"><div><p className="event-practical-label">{selectedPlan ? t('soirees.next') : t('soirees.choose')}</p><h2>{selectedPlan ? selectedPlan.title : t('soirees.upcoming')}</h2><p className="soirees-heading-help">{selectedPlan ? t('soirees.selectedHelp') : t('soirees.details')}</p></div><span className="soirees-count">{selectedPlan ? `01 ${t('soirees.count')}` : `${String(upcomingEvents.length).padStart(2, '0')} ${t('soirees.date')}`}</span></div>

        {displayedEvents.length ? (
          <div className="soirees-event-list">
            {displayedEvents.map((event, index) => (
              <article key={event.id} data-reveal data-reveal-delay={index * 120} className={`soirees-event-card event-card-${index + 1}`} style={{ animationDelay: `${index * 150}ms` }}>
                <div className="soirees-event-head">
                  <div className="soirees-event-number">0{index + 1}<span> / O’BORD</span></div>
                  <h2>{selectedPlan ? event.title : <Link href={`/soirees?plan=${encodeURIComponent(event.id)}`} aria-label={`Afficher uniquement le plan ${event.title}`}>{event.title}</Link>}</h2>
                  <div className="soirees-event-meta">
                    <span className="rounded-full bg-gray-100 px-3 py-1">{new Intl.DateTimeFormat(dateLocale, { dateStyle: 'long', timeZone: 'Africa/Abidjan' }).format(new Date(event.date))}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">{event.time}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1">{event.eventType === 'sortie' ? t('soirees.outing') : t('soirees.workshop')}</span>
                  </div>
                </div>

                <div className="soirees-event-body">
                  {event.imageUrls.length > 0 && <div className="event-photo-gallery" aria-label={event.title}>{event.imageUrls.map((url, imageIndex) => <figure key={url}><Image src={url} alt={`${event.title} — ${imageIndex + 1}`} width={960} height={600} sizes="(max-width: 700px) 100vw, 50vw" /></figure>)}</div>}
                  <p className="soirees-event-description">{event.description}</p>
                  {event.capacity !== null && <div className="event-availability" aria-live="polite"><div><p className="event-practical-label">{t('soirees.places')}</p>{event.remainingSeats === null ? <strong>{event.capacity}</strong> : event.remainingSeats === 0 ? <strong>{t('soirees.full')}</strong> : <strong>{event.remainingSeats} {t('soirees.remaining')}</strong>}{event.reservedCount !== null && <p>{event.reservedCount} / {event.capacity}</p>}</div></div>}
                  <div className="event-practical-grid">
                    <section className="event-practical-card">
                      <div><p className="event-practical-label">{t('soirees.venue')}</p><h3>{event.venueArea}</h3><p>{event.venueName || t('soirees.venuePending')}</p></div>
                    </section>
                    {event.foodAndDrinks && <section className="event-practical-card food-card">
                      <div><p className="event-practical-label">{t('soirees.break')}</p><h3>{t('soirees.share')}</h3><p>{event.foodAndDrinks}</p></div>
                    </section>}
                    {(event.participationDetails || event.title.toLocaleLowerCase('fr').startsWith('plan chill')) && (
                      <section className="event-practical-card food-card">
                      <div><p className="event-practical-label">{t('soirees.participation')}</p><h3>{event.title.toLocaleLowerCase('fr').startsWith('plan chill') ? '3 000 FCFA' : t('agenda.participation')}</h3><p>{event.title.toLocaleLowerCase('fr').startsWith('plan chill') ? t('soirees.contribution') : event.participationDetails}</p></div>
                      </section>
                    )}
                  </div>

                  {event.activities.length > 0 ? <>
                    <h3 className="soirees-program-title">{t('soirees.schedule')}</h3>
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
                  </> : <div className="soirees-program-pending"><p><strong>{t('soirees.preparing')}</strong> {t('soirees.programInfo')}</p></div>}
                  <div className="event-actions-row">
                    <Link href={selectedPlan ? `#reservation-${event.id}` : `/soirees?plan=${encodeURIComponent(event.id)}#reservation-${event.id}`} className="soirees-booking-link">{t('soirees.reserve')}</Link>
                    <ShareEventButton title={event.title} description={`${event.title} · ${event.date} à ${event.time} · ${event.venueArea}. ${event.description}`} url={`/soirees?plan=${encodeURIComponent(event.id)}`} />
                    <a className="event-calendar-link" href={`/api/events/${encodeURIComponent(event.id)}/calendar`}>{t('soirees.calendar')}</a>
                  </div>
                </div>
                <EventReservation eventId={event.id} title={event.title} startsAt={event.startsAt} registrationUrl={event.registrationUrl} locale={locale} isFull={event.capacity !== null && event.remainingSeats === 0} />
              </article>
            ))}
          </div>
        ) : selectedPlanId ? (
          <section className="next-meetup-note"><div><p className="event-practical-label">O’BORD</p><h2>{t('soirees.unavailable')}</h2><p>{t('soirees.unavailableInfo')}</p><Link className="meetup-contact-link" href="/soirees#rendez-vous">{t('soirees.dates')}</Link></div></section>
        ) : upcomingEvents.length ? null : (
          <section className="next-meetup-note">
            <div>
              <p className="event-practical-label">O’BORD · GRAND-BASSAM</p>
              <h2>{eventsError ? t('soirees.errorTitle') : t('soirees.emptyTitle')}</h2>
              <p>{eventsError ? t('soirees.errorText') : t('soirees.emptyText')}</p>
              <div className="meetup-note-actions"><Link href="/videos" className="meetup-video-link">{t('soirees.videos')}</Link><Link href="/organisateurs" className="meetup-contact-link">{t('soirees.organizers')}</Link></div>
            </div>
          </section>
        )}

        <section className="video-memory">
          <div><p className="event-practical-label">{t('soirees.past')}</p><h2>{t('soirees.pastTitle')}</h2><p>{t('soirees.pastText')}</p></div>
          <Link href="/videos" className="button-primary group">{t('soirees.memories')}</Link>
        </section>

        <div className="soirees-back"><Link href="/">{t('common.home')}</Link></div>
      </div>
    </div>
  )
}
