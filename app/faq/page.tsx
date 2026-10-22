import Link from 'next/link'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('FAQ', 'Réponses aux questions sur les rencontres et les réservations O’BORD.')

const questions = [
  { q: 'Comment réserver une rencontre ?', a: <>Connecte-toi, ouvre la page <Link href="/soirees">Soirées</Link>, puis choisis une réservation solo ou en groupe. La demande reste en attente jusqu’à la confirmation de l’équipe.</> },
  { q: 'Puis-je réserver seul·e ou en groupe ?', a: 'Oui. La réservation propose les deux options. Pour un groupe, la personne référente indique le nombre total de participants.' },
  { q: 'Quel âge faut-il avoir pour participer ?', a: 'Les rencontres sont réservées aux personnes de 21 ans et plus. Pour une réservation en groupe, l’âge de chaque personne est demandé.' },
  { q: 'Quand recevrai-je la confirmation et le point de rencontre ?', a: 'L’équipe O’BORD confirme la demande. Le point précis de rencontre est communiqué après cette confirmation.' },
  { q: 'Où se déroule la rencontre ?', a: 'La ville et les informations disponibles sont indiquées sur la page de la rencontre. Le point précis de rendez-vous est transmis après confirmation de la réservation.' },
  { q: 'Où trouver les informations pratiques d’une sortie ?', a: <>Consulte la page de la rencontre choisie dans <Link href="/soirees">l’agenda</Link>. Pour une précision, <Link href="/contact">écris à l’équipe</Link>.</> },
  { q: 'Ma réservation est confirmée, que dois-je faire ?', a: <>Aucune confirmation supplémentaire n’est demandée. Pour signaler un changement, <Link href="/contact">préviens l’équipe</Link> dès que possible.</> },
]

export default function FAQPage() {
  return (
    <div className="trust-page">
      <header className="trust-hero">
        <p className="eyebrow eyebrow-dark">✳ LES RÉPONSES SIMPLES</p>
        <h1>Questions<br /><span>fréquentes.</span></h1>
        <p>Les informations pratiques sur les rencontres et les réservations O’BORD.</p>
      </header>
      <div className="trust-content faq-list">
        {questions.map(({ q, a }) => <details className="trust-card faq-item" key={q}><summary>{q}<span aria-hidden="true">＋</span></summary><div className="faq-answer"><p>{a}</p></div></details>)}
        <p className="trust-note">Une question qui n’est pas ici ? <Link href="/contact">Écris-nous</Link>.</p>
      </div>
    </div>
  )
}
