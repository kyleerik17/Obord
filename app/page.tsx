import Link from 'next/link'
import Image from 'next/image'
import { getUpcomingEvents } from '@/lib/data/events'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('La maison du chill', 'Le collectif O’BORD à Grand-Bassam : jeux, rencontres et sorties conviviales.')

const games = [
  { number: '01', title: 'La Table', tag: 'JEUX DE SOCIÉTÉ', text: 'Des jeux faciles à découvrir pour rire et faire connaissance.', action: 'Rejoindre la table', icon: '✳', color: 'lilac', shape: 'board' },
  { number: '02', title: 'Le Salon', tag: 'RENCONTRES', text: 'Un moment pour discuter et rencontrer de nouvelles personnes.', action: 'Faire connaissance', icon: '✦', color: 'coral', shape: 'dice' },
  { number: '03', title: 'Le Terrain', tag: 'JEUX EN GROUPE', text: 'Des activités et des défis à partager ensemble.', action: 'Relever le défi', icon: '◈', color: 'yellow', shape: 'wood' },
  { number: '04', title: 'Le Feu & la Plage', tag: 'PLEIN AIR', text: 'Une sortie en plein air pour profiter du moment et de la plage.', action: 'Profiter du moment', icon: '⌘', color: 'blue', shape: 'escape' },
]

const stats = [
  { number: 'RENCONTRER', label: 'faire connaissance, naturellement', mark: '✳' },
  { number: 'JOUER', label: 'créer des liens en faisant', mark: '♟' },
  { number: 'CHILLER', label: 'profiter, à son propre rythme', mark: '✦' },
]

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-1">{diagonal ? '↗' : '→'}</span>
}

function WorkshopIcon({ shape, icon }: { shape: string; icon: string }) {
  return (
    <div aria-hidden="true" className={`workshop-art art-${shape}`}>
      <span className="art-spark art-spark-one">✳</span>
      <span className="art-spark art-spark-two">✦</span>
      {shape === 'board' && <div className="board-piece"><i /><i /><i /><i /></div>}
      {shape === 'dice' && <div className="die">✦</div>}
      {shape === 'wood' && <div className="wood-stack"><i /><i /><i /></div>}
      {shape === 'escape' && <div className="escape-orbit"><i>?</i></div>}
      <span className="art-symbol">{icon}</span>
    </div>
  )
}

function Ticket({ id, title, day, month, time, index, capacity, remainingSeats }: { id: string; title: string; day: string; month: string; time: string; index: number; capacity: number | null; remainingSeats: number | null }) {
  return (
    <article className="event-ticket" style={{ animationDelay: `${index * 120}ms` }}>
      <div className="event-date"><span>{month}</span><strong>{day}</strong></div>
      <div className="event-copy"><span className="event-label">RENDEZ-VOUS O’BORD</span><h3>{title}</h3><p>⌁ &nbsp; {time}</p>{capacity !== null && remainingSeats !== null && <small className="ticket-places">{remainingSeats > 0 ? `${remainingSeats} place${remainingSeats > 1 ? 's' : ''} restante${remainingSeats > 1 ? 's' : ''}` : 'Complet'}</small>}</div>
      <Link className="ticket-arrow" href={`/soirees?plan=${encodeURIComponent(id)}`} aria-label={`Découvrir ${title}`}><span>Découvrir</span><Arrow diagonal /></Link>
    </article>
  )
}

export default async function Home() {
  const { events: scheduledEvents, error: scheduleError } = await getUpcomingEvents()
  const upcomingEvents = scheduledEvents.slice(0, 3)

  return (
    <div className="ob-home">
      {/* Hero: a made-for-O'BORD typographic poster, with no placeholder photography. */}
      <section className="hero-section" id="accueil">
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-content">
          <h1>Des jeux, des rencontres,<br /><span className="hero-last">et du chill<span className="hero-period">.</span></span></h1>
          <div className="hero-bottom">
            <div><span className="hero-tag">O’BORD · GRAND-BASSAM</span><p>Des rencontres autour du jeu, pour faire connaissance à ton rythme.<br />Viens seul·e ou avec ta bande.</p></div>
            <div className="hero-actions"><Link href="/soirees" className="button-primary group">Voir les prochaines rencontres <Arrow diagonal /></Link><Link href="#ateliers" data-no-progress="true" className="button-quiet">Découvrir les activités <Arrow /></Link></div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-disc"><Image src="/obord-logo.png" alt="" fill sizes="(max-width: 640px) 180px, 360px" priority /></div><div className="hero-star hero-star-one">✳</div><div className="hero-star hero-star-two">✦</div><div className="hero-star hero-star-three">✳</div><div className="hero-caption">LA MAISON DU CHILL <span>·</span> GRAND-BASSAM</div></div>
        <div className="hero-rail" aria-hidden="true"><span>VIENS COMME TU ES</span><span>✳</span><span>LA RENCONTRE SANS PRESSION</span><span>✳</span><span>VIENS COMME TU ES</span></div>
      </section>

      {/* Four illustrated workshop cards introduce the collective's activities. */}
      <section className="workshop-section section-wrap" id="ateliers" data-reveal>
        <div className="section-heading"><div><p className="eyebrow eyebrow-dark"><span>✳</span> DES PRÉTEXTES À LA RENCONTRE</p><h2>Il y a mille façons de <span>se retrouver.</span></h2></div><p className="section-intro">Un jeu pour briser la glace, une activité pour rire ensemble, ou juste un endroit où se poser. Choisis ce qui te ressemble.</p></div>
        <div className="workshop-grid">{games.map((game, index) => <article key={game.number} data-reveal data-reveal-delay={index * 90} className={`workshop-card card-${game.color}`}><div className="card-topline"><span>{game.number} / ATELIER</span><span className="card-star">✳</span></div><WorkshopIcon shape={game.shape} icon={game.icon} /><div className="card-copy"><span className="card-tag">{game.tag}</span><h3>{game.title}</h3><p>{game.text}</p><Link className="card-link group" href="/soirees">{game.action} <Arrow diagonal /></Link></div></article>)}</div>
      </section>

      {/* A compact social-proof band, expressed in the palette. */}
      <section className="stats-band" aria-label="Les trois dimensions de l’expérience O’BORD" data-reveal><div className="stats-inner">{stats.map((stat, index) => <div className={`stat stat-${index + 1}`} key={stat.number}><span className="stat-mark">{stat.mark}</span><p><strong>{stat.number}</strong><span>{stat.label}</span></p></div>)}</div><span className="stats-note">PAS BESOIN DE SAVOIR JOUER. IL SUFFIT DE VENIR. <span>→</span></span></section>

      {/* Event dates reuse the site's real event data and point to its existing sign-up flow. */}
      <section className="agenda-section section-wrap" id="agenda" data-reveal><div className="agenda-head"><div><p className="eyebrow eyebrow-dark"><span>⌁</span> LES RENCONTRES O’BORD</p><h2>On se voit <span>bientôt ?</span></h2><p className="agenda-lead">Choisis une date, réserve ta place et retrouve ici les informations pratiques.</p></div><Link className="agenda-all group" href="/soirees">Voir toutes les rencontres <Arrow diagonal /></Link></div>{upcomingEvents.length ? <><div className="event-list">{upcomingEvents.map((event, index) => { const date = new Date(`${event.date}T12:00:00`); return <Ticket key={event.id} id={event.id} index={index} title={event.title} day={new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(date)} month={new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '').toUpperCase()} time={event.time} capacity={event.capacity} remainingSeats={event.remainingSeats} /> })}</div><div className="agenda-bottom"><span><span className="live-dot" /> LES RENCONTRES O’BORD</span><Link href="/soirees" className="button-primary group">Je choisis ma rencontre <Arrow diagonal /></Link></div></> : <div className="agenda-empty"><span aria-hidden="true">☀</span><div><h3>{scheduleError ? 'Les rencontres ne sont pas disponibles pour le moment.' : 'Aucune nouvelle date annoncée pour le moment.'}</h3><p>{scheduleError ? 'Un souci technique empêche le chargement de l’agenda. Réessaie un peu plus tard.' : 'Les informations des prochaines rencontres seront affichées ici quand elles seront confirmées.'}</p><Link href={scheduleError ? '/contact' : '/videos'}>{scheduleError ? 'Écrire à l’équipe' : 'Revoir les souvenirs O’BORD'} <Arrow diagonal /></Link></div></div>}<div className="agenda-steps" aria-label="Comment participer"><article><span>01</span><div><strong>Tu choisis</strong><p>Une rencontre qui te donne envie.</p></div></article><article><span>02</span><div><strong>Tu réserves</strong><p>En solo ou avec ton groupe.</p></div></article><article><span>03</span><div><strong>On se retrouve</strong><p>L’équipe t’envoie les détails utiles.</p></div></article></div></section>

      {/* A direct invitation leads into the existing organizer contact and video pages. */}
      <section className="about-section" id="collectif" data-reveal><div className="about-inner"><div className="about-stamp" aria-hidden="true"><span>FAIRE GROUPE</span><b>O’B<br />ORD</b><span>FAIRE JEU ✳</span></div><div className="about-copy"><p className="eyebrow"><span>✳</span> LA MAISON DU CHILL</p><h2>Un endroit où<br />arriver <span>comme on est.</span></h2><p>À Grand-Bassam, O’BORD propose des occasions de se retrouver autour de jeux, d’activités et de sorties. Chacun peut participer, observer, jouer ou discuter à son rythme, dans une ambiance détendue.</p><div className="about-actions"><Link className="button-primary group" href="/organisateurs">Rencontrer le collectif <Arrow diagonal /></Link><Link className="button-quiet" href="/videos">Voir l’ambiance en vidéo <Arrow /></Link></div></div></div><div className="about-scribble" aria-hidden="true">viens comme tu es <span>↗</span></div></section>

      <section className="newsletter-section" id="contact" data-reveal><div className="newsletter-inner"><div><p className="eyebrow"><span>✳</span> ON GARDE LE LIEN</p><h2>Une question ?<br /><span>On est là.</span></h2><p>Tu veux en savoir plus avant de venir ? Écris-nous, on prendra le temps de te répondre.</p></div><div className="home-contact-card"><span>Un premier bonjour, ça commence ici.</span><Link href="/organisateurs">Rencontrer le collectif <Arrow diagonal /></Link><Link href="/contact">Écrire au collectif <Arrow diagonal /></Link></div></div></section>
    </div>
  )
}
