'use client'

import { useActionState } from 'react'
import { submitContactMessage, type ContactFormState } from '@/app/contact/actions'
import { useLocale } from './LocaleProvider'

export default function ContactForm() {
  const { t } = useLocale()
  const initialState: ContactFormState = { status: 'idle', message: '' }
  const [state, action, pending] = useActionState(submitContactMessage, initialState)

  return (
    <form className="trust-card contact-form" action={action}>
      <h2>{t('contact.formTitle')}</h2>
      <label htmlFor="contact-name">{t('contact.name')}</label>
      <input id="contact-name" name="name" autoComplete="name" maxLength={80} required />
      <label htmlFor="contact-email">{t('contact.email')}</label>
      <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      <label htmlFor="contact-subject">{t('contact.subject')} <span>{t('contact.optional')}</span></label>
      <input id="contact-subject" name="subject" maxLength={120} />
      <label htmlFor="contact-message">{t('contact.messageLabel')}</label>
      <textarea id="contact-message" name="message" rows={5} minLength={10} maxLength={3000} required />
      <label className="contact-honeypot" aria-hidden="true">Ne pas remplir<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button-primary" type="submit" disabled={pending}>{pending ? t('contact.sending') : t('contact.send')}</button>
      <p className="trust-note">{t('contact.privacyNote')}</p>
      {state.message && <p className={state.status === 'error' ? 'contact-form-error' : 'trust-status'} role={state.status === 'error' ? 'alert' : 'status'}>{state.status === 'error' ? t('contact.error') : t('contact.success')}</p>}
    </form>
  )
}
