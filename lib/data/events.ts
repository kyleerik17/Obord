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
      })
      return { events: [], error: true }
    }

    if (!data) {
      console.error('[agenda] Supabase returned no event data')
      return { events: [], error: true }
    }

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
        foodAndDrinks: row.food_and_drinks ?? '',
        participationDetails: row.participation_details ?? '',
        eventType: row.event_type,
        status: 'upcoming',
        activities,
      }
    }), error: false }
  } catch (cause) {
    console.error('[agenda] Unable to load events', cause instanceof Error ? cause.message : String(cause))
    return { events: [], error: true }
  }
}
