import Image from 'next/image'
import Link from 'next/link'

const quickLinks = [
  { href: '/a-propos', label: 'À propos' },
  { href: '/blog', label: 'Le blog' },
  { href: '/#ateliers', label: 'Ateliers' },
  { href: '/soirees', label: 'Agenda' },
  { href: '/faq', label: 'Questions fréquentes' },
  { href: '/mon-espace', label: 'Mon espace' },
  { href: '/contact', label: 'Contact' },
  { href: '/backoffice', label: 'Espace équipe' },
]

const legalLinks = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/conditions', label: 'Conditions de réservation' },
  { href: '/confidentialite', label: 'Confidentialité' },
  { href: '/cookies', label: 'Cookies' },
]

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <Link href="/" aria-label="O’BORD, accueil"><Image src="/obord-logo.png" alt="Logo O’BORD" width={64} height={64} /></Link>
          <p className="site-footer-title">O’BORD — La maison du chill</p>
          <p>Un collectif de Grand-Bassam qui crée des occasions de jouer et de se retrouver.</p>
        </div>
        <nav aria-label="Liens rapides" className="site-footer-column"><h2>Découvrir</h2>{quickLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
        <nav aria-label="Liens légaux" className="site-footer-column"><h2>Informations</h2>{legalLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
        <div className="site-footer-column site-footer-contact"><h2>Nous joindre</h2><a href="tel:+2250768963019">+225 07 68 96 30 19</a><a href="https://wa.me/2250768963019" target="_blank" rel="noopener noreferrer">WhatsApp</a><a href="mailto:angeerikkyle@gmail.com">angeerikkyle@gmail.com</a><p>Grand-Bassam, Côte d’Ivoire</p><a href="https://www.tiktok.com/@obord_777" target="_blank" rel="noopener noreferrer">♪ TikTok · @obord_777</a></div>
      </div>
      <div className="site-footer-bottom"><span>© O’BORD</span><span>Grand-Bassam, Côte d’Ivoire</span></div>
    </footer>
  )
}
