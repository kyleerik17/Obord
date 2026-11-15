'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from './LocaleProvider'
import { socialLinks } from '@/lib/data/site'

const quickLinks = [
  { href: '/a-propos', label: 'À propos' },
  { href: '/blog', label: 'Le blog' },
  { href: '/#ateliers', label: 'Ateliers' },
  { href: '/soirees', label: 'Agenda' },
  { href: '/faq', label: 'Questions fréquentes' },
  { href: '/mon-espace', label: 'Mon espace' },
  { href: '/contact', label: 'Contact' },
]

const legalLinks = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/conditions', label: 'Conditions de réservation' },
  { href: '/confidentialite', label: 'Confidentialité' },
  { href: '/cookies', label: 'Cookies' },
]

export default function SiteFooter() {
  const { t } = useLocale()
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <Link href="/" aria-label="O’BORD, accueil"><Image src="/obord-logo.png" alt="Logo O’BORD" width={64} height={64} /></Link>
          <p className="site-footer-title">O’BORD</p>
          <p>{t('footer.tagline')}</p>
        </div>
        <nav aria-label={t('footer.explore')} className="site-footer-column"><h2>{t('footer.explore')}</h2>{quickLinks.map((link) => <Link key={link.href} href={link.href}>{link.href === '/a-propos' ? t('nav.about') : link.href === '/blog' ? t('footer.blog') : link.href.includes('ateliers') ? t('nav.activities') : link.href === '/soirees' ? t('nav.agenda') : link.href === '/faq' ? t('footer.questions') : link.href === '/contact' ? t('footer.contact') : link.href === '/mon-espace' ? t('nav.account') : link.label}</Link>)}</nav>
        <nav aria-label={t('footer.information')} className="site-footer-column"><h2>{t('footer.information')}</h2>{legalLinks.map((link) => <Link key={link.href} href={link.href}>{link.href === '/mentions-legales' ? t('footer.legal') : link.href === '/conditions' ? t('footer.terms') : link.href === '/confidentialite' ? t('footer.privacy') : t('footer.cookies')}</Link>)}</nav>
        <div className="site-footer-column site-footer-contact"><h2>{t('footer.contact')}</h2><a href="tel:+2250768963019">+225 07 68 96 30 19</a><a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a><a href="mailto:collectifchill@gmail.com">collectifchill@gmail.com</a><p>{t('footer.city')}</p><a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">Instagram · @obord_777</a></div>
      </div>
      <div className="site-footer-bottom"><span>© O’BORD</span><span>{t('footer.city')}</span></div>
    </footer>
  )
}
