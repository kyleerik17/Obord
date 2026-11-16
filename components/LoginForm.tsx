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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'password', string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAuthError = (code: string | undefined, message: string, status: number, isLoginRequest: boolean) => {
    const details = message.toLowerCase()
    if (status === 429) {
      setError(t('login.rateLimited'))
    } else if (code === 'invalid_credentials' && isLoginRequest) {
      setFieldErrors({ email: t('login.emailCheck'), password: t('login.passwordCheck') })
    } else if (code === 'email_not_confirmed' || code === 'email_address_invalid' || code === 'email_exists' || code === 'user_already_exists' || details.includes('email')) {
      setFieldErrors({ email: code === 'email_not_confirmed' ? t('login.emailNotConfirmed') : code === 'email_exists' || code === 'user_already_exists' ? t('login.emailExists') : t('login.emailCheck') })
    } else if (code === 'weak_password' || code === 'password_too_weak' || details.includes('password')) {
      setFieldErrors({ password: t('login.weakPassword') })
    } else if (code === 'signup_disabled') {
      setError(t('login.signupDisabled'))
    } else if (code?.includes('redirect') || details.includes('redirect')) {
      setError(t('login.redirectNotAllowed'))
    } else if (status >= 500) {
      setError(t('login.unavailable'))
    } else {
      setError(t('login.requestFailed'))
    }
  }

  const changeMode = (nextMode: 'login' | 'signup' | 'reset') => {
    setMode(nextMode)
    setError('')
    setMessage('')
    setFieldErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setFieldErrors({})
    if (mode === 'signup' && !STRONG_PASSWORD_PATTERN.test(password)) {
      setFieldErrors({ password: `${t('login.passwordWrong')} ${locale === 'fr' ? STRONG_PASSWORD_HINT : t('login.passwordHint')}` })
      return
    }
    setIsSubmitting(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const requestedNext = new URLSearchParams(window.location.search).get('next')
      const hasSafeReturnPath = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\')

      if (mode === 'reset') {
        const callbackUrl = new URL('/auth/confirm', window.location.origin)
        callbackUrl.searchParams.set('next', '/login/update-password')
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: callbackUrl.toString(),
        })
        if (resetError) {
          handleAuthError(resetError.code, resetError.message, resetError.status, false)
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
            options: { data: { full_name: name } },
          })

      if (response.error) {
        handleAuthError(response.error.code, response.error.message, response.error.status, isLogin)
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
      } else if (response.data.user?.identities?.length === 0) {
        setFieldErrors({ email: t('login.emailExists') })
      } else {
        setError(t('login.signupNeedsConfig'))
      }
    } catch {
      setError(t('login.unavailable'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    setError('')
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      const callbackUrl = new URL('/auth/confirm', window.location.origin)
      const requestedNext = new URLSearchParams(window.location.search).get('next')
      const safeNext = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\') ? requestedNext : null
      if (safeNext) callbackUrl.searchParams.set('next', safeNext)
      const { error: oauthError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl.toString() },
      })
      if (oauthError) {
        const isProviderUnavailable = /provider.*(disabled|not enabled)|unsupported provider/i.test(oauthError.message)
        setError(isProviderUnavailable ? t('login.providerSetup') : t('login.unavailable'))
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
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((current) => ({ ...current, email: undefined })) }}
              autoComplete="email"
              maxLength={254}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              className="font-inter w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition"
                placeholder={locale === 'fr' ? 'toi@exemple.com' : 'you@example.com'}
              required
            />
            {fieldErrors.email && <p id="email-error" className="mt-2 text-sm text-red-700" role="alert">{fieldErrors.email}</p>}
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
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((current) => ({ ...current, password: undefined })) }}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={isLogin ? undefined : 12}
                maxLength={128}
                pattern={isLogin ? undefined : STRONG_PASSWORD_PATTERN.source}
                title={isLogin ? undefined : STRONG_PASSWORD_HINT}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={[!isLogin ? 'password-strength-help' : '', fieldErrors.password ? 'password-error' : ''].filter(Boolean).join(' ') || undefined}
                className="font-inter w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
              {mode === 'signup' && <p id="password-strength-help" className="mt-2 text-xs leading-relaxed text-gray-600">{locale === 'fr' ? STRONG_PASSWORD_HINT : t('login.passwordHint')}</p>}
              {fieldErrors.password && <p id="password-error" className="mt-2 text-sm text-red-700" role="alert">{fieldErrors.password}</p>}
            </div>
          )}

          {mode === 'login' && (
            <button type="button" onClick={() => changeMode('reset')} className="-mt-3 font-poppins text-sm font-semibold text-gray-700 hover:text-gray-950">
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

        {mode !== 'reset' && <div className="login-social-section">
          <div className="login-divider"><span>{t('login.orContinue')}</span></div>
          <div className="login-social-buttons">
            <button type="button" disabled={isSubmitting} onClick={() => void signInWithProvider('google')} className="login-social-button">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.09-1.92 3.27-4.75 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.28-1.93-6.15-4.53H2.16v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.16a11 11 0 0 0 0 9.9l3.69-2.84Z"/><path fill="#EA4335" d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.84 6.05l3.69 2.84C6.72 7.29 9.14 5.36 12 5.36Z"/></svg>
              {t('login.google')}
            </button>
            <button type="button" disabled={isSubmitting} onClick={() => void signInWithProvider('apple')} className="login-social-button">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M16.37 12.1c.02 2.3 2.02 3.07 2.04 3.08-.02.05-.32 1.1-1.05 2.18-.63.94-1.28 1.88-2.31 1.9-1.01.03-1.34-.61-2.5-.61-1.15 0-1.52.59-2.47.63-.99.04-1.75-1.02-2.39-1.96-1.3-1.9-2.3-5.38-.97-7.73.66-1.17 1.85-1.91 3.14-1.93.98-.02 1.9.67 2.5.67.59 0 1.71-.83 2.88-.71.49.02 1.87.2 2.76 1.5-.07.04-1.65.96-1.63 2.98ZM14.48 5.7c.52-.63.87-1.5.77-2.37-.75.03-1.66.5-2.2 1.13-.49.56-.92 1.44-.8 2.29.84.07 1.7-.42 2.23-1.05Z"/></svg>
              {t('login.apple')}
            </button>
          </div>
        </div>}

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
              <button type="button" onClick={() => changeMode('signup')} className="font-poppins text-gray-700 hover:text-gray-950 font-semibold">{t('login.createQuestion')}</button>
            </div>
          ) : (
            <button type="button" onClick={() => changeMode('login')} className="font-poppins text-gray-700 hover:text-gray-950 font-semibold">{t('login.return')}</button>
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
