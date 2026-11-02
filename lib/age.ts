/** Keeps client and organizer forms aligned with the Supabase age rule. */
export function maximumBirthYearForEvent(eventStartsAt: string | Date) {
  const date = eventStartsAt instanceof Date ? eventStartsAt : new Date(eventStartsAt)
  if (!Number.isFinite(date.getTime())) return new Date().getUTCFullYear() - 21
  return date.getUTCFullYear() - 21 - (date.getUTCMonth() < 6 ? 1 : 0)
}
