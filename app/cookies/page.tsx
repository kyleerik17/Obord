import LegalPage from '@/components/LegalPage'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('Politique de cookies', 'Informations sur les cookies de session utilisés par O’BORD.')

export default function CookiesPage() {
  return <LegalPage title="Politique de cookies" intro="Voici les cookies nécessaires au fonctionnement des comptes O’BORD.">
    <section><h2>Cookies de session</h2><p>Le site utilise des cookies de session liés à Supabase pour maintenir la connexion et sécuriser l’accès au compte et aux réservations.</p></section>
    <section><h2>Mesure d’audience et publicité</h2><p>Aucun outil de mesure d’audience ou de publicité n’est configuré dans le code du site actuellement. Si cela change, cette page sera mise à jour avant leur activation.</p></section>
    <section><h2>Gérer les cookies</h2><p>Tu peux supprimer les cookies dans les paramètres de ton navigateur. Cela peut te déconnecter de ton compte.</p></section>
  </LegalPage>
}
