import Link from 'next/link'
import Image from 'next/image'
import { organizers } from '@/lib/data/site'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('À propos', 'Découvre l’esprit, la mission et les organisateurs du collectif O’BORD à Grand-Bassam.')

const values = [
  { title: 'La rencontre sans pression', text: 'Chacun participe à son rythme : jouer, discuter, observer ou simplement profiter du moment.' },
  { title: 'Le jeu comme prétexte', text: 'Jeux de société, activités et sorties ouvrent la porte aux échanges et aux nouvelles rencontres.' },
  { title: 'La convivialité', text: 'O’BORD imagine des moments à partager dans un cadre chaleureux et accueillant.' },
]

export default function AboutPage() {
  return (
    <div className="trust-page">
      <header className="trust-hero">
        <p className="eyebrow eyebrow-dark">✳ LA MAISON DU CHILL</p>
        <h1>À propos<br /><span>d’O’BORD.</span></h1>
        <p>Un collectif de Grand-Bassam qui crée des occasions de se retrouver, de jouer et de faire connaissance, tout simplement.</p>
      </header>

      <div className="trust-content">
        <section className="trust-card trust-story">
          <p className="event-practical-label">NOTRE ESPRIT</p>
          <h2>Se retrouver, tout simplement.</h2>
          <p>À Grand-Bassam, O’BORD propose des jeux, des activités et des sorties pour prendre le temps de se rencontrer et de partager un moment ensemble.</p>
          <p>Chacun peut participer à son rythme : jouer, discuter ou simplement profiter de la rencontre.</p>
        </section>

        <section className="trust-values" aria-labelledby="values-title">
          <div className="trust-section-heading"><p className="eyebrow eyebrow-dark">✦ CE QUI NOUS RASSEMBLE</p><h2 id="values-title">L’esprit O’BORD</h2></div>
          <div className="trust-grid trust-grid-three">
            {values.map((value) => <article className="trust-card" key={value.title}><span className="trust-card-mark" aria-hidden="true">✳</span><h3>{value.title}</h3><p>{value.text}</p></article>)}
          </div>
        </section>

        <section className="trust-team" aria-labelledby="team-title">
          <div className="trust-section-heading"><p className="eyebrow eyebrow-dark">LES PERSONNES DERRIÈRE LE COLLECTIF</p><h2 id="team-title">L’équipe O’BORD</h2><p>Voici les organisateurs du collectif.</p></div>
          <div className="trust-grid trust-grid-three">
            {organizers.map((person) => (
              <article className="trust-card trust-person" key={person.name}>
                <div className="trust-photo-placeholder">{person.photo ? <Image src={person.photo} alt={`Portrait de ${person.name}`} fill sizes="(max-width: 760px) 100vw, 30vw" className="trust-person-photo" /> : <span>Photo réelle<br />[À COMPLÉTER]</span>}</div>
                <h3>{person.name}</h3><p>{person.role}</p>
              </article>
            ))}
          </div>
        </section>
        <div className="trust-page-actions"><Link href="/soirees" className="button-primary">Vivre une rencontre O’BORD <span aria-hidden="true">↗</span></Link><Link href="/contact" className="button-quiet trust-quiet-link">Poser une question à l’équipe <span aria-hidden="true">→</span></Link></div>
      </div>
    </div>
  )
}
