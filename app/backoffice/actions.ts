'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { maximumBirthYearForEvent } from '@/lib/age'

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
  const eventRelation = registration.event as unknown as { starts_at: string } | { starts_at: string }[]
  const event = Array.isArray(eventRelation) ? eventRelation[0] : eventRelation
  if (!event?.starts_at) redirect('/backoffice?result=age-stale')
  const maximumBirthYear = maximumBirthYearForEvent(event.starts_at)
  if (birthYears.length !== registration.group_size || birthYears.some((year) => !Number.isInteger(year) || year < 1900 || year > maximumBirthYear)) {
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

export async function saveEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=%2Fbackoffice')
  if (user.app_metadata?.role !== 'organizer') redirect('/backoffice?result=forbidden')

  const eventId = String(formData.get('eventId') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const eventType = String(formData.get('eventType') ?? '')
  const startDate = String(formData.get('startDate') ?? '')
  const startTime = String(formData.get('startTime') ?? '')
  const endDate = String(formData.get('endDate') ?? '')
  const endTime = String(formData.get('endTime') ?? '')
  const description = String(formData.get('description') ?? '').trim()
  const venueArea = String(formData.get('venueArea') ?? '').trim()
  const venueName = String(formData.get('venueName') ?? '').trim()
  const participationDetails = String(formData.get('participationDetails') ?? '').trim()
  const externalRegistrationUrl = String(formData.get('externalRegistrationUrl') ?? '').trim()
  const capacityInput = String(formData.get('capacity') ?? '').trim()
  const externalReservedInput = String(formData.get('externalReservedCount') ?? '0').trim()
  const status = String(formData.get('status') ?? '')
  const isUpdate = eventId.length > 0

  if ((isUpdate && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId))
    || title.length < 3 || title.length > 120
    || !['sortie', 'atelier'].includes(eventType)
    || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{2}:\d{2}$/.test(startTime)
    || (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
    || (endTime && !/^\d{2}:\d{2}$/.test(endTime))
    || Boolean(endDate) !== Boolean(endTime)
    || description.length < 1 || description.length > 3000
    || venueArea.length < 1 || venueArea.length > 120
    || venueName.length > 200 || participationDetails.length > 500
    || externalRegistrationUrl.length > 500
    || (capacityInput && (!/^\d+$/.test(capacityInput) || Number(capacityInput) < 1 || Number(capacityInput) > 10000))
    || !/^\d+$/.test(externalReservedInput) || Number(externalReservedInput) > 10000
    || !['draft', 'published', 'cancelled', 'completed'].includes(status)) {
    redirect('/backoffice?result=event-invalid')
  }

  if (externalRegistrationUrl) {
    try {
      const registrationUrl = new URL(externalRegistrationUrl)
      if (registrationUrl.protocol !== 'https:' || !['tikko.ci', 'www.tikko.ci'].includes(registrationUrl.hostname)
        || registrationUrl.username || registrationUrl.password) redirect('/backoffice?result=event-invalid')
    } catch {
      redirect('/backoffice?result=event-invalid')
    }
  }

  const startsAt = new Date(`${startDate}T${startTime}:00Z`)
  const endsAt = endDate && endTime ? new Date(`${endDate}T${endTime}:00Z`) : null
  if (!Number.isFinite(startsAt.getTime())
    || startsAt.toISOString().slice(0, 10) !== startDate
    || startsAt.toISOString().slice(11, 16) !== startTime
    || (endsAt && (!Number.isFinite(endsAt.getTime()) || endsAt <= startsAt || endsAt.toISOString().slice(0, 10) !== endDate || endsAt.toISOString().slice(11, 16) !== endTime))
    || (status === 'published' && startsAt <= new Date())) {
    redirect('/backoffice?result=event-invalid')
  }

  const values = {
    title,
    event_type: eventType,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt?.toISOString() ?? null,
    description,
    venue_area: venueArea,
    venue_name: venueName || null,
    participation_details: participationDetails || null,
    external_registration_url: externalRegistrationUrl || null,
    capacity: capacityInput ? Number(capacityInput) : null,
    external_reserved_count: Number(externalReservedInput),
    status,
  }

  const result = isUpdate
    ? await supabase.from('events').update(values).eq('id', eventId).select('id').maybeSingle()
    : await supabase.from('events').insert({ ...values, created_by: user.id }).select('id').single()

  if (result.error) redirect('/backoffice?result=event-save-error')
  if (!result.data) redirect('/backoffice?result=event-stale')
  revalidatePath('/backoffice')
  revalidatePath('/soirees')
  revalidatePath('/')
  redirect(`/backoffice?result=${isUpdate ? 'event-saved' : 'event-created'}`)
}

export async function updateWaitlistStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=%2Fbackoffice')
  if (user.app_metadata?.role !== 'organizer') redirect('/backoffice?result=forbidden')

  const waitlistId = String(formData.get('waitlistId') ?? '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(waitlistId)) {
    redirect('/backoffice?result=waitlist-invalid')
  }
  const { data, error } = await supabase.from('event_waitlist').update({ status: 'contacted' })
    .eq('id', waitlistId).eq('status', 'waiting').select('id').maybeSingle()
  if (error) redirect('/backoffice?result=waitlist-error')
  if (!data) redirect('/backoffice?result=waitlist-stale')
  revalidatePath('/backoffice')
  revalidatePath('/mon-espace')
  redirect('/backoffice?result=waitlist-contacted')
}

export async function markContactMessageRead(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=%2Fbackoffice')
  if (user.app_metadata?.role !== 'organizer') redirect('/backoffice?result=forbidden')

  const messageId = String(formData.get('messageId') ?? '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(messageId)) {
    redirect('/backoffice?result=message-invalid')
  }
  const { error } = await supabase.from('contact_messages')
    .update({ read_at: new Date().toISOString(), read_by: user.id })
    .eq('id', messageId).is('read_at', null)
  if (error) redirect('/backoffice?result=message-error')
  revalidatePath('/backoffice')
  redirect('/backoffice?result=message-read')
}
