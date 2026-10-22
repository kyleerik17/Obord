import LegalPage from '@/components/LegalPage'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('Mentions légales', 'Éditeur et informations de contact du site O’BORD.')

export default function LegalNoticesPage() {
  return <LegalPage title="Mentions légales" intro="Les informations d’édition et de contact du site O’BORD.">
    <section><h2>Éditeur du site</h2><dl><dt>Nom</dt><dd>O’BORD</dd><dt>Siège</dt><dd>Grand-Bassam, Côte d’Ivoire</dd><dt>Téléphone / WhatsApp</dt><dd><a href="tel:+2250768963019">+225 07 68 96 30 19</a></dd><dt>E-mail</dt><dd><a href="mailto:angeerikkyle@gmail.com">angeerikkyle@gmail.com</a></dd></dl></section>
    <section><h2>Direction de publication</h2><p><strong>[À COMPLÉTER]</strong></p></section>
    <section><h2>Hébergement</h2><p>Hébergeur : <strong>[À COMPLÉTER]</strong></p><p>Adresse et coordonnées de l’hébergeur : <strong>[À COMPLÉTER]</strong></p></section>
  </LegalPage>
}
