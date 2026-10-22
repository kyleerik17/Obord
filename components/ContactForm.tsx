'use client'

import { useState, type FormEvent } from 'react'

export default function ContactForm() {
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const subject = String(form.get('subject') ?? '').trim()
    const body = String(form.get('message') ?? '').trim()
    const mailto = new URL('mailto:angeerikkyle@gmail.com')
    mailto.searchParams.set('subject', subject || `Message du site O’BORD — ${name}`)
    mailto.searchParams.set('body', `Nom : ${name}\nE-mail : ${email}\n\n${body}`)
    window.location.href = mailto.toString()
    setMessage('Ton application de messagerie va s’ouvrir avec le message préparé.')
  }

  return (
    <form className="trust-card contact-form" onSubmit={handleSubmit}>
      <h2>Un petit mot pour l’équipe ?</h2>
      <label htmlFor="contact-name">Ton nom</label>
      <input id="contact-name" name="name" autoComplete="name" maxLength={80} required />
      <label htmlFor="contact-email">Ton e-mail</label>
      <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      <label htmlFor="contact-subject">Sujet <span>[facultatif]</span></label>
      <input id="contact-subject" name="subject" maxLength={120} />
      <label htmlFor="contact-message">Ton message</label>
      <textarea id="contact-message" name="message" rows={5} maxLength={3000} required />
      <button className="button-primary" type="submit">Préparer mon message <span aria-hidden="true">↗</span></button>
      <p className="trust-note">Ce formulaire prépare un e-mail dans ta messagerie. Il ne transmet pas automatiquement tes informations.</p>
      {message && <p className="trust-status" role="status">{message}</p>}
    </form>
  )
}
