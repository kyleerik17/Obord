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
    filters: t('explorer.filters'), all: t('explorer.all'), calm: t('explorer.calm'), games: t('explorer.games'), online: t('explorer.online'), spontaneous: t('explorer.spontaneous'),
    count: t('explorer.count'), open: t('explorer.open'), join: t('explorer.join'), create: t('explorer.create'), createTitle: t('explorer.createTitle'), createIntro: t('explorer.createIntro'),
    step: t('explorer.step'), next: t('explorer.next'), back: t('explorer.back'), publish: t('explorer.publish'), close: t('explorer.close'),
    name: t('explorer.name'), activity: t('explorer.activity'), date: t('explorer.date'), time: t('explorer.time'), place: t('explorer.place'), description: t('explorer.description'), preview: t('explorer.preview'),
    emptyTitle: t('explorer.emptyTitle'), emptyText: t('explorer.emptyText'), reset: t('explorer.reset'), noPhoto: t('explorer.noPhoto'), noCapacity: t('explorer.noCapacity'), remaining: t('soirees.remaining'), full: t('soirees.full'),
    nameLabel: t('explorer.name'),
    detail: t('soirees.selectedHelp'), venue: t('soirees.venue'), contribution: t('soirees.participation'), schedule: t('soirees.schedule'), reserve: t('soirees.reserve'), typeOuting: t('soirees.outing'), typeWorkshop: t('soirees.workshop'),
    errorTitle: t('soirees.errorTitle'), errorText: t('soirees.errorText'), emptyAgendaTitle: t('soirees.emptyTitle'), emptyAgendaText: t('soirees.emptyText'),
  }} />
}
