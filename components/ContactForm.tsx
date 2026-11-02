'use client'

import { useActionState } from 'react'
import { submitContactMessage, type ContactFormState } from '@/app/contact/actions'

export default function ContactForm() {
  const initialState: ContactFormState = { status: 'idle', message: '' }
  const [state, action, pending] = useActionState(submitContactMessage, initialState)

  return (
    <form className="trust-card contact-form" action={action}>
      <h2>Un petit mot pour l’équipe ?</h2>
      <label htmlFor="contact-name">Ton nom</label>
      <input id="contact-name" name="name" autoComplete="name" maxLength={80} required />
      <label htmlFor="contact-email">Ton e-mail</label>
      <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      <label htmlFor="contact-subject">Sujet <span>[facultatif]</span></label>
      <input id="contact-subject" name="subject" maxLength={120} />
      <label htmlFor="contact-message">Ton message</label>
      <textarea id="contact-message" name="message" rows={5} minLength={10} maxLength={3000} required />
      <label className="contact-honeypot" aria-hidden="true">Ne pas remplir<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button-primary" type="submit" disabled={pending}>{pending ? 'Envoi…' : 'Envoyer mon message'} <span aria-hidden="true">↗</span></button>
      <p className="trust-note">Ton message est transmis à l’équipe O’BORD et consultable dans son espace de gestion.</p>
      {state.message && <p className={state.status === 'error' ? 'contact-form-error' : 'trust-status'} role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</p>}
    </form>
  )
}
