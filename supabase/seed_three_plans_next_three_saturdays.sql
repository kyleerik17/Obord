-- O'BORD - 3 plans sur chacun des 3 prochains samedis
-- À exécuter dans Supabase > SQL Editor.
-- Le script met à jour le lieu des plans chill existants et crée 9 rendez-vous
-- publiés, à 14 h (heure de Grand-Bassam), sur les trois prochains samedis.
-- Réexécutable : les mêmes rendez-vous ne sont pas dupliqués.

begin;

-- Corrige aussi le lieu de la sortie Plan chill déjà créée.
update public.events
set venue_area = 'Quartier France, Grand-Bassam',
    updated_at = now()
where title ilike 'Plan chill%'
  and starts_at >= now()
  and status = 'published';

with local_today as (
  select (now() at time zone 'Africa/Abidjan')::date as today
), next_saturdays as (
  select today + ((6 - extract(dow from today)::integer + 7) % 7) + (week_offset * 7) as saturday
  from local_today
  cross join generate_series(0, 2) as offsets(week_offset)
), plans as (
  select *
  from (values
    ('table', 'La Table', 'Un après-midi chill autour des jeux et d’un moment partagé.'),
    ('salon', 'Le Salon', 'Un rendez-vous détendu pour jouer, discuter et faire connaissance.'),
    ('terrain', 'Le Terrain', 'Un temps de rencontre et d’activités en groupe, dans l’esprit O’BORD.')
  ) as plan(code, label, description)
), planned_events as (
  select
    saturday,
    plan.code,
    plan.label,
    plan.description,
    md5(to_char(saturday, 'YYYY-MM-DD') || '-obord-' || plan.code)::uuid as event_id
  from next_saturdays
  cross join plans plan
)
insert into public.events (
  id,
  title,
  event_type,
  starts_at,
  description,
  venue_area,
  venue_name,
  venue_details,
  participation_details,
  capacity,
  status
)
select
  event_id,
  'Plan chill O’BORD — ' || label,
  'sortie',
  (saturday + time '14:00') at time zone 'Africa/Abidjan',
  description,
  'Quartier France, Grand-Bassam',
  null,
  'Le point de rencontre précis sera communiqué après confirmation de la réservation.',
  'Une bouteille de liqueur ou de vodka par personne. Réservé aux personnes de 21 ans et plus ; la consommation d’alcool reste facultative.',
  null,
  'published'
from planned_events
on conflict (id) do nothing;

commit;
