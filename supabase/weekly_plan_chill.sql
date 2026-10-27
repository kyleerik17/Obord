-- O'BORD - Un seul Plan chill chaque samedi à 14 h (heure de Grand-Bassam)
-- À exécuter une seule fois dans Supabase > SQL Editor.
-- Le script publie le prochain rendez-vous puis programme la création du
-- rendez-vous du samedi suivant, et ainsi de suite chaque semaine.
-- Il met aussi à jour le lieu des plans chill déjà publiés.
-- Supabase Cron / pg_cron doit être activé dans Integrations > Cron.

begin;

create extension if not exists pg_cron;

update public.events
set venue_area = 'Quartier France, Grand-Bassam',
    participation_details = case
      when participation_details ~* '(bouteille|vodka|liqueur|alcool)' then null
      else participation_details
    end,
    food_and_drinks = case
      when food_and_drinks ~* '(bouteille|vodka|liqueur|alcool)' then null
      else food_and_drinks
    end,
    updated_at = now()
where title ilike 'Plan chill%'
  and starts_at >= now()
  and status = 'published';

-- No bottle or alcohol is expected at an O’BORD meeting.
update public.events
set participation_details = case
      when participation_details ~* '(bouteille|vodka|liqueur|alcool)' then null
      else participation_details
    end,
    food_and_drinks = case
      when food_and_drinks ~* '(bouteille|vodka|liqueur|alcool)' then null
      else food_and_drinks
    end,
    updated_at = now()
where title ilike 'Plan chill%'
  and (
    participation_details ~* '(bouteille|vodka|liqueur|alcool)'
    or food_and_drinks ~* '(bouteille|vodka|liqueur|alcool)'
  );

create or replace function public.obord_create_next_plan_chill()
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  abidjan_now timestamp without time zone := now() at time zone 'Africa/Abidjan';
  plan_date date;
  plan_start timestamptz;
begin
  -- A lock prevents duplicate rows if the SQL is run as the scheduled job fires.
  perform pg_advisory_xact_lock(hashtextextended('obord-weekly-plan-chill', 0));

  plan_date := abidjan_now::date
    + ((6 - extract(dow from abidjan_now)::integer + 7) % 7);
  plan_start := (plan_date + time '14:00') at time zone 'Africa/Abidjan';

  -- If it is already past 14 h on Saturday, target the following Saturday.
  if plan_start <= now() then
    plan_date := plan_date + 7;
    plan_start := (plan_date + time '14:00') at time zone 'Africa/Abidjan';
  end if;

  -- Keep an existing Plan chill (including a manually seeded one) and correct its venue.
  update public.events
  set venue_area = 'Quartier France, Grand-Bassam',
      participation_details = case
        when participation_details ~* '(bouteille|vodka|liqueur|alcool)' then null
        else participation_details
      end,
      food_and_drinks = case
        when food_and_drinks ~* '(bouteille|vodka|liqueur|alcool)' then null
        else food_and_drinks
      end,
      updated_at = now()
  where title ilike 'Plan chill%'
    and starts_at = plan_start;

  if found then
    return;
  end if;

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
    status
  ) values (
    md5(to_char(plan_date, 'YYYY-MM-DD') || '-obord-plan-chill')::uuid,
    'Plan chill O’BORD',
    'sortie',
    plan_start,
    'Un après-midi chill pour se retrouver. Le programme détaillé sera précisé par l’équipe O’BORD.',
    'Quartier France, Grand-Bassam',
    null,
    'Le point de rencontre précis sera communiqué après confirmation de la réservation.',
    null,
    'published'
  )
  on conflict (id) do nothing;
end;
$$;

-- The function is invoked only by this database job, never through the public API.
revoke all on function public.obord_create_next_plan_chill() from public, anon, authenticated;
grant execute on function public.obord_create_next_plan_chill() to postgres;

-- Publish the next Saturday now; then check/create the next one every Saturday at 00:05 GMT.
select public.obord_create_next_plan_chill();
select cron.schedule(
  'obord-weekly-plan-chill',
  '5 0 * * 6',
  'select public.obord_create_next_plan_chill();'
);

commit;
