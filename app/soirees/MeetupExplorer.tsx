'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import ShareEventButton from './ShareEventButton'
import type { Locale } from '@/lib/i18n'

type Meetup = {
  id: string; title: string; description: string; startsAt: string; time: string; venueName: string; venueArea: string
  capacity: number | null; remainingSeats: number | null; imageUrls: string[]; eventType: 'sortie' | 'atelier'
  registrationUrl: string | null; foodAndDrinks: string; participationDetails: string
  activities: { id: string | number; title: string; time: string; description: string }[]
}
type Filter = 'all' | 'calm' | 'games' | 'online' | 'spontaneous'
type Copy = Record<string, string>

const filters: { id: Filter; key: string; mark: string }[] = [
  { id: 'all', key: 'all', mark: '◉' }, { id: 'calm', key: 'calm', mark: '◌' },
  { id: 'games', key: 'games', mark: '▦' }, { id: 'online', key: 'online', mark: '⌁' }, { id: 'spontaneous', key: 'spontaneous', mark: '✳' },
]

function matchesFilter(event: Meetup, filter: Filter) {
  const content = `${event.title} ${event.description} ${event.venueName} ${event.venueArea} ${event.activities.map((activity) => `${activity.title} ${activity.description}`).join(' ')}`.toLocaleLowerCase()
  if (filter === 'all') return true
  if (filter === 'online') return /en ligne|online|discord|visio/.test(content)
  if (filter === 'calm') return /café|calme|chill|détente|relax/.test(content)
  if (filter === 'games') return /jeu|partie|tournoi|ludique|escape/.test(content)
  return /improvis|spontan|surprise/.test(content)
}

function dateLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Abidjan' }).format(new Date(value))
}

export default function MeetupExplorer({ events, error, locale, copy }: { events: Meetup[]; error: boolean; locale: Locale; copy: Copy }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Meetup | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState({ title: '', type: '', date: '', time: '', place: 'Bamboo Blanc · quartier France', description: '' })
  const filtered = useMemo(() => events.filter((event) => matchesFilter(event, filter)), [events, filter])
  const dateTime = (value: string) => new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Abidjan' }).format(new Date(value))
  const closePanels = () => { setSelected(null); setShowCreate(false); setStep(1) }

  return (
    <div className="meetup-explorer">
      <header className="meetup-explorer-hero">
        <div className="meetup-explorer-hero-copy"><p className="explorer-eyebrow">O’BORD · GRAND-BASSAM</p><h1>{copy.title}</h1><p>{copy.intro}</p><a href="#explore-plans" className="explorer-primary-link">{copy.open}<span aria-hidden="true"> ↓</span></a></div>
        <div className="explorer-hero-art" aria-hidden="true"><span className="explorer-art-orbit explorer-art-orbit-a"/><span className="explorer-art-orbit explorer-art-orbit-b"/><div className="explorer-art-sun">O’</div><span className="explorer-art-caption">LE PLAISIR D’ÊTRE ENSEMBLE</span></div>
        <span className="explorer-hero-side">JEUX · RENCONTRES · GRAND-BASSAM</span>
      </header>

      <main className="meetup-explorer-main" id="explore-plans">
        <div className="explorer-section-intro"><div><p className="explorer-eyebrow">{copy.eyebrow}</p><h2>On fait quoi, bientôt ?</h2><p>Choisis l’ambiance qui te tente et regarde les rendez-vous à venir.</p></div><button type="button" className="explorer-create-button" onClick={() => { setShowCreate(true); setSelected(null) }}><span aria-hidden="true">＋</span>{copy.create}</button></div>

        <div className="explorer-filters" role="group" aria-label={copy.filters}>{filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} className={`explorer-filter explorer-filter-${item.id}`} onClick={() => setFilter(item.id)}><span aria-hidden="true">{item.mark}</span>{copy[item.key]}</button>)}</div>
        <div className="explorer-results-label"><span>{String(filtered.length).padStart(2, '0')} {copy.count}</span><span>À Grand-Bassam, à ton rythme</span></div>

        {filtered.length ? <section className="explorer-bento" aria-label={copy.count}>
          {filtered.map((event, index) => <article key={event.id} className={`explorer-card explorer-card-${index % 5}`}>
            <button type="button" className="explorer-card-open" onClick={() => setSelected(event)} aria-label={`${copy.open} : ${event.title}`}>
              <div className="explorer-card-art">
                {event.imageUrls[0] ? <Image src={event.imageUrls[0]} alt="" fill sizes="(max-width: 700px) 92vw, (max-width: 1000px) 45vw, 360px" /> : <div className="explorer-card-illustration" aria-hidden="true"><span>{['O’', '◌', '✳', '⌁', '▦'][index % 5]}</span><i/><b/></div>}
                <span className={`explorer-mood explorer-mood-${index % 4}`}>{event.eventType === 'sortie' ? copy.typeOuting : copy.typeWorkshop}</span>
                <span className="explorer-card-date">{dateLabel(event.startsAt, locale)}</span>
              </div>
              <div className="explorer-card-copy"><div className="explorer-card-title-row"><h3>{event.title}</h3><span className="explorer-card-arrow" aria-hidden="true">↗</span></div><p className="explorer-card-description">{event.description}</p><div className="explorer-card-meta"><span><b aria-hidden="true">◷</b>{event.time}</span><span><b aria-hidden="true">⌖</b>{event.venueName || event.venueArea || 'Grand-Bassam'}</span></div>{event.capacity !== null && <p className="explorer-capacity">{event.remainingSeats === 0 ? copy.full : event.remainingSeats === null ? copy.noCapacity : `${event.remainingSeats} ${copy.remaining}`}</p>}<span className="explorer-card-action">{copy.join}<span aria-hidden="true">↗</span></span></div>
            </button>
          </article>)}
        </section> : <section className="explorer-empty"><div className="explorer-empty-mark" aria-hidden="true">O’</div><p className="explorer-eyebrow">O’BORD · GRAND-BASSAM</p><h3>{error ? copy.errorTitle : copy.emptyTitle}</h3><p>{error ? copy.errorText : copy.emptyText}</p><button className="explorer-create-button" type="button" onClick={() => setShowCreate(true)}><span aria-hidden="true">＋</span>{copy.create}</button><button type="button" className="explorer-reset-filter" onClick={() => setFilter('all')}>{copy.reset}</button></section>}

        <div className="explorer-footer-note"><span aria-hidden="true">✳</span><p>Pas besoin de connaître tout le monde. L’équipe est là pour vous accueillir.</p><Link href="/contact">Une question ? Écris-nous</Link></div>
      </main>

      {(selected || showCreate) && <div className="explorer-overlay" onClick={closePanels}>
        <section className={`explorer-sheet${showCreate ? ' explorer-sheet-create' : ''}`} role="dialog" aria-modal="true" aria-label={showCreate ? copy.createTitle : selected?.title} onClick={(event) => event.stopPropagation()}>
          <button className="explorer-sheet-close" type="button" onClick={closePanels} aria-label={copy.close}>×</button><span className="explorer-sheet-grabber" aria-hidden="true"/>
          {selected ? <>
            <p className="explorer-eyebrow">{selected.eventType === 'sortie' ? copy.typeOuting : copy.typeWorkshop} · {dateLabel(selected.startsAt, locale)}</p><h2>{selected.title}</h2><p className="explorer-sheet-date">{dateTime(selected.startsAt)}</p>
            {selected.imageUrls.length > 0 && <div className="explorer-sheet-photo">{selected.imageUrls.map((url) => <Image key={url} src={url} alt={selected.title} width={1200} height={760} />)}</div>}
            <p className="explorer-sheet-description">{selected.description}</p><div className="explorer-sheet-info"><div><span>{copy.venue}</span><strong>{selected.venueName || selected.venueArea || 'Grand-Bassam'}</strong></div><div><span>{copy.time}</span><strong>{selected.time}</strong></div>{selected.capacity !== null && <div><span>{copy.count}</span><strong>{selected.remainingSeats === 0 ? copy.full : selected.remainingSeats === null ? copy.noCapacity : `${selected.remainingSeats} ${copy.remaining}`}</strong></div>}{selected.participationDetails && <div><span>{copy.contribution}</span><strong>{selected.participationDetails}</strong></div>}</div>
            {selected.foodAndDrinks && <p className="explorer-sheet-hospitality">{selected.foodAndDrinks}</p>}
            {selected.activities.length > 0 && <div className="explorer-sheet-program"><h3>{copy.schedule}</h3>{selected.activities.map((activity) => <article key={activity.id}><span>{activity.time}</span><div><strong>{activity.title}</strong><p>{activity.description}</p></div></article>)}</div>}
            <div className="explorer-sheet-actions"><Link href={`/soirees?plan=${encodeURIComponent(selected.id)}#reservation-${selected.id}`} className="explorer-create-button">{copy.join}<span aria-hidden="true">↗</span></Link><ShareEventButton title={selected.title} description={`${selected.title} · ${dateLabel(selected.startsAt, locale)} à ${selected.time} · ${selected.venueArea}. ${selected.description}`} url={`/soirees?plan=${encodeURIComponent(selected.id)}`} /></div>
          </> : <>
            <p className="explorer-eyebrow">O’BORD · À TON TOUR</p><h2>{copy.createTitle}</h2><p className="explorer-create-intro">{copy.createIntro}</p>
            <div className="explorer-step-indicator" aria-label={`${copy.step} ${step} / 3`}>{[1,2,3].map((n)=><span key={n} className={step >= n ? 'is-current' : ''}>{n}</span>)}</div>
            <div className="explorer-create-layout"><form className="explorer-create-form" onSubmit={(event)=>event.preventDefault()}>
              {step===1 && <><label>{copy.name}<input maxLength={80} value={draft.title} onChange={(event)=>setDraft({...draft,title:event.target.value})} placeholder="Ex. Une partie au coucher du soleil" autoFocus/></label><label>{copy.activity}<select value={draft.type} onChange={(event)=>setDraft({...draft,type:event.target.value})}><option value="">Choisir une ambiance</option><option>Jeux de société</option><option>Calme & Café</option><option>En ligne</option><option>Improvisé</option><option>Sortie O’BORD</option></select></label></>}
              {step===2 && <><div className="explorer-create-fields"><label>{copy.date}<input type="date" value={draft.date} onChange={(event)=>setDraft({...draft,date:event.target.value})}/></label><label>{copy.time}<input type="time" value={draft.time} onChange={(event)=>setDraft({...draft,time:event.target.value})}/></label></div><label>{copy.place}<input maxLength={100} value={draft.place} onChange={(event)=>setDraft({...draft,place:event.target.value})}/></label></>}
              {step===3 && <label>{copy.description}<textarea maxLength={500} rows={5} value={draft.description} onChange={(event)=>setDraft({...draft,description:event.target.value})} placeholder="L’idée, c’est…"/></label>}
              <div className="explorer-form-actions">{step>1 && <button type="button" className="explorer-reset-filter" onClick={()=>setStep(step-1)}>{copy.back}</button>}{step<3 ? <button type="button" className="explorer-create-button" onClick={()=>setStep(step+1)} disabled={step===1 && !draft.title.trim()}>{copy.next}<span aria-hidden="true">→</span></button> : <button type="button" className="explorer-create-button" onClick={closePanels}>{copy.publish}</button>}</div>
            </form><article className="explorer-preview"><p>{copy.preview}</p><div className="explorer-preview-card"><div className="explorer-preview-art" aria-hidden="true"><span>{draft.type.includes('Jeux')?'▦':draft.type.includes('Calme')?'◌':'O’'}</span></div><div><small>{draft.type || 'O’BORD · RENCONTRE'}</small><h3>{draft.title || 'Ton idée prend forme ici'}</h3><p>{draft.date || 'Date à choisir'} {draft.time && `· ${draft.time}`}</p><p>{draft.place || 'Grand-Bassam'}</p><p>{draft.description || 'Quelques mots pour donner envie de te rejoindre.'}</p></div></div><p className="explorer-preview-note">Aperçu uniquement : la proposition n’est pas encore publiée.</p></article></div>
          </>}
        </section>
      </div>}
    </div>
  )
}
