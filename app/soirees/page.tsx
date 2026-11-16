import { getUpcomingEvents } from '@/lib/data/events'
import { pageMetadata } from '@/lib/metadata'
import { getLocale } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'
import MeetupExplorer from './MeetupExplorer'

export const metadata = pageMetadata('Soirées et rencontres', 'Découvre les prochaines rencontres et réserve ta place avec O’BORD.')

export default async function Soirees() {
  const [locale, agenda] = await Promise.all([getLocale(), getUpcomingEvents()])
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const events = agenda.events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt,
    time: event.time,
    venueName: event.venueName,
    venueArea: event.venueArea,
    capacity: event.capacity,
    remainingSeats: event.remainingSeats,
    imageUrls: event.imageUrls,
    eventType: event.eventType,
    registrationUrl: event.registrationUrl,
    foodAndDrinks: event.foodAndDrinks,
    participationDetails: event.participationDetails,
    activities: event.activities,
  }))

  return <MeetupExplorer events={events} error={agenda.error} locale={locale} copy={{
    eyebrow: t('soirees.choose'), title: t('soirees.hero'), intro: t('soirees.intro'),
    count: t('explorer.count'), open: t('explorer.open'), join: t('explorer.join'), close: t('explorer.close'),
    contact: t('home.contactCta'), memories: t('home.memories'), noCapacity: t('explorer.noCapacity'), remaining: t('soirees.remaining'), full: t('soirees.full'),
    venue: t('soirees.venue'), contribution: t('soirees.participation'), schedule: t('soirees.schedule'), typeOuting: t('soirees.outing'), typeWorkshop: t('soirees.workshop'),
    errorTitle: t('soirees.errorTitle'), errorText: t('soirees.errorText'), emptyAgendaTitle: t('soirees.emptyTitle'),
  }} />
}
