import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { assertPublicEnv, env } from '@/lib/env'
import type { Activity, UpcomingEventsResult } from './site'

function formatTime(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Abidjan',
  }).format(new Date(value))
}

export async function getUpcomingEvents(): Promise<UpcomingEventsResult> {
  try {
    assertPublicEnv()
    const supabase = createSupabaseClient(env.supabaseUrl!, env.supabasePublishableKey!, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
    const { data, error } = await supabase
      .from('events')
      .select('id,title,event_type,starts_at,ends_at,description,venue_name,venue_area,food_and_drinks,participation_details,capacity,status,event_activities(id,title,description,starts_at,sort_order)')
      .eq('status', 'published')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })

    if (error) {
      console.error('[agenda] Supabase query failed', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return { events: [], error: true }
    }

    if (!data) {
      console.error('[agenda] Supabase returned no event data')
      return { events: [], error: true }
    }

    console.info('[agenda] Upcoming events loaded', { count: data.length })

    const [availabilityResult, imagesResult] = data.length ? await Promise.all([
      supabase.rpc('get_public_event_availability', { p_event_ids: data.map((row) => row.id) }),
      supabase.from('events').select('id,image_paths').in('id', data.map((row) => row.id)),
    ]) : [
      { data: [], error: null },
      { data: [], error: null },
    ]

    if (availabilityResult.error) {
      console.warn('[agenda] Public capacity summary is not configured yet', { code: availabilityResult.error.code })
    }
    if (imagesResult.error) {
      console.warn('[agenda] Event gallery is not configured yet', { code: imagesResult.error.code })
    }

    const availabilityRows = (availabilityResult.data ?? []) as Array<{
      event_id: string
      reserved_count: number
      remaining_count: number | null
    }>
    const imageRows = (imagesResult.data ?? []) as Array<{ id: string; image_paths: string[] | null }>
    const availabilityByEvent = new Map(availabilityRows.map((item) => [item.event_id, item]))
    const imagePathsByEvent = new Map(imageRows.map((item) => [item.id, item.image_paths ?? []]))

    return { events: data.map((row) => {
      const activities = [...(row.event_activities ?? [])]
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((activity): Activity => ({
          id: activity.id,
          title: activity.title,
          time: formatTime(activity.starts_at),
          description: activity.description,
        }))

      return {
        id: row.id,
        title: row.title,
        date: row.starts_at.slice(0, 10),
        time: formatTime(row.starts_at),
        endsAt: row.ends_at,
        description: row.description,
        venueName: row.venue_name ?? 'Lieu précis communiqué après confirmation',
        venueArea: row.venue_area,
        capacity: row.capacity,
        reservedCount: availabilityByEvent.get(row.id)?.reserved_count ?? null,
        remainingSeats: availabilityByEvent.get(row.id)?.remaining_count ?? null,
        imageUrls: (imagePathsByEvent.get(row.id) ?? []).map((path: string) =>
          supabase.storage.from('obord-event-photos').getPublicUrl(path).data.publicUrl,
        ),
        foodAndDrinks: /bouteille|vodka|liqueur|alcool/i.test(row.food_and_drinks ?? '') ? '' : row.food_and_drinks ?? '',
        participationDetails: row.title.toLocaleLowerCase('fr').startsWith('plan chill')
          ? '3 000 FCFA par personne'
          : /bouteille|vodka|liqueur|alcool/i.test(row.participation_details ?? '') ? '' : row.participation_details ?? '',
        eventType: row.event_type,
        status: 'upcoming',
        activities,
      }
    }), error: false }
  } catch (cause) {
    console.error('[agenda] Unable to load events', {
      name: cause instanceof Error ? cause.name : 'UnknownError',
      message: cause instanceof Error ? cause.message : String(cause),
    })
    return { events: [], error: true }
  }
}
