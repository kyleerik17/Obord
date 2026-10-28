const TIKKO_REGISTER_URL = 'https://tikko.ci/register'

export default function EventReservation({ eventId }: { eventId: string }) {
  return (
    <section className="registration-section registration-redirect" id={`reservation-${eventId}`} aria-labelledby={`reservation-title-${eventId}`}>
      <div className="registration-intro">
        <p className="eyebrow eyebrow-dark">TA PLACE DANS LA MAISON</p>
        <h2 id={`reservation-title-${eventId}`}>Prêt·e à nous rejoindre ?</h2>
        <p>Les inscriptions se font actuellement sur Tikko. Tu peux y retrouver le formulaire et envoyer ta demande en quelques instants.</p>
      </div>
      <div className="registration-redirect-card">
        <div className="registration-redirect-copy">
          <div>
            <strong>On se retrouve bientôt ?</strong>
            <p>Continue vers Tikko pour t’inscrire à cette rencontre.</p>
          </div>
        </div>
        <a href={TIKKO_REGISTER_URL} className="button-primary registration-submit">Continuer sur Tikko <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  )
}
