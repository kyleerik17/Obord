'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function Navbar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [signOutError, setSignOutError] = useState('')

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
        setIsSignedIn(Boolean(session))
        setIsOrganizer(session?.user.app_metadata?.role === 'organizer')
      })
      unsubscribe = () => data.subscription.unsubscribe()
      void supabase.auth.getSession().then(({ data: sessionData }: { data: { session: Session | null } }) => {
        if (active) {
          setIsSignedIn(Boolean(sessionData.session))
          setIsOrganizer(sessionData.session?.user.app_metadata?.role === 'organizer')
        }
      })
    } catch {
      // Public pages remain available when Supabase has not been configured.
    }

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  async function signOut() {
    setSignOutError('')
    try {
      const { error } = await getSupabaseBrowserClient().auth.signOut()
      if (error) throw error
      setIsSignedIn(false)
      setIsOrganizer(false)
      setIsOpen(false)
      router.refresh()
    } catch {
      setSignOutError('La déconnexion n’a pas abouti. Réessaie.')
    }
  }

  return (
    <nav aria-label="Navigation principale" className="sticky top-0 z-50 border-b border-line bg-white/95 text-gray-950 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" aria-label="O'BORD — accueil" className="nav-brand font-display text-2xl font-semibold tracking-tight text-gray-950 hover:text-secondary">
            <Image src="/obord-logo.png" alt="" width={42} height={42} className="nav-brand-logo" />
            <span>O’BORD</span>
          </Link>

          <div className="hidden items-center space-x-7 md:flex">
            <Link href="/#ateliers" onClick={() => setIsOpen(false)} className="font-medium text-gray-700 hover:text-gray-950">Ateliers</Link>
            <Link href="/a-propos" onClick={() => setIsOpen(false)} className="font-medium text-gray-700 hover:text-gray-950">À propos</Link>
            <Link href="/#agenda" onClick={() => setIsOpen(false)} className="font-medium text-gray-700 hover:text-gray-950">Agenda</Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className="font-medium text-gray-700 hover:text-gray-950">Contact</Link>
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link href="/mon-espace" className="font-medium text-gray-700 hover:text-gray-950">Mon espace</Link>
                {isOrganizer && <Link href="/backoffice" className="font-medium text-gray-700 hover:text-gray-950">Espace équipe</Link>}
                <button type="button" onClick={signOut} className="rounded-full bg-gray-950 px-4 py-2 font-medium text-white hover:bg-secondary">Déconnexion</button>
              </div>
            ) : (
              <Link href="/login" className="nav-join-cta rounded-full bg-gray-950 px-4 py-2 font-medium text-white hover:bg-secondary">Rejoindre O’BORD <span aria-hidden="true">↗</span></Link>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-900"
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="mobile-navigation" className="nav-mobile-panel border-t border-line bg-white md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link onClick={() => setIsOpen(false)} href="/#ateliers" className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-950">Ateliers</Link>
            <Link onClick={() => setIsOpen(false)} href="/a-propos" className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-950">À propos</Link>
            <Link onClick={() => setIsOpen(false)} href="/#agenda" className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-950">Agenda</Link>
            <Link onClick={() => setIsOpen(false)} href="/contact" className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-950">Contact</Link>
            {isSignedIn ? (
              <>
                <Link onClick={() => setIsOpen(false)} href="/mon-espace" className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-950">Mon espace</Link>
                {isOrganizer && <Link onClick={() => setIsOpen(false)} href="/backoffice" className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-950">Espace équipe</Link>}
                <button type="button" onClick={signOut} className="block w-full rounded-lg bg-gray-950 px-3 py-2 text-white hover:bg-secondary">Déconnexion</button>
              </>
            ) : (
              <Link onClick={() => setIsOpen(false)} href="/login" className="nav-join-cta block rounded-lg bg-gray-950 px-3 py-2 text-center text-white hover:bg-secondary">Rejoindre O’BORD <span aria-hidden="true">↗</span></Link>
            )}
          </div>
        </div>
      )}
      {signOutError && <p role="status" className="sr-only">{signOutError}</p>}
    </nav>
  )
}
