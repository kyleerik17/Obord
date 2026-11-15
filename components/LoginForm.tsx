'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { STRONG_PASSWORD_HINT, STRONG_PASSWORD_PATTERN } from '@/lib/auth/password'
import { useLocale } from '@/components/LocaleProvider'

export default function LoginForm({ initialMode, authFailed }: { initialMode: 'login' | 'signup'; authFailed: boolean }) {
  const { t, locale } = useLocale()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode)
  const isLogin = mode === 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(authFailed ? t('login.callbackFailed') : '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (mode === 'signup' && !STRONG_PASSWORD_PATTERN.test(password)) {
      setError(`${t('login.passwordWrong')} ${locale === 'fr' ? STRONG_PASSWORD_HINT : t('login.passwordHint')}`)
      return
    }
    setIsSubmitting(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const callbackUrl = new URL('/auth/confirm', window.location.origin)
      const requestedNext = new URLSearchParams(window.location.search).get('next')
      const hasSafeReturnPath = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\')
      if (mode === 'signup' && hasSafeReturnPath && requestedNext) callbackUrl.searchParams.set('next', requestedNext)

      if (mode === 'reset') {
        callbackUrl.searchParams.set('next', '/login/update-password')
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: callbackUrl.toString(),
        })
        if (resetError) {
          setError(t('login.requestFailed'))
          return
        }
        setMessage(t('login.resetSent'))
        return
      }

      const response = isLogin
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: callbackUrl.toString(),
              data: { full_name: name },
            },
          })

      if (response.error) {
        if (isLogin && response.error.code === 'email_not_confirmed') {
          setError(t('login.emailNotConfirmed'))
        } else if (isLogin && response.error.code === 'invalid_credentials') {
          setError(t('login.badCredentials'))
        } else if (response.error.status >= 500) {
          setError(t('login.unavailable'))
        } else {
          setError(t('login.requestFailed'))
        }
        return
      }

      if (response.data.session) {
        const requestedPath = requestedNext
        const returnPath = hasSafeReturnPath && requestedPath && !(requestedPath === '/' && response.data.user?.app_metadata?.role === 'organizer')
          ? requestedPath
          : response.data.user?.app_metadata?.role === 'organizer' ? '/backoffice' : '/mon-espace'
        router.replace(returnPath)
        router.refresh()
      } else if (isLogin) {
        setError(t('login.loginFailed'))
      } else {
        setMessage(t('login.signupSent'))
      }
    } catch {
      setError(t('login.unavailable'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="text-center mb-8">
          <h1 className="font-poppins text-4xl font-semibold tracking-tight text-gray-950 mb-2">{t('login.title')}</h1>
          <p className="font-inter text-gray-600">
            {isLogin ? t('login.intro') : mode === 'signup' ? t('login.signupIntro') : t('login.resetIntro')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="font-poppins block text-sm font-medium text-gray-700 mb-2">
                {t('login.name')}
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
                {t('login.email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={254}
              className="font-inter w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition"
                placeholder={locale === 'fr' ? 'toi@exemple.com' : 'you@example.com'}
              required
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="password" className="font-poppins block text-sm font-medium text-gray-700 mb-2">
                {t('login.password')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={isLogin ? undefined : 12}
                maxLength={128}
                pattern={isLogin ? undefined : STRONG_PASSWORD_PATTERN.source}
                title={isLogin ? undefined : STRONG_PASSWORD_HINT}
                aria-describedby={isLogin ? undefined : 'password-strength-help'}
                className="font-inter w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
              {mode === 'signup' && <p id="password-strength-help" className="mt-2 text-xs leading-relaxed text-gray-600">{locale === 'fr' ? STRONG_PASSWORD_HINT : t('login.passwordHint')}</p>}
            </div>
          )}

          {mode === 'login' && (
            <button type="button" onClick={() => setMode('reset')} className="-mt-3 font-poppins text-sm font-semibold text-gray-700 hover:text-gray-950">
              {t('login.forgot')}
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="font-poppins w-full rounded-lg bg-gray-950 py-3 font-semibold text-white hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? t('common.loading') : isLogin ? t('login.submit') : mode === 'signup' ? t('login.signup') : t('login.reset')}
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
              <button type="button" onClick={() => setMode('signup')} className="font-poppins text-gray-700 hover:text-gray-950 font-semibold">{t('login.createQuestion')}</button>
            </div>
          ) : (
            <button type="button" onClick={() => setMode('login')} className="font-poppins text-gray-700 hover:text-gray-950 font-semibold">{t('login.return')}</button>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="font-inter text-gray-600 hover:text-gray-950"
          >
            {t('common.home')}
          </Link>
        </div>
      </div>
    </div>
  )
}
