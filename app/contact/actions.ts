'use server'

import { createClient } from '@/lib/supabase/server'

export type ContactFormState = { status: 'idle' | 'success' | 'error'; message: string }

export async function submitContactMessage(_previous: ContactFormState, formData: FormData): Promise<ContactFormState> {
  // Quietly accept honeypot submissions so bots do not learn the field is monitored.
  if (String(formData.get('website') ?? '').trim()) {
    return { status: 'success', message: 'Ton message a bien été transmis au collectif.' }
  }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const subject = String(formData.get('subject') ?? '').trim()
  const body = String(formData.get('message') ?? '').trim()
  if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
    || subject.length > 120 || body.length < 10 || body.length > 3000) {
    return { status: 'error', message: 'Vérifie les champs : le message doit contenir entre 10 et 3 000 caractères.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('contact_messages').insert({ name, email, subject: subject || null, body })
  if (error) {
    if (error.message.includes('contact_message_rate_limited')) {
      return { status: 'error', message: 'Tu as déjà envoyé plusieurs messages récemment. Réessaie dans un moment.' }
    }
    console.error('[contact] Message could not be saved', { code: error.code })
    return { status: 'error', message: 'Le message n’a pas pu être transmis. Réessaie ou écris-nous directement par WhatsApp.' }
  }

  return { status: 'success', message: 'Ton message est bien arrivé chez O’BORD. On revient vers toi dès que possible.' }
}
