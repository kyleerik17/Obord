import Link from 'next/link'
import Image from 'next/image'
import { getUpcomingEvents } from '@/lib/data/events'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'
import PhotoCarousel from '@/components/PhotoCarousel'

export const metadata = pageMetadata('La maison du chill', 'Jeux et rencontres à Grand-Bassam, à vivre à ton rythme avec O’BORD.')

const activities = [
  { title: 'home.card1title', tag: 'home.card1tag', text: 'home.card1text', action: 'home.card1action', number: '01', icon: '✳' },
  { title: 'home.card2title', tag: 'home.card2tag', text: 'home.card2text', action: 'home.card2action', number: '02', icon: '◌' },
  { title: 'home.card3title', tag: 'home.card3tag', text: 'home.card3text', action: 'home.card3action', number: '03', icon: '⌁' },
  { title: 'home.card4title', tag: 'home.card4tag', text: 'home.card4text', action: 'home.card4action', number: '04', icon: '☼' },
] as const

export default async function Home() {
  const [locale, agenda] = await Promise.all([getLocale(), getUpcomingEvents()])
  const upcomingEvents = agenda.events.slice(0, 3)
  const meetupPhotos = agenda.events.flatMap((event) => event.imageUrls.map((src, index) => ({ src, alt: `${event.title} · photo ${index + 1}` })))
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)

  return (
    <div className="ob-home editorial-home">
      <section className="home-hero" id="accueil">
        <div className="home-hero-copy">
          <p className="editorial-eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('home.title1')}<br /><span>{t('home.title2')}</span></h1>
          <p className="home-hero-intro">{t('home.intro')}</p>
          <p className="home-hero-location"><span className="location-dot" aria-hidden="true" />{t('home.location')} · Grand-Bassam</p>
          <div className="home-hero-actions">
            <Link className="editorial-button editorial-button-primary" href="/soirees">{t('home.primary')}</Link>
            <Link className="editorial-button editorial-button-secondary" href="#ateliers">{t('home.secondary')}</Link>
          </div>
        </div>
        <div className="home-hero-mark" aria-hidden="true"><Image src="/obord-logo.png" alt="" fill priority sizes="(max-width: 760px) 190px, 390px" /></div>
        <p className="home-hero-index">O’BORD <span>—</span> LA MAISON DU CHILL</p>
      </section>

      <section className="home-activities editorial-section" id="ateliers" aria-labelledby="activities-title">
        <div className="editorial-section-heading">
          <div><p className="editorial-eyebrow">{t('home.activitiesEyebrow')}</p><h2 id="activities-title">{t('home.activitiesTitle')}</h2></div>
          <p>{t('home.activitiesIntro')}</p>
        </div>
        <div className="activity-grid">
          {activities.map((activity) => (
            <article className="activity-card" key={activity.number}>
              <div className="activity-card-top"><span>{activity.number}</span><span className="activity-card-icon" aria-hidden="true">{activity.icon}</span></div>
              <p className="activity-card-tag">{t(activity.tag)}</p>
              <h3>{t(activity.title)}</h3>
              <p className="activity-card-description">{t(activity.text)}</p>
              <Link href="/soirees" className="editorial-text-link">{t(activity.action)}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-reassurance" aria-label="À quoi s’attendre">
        {([1, 2, 3] as const).map((number) => (
          <article key={number}><span className="reassurance-number">0{number}</span><div><h3>{t(`home.reassurance${number}` as Parameters<typeof translate>[1])}</h3><p>{t(`home.reassurance${number}text` as Parameters<typeof translate>[1])}</p></div></article>
        ))}
      </section>

      {meetupPhotos.length > 0 && <section className="home-photo-section" aria-label="Photos des rencontres O’BORD"><div><p className="editorial-eyebrow">O’BORD · EN VRAI</p><h2>Quelques images de nos rencontres</h2></div><PhotoCarousel label="Photos des rencontres O’BORD" photos={meetupPhotos} /></section>}

      <section className="home-agenda editorial-section" id="agenda" aria-labelledby="agenda-title">
        <div className="editorial-section-heading">
          <div><p className="editorial-eyebrow">{t('home.agendaEyebrow')}</p><h2 id="agenda-title">{t('home.agendaTitle')}</h2><p className="editorial-section-intro">{t('home.agendaIntro')}</p></div>
          <Link className="editorial-button editorial-button-secondary" href="/soirees">{t('home.allMeetups')}</Link>
        </div>
        {upcomingEvents.length ? (
          <div className="home-event-list">
            {upcomingEvents.map((event) => {
              const date = new Date(`${event.date}T12:00:00`)
              const dateLabel = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR', { day: 'numeric', month: 'long', timeZone: 'Africa/Abidjan' }).format(date)
              return <article className="home-event-card" key={event.id}>
                {event.imageUrls[0] && <Link className="home-event-photo" href={`/soirees?plan=${encodeURIComponent(event.id)}`} aria-label={`${t('common.learnMore')} : ${event.title}`}><Image src={event.imageUrls[0]} alt="" fill sizes="100px" /></Link>}
                <div className="home-event-date"><span>{dateLabel}</span><span>{event.time}</span></div>
                <div className="home-event-copy"><h3>{event.title}</h3><p>{event.venueArea}{event.venueName ? ` · ${event.venueName}` : ''}</p></div>
                <Link href={`/soirees?plan=${encodeURIComponent(event.id)}`} className="editorial-button editorial-button-primary">{t('common.learnMore')}</Link>
              </article>
            })}
          </div>
        ) : (
          <div className="home-agenda-empty"><div><span className="home-empty-mark" aria-hidden="true">O’</span><p className="editorial-eyebrow">{t('home.agendaEyebrow')}</p><h3>{agenda.error ? t('home.errorTitle') : t('home.emptyTitle')}</h3><p>{agenda.error ? t('home.errorText') : t('home.emptyText')}</p></div><div className="home-agenda-empty-actions"><Link className="editorial-button editorial-button-primary" href="/videos">{t('home.memories')}</Link><Link className="editorial-text-link" href="/contact">{t('home.contactCta')}</Link></div></div>
        )}
        <div className="home-how-it-works"><h3>{t('home.stepsTitle')}</h3><div>{([1, 2, 3] as const).map((number) => <article key={number}><span>0{number}</span><div><strong>{t(`home.step${number}` as Parameters<typeof translate>[1])}</strong><p>{t(`home.step${number}text` as Parameters<typeof translate>[1])}</p></div></article>)}</div></div>
      </section>

      <section className="home-story">
        <div className="home-story-mark" aria-hidden="true"><Image src="/obord-logo.png" alt="" fill sizes="(max-width: 760px) 96px, 140px" /></div>
        <div><p className="editorial-eyebrow">O’BORD · GRAND-BASSAM</p><h2>{t('home.storyTitle')}</h2><p>{t('home.storyText')}</p><Link className="editorial-text-link" href="/a-propos">{t('common.learnMore')}</Link></div>
      </section>

      <section className="home-contact">
        <div><p className="editorial-eyebrow">O’BORD · GRAND-BASSAM</p><h2>{t('home.contactTitle')}</h2><p>{t('home.contactText')}</p></div>
        <Link className="editorial-button editorial-button-primary" href="/contact">{t('home.contactCta')}</Link>
      </section>
    </div>
  )
}
