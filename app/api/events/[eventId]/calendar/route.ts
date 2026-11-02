import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { assertPublicEnv, env } from '@/lib/env'

function escapeCalendarText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function toCalendarDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function foldCalendarLine(line: string) {
  const chunks: string[] = []
  let current = ''
  let bytes = 0
  for (const character of line) {
    const size = new TextEncoder().encode(character).length
    if (bytes + size > 73) {
      chunks.push(current)
      current = ` ${character}`
      bytes = size + 1
    } else {
      current += character
      bytes += size
    }
  }
  chunks.push(current)
  return chunks
}

export async function GET(_request: Request, context: RouteContext<'/api/events/[eventId]/calendar'>) {
  const { eventId } = await context.params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
    return new Response('Rencontre invalide.', { status: 400 })
  }

  try {
    assertPublicEnv()
    const supabase = createSupabaseClient(env.supabaseUrl!, env.supabasePublishableKey!, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    })
    const { data: event, error } = await supabase.from('events')
      .select('id,title,description,starts_at,ends_at,venue_area,status')
      .eq('id', eventId).eq('status', 'published').maybeSingle()
    if (error || !event || new Date(event.starts_at) <= new Date()) {
      return new Response('Rencontre indisponible.', { status: 404 })
    }

    const alarm = event.starts_at ? [
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeCalendarText(`Rappel O’BORD : ${event.title}`)}`,
      'END:VALARM',
    ].join('\r\n') : ''
    const eventLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OBORD//Calendrier des rencontres//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@obord`,
      `DTSTAMP:${toCalendarDate(new Date().toISOString())}`,
      `DTSTART:${toCalendarDate(event.starts_at)}`,
      ...(event.ends_at ? [`DTEND:${toCalendarDate(event.ends_at)}`] : []),
      `SUMMARY:${escapeCalendarText(event.title)}`,
      `DESCRIPTION:${escapeCalendarText(event.description)}`,
      `LOCATION:${escapeCalendarText(event.venue_area)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      ...(alarm ? [alarm] : []),
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ]

    const filename = `obord-${event.id}.ics`
    return new Response(eventLines.flatMap(foldCalendarLine).join('\r\n'), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('Le calendrier est momentanément indisponible.', { status: 503 })
  }
}
