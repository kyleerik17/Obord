'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const isLogin = mode === 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const callbackUrl = new URL('/auth/confirm', window.location.origin)

      if (mode === 'reset') {
        callbackUrl.searchParams.set('next', '/login/update-password')
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callbackUrl.toString(),
        })
        if (resetError) {
          setError('La demande n’a pas abouti. Réessaie dans quelques instants.')
          return
        }
        setMessage('Si un compte correspond à cette adresse, un lien de réinitialisation sera envoyé.')
        return
      }

      const response = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: callbackUrl.toString(),
              data: { full_name: name },
            },
          })

      if (response.error) {
        setError('La demande n’a pas abouti. Vérifiez vos informations et réessayez.')
        return
      }

      if (response.data.session) {
        const requestedPath = new URLSearchParams(window.location.search).get('next')
        const hasSafeReturnPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') && !requestedPath.includes('\\')
        const returnPath = hasSafeReturnPath && requestedPath && !(requestedPath === '/' && response.data.user?.app_metadata?.role === 'organizer')
          ? requestedPath
          : response.data.user?.app_metadata?.role === 'organizer' ? '/backoffice' : '/'
        router.replace(returnPath)
        router.refresh()
      } else if (isLogin) {
        setError('La connexion n’a pas pu être établie. Vérifiez vos informations et réessayez.')
      } else {
        setMessage('Demande envoyée. Si une confirmation est requise, consultez votre boîte de réception.')
      }
    } catch {
      setError('Le service est momentanément indisponible. Réessayez dans quelques instants.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background">
      <div className="soft-card max-w-md w-full rounded-xl p-8">
        <div className="text-center mb-8">
          <h1 className="font-poppins text-4xl font-semibold tracking-tight text-gray-950 mb-2">O’BORD</h1>
          <p className="font-inter text-gray-600">
            {isLogin ? 'On reprend le fil ? Connecte-toi pour retrouver tes réservations.' : mode === 'signup' ? 'Un premier pas pour préparer ta prochaine rencontre.' : 'On t’aide à retrouver le chemin de ton compte.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="font-poppins block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-inter w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition"
                autoComplete="name"
                maxLength={80}
                placeholder="Votre nom"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="font-poppins block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={254}
              className="font-inter w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition"
              placeholder="votre@email.com"
              required
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="password" className="font-poppins block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={isLogin ? undefined : 10}
                maxLength={128}
                className="font-inter w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {mode === 'login' && (
            <button type="button" onClick={() => setMode('reset')} className="-mt-3 font-poppins text-sm font-semibold text-gray-700 hover:text-gray-950">
              Mot de passe oublié ?
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="font-poppins w-full rounded-lg bg-gray-950 py-3 font-semibold text-white hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'On prépare la suite…' : isLogin ? 'Retrouver mes réservations' : mode === 'signup' ? 'Créer mon compte O’BORD' : 'M’envoyer le lien'}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 font-inter text-sm text-green-700" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 font-inter text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 text-center">
          {isLogin ? (
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => setMode('signup')} className="font-poppins text-gray-700 hover:text-gray-950 font-semibold">Nouveau chez O’BORD ? Créer mon compte</button>
            </div>
          ) : (
            <button type="button" onClick={() => setMode('login')} className="font-poppins text-gray-700 hover:text-gray-950 font-semibold">Retour à la connexion</button>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="font-inter text-gray-600 hover:text-gray-950"
          >
            ← Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
