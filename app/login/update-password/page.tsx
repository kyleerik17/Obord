import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pageMetadata } from '@/lib/metadata'
import UpdatePasswordForm from './update-password-form'

export const metadata = pageMetadata('Nouveau mot de passe', 'Mets à jour le mot de passe de ton compte O’BORD.')

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) redirect('/login')

  return <UpdatePasswordForm />
}
