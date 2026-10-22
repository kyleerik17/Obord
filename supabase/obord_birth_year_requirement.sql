-- O'BORD - Année de naissance et contrôle des 21 ans le jour de la rencontre.
-- À exécuter une fois dans Supabase SQL Editor sur une base déjà installée.

begin;

alter table public.event_registrations
  add column if not exists attendee_birth_years integer[];

-- Certaines installations plus anciennes possèdent attendee_ages, d'autres
-- ne l'ont jamais créée. Le contrôle de présence de colonne évite de référencer
-- un champ absent ; les années converties restent des estimations.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'event_registrations'
      and column_name = 'attendee_ages'
  ) then
    execute $migration$
      update public.event_registrations r
      set attendee_birth_years = array(
        select extract(year from r.created_at)::integer - age
        from unnest(r.attendee_ages) as age
      )
      where r.attendee_birth_years is null
        and r.attendee_ages is not null
    $migration$;

    alter table public.event_registrations drop column attendee_ages;
  end if;
end
$$;

create or replace function public.registration_birth_years_meet_minimum(
  p_birth_years integer[],
  p_event_date timestamptz
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_birth_years is not null
    and p_event_date is not null
    and cardinality(p_birth_years) > 0
    and array_position(p_birth_years, null) is null
    and 1900 <= all(p_birth_years)
    and coalesce(bool_and(
      birth_year <= extract(year from (p_event_date at time zone 'Africa/Abidjan'))::integer - 21
        - case when extract(month from (p_event_date at time zone 'Africa/Abidjan'))::integer < 7 then 1 else 0 end
    ), false)
  from unnest(p_birth_years) as birth_year
$$;

alter table public.event_registrations
  drop constraint if exists event_registrations_attendee_birth_years_check;

alter table public.event_registrations
  add constraint event_registrations_attendee_birth_years_check
  check (
    attendee_birth_years is null
    or (
      cardinality(attendee_birth_years) = group_size
      and array_position(attendee_birth_years, null) is null
      and 1900 <= all(attendee_birth_years)
      and registration_birth_years_meet_minimum(attendee_birth_years, created_at)
    )
  );

drop policy if exists "Participants can request a reservation" on public.event_registrations;
create policy "Participants can request a reservation"
on public.event_registrations for insert to authenticated
with check (
  user_id = (select auth.uid())
  and lower(contact_email) = lower((select auth.jwt() ->> 'email'))
  and reservation_status = 'pending'
  and attendee_birth_years is not null
  and cardinality(attendee_birth_years) = group_size
  and array_position(attendee_birth_years, null) is null
  and 1900 <= all(attendee_birth_years)
  and exists (
    select 1 from public.events e
    where e.id = event_id
      and e.status = 'published'
      and e.starts_at > now()
      and (e.ends_at is null or e.ends_at > now())
      and public.registration_birth_years_meet_minimum(attendee_birth_years, e.starts_at)
  )
);

grant insert (event_id, user_id, attendance_type, contact_name, contact_email, contact_phone, group_size, attendee_birth_years, message)
  on public.event_registrations to authenticated;
revoke update on public.event_registrations from authenticated;
grant update (reservation_status, attendee_birth_years) on public.event_registrations to authenticated;

revoke all on function public.registration_birth_years_meet_minimum(integer[], timestamptz) from public, anon;
grant execute on function public.registration_birth_years_meet_minimum(integer[], timestamptz) to authenticated;

create or replace function public.guard_registration_birth_year_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role')
     and (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'organizer' then
    raise exception 'organizer_required';
  end if;
  return new;
end;
$$;

drop trigger if exists event_registrations_guard_birth_year_update on public.event_registrations;
create trigger event_registrations_guard_birth_year_update
before update of attendee_birth_years on public.event_registrations
for each row execute function public.guard_registration_birth_year_update();
revoke all on function public.guard_registration_birth_year_update() from public, anon, authenticated;

commit;
