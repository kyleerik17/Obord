import LegalPage from '@/components/LegalPage'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('Politique de confidentialité', 'Comment O’BORD traite les informations liées aux comptes et réservations.')

export default function PrivacyPage() {
  return <LegalPage title="Politique de confidentialité" intro="Une explication claire des données utilisées pour le compte et les réservations O’BORD.">
    <section><h2>Données concernées</h2><p>Lorsque tu crées un compte ou demandes une réservation, le site traite ton nom, l’adresse e-mail associée à ton compte, le type de réservation (solo ou groupe), la taille du groupe et l’année de naissance de chaque participant. Aucune date de naissance complète ni pièce d’identité n’est demandée par le formulaire. Les données de réservation sont accessibles à l’équipe O’BORD pour gérer les demandes.</p></section>
    <section><h2>Finalités et prestataires</h2><p>Ces informations servent à gérer l’accès au compte, les réservations et la condition d’âge minimum de 21 ans fixée pour les rencontres. L’authentification et la base de données sont fournies par Supabase. Le nom de l’hébergeur du site et la localisation des données : <strong>[À COMPLÉTER]</strong>.</p></section>
    <section><h2>Conservation</h2><p>Durée de conservation des comptes et des réservations : <strong>[À COMPLÉTER]</strong>.</p></section>
    <section><h2>Demandes concernant tes données</h2><p>Pour demander l’accès, la rectification ou l’opposition au traitement de tes données, contacte O’BORD à <a href="mailto:angeerikkyle@gmail.com">angeerikkyle@gmail.com</a>. Les modalités et délais de traitement de ces demandes : <strong>[À COMPLÉTER]</strong>.</p></section>
    <section><h2>Contact</h2><p>O’BORD — Grand-Bassam, Côte d’Ivoire · <a href="tel:+2250768963019">+225 07 68 96 30 19</a> · <a href="mailto:angeerikkyle@gmail.com">angeerikkyle@gmail.com</a></p></section>
  </LegalPage>
}
