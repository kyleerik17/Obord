-- O'BORD: conservative age check (birth year only) and event closing rule.
-- Run in Supabase SQL Editor after obord_birth_year_requirement.sql.

begin;

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

commit;
