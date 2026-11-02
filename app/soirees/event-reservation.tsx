import EventWaitlist from './EventWaitlist'

const TIKKO_REGISTER_URL = 'https://tikko.ci/register'

export default function EventReservation({ eventId, title, startsAt, registrationUrl, isFull = false }: { eventId: string; title: string; startsAt: string; registrationUrl: string | null; isFull?: boolean }) {
  const tikkoUrl = registrationUrl || TIKKO_REGISTER_URL
  return (
    <section className="registration-section registration-redirect" id={`reservation-${eventId}`} aria-labelledby={`reservation-title-${eventId}`}>
      <div className="registration-intro">
        <p className="eyebrow eyebrow-dark">{isFull ? 'LA SUITE DU PLAN' : 'ON GARDE TA PLACE ?'}</p>
        <h2 id={`reservation-title-${eventId}`}>{isFull ? 'La rencontre affiche complet.' : 'Prêt·e à nous rejoindre ?'}</h2>
        <p>{isFull ? 'Les places affichées sont prises. Tu peux laisser tes coordonnées à l’équipe et être recontacté·e si une place se libère.' : 'Tu regardes les détails de la rencontre choisie. L’inscription finale se poursuit sur Tikko.'}</p>
      </div>
      {!isFull && <div className="registration-redirect-card">
        <div className="registration-redirect-copy">
          <div>
            <span className="registration-redirect-kicker">RENCONTRE CHOISIE</span>
            <strong>{title}</strong>
            <p>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Abidjan' }).format(new Date(startsAt))}. {registrationUrl ? 'Le lien ouvre la billetterie de cette rencontre sur Tikko.' : 'Sur Tikko, retrouve cette rencontre pour finaliser ton inscription.'}</p>
          </div>
        </div>
        <a href={tikkoUrl} className="button-primary registration-submit" target="_blank" rel="noreferrer">Continuer vers Tikko <span aria-hidden="true">↗</span></a>
        <a className="calendar-download-link" href={`/api/events/${encodeURIComponent(eventId)}/calendar`}>Ajouter cette rencontre à mon calendrier</a>
      </div>}
      {isFull && <EventWaitlist eventId={eventId} eventTitle={title} startsAt={startsAt} />}
    </section>
  )
}
