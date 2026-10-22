export type Organizer = {
  name: string
  role: string
  initials: string
  photo?: string
}

export type Activity = {
  id: string | number
  title: string
  time: string
  description: string
}

export type Event = {
  id: string
  title: string
  date: string
  time: string
  endsAt: string | null
  description: string
  venueName: string
  venueArea: string
  capacity: number | null
  foodAndDrinks: string
  participationDetails: string
  eventType: 'sortie' | 'atelier'
  status: 'upcoming' | 'past'
  activities: Activity[]
}

export type UpcomingEventsResult = {
  events: Event[]
  error: boolean
}

export const organizers: Organizer[] = [
  {
    name: 'Malick Mockey',
    role: 'Organisateur',
    initials: 'MM',
  },
  {
    name: 'Ange Erik',
    role: 'Organisateur',
    initials: 'AE',
    photo: '/ange-erik.jpeg',
  },
  {
    name: 'Aurore Niava',
    role: 'Organisatrice',
    initials: 'A',
  },
]

// No upcoming events are published until their dates and details are confirmed.
export const events: Event[] = []

