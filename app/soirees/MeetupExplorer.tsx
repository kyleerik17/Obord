'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import ShareEventButton from './ShareEventButton'
import type { Locale } from '@/lib/i18n'

type Meetup = {
  id: string; title: string; description: string; startsAt: string; time: string; venueName: string; venueArea: string
  capacity: number | null; remainingSeats: number | null; imageUrls: string[]; eventType: 'sortie' | 'atelier'
  registrationUrl: string | null; foodAndDrinks: string; participationDetails: string
  activities: { id: string | number; title: string; time: string; description: string }[]
}
type Copy = Record<string, string>

function dateLabel(value: string, locale: Locale, options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  const language = locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR'
  return new Intl.DateTimeFormat(language, { ...options, timeZone: 'Africa/Abidjan' }).format(new Date(value))
}

export default function MeetupExplorer({ events, error, locale, copy }: { events: Meetup[]; error: boolean; locale: Locale; copy: Copy }) {
  const [selected, setSelected] = useState<Meetup | null>(null)
  const closePanel = () => setSelected(null)

  return (
    <div className="meetup-explorer">
      <header className="meetup-explorer-hero">
        <div className="meetup-explorer-hero-copy">
          <p className="explorer-eyebrow">O’BORD · GRAND-BASSAM</p>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
          <a href="#explore-plans" className="explorer-primary-link">{copy.open}<span aria-hidden="true"> ↓</span></a>
        </div>
        <div className="explorer-hero-art" aria-hidden="true"><span className="explorer-art-orbit explorer-art-orbit-a"/><span className="explorer-art-orbit explorer-art-orbit-b"/><div className="explorer-art-sun">O’</div><span className="explorer-art-caption">JEUX · RENCONTRES · GRAND-BASSAM</span></div>
      </header>

      <main className="meetup-explorer-main" id="explore-plans">
        <div className="explorer-section-intro">
          <div><p className="explorer-eyebrow">{copy.eyebrow}</p><h2>Les prochaines dates</h2><p>Le collectif prépare les rencontres et publie ici les informations pratiques.</p></div>
        </div>
        <div className="explorer-results-label"><span>{String(events.length).padStart(2, '0')} {copy.count}</span><span>Bamboo Blanc · quartier France · Grand-Bassam</span></div>

        {events.length ? <section className="explorer-bento" aria-label={copy.count}>
          {events.map((event, index) => <article key={event.id} className={`explorer-card explorer-card-${index % 5}`}>
            <button type="button" className="explorer-card-open" onClick={() => setSelected(event)} aria-label={`${copy.open} : ${event.title}`}>
              <div className="explorer-card-art">
                {event.imageUrls[0] ? <Image src={event.imageUrls[0]} alt="" fill sizes="(max-width: 700px) 92vw, (max-width: 1000px) 45vw, 360px" /> : <div className="explorer-card-illustration" aria-hidden="true"><span>{['O’', '◌', '✳', '⌁', '▦'][index % 5]}</span><i/><b/></div>}
                <span className={`explorer-mood explorer-mood-${index % 4}`}>{event.eventType === 'sortie' ? copy.typeOuting : copy.typeWorkshop}</span>
                <span className="explorer-card-date">{dateLabel(event.startsAt, locale)}</span>
              </div>
              <div className="explorer-card-copy"><div className="explorer-card-title-row"><h3>{event.title}</h3><span className="explorer-card-arrow" aria-hidden="true">↗</span></div><p className="explorer-card-description">{event.description}</p><div className="explorer-card-meta"><span><b aria-hidden="true">◷</b>{event.time}</span><span><b aria-hidden="true">⌖</b>{event.venueName || event.venueArea || 'Grand-Bassam'}</span></div>{event.capacity !== null && <p className="explorer-capacity">{event.remainingSeats === 0 ? copy.full : event.remainingSeats === null ? copy.noCapacity : `${event.remainingSeats} ${copy.remaining}`}</p>}<span className="explorer-card-action">{copy.join}<span aria-hidden="true">↗</span></span></div>
            </button>
          </article>)}
        </section> : <section className="explorer-empty"><div className="explorer-empty-mark" aria-hidden="true">O’</div><p className="explorer-eyebrow">O’BORD · GRAND-BASSAM</p><h3>{error ? copy.errorTitle : copy.emptyAgendaTitle}</h3><p>{error ? copy.errorText : copy.emptyAgendaText}</p><div className="explorer-empty-actions"><Link className="explorer-primary-link" href="/contact">{copy.contact}<span aria-hidden="true"> ↗</span></Link><Link className="explorer-empty-secondary" href="/videos">{copy.memories}</Link></div></section>}
      </main>

      {selected && <div className="explorer-overlay" onClick={closePanel}>
        <section className="explorer-sheet" role="dialog" aria-modal="true" aria-label={selected.title} onClick={(event) => event.stopPropagation()}>
          <button className="explorer-sheet-close" type="button" onClick={closePanel} aria-label={copy.close}>×</button><span className="explorer-sheet-grabber" aria-hidden="true"/>
          <p className="explorer-eyebrow">{selected.eventType === 'sortie' ? copy.typeOuting : copy.typeWorkshop} · {dateLabel(selected.startsAt, locale)}</p><h2>{selected.title}</h2><p className="explorer-sheet-date">{dateLabel(selected.startsAt, locale, { dateStyle: 'full', timeStyle: 'short' })}</p>
          {selected.imageUrls.length > 0 && <div className="explorer-sheet-photo">{selected.imageUrls.map((url) => <Image key={url} src={url} alt={selected.title} width={1200} height={760} />)}</div>}
          <p className="explorer-sheet-description">{selected.description}</p><div className="explorer-sheet-info"><div><span>{copy.venue}</span><strong>{selected.venueName || selected.venueArea || 'Grand-Bassam'}</strong></div><div><span>{copy.time}</span><strong>{selected.time}</strong></div>{selected.capacity !== null && <div><span>{copy.count}</span><strong>{selected.remainingSeats === 0 ? copy.full : selected.remainingSeats === null ? copy.noCapacity : `${selected.remainingSeats} ${copy.remaining}`}</strong></div>}{selected.participationDetails && <div><span>{copy.contribution}</span><strong>{selected.participationDetails}</strong></div>}</div>
          {selected.foodAndDrinks && <p className="explorer-sheet-hospitality">{selected.foodAndDrinks}</p>}
          {selected.activities.length > 0 && <div className="explorer-sheet-program"><h3>{copy.schedule}</h3>{selected.activities.map((activity) => <article key={activity.id}><span>{activity.time}</span><div><strong>{activity.title}</strong><p>{activity.description}</p></div></article>)}</div>}
          <div className="explorer-sheet-actions"><Link href={`/soirees?plan=${encodeURIComponent(selected.id)}#reservation-${selected.id}`} className="explorer-create-button">{copy.join}<span aria-hidden="true">↗</span></Link><ShareEventButton title={selected.title} description={`${selected.title} · ${dateLabel(selected.startsAt, locale)} à ${selected.time} · ${selected.venueArea}. ${selected.description}`} url={`/soirees?plan=${encodeURIComponent(selected.id)}`} /></div>
        </section>
      </div>}
    </div>
  )
}
