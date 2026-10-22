import Link from 'next/link'
import Image from 'next/image'
import { getUpcomingEvents } from '@/lib/data/events'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('La maison du chill', 'Le collectif O’BORD à Grand-Bassam : jeux, rencontres et sorties conviviales.')

const games = [
  { number: '01', title: 'La Table', tag: 'JEUX & CONVERSATIONS', text: 'Jeux de cartes, jeux de société et jeux de groupe : les règles servent surtout à lancer la conversation.', action: 'Je découvre les jeux', icon: '✳', color: 'lilac', shape: 'board' },
  { number: '02', title: 'Le Salon', tag: 'DISCUSSIONS & RENCONTRES', text: 'Un endroit pour échanger, faire connaissance et laisser la conversation prendre son chemin.', action: 'Je viens papoter', icon: '✦', color: 'coral', shape: 'dice' },
  { number: '03', title: 'Le Terrain', tag: 'ACTIVITÉ & MOUVEMENT', text: 'Des activités dynamiques et des défis à partager, toujours avec le plaisir d’être ensemble.', action: 'Je relève le défi', icon: '◈', color: 'yellow', shape: 'wood' },
  { number: '04', title: 'Le Feu & la Plage', tag: 'PLEIN AIR & LÂCHER-PRISE', text: 'Musique, discussions, quelque chose à manger et à boire : on profite du bord de mer ensemble.', action: 'Je file au grand air', icon: '⌘', color: 'blue', shape: 'escape' },
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

function Ticket({ title, day, month, time, index }: { title: string; day: string; month: string; time: string; index: number }) {
  return (
    <article className="event-ticket" style={{ animationDelay: `${index * 120}ms` }}>
      <div className="event-date"><span>{month}</span><strong>{day}</strong></div>
      <div className="event-copy"><span className="event-label">RENDEZ-VOUS O’BORD</span><h3>{title}</h3><p>⌁ &nbsp; {time}</p></div>
      <Link className="ticket-arrow" href="/soirees" aria-label={`Découvrir ${title}`}><span>Découvrir</span><Arrow diagonal /></Link>
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
          <h1>Et si ce soir,<br />on faisait<br /><span className="hero-last">connaissance<span className="hero-period">?</span></span></h1>
          <div className="hero-bottom">
            <div><span className="hero-tag">L’ACTIVITÉ EST LE PRÉTEXTE <span>✳</span></span><p>Viens comme tu es. Tu peux jouer, discuter,<br />ou simplement voir où le moment te mène.</p></div>
            <div className="hero-actions"><Link href="#ateliers" data-no-progress="true" className="button-primary group">Allez, je découvre <Arrow diagonal /></Link><Link href="/soirees" className="button-quiet">Voir les dates <Arrow /></Link></div>
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
      <section className="agenda-section section-wrap" id="agenda" data-reveal><div className="agenda-head"><div><p className="eyebrow eyebrow-dark"><span>⌁</span> LES RENCONTRES O’BORD</p><h2>On se voit <span>bientôt ?</span></h2></div><Link className="agenda-all group" href="/soirees">Allez, je choisis ma rencontre <Arrow diagonal /></Link></div>{upcomingEvents.length ? <><div className="event-list">{upcomingEvents.map((event, index) => { const date = new Date(`${event.date}T12:00:00`); return <Ticket key={event.id} index={index} title={event.title} day={new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(date)} month={new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '').toUpperCase()} time={event.time} /> })}</div><div className="agenda-bottom"><span><span className="live-dot" /> LES RENCONTRES O’BORD</span><Link href="/soirees" className="button-primary group">Je veux voir le programme <Arrow diagonal /></Link></div></> : <div className="agenda-empty"><span aria-hidden="true">☀</span><div><h3>{scheduleError ? 'Les rencontres ne sont pas disponibles pour le moment.' : 'Aucune nouvelle date annoncée pour le moment.'}</h3><p>{scheduleError ? 'Un souci technique empêche le chargement de l’agenda. Réessaie un peu plus tard.' : 'Les informations des prochaines rencontres seront affichées ici quand elles seront confirmées.'}</p><Link href={scheduleError ? '/contact' : '/videos'}>{scheduleError ? 'Écrire à l’équipe' : 'Revoir les souvenirs O’BORD'} <Arrow diagonal /></Link></div></div>}</section>

      {/* A direct invitation leads into the existing organizer contact and video pages. */}
      <section className="about-section" id="collectif" data-reveal><div className="about-inner"><div className="about-stamp" aria-hidden="true"><span>FAIRE GROUPE</span><b>O’B<br />ORD</b><span>FAIRE JEU ✳</span></div><div className="about-copy"><p className="eyebrow"><span>✳</span> LA MAISON DU CHILL</p><h2>Un endroit où<br />arriver <span>comme on est.</span></h2><p>À Grand-Bassam, O’BORD propose des occasions de se retrouver autour de jeux, d’activités et de sorties. Chacun peut participer, observer, jouer ou discuter à son rythme, dans une ambiance détendue.</p><div className="about-actions"><Link className="button-primary group" href="/organisateurs">Faire connaissance avec l’équipe <Arrow diagonal /></Link><Link className="button-quiet" href="/videos">Voir l’ambiance en vidéo <Arrow /></Link></div></div></div><div className="about-scribble" aria-hidden="true">viens comme tu es <span>↗</span></div></section>

      <section className="newsletter-section" id="contact" data-reveal><div className="newsletter-inner"><div><p className="eyebrow"><span>✳</span> ON GARDE LE LIEN</p><h2>Une question ?<br /><span>On est là.</span></h2><p>Tu veux en savoir plus avant de venir ? Écris-nous, on prendra le temps de te répondre.</p></div><div className="home-contact-card"><span>Un premier bonjour, ça commence ici.</span><Link href="/organisateurs">Faire connaissance avec l’équipe <Arrow diagonal /></Link><Link href="/contact">Écrire au collectif <Arrow diagonal /></Link></div></div></section>
    </div>
  )
}
