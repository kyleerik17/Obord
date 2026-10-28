'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { STRONG_PASSWORD_HINT, STRONG_PASSWORD_PATTERN } from '@/lib/auth/password'

export default function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!STRONG_PASSWORD_PATTERN.test(password)) {
      setError(`Choisis un mot de passe plus robuste : ${STRONG_PASSWORD_HINT}`)
      return
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: updateError } = await getSupabaseBrowserClient().auth.updateUser({ password })
      if (updateError) {
        setError('La mise à jour n’a pas abouti. Demande un nouveau lien et réessaie.')
        return
      }
      router.replace('/')
      router.refresh()
    } catch {
      setError('Le service est momentanément indisponible. Réessaie dans quelques instants.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="soft-card w-full max-w-md rounded-xl p-8">
        <h1 className="mb-2 text-center font-poppins text-3xl font-semibold text-gray-950">Nouveau mot de passe</h1>
        <p className="mb-7 text-center font-inter text-sm text-gray-600">Choisis un nouveau mot de passe pour ton compte O’BORD.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="mb-2 block font-poppins text-sm font-medium text-gray-700">Nouveau mot de passe</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={12} maxLength={128} pattern={STRONG_PASSWORD_PATTERN.source} title={STRONG_PASSWORD_HINT} aria-describedby="password-strength-help" required className="w-full rounded-lg border border-gray-300 px-4 py-3 font-inter focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary" />
            <p id="password-strength-help" className="mt-2 text-xs leading-relaxed text-gray-600">{STRONG_PASSWORD_HINT}</p>
          </div>
          <div>
            <label htmlFor="confirmation" className="mb-2 block font-poppins text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
            <input id="confirmation" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={12} maxLength={128} pattern={STRONG_PASSWORD_PATTERN.source} title={STRONG_PASSWORD_HINT} required className="w-full rounded-lg border border-gray-300 px-4 py-3 font-inter focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary" />
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 font-inter text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-gray-950 py-3 font-poppins font-semibold text-white hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? 'Mise à jour…' : 'Enregistrer le mot de passe'}</button>
        </form>
        <p className="mt-6 text-center"><Link href="/login" className="font-inter text-sm text-gray-600 hover:text-gray-950">Retour à la connexion</Link></p>
      </div>
    </div>
  )
}
