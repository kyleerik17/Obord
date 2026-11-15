import EventWaitlist from './EventWaitlist'
import { translate, type Locale } from '@/lib/i18n'

const TIKKO_REGISTER_URL = 'https://tikko.ci/register'

export default function EventReservation({ eventId, title, startsAt, registrationUrl, locale, isFull = false }: { eventId: string; title: string; startsAt: string; registrationUrl: string | null; locale: Locale; isFull?: boolean }) {
  const tikkoUrl = registrationUrl || TIKKO_REGISTER_URL
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  return (
    <section className="registration-section registration-redirect" id={`reservation-${eventId}`} aria-labelledby={`reservation-title-${eventId}`}>
      <div className="registration-intro">
        <p className="eyebrow eyebrow-dark">{isFull ? t('reservation.fullEyebrow') : t('reservation.openEyebrow')}</p>
        <h2 id={`reservation-title-${eventId}`}>{isFull ? t('reservation.fullTitle') : t('reservation.openTitle')}</h2>
        <p>{isFull ? t('reservation.fullText') : t('reservation.openText')}</p>
      </div>
      {!isFull && <div className="registration-redirect-card">
        <div className="registration-redirect-copy">
          <div>
            <span className="registration-redirect-kicker">{t('reservation.selected')}</span>
            <strong>{title}</strong>
            <p>{new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Abidjan' }).format(new Date(startsAt))}. {registrationUrl ? t('reservation.linkForEvent') : t('reservation.findOnTikko')}</p>
          </div>
        </div>
        <a href={tikkoUrl} className="button-primary registration-submit" target="_blank" rel="noreferrer">{t('reservation.continue')}</a>
        <a className="calendar-download-link" href={`/api/events/${encodeURIComponent(eventId)}/calendar`}>{t('reservation.calendar')}</a>
      </div>}
      {isFull && <EventWaitlist eventId={eventId} eventTitle={title} startsAt={startsAt} />}
    </section>
  )
}
