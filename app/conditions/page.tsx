import LegalPage from '@/components/LegalPage'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('Conditions d’utilisation et de réservation', 'Conditions d’utilisation du site et fonctionnement des réservations aux rencontres O’BORD.')

export default function ConditionsPage() {
  return <LegalPage title="Conditions d’utilisation et de réservation" intro="Quelques repères pour utiliser le site et réserver une rencontre O’BORD.">
    <section><h2>Utilisation du site</h2><p>Le site présente le collectif O’BORD et ses rencontres. Les informations d’un événement publié sont consultables sur sa page. Une réservation en ligne nécessite un compte et reste en attente jusqu’à sa confirmation par l’équipe.</p></section>
    <section><h2>Réservations</h2><p>La demande se fait en solo ou en groupe depuis la page de la rencontre. Elle reste en attente jusqu’à sa confirmation par l’équipe O’BORD. Une fois confirmée, aucune démarche supplémentaire n’est demandée au participant.</p></section>
    <section><h2>Âge minimum</h2><p>La participation est réservée aux personnes âgées de 21 ans ou plus. Pour une demande en groupe, chaque participant doit remplir cette condition.</p></section>
    <section><h2>Informations pratiques</h2><p>Les détails propres à chaque rencontre figurent sur sa page. Le point précis de rendez-vous est communiqué après confirmation. Pour signaler un changement ou poser une question, contacte l’équipe.</p></section>
    <section><h2>Contact</h2><p>Pour toute question, écris à <a href="mailto:angeerikkyle@gmail.com">angeerikkyle@gmail.com</a> ou appelle le <a href="tel:+2250768963019">+225 07 68 96 30 19</a>.</p></section>
  </LegalPage>
}
