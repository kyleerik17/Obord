'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateReservationDecision(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=%2Fbackoffice')
  if (user.app_metadata?.role !== 'organizer') redirect('/backoffice?result=forbidden')

  const registrationId = String(formData.get('registrationId') ?? '')
  const decision = String(formData.get('decision') ?? '')

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(registrationId)) {
    redirect('/backoffice?result=invalid')
  }

  if (decision !== 'confirmed' && decision !== 'declined') {
    redirect('/backoffice?result=invalid')
  }

  const { data, error } = await supabase
    .from('event_registrations')
    .update({ reservation_status: decision })
    .eq('id', registrationId)
    .eq('reservation_status', 'pending')
    .select('id')
    .maybeSingle()

  if (error) redirect('/backoffice?result=error')
  if (!data) redirect('/backoffice?result=stale')

  revalidatePath('/backoffice')
  revalidatePath('/soirees')
  redirect(`/backoffice?result=${decision}`)
}

export async function saveReservationBirthYears(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=%2Fbackoffice')
  if (user.app_metadata?.role !== 'organizer') redirect('/backoffice?result=forbidden')

  const registrationId = String(formData.get('registrationId') ?? '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(registrationId)) {
    redirect('/backoffice?result=invalid-birth-years')
  }

  const { data: registration, error: readError } = await supabase
    .from('event_registrations')
    .select('group_size,reservation_status,event:events!inner(starts_at)')
    .eq('id', registrationId)
    .maybeSingle()

  if (readError || !registration || registration.reservation_status !== 'pending') {
    redirect('/backoffice?result=age-stale')
  }

  const birthYears = formData.getAll('attendeeBirthYear').map((value) => Number(value))
  const currentYear = new Date().getFullYear()
  const eventRelation = registration.event as unknown as { starts_at: string } | { starts_at: string }[]
  const event = Array.isArray(eventRelation) ? eventRelation[0] : eventRelation
  if (!event?.starts_at) redirect('/backoffice?result=age-stale')
  const eventDate = new Date(event.starts_at)
  const eventIsInAbidjan = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Abidjan', year: 'numeric', month: '2-digit', day: '2-digit' }).format(eventDate)
  const minimumBirthDate = new Date(`${eventIsInAbidjan}T00:00:00.000Z`)
  minimumBirthDate.setUTCFullYear(minimumBirthDate.getUTCFullYear() - 21)
  const maximumBirthYear = minimumBirthDate.getUTCFullYear()
  const meetsMinimumAge = (year: number) => year < maximumBirthYear || (year === maximumBirthYear && maximumBirthYear !== new Date(eventIsInAbidjan).getFullYear())
  if (birthYears.length !== registration.group_size || birthYears.some((year) => !Number.isInteger(year) || year < 1900 || year > currentYear - 21 || !meetsMinimumAge(year))) {
    redirect('/backoffice?result=invalid-birth-years')
  }

  const { data, error } = await supabase
    .from('event_registrations')
    .update({ attendee_birth_years: birthYears })
    .eq('id', registrationId)
    .eq('reservation_status', 'pending')
    .select('id')
    .maybeSingle()

  if (error) redirect('/backoffice?result=birth-year-save-error')
  if (!data) redirect('/backoffice?result=age-stale')

  revalidatePath('/backoffice')
  redirect('/backoffice?result=birth-years-saved')
}
